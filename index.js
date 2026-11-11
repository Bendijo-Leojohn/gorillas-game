/*

Learn how to code this game step-by-step on YouTube:

https://www.youtube.com/watch?v=2q5EufbUEQk

Follow me on 𝕏 for more: https://twitter.com/HunorBorbely

*/

// The state of the game
let state = {};

let isDragging = false;
let dragStartX = undefined;
let dragStartY = undefined;

let previousAnimationTimestamp = undefined;
let animationFrameRequestID = undefined;
let delayTimeoutID = undefined;
let effectAnimationID = undefined;

let simulationMode = false;
let simulationImpact = {};

// Remember each player's last keyboard aim, so arrow keys keep their settings
const lastAim = [
  { angle: 45, speed: 90 },
  { angle: 45, speed: 90 },
];

// Terrain the current buildings were generated with (set again in newGame)
let builtTerrain = "city";

const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

// Settings
const settings = {
  numberOfPlayers: 1, // 0 means two computers are playing against each other
  mode: darkModeMediaQuery.matches ? "dark" : "light",
  character: 'default',  // Default character
  terrain: 'city',       // Default terrain
  ball: 'banana',        // Default ball
  effect: 'explosion',   // Default explosion effect
  player1Character: 'default',  // Player 1's character
  player2Character: 'robot',    // Player 2's character
};

// ------------------------------------------------------------
// Special skills
// ------------------------------------------------------------
const SKILLS = {
  nuke: {
    name: "Nuke",
    damage: 100,        // instant knockout
    explosionSize: 135,
    shake: 26,
    blastRadius: 65,
    blastHoles: 12,
    color: "#FFD54F",
  },
  rocket: {
    name: "Rocket",
    damage: 45,
    explosionSize: 55,
    shake: 16,
    blastRadius: 28,
    blastHoles: 4,
    color: "#FF7043",
  },
};

const STARTING_SKILLS = { nuke: 1, rocket: 2 };

// Initialize character image
const characterImage = new Image();
characterImage.src = "character.png";

// ------------------------------------------------------------
// Preferences (remember character / terrain / ball / effect)
// ------------------------------------------------------------
const PREFERENCES_STORAGE_KEY = "gorillas-options-v1";
const PERSISTED_SETTINGS = [
  "terrain",
  "ball",
  "effect",
  "player1Character",
  "player2Character",
  "mode",
];

function loadPreferences() {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY));
  } catch (error) {
    return;
  }
  if (!stored || typeof stored !== "object") return;

  PERSISTED_SETTINGS.forEach((key) => {
    if (typeof stored[key] === "string") settings[key] = stored[key];
  });

  // Guard against options that no longer exist
  if (!gameOptions.terrains.some((terrain) => terrain.id === settings.terrain)) {
    settings.terrain = "city";
  }
  if (!gameOptions.balls.some((ball) => ball.id === settings.ball)) {
    settings.ball = "banana";
  }
  if (!gameOptions.effects.some((effect) => effect.id === settings.effect)) {
    settings.effect = "explosion";
  }
  ["player1Character", "player2Character"].forEach((key) => {
    if (!gameOptions.characters.some((character) => character.id === settings[key])) {
      settings[key] = "default";
    }
  });
  if (!["light", "dark"].includes(settings.mode)) {
    settings.mode = darkModeMediaQuery.matches ? "dark" : "light";
  }
}

function savePreferences() {
  try {
    const snapshot = {};
    PERSISTED_SETTINGS.forEach((key) => {
      snapshot[key] = settings[key];
    });
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    /* ignore */
  }
}

// Device detection
const isMobile = {
  Android: function() {
    return navigator.userAgent.match(/Android/i);
  },
  iOS: function() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Windows: function() {
    return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
  },
  any: function() {
    return (isMobile.Android() || isMobile.iOS() || isMobile.Windows());
  }
};

// Apply mobile-specific optimizations if on a mobile device.
// NOTE: this is only called after the DOM references below exist.
function isTouchDevice() {
  return isMobile.any() || window.innerWidth < 768;
}

function applyMobileOptimizations() {
  if (!bombGrabAreaDOM) return;
  if (!isTouchDevice()) return;

  // Enlarge the bomb grab area for easier touch
  bombGrabAreaDOM.style.width = '45px';
  bombGrabAreaDOM.style.height = '45px';

  // Make the windmill smaller on mobile
  const windmill = document.getElementById('windmill');
  if (windmill) {
    windmill.style.width = '100px';
    windmill.style.height = '120px';
  }

  // Adjust game UI elements for mobile
  const settingsEl = document.getElementById('settings');
  if (settingsEl) settingsEl.classList.add('mobile-settings');
  const windInfoEl = document.getElementById('wind-info');
  if (windInfoEl) windInfoEl.classList.add('mobile-wind-info');

  // Adjust info panels
  const infoLeft = document.getElementById('info-left');
  const infoRight = document.getElementById('info-right');
  if (infoLeft) {
    infoLeft.classList.add('mobile-info');
    infoLeft.style.opacity = '1';
  }
  if (infoRight) {
    infoRight.classList.add('mobile-info');
    infoRight.style.opacity = '1';
  }

  // Make instructions more visible on mobile
  const instructions = document.getElementById('instructions');
  if (instructions) instructions.classList.add('mobile-instructions');

  // Add touch-friendly class to the game
  document.body.classList.add('touch-friendly');
}

const blastHoleRadius = 18;

// The main canvas element and its drawing context
const canvas = document.getElementById("game");
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
const ctx = canvas.getContext("2d");

// Windmill
const windmillDOM = document.getElementById("windmill");
const windmillHeadDOM = document.getElementById("windmill-head");
const windInfoDOM = document.getElementById("wind-info");
const windSpeedDOM = document.getElementById("wind-speed");

// Left info panel
const info1DOM = document.getElementById("info-left");
const name1DOM = document.querySelector("#info-left .name");
const angle1DOM = document.querySelector("#info-left .angle");
const velocity1DOM = document.querySelector("#info-left .velocity");
const health1DOM = document.querySelector("#info-left .health");
const healthBar1DOM = document.querySelector(".player1-health");

// Right info panel
const info2DOM = document.getElementById("info-right");
const name2DOM = document.querySelector("#info-right .name");
const angle2DOM = document.querySelector("#info-right .angle");
const velocity2DOM = document.querySelector("#info-right .velocity");
const health2DOM = document.querySelector("#info-right .health");
const healthBar2DOM = document.querySelector(".player2-health");

// Instructions panel
const instructionsDOM = document.getElementById("instructions");
const gameModeDOM = document.getElementById("game-mode");

// The bomb's grab area
const bombGrabAreaDOM = document.getElementById("bomb-grab-area");

// Congratulations panel
const congratulationsDOM = document.getElementById("congratulations");
const winnerDOM = document.getElementById("winner");

// Settings toolbar
const settingsDOM = document.getElementById("settings");
const singlePlayerButtonDOM = document.querySelectorAll(".single-player");
const twoPlayersButtonDOM = document.querySelectorAll(".two-players");
const autoPlayButtonDOM = document.querySelectorAll(".auto-play");
const colorModeButtonDOM = document.getElementById("color-mode");

// Game options panel elements
const gameOptionsPanel = document.getElementById("game-options-panel");
const characterOptionsContainer = document.getElementById("character-options");
const terrainOptionsContainer = document.getElementById("terrain-options");
const ballOptionsContainer = document.getElementById("ball-options");
const effectOptionsContainer = document.getElementById("effect-options");
const optionsDoneButton = document.getElementById("options-done");

// Scoreboard elements
const scoreLeftNameDOM = document.getElementById("score-left-name");
const scoreRightNameDOM = document.getElementById("score-right-name");
const scoreLeftDOM = document.getElementById("score-left");
const scoreRightDOM = document.getElementById("score-right");
const scoreResetDOM = document.getElementById("score-reset");
const finalScoreDOM = document.getElementById("final-score");

// Sound toggle
const soundToggleDOM = document.getElementById("sound-toggle");

// Special skills
const skillsBarDOM = document.getElementById("skills-bar");
const skillButtonsDOM = document.querySelectorAll(".skill-btn");
const screenFlashDOM = document.getElementById("screen-flash");

// All UI elements exist at this point - safe to apply mobile tweaks
applyMobileOptimizations();

// Restore the player's last choices before building the options panel
loadPreferences();

// Create Options Button
const optionsButton = document.createElement("button");
optionsButton.innerText = "Game Options";
optionsButton.id = "options-button";
settingsDOM.appendChild(optionsButton);

// Initialize options panel
initializeGameOptionsPanel();

// Event listeners for options
optionsButton.addEventListener("click", () => {
  gameOptionsPanel.style.display = "block";
});

