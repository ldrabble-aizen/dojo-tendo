const canvas = document.querySelector("#game");
let ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start");
const restartButton = document.querySelector("#restart");
const modeButton = document.querySelector("#mode");
const tournamentButton = document.querySelector("#tournament");
const tournamentMenuButton = document.querySelector("#tournament-menu");
const onlineButton = document.querySelector("#online");
const onlineMenuButton = document.querySelector("#online-menu");
const fighterButton = document.querySelector("#fighter");
const difficultyButton = document.querySelector("#difficulty");
const soundButton = document.querySelector("#sound");
const helpButton = document.querySelector("#help");
const overlayCopy = document.querySelector("#overlay-copy");
const fighterSelect = document.querySelector("#fighter-select");
const mobileControls = document.querySelector("#mobile-controls");
const mobileStick = document.querySelector("#mobile-stick");
const mobileStickBase = document.querySelector(".mobile-stick-base");
const mobileStickKnob = document.querySelector("#mobile-stick-knob");

const W = canvas.width;
const H = canvas.height;
const FLOOR = 424;
const GRAVITY = 0.72;
const FIGHTER_SCALE = 0.9;
const FIGHTER_START_LEFT_X = 190;
const FIGHTER_START_RIGHT_X = W - FIGHTER_START_LEFT_X;
const FIGHTER_EDGE_PAD = Math.round(64 * FIGHTER_SCALE);
const FIGHTER_BODY_W = Math.round(62 * FIGHTER_SCALE);
const FIGHTER_BODY_H = Math.round(146 * FIGHTER_SCALE);
const keys = new Set();
let lastControlTap = 0;
let stickPointerId = null;
const touchInput = {
  left: false,
  right: false,
  jump: false,
  block: false,
  punch: false,
  kick: false,
  special: false,
  grab: false,
};
const projectiles = [];
const MAX_PARTICLES = 280;
const faces = {
  p1: loadImage("assets/fighter-1-face.png"),
  p2: loadImage("assets/fighter-2-face.png"),
  p3: loadImage("assets/fighter-3-face.png"),
  p4: loadImage("assets/fighter-4-face.png"),
  p5: loadImage("assets/fighter-5-face.png"),
  p6: loadImage("assets/fighter-6-face.png"),
};
const bodySpriteSheets = {
  p1: loadImage("assets/sprite-pchan-body.svg?v=56"),
  p2: loadImage("assets/sprite-akane-body.svg?v=56"),
};
const unifiedSpriteSheets = {
  p1: loadImage("assets/sprite-pchan-unified.svg?v=56"),
  p2: loadImage("assets/sprite-akane-unified.svg?v=56"),
};
const stageArt = loadImage("assets/dojo-premium-bg.webp", "assets/dojo-premium-bg.png");
const wallPortraits = {
  akane: loadImage("assets/wall-portrait-akane-tendo.webp", "assets/wall-portrait-akane-tendo.png"),
  ryoga: loadImage("assets/wall-portrait-ryoga-hibiki.webp", "assets/wall-portrait-ryoga-hibiki.png"),
};

let running = false;
let winner = "";
let flash = 0;
let shake = 0;
let hitStopFrames = 0;
let koFreeze = 0;
let roundFrame = 0;
let resultFrame = 0;
let cpuEnabled = true;
let cpuFighterId = "p1";
let selectedLeftId = "p1";
let selectedRightId = "p2";
let countdownFrames = 0;
let cpuDifficulty = 1;
let paused = false;
let soundEnabled = true;
let matchOver = false;
let roundNumber = 1;
let musicClock = 0;
let particles = [];
let floatingTexts = [];
let audioCtx = null;
let overlayMode = "home";
let tournamentMode = false;
let tournamentActive = false;
let tournamentOpponents = [];
let tournamentIndex = 0;
let tournamentPlayerId = selectedRightId;
let pendingFightStart = "match";
let roundWinnerId = "";
let matchWinnerId = "";
let lastFrameTime = 0;
let updateAccumulator = 0;
let roundAdvanceTimer = null;
let winnerOverlayTimer = null;

const STEP_MS = 1000 / 60;
const MAX_UPDATE_STEPS = 3;
const stageCache = document.createElement("canvas");
stageCache.width = W;
stageCache.height = H;
let stageCacheReady = false;
let stageCacheMode = "";
const colorPartsCache = new Map();
const lightenCache = new Map();
const darkenCache = new Map();
const alphaColorCache = new Map();
const mobileFightQuery = window.matchMedia("(pointer: coarse), (max-width: 920px)");
let cameraZoom = 1;
let cameraPan = 0;
let cameraLift = 8;
let cameraImpactPulse = 0;
let cameraImpactMax = 1;
let cameraImpactDir = 1;
let cameraImpactStrength = 0;
let cinematicHitPulse = 0;
let cinematicHitMax = 1;
let cinematicHitDir = 1;
let cinematicHitColor = "#fff1bd";
let cinematicHitStrength = 0;

const SPECIAL_STYLES = {
  p1: { shape: "wave", core: "#fff1bd", rim: "#5bd7ff", trail: "#47b5ff" },
  p2: { shape: "petal", core: "#fff4d6", rim: "#5ff0c7", trail: "#ff5f6f" },
  p3: { shape: "burst", core: "#ffffff", rim: "#65c7f2", trail: "#162b52" },
  p4: { shape: "spark", core: "#f5f1ff", rim: "#d7c9ff", trail: "#96e06c" },
  p5: { shape: "bolt", core: "#fff0c9", rim: "#47d5ff", trail: "#d9682d" },
  p6: { shape: "star", core: "#f5f9ff", rim: "#ff8ac8", trail: "#263f9f" },
};

const BODY_SPRITE_FRAME_W = 210;
const BODY_SPRITE_FRAME_H = 300;
const BODY_SPRITE_ANCHOR_X = 105;
const BODY_SPRITE_ANCHOR_Y = 286;
const BODY_SPRITE_FRAMES = {
  idle: [0, 22, 1],
  walk: [2, 21, 3, 21],
  punch: [4, 17, 5, 18, 6],
  kick: [19, 7, 8, 20, 9],
  block: [10],
  hurt: [11, 12],
  special: [13],
  victory: [14],
  defeat: [15],
  sweep: [16],
};

const BODY_SPECS = {
  athletic: {
    shoulder: 41,
    chest: 42,
    waist: 27,
    hip: 34,
    limb: 0.98,
    upperArmWidth: 0.96,
    forearmWidth: 0.9,
    thighWidth: 0.98,
    calfWidth: 0.92,
    hand: 0.92,
    foot: 0.94,
    headW: 88,
    headH: 94,
    headY: 18,
    neckW: 24,
    neckH: 19,
    shoulderSlope: 8,
    facePad: 4,
    stance: 0.95,
  },
  slimFemale: {
    shoulder: 33,
    chest: 34,
    waist: 23,
    hip: 34,
    limb: 0.9,
    armScale: 0.88,
    legScale: 0.94,
    upperArmWidth: 0.72,
    forearmWidth: 0.68,
    thighWidth: 0.78,
    calfWidth: 0.7,
    hand: 0.82,
    foot: 0.86,
    headW: 84,
    headH: 92,
    headY: 20,
    neckW: 20,
    neckH: 18,
    shoulderSlope: 10,
    facePad: 5,
    stance: 0.82,
  },
  softFemale: {
    shoulder: 39,
    chest: 38,
    waist: 28,
    hip: 39,
    limb: 0.98,
    armScale: 0.95,
    legScale: 1,
    upperArmWidth: 0.88,
    forearmWidth: 0.82,
    thighWidth: 0.96,
    calfWidth: 0.86,
    hand: 0.9,
    foot: 0.94,
    headW: 88,
    headH: 96,
    headY: 18,
    neckW: 23,
    neckH: 19,
    shoulderSlope: 9,
    facePad: 5,
    stance: 0.94,
  },
  balanced: {
    shoulder: 44,
    chest: 43,
    waist: 30,
    hip: 37,
    limb: 1.03,
    upperArmWidth: 1,
    forearmWidth: 0.94,
    thighWidth: 1,
    calfWidth: 0.96,
    hand: 1,
    foot: 1,
    headW: 92,
    headH: 98,
    headY: 16,
    neckW: 26,
    neckH: 20,
    shoulderSlope: 8,
    facePad: 4,
    stance: 1,
  },
  heavy: {
    shoulder: 50,
    chest: 50,
    waist: 36,
    hip: 43,
    limb: 1.14,
    upperArmWidth: 1.12,
    forearmWidth: 1.04,
    thighWidth: 1.1,
    calfWidth: 1.04,
    hand: 1.12,
    foot: 1.12,
    headW: 98,
    headH: 102,
    headY: 14,
    neckW: 30,
    neckH: 21,
    shoulderSlope: 7,
    facePad: 4,
    stance: 1.12,
  },
  racingHeavy: {
    shoulder: 55,
    chest: 56,
    waist: 42,
    hip: 47,
    limb: 1.1,
    armScale: 1.04,
    legScale: 0.98,
    upperArmWidth: 1.18,
    forearmWidth: 1.08,
    thighWidth: 1.16,
    calfWidth: 1.04,
    hand: 1.13,
    foot: 1.1,
    headW: 98,
    headH: 102,
    headY: 14,
    neckW: 32,
    neckH: 22,
    shoulderSlope: 6,
    facePad: 3,
    stance: 1.18,
    belly: 1.22,
  },
  lean: {
    shoulder: 39,
    chest: 38,
    waist: 26,
    hip: 32,
    limb: 0.94,
    upperArmWidth: 0.86,
    forearmWidth: 0.8,
    thighWidth: 0.86,
    calfWidth: 0.8,
    hand: 0.9,
    foot: 0.9,
    headW: 88,
    headH: 94,
    headY: 18,
    neckW: 22,
    neckH: 19,
    shoulderSlope: 9,
    facePad: 5,
    stance: 0.9,
  },
  tallLean: {
    shoulder: 36,
    chest: 35,
    waist: 24,
    hip: 30,
    limb: 1.04,
    armScale: 1.08,
    legScale: 1.16,
    upperArmWidth: 0.78,
    forearmWidth: 0.72,
    thighWidth: 0.78,
    calfWidth: 0.7,
    hand: 0.88,
    foot: 0.94,
    headW: 82,
    headH: 92,
    headY: 22,
    neckW: 21,
    neckH: 21,
    shoulderSlope: 11,
    facePad: 5,
    stance: 0.82,
  },
};

const difficultyLevels = [
  { name: "Facil", think: 28, block: 0.35, attack: 0.38, special: 0.2 },
  { name: "Normal", think: 18, block: 0.62, attack: 0.56, special: 0.42 },
  { name: "Dificil", think: 10, block: 0.78, attack: 0.72, special: 0.6 },
];

const fighterIds = ["p1", "p2", "p3", "p4", "p5", "p6"];
const leftControls = {
  left: "a",
  right: "d",
  jump: "w",
  block: "s",
  punch: "f",
  kick: "g",
  special: "r",
  grab: "t",
};
const rightControls = {
  left: "arrowleft",
  right: "arrowright",
  jump: "arrowup",
  block: "arrowdown",
  punch: "k",
  kick: "l",
  special: "o",
  grab: "p",
};
const fighterProfiles = {
  p1: {
    id: "p1",
    name: "Pchan",
    color: "#2677bf",
    trim: "#f6c445",
    face: faces.p1,
    skin: "#f1bd98",
    build: "balanced",
    mark: "P",
    headwear: "pchanBandana",
    outfit: {
      jacket: "#2677bf",
      pants: "#174d93",
      sleeve: "#f6c445",
      belt: "#f6c445",
      shoe: "#e9bf3e",
      accent: "#7fc8ff",
      pattern: "split",
    },
  },
  p2: {
    id: "p2",
    name: "Akane",
    color: "#cc3a3f",
    trim: "#5ee0b4",
    face: faces.p2,
    skin: "#f4c3a3",
    build: "slimFemale",
    mark: "A",
    outfit: {
      jacket: "#cc3a3f",
      pants: "#9f2731",
      sleeve: "#5ee0b4",
      belt: "#5ee0b4",
      shoe: "#46ccb0",
      accent: "#ffe7df",
      pattern: "wrap",
    },
  },
  p3: {
    id: "p3",
    name: "Maguila",
    color: "#65c7f2",
    trim: "#ffffff",
    face: faces.p3,
    skin: "#d6a07e",
    build: "racingHeavy",
    mark: "M",
    outfit: {
      jacket: "#65c7f2",
      pants: "#162b52",
      sleeve: "#ffffff",
      belt: "#162b52",
      shoe: "#101725",
      accent: "#ffffff",
      stripe: "#ffffff",
      trimLine: "#162b52",
      pattern: "racing",
    },
  },
  p4: {
    id: "p4",
    name: "Pino",
    color: "#7b6cc9",
    trim: "#96e06c",
    face: faces.p4,
    skin: "#edb894",
    build: "lean",
    mark: "N",
    outfit: {
      jacket: "#7b6cc9",
      pants: "#5747a6",
      sleeve: "#96e06c",
      belt: "#96e06c",
      shoe: "#7fcd61",
      accent: "#d7c9ff",
      pattern: "stripe",
    },
  },
  p5: {
    id: "p5",
    name: "Lucas",
    color: "#d9682d",
    trim: "#47d5ff",
    face: faces.p5,
    skin: "#e5aa8d",
    build: "tallLean",
    mark: "L",
    outfit: {
      jacket: "#d9682d",
      pants: "#93401f",
      sleeve: "#47d5ff",
      belt: "#47d5ff",
      shoe: "#f0b44a",
      accent: "#ffe2b0",
      pattern: "stripe",
    },
  },
  p6: {
    id: "p6",
    name: "Lili",
    color: "#263f9f",
    trim: "#ff8ac8",
    face: faces.p6,
    skin: "#efbd95",
    build: "softFemale",
    mark: "L",
    outfit: {
      jacket: "#263f9f",
      pants: "#192868",
      sleeve: "#ff8ac8",
      belt: "#ff8ac8",
      shoe: "#f07fb7",
      accent: "#dbe6ff",
      pattern: "wrap",
    },
  },
};

let fighters = buildFighters();

function fighterScale(value) {
  return value * FIGHTER_SCALE;
}

function loadImage(src, fallback) {
  const image = new Image();
  image.onload = () => {
    stageCacheReady = false;
  };
  if (fallback) image.onerror = () => {
    image.onerror = null;
    image.src = fallback;
  };
  image.src = src;
  return image;
}

function buildFighters() {
  cpuFighterId = "left";
  return [
    makeFighter({ ...fighterProfiles[selectedLeftId], id: "left", profileId: selectedLeftId, x: FIGHTER_START_LEFT_X, dir: 1, controls: leftControls }),
    makeFighter({ ...fighterProfiles[selectedRightId], id: "right", profileId: selectedRightId, x: FIGHTER_START_RIGHT_X, dir: -1, controls: rightControls }),
  ];
}

function makeFighter({ id, profileId, name, x, dir, color, trim, face, controls, skin, build, mark, headwear, outfit }) {
  return {
    id,
    profileId,
    name,
    x,
    y: FLOOR,
    vx: 0,
    vy: 0,
    w: FIGHTER_BODY_W,
    h: FIGHTER_BODY_H,
    dir,
    color,
    trim,
    face,
    skin,
    build,
    mark,
    headwear,
    outfit: normalizeOutfit(color, trim, outfit),
    specialStyle: SPECIAL_STYLES[profileId] ?? SPECIAL_STYLES.p1,
    controls,
    health: 100,
    healthLag: 100,
    energy: 52,
    grounded: true,
    blocking: false,
    crouch: 0,
    attack: null,
    cooldown: 0,
    hurt: 0,
    pigMorph: 0,
    specialCooldown: 0,
    counterWindow: 0,
    hitFlash: 0,
    impactPulse: 0,
    impactDir: dir,
    impactLift: 0,
    impactStrength: 0,
    contactFlash: 0,
    damagePulse: 0,
    damageLevel: 0,
    hitZone: "torso",
    hitZonePulse: 0,
    koFall: 0,
    koFallDir: dir,
    koFallStrength: 0,
    victoryPulse: 0,
    guardPulse: 0,
    guardImpact: 0,
    staggerPulse: 0,
    jumpPulse: 0,
    landingPulse: 0,
    stepPulse: 0,
    stepCooldown: 0,
    walkCycle: 0,
    walkWeight: 0,
    walkPlant: 0,
    jumpDir: dir,
    landingDir: dir,
    airFrames: 0,
    moveIntent: 0,
    wins: 0,
    ai: {
      left: false,
      right: false,
      jump: false,
      block: false,
      punch: false,
      kick: false,
      special: false,
      grab: false,
      think: 0,
    },
  };
}

function normalizeOutfit(color, trim, outfit = {}) {
  return {
    jacket: outfit.jacket ?? color,
    pants: outfit.pants ?? darken(color, 16),
    sleeve: outfit.sleeve ?? trim,
    belt: outfit.belt ?? trim,
    shoe: outfit.shoe ?? trim,
    accent: outfit.accent ?? lighten(trim, 18),
    stripe: outfit.stripe ?? lighten(trim, 18),
    trimLine: outfit.trimLine ?? darken(color, 24),
    pattern: outfit.pattern ?? "classic",
  };
}

function ensureAudio() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  if (!audioCtx) audioCtx = new AudioEngine();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playSound(type) {
  if (!audioCtx || !soundEnabled) return;

  const now = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  const osc = audioCtx.createOscillator();
  const noise = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const duration = {
    menu: 0.08,
    select: 0.11,
    vs: 0.42,
    round: 0.2,
    punch: 0.08,
    kick: 0.1,
    hit: 0.16,
    block: 0.09,
    jump: 0.08,
    special: 0.34,
    victory: 0.66,
    lose: 0.52,
    ko: 0.72,
  }[type] ?? 0.1;

  const freqs = {
    menu: [520, 720],
    select: [360, 620],
    vs: [110, 220],
    round: [392, 588],
    punch: [170, 80],
    kick: [120, 64],
    hit: [90, 42],
    block: [360, 220],
    jump: [260, 410],
    special: [520, 160],
    victory: [330, 660],
    lose: [180, 90],
    ko: [78, 30],
  }[type] ?? [200, 100];

  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  osc.frequency.setValueAtTime(freqs[0], now);
  osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
  osc.type = type === "special" || type === "vs" ? "sawtooth" : type === "victory" ? "square" : "triangle";
  gain.gain.setValueAtTime(type === "ko" || type === "victory" || type === "vs" ? 0.18 : 0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "block" || type === "select" || type === "menu" ? 900 : type === "victory" ? 1200 : 520, now);

  noise.buffer = buffer;
  noise.connect(filter);
  filter.connect(gain);
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  noise.start(now);
  osc.stop(now + duration);
  noise.stop(now + duration);
}

