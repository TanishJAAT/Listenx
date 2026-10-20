/**
 * LRC Synchronized Lyrics Parser & Utility.
 * Parses [mm:ss.xx] timestamps into milliseconds for dynamic real-time highlighting and seeking.
 */

export class LrcParser {
  /**
   * Parses an LRC string into an array of { timestampMs, text } objects sorted by timestamp.
   */
  static parseLrc(lrcText) {
    if (!lrcText || typeof lrcText !== 'string') return [];

    const lines = lrcText.split(/\r?\n/);
    const result = [];
    const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Extract all timestamps in the line (handles multi-timestamp lines like [00:12.50][00:25.10]...)
      const matches = [...line.matchAll(timeRegex)];
      if (matches.length > 0) {
        // Strip timestamps to get clean lyric text
        const text = line.replace(timeRegex, '').trim();
        for (let m of matches) {
          const minutes = parseInt(m[1], 10);
          const seconds = parseInt(m[2], 10);
          let ms = 0;
          if (m[3]) {
            ms = m[3].length === 2 ? parseInt(m[3], 10) * 10 : parseInt(m[3].padEnd(3, '0').slice(0, 3), 10);
          }
          const totalMs = (minutes * 60 + seconds) * 1000 + ms;
          result.push({ timestampMs: totalMs, text });
        }
      }
    }

    result.sort((a, b) => a.timestampMs - b.timestampMs);
    return result;
  }

  /**
   * Parses plain unsynced text into line objects.
   */
  static parsePlainText(plainText) {
    if (!plainText || typeof plainText !== 'string') return [];
    return plainText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(text => ({ timestampMs: -1, text }));
  }

  /**
   * Finds the active line index given current playback time in milliseconds.
   */
  static getActiveLineIndex(lines, currentMs) {
    if (!lines || lines.length === 0) return -1;
    let low = 0;
    let high = lines.length - 1;
    let activeIdx = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].timestampMs <= currentMs) {
        activeIdx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return activeIdx;
  }
}
