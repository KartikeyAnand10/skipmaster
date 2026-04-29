const state = {
  phase: "skip",
  running: false,
  finished: false,
  currentCycle: 1,
  remaining: 60,
  phaseTotal: 60,
  intervalId: null,
  audioContext: null,
};

const els = {
  phaseCard: document.querySelector("#phaseCard"),
  phaseLabel: document.querySelector("#phaseLabel"),
  timeDisplay: document.querySelector("#timeDisplay"),
  cycleCopy: document.querySelector("#cycleCopy"),
  progressFill: document.querySelector("#progressFill"),
  startPauseButton: document.querySelector("#startPauseButton"),
  resetButton: document.querySelector("#resetButton"),
  testSoundButton: document.querySelector("#testSoundButton"),
  soundNote: document.querySelector("#soundNote"),
  statusPill: document.querySelector("#statusPill"),
  skipMinutes: document.querySelector("#skipMinutes"),
  breakSeconds: document.querySelector("#breakSeconds"),
  cycles: document.querySelector("#cycles"),
};

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function getSettings() {
  const skipMinutes = clampNumber(els.skipMinutes.value, 0, 99, 1);
  const breakSeconds = clampNumber(els.breakSeconds.value, 5, 900, 30);
  const cycles = clampNumber(els.cycles.value, 0, 99, 0);
  const skipSeconds = Math.max(5, Math.round(skipMinutes * 60));

  return {
    skipSeconds,
    breakSeconds: Math.round(breakSeconds),
    cycles: Math.round(cycles),
  };
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function unlockAudio() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    els.soundNote.textContent = "Sound is not supported in this browser.";
    return null;
  }

  if (!state.audioContext) {
    state.audioContext = new AudioContextConstructor();
  }

  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }

  els.soundNote.textContent = "Sound alerts are on.";
  els.soundNote.classList.add("ready");
  return state.audioContext;
}

function playTone(audioContext, frequency, startTime, duration, volume = 0.32) {
  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.025);
}

async function playAlert(type) {
  const audioContext = await unlockAudio();

  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;

  if (type === "cycle") {
    playTone(audioContext, 660, now, 0.16);
    playTone(audioContext, 880, now + 0.19, 0.16);
    playTone(audioContext, 1046, now + 0.4, 0.24);
    return;
  }

  if (type === "complete") {
    playTone(audioContext, 784, now, 0.18);
    playTone(audioContext, 988, now + 0.22, 0.18);
    playTone(audioContext, 1175, now + 0.46, 0.36);
    return;
  }

  playTone(audioContext, 880, now, 0.18);
  playTone(audioContext, 587, now + 0.22, 0.22);
}

function syncSettingsInputs() {
  const settings = getSettings();
  els.skipMinutes.value = settings.skipSeconds / 60;
  els.breakSeconds.value = settings.breakSeconds;
  els.cycles.value = settings.cycles;
}

function updateDisplay() {
  const settings = getSettings();
  const maxCycles = settings.cycles === 0 ? "∞" : settings.cycles;
  const progress =
    state.phaseTotal > 0
      ? ((state.phaseTotal - state.remaining) / state.phaseTotal) * 100
      : 0;

  els.timeDisplay.textContent = formatTime(Math.max(0, state.remaining));
  els.phaseLabel.textContent =
    state.finished ? "Complete" : state.phase === "skip" ? "Skipping" : "Break";
  els.cycleCopy.textContent = state.finished
    ? `${state.currentCycle - 1} cycle${state.currentCycle - 1 === 1 ? "" : "s"} complete`
    : `Cycle ${state.currentCycle} of ${maxCycles}`;
  els.progressFill.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
  els.startPauseButton.textContent = state.running ? "Pause" : state.finished ? "Start again" : "Start";
  els.statusPill.textContent = state.running ? "Running" : state.finished ? "Done" : "Ready";
  els.phaseCard.classList.toggle("break", state.phase === "break" && !state.finished);
  els.phaseCard.classList.toggle("finished", state.finished);
}

function setPhase(phase) {
  const settings = getSettings();
  state.phase = phase;
  state.phaseTotal = phase === "skip" ? settings.skipSeconds : settings.breakSeconds;
  state.remaining = state.phaseTotal;
  updateDisplay();
}

function resetTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.running = false;
  state.finished = false;
  state.currentCycle = 1;
  syncSettingsInputs();
  setPhase("skip");
}

function completeWorkout() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.running = false;
  state.finished = true;
  state.remaining = 0;
  updateDisplay();
  playAlert("complete");
}

function advancePhase() {
  const settings = getSettings();

  if (state.phase === "skip") {
    setPhase("break");
    playAlert("phase");
    return;
  }

  state.currentCycle += 1;

  if (settings.cycles > 0 && state.currentCycle > settings.cycles) {
    completeWorkout();
    return;
  }

  setPhase("skip");
  playAlert("cycle");
}

function tick() {
  state.remaining -= 1;

  if (state.remaining <= 0) {
    advancePhase();
    return;
  }

  updateDisplay();
}

async function startTimer() {
  await unlockAudio();

  if (state.finished) {
    resetTimer();
  }

  state.running = true;
  clearInterval(state.intervalId);
  state.intervalId = window.setInterval(tick, 1000);
  updateDisplay();
}

function pauseTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.running = false;
  updateDisplay();
}

els.startPauseButton.addEventListener("click", () => {
  if (state.running) {
    pauseTimer();
  } else {
    startTimer();
  }
});

els.resetButton.addEventListener("click", resetTimer);
els.testSoundButton.addEventListener("click", () => playAlert("cycle"));

document.querySelector("#settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
});

[els.skipMinutes, els.breakSeconds, els.cycles].forEach((input) => {
  input.addEventListener("change", () => {
    if (!state.running) {
      resetTimer();
    }
  });
});

resetTimer();