function playMusicTick() {
  if (!audioCtx || !soundEnabled || !running || paused || winner || roundFrame % 34 !== 0) return;

  const notes = [196, 247, 294, 247, 220, 262, 330, 262];
  const note = notes[musicClock % notes.length];
  musicClock += 1;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(note, now);
  gain.gain.setValueAtTime(0.018, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}

function resetGame() {
  ensureAudio();
  clearRoundTimers();
  fighters[0].wins = 0;
  fighters[1].wins = 0;
  roundNumber = 1;
  matchOver = false;
  roundWinnerId = "";
  matchWinnerId = "";
  resetRound();
}

function resetRound() {
  clearRoundTimers();
  Object.assign(fighters[0], {
    x: FIGHTER_START_LEFT_X,
    y: FLOOR,
    vx: 0,
    vy: 0,
    dir: 1,
    health: 100,
    healthLag: 100,
    energy: 52,
    attack: null,
    cooldown: 0,
    hurt: 0,
    pigMorph: 0,
    hitFlash: 0,
    impactPulse: 0,
    impactDir: 1,
    impactLift: 0,
    impactStrength: 0,
    contactFlash: 0,
    damagePulse: 0,
    damageLevel: 0,
    hitZone: "torso",
    hitZonePulse: 0,
    koFall: 0,
    koFallDir: 1,
    koFallStrength: 0,
    victoryPulse: 0,
    guardPulse: 0,
    guardImpact: 0,
    staggerPulse: 0,
    jumpPulse: 0,
    landingPulse: 0,
    stepPulse: 0,
    stepCooldown: 0,
    walkCycle: 0,
    walkWeight: 0,
    walkPlant: 0,
    jumpDir: 1,
    landingDir: 1,
    airFrames: 0,
    moveIntent: 0,
    blocking: false,
    grounded: true,
    specialCooldown: 0,
    counterWindow: 0,
  });

  Object.assign(fighters[1], {
    x: FIGHTER_START_RIGHT_X,
    y: FLOOR,
    vx: 0,
    vy: 0,
    dir: -1,
    health: 100,
    healthLag: 100,
    energy: 52,
    attack: null,
    cooldown: 0,
    hurt: 0,
    pigMorph: 0,
    hitFlash: 0,
    impactPulse: 0,
    impactDir: -1,
    impactLift: 0,
    impactStrength: 0,
    contactFlash: 0,
    damagePulse: 0,
    damageLevel: 0,
    hitZone: "torso",
    hitZonePulse: 0,
    koFall: 0,
    koFallDir: -1,
    koFallStrength: 0,
    victoryPulse: 0,
    guardPulse: 0,
    guardImpact: 0,
    staggerPulse: 0,
    jumpPulse: 0,
    landingPulse: 0,
    stepPulse: 0,
    stepCooldown: 0,
    walkCycle: 0,
    walkWeight: 0,
    walkPlant: 0,
    jumpDir: -1,
    landingDir: -1,
    airFrames: 0,
    moveIntent: 0,
    blocking: false,
    grounded: true,
    specialCooldown: 0,
    counterWindow: 0,
  });

  particles = [];
  floatingTexts = [];
  projectiles.length = 0;
  winner = "";
  roundWinnerId = "";
  if (!matchOver) matchWinnerId = "";
  flash = 0;
  shake = 0;
  hitStopFrames = 0;
  cameraZoom = 1;
  cameraPan = 0;
  cameraLift = 8;
  cameraImpactPulse = 0;
  cameraImpactMax = 1;
  cameraImpactDir = 1;
  cameraImpactStrength = 0;
  cinematicHitPulse = 0;
  cinematicHitMax = 1;
  cinematicHitDir = 1;
  cinematicHitColor = "#fff1bd";
  cinematicHitStrength = 0;
  koFreeze = 0;
  roundFrame = 0;
  resultFrame = 0;
  countdownFrames = 180;
  paused = false;
  running = true;
  overlay.classList.add("hidden");
}

function clearRoundTimers() {
  if (roundAdvanceTimer) {
    clearTimeout(roundAdvanceTimer);
    roundAdvanceTimer = null;
  }
  if (winnerOverlayTimer) {
    clearTimeout(winnerOverlayTimer);
    winnerOverlayTimer = null;
  }
}

function scheduleNextRound() {
  if (roundAdvanceTimer) clearTimeout(roundAdvanceTimer);
  roundAdvanceTimer = setTimeout(() => {
    roundAdvanceTimer = null;
    if (!winner || matchOver) return;
    roundNumber += 1;
    resetRound();
  }, 3200);
}

function scheduleWinnerOverlay() {
  if (winnerOverlayTimer) clearTimeout(winnerOverlayTimer);
  winnerOverlayTimer = setTimeout(() => {
    winnerOverlayTimer = null;
    showWinner();
  }, 2600);
}

function homeOverlayCopy() {
  return tournamentMode
    ? "Modo torneo: elegí tu luchador a la derecha y el primer rival a la izquierda. En telefono gira la pantalla y usa los botones tactiles."
    : `Elegí tus luchadores. En telefono gira la pantalla y usa los botones tactiles. Izquierda usa A/D, W, S, F, G, R y T${cpuEnabled ? " o CPU" : ""}. Derecha usa flechas, K, L, O y P.`;
}

function showHomeOverlay() {
  overlayMode = "home";
  overlay.dataset.screen = "home";
  overlay.dataset.mode = tournamentMode ? "tournament" : "match";
  onlineButton.setAttribute("aria-pressed", "false");
  onlineMenuButton.setAttribute("aria-pressed", "false");
  overlay.querySelector("h1").textContent = "Mini Kombat III";
  overlayCopy.textContent = homeOverlayCopy();
  startButton.textContent = tournamentMode ? "INICIAR TORNEO" : "LUCHAR";
  renderFighterSelect();
  fighterSelect.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

function showVersusOverlay(startKind = "match") {
  pendingFightStart = startKind;
  overlayMode = "versus";
  overlay.dataset.screen = "versus";
  overlay.dataset.mode = tournamentActive ? "tournament" : "match";
  const roundLabel = startKind === "round" ? `ROUND ${toRoman(roundNumber)}` : tournamentActive ? `RIVAL ${tournamentIndex + 1}/${tournamentOpponents.length}` : `ROUND ${toRoman(roundNumber)}`;
  overlay.querySelector("h1").textContent = `${fighters[0].name} VS ${fighters[1].name}`;
  overlayCopy.textContent = tournamentActive
    ? `Torneo Dojo Tendo. ${roundLabel}. ${fighters[1].name} busca avanzar en la escalera.`
    : `${roundLabel}. Preparados para pelear.`;
  renderVersusPanel(roundLabel);
  startButton.textContent = "COMENZAR";
  fighterSelect.classList.remove("hidden");
  overlay.classList.remove("hidden");
  playSound("vs");
}

function beginVersusFight() {
  if (pendingFightStart === "match") {
    fighters[0].wins = 0;
    fighters[1].wins = 0;
    roundNumber = 1;
    matchOver = false;
    matchWinnerId = "";
  }
  resetRound();
  playSound("round");
}

function startTournament() {
  ensureAudio();
  setCpuMode(true);
  tournamentMode = true;
  tournamentActive = true;
  tournamentPlayerId = selectedRightId;
  tournamentOpponents = [selectedLeftId, ...fighterIds.filter((id) => id !== selectedLeftId)];
  tournamentIndex = 0;
  selectedRightId = tournamentPlayerId;
  selectedLeftId = tournamentOpponents[tournamentIndex];
  fighters = buildFighters();
  updateFighterLabels();
  showVersusOverlay("match");
}

function advanceTournament() {
  const playerWon = matchWinnerId === "right";
  if (playerWon && tournamentIndex < tournamentOpponents.length - 1) {
    tournamentIndex += 1;
    selectedLeftId = tournamentOpponents[tournamentIndex];
    selectedRightId = tournamentPlayerId;
    fighters = buildFighters();
    updateFighterLabels();
    showVersusOverlay("match");
    return;
  }
  tournamentActive = false;
  showHomeOverlay();
}

function showPauseOverlay() {
  overlayMode = "pause";
  overlay.dataset.screen = "pause";
  overlay.querySelector("h1").textContent = "Pausa";
  overlayCopy.textContent =
    "Esc para seguir. Reiniciar empieza el match de cero. El boton CPU alterna rival automatico o dos jugadores.";
  startButton.textContent = "SEGUIR";
  fighterSelect.classList.add("hidden");
  overlay.classList.remove("hidden");
}

function resumeGame() {
  paused = false;
  overlay.classList.add("hidden");
}

function inputFor(f) {
  if (cpuEnabled && f.id === cpuFighterId) return f.ai;
  const c = f.controls;
  const touch = f.id === "right" ? touchInput : {};
  return {
    left: keys.has(c.left) || touch.left,
    right: keys.has(c.right) || touch.right,
    jump: keys.has(c.jump) || touch.jump,
    block: keys.has(c.block) || touch.block,
    punch: keys.has(c.punch) || touch.punch,
    kick: keys.has(c.kick) || touch.kick,
    special: keys.has(c.special) || (keys.has(c.block) && keys.has(c.punch)) || touch.special || (touch.block && touch.punch),
    grab: keys.has(c.grab) || touch.grab,
  };
}

function updateAI(f, opponent) {
  const ai = f.ai;
  const difficulty = difficultyLevels[cpuDifficulty];
  const distance = Math.abs(opponent.x - f.x);
  const close = distance < fighterScale(95);
  const mid = distance < fighterScale(210);
  ai.think -= 1;

  if (ai.think <= 0) {
    ai.think = difficulty.think + Math.random() * difficulty.think;
    ai.left = false;
    ai.right = false;
    ai.jump = false;
    ai.block = false;
    ai.punch = false;
    ai.kick = false;
    ai.special = false;
    ai.grab = false;

    if (f.hurt > 0) return;

    if (opponent.attack && distance < fighterScale(140) && Math.random() < difficulty.block) {
      ai.block = true;
      if (Math.random() < 0.3) ai.jump = true;
      return;
    }

    if (!mid) {
      ai.left = opponent.x < f.x;
      ai.right = opponent.x > f.x;
      if (f.energy >= 48 && Math.random() < difficulty.special * 0.75) ai.special = true;
      return;
    }

    if (close) {
      const roll = Math.random();
      if (roll < 0.14 + cpuDifficulty * 0.06) ai.grab = true;
      else if (roll < 0.28) {
        ai.block = true;
        ai.kick = true;
      } else if (Math.random() < difficulty.attack) ai.punch = true;
      else ai.kick = true;
      if (Math.random() < 0.18) ai.block = true;
      return;
    }

    if (f.energy >= 60 && Math.random() < difficulty.special) ai.special = true;
    else if (Math.random() < difficulty.attack) ai.kick = true;
    else {
      ai.left = opponent.x < f.x;
      ai.right = opponent.x > f.x;
    }
  }
}

function startAttack(f, type) {
  if (f.cooldown > 0 || f.attack || f.hurt > 16 || (f.blocking && type !== "sweep")) return;

  const heavy = type === "kick" || type === "airKick";
  const sweep = type === "sweep";
  const grab = type === "grab";
  const air = type === "airPunch" || type === "airKick";
  f.attack = {
    type,
    frame: 0,
    activeStart: grab ? 7 : sweep ? 8 : heavy ? 10 : 5,
    activeEnd: grab ? 13 : sweep ? 16 : heavy ? 18 : 12,
    duration: grab ? 24 : sweep ? 29 : heavy ? 31 : 22,
    damage: grab ? 12 : sweep ? 8 : air ? 9 : heavy ? 11 : 7,
    reach: grab ? 48 : sweep ? 88 : heavy ? 84 : 58,
    height: grab ? 70 : sweep ? 34 : heavy ? 70 : 50,
    hit: false,
    whoosh: false,
  };
  f.blocking = false;
  f.cooldown = grab ? 28 : sweep ? 25 : heavy ? 24 : 13;
  playSound(heavy || sweep ? "kick" : "punch");
}

function startSpecial(f) {
  if (f.energy < 45 || f.specialCooldown > 0 || f.attack || f.hurt > 16) return;

  f.energy -= 45;
  f.blocking = false;
  f.specialCooldown = 66;
  f.cooldown = 28;
  f.attack = {
    type: "special",
    frame: 0,
    activeStart: 12,
    activeEnd: 18,
    duration: 28,
    damage: 0,
    reach: 0,
    height: 0,
    hit: true,
    whoosh: false,
  };
  if (f.profileId === "p1") {
    f.pigMorph = 72;
    coldWaterSplash(f.x, f.y - fighterScale(118), f.dir);
    addText(f.x, f.y - fighterScale(166), "P-CHAN", "#ffe66a");
  }
  specialChargeFX(f);
  triggerCinematicHit(f.dir, f.specialStyle?.rim ?? "#fff1bd", 0.62, 10);
  playSound("special");
}

function throwSpecial(f) {
  const style = f.specialStyle ?? SPECIAL_STYLES.p1;
  projectiles.push({
    owner: f.id,
    style,
    x: f.x + f.dir * fighterScale(48),
    y: f.y - fighterScale(116),
    vx: f.dir * 7.4,
    life: 92,
    r: fighterScale(16),
    damage: 12,
    color: style.rim,
    profileId: f.profileId,
    dir: f.dir,
    trail: [],
  });
  burst(f.x + f.dir * fighterScale(40), f.y - fighterScale(116), style.rim, 12);
  impactGlints(f.x + f.dir * fighterScale(44), f.y - fighterScale(118), style.core, false, true);
  specialReleaseFX(f);
}

function fighterSignatureStyle(f) {
  const style = f?.specialStyle ?? SPECIAL_STYLES.p1;
  if (f?.profileId === "p1") {
    return { ...style, core: "#fff3a6", rim: "#5bd7ff", trail: "#ffe66a", shadow: "#173b7a" };
  }
  if (f?.profileId === "p2") {
    return { ...style, core: "#fff6df", rim: "#5ff0c7", trail: "#ff5f6f", shadow: "#7f1f35" };
  }
  return { ...style, shadow: style.trail };
}

function specialChargeFX(f) {
  const style = fighterSignatureStyle(f);
  const dir = f.dir || 1;
  const x = f.x + dir * fighterScale(24);
  const y = f.y - fighterScale(f.profileId === "p2" ? 122 : 116);

  particles.push({
    x,
    y,
    vx: dir * 0.18,
    vy: 0,
    angle: dir > 0 ? 0 : Math.PI,
    life: 18,
    maxLife: 18,
    size: f.profileId === "p1" ? 34 : 31,
    growth: 2,
    color: style.rim,
    kind: "airRipple",
  });

  for (let i = 0; i < 9; i += 1) {
    const lane = i / 8 - 0.5;
    const arc = lane * Math.PI * 0.72;
    const radius = fighterScale(22 + Math.random() * 22);
    particles.push({
      x: x - dir * 8 + Math.cos(arc) * radius * dir,
      y: y + Math.sin(arc) * radius * 0.72,
      vx: dir * (0.25 + Math.random() * 0.56),
      vy: -0.18 - Math.random() * 0.5 + lane * 0.2,
      angle: dir > 0 ? arc : Math.PI - arc,
      length: fighterScale(22 + Math.random() * 28),
      life: 15 + Math.random() * 9,
      maxLife: 20,
      size: 2.1 + Math.random() * 1.8,
      color: i % 2 ? style.core : style.trail,
      kind: f.profileId === "p2" ? "hitShard" : "impactNeedle",
    });
  }

  if (f.profileId === "p1") {
    for (let i = 0; i < 6; i += 1) {
      particles.push({
        x: x - dir * fighterScale(16) + Math.random() * 18 * dir,
        y: y - fighterScale(12) + Math.random() * 20,
        vx: dir * (0.28 + Math.random() * 0.35),
        vy: -0.9 - Math.random() * 1.1,
        life: 16 + Math.random() * 9,
        size: 3 + Math.random() * 3.2,
        color: "rgba(143, 226, 255, 0.78)",
        kind: "droplet",
      });
    }
  }
}

function specialReleaseFX(f) {
  const style = fighterSignatureStyle(f);
  const dir = f.dir || 1;
  const x = f.x + dir * fighterScale(50);
  const y = f.y - fighterScale(116);
  const baseAngle = dir > 0 ? 0 : Math.PI;

  particles.push({
    x,
    y,
    vx: dir * 0.25,
    vy: 0,
    angle: baseAngle,
    life: 16,
    maxLife: 16,
    size: 46,
    color: style.rim,
    strength: 1.15,
    kind: "contactFlash",
  });

  for (let i = 0; i < 11; i += 1) {
    const lane = i / 10 - 0.5;
    particles.push({
      x: x - dir * fighterScale(18),
      y: y + lane * fighterScale(38),
      vx: dir * (0.78 + Math.random() * 0.72),
      vy: lane * 0.24,
      angle: baseAngle + lane * 0.46,
      length: fighterScale(54 + Math.random() * 45),
      life: 14 + Math.random() * 8,
      maxLife: 18,
      size: 2.8 + Math.random() * 2.2,
      color: i % 2 ? style.core : style.trail,
      kind: "impactNeedle",
    });
  }
}

function updateCameraImpactPulse() {
  if (cameraImpactPulse > 0) cameraImpactPulse -= 1;
  else cameraImpactStrength = 0;
  if (cinematicHitPulse > 0) cinematicHitPulse -= 1;
  else cinematicHitStrength = 0;
}

function update() {
  if (hitStopFrames > 0) {
    hitStopFrames -= 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    return;
  }

  if (koFreeze > 0) {
    koFreeze -= 1;
    if (winner) resultFrame += 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    return;
  }

  if (!running) {
    if (winner) resultFrame += 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    return;
  }

  if (paused) return;
  if (countdownFrames > 0) {
    countdownFrames -= 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    return;
  }

  roundFrame += 1;
  playMusicTick();
  const [a, b] = fighters;
  a.dir = a.x <= b.x ? 1 : -1;
  b.dir = b.x < a.x ? 1 : -1;

  if (cpuEnabled) {
    const cpu = fighters.find((f) => f.id === cpuFighterId);
    const opponent = fighters.find((f) => f.id !== cpuFighterId);
    if (cpu && opponent) updateAI(cpu, opponent);
  }
  updateFighter(a, b);
  updateFighter(b, a);
  keepApart(a, b);
  updateProjectiles();
  updateParticles();
  updateFloatingTexts();

  if (!winner && (a.health <= 0 || b.health <= 0)) {
    const winnerFighter = a.health > b.health ? a : b;
    const loserFighter = winnerFighter === a ? b : a;
    winner = winnerFighter.name;
    roundWinnerId = winnerFighter.id;
    winnerFighter.wins += 1;
    matchOver = winnerFighter.wins >= 2;
    if (matchOver) matchWinnerId = winnerFighter.id;
    running = false;
    koFreeze = 18;
    resultFrame = 0;
    loserFighter.koFall = Math.max(loserFighter.koFall ?? 0, 90);
    loserFighter.koFallDir = loserFighter.impactDir || winnerFighter.dir || 1;
    loserFighter.koFallStrength = Math.max(loserFighter.koFallStrength ?? 0, loserFighter.impactStrength ?? 1);
    loserFighter.damagePulse = Math.max(loserFighter.damagePulse ?? 0, 34);
    loserFighter.damageLevel = Math.max(loserFighter.damageLevel ?? 0, 1.55);
    winnerFighter.victoryPulse = 60;
    shake = 16;
    flash = 16;
    addText(winnerFighter.x, winnerFighter.y - 190, matchOver ? "MATCH" : "ROUND", "#fff1bd");
    koCollapseFX(loserFighter, winnerFighter);
    playSound(matchOver ? tournamentActive && winnerFighter.id !== "right" ? "lose" : "victory" : "ko");
    if (matchOver) scheduleWinnerOverlay();
    else scheduleNextRound();
  }

  if (flash > 0) flash -= 1;
  if (shake > 0) shake -= 1;
  updateCameraImpactPulse();
}

function updateFighter(f, opponent) {
  const input = inputFor(f);
  const wantSpecial = input.special;
  const wantBlock = input.block && f.grounded && !f.attack && !wantSpecial;
  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const speed = wantBlock ? 1.2 : 3.35;
  const wasGrounded = f.grounded;

  f.moveIntent = move;
  f.blocking = wantBlock;
  f.crouch += ((wantBlock ? 1 : 0) - f.crouch) * 0.18;
  if (f.counterWindow > 0) f.counterWindow -= 1;
  if (f.hitFlash > 0) f.hitFlash -= 1;
  if (f.contactFlash > 0) f.contactFlash -= 1;
  if (f.impactPulse > 0) f.impactPulse -= 1;
  if (f.damagePulse > 0) f.damagePulse -= 1;
  if (f.hitZonePulse > 0) f.hitZonePulse -= 1;
  if (f.victoryPulse > 0) f.victoryPulse -= 1;
  if (f.guardImpact > 0) f.guardImpact -= 1;
  if (f.staggerPulse > 0) f.staggerPulse -= 1;
  if (f.jumpPulse > 0) f.jumpPulse -= 1;
  if (f.landingPulse > 0) f.landingPulse -= 1;
  if (f.stepPulse > 0) f.stepPulse -= 1;
  if (f.stepCooldown > 0) f.stepCooldown -= 1;
  if (f.pigMorph > 0) f.pigMorph -= 1;
  f.guardPulse = f.blocking ? Math.min(18, (f.guardPulse ?? 0) + 1) : (f.guardPulse ?? 0) * 0.72;

  if (f.hurt > 0) {
    f.hurt -= 1;
    f.vx *= 0.88;
  } else {
    const airControl = f.grounded ? 1 : 0.82;
    const acceleration = f.grounded ? 0.4 : 0.16;
    f.vx += (move * speed * airControl - f.vx) * acceleration;
  }

  if (input.jump && f.grounded && !wantBlock && f.hurt <= 0) {
    f.vy = -13.1;
    f.grounded = false;
    f.jumpPulse = 12;
    f.landingPulse = 0;
    f.jumpDir = move || Math.sign(f.vx) || f.dir;
    f.walkWeight *= 0.55;
    movementDust(f.x - f.dir * fighterScale(8), FLOOR + 4, -f.dir, 0.9, 5);
    playSound("jump");
  }

  if (wantSpecial) startSpecial(f);
  else if (input.grab) startAttack(f, "grab");
  else if (input.kick && input.block) startAttack(f, "sweep");
  else if (input.punch) startAttack(f, f.grounded ? "punch" : "airPunch");
  else if (input.kick) startAttack(f, f.grounded ? "kick" : "airKick");

  f.x += f.vx;
  f.y += f.vy;
  const landingSpeed = f.vy;
  f.vy += GRAVITY;

  if (f.y >= FLOOR) {
    f.y = FLOOR;
    f.vy = 0;
    f.airFrames = 0;
    if (!wasGrounded && landingSpeed > 2.1) {
      f.landingPulse = Math.min(16, 7 + landingSpeed * 0.56);
      f.stepPulse = Math.max(f.stepPulse, 6);
      f.landingDir = Math.sign(f.vx) || f.jumpDir || f.dir;
      f.walkWeight = Math.max(f.walkWeight ?? 0, clamp(landingSpeed / 13, 0.18, 0.58));
      movementDust(f.x, FLOOR + 5, f.vx >= 0 ? -1 : 1, clamp(landingSpeed / 8, 0.65, 1.45), landingSpeed > 7 ? 10 : 7);
    }
    f.grounded = true;
  } else {
    f.airFrames += 1;
  }

  f.x = clamp(f.x, FIGHTER_EDGE_PAD, W - FIGHTER_EDGE_PAD);
  const walkSpeed = clamp(Math.abs(f.vx) / speed, 0, 1.25);
  const walkingNow = f.grounded && f.hurt <= 0 && !f.attack && Math.abs(f.vx) > 0.35;
  if (walkingNow) {
    const cycleDir = Math.sign(f.vx) || f.dir;
    f.walkCycle = (f.walkCycle ?? 0) + cycleDir * (0.2 + walkSpeed * 0.18);
    f.walkWeight = (f.walkWeight ?? 0) + (walkSpeed - (f.walkWeight ?? 0)) * 0.18;
    f.walkPlant = Math.abs(Math.cos(f.walkCycle));
  } else {
    f.walkWeight = (f.walkWeight ?? 0) * 0.86;
    f.walkPlant = (f.walkPlant ?? 0) * 0.72;
  }

  if (f.grounded && f.hurt <= 0 && !f.attack && Math.abs(f.vx) > 1.25) {
    const cadence = Math.max(5, Math.round(12 - Math.abs(f.vx) * 1.6));
    if (f.stepCooldown <= 0) {
      f.stepCooldown = cadence;
      f.stepPulse = 7;
      movementDust(f.x - Math.sign(f.vx) * fighterScale(22), FLOOR + 4, -Math.sign(f.vx), clamp(Math.abs(f.vx) / 3.5, 0.5, 1), 3);
    }
  }
  if (f.cooldown > 0) f.cooldown -= 1;
  if (f.specialCooldown > 0) f.specialCooldown -= 1;
  if (f.healthLag > f.health) f.healthLag += (f.health - f.healthLag) * 0.055;
  else f.healthLag = f.health;

  if (f.attack) {
    f.attack.frame += 1;
    if (!f.attack.whoosh && f.attack.frame >= f.attack.activeStart) {
      attackWhoosh(f);
      f.attack.whoosh = true;
    }
    if (f.attack.type === "special" && f.attack.frame === f.attack.activeStart) throwSpecial(f);

    const box = attackBox(f);
    const isActive =
      f.attack.frame >= f.attack.activeStart && f.attack.frame <= f.attack.activeEnd;
    if (box && isActive && !f.attack.hit && rectsOverlap(box, bodyBox(opponent))) {
      landHit(f, opponent, f.attack.damage);
      f.attack.hit = true;
    }
    if (f.attack.frame >= f.attack.duration) f.attack = null;
  }

  f.energy = clamp(f.energy + 0.045 + (Math.abs(f.vx) > 1 ? 0.012 : 0), 0, 100);
}

function updateProjectiles() {
  for (const p of projectiles) {
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 8) p.trail.shift();
    p.x += p.vx;
    p.life -= 1;

    const target = fighters.find((f) => f.id !== p.owner);
    if (target && p.life > 0 && circleRectOverlap(p, bodyBox(target))) {
      const owner = fighters.find((f) => f.id === p.owner);
      landHit(owner, target, p.damage, true, p);
      p.life = 0;
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    if (projectiles[i].life <= 0 || projectiles[i].x < -80 || projectiles[i].x > W + 80) {
      projectiles.splice(i, 1);
    }
  }
}

function keepApart(a, b) {
  const overlap = a.w - Math.abs(a.x - b.x);
  if (overlap > 0 && Math.abs(a.y - b.y) < fighterScale(120)) {
    const push = overlap / 2;
    if (a.x < b.x) {
      a.x -= push;
      b.x += push;
    } else {
      a.x += push;
      b.x -= push;
    }
    a.x = clamp(a.x, FIGHTER_EDGE_PAD, W - FIGHTER_EDGE_PAD);
    b.x = clamp(b.x, FIGHTER_EDGE_PAD, W - FIGHTER_EDGE_PAD);
  }
}

function bodyBox(f) {
  const crouch = f.blocking ? fighterScale(16) : 0;
  return {
    x: f.x - f.w / 2,
    y: f.y - f.h + crouch,
    w: f.w,
    h: f.h - crouch,
  };
}

function attackBox(f) {
  if (!f.attack || f.attack.type === "special") return null;
  const yOffset =
    f.attack.type === "sweep" ? fighterScale(34) : f.attack.type === "kick" || f.attack.type === "airKick" ? fighterScale(77) : fighterScale(112);
  const reach = fighterScale(f.attack.reach);
  return {
    x: f.dir > 0 ? f.x + fighterScale(21) : f.x - fighterScale(21) - reach,
    y: f.y - yOffset,
    w: reach,
    h: fighterScale(f.attack.height),
  };
}

function hitZoneFor(attacker, target, projectileInfo, attackType) {
  if (attackType === "sweep") return "legs";
  if (attackType === "grab") return "torso";

  let hitY = null;
  if (projectileInfo) {
    hitY = projectileInfo.y;
  } else if (attacker) {
    const box = attackBox(attacker);
    if (box) hitY = box.y + box.h * 0.5;
  }

  if (!Number.isFinite(hitY)) {
    if (attackType === "punch" || attackType === "airPunch" || projectileInfo) return "head";
    if (attackType === "kick" || attackType === "airKick") return "torso";
    return "torso";
  }

  const box = bodyBox(target);
  const ratio = clamp((hitY - box.y) / Math.max(1, box.h), 0, 1);
  if (ratio < 0.34) return "head";
  if (ratio < 0.7) return "torso";
  return "legs";
}

function hitZoneReaction(zone, blocked, projectile, heavyImpact, finishingHit) {
  if (blocked) {
    return {
      yOffset: 108,
      hurtBonus: 0,
      lift: 0.45,
      vx: 3.1,
      vy: -1.35,
      damageBonus: 0,
      pulse: 10,
      dust: 4,
    };
  }

  if (zone === "head") {
    return {
      yOffset: projectile ? 120 : 124,
      hurtBonus: finishingHit ? 4 : 5,
      lift: finishingHit ? 2.25 : projectile ? 1.72 : 1.62,
      vx: finishingHit ? 8.8 : projectile ? 6.2 : heavyImpact ? 7.25 : 6.15,
      vy: finishingHit ? -5.7 : projectile ? -3.75 : heavyImpact ? -4.85 : -4.2,
      damageBonus: 0.18,
      pulse: finishingHit ? 34 : 26,
      dust: heavyImpact || projectile ? 9 : 6,
    };
  }

  if (zone === "legs") {
    return {
      yOffset: 48,
      hurtBonus: heavyImpact ? 4 : 2,
      lift: finishingHit ? 1.1 : projectile ? 0.9 : 0.62,
      vx: finishingHit ? 8.6 : heavyImpact ? 7.6 : 6.25,
      vy: finishingHit ? -4.3 : heavyImpact ? -2.7 : -2.2,
      damageBonus: 0.1,
      pulse: finishingHit ? 32 : 24,
      dust: heavyImpact ? 13 : 10,
    };
  }

  return {
    yOffset: projectile ? 108 : heavyImpact ? 90 : 96,
    hurtBonus: heavyImpact || projectile ? 2 : 0,
    lift: finishingHit ? 2.1 : projectile ? 1.35 : heavyImpact ? 1.48 : 1,
    vx: finishingHit ? 8.4 : projectile ? 5.8 : heavyImpact ? 7 : 5.9,
    vy: finishingHit ? -5.4 : projectile ? -3.45 : heavyImpact ? -4.45 : -3.75,
    damageBonus: 0,
    pulse: finishingHit ? 34 : heavyImpact || projectile ? 24 : 18,
    dust: heavyImpact ? 10 : 7,
  };
}

function landHit(attacker, target, damage, projectile = false, projectileInfo = null) {
  const unblockable = attacker?.attack?.type === "grab";
  const counter = attacker?.counterWindow > 0;
  const blocked = !unblockable && target.blocking && attacker && target.dir !== attacker.dir;
  const attackType = attacker?.attack?.type ?? "";
  const heavyImpact = projectile || attackType === "kick" || attackType === "airKick" || attackType === "sweep" || attackType === "grab";
  const finalDamage = blocked ? Math.ceil(damage * 0.28) : damage + (counter ? 4 : 0);
  const impactDir = attacker?.dir ?? target.dir * -1;
  const impactColor = blocked ? "#bdeaff" : projectile ? "#fff0a6" : counter ? "#fff1bd" : "#ffd44d";
  const impactStrength = blocked ? 0.42 : counter ? 1.35 : projectile ? 1.18 : heavyImpact ? 1.08 : 0.78;
  const previousHealth = target.health;
  const nextHealth = clamp(target.health - finalDamage, 0, 100);
  const finishingHit = !blocked && previousHealth > 0 && nextHealth <= 0;
  const cinematicHit = !blocked && (finishingHit || counter || projectile || attackType === "kick" || attackType === "airKick" || attackType === "grab");
  const hitZone = blocked ? "guard" : hitZoneFor(attacker, target, projectileInfo, attackType);
  const zone = hitZoneReaction(hitZone, blocked, projectile, heavyImpact, finishingHit);

  target.health = nextHealth;
  target.hurt = finishingHit ? 38 + zone.hurtBonus : blocked ? 9 : attacker?.attack?.type === "grab" ? 30 : projectile ? 21 + zone.hurtBonus : 24 + zone.hurtBonus;
  target.hitFlash = blocked ? 8 : projectile ? 20 : heavyImpact ? 17 : 14;
  target.contactFlash = blocked ? 7 : heavyImpact ? 14 : 11;
  target.impactPulse = finishingHit ? 24 : blocked ? 8 : Math.round(13 + impactStrength * 5);
  target.impactDir = impactDir;
  target.impactLift = zone.lift;
  target.impactStrength = impactStrength;
  target.hitZone = hitZone;
  target.hitZonePulse = Math.max(target.hitZonePulse ?? 0, zone.pulse);
  target.damagePulse = blocked ? Math.max(target.damagePulse ?? 0, 8) : finishingHit ? 34 : Math.max(target.damagePulse ?? 0, heavyImpact || projectile || counter ? 24 : zone.pulse);
  target.damageLevel = blocked ? 0.35 : finishingHit ? 1.65 : counter ? 1.45 : projectile ? 1.22 + zone.damageBonus : heavyImpact ? 1.08 + zone.damageBonus : 0.82 + zone.damageBonus;
  if (finishingHit) {
    target.koFall = Math.max(target.koFall ?? 0, 86);
    target.koFallDir = impactDir;
    target.koFallStrength = impactStrength;
  }
  target.guardImpact = blocked ? Math.max(target.guardImpact ?? 0, heavyImpact || projectile ? 16 : 13) : 0;
  if (!blocked && target.health < 32) {
    target.staggerPulse = Math.max(target.staggerPulse ?? 0, heavyImpact || projectile ? 18 : 13);
  }
  if (hitZone === "legs") target.crouch = Math.max(target.crouch ?? 0, heavyImpact ? 0.56 : 0.38);
  target.vx = impactDir * zone.vx;
  target.vy = target.grounded ? zone.vy : target.vy;
  if (attacker) {
    attacker.energy = clamp(attacker.energy + (blocked ? 3 : 8), 0, 100);
    attacker.impactPulse = Math.max(attacker.impactPulse ?? 0, blocked ? 3 : heavyImpact ? 5 : 4);
    attacker.impactDir = impactDir;
    attacker.impactLift = 0.22;
    attacker.impactStrength = Math.max(attacker.impactStrength ?? 0, blocked ? 0.25 : 0.4);
    attacker.vx -= impactDir * (blocked ? 0.35 : 0.18);
  }
  if (blocked) target.counterWindow = 34;
  if (counter && attacker) attacker.counterWindow = 0;
  flash = blocked ? 2 : Math.max(flash, finishingHit ? 12 : projectile || counter ? 10 : heavyImpact ? 8 : 5);
  shake = blocked ? Math.max(shake, 3) : Math.max(shake, finishingHit ? 13 : projectile || counter ? 10 : heavyImpact ? 8 : 6);
  hitStopFrames = blocked ? Math.max(hitStopFrames, 2) : Math.max(hitStopFrames, finishingHit ? 8 : counter ? 7 : projectile ? 7 : heavyImpact ? 5 : 3);
  playSound(blocked ? "block" : "hit");
  addText(
    target.x,
    target.y - (hitZone === "legs" ? 78 : hitZone === "head" ? 166 : 154),
    blocked ? "BLOCK" : counter ? "COUNTER" : unblockable ? "GRAB" : projectile ? "SPECIAL" : hitZone === "head" ? "HEAD" : hitZone === "legs" ? "LOW" : "HIT",
    blocked ? "#bdeaff" : counter ? "#fff1bd" : "#ffd44d",
  );
  const impactX = target.x - target.dir * (hitZone === "legs" ? 18 : hitZone === "head" ? 30 : 26);
  const impactY = target.y - zone.yOffset;
  triggerCameraImpact(impactDir, blocked, heavyImpact, counter, impactStrength);
  if (cinematicHit) {
    const cinematicStrength = finishingHit ? 1.62 : counter ? 1.42 : projectile ? 1.28 : 1.04;
    triggerCinematicHit(impactDir, impactColor, cinematicStrength, finishingHit ? 18 : projectile || counter ? 15 : 11);
  }
  burst(
    target.x - target.dir * 22,
    impactY,
    blocked ? "#bdeaff" : projectile ? "#fff0a6" : "#ffd44d",
    blocked ? 8 : projectile ? 20 : heavyImpact ? 16 : 14,
  );
  impactBurst(
    impactX,
    impactY,
    impactColor,
    blocked,
    heavyImpact,
  );
  impactShockwave(
    impactX - target.dir * 2,
    impactY,
    impactColor,
    blocked,
    heavyImpact,
  );
  impactGlints(impactX, impactY, impactColor, blocked, heavyImpact);
  contactFlashBurst(impactX, impactY, impactColor, impactDir, blocked, heavyImpact, counter);
  cinematicImpact(impactX, impactY, impactColor, impactDir, blocked, heavyImpact, counter);
  premiumImpactFX(impactX, impactY, target, impactColor, impactDir, blocked, heavyImpact, counter, projectile);
  if (cinematicHit) cinematicSpecialImpactFX(impactX, impactY, target, attacker, projectileInfo, impactColor, impactDir, finishingHit, projectile, counter);
  floorDust(target.x, target.y + 3, blocked ? 4 : zone.dust);
}

function triggerCameraImpact(dir, blocked, heavyImpact, counter, strength) {
  const pulse = blocked ? 6 : counter ? 14 : heavyImpact ? 12 : 9;
  if (pulse < cameraImpactPulse) return;

  cameraImpactPulse = pulse;
  cameraImpactMax = pulse;
  cameraImpactDir = dir || 1;
  cameraImpactStrength = blocked ? 0.45 : counter ? 1.28 : strength;
}

function triggerCinematicHit(dir, color, strength = 1, pulse = 12) {
  if (pulse < cinematicHitPulse) return;
  cinematicHitPulse = pulse;
  cinematicHitMax = pulse;
  cinematicHitDir = dir || 1;
  cinematicHitColor = color || "#fff1bd";
  cinematicHitStrength = strength;
}

function contactFlashBurst(x, y, color, dir, blocked, heavyImpact, counter) {
  const strength = blocked ? 0.48 : counter ? 1.35 : heavyImpact ? 1.08 : 0.82;
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    angle: dir > 0 ? 0 : Math.PI,
    life: blocked ? 8 : counter ? 13 : heavyImpact ? 12 : 10,
    maxLife: blocked ? 8 : counter ? 13 : heavyImpact ? 12 : 10,
    size: blocked ? 22 : counter ? 42 : heavyImpact ? 36 : 30,
    color,
    strength,
    kind: "contactFlash",
  });

  if (!blocked) {
    particles.push({
      x: x - dir * 7,
      y: y + 6,
      vx: dir * 0.8,
      vy: 0,
      angle: dir > 0 ? -0.08 : Math.PI + 0.08,
      life: heavyImpact ? 15 : 12,
      maxLife: heavyImpact ? 15 : 12,
      size: heavyImpact ? 74 : 54,
      color,
      strength,
      kind: "recoilArc",
    });
  }

  const shardCount = blocked ? 4 : heavyImpact ? 10 : 7;
  const spread = blocked ? 0.78 : heavyImpact ? 1.18 : 0.98;
  const base = dir > 0 ? 0 : Math.PI;
  for (let i = 0; i < shardCount; i += 1) {
    const lane = shardCount === 1 ? 0 : i / (shardCount - 1) - 0.5;
    const angle = base + lane * spread + (Math.random() - 0.5) * 0.16;
    const speed = blocked ? 1.1 : heavyImpact ? 3.2 : 2.45;
    particles.push({
      x,
      y: y + lane * 18,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.42 - (blocked ? 0.2 : 0.45),
      angle,
      life: blocked ? 10 + Math.random() * 5 : 13 + Math.random() * 7,
      maxLife: blocked ? 12 : 17,
      size: blocked ? 8 : heavyImpact ? 14 : 11,
      color,
      strength,
      kind: "hitShard",
    });
  }
}

function attackWhoosh(f) {
  if (!f.attack) return;
  const spec = attackVisualSpec(f.attack.type);
  const dir = f.dir || 1;
  const x = f.x + dir * fighterScale(spec.trailReach * 0.42);
  const y = f.y + fighterScale(spec.trailY);
  const angle = dir > 0 ? 0 : Math.PI;
  const size = spec.sweep ? 34 : spec.kick ? 38 : spec.special ? 43 : spec.grab ? 31 : 28;
  const life = spec.heavy || spec.grab ? 13 : 10;

  particles.push({
    x,
    y,
    vx: dir * 0.36,
    vy: 0,
    angle,
    life,
    maxLife: life,
    size,
    growth: spec.heavy ? 1.65 : 1.35,
    color: spec.color,
    kind: "airRipple",
  });

  const count = spec.sweep ? 5 : spec.kick ? 6 : spec.special ? 7 : spec.grab ? 4 : 4;
  for (let i = 0; i < count; i += 1) {
    const lane = count === 1 ? 0 : i / (count - 1) - 0.5;
    particles.push({
      x: x - dir * fighterScale(10 + Math.random() * 12),
      y: y + fighterScale(lane * spec.trailHeight * 1.15),
      vx: dir * (0.38 + Math.random() * 0.45),
      vy: lane * 0.16,
      angle: angle + lane * (spec.sweep ? 0.26 : spec.kick ? 0.34 : 0.22),
      length: fighterScale((spec.sweep ? 60 : spec.kick ? 72 : spec.special ? 66 : 48) * (0.86 + Math.random() * 0.25)),
      life: life + Math.random() * 5,
      maxLife: life + 4,
      size: spec.kick || spec.sweep ? 3.8 : spec.special ? 3.5 : 2.7,
      color: spec.core,
      kind: "impactNeedle",
    });
  }

  if (f.grounded) {
    movementDust(f.x - dir * fighterScale(spec.sweep ? 18 : 28), FLOOR + 5, -dir, spec.heavy ? 0.9 : 0.62, spec.sweep ? 4 : spec.heavy ? 3 : 2);
  }
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: Math.cos((Math.PI * 2 * i) / count) * (1.2 + Math.random() * 4),
      vy: Math.sin((Math.PI * 2 * i) / count) * (1.2 + Math.random() * 4),
      life: 18 + Math.random() * 14,
      size: 2.2 + Math.random() * 2.8,
      color,
    });
  }
}

function impactBurst(x, y, color, blocked, heavyImpact = false) {
  const count = blocked ? 4 : heavyImpact ? 9 : 7;
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      angle: -0.7 + i * (1.4 / Math.max(1, count - 1)),
      length: blocked ? 18 + Math.random() * 14 : heavyImpact ? 34 + Math.random() * 30 : 26 + Math.random() * 24,
      life: blocked ? 13 + Math.random() * 8 : heavyImpact ? 18 + Math.random() * 12 : 15 + Math.random() * 10,
      size: blocked ? 3 : heavyImpact ? 4.6 : 3.8,
      color,
      kind: "slash",
    });
  }
}

function impactShockwave(x, y, color, blocked, heavyImpact = false) {
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: blocked ? 14 : heavyImpact ? 22 : 18,
    maxLife: blocked ? 14 : heavyImpact ? 22 : 18,
    size: blocked ? 14 : heavyImpact ? 25 : 20,
    growth: blocked ? 1.5 : heavyImpact ? 2.45 : 2.05,
    color,
    kind: "ring",
  });

  const count = blocked ? 4 : heavyImpact ? 9 : 6;
  for (let i = 0; i < count; i += 1) {
    const angle = -0.75 + i * (1.5 / Math.max(1, count - 1));
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (1.1 + Math.random() * (heavyImpact ? 2.8 : 2.1)),
      vy: Math.sin(angle) * (1 + Math.random() * (heavyImpact ? 2.2 : 1.7)),
      life: 12 + Math.random() * 8,
      size: blocked ? 2.5 : heavyImpact ? 4 : 3.3,
      color,
      kind: "spark",
    });
  }
}

function impactGlints(x, y, color, blocked, heavyImpact) {
  const count = blocked ? 2 : heavyImpact ? 5 : 3;
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: x + (Math.random() - 0.5) * 18,
      y: y + (Math.random() - 0.5) * 18,
      vx: (Math.random() - 0.5) * 1.8,
      vy: -0.6 - Math.random() * 1.6,
      life: 12 + Math.random() * 8,
      size: blocked ? 5 : heavyImpact ? 8 : 6.5,
      color,
      kind: "glint",
    });
  }
}

function cinematicImpact(x, y, color, dir, blocked, heavyImpact, counter) {
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: blocked ? 8 : heavyImpact ? 13 : 10,
    maxLife: blocked ? 8 : heavyImpact ? 13 : 10,
    size: blocked ? 12 : heavyImpact ? 22 : 17,
    color,
    kind: "impactCore",
  });

  const count = blocked ? 2 : heavyImpact ? 6 : 4;
  const spread = blocked ? 0.44 : heavyImpact ? 0.78 : 0.6;
  const baseAngle = dir > 0 ? 0 : Math.PI;
  for (let i = 0; i < count; i += 1) {
    const lane = count === 1 ? 0 : i / (count - 1) - 0.5;
    const angle = baseAngle + lane * spread + (Math.random() - 0.5) * 0.08;
    const speed = blocked ? 0.85 : heavyImpact ? 1.65 : 1.25;
    particles.push({
      x: x - Math.cos(angle) * (blocked ? 4 : 8),
      y: y - 8 + lane * 24,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.35,
      angle,
      length: blocked ? 24 : heavyImpact ? 68 : 48,
      life: blocked ? 10 : heavyImpact ? 16 : 13,
      maxLife: blocked ? 10 : heavyImpact ? 16 : 13,
      size: blocked ? 2.4 : heavyImpact ? 4.6 : 3.4,
      color,
      kind: "impactLine",
    });
  }

  if (counter || heavyImpact) {
    particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: counter ? 18 : 14,
      maxLife: counter ? 18 : 14,
      size: counter ? 31 : 24,
      growth: counter ? 2.6 : 2.1,
      color: counter ? "#fff1bd" : color,
      kind: "ring",
    });
  }
}

