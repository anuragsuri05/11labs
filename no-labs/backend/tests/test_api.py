import json

import pytest

from conftest import wav_bytes, webm_bytes


def err(resp):
    return resp.json()["detail"]["status"]


# ---------------------------------------------------------------- system
def test_health(client):
    body = client.get("/v1/health").json()
    assert body["status"] == "ok" and body["auth"] is False
    assert {"omnivoice", "kokoro", "pocket", "stt", "isolator", "sfx", "music"} <= set(body["engines"])
    assert body["queue"] == {"running": 0, "waiting": 0, "max_waiting": 8}


def test_models_schema(client):
    models = {m["model_id"]: m for m in client.get("/v1/models").json()}
    assert set(models) == {"omnivoice", "kokoro", "pocket"}
    assert models["omnivoice"]["can_clone"] and models["omnivoice"]["can_design"]
    assert not models["kokoro"]["can_clone"]
    assert models["kokoro"]["voice_count"] == 49 and models["pocket"]["voice_count"] == 27
    for m in models.values():
        for s in m["settings"]:
            assert s["min"] <= s["default"] <= s["max"] and s["label"]


def test_stt_models(client):
    ids = [m["model_id"] for m in client.get("/v1/speech-to-text/models").json()]
    assert ids == ["whisper-base", "whisper-small", "whisper-medium", "whisper-large-v3-turbo"]


def test_validation_errors_use_contract_shape(client):
    r = client.post("/v1/sound-generation", json={"text": "boom", "duration_seconds": 99})
    assert r.status_code == 400 and err(r) == "invalid_request"
    assert "duration_seconds" in r.json()["detail"]["message"]


# ---------------------------------------------------------------- voices
def test_voice_library_and_filters(client):
    voices = client.get("/v1/voices").json()["voices"]
    assert len(voices) >= 76
    assert all(v["preview_url"] == f"/v1/voices/{v['voice_id']}/preview" for v in voices)
    assert "engine_voice" not in voices[0]  # internal fields stay private
    kokoro = client.get("/v1/voices", params={"model_id": "kokoro"}).json()["voices"]
    assert kokoro and all(v["model_id"] == "kokoro" for v in kokoro)
    assert kokoro[0]["voice_id"] == "kokoro_af_heart"  # catalog order
    hindi = client.get("/v1/voices", params={"language": "hi"}).json()["voices"]
    assert {v["voice_id"] for v in hindi} >= {"kokoro_hf_alpha", "kokoro_hm_omega"}
    found = client.get("/v1/voices", params={"search": "scottish"}).json()["voices"]
    assert any(v["voice_id"] == "pocket_eponine" for v in found)


def test_preview_is_rendered_once_and_cached(client, calls):
    before = calls.count("synthesize")
    for _ in range(2):
        r = client.get("/v1/voices/kokoro_bf_emma/preview")
        assert r.status_code == 200 and r.headers["content-type"] == "audio/wav" and len(r.content) > 1000
    assert calls.count("synthesize") == before + 1


def test_premade_voices_are_read_only(client):
    assert err(client.delete("/v1/voices/kokoro_af_heart")) == "cannot_delete_premade"
    assert err(client.patch("/v1/voices/kokoro_af_heart", json={"name": "x"})) == "cannot_edit_premade"
    assert client.get("/v1/voices/nope").status_code == 404


def test_instant_clone_lifecycle(client, calls):
    r = client.post("/v1/voices/add", data={"name": "My Voice", "labels": json.dumps({"accent": "irish"})},
                    files={"files": ("rec.webm", webm_bytes(4), "audio/webm")})
    assert r.status_code == 200, r.text
    voice = r.json()["voice"]
    assert voice["category"] == "cloned" and voice["model_id"] == "omnivoice" and voice["accent"] == "irish"
    assert calls.log[-1][0] == "clone" and calls.log[-1][3] == "hello there world"  # auto transcript

    listed = client.get("/v1/voices").json()["voices"]
    assert listed[0]["voice_id"] == voice["voice_id"]  # your voices first
    assert client.get(voice["preview_url"]).status_code == 200  # reference clip

    patched = client.patch(f"/v1/voices/{voice['voice_id']}", json={"name": "Renamed"}).json()
    assert patched["name"] == "Renamed"
    assert client.delete(f"/v1/voices/{voice['voice_id']}").json() == {"status": "ok"}
    assert client.get(f"/v1/voices/{voice['voice_id']}").status_code == 404


