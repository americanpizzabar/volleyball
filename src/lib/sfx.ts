// 軽量サウンドエフェクト（音声ファイル不要、Web Audio APIで合成）。
// ユーザー操作（タップ）に紐づいて再生されるため自動再生制限に抵触しない。

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.15) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.02);
}

/** スパイク決定など、爽快な上昇アルペジオ。 */
export function playKill() {
  tone(523, 0, 0.12, "triangle");
  tone(659, 0.08, 0.12, "triangle");
  tone(880, 0.16, 0.22, "triangle", 0.18);
}

/** レベルアップ：きらきらした上昇音。 */
export function playLevelUp() {
  tone(659, 0, 0.1, "sine");
  tone(784, 0.09, 0.1, "sine");
  tone(988, 0.18, 0.1, "sine");
  tone(1319, 0.27, 0.25, "sine", 0.16);
}

/** 反則：低い警告ブザー。 */
export function playBuzz() {
  tone(160, 0, 0.18, "sawtooth", 0.12);
  tone(120, 0.12, 0.18, "sawtooth", 0.12);
}