function premiumImpactFX(x, y, target, color, dir, blocked, heavyImpact, counter, projectile) {
  const strength = blocked ? 0.55 : counter ? 1.42 : projectile ? 1.24 : heavyImpact ? 1.12 : 0.88;
  const baseAngle = dir > 0 ? 0 : Math.PI;
  const rippleLife = blocked ? 12 : counter ? 18 : heavyImpact ? 16 : 14;
  particles.push({
    x: x - dir * 3,
    y,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: rippleLife,
    maxLife: rippleLife,
    size: 28 + strength * 16,
    growth: 1.9 + strength * 0.72,
    color,
    kind: "airRipple",
  });

  if (blocked) {
    particles.push({
      x: x - dir * 8,
      y,
      vx: dir * 0.18,
      vy: 0,
      angle: baseAngle,
      life: 15,
      maxLife: 15,
      size: 34,
      color: "#bdeaff",
      kind: "guardPlate",
    });
  }

  const needleCount = blocked ? 3 : counter ? 10 : heavyImpact || projectile ? 8 : 5;
  const spread = blocked ? 0.36 : counter ? 0.86 : heavyImpact ? 0.72 : 0.58;
  for (let i = 0; i < needleCount; i += 1) {
    const lane = needleCount === 1 ? 0 : i / (needleCount - 1) - 0.5;
    const angle = baseAngle + lane * spread + (Math.random() - 0.5) * 0.1;
    const speed = blocked ? 0.32 : heavyImpact ? 0.92 : 0.68;
    particles.push({
      x: x - Math.cos(angle) * 10,
      y: y + lane * (blocked ? 22 : 32),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.26,
      angle,
      length: (blocked ? 26 : heavyImpact ? 72 : 54) * (0.82 + Math.random() * 0.38),
      life: blocked ? 9 + Math.random() * 5 : 12 + Math.random() * 7,
      maxLife: blocked ? 11 : 16,
      size: blocked ? 2.2 : heavyImpact ? 4.4 : 3.2,
      color,
      kind: "impactNeedle",
    });
  }

  if (!blocked) {
    const floorY = Math.min(FLOOR + 4, target.y + 4);
    const shockLife = heavyImpact || counter || projectile ? 22 : 17;
    particles.push({
      x: target.x - dir * 8,
      y: floorY,
      vx: dir * 0.45,
      vy: 0,
      angle: dir > 0 ? 0 : Math.PI,
      life: shockLife,
      maxLife: shockLife,
      size: heavyImpact || counter ? 52 : 38,
      growth: heavyImpact || counter ? 2.4 : 1.9,
      color: "rgba(226, 197, 135, 0.72)",
      kind: "floorShock",
    });

    const ribbonCount = heavyImpact || projectile ? 8 : 5;
    for (let i = 0; i < ribbonCount; i += 1) {
      particles.push({
        x: target.x + (Math.random() - 0.5) * 38,
        y: floorY + Math.random() * 3,
        vx: -dir * (0.45 + Math.random() * 1.1),
        vy: -0.24 - Math.random() * 0.44,
        angle: (Math.random() - 0.5) * 0.12,
        life: 18 + Math.random() * 10,
        maxLife: 24,
        size: 10 + Math.random() * 13,
        color: "rgba(214, 182, 120, 0.48)",
        kind: "dustRibbon",
      });
    }
  }

  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: blocked ? 6 : heavyImpact || counter ? 9 : 7,
    maxLife: blocked ? 6 : heavyImpact || counter ? 9 : 7,
    size: blocked ? 30 : heavyImpact || counter ? 58 : 44,
    color,
    strength,
    kind: "impactBloom",
  });
}

function cinematicSpecialImpactFX(x, y, target, attacker, projectileInfo, color, dir, finishingHit, projectile, counter) {
  const style = fighterSignatureStyle(attacker ?? { specialStyle: projectileInfo?.style });
  const strength = finishingHit ? 1.55 : counter ? 1.36 : projectile ? 1.24 : 1;
  const baseAngle = dir > 0 ? 0 : Math.PI;
  const bloomSize = projectile ? 76 : counter ? 70 : 58;

  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: finishingHit ? 17 : 13,
    maxLife: finishingHit ? 17 : 13,
    size: bloomSize,
    color: style.rim,
    strength,
    kind: "impactBloom",
  });

  particles.push({
    x: x - dir * fighterScale(6),
    y,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: finishingHit ? 20 : 16,
    maxLife: finishingHit ? 20 : 16,
    size: projectile ? 48 : 38,
    growth: finishingHit ? 2.9 : 2.35,
    color: style.core,
    kind: "ring",
  });

  const laneCount = projectile || counter ? 13 : 9;
  for (let i = 0; i < laneCount; i += 1) {
    const lane = i / Math.max(1, laneCount - 1) - 0.5;
    const angle = baseAngle + lane * (projectile ? 0.92 : 0.72) + (Math.random() - 0.5) * 0.08;
    particles.push({
      x: x - dir * fighterScale(16),
      y: y + lane * fighterScale(48),
      vx: Math.cos(angle) * (0.68 + strength * 0.28),
      vy: Math.sin(angle) * 0.42,
      angle,
      length: fighterScale((projectile ? 92 : 72) * (0.82 + Math.random() * 0.36)),
      life: 14 + Math.random() * (projectile ? 10 : 7),
      maxLife: projectile ? 22 : 18,
      size: 3.1 + strength * 1.2,
      color: i % 2 ? style.core : style.trail,
      kind: "impactNeedle",
    });
  }

  if (attacker?.profileId === "p2") {
    for (let i = 0; i < 7; i += 1) {
      const angle = baseAngle + (i / 6 - 0.5) * 0.82;
      particles.push({
        x: x - dir * fighterScale(12),
        y: y + (Math.random() - 0.5) * fighterScale(42),
        vx: Math.cos(angle) * (0.78 + Math.random() * 0.45),
        vy: Math.sin(angle) * 0.5 - 0.18,
        angle,
        life: 16 + Math.random() * 7,
        maxLife: 21,
        size: 7 + Math.random() * 5,
        color: i % 2 ? style.trail : style.rim,
        kind: "hitShard",
      });
    }
  } else if (attacker?.profileId === "p1") {
    for (let i = 0; i < 8; i += 1) {
      particles.push({
        x: target.x + (Math.random() - 0.5) * fighterScale(58),
        y: target.y - fighterScale(92 + Math.random() * 54),
        vx: -dir * (0.18 + Math.random() * 0.44),
        vy: -0.55 - Math.random() * 1.15,
        life: 17 + Math.random() * 10,
        size: 3.4 + Math.random() * 3.8,
        color: "rgba(143, 226, 255, 0.82)",
        kind: "droplet",
      });
    }
  }
}

function attackVisualSpec(type = "") {
  const punch = type === "punch" || type === "airPunch";
  const kick = type === "kick" || type === "airKick";
  const sweep = type === "sweep";
  const grab = type === "grab";
  const special = type === "special";
  return {
    punch,
    kick,
    sweep,
    grab,
    special,
    heavy: kick || sweep || special,
    color: special ? "#fff1bd" : kick || sweep ? "#ffe87a" : grab ? "#ffd7a8" : "#9be7ff",
    core: special ? "#8fe2ff" : kick || sweep ? "#fff6bf" : grab ? "#fff0d0" : "#e8fbff",
    trailY: sweep ? -38 : kick ? -84 : special ? -118 : grab ? -112 : -126,
    trailReach: sweep ? 142 : kick ? 132 : special ? 104 : grab ? 94 : 98,
    trailHeight: sweep ? 20 : kick ? 30 : special ? 44 : grab ? 26 : 22,
    windupPull: sweep ? 9.5 : kick ? 8.4 : special ? 7.2 : grab ? 7.6 : 8.8,
    snapDrive: sweep ? 13.2 : kick ? 15.4 : special ? 10.8 : grab ? 11.2 : 12.6,
    followDrag: sweep ? 2.2 : kick ? 2.9 : special ? 2.5 : grab ? 2.6 : 2.3,
    bodyLift: sweep ? -2.8 : kick ? 3.8 : special ? 1.6 : grab ? 0.8 : 1.2,
    rotation: sweep ? 0.082 : kick ? -0.066 : special ? -0.052 : grab ? 0.058 : 0.064,
    echo: special ? 0.18 : kick || sweep ? 0.3 : grab ? 0.18 : 0.24,
  };
}

function coldWaterSplash(x, y, dir) {
  for (let i = 0; i < 18; i += 1) {
    const angle = -Math.PI * 0.78 + (i / 17) * Math.PI * 0.62;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (2.1 + Math.random() * 2.4) * dir,
      vy: Math.sin(angle) * (2.3 + Math.random() * 2.1),
      life: 18 + Math.random() * 14,
      size: 3 + Math.random() * 4,
      color: "rgba(143, 226, 255, 0.86)",
      kind: "droplet",
    });
  }
  impactShockwave(x, y + 8, "#8fe2ff", false, true);
}

function koCollapseFX(loser, winnerFighter) {
  const dir = loser.koFallDir || loser.impactDir || winnerFighter?.dir || 1;
  const floorY = Math.min(FLOOR + 5, loser.y + 5);
  const color = loser.trim ?? "#ffd44d";
  particles.push({
    x: loser.x + dir * fighterScale(6),
    y: floorY,
    vx: dir * 0.28,
    vy: 0,
    angle: dir > 0 ? 0 : Math.PI,
    life: 28,
    maxLife: 28,
    size: 58,
    growth: 2.75,
    color: "rgba(226, 197, 135, 0.78)",
    kind: "floorShock",
  });
  particles.push({
    x: loser.x - dir * fighterScale(18),
    y: loser.y - fighterScale(94),
    vx: dir * 0.25,
    vy: 0,
    angle: dir > 0 ? 0.08 : Math.PI - 0.08,
    life: 18,
    maxLife: 18,
    size: 62,
    color,
    strength: 1.35,
    kind: "contactFlash",
  });
  for (let i = 0; i < 12; i += 1) {
    particles.push({
      x: loser.x + (Math.random() - 0.5) * fighterScale(64),
      y: floorY + Math.random() * 4,
      vx: -dir * (0.35 + Math.random() * 1.35),
      vy: -0.35 - Math.random() * 0.8,
      angle: (Math.random() - 0.5) * 0.18,
      life: 18 + Math.random() * 16,
      maxLife: 28,
      size: 9 + Math.random() * 16,
      color: "rgba(214, 182, 120, 0.56)",
      kind: "dustRibbon",
    });
  }
  impactShockwave(loser.x - dir * fighterScale(12), loser.y - fighterScale(96), color, false, true);
}

function floorDust(x, y, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: x + (Math.random() - 0.5) * 34,
      y,
      vx: (Math.random() - 0.5) * 2.2,
      vy: -0.7 - Math.random() * 1.3,
      life: 18 + Math.random() * 18,
      size: 5 + Math.random() * 8,
      color: "rgba(219, 194, 138, 0.72)",
      kind: "dust",
    });
  }
}

function movementDust(x, y, dir, strength = 1, count = 3) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: x + (Math.random() - 0.5) * 18,
      y: y + Math.random() * 3,
      vx: dir * (0.35 + Math.random() * 1.1) * strength + (Math.random() - 0.5) * 0.45,
      vy: -0.2 - Math.random() * 0.8 * strength,
      life: 12 + Math.random() * 9,
      size: (2.6 + Math.random() * 4.4) * strength,
      color: "rgba(219, 194, 138, 0.46)",
      kind: "dust",
    });
  }
}

function updateParticles() {
  particles = particles.filter((p) => {
    p.x += p.vx ?? 0;
    p.y += p.vy ?? 0;
    if (
      ![
        "slash",
        "ring",
        "impactCore",
        "impactLine",
        "contactFlash",
        "recoilArc",
        "airRipple",
        "impactNeedle",
        "guardPlate",
        "floorShock",
        "impactBloom",
      ].includes(p.kind)
    ) {
      p.vy = (p.vy ?? 0) + 0.13;
    }
    p.life -= 1;
    return p.life > 0;
  });
  if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
}

function addText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, life: 54 });
}

function updateFloatingTexts() {
  floatingTexts = floatingTexts.filter((t) => {
    t.y -= 0.6;
    t.life -= 1;
    return t.life > 0;
  });
}

function isMobileFightView() {
  return mobileFightQuery.matches || window.innerWidth <= 920 || window.innerHeight <= 520;
}

function cameraAttackLead(f) {
  if (!f.attack) return 0;
  const progress = attackProgress(f.attack);
  const reach = f.attack.type === "kick" || f.attack.type === "airKick" ? 18 : f.attack.type === "special" ? 26 : 12;
  return f.dir * reach * progress;
}

function cameraPanLimit(zoom, mobileView) {
  const safe = Math.max(0, (zoom - 1) * W * 0.5 + (mobileView ? 7 : 12));
  return Math.min(mobileView ? 31 : 52, safe);
}

function applyCamera() {
  const [a, b] = fighters;
  const distance = Math.abs(a.x - b.x);
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const mobileView = isMobileFightView();
  const margin = mobileView ? 116 : 138;
  const center = (a.x + b.x) / 2;
  const velocityLead = clamp((a.vx + b.vx) * (mobileView ? 1.6 : 2.4), mobileView ? -16 : -25, mobileView ? 16 : 25);
  const attackLead = clamp((cameraAttackLead(a) + cameraAttackLead(b)) * 0.5, mobileView ? -16 : -24, mobileView ? 16 : 24);
  const focusX = clamp(center + velocityLead + attackLead, margin, W - margin);
  const leftPressure = clamp((margin - minX) / margin, 0, 1);
  const rightPressure = clamp((maxX - (W - margin)) / margin, 0, 1);
  const edgePressure = Math.max(leftPressure, rightPressure);
  const edgeBias = (leftPressure - rightPressure) * (mobileView ? 19 : 34);
  const close = 1 - clamp(distance / (mobileView ? 560 : 650), 0, 1);
  const speed = clamp((Math.abs(a.vx) + Math.abs(b.vx)) / 7.2, 0, 1);
  const action = clamp((a.attack ? attackProgress(a.attack) : 0) + (b.attack ? attackProgress(b.attack) : 0), 0, 1);
  const air = clamp(((FLOOR - a.y) + (FLOOR - b.y)) / 220, 0, 1);
  const targetZoom = clamp(
    1 + close * (mobileView ? 0.03 : 0.068) + action * (mobileView ? 0.004 : 0.008) + edgePressure * (mobileView ? 0.004 : 0.01) - speed * (mobileView ? 0.004 : 0.008),
    1,
    mobileView ? 1.052 : 1.092
  );
  const panLimit = cameraPanLimit(targetZoom, mobileView);
  const targetPan = clamp((W / 2 - focusX) * (mobileView ? 0.068 : 0.108) + edgeBias, -panLimit, panLimit);
  const targetLift = (mobileView ? 13 : 8) + air * (mobileView ? 9 : 14) - close * (mobileView ? 0.8 : 1.5);
  const ease = mobileView ? 0.22 : 0.145;

  cameraZoom += (targetZoom - cameraZoom) * ease;
  cameraPan += (targetPan - cameraPan) * ease;
  cameraLift += (targetLift - cameraLift) * ease;

  const impactT = cameraImpactPulse > 0 ? clamp(cameraImpactPulse / Math.max(1, cameraImpactMax), 0, 1) : 0;
  const impactEase = impactT * impactT * cameraImpactStrength;
  const cinematicT = cinematicHitPulse > 0 ? clamp(cinematicHitPulse / Math.max(1, cinematicHitMax), 0, 1) : 0;
  const cinematicEase = cinematicT * cinematicT * cinematicHitStrength;
  const impactZoom = impactEase * (mobileView ? 0.012 : 0.028) + cinematicEase * (mobileView ? 0.01 : 0.022);
  const impactPan = cameraImpactDir * impactEase * (mobileView ? 4.5 : 8.5) + cinematicHitDir * cinematicEase * (mobileView ? 3.2 : 6.4);
  const impactLift = -impactEase * (mobileView ? 1.8 : 3.8) - cinematicEase * (mobileView ? 1.1 : 2.6);
  const drawZoom = cameraZoom + impactZoom;
  const drawPan = clamp(cameraPan + impactPan, -cameraPanLimit(drawZoom, mobileView), cameraPanLimit(drawZoom, mobileView));

  ctx.translate(W / 2 + drawPan, H / 2 + cameraLift + impactLift);
  ctx.scale(drawZoom, drawZoom);
  ctx.translate(-W / 2, -H / 2);
}

function draw() {
  ctx.save();
  if (shake > 0) {
    const amount = shake * (isMobileFightView() ? 0.14 : 0.22);
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  applyCamera();
  drawStage();
  drawProjectiles();
  drawFighter(fighters[0]);
  drawFighter(fighters[1]);
  drawParticles();
  drawFloatingTexts();
  ctx.restore();

  drawHud();
  drawCountdown();
  drawKOBanner();
  drawCinematicHitOverlay();

  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 245, 205, ${Math.min(0.24, flash / 64)})`;
    ctx.fillRect(0, 0, W, H);
  }

}

function drawCinematicHitOverlay() {
  if (cinematicHitPulse <= 0 || cinematicHitStrength <= 0) return;
  const t = clamp(cinematicHitPulse / Math.max(1, cinematicHitMax), 0, 1);
  const ease = t * t * cinematicHitStrength;
  const bandAlpha = Math.min(0.1, ease * 0.075);
  const flareAlpha = Math.min(0.18, ease * 0.14);
  const shift = cinematicHitDir * ease * 18;

  ctx.save();
  ctx.fillStyle = `rgba(6, 3, 2, ${bandAlpha})`;
  ctx.fillRect(0, 0, W, 34);
  ctx.fillRect(0, H - 34, W, 34);

  ctx.globalCompositeOperation = "screen";
  const flare = ctx.createRadialGradient(W / 2 + shift, H / 2 - 30, 10, W / 2 + shift, H / 2 - 30, 410);
  flare.addColorStop(0, colorWithAlpha(cinematicHitColor, flareAlpha));
  flare.addColorStop(0.26, colorWithAlpha(cinematicHitColor, flareAlpha * 0.42));
  flare.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = flare;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = colorWithAlpha(cinematicHitColor, Math.min(0.28, ease * 0.22));
  ctx.lineWidth = 2.2 + ease * 2.4;
  ctx.beginPath();
  ctx.moveTo(W * 0.18 + shift, 38);
  ctx.lineTo(W * 0.82 + shift, 22);
  ctx.moveTo(W * 0.18 - shift, H - 28);
  ctx.lineTo(W * 0.82 - shift, H - 44);
  ctx.stroke();
  ctx.restore();
}

function drawFloatingTexts() {
  for (const t of floatingTexts) {
    ctx.globalAlpha = clamp(t.life / 24, 0, 1);
    ctx.fillStyle = t.color;
    ctx.font = "900 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(45, 21, 14, 0.85)";
    ctx.lineWidth = 4;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

function drawCountdown() {
  if (countdownFrames <= 0 || !running || paused) return;
  const label = countdownFrames <= 36 ? "FIGHT" : String(Math.ceil((countdownFrames - 36) / 48));
  const pulse = 1 + Math.sin(countdownFrames * 0.18) * (label === "FIGHT" ? 0.065 : 0.04);

  ctx.save();
  const band = ctx.createLinearGradient(0, 185, W, 339);
  band.addColorStop(0, "rgba(0,0,0,0.025)");
  band.addColorStop(0.5, "rgba(73,18,13,0.07)");
  band.addColorStop(1, "rgba(0,0,0,0.025)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 185, W, 154);
  ctx.strokeStyle = "rgba(255, 241, 189, 0.16)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 185);
  ctx.lineTo(W, 185);
  ctx.moveTo(0, 339);
  ctx.lineTo(W, 339);
  ctx.stroke();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(255, 217, 95, 0.3)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(110, 324);
  ctx.lineTo(350, 198);
  ctx.moveTo(610, 202);
  ctx.lineTo(850, 324);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  ctx.translate(W / 2, H / 2 - 8);
  ctx.scale(pulse, pulse);
  ctx.textAlign = "center";
  ctx.font = label === "FIGHT" ? "900 92px system-ui, sans-serif" : "900 126px system-ui, sans-serif";
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgba(49, 20, 17, 0.96)";
  ctx.fillStyle = "#fff1bd";
  ctx.strokeText(label, 0, 0);
  ctx.fillText(label, 0, 0);
  ctx.font = "900 19px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 247, 214, 0.92)";
  ctx.fillText(`${fighters[0].name.toUpperCase()}  VS  ${fighters[1].name.toUpperCase()}`, 0, 48);
  ctx.restore();
}

function drawStage() {
  const premiumReady = stageArt.complete && stageArt.naturalWidth > 0;
  const mode = premiumReady ? "premium" : "fallback";
  if (!stageCacheReady || stageCacheMode !== mode) buildStageCache(premiumReady);
  ctx.drawImage(stageCache, 0, 0);

  if (premiumReady) {
    drawDynamicStageOverlays();
  } else {
    drawFloorContactLight();
  }
}

function buildStageCache(premiumReady) {
  const cacheCtx = stageCache.getContext("2d");
  cacheCtx.clearRect(0, 0, W, H);
  withContext(cacheCtx, () => {
    if (premiumReady) {
      drawCoverImage(stageArt, 0, 0, W, H);
      drawWallPortraits();
      drawDojoSign();
      drawVignette();
      return;
    }

    const wall = ctx.createLinearGradient(0, 0, 0, FLOOR);
    wall.addColorStop(0, "#f7e8c9");
    wall.addColorStop(0.46, "#e2bd82");
    wall.addColorStop(1, "#8d542f");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, FLOOR);

    drawCeiling();
    drawGardenView();
    drawBackWallDetails();
    drawShojiPanels();
    drawWallPortraits();
    drawDojoSign();
    drawLanterns();
    drawWeaponRack();
    drawTatamiFloor();
    drawForegroundPosts();
    drawVignette();
  });
  stageCacheReady = true;
  stageCacheMode = premiumReady ? "premium" : "fallback";
}

function withContext(nextCtx, drawFn) {
  const previous = ctx;
  ctx = nextCtx;
  try {
    drawFn();
  } finally {
    ctx = previous;
  }
}

function drawCoverImage(image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceW = width / scale;
  const sourceH = height / scale;
  const sourceX = (image.naturalWidth - sourceW) / 2;
  const sourceY = (image.naturalHeight - sourceH) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, width, height);
}

function drawDynamicStageOverlays() {
  drawAmbientLight();
  drawCinematicLightBeams();
  drawFloorReflections();
  drawFloorContactLight();
  drawStageAtmosphere();
}

function drawAmbientLight() {
  const t = roundFrame * 0.018;
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const x of [276, 684]) {
    const pulse = 0.23 + Math.sin(t + x * 0.01) * 0.04;
    const glow = ctx.createRadialGradient(x, 120, 12, x, 120, 132);
    glow.addColorStop(0, `rgba(255, 199, 87, ${pulse})`);
    glow.addColorStop(0.45, "rgba(255, 160, 64, 0.08)");
    glow.addColorStop(1, "rgba(255, 160, 64, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, 120, 132, 0, Math.PI * 2);
    ctx.fill();
  }

  const shaft = ctx.createLinearGradient(290, 40, 630, FLOOR);
  shaft.addColorStop(0, "rgba(255, 242, 196, 0.13)");
  shaft.addColorStop(1, "rgba(255, 242, 196, 0)");
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.moveTo(340, 38);
  ctx.lineTo(558, 38);
  ctx.lineTo(690, FLOOR);
  ctx.lineTo(210, FLOOR);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawCinematicLightBeams() {
  const drift = Math.sin(roundFrame * 0.01) * 10;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const beam of [
    { x: 170 + drift, w: 150, alpha: 0.08 },
    { x: 640 - drift * 0.6, w: 180, alpha: 0.07 },
  ]) {
    const light = ctx.createLinearGradient(beam.x, 30, beam.x + beam.w, FLOOR + 20);
    light.addColorStop(0, `rgba(255, 238, 188, ${beam.alpha})`);
    light.addColorStop(0.58, `rgba(255, 211, 126, ${beam.alpha * 0.45})`);
    light.addColorStop(1, "rgba(255, 211, 126, 0)");
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(beam.x, 42);
    ctx.lineTo(beam.x + beam.w * 0.42, 42);
    ctx.lineTo(beam.x + beam.w, FLOOR + 36);
    ctx.lineTo(beam.x - beam.w * 0.35, FLOOR + 36);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFloorReflections() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const f of fighters) {
    const alpha = f.grounded ? 0.08 : 0.035;
    const reflection = ctx.createLinearGradient(f.x, FLOOR - 12, f.x, H);
    reflection.addColorStop(0, colorWithAlpha(f.trim, alpha));
    reflection.addColorStop(0.4, colorWithAlpha(f.color, alpha * 0.45));
    reflection.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.ellipse(f.x, FLOOR + 44, 62 * FIGHTER_SCALE, 28 * FIGHTER_SCALE, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloorContactLight() {
  const floorGlow = ctx.createRadialGradient(W / 2, FLOOR + 40, 20, W / 2, FLOOR + 44, 430);
  floorGlow.addColorStop(0, "rgba(255, 242, 184, 0.16)");
  floorGlow.addColorStop(0.52, "rgba(255, 205, 107, 0.06)");
  floorGlow.addColorStop(1, "rgba(255, 205, 107, 0)");
  ctx.fillStyle = floorGlow;
  ctx.fillRect(0, FLOOR - 22, W, H - FLOOR + 22);

  for (const f of fighters) {
    drawDynamicFighterShadow(f);
  }
}

function drawDynamicFighterShadow(f) {
  const lift = clamp(FLOOR - f.y, 0, 170);
  const air = lift / 170;
  const phase = attackPhase(f.attack);
  const attack = phase.power;
  const spec = attackVisualSpec(f.attack?.type);
  const speed = clamp(Math.abs(f.vx) / 7, 0, 1);
  const landing = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  const step = clamp((f.stepPulse ?? 0) / 7, 0, 1);
  const heavySpread = spec.heavy || spec.grab ? 1 : 0;
  const width = (74 * (1 - air * 0.4) + attack * (12 + heavySpread * 17) + speed * 6 + landing * 24 + step * 7) * FIGHTER_SCALE;
  const height = (17 * (1 - air * 0.45) + attack * (spec.sweep ? 5 : heavySpread ? 2.8 : 1.6) + landing * 5 + step * 1.4) * FIGHTER_SCALE;
  const alpha = ((f.hurt > 0 ? 0.32 : 0.22) + attack * 0.06 + landing * 0.08 + step * 0.025) * (1 - air * 0.55);
  const offset = clamp(f.vx * -2.2 - (f.dir || 1) * phase.snap * (spec.heavy ? 9 : 5), -22, 22);

  ctx.fillStyle = `rgba(10, 12, 11, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(f.x + offset, FLOOR + 13, width, Math.max(7, height), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 231, 166, ${0.07 * (1 - air)})`;
  ctx.beginPath();
  ctx.ellipse(f.x, FLOOR + 6, width * 0.62, Math.max(4, height * 0.45), 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStageAtmosphere() {
  const t = roundFrame * 0.012;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 10; i += 1) {
    const x = (i * 103 + (roundFrame * (0.12 + (i % 3) * 0.035))) % W;
    const y = 96 + ((i * 53 + Math.sin(t + i) * 18) % 250);
    const alpha = 0.045 + (i % 4) * 0.01;
    ctx.fillStyle = `rgba(255, 235, 178, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.4 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCeiling() {
  const beam = ctx.createLinearGradient(0, 0, 0, 112);
  beam.addColorStop(0, "#4a2717");
  beam.addColorStop(1, "#86522c");
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, W, 28);

  ctx.fillStyle = "rgba(42, 22, 14, 0.35)";
  for (let x = -90; x < W; x += 118) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 60, 0);
    ctx.lineTo(x + 126, 132);
    ctx.lineTo(x + 88, 132);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#6f3e22";
  ctx.fillRect(0, 266, W, 18);
  ctx.fillRect(0, 396, W, 20);
}

function drawGardenView() {
  const garden = ctx.createLinearGradient(0, 80, 0, 270);
  garden.addColorStop(0, "#b9ddea");
  garden.addColorStop(0.52, "#84b86e");
  garden.addColorStop(1, "#38593a");
  ctx.fillStyle = garden;
  ctx.fillRect(330, 48, 300, 222);

  ctx.fillStyle = "rgba(42, 77, 45, 0.42)";
  ctx.beginPath();
  ctx.ellipse(478, 252, 188, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5f9662";
  ctx.beginPath();
  ctx.ellipse(408, 240, 124, 42, 0, 0, Math.PI * 2);
  ctx.ellipse(570, 238, 126, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5a3823";
  ctx.fillRect(428, 104, 16, 126);
  ctx.strokeStyle = "#5a3823";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(438, 126);
  ctx.quadraticCurveTo(388, 88, 352, 116);
  ctx.moveTo(440, 132);
  ctx.quadraticCurveTo(508, 82, 598, 112);
  ctx.stroke();

  ctx.fillStyle = "#d9898b";
  for (let i = 0; i < 34; i += 1) {
    ctx.beginPath();
    ctx.arc(348 + i * 8, 112 + Math.sin(i * 1.7) * 17, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(474, 58, 30, 188);
  ctx.fillRect(330, 152, 300, 8);
}

function drawBackWallDetails() {
  ctx.fillStyle = "rgba(88, 48, 26, 0.18)";
  for (let x = 18; x < W; x += 126) {
    ctx.fillRect(x, 28, 22, 388);
  }

  drawScroll(126, 64, "KI");
  drawScroll(768, 64, "DO");
}

function drawScroll(x, y, mark) {
  ctx.fillStyle = "#4b2b1c";
  ctx.fillRect(x - 34, y - 10, 68, 9);
  ctx.fillRect(x - 34, y + 126, 68, 9);
  ctx.fillStyle = "rgba(255, 247, 225, 0.92)";
  ctx.beginPath();
  ctx.roundRect(x - 28, y, 56, 128, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(96, 54, 30, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 22, y + 10, 44, 108);
  ctx.fillStyle = "#3b2217";
  ctx.font = "900 28px serif";
  ctx.textAlign = "center";
  ctx.fillText(mark, x, y + 78);
}

function drawWallPortraits() {
  drawWallPortrait(wallPortraits.akane, 86, 96, 104, -0.025);
  drawWallPortrait(wallPortraits.ryoga, W - 190, 96, 104, 0.025);
}

function drawWallPortrait(image, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotation);

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(-size / 2 + 5, -size / 2 + 8, size, size, 5);
  ctx.fill();

  const frame = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
  frame.addColorStop(0, "#2b160c");
  frame.addColorStop(0.46, "#8a4c24");
  frame.addColorStop(1, "#1e0f09");
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, 5);
  ctx.fill();

  ctx.fillStyle = "#d2a866";
  ctx.fillRect(-size / 2 + 7, -size / 2 + 7, size - 14, size - 14);

  if (image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -size / 2 + 10, -size / 2 + 10, size - 20, size - 20);
  } else {
    ctx.fillStyle = "rgba(255, 247, 214, 0.62)";
    ctx.fillRect(-size / 2 + 10, -size / 2 + 10, size - 20, size - 20);
  }

  ctx.strokeStyle = "rgba(255, 232, 164, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-size / 2 + 8, -size / 2 + 8, size - 16, size - 16);
  ctx.restore();
}

function drawShojiPanels() {
  for (let side = 0; side < 2; side += 1) {
    const start = side === 0 ? 42 : 636;
    ctx.fillStyle = "rgba(255, 247, 225, 0.86)";
    ctx.fillRect(start, 42, 270, 224);
    ctx.strokeStyle = "rgba(100, 61, 32, 0.62)";
    ctx.lineWidth = 4;
    ctx.strokeRect(start, 42, 270, 224);
    ctx.lineWidth = 2;
    for (let x = start + 45; x < start + 270; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 42);
      ctx.lineTo(x, 266);
      ctx.stroke();
    }
    for (let y = 86; y < 266; y += 45) {
      ctx.beginPath();
      ctx.moveTo(start, y);
      ctx.lineTo(start + 270, y);
      ctx.stroke();
    }
  }
}

function drawDojoSign() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 150, 194, 300, 68, 6);
  ctx.fill();

  const frame = ctx.createLinearGradient(W / 2 - 142, 194, W / 2 + 142, 258);
  frame.addColorStop(0, "#2f170d");
  frame.addColorStop(0.5, "#744223");
  frame.addColorStop(1, "#2b140c");
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 142, 190, 284, 66, 6);
  ctx.fill();

  const plate = ctx.createLinearGradient(W / 2 - 128, 200, W / 2 + 128, 246);
  plate.addColorStop(0, "#f4d487");
  plate.addColorStop(0.55, "#c99138");
  plate.addColorStop(1, "#f8dfa2");
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 126, 202, 252, 42, 4);
  ctx.fill();

  ctx.strokeStyle = "rgba(43, 26, 20, 0.48)";
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 116, 211, 232, 24);

  ctx.font = "900 27px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 241, 189, 0.42)";
  ctx.strokeText("DOJO TENDO", W / 2, 233);
  ctx.fillStyle = "#2b1a14";
  ctx.fillText("DOJO TENDO", W / 2, 233);
}

function drawLanterns() {
  for (const x of [292, 668]) {
    ctx.strokeStyle = "#3b2217";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 26);
    ctx.lineTo(x, 76);
    ctx.stroke();

    const glow = ctx.createRadialGradient(x, 108, 10, x, 108, 82);
    glow.addColorStop(0, "rgba(255, 212, 99, 0.32)");
    glow.addColorStop(1, "rgba(255, 212, 99, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, 108, 82, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f3c45b";
    ctx.beginPath();
    ctx.roundRect(x - 24, 78, 48, 58, 18);
    ctx.fill();
    ctx.strokeStyle = "#61351f";
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 20, 88, 40, 38);
    ctx.fillStyle = "rgba(96, 53, 31, 0.45)";
    ctx.fillRect(x - 2, 82, 4, 50);
  }
}