def test_clone_rejections(client):
    short = client.post("/v1/voices/add", data={"name": "x"}, files={"files": ("a.wav", wav_bytes(1), "audio/wav")})
    assert err(short) == "audio_too_short"
    kokoro = client.post("/v1/voices/add", data={"name": "x", "model_id": "kokoro"},
                         files={"files": ("a.wav", wav_bytes(3), "audio/wav")})
    assert err(kokoro) == "clone_unsupported"
    garbage = client.post("/v1/voices/add", data={"name": "x"}, files={"files": ("a.wav", b"not audio", "audio/wav")})
    assert err(garbage) == "invalid_audio"
    assert err(client.post("/v1/voices/add", data={"name": " "},
                           files={"files": ("a.wav", wav_bytes(3), "audio/wav")})) == "invalid_name"


def test_voice_design_flow(client):
    previews = client.post("/v1/text-to-voice/create-previews",
                           json={"voice_description": "Female, British Accent"}).json()["previews"]
    assert len(previews) == 3
    assert client.get(previews[0]["audio_url"]).status_code == 200
    voice = client.post("/v1/text-to-voice/create-voice-from-preview",
                        json={"generated_voice_id": previews[1]["generated_voice_id"], "voice_name": "Designed"}).json()
    assert voice["category"] == "generated" and voice["labels"]["design"] == "female, british accent"
    bad = client.post("/v1/text-to-voice/create-voice-from-preview",
                      json={"generated_voice_id": "g_../../etc", "voice_name": "x"})
    assert err(bad) == "preview_not_found"


# ---------------------------------------------------------------- text to speech
def test_tts_uses_the_voice_model(client, calls):
    r = client.post("/v1/text-to-speech/pocket_alba", json={"text": "Hello world", "voice_settings": {"temperature": 0.5}})
    assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg"
    assert r.headers["x-model-id"] == "pocket" and float(r.headers["x-duration-seconds"]) > 0
    assert calls.log[-1][:3] == ("synthesize", "pocket", "pocket_alba")
    assert calls.log[-1][4] == {"temperature": 0.5}
    item = client.get("/v1/history", params={"kind": "tts", "limit": 1}).json()["history"][0]
    assert item["history_item_id"] == r.headers["history-item-id"] and item["model_id"] == "pocket"
    assert client.get(r.headers["x-audio-url"]).status_code == 200


def test_tts_wav_output(client):
    r = client.post("/v1/text-to-speech/kokoro_af_heart",
                    json={"text": "Hi", "model_id": "kokoro", "output_format": "wav_24000"})
    assert r.status_code == 200 and r.headers["content-type"] == "audio/wav"
    # streaming always sends MP3 (the format browsers can play progressively)
    r = client.post("/v1/text-to-speech/kokoro_af_heart/stream", json={"text": "Hi", "output_format": "wav_24000"})
    assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg"


def test_streaming_tts_records_exact_stream(client):
    text = "First sentence here. Second sentence follows. And a third one to finish."
    with client.stream("POST", "/v1/text-to-speech/kokoro_af_heart/stream", json={"text": text}) as r:
        assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg"
        item_id, url = r.headers["history-item-id"], r.headers["x-audio-url"]
        body = b"".join(r.iter_bytes())
    assert body[:3] == b"ID3" or body[0] == 0xFF  # MP3
    item = client.get(f"/v1/history/{item_id}").json()
    assert item["text"] == text and item["duration_secs"] > 1.0
    assert client.get(url).content == body  # the saved file is exactly what was streamed


def test_stream_errors_before_audio_are_http_errors(client):
    from app import store
    store.voices.sync([{"voice_id": "premade_unready", "name": "U", "category": "premade", "model_id": "omnivoice"}])
    r = client.post("/v1/text-to-speech/premade_unready/stream", json={"text": "hi"})
    assert r.status_code == 409 and err(r) == "voice_not_ready"
    store.voices.delete("premade_unready")


def test_stream_that_breaks_midway_is_reported(client, monkeypatch):
    from app.engines import tts
    from conftest import tone

    def broken(self, voice, text, settings, language=None):
        yield tone(0.5)
        raise RuntimeError("model crashed")

    monkeypatch.setattr(tts.KokoroEngine, "stream", broken)
    s = client.post("/v1/text-to-speech/kokoro_af_heart/stream-session", json={"text": "One. Two."}).json()
    try:
        client.get(s["stream_url"])
    except RuntimeError:
        pass  # TestClient re-raises the server error that cut the stream
    r = client.get(f"/v1/history/{s['history_item_id']}")
    assert r.status_code == 410 and err(r) == "generation_failed"
    assert client.get(s["audio_url"]).status_code == 404  # partial file removed


def test_stream_session_for_audio_elements(client):
    s = client.post("/v1/text-to-speech/pocket_alba/stream-session", json={"text": "Hello there. How are you?"}).json()
    assert s["stream_url"].startswith("/v1/streams/") and s["model_id"] == "pocket"
    assert client.get(f"/v1/history/{s['history_item_id']}").status_code == 404  # not generated yet
    r = client.get(s["stream_url"])
    assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg" and len(r.content) > 1000
    assert client.get(s["audio_url"]).content == r.content
    assert client.get(f"/v1/history/{s['history_item_id']}").json()["model_id"] == "pocket"
    assert err(client.get(s["stream_url"])) == "stream_not_found"  # single use