optionsDoneButton.addEventListener("click", () => {
  gameOptionsPanel.style.display = "none";
  savePreferences();
  SoundEngine.playClick();

  // Only rebuild the city when the terrain actually changed
  if (settings.terrain !== builtTerrain) {
    updateBuildingsForTerrain();
  }

  draw();
});

colorModeButtonDOM.addEventListener("click", () => {
  settings.mode = settings.mode === "dark" ? "light" : "dark";
  SoundEngine.playClick();
  applyColorMode();
  draw();
});

darkModeMediaQuery.addEventListener("change", (e) => {
  settings.mode = e.matches ? "dark" : "light";
  applyColorMode();
  draw();
});

// Keep the page styling in sync with the canvas color mode
function applyColorMode() {
  const isDark = settings.mode === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  document.body.classList.toggle("light-mode", !isDark);
  colorModeButtonDOM.textContent = isDark ? "Light Mode" : "Dark Mode";
}

// ------------------------------------------------------------
// Scores (persisted in localStorage, one scoreboard per mode)
// ------------------------------------------------------------
const SCORES_STORAGE_KEY = "gorillas-scores-v1";
const SCORE_NAMES = {
  single: ["You", "Computer"],
  two: ["Player 1", "Player 2"],
  auto: ["Computer 1", "Computer 2"],
};

function emptyScores() {
  return { single: [0, 0], two: [0, 0], auto: [0, 0] };
}

function loadScores() {
  const fallback = emptyScores();
  try {
    const stored = JSON.parse(localStorage.getItem(SCORES_STORAGE_KEY));
    if (!stored || typeof stored !== "object") return fallback;
    Object.keys(fallback).forEach((key) => {
      if (
        Array.isArray(stored[key]) &&
        stored[key].length === 2 &&
        stored[key].every((value) => Number.isFinite(value))
      ) {
        fallback[key] = stored[key].map((value) => Math.max(0, Math.floor(value)));
      }
    });
  } catch (error) {
    /* corrupted or blocked storage - start fresh */
  }
  return fallback;
}

let scores = loadScores();

function saveScores() {
  try {
    localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    /* ignore */
  }
}

function currentScoreKey() {
  if (settings.numberOfPlayers === 0) return "auto";
  if (settings.numberOfPlayers === 2) return "two";
  return "single";
}

function renderScores() {
  const key = currentScoreKey();
  const names = SCORE_NAMES[key];
  const values = scores[key];

  if (scoreLeftNameDOM) scoreLeftNameDOM.textContent = names[0];
  if (scoreRightNameDOM) scoreRightNameDOM.textContent = names[1];
  if (scoreLeftDOM) scoreLeftDOM.textContent = values[0];
  if (scoreRightDOM) scoreRightDOM.textContent = values[1];
  if (finalScoreDOM) finalScoreDOM.textContent = `${values[0]} : ${values[1]}`;
}

function recordWin(player) {
  const key = currentScoreKey();
  if (!scores[key]) scores[key] = [0, 0];
  scores[key][player - 1] += 1;
  saveScores();
  renderScores();
}

function resetScores() {
  scores = emptyScores();
  saveScores();
  renderScores();
}

if (scoreResetDOM) {
  scoreResetDOM.addEventListener("click", () => {
    SoundEngine.playClick();
    resetScores();
  });
}

// ------------------------------------------------------------
// Sound
// ------------------------------------------------------------
if (soundToggleDOM) {
  SoundEngine.onChange((enabled) => {
    soundToggleDOM.textContent = enabled ? "Sound On" : "Muted";
    soundToggleDOM.classList.toggle("muted", !enabled);
    soundToggleDOM.setAttribute("aria-pressed", String(enabled));
  });

  soundToggleDOM.addEventListener("click", () => {
    SoundEngine.unlock();
    SoundEngine.toggleMute();
  });
}

// Browsers only allow audio after a user gesture
function unlockAudio() {
  SoundEngine.unlock();
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
  window.removeEventListener("touchstart", unlockAudio);
}

window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);
window.addEventListener("touchstart", unlockAudio, { passive: true });

// ------------------------------------------------------------
// Special skills: HUD, selection and helpers
// ------------------------------------------------------------
function skillPoolForCurrentPlayer() {
  if (!state.skills) return null;
  return state.skills[state.currentPlayer - 1] || null;
}

function renderSkills() {
  const pool = skillPoolForCurrentPlayer() || { nuke: 0, rocket: 0 };

  skillButtonsDOM.forEach((button) => {
    const id = button.dataset.skill;
    const count = pool[id] || 0;
    const countDOM = button.querySelector(".skill-count");

    if (countDOM) countDOM.textContent = `×${count}`;
    button.classList.toggle("active", state.activeSkill === id);
    button.classList.toggle("empty", count <= 0);
    button.disabled = count <= 0;
    button.setAttribute("aria-pressed", String(state.activeSkill === id));
  });

  if (skillsBarDOM) {
    const humanTurn =
      state.phase === "aiming" &&
      settings.numberOfPlayers !== 0 &&
      !(settings.numberOfPlayers === 1 && state.currentPlayer === 2);
    skillsBarDOM.classList.toggle("disabled", !humanTurn);
  }
}

function selectSkill(id) {
  if (!isHumanTurn()) return;

  const pool = skillPoolForCurrentPlayer();
  if (!pool || !(pool[id] > 0)) return;

  state.activeSkill = state.activeSkill === id ? null : id;
  SoundEngine.playClick();
  renderSkills();
  draw();
}

// Push a few extra craters around an impact so big hits destroy more terrain
function addBlastScars(x, y, radius, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = radius * (0.25 + Math.random() * 0.75);
    state.blastHoles.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
    });
  }
}

function triggerFlash() {
  if (!screenFlashDOM) return;
  screenFlashDOM.classList.remove("active");
  // Force a reflow so the animation can restart
  void screenFlashDOM.offsetWidth;
  screenFlashDOM.classList.add("active");
  setTimeout(() => screenFlashDOM.classList.remove("active"), 520);
}

// What should the computer use on this turn?
function chooseComputerSkill() {
  const pool = skillPoolForCurrentPlayer();
  if (!pool) return null;

  const enemyIndex = state.currentPlayer === 1 ? 1 : 0;
  const enemyHealth = state.players[enemyIndex].health;

  if (pool.nuke > 0 && enemyHealth <= 45 && state.round >= 2) return "nuke";
  if (pool.rocket > 0 && (enemyHealth <= 70 || state.round >= 3)) return "rocket";

  return null;
}

skillButtonsDOM.forEach((button) => {
  button.addEventListener("click", () => selectSkill(button.dataset.skill));
});

renderScores();
applyColorMode();

newGame();

function newGame() {
  // Reset game state
  state = {
    phase: "aiming", // aiming | in flight | celebrating | hit reaction
    currentPlayer: 1,
    round: 1,
    windSpeed: generateWindSpeed(),
    lastHitPoint: null, // Track exact hit location for effect placement
    shake: 0, // Screen shake strength after an impact
    winnerAnnounced: false, // Make sure a win is only counted once

    // Special skills (one pool per player)
    skills: [
      { ...STARTING_SKILLS },
      { ...STARTING_SKILLS },
    ],
    activeSkill: null, // Skill picked in the HUD, used on the next throw
    throwSkill: null,  // Skill attached to the bomb currently in flight
    pendingSkill: null, // Skill chosen by the computer for its next throw
    bomb: {
      x: undefined,
      y: undefined,
      rotation: 0,
      velocity: { x: 0, y: 0 },
      highlight: true,
    },

    // Player state
    players: [
      {
        health: 100,  // Player 1 health
        isHit: false, // Flag for hit reaction animation
        hitTimer: 0,  // Timer for hit reaction animation
        wasHitThisThrow: false // Track if hit during current throw
      },
      {
        health: 100,  // Player 2 health
        isHit: false, // Flag for hit reaction animation
        hitTimer: 0,  // Timer for hit reaction animation
        wasHitThisThrow: false // Track if hit during current throw
      }
    ],

    // Buildings
    backgroundBuildings: [],
    buildings: [],
    blastHoles: [],

    stars: [],
    birds: [], // Add birds to state

    scale: 1,
    shift: 0,
  };

  // Generate stars
  for (let i = 0; i < (window.innerWidth * window.innerHeight) / 12000; i++) {
    const x = Math.floor(Math.random() * window.innerWidth);
    const y = Math.floor(Math.random() * window.innerHeight);
    state.stars.push({ x, y });
  }

  // Add birds and twinkling stars to state
  if (settings.mode === 'light') {
    // Add 3-5 birds for day mode
    const birdCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < birdCount; i++) {
      state.birds.push({
        x: Math.random() * window.innerWidth,
        y: 60 + Math.random() * 120,
        speed: 1.2 + Math.random() * 1.5,
        size: 18 + Math.random() * 10,
        wing: 0
      });
    }
  }

  // Generate background buildings
  for (let i = 0; i < 17; i++) {
    generateBackgroundBuilding(i);
  }

  // Generate buildings with the currently selected terrain
  const terrain = gameOptions.terrains.find(
    (item) => item.id === settings.terrain
  );
  if (terrain && typeof terrain.generateBuilding === "function") {
    for (let i = 0; i < 8; i++) {
      state.buildings.push(
        terrain.generateBuilding(i, state.buildings[i - 1])
      );
    }
  } else {
    for (let i = 0; i < 8; i++) {
      generateBuilding(i);
    }
  }
  builtTerrain = settings.terrain;

  calculateScaleAndShift();
  initializeBombPosition();
  initializeWindmillPosition();
  setWindMillRotation();

  // Cancel any ongoing animation and timeout
  cancelAnimationFrame(animationFrameRequestID);
  cancelAnimationFrame(effectAnimationID);
  effectAnimationID = undefined;
  clearTimeout(delayTimeoutID);

  // Reset HTML elements
  if (settings.numberOfPlayers > 0) {
    showInstructions();
  } else {
    hideInstructions();
  }
  hideCongratulations();
  angle1DOM.innerText = 0;
  velocity1DOM.innerText = 0;
  angle2DOM.innerText = 0;
  velocity2DOM.innerText = 0;
  
  // Reset health displays
  updateHealthDisplay(1, 100);
  updateHealthDisplay(2, 100);

  // Reset simulation mode
  simulationMode = false;
  simulationImpact = {};

  // Reset the remembered keyboard aim for both players
  lastAim[0] = { angle: 45, speed: 90 };
  lastAim[1] = { angle: 45, speed: 90 };

  renderSkills();

  draw();

  if (settings.numberOfPlayers === 0) {
    computerThrow();
  }
}