function drawWeaponRack() {
  ctx.fillStyle = "#4f2c1b";
  ctx.fillRect(54, 315, 184, 12);
  ctx.fillRect(72, 292, 12, 86);
  ctx.fillRect(206, 292, 12, 86);
  ctx.strokeStyle = "#2b1a14";
  ctx.lineWidth = 6;
  for (const x of [108, 140, 172]) {
    ctx.beginPath();
    ctx.moveTo(x, 288);
    ctx.lineTo(x + 18, 380);
    ctx.stroke();
  }
  ctx.fillStyle = "#d6c9aa";
  ctx.fillRect(790, 326, 116, 9);
  ctx.fillStyle = "#5a3722";
  ctx.fillRect(822, 310, 15, 68);
}

function drawTatamiFloor() {
  const floor = ctx.createLinearGradient(0, FLOOR - 8, 0, H);
  floor.addColorStop(0, "#a5c778");
  floor.addColorStop(1, "#608a57");
  ctx.fillStyle = floor;
  ctx.fillRect(0, FLOOR - 8, W, H - FLOOR + 8);
  ctx.fillStyle = "#3f613d";
  ctx.fillRect(0, FLOOR - 10, W, 10);
  ctx.strokeStyle = "rgba(36, 65, 39, 0.58)";
  ctx.lineWidth = 3;

  for (let y = FLOOR + 18; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  for (let x = -80; x < W; x += 112) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR - 8);
    ctx.lineTo(x + 90, H);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 247, 214, 0.14)";
  ctx.fillRect(0, FLOOR + 8, W, 7);
  ctx.fillStyle = "rgba(33, 48, 31, 0.2)";
  ctx.fillRect(0, FLOOR + 64, W, 13);
}

function drawForegroundPosts() {
  for (const x of [16, W - 36]) {
    const post = ctx.createLinearGradient(x, 20, x + 22, FLOOR);
    post.addColorStop(0, "#86522c");
    post.addColorStop(0.5, "#5c321f");
    post.addColorStop(1, "#2f1b12");
    ctx.fillStyle = post;
    ctx.fillRect(x, 18, 22, FLOOR + 8);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x + 3, 34, 4, FLOOR - 30);
  }
}

function drawVignette() {
  const vignette = ctx.createRadialGradient(W / 2, H / 2, 180, W / 2, H / 2, 610);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.26)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function drawHud() {
  drawHudPanel(22, 16, 390, fighters[0], false);
  drawHudPanel(W - 412, 16, 390, fighters[1], true);

  const cx = W / 2;
  const x = cx - 54;
  const y = 18;
  const width = 108;
  const height = 68;
  const centerPanel = ctx.createLinearGradient(x, y, x + width, y + height);
  centerPanel.addColorStop(0, "rgba(99, 34, 21, 0.96)");
  centerPanel.addColorStop(0.42, "rgba(20, 13, 12, 0.96)");
  centerPanel.addColorStop(1, "rgba(126, 72, 24, 0.94)");
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.46)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = centerPanel;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 9);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 231, 143, 0.82)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 5, width - 10, height - 10, 7);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 11, y + 11, width - 22, height - 22, 5);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(x + 12, y + 11, width - 24, 6);
  ctx.fillStyle = "rgba(255, 205, 85, 0.14)";
  ctx.beginPath();
  ctx.moveTo(cx - 44, y + height - 9);
  ctx.lineTo(cx, y + 10);
  ctx.lineTo(cx + 44, y + height - 9);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#fff1bd";
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(winner ? "KO" : "VS", cx, y + 45);
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 244, 205, 0.9)";
  ctx.fillText(matchOver ? "MATCH" : `ROUND ${toRoman(roundNumber)}`, cx, y + 65);
  ctx.restore();
}

function drawHudPanel(x, y, width, f, reverse) {
  const height = 76;
  const panel = ctx.createLinearGradient(x, y, x + width, y + height);
  panel.addColorStop(0, reverse ? "rgba(23, 50, 42, 0.88)" : "rgba(64, 38, 18, 0.88)");
  panel.addColorStop(0.44, "rgba(15, 14, 14, 0.88)");
  panel.addColorStop(1, reverse ? "rgba(78, 24, 29, 0.86)" : "rgba(21, 42, 66, 0.86)");

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = panel;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.clip();
  ctx.fillStyle = colorWithAlpha(f.trim, 0.12);
  ctx.beginPath();
  if (reverse) {
    ctx.moveTo(x + width - 112, y);
    ctx.lineTo(x + width - 22, y);
    ctx.lineTo(x + width - 82, y + height);
    ctx.lineTo(x + width - 172, y + height);
  } else {
    ctx.moveTo(x + 22, y);
    ctx.lineTo(x + 112, y);
    ctx.lineTo(x + 172, y + height);
    ctx.lineTo(x + 82, y + height);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(x + 8, y + 8, width - 16, 7);
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 22 + i * 10);
    ctx.lineTo(x + width - 12, y + 22 + i * 10);
    ctx.stroke();
  }
  ctx.restore();

  const dangerPulse = f.health < 26 ? 0.1 + Math.sin(roundFrame * 0.16) * 0.05 : 0;
  if (dangerPulse > 0) {
    ctx.fillStyle = `rgba(255, 40, 30, ${dangerPulse})`;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255, 230, 145, 0.64)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 5, width - 10, height - 10, 6);
  ctx.stroke();
  ctx.strokeStyle = colorWithAlpha(f.trim, 0.48);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, width - 20, height - 20, 5);
  ctx.stroke();

  const portraitX = reverse ? x + width - 64 : x + 12;
  drawHudPortrait(portraitX, y + 12, f, reverse);

  const barX = reverse ? x + 28 : x + 78;
  const nameX = reverse ? x + width - 78 : x + 78;
  const align = reverse ? "right" : "left";

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = "rgba(35, 16, 12, 0.78)";
  ctx.lineWidth = 3;
  ctx.font = "900 14px system-ui, sans-serif";
  ctx.textAlign = align;
  ctx.strokeText(f.name.toUpperCase(), nameX, y + 20);
  ctx.fillStyle = "rgba(255, 247, 214, 0.95)";
  ctx.fillText(f.name.toUpperCase(), nameX, y + 20);
  ctx.restore();

  drawHealth(barX, y + 26, 284, f, reverse);
  drawEnergy(reverse ? x + width - 264 : x + 78, y + 60, 186, f, reverse);
  drawWins(reverse ? x + 48 : x + width - 70, y + 58, f, reverse);
}

function drawHudPortrait(x, y, f, reverse) {
  const size = 52;
  const glow = ctx.createRadialGradient(x + size / 2, y + size / 2, 8, x + size / 2, y + size / 2, 42);
  glow.addColorStop(0, colorWithAlpha(f.trim, 0.34));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 42, 0, Math.PI * 2);
  ctx.fill();

  const frame = ctx.createLinearGradient(x, y, x + size, y + size);
  frame.addColorStop(0, "rgba(255, 229, 136, 0.72)");
  frame.addColorStop(0.5, "rgba(50, 34, 20, 0.86)");
  frame.addColorStop(1, colorWithAlpha(f.trim, 0.7));
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 7);
  ctx.fill();

  ctx.fillStyle = "rgba(5, 4, 4, 0.66)";
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, size - 6, size - 6, 5);
  ctx.fill();
  if (f.face.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 5);
    ctx.clip();
    ctx.drawImage(f.face, x - 3, y - 5, 58, 58);
    const shade = ctx.createLinearGradient(x, y, x, y + size);
    shade.addColorStop(0, "rgba(255,255,255,0.18)");
    shade.addColorStop(0.48, "rgba(255,255,255,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.24)");
    ctx.fillStyle = shade;
    ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    ctx.restore();
  }
  ctx.strokeStyle = "rgba(255, 247, 205, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, size - 8, size - 8, 5);
  ctx.stroke();

  ctx.fillStyle = colorWithAlpha(f.trim, 0.92);
  ctx.beginPath();
  ctx.arc(reverse ? x + 8 : x + size - 8, y + size - 8, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#19120f";
  ctx.font = "900 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(f.mark ?? "", reverse ? x + 8 : x + size - 8, y + size - 8);
  ctx.textBaseline = "alphabetic";
}

function drawHealth(x, y, width, f, reverse) {
  const height = 28;
  const innerX = x + 5;
  const innerY = y + 5;
  const innerW = width - 10;
  const innerH = height - 10;
  const pct = clamp(f.health / 100, 0, 1);
  const lagPct = clamp((f.healthLag ?? f.health) / 100, 0, 1);

  ctx.fillStyle = "rgba(13, 10, 9, 0.78)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 7);
  ctx.fill();
  const groove = ctx.createLinearGradient(x, y, x, y + height);
  groove.addColorStop(0, "rgba(255,255,255,0.12)");
  groove.addColorStop(0.42, "rgba(0,0,0,0)");
  groove.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = groove;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, width - 4, height - 4, 6);
  ctx.fill();

  const lagWidth = Math.max(0, innerW * lagPct);
  const lagX = reverse ? innerX + innerW - lagWidth : innerX;
  if (lagPct > pct + 0.004) {
    const lag = ctx.createLinearGradient(lagX, y, lagX + lagWidth, y);
    lag.addColorStop(0, "rgba(255, 217, 87, 0.66)");
    lag.addColorStop(1, "rgba(231, 75, 48, 0.54)");
    ctx.fillStyle = lag;
    ctx.beginPath();
    ctx.roundRect(lagX, innerY, lagWidth, innerH, 4);
    ctx.fill();
  }

  const barWidth = Math.max(0, innerW * pct);
  const bx = reverse ? innerX + innerW - barWidth : innerX;
  const gradient = ctx.createLinearGradient(reverse ? x + width : x, y, reverse ? x : x + width, y);
  if (pct < 0.28) {
    gradient.addColorStop(0, "#ff5a46");
    gradient.addColorStop(0.58, "#ff8d3c");
    gradient.addColorStop(1, "#ffd15b");
  } else if (pct < 0.56) {
    gradient.addColorStop(0, "#ffcf57");
    gradient.addColorStop(0.62, "#ffe777");
    gradient.addColorStop(1, "#7bdc77");
  } else {
    gradient.addColorStop(0, "#37c878");
    gradient.addColorStop(0.58, "#74e594");
    gradient.addColorStop(1, "#e7f88f");
  }
  if (barWidth > 0.2) {
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(bx, innerY, barWidth, innerH, 4);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.beginPath();
    ctx.roundRect(bx, innerY + 1, barWidth, 5, 3);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i += 1) {
    const tx = innerX + innerW * (i / 10);
    ctx.beginPath();
    ctx.moveTo(tx, innerY + 2);
    ctx.lineTo(tx, innerY + innerH - 2);
    ctx.stroke();
  }

  ctx.strokeStyle = f.health < 26 ? "rgba(255, 80, 54, 0.8)" : "rgba(255, 231, 158, 0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(innerX, innerY, innerW, innerH, 4);
  ctx.stroke();
}

function drawEnergy(x, y, width, f, reverse) {
  const height = 12;
  const ready = f.energy >= 45;
  const pulse = 0.16 + Math.sin(roundFrame * 0.12) * 0.06;
  if (ready) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = colorWithAlpha(f.trim, pulse);
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, width + 8, height + 8, 7);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = "rgba(9, 15, 22, 0.76)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 5);
  ctx.fill();

  const segments = 5;
  const gap = 4;
  const segmentW = (width - 4 - gap * (segments - 1)) / segments;
  const pct = clamp(f.energy / 100, 0, 1);
  const energy = ctx.createLinearGradient(reverse ? x + width : x, y, reverse ? x : x + width, y);
  energy.addColorStop(0, ready ? "#fff0a6" : "#69c8ff");
  energy.addColorStop(1, ready ? f.trim : "#3f7fb4");

  for (let i = 0; i < segments; i += 1) {
    const logicalIndex = reverse ? segments - 1 - i : i;
    const sx = x + 2 + i * (segmentW + gap);
    const filled = clamp((pct - logicalIndex / segments) * segments, 0, 1);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(sx, y + 3, segmentW, height - 6, 3);
    ctx.fill();

    if (filled > 0) {
      const fillW = segmentW * filled;
      const fx = reverse ? sx + segmentW - fillW : sx;
      ctx.fillStyle = energy;
      ctx.beginPath();
      ctx.roundRect(fx, y + 3, fillW, height - 6, 3);
      ctx.fill();
    }
  }

  ctx.strokeStyle = ready ? "rgba(255, 239, 168, 0.82)" : "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, width - 2, height - 2, 4);
  ctx.stroke();
}

