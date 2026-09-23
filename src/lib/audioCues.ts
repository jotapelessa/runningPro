/**
 * @graph-entity AudioCues
 * @module audioCues
 * @description Sintetizador de áudio nativo usando Web Audio API do navegador.
 * Gera bipes de contagem regressiva e toques de troca de ritmo (trote vs caminhada)
 * com latência zero e sem dependência de arquivos externos mp3.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Toca um bipe curto com frequência e duração especificadas
 */
function playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', gainVal = 0.25) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationSec);
  } catch (err) {
    console.warn('[AudioCues] Falha ao tocar tom:', err);
  }
}

/**
 * Bipe curto de aviso prévio (ex: faltam 3, 2 ou 1 segundo)
 */
export function playCountdownPip() {
  playTone(880, 0.08, 'sine', 0.2); // Nota A5
}

/**
 * Acorde ascendente e motivador para iniciar o bloco de Trote (Corrida leve)
 */
export function playStartRunTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Duas notas rápidas ascendentes: D5 (587Hz) -> G5 (784Hz)
    const now = ctx.currentTime;
    [
      { freq: 587.33, start: 0, dur: 0.12 },
      { freq: 880.00, start: 0.12, dur: 0.25 }
    ].forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      gain.gain.setValueAtTime(0.3, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    });
  } catch (err) {
    console.warn('[AudioCues] Erro no acorde de corrida:', err);
  }
}

/**
 * Acorde descendente e relaxante para iniciar a Caminhada (Recuperação)
 */
export function playStartWalkTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Duas notas descendentes suaves: E5 (659Hz) -> C5 (523Hz)
    const now = ctx.currentTime;
    [
      { freq: 659.25, start: 0, dur: 0.15 },
      { freq: 440.00, start: 0.14, dur: 0.30 }
    ].forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      gain.gain.setValueAtTime(0.25, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    });
  } catch (err) {
    console.warn('[AudioCues] Erro no acorde de caminhada:', err);
  }
}

/**
 * Fanfarra de conclusão do treino
 */
export function playFinishWorkoutTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.15));
      gain.gain.setValueAtTime(0.3, now + (idx * 0.15));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.15) + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + (idx * 0.15));
      osc.stop(now + (idx * 0.15) + 0.35);
    });
  } catch (err) {
    console.warn('[AudioCues] Erro no acorde final:', err);
  }
}
