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

let simulationMode = false;
let simulationImpact = {};

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

// Initialize character image
const characterImage = new Image();
characterImage.src = "character.png";

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

// Apply mobile-specific optimizations if on a mobile device
function applyMobileOptimizations() {
  if (isMobile.any() || window.innerWidth < 768) {
    // Enlarge the bomb grab area for easier touch
    bombGrabAreaDOM.style.width = '45px';
    bombGrabAreaDOM.style.height = '45px';
    
    // Make the windmill smaller on mobile
    const windmill = document.getElementById('windmill');
    windmill.style.width = '100px';
    windmill.style.height = '120px';
    
    // Adjust game UI elements for mobile
    document.getElementById('settings').classList.add('mobile-settings');
    document.getElementById('wind-info').classList.add('mobile-wind-info');
    
    // Adjust info panels
    const infoLeft = document.getElementById('info-left');
    const infoRight = document.getElementById('info-right');
    infoLeft.classList.add('mobile-info');
    infoRight.classList.add('mobile-info');
    
    // Make instructions more visible on mobile
    const instructions = document.getElementById('instructions');
    instructions.classList.add('mobile-instructions');
    
    // Make sure player info is always visible
    infoLeft.style.opacity = '1';
    infoRight.style.opacity = '1';
    
    // Add touch-friendly class to the game
    document.body.classList.add('touch-friendly');
  }
}

applyMobileOptimizations();

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
  // Apply the changes and redraw
  updateBuildingsForTerrain();
  draw();
});

colorModeButtonDOM.addEventListener("click", () => {
  if (settings.mode === "dark") {
    settings.mode = "light";
    colorModeButtonDOM.innerText = "Dark Mode";
  } else {
    settings.mode = "dark";
    colorModeButtonDOM.innerText = "Light Mode";
  }
  draw();
});

darkModeMediaQuery.addEventListener("change", (e) => {
  settings.mode = e.matches ? "dark" : "light";
  if (settings.mode === "dark") {
    colorModeButtonDOM.innerText = "Light Mode";
  } else {
    colorModeButtonDOM.innerText = "Dark Mode";
  }
  draw();
});

newGame();