function drawWins(x, y, f, reverse) {
  for (let i = 0; i < 2; i += 1) {
    const px = reverse ? x - i * 18 : x + i * 18;
    const won = i < f.wins;
    if (won) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255, 226, 101, 0.26)";
      ctx.beginPath();
      ctx.arc(px, y + 6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const medallion = ctx.createRadialGradient(px - 2, y + 3, 1, px, y + 6, 9);
    medallion.addColorStop(0, won ? "#fff6cd" : "rgba(92, 74, 52, 0.74)");
    medallion.addColorStop(1, won ? "#c47a23" : "rgba(27, 18, 15, 0.82)");
    ctx.fillStyle = medallion;
    ctx.beginPath();
    ctx.arc(px, y + 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = won ? "rgba(255, 244, 194, 0.9)" : "rgba(255, 231, 168, 0.26)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function bodySpec(f) {
  return BODY_SPECS[f.build] ?? BODY_SPECS.balanced;
}

function outfitSpec(f) {
  return f.outfit;
}

function smoothStep01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function fighterTransitionMotion(f, walking) {
  const motion = {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    afterimage: 0,
  };
  const dir = f.dir || 1;

  if (walking) {
    const speed = clamp(Math.abs(f.vx) / 3.35, 0, 1.25);
    const cycle = f.walkCycle ?? roundFrame * 0.2;
    const weight = clamp(f.walkWeight ?? speed, 0, 1.25);
    const moveDir = Math.sign(f.vx) || dir;
    const retreat = moveDir !== dir;
    const step = Math.sin(cycle);
    const footPlant = Math.abs(Math.cos(cycle));
    const push = Math.max(0, Math.sin(cycle * 2)) * weight;
    motion.x += step * (0.28 + weight * 0.78) - moveDir * footPlant * (0.25 + weight * 0.24);
    motion.y += footPlant * (0.28 + weight * 0.95) - push * 0.38;
    motion.rotation += moveDir * (0.01 + weight * 0.02) * (retreat ? -0.64 : 1) + step * 0.004 * weight;
    motion.scaleX *= 1 + footPlant * 0.007 + weight * 0.004;
    motion.scaleY *= 1 - footPlant * 0.005 + push * 0.003;
    if (retreat) {
      motion.x -= dir * 0.7 * weight;
      motion.y += 0.35 * weight;
      motion.rotation -= dir * 0.012 * weight;
    }
  }

  if (!f.grounded && f.hurt <= 0) {
    const rise = clamp(-f.vy / 13, 0, 1);
    const fall = clamp(f.vy / 13, 0, 1);
    const airLean = clamp((f.vx ?? 0) * 0.008, -0.035, 0.035);
    const jumpDir = f.jumpDir || dir;
    motion.y -= rise * 2.2;
    motion.rotation += airLean + jumpDir * (rise * -0.02 + fall * 0.026);
    motion.scaleX *= 1 - rise * 0.018 + fall * 0.015;
    motion.scaleY *= 1 + rise * 0.04 - fall * 0.02;
  }

  const jumpT = clamp((f.jumpPulse ?? 0) / 12, 0, 1);
  if (jumpT > 0) {
    motion.y -= jumpT * 1.8;
    motion.scaleX *= 1 - jumpT * 0.015;
    motion.scaleY *= 1 + jumpT * 0.035;
  }

  const landingT = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  if (landingT > 0) {
    const settle = smoothStep01(landingT);
    const rebound = Math.sin((1 - landingT) * Math.PI) * 0.9;
    motion.y += settle * 5.6 - rebound * 0.9;
    motion.rotation += (f.landingDir || (f.vx >= 0 ? 1 : -1)) * settle * 0.018;
    motion.scaleX *= 1 + settle * 0.05 - rebound * 0.006;
    motion.scaleY *= 1 - settle * 0.052 + rebound * 0.012;
  }

  const stepPulse = clamp((f.stepPulse ?? 0) / 7, 0, 1);
  if (stepPulse > 0 && walking) {
    motion.y += stepPulse * 1.05;
    motion.scaleX *= 1 + stepPulse * 0.008;
    motion.scaleY *= 1 - stepPulse * 0.007;
  }

  if (f.attack) {
    const a = f.attack;
    const phase = attackPhase(a);
    const windup = phase.anticipation;
    const strike = phase.strike;
    const recovery = phase.recovery;
    const settle = phase.settle;
    const snap = phase.snap;
    const follow = phase.followThrough;
    const spec = attackVisualSpec(a.type);
    const isKick = a.type === "kick" || a.type === "airKick";
    const isSweep = a.type === "sweep";
    const isSpecial = a.type === "special";
    const isGrab = a.type === "grab";
    const reach = isKick ? 9.1 : isSweep ? 7.4 : isSpecial ? 6.6 : isGrab ? 6.2 : 7.5;
    const brace = isKick ? 4.8 : isSweep ? 3.2 : isSpecial ? 3.7 : isGrab ? 4.1 : 5.3;
    const returnDrag = isKick ? 1.6 : isSweep ? 1.2 : 1.8;

    motion.x += dir * (
      strike * reach -
      windup * (brace + spec.windupPull * 0.34) +
      snap * spec.snapDrive * 0.62 -
      recovery * (returnDrag + spec.followDrag) -
      follow * spec.followDrag * 0.72
    );
    motion.y +=
      windup * (isSweep ? 3.8 : isKick ? 2.1 : 1.7) -
      strike * (isKick ? 3.6 : isSweep ? -3.3 : 1.5) -
      snap * spec.bodyLift * 0.42 +
      recovery * 1.05 +
      follow * (isSweep ? 1.6 : 0.7);
    motion.rotation += dir * (
      -windup * (isKick ? 0.058 : isSweep ? 0.044 : 0.06) +
      strike * spec.rotation +
      snap * spec.rotation * 0.68 -
      recovery * 0.024 -
      follow * 0.018
    );
    motion.scaleX *= 1 - windup * 0.026 + strike * (isKick ? 0.035 : 0.028) + snap * 0.034 - settle * 0.006;
    motion.scaleY *= 1 + windup * 0.026 - strike * (isSweep ? 0.026 : 0.014) - snap * 0.016 + settle * 0.004;
    motion.afterimage = (isSpecial ? 0.34 : isGrab ? 0.16 : spec.echo) * strike + snap * 0.16 + windup * 0.035 + follow * 0.06;

    if (isSpecial) {
      const profileWeight = f.profileId === "p2" ? 1.08 : f.profileId === "p1" ? 1.14 : 1;
      motion.x += dir * (-windup * 2.4 + strike * 5.2 + snap * 4.4) * profileWeight;
      motion.y -= (strike * 1.2 + snap * 1.7) * profileWeight;
      motion.rotation += dir * (-windup * 0.015 + strike * 0.026 + snap * 0.018) * profileWeight;
      motion.scaleX *= 1 + strike * 0.012 + snap * 0.016;
      motion.scaleY *= 1 - strike * 0.006 - snap * 0.008;
      motion.afterimage = Math.max(motion.afterimage, windup * 0.1 + strike * 0.42 + snap * 0.22);
    }
  }

  if (f.blocking && !winner) {
    const pulse = 0.5 + Math.sin(roundFrame * 0.58) * 0.5;
    const guard = clamp((f.guardPulse ?? 0) / 18, 0, 1);
    const guardHit = clamp((f.guardImpact ?? 0) / 16, 0, 1);
    motion.x -= dir * (1.2 + pulse * 0.85 + guard * 0.7 + guardHit * 4.8);
    motion.y += 0.45 + pulse * 0.5 + guardHit * 2.2;
    motion.rotation -= dir * (0.009 + pulse * 0.005 + guard * 0.006 + guardHit * 0.038);
    motion.scaleX *= 0.994 - guardHit * 0.01;
    motion.scaleY *= 1.008 + guardHit * 0.024;
    motion.afterimage = Math.max(motion.afterimage, guardHit * 0.09);
  }

  const effectiveHurt = winner ? Math.max(0, (f.hurt ?? 0) - resultFrame * 0.9) : (f.hurt ?? 0);
  if (effectiveHurt > 0) {
    const hurtT = clamp(effectiveHurt / 24, 0, 1);
    const effectiveImpact = winner ? Math.max(0, (f.impactPulse ?? 0) - resultFrame * 0.86) : (f.impactPulse ?? 0);
    const impactT = clamp(effectiveImpact / 16, 0, 1);
    const strength = clamp(f.impactStrength ?? 0.8, 0.35, 1.45);
    const effectiveContact = winner ? Math.max(0, (f.contactFlash ?? 0) - resultFrame * 0.9) : (f.contactFlash ?? 0);
    const contactT = clamp(effectiveContact / 14, 0, 1);
    const zonePulse = winner ? Math.max(0, (f.hitZonePulse ?? 0) - resultFrame * 0.78) : (f.hitZonePulse ?? 0);
    const zoneT = clamp(zonePulse / 26, 0, 1);
    const headHit = f.hitZone === "head" ? zoneT : 0;
    const bodyHit = f.hitZone === "torso" ? zoneT : 0;
    const legHit = f.hitZone === "legs" ? zoneT : 0;
    const shakePulse = Math.sin((roundFrame + resultFrame) * 1.75) * hurtT;
    const impactDir = f.impactDir ?? dir;
    motion.x += impactDir * (impactT * (2.4 + strength * 3.1) + hurtT * (0.8 + strength * 0.9) + headHit * 2.4 + bodyHit * 1.2 + legHit * 1.7) + shakePulse * 0.9;
    motion.y += Math.sin(effectiveHurt * 0.82) * hurtT * 0.8 - impactT * (0.35 + strength * 0.45) + contactT * 0.8 - headHit * 1.3 + legHit * 2.4;
    motion.rotation += impactDir * (impactT * (0.016 + strength * 0.023) + hurtT * 0.012 + headHit * 0.046 + bodyHit * 0.022 - legHit * 0.024) + shakePulse * 0.005;
    motion.scaleX *= 1 + impactT * (0.008 + strength * 0.012) + contactT * 0.006 + legHit * 0.028 + bodyHit * 0.012;
    motion.scaleY *= 1 - impactT * (0.004 + strength * 0.006) + contactT * 0.004 - legHit * 0.035 - bodyHit * 0.008 + headHit * 0.008;
  }

  const lowHealth = f.health < 30 && f.hurt <= 0 && !winner ? clamp((30 - f.health) / 30, 0, 1) : 0;
  if (lowHealth > 0) {
    const stagger = Math.sin(roundFrame * 0.18 + f.x * 0.015) * lowHealth;
    const staggerHit = clamp((f.staggerPulse ?? 0) / 18, 0, 1);
    motion.x += stagger * 1.15 + (f.impactDir ?? dir) * staggerHit * 2.4;
    motion.y += Math.abs(stagger) * 0.65 + staggerHit * 0.9;
    motion.rotation += dir * stagger * 0.013 + (f.impactDir ?? dir) * staggerHit * 0.026;
    motion.scaleX *= 1 + lowHealth * 0.004 + staggerHit * 0.006;
    motion.scaleY *= 1 - lowHealth * 0.005 - staggerHit * 0.008;
  }

  if (winner) {
    const settle = 0.5 + Math.sin((roundFrame + resultFrame) * 0.08) * 0.5;
    if (f.id === roundWinnerId) {
      const victory = clamp(Math.max(0, (f.victoryPulse ?? 60) - resultFrame * 0.9) / 60, 0, 1);
      motion.y -= settle * 0.8 + victory * 1.8;
      motion.rotation += dir * (0.006 * settle - victory * 0.012);
      motion.scaleX *= 1 + victory * 0.012;
      motion.scaleY *= 1 - victory * 0.006;
    } else {
      const fall = smoothStep01(clamp(resultFrame / 46, 0, 1));
      const bounce = Math.max(0, Math.sin(clamp((resultFrame - 16) / 28, 0, 1) * Math.PI));
      const impact = Math.max(0, 1 - resultFrame / 34);
      const fallDir = f.koFallDir || f.impactDir || -dir;
      motion.x += fallDir * (fall * 12 + impact * 4.8);
      motion.y += 0.8 + fall * 21 - bounce * 4.5;
      motion.rotation += fallDir * (0.045 + fall * 0.16 + impact * 0.035);
      motion.scaleX *= 1 + impact * 0.02 + fall * 0.025;
      motion.scaleY *= 1 - impact * 0.012 - fall * 0.018;
      motion.afterimage = Math.max(motion.afterimage, impact * 0.12);
    }
  }

  return motion;
}

function drawWorldContactShadow(f, baseX, walking, stride, impactEase) {
  const spec = bodySpec(f);
  const air = clamp((FLOOR - f.y) / 132, 0, 1);
  const plant = walking ? clamp(f.walkPlant ?? 0, 0, 1) : 0;
  const walkSpread = walking ? Math.abs(stride) * 10 : 0;
  const crouchSpread = f.blocking ? 8 : 0;
  const landing = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  const step = clamp((f.stepPulse ?? 0) / 7, 0, 1);
  const width = (62 + spec.stance * 18 + walkSpread + crouchSpread + impactEase * 16 + landing * 32 + step * 8 + plant * 10) * FIGHTER_SCALE * (1 - air * 0.38);
  const height = (8.5 + spec.stance * 2.4 + impactEase * 2 + landing * 4.8 + step * 1.4 + plant * 0.8) * FIGHTER_SCALE * (1 - air * 0.48);
  const alpha = clamp(0.3 - air * 0.18 + impactEase * 0.06 + landing * 0.09 + step * 0.025 + plant * 0.018, 0.08, 0.46);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.translate(baseX, FLOOR + 5);
  ctx.scale(width, height);
  const shadow = ctx.createRadialGradient(0, 0, 0.12, 0, 0, 1);
  shadow.addColorStop(0, `rgba(22, 12, 8, ${alpha})`);
  shadow.addColorStop(0.62, `rgba(22, 12, 8, ${alpha * 0.42})`);
  shadow.addColorStop(1, "rgba(22, 12, 8, 0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (landing > 0.04) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255, 228, 156, ${0.2 * landing})`;
    ctx.lineWidth = 2.4 * landing;
    ctx.beginPath();
    ctx.ellipse(baseX, FLOOR + 7, 42 + landing * 46, 6 + landing * 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (f.grounded && Math.abs(f.vx) > 1.4) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(54, 33, 18, ${0.1 + plant * 0.04})`;
    const dustX = baseX - Math.sign(f.vx) * (24 + Math.abs(stride) * 9);
    ctx.beginPath();
    ctx.ellipse(dustX, FLOOR + 7, 18 + plant * 8, 4 + plant * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMovementPoseFX(f, crouch, walking, stride) {
  const jump = clamp((f.jumpPulse ?? 0) / 12, 0, 1);
  const landing = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  const air = !f.grounded ? clamp((FLOOR - f.y) / 155, 0, 1) : 0;
  const plant = walking ? clamp(f.walkPlant ?? 0, 0, 1) : 0;
  if (jump <= 0.03 && landing <= 0.03 && air <= 0.03 && plant <= 0.08) return;

  const localCrouch = crouch * 0.18;
  const trim = f.trim ?? "#fff1bd";
  const moveDir = Math.sign(f.vx) || f.jumpDir || f.dir || 1;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";

  if (jump > 0.03) {
    ctx.strokeStyle = `rgba(255, 238, 181, ${0.16 * jump})`;
    ctx.lineWidth = 2.6 * jump;
    for (const x of [-19, 19]) {
      ctx.beginPath();
      ctx.moveTo(x, -8 + localCrouch);
      ctx.quadraticCurveTo(x - moveDir * 6, 10 + localCrouch, x - moveDir * 12, 28 + localCrouch);
      ctx.stroke();
    }
  }

  if (air > 0.03) {
    const fall = clamp(f.vy / 13, 0, 1);
    ctx.strokeStyle = colorWithAlpha(trim, 0.06 + air * 0.08 + fall * 0.05);
    ctx.lineWidth = 1.5 + air * 1.4;
    for (let i = 0; i < 3; i += 1) {
      const lane = i - 1;
      ctx.beginPath();
      ctx.moveTo(-moveDir * (34 + i * 4), -132 + lane * 26 + localCrouch);
      ctx.quadraticCurveTo(-moveDir * (18 + air * 12), -122 + lane * 20 + localCrouch, -moveDir * 2, -112 + lane * 15 + localCrouch);
      ctx.stroke();
    }
  }

  if (landing > 0.03) {
    ctx.strokeStyle = `rgba(255, 224, 142, ${0.18 * landing})`;
    ctx.lineWidth = 3 * landing;
    ctx.beginPath();
    ctx.ellipse(0, 2 + localCrouch, 48 + landing * 20, 7 + landing * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (plant > 0.08) {
    ctx.fillStyle = `rgba(255, 235, 176, ${0.045 * plant})`;
    const footX = stride >= 0 ? 24 : -24;
    ctx.beginPath();
    ctx.ellipse(footX, -2 + localCrouch, 22 + plant * 8, 5 + plant * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFighter(f) {
  const t = performance.now() / 1000;
  const walking = Math.abs(f.vx) > 0.5 && f.grounded && f.hurt <= 0 && !f.attack;
  const walkCycle = f.walkCycle ?? t * 14;
  const stride = walking ? Math.sin(walkCycle) : 0;
  const plant = walking ? clamp(f.walkPlant ?? Math.abs(Math.cos(walkCycle)), 0, 1) : 0;
  const transition = fighterTransitionMotion(f, walking);
  const bob = walking ? plant * 2.35 - Math.max(0, Math.sin(walkCycle * 2)) * 0.55 : Math.sin(t * 9) * (f.grounded ? 1.3 : 0);
  const effectiveHurt = winner ? Math.max(0, (f.hurt ?? 0) - resultFrame * 0.9) : (f.hurt ?? 0);
  const effectiveImpact = winner ? Math.max(0, (f.impactPulse ?? 0) - resultFrame * 0.86) : (f.impactPulse ?? 0);
  const hurtShift = effectiveHurt > 0 ? Math.sin((effectiveHurt + resultFrame) * 1.4) * 4 : 0;
  const impactT = clamp(effectiveImpact / 16, 0, 1);
  const impactEase = impactT * impactT;
  const impactShift = (f.impactDir ?? f.dir) * impactEase * (f.hurt > 0 ? 5.2 : 2.2);
  const impactRise = impactEase * (f.impactLift ?? 0) * 3.4;
  const impactLean = (f.impactDir ?? f.dir) * impactEase * (f.hurt > 0 ? 0.035 : 0.012);
  const idleEase = f.grounded && !walking && effectiveHurt <= 0 && !f.attack && !winner ? 1 : 0;
  const idlePulse = Math.sin(t * 2.15 + f.x * 0.015) * idleEase;
  const crouch = f.crouch * 18;
  const baseX = f.x + hurtShift + impactShift + transition.x;
  const baseY = f.y + bob - impactRise - idlePulse * 0.8 + transition.y;
  const pose = getPose(f, stride);
  const attackStretch = f.attack ? attackProgress(f.attack) * 0.012 : 0;
  const breathing = f.grounded && effectiveHurt <= 0 ? Math.sin(t * 2.7 + f.x * 0.02) * 0.012 + idlePulse * 0.006 : 0;
  const hurtSquash = effectiveHurt > 0 ? Math.sin((effectiveHurt + resultFrame) * 0.7) * 0.012 + impactEase * 0.014 : impactEase * 0.005;

  drawWorldContactShadow(f, baseX, walking, stride, impactEase);

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(impactLean + transition.rotation);
  ctx.scale(
    f.dir * (1 + attackStretch + hurtSquash) * transition.scaleX,
    (1 + breathing - attackStretch * 0.28) * transition.scaleY
  );
  ctx.scale(FIGHTER_SCALE, FIGHTER_SCALE);

  const pigForm = f.profileId === "p1" && f.pigMorph > 10 && f.pigMorph < 66;
  if (pigForm) {
    drawPchanPigForm(f, crouch);
    if (f.hitFlash > 0) drawHitFlash(f, crouch);
    drawDamageReactionFX(f, crouch);
    if (winner) drawResultPoseEffect(f, crouch);
    ctx.restore();
    const box = attackBox(f);
    if (box && f.attack.frame >= f.attack.activeStart - 2 && f.attack.frame <= f.attack.activeEnd + 2) {
      drawSpeedLines(f, box);
      drawAttackArc(f, box);
    }
    return;
  }

  drawFighterRimLight(f, crouch);
  drawMovementPoseFX(f, crouch, walking, stride);
  if (f.attack) drawAttackBodyGlow(f, crouch);
  if (f.attack) drawAttackKineticFX(f, crouch, "back");
  if (f.energy >= 45 && f.hurt <= 0) drawEnergyAura(f.trim, crouch);
  drawSpriteUnderlay(f, pose, crouch);

  if (drawRasterBodySprite(f, crouch, walking ? stride : 0, walking, transition)) {
    if (f.attack) drawAttackKineticFX(f, crouch, "front");
    if (f.blocking) drawGuard(f.trim, crouch, f);
    if (f.hitFlash > 0) drawHitFlash(f, crouch);
    if (f.hurt > 0) drawHurtRim(f, crouch);
    drawDamageReactionFX(f, crouch);
    if (f.health < 30 && f.hurt <= 0 && !winner) drawLowHealthStagger(f, crouch);
    if (winner) drawResultPoseEffect(f, crouch);
    ctx.restore();

    const box = attackBox(f);
    if (box && f.attack.frame >= f.attack.activeStart - 2 && f.attack.frame <= f.attack.activeEnd + 2) {
      drawSpeedLines(f, box);
      drawAttackArc(f, box);
    }
    return;
  }

  ctx.shadowColor = "rgba(10, 8, 7, 0.42)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  drawLeg(f, pose.backLeg, false);
  drawLeg(f, pose.frontLeg, true);

  ctx.save();
  ctx.rotate(pose.torsoTilt);
  drawTorso(f, crouch);
  ctx.restore();

  drawArm(f, pose.backArm, false);
  drawArm(f, pose.frontArm, true);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  drawHead(f, crouch, walking ? stride : 0);
  if (f.attack) drawAttackKineticFX(f, crouch, "front");
  drawFighterStageLighting(f, crouch);

  if (f.blocking) drawGuard(f.trim, crouch, f);
  if (f.hitFlash > 0) drawHitFlash(f, crouch);
  if (f.hurt > 0) drawHurtRim(f, crouch);
  drawDamageReactionFX(f, crouch);
  if (f.health < 30 && f.hurt <= 0 && !winner) drawLowHealthStagger(f, crouch);
  if (winner) drawResultPoseEffect(f, crouch);
  ctx.restore();

  const box = attackBox(f);
  if (box && f.attack.frame >= f.attack.activeStart - 2 && f.attack.frame <= f.attack.activeEnd + 2) {
    drawSpeedLines(f, box);
    drawAttackArc(f, box);
  }
}

function drawEnergyAura(color, crouch) {
  const pulse = 0.45 + Math.sin(roundFrame * 0.08) * 0.16;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.12 + pulse * 0.12;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -88 + crouch, 54, 78, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.09 + pulse * 0.08;
  ctx.beginPath();
  ctx.ellipse(0, -93 + crouch, 66, 92, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFighterRimLight(f, crouch) {
  const alpha = f.hurt > 0 ? 0.2 : f.energy >= 45 ? 0.16 : 0.1;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const rim = ctx.createRadialGradient(-18, -124 + crouch, 14, 0, -96 + crouch, 118);
  rim.addColorStop(0, colorWithAlpha(f.trim, alpha));
  rim.addColorStop(0.46, colorWithAlpha(f.trim, alpha * 0.35));
  rim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(0, -96 + crouch, 66, 118, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFighterStageLighting(f, crouch) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const warm = ctx.createLinearGradient(-58, -185 + crouch, 34, -42 + crouch);
  warm.addColorStop(0, "rgba(255, 224, 150, 0.18)");
  warm.addColorStop(0.36, colorWithAlpha(f.trim, 0.07));
  warm.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = warm;
  ctx.beginPath();
  ctx.ellipse(-12, -103 + crouch, 55, 118, -0.1, 0, Math.PI * 2);
  ctx.fill();

  const coolRim = ctx.createLinearGradient(38, -172 + crouch, 72, -56 + crouch);
  coolRim.addColorStop(0, "rgba(120, 217, 255, 0.16)");
  coolRim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = coolRim;
  ctx.beginPath();
  ctx.ellipse(33, -98 + crouch, 28, 108, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(34, 17, 10, 0.055)";
  ctx.beginPath();
  ctx.ellipse(14, -82 + crouch, 58, 98, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpriteUnderlay(f, pose, crouch) {
  const spec = bodySpec(f);
  const shoulder = spec.shoulder + 12;
  const hip = spec.hip + 12;
  const alpha = f.hurt > 0 ? 0.34 : 0.22;

  ctx.save();
  ctx.fillStyle = `rgba(20, 11, 9, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, -88 + crouch, shoulder, 82, -0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(10, 7, 6, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, -31 + crouch, hip, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const leg of [pose.backLeg, pose.frontLeg]) {
    ctx.beginPath();
    ctx.ellipse(leg.foot.x, leg.foot.y + 4, 24 * spec.foot, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function rasterBodyFrameFor(f, walking) {
  if (winner) {
    if (f.id === roundWinnerId) return "victory";
    if (resultFrame < 18) return "hurt";
    return "defeat";
  }
  if (f.hurt > 0) return "hurt";
  if (f.blocking) return "block";

  const type = f.attack?.type;
  if (type === "punch" || type === "airPunch" || type === "grab") return "punch";
  if (type === "kick" || type === "airKick") return "kick";
  if (type === "sweep") return "sweep";
  if (type === "special") return "special";
  if (!f.grounded) return "kick";
  if (walking) return "walk";
  return "idle";
}

function rasterBodyFrameIndex(f, frameName, walking) {
  const frames = BODY_SPRITE_FRAMES[frameName] ?? BODY_SPRITE_FRAMES.idle;
  if (frames.length === 1) return frames[0];

  if (f.attack && (frameName === "punch" || frameName === "kick")) {
    const windupT = clamp(f.attack.frame / Math.max(1, f.attack.activeStart), 0, 1);
    const recoveryT = clamp((f.attack.frame - f.attack.activeEnd) / Math.max(1, f.attack.duration - f.attack.activeEnd), 0, 1);
    if (frameName === "punch") {
      if (f.attack.frame < f.attack.activeStart) return windupT < 0.58 ? frames[0] : frames[1];
      if (f.attack.frame <= f.attack.activeEnd) return frames[2];
      return recoveryT < 0.48 ? frames[3] : frames[4];
    }
    if (frameName === "kick") {
      if (f.attack.frame < f.attack.activeStart) return windupT < 0.56 ? frames[0] : frames[1];
      if (f.attack.frame <= f.attack.activeEnd) return frames[2];
      return recoveryT < 0.5 ? frames[3] : frames[4];
    }
    const t = clamp(f.attack.frame / Math.max(1, f.attack.duration), 0, 0.999);
    return frames[Math.floor(t * frames.length)] ?? frames[frames.length - 1];
  }

  if (frameName === "hurt") {
    return frames[Math.floor(f.hurt / 5) % frames.length] ?? frames[0];
  }

  if (frameName === "walk" || walking) {
    const cycle = f.walkCycle ?? roundFrame * 0.2;
    const normalized = ((cycle / (Math.PI * 2)) % 1 + 1) % 1;
    return frames[Math.floor(normalized * frames.length) % frames.length] ?? frames[0];
  }

  return frames[Math.floor(roundFrame / 34) % frames.length] ?? frames[0];
}

function rasterHeadPose(f, frameName, frameIndex) {
  const pose = {
    x: 0,
    y: -42,
    scale: 0.74,
  };

  if (frameName === "walk") {
    pose.y = -43;
  } else if (frameName === "punch") {
    pose.x = frameIndex === 4 ? -2 : frameIndex === 17 ? -1 : frameIndex === 5 ? 2 : frameIndex === 18 ? 3 : 0;
    pose.y = frameIndex === 5 || frameIndex === 18 ? -45 : frameIndex === 4 ? -42 : -43;
  } else if (frameName === "kick") {
    pose.x = frameIndex === 19 ? 1 : frameIndex === 7 ? -1 : frameIndex === 8 ? -3 : frameIndex === 20 ? -4 : 0;
    pose.y = frameIndex === 8 || frameIndex === 20 ? -44 : frameIndex === 19 ? -43 : -42;
  } else if (frameName === "block") {
    pose.y = -40;
    pose.scale = 0.72;
  } else if (frameName === "hurt") {
    pose.x = 1;
    pose.y = -42;
    pose.scale = 0.72;
  } else if (frameName === "special" || frameName === "victory") {
    pose.y = -44;
  } else if (frameName === "sweep") {
    pose.x = 4;
    pose.y = -31;
    pose.scale = 0.7;
  } else if (frameName === "defeat") {
    pose.x = 8;
    pose.y = -12;
    pose.scale = 0.68;
  }

  if (f.profileId === "p1") pose.y -= 3;

  return pose;
}

function drawRasterBodySprite(f, crouch, stride, walking, transition = null) {
  const sheet = bodySpriteSheets[f.profileId];
  const unifiedSheet = unifiedSpriteSheets[f.profileId];

  const frameName = rasterBodyFrameFor(f, walking);
  const frameIndex = rasterBodyFrameIndex(f, frameName, walking);
  const frameX = frameIndex * BODY_SPRITE_FRAME_W;
  if (unifiedSheet?.complete && unifiedSheet.naturalWidth) {
    if ((transition?.afterimage ?? 0) > 0.035) {
      const phase = attackPhase(f.attack);
      const echoCount = f.attack && (phase.snap > 0.05 || phase.strike > 0.35) ? 2 : 1;
      for (let i = echoCount; i >= 1; i -= 1) {
        const ghostAlpha = clamp(transition.afterimage * (i === 1 ? 1 : 0.56), 0, 0.24);
        const ghostOffset = -9 - transition.afterimage * (18 + i * 18) - i * 4;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = ghostAlpha;
        ctx.shadowColor = colorWithAlpha(f.trim, 0.32);
        ctx.shadowBlur = 8 + i * 2;
        ctx.drawImage(
          unifiedSheet,
          frameX,
          0,
          BODY_SPRITE_FRAME_W,
          BODY_SPRITE_FRAME_H,
          -BODY_SPRITE_ANCHOR_X + ghostOffset,
          -BODY_SPRITE_ANCHOR_Y + crouch * 0.18 + 1.5 + i * 0.8,
          BODY_SPRITE_FRAME_W,
          BODY_SPRITE_FRAME_H
        );
        ctx.restore();
      }
    }

    ctx.save();
    ctx.shadowColor = "rgba(10, 8, 7, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(
      unifiedSheet,
      frameX,
      0,
      BODY_SPRITE_FRAME_W,
      BODY_SPRITE_FRAME_H,
      -BODY_SPRITE_ANCHOR_X,
      -BODY_SPRITE_ANCHOR_Y + crouch * 0.18,
      BODY_SPRITE_FRAME_W,
      BODY_SPRITE_FRAME_H
    );
    ctx.restore();

    drawSpritePremiumDetails(f, crouch, frameName, walking ? stride : 0);
    drawFighterStageLighting(f, crouch);
    drawSpriteCinematicFinish(f, crouch, frameName);
    return true;
  }

  if (!sheet?.complete || !sheet.naturalWidth) return false;

  const headPose = rasterHeadPose(f, frameName, frameIndex);
  const headCrouch =
    crouch +
    headPose.y +
    (frameName === "block" ? 2 : 0);

  ctx.save();
  ctx.shadowColor = "rgba(10, 8, 7, 0.46)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(
    sheet,
    frameX,
    0,
    BODY_SPRITE_FRAME_W,
    BODY_SPRITE_FRAME_H,
    -BODY_SPRITE_ANCHOR_X,
    -BODY_SPRITE_ANCHOR_Y + crouch * 0.18,
    BODY_SPRITE_FRAME_W,
    BODY_SPRITE_FRAME_H
  );
  ctx.restore();

  drawSpritePremiumDetails(f, crouch, frameName, walking ? stride : 0);

  ctx.save();
  ctx.translate(headPose.x, 0);
  drawSpriteHeadMount(f, headCrouch, headPose.scale);
  drawHead(f, headCrouch, 0, headPose.scale, {
    drawNeck: false,
    drawShadowImage: false,
    drawFaceGlow: false,
    lockRotation: true,
    faceMask: "sprite",
  });
  ctx.restore();
  drawFighterStageLighting(f, crouch);
  drawSpriteCinematicFinish(f, crouch, frameName);
  return true;
}

function drawSpritePremiumDetails(f, crouch, frameName, stride) {
  const outfit = outfitSpec(f) ?? {};
  const breath = Math.sin(roundFrame * 0.055 + f.x * 0.012);
  const action = f.attack ? attackProgress(f.attack) : 0;
  const localCrouch = crouch * 0.18;
  const torsoY = -152 + localCrouch + breath * 0.8;
  const waistY = -86 + localCrouch;
  const accent = outfit.accent ?? f.trim;
  const trim = outfit.sleeve ?? f.trim;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "screen";

  const edgeGlow = 0.14 + Math.abs(breath) * 0.04 + action * 0.08;
  ctx.strokeStyle = colorWithAlpha(accent, edgeGlow);
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-31, torsoY - 5);
  ctx.bezierCurveTo(-24, torsoY + 17, -20, waistY - 11, -23, waistY + 8);
  ctx.moveTo(31, torsoY - 5);
  ctx.bezierCurveTo(24, torsoY + 17, 20, waistY - 11, 23, waistY + 8);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 1.4;
  for (const x of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.moveTo(x, torsoY - 13 + Math.sin(roundFrame * 0.045 + x) * 1.2);
    ctx.bezierCurveTo(x - 3, torsoY + 14, x + 2, waistY - 14, x - 1, waistY + 4);
    ctx.stroke();
  }

  if (f.profileId === "p1") {
    ctx.strokeStyle = colorWithAlpha("#fff1bd", 0.22 + action * 0.14);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-28, torsoY - 1);
    ctx.lineTo(-7, waistY + 3);
    ctx.moveTo(26, torsoY + 1);
    ctx.lineTo(9, waistY + 4);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha("#7fc8ff", 0.18 + Math.abs(stride) * 0.05);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-38, -126 + localCrouch);
    ctx.quadraticCurveTo(-48, -105 + localCrouch, -39, -84 + localCrouch);
    ctx.moveTo(38, -126 + localCrouch);
    ctx.quadraticCurveTo(48, -105 + localCrouch, 39, -84 + localCrouch);
    ctx.stroke();
  } else if (f.profileId === "p2") {
    ctx.strokeStyle = colorWithAlpha("#bfffe9", 0.2 + action * 0.1);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-24, torsoY - 2);
    ctx.quadraticCurveTo(-9, torsoY + 20, -4, waistY + 1);
    ctx.moveTo(24, torsoY - 2);
    ctx.quadraticCurveTo(9, torsoY + 20, 4, waistY + 1);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(trim, 0.18 + Math.abs(stride) * 0.04);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, -128 + localCrouch);
    ctx.bezierCurveTo(-34, -108 + localCrouch, -27, -92 + localCrouch, -30, -73 + localCrouch);
    ctx.moveTo(30, -128 + localCrouch);
    ctx.bezierCurveTo(34, -108 + localCrouch, 27, -92 + localCrouch, 30, -73 + localCrouch);
    ctx.stroke();
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(32, 18, 13, 0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, waistY + 3);
  ctx.quadraticCurveTo(0, waistY + 10 + breath * 0.8, 30, waistY + 3);
  ctx.stroke();

  if (frameName === "idle" || frameName === "walk") {
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = "rgba(24, 15, 10, 0.13)";
    for (const x of [-23, 23]) {
      ctx.beginPath();
      ctx.ellipse(x + stride * 2, -31 + localCrouch, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSpriteCinematicFinish(f, crouch, frameName) {
  const phase = attackPhase(f.attack);
  const action = f.attack ? phase.power : 0;
  const anticipation = phase.anticipation;
  const strike = phase.strike;
  const recovery = phase.recovery;
  const hurt = clamp((f.hurt ?? 0) / 24, 0, 1);
  const energy = f.energy >= 45 ? 1 : 0;
  const yOffset = crouch * 0.18;
  const trim = f.trim ?? "#fff1bd";

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const rim = ctx.createLinearGradient(-70, -220 + yOffset, 74, -24 + yOffset);
  rim.addColorStop(0, "rgba(255, 240, 190, 0.18)");
  rim.addColorStop(0.35, colorWithAlpha(trim, 0.1 + action * 0.08 + energy * 0.05));
  rim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(-8, -114 + yOffset, 66, 122, -0.06, 0, Math.PI * 2);
  ctx.fill();

  if (frameName === "punch" || frameName === "kick" || frameName === "special") {
    if (anticipation > 0.05) {
      ctx.strokeStyle = colorWithAlpha(trim, 0.08 + anticipation * 0.14);
      ctx.lineWidth = 2 + anticipation * 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-18, -107 + yOffset, 58 + anticipation * 16, -0.45, Math.PI * 1.14);
      ctx.stroke();
    }

    ctx.strokeStyle = colorWithAlpha(trim, 0.16 + strike * 0.2 + recovery * 0.05);
    ctx.lineWidth = 2.2 + strike * 1.6 + anticipation * 0.6;
    ctx.beginPath();
    ctx.ellipse(0, -96 + yOffset, 60 + action * 18, 108 + action * 14, 0.02, 0, Math.PI * 2);
    ctx.stroke();

    if (strike > 0.05) {
      const isKick = frameName === "kick";
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + strike * 0.18})`;
      ctx.lineWidth = isKick ? 4.8 : 3.8;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i += 1) {
        const lane = i - 1;
        const y = (isKick ? -75 : -128) + yOffset + lane * (isKick ? 9 : 7);
        ctx.beginPath();
        ctx.moveTo(20 - lane * 3, y);
        ctx.quadraticCurveTo(54 + strike * 8, y - 12, isKick ? 106 + strike * 20 : 86 + strike * 18, y + 2);
        ctx.stroke();
      }
    }

    if (recovery > 0.08) {
      ctx.strokeStyle = colorWithAlpha(trim, 0.07 + recovery * 0.12);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -102 + yOffset, 48 + recovery * 10, Math.PI * 0.18, Math.PI * 1.18);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const occlusion = ctx.createRadialGradient(4, -101 + yOffset, 10, 7, -88 + yOffset, 90);
  occlusion.addColorStop(0, `rgba(24, 12, 9, ${0.04 + hurt * 0.08})`);
  occlusion.addColorStop(0.55, "rgba(24, 12, 9, 0.035)");
  occlusion.addColorStop(1, "rgba(24, 12, 9, 0)");
  ctx.fillStyle = occlusion;
  ctx.beginPath();
  ctx.ellipse(8, -95 + yOffset, 62, 102, 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpriteHeadMount(f, crouch, headScaleMultiplier = 1) {
  const spec = bodySpec(f);
  const outfit = outfitSpec(f) ?? {};
  const headScale = (spec.headScale ?? 0.94) * headScaleMultiplier;
  const headW = spec.headW * headScale;
  const headH = spec.headH * headScale;
  const y = -224 + crouch + spec.headY;
  const skin = f.skin ?? "#f2b891";
  const neckTop = y + headH * 0.72;
  const neckBottom = y + headH + 9;
  const neckW = Math.max(14, spec.neckW * headScale * 0.82);
  const collarY = y + headH + 2;
  const jacket = outfit.jacket ?? f.color;
  const trim = outfit.sleeve ?? f.trim;

  ctx.save();
  ctx.fillStyle = "rgba(12, 8, 7, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, collarY + 2, headW * 0.34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  const neckGrad = ctx.createLinearGradient(0, neckTop, 0, neckBottom);
  neckGrad.addColorStop(0, lighten(skin, 12));
  neckGrad.addColorStop(0.58, skin);
  neckGrad.addColorStop(1, darken(skin, 22));
  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.roundRect(-neckW / 2, neckTop, neckW, neckBottom - neckTop, 7);
  ctx.fill();

  ctx.fillStyle = "rgba(48, 24, 18, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, neckTop + 2, neckW * 0.56, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = jacket;
  ctx.strokeStyle = "rgba(28, 16, 13, 0.58)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-headW * 0.36, collarY + 2);
  ctx.quadraticCurveTo(-headW * 0.21, collarY - 4, -neckW * 0.34, neckTop + 11);
  ctx.lineTo(-3, collarY + 17);
  ctx.quadraticCurveTo(-headW * 0.22, collarY + 14, -headW * 0.42, collarY + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(headW * 0.36, collarY + 2);
  ctx.quadraticCurveTo(headW * 0.21, collarY - 4, neckW * 0.34, neckTop + 11);
  ctx.lineTo(3, collarY + 17);
  ctx.quadraticCurveTo(headW * 0.22, collarY + 14, headW * 0.42, collarY + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = trim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-headW * 0.25, collarY + 4);
  ctx.lineTo(-4, collarY + 14);
  ctx.moveTo(headW * 0.25, collarY + 4);
  ctx.lineTo(4, collarY + 14);
  ctx.stroke();
  ctx.restore();
}

function drawAttackBodyGlow(f, crouch) {
  const phase = attackPhase(f.attack);
  const progress = phase.power;
  const style = f.attack.type === "special" ? fighterSignatureStyle(f) : null;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = style ? style.rim : colorWithAlpha(f.trim, 0.55);
  ctx.globalAlpha = 0.08 + phase.anticipation * 0.1 + phase.strike * 0.22 + phase.recovery * 0.06;
  ctx.lineWidth = f.attack.type === "special" ? 5 : 2.6 + phase.strike * 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -94 + crouch, 58 + progress * 18, 106 + progress * 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (f.attack.type === "special") {
    ctx.strokeStyle = style.core;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const a = roundFrame * 0.08 + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 20, -108 + crouch + Math.sin(a) * 16, 18 + progress * 10, 0.2, Math.PI * 1.55);
      ctx.stroke();
    }

    const handY = f.profileId === "p2" ? -126 + crouch : -112 + crouch;
    const handX = f.profileId === "p2" ? 58 + phase.strike * 18 : 46 + phase.strike * 14;
    const aura = ctx.createRadialGradient(handX, handY, 2, handX, handY, 54 + progress * 36);
    aura.addColorStop(0, `rgba(255,255,255,${0.2 + progress * 0.26})`);
    aura.addColorStop(0.35, colorWithAlpha(style.rim, 0.13 + progress * 0.18));
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(handX, handY, 46 + progress * 28, 34 + progress * 24, -0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorWithAlpha(style.trail, 0.18 + progress * 0.32);
    ctx.lineWidth = 2.2 + progress * 2;
    ctx.beginPath();
    if (f.profileId === "p2") {
      ctx.moveTo(-34, -96 + crouch);
      ctx.bezierCurveTo(2, -154 + crouch, 50 + progress * 16, -154 + crouch, 78 + progress * 28, -115 + crouch);
    } else {
      ctx.moveTo(-28, -78 + crouch);
      ctx.bezierCurveTo(10, -137 + crouch, 46 + progress * 14, -148 + crouch, 78 + progress * 26, -105 + crouch);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawAttackKineticFX(f, crouch, layer = "front") {
  if (!f.attack) return;
  const phase = attackPhase(f.attack);
  const spec = attackVisualSpec(f.attack.type);
  const signature = spec.special ? fighterSignatureStyle(f) : null;
  const trailColor = signature?.trail ?? spec.color;
  const coreColor = signature?.core ?? spec.core;
  const rimColor = signature?.rim ?? spec.color;
  const prep = phase.anticipation;
  const strike = Math.max(phase.strike, phase.snap * 0.9);
  const recover = Math.max(phase.recovery * 0.72, phase.followThrough);
  const action = layer === "back" ? Math.max(prep, strike * 0.35) : Math.max(strike, recover * 0.62);
  if (action < 0.035) return;

  const yOffset = crouch * 0.18;
  const baseY = spec.trailY + yOffset;
  const reach = spec.trailReach + phase.snap * (spec.heavy ? 18 : 12);
  const height = spec.trailHeight;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (layer === "back") {
    if (prep > 0.04) {
      ctx.strokeStyle = colorWithAlpha(trailColor, 0.08 + prep * 0.16);
      ctx.lineWidth = 2.4 + prep * (spec.heavy ? 4.2 : 3);
      ctx.beginPath();
      ctx.moveTo(-44 - prep * 18, baseY + height * 0.34);
      ctx.bezierCurveTo(-18, baseY - height * 1.25, 24 + prep * 24, baseY - height * 1.15, 50 + prep * 18, baseY - height * 0.08);
      ctx.stroke();

      ctx.fillStyle = colorWithAlpha(trailColor, 0.035 + prep * 0.055);
      ctx.beginPath();
      ctx.ellipse(-18 - prep * 12, -94 + yOffset, 62 + prep * 18, 108 + prep * 10, -0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    if (strike > 0.05) {
      const pressure = Math.max(strike, phase.snap);
      ctx.fillStyle = `rgba(255, 231, 166, ${0.045 + pressure * 0.07})`;
      ctx.beginPath();
      ctx.ellipse(12 + pressure * 18, -4 + yOffset, 46 + pressure * 34, 7 + pressure * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (strike > 0.04) {
    const coreX = 25 + reach * (spec.sweep ? 0.46 : spec.kick ? 0.52 : 0.44);
    const coreY = baseY + (spec.sweep ? 3 : spec.kick ? 2 : 0);
    const glow = ctx.createRadialGradient(coreX, coreY, 2, coreX, coreY, reach * 0.52);
    glow.addColorStop(0, `rgba(255,255,255,${0.12 + strike * 0.22})`);
    glow.addColorStop(0.34, colorWithAlpha(trailColor, 0.1 + strike * 0.2));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(coreX, coreY, reach * (spec.sweep ? 0.58 : 0.5), height * (spec.kick ? 1.25 : spec.special ? 1.45 : 1), spec.sweep ? 0.02 : -0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorWithAlpha(coreColor, 0.28 + strike * 0.46);
    ctx.lineWidth = (spec.kick || spec.sweep ? 6.5 : 5) + phase.snap * 2.5;
    ctx.beginPath();
    ctx.moveTo(12 - prep * 10, baseY + height * 0.35);
    ctx.bezierCurveTo(
      reach * 0.28,
      baseY - height * (spec.sweep ? 0.34 : spec.kick ? 1.35 : 1),
      reach * 0.72,
      baseY - height * (spec.sweep ? 0.16 : 0.62),
      reach,
      baseY + height * (spec.sweep ? 0.1 : 0.04)
    );
    ctx.stroke();

    if (spec.special) {
      ctx.strokeStyle = colorWithAlpha(rimColor, 0.2 + strike * 0.5);
      ctx.lineWidth = 3.6 + phase.snap * 2.6;
      for (let i = 0; i < 3; i += 1) {
        const lane = i - 1;
        ctx.beginPath();
        if (f.profileId === "p2") {
          ctx.moveTo(12 + lane * 5, baseY - height * (0.35 + lane * 0.08));
          ctx.bezierCurveTo(reach * 0.32, baseY - height * (1.35 + lane * 0.18), reach * 0.72, baseY - height * (0.18 - lane * 0.08), reach * (1.08 + lane * 0.05), baseY + height * (0.12 + lane * 0.08));
        } else {
          ctx.moveTo(8 + lane * 6, baseY + height * (0.2 + lane * 0.12));
          ctx.bezierCurveTo(reach * 0.28, baseY - height * (1.02 + lane * 0.15), reach * 0.66, baseY - height * (0.86 - lane * 0.05), reach * (1.02 + lane * 0.04), baseY - height * (0.08 - lane * 0.1));
        }
        ctx.stroke();
      }
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.18 + strike * 0.28})`;
    ctx.lineWidth = Math.max(1.6, 2.4 + phase.snap * 1.4);
    for (let i = 0; i < 3; i += 1) {
      const lane = i - 1;
      ctx.beginPath();
      ctx.moveTo(22 + lane * 7, baseY + lane * height * 0.34);
      ctx.quadraticCurveTo(reach * 0.48, baseY - height * (0.62 + lane * 0.08), reach * (0.86 + lane * 0.02), baseY + lane * height * 0.26);
      ctx.stroke();
    }
  }

  if (recover > 0.05) {
    ctx.strokeStyle = colorWithAlpha(trailColor, 0.08 + recover * 0.16);
    ctx.lineWidth = 2 + recover * 2.2;
    ctx.beginPath();
    ctx.moveTo(reach * 0.72, baseY + height * 0.24);
    ctx.quadraticCurveTo(32 - recover * 18, baseY + height * 1.1, -22 - recover * 12, baseY + height * 0.22);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPchanPigForm(f, crouch) {
  const pulse = Math.sin(roundFrame * 0.24) * 1.5;
  ctx.save();
  ctx.translate(0, pulse);
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.beginPath();
  ctx.ellipse(0, -5, 54, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#363636";
  ctx.strokeStyle = "#101010";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(-4, -47 + crouch, 46, 39, -0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(31, -60 + crouch, 31, 28, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2c2c2c";
  for (const ear of [
    [18, -89, -0.35],
    [41, -88, 0.32],
  ]) {
    ctx.save();
    ctx.translate(ear[0], ear[1] + crouch);
    ctx.rotate(ear[2]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(11, -34);
    ctx.lineTo(21, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(27, -65 + crouch, 14, 18, 0.1, 0, Math.PI * 2);
  ctx.ellipse(48, -62 + crouch, 11, 15, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#050505";
  ctx.beginPath();
  ctx.arc(32, -62 + crouch, 2.5, 0, Math.PI * 2);
  ctx.arc(52, -59 + crouch, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5c5a8";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(61, -49 + crouch, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#7a513f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(57, -50 + crouch);
  ctx.lineTo(57, -43 + crouch);
  ctx.moveTo(64, -50 + crouch);
  ctx.lineTo(64, -43 + crouch);
  ctx.stroke();

  drawPigBandana(crouch);

  ctx.fillStyle = "#f5c5a8";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  for (const hoof of [
    [-25, -10],
    [-3, -9],
    [20, -10],
    [40, -12],
  ]) {
    ctx.beginPath();
    ctx.roundRect(hoof[0], hoof[1] + crouch, 14, 14, 5);
    ctx.fill();
    ctx.stroke();
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(143, 226, 255, 0.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -50 + crouch, 64, roundFrame * 0.04, roundFrame * 0.04 + Math.PI * 1.3);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawPigBandana(crouch) {
  const yellow = "#f7dc63";
  ctx.fillStyle = yellow;
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-37, -52 + crouch);
  ctx.quadraticCurveTo(0, -31 + crouch, 40, -43 + crouch);
  ctx.lineTo(38, -29 + crouch);
  ctx.quadraticCurveTo(-3, -19 + crouch, -43, -43 + crouch);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-23, -38 + crouch);
  ctx.quadraticCurveTo(-47, -34 + crouch, -60, -20 + crouch);
  ctx.quadraticCurveTo(-38, -19 + crouch, -20, -30 + crouch);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#111";
  for (const spot of [
    [-25, -41, 5, 13, -0.55],
    [0, -32, 5, 13, 0.2],
    [23, -36, 5, 13, 0.5],
    [-43, -26, 5, 11, 0.8],
  ]) {
    ctx.save();
    ctx.translate(spot[0], spot[1] + crouch);
    ctx.rotate(spot[4]);
    ctx.beginPath();
    ctx.roundRect(-spot[2] / 2, -spot[3] / 2, spot[2], spot[3], 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHurtRim(f, crouch) {
  const alpha = clamp(f.hurt / 18, 0, 1);
  const zone = f.hitZone ?? "torso";
  const centerY = zone === "head" ? -136 + crouch : zone === "legs" ? -44 + crouch : -96 + crouch;
  const radiusX = zone === "head" ? 45 : zone === "legs" ? 54 : 56;
  const radiusY = zone === "head" ? 42 : zone === "legs" ? 42 : 92;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 239, 179, ${0.34 * alpha})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, centerY, radiusX, radiusY, -0.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255, 78, 64, ${0.22 * alpha})`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, centerY + (zone === "legs" ? 2 : 6), radiusX * 0.86, radiusY * 0.88, 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDamageReactionFX(f, crouch) {
  const rawDamage = winner ? Math.max(0, (f.damagePulse ?? 0) - resultFrame * 0.78) : (f.damagePulse ?? 0);
  const damage = clamp(rawDamage / 34, 0, 1);
  const level = clamp(f.damageLevel ?? 0, 0, 1.7);
  const ko = winner && f.id !== roundWinnerId ? clamp(resultFrame / 58, 0, 1) : 0;
  if (damage <= 0.03 && ko <= 0.03) return;

  const localDir = (f.impactDir ?? f.dir) === f.dir ? 1 : -1;
  const shake = Math.sin((roundFrame + resultFrame) * 1.55) * damage;
  const zone = f.hitZone ?? "torso";
  const centerY = zone === "head" ? -136 + crouch : zone === "legs" ? -46 + crouch : -98 + crouch;
  const glowRx = zone === "head" ? 48 : zone === "legs" ? 62 : 58;
  const glowRy = zone === "head" ? 48 : zone === "legs" ? 44 : 92;
  const slashTop = zone === "head" ? -158 : zone === "legs" ? -62 : -138;
  const slashGap = zone === "legs" ? 18 : 33;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (damage > 0.03) {
    const glow = ctx.createRadialGradient(localDir * 16, centerY, 5, localDir * 10, centerY, 88 + level * 14);
    glow.addColorStop(0, `rgba(255, 247, 212, ${0.18 * damage})`);
    glow.addColorStop(0.42, `rgba(255, 84, 66, ${0.12 * damage * level})`);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(localDir * 8, centerY, glowRx + level * 10, glowRy + level * 8, -localDir * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 248, 206, ${0.36 * damage})`;
    ctx.lineWidth = 2.2 + level * 1.8;
    for (let i = 0; i < 3; i += 1) {
      const lane = i - 1;
      const y = slashTop + crouch + lane * slashGap + shake * 5;
      ctx.beginPath();
      ctx.moveTo(localDir * (-44 - damage * 8), y - lane * 6);
      ctx.lineTo(localDir * (-18 + damage * 18), y + 13);
      ctx.moveTo(localDir * (37 + damage * 10), y + 4);
      ctx.lineTo(localDir * (18 - damage * 14), y + 17);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(255, 83, 64, ${0.16 * damage * level})`;
    ctx.lineWidth = 6 + level * 2.5;
    ctx.beginPath();
    ctx.moveTo(localDir * -34, centerY - glowRy * 0.28);
    ctx.quadraticCurveTo(localDir * 8, centerY + shake * 8, localDir * 34, centerY + glowRy * 0.28);
    ctx.stroke();
  }

  if (ko > 0.03) {
    const settle = smoothStep01(ko);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(34, 17, 10, ${0.1 + settle * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(localDir * (14 + settle * 24), -6 + crouch + settle * 8, 58 + settle * 28, 10 + settle * 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255, 225, 156, ${0.18 * (1 - settle)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(localDir * (10 + settle * 18), -7 + crouch, 48 + settle * 44, 9 + settle * 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLowHealthStagger(f, crouch) {
  const danger = clamp((30 - f.health) / 30, 0, 1);
  const stagger = clamp((f.staggerPulse ?? 0) / 18, 0, 1);
  const pulse = 0.5 + Math.sin(roundFrame * 0.18 + f.x * 0.014) * 0.5;
  const breath = 0.5 + Math.sin(roundFrame * 0.11 + f.x * 0.02) * 0.5;
  const alpha = danger * (0.16 + pulse * 0.08) + stagger * 0.12;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 96, 72, ${alpha})`;
  ctx.lineWidth = 2.5 + stagger * 2;
  ctx.beginPath();
  ctx.ellipse(0, -100 + crouch, 55 + stagger * 8, 91 + breath * 5 + stagger * 8, -0.04, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 224, 142, ${danger * 0.12 + stagger * 0.16})`;
  ctx.lineWidth = 1.4 + stagger * 1.2;
  ctx.lineCap = "round";
  for (let i = 0; i < 2; i += 1) {
    const side = i === 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(side * 34, -124 + crouch + pulse * 4);
    ctx.quadraticCurveTo(side * (42 + breath * 4), -92 + crouch, side * 31, -64 + crouch + stagger * 5);
    ctx.stroke();
  }

  if (stagger > 0.04) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + stagger * 0.18})`;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i += 1) {
      const y = -132 + i * 32 + crouch;
      ctx.beginPath();
      ctx.moveTo(-44 - stagger * 8, y);
      ctx.lineTo(-29, y + 7);
      ctx.moveTo(44 + stagger * 8, y + 5);
      ctx.lineTo(29, y + 12);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawHitFlash(f, crouch) {
  const alpha = clamp(f.hitFlash / 16, 0, 1);
  const contact = clamp((f.contactFlash ?? 0) / 14, 0, 1);
  const strength = clamp(f.impactStrength ?? 0.8, 0.45, 1.45);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(0, -102 + crouch, 8, 0, -102 + crouch, 78);
  glow.addColorStop(0, `rgba(255, 248, 206, ${0.28 * alpha})`);
  glow.addColorStop(0.48, `rgba(255, 201, 69, ${0.18 * alpha})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, -103 + crouch, 58, 86, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 248, 206, ${0.54 * alpha})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-34, -128 + crouch);
  ctx.lineTo(30, -76 + crouch);
  ctx.moveTo(22, -134 + crouch);
  ctx.lineTo(-26, -66 + crouch);
  ctx.stroke();

  if (contact > 0) {
    const dir = f.impactDir ?? f.dir;
    const localDir = dir === f.dir ? 1 : -1;
    ctx.translate(localDir * 18, -104 + crouch);
    ctx.rotate(localDir * -0.12);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.48 * contact})`;
    ctx.lineWidth = 4.5 * strength;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-28, -9);
    ctx.lineTo(30, 8);
    ctx.moveTo(-20, 13);
    ctx.lineTo(20, -14);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(f.trim, 0.28 * contact);
    ctx.lineWidth = 9 * strength;
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.quadraticCurveTo(0, -22, 38, -5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawResultPoseEffect(f, crouch) {
  const clock = roundFrame + resultFrame;
  ctx.save();
  if (f.id === roundWinnerId) {
    ctx.globalCompositeOperation = "screen";
    const floorPulse = 0.5 + Math.sin(clock * 0.08) * 0.18;
    ctx.strokeStyle = colorWithAlpha(f.trim, 0.28 + floorPulse * 0.16);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -4 + crouch, 62 + floorPulse * 10, 13 + floorPulse * 3, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const x = -44 + i * 29 + Math.sin(clock * 0.04 + i) * 4;
      const top = -204 + crouch + Math.cos(clock * 0.03 + i) * 8;
      const bottom = -36 + crouch;
      const ray = ctx.createLinearGradient(x, top, x + 12, bottom);
      ray.addColorStop(0, colorWithAlpha(f.trim, 0));
      ray.addColorStop(0.44, colorWithAlpha(f.trim, 0.16));
      ray.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = ray;
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.lineTo(x + 14, top);
      ctx.stroke();
    }

    const spotlight = ctx.createRadialGradient(0, -142 + crouch, 12, 0, -96 + crouch, 126);
    spotlight.addColorStop(0, colorWithAlpha(f.trim, 0.2));
    spotlight.addColorStop(0.45, "rgba(255, 241, 189, 0.08)");
    spotlight.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spotlight;
    ctx.beginPath();
    ctx.ellipse(0, -96 + crouch, 78, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i += 1) {
      const angle = clock * 0.035 + i * 1.26;
      const x = Math.cos(angle) * 44;
      const y = -148 + crouch + Math.sin(angle * 1.4) * 18;
      ctx.fillStyle = colorWithAlpha(f.trim, 0.45);
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 4, y - 2);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x + 4, y + 3);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 4, y + 3);
      ctx.lineTo(x - 10, y);
      ctx.lineTo(x - 4, y - 2);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(12, 8, 7, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, -2 + crouch, 58, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = "rgba(255, 241, 189, 0.48)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -170 + crouch, 23, 10, 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 241, 189, 0.5)";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(-18 + i * 18, -171 + crouch + Math.sin(clock * 0.12 + i) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = colorWithAlpha(f.trim, 0.38);
    for (let i = 0; i < 4; i += 1) {
      const x = -34 + i * 22 + Math.sin(clock * 0.05 + i) * 3;
      const y = -20 + crouch - Math.sin(clock * 0.07 + i) * 5;
      ctx.beginPath();
      ctx.ellipse(x, y, 9 + i, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSpeedLines(f, box) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const outfit = outfitSpec(f);
  const phase = attackPhase(f.attack);
  const spec = attackVisualSpec(f.attack?.type);
  const isSweep = spec.sweep;
  const snap = Math.max(phase.snap, phase.strike * 0.55);
  ctx.strokeStyle = isSweep ? "rgba(255, 232, 122, 0.42)" : `rgba(255, 247, 214, ${0.28 + snap * 0.14})`;
  ctx.lineWidth = (isSweep ? 4 : 3) + snap * 1.2;
  ctx.lineCap = "round";
  const origin = f.dir > 0 ? box.x - 22 : box.x + box.w + 22;
  const target = f.dir > 0 ? box.x + box.w * 0.72 : box.x + box.w * 0.28;
  const lineCount = spec.heavy ? 9 : 7;
  for (let i = 0; i < lineCount; i += 1) {
    const y = box.y + 6 + i * (box.h / lineCount);
    ctx.beginPath();
    ctx.moveTo(origin - f.dir * snap * 10, y + Math.sin(roundFrame * 0.4 + i) * 3);
    ctx.lineTo(target + f.dir * snap * 18, y - 6 + Math.cos(i) * 5);
    ctx.stroke();
  }
  ctx.strokeStyle = outfit.accent;
  ctx.globalAlpha = 0.3 + snap * 0.16;
  ctx.lineWidth = 2 + snap * 0.8;
  for (let i = 0; i < 3; i += 1) {
    const y = box.y + box.h * (0.25 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(origin + f.dir * 8, y);
    ctx.lineTo(target + f.dir * 18, y - 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawAttackArc(f, box) {
  const phase = attackPhase(f.attack);
  const spec = attackVisualSpec(f.attack?.type);
  const isKick = spec.kick || spec.sweep;
  const progress = Math.max(phase.strike, phase.snap * 0.9, phase.anticipation * 0.35, phase.followThrough * 0.28, phase.recovery * 0.22);
  const outfit = outfitSpec(f);
  const x = f.dir > 0 ? box.x + box.w * 0.28 : box.x + box.w * 0.72;
  const y = box.y + box.h * 0.45;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(x, y);
  ctx.scale(f.dir * FIGHTER_SCALE, FIGHTER_SCALE);
  ctx.rotate(spec.sweep ? 0.02 : isKick ? -0.16 : -0.06);

  const glow = ctx.createRadialGradient(24, 0, 4, 24, 0, isKick ? 106 : 82);
  glow.addColorStop(0, spec.heavy ? "rgba(255, 231, 122, 0.38)" : "rgba(155, 231, 255, 0.36)");
  glow.addColorStop(0.38, colorWithAlpha(outfit.accent, 0.18 + phase.snap * 0.08));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(22 + phase.snap * 8, 0, isKick ? 100 : 78, isKick ? 29 : 21, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(outfit.accent, 0.78);
  ctx.globalAlpha = 0.2 + phase.anticipation * 0.08 + phase.strike * 0.36 + phase.recovery * 0.12;
  ctx.lineWidth = (isKick ? 12 : 9) + phase.strike * 2.2 + phase.snap * 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-12 - phase.anticipation * 12, 13 + phase.anticipation * 5);
  ctx.quadraticCurveTo(32, -34 - phase.strike * 8 - phase.snap * 8, isKick ? 134 + phase.strike * 18 + phase.snap * 18 : 96 + phase.strike * 14 + phase.snap * 12, -10);
  ctx.stroke();

  ctx.strokeStyle = spec.color;
  ctx.globalAlpha = 0.24 + phase.strike * 0.42 + phase.snap * 0.22 + phase.recovery * 0.1;
  ctx.lineWidth = (isKick ? 7 : 5) + phase.strike * 1.4;
  ctx.beginPath();
  ctx.moveTo(-10 - phase.anticipation * 10, 8 + phase.anticipation * 4);
  ctx.quadraticCurveTo(34, -28 - phase.strike * 8 - phase.snap * 6, isKick ? 126 + phase.strike * 16 + phase.snap * 16 : 88 + phase.strike * 12 + phase.snap * 10, -8);
  ctx.stroke();

  if (phase.snap > 0.05) {
    ctx.fillStyle = `rgba(255,255,255,${0.18 + phase.snap * 0.28})`;
    ctx.beginPath();
    ctx.ellipse(isKick ? 118 : 82, -9, 16 + phase.snap * 12, 5 + phase.snap * 3, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function attackProgress(attack) {
  if (!attack) return 0;
  return Math.sin(clamp(attack.frame / attack.duration, 0, 1) * Math.PI);
}

function attackPhase(attack) {
  if (!attack) {
    return {
      anticipation: 0,
      strike: 0,
      recovery: 0,
      settle: 0,
      snap: 0,
      followThrough: 0,
      windupT: 0,
      strikeT: 0,
      recoveryT: 0,
      power: 0,
    };
  }

  const windupT = clamp(attack.frame / Math.max(1, attack.activeStart), 0, 1);
  const strikeT = clamp(
    (attack.frame - attack.activeStart + 1) / Math.max(1, attack.activeEnd - attack.activeStart + 2),
    0,
    1
  );
  const recoveryT = clamp((attack.frame - attack.activeEnd) / Math.max(1, attack.duration - attack.activeEnd), 0, 1);
  const anticipation = attack.frame < attack.activeStart ? Math.sin(windupT * Math.PI) : 0;
  const strike = attack.frame >= attack.activeStart && attack.frame <= attack.activeEnd ? Math.sin(strikeT * Math.PI) : 0;
  const recovery = attack.frame > attack.activeEnd ? Math.sin(recoveryT * Math.PI) : 0;
  const settle = attack.frame > attack.activeEnd ? smoothStep01(recoveryT) : 0;
  const snap = attack.frame >= attack.activeStart && attack.frame <= attack.activeStart + 4
    ? 1 - clamp((attack.frame - attack.activeStart) / 4, 0, 1)
    : 0;
  const followThrough = attack.frame > attack.activeEnd && attack.frame <= attack.activeEnd + 5
    ? Math.sin(clamp((attack.frame - attack.activeEnd) / 5, 0, 1) * Math.PI)
    : 0;

  return {
    anticipation,
    strike,
    recovery,
    settle,
    snap,
    followThrough,
    windupT,
    strikeT,
    recoveryT,
    power: Math.max(strike, snap * 0.9, anticipation * 0.38, followThrough * 0.3, recovery * 0.18),
  };
}

function getPose(f, stride) {
  const spec = bodySpec(f);
  const crouch = f.crouch * 18;
  const phase = attackPhase(f.attack);
  const progress = f.attack ? phase.power : 0;
  const attackType = f.attack?.type;
  const activePulse = phase.strike;
  const windup = phase.anticipation;
  const recovery = phase.recovery;
  const airborne = !f.grounded;
  const torsoTilt =
    (f.hurt > 0 ? -0.07 : 0) +
    (airborne ? -0.05 : 0) +
    (attackType === "punch" || attackType === "airPunch" ? 0.12 * activePulse - 0.08 * windup - 0.03 * recovery : 0) +
    (attackType === "kick" || attackType === "airKick" ? -0.13 * activePulse + 0.04 * windup + 0.025 * recovery : 0) +
    (attackType === "sweep" ? 0.2 * activePulse - 0.05 * windup : 0) +
    (attackType === "grab" ? 0.1 * activePulse - 0.05 * windup : 0) +
    (attackType === "special" ? -0.1 * activePulse + 0.04 * windup : 0);

  const hipY = -62 + crouch;
  const shoulderY = -124 + crouch;
  const hipX = 18 * spec.stance;
  const shoulderX = 31 * spec.stance;
  const base = {
    torsoTilt,
    frontArm: {
      shoulder: { x: shoulderX, y: shoulderY },
      elbow: { x: 50 * spec.stance, y: -93 + crouch },
      hand: { x: 62 * spec.stance, y: -72 + crouch },
    },
    backArm: {
      shoulder: { x: -shoulderX, y: shoulderY + 4 },
      elbow: { x: -47 * spec.stance, y: -94 + crouch },
      hand: { x: -34 * spec.stance, y: -72 + crouch },
    },
    frontLeg: {
      hip: { x: hipX, y: hipY },
      knee: { x: (25 + stride * 10) * spec.stance, y: -35 + crouch },
      foot: { x: (34 + stride * 19) * spec.stance, y: -2 },
    },
    backLeg: {
      hip: { x: -hipX, y: hipY },
      knee: { x: (-25 - stride * 9) * spec.stance, y: -35 + crouch },
      foot: { x: (-34 - stride * 15) * spec.stance, y: -2 },
    },
  };

  if (f.blocking) {
    base.frontArm = {
      shoulder: { x: 26, y: shoulderY },
      elbow: { x: 39, y: -124 + crouch },
      hand: { x: 42, y: -99 + crouch },
    };
    base.backArm = {
      shoulder: { x: -24, y: shoulderY + 6 },
      elbow: { x: 14, y: -122 + crouch },
      hand: { x: 16, y: -97 + crouch },
    };
    base.frontLeg.knee.x += 8;
    base.backLeg.foot.x -= 8;
  }

  if (attackType === "punch" || attackType === "airPunch") {
    base.frontArm.elbow = { x: 48 - windup * 14 + activePulse * 46 - recovery * 9, y: -104 + crouch - windup * 7 - activePulse * 3 + recovery * 8 };
    base.frontArm.hand = { x: 58 - windup * 22 + activePulse * 78 - recovery * 12, y: -99 + crouch - windup * 9 - activePulse * 6 + recovery * 9 };
    base.backArm.elbow = { x: -42 - windup * 13 + activePulse * 3 + recovery * 8, y: -107 + crouch - windup * 7 + recovery * 7 };
    base.backArm.hand = { x: -17 - windup * 17 + activePulse * 2 + recovery * 10, y: -91 + crouch - windup * 9 + recovery * 8 };
    base.frontLeg.foot.x += 5 * activePulse - 2 * windup;
    base.backLeg.foot.x -= 11 * activePulse + 4 * windup - recovery * 5;
  } else if (attackType === "kick" || attackType === "airKick") {
    base.frontLeg.knee = { x: 35 - windup * 13 + activePulse * 48 - recovery * 8, y: -43 - windup * 5 - activePulse * 23 + crouch + recovery * 8 };
    base.frontLeg.foot = { x: 49 - windup * 22 + activePulse * 92 + recovery * 4, y: -19 + windup * 4 - activePulse * 39 + recovery * 14 };
    base.backLeg.knee = { x: -29 - activePulse * 7 - windup * 5, y: -31 + crouch + recovery * 3 };
    base.backLeg.foot = { x: -42 - activePulse * 13 - windup * 8 + recovery * 6, y: -1 };
    base.frontArm.elbow = { x: 36 - windup * 5 - activePulse * 10, y: -86 + crouch + activePulse * 8 + recovery * 5 };
    base.frontArm.hand = { x: 47 - windup * 7 - activePulse * 12, y: -63 + crouch + activePulse * 4 + recovery * 5 };
    base.backArm.elbow = { x: -42 - windup * 11 - activePulse * 9, y: -108 + crouch - windup * 7 - activePulse * 7 + recovery * 6 };
    base.backArm.hand = { x: -24 - windup * 15 - activePulse * 16, y: -90 + crouch - windup * 9 - activePulse * 8 + recovery * 7 };
  } else if (attackType === "sweep") {
    base.frontLeg.knee = { x: 32 - windup * 9 + activePulse * 45, y: -25 + crouch + activePulse * 11 };
    base.frontLeg.foot = { x: 62 - windup * 14 + activePulse * 78 - recovery * 8, y: -1 };
    base.backLeg.knee = { x: -32 - windup * 4, y: -23 + crouch + activePulse * 10 };
    base.backLeg.foot = { x: -58, y: 0 };
    base.frontArm.elbow = { x: 31 - windup * 5, y: -84 + crouch + activePulse * 13 };
    base.frontArm.hand = { x: 42 - windup * 7, y: -61 + crouch + activePulse * 15 };
    base.backArm.elbow = { x: -32 - windup * 8, y: -89 + crouch + activePulse * 11 };
    base.backArm.hand = { x: -45 - windup * 8, y: -66 + crouch + activePulse * 14 };
  } else if (attackType === "grab") {
    base.frontArm.elbow = { x: 48 - windup * 11 + activePulse * 34 - recovery * 8, y: -96 + crouch - windup * 3 - activePulse * 4 + recovery * 4 };
    base.frontArm.hand = { x: 68 - windup * 17 + activePulse * 52 - recovery * 11, y: -92 + crouch - windup * 2 - activePulse * 1 + recovery * 6 };
    base.backArm.elbow = { x: 22 - windup * 9 + activePulse * 41 - recovery * 8, y: -114 + crouch - windup * 4 - activePulse * 2 + recovery * 4 };
    base.backArm.hand = { x: 49 - windup * 13 + activePulse * 56 - recovery * 10, y: -111 + crouch - windup * 4 + activePulse * 3 + recovery * 5 };
    base.frontLeg.foot.x += 10 * activePulse - 3 * windup;
    base.backLeg.foot.x -= 9 * activePulse + 4 * windup - recovery * 4;
  } else if (attackType === "special") {
    if (f.profileId === "p2") {
      base.torsoTilt = -0.08 * activePulse + 0.03 * windup;
      base.frontArm.elbow = { x: 44 - windup * 14 + activePulse * 38, y: -133 + crouch - windup * 8 - activePulse * 9 };
      base.frontArm.hand = { x: 66 - windup * 21 + activePulse * 66, y: -129 + crouch - windup * 11 - activePulse * 6 };
      base.backArm.elbow = { x: -28 - windup * 10 - activePulse * 16, y: -139 + crouch - windup * 12 - activePulse * 15 };
      base.backArm.hand = { x: -42 - windup * 14 - activePulse * 21, y: -163 + crouch - windup * 14 - activePulse * 18 };
      base.frontLeg.knee.x += 10 * activePulse - 5 * windup;
      base.frontLeg.foot.x += 14 * activePulse - 4 * windup;
      base.backLeg.foot.x -= 12 * activePulse + 5 * windup;
    } else if (f.profileId === "p1") {
      base.torsoTilt = -0.13 * activePulse + 0.06 * windup;
      base.frontArm.elbow = { x: 36 - windup * 12 + activePulse * 24, y: -134 + crouch - windup * 7 - activePulse * 14 };
      base.frontArm.hand = { x: 52 - windup * 20 + activePulse * 48, y: -121 + crouch - windup * 8 - activePulse * 11 };
      base.backArm.elbow = { x: -18 - windup * 16 + activePulse * 16, y: -126 + crouch - windup * 8 - activePulse * 12 };
      base.backArm.hand = { x: 20 - windup * 24 + activePulse * 44, y: -114 + crouch - windup * 9 - activePulse * 10 };
      base.frontLeg.knee.x += 7 * activePulse;
      base.frontLeg.foot.x += 11 * activePulse - 4 * windup;
      base.backLeg.foot.x -= 12 * activePulse + 5 * windup;
    } else {
      base.frontArm.elbow = { x: 42 - windup * 7 + activePulse * 20, y: -121 + crouch - windup * 4 - activePulse * 8 };
      base.frontArm.hand = { x: 66 - windup * 12 + activePulse * 36, y: -106 + crouch - windup * 5 - activePulse * 5 };
      base.backArm.elbow = { x: 12 - windup * 8 + activePulse * 24, y: -123 + crouch - windup * 5 - activePulse * 9 };
      base.backArm.hand = { x: 46 - windup * 12 + activePulse * 35, y: -107 + crouch - windup * 4 - activePulse * 6 };
      base.frontLeg.foot.x += 7 * activePulse - 3 * windup;
      base.backLeg.foot.x -= 7 * activePulse + 3 * windup;
    }
  }

  if (f.hurt > 0 && !winner) {
    const zoneT = clamp((f.hitZonePulse ?? 0) / 26, 0, 1);
    const hitDir = f.impactDir ?? f.dir;
    if (f.hitZone === "head") {
      base.torsoTilt -= 0.18 * zoneT;
      base.frontArm.elbow = { x: 34 * spec.stance, y: -145 + crouch - zoneT * 8 };
      base.frontArm.hand = { x: 42 * spec.stance, y: -163 + crouch - zoneT * 9 };
      base.backArm.elbow = { x: -18 * spec.stance, y: -139 + crouch - zoneT * 7 };
      base.backArm.hand = { x: -4 * spec.stance, y: -160 + crouch - zoneT * 8 };
      base.frontLeg.knee.x += hitDir * zoneT * 5;
      base.backLeg.foot.x -= hitDir * zoneT * 9;
    } else if (f.hitZone === "legs") {
      base.torsoTilt += 0.15 * zoneT;
      base.frontLeg.knee = { x: (25 + stride * 10 + 16 * zoneT) * spec.stance, y: -22 + crouch + zoneT * 14 };
      base.frontLeg.foot = { x: (32 + stride * 14 + 10 * zoneT) * spec.stance, y: -1 };
      base.backLeg.knee = { x: (-26 - stride * 8 - 12 * zoneT) * spec.stance, y: -23 + crouch + zoneT * 18 };
      base.backLeg.foot = { x: (-36 - stride * 12 - 18 * zoneT) * spec.stance, y: 0 };
      base.frontArm.elbow.y += zoneT * 12;
      base.frontArm.hand.y += zoneT * 18;
      base.backArm.elbow.y += zoneT * 9;
      base.backArm.hand.y += zoneT * 15;
    } else {
      base.torsoTilt += 0.1 * zoneT;
      base.frontArm.elbow = { x: 34 * spec.stance, y: -104 + crouch + zoneT * 5 };
      base.frontArm.hand = { x: 41 * spec.stance, y: -85 + crouch + zoneT * 9 };
      base.backArm.elbow = { x: -22 * spec.stance, y: -111 + crouch + zoneT * 4 };
      base.backArm.hand = { x: -14 * spec.stance, y: -88 + crouch + zoneT * 8 };
      base.frontLeg.foot.x += 8 * zoneT * spec.stance;
      base.backLeg.foot.x -= 10 * zoneT * spec.stance;
    }
  }

  if (airborne) {
    base.frontLeg.knee.y -= 18;
    base.frontLeg.foot.y -= 18;
    base.backLeg.knee.y -= 10;
    base.backLeg.foot.y -= 8;
  }

  if (winner) {
    if (f.id === roundWinnerId) {
      const victory = clamp(Math.max(0, (f.victoryPulse ?? 60) - resultFrame * 0.9) / 60, 0, 1);
      base.torsoTilt = -0.08 - victory * 0.04;
      base.frontArm = {
        shoulder: { x: shoulderX, y: shoulderY },
        elbow: { x: 42 * spec.stance, y: -155 + crouch - victory * 7 },
        hand: { x: 54 * spec.stance, y: -184 + crouch - victory * 9 },
      };
      base.backArm = {
        shoulder: { x: -shoulderX, y: shoulderY + 4 },
        elbow: { x: -42 * spec.stance, y: -151 + crouch - victory * 6 },
        hand: { x: -54 * spec.stance, y: -178 + crouch - victory * 8 },
      };
      base.frontLeg.foot.x += 8 * spec.stance;
      base.backLeg.foot.x -= 8 * spec.stance;
    } else {
      const fall = smoothStep01(clamp(resultFrame / 46, 0, 1));
      base.torsoTilt = 0.16 + fall * 0.24;
      base.frontArm.hand = { x: (48 + fall * 12) * spec.stance, y: -42 + crouch + fall * 16 };
      base.backArm.hand = { x: (-40 - fall * 10) * spec.stance, y: -38 + crouch + fall * 18 };
      base.frontLeg.knee.y += 10 + fall * 14;
      base.backLeg.knee.y += 12 + fall * 16;
      base.frontLeg.foot.x += (12 + fall * 10) * spec.stance;
      base.backLeg.foot.x -= (14 + fall * 10) * spec.stance;
    }
  }

  return humanizePose(base, spec);
}

function humanizePose(pose, spec) {
  const armScale = (spec.limb ?? 1) * (spec.armScale ?? 1);
  const legScale = (spec.limb ?? 1) * (spec.legScale ?? 1);
  pose.frontArm = solveTwoBoneLimb(pose.frontArm, "shoulder", "elbow", "hand", 32 * armScale, 34 * armScale, 1);
  pose.backArm = solveTwoBoneLimb(pose.backArm, "shoulder", "elbow", "hand", 31 * armScale, 33 * armScale, -1);
  pose.frontLeg = solveTwoBoneLimb(pose.frontLeg, "hip", "knee", "foot", 34 * legScale, 38 * legScale, 1);
  pose.backLeg = solveTwoBoneLimb(pose.backLeg, "hip", "knee", "foot", 34 * legScale, 38 * legScale, -1);
  return pose;
}

function solveTwoBoneLimb(limb, rootKey, jointKey, endKey, upperLen, lowerLen, bendHint) {
  const root = limb[rootKey];
  const targetEnd = limb[endKey];
  const currentJoint = limb[jointKey];
  const dx = targetEnd.x - root.x;
  const dy = targetEnd.y - root.y;
  const rawDistance = Math.max(0.001, Math.hypot(dx, dy));
  const maxReach = upperLen + lowerLen - 0.5;
  const minReach = Math.max(2, Math.abs(upperLen - lowerLen) + 0.5);
  const distance = clamp(rawDistance, minReach, maxReach);
  const ux = dx / rawDistance;
  const uy = dy / rawDistance;
  const end = {
    x: root.x + ux * distance,
    y: root.y + uy * distance,
  };

  const along = clamp((upperLen * upperLen - lowerLen * lowerLen + distance * distance) / (2 * distance), 0, upperLen);
  const height = Math.sqrt(Math.max(0, upperLen * upperLen - along * along));
  const px = -uy;
  const py = ux;
  const sideFromCurrent = Math.sign((currentJoint.x - root.x) * px + (currentJoint.y - root.y) * py);
  const side = sideFromCurrent || bendHint || 1;
  const joint = {
    x: root.x + ux * along + px * height * side,
    y: root.y + uy * along + py * height * side,
  };

  return {
    ...limb,
    [jointKey]: joint,
    [endKey]: end,
  };
}

function drawTorso(f, crouch) {
  const spec = bodySpec(f);
  const outfit = outfitSpec(f);
  const giLight = lighten(outfit.jacket, 28);
  const giDark = darken(outfit.jacket, 34);
  const giDeep = darken(outfit.jacket, 48);
  const shoulder = spec.shoulder;
  const chest = spec.chest ?? shoulder;
  const waist = spec.waist;
  const hip = spec.hip;
  const lowerWaist = waist * (spec.belly ?? 1);
  const lowerHip = hip * (spec.belly ? 1.08 : 1);
  const shoulderSlope = spec.shoulderSlope ?? 8;
  const waistY = -77 + crouch;
  const top = -137 + crouch;
  const bottom = -32 + crouch;

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, -37 + crouch, hip + 6, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(38, 22, 17, 0.76)";
  ctx.beginPath();
  ctx.moveTo(-shoulder - 5, top + shoulderSlope + 3);
  ctx.quadraticCurveTo(-chest - 12, waistY, -lowerWaist - 6, bottom + 3);
  ctx.lineTo(lowerWaist + 6, bottom + 3);
  ctx.quadraticCurveTo(chest + 12, waistY, shoulder + 5, top + shoulderSlope + 3);
  ctx.quadraticCurveTo(0, top - 13, -shoulder - 5, top + shoulderSlope + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = giDark;
  ctx.beginPath();
  ctx.moveTo(-shoulder, top + shoulderSlope);
  ctx.bezierCurveTo(-chest - 11, -116 + crouch, -lowerWaist - 8, -68 + crouch, -lowerWaist, bottom);
  ctx.lineTo(lowerWaist, bottom);
  ctx.bezierCurveTo(lowerWaist + 8, -68 + crouch, chest + 11, -116 + crouch, shoulder, top + shoulderSlope);
  ctx.quadraticCurveTo(0, top - 11, -shoulder, top + shoulderSlope);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(38, 22, 17, 0.68)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = outfit.jacket;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 2, top + shoulderSlope + 2);
  ctx.bezierCurveTo(-chest - 6, -110 + crouch, -lowerWaist - 4, -67 + crouch, -lowerWaist, bottom);
  ctx.lineTo(lowerWaist, bottom);
  ctx.bezierCurveTo(lowerWaist + 4, -67 + crouch, chest + 6, -110 + crouch, shoulder - 2, top + shoulderSlope + 2);
  ctx.quadraticCurveTo(0, top - 7, -shoulder + 2, top + shoulderSlope + 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(38, 22, 17, 0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = giLight;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 14, top + shoulderSlope + 4);
  ctx.lineTo(6, -82 + crouch);
  ctx.lineTo(-10, -35 + crouch);
  ctx.lineTo(-waist - 2, -35 + crouch);
  ctx.quadraticCurveTo(-chest + 2, -78 + crouch, -shoulder + 14, top + shoulderSlope + 4);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.moveTo(14, top + 10);
  ctx.lineTo(shoulder - 8, -104 + crouch);
  ctx.lineTo(waist + 2, -43 + crouch);
  ctx.lineTo(8, -82 + crouch);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.09)";
  ctx.beginPath();
  ctx.ellipse(-shoulder + 12, top + shoulderSlope + 14, 16, 23, -0.5, 0, Math.PI * 2);
  ctx.ellipse(shoulder - 12, top + shoulderSlope + 14, 16, 23, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colorWithAlpha(outfit.sleeve, 0.34);
  ctx.beginPath();
  ctx.ellipse(-shoulder + 7, top + shoulderSlope + 13, 17, 15, -0.45, 0, Math.PI * 2);
  ctx.ellipse(shoulder - 7, top + shoulderSlope + 13, 17, 15, 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(58, 31, 20, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -116 + crouch);
  ctx.lineTo(8, -82 + crouch);
  ctx.lineTo(-2, -35 + crouch);
  ctx.stroke();

  ctx.fillStyle = giDeep;
  ctx.beginPath();
  ctx.moveTo(-20, -119 + crouch);
  ctx.lineTo(-5, -101 + crouch);
  ctx.lineTo(-17, -87 + crouch);
  ctx.lineTo(-34, -113 + crouch);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -119 + crouch);
  ctx.lineTo(5, -101 + crouch);
  ctx.lineTo(17, -87 + crouch);
  ctx.lineTo(34, -113 + crouch);
  ctx.closePath();
  ctx.fill();

  drawOutfitPattern(f, outfit, shoulder, waist, hip, top, bottom, crouch);
  drawOutfitMaterial(f, outfit, shoulder, waist, hip, top, bottom, crouch);
  drawSpriteTorsoVolume(f, outfit, shoulder, chest, waist, hip, top, bottom, crouch);

  ctx.fillStyle = outfit.belt;
  ctx.beginPath();
  ctx.roundRect(-lowerHip - 7, -63 + crouch, (lowerHip + 7) * 2, 13, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(43, 26, 20, 0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(-2, -61 + crouch, 8, 11);

  ctx.fillStyle = giDeep;
  ctx.beginPath();
  ctx.roundRect(-11, -66 + crouch, 22, 19, 5);
  ctx.fill();
  ctx.fillStyle = outfit.belt;
  ctx.beginPath();
  ctx.moveTo(-7, -62 + crouch);
  ctx.lineTo(0, -55 + crouch);
  ctx.lineTo(7, -62 + crouch);
  ctx.lineTo(7, -51 + crouch);
  ctx.lineTo(0, -47 + crouch);
  ctx.lineTo(-7, -51 + crouch);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.roundRect(waist - 18, -103 + crouch, 20, 24, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(50, 28, 19, 0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 247, 214, 0.82)";
  ctx.font = "900 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(f.mark ?? f.name[0], waist - 8, -91 + crouch);
  ctx.textBaseline = "alphabetic";

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  for (const x of [-shoulder + 16, shoulder - 16]) {
    ctx.beginPath();
    ctx.moveTo(x, -112 + crouch);
    ctx.quadraticCurveTo(x * 0.55, -82 + crouch, x * 0.78, -42 + crouch);
    ctx.stroke();
  }

  drawGiFolds(f, shoulder, waist, crouch);
}

function drawOutfitPattern(f, outfit, shoulder, waist, hip, top, bottom, crouch) {
  ctx.save();
  ctx.lineCap = "round";

  if (outfit.pattern === "split") {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(-6, top + 12);
    ctx.lineTo(shoulder - 6, -111 + crouch);
    ctx.lineTo(waist + 1, bottom);
    ctx.lineTo(2, bottom - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = outfit.sleeve;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(17, top + 13);
    ctx.lineTo(33, -47 + crouch);
    ctx.stroke();
  } else if (outfit.pattern === "wrap") {
    ctx.strokeStyle = outfit.sleeve;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-shoulder + 17, top + 16);
    ctx.lineTo(7, -82 + crouch);
    ctx.lineTo(waist - 5, bottom - 5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(shoulder - 18, top + 16);
    ctx.lineTo(-2, -82 + crouch);
    ctx.lineTo(-waist + 6, bottom - 5);
    ctx.stroke();
  } else if (outfit.pattern === "power") {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.roundRect(-17, top + 20, 34, bottom - top - 28, 6);
    ctx.fill();
    ctx.fillStyle = outfit.accent;
    for (const x of [-shoulder + 11, shoulder - 29]) {
      ctx.beginPath();
      ctx.roundRect(x, top + 22, 18, 12, 5);
      ctx.fill();
    }
  } else if (outfit.pattern === "racing") {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-shoulder + 8, top + 12);
    ctx.quadraticCurveTo(-shoulder - 2, -78 + crouch, -waist - 13, bottom);
    ctx.lineTo(waist + 13, bottom);
    ctx.quadraticCurveTo(shoulder + 2, -78 + crouch, shoulder - 8, top + 12);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    for (let x = -42; x <= 42; x += 28) {
      ctx.fillRect(x - 7, top + 10, 14, bottom - top - 2);
    }
    ctx.fillStyle = "rgba(22, 43, 82, 0.22)";
    ctx.fillRect(-6, top + 12, 12, bottom - top);
    ctx.restore();

    ctx.strokeStyle = outfit.trimLine ?? "#162b52";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-shoulder + 12, top + 15);
    ctx.quadraticCurveTo(0, -122 + crouch, shoulder - 12, top + 15);
    ctx.stroke();

    ctx.fillStyle = "rgba(22, 43, 82, 0.72)";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RACING", 0, -91 + crouch);
  } else if (outfit.pattern === "stripe") {
    ctx.strokeStyle = outfit.sleeve;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-shoulder + 11, top + 18);
    ctx.lineTo(waist - 3, bottom - 2);
    ctx.stroke();
    ctx.strokeStyle = outfit.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-shoulder + 22, top + 17);
    ctx.lineTo(waist + 5, bottom - 4);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-hip + 8, -49 + crouch);
  ctx.lineTo(hip - 8, -49 + crouch);
  ctx.stroke();
  ctx.restore();
}

function drawOutfitMaterial(f, outfit, shoulder, waist, hip, top, bottom, crouch) {
  const spec = bodySpec(f);
  const lowerHip = hip * (spec.belly ? 1.08 : 1);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const clothShade = ctx.createLinearGradient(-shoulder, top, shoulder, bottom);
  clothShade.addColorStop(0, "rgba(255,255,255,0.12)");
  clothShade.addColorStop(0.38, "rgba(255,255,255,0.02)");
  clothShade.addColorStop(1, "rgba(0,0,0,0.14)");
  ctx.fillStyle = clothShade;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 6, top + 14);
  ctx.quadraticCurveTo(-waist - 5, -77 + crouch, -lowerHip, bottom + 1);
  ctx.lineTo(lowerHip, bottom + 1);
  ctx.quadraticCurveTo(waist + 5, -77 + crouch, shoulder - 6, top + 14);
  ctx.quadraticCurveTo(0, top - 4, -shoulder + 6, top + 14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1.4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * (shoulder - 12), top + 20);
    ctx.bezierCurveTo(side * (waist + 6), -100 + crouch, side * (waist + 4), -74 + crouch, side * (lowerHip - 5), bottom - 4);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.13)";
    ctx.beginPath();
    ctx.moveTo(side * (shoulder - 26), top + 30);
    ctx.bezierCurveTo(side * 18, -94 + crouch, side * 22, -70 + crouch, side * 16, bottom - 6);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
  }

  ctx.strokeStyle = colorWithAlpha(outfit.accent, 0.34);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-lowerHip + 9, -47 + crouch);
  ctx.lineTo(lowerHip - 9, -47 + crouch);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.2;
  for (let x = -lowerHip + 14; x <= lowerHip - 14; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, -62 + crouch);
    ctx.lineTo(x + 3, -56 + crouch);
    ctx.stroke();
  }

  if (outfit.pattern === "racing") {
    ctx.strokeStyle = "rgba(22, 43, 82, 0.32)";
    ctx.lineWidth = 1.5;
    for (let x = -36; x <= 36; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, top + 24);
      ctx.lineTo(x + 2, bottom - 6);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.roundRect(-25, -79 + crouch, 50, 6, 3);
    ctx.fill();
  }

  ctx.restore();
}

function drawSpriteTorsoVolume(f, outfit, shoulder, chest, waist, hip, top, bottom, crouch) {
  const spec = bodySpec(f);
  const lowerWaist = waist * (spec.belly ?? 1);
  const lowerHip = hip * (spec.belly ? 1.08 : 1);
  const shoulderSlope = spec.shoulderSlope ?? 8;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(-shoulder + 6, top + shoulderSlope + 3);
  ctx.bezierCurveTo(-chest - 6, -110 + crouch, -lowerWaist - 4, -67 + crouch, -lowerHip + 1, bottom);
  ctx.lineTo(lowerHip - 1, bottom);
  ctx.bezierCurveTo(lowerWaist + 4, -67 + crouch, chest + 6, -110 + crouch, shoulder - 6, top + shoulderSlope + 3);
  ctx.quadraticCurveTo(0, top - 6, -shoulder + 6, top + shoulderSlope + 3);
  ctx.closePath();
  ctx.clip();

  const bodySheen = ctx.createLinearGradient(-shoulder, top, shoulder, bottom);
  bodySheen.addColorStop(0, "rgba(255,255,255,0.16)");
  bodySheen.addColorStop(0.42, "rgba(255,255,255,0.03)");
  bodySheen.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = bodySheen;
  ctx.beginPath();
  ctx.ellipse(-shoulder * 0.22, -94 + crouch, shoulder * 0.5, 54, -0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(20, 12, 10, 0.36)";
  ctx.lineWidth = 3;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * (shoulder - 8), top + shoulderSlope + 10);
    ctx.bezierCurveTo(side * (chest + 4), -103 + crouch, side * (lowerWaist + 3), -66 + crouch, side * (lowerHip - 2), bottom - 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-shoulder * 0.48, -116 + crouch);
  ctx.bezierCurveTo(-shoulder * 0.2, -104 + crouch, -waist * 0.25, -84 + crouch, -waist * 0.2, -48 + crouch);
  ctx.stroke();

  if (f.build === "slimFemale" || f.build === "softFemale") {
    ctx.strokeStyle = colorWithAlpha(outfit.accent, f.build === "slimFemale" ? 0.36 : 0.3);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-waist - 5, -69 + crouch);
    ctx.bezierCurveTo(-waist * 0.4, -61 + crouch, waist * 0.4, -61 + crouch, waist + 5, -69 + crouch);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.ellipse(0, -49 + crouch, hip * 0.72, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (f.build === "racingHeavy") {
    ctx.strokeStyle = "rgba(22, 43, 82, 0.38)";
    ctx.lineWidth = 2.6;
    for (let y = -99 + crouch; y <= -59 + crouch; y += 15) {
      ctx.beginPath();
      ctx.moveTo(-waist - 14, y);
      ctx.bezierCurveTo(-waist * 0.2, y + 8, waist * 0.2, y + 8, waist + 14, y);
      ctx.stroke();
    }
  } else if (f.build === "tallLean") {
    ctx.strokeStyle = colorWithAlpha(outfit.accent, 0.24);
    ctx.lineWidth = 1.8;
    for (const x of [-10, 10]) {
      ctx.beginPath();
      ctx.moveTo(x, -118 + crouch);
      ctx.bezierCurveTo(x * 0.65, -96 + crouch, x * 0.62, -72 + crouch, x * 0.8, -41 + crouch);
      ctx.stroke();
    }
  }

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 16, top + shoulderSlope + 7);
  ctx.quadraticCurveTo(0, top - 10, shoulder - 16, top + shoulderSlope + 7);
  ctx.stroke();
  ctx.restore();
}

function drawHead(f, crouch, stride, headScaleMultiplier = 1, options = {}) {
  const spec = bodySpec(f);
  const headScale = (spec.headScale ?? 0.94) * headScaleMultiplier;
  const headW = spec.headW * headScale;
  const headH = spec.headH * headScale;
  const x = -headW / 2;
  const y = -224 + crouch + Math.abs(stride) * 2 + spec.headY;

  if (options.drawNeck !== false) {
    const skin = f.skin ?? "#f2b891";
    const neckW = spec.neckW ?? 26;
    const neckH = spec.neckH ?? 20;
    const neckTop = -118 + crouch;
    const neckBottom = neckTop + neckH;
    const neckGrad = ctx.createLinearGradient(0, neckTop, 0, neckBottom);
    neckGrad.addColorStop(0, lighten(skin, 16));
    neckGrad.addColorStop(1, darken(skin, 18));
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.roundRect(-neckW / 2, neckTop, neckW, neckH, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(43, 24, 18, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(39, 20, 15, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, neckTop - 2, neckW * 0.6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  const headAngle = options.lockRotation ? 0 : stride * 0.018 + (f.hurt > 0 ? Math.sin(f.hurt) * 0.03 : 0);
  ctx.rotate(headAngle);
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, -146 + crouch + spec.headY, 38, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(22, 14, 12, 0.16)";
  drawFaceMaskPath(x + 12, y + 8, headW - 24, headH - 15, 18, options.faceMask);
  ctx.fill();

  if (f.face.complete) {
    const facePad = spec.facePad ?? 4;
    const clipX = x + facePad;
    const clipY = y + facePad;
    const clipW = headW - facePad * 2;
    const clipH = headH - facePad * 1.55;
    const clipRadius = Math.min(24, Math.max(16, headW * 0.23));

    drawHeadBackSilhouette(f, x, y, headW, headH, options.faceMask);

    if (options.drawShadowImage !== false) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 7;
      ctx.globalAlpha = 0.82;
      ctx.drawImage(f.face, x, y, headW, headH);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(18, 12, 10, 0.12)";
    drawFaceMaskPath(clipX - 2, clipY - 2, clipW + 4, clipH + 4, clipRadius + 2, options.faceMask);
    ctx.fill();

    ctx.save();
    drawFaceMaskPath(clipX, clipY, clipW, clipH, clipRadius, options.faceMask);
    ctx.clip();
    ctx.filter = options.faceMask === "sprite" ? "saturate(0.92) contrast(1.08) brightness(1.03)" : "none";
    ctx.drawImage(f.face, x, y, headW, headH);
    ctx.filter = "none";

    if (options.drawFaceGlow !== false) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.16;
      ctx.drawImage(f.face, x - 2, y - 2, headW, headH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    const faceShade = ctx.createLinearGradient(clipX, clipY, clipX + clipW, clipY + clipH);
    faceShade.addColorStop(0, "rgba(255,255,255,0.12)");
    faceShade.addColorStop(0.5, "rgba(255,255,255,0)");
    faceShade.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = faceShade;
    ctx.fillRect(clipX, clipY, clipW, clipH);
    drawFacePaintPass(f, clipX, clipY, clipW, clipH, options.faceMask);
    ctx.restore();

    const rim = ctx.createLinearGradient(x, y, x + headW, y + headH);
    rim.addColorStop(0, "rgba(255,255,255,0.18)");
    rim.addColorStop(0.48, "rgba(255,255,255,0)");
    rim.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = rim;
    drawFaceMaskPath(clipX, clipY, clipW, clipH, clipRadius, options.faceMask);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = options.faceMask === "sprite" ? "rgba(36, 21, 16, 0.18)" : "rgba(36, 21, 16, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, y + headH - 11, headW * 0.27, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(f.trim, options.faceMask === "sprite" ? 0.22 : 0.32);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, y + headH * 0.53, headW * 0.4, -0.68, 0.68);
    ctx.stroke();
    drawHeadIntegrationPass(f, x, y, headW, headH, options.faceMask);

    if (f.profileId === "p2") drawAkaneHairWisps(f, x, y, headW, headH);
    if (f.headwear === "pchanBandana") drawPchanHeadBandana(f, x, y, headW, headH);
  } else {
    ctx.fillStyle = "#e5c0a9";
    ctx.fillRect(x, y, headW, headH);
  }
  ctx.restore();
}

function drawFaceMaskPath(x, y, w, h, radius, mode) {
  ctx.beginPath();
  if (mode === "sprite") {
    const cx = x + w / 2;
    ctx.moveTo(cx, y);
    ctx.bezierCurveTo(x + w * 0.84, y + h * 0.03, x + w * 0.98, y + h * 0.22, x + w * 0.92, y + h * 0.55);
    ctx.bezierCurveTo(x + w * 0.86, y + h * 0.86, x + w * 0.66, y + h * 1.02, cx, y + h);
    ctx.bezierCurveTo(x + w * 0.34, y + h * 1.02, x + w * 0.14, y + h * 0.86, x + w * 0.08, y + h * 0.55);
    ctx.bezierCurveTo(x + w * 0.02, y + h * 0.22, x + w * 0.16, y + h * 0.03, cx, y);
    ctx.closePath();
    return;
  }
  ctx.roundRect(x, y, w, h, radius);
}

function drawHeadBackSilhouette(f, x, y, headW, headH, maskMode) {
  if (maskMode !== "sprite") return;

  const skin = f.skin ?? "#f2b891";
  const hair = f.profileId === "p2" ? "#211417" : "#3b2f28";
  const sway = Math.sin(roundFrame * 0.075 + f.x * 0.011) * 1.6 + clamp((f.vx ?? 0) * 0.22, -1.8, 1.8);

  if (f.profileId !== "p2") {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(34, 18, 13, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, y + headH * 0.59, headW * 0.42, headH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colorWithAlpha(darken(skin, 18), 0.18);
    ctx.beginPath();
    ctx.ellipse(-headW * 0.36, y + headH * 0.52, headW * 0.11, headH * 0.28, -0.18, 0, Math.PI * 2);
    ctx.ellipse(headW * 0.36, y + headH * 0.52, headW * 0.11, headH * 0.28, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = hair;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.moveTo(x + headW * 0.48, y - 4);
  ctx.bezierCurveTo(x + headW * 0.76, y - 5, x + headW * 0.92 + sway, y + headH * 0.12, x + headW * 0.94, y + headH * 0.38);
  ctx.bezierCurveTo(x + headW * 0.82, y + headH * 0.24, x + headW * 0.64, y + headH * 0.12, x + headW * 0.5, y + headH * 0.12);
  ctx.bezierCurveTo(x + headW * 0.34, y + headH * 0.12, x + headW * 0.18, y + headH * 0.24, x + headW * 0.06, y + headH * 0.38);
  ctx.bezierCurveTo(x + headW * 0.08 - sway, y + headH * 0.12, x + headW * 0.22, y - 5, x + headW * 0.48, y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = hair;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(x + headW * 0.16 + sway, y + headH * 0.16);
  ctx.bezierCurveTo(x + headW * 0.02 + sway, y + headH * 0.42, x + headW * 0.05, y + headH * 0.74, x + headW * 0.24, y + headH * 0.94);
  ctx.bezierCurveTo(x + headW * 0.2, y + headH * 0.65, x + headW * 0.22, y + headH * 0.34, x + headW * 0.3, y + headH * 0.09);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + headW * 0.84 + sway, y + headH * 0.18);
  ctx.bezierCurveTo(x + headW * 0.98 + sway, y + headH * 0.42, x + headW * 0.95, y + headH * 0.74, x + headW * 0.76, y + headH * 0.94);
  ctx.bezierCurveTo(x + headW * 0.8, y + headH * 0.65, x + headW * 0.78, y + headH * 0.34, x + headW * 0.7, y + headH * 0.09);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFacePaintPass(f, clipX, clipY, clipW, clipH, maskMode) {
  if (maskMode !== "sprite") return;

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(255, 232, 196, 0.16)";
  ctx.beginPath();
  ctx.ellipse(clipX + clipW * 0.34, clipY + clipH * 0.35, clipW * 0.24, clipH * 0.28, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(55, 26, 18, 0.14)";
  ctx.beginPath();
  ctx.ellipse(clipX + clipW * 0.64, clipY + clipH * 0.74, clipW * 0.31, clipH * 0.16, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(42, 22, 17, 0.16)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(clipX + clipW * 0.22, clipY + clipH * 0.86);
  ctx.quadraticCurveTo(clipX + clipW * 0.5, clipY + clipH * 0.99, clipX + clipW * 0.78, clipY + clipH * 0.86);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = f.profileId === "p2" ? "rgba(255, 245, 232, 0.12)" : "rgba(255, 244, 218, 0.14)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(clipX + clipW * 0.2, clipY + clipH * 0.16);
  ctx.bezierCurveTo(clipX + clipW * 0.34, clipY + clipH * 0.06, clipX + clipW * 0.64, clipY + clipH * 0.05, clipX + clipW * 0.82, clipY + clipH * 0.19);
  ctx.stroke();
  ctx.restore();
}

function drawHeadIntegrationPass(f, x, y, headW, headH, maskMode) {
  if (maskMode !== "sprite") return;

  const trim = f.trim ?? "#fff1bd";
  const skin = f.skin ?? "#f2b891";
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(34, 18, 14, 0.24)";
  ctx.beginPath();
  ctx.ellipse(0, y + headH * 0.92, headW * 0.34, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const jaw = ctx.createLinearGradient(0, y + headH * 0.62, 0, y + headH);
  jaw.addColorStop(0, "rgba(255,255,255,0)");
  jaw.addColorStop(0.55, "rgba(73, 34, 25, 0.12)");
  jaw.addColorStop(1, "rgba(34, 18, 14, 0.2)");
  ctx.fillStyle = jaw;
  ctx.beginPath();
  ctx.ellipse(0, y + headH * 0.7, headW * 0.43, headH * 0.31, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(trim, 0.3);
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, y + headH * 0.51, headW * 0.45, -0.92, 0.78);
  ctx.stroke();
  ctx.strokeStyle = colorWithAlpha(lighten(skin, 20), 0.12);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, y + headH * 0.52, headW * 0.48, -2.45, -1.05);
  ctx.stroke();
  ctx.restore();
}

function drawAkaneHairWisps(f, x, y, headW, headH) {
  const sway = Math.sin(roundFrame * 0.09 + f.x * 0.018) * 2 + clamp((f.vx ?? 0) * 0.34, -2.4, 2.4);
  const hurt = f.hurt > 0 ? Math.sin(f.hurt * 0.7) * 1.5 : 0;
  const leftX = x + headW * 0.18;
  const rightX = x + headW * 0.82;
  const topY = y + headH * 0.18;
  const lowY = y + headH * 0.78;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(36, 18, 22, 0.24)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(leftX + sway * 0.25, topY);
  ctx.bezierCurveTo(leftX - 9 + sway, topY + 18, leftX - 10 + sway * 0.5, lowY - 10, leftX + 2 + hurt, lowY);
  ctx.moveTo(rightX + sway * 0.22, topY + 2);
  ctx.bezierCurveTo(rightX + 8 + sway, topY + 19, rightX + 8 + sway * 0.4, lowY - 12, rightX - 1 - hurt, lowY - 1);
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(255, 245, 226, 0.08)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(leftX + 2, topY + 5);
  ctx.bezierCurveTo(leftX - 4 + sway * 0.5, topY + 24, leftX - 3, lowY - 14, leftX + 4, lowY - 4);
  ctx.moveTo(rightX - 2, topY + 6);
  ctx.bezierCurveTo(rightX + 4 + sway * 0.5, topY + 24, rightX + 3, lowY - 16, rightX - 4, lowY - 4);
  ctx.stroke();
  ctx.restore();
}

function drawPchanHeadBandana(f, x, y, headW, headH) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const yellow = "#f7dc63";
  const shadow = "#b77d19";
  const mark = "#151515";
  const action = f.attack ? attackProgress(f.attack) : 0;
  const flutter = Math.sin(roundFrame * 0.13 + f.x * 0.018) * 2 + clamp((f.vx ?? 0) * 0.48, -3.5, 3.5);
  const hurtFlick = f.hurt > 0 ? Math.sin(f.hurt * 0.85) * 2.2 : 0;
  const tailLift = Math.cos(roundFrame * 0.1 + f.x * 0.01) * 1.2 - action * 2.8;
  const bandLeft = x + headW * 0.26;
  const bandRight = x + headW * 0.76;
  const bandTop = y - headH * 0.025 + 2.6;
  const knotX = x + headW * 0.72;
  const knotY = y + headH * 0.055 + 2.2;

  ctx.fillStyle = "rgba(0,0,0,0.26)";
  ctx.beginPath();
  ctx.ellipse(knotX + 7, knotY + 5, 12, 8, -0.12, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = yellow;
  ctx.strokeStyle = shadow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bandLeft, bandTop + 8);
  ctx.quadraticCurveTo(x + headW * 0.5, bandTop + 1, bandRight, bandTop + 7);
  ctx.lineTo(bandRight - 2, bandTop + 15);
  ctx.quadraticCurveTo(x + headW * 0.5, bandTop + 10, bandLeft - 2, bandTop + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(knotX, knotY, 6.8, 7.8, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(knotX + 4, knotY - 2);
  ctx.quadraticCurveTo(knotX + 16 + flutter, knotY - 4 + tailLift, knotX + 25 + flutter * 1.4, knotY + 4 + tailLift + hurtFlick);
  ctx.quadraticCurveTo(knotX + 16 + flutter * 0.6, knotY + 10 + tailLift, knotX + 5, knotY + 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(knotX + 1, knotY + 5);
  ctx.quadraticCurveTo(knotX + 12 + flutter * 0.5, knotY + 13 + tailLift, knotX + 15 + flutter * 0.7, knotY + 24 + hurtFlick);
  ctx.quadraticCurveTo(knotX + 5 + flutter * 0.25, knotY + 22 + tailLift, knotX - 3, knotY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = mark;
  for (const spot of [
    [bandLeft + headW * 0.13, bandTop + 8, 3.6, 7.4, -0.42],
    [bandLeft + headW * 0.34, bandTop + 10, 3.4, 7.2, 0.22],
    [knotX + 12 + flutter * 0.9, knotY + 3 + tailLift, 3.4, 7.2, 0.72],
    [knotX + 7 + flutter * 0.35, knotY + 15 + tailLift, 3.2, 6.8, -0.2],
  ]) {
    ctx.save();
    ctx.translate(spot[0], spot[1]);
    ctx.rotate(spot[4]);
    ctx.beginPath();
    ctx.roundRect(-spot[2] / 2, -spot[3] / 2, spot[2], spot[3], 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawSpriteJointCover(point, color, rx, ry, angle, alpha = 1) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  ctx.globalAlpha *= alpha;
  const coverGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
  coverGrad.addColorStop(0, lighten(color, 22));
  coverGrad.addColorStop(0.55, color);
  coverGrad.addColorStop(1, darken(color, 26));
  ctx.fillStyle = coverGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.42)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.ellipse(-rx * 0.22, -ry * 0.24, rx * 0.42, ry * 0.22, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpriteCuff(a, b, color, width, offset = 0.78) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const angle = Math.atan2(dy, dx);
  const x = a.x + dx * offset;
  const y = a.y + dy * offset;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const cuffGrad = ctx.createLinearGradient(-width * 0.45, -6, width * 0.45, 6);
  cuffGrad.addColorStop(0, darken(color, 24));
  cuffGrad.addColorStop(0.55, lighten(color, 10));
  cuffGrad.addColorStop(1, darken(color, 16));
  ctx.fillStyle = cuffGrad;
  ctx.beginPath();
  ctx.roundRect(-width * 0.5, -5, width, 10, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.36)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

function drawLeg(f, leg, front) {
  const spec = bodySpec(f);
  const outfit = outfitSpec(f);
  const pant = front ? outfit.pants : darken(outfit.pants, 28);
  const thighWidth = (spec.thighWidth ?? spec.limb ?? 1);
  const calfWidth = (spec.calfWidth ?? spec.limb ?? 1);
  const hipAngle = Math.atan2(leg.knee.y - leg.hip.y, leg.knee.x - leg.hip.x);
  const kneeAngle = Math.atan2(leg.foot.y - leg.knee.y, leg.foot.x - leg.knee.x);

  drawLimbSegment(leg.hip, leg.knee, pant, 24 * thighWidth, 16 * thighWidth);
  drawLimbSegment(leg.knee, leg.foot, pant, 19 * calfWidth, 10 * calfWidth);
  drawSpriteJointCover(leg.hip, pant, 12 * thighWidth, 9 * thighWidth, hipAngle, front ? 0.96 : 0.82);
  drawSpriteJointCover(leg.knee, pant, 9 * calfWidth, 7 * calfWidth, kneeAngle, front ? 1 : 0.84);
  drawSpriteCuff(leg.knee, leg.foot, pant, 16 * calfWidth, 0.82);

  ctx.fillStyle = front ? outfit.accent : "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.ellipse(leg.knee.x, leg.knee.y, 8 * calfWidth, 6 * calfWidth, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.34)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (front) {
    ctx.strokeStyle = `${outfit.belt}`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leg.hip.x + 4, leg.hip.y + 5);
    ctx.quadraticCurveTo(leg.knee.x + 6, leg.knee.y - 3, leg.foot.x + 4, leg.foot.y - 9);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(leg.foot.x, leg.foot.y);
  ctx.rotate((leg.foot.x - leg.knee.x) * 0.012);
  const footGrad = ctx.createLinearGradient(-15, -9, 27 * spec.foot, 7);
  footGrad.addColorStop(0, darken(outfit.shoe, 26));
  footGrad.addColorStop(0.38, outfit.shoe);
  footGrad.addColorStop(1, lighten(outfit.shoe, 16));
  ctx.fillStyle = footGrad;
  ctx.beginPath();
  ctx.roundRect(-16, -9, 43 * spec.foot, 16, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.48)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(9, 10, 12, 0.28)";
  ctx.beginPath();
  ctx.roundRect(-16, 2, 43 * spec.foot, 5, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.roundRect(8 * spec.foot, -8, 12 * spec.foot, 4, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(1, -7, 15 * spec.foot, 4);
  ctx.strokeStyle = "rgba(35, 21, 17, 0.34)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i += 1) {
    const x = 13 + i * 5 * spec.foot;
    ctx.beginPath();
    ctx.moveTo(x, -6);
    ctx.lineTo(x + 2, 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArm(f, arm, front) {
  const spec = bodySpec(f);
  const outfit = outfitSpec(f);
  const sleeve = front ? outfit.sleeve : darken(outfit.jacket, 34);
  const upperArmWidth = (spec.upperArmWidth ?? spec.limb ?? 1);
  const forearmWidth = (spec.forearmWidth ?? spec.limb ?? 1);
  const shoulderAngle = Math.atan2(arm.elbow.y - arm.shoulder.y, arm.elbow.x - arm.shoulder.x);
  const elbowAngle = Math.atan2(arm.hand.y - arm.elbow.y, arm.hand.x - arm.elbow.x);

  drawLimbSegment(arm.shoulder, arm.elbow, sleeve, 20 * upperArmWidth, 13 * upperArmWidth);
  drawLimbSegment(arm.elbow, arm.hand, sleeve, 16 * forearmWidth, 9 * forearmWidth);
  drawSpriteJointCover(arm.shoulder, sleeve, 11 * upperArmWidth, 8 * upperArmWidth, shoulderAngle, front ? 1 : 0.8);
  drawSpriteJointCover(arm.elbow, sleeve, 8 * forearmWidth, 6.5 * forearmWidth, elbowAngle, front ? 1 : 0.82);
  drawSpriteCuff(arm.elbow, arm.hand, sleeve, 15 * forearmWidth, 0.78);

  if (front) {
    ctx.strokeStyle = outfit.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arm.shoulder.x - 2, arm.shoulder.y + 3);
    ctx.quadraticCurveTo(arm.elbow.x + 2, arm.elbow.y - 2, arm.hand.x - 5, arm.hand.y - 6);
    ctx.stroke();
  }

  ctx.strokeStyle = front ? colorWithAlpha(outfit.accent, 0.42) : "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(arm.hand.x - 9 * spec.hand, arm.hand.y - 9);
  ctx.quadraticCurveTo(arm.hand.x, arm.hand.y - 13, arm.hand.x + 9 * spec.hand, arm.hand.y - 8);
  ctx.stroke();

  const skin = f.skin ?? "#f5c7a9";
  const handGrad = ctx.createRadialGradient(arm.hand.x - 4, arm.hand.y - 4, 3, arm.hand.x, arm.hand.y, 15 * spec.hand);
  handGrad.addColorStop(0, lighten(skin, 18));
  handGrad.addColorStop(0.62, skin);
  handGrad.addColorStop(1, darken(skin, 22));
  ctx.fillStyle = handGrad;
  ctx.beginPath();
  ctx.ellipse(arm.hand.x, arm.hand.y, (front ? 12 : 11) * spec.hand, 9 * spec.hand, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(arm.elbow.x, arm.elbow.y, 5.5 * forearmWidth, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(61, 34, 24, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arm.hand.x - 5 * spec.hand, arm.hand.y + 2);
  ctx.quadraticCurveTo(arm.hand.x, arm.hand.y + 6, arm.hand.x + 6 * spec.hand, arm.hand.y + 1);
  ctx.stroke();

  if (front && f.attack?.type === "special") {
    const progress = attackProgress(f.attack);
    const style = f.specialStyle ?? SPECIAL_STYLES.p1;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = style.rim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(arm.hand.x, arm.hand.y, 18 + progress * 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = style.core;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(arm.hand.x, arm.hand.y, 9 + progress * 13, Math.PI * 0.15, Math.PI * 1.62);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLimbSegment(a, b, color, widthA, widthB) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  const length = Math.hypot(b.y - a.y, b.x - a.x);
  const startW = widthA;
  const endW = widthB;
  const width = (startW + endW) * 0.5;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const c1x = a.x + dx * 0.32;
  const c1y = a.y + dy * 0.32;
  const c2x = a.x + dx * 0.7;
  const c2y = a.y + dy * 0.7;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(35, 21, 17, 0.56)";
  ctx.lineWidth = Math.max(startW, endW) + 5;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  const grad = ctx.createLinearGradient(a.x + nx * width * 0.6, a.y + ny * width * 0.6, a.x - nx * width * 0.6, a.y - ny * width * 0.6);
  grad.addColorStop(0, lighten(color, 18));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 28));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * startW * 0.5, a.y + ny * startW * 0.5);
  ctx.bezierCurveTo(
    c1x + nx * startW * 0.44,
    c1y + ny * startW * 0.44,
    c2x + nx * endW * 0.44,
    c2y + ny * endW * 0.44,
    b.x + nx * endW * 0.5,
    b.y + ny * endW * 0.5
  );
  ctx.lineTo(b.x - nx * endW * 0.5, b.y - ny * endW * 0.5);
  ctx.bezierCurveTo(
    c2x - nx * endW * 0.44,
    c2y - ny * endW * 0.44,
    c1x - nx * startW * 0.44,
    c1y - ny * startW * 0.44,
    a.x - nx * startW * 0.5,
    a.y - ny * startW * 0.5
  );
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = Math.max(1.2, width * 0.13);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * startW * 0.22, a.y + ny * startW * 0.22);
  ctx.bezierCurveTo(
    c1x + nx * startW * 0.19,
    c1y + ny * startW * 0.19,
    c2x + nx * endW * 0.18,
    c2y + ny * endW * 0.18,
    b.x + nx * endW * 0.16,
    b.y + ny * endW * 0.16
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,0.16)";
  ctx.lineWidth = Math.max(1.5, width * 0.16);
  ctx.beginPath();
  ctx.moveTo(a.x - nx * startW * 0.26, a.y - ny * startW * 0.26);
  ctx.bezierCurveTo(
    c1x - nx * startW * 0.22,
    c1y - ny * startW * 0.22,
    c2x - nx * endW * 0.2,
    c2y - ny * endW * 0.2,
    b.x - nx * endW * 0.18,
    b.y - ny * endW * 0.18
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(55, 30, 22, 0.28)";
  ctx.lineWidth = Math.max(1.4, width * 0.12);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  if (length > 22) {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(a.x, a.y, Math.max(3.5, startW * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawGiFolds(f, shoulder, waist, crouch) {
  ctx.save();
  ctx.strokeStyle = "rgba(29, 18, 14, 0.22)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * (shoulder - 12), -112 + crouch);
    ctx.quadraticCurveTo(side * (waist + 2), -82 + crouch, side * (waist - 5), -44 + crouch);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(side * (shoulder - 23), -98 + crouch);
    ctx.quadraticCurveTo(side * 12, -76 + crouch, side * 17, -39 + crouch);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 16, -121 + crouch);
  ctx.quadraticCurveTo(-18, -132 + crouch, shoulder - 16, -121 + crouch);
  ctx.stroke();
  ctx.restore();
}

function drawGuard(color, crouch, f) {
  const guard = clamp((f?.guardPulse ?? 0) / 18, 0, 1);
  const impact = clamp((f?.guardImpact ?? 0) / 16, 0, 1);
  const counter = clamp((f?.counterWindow ?? 0) / 34, 0, 1);
  const pulse = 0.5 + Math.sin(roundFrame * 0.32) * 0.5;
  const centerX = 22 + impact * 5;
  const centerY = -106 + crouch + impact * 2;
  const radius = 30 + guard * 5 + impact * 12;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const glow = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, radius + 32);
  glow.addColorStop(0, colorWithAlpha(color, 0.16 + impact * 0.16 + counter * 0.08));
  glow.addColorStop(0.48, "rgba(189, 234, 255, 0.08)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius + 22, radius + 34, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(color, 0.48 + guard * 0.2 + impact * 0.22);
  ctx.lineWidth = 4.2 + impact * 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -1.35, 1.38);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,255,255,${0.36 + impact * 0.32 + counter * 0.2})`;
  ctx.lineWidth = 1.8 + impact * 1.8;
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY, radius + 9 + impact * 3, -1.12, 1.13);
  ctx.stroke();

  if (impact > 0.05 || counter > 0.05) {
    ctx.strokeStyle = counter > 0.05 ? `rgba(255, 241, 189, ${0.18 + counter * 0.34})` : `rgba(189, 234, 255, ${0.18 + impact * 0.3})`;
    ctx.lineWidth = 1.4 + impact * 1.2;
    for (let i = 0; i < 3; i += 1) {
      const lane = i - 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 7 + lane * 5, centerY - radius * 0.78 + lane * 7);
      ctx.lineTo(centerX + 22 + impact * 16 + lane * 7, centerY + lane * 12);
      ctx.stroke();
    }
  }

  if (counter > 0.05) {
    ctx.strokeStyle = `rgba(255, 241, 189, ${0.16 + pulse * 0.16})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY, radius + 18, -0.85, 0.82);
    ctx.stroke();
  }

  ctx.restore();
}

function drawProjectiles() {
  for (const p of projectiles) {
    const style = p.style ?? SPECIAL_STYLES.p1;
    for (let i = 0; i < p.trail.length; i += 1) {
      const point = p.trail[i];
      const alpha = (i + 1) / p.trail.length;
      ctx.fillStyle = colorWithAlpha(style.trail, 0.04 + alpha * 0.16);
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, p.r * alpha * 1.45, p.r * alpha * 0.78, p.vx > 0 ? 0 : Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const pulse = Math.sin(p.life * 0.45) * 3;
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 34 + pulse);
    glow.addColorStop(0, style.core);
    glow.addColorStop(0.35, style.rim);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34 + pulse, 0, Math.PI * 2);
    ctx.fill();

    drawSpecialCore(p, style, pulse);
  }
}

function drawSpecialCore(p, style, pulse) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.life * 0.08 * (p.vx > 0 ? 1 : -1));
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = style.core;
  ctx.strokeStyle = style.rim;
  ctx.lineWidth = 3;

  if (style.shape === "petal") {
    for (let i = 0; i < 5; i += 1) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.ellipse(0, -10 - pulse * 0.2, 7, 17 + pulse * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style.shape === "bolt") {
    ctx.beginPath();
    ctx.moveTo(-15, -12);
    ctx.lineTo(2, -6);
    ctx.lineTo(-6, 2);
    ctx.lineTo(16, 10);
    ctx.lineTo(-2, 5);
    ctx.lineTo(5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style.shape === "star") {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? 19 + pulse : 8;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style.shape === "burst") {
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a) * (22 + pulse), Math.sin(a) * (22 + pulse));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 12 + pulse * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.shape === "spark") {
    ctx.beginPath();
    ctx.roundRect(-18, -8, 36, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = style.core;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-22, i * 7);
      ctx.lineTo(22, i * -5);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 13 + pulse * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = style.core;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + pulse, 0.15, Math.PI * 1.65);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    const alpha = clamp(p.life / 24, 0, 1);
    ctx.globalAlpha = alpha;
    if (p.kind === "slash") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-p.length * 0.4, 0);
      ctx.quadraticCurveTo(0, -p.length * 0.22, p.length * 0.6, 0);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "impactCore") {
      const progress = 1 - p.life / (p.maxLife ?? 12);
      const radius = p.size * (1 + progress * 0.7);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const core = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, radius);
      core.addColorStop(0, `rgba(255, 255, 255, ${0.72 * alpha})`);
      core.addColorStop(0.32, colorWithAlpha(p.color, 0.48 * alpha));
      core.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, radius * 1.05, radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === "impactLine") {
      const progress = 1 - p.life / (p.maxLife ?? 14);
      const length = p.length * (1 - progress * 0.22);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";
      ctx.strokeStyle = colorWithAlpha(p.color, 0.28 * alpha);
      ctx.lineWidth = p.size * 2.4;
      ctx.beginPath();
      ctx.moveTo(-length * 0.48, 0);
      ctx.lineTo(length * 0.52, 0);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.42 * alpha})`;
      ctx.lineWidth = Math.max(1.2, p.size * 0.58);
      ctx.beginPath();
      ctx.moveTo(-length * 0.38, 0);
      ctx.lineTo(length * 0.62, 0);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "contactFlash") {
      const progress = 1 - p.life / (p.maxLife ?? 10);
      const radius = p.size * (1 + progress * 0.55);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      const core = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
      core.addColorStop(0, `rgba(255, 255, 255, ${0.86 * alpha})`);
      core.addColorStop(0.23, colorWithAlpha(p.color, 0.68 * alpha));
      core.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.12, radius * 0.64, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.72 * alpha})`;
      ctx.lineWidth = Math.max(2, 5.5 * (1 - progress));
      ctx.beginPath();
      ctx.moveTo(-radius * 0.9, 0);
      ctx.lineTo(radius * 1.05, 0);
      ctx.moveTo(0, -radius * 0.52);
      ctx.lineTo(0, radius * 0.52);
      ctx.stroke();
      ctx.strokeStyle = colorWithAlpha(p.color, 0.44 * alpha);
      ctx.lineWidth = Math.max(1.4, 3.5 * (1 - progress));
      ctx.beginPath();
      ctx.moveTo(-radius * 0.52, -radius * 0.34);
      ctx.lineTo(radius * 0.58, radius * 0.34);
      ctx.moveTo(-radius * 0.36, radius * 0.32);
      ctx.lineTo(radius * 0.42, -radius * 0.32);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "recoilArc") {
      const progress = 1 - p.life / (p.maxLife ?? 12);
      const length = p.size * (1 - progress * 0.3);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";
      ctx.strokeStyle = colorWithAlpha(p.color, 0.26 * alpha);
      ctx.lineWidth = 13 * (1 - progress * 0.42);
      ctx.beginPath();
      ctx.moveTo(-length * 0.46, 0);
      ctx.quadraticCurveTo(0, -length * 0.26, length * 0.56, -length * 0.04);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.32 * alpha})`;
      ctx.lineWidth = Math.max(1.4, 4.8 * (1 - progress));
      ctx.beginPath();
      ctx.moveTo(-length * 0.32, -2);
      ctx.quadraticCurveTo(0, -length * 0.18, length * 0.42, -length * 0.02);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "hitShard") {
      const progress = 1 - p.life / (p.maxLife ?? 16);
      const length = p.size * (2.8 - progress * 1.2);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = colorWithAlpha(p.color, 0.52 * alpha);
      ctx.beginPath();
      ctx.moveTo(length * 0.7, 0);
      ctx.lineTo(-length * 0.35, -p.size * 0.32);
      ctx.lineTo(-length * 0.12, p.size * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.42 * alpha})`;
      ctx.lineWidth = Math.max(1, p.size * 0.12);
      ctx.beginPath();
      ctx.moveTo(-length * 0.18, 0);
      ctx.lineTo(length * 0.62, 0);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "impactNeedle") {
      const progress = 1 - p.life / (p.maxLife ?? 14);
      const length = p.length * (1 - progress * 0.32);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";
      ctx.strokeStyle = colorWithAlpha(p.color, 0.24 * alpha);
      ctx.lineWidth = p.size * 3.1;
      ctx.beginPath();
      ctx.moveTo(-length * 0.18, 0);
      ctx.lineTo(length * 0.82, 0);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.58 * alpha})`;
      ctx.lineWidth = Math.max(1.1, p.size * 0.48);
      ctx.beginPath();
      ctx.moveTo(-length * 0.06, 0);
      ctx.lineTo(length, 0);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "airRipple") {
      const progress = 1 - p.life / (p.maxLife ?? 14);
      const radius = p.size + progress * (p.growth ?? 2) * 24;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = colorWithAlpha(p.color, 0.28 * alpha);
      ctx.lineWidth = Math.max(1.2, 4.5 * (1 - progress));
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.32, radius * 0.34, 0, 0.18, Math.PI * 1.82);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * alpha})`;
      ctx.lineWidth = Math.max(0.8, 2.2 * (1 - progress));
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.92, radius * 0.22, 0, -0.1, Math.PI * 1.55);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "guardPlate") {
      const progress = 1 - p.life / (p.maxLife ?? 15);
      const size = p.size * (1 + progress * 0.34);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      const shield = ctx.createLinearGradient(-size, -size, size, size);
      shield.addColorStop(0, "rgba(255,255,255,0)");
      shield.addColorStop(0.44, colorWithAlpha(p.color, 0.28 * alpha));
      shield.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shield;
      ctx.beginPath();
      ctx.moveTo(-size * 0.58, -size * 0.78);
      ctx.lineTo(size * 0.2, -size * 0.5);
      ctx.lineTo(size * 0.56, 0);
      ctx.lineTo(size * 0.2, size * 0.5);
      ctx.lineTo(-size * 0.58, size * 0.78);
      ctx.lineTo(-size * 0.38, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(236, 251, 255, ${0.58 * alpha})`;
      ctx.lineWidth = Math.max(1.2, 3.8 * (1 - progress));
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "floorShock") {
      const progress = 1 - p.life / (p.maxLife ?? 18);
      const width = p.size + progress * (p.growth ?? 2) * 38;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = colorWithAlpha(p.color, 0.32 * alpha);
      ctx.lineWidth = Math.max(1.4, 5.5 * (1 - progress));
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 1.05, 8 + progress * 7, 0, Math.PI * 0.05, Math.PI * 0.95);
      ctx.stroke();
      ctx.fillStyle = colorWithAlpha(p.color, 0.08 * alpha);
      ctx.beginPath();
      ctx.ellipse(0, -2, width * 0.86, 5 + progress * 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === "dustRibbon") {
      const progress = 1 - p.life / (p.maxLife ?? 24);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.fillStyle = colorWithAlpha(p.color, 0.72 * alpha);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * (1.2 + progress * 1.6), p.size * (0.24 + progress * 0.18), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === "impactBloom") {
      const progress = 1 - p.life / (p.maxLife ?? 8);
      const radius = p.size * (1 + progress * 0.92);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      const bloom = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
      bloom.addColorStop(0, `rgba(255,255,255,${0.32 * alpha})`);
      bloom.addColorStop(0.26, colorWithAlpha(p.color, 0.23 * alpha));
      bloom.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.38, radius * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === "ring") {
      const progress = 1 - p.life / (p.maxLife ?? 20);
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 5 * (1 - progress);
      ctx.globalAlpha = alpha * 0.75;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size + progress * (p.growth ?? 2) * 18, (p.size * 0.48) + progress * 11, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "spark") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.vx ?? 0) * 0.6);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(-p.size * 1.7, -p.size * 0.45, p.size * 3.4, p.size * 0.9, p.size * 0.45);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === "glint") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(roundFrame * 0.08 + p.size);
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.2, p.size * 0.22);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.moveTo(0, -p.size);
      ctx.lineTo(0, p.size);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "droplet") {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "rgba(235, 252, 255, 0.72)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 0.72, p.size * 1.18, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "dust") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 1.45, p.size * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawKOBanner() {
  if (!winner || matchOver) return;
  if (overlay.dataset.screen === "winner" && !overlay.classList.contains("hidden")) return;
  const alpha = overlay.classList.contains("hidden") ? 0.26 : 0.12;
  const x = W / 2 - 60;
  const y = 82;
  const banner = ctx.createLinearGradient(x, y, x + 120, y + 34);
  banner.addColorStop(0, `rgba(30, 8, 7, ${alpha})`);
  banner.addColorStop(0.48, `rgba(126, 33, 21, ${alpha})`);
  banner.addColorStop(1, `rgba(30, 8, 7, ${alpha})`);
  ctx.fillStyle = banner;
  ctx.beginPath();
  ctx.roundRect(x, y, 120, 34, 8);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 226, 132, ${0.28 + alpha * 0.14})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 241, 189, ${0.72 + alpha * 0.12})`;
  ctx.font = "850 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(43, 20, 16, ${0.5 + alpha * 0.12})`;
  ctx.strokeText("K.O.", W / 2, y + 14);
  ctx.fillText("K.O.", W / 2, y + 14);

  ctx.font = "800 8px system-ui, sans-serif";
  ctx.fillStyle = `rgba(255, 226, 132, ${0.54 + alpha * 0.1})`;
  ctx.fillText(`${winner.toUpperCase()} GANA`, W / 2, y + 27);
  ctx.textBaseline = "alphabetic";
}

function showWinner() {
  flash = 0;
  shake = 0;
  overlayMode = "winner";
  overlay.dataset.screen = "winner";
  overlay.dataset.mode = tournamentActive ? "tournament" : "match";
  if (matchOver && tournamentActive) {
    const playerWon = matchWinnerId === "right";
    const hasNext = playerWon && tournamentIndex < tournamentOpponents.length - 1;
    overlay.querySelector("h1").textContent = playerWon && !hasNext ? `${winner} campeón` : playerWon ? `${winner} avanza` : "Torneo perdido";
    overlayCopy.textContent = playerWon
      ? hasNext
        ? `Rival ${tournamentIndex + 1}/${tournamentOpponents.length} superado. Próximo combate en el Dojo Tendo.`
        : `Ganaste la escalera completa del Dojo Tendo. ${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}.`
      : `${winner} ganó el match. Volvé al selector para reintentar el torneo.`;
    startButton.textContent = hasNext ? "SIGUIENTE RIVAL" : "VOLVER";
  } else {
    overlay.querySelector("h1").textContent = matchOver ? `${winner} gana` : `${winner} gana round ${roundNumber}`;
    overlayCopy.textContent = matchOver
      ? `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Revancha disponible.`
      : `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Prepará el siguiente round.`;
    startButton.textContent = matchOver ? "REVANCHA" : "SIGUIENTE ROUND";
  }
  fighterSelect.classList.add("hidden");
  overlay.classList.remove("hidden");
}

function loop(timestamp = 0) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const elapsed = Math.min(100, timestamp - lastFrameTime);
  lastFrameTime = timestamp;
  updateAccumulator += elapsed;

  let steps = 0;
  while (updateAccumulator >= STEP_MS && steps < MAX_UPDATE_STEPS) {
    update();
    updateAccumulator -= STEP_MS;
    steps += 1;
  }
  if (steps === MAX_UPDATE_STEPS) updateAccumulator = 0;

  draw();
  requestAnimationFrame(loop);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectOverlap(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function darken(hex, amount = 42) {
  const key = `${hex}|${amount}`;
  if (darkenCache.has(key)) return darkenCache.get(key);
  const [baseR, baseG, baseB] = colorParts(hex);
  const r = Math.max(0, baseR - amount);
  const g = Math.max(0, baseG - amount);
  const b = Math.max(0, baseB - amount);
  const value = `rgb(${r}, ${g}, ${b})`;
  darkenCache.set(key, value);
  return value;
}

function lighten(hex, amount = 28) {
  const key = `${hex}|${amount}`;
  if (lightenCache.has(key)) return lightenCache.get(key);
  const [baseR, baseG, baseB] = colorParts(hex);
  const r = Math.min(255, baseR + amount);
  const g = Math.min(255, baseG + amount);
  const b = Math.min(255, baseB + amount);
  const value = `rgb(${r}, ${g}, ${b})`;
  lightenCache.set(key, value);
  return value;
}

function colorWithAlpha(color, alpha) {
  const key = `${color}|${alpha}`;
  if (alphaColorCache.has(key)) return alphaColorCache.get(key);
  const [r, g, b] = colorParts(color);
  const value = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  alphaColorCache.set(key, value);
  return value;
}

function colorParts(color) {
  if (colorPartsCache.has(color)) return colorPartsCache.get(color);
  let value = [128, 128, 128];
  if (color.startsWith("#")) {
    const n = Number.parseInt(color.slice(1), 16);
    value = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  } else {
    const parts = color.match(/\d+/g);
    if (parts && parts.length >= 3) value = parts.slice(0, 3).map(Number);
  }
  colorPartsCache.set(color, value);
  return value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setCpuMode(enabled) {
  cpuEnabled = enabled;
  modeButton.textContent = cpuEnabled ? "CPU" : "2P";
  modeButton.setAttribute("aria-pressed", String(cpuEnabled));
  updateFighterLabels();
  if (overlayMode === "home") overlayCopy.textContent = homeOverlayCopy();
  if (!fighterSelect.classList.contains("hidden")) renderFighterSelect();
}

function setTournamentMode(enabled) {
  tournamentMode = enabled;
  if (tournamentMode) setCpuMode(true);
  tournamentButton.textContent = tournamentMode ? "Torneo ON" : "Torneo";
  tournamentButton.setAttribute("aria-pressed", String(tournamentMode));
  tournamentMenuButton.textContent = tournamentMode ? "TORNEO ON" : "TORNEO OFF";
  tournamentMenuButton.setAttribute("aria-pressed", String(tournamentMode));
  if (!running || overlayMode === "home") showHomeOverlay();
}

function setDifficulty(nextIndex) {
  cpuDifficulty = nextIndex;
  difficultyButton.textContent = difficultyLevels[cpuDifficulty].name;
}

function setSelectedFighter(side, nextId) {
  ensureAudio();
  if (side === "left") selectedLeftId = nextId;
  else selectedRightId = nextId;
  fighters = buildFighters();
  updateFighterLabels();
  renderFighterSelect();
  playSound("select");
}

function renderFighterSelect() {
  fighterSelect.innerHTML = "";
  fighterSelect.classList.remove("versus-panel");
  fighterSelect.append(makeSelectColumn("left", "Izquierda", selectedLeftId));

  const versus = document.createElement("div");
  versus.className = "fighter-select-versus";
  versus.textContent = "VS";
  fighterSelect.append(versus);

  fighterSelect.append(makeSelectColumn("right", "Derecha", selectedRightId));
}

function renderVersusPanel(roundLabel) {
  fighterSelect.innerHTML = "";
  fighterSelect.classList.add("versus-panel");
  fighterSelect.append(makeVersusCard(fighters[0], "Rival"));

  const center = document.createElement("div");
  center.className = "versus-panel-center";
  const label = document.createElement("span");
  label.textContent = roundLabel;
  center.append(label);
  const mark = document.createElement("strong");
  mark.textContent = "VS";
  center.append(mark);
  fighterSelect.append(center);

  fighterSelect.append(makeVersusCard(fighters[1], "Jugador"));
}

function makeVersusCard(fighter, role) {
  const card = document.createElement("section");
  card.className = "versus-card";
  card.style.setProperty("--fighter-color", fighter.color);
  card.style.setProperty("--fighter-trim", fighter.trim);

  const image = document.createElement("img");
  image.src = fighter.face.src;
  image.alt = fighter.name;
  card.append(image);

  const name = document.createElement("strong");
  name.textContent = fighter.name;
  card.append(name);

  const caption = document.createElement("span");
  caption.textContent = role;
  card.append(caption);
  return card;
}

function makeSelectColumn(side, title, selectedId) {
  const column = document.createElement("section");
  column.className = "fighter-select-column";
  column.dataset.side = side;
  column.style.setProperty("--fighter-color", fighterProfiles[selectedId].color);
  column.style.setProperty("--fighter-trim", fighterProfiles[selectedId].trim);
  column.style.setProperty("--fighter-accent", fighterProfiles[selectedId].outfit.accent);

  const heading = document.createElement("h2");
  heading.textContent = side === "left" && cpuEnabled ? `${title} / CPU` : title;
  column.append(heading);

  const selectedProfile = fighterProfiles[selectedId];
  const showcase = document.createElement("div");
  showcase.className = "fighter-showcase";

  const portraitWrap = document.createElement("div");
  portraitWrap.className = "fighter-showcase-portrait";
  const portrait = document.createElement("img");
  portrait.src = selectedProfile.face.src;
  portrait.alt = selectedProfile.name;
  portraitWrap.append(portrait);

  const badge = document.createElement("div");
  badge.className = "fighter-showcase-mark";
  badge.textContent = selectedProfile.mark;
  portraitWrap.append(badge);
  showcase.append(portraitWrap);

  const info = document.createElement("div");
  info.className = "fighter-showcase-info";
  const name = document.createElement("strong");
  name.textContent = selectedProfile.name;
  info.append(name);
  const role = document.createElement("span");
  role.textContent = side === "left" && cpuEnabled ? "CPU" : side === "left" ? "Jugador 1" : "Jugador 2";
  info.append(role);
  info.append(makeMenuStats(selectedProfile));
  showcase.append(info);
  column.append(showcase);

  const grid = document.createElement("div");
  grid.className = "fighter-choice-grid";
  for (const id of fighterIds) {
    const profile = fighterProfiles[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fighter-choice";
    button.dataset.side = side;
    button.dataset.fighter = id;
    button.setAttribute("aria-pressed", String(id === selectedId));
    button.addEventListener("click", () => setSelectedFighter(side, id));

    const image = document.createElement("img");
    image.src = profile.face.src;
    image.alt = profile.name;
    button.append(image);

    const label = document.createElement("span");
    label.textContent = profile.name;
    button.append(label);

    grid.append(button);
  }
  column.append(grid);
  return column;
}

function makeMenuStats(profile) {
  const stats = {
    athletic: [78, 88, 74],
    balanced: [80, 76, 82],
    heavy: [92, 62, 88],
    lean: [68, 92, 72],
  }[profile.build] ?? [75, 75, 75];
  const labels = ["FUE", "VEL", "ENE"];
  const list = document.createElement("div");
  list.className = "fighter-showcase-stats";
  for (let i = 0; i < stats.length; i += 1) {
    const row = document.createElement("div");
    row.className = "fighter-showcase-stat";
    const label = document.createElement("span");
    label.textContent = labels[i];
    const meter = document.createElement("i");
    meter.style.setProperty("--stat", `${stats[i]}%`);
    row.append(label, meter);
    list.append(row);
  }
  return list;
}

function toRoman(value) {
  return ["0", "I", "II", "III", "IV", "V"][value] ?? String(value);
}

function updateFighterLabels() {
  fighterButton.textContent = "Personajes";
  document.querySelector(".fighter-label.left").textContent = cpuEnabled
    ? `${fighters[0].name} CPU`
    : fighters[0].name;
  document.querySelector(".fighter-label.right").textContent = fighters[1].name;
}

function setSound(enabled) {
  soundEnabled = enabled;
  soundButton.textContent = soundEnabled ? "Sonido" : "Mudo";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
}

function advanceOverlay() {
  ensureAudio();
  if (overlayMode === "home") {
    paused = false;
    playSound("menu");
    if (tournamentMode) startTournament();
    else {
      tournamentActive = false;
      showVersusOverlay("match");
    }
    return;
  }
  if (overlayMode === "versus") {
    beginVersusFight();
    return;
  }
  if (paused) {
    resumeGame();
    return;
  }
  if (winner && !matchOver) {
    roundNumber += 1;
    showVersusOverlay("round");
    return;
  }
  if (matchOver && tournamentActive) {
    advanceTournament();
    return;
  }
  if (overlayMode === "help") {
    showHomeOverlay();
    return;
  }
  if (overlayMode === "online") {
    onlineButton.setAttribute("aria-pressed", "false");
    showHomeOverlay();
    return;
  }
  resetGame();
}

function togglePause() {
  if (!running || winner) return;
  paused = !paused;
  if (paused) showPauseOverlay();
  else resumeGame();
}

function showHelpOverlay() {
  overlayMode = "help";
  overlay.dataset.screen = "help";
  paused = running && !winner;
  overlay.querySelector("h1").textContent = "Controles";
  overlayCopy.textContent =
    `${fighters[1].name}: botones tactiles o flechas mover/saltar/bloquear, K golpe, L patada, O especial, P agarre, abajo+L barrida. ${fighters[0].name}: A/D, W, S, F, G, R y T. Esc pausa.`;
  startButton.textContent = paused ? "SEGUIR" : "LISTO";
  fighterSelect.classList.add("hidden");
  overlay.classList.remove("hidden");
}

function showOnlineOverlay() {
  overlayMode = "online";
  overlay.dataset.screen = "online";
  paused = running && !winner;
  overlay.querySelector("h1").textContent = "Online";
  overlayCopy.textContent =
    "Mini Kombat III ya tiene el acceso preparado para salas online. Para activarlo falta pegar la configuracion gratis de Firebase del proyecto.";
  fighterSelect.innerHTML = "";
  fighterSelect.classList.remove("hidden", "versus-panel");
  const status = document.createElement("div");
  status.className = "online-status";
  status.textContent = "Proximo paso: crear Firebase Realtime Database, pegar firebaseConfig y habilitar Crear sala / Unirse con codigo.";
  fighterSelect.append(status);
  startButton.textContent = paused ? "SEGUIR" : "VOLVER";
  overlay.classList.remove("hidden");
  onlineButton.setAttribute("aria-pressed", "true");
  onlineMenuButton.setAttribute("aria-pressed", "true");
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)) event.preventDefault();
  if (key === "escape") {
    event.preventDefault();
    togglePause();
    return;
  }
  keys.add(key);
  if (running && koFreeze <= 0 && countdownFrames <= 0) handleActionKey(key);
  if ((key === "enter" || key === " ") && (!running || paused)) advanceOverlay();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

startButton.addEventListener("click", advanceOverlay);
restartButton.addEventListener("click", resetGame);
modeButton.addEventListener("click", () => {
  ensureAudio();
  if (tournamentMode) setTournamentMode(false);
  setCpuMode(!cpuEnabled);
  playSound("menu");
});
tournamentButton.addEventListener("click", () => {
  ensureAudio();
  setTournamentMode(!tournamentMode);
  playSound("menu");
});
tournamentMenuButton.addEventListener("click", () => {
  ensureAudio();
  setTournamentMode(!tournamentMode);
  playSound("menu");
});
fighterButton.addEventListener("click", () => {
  ensureAudio();
  if (running && !winner) paused = true;
  playSound("menu");
  showHomeOverlay();
});
difficultyButton.addEventListener("click", () => {
  ensureAudio();
  setDifficulty((cpuDifficulty + 1) % difficultyLevels.length);
  playSound("menu");
});
soundButton.addEventListener("click", () => {
  ensureAudio();
  setSound(!soundEnabled);
  playSound("menu");
});
helpButton.addEventListener("click", () => {
  ensureAudio();
  playSound("menu");
  showHelpOverlay();
});
onlineButton.addEventListener("click", () => {
  ensureAudio();
  playSound("menu");
  showOnlineOverlay();
});
onlineMenuButton.addEventListener("click", () => {
  ensureAudio();
  playSound("menu");
  showOnlineOverlay();
});
updateFighterLabels();

function handleActionKey(key) {
  for (const f of fighters) {
    if (cpuEnabled && f.id === cpuFighterId) continue;
    const c = f.controls;
    if (key === c.special || (key === c.punch && keys.has(c.block))) startSpecial(f);
    else if (key === c.grab) startAttack(f, "grab");
    else if (key === c.kick && keys.has(c.block)) startAttack(f, "sweep");
    else if (key === c.punch) startAttack(f, f.grounded ? "punch" : "airPunch");
    else if (key === c.kick) startAttack(f, f.grounded ? "kick" : "airKick");
  }
}

function setTouchControl(button, pressed) {
  const action = button.dataset.touch;
  if (!action || !(action in touchInput)) return;
  button.classList.toggle("is-pressed", pressed);
  if (pressed) {
    button.classList.remove("is-tapped");
    void button.offsetWidth;
    button.classList.add("is-tapped");
  }
  touchInput[action] = pressed;
  if (!pressed || !running || koFreeze > 0 || countdownFrames > 0) return;
  const player = fighters.find((f) => f.id === "right");
  if (!player) return;
  if (action === "special" || (action === "punch" && touchInput.block)) startSpecial(player);
  else if (action === "grab") startAttack(player, "grab");
  else if (action === "kick" && touchInput.block) startAttack(player, "sweep");
  else if (action === "punch") startAttack(player, player.grounded ? "punch" : "airPunch");
  else if (action === "kick") startAttack(player, player.grounded ? "kick" : "airKick");
}

function setStickState(x = 0, y = 0) {
  const deadZone = 0.26;
  touchInput.left = x < -deadZone;
  touchInput.right = x > deadZone;
  touchInput.jump = y < -0.42;
  touchInput.block = y > 0.42;
  if (mobileStickKnob) {
    mobileStickKnob.style.transform = `translate(calc(-50% + ${Math.round(x * 34)}px), calc(-50% + ${Math.round(y * 34)}px))`;
  }
}

function updateStickFromEvent(event) {
  if (!mobileStickBase) return;
  const rect = mobileStickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * 0.34;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > radius ? radius / distance : 1;
  setStickState((dx * scale) / radius, (dy * scale) / radius);
}

if (mobileStick) {
  mobileStick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureAudio();
    stickPointerId = event.pointerId;
    mobileStick.classList.add("is-active");
    mobileStick.setPointerCapture(event.pointerId);
    updateStickFromEvent(event);
  });
  mobileStick.addEventListener("pointermove", (event) => {
    if (event.pointerId !== stickPointerId) return;
    event.preventDefault();
    updateStickFromEvent(event);
  });
  const releaseStick = (event) => {
    if (event.pointerId !== stickPointerId) return;
    event.preventDefault();
    stickPointerId = null;
    mobileStick.classList.remove("is-active");
    setStickState();
  };
  mobileStick.addEventListener("pointerup", releaseStick);
  mobileStick.addEventListener("pointercancel", releaseStick);
  mobileStick.addEventListener("lostpointercapture", () => {
    stickPointerId = null;
    mobileStick.classList.remove("is-active");
    setStickState();
  });
}

document.querySelectorAll("[data-touch]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureAudio();
    button.setPointerCapture(event.pointerId);
    setTouchControl(button, true);
  });
  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    setTouchControl(button, false);
  });
  button.addEventListener("pointercancel", () => setTouchControl(button, false));
  button.addEventListener("lostpointercapture", () => setTouchControl(button, false));
  button.addEventListener("animationend", () => button.classList.remove("is-tapped"));
});

function preventZoomGesture(event) {
  if (event.cancelable) event.preventDefault();
}

["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
  document.addEventListener(eventName, preventZoomGesture, { passive: false });
});

document.addEventListener("dblclick", (event) => {
  if (event.target.closest("#mobile-controls")) event.preventDefault();
}, { passive: false });

if (mobileControls) {
  mobileControls.addEventListener("touchstart", preventZoomGesture, { passive: false });
  mobileControls.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastControlTap < 450 && event.cancelable) event.preventDefault();
    lastControlTap = now;
  }, { passive: false });
}

setCpuMode(cpuEnabled);
setTournamentMode(tournamentMode);
setDifficulty(cpuDifficulty);
setSound(soundEnabled);
showHomeOverlay();
requestAnimationFrame(loop);
