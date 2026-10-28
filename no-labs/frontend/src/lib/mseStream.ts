/**
 * Play a live MP3 stream with low latency.
 *
 * Given a plain `<audio src>` pointing at a chunked MP3 response, Chrome buffers several seconds
 * before it starts playing. Feeding the bytes through Media Source Extensions lets playback start
 * as soon as the first frames arrive. The appended audio also stays in memory, so replaying and
 * seeking work once the stream is complete.
 *
 * Returns an object URL to use as the audio element's src. Browsers without MP3 support in MSE
 * get the original URL back, which still plays progressively, just with more buffering.
 */
export function streamingSrc(url: string): string {
  const MS = typeof window !== 'undefined' ? window.MediaSource : undefined;
  if (!MS || !MS.isTypeSupported('audio/mpeg')) return url;

  const ms = new MS();
  const objectUrl = URL.createObjectURL(ms);
  ms.addEventListener(
    'sourceopen',
    async () => {
      const sb = ms.addSourceBuffer('audio/mpeg');
      const queue: Uint8Array[] = [];
      let finished = false;
      const pump = () => {
        if (sb.updating || ms.readyState !== 'open') return;
        const next = queue.shift();
        if (next) sb.appendBuffer(next);
        else if (finished) ms.endOfStream();
      };
      sb.addEventListener('updateend', pump);
      try {
        const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok || !res.body) throw new Error(`stream failed (${res.status})`);
        const reader = res.body.getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value?.length) {
            queue.push(value);
            pump();
          }
        }
        finished = true;
        pump();
      } catch {
        // Surfaces as the audio element's 'error' event, which the player already handles.
        if (ms.readyState === 'open') ms.endOfStream('network');
      }
    },
    { once: true },
  );
  return objectUrl;
}