function newGame() {
  // Reset game state
  state = {
    phase: "aiming", // aiming | in flight | celebrating | hit reaction
    currentPlayer: 1,
    round: 1,
    windSpeed: generateWindSpeed(),
    lastHitPoint: null, // Track exact hit location for effect placement
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

  // Add a day/night toggle button to the DOM
  window.addEventListener('DOMContentLoaded', () => {
    let toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-day-night';
    toggleBtn.textContent = 'Toggle Day/Night';
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.top = '10px';
    toggleBtn.style.right = '10px';
    toggleBtn.style.zIndex = 1000;
    document.body.appendChild(toggleBtn);
    toggleBtn.addEventListener('click', () => {
      settings.mode = settings.mode === 'dark' ? 'light' : 'dark';
      newGame();
    });
  });

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

  // Generate buildings
  for (let i = 0; i < 8; i++) {
    generateBuilding(i);
  }

  calculateScaleAndShift();
  initializeBombPosition();
  initializeWindmillPosition();
  setWindMillRotation();

  // Cancel any ongoing animation and timeout
  cancelAnimationFrame(animationFrameRequestID);
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

  draw();

  if (settings.numberOfPlayers === 0) {
    computerThrow();
  }
}

function showInstructions() {
  singlePlayerButtonDOM.checked = true;
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

// Function to update buildings based on selected terrain
function updateBuildingsForTerrain() {
  // Find the selected terrain
  const selectedTerrain = gameOptions.terrains.find(terrain => terrain.id === settings.terrain);
  
  if (!selectedTerrain) return; // Safety check
  
  // Clear existing buildings
  state.buildings = [];
  state.blastHoles = [];
  
  // Generate new buildings using the selected terrain's generator
  for (let i = 0; i < 8; i++) {
    const previousBuilding = state.buildings[i - 1];
    const building = selectedTerrain.generateBuilding(i, previousBuilding);
    state.buildings.push(building);
  }
  
  // Recalculate scale and shift for the new buildings
  calculateScaleAndShift();
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
  
  // Reposition UI elements if needed
  updateUIPositions();
  
  // Redraw the game
  draw();
}

// Function to update UI positions based on current screen size
function updateUIPositions() {
  // Adjust the bomb grab area position
  const building = state.currentPlayer === 1 
    ? state.buildings.at(1) 
    : state.buildings.at(-2);
  
  if (building) {
    const buildingCenterX = building.x + building.width / 2;
    const buildingTop = building.height;
    
    // Position the bomb grab area
    const rect = canvas.getBoundingClientRect();
    const grabAreaX = (buildingCenterX / canvas.width) * rect.width;
    const grabAreaY = (buildingTop / canvas.height) * rect.height;
    
    bombGrabAreaDOM.style.left = `${grabAreaX - 22.5}px`;
    bombGrabAreaDOM.style.top = `${grabAreaY - 75}px`;
  }
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

function draw() {
  ctx.save();

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  drawBackgroundSky();

  // Flip coordinate system upside down
  ctx.translate(0, window.innerHeight);
  ctx.scale(1, -1);

  // Scale and shift view to center
  ctx.translate(state.shift, 0);
  ctx.scale(state.scale, state.scale);

  // Draw scene
  drawBackgroundMoon();
  drawBackgroundBuildings();
  drawBuildingsWithBlastHoles();
  drawGorilla(1);
  drawGorilla(2);
  drawBomb();

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
  if (settings.mode === "dark") {
    gradient.addColorStop(1, "#27507F");
    gradient.addColorStop(0, "#58A8D8");
  } else {
    gradient.addColorStop(1, "#F8BA85");
    gradient.addColorStop(0, "#FFC28E");
  }
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

function drawBackgroundMoon() {
  if (settings.mode === "dark") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(
      window.innerWidth / state.scale - state.shift - 200,
      window.innerHeight / state.scale - 100,
      30,
      0,
      2 * Math.PI
    );
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(300, 350, 60, 0, 2 * Math.PI);
    ctx.fill();
  }
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
  
  // Reset buildings
  state.buildings = [];
  
  // Generate buildings with the selected terrain's building generator
  for (let i = 0; i < 8; i++) {
    const previousBuilding = state.buildings[i - 1];
    const building = terrain.generateBuilding(i, previousBuilding);
    state.buildings.push(building);
  }
  
  // Update scale and shift
  calculateScaleAndShift();
  
  // Reset gorilla positions
  initializeBombPosition();
  initializeWindmillPosition();
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

// Draw explosion effect at the given position
function drawExplosionEffect(x, y) {
  // Find the selected effect
  const selectedEffect = gameOptions.effects.find(effect => effect.id === settings.effect);
  
  if (!selectedEffect) return;
  
  // Create explosion animation
  let effectProgress = 0;
  let animationId;
  
  function animateEffect() {
    // Draw the selected effect
    selectedEffect.draw(ctx, x, y, 30, effectProgress);
    
    // Update progress
    effectProgress += 0.05;
    
    // Continue animation until complete
    if (effectProgress <= 1) {
      animationId = requestAnimationFrame(animateEffect);
    } else {
      cancelAnimationFrame(animationId);
    }
  }
  
  // Start the animation
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
  ctx.save();
  ctx.translate(state.bomb.x, state.bomb.y);

  if (state.phase === "aiming") {
    // Move the bomb with the mouse while aiming
    ctx.translate(-state.bomb.velocity.x / 6.25, -state.bomb.velocity.y / 6.25);

    // Draw throwing trajectory
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
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
    ctx.strokeStyle = "white";
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
    ctx.strokeStyle = "white";
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
  hideInstructions();
  if (state.phase === "aiming") {
    isDragging = true;
    document.body.style.cursor = "grabbing";

    // Calculate the direction and velocity based on pointer position
    const rect = canvas.getBoundingClientRect();
    const pointerX = (clientX - rect.left) * window.devicePixelRatio;
    const pointerY = (clientY - rect.top) * window.devicePixelRatio;

    // Calculate center position of the current building
    const building =
      state.currentPlayer === 1
        ? state.buildings.at(1)
        : state.buildings.at(-2);

    const buildingCenterX = building.x + building.width / 2;
    const buildingTop = building.height;

    dragStartX = pointerX;
    dragStartY = pointerY;
  }
}

// Mouse event handlers
bombGrabAreaDOM.addEventListener("mousedown", function (e) {
  handleDragStart(e.clientX, e.clientY);
});

// Touch event handlers
bombGrabAreaDOM.addEventListener("touchstart", function (e) {
  // Prevent default to avoid scrolling while dragging
  e.preventDefault();
  if (e.touches && e.touches[0]) {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }
});

window.addEventListener("mousemove", function (e) {
  if (isDragging) {
    let deltaX = e.clientX - dragStartX;
    let deltaY = e.clientY - dragStartY;

    state.bomb.velocity.x = -deltaX;
    state.bomb.velocity.y = deltaY;
    setInfo(deltaX, deltaY);

    draw();
  }
});

// Touch event handlers
bombGrabAreaDOM.addEventListener("touchmove", function (e) {
  // Prevent default to avoid scrolling while dragging
  e.preventDefault();
  if (e.touches && e.touches[0]) {
    if (isDragging) {
      let deltaX = e.touches[0].clientX - dragStartX;
      let deltaY = e.touches[0].clientY - dragStartY;

      state.bomb.velocity.x = -deltaX;
      state.bomb.velocity.y = deltaY;
      setInfo(deltaX, deltaY);

      draw();
    }
  }
});

// Mouse event handlers
window.addEventListener("mouseup", function () {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = "default";

    throwBomb();
  }
});

// Touch event handlers
bombGrabAreaDOM.addEventListener("touchend", function () {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = "default";

    throwBomb();
  }
});

function setInfo(deltaX, deltaY) {
  const hypotenuse = Math.sqrt(deltaX ** 2 + deltaY ** 2);
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

window.addEventListener("mouseup", function () {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = "default";

    throwBomb();
  }
});

function computerThrow() {
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
  playThrowSound();
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
      drawExplosionEffect(hitX, hitY);
      playHitSound();
    }

    // Handle the case when we hit a building or the bomb got off-screen
    if (miss) {
      state.currentPlayer = state.currentPlayer === 1 ? 2 : 1; // Switch players
      if (state.currentPlayer === 1) state.round++;
      state.phase = "aiming";
      initializeBombPosition();

      draw();

      const computerThrowsNext =
        settings.numberOfPlayers === 0 ||
        (settings.numberOfPlayers === 1 && state.currentPlayer === 2);

      if (computerThrowsNext) setTimeout(computerThrow, 50);

      return;
    }

    // Handle the case when we hit the enemy
    if (hit) {
      const enemyPlayer = state.currentPlayer === 1 ? 2 : 1;
      const playerIndex = enemyPlayer - 1;
      
      if (state.players[playerIndex].health <= 0) {
        // Enemy defeated
        state.phase = "celebrating";
        announceWinner();
        draw();
        return;
      } else {
        // Enemy hit but not defeated - switch turns
        state.currentPlayer = state.currentPlayer === 1 ? 2 : 1; // Switch players
        if (state.currentPlayer === 1) state.round++;
        state.phase = "aiming";
        initializeBombPosition();
        draw();
        
        const computerThrowsNext =
          settings.numberOfPlayers === 0 ||
          (settings.numberOfPlayers === 1 && state.currentPlayer === 2);

        if (computerThrowsNext) setTimeout(computerThrow, 1000); // Delay for hit animation
        
        return;
      }
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
      // Reduce health when hit
      const damage = 25; // 25% damage per hit
      state.players[playerIndex].health = Math.max(0, state.players[playerIndex].health - damage);
      state.players[playerIndex].isHit = true;
      state.players[playerIndex].hitTimer = 30; // Animation frames
      state.players[playerIndex].wasHitThisThrow = true; // Mark as hit this throw
      
      // Play hit sound
      if (hitSound) {
        hitSound.currentTime = 0; // Rewind to start in case it's already playing
        hitSound.play().catch(e => console.log('Audio play failed:', e));
      }
      
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
  if (settings.numberOfPlayers === 0) {
    winnerDOM.innerText = `Computer ${state.currentPlayer}`;
  } else if (settings.numberOfPlayers === 1 && state.currentPlayer === 1) {
    winnerDOM.innerText = `You`;
  } else if (settings.numberOfPlayers === 1 && state.currentPlayer === 2) {
    winnerDOM.innerText = `Computer`;
  } else {
    winnerDOM.innerText = `Player ${state.currentPlayer}`;
  }
  showCongratulations();
}

singlePlayerButtonDOM.forEach((button) =>
  button.addEventListener("click", () => {
    settings.numberOfPlayers = 1;
    gameModeDOM.innerHTML = "Player vs. Computer";
    name1DOM.innerText = "Player";
    name2DOM.innerText = "Computer";

    newGame();
  })
);

twoPlayersButtonDOM.forEach((button) =>
  button.addEventListener("click", () => {
    settings.numberOfPlayers = 2;
    gameModeDOM.innerHTML = "Player vs. Player";
    name1DOM.innerText = "Player 1";
    name2DOM.innerText = "Player 2";

    newGame();
  })
);

autoPlayButtonDOM.forEach((button) =>
  button.addEventListener("click", () => {
    settings.numberOfPlayers = 0;
    name1DOM.innerText = "Computer 1";
    name2DOM.innerText = "Computer 2";

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

// Audio elements
let bgMusic, hitSound, throwSound;
window.addEventListener('DOMContentLoaded', () => {
  bgMusic = document.getElementById('bg-music');
  hitSound = document.getElementById('hit-sound');
  throwSound = document.getElementById('throw-sound');

  // Try to play background music (user gesture required in some browsers)
  if (bgMusic) {
    bgMusic.volume = 0.5;
    document.body.addEventListener('click', () => {
      if (bgMusic.paused) bgMusic.play().catch(()=>{});
    }, { once: true });
  }
});

function playThrowSound() {
  if (throwSound) {
    throwSound.currentTime = 0;
    throwSound.play().catch(()=>{});
  }
}

function playHitSound() {
  if (hitSound) {
    hitSound.currentTime = 0;
    hitSound.play().catch(()=>{});
  }
}
