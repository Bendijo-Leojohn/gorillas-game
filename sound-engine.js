/*
 * Sound Engine
 * ------------------------------------------------------------
 * All sound effects and the background music are synthesized with
 * the Web Audio API, so the game needs no external .mp3 files
 * (which is why the old <audio> tags kept failing with 404s).
 *
 * Public API:
 *   SoundEngine.unlock()            // call from a user gesture
 *   SoundEngine.playThrow()
 *   SoundEngine.playExplosion()
 *   SoundEngine.playHit()
 *   SoundEngine.playWin()
 *   SoundEngine.playClick()
 *   SoundEngine.startMusic() / stopMusic()
 *   SoundEngine.toggleMute() / setEnabled(bool)
 *   SoundEngine.onChange(callback)  // callback(enabled)
 */

const SoundEngine = (() => {
  const STORAGE_KEY = "gorillas-sound-enabled";

  let audioContext = null;
  let masterGain = null;
  let musicGain = null;
  let musicTimerId = null;
  let musicStep = 0;
  let noiseBuffer = null;
  let enabled = true;

  const listeners = new Set();

  // Restore the player's preference
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabled = stored === "true";
  } catch (error) {
    /* localStorage can be blocked - that's fine */
  }

  function notify() {
    listeners.forEach((listener) => {
      try {
        listener(enabled);
      } catch (error) {
        /* ignore a broken listener */
      }
    });
  }

  function ensureContext() {
    if (audioContext) {
      if (audioContext.state === "suspended") audioContext.resume();
      return audioContext;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      masterGain.gain.value = enabled ? 0.9 : 0;
      masterGain.connect(audioContext.destination);

      musicGain = audioContext.createGain();
      musicGain.gain.value = 0.45;
      musicGain.connect(masterGain);
    } catch (error) {
      audioContext = null;
      masterGain = null;
      musicGain = null;
    }

    return audioContext;
  }

  function getNoiseBuffer(context) {
    if (noiseBuffer) return noiseBuffer;

    const length = Math.floor(context.sampleRate * 1.0);
    noiseBuffer = context.createBuffer(1, length, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  // A simple oscillator "beep" with an optional pitch glide
  function tone({
    frequency,
    endFrequency,
    duration = 0.2,
    volume = 0.2,
    type = "sine",
    delay = 0,
    destination,
  }) {
    const context = ensureContext();
    if (!context) return;

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, endFrequency),
        start + duration
      );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(destination || masterGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  // Filtered white noise - used for whooshes and explosions
  function noiseBurst({
    duration = 0.25,
    volume = 0.3,
    startFrequency = 1000,
    endFrequency = 200,
    filterType = "lowpass",
    delay = 0,
  }) {
    const context = ensureContext();
    if (!context) return;

    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = getNoiseBuffer(context);
    filter.type = filterType;
    filter.frequency.setValueAtTime(startFrequency, start);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(40, endFrequency),
      start + duration
    );

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(start);
    source.stop(start + duration + 0.05);
  }

  function guard(fn) {
    return function guarded(...args) {
      if (!enabled) return;
      try {
        fn(...args);
      } catch (error) {
        /* audio must never break the game */
      }
    };
  }

  const playThrow = guard(() => {
    noiseBurst({
      duration: 0.22,
      volume: 0.16,
      startFrequency: 500,
      endFrequency: 2200,
      filterType: "bandpass",
    });
    tone({
      frequency: 240,
      endFrequency: 90,
      duration: 0.18,
      volume: 0.09,
      type: "triangle",
    });
  });

  // intensity: 1 = normal hit, 2 = rocket, 3 = nuke
  const playExplosion = guard((intensity = 1) => {
    const level = Math.max(1, Math.min(3, intensity));

    noiseBurst({
      duration: 0.45 + level * 0.12,
      volume: 0.3 + level * 0.06,
      startFrequency: 1600 - level * 200,
      endFrequency: 50,
    });
    tone({
      frequency: 130 - level * 18,
      endFrequency: 30,
      duration: 0.35 + level * 0.1,
      volume: 0.18 + level * 0.04,
      type: "sine",
    });

    if (level >= 3) {
      // Nuke: extra rumbling tail
      noiseBurst({
        duration: 1.2,
        volume: 0.3,
        startFrequency: 420,
        endFrequency: 35,
        delay: 0.08,
      });
      tone({
        frequency: 70,
        endFrequency: 22,
        duration: 1.1,
        volume: 0.22,
        type: "triangle",
        delay: 0.06,
      });
    } else if (level === 2) {
      noiseBurst({
        duration: 0.5,
        volume: 0.16,
        startFrequency: 900,
        endFrequency: 80,
        delay: 0.06,
      });
    }
  });

  const playHit = guard(() => {
    tone({
      frequency: 520,
      endFrequency: 110,
      duration: 0.2,
      volume: 0.22,
      type: "square",
    });
    noiseBurst({
      duration: 0.15,
      volume: 0.18,
      startFrequency: 900,
      endFrequency: 150,
    });
  });

  const playWin = guard(() => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      tone({
        frequency,
        duration: 0.26,
        volume: 0.18,
        type: "triangle",
        delay: index * 0.13,
      });
    });
    tone({
      frequency: 1046.5,
      duration: 0.5,
      volume: 0.12,
      type: "sine",
      delay: 0.52,
    });
  });

  const playClick = guard(() => {
    tone({
      frequency: 740,
      duration: 0.05,
      volume: 0.12,
      type: "square",
    });
  });

  // ------------------------------------------------------------
  // Background music: a calm 16-step loop in A minor
  // ------------------------------------------------------------
  const BASE_FREQUENCY = 220; // A3
  const melody = [0, 3, 7, 10, 7, 3, 0, -2, 0, 3, 7, 12, 10, 7, 3, -2];
  const bass = [-12, -12, -17, -17, -12, -12, -15, -15];

  function playMusicStep() {
    if (!enabled || !audioContext) return;

    const step = musicStep % melody.length;

    if (step % 2 === 0) {
      const bassNote = bass[(musicStep / 2) % bass.length];
      tone({
        frequency: BASE_FREQUENCY * Math.pow(2, bassNote / 12),
        duration: 0.42,
        volume: 0.07,
        type: "triangle",
        destination: musicGain,
      });
    }

    tone({
      frequency: BASE_FREQUENCY * Math.pow(2, melody[step] / 12),
      duration: 0.2,
      volume: 0.045,
      type: "square",
      destination: musicGain,
    });

    musicStep += 1;
  }

  function startMusic() {
    if (!enabled) return;
    const context = ensureContext();
    if (!context) return;
    if (musicTimerId) return;

    musicStep = 0;
    playMusicStep();
    musicTimerId = window.setInterval(playMusicStep, 280);
  }

  function stopMusic() {
    if (musicTimerId) {
      window.clearInterval(musicTimerId);
      musicTimerId = null;
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch (error) {
      /* ignore */
    }
  }

  function setEnabled(value, { silent = false } = {}) {
    enabled = Boolean(value);
    persist();

    if (masterGain && audioContext) {
      masterGain.gain.setTargetAtTime(
        enabled ? 0.9 : 0,
        audioContext.currentTime,
        0.03
      );
    }

    if (enabled) {
      if (audioContext) startMusic();
    } else {
      stopMusic();
    }

    notify();
    if (enabled && !silent) playClick();
    return enabled;
  }

  function toggleMute() {
    return setEnabled(!enabled);
  }

  function unlock() {
    const context = ensureContext();
    if (context && context.state === "suspended") {
      context.resume();
    }
    if (enabled) startMusic();
  }

  return {
    get enabled() {
      return enabled;
    },
    unlock,
    setEnabled,
    toggleMute,
    startMusic,
    stopMusic,
    playThrow,
    playExplosion,
    playHit,
    playWin,
    playClick,
    onChange(listener) {
      listeners.add(listener);
      try {
        listener(enabled);
      } catch (error) {
        /* ignore */
      }
      return () => listeners.delete(listener);
    },
  };
})();