function showInstructions() {
  instructionsDOM.style.opacity = 1;
  instructionsDOM.style.visibility = "visible";
}

function hideInstructions() {
  state.bomb.highlight = false;
  instructionsDOM.style.opacity = 0;
  instructionsDOM.style.visibility = "hidden";
}

function showCongratulations() {
  congratulationsDOM.style.opacity = 1;
  congratulationsDOM.style.visibility = "visible";
}

function hideCongratulations() {
  congratulationsDOM.style.opacity = 0;
  congratulationsDOM.style.visibility = "hidden";
}

function generateBackgroundBuilding(index) {
  const previousBuilding = state.backgroundBuildings[index - 1];

  const x = previousBuilding
    ? previousBuilding.x + previousBuilding.width + 4
    : -300;

  const minWidth = 60;
  const maxWidth = 110;
  const width = minWidth + Math.random() * (maxWidth - minWidth);

  const smallerBuilding = index < 4 || index >= 13;

  const minHeight = 80;
  const maxHeight = 350;
  const smallMinHeight = 20;
  const smallMaxHeight = 150;
  const height = smallerBuilding
    ? smallMinHeight + Math.random() * (smallMaxHeight - smallMinHeight)
    : minHeight + Math.random() * (maxHeight - minHeight);

  state.backgroundBuildings.push({ x, width, height });
}

function generateBuilding(index) {
  const previousBuilding = state.buildings[index - 1];

  const x = previousBuilding
    ? previousBuilding.x + previousBuilding.width + 4
    : 0;

  const minWidth = 80;
  const maxWidth = 130;
  const width = minWidth + Math.random() * (maxWidth - minWidth);

  const smallerBuilding = index <= 1 || index >= 6;

  const minHeight = 40;
  const maxHeight = 300;
  const minHeightGorilla = 30;
  const maxHeightGorilla = 150;

  const height = smallerBuilding
    ? minHeightGorilla + Math.random() * (maxHeightGorilla - minHeightGorilla)
    : minHeight + Math.random() * (maxHeight - minHeight);

  // Generate an array of booleans to show if the light is on or off in a room
  const lightsOn = [];
  for (let i = 0; i < 50; i++) {
    const light = Math.random() <= 0.33 ? true : false;
    lightsOn.push(light);
  }

  state.buildings.push({ x, width, height, lightsOn });
}

function calculateScaleAndShift() {
  const lastBuilding = state.buildings.at(-1);
  const totalWidthOfTheCity = lastBuilding.x + lastBuilding.width;

  const horizontalScale = window.innerWidth / totalWidthOfTheCity ?? 1;
  const verticalScale = window.innerHeight / 500;

  state.scale = Math.min(horizontalScale, verticalScale);

  const sceneNeedsToBeShifted = horizontalScale > verticalScale;

  state.shift = sceneNeedsToBeShifted
    ? (window.innerWidth - totalWidthOfTheCity * state.scale) / 2
    : 0;
}

// Event listener for window resize
window.addEventListener("resize", handleResize);

// Handle orientation change on mobile devices
window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 200); // Small delay to ensure proper orientation change
});

// Resize handler function
function handleResize() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  
  // Check if we need to apply mobile optimizations (in case of resize to small width)
  applyMobileOptimizations();
  
  // Recalculate game measurements
  calculateScaleAndShift();
  
  // Reinitialize positions
  initializeBombPosition();
  initializeWindmillPosition();
  
  // Redraw the game
  draw();
}

function initializeBombPosition() {
  const building =
    state.currentPlayer === 1
      ? state.buildings.at(1) // Second building
      : state.buildings.at(-2); // Second last building

  const gorillaX = building.x + building.width / 2;
  const gorillaY = building.height;

  const gorillaHandOffsetX = state.currentPlayer === 1 ? -28 : 28;
  const gorillaHandOffsetY = 107;

  state.bomb.x = gorillaX + gorillaHandOffsetX;
  state.bomb.y = gorillaY + gorillaHandOffsetY;
  state.bomb.velocity.x = 0;
  state.bomb.velocity.y = 0;
  state.bomb.rotation = 0;

  // Initialize the position of the grab area in HTML
  const grabAreaRadius = 15;
  const left = state.bomb.x * state.scale + state.shift - grabAreaRadius;
  const bottom = state.bomb.y * state.scale - grabAreaRadius;

  bombGrabAreaDOM.style.left = `${left}px`;
  bombGrabAreaDOM.style.bottom = `${bottom}px`;
}

function initializeWindmillPosition() {
  // Move windmill into position
  const lastBuilding = state.buildings.at(-1);
  let rooftopY = lastBuilding.height * state.scale;
  let rooftopX =
    (lastBuilding.x + lastBuilding.width / 2) * state.scale + state.shift;

  windmillDOM.style.bottom = `${rooftopY}px`;
  windmillDOM.style.left = `${rooftopX - 100}px`;

  windmillDOM.style.scale = state.scale;

  windInfoDOM.style.bottom = `${rooftopY}px`;
  windInfoDOM.style.left = `${rooftopX - 50}px`;
}

function draw(overlay) {
  ctx.save();

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  drawBackgroundSky();

  // Screen shake after an impact (decays every frame)
  let shakeX = 0;
  let shakeY = 0;
  if (state.shake > 0.4) {
    shakeX = (Math.random() - 0.5) * state.shake;
    shakeY = (Math.random() - 0.5) * state.shake;
    state.shake *= 0.82;
    ctx.translate(shakeX, shakeY);
  } else {
    state.shake = 0;
  }

  // Flip coordinate system upside down
  ctx.translate(0, window.innerHeight);
  ctx.scale(1, -1);

  // Scale and shift view to center
  ctx.translate(state.shift, 0);
  ctx.scale(state.scale, state.scale);

  // Draw scene
  drawBackgroundBuildings();
  drawBuildingsWithBlastHoles();
  drawGorilla(1);
  drawGorilla(2);
  drawBomb();

  // Optional overlay (used for impact effects) - already in scene coordinates
  if (typeof overlay === "function") overlay();

  // Restore transformation
  ctx.restore();
}

// Function to update health bar display
function updateHealthDisplay(player, health) {
  const healthDOM = player === 1 ? health1DOM : health2DOM;
  const healthBarDOM = player === 1 ? healthBar1DOM : healthBar2DOM;
  
  // Update text display
  healthDOM.innerText = health;
  
  // Update health bar width
  healthBarDOM.style.width = health + '%';
  
  // Update health bar color based on health level
  if (health <= 25) {
    healthBarDOM.classList.add('danger');
    healthBarDOM.classList.remove('warning');
  } else if (health <= 50) {
    healthBarDOM.classList.add('warning');
    healthBarDOM.classList.remove('danger');
  } else {
    healthBarDOM.classList.remove('warning');
    healthBarDOM.classList.remove('danger');
  }
}

