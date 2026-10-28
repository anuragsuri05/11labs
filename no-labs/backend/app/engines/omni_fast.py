"""Faster OmniVoice decoding loop.

Upstream `OmniVoice._generate_iterative` runs the conditional and unconditional (CFG) branches
as one batch of size 2B padded to the conditional length. The unconditional branch only covers
the target tokens, so on CPU roughly a third of every step is spent on padding. It also runs the
unconditional branch even when guidance is off.

This version runs the two branches as separate forward passes at their true lengths, and skips
the unconditional pass when guidance_scale == 0. Padded positions in the upstream batch only
attend to themselves, so logits for real tokens are unchanged and the algorithm is the same.
"""

import math

import torch
from omnivoice.models import omnivoice as ov


def _bidirectional_mask(lens: list[int], max_len: int, device) -> torch.Tensor:
    mask = torch.zeros((len(lens), 1, max_len, max_len), dtype=torch.bool, device=device)
    for i, n in enumerate(lens):
        mask[i, :, :n, :n] = True
        if max_len > n:  # padded rows attend to themselves so softmax stays finite
            pad = torch.arange(n, max_len, device=device)
            mask[i, :, pad, pad] = True
    return mask


@torch.inference_mode()
def fast_generate_iterative(self, task, gen_config):
    B = task.batch_size
    C = self.config.num_audio_codebook
    mask_id = self.config.audio_mask_id
    use_cfg = gen_config.guidance_scale != 0

    inputs = [
        self._prepare_inference_inputs(task.texts[i], task.target_lens[i], task.ref_texts[i],
                                       task.ref_audio_tokens[i], task.langs[i], task.instructs[i],
                                       gen_config.denoise)
        for i in range(B)
    ]
    c_lens = [inp["input_ids"].size(2) for inp in inputs]
    t_lens = list(task.target_lens)
    max_c, max_t = max(c_lens), max(t_lens)

    cond_ids = torch.full((B, C, max_c), mask_id, dtype=torch.long, device=self.device)
    cond_audio = torch.zeros((B, max_c), dtype=torch.bool, device=self.device)
    for i, inp in enumerate(inputs):
        cond_ids[i, :, :c_lens[i]] = inp["input_ids"]
        cond_audio[i, :c_lens[i]] = inp["audio_mask"]
    cond_mask = _bidirectional_mask(c_lens, max_c, self.device)

    if use_cfg:
        unc_ids = torch.full((B, C, max_t), mask_id, dtype=torch.long, device=self.device)
        unc_audio = torch.zeros((B, max_t), dtype=torch.bool, device=self.device)
        for i, inp in enumerate(inputs):
            unc_ids[i, :, :t_lens[i]] = inp["input_ids"][..., -t_lens[i]:]
            unc_audio[i, :t_lens[i]] = inp["audio_mask"][..., -t_lens[i]:]
        unc_mask = _bidirectional_mask(t_lens, max_t, self.device)

    tokens = torch.full((B, C, max_t), mask_id, dtype=torch.long, device=self.device)
    timesteps = ov._get_time_steps(t_start=0.0, t_end=1.0, num_step=gen_config.num_step,
                                   t_shift=gen_config.t_shift).tolist()
    schedules = []
    for t_len in t_lens:
        total = t_len * C
        rem, sched = total, []
        for step in range(gen_config.num_step):
            num = rem if step == gen_config.num_step - 1 else min(
                math.ceil(total * (timesteps[step + 1] - timesteps[step])), rem)
            sched.append(int(num))
            rem -= int(num)
        schedules.append(sched)
    layer_ids = torch.arange(C, device=self.device).view(1, -1, 1)

    for step in range(gen_config.num_step):
        c_all = self(input_ids=cond_ids, audio_mask=cond_audio, attention_mask=cond_mask).logits.to(torch.float32)
        u_all = (self(input_ids=unc_ids, audio_mask=unc_audio, attention_mask=unc_mask).logits.to(torch.float32)
                 if use_cfg else None)
        for i in range(B):
            k = schedules[i][step]
            if k <= 0:
                continue
            c_len, t_len = c_lens[i], t_lens[i]
            c_logits = c_all[i:i + 1, :, c_len - t_len:c_len, :]
            u_logits = u_all[i:i + 1, :, :t_len, :] if use_cfg else c_logits
            pred_tokens, scores = self._predict_tokens_with_scoring(c_logits, u_logits, gen_config)
            scores = scores - (layer_ids * gen_config.layer_penalty_factor)
            if gen_config.position_temperature > 0.0:
                scores = ov._gumbel_sample(scores, gen_config.position_temperature)
            sample = tokens[i:i + 1, :, :t_len]
            scores.masked_fill_(sample != mask_id, -float("inf"))
            _, topk = torch.topk(scores.flatten(), k)
            flat = sample.flatten()
            flat[topk] = pred_tokens.flatten()[topk]
            sample.copy_(flat.view_as(sample))
            tokens[i:i + 1, :, :t_len] = sample
            cond_ids[i:i + 1, :, c_len - t_len:c_len] = sample
            if use_cfg:
                unc_ids[i:i + 1, :, :t_len] = sample

    return [tokens[i, :, :t_lens[i]] for i in range(B)]


def install():
    ov.OmniVoice._generate_iterative = fast_generate_iterative