@pytest.mark.parametrize("payload,code", [
    ({"text": "   "}, "empty_text"),
    ({"text": "x" * 5001}, "text_too_long"),
    ({"text": "hi", "model_id": "pocket"}, "voice_model_mismatch"),
    ({"text": "hi", "model_id": "gpt"}, "invalid_request"),
])
def test_tts_rejections(client, payload, code):
    assert err(client.post("/v1/text-to-speech/kokoro_af_heart", json=payload)) == code


# ---------------------------------------------------------------- audio tools
def test_speech_to_text(client):
    r = client.post("/v1/speech-to-text", data={"model_id": "whisper-base"},
                    files={"file": ("a.wav", wav_bytes(2), "audio/wav")})
    body = r.json()
    assert r.status_code == 200 and body["text"] == "hello there world" and body["segments"]
    item = client.get("/v1/history", params={"kind": "stt", "limit": 1}).json()["history"][0]
    assert item["settings"]["segments"] == body["segments"]
    bad = client.post("/v1/speech-to-text", data={"model_id": "whisper-huge"},
                      files={"file": ("a.wav", wav_bytes(2), "audio/wav")})
    assert err(bad) == "invalid_request"


def test_voice_changer(client):
    r = client.post("/v1/speech-to-speech/kokoro_am_michael", data={"voice_settings": json.dumps({"speed": 1.1})},
                    files={"audio": ("a.webm", webm_bytes(3), "audio/webm")})
    assert r.status_code == 200 and float(r.headers["x-duration-seconds"]) >= 2.0
    assert err(client.post("/v1/speech-to-speech/kokoro_am_michael", data={"voice_settings": "[1]"},
                           files={"audio": ("a.wav", wav_bytes(2), "audio/wav")})) == "invalid_request"


def test_isolation_sfx_music(client):
    r = client.post("/v1/audio-isolation", files={"audio": ("mix.wav", wav_bytes(2), "audio/wav")})
    assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg"
    r = client.post("/v1/sound-generation", json={"text": "door knock", "duration_seconds": 2})
    assert r.status_code == 200 and abs(float(r.headers["x-duration-seconds"]) - 2.0) < 0.1
    r = client.post("/v1/music", json={"prompt": "lofi", "music_length_ms": 5000})
    assert r.status_code == 200 and abs(float(r.headers["x-duration-seconds"]) - 5.0) < 0.1
    assert err(client.post("/v1/music", json={"prompt": " "})) == "empty_text"


def test_upload_size_limit(client, monkeypatch):
    from app import media_io
    monkeypatch.setattr(media_io, "MAX_UPLOAD_MB", 0)
    r = client.post("/v1/audio-isolation", files={"audio": ("big.wav", wav_bytes(2), "audio/wav")})
    assert r.status_code == 413 and err(r) == "file_too_large"


def test_history_delete_removes_files(client):
    r = client.post("/v1/sound-generation", json={"text": "beep", "duration_seconds": 1})
    item_id, url = r.headers["history-item-id"], r.headers["x-audio-url"]
    assert client.delete(f"/v1/history/{item_id}").json() == {"status": "ok"}
    assert client.get(url).status_code == 404
    assert client.delete(f"/v1/history/{item_id}").status_code == 404


# ---------------------------------------------------------------- web + auth
def test_unknown_api_path_is_json_404(client):
    assert client.get("/v1/does-not-exist").status_code == 404


def test_auth(client, monkeypatch):
    from app import security
    from app.routes import system
    monkeypatch.setattr(security, "API_KEY", "s3cret")
    monkeypatch.setattr(system, "API_KEY", "s3cret")

    assert client.get("/v1/health").json()["auth"] is True  # health stays open
    r = client.get("/v1/voices")
    assert r.status_code == 401 and err(r) == "unauthorized"
    assert client.get("/v1/voices", headers={"xi-api-key": "s3cret"}).status_code == 200
    assert client.get("/v1/voices", headers={"authorization": "Bearer s3cret"}).status_code == 200
    assert client.get("/v1/voices", headers={"xi-api-key": "wrong"}).status_code == 401

    assert client.post("/v1/auth/login", json={"key": "nope"}).status_code == 401
    assert client.post("/v1/auth/login", json={"key": "s3cret"}).status_code == 200
    assert client.get("/v1/voices").status_code == 200  # cookie session
    client.post("/v1/auth/logout")
    client.cookies.clear()
    assert client.get("/v1/voices").status_code == 401
