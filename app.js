const state = {
  phase: "skip",
  running: false,
  finished: false,
  currentCycle: 1,
  remaining: 60,
  phaseTotal: 60,
  intervalId: null,
};

const els = {
  phaseCard: document.querySelector("#phaseCard"),
  phaseLabel: document.querySelector("#phaseLabel"),
  timeDisplay: document.querySelector("#timeDisplay"),
  cycleCopy: document.querySelector("#cycleCopy"),
  progressFill: document.querySelector("#progressFill"),
  startPauseButton: document.querySelector("#startPauseButton"),
  resetButton: document.querySelector("#resetButton"),
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
}

function advancePhase() {
  const settings = getSettings();

  if (state.phase === "skip") {
    setPhase("break");
    return;
  }

  state.currentCycle += 1;

  if (settings.cycles > 0 && state.currentCycle > settings.cycles) {
    completeWorkout();
    return;
  }

  setPhase("skip");
}

function tick() {
  state.remaining -= 1;

  if (state.remaining <= 0) {
    advancePhase();
    return;
  }

  updateDisplay();
}

function startTimer() {
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
