// Web Audio API and Speech Synthesis helper for push-up coach

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a synthesized beep tone
 */
export function playSound(
  frequency = 880,
  type: OscillatorType = 'sine',
  duration = 0.12,
  volume = 0.25
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.debug('Audio play failed:', err);
  }
}

/**
 * Play rep count chime (bright upward chime)
 */
export function playRepChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (err) {
    console.debug(err);
  }
}

/**
 * Play countdown tick audio cue (rhythmic beep for 5,4,3,2,1 and high-pitch chord for GO)
 */
export function playCountdownTick(isGo = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isGo) {
      // High-energy GO! chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      // Crisp countdown tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now); // G5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch (err) {
    console.debug('Countdown tick error:', err);
  }
}

/**
 * Play bottom reached cue (subtle tactile acoustic cue)
 */
export function playDownCue() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    console.debug(err);
  }
}

/**
 * Play form warning tone (low warning)
 */
export function playFormWarning() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(196, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.debug(err);
  }
}

/**
 * Play celebration fanfare when target reached
 */
export function playTargetReachedFanfare() {
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        playSound(freq, 'triangle', 0.2, 0.3);
      }, index * 100);
    });
  } catch (err) {
    console.debug(err);
  }
}

// Global reference to prevent Chrome/Safari garbage-collection bug on active speech
let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speak voice feedback using Web Speech API (Non-blocking, decoupled from state machine)
 */
export function speakCoachFeedback(text: string, force = false) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Run asynchronously outside the main rendering / pose loop
  setTimeout(() => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;

      if (synth.paused) {
        synth.resume();
      }

      // If already speaking and not forced, skip to avoid stutter
      if (synth.speaking && !force) {
        return;
      }

      if (force && synth.speaking) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterance = utterance;

      utterance.rate = 1.2;
      utterance.pitch = 1.05;
      utterance.volume = 0.9;

      utterance.onend = () => {
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
      };

      utterance.onerror = () => {
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
      };

      // Pick clean voice if available
      const voices = synth.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Siri') ||
              v.name.includes('Samantha') ||
              v.default)
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      synth.speak(utterance);
    } catch (err) {
      console.debug('Speech error (non-fatal):', err);
    }
  }, 0);
}