// Draw background sky, sun/moon, birds, and twinkling stars
function drawBackgroundSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);

  // Use the selected terrain's sky colors (falls back to the classic sky)
  const terrain = gameOptions.terrains.find(
    (item) => item.id === settings.terrain
  );
  const skyColors = terrain && terrain.colors
    ? terrain.colors[settings.mode].sky
    : settings.mode === "dark"
      ? ["#27507F", "#58A8D8"]
      : ["#F8BA85", "#FFC28E"];

  gradient.addColorStop(0, skyColors[1]);
  gradient.addColorStop(1, skyColors[0]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Draw sun (day) or moon (night)
  if (settings.mode === 'light') {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(window.innerWidth - 120, 120, 60, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFF9C4';
    ctx.shadowColor = '#FFF9C4';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(window.innerWidth - 120, 120, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFF';
    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();
  }

  // Draw twinkling stars (night)
  if (settings.mode === "dark") {
    ctx.save();
    for (let star of state.stars) {
      ctx.globalAlpha = star.twinkle || 1;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(star.x, star.y, 1.2 + (star.twinkle || 0) * 1.2, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw birds (day)
  if (settings.mode === 'light' && state.birds) {
    for (let bird of state.birds) {
      drawBird(ctx, bird.x, bird.y, bird.size, bird.wing);
    }
  }
}

// Helper to draw a bird (simple V shape with animated wings)
function drawBird(ctx, x, y, size, wing) {
  ctx.save();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size * 0.4, y - Math.abs(Math.sin(wing)) * size * 0.5);
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * 0.4, y - Math.abs(Math.sin(wing + 1)) * size * 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawBackgroundBuildings() {
  state.backgroundBuildings.forEach((building) => {
    ctx.fillStyle = settings.mode === "dark" ? "#254D7E" : "#947285";
    ctx.fillRect(building.x, 0, building.width, building.height);
  });
}

function drawBuildingsWithBlastHoles() {
  ctx.save();

  state.blastHoles.forEach((blastHole) => {
    ctx.beginPath();

    // Outer shape clockwise
    ctx.rect(
      0,
      0,
      window.innerWidth / state.scale,
      window.innerHeight / state.scale
    );

    // Inner shape counterclockwise
    ctx.arc(blastHole.x, blastHole.y, blastHoleRadius, 0, 2 * Math.PI, true);

    ctx.clip();
  });

  drawBuildings();

  ctx.restore();
}

function drawBuildings() {
  // Get the selected terrain's building color
  const selectedTerrain = gameOptions.terrains.find(terrain => terrain.id === settings.terrain);
  const mode = settings.mode;
  const buildingColor = selectedTerrain ? selectedTerrain.colors[mode].buildings : (mode === "dark" ? "#152A47" : "#4A3C68");
  state.buildings.forEach((building) => {
    // Draw building
    ctx.fillStyle = buildingColor;
    ctx.fillRect(building.x, 0, building.width, building.height);

    // Draw windows
    const windowWidth = 10;
    const windowHeight = 12;
    const gap = 15;

    const numberOfFloors = Math.ceil(
      (building.height - gap) / (windowHeight + gap)
    );
    const numberOfRoomsPerFloor = Math.floor(
      (building.width - gap) / (windowWidth + gap)
    );

    for (let floor = 0; floor < numberOfFloors; floor++) {
      for (let room = 0; room < numberOfRoomsPerFloor; room++) {
        if (building.lightsOn[floor * numberOfRoomsPerFloor + room]) {
          ctx.save();

          ctx.translate(building.x + gap, building.height - gap);
          ctx.scale(1, -1);

          const x = room * (windowWidth + gap);
          const y = floor * (windowHeight + gap);

          ctx.fillStyle = settings.mode === "dark" ? "#5F76AB" : "#EBB6A2";
          ctx.fillRect(x, y, windowWidth, windowHeight);

          ctx.restore();
        }
      }
    }
  });
}

function drawGorilla(player) {
  ctx.save();

  const building =
    player === 1
      ? state.buildings.at(1) // Second building
      : state.buildings.at(-2); // Second last building

  ctx.translate(building.x + building.width / 2, building.height);
  
  // Draw the character image
  const characterWidth = 80;
  const characterHeight = 100;
  
  // Apply 180 degree rotation
  ctx.rotate(Math.PI); // Rotate 180 degrees (π radians)
  
  // Flip the image for player 2
  if (player === 2) {
    ctx.scale(-1, 1);
  }
  
  const playerIndex = player - 1;
  
  // Draw the character image centered at the position with hit effect if needed
  let positionXOffset = 0;
  let positionYOffset = 0;
  let rotationAngle = 0;
  
  if (state.players[playerIndex].isHit) {
    // Apply hit effect - flashing and physical recoil
    ctx.globalAlpha = 0.7 + (Math.sin(state.players[playerIndex].hitTimer / 2) * 0.3);
    
    // Calculate physical reaction based on hit direction and timer
    const hitDirection = playerIndex === 0 ? -1 : 1; // Opposite direction of hit
    const recoilAmount = Math.max(state.players[playerIndex].hitTimer / 20, 0); // Gradually reduce recoil
    
    // Apply horizontal recoil
    positionXOffset = hitDirection * recoilAmount * 15;
    
    // Apply vertical bounce and rotation based on hit timer
    const bouncePhase = state.players[playerIndex].hitTimer % 10;
    positionYOffset = bouncePhase < 5 ? bouncePhase : 10 - bouncePhase;
    rotationAngle = hitDirection * (recoilAmount * 0.2);
    
    // Decrease hit timer
    state.players[playerIndex].hitTimer--;
    if (state.players[playerIndex].hitTimer <= 0) {
      state.players[playerIndex].isHit = false;
      ctx.globalAlpha = 1.0;
    }
  }
  
  // Determine which character to use based on player
  const characterId = player === 1 ? settings.player1Character : settings.player2Character;
  const selectedCharacter = gameOptions.characters.find(char => char.id === characterId);
  
  // Also update the global character setting to match the current player's character
  if (player === state.currentPlayer) {
    settings.character = characterId;
  }
  
  if (selectedCharacter && selectedCharacter.type !== 'image') {
    // Draw programmatically created character
    // Pass velocity info for hand animation during aiming
    const aimingData = {
      isAiming: state.phase === "aiming" && player === state.currentPlayer,
      velocityX: state.bomb.velocity.x,
      velocityY: state.bomb.velocity.y
    };
    selectedCharacter.draw(ctx, player === 2, aimingData); // Pass lookingRight and aiming data
  } else {
    // Draw the default character image centered at the position
    // Adjust y-position to account for rotation
    ctx.drawImage(
      characterImage, 
      -characterWidth/2, 
      -characterHeight, 
      characterWidth, 
      characterHeight
    );
  }
  
  // Reset opacity
  ctx.globalAlpha = 1.0;
  
  // Draw thought bubbles for thinking during aiming
  ctx.rotate(Math.PI); // Rotate back to normal for thought bubbles
  drawGorillaThoughtBubbles(player);

  ctx.restore();
}

// Function to initialize game options panel with selection buttons
function initializeGameOptionsPanel() {
  // Show how many options are available (also handy to spot a stale cache)
  const charactersHeading = document.getElementById("characters-heading");
  if (charactersHeading) {
    charactersHeading.textContent = `Characters (${gameOptions.characters.length})`;
  }
  const terrainsHeading = document.getElementById("terrains-heading");
  if (terrainsHeading) {
    terrainsHeading.textContent = `Terrains (${gameOptions.terrains.length})`;
  }

  // Create player character selection headers
  const player1Header = document.createElement('div');
  player1Header.className = 'player-header player1-header';
  player1Header.textContent = 'Player 1 Character';
  player1Header.style.padding = '5px';
  player1Header.style.color = '#3498db';
  player1Header.style.fontWeight = 'bold';
  player1Header.style.borderBottom = '2px solid #3498db';
  player1Header.style.marginBottom = '10px';
  characterOptionsContainer.appendChild(player1Header);
  
  // Create character selection container for Player 1
  const player1CharacterOptions = document.createElement('div');
  player1CharacterOptions.className = 'player-character-options';
  player1CharacterOptions.style.display = 'flex';
  player1CharacterOptions.style.flexWrap = 'wrap';
  player1CharacterOptions.style.gap = '10px';
  player1CharacterOptions.style.marginBottom = '15px';
  characterOptionsContainer.appendChild(player1CharacterOptions);
  
  // Create character selection buttons for Player 1
  gameOptions.characters.forEach(character => {
    const button = createOptionButton(character.name, character.id);
    player1CharacterOptions.appendChild(button);
    
    // Create a small canvas to preview the character
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    button.prepend(canvas);
    
    // Draw character preview
    const ctx = canvas.getContext('2d');
    ctx.translate(30, 50);
    
    if (character.type === 'image') {
      ctx.drawImage(characterImage, -20, -50, 40, 50);
    } else {
      character.draw(ctx, false);
    }
    
    // Select button if it's Player 1's current character
    if (character.id === settings.player1Character) {
      button.classList.add('selected');
    }
    
    // Add click event
    button.addEventListener('click', () => {
      // Remove selected class from all Player 1 buttons
      Array.from(player1CharacterOptions.children).forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Add selected class to this button
      button.classList.add('selected');
      
      // Update settings for Player 1
      settings.player1Character = character.id;
      savePreferences();
      SoundEngine.playClick();
      
      // Also update global character if it's Player 1's turn
      if (state.currentPlayer === 1) {
        settings.character = character.id;
      }
      
      // Update the game display
      draw();
    });
  });
  
  // Player 2 header
  const player2Header = document.createElement('div');
  player2Header.className = 'player-header player2-header';
  player2Header.textContent = 'Player 2 / Computer Character';
  player2Header.style.padding = '5px';
  player2Header.style.color = '#e74c3c';
  player2Header.style.fontWeight = 'bold';
  player2Header.style.borderBottom = '2px solid #e74c3c';
  player2Header.style.marginBottom = '10px';
  characterOptionsContainer.appendChild(player2Header);
  
  // Create character selection container for Player 2
  const player2CharacterOptions = document.createElement('div');
  player2CharacterOptions.className = 'player-character-options';
  player2CharacterOptions.style.display = 'flex';
  player2CharacterOptions.style.flexWrap = 'wrap';
  player2CharacterOptions.style.gap = '10px';
  characterOptionsContainer.appendChild(player2CharacterOptions);
  
  // Create character selection buttons for Player 2
  gameOptions.characters.forEach(character => {
    const button = createOptionButton(character.name, character.id);
    player2CharacterOptions.appendChild(button);
    
    // Create a small canvas to preview the character
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    button.prepend(canvas);
    
    // Draw character preview
    const ctx = canvas.getContext('2d');
    ctx.translate(30, 50);
    
    if (character.type === 'image') {
      ctx.drawImage(characterImage, -20, -50, 40, 50);
    } else {
      character.draw(ctx, false);
    }
    
    // Select button if it's Player 2's current character
    if (character.id === settings.player2Character) {
      button.classList.add('selected');
    }
    
    // Add click event
    button.addEventListener('click', () => {
      // Remove selected class from all Player 2 buttons
      Array.from(player2CharacterOptions.children).forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Add selected class to this button
      button.classList.add('selected');
      
      // Update settings for Player 2
      settings.player2Character = character.id;
      savePreferences();
      SoundEngine.playClick();
      
      // Also update global character if it's Player 2's turn
      if (state.currentPlayer === 2) {
        settings.character = character.id;
      }
      
      // Update the game display
      draw();
    });
  });
  
  // Create terrain selection buttons
  gameOptions.terrains.forEach(terrain => {
    const button = createOptionButton(terrain.name, terrain.id);
    terrainOptionsContainer.appendChild(button);
    
    // Create a small canvas to preview the terrain
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 60;
    button.prepend(canvas);
    
    // Draw terrain preview
    const ctx = canvas.getContext('2d');
    
    // Sky color
    const gradient = ctx.createLinearGradient(0, 0, 0, 60);
    const mode = settings.mode;
    gradient.addColorStop(0, terrain.colors[mode].sky[1]);
    gradient.addColorStop(1, terrain.colors[mode].sky[0]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 80, 60);
    
    // Procedurally generate and draw mini buildings for preview
    let previewBuildings = [];
    let prev = null;
    for (let i = 0; i < 4; i++) { // Fewer buildings for preview
      const b = terrain.generateBuilding(i, prev);
      // Scale down for preview
      const scaleX = 0.35;
      const scaleY = 0.18;
      previewBuildings.push({
        x: b.x * scaleX + 5, // add margin
        width: b.width * scaleX,
        height: b.height * scaleY,
        lightsOn: b.lightsOn,
        hasSpire: b.hasSpire,
        spireHeight: b.spireHeight,
        mountainType: b.mountainType,
        isIsland: b.isIsland
      });
      prev = b;
    }
    // Draw the preview buildings
    ctx.save();
    ctx.fillStyle = terrain.colors[mode].buildings;
    previewBuildings.forEach((b, idx) => {
      // Draw main shape
      ctx.fillRect(b.x, 60 - b.height, b.width, b.height);
      // Draw spire if present (for futuristic terrain)
      if (b.hasSpire && b.spireHeight) {
        ctx.fillRect(b.x + b.width / 2 - 2, 60 - b.height - b.spireHeight, 4, b.spireHeight);
      }
      // Draw snow caps or windows (for mountains, city, etc.)
      if (b.lightsOn && b.lightsOn.length > 0) {
        ctx.fillStyle = terrain.colors[mode].windows;
        for (let w = 0; w < 8; w++) {
          for (let h = 0; h < 3; h++) {
            const idxFlat = w + h * 8;
            if (b.lightsOn[idxFlat]) {
              ctx.fillRect(
                b.x + 4 + w * (b.width - 8) / 8,
                60 - b.height + 4 + h * (b.height - 8) / 3,
                3,
                5
              );
            }
          }
        }
        ctx.fillStyle = terrain.colors[mode].buildings;
      }
    });
    ctx.restore();
    
    // Select button if it's the current terrain
    if (terrain.id === settings.terrain) {
      button.classList.add('selected');
    }
    
    // Add click event
    button.addEventListener('click', () => {
      // Remove selected class from all buttons
      Array.from(terrainOptionsContainer.children).forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Add selected class to this button
      button.classList.add('selected');
      
      // Update settings
      settings.terrain = terrain.id;
      savePreferences();
      SoundEngine.playClick();
      
      // Rebuild the game world with the new terrain
      updateBuildingsForTerrain();
      
      // Reset game state
      state.currentPlayer = 1;
      state.bombInMotion = false;
      initializeBombPosition();
      
      // Close the options panel
      document.getElementById('game-options-panel').style.display = 'none';
      
      // Redraw the game
      draw();
    });
  });
  
  // Create ball selection buttons
  gameOptions.balls.forEach(ball => {
    const button = createOptionButton(ball.name, ball.id);
    ballOptionsContainer.appendChild(button);
    
    // Create a small canvas to preview the ball
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    button.prepend(canvas);
    
    // Draw ball preview
    const ctx = canvas.getContext('2d');
    ctx.translate(30, 30);
    ball.draw(ctx, 0);
    
    // Select button if it's the current ball
    if (ball.id === settings.ball) {
      button.classList.add('selected');
    }
    
    // Add click event
    button.addEventListener('click', () => {
      // Remove selected class from all buttons
      Array.from(ballOptionsContainer.children).forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Add selected class to this button
      button.classList.add('selected');
      
      // Update settings
      settings.ball = ball.id;
      savePreferences();
      SoundEngine.playClick();
    });
  });
  
  // Create effect selection buttons
  gameOptions.effects.forEach(effect => {
    const button = createOptionButton(effect.name, effect.id);
    effectOptionsContainer.appendChild(button);
    
    // Create a small canvas to preview the effect
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    button.prepend(canvas);
    
    // Draw effect preview
    const ctx = canvas.getContext('2d');
    effect.draw(ctx, 30, 30, 25, 0.7); // Draw effect at 70% progress
    
    // Select button if it's the current effect
    if (effect.id === settings.effect) {
      button.classList.add('selected');
    }
    
    // Add click event
    button.addEventListener('click', () => {
      // Remove selected class from all buttons
      Array.from(effectOptionsContainer.children).forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Add selected class to this button
      button.classList.add('selected');
      
      // Update settings
      settings.effect = effect.id;
      savePreferences();
      SoundEngine.playClick();
    });
  });
}

// Helper function to create option buttons
function createOptionButton(name, id) {
  const button = document.createElement('div');
  button.classList.add('option-button');
  button.dataset.id = id;
  
  const span = document.createElement('span');
  span.textContent = name;
  button.appendChild(span);
  
  return button;
}

// Update buildings based on selected terrain
function updateBuildingsForTerrain() {
  // Get the selected terrain
  const terrain = gameOptions.terrains.find(t => t.id === settings.terrain);
  if (!terrain) return;

  // Reset buildings and the holes blown into the previous world
  state.buildings = [];
  state.blastHoles = [];

  // Generate buildings with the selected terrain's building generator
  for (let i = 0; i < 8; i++) {
    const previousBuilding = state.buildings[i - 1];
    const building = terrain.generateBuilding(i, previousBuilding);
    state.buildings.push(building);
  }

  // Update scale and shift
  calculateScaleAndShift();

  // Reset gorilla + windmill positions
  initializeBombPosition();
  initializeWindmillPosition();

  // Clear keyboard aim so the next throw starts from a sane default
  lastAim[0] = { angle: 45, speed: 90 };
  lastAim[1] = { angle: 45, speed: 90 };

  builtTerrain = settings.terrain;
}

// No longer needed as we're using the image instead
function drawGorillaBody() {
  // This function is kept for compatibility but is now empty
  // as we're using character.png instead of drawing shapes
}

// Helper function for drawing rounded rectangles (kept for reference)
function drawRoundedRect(context, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  return context;
}

// Draw the impact effect at the given position (world coordinates)
function drawExplosionEffect(x, y, size = 30) {
  const selectedEffect = gameOptions.effects.find(
    (effect) => effect.id === settings.effect
  );

  if (!selectedEffect) return;

  let effectProgress = 0;

  function animateEffect() {
    // The scene is repainted every frame, so the effect does not smear
    // and it is drawn with the same flipped/scaled coordinate system.
    draw(() => selectedEffect.draw(ctx, x, y, size, effectProgress));

    effectProgress += 0.05;

    if (effectProgress <= 1) {
      effectAnimationID = requestAnimationFrame(animateEffect);
    } else {
      cancelAnimationFrame(effectAnimationID);
      effectAnimationID = undefined;
      draw(); // clean up the last frame
    }
  }

  animateEffect();
}

// No longer needed as we're using the image instead
function drawGorillaLeftArm(player) {
  // This function is kept for compatibility but is now empty
  // as we're using character.png instead of drawing shapes
}

// No longer needed as we're using the image instead
function drawGorillaRightArm(player) {
  // This function is kept for compatibility but is now empty
  // as we're using character.png instead of drawing shapes
}

// No longer needed as we're using the image instead
function drawGorillaFace(player) {
  // This function is kept for compatibility but is now empty
  // as we're using character.png instead of drawing shapes
}

function drawGorillaThoughtBubbles(player) {
  if (state.phase === "aiming") {
    const currentPlayerIsComputer =
      (settings.numberOfPlayers === 0 &&
        state.currentPlayer === 1 &&
        player === 1) ||
      (settings.numberOfPlayers !== 2 &&
        state.currentPlayer === 2 &&
        player === 2);

    if (currentPlayerIsComputer) {
      ctx.save();
      ctx.scale(1, -1);

      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("?", 0, -90);

      ctx.font = "10px sans-serif";

      ctx.rotate((5 / 180) * Math.PI);
      ctx.fillText("?", 0, -90);

      ctx.rotate((-10 / 180) * Math.PI);
      ctx.fillText("?", 0, -90);

      ctx.restore();
    }
  }
}

function drawBomb() {
  // The aiming guides must stay visible on both the dark and light sky
  const guideColor =
    settings.mode === "dark"
      ? "rgba(255, 255, 255, 0.75)"
      : "rgba(25, 25, 45, 0.55)";

  ctx.save();
  ctx.translate(state.bomb.x, state.bomb.y);

  if (state.phase === "aiming") {
    // Move the bomb with the mouse while aiming
    ctx.translate(-state.bomb.velocity.x / 6.25, -state.bomb.velocity.y / 6.25);

    // Draw throwing trajectory
    ctx.strokeStyle = guideColor;
    ctx.setLineDash([3, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(state.bomb.velocity.x, state.bomb.velocity.y);
    ctx.stroke();

    // Get selected ball
    const selectedBall = gameOptions.balls.find(ball => ball.id === settings.ball);
    
    if (selectedBall) {
      // Draw the selected ball for aiming
      selectedBall.draw(ctx, 0); // 0 rotation for aiming
    } else {
      // Draw circle as fallback
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Ring around the bomb while a special skill is armed
    if (state.activeSkill && SKILLS[state.activeSkill]) {
      ctx.strokeStyle = SKILLS[state.activeSkill].color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, 2 * Math.PI);
      ctx.stroke();
    }
  } else if (state.phase === "in flight") {
    // Get selected ball
    const selectedBall = gameOptions.balls.find(ball => ball.id === settings.ball);
    
    if (selectedBall) {
      // Draw the selected ball in flight
      selectedBall.draw(ctx, state.bomb.rotation);
    } else {
      // Draw rotated banana as fallback
      ctx.fillStyle = "white";
      ctx.rotate(state.bomb.rotation);
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.quadraticCurveTo(0, 12, 8, -2);
      ctx.quadraticCurveTo(0, 2, -8, -2);
      ctx.fill();
    }
  } else {
    // Get selected ball
    const selectedBall = gameOptions.balls.find(ball => ball.id === settings.ball);
    
    if (selectedBall) {
      // Draw the selected ball when not in flight or aiming
      selectedBall.draw(ctx, 0);
    } else {
      // Draw circle as fallback
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Restore transformation
  ctx.restore();

  // Indicator showing if the bomb is above the screen
  if (state.bomb.y > window.innerHeight / state.scale) {
    ctx.beginPath();
    ctx.strokeStyle = guideColor;
    const distance = state.bomb.y - window.innerHeight / state.scale;
    ctx.moveTo(state.bomb.x, window.innerHeight / state.scale - 10);
    ctx.lineTo(state.bomb.x, window.innerHeight / state.scale - distance);
    ctx.moveTo(state.bomb.x, window.innerHeight / state.scale - 10);
    ctx.lineTo(state.bomb.x - 5, window.innerHeight / state.scale - 15);
    ctx.moveTo(state.bomb.x, window.innerHeight / state.scale - 10);
    ctx.lineTo(state.bomb.x + 5, window.innerHeight / state.scale - 15);
    ctx.stroke();
  }

  // Indicator showing the starting position of the bomb
  if (state.bomb.highlight) {
    ctx.beginPath();
    ctx.strokeStyle = guideColor;
    ctx.lineWidth = 2;
    ctx.moveTo(state.bomb.x, state.bomb.y + 20);
    ctx.lineTo(state.bomb.x, state.bomb.y + 120);
    ctx.moveTo(state.bomb.x, state.bomb.y + 20);
    ctx.lineTo(state.bomb.x - 5, state.bomb.y + 25);
    ctx.moveTo(state.bomb.x, state.bomb.y + 20);
    ctx.lineTo(state.bomb.x + 5, state.bomb.y + 25);
    ctx.stroke();
  }
}

// Mouse and Touch Event handlers
function handleDragStart(clientX, clientY) {
  if (state.phase !== "aiming") return;

  // Ignore aiming while the computer is playing
  if (settings.numberOfPlayers === 0) return;
  if (settings.numberOfPlayers === 1 && state.currentPlayer === 2) return;

  hideInstructions();
  isDragging = true;
  document.body.style.cursor = "grabbing";

  // Store raw client coordinates: the delta is what matters, and mixing
  // CSS pixels with devicePixelRatio broke aiming on retina screens.
  dragStartX = clientX;
  dragStartY = clientY;
}

function updateAimFromPointer(clientX, clientY) {
  const deltaX = clientX - dragStartX;
  const deltaY = clientY - dragStartY;

  state.bomb.velocity.x = -deltaX;
  state.bomb.velocity.y = deltaY;
  setInfo(deltaX, deltaY);

  lastAim[state.currentPlayer - 1] = currentAim();

  draw();
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  document.body.style.cursor = "default";

  // A tap without dragging should not fire a random shot
  if (Math.hypot(state.bomb.velocity.x, state.bomb.velocity.y) < 6) {
    initializeBombPosition();
    draw();
    return;
  }

  throwBomb();
}

// Mouse event handlers
bombGrabAreaDOM.addEventListener("mousedown", function (e) {
  e.preventDefault();
  handleDragStart(e.clientX, e.clientY);
});

window.addEventListener("mousemove", function (e) {
  if (isDragging) updateAimFromPointer(e.clientX, e.clientY);
});

window.addEventListener("mouseup", function () {
  endDrag();
});

// Touch event handlers - listening on window keeps the drag alive even
// when the finger leaves the small grab area
bombGrabAreaDOM.addEventListener(
  "touchstart",
  function (e) {
    e.preventDefault();
    if (e.touches && e.touches[0]) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  },
  { passive: false }
);

window.addEventListener(
  "touchmove",
  function (e) {
    if (!isDragging) return;
    e.preventDefault();
    if (e.touches && e.touches[0]) {
      updateAimFromPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  },
  { passive: false }
);

window.addEventListener("touchend", function () {
  endDrag();
});

window.addEventListener("touchcancel", function () {
  endDrag();
});

function setInfo(deltaX, deltaY) {
  const hypotenuse = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  if (hypotenuse === 0) return;
  const angleInRadians = Math.asin(deltaY / hypotenuse);
  const angleInDegrees = (angleInRadians / Math.PI) * 180;

  if (state.currentPlayer === 1) {
    angle1DOM.innerText = Math.round(angleInDegrees);
    velocity1DOM.innerText = Math.round(hypotenuse);
  } else {
    angle2DOM.innerText = Math.round(angleInDegrees);
    velocity2DOM.innerText = Math.round(hypotenuse);
  }
}

// ------------------------------------------------------------
// Keyboard aiming: arrow keys + space (great on laptops/trackpads)
// ------------------------------------------------------------
function isHumanTurn() {
  if (gameOptionsPanel && gameOptionsPanel.style.display === "block") return false;
  if (state.phase !== "aiming") return false;
  if (settings.numberOfPlayers === 0) return false;
  if (settings.numberOfPlayers === 1 && state.currentPlayer === 2) return false;
  return true;
}

// Read the current angle/speed from the bomb velocity
function currentAim() {
  const velocity = state.bomb.velocity;
  const speed = Math.hypot(velocity.x, velocity.y);

  if (speed < 1) {
    return { ...lastAim[state.currentPlayer - 1] };
  }

  const angle = (Math.atan2(Math.abs(velocity.y), Math.abs(velocity.x)) * 180) / Math.PI;
  return { angle, speed };
}

function applyAim(angle, speed) {
  // Keep the shot inside sensible limits
  angle = Math.min(89, Math.max(0, angle));
  speed = Math.min(220, Math.max(10, speed));

  const radians = (angle * Math.PI) / 180;
  const direction = state.currentPlayer === 1 ? 1 : -1;

  state.bomb.velocity.x = Math.cos(radians) * speed * direction;
  state.bomb.velocity.y = Math.sin(radians) * speed;

  lastAim[state.currentPlayer - 1] = { angle, speed };
  setInfo(-state.bomb.velocity.x, state.bomb.velocity.y);
  hideInstructions();
  draw();
}

const AIM_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"];

window.addEventListener("keydown", function (event) {
  if (!AIM_KEYS.includes(event.key)) return;
  if (!isHumanTurn()) return;

  event.preventDefault();
  const aim = currentAim();

  switch (event.key) {
    case "ArrowUp":
      applyAim(aim.angle + 2, aim.speed);
      break;
    case "ArrowDown":
      applyAim(aim.angle - 2, aim.speed);
      break;
    case "ArrowRight":
      applyAim(aim.angle, aim.speed + 5);
      break;
    case "ArrowLeft":
      applyAim(aim.angle, aim.speed - 5);
      break;
    case " ":
    case "Enter":
      if (Math.hypot(state.bomb.velocity.x, state.bomb.velocity.y) < 1) {
        applyAim(aim.angle, aim.speed);
      }
      throwBomb();
      break;
  }
});

function computerThrow() {
  // The computer may spend one of its special skills
  state.pendingSkill = chooseComputerSkill();

  const numberOfSimulations = 2 + state.round * 3;
  const bestThrow = runSimulations(numberOfSimulations);

  initializeBombPosition();
  state.bomb.velocity.x = bestThrow.velocityX;
  state.bomb.velocity.y = bestThrow.velocityY;
  setInfo(bestThrow.velocityX, bestThrow.velocityY);

  // Draw the aiming gorilla
  draw();

  // Make it look like the computer is thinking for a second
  delayTimeoutID = setTimeout(throwBomb, 1000);
}

// Simulate multiple throws and pick the best
function runSimulations(numberOfSimulations) {
  let bestThrow = {
    velocityX: undefined,
    velocityY: undefined,
    distance: Infinity,
  };
  simulationMode = true;

  // Calculating the center position of the enemy
  const enemyBuilding =
    state.currentPlayer === 1
      ? state.buildings.at(-2) // Second last building
      : state.buildings.at(1); // Second building
  const enemyX = enemyBuilding.x + enemyBuilding.width / 2;
  const enemyY = enemyBuilding.height + 30;

  for (let i = 0; i < numberOfSimulations; i++) {
    // Pick a random angle and velocity
    const angleInDegrees = -10 + Math.random() * 100;
    const angleInRadians = (angleInDegrees / 180) * Math.PI;
    const velocity = 40 + Math.random() * 130;

    // Calculate the horizontal and vertical velocity
    const direction = state.currentPlayer === 1 ? 1 : -1;
    const velocityX = Math.cos(angleInRadians) * velocity * direction;
    const velocityY = Math.sin(angleInRadians) * velocity;

    initializeBombPosition();
    state.bomb.velocity.x = velocityX;
    state.bomb.velocity.y = velocityY;

    throwBomb();

    // Calculating the distance between the simulated impact and the enemy
    const distance = Math.sqrt(
      (enemyX - simulationImpact.x) ** 2 + (enemyY - simulationImpact.y) ** 2
    );

    // If the current impact is closer to the enemy
    // than any of the previous simulations then pick this one
    if (distance < bestThrow.distance) {
      bestThrow = { velocityX, velocityY, distance };
    }
  }

  simulationMode = false;
  return bestThrow;
}

function throwBomb() {
  // Guard against extra throws (double taps, input after the game ended)
  if (!simulationMode && state.phase !== "aiming") return;

  // Attach and spend the special skill for this throw
  if (!simulationMode) {
    const chosen = state.activeSkill || state.pendingSkill || null;
    const pool = state.skills[state.currentPlayer - 1];

    if (chosen && pool && pool[chosen] > 0) {
      state.throwSkill = chosen;
      pool[chosen] -= 1;
    } else {
      state.throwSkill = null;
    }

    state.activeSkill = null;
    state.pendingSkill = null;
    renderSkills();
  }

  // Reset hit tracking for both players at the start of each throw
  state.players[0].wasHitThisThrow = false;
  state.players[1].wasHitThisThrow = false;
  
  if (simulationMode) {
    previousAnimationTimestamp = 0;
    animate(16);
  } else {
    state.phase = "in flight";
    previousAnimationTimestamp = undefined;
    animationFrameRequestID = requestAnimationFrame(animate);
  }
  SoundEngine.playThrow();
}

function animate(timestamp) {
  if (previousAnimationTimestamp === undefined) {
    previousAnimationTimestamp = timestamp;
    animationFrameRequestID = requestAnimationFrame(animate);
    return;
  }

  const elapsedTime = timestamp - previousAnimationTimestamp;

  // We break down every animation cycle into 10 tiny movements for greater hit detection precision
  const hitDetectionPrecision = 10;
  for (let i = 0; i < hitDetectionPrecision; i++) {
    moveBomb(elapsedTime / hitDetectionPrecision);

    // Hit detection - store results to avoid multiple calls
    const hitFrame = checkFrameHit();
    const hitBuilding = checkBuildingHit();
    const miss = hitFrame || hitBuilding; // Bomb got off-screen or hit a building
    const hit = checkGorillaHit(); // Bomb hit the enemy

    if (simulationMode && (hit || miss)) {
      simulationImpact = { x: state.bomb.x, y: state.bomb.y };
      return; // Simulation ended, return from the loop
    }
    
    // Draw explosion effect if hit or building hit
    if (!simulationMode && (hit || hitBuilding)) {
      // Draw explosion effect at the exact hit location
      const hitX = state.lastHitPoint ? state.lastHitPoint.x : state.bomb.x;
      const hitY = state.lastHitPoint ? state.lastHitPoint.y : state.bomb.y;
      const throwSkill = SKILLS[state.throwSkill];
      state.shake = throwSkill ? throwSkill.shake : 12;
      drawExplosionEffect(
        hitX,
        hitY,
        throwSkill ? throwSkill.explosionSize : 30
      );
      if (throwSkill) {
        addBlastScars(hitX, hitY, throwSkill.blastRadius, throwSkill.blastHoles);
      }
      if (state.throwSkill === "nuke") triggerFlash();
      SoundEngine.playExplosion(
        state.throwSkill === "nuke" ? 3 : state.throwSkill === "rocket" ? 2 : 1
      );
    }

    // Handle the case when we hit a building or the bomb got off-screen
    const enemyPlayer = state.currentPlayer === 1 ? 2 : 1;
    const enemyDefeated =
      hit && state.players[enemyPlayer - 1].health <= 0;

    // The gorilla stands on the roof, so a bomb can touch the gorilla and
    // the building at the same time. A defeat always wins over a miss.
    if (enemyDefeated) {
      state.phase = "celebrating";
      announceWinner();
      draw();
      return;
    }

    if (miss) {
      endTurn(50);
      return;
    }

    // Handle the case when we hit the enemy but it is not defeated yet
    if (hit) {
      endTurn(1000); // Delay so the hit animation is visible
      return;
    }
  }

  if (!simulationMode) draw();

  // Continue the animation loop
  previousAnimationTimestamp = timestamp;
  if (simulationMode) {
    animate(timestamp + 16);
  } else {
    animationFrameRequestID = requestAnimationFrame(animate);
  }
}

// Finish a turn: switch players and hand over to the computer if needed
function endTurn(computerDelay) {
  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  if (state.currentPlayer === 1) state.round += 1;
  state.phase = "aiming";
  state.throwSkill = null;
  state.activeSkill = null;
  state.pendingSkill = null;
  initializeBombPosition();
  renderSkills();
  draw();

  const computerThrowsNext =
    settings.numberOfPlayers === 0 ||
    (settings.numberOfPlayers === 1 && state.currentPlayer === 2);

  if (computerThrowsNext) setTimeout(computerThrow, computerDelay);
}

function moveBomb(elapsedTime) {
  const multiplier = elapsedTime / 200;

  // Adjust trajectory by wind
  state.bomb.velocity.x += state.windSpeed * multiplier;

  // Adjust trajectory by gravity
  state.bomb.velocity.y -= 20 * multiplier;

  // Calculate new position
  state.bomb.x += state.bomb.velocity.x * multiplier;
  state.bomb.y += state.bomb.velocity.y * multiplier;

  // Rotate according to the direction
  const direction = state.currentPlayer === 1 ? -1 : +1;
  state.bomb.rotation += direction * 5 * multiplier;
}

function checkFrameHit() {
  // Stop throw animation once the bomb gets out of the left, bottom, or right edge of the screen
  if (
    state.bomb.y < 0 ||
    state.bomb.x < -state.shift / state.scale ||
    state.bomb.x > (window.innerWidth - state.shift) / state.scale
  ) {
    return true; // The bomb is off-screen
  }
}

function checkBuildingHit() {
  for (let i = 0; i < state.buildings.length; i++) {
    const building = state.buildings[i];
    if (
      state.bomb.x + 4 > building.x &&
      state.bomb.x - 4 < building.x + building.width &&
      state.bomb.y - 4 < 0 + building.height
    ) {
      // Check if the bomb is inside the blast hole of a previous impact
      for (let j = 0; j < state.blastHoles.length; j++) {
        const blastHole = state.blastHoles[j];

        // Check how far the bomb is from the center of a previous blast hole
        const horizontalDistance = state.bomb.x - blastHole.x;
        const verticalDistance = state.bomb.y - blastHole.y;
        const distance = Math.sqrt(
          horizontalDistance ** 2 + verticalDistance ** 2
        );
        if (distance < blastHoleRadius) {
          // The bomb is inside of the rectangle of a building,
          // but a previous bomb already blew off this part of the building
          return false;
        }
      }

      if (!simulationMode) {
        // Store exact hit location for effect placement
        const hitPoint = { 
          x: state.bomb.x, 
          y: state.bomb.y,
          isBuilding: true,
          buildingIndex: i
        };
        state.blastHoles.push(hitPoint);
        state.lastHitPoint = hitPoint; // Store for effect placement
      }
      return true; // Building hit
    }
  }
  return false; // No building was hit
}

function checkGorillaHit() {
  // Determine which player is the enemy (the one being targeted by the current player)
  const enemyPlayer = state.currentPlayer === 1 ? 2 : 1;
  
  // Get the building where the enemy is standing
  const enemyBuilding = enemyPlayer === 1
    ? state.buildings.at(1) // Player 1's building (index 1)
    : state.buildings.at(-2); // Player 2's building (second to last)
  
  if (!enemyBuilding) return false;

  // Define the hitbox around the character image
  const characterWidth = 50; // Slightly wider hitbox for better accuracy
  const characterHeight = 80; // Taller hitbox to match character height better
  
  // Calculate character position (center bottom of the building)
  const characterX = enemyBuilding.x + enemyBuilding.width / 2;
  const characterY = enemyBuilding.height;
  const bombRadius = 5; // Radius of the bomb for more precise collision
  
  // Check if bomb is within character hitbox with bomb radius consideration
  const hit = (
    state.bomb.x + bombRadius > characterX - characterWidth/2 && 
    state.bomb.x - bombRadius < characterX + characterWidth/2 && 
    state.bomb.y + bombRadius > characterY - characterHeight/4 && // Adjust Y position for better alignment
    state.bomb.y - bombRadius < characterY + characterHeight
  );
  
  if (hit) {
    // Only process hit if we haven't already hit this throw
    const playerIndex = enemyPlayer - 1; // Convert to 0-based index
    
    // Make sure we're not hitting ourselves
    if (playerIndex === state.currentPlayer - 1) {
      console.log("Warning: Attempted to hit self, ignoring");
      return false;
    }
    
    if (!state.players[playerIndex].wasHitThisThrow) {
      // Reduce health when hit (special skills hurt a lot more)
      const skill = SKILLS[state.throwSkill];
      const damage = skill ? skill.damage : 25;
      state.players[playerIndex].health = Math.max(0, state.players[playerIndex].health - damage);
      state.players[playerIndex].isHit = true;
      state.players[playerIndex].hitTimer = 30; // Animation frames
      state.players[playerIndex].wasHitThisThrow = true; // Mark as hit this throw
      
      // Play hit sound
      SoundEngine.playHit();
      
      // Update health display for the HIT player (enemy)
      updateHealthDisplay(enemyPlayer, state.players[playerIndex].health);
      
      // Store exact hit location for effect placement
      state.lastHitPoint = { 
        x: state.bomb.x, 
        y: state.bomb.y,
        isCharacter: true,
        playerIndex: playerIndex
      };
      
      // Check if player is defeated
      if (state.players[playerIndex].health <= 0) {
        return true; // Enemy defeated
      }
      
      // Add visual feedback
      const hitEffect = document.createElement('div');
      hitEffect.className = 'hit-effect';
      hitEffect.style.left = `${state.bomb.x}px`;
      hitEffect.style.top = `${state.bomb.y}px`;
      document.body.appendChild(hitEffect);
      
      // Remove effect after animation
      setTimeout(() => hitEffect.remove(), 1000);
      
      console.log(`Player ${enemyPlayer} hit! Health: ${state.players[playerIndex].health}%`);
    }
    
    return true; // Return true to indicate a hit occurred
  }
  
  return false;
}

function announceWinner() {
  if (state.winnerAnnounced) return;
  state.winnerAnnounced = true;

  if (settings.numberOfPlayers === 0) {
    winnerDOM.innerText = `Computer ${state.currentPlayer}`;
  } else if (settings.numberOfPlayers === 1 && state.currentPlayer === 1) {
    winnerDOM.innerText = `You`;
  } else if (settings.numberOfPlayers === 1 && state.currentPlayer === 2) {
    winnerDOM.innerText = `Computer`;
  } else {
    winnerDOM.innerText = `Player ${state.currentPlayer}`;
  }

  // Persist the win and refresh the scoreboard + overlay
  recordWin(state.currentPlayer);
  renderSkills();
  SoundEngine.playWin();
  showCongratulations();
}

singlePlayerButtonDOM.forEach((button) =>
  button.addEventListener("click", () => {
    settings.numberOfPlayers = 1;
    gameModeDOM.innerHTML = "Player vs. Computer";
    name1DOM.innerText = "Player";
    name2DOM.innerText = "Computer";

    SoundEngine.playClick();
    renderScores();
    newGame();
  })
);

twoPlayersButtonDOM.forEach((button) =>
  button.addEventListener("click", () => {
    settings.numberOfPlayers = 2;
    gameModeDOM.innerHTML = "Player vs. Player";
    name1DOM.innerText = "Player 1";
    name2DOM.innerText = "Player 2";

    SoundEngine.playClick();
    renderScores();
    newGame();
  })
);

autoPlayButtonDOM.forEach((button) =>
  button.addEventListener("click", () => {
    settings.numberOfPlayers = 0;
    name1DOM.innerText = "Computer 1";
    name2DOM.innerText = "Computer 2";

    SoundEngine.playClick();
    renderScores();
    newGame();
  })
);

function generateWindSpeed() {
  // Generate a random number between -10 and +10
  return -10 + Math.random() * 20;
}

function setWindMillRotation() {
  const rotationSpeed = Math.abs(50 / state.windSpeed);
  windmillHeadDOM.style.animationDirection =
    state.windSpeed > 0 ? "normal" : "reverse";
  windmillHeadDOM.style.animationDuration = `${rotationSpeed}s`;

  windSpeedDOM.innerText = Math.round(state.windSpeed);
}

window.addEventListener("mousemove", function (e) {
  settingsDOM.style.opacity = 1;
  info1DOM.style.opacity = 1;
  info2DOM.style.opacity = 1;
});

const enterFullscreen = document.getElementById("enter-fullscreen");
const exitFullscreen = document.getElementById("exit-fullscreen");

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    enterFullscreen.setAttribute("stroke", "transparent");
    exitFullscreen.setAttribute("stroke", "white");
  } else {
    document.exitFullscreen();
    enterFullscreen.setAttribute("stroke", "white");
    exitFullscreen.setAttribute("stroke", "transparent");
  }
}

// Sound effects are synthesized by sound-engine.js, so there are no
// audio files to load and no 404s in the console.
