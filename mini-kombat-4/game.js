const canvas = document.querySelector("#game");
let ctx = canvas.getContext("2d");
const gameShell = document.querySelector(".game-shell");
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
const mobilePauseButton = document.querySelector("#mobile-pause");
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
const MOBILE_MAX_PARTICLES = 155;
const GUARD_IMPACT_FRAMES = 18;
const COUNTER_WINDOW_FRAMES = 42;
const ONLINE_SYNC_EVERY = 3;
const ONLINE_PING_EVERY_MS = 2400;
const ROUND_TIME_SECONDS = 99;
const ROUND_TIMER_FRAMES = ROUND_TIME_SECONDS * 60;
const ONLINE_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
const PEERJS_CDN_URLS = [
  "https://unpkg.com/peerjs@1/dist/peerjs.min.js",
  "https://cdn.jsdelivr.net/npm/peerjs@1/dist/peerjs.min.js",
];
const faces = {
  p1: loadImage("assets/fighter-1-face.png"),
  p2: loadImage("assets/fighter-2-face.png"),
  p3: loadImage("assets/fighter-3-face.png"),
  p4: loadImage("assets/fighter-4-face.png"),
  p5: loadImage("assets/fighter-5-face.png"),
  p6: loadImage("assets/fighter-6-face.png"),
};
const bodySpriteSheets = {
  p1: loadImage("assets/sprite-pchan-body.svg?v=74"),
  p2: loadImage("assets/sprite-akane-body.svg?v=74"),
};
const unifiedSpriteSheets = {
  p1: loadImage("assets/sprite-pchan-unified.svg?v=77"),
  p2: loadImage("assets/sprite-akane-unified.svg?v=77"),
};
function usesUnifiedSprite(f) {
  return f?.profileId === "p1" || f?.profileId === "p2";
}
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
let attractFrame = 0;
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
let roundTimerFrames = ROUND_TIMER_FRAMES;
let roundFinishKind = "ko";
let musicClock = 0;
let attractMusicClock = 0;
let attractMusicLastScreen = "";
let musicDirector = {
  round: 0,
  matchPoint: false,
  duel: false,
  closeCall: false,
  comboPeak: 0,
  critical: Object.create(null),
};
let finalPressurePulse = 0;
let finalPressureSecondCue = 0;
let momentumHud = {
  leader: null,
  pulse: 0,
  lastScore: 0,
  lastCueFrame: -999,
};
let particles = [];
let floatingTexts = [];
let announcerCue = null;
let audioCtx = null;
let audioMasterGain = null;
let audioFxGain = null;
let audioMusicGain = null;
let audioNoiseCache = new Map();
let audioLastPlayed = Object.create(null);
const AUDIO_FX_BASE_VOLUME = 1;
const AUDIO_MUSIC_BASE_VOLUME = 0.84;
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
let homeIntroTimer = null;
const onlineState = {
  role: "",
  localSide: "",
  remoteSide: "",
  pc: null,
  peer: null,
  channel: null,
  connected: false,
  status: "Sin conexion online.",
  offerCode: "",
  answerCode: "",
  inviteLink: "",
  inviteReady: false,
  roomId: "",
  manualVisible: false,
  signaling: "",
  localReady: false,
  remoteReady: false,
  lastPingAt: 0,
  latencyMs: 0,
  lastInputPayload: "",
  lastSnapshotFrame: -1,
  snapshotTick: 0,
  remoteInput: null,
};

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
let cinematicHitZoom = 0.022;
let cinematicHitPan = 6.4;
let cinematicHitLift = 2.6;
let cinematicHitRoll = 0;
let cinematicHitBand = 1;
let screenTearPulse = 0;
let screenTearMax = 1;
let screenTearDir = 1;
let screenTearColor = "#fff1bd";
let screenTearStrength = 0;
let finishFreezeCue = null;

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
  punch: [4, 17, 5, 18, 23, 6],
  kick: [19, 7, 8, 20, 24, 9],
  block: [10],
  hurt: [25, 26, 27, 11, 12, 28],
  special: [13],
  victory: [14],
  defeat: [15],
  sweep: [16],
};

const ATTACK_TIMINGS = {
  punch: { activeStart: 7, activeEnd: 12, duration: 25, cooldown: 14, entry: 10, recover: 10 },
  airPunch: { activeStart: 7, activeEnd: 12, duration: 25, cooldown: 14, entry: 10, recover: 10 },
  kick: { activeStart: 12, activeEnd: 19, duration: 34, cooldown: 24, entry: 12, recover: 13 },
  airKick: { activeStart: 11, activeEnd: 18, duration: 32, cooldown: 24, entry: 12, recover: 13 },
  sweep: { activeStart: 10, activeEnd: 17, duration: 32, cooldown: 25, entry: 12, recover: 13 },
  grab: { activeStart: 8, activeEnd: 14, duration: 26, cooldown: 28, entry: 11, recover: 12 },
  special: { activeStart: 14, activeEnd: 21, duration: 34, cooldown: 30, entry: 16, recover: 18 },
};

function attackTiming(type) {
  return ATTACK_TIMINGS[type] ?? ATTACK_TIMINGS.punch;
}

const CHARACTER_MOTION = {
  default: {
    force: 1,
    load: 1,
    drive: 1,
    recover: 1,
    plant: 1,
    brace: 1,
    lift: 1,
    crush: 1,
    reach: 1,
    rotation: 1,
    stretchX: 1,
    stretchY: 1,
    afterimage: 0.62,
    arcFan: 1,
    headDrive: 1,
    headPrep: 1,
    headRecover: 1,
    headSway: 1,
    walkWeight: 1,
    walkLift: 1,
    walkPush: 1,
    accessory: 1,
    impactSnap: 1,
    impactRebound: 1,
    impactShake: 1,
    impactFloor: 1,
    impactSkid: 1,
    impactTime: 1,
    hurtRecover: 1,
    damageFx: 1,
  },
  p1: {
    force: 1.14,
    load: 1.14,
    drive: 1.12,
    recover: 0.86,
    plant: 1.24,
    brace: 1.18,
    lift: 0.72,
    crush: 1.22,
    reach: 1.08,
    rotation: 0.82,
    stretchX: 1.08,
    stretchY: 0.9,
    afterimage: 0.18,
    arcFan: 0.86,
    headDrive: 0.78,
    headPrep: 0.82,
    headRecover: 0.82,
    headSway: 0.72,
    walkWeight: 1.1,
    walkLift: 0.72,
    walkPush: 1.22,
    accessory: 0.95,
    impactSnap: 0.78,
    impactRebound: 0.7,
    impactShake: 0.74,
    impactFloor: 1.28,
    impactSkid: 0.72,
    impactTime: 0.9,
    hurtRecover: 0.78,
    damageFx: 0.88,
  },
  p2: {
    force: 0.94,
    load: 0.9,
    drive: 0.96,
    recover: 1.18,
    plant: 0.78,
    brace: 0.82,
    lift: 1.24,
    crush: 0.74,
    reach: 1.14,
    rotation: 1.25,
    stretchX: 1.16,
    stretchY: 1.08,
    afterimage: 0.2,
    arcFan: 1.24,
    headDrive: 1.22,
    headPrep: 1.18,
    headRecover: 1.16,
    headSway: 1.34,
    walkWeight: 0.9,
    walkLift: 1.28,
    walkPush: 0.88,
    accessory: 1.34,
    impactSnap: 1.18,
    impactRebound: 1.28,
    impactShake: 1.16,
    impactFloor: 0.76,
    impactSkid: 1.24,
    impactTime: 1.12,
    hurtRecover: 1.18,
    damageFx: 1.16,
  },
  p3: {
    force: 1.18,
    load: 1.26,
    drive: 0.94,
    recover: 0.78,
    plant: 1.34,
    brace: 1.28,
    lift: 0.58,
    crush: 1.34,
    reach: 1.02,
    rotation: 0.72,
    stretchX: 0.96,
    stretchY: 0.84,
    afterimage: 0.14,
    arcFan: 0.82,
    headDrive: 0.68,
    headPrep: 0.76,
    headRecover: 0.74,
    headSway: 0.6,
    walkWeight: 1.24,
    walkLift: 0.62,
    walkPush: 1.16,
    accessory: 0.72,
    impactSnap: 0.72,
    impactRebound: 0.64,
    impactShake: 0.66,
    impactFloor: 1.48,
    impactSkid: 0.58,
    impactTime: 0.82,
    hurtRecover: 0.7,
    damageFx: 0.92,
  },
  p4: {
    force: 0.92,
    load: 0.84,
    drive: 1.18,
    recover: 1.2,
    plant: 0.78,
    brace: 0.82,
    lift: 1.16,
    crush: 0.76,
    reach: 1.08,
    rotation: 1.22,
    stretchX: 1.12,
    stretchY: 1.06,
    afterimage: 0.18,
    arcFan: 1.2,
    headDrive: 1.14,
    headPrep: 1.12,
    headRecover: 1.18,
    headSway: 1.2,
    walkWeight: 0.84,
    walkLift: 1.2,
    walkPush: 0.94,
    accessory: 1.08,
    impactSnap: 1.08,
    impactRebound: 1.12,
    impactShake: 1.04,
    impactFloor: 0.82,
    impactSkid: 1.16,
    impactTime: 1.08,
    hurtRecover: 1.14,
    damageFx: 1.04,
  },
  p5: {
    force: 0.88,
    load: 0.82,
    drive: 1.08,
    recover: 1.22,
    plant: 0.72,
    brace: 0.78,
    lift: 1.18,
    crush: 0.7,
    reach: 1.22,
    rotation: 1.28,
    stretchX: 1.2,
    stretchY: 1.12,
    afterimage: 0.22,
    arcFan: 1.3,
    headDrive: 1.16,
    headPrep: 1.12,
    headRecover: 1.22,
    headSway: 1.34,
    walkWeight: 0.76,
    walkLift: 1.34,
    walkPush: 0.82,
    accessory: 1.16,
    impactSnap: 1.14,
    impactRebound: 1.2,
    impactShake: 1.08,
    impactFloor: 0.72,
    impactSkid: 1.28,
    impactTime: 1.14,
    hurtRecover: 1.2,
    damageFx: 1.08,
  },
  p6: {
    force: 0.98,
    load: 1.02,
    drive: 0.96,
    recover: 1.08,
    plant: 1.02,
    brace: 1.12,
    lift: 0.96,
    crush: 0.98,
    reach: 1.04,
    rotation: 0.98,
    stretchX: 1.04,
    stretchY: 0.98,
    afterimage: 0.16,
    arcFan: 0.98,
    headDrive: 0.98,
    headPrep: 1.02,
    headRecover: 1.05,
    headSway: 0.96,
    walkWeight: 1.04,
    walkLift: 0.9,
    walkPush: 1.02,
    accessory: 1.08,
    impactSnap: 0.92,
    impactRebound: 0.9,
    impactShake: 0.88,
    impactFloor: 1.12,
    impactSkid: 0.84,
    impactTime: 0.94,
    hurtRecover: 0.95,
    damageFx: 0.96,
  },
};

function characterMotion(f) {
  return CHARACTER_MOTION[f?.profileId] ?? CHARACTER_MOTION.default;
}

const CHARACTER_GUARD = {
  default: {
    brace: 1,
    recoil: 1,
    crouch: 1,
    shieldScale: 1,
    shieldWidth: 1,
    shieldAlpha: 1,
    spark: 1,
    arc: 1,
    handLift: 1,
    counter: 1,
    color: "#bdeaff",
  },
  p1: {
    brace: 1.22,
    recoil: 0.72,
    crouch: 1.18,
    shieldScale: 1.12,
    shieldWidth: 1.18,
    shieldAlpha: 0.92,
    spark: 0.78,
    arc: 1.16,
    handLift: 0.88,
    counter: 0.94,
    color: "#9cd9ff",
  },
  p2: {
    brace: 0.82,
    recoil: 1.18,
    crouch: 0.78,
    shieldScale: 0.92,
    shieldWidth: 0.86,
    shieldAlpha: 1.18,
    spark: 1.26,
    arc: 0.82,
    handLift: 1.22,
    counter: 1.18,
    color: "#aef7df",
  },
  p3: {
    brace: 1.34,
    recoil: 0.62,
    crouch: 1.28,
    shieldScale: 1.18,
    shieldWidth: 1.22,
    shieldAlpha: 0.95,
    spark: 0.82,
    arc: 1.18,
    handLift: 0.84,
    counter: 0.9,
    color: "#d9f7ff",
  },
  p4: {
    brace: 0.8,
    recoil: 1.08,
    crouch: 0.82,
    shieldScale: 0.9,
    shieldWidth: 0.82,
    shieldAlpha: 1.04,
    spark: 1.12,
    arc: 0.82,
    handLift: 1.12,
    counter: 1.16,
    color: "#c8ff9d",
  },
  p5: {
    brace: 0.76,
    recoil: 1.18,
    crouch: 0.74,
    shieldScale: 0.88,
    shieldWidth: 0.78,
    shieldAlpha: 1.08,
    spark: 1.16,
    arc: 0.78,
    handLift: 1.2,
    counter: 1.2,
    color: "#aeefff",
  },
  p6: {
    brace: 1.18,
    recoil: 0.82,
    crouch: 1.08,
    shieldScale: 1.05,
    shieldWidth: 1.08,
    shieldAlpha: 1,
    spark: 0.95,
    arc: 1.08,
    handLift: 0.95,
    counter: 1.02,
    color: "#ffd0e9",
  },
};

function characterGuard(f) {
  return CHARACTER_GUARD[f?.profileId] ?? CHARACTER_GUARD.default;
}

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
    limb: 1,
    armScale: 0.97,
    legScale: 1.04,
    upperArmWidth: 0.88,
    forearmWidth: 0.82,
    thighWidth: 0.96,
    calfWidth: 0.86,
    hand: 0.9,
    foot: 0.94,
    headW: 88,
    headH: 96,
    headScale: 0.87,
    headY: 22,
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
    shoulder: 56,
    chest: 58,
    waist: 41,
    hip: 49,
    limb: 1.12,
    armScale: 1.06,
    legScale: 1.08,
    upperArmWidth: 1.2,
    forearmWidth: 1.1,
    thighWidth: 1.18,
    calfWidth: 1.07,
    hand: 1.15,
    foot: 1.15,
    headW: 98,
    headH: 102,
    headScale: 0.84,
    headY: 21,
    neckW: 32,
    neckH: 22,
    shoulderSlope: 6,
    facePad: 6,
    stance: 1.18,
    belly: 1.16,
  },
  lean: {
    shoulder: 38,
    chest: 37,
    waist: 25,
    hip: 31,
    limb: 0.96,
    armScale: 1.04,
    legScale: 1.06,
    upperArmWidth: 0.82,
    forearmWidth: 0.76,
    thighWidth: 0.82,
    calfWidth: 0.76,
    hand: 0.88,
    foot: 0.92,
    headW: 88,
    headH: 94,
    headScale: 0.83,
    headY: 27,
    neckW: 22,
    neckH: 19,
    shoulderSlope: 9,
    facePad: 7,
    stance: 0.9,
  },
  tallLean: {
    shoulder: 32,
    chest: 31,
    waist: 21,
    hip: 27,
    limb: 1.16,
    armScale: 1.2,
    legScale: 1.42,
    upperArmWidth: 0.66,
    forearmWidth: 0.6,
    thighWidth: 0.66,
    calfWidth: 0.58,
    hand: 0.88,
    foot: 0.92,
    headW: 82,
    headH: 92,
    headScale: 0.74,
    headY: 31,
    neckW: 21,
    neckH: 21,
    shoulderSlope: 11,
    facePad: 6,
    stance: 0.72,
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
    name: "Simiolin",
    color: "#d9682d",
    trim: "#47d5ff",
    face: faces.p5,
    skin: "#e5aa8d",
    build: "tallLean",
    mark: "S",
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
      jacket: "#07080b",
      pants: "#050506",
      sleeve: "#0b0c10",
      belt: "#111217",
      shoe: "#050506",
      accent: "#343840",
      pattern: "wrap",
    },
  },
};

const FIGHTER_PRESENTATION = {
  p1: {
    discipline: "Presion de corto rango",
    signature: "Embestida del panuelito",
    temperament: "Aguanta castigo y devuelve pesado.",
    callout: "entra bajo, rompe guardia y no retrocede",
    archetype: "Bruiser",
    edge: "Gana si achica distancia",
    risk: "Sufre contra velocidad",
  },
  p2: {
    discipline: "Karate rapido",
    signature: "Contra limpia",
    temperament: "Precisa, veloz y dificil de encerrar.",
    callout: "marca distancia con velocidad y castiga errores",
    archetype: "Striker",
    edge: "Castiga ventanas cortas",
    risk: "No perdona trades pesados",
  },
  p3: {
    discipline: "Potencia de tribuna",
    signature: "Avalancha celeste",
    temperament: "Cuerpo grande, impacto seco y avance frontal.",
    callout: "ocupa el tatami y pega con peso de clasico",
    archetype: "Tanque",
    edge: "Domina choques frontales",
    risk: "Arranque mas lento",
  },
  p4: {
    discipline: "Reflejo elastico",
    signature: "Chispa cruzada",
    temperament: "Lee huecos, entra y sale con ritmo raro.",
    callout: "flota alrededor del golpe y responde al angulo",
    archetype: "Finta",
    edge: "Cambia ritmo rapido",
    risk: "Pierde si queda fijo",
  },
  p5: {
    discipline: "Alcance dominante",
    signature: "Paso largo",
    temperament: "El mas alto: controla linea y aire.",
    callout: "pelea desde lejos y convierte distancia en dano",
    archetype: "Zoner",
    edge: "Manda con alcance",
    risk: "Corto rango incomodo",
  },
  p6: {
    discipline: "Defensa oscura",
    signature: "Muro negro",
    temperament: "Solida, paciente y peligrosa en respuesta.",
    callout: "cierra la puerta y espera el contragolpe",
    archetype: "Guardia",
    edge: "Convierte defensa en dano",
    risk: "Necesita paciencia",
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

function roundStatState() {
  return {
    roundHits: 0,
    roundDamage: 0,
    roundDamageTaken: 0,
    roundBlocks: 0,
    roundCounters: 0,
    roundSpecials: 0,
    roundMaxCombo: 0,
  };
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
    specialReadyCue: true,
    specialReadyPulse: 0,
    grounded: true,
    blocking: false,
    crouch: 0,
    attack: null,
    cooldown: 0,
    hurt: 0,
    pigMorph: 0,
    specialCooldown: 0,
    counterWindow: 0,
    comboCount: 0,
    comboTimer: 0,
    comboDamage: 0,
    comboPulse: 0,
    comboTargetId: "",
    comboWindow: 0,
    ...roundStatState(),
    hitFlash: 0,
    impactPulse: 0,
    impactDir: dir,
    impactLift: 0,
    impactStrength: 0,
    impactFlavor: "light",
    dynamicLightPulse: 0,
    dynamicLightMax: 1,
    dynamicLightColor: "#fff1bd",
    dynamicLightZone: "torso",
    dynamicLightDir: dir,
    dynamicLightStrength: 0,
    contactFlash: 0,
    damagePulse: 0,
    damageLevel: 0,
    hitZone: "torso",
    hitZonePulse: 0,
    faceImpactPulse: 0,
    faceImpactMax: 1,
    faceImpactZone: "torso",
    faceImpactDir: dir,
    faceImpactStrength: 0,
    reactionPulse: 0,
    reactionMax: 1,
    reactionZone: "torso",
    reactionKind: "light",
    reactionDir: dir,
    reactionStrength: 0,
    koFall: 0,
    koFallDir: dir,
    koFallStrength: 0,
    victoryPulse: 0,
    guardPulse: 0,
    guardImpact: 0,
    guardEntryPulse: 0,
    guardExitPulse: 0,
    staggerPulse: 0,
    attackEntryPulse: 0,
    attackRecoverPulse: 0,
    attackChainPulse: 0,
    attackChainMax: 1,
    attackChainFrom: "",
    attackChainTo: "",
    lastAttackType: "",
    hurtRecoverPulse: 0,
    moveTurnPulse: 0,
    jumpPulse: 0,
    jumpStrength: 0,
    landingPulse: 0,
    landingStrength: 0,
    stepPulse: 0,
    stepCooldown: 0,
    walkCycle: 0,
    walkWeight: 0,
    walkPlant: 0,
    walkSwing: 0,
    walkStrideSmooth: 0,
    footPlantSide: dir,
    footPlantPulse: 0,
    footPlantCooldown: 0,
    walkAnchorSide: dir,
    walkAnchorPulse: 0,
    walkPushPulse: 0,
    walkStopPulse: 0,
    walkStopDir: dir,
    walkStopSpeed: 0,
    rangePressure: 0,
    rangeSide: dir,
    bracePulse: 0,
    jumpDir: dir,
    landingDir: dir,
    airFrames: 0,
    airKickPulse: 0,
    airKickRecoverPulse: 0,
    airKickLandingPulse: 0,
    airKickDir: dir,
    criticalCue: false,
    moveIntent: 0,
    poseState: "idle",
    previousPoseState: "idle",
    poseTransitionPulse: 0,
    poseTransitionMax: 1,
    poseTransitionDir: dir,
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
    onlinePrevInput: emptyInput(),
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

const SOUND_PRESETS = {
  menu: {
    duration: 0.09,
    volume: 0.07,
    type: "triangle",
    freq: [620, 960],
    noise: { volume: 0.012, type: "highpass", frequency: 1800, duration: 0.04 },
    layers: [{ type: "sine", freq: [1240, 840], volume: 0.26, delay: 0.018, duration: 0.07 }],
    cooldown: 0.04,
  },
  select: {
    duration: 0.14,
    volume: 0.082,
    type: "triangle",
    freq: [360, 720],
    noise: { volume: 0.018, type: "bandpass", frequency: 1900, q: 0.9, duration: 0.06 },
    layers: [{ type: "sine", freq: [820, 1240], volume: 0.22, delay: 0.028, duration: 0.09 }],
    cooldown: 0.05,
  },
  vs: {
    duration: 0.52,
    volume: 0.14,
    type: "sawtooth",
    freq: [118, 54],
    noise: { volume: 0.052, type: "lowpass", frequency: 320, duration: 0.46 },
    layers: [
      { type: "sine", freq: [48, 36], volume: 0.72, duration: 0.5 },
      { type: "triangle", freq: [236, 188], volume: 0.24, delay: 0.08, duration: 0.3 },
    ],
    cooldown: 0.24,
  },
  round: {
    duration: 0.34,
    volume: 0.128,
    type: "square",
    freq: [392, 196],
    noise: { volume: 0.038, type: "lowpass", frequency: 270, duration: 0.28 },
    layers: [{ type: "sine", freq: [92, 58], volume: 0.55, duration: 0.32 }],
    cooldown: 0.18,
  },
  punch: {
    duration: 0.105,
    volume: 0.085,
    type: "triangle",
    freq: [184, 72],
    noise: { volume: 0.058, type: "bandpass", frequency: 880, q: 0.7, duration: 0.075 },
    cooldown: 0.036,
  },
  airPunch: {
    duration: 0.12,
    volume: 0.074,
    type: "triangle",
    freq: [260, 104],
    noise: { volume: 0.052, type: "bandpass", frequency: 1320, q: 0.65, duration: 0.095 },
    cooldown: 0.036,
  },
  kick: {
    duration: 0.15,
    volume: 0.105,
    type: "triangle",
    freq: [132, 46],
    noise: { volume: 0.065, type: "bandpass", frequency: 620, q: 0.62, duration: 0.11 },
    layers: [{ type: "sine", freq: [72, 44], volume: 0.32, duration: 0.14 }],
    cooldown: 0.046,
  },
  airKick: {
    duration: 0.17,
    volume: 0.096,
    type: "triangle",
    freq: [190, 58],
    noise: { volume: 0.07, type: "bandpass", frequency: 1040, q: 0.7, duration: 0.13 },
    cooldown: 0.046,
  },
  sweep: {
    duration: 0.17,
    volume: 0.108,
    type: "sawtooth",
    freq: [96, 34],
    noise: { volume: 0.068, type: "lowpass", frequency: 360, duration: 0.14 },
    cooldown: 0.05,
  },
  grab: {
    duration: 0.13,
    volume: 0.088,
    type: "triangle",
    freq: [150, 62],
    noise: { volume: 0.054, type: "bandpass", frequency: 520, duration: 0.08 },
    cooldown: 0.05,
  },
  hit: {
    duration: 0.17,
    volume: 0.125,
    type: "triangle",
    freq: [86, 39],
    noise: { volume: 0.092, type: "bandpass", frequency: 720, q: 0.82, duration: 0.12 },
    layers: [{ type: "sine", freq: [55, 36], volume: 0.42, duration: 0.16 }],
    cooldown: 0.034,
  },
  hitSharp: {
    duration: 0.145,
    volume: 0.126,
    type: "triangle",
    freq: [190, 54],
    noise: { volume: 0.104, type: "highpass", frequency: 1400, duration: 0.08 },
    layers: [{ type: "square", freq: [560, 240], volume: 0.18, duration: 0.07 }],
    cooldown: 0.034,
  },
  hitLow: {
    duration: 0.2,
    volume: 0.135,
    type: "triangle",
    freq: [70, 28],
    noise: { volume: 0.076, type: "lowpass", frequency: 280, duration: 0.16 },
    layers: [{ type: "sine", freq: [44, 28], volume: 0.54, duration: 0.19 }],
    cooldown: 0.042,
  },
  hitHeavy: {
    duration: 0.25,
    volume: 0.165,
    type: "sawtooth",
    freq: [72, 24],
    noise: { volume: 0.098, type: "lowpass", frequency: 340, duration: 0.22 },
    layers: [
      { type: "sine", freq: [42, 24], volume: 0.78, duration: 0.24 },
      { type: "triangle", freq: [160, 70], volume: 0.22, duration: 0.12 },
    ],
    cooldown: 0.05,
  },
  projectileHit: {
    duration: 0.28,
    volume: 0.15,
    type: "sawtooth",
    freq: [420, 94],
    noise: { volume: 0.082, type: "bandpass", frequency: 1200, duration: 0.18 },
    layers: [{ type: "sine", freq: [90, 38], volume: 0.44, duration: 0.25 }],
    cooldown: 0.05,
  },
  impactTail: {
    duration: 0.42,
    volume: 0.076,
    type: "sine",
    freq: [68, 36],
    noise: { volume: 0.026, type: "lowpass", frequency: 210, duration: 0.24 },
    layers: [
      { type: "triangle", freq: [136, 92], volume: 0.18, delay: 0.012, duration: 0.2 },
      { type: "sine", freq: [34, 27], volume: 0.5, duration: 0.4 },
    ],
    cooldown: 0.09,
  },
  guardTail: {
    duration: 0.28,
    volume: 0.064,
    type: "square",
    freq: [640, 355],
    noise: { volume: 0.036, type: "highpass", frequency: 1900, duration: 0.1 },
    layers: [{ type: "triangle", freq: [1280, 740], volume: 0.12, delay: 0.02, duration: 0.16 }],
    cooldown: 0.08,
  },
  specialTail: {
    duration: 0.54,
    volume: 0.07,
    type: "triangle",
    freq: [720, 360, 540],
    noise: { volume: 0.022, type: "bandpass", frequency: 1700, q: 0.82, duration: 0.2 },
    layers: [
      { type: "sine", freq: [90, 48], volume: 0.42, duration: 0.48 },
      { type: "triangle", freq: [1080, 1440], volume: 0.1, delay: 0.08, duration: 0.2 },
    ],
    cooldown: 0.14,
  },
  finishRumble: {
    duration: 0.92,
    volume: 0.118,
    type: "sawtooth",
    freq: [54, 21],
    noise: { volume: 0.07, type: "lowpass", frequency: 160, duration: 0.62 },
    layers: [
      { type: "sine", freq: [27, 18], volume: 0.86, duration: 0.86 },
      { type: "triangle", freq: [108, 54], volume: 0.16, delay: 0.04, duration: 0.36 },
    ],
    cooldown: 0.28,
  },
  counter: {
    duration: 0.23,
    volume: 0.15,
    type: "square",
    freq: [620, 210],
    noise: { volume: 0.09, type: "highpass", frequency: 1450, duration: 0.11 },
    layers: [{ type: "sine", freq: [120, 52], volume: 0.44, duration: 0.22 }],
    cooldown: 0.06,
  },
  finishHit: {
    duration: 0.34,
    volume: 0.17,
    type: "sawtooth",
    freq: [86, 22],
    noise: { volume: 0.112, type: "lowpass", frequency: 300, duration: 0.28 },
    layers: [
      { type: "sine", freq: [40, 20], volume: 0.86, duration: 0.32 },
      { type: "square", freq: [260, 72], volume: 0.18, duration: 0.12 },
    ],
    cooldown: 0.12,
  },
  block: {
    duration: 0.13,
    volume: 0.105,
    type: "square",
    freq: [420, 190],
    noise: { volume: 0.08, type: "highpass", frequency: 1700, duration: 0.08 },
    layers: [{ type: "triangle", freq: [980, 620], volume: 0.2, duration: 0.11 }],
    cooldown: 0.044,
  },
  jump: {
    duration: 0.13,
    volume: 0.072,
    type: "sine",
    freq: [240, 520],
    noise: { volume: 0.035, type: "bandpass", frequency: 980, duration: 0.1 },
    cooldown: 0.08,
  },
  land: {
    duration: 0.14,
    volume: 0.078,
    type: "triangle",
    freq: [86, 34],
    noise: { volume: 0.052, type: "lowpass", frequency: 240, duration: 0.12 },
    cooldown: 0.075,
  },
  landHeavy: {
    duration: 0.21,
    volume: 0.12,
    type: "sawtooth",
    freq: [78, 26],
    noise: { volume: 0.074, type: "lowpass", frequency: 210, duration: 0.18 },
    layers: [{ type: "sine", freq: [44, 24], volume: 0.58, duration: 0.2 }],
    cooldown: 0.09,
  },
  step: {
    duration: 0.055,
    volume: 0.032,
    type: "triangle",
    freq: [88, 58],
    noise: { volume: 0.027, type: "lowpass", frequency: 180, duration: 0.045 },
    cooldown: 0.07,
  },
  special: {
    duration: 0.42,
    volume: 0.145,
    type: "sawtooth",
    freq: [520, 155],
    noise: { volume: 0.052, type: "bandpass", frequency: 1400, duration: 0.22 },
    layers: [
      { type: "sine", freq: [1040, 520], volume: 0.22, duration: 0.2 },
      { type: "triangle", freq: [130, 72], volume: 0.42, duration: 0.38 },
    ],
    cooldown: 0.14,
  },
  specialRelease: {
    duration: 0.32,
    volume: 0.142,
    type: "sawtooth",
    freq: [720, 120],
    noise: { volume: 0.086, type: "bandpass", frequency: 1260, duration: 0.18 },
    layers: [{ type: "sine", freq: [110, 42], volume: 0.42, duration: 0.3 }],
    cooldown: 0.11,
  },
  combo: {
    duration: 0.24,
    volume: 0.09,
    type: "triangle",
    freq: [520, 980],
    noise: { volume: 0.026, type: "highpass", frequency: 1600, duration: 0.08 },
    layers: [{ type: "sine", freq: [780, 1320], volume: 0.2, delay: 0.05, duration: 0.14 }],
    cooldown: 0.12,
  },
  comboBreak: {
    duration: 0.28,
    volume: 0.112,
    type: "square",
    freq: [740, 420],
    noise: { volume: 0.04, type: "highpass", frequency: 1800, duration: 0.11 },
    layers: [{ type: "sine", freq: [110, 55], volume: 0.38, duration: 0.24 }],
    cooldown: 0.16,
  },
  dojoGasp: {
    duration: 0.34,
    volume: 0.056,
    type: "triangle",
    freq: [460, 318],
    noise: { volume: 0.044, type: "bandpass", frequency: 880, q: 0.4, duration: 0.3 },
    layers: [
      { type: "sine", freq: [180, 150], volume: 0.34, duration: 0.3 },
      { type: "triangle", freq: [640, 520], volume: 0.12, delay: 0.035, duration: 0.18 },
    ],
    cooldown: 0.24,
  },
  dojoCrowd: {
    duration: 0.76,
    volume: 0.064,
    type: "sine",
    freq: [116, 110],
    noise: { volume: 0.072, type: "bandpass", frequency: 430, q: 0.46, duration: 0.7 },
    layers: [
      { type: "triangle", freq: [232, 220], volume: 0.16, duration: 0.64 },
      { type: "sine", freq: [58, 54], volume: 0.36, duration: 0.72 },
      { type: "triangle", freq: [330, 392], volume: 0.08, delay: 0.12, duration: 0.34 },
    ],
    cooldown: 0.52,
  },
  dojoStomp: {
    duration: 0.32,
    volume: 0.076,
    type: "sine",
    freq: [72, 34],
    noise: { volume: 0.05, type: "lowpass", frequency: 155, duration: 0.24 },
    layers: [{ type: "triangle", freq: [144, 68], volume: 0.2, duration: 0.24 }],
    cooldown: 0.2,
  },
  dojoRoar: {
    duration: 1.12,
    volume: 0.084,
    type: "sawtooth",
    freq: [128, 78],
    noise: { volume: 0.088, type: "lowpass", frequency: 520, duration: 1 },
    layers: [
      { type: "sine", freq: [64, 38], volume: 0.48, duration: 1.04 },
      { type: "triangle", freq: [256, 194], volume: 0.14, delay: 0.08, duration: 0.6 },
      { type: "triangle", freq: [512, 388], volume: 0.08, delay: 0.22, duration: 0.44 },
    ],
    cooldown: 0.82,
  },
  momentumShift: {
    duration: 0.34,
    volume: 0.074,
    type: "triangle",
    freq: [196, 392, 294],
    noise: { volume: 0.024, type: "bandpass", frequency: 1180, q: 0.72, duration: 0.12 },
    layers: [
      { type: "sine", freq: [73, 49], volume: 0.36, duration: 0.3 },
      { type: "triangle", freq: [588, 784], volume: 0.12, delay: 0.06, duration: 0.16 },
    ],
    cooldown: 0.36,
  },
  specialReady: {
    duration: 0.36,
    volume: 0.1,
    type: "triangle",
    freq: [330, 660, 990],
    noise: { volume: 0.018, type: "highpass", frequency: 2100, duration: 0.1 },
    layers: [
      { type: "sine", freq: [165, 330], volume: 0.28, duration: 0.32 },
      { type: "triangle", freq: [990, 1320], volume: 0.12, delay: 0.08, duration: 0.18 },
    ],
    cooldown: 0.22,
  },
  musicPulse: {
    duration: 0.18,
    volume: 0.032,
    type: "sine",
    freq: [86, 48],
    noise: { volume: 0.018, type: "lowpass", frequency: 180, duration: 0.14 },
    cooldown: 0.16,
  },
  musicTaiko: {
    duration: 0.28,
    volume: 0.046,
    type: "sine",
    freq: [92, 42],
    noise: { volume: 0.032, type: "lowpass", frequency: 220, duration: 0.18 },
    layers: [{ type: "triangle", freq: [48, 32], volume: 0.32, duration: 0.26 }],
    cooldown: 0.12,
  },
  musicBell: {
    duration: 0.62,
    volume: 0.038,
    type: "sine",
    freq: [440, 438],
    noise: { volume: 0.006, type: "highpass", frequency: 2200, duration: 0.08 },
    layers: [{ type: "triangle", freq: [880, 876], volume: 0.14, duration: 0.44 }],
    cooldown: 0.08,
  },
  musicPluck: {
    duration: 0.26,
    volume: 0.032,
    type: "triangle",
    freq: [294, 220],
    noise: { volume: 0.008, type: "bandpass", frequency: 1500, duration: 0.05 },
    layers: [{ type: "sine", freq: [588, 440], volume: 0.1, duration: 0.2 }],
    cooldown: 0.07,
  },
  musicDrone: {
    duration: 0.9,
    volume: 0.026,
    type: "sine",
    freq: [73, 73],
    noise: { volume: 0.012, type: "lowpass", frequency: 140, duration: 0.78 },
    layers: [{ type: "triangle", freq: [146, 145], volume: 0.12, duration: 0.72 }],
    cooldown: 0.5,
  },
  musicHat: {
    duration: 0.065,
    volume: 0.016,
    type: "triangle",
    freq: [520, 340],
    noise: { volume: 0.026, type: "highpass", frequency: 2400, duration: 0.045 },
    cooldown: 0.08,
  },
  pause: {
    duration: 0.13,
    volume: 0.078,
    type: "triangle",
    freq: [420, 210],
    noise: { volume: 0.018, type: "highpass", frequency: 1300, duration: 0.05 },
    cooldown: 0.08,
  },
  resume: {
    duration: 0.16,
    volume: 0.08,
    type: "triangle",
    freq: [220, 520],
    noise: { volume: 0.016, type: "highpass", frequency: 1400, duration: 0.05 },
    cooldown: 0.08,
  },
  ko: {
    duration: 0.78,
    volume: 0.18,
    type: "sawtooth",
    freq: [78, 24],
    noise: { volume: 0.116, type: "lowpass", frequency: 260, duration: 0.5 },
    layers: [
      { type: "sine", freq: [39, 22], volume: 0.88, duration: 0.72 },
      { type: "square", freq: [156, 52], volume: 0.18, duration: 0.24 },
    ],
    cooldown: 0.34,
  },
  victory: {
    duration: 0.72,
    volume: 0.15,
    type: "square",
    freq: [330, 660],
    noise: { volume: 0.026, type: "highpass", frequency: 1500, duration: 0.18 },
    layers: [
      { type: "triangle", freq: [495, 990], volume: 0.2, delay: 0.08, duration: 0.42 },
      { type: "sine", freq: [165, 330], volume: 0.42, duration: 0.62 },
    ],
    cooldown: 0.34,
  },
  introBoom: {
    duration: 0.86,
    volume: 0.16,
    type: "sawtooth",
    freq: [98, 31],
    noise: { volume: 0.09, type: "lowpass", frequency: 220, duration: 0.54 },
    layers: [
      { type: "sine", freq: [49, 24], volume: 0.78, duration: 0.8 },
      { type: "triangle", freq: [196, 92], volume: 0.16, delay: 0.06, duration: 0.34 },
    ],
    cooldown: 0.42,
  },
  roundSting: {
    duration: 0.54,
    volume: 0.15,
    type: "square",
    freq: [392, 110],
    noise: { volume: 0.07, type: "bandpass", frequency: 980, q: 0.72, duration: 0.26 },
    layers: [
      { type: "sine", freq: [55, 35], volume: 0.74, duration: 0.5 },
      { type: "triangle", freq: [784, 392], volume: 0.16, delay: 0.08, duration: 0.2 },
    ],
    cooldown: 0.24,
  },
  timeOver: {
    duration: 0.74,
    volume: 0.15,
    type: "sawtooth",
    freq: [330, 132, 66],
    noise: { volume: 0.072, type: "bandpass", frequency: 760, q: 0.72, duration: 0.32 },
    layers: [
      { type: "sine", freq: [82, 41], volume: 0.58, duration: 0.62 },
      { type: "triangle", freq: [660, 330], volume: 0.16, delay: 0.08, duration: 0.24 },
    ],
    cooldown: 0.36,
  },
  timePressure: {
    duration: 0.24,
    volume: 0.088,
    type: "square",
    freq: [196, 98],
    noise: { volume: 0.052, type: "bandpass", frequency: 720, q: 0.58, duration: 0.13 },
    layers: [
      { type: "sine", freq: [49, 32], volume: 0.46, duration: 0.22 },
      { type: "triangle", freq: [392, 588], volume: 0.1, delay: 0.035, duration: 0.12 },
    ],
    cooldown: 0.12,
  },
  introCard: {
    duration: 0.38,
    volume: 0.082,
    type: "triangle",
    freq: [220, 440, 330],
    noise: { volume: 0.026, type: "bandpass", frequency: 1250, q: 0.82, duration: 0.12 },
    layers: [
      { type: "sine", freq: [110, 82], volume: 0.34, duration: 0.34 },
      { type: "triangle", freq: [660, 880], volume: 0.13, delay: 0.07, duration: 0.14 },
    ],
    cooldown: 0.18,
  },
  announcer: {
    duration: 0.42,
    volume: 0.118,
    type: "sawtooth",
    freq: [176, 74],
    noise: { volume: 0.052, type: "bandpass", frequency: 760, q: 0.52, duration: 0.28 },
    layers: [
      { type: "sine", freq: [88, 44], volume: 0.44, duration: 0.38 },
      { type: "triangle", freq: [352, 186], volume: 0.14, delay: 0.04, duration: 0.22 },
    ],
    cooldown: 0.16,
  },
  danger: {
    duration: 0.28,
    volume: 0.12,
    type: "square",
    freq: [300, 116, 300],
    noise: { volume: 0.056, type: "highpass", frequency: 1300, duration: 0.12 },
    layers: [{ type: "sine", freq: [75, 48], volume: 0.38, duration: 0.26 }],
    cooldown: 0.22,
  },
  musicSub: {
    duration: 0.38,
    volume: 0.048,
    type: "sine",
    freq: [52, 38],
    noise: { volume: 0.012, type: "lowpass", frequency: 120, duration: 0.28 },
    layers: [{ type: "triangle", freq: [104, 76], volume: 0.1, duration: 0.3 }],
    cooldown: 0.11,
  },
  musicStrike: {
    duration: 0.16,
    volume: 0.03,
    type: "square",
    freq: [880, 320],
    noise: { volume: 0.038, type: "highpass", frequency: 2500, duration: 0.08 },
    cooldown: 0.06,
  },
  musicMatchPoint: {
    duration: 0.72,
    volume: 0.078,
    type: "sawtooth",
    freq: [146, 73],
    noise: { volume: 0.04, type: "bandpass", frequency: 680, q: 0.62, duration: 0.36 },
    layers: [
      { type: "sine", freq: [49, 36], volume: 0.48, duration: 0.68 },
      { type: "triangle", freq: [438, 292], volume: 0.12, delay: 0.08, duration: 0.34 },
    ],
    cooldown: 0.7,
  },
  musicCritical: {
    duration: 0.5,
    volume: 0.062,
    type: "square",
    freq: [220, 110, 165],
    noise: { volume: 0.036, type: "highpass", frequency: 1700, duration: 0.12 },
    layers: [{ type: "sine", freq: [55, 44], volume: 0.42, duration: 0.46 }],
    cooldown: 0.48,
  },
  musicComboRise: {
    duration: 0.42,
    volume: 0.052,
    type: "triangle",
    freq: [330, 660, 990],
    noise: { volume: 0.018, type: "highpass", frequency: 2100, duration: 0.08 },
    layers: [{ type: "sine", freq: [165, 330], volume: 0.24, duration: 0.36 }],
    cooldown: 0.24,
  },
  musicDuel: {
    duration: 0.66,
    volume: 0.054,
    type: "triangle",
    freq: [292, 438],
    noise: { volume: 0.02, type: "bandpass", frequency: 920, q: 0.7, duration: 0.2 },
    layers: [
      { type: "sine", freq: [73, 73.4], volume: 0.36, duration: 0.62 },
      { type: "triangle", freq: [584, 876], volume: 0.1, delay: 0.1, duration: 0.26 },
    ],
    cooldown: 0.55,
  },
  introClash: {
    duration: 0.46,
    volume: 0.074,
    type: "triangle",
    freq: [196, 392, 294],
    noise: { volume: 0.026, type: "bandpass", frequency: 1100, q: 0.72, duration: 0.14 },
    layers: [
      { type: "sine", freq: [65, 43], volume: 0.34, duration: 0.42 },
      { type: "triangle", freq: [588, 784], volume: 0.12, delay: 0.08, duration: 0.16 },
    ],
    cooldown: 0.38,
  },
  countdownTick: {
    duration: 0.24,
    volume: 0.082,
    type: "square",
    freq: [294, 147],
    noise: { volume: 0.034, type: "bandpass", frequency: 880, q: 0.68, duration: 0.1 },
    layers: [
      { type: "sine", freq: [73, 49], volume: 0.42, duration: 0.22 },
      { type: "triangle", freq: [588, 294], volume: 0.12, delay: 0.04, duration: 0.12 },
    ],
    cooldown: 0.16,
  },
  fightStart: {
    duration: 0.48,
    volume: 0.14,
    type: "sawtooth",
    freq: [440, 88],
    noise: { volume: 0.072, type: "bandpass", frequency: 1180, q: 0.62, duration: 0.2 },
    layers: [
      { type: "sine", freq: [55, 32], volume: 0.68, duration: 0.42 },
      { type: "triangle", freq: [880, 660], volume: 0.16, delay: 0.06, duration: 0.16 },
    ],
    cooldown: 0.42,
  },
  musicBreath: {
    duration: 0.92,
    volume: 0.018,
    type: "sine",
    freq: [146, 147],
    noise: { volume: 0.026, type: "bandpass", frequency: 460, q: 0.45, duration: 0.78 },
    layers: [{ type: "triangle", freq: [219, 220], volume: 0.08, duration: 0.82 }],
    cooldown: 0.5,
  },
  menuDrone: {
    duration: 1.35,
    volume: 0.022,
    type: "sine",
    freq: [73, 73.2],
    noise: { volume: 0.018, type: "bandpass", frequency: 310, q: 0.46, duration: 1.1 },
    layers: [
      { type: "triangle", freq: [146, 146.4], volume: 0.12, duration: 1.12 },
      { type: "sine", freq: [36.5, 36.6], volume: 0.34, duration: 1.28 },
    ],
    cooldown: 0.86,
  },
  menuPulse: {
    duration: 0.28,
    volume: 0.036,
    type: "sine",
    freq: [86, 48],
    noise: { volume: 0.02, type: "lowpass", frequency: 170, duration: 0.18 },
    layers: [{ type: "triangle", freq: [172, 96], volume: 0.1, duration: 0.18 }],
    cooldown: 0.16,
  },
  menuBell: {
    duration: 0.7,
    volume: 0.034,
    type: "triangle",
    freq: [438, 584],
    noise: { volume: 0.006, type: "highpass", frequency: 2200, duration: 0.08 },
    layers: [{ type: "sine", freq: [876, 1168], volume: 0.12, duration: 0.46 }],
    cooldown: 0.14,
  },
  menuShimmer: {
    duration: 0.22,
    volume: 0.02,
    type: "triangle",
    freq: [660, 990],
    noise: { volume: 0.022, type: "highpass", frequency: 2600, duration: 0.08 },
    cooldown: 0.1,
  },
  stageBreath: {
    duration: 1.4,
    volume: 0.018,
    type: "sine",
    freq: [92, 94],
    noise: { volume: 0.022, type: "bandpass", frequency: 360, q: 0.42, duration: 1.1 },
    layers: [{ type: "triangle", freq: [184, 186], volume: 0.08, duration: 1.12 }],
    cooldown: 1.1,
  },
  stageChime: {
    duration: 0.82,
    volume: 0.034,
    type: "triangle",
    freq: [660, 990, 742],
    noise: { volume: 0.006, type: "highpass", frequency: 2400, duration: 0.08 },
    layers: [{ type: "sine", freq: [330, 495], volume: 0.12, duration: 0.48 }],
    cooldown: 1.3,
  },
  lose: {
    duration: 0.58,
    volume: 0.132,
    type: "triangle",
    freq: [190, 72],
    noise: { volume: 0.044, type: "lowpass", frequency: 280, duration: 0.34 },
    layers: [{ type: "sine", freq: [95, 48], volume: 0.5, duration: 0.54 }],
    cooldown: 0.3,
  },
};

function getNoiseBuffer(duration) {
  const length = Math.max(1, Math.ceil(audioCtx.sampleRate * duration));
  const key = `${audioCtx.sampleRate}:${length}`;
  let buffer = audioNoiseCache.get(key);
  if (!buffer) {
    buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    audioNoiseCache.set(key, buffer);
  }
  return buffer;
}

function soundPanFromX(x) {
  return Number.isFinite(x) ? clamp((x - W / 2) / (W / 2), -0.55, 0.55) : 0;
}

function soundPan(options) {
  if (typeof options.pan === "number") return clamp(options.pan, -0.75, 0.75);
  return soundPanFromX(options.x);
}

function soundBusFor(type, preset) {
  if (preset.bus) return preset.bus;
  return type.startsWith("music") || type.startsWith("stage") ? "music" : "fx";
}

function connectSoundOutput(node, pan, now, bus = "fx") {
  const destination = bus === "music"
    ? audioMusicGain || audioMasterGain || audioCtx.destination
    : audioFxGain || audioMasterGain || audioCtx.destination;
  if (typeof audioCtx.createStereoPanner === "function" && Math.abs(pan) > 0.01) {
    const panner = audioCtx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);
    node.connect(panner);
    panner.connect(destination);
    return;
  }
  node.connect(destination);
}

function scheduleFrequency(freqParam, freqs, start, duration) {
  const values = Array.isArray(freqs) ? freqs : [freqs, freqs];
  const first = Math.max(20, values[0] ?? 120);
  freqParam.setValueAtTime(first, start);
  for (let i = 1; i < values.length; i += 1) {
    const target = Math.max(20, values[i] ?? first);
    const t = start + duration * (i / (values.length - 1));
    freqParam.exponentialRampToValueAtTime(target, t);
  }
}

function startSoundTone(layer, output, now, baseDuration) {
  if (!layer.freq) return;
  const start = now + (layer.delay ?? 0);
  const duration = layer.duration ?? baseDuration;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = layer.type ?? "triangle";
  if (layer.detune) osc.detune.setValueAtTime(layer.detune, start);
  scheduleFrequency(osc.frequency, layer.freq, start, duration);
  gain.gain.setValueAtTime(Math.max(0.001, layer.volume ?? 1), start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(output);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function startSoundNoise(noiseSpec, output, now, baseDuration, intensity) {
  if (!noiseSpec) return;
  const spec = typeof noiseSpec === "number" ? { volume: noiseSpec } : noiseSpec;
  const start = now + (spec.delay ?? 0);
  const duration = spec.duration ?? baseDuration;
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  source.buffer = getNoiseBuffer(duration);
  source.playbackRate.setValueAtTime((spec.playbackRate ?? 1) * (0.96 + Math.random() * 0.08), start);
  filter.type = spec.type ?? "lowpass";
  filter.frequency.setValueAtTime(spec.frequency ?? 600, start);
  if (typeof spec.q === "number") filter.Q.setValueAtTime(spec.q, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime((spec.volume ?? 0.05) * intensity, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start(start);
  source.stop(start + duration + 0.02);
}

function ensureAudio() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  if (!audioCtx) audioCtx = new AudioEngine();
  if (!audioMasterGain) {
    audioMasterGain = audioCtx.createGain();
    audioMasterGain.gain.setValueAtTime(0.86, audioCtx.currentTime);
    audioMasterGain.connect(audioCtx.destination);
  }
  if (!audioFxGain) {
    audioFxGain = audioCtx.createGain();
    audioFxGain.gain.setValueAtTime(AUDIO_FX_BASE_VOLUME, audioCtx.currentTime);
    audioFxGain.connect(audioMasterGain);
  }
  if (!audioMusicGain) {
    audioMusicGain = audioCtx.createGain();
    audioMusicGain.gain.setValueAtTime(AUDIO_MUSIC_BASE_VOLUME, audioCtx.currentTime);
    audioMusicGain.connect(audioMasterGain);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function duckMusicForImpact(strength = 1, hold = 0.12, release = 0.34) {
  if (!audioCtx || !audioMusicGain) return;
  const now = audioCtx.currentTime;
  const amount = clamp(strength, 0, 1.65);
  const target = AUDIO_MUSIC_BASE_VOLUME * (1 - clamp(0.18 + amount * 0.22, 0.18, 0.5));
  audioMusicGain.gain.cancelScheduledValues(now);
  audioMusicGain.gain.setValueAtTime(audioMusicGain.gain.value || AUDIO_MUSIC_BASE_VOLUME, now);
  audioMusicGain.gain.linearRampToValueAtTime(Math.max(0.22, target), now + 0.018);
  audioMusicGain.gain.setValueAtTime(Math.max(0.22, target), now + hold);
  audioMusicGain.gain.exponentialRampToValueAtTime(AUDIO_MUSIC_BASE_VOLUME, now + hold + release);
}

function playSound(type, options = {}) {
  if (!audioCtx || !soundEnabled) return;

  const preset = SOUND_PRESETS[type] ?? SOUND_PRESETS.punch;
  const now = audioCtx.currentTime;
  const soundKey = options.key ? `${type}:${options.key}` : type;
  const cooldown = preset.cooldown ?? 0.035;
  if (now - (audioLastPlayed[soundKey] ?? -Infinity) < cooldown) return;
  audioLastPlayed[soundKey] = now;

  const intensity = clamp(options.intensity ?? 1, 0.32, 1.85);
  const duration = preset.duration;
  const output = audioCtx.createGain();
  const attack = preset.attack ?? 0.006;
  output.gain.setValueAtTime(0.0001, now);
  output.gain.linearRampToValueAtTime(Math.max(0.0002, preset.volume * intensity), now + attack);
  output.gain.exponentialRampToValueAtTime(0.001, now + duration);
  connectSoundOutput(output, soundPan(options), now, soundBusFor(type, preset));

  const baseLayer = {
    type: preset.type,
    freq: options.freq ?? preset.freq,
    volume: 1,
    duration,
    detune: (Math.random() - 0.5) * (preset.randomDetune ?? 8),
  };
  const toneLayers = [baseLayer, ...(options.layers ?? preset.layers ?? [])];
  for (const layer of toneLayers) startSoundTone(layer, output, now, duration);
  startSoundNoise(preset.noise, output, now, duration, intensity);
}

function playDojoReaction(kind, options = {}) {
  const reactions = {
    comboSpark: { sound: "dojoGasp", accent: null, duck: 0.28, hold: 0.08, release: 0.24, intensity: 0.78 },
    comboSurge: { sound: "dojoCrowd", accent: "dojoStomp", duck: 0.48, hold: 0.12, release: 0.34, intensity: 0.92 },
    comboPeak: { sound: "dojoRoar", accent: "dojoStomp", duck: 0.72, hold: 0.16, release: 0.46, intensity: 1.06 },
    specialReady: { sound: "dojoGasp", accent: "stageChime", duck: 0.34, hold: 0.1, release: 0.3, intensity: 0.82 },
    finishImpact: { sound: "dojoGasp", accent: "dojoStomp", duck: 0.62, hold: 0.16, release: 0.42, intensity: 0.9 },
    finish: { sound: "dojoRoar", accent: "dojoStomp", duck: 1.08, hold: 0.26, release: 0.62, intensity: 1.18 },
    decision: { sound: "dojoCrowd", accent: "stageChime", duck: 0.58, hold: 0.16, release: 0.44, intensity: 0.94 },
  };
  const reaction = reactions[kind];
  if (!reaction) return;
  const x = Number.isFinite(options.x) ? options.x : W / 2;
  const comboLift = clamp((options.combo ?? 0) * 0.035, 0, 0.3);
  const intensity = clamp((options.intensity ?? reaction.intensity) + comboLift, 0.48, 1.5);
  const keyBase = options.key ?? `${kind}:${roundNumber}`;

  playSound(reaction.sound, { x, intensity, key: keyBase });
  if (reaction.accent) playSound(reaction.accent, { x, intensity: clamp(intensity * 0.86, 0.42, 1.35), key: `${keyBase}:accent` });
  if (reaction.duck) duckMusicForImpact(reaction.duck * intensity, reaction.hold, reaction.release);
}

function attackStartSound(type) {
  return {
    airPunch: "airPunch",
    airKick: "airKick",
    sweep: "sweep",
    grab: "grab",
    kick: "kick",
  }[type] ?? "punch";
}

function musicTensionLevel() {
  if (!fighters.length) return 0;
  const minHealth = Math.min(...fighters.map((f) => f.health));
  const maxEnergy = Math.max(...fighters.map((f) => f.energy));
  const distance = Math.abs((fighters[0]?.x ?? FIGHTER_START_LEFT_X) - (fighters[1]?.x ?? FIGHTER_START_RIGHT_X));
  const lowHealth = clamp((42 - minHealth) / 42, 0, 1);
  const specialReady = maxEnergy >= 85 ? 1 : maxEnergy >= 45 ? 0.42 : 0;
  const closeFight = clamp(1 - distance / 320, 0, 1);
  const roundLift = clamp((roundNumber - 1) * 0.08, 0, 0.16);
  return clamp(lowHealth * 0.58 + specialReady * 0.18 + closeFight * 0.16 + roundLift, 0, 1.18);
}

function activeComboValue(fighter) {
  if (!fighter || (fighter.comboTimer ?? 0) <= 0 || (fighter.comboCount ?? 0) < 2) return 0;
  return (fighter.comboCount ?? 0) * 4.4 + (fighter.comboDamage ?? 0) * 0.12;
}

function fighterMomentumScore(fighter, opponent) {
  if (!fighter || !opponent) return 0;
  const healthLead = (fighter.health ?? 0) - (opponent.health ?? 0);
  const energyLead = (fighter.energy ?? 0) - (opponent.energy ?? 0);
  const winLead = (fighter.wins ?? 0) - (opponent.wins ?? 0);
  const pressure = (fighter.rangePressure ?? 0) - (opponent.rangePressure ?? 0);
  const comboLead = activeComboValue(fighter) - activeComboValue(opponent);
  return healthLead * 0.58 + energyLead * 0.13 + winLead * 18 + pressure * 10 + comboLead;
}

function momentumReadState() {
  const [left, right] = fighters;
  if (!left || !right) {
    return { leader: null, score: 0, amount: 0, label: "EVEN", detail: "ROUND ABIERTO", color: "#fff1bd" };
  }
  const rawScore = fighterMomentumScore(left, right);
  const amount = clamp(Math.abs(rawScore) / 58, 0, 1);
  const leader = rawScore > 5.5 ? left : rawScore < -5.5 ? right : null;
  const opponent = leader === left ? right : left;
  const matchPoint = Math.max(left.wins ?? 0, right.wins ?? 0) >= 1 && roundNumber >= 2;
  const seconds = roundTimerSeconds();
  const bothLoaded = left.energy >= 45 && right.energy >= 45;
  const closeLate = seconds <= 18 && Math.abs((left.health ?? 0) - (right.health ?? 0)) <= 12;
  const comboLeader = fighters.reduce((best, fighter) => ((fighter.comboCount ?? 0) > (best?.comboCount ?? 0) ? fighter : best), null);
  const liveCombo = comboLeader && (comboLeader.comboTimer ?? 0) > 0 && (comboLeader.comboCount ?? 0) >= 3;

  if (liveCombo) {
    return {
      leader: comboLeader,
      score: comboLeader === left ? amount : -amount,
      amount: clamp((comboLeader.comboCount ?? 0) / 9, 0.34, 1),
      label: `${comboLeader.comboCount} HIT RUN`,
      detail: `${comboLeader.name} encadena presion`,
      color: comboTierColor(comboLeader.comboCount ?? 0),
    };
  }
  if (matchPoint && leader) {
    return {
      leader,
      score: rawScore,
      amount,
      label: "MATCH POINT",
      detail: `${leader.name} puede cerrar el combate`,
      color: leader.trim || "#ffd44d",
    };
  }
  if (closeLate) {
    return {
      leader,
      score: rawScore,
      amount: Math.max(amount, 0.24),
      label: "DECISION EN JUEGO",
      detail: leader ? `${leader.name} lleva la iniciativa` : "Cualquier golpe cambia el round",
      color: leader?.trim || "#ffd44d",
    };
  }
  if (bothLoaded && !leader) {
    return {
      leader: null,
      score: rawScore,
      amount: 0.5,
      label: "DOBLE AMENAZA",
      detail: "Ambos tienen especial listo",
      color: "#75f0cb",
    };
  }
  if (leader) {
    return {
      leader,
      score: rawScore,
      amount,
      label: amount > 0.62 ? "DOMINIO" : "VENTAJA",
      detail: `${leader.name} controla a ${opponent.name}`,
      color: leader.trim || "#fff1bd",
    };
  }
  return { leader: null, score: rawScore, amount, label: "ROUND ABIERTO", detail: "La pelea esta pareja", color: "#fff1bd" };
}

function resetMomentumHud() {
  momentumHud = {
    leader: null,
    pulse: 0,
    lastScore: 0,
    lastCueFrame: -999,
  };
}

function updateMomentumHud() {
  if (momentumHud.pulse > 0) momentumHud.pulse -= 1;
  if (!running || paused || winner || countdownFrames > 0) return;

  const read = momentumReadState();
  const leaderId = read.leader?.id ?? null;
  const prevLeader = momentumHud.leader;
  const leaderChanged = leaderId && leaderId !== prevLeader;
  const scoreJump = Math.abs(read.score - (momentumHud.lastScore ?? 0));
  if (leaderChanged && read.amount >= 0.26 && roundFrame > 78 && roundFrame - momentumHud.lastCueFrame > 130) {
    momentumHud.pulse = 42;
    momentumHud.lastCueFrame = roundFrame;
    playSound("momentumShift", { x: read.leader.x, intensity: 0.76 + read.amount * 0.38, key: `${leaderId}:${roundNumber}` });
    addText(read.leader.x, read.leader.y - fighterScale(170), read.label, read.color, {
      size: read.amount > 0.62 ? 23 : 20,
      life: 48,
      rise: 0.36,
      drift: (read.leader.dir || 1) * 0.05,
    });
  } else if (scoreJump > 26 && read.amount >= 0.48) {
    momentumHud.pulse = Math.max(momentumHud.pulse, 18);
  }
  momentumHud.leader = leaderId;
  momentumHud.lastScore = read.score;
}

function playMusicTick() {
  if (!audioCtx || !soundEnabled || !running || paused || winner || countdownFrames > 0 || roundFrame % 24 !== 0) return;

  const step = musicClock % 16;
  const bar = Math.floor(musicClock / 16);
  const tension = musicTensionLevel();
  const rootCycle = [73.42, 65.41, 82.41, 73.42];
  const roots = rootCycle[bar % rootCycle.length];
  const scale = [1, 1.2, 1.333, 1.5, 1.8, 2];
  const melodyPattern = [2, 0, 3, 1, 4, 2, 5, 3, 2, 1, 3, 0, 4, 2, 1, 0];
  const note = roots * scale[melodyPattern[(step + bar * 3) % melodyPattern.length]];
  const pan = Math.sin((musicClock + bar) * 0.55) * 0.14;

  if (step === 0 || step === 8 || (tension > 0.42 && (step === 6 || step === 14))) {
    playSound("musicTaiko", { intensity: step === 0 ? 0.92 + tension * 0.18 : 0.62 + tension * 0.18, pan: 0, key: "taiko" });
  }
  if (step === 0 || step === 4 || step === 8 || (tension > 0.48 && step === 12)) {
    playSound("musicSub", {
      freq: [roots * 0.5, roots * (step === 0 ? 0.38 : 0.42)],
      intensity: 0.58 + tension * 0.24,
      pan: 0,
      key: "sub",
    });
  }
  if (step === 0 || step === 8) {
    playSound("musicDrone", {
      freq: [roots, roots * (1 + tension * 0.006)],
      layers: [{ type: "triangle", freq: [roots * 2, roots * 2.01], volume: 0.1 + tension * 0.03, duration: 0.74 }],
      intensity: 0.62 + tension * 0.18,
      pan: -0.04,
      key: "drone",
    });
  }
  if (step === 0 || (tension > 0.34 && step === 8)) {
    playSound("musicBreath", {
      freq: [roots * 2, roots * (2.002 + tension * 0.003)],
      intensity: 0.54 + tension * 0.22,
      pan: Math.sin(bar) * 0.12,
      key: "breath",
    });
  }
  if (step === 2 || step === 7 || step === 11 || step === 15) {
    playSound("musicBell", {
      freq: [note, note * 0.996],
      layers: [{ type: "triangle", freq: [note * 2.01, note * 1.998], volume: 0.12 + tension * 0.03, duration: 0.42 }],
      intensity: 0.54 + tension * 0.28,
      pan,
      key: "bell",
    });
  }
  if (tension > 0.2 && (step === 3 || step === 5 || step === 10 || step === 13)) {
    const pluck = roots * scale[melodyPattern[(step + 5 + bar) % melodyPattern.length]] * 1.5;
    playSound("musicPluck", {
      freq: [pluck, pluck * 0.74],
      layers: [{ type: "sine", freq: [pluck * 2, pluck * 1.52], volume: 0.08 + tension * 0.04, duration: 0.18 }],
      intensity: 0.42 + tension * 0.34,
      pan: -pan,
      key: "pluck",
    });
  }
  if (tension > 0.55 && step % 2 === 1) {
    playSound("musicHat", { intensity: 0.32 + tension * 0.2, pan: Math.sin(step) * 0.1, key: "hat" });
  }
  if (tension > 0.36 && (step === 1 || step === 9 || step === 12)) {
    playSound("musicStrike", { intensity: 0.36 + tension * 0.24, pan: Math.sin(step + bar) * 0.18, key: `strike:${step}` });
  }
  musicClock += 1;
}

function resetMusicDirectorRound() {
  musicDirector = {
    round: roundNumber,
    matchPoint: false,
    duel: false,
    closeCall: false,
    comboPeak: 0,
    critical: Object.create(null),
  };
}

function playMusicDirectorTick() {
  if (!audioCtx || !soundEnabled || !running || paused || winner || countdownFrames > 0 || roundFrame < 8) return;

  const [a, b] = fighters;
  if (!a || !b) return;

  const leadingWins = Math.max(a.wins ?? 0, b.wins ?? 0);
  if (!musicDirector.matchPoint && leadingWins >= 1 && roundNumber >= 2) {
    musicDirector.matchPoint = true;
    playSound("musicMatchPoint", { intensity: 0.86 + musicTensionLevel() * 0.22, pan: 0, key: `match:${roundNumber}` });
  }

  if (!musicDirector.duel && a.energy >= 45 && b.energy >= 45) {
    musicDirector.duel = true;
    playSound("musicDuel", { intensity: 0.74 + musicTensionLevel() * 0.18, pan: 0, key: `duel:${roundNumber}` });
  }

  const minHealth = Math.min(a.health, b.health);
  const healthGap = Math.abs(a.health - b.health);
  if (!musicDirector.closeCall && minHealth <= 34 && healthGap <= 10) {
    musicDirector.closeCall = true;
    playSound("musicDuel", { intensity: 0.92 + musicTensionLevel() * 0.22, pan: 0, key: `close:${roundNumber}` });
  }

  for (const fighter of fighters) {
    if (fighter.health > 0 && fighter.health <= 24 && !musicDirector.critical[fighter.id]) {
      musicDirector.critical[fighter.id] = true;
      playSound("musicCritical", { x: fighter.x, intensity: 0.9 + (24 - fighter.health) / 48, key: `critical:${fighter.id}:${roundNumber}` });
    }
  }

  const comboLeader = fighters.reduce((best, fighter) => ((fighter.comboCount ?? 0) > (best?.comboCount ?? 0) ? fighter : best), null);
  const comboCount = comboLeader?.comboCount ?? 0;
  if (comboCount >= 5 && comboCount > musicDirector.comboPeak && (comboLeader.comboTimer ?? 0) > 0) {
    musicDirector.comboPeak = comboCount;
    playSound("musicComboRise", {
      x: comboLeader.x,
      intensity: clamp(0.7 + comboCount * 0.07, 0.9, 1.45),
      key: `combo:${roundNumber}:${comboCount}`,
    });
  }
}

function playStageAmbienceTick() {
  if (!audioCtx || !soundEnabled || !running || paused || winner || countdownFrames > 0) return;
  const tension = musicTensionLevel();
  if (roundFrame % 186 === 42) {
    playSound("stageBreath", {
      intensity: 0.62 + tension * 0.18,
      pan: Math.sin(roundFrame * 0.011) * 0.16,
      key: `breath:${Math.floor(roundFrame / 186)}`,
    });
  }
  if (roundFrame % 420 === 210 && tension < 0.82) {
    playSound("stageChime", {
      intensity: 0.54 + tension * 0.16,
      pan: Math.sin(roundFrame * 0.017) * 0.28,
      key: `chime:${Math.floor(roundFrame / 420)}`,
    });
  }
}

function attractMusicTensionLevel() {
  const leftProfile = fighterProfiles[selectedLeftId] ?? fighters[0];
  const rightProfile = fighterProfiles[selectedRightId] ?? fighters[1];
  if (!leftProfile || !rightProfile) return 0.24;

  const leftStats = menuStatValues(leftProfile);
  const rightStats = menuStatValues(rightProfile);
  const gap = Math.max(
    Math.abs(leftStats[0] - rightStats[0]),
    Math.abs(leftStats[1] - rightStats[1]),
    Math.abs(leftStats[2] - rightStats[2])
  );
  const screenLift = overlay.dataset.screen === "versus" ? 0.28 : 0;
  const tournamentLift = tournamentMode || tournamentActive ? 0.12 : 0;
  return clamp(0.2 + gap / 85 + screenLift + tournamentLift, 0.2, 1.05);
}

function playAttractMusicTick() {
  if (!audioCtx || !soundEnabled || !isAttractModeActive()) return;

  const screen = overlay.dataset.screen || "home";
  if (screen !== attractMusicLastScreen) {
    attractMusicLastScreen = screen;
    attractMusicClock = 0;
  }
  if (attractFrame % 30 !== 0) return;

  const step = attractMusicClock % 16;
  const bar = Math.floor(attractMusicClock / 16);
  const tension = attractMusicTensionLevel();
  const homeRoots = [73.42, 65.41, 82.41, 55];
  const versusRoots = [65.41, 73.42, 49, 82.41];
  const rootCycle = screen === "versus" ? versusRoots : homeRoots;
  const root = rootCycle[bar % rootCycle.length];
  const scale = [1, 1.125, 1.25, 1.5, 1.6875, 2];
  const melody = [3, 1, 4, 2, 5, 3, 4, 0, 3, 2, 4, 1, 5, 4, 2, 0];
  const note = root * scale[melody[(step + bar * 2) % melody.length]];
  const pan = Math.sin((attractMusicClock + bar) * 0.66) * 0.18;

  if (step === 0 || step === 8) {
    playSound("menuDrone", {
      freq: [root, root * (1.002 + tension * 0.003)],
      layers: [
        { type: "triangle", freq: [root * 2, root * (2.004 + tension * 0.003)], volume: 0.1 + tension * 0.035, duration: 1.06 },
        { type: "sine", freq: [root * 0.5, root * 0.502], volume: 0.32 + tension * 0.08, duration: 1.24 },
      ],
      intensity: screen === "versus" ? 0.78 + tension * 0.16 : 0.58 + tension * 0.18,
      pan: 0,
      key: `${screen}:drone`,
    });
  }

  if (step === 0 || step === 4 || step === 8 || step === 12) {
    playSound("menuPulse", {
      freq: [root * (step === 0 || step === 8 ? 0.72 : 0.86), root * 0.42],
      intensity: 0.54 + tension * 0.26,
      pan: step === 4 ? -0.08 : step === 12 ? 0.08 : 0,
      key: `${screen}:pulse:${step}`,
    });
  }

  if (step === 2 || step === 6 || step === 11 || step === 15) {
    playSound("menuBell", {
      freq: [note, note * 1.333],
      layers: [{ type: "sine", freq: [note * 2, note * 2.01], volume: 0.1 + tension * 0.03, duration: 0.42 }],
      intensity: 0.44 + tension * 0.28,
      pan,
      key: `${screen}:bell:${step}`,
    });
  }

  if ((screen === "versus" && (step === 3 || step === 10 || step === 14)) || (screen === "home" && tension > 0.48 && (step === 7 || step === 13))) {
    playSound("menuShimmer", {
      freq: [note * 1.5, note * 2.25],
      intensity: screen === "versus" ? 0.58 + tension * 0.22 : 0.42 + tension * 0.18,
      pan: -pan,
      key: `${screen}:shimmer:${step}`,
    });
  }

  if (screen === "versus" && (step === 0 || step === 8)) {
    playSound("introClash", {
      freq: [root * 2, root * 3, root * 2.25],
      intensity: 0.38 + tension * 0.2,
      pan: 0,
      key: `attract:${bar}:${step}`,
    });
  }

  attractMusicClock += 1;
}

function finalPressureLevel() {
  if (!running || winner || countdownFrames > 0 || roundTimerFrames > 10 * 60) return 0;
  return clamp((10 * 60 - roundTimerFrames) / (10 * 60), 0.08, 1);
}

function updateFinalPressureCues() {
  if (finalPressurePulse > 0) finalPressurePulse -= 1;
  const pressure = finalPressureLevel();
  if (pressure <= 0 || roundTimerFrames <= 0) {
    finalPressureSecondCue = 0;
    return;
  }

  const seconds = Math.ceil(roundTimerFrames / 60);
  const beatRate = seconds <= 5 ? 30 : 60;
  if (roundTimerFrames % beatRate === 0) {
    finalPressurePulse = Math.max(finalPressurePulse, seconds <= 3 ? 30 : 22);
    playSound("timePressure", {
      intensity: clamp(0.68 + pressure * 0.62, 0.7, 1.35),
      pan: seconds % 2 ? -0.08 : 0.08,
      key: `pressure:${roundNumber}:${roundTimerFrames}`,
    });
    if (seconds <= 3) {
      triggerScreenTear(seconds % 2 ? -1 : 1, "#ffd44d", 0.32 + pressure * 0.38, 9);
    }
  }

  if (seconds <= 5 && seconds !== finalPressureSecondCue) {
    finalPressureSecondCue = seconds;
    triggerCinematicHit(seconds % 2 ? -1 : 1, "#ffd44d", 0.28 + pressure * 0.28, 8, {
      zoom: 0.012,
      pan: 2.4,
      lift: 0.8,
      roll: 0.002,
      band: 0.46,
    });
  }
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
  musicClock = 0;
  Object.assign(fighters[0], {
    x: FIGHTER_START_LEFT_X,
    y: FLOOR,
    vx: 0,
    vy: 0,
    dir: 1,
    health: 100,
    healthLag: 100,
    energy: 52,
    specialReadyCue: true,
    specialReadyPulse: 0,
    attack: null,
    cooldown: 0,
    hurt: 0,
    pigMorph: 0,
    hitFlash: 0,
    impactPulse: 0,
    impactDir: 1,
    impactLift: 0,
    impactStrength: 0,
    impactFlavor: "light",
    dynamicLightPulse: 0,
    dynamicLightMax: 1,
    dynamicLightColor: "#fff1bd",
    dynamicLightZone: "torso",
    dynamicLightDir: 1,
    dynamicLightStrength: 0,
    contactFlash: 0,
    damagePulse: 0,
    damageLevel: 0,
    hitZone: "torso",
    hitZonePulse: 0,
    faceImpactPulse: 0,
    faceImpactMax: 1,
    faceImpactZone: "torso",
    faceImpactDir: 1,
    faceImpactStrength: 0,
    reactionPulse: 0,
    reactionMax: 1,
    reactionZone: "torso",
    reactionKind: "light",
    reactionDir: 1,
    reactionStrength: 0,
    koFall: 0,
    koFallDir: 1,
    koFallStrength: 0,
    victoryPulse: 0,
    guardPulse: 0,
    guardImpact: 0,
    guardEntryPulse: 0,
    guardExitPulse: 0,
    staggerPulse: 0,
    attackEntryPulse: 0,
    attackRecoverPulse: 0,
    attackChainPulse: 0,
    attackChainMax: 1,
    attackChainFrom: "",
    attackChainTo: "",
    lastAttackType: "",
    hurtRecoverPulse: 0,
    moveTurnPulse: 0,
    jumpPulse: 0,
    jumpStrength: 0,
    landingPulse: 0,
    landingStrength: 0,
    stepPulse: 0,
    stepCooldown: 0,
    walkCycle: 0,
    walkWeight: 0,
    walkPlant: 0,
    walkSwing: 0,
    walkStrideSmooth: 0,
    footPlantSide: 1,
    footPlantPulse: 0,
    footPlantCooldown: 0,
    walkAnchorSide: 1,
    walkAnchorPulse: 0,
    walkPushPulse: 0,
    walkStopPulse: 0,
    walkStopDir: 1,
    walkStopSpeed: 0,
    rangePressure: 0,
    rangeSide: 1,
    bracePulse: 0,
    jumpDir: 1,
    landingDir: 1,
    airFrames: 0,
    airKickPulse: 0,
    airKickRecoverPulse: 0,
    airKickLandingPulse: 0,
    airKickDir: 1,
    criticalCue: false,
    moveIntent: 0,
    poseState: "idle",
    previousPoseState: "idle",
    poseTransitionPulse: 0,
    poseTransitionMax: 1,
    poseTransitionDir: 1,
    blocking: false,
    grounded: true,
    specialCooldown: 0,
    counterWindow: 0,
    comboCount: 0,
    comboTimer: 0,
    comboDamage: 0,
    comboPulse: 0,
    comboTargetId: "",
    comboWindow: 0,
    ...roundStatState(),
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
    specialReadyCue: true,
    specialReadyPulse: 0,
    attack: null,
    cooldown: 0,
    hurt: 0,
    pigMorph: 0,
    hitFlash: 0,
    impactPulse: 0,
    impactDir: -1,
    impactLift: 0,
    impactStrength: 0,
    impactFlavor: "light",
    dynamicLightPulse: 0,
    dynamicLightMax: 1,
    dynamicLightColor: "#fff1bd",
    dynamicLightZone: "torso",
    dynamicLightDir: -1,
    dynamicLightStrength: 0,
    contactFlash: 0,
    damagePulse: 0,
    damageLevel: 0,
    hitZone: "torso",
    hitZonePulse: 0,
    faceImpactPulse: 0,
    faceImpactMax: 1,
    faceImpactZone: "torso",
    faceImpactDir: -1,
    faceImpactStrength: 0,
    reactionPulse: 0,
    reactionMax: 1,
    reactionZone: "torso",
    reactionKind: "light",
    reactionDir: -1,
    reactionStrength: 0,
    koFall: 0,
    koFallDir: -1,
    koFallStrength: 0,
    victoryPulse: 0,
    guardPulse: 0,
    guardImpact: 0,
    guardEntryPulse: 0,
    guardExitPulse: 0,
    staggerPulse: 0,
    attackEntryPulse: 0,
    attackRecoverPulse: 0,
    attackChainPulse: 0,
    attackChainMax: 1,
    attackChainFrom: "",
    attackChainTo: "",
    lastAttackType: "",
    hurtRecoverPulse: 0,
    moveTurnPulse: 0,
    jumpPulse: 0,
    jumpStrength: 0,
    landingPulse: 0,
    landingStrength: 0,
    stepPulse: 0,
    stepCooldown: 0,
    walkCycle: 0,
    walkWeight: 0,
    walkPlant: 0,
    walkSwing: 0,
    walkStrideSmooth: 0,
    footPlantSide: -1,
    footPlantPulse: 0,
    footPlantCooldown: 0,
    walkAnchorSide: -1,
    walkAnchorPulse: 0,
    walkPushPulse: 0,
    walkStopPulse: 0,
    walkStopDir: -1,
    walkStopSpeed: 0,
    rangePressure: 0,
    rangeSide: -1,
    bracePulse: 0,
    jumpDir: -1,
    landingDir: -1,
    airFrames: 0,
    airKickPulse: 0,
    airKickRecoverPulse: 0,
    airKickLandingPulse: 0,
    airKickDir: -1,
    criticalCue: false,
    moveIntent: 0,
    poseState: "idle",
    previousPoseState: "idle",
    poseTransitionPulse: 0,
    poseTransitionMax: 1,
    poseTransitionDir: -1,
    blocking: false,
    grounded: true,
    specialCooldown: 0,
    counterWindow: 0,
    comboCount: 0,
    comboTimer: 0,
    comboDamage: 0,
    comboPulse: 0,
    comboTargetId: "",
    comboWindow: 0,
    ...roundStatState(),
  });

  fighters.forEach((fighter) => {
    fighter.onlinePrevInput = emptyInput();
  });

  particles = [];
  floatingTexts = [];
  announcerCue = null;
  projectiles.length = 0;
  winner = "";
  roundWinnerId = "";
  roundFinishKind = "ko";
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
  cinematicHitZoom = 0.022;
  cinematicHitPan = 6.4;
  cinematicHitLift = 2.6;
  cinematicHitRoll = 0;
  cinematicHitBand = 1;
  screenTearPulse = 0;
  screenTearMax = 1;
  screenTearDir = 1;
  screenTearColor = "#fff1bd";
  screenTearStrength = 0;
  finishFreezeCue = null;
  finalPressurePulse = 0;
  finalPressureSecondCue = 0;
  koFreeze = 0;
  roundFrame = 0;
  resultFrame = 0;
  roundTimerFrames = ROUND_TIMER_FRAMES;
  countdownFrames = 180;
  resetMomentumHud();
  resetMusicDirectorRound();
  paused = false;
  running = true;
  overlay.classList.add("hidden");
  cueAnnouncer(`ROUND ${toRoman(roundNumber)}`, `${fighters[0].name}  VS  ${fighters[1].name}`, "#fff1bd", 92);
  fighters.forEach((fighter, index) => {
    triggerDynamicLight(fighter, fighter.trim || "#fff1bd", "torso", fighter.dir || 1, 0.72, 52);
    fighter.bracePulse = Math.max(fighter.bracePulse ?? 0, 18);
    playSound("introCard", { x: fighter.x, intensity: index === 0 ? 0.92 : 1.02, key: `${fighter.id}:${roundNumber}` });
  });
  playSound("introClash", { intensity: 0.82, key: `round:${roundNumber}` });
  syncShellState();
  sendOnlineSnapshot(true);
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
    ? "El Dojo Tendo abre el torneo. Elegi campeon, estudia su firma y subi al tatami."
    : `El Dojo Tendo abre sus puertas. Elegi combatientes, lee sus estilos y prepara el duelo${cpuEnabled ? " contra la CPU." : "."}`;
}

function cueHomeIntro() {
  if (homeIntroTimer) clearTimeout(homeIntroTimer);
  overlay.classList.remove("home-enter");
  void overlay.offsetWidth;
  overlay.classList.add("home-enter");
  homeIntroTimer = setTimeout(() => {
    homeIntroTimer = null;
    overlay.classList.remove("home-enter");
  }, 900);
}

function showHomeOverlay() {
  if (!running) attractFrame = 0;
  attractMusicClock = 0;
  attractMusicLastScreen = "";
  overlayMode = "home";
  overlay.dataset.screen = "home";
  overlay.dataset.mode = tournamentMode ? "tournament" : "match";
  syncOnlineButtons();
  overlay.querySelector("h1").textContent = "Mini Kombat IV";
  overlayCopy.textContent = homeOverlayCopy();
  startButton.textContent = tournamentMode ? "INICIAR TORNEO" : "LUCHAR";
  renderFighterSelect();
  fighterSelect.classList.remove("hidden");
  overlay.classList.remove("hidden");
  cueHomeIntro();
  syncShellState();
  playSound("introBoom", { intensity: 0.72, key: "home" });
}

function showVersusOverlay(startKind = "match") {
  attractFrame = 0;
  attractMusicClock = 0;
  attractMusicLastScreen = "";
  pendingFightStart = startKind;
  overlayMode = "versus";
  overlay.dataset.screen = "versus";
  overlay.dataset.mode = tournamentActive ? "tournament" : "match";
  const roundLabel = startKind === "round" ? `ROUND ${toRoman(roundNumber)}` : tournamentActive ? `RIVAL ${tournamentIndex + 1}/${tournamentOpponents.length}` : `ROUND ${toRoman(roundNumber)}`;
  overlay.querySelector("h1").textContent = roundLabel;
  const leftPresentation = fighterPresentation(fighters[0]);
  const rightPresentation = fighterPresentation(fighters[1]);
  overlayCopy.textContent = tournamentActive
    ? `Torneo Dojo Tendo. ${fighters[0].name} ${leftPresentation.callout}; ${fighters[1].name} busca avanzar con ${rightPresentation.signature}.`
    : `${fighters[0].name} ${leftPresentation.callout}. ${fighters[1].name} responde con ${rightPresentation.signature}.`;
  renderVersusPanel(roundLabel);
  startButton.textContent = "COMENZAR";
  fighterSelect.classList.remove("hidden");
  overlay.classList.remove("hidden");
  syncShellState();
  playSound("vs");
  playSound("introBoom", { intensity: 0.54, key: "versus" });
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
  playSound("roundSting", { intensity: 0.9, key: `round:${roundNumber}` });
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
  playSound("pause");
  overlayMode = "pause";
  overlay.dataset.screen = "pause";
  overlay.querySelector("h1").textContent = "Pausa";
  overlayCopy.textContent = onlineGuestActive()
    ? "Pausa online. Toca pedir seguir para avisarle al anfitrion."
    : "Esc o el boton de pausa para seguir. Reiniciar empieza el match de cero.";
  startButton.textContent = onlineGuestActive() ? "PEDIR SEGUIR" : "SEGUIR";
  fighterSelect.classList.add("hidden");
  overlay.classList.remove("hidden");
  syncShellState();
}

function resumeGame() {
  playSound("resume");
  paused = false;
  overlay.classList.add("hidden");
  syncShellState();
}

function emptyInput() {
  return {
    left: false,
    right: false,
    jump: false,
    block: false,
    punch: false,
    kick: false,
    special: false,
    grab: false,
  };
}

function normalizeInput(input = {}) {
  return {
    left: Boolean(input.left),
    right: Boolean(input.right),
    jump: Boolean(input.jump),
    block: Boolean(input.block),
    punch: Boolean(input.punch),
    kick: Boolean(input.kick),
    special: Boolean(input.special),
    grab: Boolean(input.grab),
  };
}

function onlineConnected() {
  return onlineState.connected && onlineChannelIsOpen();
}

function onlineHostActive() {
  return onlineConnected() && onlineState.role === "host";
}

function onlineGuestActive() {
  return onlineConnected() && onlineState.role === "guest";
}

function onlineLocalFighterId() {
  return onlineState.localSide || "";
}

function onlineRemoteFighterId() {
  return onlineState.remoteSide || "";
}

function onlineHostReady() {
  return onlineState.role === "host" ? onlineState.localReady : onlineState.remoteReady;
}

function onlineGuestReady() {
  return onlineState.role === "guest" ? onlineState.localReady : onlineState.remoteReady;
}

function onlineBothReady() {
  return onlineConnected() && onlineState.localReady && onlineState.remoteReady;
}

function touchControlsFighterId() {
  return onlineConnected() ? onlineLocalFighterId() : "right";
}

function readHumanInputForFighter(f) {
  if (cpuEnabled && f.id === cpuFighterId) return f.ai;
  const c = f.controls;
  const touch = f.id === touchControlsFighterId() ? touchInput : {};
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

function inputFor(f) {
  if (onlineHostActive() && f.id === onlineRemoteFighterId()) {
    return onlineState.remoteInput ?? emptyInput();
  }
  if (onlineGuestActive()) return emptyInput();
  return readHumanInputForFighter(f);
}

function canStartLocalActionFor(f) {
  if (!onlineConnected()) return !(cpuEnabled && f.id === cpuFighterId);
  return onlineState.role === "host" && f.id === onlineLocalFighterId();
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

function maybeStartOnlineRemoteAction(f, input) {
  if (!onlineHostActive() || f.id !== onlineRemoteFighterId()) return;
  const previous = f.onlinePrevInput ?? emptyInput();
  const freshSpecial = input.special && !previous.special;
  const freshGrab = input.grab && !previous.grab;
  const freshPunch = input.punch && !previous.punch;
  const freshKick = input.kick && !previous.kick;

  if (freshSpecial || (freshPunch && input.block)) startSpecial(f);
  else if (freshGrab) startAttack(f, "grab");
  else if (freshKick && input.block) startAttack(f, "sweep");
  else if (freshPunch) startAttack(f, f.grounded ? "punch" : "airPunch");
  else if (freshKick) startAttack(f, f.grounded ? "kick" : "airKick");

  f.onlinePrevInput = { ...input };
}

function startAttack(f, type) {
  const comboReady = (f.comboWindow ?? 0) > 0 && (f.cooldown ?? 0) <= 8;
  if ((f.cooldown > 0 && !comboReady) || f.attack || f.hurt > 16 || (f.blocking && type !== "sweep")) return;

  const heavy = type === "kick" || type === "airKick";
  const sweep = type === "sweep";
  const grab = type === "grab";
  const air = type === "airPunch" || type === "airKick";
  const timing = attackTiming(type);
  const flowReady = comboReady || (f.attackRecoverPulse ?? 0) > 2 || (f.comboTimer ?? 0) > 0;
  const chainMax = comboReady ? 14 : flowReady ? 10 : 1;
  f.attack = {
    type,
    frame: 0,
    activeStart: timing.activeStart,
    activeEnd: timing.activeEnd,
    duration: timing.duration,
    damage: grab ? 12 : sweep ? 8 : air ? 9 : heavy ? 11 : 7,
    reach: grab ? 48 : sweep ? 88 : heavy ? 84 : 58,
    height: grab ? 70 : sweep ? 34 : heavy ? 70 : 50,
    hit: false,
    whoosh: false,
  };
  if (comboReady) f.cooldown = 0;
  f.blocking = false;
  f.attackChainFrom = flowReady ? (f.lastAttackType || f.attackChainTo || "") : "";
  f.attackChainTo = type;
  f.attackChainMax = flowReady ? chainMax : 1;
  f.attackChainPulse = flowReady ? chainMax : 0;
  f.attackEntryPulse = Math.max(f.attackEntryPulse ?? 0, Math.round(timing.entry * (flowReady ? 0.58 : 1)));
  f.guardExitPulse = Math.max(f.guardExitPulse ?? 0, (f.guardPulse ?? 0) > 2 ? 8 : 0);
  if (type === "airKick") {
    f.airKickPulse = Math.max(f.airKickPulse ?? 0, timing.duration);
    f.airKickRecoverPulse = Math.max(f.airKickRecoverPulse ?? 0, Math.round(timing.recover * 0.6));
    f.airKickLandingPulse = 0;
    f.airKickDir = f.dir || f.jumpDir || 1;
  }
  if (f.grounded && (heavy || sweep)) {
    const supportSide = sweep ? 1 : -1;
    f.footPlantSide = supportSide;
    f.walkAnchorSide = supportSide;
    f.footPlantPulse = Math.max(f.footPlantPulse ?? 0, heavy ? 12 : 10);
    f.walkAnchorPulse = Math.max(f.walkAnchorPulse ?? 0, heavy ? 14 : 12);
    f.walkPushPulse = Math.max(f.walkPushPulse ?? 0, heavy ? 9 : 7);
  }
  f.cooldown = timing.cooldown;
  playSound(attackStartSound(type), { x: f.x, intensity: flowReady ? 1.1 : air ? 0.92 : heavy || sweep ? 1.08 : 1, key: f.id });
}

function startSpecial(f) {
  if (f.energy < 45 || f.specialCooldown > 0 || f.attack || f.hurt > 16) return;

  const flowReady = (f.attackRecoverPulse ?? 0) > 2 || (f.comboTimer ?? 0) > 0;
  const timing = attackTiming("special");
  f.energy -= 45;
  f.roundSpecials = (f.roundSpecials ?? 0) + 1;
  f.specialReadyCue = f.energy >= 45;
  f.specialReadyPulse = 0;
  f.blocking = false;
  f.attackEntryPulse = Math.max(f.attackEntryPulse ?? 0, Math.round(timing.entry * (flowReady ? 0.56 : 1)));
  f.attackChainFrom = flowReady ? (f.lastAttackType || f.attackChainTo || "") : "";
  f.attackChainTo = "special";
  f.attackChainMax = flowReady ? 12 : 1;
  f.attackChainPulse = flowReady ? 12 : 0;
  f.guardExitPulse = Math.max(f.guardExitPulse ?? 0, (f.guardPulse ?? 0) > 2 ? 8 : 0);
  f.specialCooldown = 66;
  f.cooldown = timing.cooldown;
  f.attack = {
    type: "special",
    frame: 0,
    activeStart: timing.activeStart,
    activeEnd: timing.activeEnd,
    duration: timing.duration,
    damage: 0,
    reach: 0,
    height: 0,
    hit: true,
    whoosh: false,
  };
  triggerDynamicLight(f, f.specialStyle?.rim ?? "#fff1bd", "torso", f.dir, 1.08, 24);
  if (f.profileId === "p1") {
    f.pigMorph = 72;
    coldWaterSplash(f.x, f.y - fighterScale(118), f.dir);
    addText(f.x, f.y - fighterScale(166), "P-CHAN", "#ffe66a");
  }
  specialChargeFX(f);
  triggerCinematicHit(f.dir, f.specialStyle?.rim ?? "#fff1bd", 0.62, 10);
  playSound("special", { x: f.x, intensity: f.profileId === "p1" ? 1.12 : 1, key: f.id });
}

function throwSpecial(f) {
  const style = f.specialStyle ?? SPECIAL_STYLES.p1;
  const projectile = specialProjectileProfile(f.profileId);
  projectiles.push({
    owner: f.id,
    style,
    x: f.x + f.dir * fighterScale(48),
    y: f.y - fighterScale(116),
    baseY: f.y - fighterScale(116),
    vx: f.dir * projectile.speed,
    vy: projectile.vy,
    life: projectile.life,
    maxLife: projectile.life,
    r: fighterScale(projectile.radius),
    damage: projectile.damage,
    color: style.rim,
    profileId: f.profileId,
    dir: f.dir,
    waveAmp: projectile.waveAmp,
    waveRate: projectile.waveRate,
    spinRate: projectile.spinRate,
    pierce: projectile.pierce,
    age: 0,
    trail: [],
  });
  burst(f.x + f.dir * fighterScale(40), f.y - fighterScale(116), style.rim, 12);
  impactGlints(f.x + f.dir * fighterScale(44), f.y - fighterScale(118), style.core, false, true);
  specialReleaseFX(f);
  playSound("specialRelease", { x: f.x, intensity: 1.08, key: f.id });
}

function specialProjectileProfile(profileId) {
  return {
    p1: { speed: 6.9, life: 104, radius: 18, damage: 13, vy: -0.03, waveAmp: 3.2, waveRate: 0.14, spinRate: 0.064, pierce: false },
    p2: { speed: 8.6, life: 82, radius: 13, damage: 11, vy: 0, waveAmp: 8.4, waveRate: 0.22, spinRate: 0.14, pierce: false },
    p3: { speed: 5.9, life: 112, radius: 21, damage: 14, vy: 0.02, waveAmp: 1.6, waveRate: 0.1, spinRate: 0.052, pierce: false },
    p4: { speed: 9.2, life: 76, radius: 12, damage: 10, vy: -0.02, waveAmp: 10.5, waveRate: 0.28, spinRate: 0.18, pierce: false },
    p5: { speed: 7.7, life: 98, radius: 15, damage: 12, vy: -0.08, waveAmp: 5.4, waveRate: 0.16, spinRate: 0.12, pierce: false },
    p6: { speed: 6.4, life: 118, radius: 19, damage: 13, vy: 0.04, waveAmp: 2.2, waveRate: 0.09, spinRate: 0.04, pierce: false },
  }[profileId] ?? { speed: 7.4, life: 92, radius: 16, damage: 12, vy: 0, waveAmp: 4, waveRate: 0.14, spinRate: 0.08, pierce: false };
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

  const chargeCount = fxCount(9, 4);
  for (let i = 0; i < chargeCount; i += 1) {
    const lane = chargeCount === 1 ? 0 : i / (chargeCount - 1) - 0.5;
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
    const dropletCount = fxCount(6, 3);
    for (let i = 0; i < dropletCount; i += 1) {
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

  const releaseCount = fxCount(11, 5);
  for (let i = 0; i < releaseCount; i += 1) {
    const lane = releaseCount === 1 ? 0 : i / (releaseCount - 1) - 0.5;
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

function specialReadyFX(f) {
  const style = fighterSignatureStyle(f);
  const x = f.x;
  const y = f.y - fighterScale(114);
  const dir = f.dir || 1;

  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    angle: dir > 0 ? -0.08 : Math.PI + 0.08,
    life: 24,
    maxLife: 24,
    size: fighterScale(76),
    growth: 2.4,
    color: style.rim,
    kind: "ring",
  });
  particles.push({
    x: x + dir * fighterScale(6),
    y: y - fighterScale(4),
    vx: 0,
    vy: 0,
    angle: dir > 0 ? 0 : Math.PI,
    life: 14,
    maxLife: 14,
    size: fighterScale(42),
    color: style.core,
    core: style.rim,
    kind: "signatureStar",
  });

  const sparkCount = fxCount(12, 5);
  for (let i = 0; i < sparkCount; i += 1) {
    const t = sparkCount === 1 ? 0.5 : i / (sparkCount - 1);
    const angle = -Math.PI * 0.9 + t * Math.PI * 1.8;
    const radius = fighterScale(34 + Math.random() * 22);
    particles.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius * 0.7,
      vx: Math.cos(angle) * 0.34,
      vy: Math.sin(angle) * 0.26 - 0.12,
      angle,
      length: fighterScale(18 + Math.random() * 22),
      life: 16 + Math.random() * 8,
      maxLife: 22,
      size: 2 + Math.random() * 1.8,
      color: i % 2 ? style.core : style.trail,
      kind: i % 3 === 0 ? "glint" : "impactNeedle",
    });
  }
}

function triggerSpecialReady(f) {
  if (!f || f.health <= 0) return;
  f.specialReadyCue = true;
  f.specialReadyPulse = Math.max(f.specialReadyPulse ?? 0, 54);
  const color = f.trim || f.specialStyle?.rim || "#fff1bd";
  triggerDynamicLight(f, color, "torso", f.dir || 1, 0.86, 34);
  specialReadyFX(f);
  addText(f.x, f.y - fighterScale(178), "SPECIAL READY", color, { size: 22, life: 66, rise: 0.42, drift: (f.dir || 1) * 0.04 });
  if (!announcerCue || announcerCue.life < 34) cueAnnouncer("SPECIAL READY", `${f.name} carga su tecnica`, color, 72);
  playSound("specialReady", { x: f.x, intensity: 1.04, key: f.id });
  playDojoReaction("specialReady", { x: f.x, intensity: 0.84, key: f.id });
}

function updateCameraImpactPulse() {
  if (cameraImpactPulse > 0) cameraImpactPulse -= 1;
  else cameraImpactStrength = 0;
  if (cinematicHitPulse > 0) cinematicHitPulse -= 1;
  else {
    cinematicHitStrength = 0;
    cinematicHitZoom = 0.022;
    cinematicHitPan = 6.4;
    cinematicHitLift = 2.6;
    cinematicHitRoll = 0;
    cinematicHitBand = 1;
  }
  if (screenTearPulse > 0) screenTearPulse -= 1;
  else screenTearStrength = 0;
}

function isAttractModeActive() {
  if (running || winner || overlay.classList.contains("hidden")) return false;
  return overlay.dataset.screen === "home" || overlay.dataset.screen === "versus";
}

function makeAttractAttack(type, frame) {
  const timing = attackTiming(type);
  const heavy = type === "kick" || type === "airKick";
  const sweep = type === "sweep";
  const grab = type === "grab";
  const air = type === "airPunch" || type === "airKick";
  return {
    type,
    frame: clamp(frame, 0, timing.duration - 1),
    activeStart: timing.activeStart,
    activeEnd: timing.activeEnd,
    duration: timing.duration,
    damage: grab ? 12 : sweep ? 8 : air ? 9 : heavy ? 11 : 7,
    reach: grab ? 48 : sweep ? 88 : heavy ? 84 : 58,
    height: grab ? 70 : sweep ? 34 : heavy ? 70 : 50,
    hit: true,
    whoosh: true,
  };
}

function updateAttractFighter(f, index) {
  const side = index === 0 ? -1 : 1;
  const facing = index === 0 ? 1 : -1;
  const screen = overlay.dataset.screen;
  const t = attractFrame + index * 52;
  const cycle = t % 360;
  const centerX = W / 2 + side * (screen === "versus" ? 250 : 276);
  const drift = Math.sin(t * 0.018) * (screen === "versus" ? 16 : 28);
  const stance = Math.sin(t * 0.052);
  const walking = cycle < 106 || (cycle > 274 && cycle < 326);
  const bracing = cycle >= 172 && cycle < 230;
  const special = cycle >= 230 && cycle < 274;
  const attackType = special ? "special" : index === 0 ? (cycle < 142 ? "punch" : "kick") : (cycle < 142 ? "kick" : "punch");
  const attackStart = special ? 230 : 106;
  const attackFrame = cycle >= attackStart && cycle < attackStart + attackTiming(attackType).duration
    ? cycle - attackStart
    : -1;

  f.x = clamp(centerX + drift, FIGHTER_EDGE_PAD + 32, W - FIGHTER_EDGE_PAD - 32);
  f.y = FLOOR;
  f.dir = facing;
  f.vx = walking ? facing * (0.76 + Math.abs(stance) * 0.58) : 0;
  f.vy = 0;
  f.grounded = true;
  f.health = 100;
  f.healthLag = 100;
  f.energy = special ? 98 : 72 + Math.sin(t * 0.021) * 8;
  f.blocking = bracing;
  f.crouch += ((bracing ? 0.74 : 0) - f.crouch) * 0.16;
  f.hurt = 0;
  f.cooldown = 0;
  f.specialCooldown = 0;
  f.attack = attackFrame >= 0 ? makeAttractAttack(attackType, attackFrame) : null;
  f.attackEntryPulse = f.attack ? Math.max(f.attackEntryPulse ?? 0, 10) : Math.max(0, (f.attackEntryPulse ?? 0) - 1);
  f.attackRecoverPulse = f.attack ? 0 : Math.max(0, (f.attackRecoverPulse ?? 0) - 1);
  f.attackChainPulse = f.attack ? Math.max(f.attackChainPulse ?? 0, 8) : Math.max(0, (f.attackChainPulse ?? 0) - 1);
  f.attackChainMax = Math.max(f.attackChainMax ?? 1, 8);
  f.attackChainFrom = f.attack ? (special ? "kick" : "") : "";
  f.attackChainTo = f.attack?.type ?? "";
  f.guardPulse = bracing ? Math.min(18, (f.guardPulse ?? 0) + 1) : (f.guardPulse ?? 0) * 0.74;
  f.guardEntryPulse = bracing ? Math.max(f.guardEntryPulse ?? 0, 8) : Math.max(0, (f.guardEntryPulse ?? 0) - 1);
  f.guardExitPulse = bracing ? 0 : Math.max(0, (f.guardExitPulse ?? 0) - 1);
  f.specialReadyPulse = special ? Math.max(f.specialReadyPulse ?? 0, 40) : Math.max(0, (f.specialReadyPulse ?? 0) - 1);
  f.dynamicLightPulse = special ? Math.max(f.dynamicLightPulse ?? 0, 24) : Math.max(0, (f.dynamicLightPulse ?? 0) - 1);
  f.dynamicLightMax = Math.max(f.dynamicLightMax ?? 1, special ? 24 : 12);
  f.dynamicLightColor = special ? (f.specialStyle?.rim ?? f.trim) : f.trim;
  f.dynamicLightZone = special ? "torso" : "head";
  f.dynamicLightDir = f.dir;
  f.dynamicLightStrength = special ? 0.86 : 0.34;
  f.bracePulse = bracing ? Math.max(f.bracePulse ?? 0, 12) : Math.max(0, (f.bracePulse ?? 0) - 1);
  f.moveIntent = walking ? f.dir : 0;
  f.rangePressure = bracing ? 0.6 : 0.18 + Math.abs(stance) * 0.18;
  f.rangeSide = f.dir;
  f.comboCount = 0;
  f.comboTimer = 0;
  f.comboPulse = 0;
  f.pigMorph = 0;
  f.koFall = 0;
  f.victoryPulse = cycle > 326 ? Math.max(f.victoryPulse ?? 0, 34) : Math.max(0, (f.victoryPulse ?? 0) - 1);

  if (walking) {
    f.walkCycle = (f.walkCycle ?? 0) + f.dir * 0.16;
    const stride = Math.sin(f.walkCycle);
    f.walkStrideSmooth = stride;
    f.walkPlant = smoothStep01(Math.abs(Math.cos(f.walkCycle)));
    f.walkSwing = Math.abs(stride);
    f.walkWeight = 0.56 + Math.abs(stance) * 0.18;
    f.footPlantPulse = Math.max(f.footPlantPulse ?? 0, 5);
    f.walkAnchorPulse = Math.max(f.walkAnchorPulse ?? 0, 7);
    f.walkPushPulse = Math.max(f.walkPushPulse ?? 0, 5);
  } else {
    f.walkWeight = (f.walkWeight ?? 0) * 0.84;
    f.walkPlant = (f.walkPlant ?? 0) * 0.72;
    f.walkSwing = (f.walkSwing ?? 0) * 0.72;
    f.walkStrideSmooth = (f.walkStrideSmooth ?? 0) * 0.72;
  }

  updatePoseTransition(f);
}

function updateAttractMode() {
  if (!isAttractModeActive()) return;
  attractFrame += 1;
  roundFrame += 1;
  for (let i = 0; i < fighters.length; i += 1) updateAttractFighter(fighters[i], i);
  cameraZoom += (1.055 - cameraZoom) * 0.06;
  cameraPan += (Math.sin(attractFrame * 0.012) * 10 - cameraPan) * 0.04;
  cameraLift += (5 + Math.sin(attractFrame * 0.018) * 3 - cameraLift) * 0.06;
  playAttractMusicTick();

  if (attractFrame % 54 === 0 && particles.length < particleBudget() * 0.45) {
    const f = fighters[(attractFrame / 54) % 2 | 0];
    addText(f.x, FLOOR - 188, fighterPresentation(f).signature.toUpperCase(), f.trim, {
      size: 17,
      life: 58,
      rise: 0.22,
      drift: -f.dir * 0.05,
    });
  }
}

function decisionWinnerByTimer(a, b) {
  const healthGap = (a.health ?? 0) - (b.health ?? 0);
  if (Math.abs(healthGap) >= 0.5) return healthGap > 0 ? a : b;

  const energyGap = (a.energy ?? 0) - (b.energy ?? 0);
  if (Math.abs(energyGap) >= 0.5) return energyGap > 0 ? a : b;

  const centerGap = Math.abs(W / 2 - a.x) - Math.abs(W / 2 - b.x);
  return centerGap <= 0 ? a : b;
}

function finishTechniqueLabel(fighter, timeOver) {
  if (timeOver) return "DECISION";
  const last = fighter?.lastAttackType ?? "";
  if (last === "special") return "TECNICA FINAL";
  if (last === "kick" || last === "airKick" || last === "sweep") return "REMATE DE PIERNA";
  if (last === "grab") return "DERRIBO FINAL";
  if (last === "punch" || last === "airPunch") return "GOLPE FINAL";
  return "REMATE FINAL";
}

function triggerFinishFreezeCue(winnerFighter, loserFighter, timeOver, impactDir) {
  if (!winnerFighter || !loserFighter) return;
  const presentation = fighterPresentation(winnerFighter);
  finishFreezeCue = {
    winnerId: winnerFighter.id,
    loserId: loserFighter.id,
    title: timeOver ? "TIME OVER" : matchOver ? "MATCH CERRADO" : "ROUND CERRADO",
    label: finishTechniqueLabel(winnerFighter, timeOver),
    detail: timeOver ? "Control del tatami" : presentation.signature,
    color: winnerFighter.trim || "#fff1bd",
    loserColor: loserFighter.trim || "#75f0cb",
    dir: impactDir || winnerFighter.dir || 1,
    startFrame: resultFrame,
    maxLife: timeOver ? 76 : matchOver ? 96 : 84,
  };
}

function finishRound(winnerFighter, loserFighter, options = {}) {
  if (!winnerFighter || !loserFighter || winner) return;
  const timeOver = Boolean(options.timeOver);
  const finalRound = Boolean(options.finalRound);
  const impactDir = timeOver ? winnerFighter.dir || (winnerFighter.x <= loserFighter.x ? 1 : -1) : loserFighter.koFallDir || loserFighter.impactDir || winnerFighter.dir || 1;

  winner = winnerFighter.name;
  roundWinnerId = winnerFighter.id;
  roundFinishKind = timeOver ? "time" : "ko";
  winnerFighter.wins += 1;
  matchOver = winnerFighter.wins >= 2;
  if (matchOver) matchWinnerId = winnerFighter.id;
  running = false;
  koFreeze = timeOver ? 24 : matchOver ? 34 : 28;
  resultFrame = 0;

  if (timeOver) {
    loserFighter.hurt = Math.max(loserFighter.hurt ?? 0, 18);
    loserFighter.impactPulse = Math.max(loserFighter.impactPulse ?? 0, 15);
    loserFighter.impactDir = -impactDir;
    loserFighter.impactStrength = Math.max(loserFighter.impactStrength ?? 0, 0.82);
    loserFighter.damagePulse = Math.max(loserFighter.damagePulse ?? 0, 24);
    loserFighter.damageLevel = Math.max(loserFighter.damageLevel ?? 0, 0.95);
    loserFighter.reactionPulse = Math.max(loserFighter.reactionPulse ?? 0, 26);
    loserFighter.reactionMax = Math.max(loserFighter.reactionMax ?? 1, 26);
    loserFighter.reactionKind = "heavy";
    loserFighter.reactionStrength = Math.max(loserFighter.reactionStrength ?? 0, 1.05);
    loserFighter.bracePulse = Math.max(loserFighter.bracePulse ?? 0, 16);
    winnerFighter.victoryPulse = matchOver ? 102 : 82;
    winnerFighter.bracePulse = Math.max(winnerFighter.bracePulse ?? 0, 16);
    shake = Math.max(shake, matchOver ? 14 : 10);
    flash = Math.max(flash, matchOver ? 16 : 12);
    addText(W / 2, 132, "TIME OVER", "#fff1bd", { size: 34, life: 82, rise: 0.18 });
    addText(winnerFighter.x, winnerFighter.y - 186, matchOver ? "MATCH" : "DECISION", winnerFighter.trim || "#ffd44d", { size: 24, life: 72, rise: 0.34 });
    cueAnnouncer("TIME OVER", `${winnerFighter.name} gana por decision`, winnerFighter.trim || "#fff1bd", matchOver ? 108 : 92);
    triggerCameraImpact(impactDir, false, true, false, matchOver ? 1.24 : 1.04, {
      cameraPulse: matchOver ? 20 : 16,
      cameraStrength: matchOver ? 1.24 : 1.04,
    });
    triggerCinematicHit(impactDir, winnerFighter.trim || "#fff1bd", matchOver ? 1.2 : 1, matchOver ? 22 : 18, {
      zoom: matchOver ? 0.044 : 0.034,
      pan: matchOver ? 11.4 : 8.6,
      lift: matchOver ? 4.5 : 3.4,
      roll: matchOver ? 0.008 : 0.006,
      band: matchOver ? 1.18 : 1,
    });
    triggerScreenTear(impactDir, winnerFighter.trim || "#fff1bd", matchOver ? 1.02 : 0.78, matchOver ? 16 : 12);
    playSound("timeOver", { intensity: matchOver ? 1.08 : 0.96, key: `time:${roundNumber}` });
    playDojoReaction(matchOver ? "finish" : "decision", {
      x: winnerFighter.x,
      intensity: matchOver ? 1.04 : 0.88,
      key: `time:${roundNumber}:${winnerFighter.id}`,
    });
  } else {
    loserFighter.koFall = Math.max(loserFighter.koFall ?? 0, matchOver ? 118 : 104);
    loserFighter.koFallDir = loserFighter.impactDir || winnerFighter.dir || 1;
    loserFighter.koFallStrength = Math.max(loserFighter.koFallStrength ?? 0, (loserFighter.impactStrength ?? 1) + (matchOver ? 0.38 : 0.24));
    loserFighter.damagePulse = Math.max(loserFighter.damagePulse ?? 0, matchOver ? 44 : 38);
    loserFighter.damageLevel = Math.max(loserFighter.damageLevel ?? 0, matchOver ? 1.86 : 1.68);
    loserFighter.reactionPulse = Math.max(loserFighter.reactionPulse ?? 0, matchOver ? 42 : 36);
    loserFighter.reactionMax = Math.max(loserFighter.reactionMax ?? 1, matchOver ? 42 : 36);
    loserFighter.reactionKind = "finish";
    loserFighter.reactionStrength = Math.max(loserFighter.reactionStrength ?? 0, matchOver ? 1.9 : 1.72);
    winnerFighter.victoryPulse = matchOver ? 104 : 88;
    shake = Math.max(shake, matchOver ? 22 : 18);
    flash = Math.max(flash, matchOver ? 22 : 18);
    addText(loserFighter.x, loserFighter.y - 162, matchOver ? "FINAL K.O." : "K.O.", "#fff1bd", { size: matchOver ? 34 : 30, life: 76, rise: 0.34 });
    addText(winnerFighter.x, winnerFighter.y - 190, matchOver ? "MATCH" : "ROUND", "#fff1bd", { size: 24, life: 68, rise: 0.42 });
    cueAnnouncer(matchOver ? "FINAL K.O." : "K.O.", `${winnerFighter.name} gana ${matchOver ? "el match" : `round ${toRoman(roundNumber)}`}`, winnerFighter.trim || "#fff1bd", matchOver ? 112 : 92);
    triggerCameraImpact(loserFighter.koFallDir, false, true, false, matchOver ? 1.95 : 1.72, {
      cameraPulse: matchOver ? 26 : 22,
      cameraStrength: matchOver ? 1.95 : 1.72,
    });
    triggerCinematicHit(loserFighter.koFallDir, loserFighter.trim || "#fff1bd", matchOver ? 1.84 : 1.58, matchOver ? 28 : 24, {
      zoom: matchOver ? 0.07 : 0.06,
      pan: matchOver ? 15.5 : 13.4,
      lift: matchOver ? 6.2 : 5.4,
      roll: matchOver ? 0.014 : 0.011,
      band: matchOver ? 1.58 : 1.38,
    });
    triggerScreenTear(loserFighter.koFallDir, winnerFighter.trim || "#fff1bd", matchOver ? 1.68 : 1.34, matchOver ? 24 : 18);
    koCollapseFX(loserFighter, winnerFighter);
    playSound(matchOver ? tournamentActive && winnerFighter.id !== "right" ? "lose" : "victory" : "ko");
    playDojoReaction("finish", {
      x: loserFighter.x,
      intensity: matchOver ? 1.18 : 1.02,
      key: `ko:${roundNumber}:${winnerFighter.id}`,
    });
  }

  triggerFinishFreezeCue(winnerFighter, loserFighter, timeOver, impactDir);
  if (finalRound) roundTimerFrames = 0;
  if (matchOver) scheduleWinnerOverlay();
  else scheduleNextRound();
  sendOnlineSnapshot(true);
}

function update() {
  tickOnlineHeartbeat();
  if (onlineGuestActive()) {
    updateOnlineGuestView();
    return;
  }

  if (hitStopFrames > 0) {
    hitStopFrames -= 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    updateAnnouncerCue();
    sendOnlineSnapshot(false);
    return;
  }

  if (koFreeze > 0) {
    koFreeze -= 1;
    if (winner) resultFrame += 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    updateAnnouncerCue();
    sendOnlineSnapshot(false);
    return;
  }

  if (!running) {
    updateAttractMode();
    if (winner) resultFrame += 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    updateAnnouncerCue();
    sendOnlineSnapshot(false);
    return;
  }

  if (paused) return;
  if (countdownFrames > 0) {
    if (countdownFrames === 133 || countdownFrames === 85) {
      const side = countdownFrames === 133 ? -1 : 1;
      playSound("countdownTick", { intensity: countdownFrames === 133 ? 0.92 : 1.02, pan: side * 0.08, key: `${roundNumber}:${countdownFrames}` });
      triggerScreenTear(side, countdownFrames === 133 ? fighters[0].trim : fighters[1].trim, 0.28, 7);
      fighters.forEach((fighter) => {
        fighter.bracePulse = Math.max(fighter.bracePulse ?? 0, 12);
      });
    }
    if (countdownFrames === 37) {
      cueAnnouncer("FIGHT", "El tatami queda abierto", "#ffd44d", 58);
      playSound("fightStart", { intensity: 1.08, key: `fight:${roundNumber}` });
      triggerCinematicHit(1, "#ffd44d", 0.72, 16, {
        zoom: 0.026,
        pan: 6.2,
        lift: 2.2,
        roll: 0.003,
        band: 0.82,
      });
      triggerScreenTear(1, "#ffd44d", 0.62, 12);
      fighters.forEach((fighter) => {
        fighter.bracePulse = Math.max(fighter.bracePulse ?? 0, 18);
        triggerDynamicLight(fighter, fighter.trim || "#fff1bd", "torso", fighter.dir || 1, 0.6, 32);
      });
    }
    countdownFrames -= 1;
    updateCameraImpactPulse();
    updateParticles();
    updateFloatingTexts();
    updateAnnouncerCue();
    sendOnlineSnapshot(false);
    return;
  }

  roundFrame += 1;
  playMusicTick();
  playMusicDirectorTick();
  playStageAmbienceTick();
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
  updateAnnouncerCue();
  updateMomentumHud();
  triggerCriticalHealthCues();

  if (!winner && roundTimerFrames > 0) {
    roundTimerFrames -= 1;
    if (roundTimerFrames === 10 * 60) {
      cueAnnouncer("10", "El tiempo se acaba", "#ffd44d", 58);
      playSound("danger", { intensity: 0.92, key: `timer:${roundNumber}:10` });
    } else if (roundTimerFrames > 0 && roundTimerFrames <= 5 * 60 && roundTimerFrames % 60 === 0) {
      const seconds = Math.ceil(roundTimerFrames / 60);
      cueAnnouncer(String(seconds), "Cuenta final", "#ffd44d", 42);
      playSound("danger", { intensity: 0.78 + (5 - seconds) * 0.05, key: `timer:${roundNumber}:${seconds}` });
    }
  }
  updateFinalPressureCues();

  if (!winner && (a.health <= 0 || b.health <= 0)) {
    const winnerFighter = a.health > b.health ? a : b;
    const loserFighter = winnerFighter === a ? b : a;
    finishRound(winnerFighter, loserFighter);
  } else if (!winner && roundTimerFrames <= 0) {
    const winnerFighter = decisionWinnerByTimer(a, b);
    const loserFighter = winnerFighter === a ? b : a;
    finishRound(winnerFighter, loserFighter, { timeOver: true, finalRound: true });
  }

  if (flash > 0) flash -= 1;
  if (shake > 0) shake -= 1;
  updateCameraImpactPulse();
  updateAnnouncerCue();
  sendOnlineSnapshot(false);
}

function updateFighter(f, opponent) {
  const input = inputFor(f);
  const wantSpecial = input.special;
  const wantBlock = input.block && f.grounded && !f.attack && !wantSpecial;
  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const baseSpeed = wantBlock ? 1.2 : 3.35;
  const wasGrounded = f.grounded;
  const wasBlocking = f.blocking;
  const wasHurt = f.hurt > 0;
  const previousMoveIntent = f.moveIntent ?? 0;
  const previousVx = f.vx ?? 0;
  const opponentDir = opponent ? Math.sign(opponent.x - f.x) || f.dir : f.dir;
  const distance = opponent ? Math.abs(opponent.x - f.x) : 999;
  const movingTowardOpponent = move !== 0 && move === opponentDir;
  const rangeTarget = f.grounded && f.hurt <= 0 && !f.attack
    ? clamp((fighterScale(128) - distance) / fighterScale(58), 0, 1)
    : 0;
  f.rangePressure = (f.rangePressure ?? 0) + (rangeTarget - (f.rangePressure ?? 0)) * 0.22;
  f.rangeSide = opponentDir;
  const entryBrake = movingTowardOpponent ? 1 - (f.rangePressure ?? 0) * 0.48 : 1;
  const speed = baseSpeed * entryBrake;

  f.moveIntent = move;
  f.blocking = wantBlock;
  if (f.grounded && f.hurt <= 0 && !f.attack && previousMoveIntent !== move) {
    f.moveTurnPulse = Math.max(f.moveTurnPulse ?? 0, move === 0 ? 7 : previousMoveIntent === 0 ? 8 : 10);
  }
  if (wantBlock && !wasBlocking) f.guardEntryPulse = Math.max(f.guardEntryPulse ?? 0, 12);
  if (!wantBlock && wasBlocking) f.guardExitPulse = Math.max(f.guardExitPulse ?? 0, 10);
  f.crouch += ((wantBlock ? 1 : 0) - f.crouch) * 0.18;
  if (f.counterWindow > 0) f.counterWindow -= 1;
  if (f.comboWindow > 0) f.comboWindow -= 1;
  if (f.comboPulse > 0) f.comboPulse -= 1;
  if (f.specialReadyPulse > 0) f.specialReadyPulse -= 1;
  if (f.comboTimer > 0) {
    f.comboTimer -= 1;
    if (f.comboTimer <= 0) {
      f.comboCount = 0;
      f.comboDamage = 0;
      f.comboTargetId = "";
    }
  }
  if (f.hitFlash > 0) f.hitFlash -= 1;
  if (f.contactFlash > 0) f.contactFlash -= 1;
  if (f.impactPulse > 0) f.impactPulse -= 1;
  if (f.dynamicLightPulse > 0) f.dynamicLightPulse -= 1;
  if (f.damagePulse > 0) f.damagePulse -= 1;
  if (f.hitZonePulse > 0) f.hitZonePulse -= 1;
  if (f.faceImpactPulse > 0) f.faceImpactPulse -= 1;
  if (f.reactionPulse > 0) f.reactionPulse -= 1;
  if (f.victoryPulse > 0) f.victoryPulse -= 1;
  if (f.guardImpact > 0) f.guardImpact -= 1;
  if (f.guardEntryPulse > 0) f.guardEntryPulse -= 1;
  if (f.guardExitPulse > 0) f.guardExitPulse -= 1;
  if (f.staggerPulse > 0) f.staggerPulse -= 1;
  if (f.attackEntryPulse > 0) f.attackEntryPulse -= 1;
  if (f.attackRecoverPulse > 0) f.attackRecoverPulse -= 1;
  if (f.attackChainPulse > 0) f.attackChainPulse -= 1;
  if (f.hurtRecoverPulse > 0) f.hurtRecoverPulse -= 1;
  if (f.moveTurnPulse > 0) f.moveTurnPulse -= 1;
  if (f.jumpPulse > 0) f.jumpPulse -= 1;
  if (f.jumpStrength > 0) f.jumpStrength *= 0.9;
  if (f.landingPulse > 0) f.landingPulse -= 1;
  if ((f.landingPulse ?? 0) <= 0 && f.landingStrength > 0) f.landingStrength *= 0.84;
  if (f.airKickPulse > 0) f.airKickPulse -= 1;
  if (f.airKickRecoverPulse > 0) f.airKickRecoverPulse -= 1;
  if (f.airKickLandingPulse > 0) f.airKickLandingPulse -= 1;
  if (f.stepPulse > 0) f.stepPulse -= 1;
  if (f.stepCooldown > 0) f.stepCooldown -= 1;
  if (f.footPlantPulse > 0) f.footPlantPulse -= 1;
  if (f.footPlantCooldown > 0) f.footPlantCooldown -= 1;
  if (f.walkAnchorPulse > 0) f.walkAnchorPulse = Math.max(0, f.walkAnchorPulse - 1);
  if (f.walkPushPulse > 0) f.walkPushPulse = Math.max(0, f.walkPushPulse - 1);
  if (f.walkStopPulse > 0) f.walkStopPulse = Math.max(0, f.walkStopPulse - 1);
  if (f.walkStopSpeed > 0) f.walkStopSpeed *= 0.88;
  if (f.bracePulse > 0) f.bracePulse -= 1;
  if (f.pigMorph > 0) f.pigMorph -= 1;
  f.guardPulse = f.blocking ? Math.min(18, (f.guardPulse ?? 0) + 1) : (f.guardPulse ?? 0) * 0.72;

  if (f.hurt > 0) {
    f.hurt -= 1;
    f.vx *= 0.88;
    if (wasHurt && f.hurt <= 0) f.hurtRecoverPulse = Math.max(f.hurtRecoverPulse ?? 0, 14);
  } else {
    const airControl = f.grounded ? 1 : 0.82;
    const targetVx = move * speed * airControl;
    if (f.grounded) {
      const stopSpeed = clamp(Math.abs(previousVx) / 3.35, 0, 1.45);
      const changedDirection = previousMoveIntent !== 0 && move !== 0 && previousMoveIntent !== move;
      const releasedMove = previousMoveIntent !== 0 && move === 0;
      if ((changedDirection || releasedMove) && stopSpeed > 0.2) {
        const stopDir = Math.sign(previousVx) || previousMoveIntent || f.dir || 1;
        f.walkStopPulse = Math.max(f.walkStopPulse ?? 0, Math.round(8 + stopSpeed * 8));
        f.walkStopDir = stopDir;
        f.walkStopSpeed = Math.max(f.walkStopSpeed ?? 0, stopSpeed);
        f.footPlantPulse = Math.max(f.footPlantPulse ?? 0, Math.round(6 + stopSpeed * 4));
        f.walkAnchorPulse = Math.max(f.walkAnchorPulse ?? 0, Math.round(7 + stopSpeed * 5));
        f.stepPulse = Math.max(f.stepPulse ?? 0, Math.round(5 + stopSpeed * 3));
      }
      const acceleration = move === 0
        ? 0.34 + stopSpeed * 0.1
        : 0.34 + (changedDirection ? 0.1 : 0);
      f.vx += (targetVx - f.vx) * acceleration;
      if (move === 0 && Math.abs(f.vx) < 0.04) f.vx = 0;
    } else {
      f.vx += (targetVx - f.vx) * 0.16;
    }
    if (f.grounded && movingTowardOpponent && Math.sign(f.vx) === move && (f.rangePressure ?? 0) > 0.05) {
      f.vx *= 1 - (f.rangePressure ?? 0) * 0.13;
      f.bracePulse = Math.max(f.bracePulse ?? 0, Math.round(5 + (f.rangePressure ?? 0) * 8));
    }
  }

  if (input.jump && f.grounded && !wantBlock && f.hurt <= 0) {
    const style = characterMotion(f);
    const jumpIntent = clamp((Math.abs(f.vx) + Math.abs(move) * speed) / 4.4, 0, 1.25);
    f.vy = -13.1;
    f.grounded = false;
    f.jumpPulse = 12;
    f.jumpStrength = clamp(0.78 + jumpIntent * 0.22 + (style.walkLift ?? 1) * 0.1, 0.7, 1.36);
    f.landingPulse = 0;
    f.landingStrength = 0;
    f.jumpDir = move || Math.sign(f.vx) || f.dir;
    f.walkWeight *= 0.55;
    f.walkStopPulse = 0;
    f.footPlantPulse = Math.max(f.footPlantPulse ?? 0, 9);
    f.walkAnchorPulse = Math.max(f.walkAnchorPulse ?? 0, 8);
    f.walkPushPulse = Math.max(f.walkPushPulse ?? 0, 7);
    movementDust(f.x - f.dir * fighterScale(8), FLOOR + 4, -f.dir, 0.9, 5);
    playSound("jump", { x: f.x, intensity: f.jumpStrength, key: f.id });
  }

  maybeStartOnlineRemoteAction(f, input);

  if (cpuEnabled && f.id === cpuFighterId) {
    if (wantSpecial) startSpecial(f);
    else if (input.grab) startAttack(f, "grab");
    else if (input.kick && input.block) startAttack(f, "sweep");
    else if (input.punch) startAttack(f, f.grounded ? "punch" : "airPunch");
    else if (input.kick) startAttack(f, f.grounded ? "kick" : "airKick");
  }

  f.x += f.vx;
  f.y += f.vy;
  const landingSpeed = f.vy;
  f.vy += GRAVITY;

  if (f.y >= FLOOR) {
    f.y = FLOOR;
    f.vy = 0;
    f.airFrames = 0;
    if (!wasGrounded && landingSpeed > 2.1) {
      const fromAirKick = (f.airKickPulse ?? 0) > 0 || (f.airKickRecoverPulse ?? 0) > 0 || f.attack?.type === "airKick";
      const landingStrength = clamp(landingSpeed / 11.5, 0.34, 1.5) * (characterMotion(f).walkWeight ?? 1) * (fromAirKick ? 1.16 : 1);
      f.landingPulse = Math.min(16, 7 + landingSpeed * (fromAirKick ? 0.66 : 0.56));
      f.landingStrength = Math.max(f.landingStrength ?? 0, landingStrength);
      f.stepPulse = Math.max(f.stepPulse, 6);
      f.landingDir = Math.sign(f.vx) || f.jumpDir || f.dir;
      if (fromAirKick) {
        f.airKickLandingPulse = Math.max(f.airKickLandingPulse ?? 0, Math.round(9 + landingStrength * 5));
        f.airKickDir = f.dir || f.jumpDir || f.landingDir || 1;
        f.airKickRecoverPulse = 0;
      }
      f.walkWeight = Math.max(f.walkWeight ?? 0, clamp(landingSpeed / 13, 0.18, 0.58));
      f.footPlantPulse = Math.max(f.footPlantPulse ?? 0, Math.round(8 + landingStrength * 4));
      f.walkAnchorPulse = Math.max(f.walkAnchorPulse ?? 0, Math.round(9 + landingStrength * 5));
      if (Math.abs(f.vx) > 0.55) {
        f.walkStopPulse = Math.max(f.walkStopPulse ?? 0, Math.round(6 + landingStrength * 5));
        f.walkStopDir = Math.sign(f.vx) || f.landingDir || f.dir;
        f.walkStopSpeed = Math.max(f.walkStopSpeed ?? 0, clamp(Math.abs(f.vx) / 3.35, 0, 1.15) * landingStrength);
      }
      movementDust(f.x, FLOOR + 5, f.vx >= 0 ? -1 : 1, clamp(landingSpeed / 8, 0.65, 1.45), landingSpeed > 7 ? 10 : 7);
      playSound(fromAirKick || landingStrength > 1 ? "landHeavy" : "land", { x: f.x, intensity: landingStrength, key: f.id });
    }
    f.grounded = true;
  } else {
    f.airFrames += 1;
  }

  f.x = clamp(f.x, FIGHTER_EDGE_PAD, W - FIGHTER_EDGE_PAD);
  const walkSpeed = clamp(Math.abs(f.vx) / baseSpeed, 0, 1.25);
  const walkingNow = f.grounded && f.hurt <= 0 && !f.attack && Math.abs(f.vx) > 0.35;
  if (walkingNow) {
    const style = characterMotion(f);
    const cycleDir = Math.sign(f.vx) || f.dir;
    const pace = 0.13 + walkSpeed * (0.15 + (style.walkLift ?? 1) * 0.015);
    f.walkCycle = (f.walkCycle ?? 0) + cycleDir * pace;
    const strideNow = Math.sin(f.walkCycle);
    const plantRaw = Math.abs(Math.cos(f.walkCycle));
    const plantNow = smoothStep01(plantRaw);
    const swingNow = Math.abs(strideNow);
    const plantSide = strideNow >= 0 ? 1 : -1;
    const weightTarget = walkSpeed * (0.74 + plantNow * 0.22) * (style.walkWeight ?? 1);
    f.walkWeight = (f.walkWeight ?? 0) + (weightTarget - (f.walkWeight ?? 0)) * 0.2;
    f.walkStrideSmooth = (f.walkStrideSmooth ?? 0) + (strideNow - (f.walkStrideSmooth ?? 0)) * 0.45;
    f.walkPlant = (f.walkPlant ?? 0) + (plantNow - (f.walkPlant ?? 0)) * 0.42;
    f.walkSwing = (f.walkSwing ?? 0) + (swingNow - (f.walkSwing ?? 0)) * 0.36;
    if (plantNow > 0.88 && f.footPlantCooldown <= 0 && f.footPlantSide !== plantSide) {
      f.footPlantSide = plantSide;
      f.walkAnchorSide = plantSide;
      f.footPlantPulse = Math.round(9 + (style.walkWeight ?? 1) * 2);
      f.footPlantCooldown = Math.round(8 + (style.walkLift ?? 1) * 2);
      f.walkAnchorPulse = Math.round(11 + (style.walkWeight ?? 1) * 3);
      f.walkPushPulse = Math.round(8 + (style.walkPush ?? 1) * 2);
      f.stepPulse = Math.max(f.stepPulse ?? 0, 7);
      if (walkSpeed > 0.48) playSound("step", { x: f.x, intensity: clamp(walkSpeed * (style.walkWeight ?? 1), 0.45, 1.28), key: f.id });
    }
  } else {
    f.walkWeight = (f.walkWeight ?? 0) * 0.86;
    f.walkPlant = (f.walkPlant ?? 0) * 0.72;
    f.walkSwing = (f.walkSwing ?? 0) * 0.72;
    f.walkStrideSmooth = (f.walkStrideSmooth ?? 0) * 0.72;
    f.walkAnchorPulse = (f.walkAnchorPulse ?? 0) * 0.75;
    f.walkPushPulse = (f.walkPushPulse ?? 0) * 0.75;
  }

  if (f.grounded && f.hurt <= 0 && !f.attack && Math.abs(f.vx) > 1.25) {
    const cadence = Math.max(5, Math.round(12 - Math.abs(f.vx) * 1.6));
    if (f.stepCooldown <= 0) {
      f.stepCooldown = cadence;
      f.stepPulse = 7;
      movementDust(f.x - Math.sign(f.vx) * fighterScale(22), FLOOR + 4, -Math.sign(f.vx), clamp(Math.abs(f.vx) / 3.5, 0.5, 1), 3);
      playSound("step", { x: f.x, intensity: clamp(Math.abs(f.vx) / 3.35, 0.45, 1.25), key: f.id });
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
    if (f.attack.frame >= f.attack.duration) {
      const endedType = f.attack.type;
      const timing = attackTiming(endedType);
      f.attackRecoverPulse = Math.max(f.attackRecoverPulse ?? 0, timing.recover);
      if (endedType === "airKick") {
        f.airKickRecoverPulse = Math.max(f.airKickRecoverPulse ?? 0, Math.round(timing.recover * 1.35));
        f.airKickDir = f.dir || f.jumpDir || 1;
      }
      const recoveryCooldown = Math.max(
        4,
        Math.round(timing.recover * (endedType === "special" ? 0.62 : endedType === "kick" || endedType === "airKick" || endedType === "sweep" ? 0.54 : 0.48))
      );
      f.cooldown = Math.max(f.cooldown ?? 0, recoveryCooldown);
      f.lastAttackType = endedType;
      f.attackChainFrom = endedType;
      f.attack = null;
    }
  }

  updatePoseTransition(f);
  f.energy = clamp(f.energy + 0.045 + (Math.abs(f.vx) > 1 ? 0.012 : 0), 0, 100);
  if (f.energy < 45) f.specialReadyCue = false;
  else if (!f.specialReadyCue && !winner && running && countdownFrames <= 0) triggerSpecialReady(f);
}

function updateProjectiles() {
  for (const p of projectiles) {
    p.trail.push({ x: p.x, y: p.y });
    const trailLimit = p.profileId === "p3" || p.profileId === "p6" ? 11 : p.profileId === "p2" || p.profileId === "p4" ? 7 : 9;
    if (p.trail.length > trailLimit) p.trail.shift();
    p.age = (p.age ?? 0) + 1;
    p.x += p.vx;
    p.baseY = (p.baseY ?? p.y) + (p.vy ?? 0);
    if (p.waveAmp) p.y = p.baseY + Math.sin((p.age ?? 0) * (p.waveRate ?? 0.14)) * p.waveAmp;
    else p.y += p.vy ?? 0;
    p.life -= 1;

    const target = fighters.find((f) => f.id !== p.owner);
    if (target && p.life > 0 && circleRectOverlap(p, bodyBox(target))) {
      const owner = fighters.find((f) => f.id === p.owner);
      landHit(owner, target, p.damage, true, p);
      if (p.pierce) p.damage = Math.max(6, p.damage - 4);
      else p.life = 0;
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
    const pressure = clamp(overlap / fighterScale(44), 0, 1);
    const push = Math.min(overlap / 2, fighterScale(7 + pressure * 9));
    if (a.x < b.x) {
      a.x -= push;
      b.x += push;
      if (a.vx > 0) a.vx *= 1 - pressure * 0.28;
      if (b.vx < 0) b.vx *= 1 - pressure * 0.28;
      a.rangeSide = 1;
      b.rangeSide = -1;
    } else {
      a.x += push;
      b.x -= push;
      if (a.vx < 0) a.vx *= 1 - pressure * 0.28;
      if (b.vx > 0) b.vx *= 1 - pressure * 0.28;
      a.rangeSide = -1;
      b.rangeSide = 1;
    }
    a.rangePressure = Math.max(a.rangePressure ?? 0, pressure);
    b.rangePressure = Math.max(b.rangePressure ?? 0, pressure);
    a.bracePulse = Math.max(a.bracePulse ?? 0, Math.round(6 + pressure * 9));
    b.bracePulse = Math.max(b.bracePulse ?? 0, Math.round(6 + pressure * 9));
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
      vx: finishingHit ? 9.25 : projectile ? 6.7 : heavyImpact ? 7.75 : 6.35,
      vy: finishingHit ? -6.05 : projectile ? -4.05 : heavyImpact ? -5.15 : -4.35,
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
      vx: finishingHit ? 9.05 : heavyImpact ? 8.05 : 6.45,
      vy: finishingHit ? -4.65 : heavyImpact ? -3.0 : -2.35,
      damageBonus: 0.1,
      pulse: finishingHit ? 32 : 24,
      dust: heavyImpact ? 13 : 10,
    };
  }

  return {
    yOffset: projectile ? 108 : heavyImpact ? 90 : 96,
    hurtBonus: heavyImpact || projectile ? 2 : 0,
    lift: finishingHit ? 2.1 : projectile ? 1.35 : heavyImpact ? 1.48 : 1,
    vx: finishingHit ? 8.9 : projectile ? 6.25 : heavyImpact ? 7.45 : 6.1,
    vy: finishingHit ? -5.75 : projectile ? -3.75 : heavyImpact ? -4.7 : -3.9,
    damageBonus: 0,
    pulse: finishingHit ? 34 : heavyImpact || projectile ? 24 : 18,
    dust: heavyImpact ? 10 : 7,
  };
}

function impactCinematicProfile({ blocked, heavyImpact, counter, projectile, finishingHit, attackType, hitZone, impactStrength }) {
  const sweep = attackType === "sweep";
  const grab = attackType === "grab";
  const kick = attackType === "kick" || attackType === "airKick";
  const head = hitZone === "head";
  const low = hitZone === "legs" || sweep;

  if (blocked) {
    return {
      flash: 3,
      shake: 4,
      hitStop: 3,
      cameraPulse: 7,
      cameraStrength: 0.52,
      cinematic: true,
      specialFx: false,
      cinematicPulse: 6,
      cinematicStrength: 0.34,
      zoom: 0.01,
      pan: 3.2,
      lift: 0.7,
      roll: 0,
      band: 0.44,
    };
  }

  const profile = {
    flash: 6,
    shake: 8,
    hitStop: 5,
    cameraPulse: 11,
    cameraStrength: Math.max(0.86, impactStrength),
    cinematic: true,
    specialFx: false,
    cinematicPulse: 7,
    cinematicStrength: 0.52,
    zoom: 0.014,
    pan: 4.4,
    lift: 1.2,
    roll: 0.0015,
    band: 0.58,
  };

  if (heavyImpact || kick || sweep || grab) {
    profile.flash = 9;
    profile.shake = 10;
    profile.hitStop = 7;
    profile.cameraPulse = 14;
    profile.cameraStrength = Math.max(1.16, impactStrength);
    profile.cinematicPulse = 11;
    profile.cinematicStrength = grab ? 1.12 : sweep ? 1.02 : 1.04;
    profile.zoom = grab ? 0.034 : sweep ? 0.028 : 0.032;
    profile.pan = grab ? 8.6 : 7.6;
    profile.lift = sweep || low ? 1.5 : 3.2;
    profile.roll = sweep ? -0.004 : 0.005;
    profile.band = 0.92;
    profile.specialFx = true;
  }

  if (projectile) {
    profile.flash = 11;
    profile.shake = 11;
    profile.hitStop = 9;
    profile.cameraPulse = 17;
    profile.cameraStrength = Math.max(1.32, impactStrength);
    profile.cinematicPulse = 15;
    profile.cinematicStrength = 1.28;
    profile.zoom = 0.038;
    profile.pan = 9.6;
    profile.lift = 3.4;
    profile.roll = 0.006;
    profile.band = 1.08;
    profile.specialFx = true;
  }

  if (counter) {
    profile.flash = 12;
    profile.shake = 13;
    profile.hitStop = 9;
    profile.cameraPulse = 17;
    profile.cameraStrength = 1.46;
    profile.cinematicPulse = 16;
    profile.cinematicStrength = 1.42;
    profile.zoom = 0.044;
    profile.pan = 11.2;
    profile.lift = 4.2;
    profile.roll = 0.008;
    profile.band = 1.18;
    profile.specialFx = true;
  }

  if (finishingHit) {
    profile.flash = 14;
    profile.shake = 16;
    profile.hitStop = 12;
    profile.cameraPulse = 20;
    profile.cameraStrength = 1.74;
    profile.cinematicPulse = 20;
    profile.cinematicStrength = 1.68;
    profile.zoom = 0.056;
    profile.pan = 13.8;
    profile.lift = 5.2;
    profile.roll = 0.011;
    profile.band = 1.32;
    profile.specialFx = true;
  }

  if (head) {
    profile.flash += 1;
    profile.shake += 1;
    profile.zoom += 0.006;
    profile.lift += 0.8;
    profile.roll += 0.002;
  } else if (low) {
    profile.pan += 1.1;
    profile.lift -= 0.5;
    profile.roll -= 0.002;
  }

  return profile;
}

function impactVisualProfile({ attackType = "", hitZone = "torso", blocked = false, projectile = false, counter = false, finishingHit = false }) {
  const spec = attackVisualSpec(attackType);
  const flavor =
    blocked ? "guard" :
    projectile || spec.special ? "special" :
    spec.sweep ? "sweep" :
    spec.kick ? "kick" :
    spec.grab ? "grab" :
    "punch";
  const head = hitZone === "head";
  const legs = hitZone === "legs";
  const baseColor =
    flavor === "guard" ? "#bdeaff" :
    counter ? "#fff1bd" :
    flavor === "special" ? "#8fe2ff" :
    flavor === "kick" || flavor === "sweep" ? "#ffe87a" :
    flavor === "grab" ? "#ffd7a8" :
    "#9be7ff";
  const core =
    flavor === "special" ? "#fff1bd" :
    flavor === "kick" || flavor === "sweep" ? "#fff6bf" :
    flavor === "grab" ? "#fff0d0" :
    "#e8fbff";
  const strength =
    (flavor === "guard" ? 0.88 : flavor === "special" ? 1.18 : flavor === "kick" ? 1.12 : flavor === "sweep" ? 1.16 : flavor === "grab" ? 1.08 : 1) *
    (counter ? 1.12 : 1) *
    (finishingHit ? 1.16 : 1);

  return {
    flavor,
    color: baseColor,
    core,
    accent: flavor === "special" ? "#7ef0cf" : flavor === "punch" ? "#d8fbff" : "#ffd44d",
    strength,
    warp: (head ? 1.18 : legs ? 1.14 : 1) * (flavor === "special" ? 1.22 : flavor === "sweep" ? 1.18 : flavor === "kick" ? 1.14 : 1),
    facePulse: blocked ? 7 : head ? 22 : flavor === "special" || counter ? 20 : flavor === "kick" || flavor === "sweep" ? 17 : 14,
    faceStrength: blocked ? 0.22 : head ? 1.28 : flavor === "special" || counter ? 1.05 : flavor === "kick" || flavor === "sweep" ? 0.86 : 0.68,
    particleScale: flavor === "special" || counter ? 1.22 : flavor === "kick" || flavor === "sweep" ? 1.12 : 1,
  };
}

function impactFlavorWarp(flavor = "light") {
  if (flavor === "special") return { warp: 1.22, kick: 1.18, highlight: "#8fe2ff" };
  if (flavor === "sweep") return { warp: 1.18, kick: 1.12, highlight: "#ffe87a" };
  if (flavor === "kick") return { warp: 1.14, kick: 1.16, highlight: "#fff6bf" };
  if (flavor === "grab") return { warp: 1.08, kick: 0.94, highlight: "#ffd7a8" };
  if (flavor === "guard") return { warp: 0.72, kick: 0.62, highlight: "#bdeaff" };
  return { warp: 1, kick: 1, highlight: "#fff1bd" };
}

function triggerDynamicLight(f, color, zone = "torso", dir = null, strength = 1, pulse = 16) {
  if (!f) return;
  const safePulse = Math.max(1, Math.round(pulse));
  const currentPower = ((f.dynamicLightPulse ?? 0) / Math.max(1, f.dynamicLightMax ?? 1)) * (f.dynamicLightStrength ?? 0);
  const nextPower = strength * Math.max(0.35, safePulse / 18);
  if (nextPower >= currentPower * 0.82) {
    f.dynamicLightColor = color;
    f.dynamicLightZone = zone;
    f.dynamicLightDir = dir ?? f.dir ?? 1;
    f.dynamicLightStrength = strength;
  }
  f.dynamicLightMax = Math.max(f.dynamicLightMax ?? 1, safePulse);
  f.dynamicLightPulse = Math.max(f.dynamicLightPulse ?? 0, safePulse);
}

function comboTierLabel(count) {
  if (count >= 7) return "DOJO RUSH";
  if (count >= 5) return "FURY";
  if (count >= 3) return "CHAIN";
  return "COMBO";
}

function comboTierColor(count) {
  if (count >= 7) return "#fff1bd";
  if (count >= 5) return "#ffcf5d";
  if (count >= 3) return "#7ef0cf";
  return "#ffd44d";
}

function comboFlourishFX(attacker, target, color, count, hitZone) {
  if (!attacker || !target) return;
  const mobile = isMobileFightView();
  if (particles.length > particleBudget() * 0.84) return;

  const dir = attacker.dir || 1;
  const tier = count >= 7 ? 3 : count >= 5 ? 2 : 1;
  const x = target.x - dir * fighterScale(18);
  const y = target.y - fighterScale(hitZone === "legs" ? 74 : hitZone === "head" ? 164 : 126);
  const baseAngle = dir > 0 ? -0.08 : Math.PI + 0.08;
  const core = count >= 7 ? "#fff8df" : count >= 5 ? "#ffe08b" : "#c8fff1";

  particles.push({
    x,
    y,
    vx: dir * 0.08,
    vy: 0,
    angle: baseAngle,
    life: mobile ? 12 : 15,
    maxLife: mobile ? 12 : 15,
    size: fighterScale((58 + tier * 12) * (mobile ? 0.86 : 1)),
    growth: 1.8 + tier * 0.28,
    color,
    kind: "ring",
  });
  particles.push({
    x: x - dir * fighterScale(5),
    y,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: mobile ? 9 : 12,
    maxLife: mobile ? 9 : 12,
    size: fighterScale((30 + tier * 8) * (mobile ? 0.84 : 1)),
    color,
    core,
    kind: "signatureStar",
  });

  const shardCount = fxCount(6 + tier * 3, 3 + tier);
  for (let i = 0; i < shardCount; i += 1) {
    const lane = shardCount === 1 ? 0 : i / (shardCount - 1) - 0.5;
    particles.push({
      x: x - dir * fighterScale(6),
      y: y + lane * fighterScale(44),
      vx: dir * (0.56 + Math.random() * 0.72),
      vy: lane * 0.42 - 0.08 + Math.random() * 0.12,
      angle: baseAngle + lane * 0.72,
      length: fighterScale(24 + tier * 10 + Math.random() * 22),
      life: 12 + tier * 2 + Math.random() * 6,
      maxLife: 18 + tier * 2,
      size: 2.2 + tier * 0.45 + Math.random() * 1.6,
      color: i % 2 ? core : color,
      kind: i % 4 === 0 ? "hitShard" : "impactNeedle",
    });
  }

  if (count >= 7 && particles.length < particleBudget() * 0.78) {
    particles.push({
      x: target.x - dir * fighterScale(16),
      y: FLOOR + 4,
      vx: dir * 0.14,
      vy: 0,
      angle: 0,
      life: 16,
      maxLife: 16,
      size: fighterScale(58),
      color,
      kind: "floorShock",
    });
  }
}

function registerComboHit(attacker, target, damage, { blocked, projectile, heavyImpact, counter, hitZone }) {
  if (!attacker || blocked || !target) return;

  const sameTarget = attacker.comboTargetId === target.id && (attacker.comboTimer ?? 0) > 0;
  attacker.comboCount = sameTarget ? (attacker.comboCount ?? 0) + 1 : 1;
  attacker.comboDamage = sameTarget ? (attacker.comboDamage ?? 0) + damage : damage;
  attacker.roundMaxCombo = Math.max(attacker.roundMaxCombo ?? 0, attacker.comboCount ?? 0);
  attacker.comboTargetId = target.id;
  attacker.comboTimer = Math.max(attacker.comboTimer ?? 0, heavyImpact || projectile || counter ? 112 : 96);
  attacker.comboPulse = Math.max(attacker.comboPulse ?? 0, 22);
  attacker.comboWindow = Math.max(attacker.comboWindow ?? 0, heavyImpact || projectile || counter ? 32 : 24);

  if (attacker.attack && !projectile) {
    const finishSoon = attacker.comboCount >= 3 ? 7 : 9;
    attacker.attack.duration = Math.min(attacker.attack.duration, attacker.attack.frame + finishSoon);
    attacker.cooldown = Math.min(attacker.cooldown ?? 0, attacker.comboCount >= 3 ? 5 : 7);
  }

  if (attacker.comboCount >= 2) {
    const color = comboTierColor(attacker.comboCount);
    const label = `${attacker.comboCount} HIT ${comboTierLabel(attacker.comboCount)}`;
    addText(
      target.x,
      target.y - (hitZone === "legs" ? 104 : hitZone === "head" ? 184 : 164),
      label,
      color,
      { size: attacker.comboCount >= 7 ? 24 : attacker.comboCount >= 5 ? 22 : 20, life: 58, rise: 0.44, drift: (attacker.dir || 1) * 0.06 },
    );
    if (attacker.comboCount === 3 || attacker.comboCount === 5 || attacker.comboCount === 7) {
      playSound("combo", { x: target.x, intensity: clamp(0.85 + attacker.comboCount * 0.08, 0.9, 1.55), key: attacker.id });
      if (attacker.comboCount >= 5) playSound("comboBreak", { x: target.x, intensity: clamp(0.72 + attacker.comboCount * 0.07, 0.9, 1.42), key: attacker.id });
      playDojoReaction(attacker.comboCount >= 7 ? "comboPeak" : attacker.comboCount >= 5 ? "comboSurge" : "comboSpark", {
        x: target.x,
        combo: attacker.comboCount,
        intensity: clamp(0.72 + attacker.comboCount * 0.05, 0.78, 1.18),
        key: `${attacker.id}:${target.id}:${attacker.comboCount}`,
      });
      comboFlourishFX(attacker, target, color, attacker.comboCount, hitZone);
      triggerCinematicHit(attacker.dir || 1, color, 0.42 + Math.min(attacker.comboCount, 8) * 0.045, 7, {
        zoom: 0.01 + Math.min(attacker.comboCount, 8) * 0.0015,
        pan: 3.4 + Math.min(attacker.comboCount, 8) * 0.25,
        lift: 1.1,
        roll: 0.001,
        band: 0.42 + Math.min(attacker.comboCount, 8) * 0.035,
      });
      if (attacker.comboCount >= 5) triggerScreenTear(attacker.dir || 1, color, attacker.comboCount >= 7 ? 0.86 : 0.58, attacker.comboCount >= 7 ? 11 : 8);
    }
  }
}

function impactSoundType({ blocked, heavyImpact, projectile, counter, finishingHit, hitZone }) {
  if (blocked) return "block";
  if (finishingHit) return "finishHit";
  if (counter) return "counter";
  if (projectile) return "projectileHit";
  if (heavyImpact) return "hitHeavy";
  if (hitZone === "head") return "hitSharp";
  if (hitZone === "legs") return "hitLow";
  return "hit";
}

function sweetenImpactAudio({ target, blocked, heavyImpact, projectile, counter, finishingHit, hitZone, impactStrength }) {
  if (!target) return;
  const x = target.x;
  const zoneBoost = hitZone === "head" || hitZone === "legs" ? 0.1 : 0;
  const strength = clamp((impactStrength ?? 1) + zoneBoost, 0.42, 1.75);

  if (blocked) {
    playSound("guardTail", { x, intensity: clamp(0.68 + strength * 0.22, 0.68, 1.2), key: `${target.id}:${hitZone}` });
    duckMusicForImpact(0.42 + strength * 0.28, 0.055, 0.18);
    return;
  }

  if (finishingHit) {
    playSound("finishRumble", { x, intensity: clamp(0.9 + strength * 0.3, 0.95, 1.55), key: `${target.id}:${roundNumber}` });
    playSound("impactTail", { x, intensity: clamp(0.98 + strength * 0.24, 1, 1.65), key: `${target.id}:finish:${roundNumber}` });
    playDojoReaction("finishImpact", { x, intensity: clamp(0.78 + strength * 0.1, 0.84, 1.02), key: `${target.id}:finish-impact:${roundNumber}` });
    duckMusicForImpact(1.32 + strength * 0.25, 0.24, 0.62);
    return;
  }

  if (projectile || counter) {
    playSound("specialTail", { x, intensity: clamp(0.82 + strength * 0.28, 0.86, 1.52), key: `${target.id}:${projectile ? "projectile" : "counter"}` });
    playSound("impactTail", { x, intensity: clamp(0.74 + strength * 0.22, 0.78, 1.35), key: `${target.id}:${hitZone}:tail` });
    duckMusicForImpact(0.92 + strength * 0.22, 0.13, 0.38);
    return;
  }

  if (heavyImpact || hitZone === "head" || hitZone === "legs") {
    playSound("impactTail", { x, intensity: clamp(0.62 + strength * 0.24, 0.66, 1.25), key: `${target.id}:${hitZone}:tail` });
    duckMusicForImpact(0.58 + strength * 0.2, 0.075, 0.24);
  }
}

function landHit(attacker, target, damage, projectile = false, projectileInfo = null) {
  const unblockable = attacker?.attack?.type === "grab";
  const counter = attacker?.counterWindow > 0;
  const blocked = !unblockable && target.blocking && attacker && target.dir !== attacker.dir;
  const attackType = attacker?.attack?.type ?? "";
  const heavyImpact = projectile || attackType === "kick" || attackType === "airKick" || attackType === "sweep" || attackType === "grab";
  const finalDamage = blocked ? Math.ceil(damage * 0.28) : damage + (counter ? 4 : 0);
  const impactDir = attacker?.dir ?? target.dir * -1;
  const previousHealth = target.health;
  const nextHealth = clamp(target.health - finalDamage, 0, 100);
  const finishingHit = !blocked && previousHealth > 0 && nextHealth <= 0;
  const hitZone = blocked ? "guard" : hitZoneFor(attacker, target, projectileInfo, attackType);
  const visual = impactVisualProfile({ attackType, hitZone, blocked, projectile, counter, finishingHit });
  const impactColor = visual.color;
  const impactStrength = (blocked ? 0.42 : counter ? 1.35 : projectile ? 1.18 : heavyImpact ? 1.08 : 0.78) * visual.strength;
  const zone = hitZoneReaction(hitZone, blocked, projectile, heavyImpact, finishingHit);
  const cinematic = impactCinematicProfile({ blocked, heavyImpact, counter, projectile, finishingHit, attackType, hitZone, impactStrength });
  const cinematicHit = cinematic.specialFx;
  const targetMotion = characterMotion(target);
  const targetGuard = characterGuard(target);

  if (target) {
    target.roundDamageTaken = (target.roundDamageTaken ?? 0) + finalDamage;
    if (blocked) target.roundBlocks = (target.roundBlocks ?? 0) + 1;
  }
  if (attacker) {
    attacker.roundDamage = (attacker.roundDamage ?? 0) + finalDamage;
    if (!blocked) attacker.roundHits = (attacker.roundHits ?? 0) + 1;
    if (counter) attacker.roundCounters = (attacker.roundCounters ?? 0) + 1;
  }

  target.health = nextHealth;
  target.hurt = finishingHit ? 42 + zone.hurtBonus : blocked ? 9 : attacker?.attack?.type === "grab" ? 32 : projectile ? 24 + zone.hurtBonus : heavyImpact ? 27 + zone.hurtBonus : 24 + zone.hurtBonus;
  target.hitFlash = blocked ? 8 : projectile ? 20 : heavyImpact ? 17 : 14;
  target.contactFlash = blocked ? 7 : heavyImpact ? 14 : 11;
  target.impactPulse = finishingHit ? 24 : blocked ? 8 : Math.round(13 + impactStrength * 5);
  target.impactDir = impactDir;
  target.impactLift = zone.lift;
  target.impactStrength = impactStrength;
  target.impactFlavor = visual.flavor;
  triggerDynamicLight(target, impactColor, hitZone, impactDir, blocked ? 0.56 : counter ? 1.26 : projectile ? 1.16 : heavyImpact ? 1.08 : 0.88, blocked ? 12 : counter || projectile ? 22 : heavyImpact ? 19 : 15);
  target.hitZone = hitZone;
  target.hitZonePulse = Math.max(target.hitZonePulse ?? 0, zone.pulse);
  target.faceImpactPulse = Math.max(target.faceImpactPulse ?? 0, visual.facePulse);
  target.faceImpactMax = Math.max(target.faceImpactMax ?? 1, visual.facePulse);
  target.faceImpactZone = hitZone;
  target.faceImpactDir = impactDir;
  target.faceImpactStrength = visual.faceStrength;
  target.damagePulse = blocked ? Math.max(target.damagePulse ?? 0, 8) : finishingHit ? 38 : Math.max(target.damagePulse ?? 0, heavyImpact || projectile || counter ? 28 : zone.pulse);
  target.damageLevel = blocked ? 0.35 : finishingHit ? 1.72 : counter ? 1.52 : projectile ? 1.3 + zone.damageBonus : heavyImpact ? 1.18 + zone.damageBonus : 0.86 + zone.damageBonus;
  const reactionKind = blocked
    ? "guard"
    : finishingHit
      ? "finish"
      : counter
        ? "counter"
        : projectile
          ? "blast"
          : attackType === "sweep"
            ? "low"
            : heavyImpact
              ? "heavy"
              : "light";
  const baseReactionMax = blocked ? 12 : finishingHit ? 38 : counter || projectile ? 30 : heavyImpact ? 26 : 20;
  const reactionMax = Math.max(1, Math.round(baseReactionMax * targetMotion.impactTime));
  target.reactionPulse = Math.max(target.reactionPulse ?? 0, reactionMax);
  target.reactionMax = Math.max(target.reactionMax ?? 1, reactionMax);
  target.reactionZone = hitZone;
  target.reactionKind = reactionKind;
  target.reactionDir = impactDir;
  target.reactionStrength = blocked ? 0.38 : finishingHit ? 1.82 : counter ? 1.56 : projectile ? 1.38 : heavyImpact ? Math.max(1.22, impactStrength + 0.12) : impactStrength;
  if (finishingHit) {
    target.koFall = Math.max(target.koFall ?? 0, 98);
    target.koFallDir = impactDir;
    target.koFallStrength = Math.max(target.koFallStrength ?? 0, impactStrength + 0.16);
  }
  const guardImpactMax = Math.round((heavyImpact || projectile ? 21 : 17) * targetGuard.recoil);
  target.guardImpact = blocked ? Math.max(target.guardImpact ?? 0, guardImpactMax) : 0;
  if (blocked) {
    target.guardEntryPulse = Math.max(target.guardEntryPulse ?? 0, 10);
    target.bracePulse = Math.max(target.bracePulse ?? 0, heavyImpact || projectile ? 14 : 11);
  }
  if (!blocked && target.health < 32) {
    target.staggerPulse = Math.max(target.staggerPulse ?? 0, heavyImpact || projectile ? 18 : 13);
  }
  if (hitZone === "legs") target.crouch = Math.max(target.crouch ?? 0, heavyImpact ? 0.56 : 0.38);
  target.vx = impactDir * zone.vx;
  target.vy = target.grounded ? zone.vy : target.vy;
  if (target.grounded) {
    const skidPower = blocked ? 0.42 : finishingHit ? 1.65 : counter ? 1.45 : projectile ? 1.34 : heavyImpact ? 1.2 : 0.84;
    const skidTime = Math.round((blocked ? 7 : heavyImpact || projectile || counter ? 14 : 10) * targetMotion.impactSkid);
    target.walkStopPulse = Math.max(target.walkStopPulse ?? 0, skidTime);
    target.walkStopDir = impactDir;
    target.walkStopSpeed = Math.max(target.walkStopSpeed ?? 0, clamp(skidPower, 0.24, 1.8));
    target.footPlantPulse = Math.max(target.footPlantPulse ?? 0, Math.round((blocked ? 7 : heavyImpact || projectile || counter ? 13 : 9) * targetMotion.impactFloor));
    target.walkAnchorPulse = Math.max(target.walkAnchorPulse ?? 0, Math.round((blocked ? 8 : heavyImpact || projectile || counter ? 16 : 11) * targetMotion.impactFloor));
    target.walkPushPulse = Math.max(target.walkPushPulse ?? 0, Math.round((blocked ? 5 : heavyImpact || projectile || counter ? 11 : 8) * targetMotion.impactSkid));
    target.bracePulse = Math.max(target.bracePulse ?? 0, blocked ? 10 : heavyImpact || projectile || counter ? 14 : 9);
    if (!blocked && (heavyImpact || projectile || counter || finishingHit)) {
      target.landingPulse = Math.max(target.landingPulse ?? 0, Math.round(8 + skidPower * 5));
      target.landingStrength = Math.max(target.landingStrength ?? 0, clamp(skidPower * 0.42, 0.28, 0.82));
    }
  }
  if (attacker) {
    attacker.energy = clamp(attacker.energy + (blocked ? 3 : 8), 0, 100);
    attacker.impactPulse = Math.max(attacker.impactPulse ?? 0, blocked ? 4 : heavyImpact || projectile ? 7 : 5);
    attacker.impactDir = impactDir;
    attacker.impactLift = 0.22;
    attacker.impactStrength = Math.max(attacker.impactStrength ?? 0, blocked ? 0.28 : heavyImpact || projectile ? 0.58 : 0.44);
    triggerDynamicLight(attacker, visual.core, "torso", impactDir, blocked ? 0.22 : 0.38, blocked ? 7 : 10);
    attacker.vx -= impactDir * (blocked ? 0.56 : heavyImpact || projectile ? 0.34 : 0.24);
    attacker.bracePulse = Math.max(attacker.bracePulse ?? 0, blocked ? 10 : heavyImpact || projectile ? 11 : 7);
    attacker.footPlantPulse = Math.max(attacker.footPlantPulse ?? 0, blocked ? 9 : heavyImpact || projectile ? 8 : 6);
    attacker.walkPushPulse = Math.max(attacker.walkPushPulse ?? 0, blocked ? 7 : heavyImpact || projectile ? 8 : 5);
    attacker.attackRecoverPulse = Math.max(attacker.attackRecoverPulse ?? 0, blocked ? 10 : heavyImpact || projectile ? 12 : 8);
  }
  if (blocked) target.counterWindow = heavyImpact || projectile ? COUNTER_WINDOW_FRAMES + 6 : COUNTER_WINDOW_FRAMES;
  if (counter && attacker) attacker.counterWindow = 0;
  flash = Math.max(flash, cinematic.flash);
  shake = Math.max(shake, cinematic.shake);
  hitStopFrames = Math.max(hitStopFrames, cinematic.hitStop);
  playSound(impactSoundType({ blocked, heavyImpact, projectile, counter, finishingHit, hitZone }), {
    x: target.x,
    intensity: impactStrength,
    key: `${target.id}:${hitZone}`,
  });
  sweetenImpactAudio({ target, blocked, heavyImpact, projectile, counter, finishingHit, hitZone, impactStrength });
  registerComboHit(attacker, target, finalDamage, { blocked, projectile, heavyImpact, counter, hitZone });
  addText(
    target.x,
    target.y - (hitZone === "legs" ? 78 : hitZone === "head" ? 166 : 154),
    blocked ? "BLOCK" : counter ? "COUNTER" : unblockable ? "GRAB" : projectile ? "SPECIAL" : hitZone === "head" ? "HEAD" : hitZone === "legs" ? "LOW" : "HIT",
    blocked ? "#bdeaff" : counter ? "#fff1bd" : "#ffd44d",
  );
  const impactX = target.x - target.dir * (hitZone === "legs" ? 18 : hitZone === "head" ? 30 : 26);
  const impactY = target.y - zone.yOffset;
  triggerCameraImpact(impactDir, blocked, heavyImpact, counter, impactStrength, cinematic);
  if (cinematic.cinematic) {
    triggerCinematicHit(impactDir, impactColor, cinematic.cinematicStrength, cinematic.cinematicPulse, cinematic);
  }
  if (!blocked && (counter || projectile || heavyImpact || finishingHit)) {
    triggerScreenTear(
      impactDir,
      impactColor,
      finishingHit ? 1.45 : counter ? 1.24 : projectile ? 1.12 : 0.92,
      finishingHit ? 18 : counter ? 14 : projectile ? 12 : 10
    );
  }
  burst(
    target.x - target.dir * 22,
    impactY,
    blocked ? "#bdeaff" : visual.core,
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
  if (blocked) guardClashFX(impactX, impactY, target, impactColor, impactDir, heavyImpact, projectile);
  typedImpactFX(impactX, impactY, target, visual, impactDir, hitZone, blocked, counter);
  if (cinematicHit) cinematicSpecialImpactFX(impactX, impactY, target, attacker, projectileInfo, impactColor, impactDir, finishingHit, projectile, counter);
  signatureImpactFX(impactX, impactY, target, visual, impactDir, hitZone, blocked, counter, projectile, finishingHit);
  floorDust(target.x, target.y + 3, blocked ? 4 : zone.dust);
  if (!blocked && target.grounded) {
    movementDust(
      target.x - impactDir * fighterScale(28),
      target.y + 5,
      -impactDir,
      clamp(impactStrength + (heavyImpact ? 0.22 : 0) + (hitZone === "legs" ? 0.18 : 0), 0.65, 1.55),
      heavyImpact || projectile || counter || finishingHit ? 7 : 4,
    );
    if (heavyImpact || projectile || counter || finishingHit) {
      floorDust(target.x - impactDir * fighterScale(16), target.y + 5, Math.min(16, zone.dust + 4));
    }
  }
}

function triggerCameraImpact(dir, blocked, heavyImpact, counter, strength, profile = null) {
  const pulse = profile?.cameraPulse ?? (blocked ? 6 : counter ? 14 : heavyImpact ? 12 : 9);
  if (pulse < cameraImpactPulse) return;

  cameraImpactPulse = pulse;
  cameraImpactMax = pulse;
  cameraImpactDir = dir || 1;
  cameraImpactStrength = profile?.cameraStrength ?? (blocked ? 0.45 : counter ? 1.28 : strength);
}

function triggerCinematicHit(dir, color, strength = 1, pulse = 12, profile = null) {
  if (pulse < cinematicHitPulse) return;
  cinematicHitPulse = pulse;
  cinematicHitMax = pulse;
  cinematicHitDir = dir || 1;
  cinematicHitColor = color || "#fff1bd";
  cinematicHitStrength = strength;
  cinematicHitZoom = profile?.zoom ?? 0.022;
  cinematicHitPan = profile?.pan ?? 6.4;
  cinematicHitLift = profile?.lift ?? 2.6;
  cinematicHitRoll = profile?.roll ?? 0;
  cinematicHitBand = profile?.band ?? 1;
}

function triggerScreenTear(dir, color, strength = 1, pulse = 10) {
  if (isMobileFightView()) {
    strength *= 0.58;
    pulse = Math.round(pulse * 0.74);
  }
  if (pulse < screenTearPulse) return;
  screenTearPulse = Math.max(1, pulse);
  screenTearMax = Math.max(1, pulse);
  screenTearDir = dir || 1;
  screenTearColor = color || "#fff1bd";
  screenTearStrength = strength;
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

  const shardCount = fxCount(blocked ? 4 : heavyImpact ? 10 : 7, blocked ? 2 : 3);
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

function guardClashFX(x, y, target, color, dir, heavyImpact, projectile) {
  const guardProfile = characterGuard(target);
  const strong = heavyImpact || projectile;
  const baseAngle = dir > 0 ? 0 : Math.PI;
  const plateCount = fxCount(strong ? 2 : 1, 1);

  for (let i = 0; i < plateCount; i += 1) {
    particles.push({
      x: x - dir * (9 + i * 5),
      y: y + (i - (plateCount - 1) / 2) * 18,
      vx: dir * 0.08,
      vy: 0,
      angle: baseAngle,
      life: Math.round((strong ? 18 : 15) * guardProfile.recoil),
      maxLife: Math.round((strong ? 18 : 15) * guardProfile.recoil),
      size: (strong ? 43 : 35) * guardProfile.shieldScale,
      color: guardProfile.color,
      kind: "guardPlate",
    });
  }

  particles.push({
    x: x - dir * 10,
    y,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: strong ? 16 : 13,
    maxLife: strong ? 16 : 13,
    size: (strong ? 22 : 17) * guardProfile.shieldScale,
    growth: (strong ? 2.3 : 1.8) * guardProfile.shieldWidth,
    color: guardProfile.color,
    kind: "ring",
  });

  particles.push({
    x: x - dir * 13,
    y: y + 1,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: strong ? 14 : 11,
    maxLife: strong ? 14 : 11,
    size: (strong ? 36 : 30) * guardProfile.shieldScale,
    growth: strong ? 1.9 : 1.55,
    color,
    kind: "airRipple",
  });

  const sparkCount = fxCount(strong ? Math.round(7 * guardProfile.spark) : Math.round(5 * guardProfile.spark), 2);
  const spread = (strong ? 0.72 : 0.54) * guardProfile.arc;
  for (let i = 0; i < sparkCount; i += 1) {
    const lane = sparkCount === 1 ? 0 : i / (sparkCount - 1) - 0.5;
    const angle = baseAngle + lane * spread + (Math.random() - 0.5) * 0.08;
    particles.push({
      x: x - dir * (12 + Math.random() * 5),
      y: y + lane * 34,
      vx: Math.cos(angle) * (0.38 + Math.random() * 0.3),
      vy: Math.sin(angle) * 0.36 - 0.08,
      angle,
      length: (strong ? 42 : 31) * guardProfile.shieldWidth * (0.82 + Math.random() * 0.35),
      life: strong ? 14 + Math.random() * 5 : 11 + Math.random() * 4,
      maxLife: strong ? 16 : 13,
      size: (strong ? 3.1 : 2.4) * guardProfile.spark,
      color: lane > 0.28 ? "#fff1bd" : guardProfile.color,
      kind: "impactNeedle",
    });
  }

  const glints = fxCount(strong ? 3 : 2, 1);
  for (let i = 0; i < glints; i += 1) {
    particles.push({
      x: x - dir * (8 + Math.random() * 8),
      y: y - 14 + Math.random() * 28,
      vx: -dir * (0.08 + Math.random() * 0.22),
      vy: -0.35 - Math.random() * 0.55,
      life: 9 + Math.random() * 5,
      maxLife: 12,
      size: strong ? 5.4 : 4.2,
      color: "#fff1bd",
      kind: "glint",
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

  const count = fxCount(spec.sweep ? 5 : spec.kick ? 6 : spec.special ? 7 : spec.grab ? 4 : 4, spec.special ? 4 : 2);
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
  const fxTotal = fxCount(count, Math.min(2, count));
  for (let i = 0; i < fxTotal; i += 1) {
    particles.push({
      x,
      y,
      vx: Math.cos((Math.PI * 2 * i) / fxTotal) * (1.2 + Math.random() * 4),
      vy: Math.sin((Math.PI * 2 * i) / fxTotal) * (1.2 + Math.random() * 4),
      life: 18 + Math.random() * 14,
      size: 2.2 + Math.random() * 2.8,
      color,
    });
  }
}

function impactBurst(x, y, color, blocked, heavyImpact = false) {
  const count = fxCount(blocked ? 4 : heavyImpact ? 9 : 7, blocked ? 2 : 3);
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

  const count = fxCount(blocked ? 4 : heavyImpact ? 9 : 6, blocked ? 2 : 3);
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
  const count = fxCount(blocked ? 2 : heavyImpact ? 5 : 3, blocked ? 1 : 2);
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

  const count = fxCount(blocked ? 2 : heavyImpact ? 6 : 4, blocked ? 1 : 2);
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
  const guardProfile = blocked ? characterGuard(target) : CHARACTER_GUARD.default;
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
      life: Math.round(15 * guardProfile.recoil),
      maxLife: Math.round(15 * guardProfile.recoil),
      size: 34 * guardProfile.shieldScale,
      color: guardProfile.color,
      kind: "guardPlate",
    });
  }

  const needleCount = fxCount(blocked ? Math.max(2, Math.round(3 * guardProfile.spark)) : counter ? 10 : heavyImpact || projectile ? 8 : 5, blocked ? 2 : 3);
  const spread = blocked ? 0.36 * guardProfile.arc : counter ? 0.86 : heavyImpact ? 0.72 : 0.58;
  for (let i = 0; i < needleCount; i += 1) {
    const lane = needleCount === 1 ? 0 : i / (needleCount - 1) - 0.5;
    const angle = baseAngle + lane * spread + (Math.random() - 0.5) * 0.1;
    const speed = blocked ? 0.32 * guardProfile.spark : heavyImpact ? 0.92 : 0.68;
    particles.push({
      x: x - Math.cos(angle) * 10,
      y: y + lane * (blocked ? 22 : 32),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.26,
      angle,
      length: (blocked ? 26 * guardProfile.shieldWidth : heavyImpact ? 72 : 54) * (0.82 + Math.random() * 0.38),
      life: blocked ? (9 + Math.random() * 5) * guardProfile.recoil : 12 + Math.random() * 7,
      maxLife: blocked ? 11 * guardProfile.recoil : 16,
      size: blocked ? 2.2 * guardProfile.spark : heavyImpact ? 4.4 : 3.2,
      color: blocked ? guardProfile.color : color,
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

    const ribbonCount = fxCount(heavyImpact || projectile ? 8 : 5, 2);
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

function typedImpactFX(x, y, target, visual, dir, hitZone, blocked, counter) {
  const flavor = visual?.flavor ?? "punch";
  const color = visual?.color ?? "#ffd44d";
  const core = visual?.core ?? "#fff1bd";
  const accent = visual?.accent ?? color;
  const scale = visual?.particleScale ?? 1;
  const baseAngle = dir > 0 ? 0 : Math.PI;

  if (blocked || flavor === "guard") {
    particles.push({
      x: x - dir * 12,
      y,
      vx: dir * 0.12,
      vy: 0,
      angle: baseAngle,
      life: 13,
      maxLife: 13,
      size: 40,
      color: "#bdeaff",
      kind: "guardPlate",
    });
    return;
  }

  if (flavor === "punch") {
    const count = fxCount(4, 2);
    for (let i = 0; i < count; i += 1) {
      const lane = count === 1 ? 0 : i / (count - 1) - 0.5;
      particles.push({
        x: x - dir * 8,
        y: y + lane * 26,
        vx: dir * (0.7 + Math.random() * 0.55),
        vy: lane * 0.24,
        angle: baseAngle + lane * 0.46,
        length: fighterScale((42 + Math.random() * 28) * scale),
        life: 12 + Math.random() * 5,
        maxLife: 16,
        size: 2.8 + Math.random() * 1.2,
        color: i % 2 ? core : color,
        kind: "impactNeedle",
      });
    }
    particles.push({ x, y, vx: 0, vy: 0, angle: baseAngle, life: 8, maxLife: 8, size: 34 * scale, color: core, kind: "impactCore" });
    return;
  }

  if (flavor === "kick") {
    particles.push({
      x: x - dir * 10,
      y,
      vx: dir * 0.6,
      vy: -0.08,
      angle: baseAngle + (dir > 0 ? -0.16 : 0.16),
      life: 15,
      maxLife: 15,
      size: 92 * scale,
      color,
      strength: 1.1,
      kind: "recoilArc",
    });
    const count = fxCount(5, 2);
    for (let i = 0; i < count; i += 1) {
      const lane = count === 1 ? 0 : i / (count - 1) - 0.5;
      particles.push({
        x: x - dir * 16,
        y: y + lane * 34,
        vx: dir * (0.9 + Math.random() * 0.7),
        vy: lane * 0.42 - 0.18,
        angle: baseAngle + lane * 0.7,
        length: fighterScale((58 + Math.random() * 34) * scale),
        life: 13 + Math.random() * 7,
        maxLife: 18,
        size: 3.4 + Math.random() * 1.4,
        color: i % 2 ? core : accent,
        kind: "impactNeedle",
      });
    }
    return;
  }

  if (flavor === "sweep") {
    const floorY = Math.min(FLOOR + 4, target.y + 5);
    particles.push({
      x: target.x - dir * 12,
      y: floorY,
      vx: dir * 0.55,
      vy: 0,
      angle: baseAngle,
      life: 22,
      maxLife: 22,
      size: 62 * scale,
      growth: 2.55,
      color: "rgba(226, 197, 135, 0.78)",
      kind: "floorShock",
    });
    const count = fxCount(6, 2);
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: target.x + (Math.random() - 0.5) * 54,
        y: floorY + Math.random() * 4,
        vx: -dir * (0.5 + Math.random() * 1.4),
        vy: -0.18 - Math.random() * 0.5,
        angle: (Math.random() - 0.5) * 0.14,
        life: 18 + Math.random() * 10,
        maxLife: 25,
        size: 9 + Math.random() * 15,
        color: "rgba(214, 182, 120, 0.52)",
        kind: "dustRibbon",
      });
    }
    particles.push({ x, y: y + 8, vx: 0, vy: 0, life: 16, maxLife: 16, size: 28 * scale, growth: 2.1, color, kind: "ring" });
    return;
  }

  if (flavor === "grab") {
    particles.push({ x, y, vx: 0, vy: 0, angle: baseAngle, life: 12, maxLife: 12, size: 50 * scale, color, strength: 1.05, kind: "impactBloom" });
    particles.push({ x: x + dir * 4, y, vx: 0, vy: 0, angle: baseAngle, life: 15, maxLife: 15, size: 32 * scale, growth: 2.2, color: core, kind: "airRipple" });
    const count = fxCount(4, 2);
    for (let i = 0; i < count; i += 1) {
      const lane = count === 1 ? 0 : i / (count - 1) - 0.5;
      const angle = baseAngle + lane * 0.58;
      particles.push({
        x: x - dir * 6,
        y: y + lane * 28,
        vx: Math.cos(angle) * 0.8,
        vy: Math.sin(angle) * 0.26,
        angle,
        life: 13 + Math.random() * 5,
        maxLife: 17,
        size: 8 + Math.random() * 4,
        color: i % 2 ? core : color,
        kind: "hitShard",
      });
    }
    return;
  }

  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    angle: baseAngle,
    life: counter ? 20 : 17,
    maxLife: counter ? 20 : 17,
    size: (counter ? 70 : 58) * scale,
    color: counter ? "#fff1bd" : color,
    strength: counter ? 1.34 : 1.14,
    kind: "impactBloom",
  });
  particles.push({ x: x - dir * 8, y, vx: 0, vy: 0, angle: baseAngle, life: 18, maxLife: 18, size: 40 * scale, growth: 2.7, color: core, kind: "ring" });
}

function signatureImpactFX(x, y, target, visual, dir, hitZone, blocked, counter, projectile, finishingHit) {
  const flavor = visual?.flavor ?? "punch";
  const special = flavor === "special" || projectile;
  const heavy = special || counter || finishingHit || flavor === "kick" || flavor === "sweep" || flavor === "grab";
  const mobile = isMobileFightView();
  if (!heavy && mobile) return;
  if (particles.length > particleBudget() * 0.88) return;

  const baseAngle = dir > 0 ? -0.06 : Math.PI + 0.06;
  const zoneTilt = hitZone === "legs" ? 0.2 : hitZone === "head" ? -0.16 : 0;
  const color = blocked ? "#bdeaff" : counter ? "#fff1bd" : visual?.color ?? "#ffd44d";
  const core = visual?.core ?? "#fff7d6";
  const scale = blocked ? 0.72 : finishingHit ? 1.28 : counter ? 1.18 : special ? 1.12 : heavy ? 1 : 0.82;
  const yOffset = hitZone === "legs" ? 10 : hitZone === "head" ? -7 : 0;
  particles.push({
    x: x - dir * fighterScale(8),
    y: y + yOffset,
    vx: dir * 0.08,
    vy: 0,
    angle: baseAngle + zoneTilt,
    life: Math.round((blocked ? 9 : heavy ? 13 : 10) * (mobile ? 0.88 : 1)),
    maxLife: Math.round((blocked ? 9 : heavy ? 13 : 10) * (mobile ? 0.88 : 1)),
    size: fighterScale((blocked ? 62 : heavy ? 104 : 76) * scale),
    width: (blocked ? 10 : heavy ? 16 : 12) * scale,
    color,
    core,
    kind: "signatureSlash",
  });

  if ((counter || special || finishingHit) && particles.length < particleBudget() * 0.82) {
    particles.push({
      x: x - dir * fighterScale(12),
      y: y + yOffset,
      vx: 0,
      vy: 0,
      angle: baseAngle,
      life: mobile ? 10 : 12,
      maxLife: mobile ? 10 : 12,
      size: fighterScale((counter ? 48 : finishingHit ? 56 : 44) * scale),
      color,
      core,
      kind: "signatureStar",
    });
  }
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

  const laneCount = fxCount(projectile || counter ? 13 : 9, projectile || counter ? 6 : 4);
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
    const shardCount = fxCount(7, 3);
    for (let i = 0; i < shardCount; i += 1) {
      const lane = shardCount === 1 ? 0 : i / (shardCount - 1) - 0.5;
      const angle = baseAngle + lane * 0.82;
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
    const dropletCount = fxCount(8, 4);
    for (let i = 0; i < dropletCount; i += 1) {
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
    trailReach: sweep ? 142 : kick ? 118 : special ? 104 : grab ? 94 : 98,
    trailHeight: sweep ? 20 : kick ? 22 : special ? 44 : grab ? 26 : 22,
    windupPull: sweep ? 9.5 : kick ? 8.4 : special ? 7.2 : grab ? 7.6 : 8.8,
    snapDrive: sweep ? 13.2 : kick ? 15.4 : special ? 10.8 : grab ? 11.2 : 12.6,
    followDrag: sweep ? 2.2 : kick ? 2.9 : special ? 2.5 : grab ? 2.6 : 2.3,
    bodyLift: sweep ? -2.8 : kick ? 3.8 : special ? 1.6 : grab ? 0.8 : 1.2,
    rotation: sweep ? 0.082 : kick ? -0.066 : special ? -0.052 : grab ? 0.058 : 0.064,
    echo: special ? 0.12 : kick || sweep ? 0.14 : grab ? 0.1 : 0.11,
  };
}

function attackReadabilityProfile(f) {
  const attack = f?.attack;
  const phase = attackPhase(attack);
  const spec = attackVisualSpec(attack?.type);
  const motion = characterMotion(f);
  const snap = clamp(Math.max(phase.snap, phase.strike * 0.72), 0, 1.16);
  const active = clamp(Math.max(phase.strike, phase.snap * 1.04, phase.followThrough * 0.42), 0, 1.18);
  const wind = clamp(phase.anticipation, 0, 1);
  const clarity = clamp(active * 0.76 + snap * 0.42 + wind * 0.12, 0, 1.32);
  const profile = f?.profileId === "p1" ? 1.08 : f?.profileId === "p2" ? 0.96 : 1;
  return {
    spec,
    active,
    snap,
    wind,
    clarity,
    profile,
    reach: (spec.kick || spec.sweep ? 1.08 : spec.special ? 1.02 : 0.92) * motion.reach,
    lift: motion.lift,
    heavyLine: clamp((spec.heavy ? 1.1 : 0.82) * profile, 0.72, 1.24),
  };
}

function coldWaterSplash(x, y, dir) {
  const count = fxCount(18, 8);
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI * 0.78 + (i / Math.max(1, count - 1)) * Math.PI * 0.62;
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
  const matchFinish = Boolean(matchOver);
  particles.push({
    x: loser.x + dir * fighterScale(6),
    y: floorY,
    vx: dir * 0.28,
    vy: 0,
    angle: dir > 0 ? 0 : Math.PI,
    life: matchFinish ? 36 : 32,
    maxLife: matchFinish ? 36 : 32,
    size: matchFinish ? 78 : 68,
    growth: matchFinish ? 3.35 : 3.05,
    color: "rgba(226, 197, 135, 0.78)",
    kind: "floorShock",
  });
  particles.push({
    x: loser.x - dir * fighterScale(18),
    y: loser.y - fighterScale(94),
    vx: dir * 0.25,
    vy: 0,
    angle: dir > 0 ? 0.08 : Math.PI - 0.08,
    life: matchFinish ? 24 : 20,
    maxLife: matchFinish ? 24 : 20,
    size: matchFinish ? 84 : 72,
    color,
    strength: matchFinish ? 1.62 : 1.44,
    kind: "contactFlash",
  });
  particles.push({
    x: loser.x + dir * fighterScale(12),
    y: floorY - fighterScale(8),
    vx: 0,
    vy: 0,
    angle: dir > 0 ? 0 : Math.PI,
    life: matchFinish ? 24 : 20,
    maxLife: matchFinish ? 24 : 20,
    size: matchFinish ? 46 : 38,
    growth: matchFinish ? 2.8 : 2.35,
    color: "#fff1bd",
    kind: "ring",
  });
  const collapseDust = fxCount(matchFinish ? 20 : 16, 6);
  for (let i = 0; i < collapseDust; i += 1) {
    particles.push({
      x: loser.x + (Math.random() - 0.5) * fighterScale(64),
      y: floorY + Math.random() * 4,
      vx: -dir * (0.45 + Math.random() * (matchFinish ? 1.7 : 1.45)),
      vy: -0.45 - Math.random() * (matchFinish ? 1.05 : 0.86),
      angle: (Math.random() - 0.5) * 0.18,
      life: 20 + Math.random() * (matchFinish ? 18 : 16),
      maxLife: matchFinish ? 34 : 30,
      size: 10 + Math.random() * (matchFinish ? 20 : 17),
      color: "rgba(214, 182, 120, 0.56)",
      kind: "dustRibbon",
    });
  }
  const streaks = fxCount(matchFinish ? 7 : 5, 2);
  for (let i = 0; i < streaks; i += 1) {
    const lane = streaks === 1 ? 0 : i / (streaks - 1) - 0.5;
    particles.push({
      x: loser.x - dir * fighterScale(24),
      y: loser.y - fighterScale(112) + lane * fighterScale(44),
      vx: dir * (0.5 + Math.random() * 0.5),
      vy: lane * 0.18,
      angle: dir > 0 ? lane * 0.18 : Math.PI - lane * 0.18,
      length: fighterScale((matchFinish ? 88 : 72) * (0.82 + Math.random() * 0.28)),
      life: 16 + Math.random() * (matchFinish ? 9 : 7),
      maxLife: matchFinish ? 24 : 20,
      size: matchFinish ? 4.8 : 4,
      color: i % 2 ? "#fff1bd" : color,
      kind: "impactNeedle",
    });
  }
  impactShockwave(loser.x - dir * fighterScale(12), loser.y - fighterScale(96), color, false, true);
  impactShockwave(loser.x + dir * fighterScale(8), floorY - fighterScale(6), "#fff1bd", false, true);
  impactGlints(loser.x - dir * fighterScale(18), loser.y - fighterScale(118), "#fff1bd", false, true);
}

function floorDust(x, y, count) {
  const dustCount = fxCount(count, Math.min(2, count));
  for (let i = 0; i < dustCount; i += 1) {
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
  const dustCount = fxCount(count, Math.min(1, count));
  for (let i = 0; i < dustCount; i += 1) {
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
        "signatureSlash",
        "signatureStar",
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
  const budget = particleBudget();
  if (particles.length > budget) particles.splice(0, particles.length - budget);
}

function addText(x, y, text, color, options = {}) {
  const life = options.life ?? 54;
  floatingTexts.push({
    x,
    y,
    text,
    color,
    life,
    maxLife: life,
    size: options.size ?? 18,
    rise: options.rise ?? 0.6,
    drift: options.drift ?? 0,
  });
}

function updateFloatingTexts() {
  floatingTexts = floatingTexts.filter((t) => {
    t.y -= t.rise ?? 0.6;
    t.x += t.drift ?? 0;
    t.life -= 1;
    return t.life > 0;
  });
}

function cueAnnouncer(title, subtitle = "", color = "#fff1bd", life = 76) {
  announcerCue = {
    title,
    subtitle,
    color,
    life,
    maxLife: life,
  };
  playSound("announcer", { intensity: title.includes("K.O.") ? 1.28 : 0.92, key: `announcer:${title}` });
}

function updateAnnouncerCue() {
  if (!announcerCue) return;
  announcerCue.life -= 1;
  if (announcerCue.life <= 0) announcerCue = null;
}

function triggerCriticalHealthCues() {
  if (!running || winner || countdownFrames > 0) return;
  for (const fighter of fighters) {
    if (fighter.criticalCue || fighter.health <= 0 || fighter.health > 24) continue;
    fighter.criticalCue = true;
    const color = fighter.trim || "#ffd44d";
    cueAnnouncer("DANGER", `${fighter.name} esta al limite`, color, 64);
    addText(fighter.x, fighter.y - fighterScale(178), "DANGER", color, { size: 22, life: 62, rise: 0.42, drift: fighter.dir * 0.08 });
    playSound("danger", { x: fighter.x, intensity: 1.08, key: `danger:${fighter.id}:${roundNumber}` });
    triggerCinematicHit(fighter.dir || 1, color, 0.82, 18, {
      zoom: 0.032,
      pan: 6,
      lift: 2.6,
      roll: 0.004,
      band: 0.9,
    });
  }
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
  const impactZoom = impactEase * (mobileView ? 0.012 : 0.028) + cinematicEase * (mobileView ? cinematicHitZoom * 0.52 : cinematicHitZoom);
  const impactPan = cameraImpactDir * impactEase * (mobileView ? 4.5 : 8.5) + cinematicHitDir * cinematicEase * (mobileView ? cinematicHitPan * 0.56 : cinematicHitPan);
  const impactLift = -impactEase * (mobileView ? 1.8 : 3.8) - cinematicEase * (mobileView ? cinematicHitLift * 0.52 : cinematicHitLift);
  const cinematicRoll = cinematicHitDir * cinematicEase * (mobileView ? cinematicHitRoll * 0.5 : cinematicHitRoll);
  const drawZoom = cameraZoom + impactZoom;
  const drawPan = clamp(cameraPan + impactPan, -cameraPanLimit(drawZoom, mobileView), cameraPanLimit(drawZoom, mobileView));

  ctx.translate(W / 2 + drawPan, H / 2 + cameraLift + impactLift);
  ctx.rotate(cinematicRoll);
  ctx.scale(drawZoom, drawZoom);
  ctx.translate(-W / 2, -H / 2);
}

function draw() {
  const attractActive = isAttractModeActive();
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
  drawStageForegroundDepth();
  drawFloatingTexts();
  ctx.restore();

  if (attractActive) {
    drawAttractModeOverlay();
  } else {
    drawHud();
    drawComboCounters();
    drawRoundIntroCards();
    drawRoundClashSlate();
    drawCountdown();
    drawKOBanner();
    drawFinishFreezeFrame();
    drawAnnouncerCue();
    drawCinematicHitOverlay();
    drawScreenTearOverlay();
    drawCriticalStateOverlay();
    drawFinalPressureOverlay();
  }
  drawDirectorGrade();

  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 245, 205, ${Math.min(0.24, flash / 64)})`;
    ctx.fillRect(0, 0, W, H);
  }

}

function drawAttractModeOverlay() {
  const t = attractFrame;
  const titleAlpha = overlay.dataset.screen === "versus" ? 0.16 : 0.22;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, "rgba(8, 6, 7, 0.46)");
  shade.addColorStop(0.44, "rgba(18, 10, 9, 0.18)");
  shade.addColorStop(1, "rgba(8, 6, 7, 0.58)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "screen";
  const beam = ctx.createLinearGradient(0, H * 0.2, W, H * 0.74);
  beam.addColorStop(0, colorWithAlpha(fighters[0]?.trim ?? "#ffd44d", 0.08));
  beam.addColorStop(0.5, "rgba(255, 241, 189, 0.055)");
  beam.addColorStop(1, colorWithAlpha(fighters[1]?.trim ?? "#5bd7ff", 0.08));
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(-40, H * 0.28 + Math.sin(t * 0.018) * 10);
  ctx.lineTo(W + 40, H * 0.18 + Math.cos(t * 0.014) * 10);
  ctx.lineTo(W + 40, H * 0.78);
  ctx.lineTo(-40, H * 0.88);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, 0, W, 46);
  ctx.fillRect(0, H - 48, W, 48);

  ctx.globalCompositeOperation = "screen";
  ctx.font = "900 74px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = `rgba(255, 241, 189, ${titleAlpha * 0.52})`;
  ctx.fillStyle = `rgba(255, 226, 132, ${titleAlpha})`;
  const y = overlay.dataset.screen === "versus" ? 292 : 250;
  ctx.strokeText("MINI KOMBAT IV", W / 2, y + Math.sin(t * 0.018) * 3);
  ctx.fillText("MINI KOMBAT IV", W / 2, y + Math.sin(t * 0.018) * 3);

  drawAttractNameplate(fighters[0], 34, H - 92, "left");
  drawAttractNameplate(fighters[1], W - 34, H - 92, "right");
  ctx.restore();
}

function drawAttractNameplate(f, x, y, side) {
  if (!f) return;
  const reverse = side === "right";
  const width = 258;
  const height = 48;
  const px = reverse ? x - width : x;
  const grad = ctx.createLinearGradient(px, y, px + width, y + height);
  grad.addColorStop(0, colorWithAlpha(reverse ? "#090a0d" : f.color, 0.28));
  grad.addColorStop(0.55, "rgba(16, 13, 12, 0.24)");
  grad.addColorStop(1, colorWithAlpha(reverse ? f.color : "#090a0d", 0.28));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(px, y, width, height, 7);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(f.trim, 0.28);
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.textAlign = reverse ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255, 247, 218, 0.68)";
  ctx.font = "900 18px system-ui, sans-serif";
  ctx.fillText(f.name.toUpperCase(), reverse ? px + width - 15 : px + 15, y + 22);
  ctx.fillStyle = colorWithAlpha(f.trim, 0.64);
  ctx.font = "800 10px system-ui, sans-serif";
  ctx.fillText(fighterPresentation(f).discipline.toUpperCase(), reverse ? px + width - 15 : px + 15, y + 38);
}

function drawDirectorGrade() {
  const fightVisible = overlay.classList.contains("hidden");
  if (!fightVisible && overlay.dataset.screen !== "versus" && overlay.dataset.screen !== "winner") return;

  const tension = musicTensionLevel();
  const impact = clamp(Math.max(cameraImpactPulse / Math.max(1, cameraImpactMax), cinematicHitPulse / Math.max(1, cinematicHitMax)), 0, 1);
  const danger = fighters.length ? clamp((45 - Math.min(...fighters.map((f) => f.health))) / 45, 0, 1) : 0;
  const alpha = fightVisible ? 1 : 0.52;
  ctx.save();

  const warm = ctx.createLinearGradient(0, 0, W, H);
  warm.addColorStop(0, `rgba(255, 225, 146, ${0.035 * alpha + tension * 0.018})`);
  warm.addColorStop(0.46, "rgba(255,255,255,0)");
  warm.addColorStop(1, `rgba(80, 190, 220, ${0.025 * alpha + impact * 0.018})`);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);

  const vignette = ctx.createRadialGradient(W / 2, H * 0.48, 170, W / 2, H * 0.5, 610);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.58, `rgba(0,0,0,${0.08 * alpha})`);
  vignette.addColorStop(1, `rgba(0,0,0,${0.48 * alpha + danger * 0.08})`);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  if (fightVisible) {
    const bandAlpha = clamp(0.022 + impact * 0.06 + danger * 0.02, 0, 0.11);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(0,0,0,${bandAlpha})`;
    ctx.fillRect(0, 0, W, 22 + impact * 10);
    ctx.fillRect(0, H - (22 + impact * 10), W, 22 + impact * 10);

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255, 241, 189, ${0.032 + impact * 0.08})`;
    ctx.lineWidth = 1;
    const y = 72 + Math.sin(roundFrame * 0.031) * 8;
    ctx.beginPath();
    ctx.moveTo(90, y);
    ctx.lineTo(W - 90, y + 12);
    ctx.moveTo(120, H - y * 0.62);
    ctx.lineTo(W - 120, H - y * 0.62 - 10);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCinematicHitOverlay() {
  if (cinematicHitPulse <= 0 || cinematicHitStrength <= 0) return;
  const t = clamp(cinematicHitPulse / Math.max(1, cinematicHitMax), 0, 1);
  const ease = t * t * cinematicHitStrength;
  const bandAlpha = Math.min(0.14, ease * 0.075 * cinematicHitBand);
  const flareAlpha = Math.min(0.22, ease * 0.14 * cinematicHitBand);
  const bandHeight = 24 + cinematicHitBand * 11;
  const shift = cinematicHitDir * ease * (12 + cinematicHitPan);

  ctx.save();
  ctx.fillStyle = `rgba(6, 3, 2, ${bandAlpha})`;
  ctx.fillRect(0, 0, W, bandHeight);
  ctx.fillRect(0, H - bandHeight, W, bandHeight);

  ctx.globalCompositeOperation = "screen";
  const flare = ctx.createRadialGradient(W / 2 + shift, H / 2 - 30 - cinematicHitLift * 4, 10, W / 2 + shift, H / 2 - 30, 410 + cinematicHitBand * 36);
  flare.addColorStop(0, colorWithAlpha(cinematicHitColor, flareAlpha));
  flare.addColorStop(0.26, colorWithAlpha(cinematicHitColor, flareAlpha * 0.42));
  flare.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = flare;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = colorWithAlpha(cinematicHitColor, Math.min(0.28, ease * 0.22));
  ctx.lineWidth = 2.2 + ease * (2.2 + cinematicHitBand);
  ctx.beginPath();
  ctx.moveTo(W * 0.18 + shift, 38);
  ctx.lineTo(W * 0.82 + shift, 22);
  ctx.moveTo(W * 0.18 - shift, H - 28);
  ctx.lineTo(W * 0.82 - shift, H - 44);
  ctx.stroke();
  ctx.restore();
}

function drawScreenTearOverlay() {
  if (screenTearPulse <= 0 || screenTearStrength <= 0) return;
  const t = clamp(screenTearPulse / Math.max(1, screenTearMax), 0, 1);
  const ease = t * t * screenTearStrength;
  const color = screenTearColor || "#fff1bd";
  const dir = screenTearDir || 1;
  const mobile = isMobileFightView();
  const laneCount = mobile ? 3 : 5;
  const alpha = clamp(ease * (mobile ? 0.08 : 0.13), 0, mobile ? 0.12 : 0.2);
  if (alpha <= 0.005) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < laneCount; i += 1) {
    const lane = laneCount === 1 ? 0 : i / (laneCount - 1);
    const y = H * (0.22 + lane * 0.58) + Math.sin(roundFrame * 0.19 + i * 1.7) * (mobile ? 3 : 6);
    const height = (mobile ? 5 : 7) + ease * (mobile ? 5 : 8) + i * 0.7;
    const shift = dir * ease * (mobile ? 16 : 30) * (i % 2 ? -0.55 : 1);
    const x0 = -80 + shift;
    const x1 = W + 80 + shift * 0.35;
    const grad = ctx.createLinearGradient(x0, y, x1, y + height);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.22, colorWithAlpha(color, alpha * 0.72));
    grad.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.58})`);
    grad.addColorStop(0.78, colorWithAlpha(color, alpha * 0.52));
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y + dir * (mobile ? 3 : 5));
    ctx.lineTo(x1, y + height + dir * (mobile ? 3 : 5));
    ctx.lineTo(x0, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.62})`;
    ctx.lineWidth = Math.max(1, height * 0.16);
    ctx.beginPath();
    ctx.moveTo(W * 0.18 + shift * 0.4, y + height * 0.5);
    ctx.lineTo(W * 0.82 + shift * 0.2, y + height * 0.5 + dir * 4);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(255, 247, 214, ${alpha * 0.16})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawFloatingTexts() {
  for (const t of floatingTexts) {
    const maxLife = t.maxLife ?? 54;
    const progress = 1 - clamp(t.life / Math.max(1, maxLife), 0, 1);
    const pop = Math.sin(Math.min(1, progress * 2.4) * Math.PI) * 0.08;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(1 + pop, 1 + pop * 0.6);
    ctx.globalAlpha = clamp(t.life / Math.min(28, maxLife), 0, 1);
    ctx.fillStyle = t.color;
    ctx.font = `900 ${t.size ?? 18}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(45, 21, 14, 0.85)";
    ctx.lineWidth = Math.max(4, (t.size ?? 18) * 0.24);
    ctx.strokeText(t.text, 0, 0);
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function compactIntroText(text, maxLength = 30) {
  const clean = String(text ?? "").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function drawRoundIntroCards() {
  if (countdownFrames <= 48 || countdownFrames > 180 || !running || paused || winner) return;

  const intro = smoothStep01(clamp((180 - countdownFrames) / 18, 0, 1));
  const outro = smoothStep01(clamp((countdownFrames - 48) / 44, 0, 1));
  const alpha = intro * outro;
  if (alpha <= 0.01) return;

  const mobile = isMobileFightView();
  const cardW = mobile ? 292 : 336;
  const cardH = mobile ? 86 : 102;
  const y = mobile ? 104 : 116;
  const slide = (1 - intro) * (mobile ? 58 : 86);
  const pulse = 0.5 + Math.sin((180 - countdownFrames) * 0.12) * 0.5;

  ctx.save();
  ctx.globalAlpha = alpha;
  drawRoundIntroCard(fighters[0], "left", 42 - slide, y, cardW, cardH, pulse);
  drawRoundIntroCard(fighters[1], "right", W - 42 - cardW + slide, y, cardW, cardH, pulse);

  ctx.globalCompositeOperation = "screen";
  const beam = ctx.createLinearGradient(W * 0.18, y + cardH + 12, W * 0.82, y + cardH + 12);
  beam.addColorStop(0, "rgba(255, 241, 189, 0)");
  beam.addColorStop(0.5, `rgba(255, 241, 189, ${0.15 * alpha})`);
  beam.addColorStop(1, "rgba(255, 241, 189, 0)");
  ctx.strokeStyle = beam;
  ctx.lineWidth = mobile ? 2 : 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.2, y + cardH + 13);
  ctx.lineTo(W * 0.8, y + cardH + 13);
  ctx.stroke();
  ctx.restore();
}

function drawRoundIntroCard(fighter, side, x, y, width, height, pulse) {
  const reverse = side === "right";
  const trim = fighter.trim || "#fff1bd";
  const presentation = fighterPresentation(fighter);
  const portraitSize = height - 24;
  const portraitX = reverse ? x + width - portraitSize - 14 : x + 14;
  const portraitY = y + 12;
  const textX = reverse ? x + 16 : portraitX + portraitSize + 13;
  const textW = width - portraitSize - 45;
  const textAnchor = reverse ? textX + textW : textX;

  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(reverse ? 0.018 : -0.018);
  ctx.translate(-(x + width / 2), -(y + height / 2));

  const panel = ctx.createLinearGradient(x, y, x + width, y + height);
  panel.addColorStop(0, colorWithAlpha(reverse ? fighter.color : "#090a0d", 0.78));
  panel.addColorStop(0.52, "rgba(15, 11, 12, 0.84)");
  panel.addColorStop(1, colorWithAlpha(reverse ? "#090a0d" : fighter.color, 0.72));
  ctx.fillStyle = panel;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(trim, 0.42 + pulse * 0.14);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(portraitX + portraitSize / 2, portraitY + portraitSize / 2, 8, portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize * 1.12);
  glow.addColorStop(0, colorWithAlpha(trim, 0.22 + pulse * 0.08));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize * 0.88, portraitSize * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(portraitX, portraitY, portraitSize, portraitSize, 7);
  ctx.clip();
  ctx.fillStyle = colorWithAlpha(fighter.color, 0.88);
  ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize);
  if (fighter.face?.complete) {
    ctx.drawImage(fighter.face, portraitX, portraitY, portraitSize, portraitSize);
  } else {
    ctx.fillStyle = "#fff1bd";
    ctx.font = "900 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((fighter.name || "?").slice(0, 1).toUpperCase(), portraitX + portraitSize / 2, portraitY + portraitSize / 2);
  }
  ctx.restore();
  ctx.strokeStyle = colorWithAlpha(trim, 0.7);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(portraitX + 1, portraitY + 1, portraitSize - 2, portraitSize - 2);

  ctx.textAlign = reverse ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(126, 240, 207, 0.94)";
  ctx.font = "900 9px system-ui, sans-serif";
  ctx.fillText(reverse ? "JUGADOR 2" : cpuEnabled ? "CPU" : "JUGADOR 1", textAnchor, y + 23);

  ctx.fillStyle = "#fff3c4";
  ctx.font = "900 28px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(28, 10, 8, 0.88)";
  const name = compactIntroText(fighter.name, 16).toUpperCase();
  ctx.strokeText(name, textAnchor, y + 52);
  ctx.fillText(name, textAnchor, y + 52);

  ctx.fillStyle = colorWithAlpha(trim, 0.94);
  ctx.font = "900 10px system-ui, sans-serif";
  ctx.fillText(compactIntroText(presentation.discipline, 28).toUpperCase(), textAnchor, y + 70);
  ctx.fillStyle = "rgba(255, 247, 214, 0.84)";
  ctx.font = "900 10px system-ui, sans-serif";
  ctx.fillText(compactIntroText(presentation.signature, 30).toUpperCase(), textAnchor, y + 86);

  ctx.restore();
}

function drawRoundClashSlate() {
  if (countdownFrames <= 36 || countdownFrames > 132 || !running || paused || winner) return;
  if (isMobileFightView()) return;

  const age = 132 - countdownFrames;
  const intro = smoothStep01(clamp(age / 15, 0, 1));
  const outro = smoothStep01(clamp((countdownFrames - 36) / 24, 0, 1));
  const alpha = intro * outro;
  if (alpha <= 0.01) return;

  const mobile = false;
  const y = H - 116;
  const panelW = 312;
  const panelH = 72;
  const gap = 18;
  const slide = (1 - intro) * 76;
  const leftX = W / 2 - panelW - gap - slide;
  const rightX = W / 2 + gap + slide;
  const pulse = 0.5 + Math.sin((132 - countdownFrames) * 0.15) * 0.5;

  ctx.save();
  ctx.globalAlpha = alpha;
  drawClashFighterPlate(fighters[0], leftX, y, panelW, panelH, false, pulse, mobile);
  drawClashFighterPlate(fighters[1], rightX, y, panelW, panelH, true, pulse, mobile);

  const centerW = mobile ? 66 : 82;
  const centerH = mobile ? 52 : 62;
  const centerX = W / 2 - centerW / 2;
  const centerY = y + panelH / 2 - centerH / 2;
  const centerGrad = ctx.createLinearGradient(centerX, centerY, centerX + centerW, centerY + centerH);
  centerGrad.addColorStop(0, "rgba(72, 16, 12, 0.92)");
  centerGrad.addColorStop(0.5, "rgba(14, 10, 10, 0.94)");
  centerGrad.addColorStop(1, "rgba(72, 16, 12, 0.92)");
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.roundRect(centerX, centerY, centerW, centerH, 7);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 241, 189, ${0.34 + pulse * 0.2})`;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 212, 77, ${0.22 + pulse * 0.18})`;
  ctx.lineWidth = mobile ? 2 : 3;
  ctx.beginPath();
  ctx.moveTo(centerX + 8, centerY + centerH / 2);
  ctx.lineTo(centerX + centerW - 8, centerY + centerH / 2);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff1bd";
  ctx.strokeStyle = "rgba(38, 10, 7, 0.88)";
  ctx.lineWidth = mobile ? 4 : 5;
  ctx.font = `900 ${mobile ? 24 : 30}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`;
  ctx.strokeText("CLASH", W / 2, centerY + centerH / 2 - (mobile ? 2 : 3));
  ctx.fillText("CLASH", W / 2, centerY + centerH / 2 - (mobile ? 2 : 3));
  ctx.fillStyle = "rgba(126, 240, 207, 0.84)";
  ctx.font = `900 ${mobile ? 7 : 8}px system-ui, sans-serif`;
  ctx.fillText("PLAN DE ROUND", W / 2, centerY + centerH - 10);
  ctx.restore();
}

function drawClashFighterPlate(fighter, x, y, width, height, reverse, pulse, mobile) {
  if (!fighter) return;
  const presentation = fighterPresentation(fighter);
  const trim = fighter.trim || "#fff1bd";
  const color = fighter.color || "#111216";
  const textX = reverse ? x + width - 13 : x + 13;
  const align = reverse ? "right" : "left";
  const tag = compactIntroText(presentation.archetype || fighterTrait(fighter), mobile ? 13 : 16).toUpperCase();
  const signature = compactIntroText(presentation.signature, mobile ? 20 : 27).toUpperCase();
  const edge = compactIntroText(presentation.edge || presentation.callout, mobile ? 24 : 36).toUpperCase();

  const panel = ctx.createLinearGradient(x, y, x + width, y + height);
  panel.addColorStop(0, colorWithAlpha(reverse ? "#090a0d" : color, 0.76));
  panel.addColorStop(0.5, "rgba(10, 9, 10, 0.82)");
  panel.addColorStop(1, colorWithAlpha(reverse ? color : "#090a0d", 0.74));
  ctx.fillStyle = panel;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(trim, 0.38 + pulse * 0.16);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  const beam = ctx.createLinearGradient(reverse ? x + width : x, y, reverse ? x : x + width, y + height);
  beam.addColorStop(0, colorWithAlpha(trim, 0.16 + pulse * 0.08));
  beam.addColorStop(0.42, "rgba(255,255,255,0)");
  beam.addColorStop(1, colorWithAlpha(color, 0.06));
  ctx.fillStyle = beam;
  ctx.beginPath();
  if (reverse) {
    ctx.moveTo(x + width - 8, y + 5);
    ctx.lineTo(x + width * 0.22, y + 5);
    ctx.lineTo(x + width * 0.42, y + height - 5);
    ctx.lineTo(x + width - 4, y + height - 5);
  } else {
    ctx.moveTo(x + 8, y + 5);
    ctx.lineTo(x + width * 0.78, y + 5);
    ctx.lineTo(x + width * 0.58, y + height - 5);
    ctx.lineTo(x + 4, y + height - 5);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colorWithAlpha(trim, 0.94);
  ctx.font = `900 ${mobile ? 8 : 9}px system-ui, sans-serif`;
  ctx.fillText(tag, textX, y + (mobile ? 13 : 15));
  ctx.fillStyle = "#fff1bd";
  ctx.strokeStyle = "rgba(29, 8, 6, 0.88)";
  ctx.lineWidth = mobile ? 3 : 4;
  ctx.font = `900 ${mobile ? 20 : 25}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`;
  ctx.strokeText(fighter.name.toUpperCase(), textX, y + (mobile ? 34 : 40));
  ctx.fillText(fighter.name.toUpperCase(), textX, y + (mobile ? 34 : 40));
  ctx.fillStyle = colorWithAlpha(trim, 0.9);
  ctx.font = `900 ${mobile ? 7 : 8}px system-ui, sans-serif`;
  ctx.fillText(signature, textX, y + (mobile ? 47 : 55));
  if (!mobile) {
    ctx.fillStyle = "rgba(255, 247, 214, 0.72)";
    ctx.font = "850 8px system-ui, sans-serif";
    ctx.fillText(edge, textX, y + 66);
  }
}

function countdownRead() {
  const fight = countdownFrames <= 36;
  const phaseStart = fight ? 36 : Math.ceil((countdownFrames - 36) / 48) * 48 + 36;
  const phaseLife = fight ? 36 : 48;
  const age = clamp((phaseStart - countdownFrames) / phaseLife, 0, 1);
  const label = fight ? "FIGHT" : String(Math.ceil((countdownFrames - 36) / 48));
  return {
    label,
    fight,
    age,
    color: fight ? "#ffd44d" : label === "2" ? "#75f0cb" : "#fff1bd",
    pulse: 1 + Math.sin((1 - age) * Math.PI) * (fight ? 0.105 : 0.072),
    snap: 1 - smoothStep01(clamp(age / 0.72, 0, 1)),
  };
}

function drawCountdownNamePlate(fighter, x, y, width, reverse, alpha) {
  if (!fighter) return;
  const trim = fighter.trim || "#fff1bd";
  const height = 42;
  const skew = reverse ? -14 : 14;
  const grad = ctx.createLinearGradient(x, y, x + width, y + height);
  grad.addColorStop(0, colorWithAlpha(reverse ? "#09090c" : fighter.color, 0.62 * alpha));
  grad.addColorStop(0.5, `rgba(14, 10, 10, ${0.68 * alpha})`);
  grad.addColorStop(1, colorWithAlpha(reverse ? fighter.color : "#09090c", 0.62 * alpha));

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x + (reverse ? -skew : 0), y);
  ctx.lineTo(x + width + (reverse ? 0 : skew), y);
  ctx.lineTo(x + width + (reverse ? skew : 0), y + height);
  ctx.lineTo(x + (reverse ? 0 : -skew), y + height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(trim, 0.34 * alpha);
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = colorWithAlpha(trim, 0.08 * alpha);
  ctx.fillRect(x + 8, y + 5, width - 16, 4);
  ctx.globalCompositeOperation = "source-over";

  ctx.textAlign = reverse ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.76)";
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#fff1bd";
  ctx.font = "900 18px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif";
  const textX = reverse ? x + width - 14 : x + 14;
  ctx.fillText(fighter.name.toUpperCase(), textX, y + 23);
  ctx.fillStyle = colorWithAlpha(trim, 0.82 * alpha);
  ctx.font = "900 8px system-ui, sans-serif";
  ctx.fillText(fighterPresentation(fighter).signature.toUpperCase(), textX, y + 36);
  ctx.restore();
}

function drawCountdown() {
  if (countdownFrames <= 0 || !running || paused) return;
  const read = countdownRead();
  const mobile = isMobileFightView();
  const alpha = read.fight ? 0.94 : 0.82;
  const centerY = mobile ? H / 2 - 2 : H / 2 - 8;
  const bandH = mobile ? 124 : 158;
  const bandY = centerY - bandH / 2;
  const plateW = mobile ? 220 : 276;
  const plateY = centerY + (mobile ? 50 : 64);
  const snapShift = read.snap * (mobile ? 34 : 54);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "multiply";
  const shade = ctx.createLinearGradient(0, bandY - 38, 0, bandY + bandH + 48);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(0.34, "rgba(0,0,0,0.34)");
  shade.addColorStop(0.66, "rgba(0,0,0,0.34)");
  shade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandY - 42, W, bandH + 84);

  ctx.globalCompositeOperation = "source-over";
  const band = ctx.createLinearGradient(0, bandY, W, bandY + bandH);
  band.addColorStop(0, colorWithAlpha(fighters[0].trim, read.fight ? 0.12 : 0.06));
  band.addColorStop(0.46, "rgba(73,18,13,0.12)");
  band.addColorStop(0.54, "rgba(73,18,13,0.12)");
  band.addColorStop(1, colorWithAlpha(fighters[1].trim, read.fight ? 0.12 : 0.06));
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo(-60, bandY + 18);
  ctx.lineTo(W + 60, bandY - 8);
  ctx.lineTo(W + 60, bandY + bandH - 18);
  ctx.lineTo(-60, bandY + bandH + 8);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = "screen";
  const slashAlpha = read.fight ? 0.34 : 0.22;
  ctx.strokeStyle = colorWithAlpha(read.color, slashAlpha);
  ctx.lineWidth = read.fight ? 7 : 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(96 - snapShift, bandY + bandH - 18);
  ctx.lineTo(W * 0.43, bandY + 18);
  ctx.moveTo(W - 96 + snapShift, bandY + 18);
  ctx.lineTo(W * 0.57, bandY + bandH - 18);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 241, 189, ${read.fight ? 0.28 : 0.16})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(34, bandY + 8);
  ctx.lineTo(W - 34, bandY - 4);
  ctx.moveTo(34, bandY + bandH + 4);
  ctx.lineTo(W - 34, bandY + bandH - 8);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  drawCountdownNamePlate(fighters[0], mobile ? 72 : 76 - snapShift * 0.35, plateY, plateW, false, 0.84);
  drawCountdownNamePlate(fighters[1], W - (mobile ? 72 : 76) - plateW + snapShift * 0.35, plateY, plateW, true, 0.84);

  ctx.translate(W / 2, centerY);
  ctx.scale(read.pulse, read.pulse);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = colorWithAlpha(read.color, read.fight ? 0.54 : 0.32);
  ctx.shadowBlur = read.fight ? 24 : 14;
  ctx.font = read.fight
    ? `900 ${mobile ? 76 : 96}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`
    : `900 ${mobile ? 112 : 132}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`;
  ctx.lineWidth = read.fight ? 11 : 13;
  ctx.strokeStyle = "rgba(35, 11, 8, 0.96)";
  const textFill = ctx.createLinearGradient(0, read.fight ? -46 : -66, 0, read.fight ? 38 : 58);
  textFill.addColorStop(0, "#fff8da");
  textFill.addColorStop(0.54, read.color);
  textFill.addColorStop(1, "#b75b24");
  ctx.fillStyle = textFill;
  ctx.strokeText(read.label, 0, 0);
  ctx.fillText(read.label, 0, 0);

  ctx.shadowBlur = 6;
  ctx.font = `900 ${mobile ? 11 : 14}px system-ui, sans-serif`;
  ctx.fillStyle = read.fight ? "rgba(255, 244, 190, 0.94)" : colorWithAlpha(read.color, 0.9);
  ctx.fillText(read.fight ? "ROUND EN VIVO" : "READY", 0, read.fight ? -62 : -78);
  ctx.fillStyle = "rgba(255, 247, 214, 0.9)";
  ctx.font = `900 ${mobile ? 12 : 16}px system-ui, sans-serif`;
  ctx.fillText(`${fighters[0].name.toUpperCase()}  VS  ${fighters[1].name.toUpperCase()}`, 0, read.fight ? 56 : 72);

  const pipY = read.fight ? 78 : 94;
  for (let i = 0; i < 3; i += 1) {
    const active = read.fight || Number(read.label) <= 3 - i;
    ctx.fillStyle = active ? colorWithAlpha(read.color, 0.82) : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.roundRect(-28 + i * 22, pipY, 12, 4, 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAnnouncerCue() {
  if (!announcerCue) return;
  const t = clamp(announcerCue.life / Math.max(1, announcerCue.maxLife), 0, 1);
  const intro = smoothStep01(clamp((announcerCue.maxLife - announcerCue.life) / 12, 0, 1));
  const outro = smoothStep01(clamp(announcerCue.life / 18, 0, 1));
  const alpha = intro * outro;
  if (alpha <= 0.01) return;

  const title = announcerCue.title;
  const subtitle = announcerCue.subtitle;
  const color = announcerCue.color || "#fff1bd";
  const danger = title === "DANGER";
  const ko = title.includes("K.O.");
  const y = ko ? 160 : danger ? 138 : 126;
  const width = ko ? 430 : danger ? 360 : 330;
  const height = subtitle ? 92 : 70;
  const snap = Math.sin(Math.min(1, (announcerCue.maxLife - announcerCue.life) / 15) * Math.PI) * 0.08;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, y);
  ctx.scale(1 + snap, 1 + snap * 0.55);
  ctx.translate(-W / 2, -y);

  const x = W / 2 - width / 2;
  const panelY = y - height / 2;
  const panel = ctx.createLinearGradient(x, panelY, x + width, panelY + height);
  panel.addColorStop(0, "rgba(5, 5, 8, 0)");
  panel.addColorStop(0.18, danger ? "rgba(98, 18, 16, 0.66)" : "rgba(18, 10, 9, 0.66)");
  panel.addColorStop(0.5, ko ? "rgba(132, 29, 18, 0.78)" : "rgba(45, 22, 16, 0.72)");
  panel.addColorStop(0.82, danger ? "rgba(98, 18, 16, 0.66)" : "rgba(18, 10, 9, 0.66)");
  panel.addColorStop(1, "rgba(5, 5, 8, 0)");
  ctx.fillStyle = panel;
  ctx.fillRect(x, panelY, width, height);

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(color, danger ? 0.42 : 0.34);
  ctx.lineWidth = danger ? 4 : 3;
  ctx.beginPath();
  ctx.moveTo(x + 34, panelY + height * 0.5);
  ctx.lineTo(x + width - 34, panelY + height * 0.5);
  ctx.stroke();

  const glow = ctx.createRadialGradient(W / 2, y, 8, W / 2, y, width * 0.55);
  glow.addColorStop(0, colorWithAlpha(color, danger ? 0.22 : 0.18));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, panelY - 18, width, height + 36);
  ctx.globalCompositeOperation = "source-over";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${ko ? 62 : danger ? 50 : 48}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`;
  ctx.lineWidth = ko ? 8 : 7;
  ctx.strokeStyle = "rgba(22, 6, 5, 0.94)";
  ctx.fillStyle = ko ? "#fff1bd" : danger ? "#ffd44d" : "#fff7d6";
  ctx.strokeText(title, W / 2, y - (subtitle ? 10 : 0));
  ctx.fillText(title, W / 2, y - (subtitle ? 10 : 0));

  if (subtitle) {
    ctx.font = "900 12px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 239, 184, 0.88)";
    ctx.fillText(subtitle.toUpperCase(), W / 2, y + 31);
  }
  ctx.restore();
}

function drawCriticalStateOverlay() {
  if (!running || winner || countdownFrames > 0) return;
  const dangerFighters = fighters.filter((f) => f.health > 0 && f.health <= 24);
  if (!dangerFighters.length) return;
  const t = 0.5 + Math.sin(roundFrame * 0.12) * 0.5;
  const strength = clamp(Math.max(...dangerFighters.map((f) => (24 - f.health) / 24)), 0.08, 1);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const f of dangerFighters) {
    const sideX = f.x < W / 2 ? 0 : W;
    const grad = ctx.createLinearGradient(sideX, 0, W / 2, H);
    grad.addColorStop(0, colorWithAlpha(f.trim || "#ffd44d", (0.09 + t * 0.05) * strength));
    grad.addColorStop(0.42, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = `rgba(255, 212, 77, ${0.12 + t * 0.08})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.restore();
}

function drawFinalPressureOverlay() {
  const pressure = finalPressureLevel();
  if (pressure <= 0) return;

  const seconds = roundTimerSeconds();
  const pulse = clamp(finalPressurePulse / 30, 0, 1);
  const beat = 0.5 + Math.sin(roundFrame * (seconds <= 5 ? 0.36 : 0.22)) * 0.5;
  const mobile = isMobileFightView();
  const alpha = clamp(0.04 + pressure * 0.09 + pulse * 0.08, 0, mobile ? 0.16 : 0.22);
  const color = seconds <= 3 ? "#ff674d" : "#ffd44d";
  const bandH = mobile ? 18 + pulse * 6 : 26 + pulse * 9;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(28, 3, 2, ${0.04 + pressure * 0.08})`;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "screen";
  const sideGlow = ctx.createLinearGradient(0, 0, W, 0);
  sideGlow.addColorStop(0, colorWithAlpha(color, alpha));
  sideGlow.addColorStop(0.16, "rgba(255,255,255,0)");
  sideGlow.addColorStop(0.84, "rgba(255,255,255,0)");
  sideGlow.addColorStop(1, colorWithAlpha(color, alpha));
  ctx.fillStyle = sideGlow;
  ctx.fillRect(0, 0, W, H);

  const band = ctx.createLinearGradient(0, 0, W, 0);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(0.32, colorWithAlpha(color, alpha * 0.62));
  band.addColorStop(0.5, `rgba(255, 241, 189, ${alpha * 0.55})`);
  band.addColorStop(0.68, colorWithAlpha(color, alpha * 0.62));
  band.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, W, bandH);
  ctx.fillRect(0, H - bandH, W, bandH);

  ctx.strokeStyle = colorWithAlpha(color, 0.12 + pressure * 0.12 + pulse * 0.16);
  ctx.lineWidth = 2 + pulse * 2;
  ctx.setLineDash([14 + beat * 8, 16]);
  ctx.lineDashOffset = -roundFrame * (seconds <= 5 ? 1.8 : 1.1);
  ctx.strokeRect(10, 10, W - 20, H - 20);

  ctx.setLineDash([]);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = colorWithAlpha("#fff1bd", 0.08 + pulse * 0.13);
  const lanes = mobile ? 3 : 5;
  for (let i = 0; i < lanes; i += 1) {
    const y = H * (0.28 + i * 0.11) + Math.sin(roundFrame * 0.12 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(70 + i * 12, y);
    ctx.lineTo(W - 70 - i * 18, y - 8 - pulse * 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStage() {
  const premiumReady = stageArt.complete && stageArt.naturalWidth > 0;
  const mode = premiumReady ? "premium" : "fallback";
  if (!stageCacheReady || stageCacheMode !== mode) buildStageCache(premiumReady);
  ctx.drawImage(stageCache, 0, 0);

  drawDynamicStageOverlays(premiumReady);
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

function drawDynamicStageOverlays(premiumReady = true) {
  drawAmbientLight();
  drawCinematicLightBeams();
  drawReactiveDojoFocus(premiumReady);
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

function stageReactiveRead() {
  const impact = clamp(Math.max(cameraImpactPulse / Math.max(1, cameraImpactMax), cinematicHitPulse / Math.max(1, cinematicHitMax), screenTearPulse / Math.max(1, screenTearMax)), 0, 1);
  const criticalFighter = fighters.find((fighter) => fighter.health > 0 && fighter.health <= 24);
  const specialLeader = fighters.reduce((best, fighter) => ((fighter.energy ?? 0) > (best?.energy ?? -1) ? fighter : best), null);
  const momentum = momentumReadState();
  const bothLoaded = fighters.length >= 2 && fighters.every((fighter) => (fighter.energy ?? 0) >= 45);
  const winnerFighter = winner ? fighters.find((fighter) => fighter.id === roundWinnerId) ?? fighters.find((fighter) => fighter.name === winner) : null;
  const color =
    winnerFighter?.trim ||
    criticalFighter?.trim ||
    momentum.leader?.trim ||
    (bothLoaded ? "#75f0cb" : specialLeader?.energy >= 45 ? specialLeader.trim : "#fff1bd");
  const focusX = winnerFighter?.x ?? criticalFighter?.x ?? momentum.leader?.x ?? specialLeader?.x ?? W / 2;
  const critical = criticalFighter ? clamp((28 - criticalFighter.health) / 28, 0.18, 1) : 0;
  const special = specialLeader ? clamp(((specialLeader.energy ?? 0) - 45) / 55, 0, 1) : 0;
  const result = winner ? clamp(resultFrame / 70, 0, 1) : 0;
  const intensity = clamp(impact * 0.58 + critical * 0.34 + special * 0.18 + (bothLoaded ? 0.16 : 0) + result * 0.42 + (momentum.amount ?? 0) * 0.08, 0, 1.35);
  return { color, focusX, intensity, impact, critical, special, bothLoaded, result, momentum };
}

function drawReactiveDojoFocus(premiumReady = true) {
  if (!running && !isAttractModeActive()) return;
  const read = stageReactiveRead();
  if (read.intensity <= 0.025) return;

  const mobile = isMobileFightView();
  const pulse = 0.5 + Math.sin(roundFrame * 0.13) * 0.5;
  const alpha = read.intensity * (mobile ? 0.72 : 1);
  const signY = premiumReady ? 234 : 224;
  const signW = premiumReady ? 306 : 274;
  const signH = premiumReady ? 74 : 62;
  const signX = W / 2 - signW / 2;
  const focus = clamp((read.focusX - W / 2) / (W / 2), -1, 1);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const centerGlow = ctx.createRadialGradient(W / 2 + focus * 52, signY + 20, 8, W / 2 + focus * 42, signY + 24, 260 + alpha * 110);
  centerGlow.addColorStop(0, colorWithAlpha(read.color, 0.12 * alpha));
  centerGlow.addColorStop(0.38, colorWithAlpha("#fff1bd", 0.045 * alpha));
  centerGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 118, W, 256);

  ctx.strokeStyle = colorWithAlpha(read.color, 0.14 + alpha * 0.18 + read.impact * 0.14);
  ctx.lineWidth = 2 + read.impact * 3.5;
  ctx.beginPath();
  ctx.roundRect(signX - 8 - read.impact * 8, signY - 8 - read.impact * 4, signW + 16 + read.impact * 16, signH + 16 + read.impact * 8, 8);
  ctx.stroke();

  const scanX = signX + ((roundFrame * (read.result > 0 ? 3.1 : 1.25)) % (signW + 48)) - 24;
  ctx.strokeStyle = colorWithAlpha("#fff8d8", (0.055 + pulse * 0.035 + read.impact * 0.09) * alpha);
  ctx.lineWidth = 3 + read.impact * 2;
  ctx.beginPath();
  ctx.moveTo(scanX, signY - 3);
  ctx.lineTo(scanX + 38 + read.impact * 22, signY + signH + 3);
  ctx.stroke();

  for (let i = 0; i < (mobile ? 3 : 5); i += 1) {
    const lane = i / Math.max(1, (mobile ? 2 : 4));
    const y = 96 + lane * 230 + Math.sin(roundFrame * 0.035 + i) * 7;
    const dir = i % 2 ? -1 : 1;
    const beam = ctx.createLinearGradient(0, y, W, y + dir * 22);
    beam.addColorStop(0, "rgba(255,255,255,0)");
    beam.addColorStop(0.34, colorWithAlpha(read.color, 0.028 * alpha));
    beam.addColorStop(0.5, `rgba(255, 241, 189, ${0.026 * alpha})`);
    beam.addColorStop(0.66, colorWithAlpha(read.color, 0.024 * alpha));
    beam.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-40, y);
    ctx.lineTo(W + 40, y + dir * (10 + read.impact * 10));
    ctx.lineTo(W + 40, y + 8 + dir * (14 + read.impact * 10));
    ctx.lineTo(-40, y + 8);
    ctx.closePath();
    ctx.fill();
  }

  if (read.critical > 0.03 || read.result > 0.03) {
    ctx.strokeStyle = colorWithAlpha(read.color, 0.12 * alpha + read.critical * 0.08 + read.result * 0.1);
    ctx.lineWidth = 2.4 + read.result * 2.2;
    ctx.setLineDash([18, 14]);
    ctx.lineDashOffset = -roundFrame * 1.6;
    ctx.beginPath();
    ctx.roundRect(78, 64, W - 156, FLOOR - 72, 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.globalCompositeOperation = "multiply";
  const pressure = ctx.createLinearGradient(0, 92, 0, FLOOR + 12);
  pressure.addColorStop(0, "rgba(0,0,0,0)");
  pressure.addColorStop(0.42, `rgba(34, 10, 8, ${0.025 * alpha + read.critical * 0.035})`);
  pressure.addColorStop(1, `rgba(0,0,0, ${0.035 * alpha + read.result * 0.045})`);
  ctx.fillStyle = pressure;
  ctx.fillRect(0, 72, W, FLOOR - 48);
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
  const landingWeight = landing * clamp(f.landingStrength ?? 1, 0.42, 1.65);
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

  const tension = musicTensionLevel();
  const airDrift = Math.sin(roundFrame * 0.006) * 18;
  const lowHealth = fighters.some((fighter) => fighter.health > 0 && fighter.health <= 28);
  const combatWake = clamp((Math.abs(fighters[0]?.vx ?? 0) + Math.abs(fighters[1]?.vx ?? 0)) / 13, 0, 1);

  for (let i = 0; i < 18; i += 1) {
    const speed = 0.08 + (i % 5) * 0.018 + tension * 0.025;
    const x = (i * 73 + roundFrame * speed + airDrift * (i % 2 ? 0.32 : -0.18)) % (W + 40) - 20;
    const y = 78 + ((i * 47 + Math.sin(t + i * 0.8) * 24) % 286);
    const alpha = 0.028 + (i % 4) * 0.009 + tension * 0.012;
    ctx.fillStyle = `rgba(255, 235, 178, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.1 + (i % 3) * 0.72, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 9; i += 1) {
    const travel = (roundFrame * (0.34 + i * 0.025) + i * 89) % (W + 120);
    const x = travel - 60 + Math.sin(t * 1.8 + i) * 24;
    const y = 124 + ((i * 71 + roundFrame * (0.18 + i * 0.006)) % 270);
    const flip = Math.sin(roundFrame * 0.038 + i * 1.7);
    const petalAlpha = 0.08 + tension * 0.035 + (lowHealth ? 0.035 : 0);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(flip * 0.72 + i);
    ctx.fillStyle = `rgba(255, 184, 164, ${petalAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.2 + Math.abs(flip) * 1.4, 1.7 + (i % 2) * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalCompositeOperation = "multiply";
  const breath = 0.5 + Math.sin(roundFrame * 0.009) * 0.5;
  const haze = ctx.createLinearGradient(0, 94, W, FLOOR + 8);
  haze.addColorStop(0, `rgba(72, 40, 22, ${0.02 + breath * 0.02})`);
  haze.addColorStop(0.5, "rgba(255,255,255,0)");
  haze.addColorStop(1, `rgba(40, 24, 14, ${0.05 + combatWake * 0.035})`);
  ctx.fillStyle = haze;
  ctx.fillRect(0, 86, W, FLOOR - 50);

  ctx.globalCompositeOperation = "screen";
  const floorWake = ctx.createRadialGradient(W / 2, FLOOR + 16, 30, W / 2, FLOOR + 18, 390);
  floorWake.addColorStop(0, `rgba(255, 241, 189, ${0.035 + combatWake * 0.055})`);
  floorWake.addColorStop(0.54, `rgba(255, 195, 105, ${0.018 + tension * 0.024})`);
  floorWake.addColorStop(1, "rgba(255, 195, 105, 0)");
  ctx.fillStyle = floorWake;
  ctx.fillRect(0, FLOOR - 35, W, H - FLOOR + 35);

  ctx.restore();
}

function drawStageForegroundDepth() {
  const tension = musicTensionLevel();
  const impact = clamp(Math.max(cameraImpactPulse / Math.max(1, cameraImpactMax), cinematicHitPulse / Math.max(1, cinematicHitMax)), 0, 1);
  const lowHealth = fighters.some((fighter) => fighter.health > 0 && fighter.health <= 24);
  const specialHeat = clamp(Math.max(...fighters.map((fighter) => fighter.energy ?? 0)) / 100, 0, 1);
  const flicker = 0.5 + Math.sin(roundFrame * 0.082) * 0.32 + Math.sin(roundFrame * 0.19) * 0.18;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const lipShade = ctx.createLinearGradient(0, FLOOR + 28, 0, H);
  lipShade.addColorStop(0, "rgba(0,0,0,0)");
  lipShade.addColorStop(0.48, `rgba(20, 10, 8, ${0.18 + tension * 0.04})`);
  lipShade.addColorStop(1, `rgba(0,0,0, ${0.56 + impact * 0.1})`);
  ctx.fillStyle = lipShade;
  ctx.fillRect(0, FLOOR + 14, W, H - FLOOR);

  for (const post of [
    { x: -18, w: 44, lean: -0.05, alpha: 0.34 },
    { x: W - 28, w: 46, lean: 0.045, alpha: 0.32 },
  ]) {
    ctx.save();
    ctx.translate(post.x + post.w / 2, H / 2);
    ctx.rotate(post.lean + Math.sin(roundFrame * 0.008 + post.x) * 0.004);
    const postGrad = ctx.createLinearGradient(-post.w / 2, 0, post.w / 2, 0);
    postGrad.addColorStop(0, `rgba(0,0,0,${post.alpha + 0.18})`);
    postGrad.addColorStop(0.52, `rgba(71, 35, 20,${post.alpha})`);
    postGrad.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = postGrad;
    ctx.fillRect(-post.w / 2, -H * 0.52, post.w, H * 1.1);
    ctx.restore();
  }

  ctx.globalCompositeOperation = "screen";
  const floorEdge = ctx.createLinearGradient(60, FLOOR + 58, W - 60, FLOOR + 58);
  floorEdge.addColorStop(0, "rgba(255, 214, 116, 0)");
  floorEdge.addColorStop(0.5, `rgba(255, 232, 172, ${0.08 + tension * 0.035 + impact * 0.035})`);
  floorEdge.addColorStop(1, "rgba(255, 214, 116, 0)");
  ctx.strokeStyle = floorEdge;
  ctx.lineWidth = 2.4 + impact * 2;
  ctx.beginPath();
  ctx.moveTo(62, FLOOR + 57 + Math.sin(roundFrame * 0.014) * 1.2);
  ctx.quadraticCurveTo(W / 2, FLOOR + 66 + impact * 3, W - 62, FLOOR + 57 - Math.sin(roundFrame * 0.011) * 1.2);
  ctx.stroke();

  for (const f of fighters) {
    const charge = clamp(((f.energy ?? 0) - 55) / 45, 0, 1);
    const attackGlow = f.attack?.type === "special" ? Math.max(attackPhase(f.attack).power, attackPhase(f.attack).snap) : 0;
    const hurtGlow = clamp((f.reactionPulse ?? 0) / Math.max(1, f.reactionMax ?? 1), 0, 1) * 0.28;
    const glow = Math.max(charge * 0.42, attackGlow * 0.58, hurtGlow);
    if (glow <= 0.02) continue;
    const radius = 92 + glow * 58;
    const aura = ctx.createRadialGradient(f.x, FLOOR + 38, 6, f.x, FLOOR + 38, radius);
    aura.addColorStop(0, colorWithAlpha(f.trim || "#fff1bd", 0.13 * glow));
    aura.addColorStop(0.46, colorWithAlpha(f.color || "#ffd44d", 0.055 * glow));
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(f.x, FLOOR + 40, radius * 1.3, 23 + glow * 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const lamp of [
    { x: 82, side: -1 },
    { x: W - 82, side: 1 },
  ]) {
    const heat = 0.44 + flicker * 0.18 + tension * 0.08 + (lowHealth ? 0.06 : 0) + specialHeat * 0.04;
    const y = FLOOR + 79;
    const glow = ctx.createRadialGradient(lamp.x, y - 17, 2, lamp.x, y - 17, 58 + heat * 20);
    glow.addColorStop(0, `rgba(255, 231, 160, ${0.2 + heat * 0.1})`);
    glow.addColorStop(0.34, `rgba(255, 131, 67, ${0.09 + heat * 0.04})`);
    glow.addColorStop(1, "rgba(255, 131, 67, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, y - 17, 64 + heat * 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(16, 9, 7, 0.78)";
    ctx.beginPath();
    ctx.ellipse(lamp.x, y, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(69, 31, 18, 0.88)";
    ctx.beginPath();
    ctx.ellipse(lamp.x, y - 3, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255, 221, 139, ${0.54 + heat * 0.18})`;
    ctx.beginPath();
    ctx.ellipse(lamp.x + lamp.side * flicker * 2.2, y - 23 - heat * 4, 5.5 + heat * 2, 14 + heat * 5, lamp.side * 0.12, 0, Math.PI * 2);
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

function compactHudMode() {
  return window.innerWidth <= 920 || window.innerHeight <= 520 || window.matchMedia?.("(pointer: coarse)")?.matches;
}

function roundTimerSeconds() {
  return Math.max(0, Math.ceil(roundTimerFrames / 60));
}

function drawHud() {
  const compact = compactHudMode();
  const panelY = compact ? 12 : 16;
  const panelW = compact ? 332 : 390;
  const sideInset = compact ? 18 : 22;
  drawHudBackdrop(compact);
  drawHudPanel(sideInset, panelY, panelW, fighters[0], false, compact);
  drawHudPanel(W - sideInset - panelW, panelY, panelW, fighters[1], true, compact);
  drawHudCenter(compact);
  drawMomentumStrip(compact);
}

function drawHudBackdrop(compact = false) {
  const height = compact ? 86 : 112;
  const fade = ctx.createLinearGradient(0, 0, 0, height);
  fade.addColorStop(0, "rgba(0, 0, 0, 0.58)");
  fade.addColorStop(0.58, "rgba(0, 0, 0, 0.18)");
  fade.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const left = ctx.createLinearGradient(0, 0, W * 0.4, 0);
  left.addColorStop(0, colorWithAlpha(fighters[0].trim, compact ? 0.12 : 0.16));
  left.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, W * 0.48, height);

  const right = ctx.createLinearGradient(W, 0, W * 0.6, 0);
  right.addColorStop(0, colorWithAlpha(fighters[1].trim, compact ? 0.12 : 0.16));
  right.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = right;
  ctx.fillRect(W * 0.52, 0, W * 0.48, height);

  ctx.strokeStyle = "rgba(255, 232, 164, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(compact ? 16 : 24, height - 10);
  ctx.lineTo(W - (compact ? 16 : 24), height - 10);
  ctx.stroke();
  ctx.restore();
}

function drawHudCenter(compact = false) {
  const cx = W / 2;
  const width = compact ? 84 : 120;
  const height = compact ? 52 : 72;
  const x = cx - width / 2;
  const y = compact ? 11 : 15;
  const seconds = roundTimerSeconds();
  const danger = !winner && seconds <= 10;
  const centerPanel = ctx.createLinearGradient(x, y, x + width, y + height);
  centerPanel.addColorStop(0, danger ? "rgba(142, 29, 18, 0.98)" : "rgba(99, 34, 21, 0.96)");
  centerPanel.addColorStop(0.42, "rgba(20, 13, 12, 0.96)");
  centerPanel.addColorStop(1, danger ? "rgba(189, 64, 24, 0.96)" : "rgba(126, 72, 24, 0.94)");
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.46)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = centerPanel;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 9);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = danger ? "rgba(255, 107, 67, 0.9)" : "rgba(255, 231, 143, 0.82)";
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
  ctx.fillRect(x + 12, y + 11, width - 24, compact ? 4 : 6);
  ctx.fillStyle = danger ? "rgba(255, 77, 40, 0.2)" : "rgba(255, 205, 85, 0.14)";
  ctx.beginPath();
  ctx.moveTo(cx - (compact ? 33 : 48), y + height - 9);
  ctx.lineTo(cx, y + 10);
  ctx.lineTo(cx + (compact ? 33 : 48), y + height - 9);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = danger ? "#ffdf7a" : "#fff1bd";
  ctx.font = `900 ${compact ? 9 : 12}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(matchOver ? "MATCH" : `ROUND ${toRoman(roundNumber)}`, cx, y + (compact ? 18 : 22));
  ctx.font = `900 ${compact ? 24 : 34}px Impact, Haettenschweiler, "Arial Black", system-ui, sans-serif`;
  ctx.fillStyle = danger && Math.floor(roundFrame / 15) % 2 === 0 ? "#ff674d" : "#fff1bd";
  ctx.fillText(winner ? (roundFinishKind === "time" ? "TIME" : "KO") : String(seconds).padStart(2, "0"), cx, y + (compact ? 39 : 52));
  ctx.font = `900 ${compact ? 8 : 10}px system-ui, sans-serif`;
  ctx.fillStyle = danger ? "rgba(255, 214, 117, 0.95)" : "rgba(255, 244, 205, 0.9)";
  ctx.fillText(winner ? (roundFinishKind === "time" ? "DECISION" : "FINAL") : danger ? "TIME" : "MEJOR DE III", cx, y + (compact ? 49 : 66));
  ctx.restore();
}

function drawMomentumStrip(compact = false) {
  if (!running || countdownFrames > 0) return;
  const read = momentumReadState();
  const pulse = clamp((momentumHud.pulse ?? 0) / 42, 0, 1);
  const width = compact ? 252 : 438;
  const height = compact ? 17 : 22;
  const x = W / 2 - width / 2;
  const y = compact ? 72 : 99;
  const leaderSide = read.leader === fighters[0] ? -1 : read.leader === fighters[1] ? 1 : 0;
  const color = read.color || "#fff1bd";
  const amount = clamp(read.amount ?? 0, 0, 1);
  const fillW = (width - 128) * (leaderSide ? amount : 0.5);
  const centerX = x + width / 2;
  const barY = y + height - (compact ? 5 : 6);
  const barW = width - 92;
  const barX = x + 46;

  ctx.save();
  ctx.globalAlpha = winner ? 0.58 : 0.94;
  ctx.shadowColor = colorWithAlpha(color, 0.2 + pulse * 0.34);
  ctx.shadowBlur = 8 + pulse * 14;

  const panel = ctx.createLinearGradient(x, y, x + width, y + height);
  panel.addColorStop(0, colorWithAlpha(fighters[0]?.trim || "#fff1bd", 0.16 + (leaderSide < 0 ? amount * 0.12 : 0)));
  panel.addColorStop(0.46, "rgba(12, 10, 10, 0.72)");
  panel.addColorStop(0.54, "rgba(12, 10, 10, 0.72)");
  panel.addColorStop(1, colorWithAlpha(fighters[1]?.trim || "#75f0cb", 0.16 + (leaderSide > 0 ? amount * 0.12 : 0)));
  ctx.fillStyle = panel;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, compact ? 6 : 7);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = colorWithAlpha(color, 0.38 + pulse * 0.3);
  ctx.lineWidth = 1.2 + pulse * 0.8;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, width - 2, height - 2, compact ? 5 : 6);
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = colorWithAlpha(color, 0.08 + pulse * 0.1);
  const sweep = leaderSide < 0 ? x + 18 : leaderSide > 0 ? x + width - 18 : centerX;
  ctx.beginPath();
  ctx.moveTo(sweep - leaderSide * (compact ? 20 : 28), y + 2);
  ctx.lineTo(sweep + leaderSide * (compact ? 70 : 96), y + 2);
  ctx.lineTo(sweep + leaderSide * (compact ? 42 : 58), y + height - 2);
  ctx.lineTo(sweep - leaderSide * (compact ? 48 : 64), y + height - 2);
  ctx.closePath();
  if (leaderSide) ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, compact ? 2 : 3, 2);
  ctx.fill();

  if (leaderSide) {
    const leadW = Math.max(8, fillW);
    const leadX = leaderSide < 0 ? centerX - leadW : centerX;
    const lead = ctx.createLinearGradient(leaderSide < 0 ? centerX : leadX, barY, leaderSide < 0 ? leadX : leadX + leadW, barY);
    lead.addColorStop(0, colorWithAlpha(color, 0.94));
    lead.addColorStop(1, colorWithAlpha("#fff7d6", 0.68));
    ctx.fillStyle = lead;
    ctx.beginPath();
    ctx.roundRect(leadX, barY, leadW, compact ? 2 : 3, 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255, 241, 189, 0.56)";
    ctx.beginPath();
    ctx.roundRect(centerX - 18, barY, 36, compact ? 2 : 3, 2);
    ctx.fill();
  }

  ctx.fillStyle = colorWithAlpha(fighters[0]?.trim || "#fff1bd", leaderSide < 0 ? 0.95 : 0.5);
  ctx.beginPath();
  ctx.arc(barX - 12, barY + 1.5, compact ? 3 : 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colorWithAlpha(fighters[1]?.trim || "#75f0cb", leaderSide > 0 ? 0.95 : 0.5);
  ctx.beginPath();
  ctx.arc(barX + barW + 12, barY + 1.5, compact ? 3 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.78)";
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#fff1bd";
  ctx.font = `900 ${compact ? 8 : 10}px system-ui, sans-serif`;
  ctx.fillText(read.label, centerX, y + (compact ? 6 : 7));
  if (!compact) {
    ctx.fillStyle = colorWithAlpha(color, 0.86);
    ctx.font = "850 9px system-ui, sans-serif";
    ctx.fillText(read.detail.toUpperCase(), centerX, y + 16);
  }
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawComboCounters() {
  for (let i = 0; i < fighters.length; i += 1) {
    const f = fighters[i];
    const count = Math.floor(f.comboCount ?? 0);
    const timer = f.comboTimer ?? 0;
    if (count < 2 || timer <= 0) continue;

    const reverse = i === 1;
    const compact = compactHudMode();
    const panelW = compact ? 138 : 166 + Math.min(count, 8) * 3;
    const panelH = compact ? 50 : 58;
    const x = reverse ? -panelW : 0;
    const y = compact ? 74 : 104;
    const anchorX = reverse ? W - (compact ? 22 : 32) : compact ? 22 : 32;
    const alpha = clamp(timer / 20, 0, 1);
    const pulse = clamp((f.comboPulse ?? 0) / 22, 0, 1);
    const scale = 1 + pulse * 0.055;
    const color = comboTierColor(count);
    const progress = clamp(timer / 112, 0, 1);
    const labelX = reverse ? -16 : 16;
    const barX = reverse ? x + 15 : 15;
    const barW = panelW - 30;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(anchorX + (reverse ? -pulse * 3 : pulse * 3), y);
    ctx.scale(scale, scale);

    const panel = ctx.createLinearGradient(x, 0, x + panelW, panelH);
    panel.addColorStop(0, colorWithAlpha(color, 0.32));
    panel.addColorStop(0.36, "rgba(32, 18, 15, 0.88)");
    panel.addColorStop(1, reverse ? "rgba(22, 52, 43, 0.86)" : "rgba(62, 26, 16, 0.86)");

    ctx.shadowColor = colorWithAlpha(color, 0.42 + pulse * 0.22);
    ctx.shadowBlur = 14 + pulse * 10;
    ctx.fillStyle = panel;
    ctx.beginPath();
    ctx.roundRect(x, 0, panelW, panelH, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = colorWithAlpha(color, 0.88);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 2, 2, panelW - 4, panelH - 4, 7);
    ctx.stroke();

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = colorWithAlpha(color, 0.18 + pulse * 0.16);
    ctx.beginPath();
    ctx.moveTo(reverse ? x + panelW - 8 : x + 8, 5);
    ctx.lineTo(reverse ? x + panelW - 50 : x + 50, 5);
    ctx.lineTo(reverse ? x + panelW - 86 : x + 86, panelH - 7);
    ctx.lineTo(reverse ? x + panelW - 45 : x + 45, panelH - 7);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.textAlign = reverse ? "right" : "left";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 5;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(42, 14, 6, 0.86)";
    ctx.fillStyle = "#fff1bd";
    ctx.font = `900 ${compact ? 22 : 26}px system-ui, sans-serif`;
    ctx.strokeText(`${count} HIT`, labelX, compact ? 28 : 31);
    ctx.fillText(`${count} HIT`, labelX, compact ? 28 : 31);

    ctx.shadowBlur = 3;
    ctx.fillStyle = color;
    ctx.font = `900 ${compact ? 10 : 12}px system-ui, sans-serif`;
    ctx.fillText(`${comboTierLabel(count)} · ${Math.round(f.comboDamage ?? 0)} DMG`, labelX, compact ? 43 : 49);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.beginPath();
    ctx.roundRect(barX, panelH - 8, barW, 3, 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(reverse ? barX + barW * (1 - progress) : barX, panelH - 8, barW * progress, 3, 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawHudPanel(x, y, width, f, reverse, compact = false) {
  const height = compact ? 58 : 80;
  const corner = compact ? 7 : 8;
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
  ctx.roundRect(x, y, width, height, corner);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, corner);
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
  const detailLines = compact ? 3 : 5;
  for (let i = 0; i < detailLines; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 19 + i * (compact ? 9 : 10));
    ctx.lineTo(x + width - 12, y + 19 + i * (compact ? 9 : 10));
    ctx.stroke();
  }
  ctx.restore();

  const dangerPulse = f.health < 26 ? 0.1 + Math.sin(roundFrame * 0.16) * 0.05 : 0;
  if (dangerPulse > 0) {
    ctx.fillStyle = `rgba(255, 40, 30, ${dangerPulse})`;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, corner);
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

  const portraitSize = compact ? 38 : 52;
  const portraitInset = compact ? 9 : 12;
  const portraitX = reverse ? x + width - portraitSize - portraitInset : x + portraitInset;
  drawHudPortrait(portraitX, y + (compact ? 9 : 12), f, reverse, portraitSize);

  const infoOffset = compact ? 56 : 78;
  const barX = reverse ? x + 18 : x + infoOffset;
  const nameX = reverse ? x + width - infoOffset : x + infoOffset;
  const align = reverse ? "right" : "left";
  const healthW = compact ? width - 106 : 284;
  const healthY = y + (compact ? 20 : 26);
  const energyW = compact ? Math.min(132, healthW) : 186;
  const energyX = compact
    ? reverse ? barX + healthW - energyW : barX
    : reverse ? x + width - 264 : x + 78;
  const statusW = compact ? 92 : 132;
  const statusX = reverse ? x + 14 : x + width - statusW - 14;
  const statusY = y + (compact ? 6 : 9);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = "rgba(35, 16, 12, 0.78)";
  ctx.lineWidth = compact ? 2 : 3;
  ctx.font = `900 ${compact ? 11 : 14}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.strokeText(f.name.toUpperCase(), nameX, y + (compact ? 16 : 20));
  ctx.fillStyle = "rgba(255, 247, 214, 0.95)";
  ctx.fillText(f.name.toUpperCase(), nameX, y + (compact ? 16 : 20));
  ctx.restore();

  drawHudStatusRibbon(statusX, statusY, statusW, f, reverse, compact);
  drawHealth(barX, healthY, healthW, f, reverse, compact ? 21 : 29);
  drawEnergy(energyX, y + (compact ? 45 : 63), energyW, f, reverse, compact ? 9 : 12);
  drawWins(reverse ? x + 38 : x + width - 58, y + (compact ? 39 : 59), f, reverse, compact);
}

function hudStatusRead(f) {
  const hurt = clamp((f.damagePulse ?? 0) / 38, 0, 1);
  const guard = clamp(Math.max((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, (f.guardPulse ?? 0) / 18), 0, 1);
  const counter = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  const readyPulse = clamp((f.specialReadyPulse ?? 0) / 54, 0, 1);
  const criticalPulse = f.health > 0 && f.health <= 24 ? 0.42 + Math.sin(roundFrame * 0.18) * 0.18 : 0;

  if (hurt > 0.12) return { key: "impact", label: "IMPACT", color: "#ff6048", accent: "#fff0c8", intensity: hurt };
  if (guard > 0.1) return { key: "guard", label: "GUARD", color: "#6fd4ff", accent: "#f8fbff", intensity: guard };
  if (counter > 0.16) return { key: "counter", label: "COUNTER", color: f.trim, accent: "#fff6ce", intensity: counter };
  if (criticalPulse > 0) return { key: "critical", label: "CRITICAL", color: "#ff4a38", accent: "#fff0d7", intensity: criticalPulse };
  if (f.energy >= 45 || readyPulse > 0.04) return { key: "special", label: "SPECIAL", color: f.trim, accent: "#fff4bc", intensity: 0.38 + readyPulse * 0.52 };
  return { key: "steady", label: "READY", color: f.trim, accent: "#fff4c8", intensity: 0.16 };
}

function drawHudStatusRibbon(x, y, width, f, reverse, compact = false) {
  const status = hudStatusRead(f);
  const h = compact ? 11 : 14;
  const pulse = clamp(status.intensity, 0, 1);
  const alpha = status.key === "steady" ? 0.28 : 0.54 + pulse * 0.28;
  const slant = compact ? 7 : 9;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowColor = colorWithAlpha(status.color, 0.2 + pulse * 0.34);
  ctx.shadowBlur = status.key === "steady" ? 0 : 4 + pulse * 8;
  ctx.fillStyle = colorWithAlpha(status.color, alpha * 0.34);
  ctx.beginPath();
  if (reverse) {
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width - slant, y + h);
    ctx.lineTo(x, y + h);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width - slant, y);
    ctx.lineTo(x + width, y + h);
    ctx.lineTo(x + slant, y + h);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(status.accent, status.key === "steady" ? 0.2 : 0.34 + pulse * 0.42);
  ctx.lineWidth = 1;
  ctx.stroke();

  const scan = (roundFrame * (reverse ? -0.9 : 0.9) + width * 2) % (width + 28);
  const scanX = reverse ? x + width - scan : x + scan - 28;
  if (status.key !== "steady") {
    ctx.strokeStyle = colorWithAlpha(status.accent, 0.14 + pulse * 0.26);
    ctx.beginPath();
    ctx.moveTo(scanX, y + 1);
    ctx.lineTo(scanX + (reverse ? -10 : 10), y + h - 1);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = colorWithAlpha(status.accent, status.key === "steady" ? 0.66 : 0.86);
  ctx.font = `900 ${compact ? 7 : 8}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(status.label, x + width / 2, y + h / 2 + 0.5);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawHudPortrait(x, y, f, reverse, size = 52) {
  const status = hudStatusRead(f);
  const statusPulse = clamp(status.intensity, 0, 1);
  const glowRadius = size * 0.8;
  const glow = ctx.createRadialGradient(x + size / 2, y + size / 2, size * 0.16, x + size / 2, y + size / 2, glowRadius);
  glow.addColorStop(0, colorWithAlpha(f.trim, 0.34));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, glowRadius, 0, Math.PI * 2);
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
    ctx.drawImage(f.face, x - size * 0.06, y - size * 0.1, size * 1.12, size * 1.12);
    const shade = ctx.createLinearGradient(x, y, x, y + size);
    shade.addColorStop(0, "rgba(255,255,255,0.18)");
    shade.addColorStop(0.48, "rgba(255,255,255,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.24)");
    ctx.fillStyle = shade;
    ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    if (status.key === "impact" || status.key === "critical") {
      ctx.fillStyle = colorWithAlpha(status.color, 0.1 + statusPulse * 0.18);
      ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    } else if (status.key === "guard") {
      ctx.strokeStyle = colorWithAlpha("#dff8ff", 0.18 + statusPulse * 0.22);
      ctx.lineWidth = Math.max(1, size * 0.04);
      ctx.beginPath();
      ctx.moveTo(x + size * 0.24, y + size * 0.18);
      ctx.lineTo(x + size * 0.76, y + size * 0.82);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (status.key !== "steady") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = colorWithAlpha(status.color, 0.44 + statusPulse * 0.3);
    ctx.shadowBlur = 6 + statusPulse * 10;
    ctx.strokeStyle = colorWithAlpha(status.color, 0.36 + statusPulse * 0.42);
    ctx.lineWidth = Math.max(1.2, size * 0.045);
    ctx.beginPath();
    ctx.roundRect(x - 2, y - 2, size + 4, size + 4, 8);
    ctx.stroke();
    if (status.key === "impact" || status.key === "special") {
      const sweep = (roundFrame * 0.16 + statusPulse) % 1;
      const sx = reverse ? x + size - size * sweep : x + size * sweep;
      ctx.strokeStyle = colorWithAlpha(status.accent, 0.22 + statusPulse * 0.28);
      ctx.beginPath();
      ctx.moveTo(sx, y - 1);
      ctx.lineTo(sx + (reverse ? -size * 0.34 : size * 0.34), y + size + 1);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.strokeStyle = "rgba(255, 247, 205, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, size - 8, size - 8, 5);
  ctx.stroke();

  const badge = Math.max(8, Math.round(size * 0.42));
  const badgeRadius = badge / 2;
  const badgeX = reverse ? x + badgeRadius + 1 : x + size - badgeRadius - 1;
  const badgeY = y + size - badgeRadius - 1;
  ctx.fillStyle = colorWithAlpha(f.trim, 0.92);
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#19120f";
  ctx.font = `900 ${Math.max(8, Math.round(size * 0.23))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(f.mark ?? "", badgeX, badgeY + 0.5);
  ctx.textBaseline = "alphabetic";
}

function drawHealth(x, y, width, f, reverse, height = 28) {
  const innerX = x + 5;
  const innerY = y + 5;
  const innerW = width - 10;
  const innerH = height - 10;
  const pct = clamp(f.health / 100, 0, 1);
  const lagPct = clamp((f.healthLag ?? f.health) / 100, 0, 1);
  const hurtPulse = clamp((f.damagePulse ?? 0) / 38, 0, 1);
  const guardPulse = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);

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

    if (hurtPulse > 0.025) {
      const edgeX = reverse ? bx : bx + barWidth;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = colorWithAlpha("#fff0bc", 0.38 + hurtPulse * 0.34);
      ctx.shadowBlur = 5 + hurtPulse * 10;
      ctx.fillStyle = colorWithAlpha("#fff0bc", 0.16 + hurtPulse * 0.22);
      ctx.beginPath();
      ctx.roundRect(edgeX + (reverse ? -4 - hurtPulse * 9 : -hurtPulse * 9), innerY - 1, 4 + hurtPulse * 12, innerH + 2, 3);
      ctx.fill();
      ctx.strokeStyle = colorWithAlpha("#ff543f", 0.34 + hurtPulse * 0.42);
      ctx.lineWidth = 1.2 + hurtPulse * 1.4;
      ctx.beginPath();
      ctx.moveTo(edgeX, innerY - 2);
      ctx.lineTo(edgeX + (reverse ? -8 : 8), innerY + innerH + 2);
      ctx.stroke();
      ctx.restore();
    }
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

  if (guardPulse > 0.025 && barWidth > 0.2) {
    const guardW = Math.min(innerW * 0.34, 28 + guardPulse * 36);
    const guardX = reverse ? innerX + innerW - guardW : innerX;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = colorWithAlpha("#dff8ff", 0.22 + guardPulse * 0.44);
    ctx.lineWidth = 1 + guardPulse * 1.2;
    ctx.beginPath();
    ctx.moveTo(guardX + (reverse ? guardW : 0), innerY + 1);
    ctx.lineTo(guardX + (reverse ? guardW - 16 - guardPulse * 14 : 16 + guardPulse * 14), innerY + innerH - 1);
    ctx.stroke();
    ctx.fillStyle = colorWithAlpha("#8fe8ff", 0.08 + guardPulse * 0.16);
    ctx.beginPath();
    ctx.roundRect(guardX, innerY, guardW, innerH, 4);
    ctx.fill();
    ctx.restore();
  }

  const counterReady = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  if (counterReady > 0.025 && !winner) {
    const counterW = innerW * counterReady;
    const counterX = reverse ? innerX + innerW - counterW : innerX;
    const spark = 0.72 + Math.sin(roundFrame * 0.38) * 0.28;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = colorWithAlpha(f.trim, 0.34 + counterReady * 0.28);
    ctx.shadowBlur = 5 + counterReady * 8;
    const counterFill = ctx.createLinearGradient(reverse ? innerX + innerW : innerX, y, reverse ? innerX : innerX + innerW, y);
    counterFill.addColorStop(0, colorWithAlpha("#fff8d8", 0.9));
    counterFill.addColorStop(0.52, colorWithAlpha("#ffe06f", 0.84));
    counterFill.addColorStop(1, colorWithAlpha(f.trim, 0.82));
    ctx.fillStyle = counterFill;
    ctx.beginPath();
    ctx.roundRect(counterX, innerY + innerH - 4, counterW, 4, 3);
    ctx.fill();

    ctx.strokeStyle = colorWithAlpha("#fff8d8", 0.26 + counterReady * 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(counterX + (reverse ? counterW : 0), innerY + innerH - 8);
    ctx.lineTo(counterX + (reverse ? counterW - 14 * spark : 14 * spark), innerY + innerH + 1);
    ctx.stroke();

    if (width >= 220 && counterReady > 0.18) {
      ctx.shadowBlur = 4;
      ctx.fillStyle = colorWithAlpha("#fff1bd", 0.68 + counterReady * 0.28);
      ctx.font = "900 8px system-ui, sans-serif";
      ctx.textAlign = reverse ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillText("COUNTER", reverse ? innerX + 7 : innerX + innerW - 7, innerY + innerH - 9);
      ctx.textBaseline = "alphabetic";
    }
    ctx.restore();
  }
}

function drawEnergy(x, y, width, f, reverse, height = 12) {
  const ready = f.energy >= 45;
  const readyPulse = clamp((f.specialReadyPulse ?? 0) / 54, 0, 1);
  const pulse = 0.16 + Math.sin(roundFrame * 0.12) * 0.06 + readyPulse * 0.2;
  if (ready) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = colorWithAlpha(f.trim, pulse);
    ctx.beginPath();
    ctx.roundRect(x - 4 - readyPulse * 4, y - 4 - readyPulse * 2, width + 8 + readyPulse * 8, height + 8 + readyPulse * 4, 7);
    ctx.fill();
    if (readyPulse > 0.01) {
      const sweep = reverse
        ? x + width - width * readyPulse
        : x + width * readyPulse;
      ctx.strokeStyle = colorWithAlpha("#fff8df", 0.52 * readyPulse);
      ctx.lineWidth = Math.max(1, height * 0.16);
      ctx.beginPath();
      ctx.moveTo(sweep, y - 2);
      ctx.lineTo(sweep + (reverse ? -10 : 10), y + height + 2);
      ctx.stroke();
    }
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
  const readyMark = 0.45;
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

      if (ready && filled > 0.58) {
        const glintX = reverse ? fx + 3 : fx + fillW - 3;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = colorWithAlpha("#fff8df", 0.1 + readyPulse * 0.22 + Math.sin(roundFrame * 0.18 + i) * 0.04);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(glintX, y + 3);
        ctx.lineTo(glintX + (reverse ? -5 : 5), y + height - 3);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  const markX = reverse ? x + width - width * readyMark : x + width * readyMark;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = ready ? colorWithAlpha("#fff8df", 0.36 + readyPulse * 0.22) : "rgba(255,255,255,0.22)";
  ctx.lineWidth = ready ? 1.6 : 1;
  ctx.beginPath();
  ctx.moveTo(markX, y - 1);
  ctx.lineTo(markX, y + height + 1);
  ctx.stroke();
  if (ready) {
    ctx.fillStyle = colorWithAlpha("#fff8df", 0.2 + readyPulse * 0.28);
    ctx.beginPath();
    ctx.moveTo(markX + (reverse ? 4 : -4), y - 2);
    ctx.lineTo(markX, y + 3);
    ctx.lineTo(markX + (reverse ? 4 : -4), y + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = ready ? "rgba(255, 239, 168, 0.82)" : "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, width - 2, height - 2, 4);
  ctx.stroke();

  if (ready) {
    ctx.save();
    ctx.shadowColor = colorWithAlpha(f.trim, 0.55 + readyPulse * 0.28);
    ctx.shadowBlur = 5 + readyPulse * 7;
    ctx.fillStyle = "#fff1bd";
    ctx.font = `900 ${height <= 9 ? 7 : 8}px system-ui, sans-serif`;
    ctx.textAlign = reverse ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.fillText(width >= 170 ? "SPECIAL READY" : "READY", reverse ? x + 4 : x + width - 4, y + height / 2 + 0.5);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }
}

function drawWins(x, y, f, reverse, compact = false) {
  const gap = compact ? 14 : 18;
  const glowRadius = compact ? 8 : 11;
  const pointRadius = compact ? 5.5 : 7;
  ctx.save();
  ctx.fillStyle = "rgba(255, 247, 214, 0.66)";
  ctx.font = `900 ${compact ? 7 : 8}px system-ui, sans-serif`;
  ctx.textAlign = reverse ? "left" : "right";
  ctx.fillText("WINS", reverse ? x + 6 : x - 6, y + 9);
  ctx.restore();
  for (let i = 0; i < 2; i += 1) {
    const px = reverse ? x - i * gap : x + i * gap;
    const won = i < f.wins;
    if (won) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255, 226, 101, 0.26)";
      ctx.beginPath();
      ctx.arc(px, y + 6, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const medallion = ctx.createRadialGradient(px - 2, y + 3, 1, px, y + 6, 9);
    medallion.addColorStop(0, won ? "#fff6cd" : "rgba(92, 74, 52, 0.74)");
    medallion.addColorStop(1, won ? "#c47a23" : "rgba(27, 18, 15, 0.82)");
    ctx.fillStyle = medallion;
    ctx.beginPath();
    ctx.arc(px, y + 6, pointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = won ? "rgba(255, 244, 194, 0.9)" : "rgba(255, 231, 168, 0.26)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function bodySpec(f) {
  return BODY_SPECS[f.build] ?? BODY_SPECS.balanced;
}

function headShapeProfile(f) {
  if (f.profileId === "p5") {
    return {
      scaleX: 1.2,
      scaleY: 0.7,
      anchorY: 0.82,
    };
  }
  return {
    scaleX: 1,
    scaleY: 1,
    anchorY: 0.72,
  };
}

function outfitSpec(f) {
  return f.outfit;
}

function smoothStep01(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function localizedImpactProfile(f) {
  const motion = characterMotion(f);
  const rawZone = winner ? Math.max(0, (f.hitZonePulse ?? 0) - resultFrame * 0.78) : (f.hitZonePulse ?? 0);
  const rawImpact = winner ? Math.max(0, (f.impactPulse ?? 0) - resultFrame * 0.86) : (f.impactPulse ?? 0);
  const rawDamage = winner ? Math.max(0, (f.damagePulse ?? 0) - resultFrame * 0.78) : (f.damagePulse ?? 0);
  const zone = f.hitZone === "head" || f.hitZone === "legs" ? f.hitZone : "torso";
  const zoneMax = zone === "head" ? 30 : zone === "legs" ? 28 : 26;
  const zoneT = clamp(rawZone / zoneMax, 0, 1);
  const impactT = clamp(rawImpact / 22, 0, 1);
  const damageT = clamp(rawDamage / 34, 0, 1);
  const t = Math.max(zoneT, impactT * 0.82, damageT * 0.72);
  if (t <= 0.01) {
    return {
      zone,
      t: 0,
      snap: 0,
      rebound: 0,
      shake: 0,
      localDir: 1,
      strength: 0,
    };
  }

  const localDir = (f.impactDir ?? f.dir) === f.dir ? 1 : -1;
  const strength = clamp(f.impactStrength ?? 0.8, 0.45, 1.65);
  return {
    zone,
    t,
    snap: smoothStep01(t) * strength * motion.impactSnap,
    rebound: Math.sin(t * Math.PI) * strength * motion.impactRebound,
    shake: Math.sin((roundFrame + resultFrame) * 2.35) * t * strength * motion.impactShake,
    localDir,
    strength: strength * motion.impactSnap,
  };
}

function impactReactionProfile(f) {
  const motion = characterMotion(f);
  const rawPulse = winner ? Math.max(0, (f.reactionPulse ?? 0) - resultFrame * 0.82) : (f.reactionPulse ?? 0);
  const max = Math.max(1, f.reactionMax ?? 1);
  const t = clamp(rawPulse / max, 0, 1);
  const zone = f.reactionZone || f.hitZone || "torso";
  const kind = f.reactionKind || "light";
  const strength = clamp(f.reactionStrength ?? f.impactStrength ?? 0.82, 0.35, 1.85);
  if (t <= 0.01) {
    return {
      zone,
      kind,
      t: 0,
      snap: 0,
      rebound: 0,
      shake: 0,
      localDir: 1,
      worldDir: f.impactDir ?? f.dir ?? 1,
      strength: 0,
    };
  }

  const worldDir = f.reactionDir || f.impactDir || f.dir || 1;
  const localDir = worldDir === f.dir ? 1 : -1;
  const reboundClock = 1 - t;
  return {
    zone,
    kind,
    t,
    snap: smoothStep01(t) * strength * motion.impactSnap,
    rebound: Math.sin(reboundClock * Math.PI) * strength * motion.impactRebound,
    shake: Math.sin((roundFrame + resultFrame) * 2.55) * t * strength * motion.impactShake,
    localDir,
    worldDir,
    strength: strength * motion.impactSnap,
  };
}

function hitReactionMassProfile(f) {
  const reaction = impactReactionProfile(f);
  const localized = localizedImpactProfile(f);
  const motion = characterMotion(f);
  const active = Math.max(reaction.t, localized.t * 0.86);
  const zone = reaction.zone === "head" || reaction.zone === "legs" ? reaction.zone : "torso";
  const kind = reaction.kind || "light";
  const worldDir = reaction.worldDir || f.impactDir || f.dir || 1;
  const localDir = worldDir === (f.dir || 1) ? 1 : -1;
  const kindWeight =
    kind === "finish" ? 1.48 :
    kind === "counter" || kind === "blast" ? 1.26 :
    kind === "heavy" || kind === "low" ? 1.12 :
    kind === "guard" ? 0.46 :
    0.9;
  const zoneWeight = zone === "head" ? 1.12 : zone === "legs" ? 1.2 : 1;
  const strength = clamp(Math.max(reaction.strength, localized.strength), 0.32, 1.9);
  const snap = reaction.snap * kindWeight * zoneWeight;
  const rebound = reaction.rebound * kindWeight;
  const absorb = smoothStep01(active) * strength * kindWeight;
  const floor = f.grounded
    ? clamp((absorb * (zone === "legs" ? 0.9 : 0.62) + Math.abs(f.vx ?? 0) / 12) * motion.impactFloor, 0, 1.9)
    : 0;
  const skid = f.grounded
    ? clamp((Math.abs(f.vx ?? 0) / 7.4 + snap * 0.24 + (zone === "legs" ? 0.28 : 0)) * kindWeight * motion.impactSkid, 0, 2.05)
    : 0;
  const fold = (zone === "head" ? -0.55 : zone === "legs" ? 0.72 : 0.46) * (f.profileId === "p1" ? 0.78 : f.profileId === "p2" ? 1.14 : 1);
  const lift = (zone === "head" ? 0.38 : zone === "legs" ? -0.34 : 0.12) * (f.profileId === "p1" ? 0.72 : f.profileId === "p2" ? 1.22 : 1);

  return {
    active,
    zone,
    kind,
    worldDir,
    localDir,
    snap,
    rebound,
    absorb,
    floor,
    skid,
    fold,
    lift,
    strength,
  };
}

function isAttackPoseState(state) {
  return state === "punch" || state === "kick" || state === "sweep" || state === "special" || state === "grab";
}

function fighterPoseState(f) {
  if (winner) {
    if (f.id === roundWinnerId) return "victory";
    return resultFrame < 18 ? "hurt" : "defeat";
  }
  if (f.hurt > 0) return "hurt";
  if (f.blocking) return "block";

  const type = f.attack?.type;
  if (type === "punch" || type === "airPunch") return "punch";
  if (type === "kick" || type === "airKick") return "kick";
  if (type === "sweep") return "sweep";
  if (type === "special") return "special";
  if (type === "grab") return "grab";
  if (!f.grounded) return "air";
  if (Math.abs(f.vx ?? 0) > 0.5) return "walk";
  return "idle";
}

function poseTransitionDuration(from, to) {
  if (from === to) return 1;
  if (to === "special") return 12;
  if (to === "kick" || to === "sweep") return 10;
  if (to === "punch" || to === "grab") return 8;
  if (isAttackPoseState(from) && !isAttackPoseState(to)) return 11;
  if (to === "block" || from === "block") return 8;
  if (to === "hurt" || from === "hurt") return 5;
  if (to === "air" || from === "air") return 7;
  if (to === "walk" || from === "walk") return 6;
  return 7;
}

function updatePoseTransition(f) {
  const nextPose = fighterPoseState(f);
  if (!f.poseState) {
    f.poseState = nextPose;
    f.previousPoseState = nextPose;
    f.poseTransitionPulse = 0;
    f.poseTransitionMax = 1;
    f.poseTransitionDir = f.dir || 1;
    return;
  }

  if (nextPose !== f.poseState) {
    f.previousPoseState = f.poseState;
    f.poseState = nextPose;
    f.poseTransitionMax = poseTransitionDuration(f.previousPoseState, nextPose);
    f.poseTransitionPulse = f.poseTransitionMax;
    f.poseTransitionDir = f.dir || f.poseTransitionDir || 1;
    return;
  }

  if ((f.poseTransitionPulse ?? 0) > 0) {
    f.poseTransitionPulse -= 1;
  }
}

function poseTransitionProfile(f) {
  const max = Math.max(1, f.poseTransitionMax ?? 1);
  const raw = clamp((f.poseTransitionPulse ?? 0) / max, 0, 1);
  const progress = 1 - raw;
  const wave = Math.sin(progress * Math.PI);
  const from = f.previousPoseState || f.poseState || "idle";
  const to = f.poseState || "idle";
  return {
    t: raw,
    progress,
    wave,
    settle: smoothStep01(raw),
    from,
    to,
    intoAttack: isAttackPoseState(to),
    fromAttack: isAttackPoseState(from),
    dir: f.poseTransitionDir || f.dir || 1,
  };
}

function fighterEntranceCue(f) {
  if (!running || winner || countdownFrames <= 0) return null;
  const settleFrame = f.id === "right" ? 54 : 46;
  const raw = clamp((countdownFrames - settleFrame) / (180 - settleFrame), 0, 1);
  if (raw <= 0.012) return null;
  const ease = raw * raw * (3 - 2 * raw);
  const reveal = 1 - ease;
  const step = Math.sin(reveal * Math.PI);
  const side = f.id === "left" ? -1 : 1;
  const heavy = f.profileId === "p1";
  const agile = f.profileId === "p2";
  return {
    side,
    ease,
    reveal,
    step,
    slide: heavy ? 1.12 : agile ? 0.84 : 1,
    lift: agile ? 1.18 : heavy ? 0.82 : 1,
    weight: heavy ? 1.18 : agile ? 0.9 : 1,
    flourish: agile ? 1.12 : heavy ? 0.86 : 1,
  };
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
  const style = characterMotion(f);
  const entrance = fighterEntranceCue(f);

  if (entrance) {
    motion.x += entrance.side * 52 * entrance.ease * entrance.slide;
    motion.y += entrance.ease * 5.4 * entrance.weight - entrance.step * 1.35 * entrance.lift;
    motion.rotation -= entrance.side * (entrance.ease * 0.044 * entrance.weight + entrance.step * 0.008);
    motion.scaleX *= 1 + entrance.ease * 0.014 + entrance.step * 0.006;
    motion.scaleY *= 1 - entrance.ease * 0.012 - entrance.step * 0.004;
    motion.afterimage = Math.max(motion.afterimage, entrance.ease * 0.026 * entrance.flourish);
  }

  if (walking) {
    const speed = clamp(Math.abs(f.vx) / 3.35, 0, 1.25);
    const cycle = f.walkCycle ?? roundFrame * 0.2;
    const weight = clamp(f.walkWeight ?? speed, 0, 1.25);
    const profileWeight = style.walkWeight ?? 1;
    const profileLift = style.walkLift ?? 1;
    const profilePush = style.walkPush ?? 1;
    const moveDir = Math.sign(f.vx) || dir;
    const retreat = moveDir !== dir;
    const step = Math.sin(cycle);
    const footPlant = clamp(f.walkPlant ?? Math.abs(Math.cos(cycle)), 0, 1);
    const swing = clamp(f.walkSwing ?? Math.abs(step), 0, 1);
    const anchor = clamp((f.walkAnchorPulse ?? 0) / 12, 0, 1);
    const pushPulse = clamp((f.walkPushPulse ?? 0) / 9, 0, 1);
    const plantedWorldSide = (f.walkAnchorSide || f.footPlantSide || 1) * dir;
    const plantedPress = smoothStep01(footPlant) * profileWeight;
    const push = Math.max(0, Math.sin(cycle * 2)) * weight * profilePush;
    motion.x +=
      step * (0.18 + weight * 0.5) -
      moveDir * footPlant * (0.32 + weight * 0.34) -
      plantedWorldSide * anchor * (0.48 + profileWeight * 0.08) +
      moveDir * pushPulse * (0.36 + profilePush * 0.08);
    motion.y +=
      footPlant * (0.48 + weight * 1.02) +
      plantedPress * 0.42 +
      anchor * (0.58 + profileWeight * 0.12) -
      swing * (0.16 + weight * 0.24 + profileLift * 0.06) -
      push * 0.32 -
      pushPulse * 0.24;
    motion.rotation +=
      moveDir * (0.008 + weight * 0.016) * (retreat ? -0.64 : 1) +
      step * 0.0038 * weight -
      plantedWorldSide * anchor * 0.005 -
      moveDir * plantedPress * 0.004;
    motion.scaleX *= 1 + anchor * 0.014 + footPlant * 0.008 + plantedPress * 0.006 + weight * 0.002;
    motion.scaleY *= 1 - anchor * 0.017 - footPlant * 0.006 - plantedPress * 0.01 + swing * 0.004 + push * 0.003;
    if (retreat) {
      motion.x -= dir * 0.7 * weight;
      motion.y += 0.35 * weight;
      motion.rotation -= dir * 0.012 * weight;
    }
  }

  const stopRaw = clamp((f.walkStopPulse ?? 0) / 16, 0, 1);
  if (stopRaw > 0.02 && f.grounded && f.hurt <= 0 && !f.attack) {
    const stopT = smoothStep01(stopRaw);
    const stopDir = f.walkStopDir || Math.sign(f.vx) || dir;
    const stopWeight = clamp(f.walkStopSpeed ?? 0.45, 0, 1.45) * (style.walkWeight ?? 1);
    const supportSide = (f.walkAnchorSide || f.footPlantSide || 1) * dir;
    motion.x -= stopDir * stopT * (0.72 + stopWeight * 1.22);
    motion.y += stopT * (0.9 + stopWeight * 1.35);
    motion.rotation -= stopDir * stopT * (0.012 + stopWeight * 0.016);
    motion.rotation += supportSide * stopT * 0.004;
    motion.scaleX *= 1 + stopT * (0.012 + stopWeight * 0.012);
    motion.scaleY *= 1 - stopT * (0.014 + stopWeight * 0.018);
  }

  if (!f.grounded && f.hurt <= 0) {
    const rise = clamp(-f.vy / 13, 0, 1);
    const fall = clamp(f.vy / 13, 0, 1);
    const jumpStrength = clamp(f.jumpStrength ?? 1, 0.65, 1.42);
    const liftStyle = style.walkLift ?? 1;
    const weightStyle = style.walkWeight ?? 1;
    const airLean = clamp((f.vx ?? 0) * 0.008, -0.035, 0.035);
    const jumpDir = f.jumpDir || dir;
    motion.y -= rise * (1.55 + liftStyle * 0.75) * jumpStrength;
    motion.y += fall * weightStyle * 0.48;
    motion.rotation += airLean + jumpDir * (rise * -0.018 * liftStyle + fall * (0.022 + weightStyle * 0.006));
    motion.scaleX *= 1 - rise * (0.014 + liftStyle * 0.006) + fall * (0.012 + weightStyle * 0.004);
    motion.scaleY *= 1 + rise * (0.033 + liftStyle * 0.009) - fall * (0.018 + weightStyle * 0.004);
  }

  const airKickRecoverT = smoothStep01(clamp((f.airKickRecoverPulse ?? 0) / 24, 0, 1));
  if (!f.grounded && f.hurt <= 0 && (f.attack?.type === "airKick" || airKickRecoverT > 0.025)) {
    const phase = f.attack?.type === "airKick" ? attackPhase(f.attack) : null;
    const strike = phase ? Math.max(phase.strike, phase.snap * 0.82) : 0;
    const fold = phase ? Math.max(phase.followThrough, phase.recovery, airKickRecoverT * 0.82) : airKickRecoverT;
    const fall = clamp(f.vy / 13, 0, 1);
    const airKickDir = f.airKickDir || f.jumpDir || dir;
    motion.x += airKickDir * (strike * 1.15 - fold * 0.62);
    motion.y += fall * fold * (1.05 + (style.walkWeight ?? 1) * 0.28) - strike * 0.32;
    motion.rotation += airKickDir * (strike * 0.018 + fold * (0.024 + fall * 0.012));
    motion.scaleX *= 1 + strike * 0.01 + fold * 0.006;
    motion.scaleY *= 1 - strike * 0.006 - fold * 0.012;
    motion.afterimage = Math.max(motion.afterimage, strike * 0.018 + fold * 0.012);
  }

  const jumpT = clamp((f.jumpPulse ?? 0) / 12, 0, 1);
  if (jumpT > 0) {
    const jumpStrength = clamp(f.jumpStrength ?? 1, 0.65, 1.42);
    const launch = smoothStep01(jumpT) * jumpStrength;
    const jumpDir = f.jumpDir || dir;
    motion.x -= jumpDir * launch * 0.48;
    motion.y -= launch * (1.25 + (style.walkLift ?? 1) * 0.65);
    motion.rotation -= jumpDir * launch * 0.012;
    motion.scaleX *= 1 - launch * 0.012;
    motion.scaleY *= 1 + launch * 0.032;
  }

  const landingT = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  if (landingT > 0) {
    const landingStrength = clamp(f.landingStrength ?? 1, 0.38, 1.65);
    const settle = smoothStep01(landingT);
    const rebound = Math.sin((1 - landingT) * Math.PI) * (0.58 + landingStrength * 0.36);
    const landingDir = f.landingDir || (f.vx >= 0 ? 1 : -1);
    motion.x -= landingDir * settle * landingStrength * 0.8;
    motion.y += settle * (4.4 + landingStrength * 3.4) - rebound * (0.7 + (style.walkLift ?? 1) * 0.24);
    motion.rotation += landingDir * settle * (0.014 + landingStrength * 0.014);
    motion.scaleX *= 1 + settle * (0.036 + landingStrength * 0.026) - rebound * 0.005;
    motion.scaleY *= 1 - settle * (0.04 + landingStrength * 0.03) + rebound * 0.012;
  }

  const airKickLandingT = clamp((f.airKickLandingPulse ?? 0) / 16, 0, 1);
  if (airKickLandingT > 0.025) {
    const settle = smoothStep01(airKickLandingT);
    const landingDir = f.airKickDir || f.landingDir || dir;
    motion.x -= landingDir * settle * 0.55;
    motion.y += settle * 1.25;
    motion.rotation += landingDir * settle * 0.012;
    motion.scaleX *= 1 + settle * 0.012;
    motion.scaleY *= 1 - settle * 0.016;
  }

  const stepPulse = clamp((f.stepPulse ?? 0) / 7, 0, 1);
  if (stepPulse > 0 && walking) {
    motion.y += stepPulse * 0.86;
    motion.scaleX *= 1 + stepPulse * 0.008;
    motion.scaleY *= 1 - stepPulse * 0.007;
  }

  const braceT = clamp(Math.max(f.rangePressure ?? 0, (f.bracePulse ?? 0) / 14), 0, 1);
  if (braceT > 0.02 && f.grounded && f.hurt <= 0 && !f.attack) {
    const side = f.rangeSide || dir;
    const plantT = clamp((f.footPlantPulse ?? 0) / 8, 0, 1);
    motion.x -= side * braceT * (0.8 + plantT * 0.6);
    motion.y += braceT * 1.25;
    motion.rotation -= side * braceT * 0.012;
    motion.scaleX *= 1 + braceT * 0.014;
    motion.scaleY *= 1 - braceT * 0.018;
  }

  const poseShift = poseTransitionProfile(f);
  if (!winner && poseShift.t > 0.025) {
    const wave = poseShift.wave;
    const progress = poseShift.progress;
    const release = poseShift.settle;
    const poseDir = poseShift.dir;

    if (poseShift.intoAttack) {
      const attackWeight = poseShift.to === "special" ? 1.18 : poseShift.to === "kick" || poseShift.to === "sweep" ? 1.08 : 0.92;
      const pull = (1 - progress) * attackWeight;
      motion.x -= poseDir * pull * 1.1;
      motion.y += wave * (poseShift.to === "sweep" ? 1.15 : 0.62);
      motion.rotation -= poseDir * wave * (0.012 + attackWeight * 0.004);
      motion.scaleX *= 1 - wave * 0.006;
      motion.scaleY *= 1 + wave * 0.009;
      motion.afterimage = Math.max(motion.afterimage, wave * (poseShift.to === "special" ? 0.034 : 0.022));
    } else if (poseShift.fromAttack) {
      const rebound = wave * (poseShift.from === "special" ? 1.12 : 1);
      motion.x -= poseDir * rebound * 0.95;
      motion.y += rebound * 0.48;
      motion.rotation += poseDir * rebound * 0.011;
      motion.scaleX *= 1 + rebound * 0.006;
      motion.scaleY *= 1 - rebound * 0.006;
    } else if (poseShift.to === "walk" || poseShift.from === "walk") {
      const walkEase = wave * 0.72;
      motion.x -= poseDir * walkEase * 0.42;
      motion.y += walkEase * 0.34;
      motion.rotation -= poseDir * walkEase * 0.006;
    } else if (poseShift.to === "block" || poseShift.from === "block") {
      motion.x -= poseDir * release * 0.7;
      motion.y += wave * 0.7;
      motion.rotation -= poseDir * wave * 0.01;
      motion.scaleX *= 1 + wave * 0.006;
      motion.scaleY *= 1 - wave * 0.008;
    } else if (poseShift.to === "air" || poseShift.from === "air") {
      motion.y -= wave * 0.75;
      motion.rotation += poseDir * wave * 0.009;
    }
  }

  if (!winner) {
    const attackEntry = clamp((f.attackEntryPulse ?? 0) / 14, 0, 1);
    const attackRecover = clamp((f.attackRecoverPulse ?? 0) / 16, 0, 1);
    const guardEntry = clamp((f.guardEntryPulse ?? 0) / 12, 0, 1);
    const guardExit = clamp((f.guardExitPulse ?? 0) / 10, 0, 1);
    const hurtRecover = clamp((f.hurtRecoverPulse ?? 0) / 14, 0, 1);
    const moveTurn = clamp((f.moveTurnPulse ?? 0) / 10, 0, 1);
    const moveDir = f.moveIntent || Math.sign(f.vx) || dir;
    const impactDir = f.impactDir ?? dir;

    if (moveTurn > 0.02 && f.grounded && f.hurt <= 0 && !f.attack) {
      motion.x -= moveDir * moveTurn * 1.15;
      motion.y += moveTurn * 0.52;
      motion.rotation -= moveDir * moveTurn * 0.014;
      motion.scaleX *= 1 + moveTurn * 0.01;
      motion.scaleY *= 1 - moveTurn * 0.009;
    }

    if (attackEntry > 0.02) {
      motion.x -= dir * attackEntry * 1.6;
      motion.y += attackEntry * 1.15;
      motion.rotation -= dir * attackEntry * 0.018;
      motion.scaleX *= 1 - attackEntry * 0.01;
      motion.scaleY *= 1 + attackEntry * 0.018;
      motion.afterimage = Math.max(motion.afterimage, attackEntry * 0.026);
    }

    if (attackRecover > 0.02) {
      const settle = smoothStep01(attackRecover);
      motion.x -= dir * settle * 1.25;
      motion.y += settle * 0.7;
      motion.rotation += dir * settle * 0.012;
      motion.scaleX *= 1 + settle * 0.008;
      motion.scaleY *= 1 - settle * 0.008;
    }

    if (guardEntry > 0.02) {
      motion.x -= dir * guardEntry * 1.45;
      motion.y += guardEntry * 1.35;
      motion.rotation -= dir * guardEntry * 0.024;
      motion.scaleX *= 1 + guardEntry * 0.012;
      motion.scaleY *= 1 - guardEntry * 0.018;
    }

    if (guardExit > 0.02 && !f.blocking) {
      motion.x += dir * guardExit * 0.65;
      motion.y -= guardExit * 0.55;
      motion.rotation += dir * guardExit * 0.01;
      motion.scaleX *= 1 - guardExit * 0.006;
      motion.scaleY *= 1 + guardExit * 0.01;
    }

    if (hurtRecover > 0.02 && f.hurt <= 0) {
      const rebound = Math.sin(hurtRecover * Math.PI) * style.hurtRecover;
      motion.x -= impactDir * rebound * 1.4;
      motion.y -= rebound * 0.75;
      motion.rotation -= impactDir * rebound * 0.018;
      motion.scaleX *= 1 - rebound * 0.008;
      motion.scaleY *= 1 + rebound * 0.014;
    }
  }

  if (f.attack) {
    const a = f.attack;
    const phase = attackPhase(a);
    const mass = attackMassProfile(f);
    const bodyWeight = attackBodyWeightProfile(f);
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
    const frameProfile = attackFrameProfile(f);
    const reach = isKick ? 9.1 : isSweep ? 7.4 : isSpecial ? 6.6 : isGrab ? 6.2 : 7.5;
    const brace = isKick ? 4.8 : isSweep ? 3.2 : isSpecial ? 3.7 : isGrab ? 4.1 : 5.3;
    const returnDrag = isKick ? 1.6 : isSweep ? 1.2 : 1.8;
    const weightDrive = mass.drive + mass.snap * 0.42;
    const groundedWeight = f.grounded ? 1 : 0.55;

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
    motion.afterimage = (isSpecial ? 0.16 : isGrab ? 0.07 : spec.echo) * strike + snap * 0.055 + windup * 0.018 + follow * 0.028;

    motion.x += dir * (-mass.load * 2.15 + weightDrive * (isSweep ? 4.4 : isKick ? 5.2 : isGrab ? 4.2 : 3.8) - mass.follow * 1.35 - mass.recover * 0.75) * groundedWeight;
    motion.y += mass.crush * (isSweep ? 2.3 : 1.25) - mass.lift * (isSweep ? 0.65 : 1.05) + mass.recover * 0.74;
    motion.rotation += dir * (-mass.load * 0.022 + weightDrive * (isSweep ? 0.034 : isKick ? 0.041 : 0.028) - mass.recover * 0.014);
    motion.scaleX *= 1 - mass.crush * 0.014 + weightDrive * 0.026 + mass.follow * 0.007;
    motion.scaleY *= 1 + mass.crush * 0.018 - weightDrive * 0.016 - mass.plant * 0.007;
    motion.afterimage = Math.max(motion.afterimage, mass.drive * (isSpecial ? 0.14 : isKick ? 0.065 : 0.05) + mass.snap * 0.052);

    if (bodyWeight.active > 0.025) {
      const heavyBias = isSpecial ? 1.12 : isKick || isSweep ? 1.06 : 0.96;
      const returnWeight = bodyWeight.recoil + bodyWeight.follow * 0.26;
      motion.x += dir * (
        -bodyWeight.load * (isSweep ? 2.35 : 2.7) +
        bodyWeight.drive * (isKick ? 2.85 : isSweep ? 2.15 : isGrab ? 2.25 : 2.42) -
        returnWeight * 1.52
      ) * heavyBias;
      motion.y +=
        bodyWeight.compression * (isSweep ? 2.05 : 1.32) +
        bodyWeight.low * 1.1 -
        bodyWeight.lift * (isKick ? 1.2 : 0.82) +
        bodyWeight.recover * 0.7;
      motion.rotation += dir * (
        -bodyWeight.load * (isKick ? 0.018 : 0.022) +
        bodyWeight.drive * (isKick ? 0.024 : isSweep ? 0.019 : 0.018) -
        bodyWeight.recover * 0.016 +
        bodyWeight.follow * 0.008
      ) * heavyBias;
      motion.scaleX *= 1 + bodyWeight.plant * 0.012 + bodyWeight.drive * 0.009 - bodyWeight.load * 0.006;
      motion.scaleY *= 1 - bodyWeight.plant * 0.015 - bodyWeight.drive * 0.005 + bodyWeight.load * 0.01 + bodyWeight.recover * 0.005;
      motion.afterimage = Math.max(motion.afterimage, bodyWeight.drive * (isSpecial ? 0.072 : isKick ? 0.036 : 0.028));
    }

    if (isKick && f.grounded) {
      const supportLoad = Math.max(windup * 0.75, bodyWeight.brace * 0.62, mass.load * 0.46);
      const supportDrive = Math.max(strike * 0.24, snap * 0.2, bodyWeight.drive * 0.36);
      const profileWeight = style.walkWeight ?? 1;
      motion.x -= dir * supportLoad * (1.35 + profileWeight * 0.75);
      motion.y += supportLoad * (1.15 + profileWeight * 0.85) - supportDrive * (0.35 + (style.walkLift ?? 1) * 0.28);
      motion.rotation -= dir * supportLoad * (0.018 + profileWeight * 0.009);
      motion.scaleX *= 1 + supportLoad * 0.018 + supportDrive * 0.006;
      motion.scaleY *= 1 - supportLoad * 0.022 - supportDrive * 0.004;
    } else if (isKick) {
      const airKick = Math.max(strike, snap * 0.8);
      motion.y -= airKick * (0.7 + (style.walkLift ?? 1) * 0.28);
      motion.rotation += dir * airKick * 0.014;
      motion.scaleX *= 1 + airKick * 0.01;
      motion.scaleY *= 1 - airKick * 0.006;
    }

    const chain = attackChainProfile(f, a.type);
    if (chain.active > 0.025) {
      const familyTurn = chain.fromKick && chain.toPunch ? 1 : chain.fromPunch && chain.toKick ? -1 : 0;
      const chainWeight = chain.active * (chain.sameFamily ? 0.68 : 1);
      motion.x -= dir * chainWeight * (chain.special ? 0.9 : 0.62);
      motion.y += chain.handoff * (chain.toKick ? 0.82 : 0.48);
      motion.rotation += dir * (familyTurn * chain.handoff * 0.015 - chainWeight * 0.006);
      motion.scaleX *= 1 + chain.handoff * 0.006;
      motion.scaleY *= 1 - chain.handoff * 0.007;
      motion.afterimage = Math.max(motion.afterimage, chain.handoff * (chain.combo > 0.05 ? 0.038 : 0.024));
    }

    motion.x += dir * frameProfile.bodyX;
    motion.y += frameProfile.bodyY;
    motion.rotation += dir * frameProfile.rotation;
    motion.scaleX *= frameProfile.scaleX;
    motion.scaleY *= frameProfile.scaleY;
    motion.afterimage = Math.max(motion.afterimage, frameProfile.afterimage);

    if (isSpecial) {
      const profileWeight = f.profileId === "p2" ? 1.08 : f.profileId === "p1" ? 1.14 : 1;
      motion.x += dir * (-windup * 2.4 + strike * 5.2 + snap * 4.4) * profileWeight;
      motion.y -= (strike * 1.2 + snap * 1.7) * profileWeight;
      motion.rotation += dir * (-windup * 0.015 + strike * 0.026 + snap * 0.018) * profileWeight;
      motion.scaleX *= 1 + strike * 0.012 + snap * 0.016;
      motion.scaleY *= 1 - strike * 0.006 - snap * 0.008;
      motion.afterimage = Math.max(motion.afterimage, windup * 0.04 + strike * 0.16 + snap * 0.08);
    }
  }

  if (f.blocking && !winner) {
    const guardProfile = characterGuard(f);
    const pulse = 0.5 + Math.sin(roundFrame * 0.58) * 0.5;
    const guard = clamp((f.guardPulse ?? 0) / 18, 0, 1);
    const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
    motion.x -= dir * (1.65 * guardProfile.brace + pulse * 0.72 + guard * 1.15 * guardProfile.brace + guardHit * 5.6 * guardProfile.recoil);
    motion.y += (1.05 + pulse * 0.42 + guard * 0.8) * guardProfile.crouch + guardHit * 2.7 * guardProfile.recoil;
    motion.rotation -= dir * (0.014 * guardProfile.brace + pulse * 0.004 + guard * 0.012 * guardProfile.brace + guardHit * 0.044 * guardProfile.recoil);
    motion.scaleX *= 1.004 + guard * 0.008 * guardProfile.brace - guardHit * 0.006 * guardProfile.recoil;
    motion.scaleY *= 0.992 - guard * 0.012 * guardProfile.crouch + guardHit * 0.018 * guardProfile.recoil;
    motion.afterimage = Math.max(motion.afterimage, guardHit * 0.04 * guardProfile.spark);
  }

  const counterReady = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  if (counterReady > 0.03 && f.hurt <= 0 && !f.attack && !winner) {
    const guardProfile = characterGuard(f);
    const coil = Math.sin((1 - counterReady) * Math.PI);
    motion.x += dir * (counterReady * 1.1 + coil * 0.8) * guardProfile.counter;
    motion.y += counterReady * 0.5 * guardProfile.crouch - coil * 0.26 * guardProfile.handLift;
    motion.rotation += dir * (counterReady * 0.014 + coil * 0.014) * guardProfile.counter;
    motion.scaleX *= 1 + counterReady * 0.008 * guardProfile.counter + coil * 0.006;
    motion.scaleY *= 1 - counterReady * 0.006 * guardProfile.counter;
    motion.afterimage = Math.max(motion.afterimage, counterReady * 0.018 * guardProfile.spark);
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
    const shakePulse = Math.sin((roundFrame + resultFrame) * 1.75) * hurtT * style.impactShake;
    const impactDir = f.impactDir ?? dir;
    const absorbStyle = f.profileId === "p1" ? 0.82 : f.profileId === "p2" ? 1.12 : f.profileId === "p3" ? 0.68 : 1;
    const liftStyle = f.profileId === "p1" ? 0.72 : f.profileId === "p2" ? 1.18 : f.profileId === "p3" ? 0.58 : 1;
    motion.x += impactDir * (impactT * (2.4 + strength * 3.1) * style.impactSnap + hurtT * (0.8 + strength * 0.9) * absorbStyle + headHit * 2.4 + bodyHit * 1.2 + legHit * 1.7) + shakePulse * 0.9;
    motion.y += Math.sin(effectiveHurt * 0.82) * hurtT * 0.8 * liftStyle - impactT * (0.35 + strength * 0.45) * style.impactRebound + contactT * 0.8 - headHit * 1.3 * liftStyle + legHit * 2.4 * liftStyle;
    motion.rotation += impactDir * (impactT * (0.016 + strength * 0.023) * absorbStyle + hurtT * 0.012 + headHit * 0.046 * liftStyle + bodyHit * 0.022 - legHit * 0.024 * liftStyle) + shakePulse * 0.005;
    motion.scaleX *= 1 + impactT * (0.008 + strength * 0.012) * absorbStyle + contactT * 0.006 + legHit * 0.028 * liftStyle + bodyHit * 0.012;
    motion.scaleY *= 1 - impactT * (0.004 + strength * 0.006) * absorbStyle + contactT * 0.004 - legHit * 0.035 * liftStyle - bodyHit * 0.008 + headHit * 0.008;
  }

  const reaction = impactReactionProfile(f);
  if (reaction.t > 0.035 && reaction.kind !== "guard") {
    const snap = reaction.snap;
    const rebound = reaction.rebound;
    const worldDir = reaction.worldDir || dir;
    const kindBoost = reaction.kind === "finish" ? 1.3 : reaction.kind === "counter" || reaction.kind === "blast" ? 1.14 : reaction.kind === "heavy" ? 1.05 : 0.86;
    const zone = reaction.zone === "head" || reaction.zone === "legs" ? reaction.zone : "torso";
    const liftStyle = f.profileId === "p1" ? 0.74 : f.profileId === "p2" ? 1.18 : f.profileId === "p3" ? 0.6 : 1;
    const absorbStyle = f.profileId === "p1" ? 0.86 : f.profileId === "p2" ? 1.1 : f.profileId === "p3" ? 0.7 : 1;

    if (zone === "head") {
      motion.x += worldDir * (snap * 4.2 + rebound * 2.2) * kindBoost;
      motion.y -= (snap * 1.8 + rebound * 0.55) * kindBoost * liftStyle;
      motion.rotation += worldDir * (snap * 0.052 + rebound * 0.027) * kindBoost * absorbStyle;
      motion.scaleX *= 1 + snap * 0.012 * absorbStyle;
      motion.scaleY *= 1 - snap * 0.01 * liftStyle;
      motion.afterimage = Math.max(motion.afterimage, reaction.t * 0.026 * kindBoost);
    } else if (zone === "legs") {
      motion.x += worldDir * (snap * 2.7 + rebound * 1.9) * kindBoost;
      motion.y += (snap * 3.2 + rebound * 0.9) * kindBoost * liftStyle;
      motion.rotation -= worldDir * (snap * 0.04 + rebound * 0.022) * kindBoost * absorbStyle;
      motion.scaleX *= 1 + snap * 0.022 * liftStyle;
      motion.scaleY *= 1 - snap * 0.036 * liftStyle;
      motion.afterimage = Math.max(motion.afterimage, reaction.t * 0.022 * kindBoost);
    } else {
      motion.x += worldDir * (snap * 3.4 + rebound * 1.7) * kindBoost;
      motion.y += (snap * 1.35 - rebound * 0.35) * kindBoost * liftStyle;
      motion.rotation += worldDir * (snap * 0.033 + rebound * 0.018) * kindBoost * absorbStyle;
      motion.scaleX *= 1 + snap * 0.026 * absorbStyle;
      motion.scaleY *= 1 - snap * 0.025 * absorbStyle;
      motion.afterimage = Math.max(motion.afterimage, reaction.t * 0.024 * kindBoost);
    }
  }

  const hitMass = hitReactionMassProfile(f);
  if (!winner && hitMass.active > 0.035 && hitMass.kind !== "guard") {
    const skidEase = smoothStep01(hitMass.skid);
    const snapEase = clamp(hitMass.snap, 0, 1.85);
    const zoneLift = hitMass.zone === "head" ? -1 : hitMass.zone === "legs" ? 1 : 0.15;
    const absorbStyle = f.profileId === "p1" ? 0.86 : f.profileId === "p2" ? 1.12 : f.profileId === "p3" ? 0.7 : 1;
    const liftStyle = f.profileId === "p1" ? 0.76 : f.profileId === "p2" ? 1.18 : f.profileId === "p3" ? 0.62 : 1;
    motion.x += hitMass.worldDir * (skidEase * 2.9 + snapEase * 1.15) * absorbStyle;
    motion.y += hitMass.floor * 1.05 + zoneLift * snapEase * 0.85 * liftStyle - hitMass.lift * snapEase * liftStyle;
    motion.rotation += hitMass.worldDir * (hitMass.fold * snapEase * 0.042 + hitMass.rebound * 0.011) * absorbStyle;
    motion.scaleX *= 1 + hitMass.floor * 0.012 + (hitMass.zone === "legs" ? snapEase * 0.016 : snapEase * 0.008) * absorbStyle;
    motion.scaleY *= 1 - hitMass.floor * 0.016 - (hitMass.zone === "torso" ? snapEase * 0.012 * absorbStyle : 0) + (hitMass.zone === "head" ? snapEase * 0.006 * liftStyle : 0);
    motion.afterimage = Math.max(motion.afterimage, hitMass.active * (hitMass.kind === "finish" ? 0.052 : hitMass.kind === "counter" || hitMass.kind === "blast" ? 0.036 : 0.022) * style.damageFx);
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
      const hero = f.profileId === "p1";
      const agile = f.profileId === "p2";
      const cheer = Math.sin(Math.min(resultFrame, 72) * 0.17) * clamp(resultFrame / 48, 0, 1);
      motion.y -= settle * (agile ? 0.55 : 0.72) + victory * (hero ? 1.25 : 1.7) + Math.max(0, cheer) * (agile ? 1.1 : 0.45);
      motion.rotation += dir * (settle * (hero ? 0.004 : 0.007) - victory * (hero ? 0.008 : 0.013) + cheer * (agile ? 0.008 : 0.003));
      motion.scaleX *= 1 + victory * (hero ? 0.018 : 0.011) + Math.max(0, cheer) * 0.004;
      motion.scaleY *= 1 - victory * (hero ? 0.01 : 0.006) - Math.max(0, cheer) * 0.003;
    } else {
      const fall = smoothStep01(clamp(resultFrame / 46, 0, 1));
      const bounce = Math.max(0, Math.sin(clamp((resultFrame - 16) / 28, 0, 1) * Math.PI));
      const impact = Math.max(0, 1 - resultFrame / 34);
      const fallDir = f.koFallDir || f.impactDir || -dir;
      const heavy = f.profileId === "p1";
      const agile = f.profileId === "p2";
      if (usesUnifiedSprite(f)) {
        motion.x += fallDir * (fall * (heavy ? 5.2 : 6.2) + impact * (agile ? 2.6 : 2.2));
        motion.y += 0.45 + fall * (heavy ? 8.5 : 9.5) - bounce * (heavy ? 1.7 : 2.1);
        motion.rotation += fallDir * (0.01 + fall * (agile ? 0.045 : 0.04) + impact * 0.01);
        motion.scaleX *= 1 + impact * 0.006 + fall * 0.006;
        motion.scaleY *= 1 - impact * 0.004 - fall * 0.005;
        motion.afterimage = Math.max(motion.afterimage, impact * 0.012);
      } else {
        motion.x += fallDir * (fall * (heavy ? 10 : 13) + impact * (agile ? 5.6 : 4.4));
        motion.y += 0.8 + fall * (heavy ? 19 : 22) - bounce * (heavy ? 3.5 : 5.2);
        motion.rotation += fallDir * (0.036 + fall * (agile ? 0.18 : 0.13) + impact * 0.028);
        motion.scaleX *= 1 + impact * 0.016 + fall * (heavy ? 0.018 : 0.026);
        motion.scaleY *= 1 - impact * 0.01 - fall * (heavy ? 0.014 : 0.02);
        motion.afterimage = Math.max(motion.afterimage, impact * 0.032);
      }
    }
  }

  motion.afterimage = clamp(motion.afterimage * style.afterimage, 0, usesUnifiedSprite(f) ? 0.055 : 0.3);

  return motion;
}

function drawWorldContactShadow(f, baseX, walking, stride, impactEase) {
  const spec = bodySpec(f);
  const air = clamp((FLOOR - f.y) / 132, 0, 1);
  const plant = walking ? clamp(f.walkPlant ?? 0, 0, 1) : 0;
  const walkSpread = walking ? Math.abs(stride) * 10 : 0;
  const crouchSpread = f.blocking ? 8 : 0;
  const landing = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  const landingWeight = landing * clamp(f.landingStrength ?? 1, 0.42, 1.65);
  const step = clamp((f.stepPulse ?? 0) / 7, 0, 1);
  const anchor = walking ? clamp((f.walkAnchorPulse ?? 0) / 12, 0, 1) : 0;
  const push = walking ? clamp((f.walkPushPulse ?? 0) / 9, 0, 1) : 0;
  const stop = f.grounded ? clamp((f.walkStopPulse ?? 0) / 16, 0, 1) : 0;
  const stopStrength = stop * clamp(f.walkStopSpeed ?? 0, 0, 1.45);
  const attackMass = f.attack ? attackMassProfile(f) : null;
  const attackWeight = f.attack ? attackBodyWeightProfile(f) : null;
  const attackPlant = attackMass ? clamp(Math.max(attackMass.plant, attackWeight?.plant ?? 0), 0, 1.65) : 0;
  const attackDrive = attackMass ? clamp(Math.max(attackMass.drive + attackMass.snap * 0.35, attackWeight?.drive ?? 0), 0, 1.75) : 0;
  const attackLoad = attackMass ? clamp(Math.max(attackMass.load, attackWeight?.load ?? 0), 0, 1.55) : 0;
  const attackCompression = attackWeight ? clamp(attackWeight.compression + attackWeight.brace * 0.18, 0, 1.75) : 0;
  const hitMass = f.hurt > 0 || (f.reactionPulse ?? 0) > 0 ? hitReactionMassProfile(f) : null;
  const reactionFloor = hitMass ? clamp(hitMass.floor, 0, 1.7) : 0;
  const reactionSkid = hitMass ? clamp(hitMass.skid, 0, 1.85) : 0;
  const attackOffset = (attackDrive * 8 - attackLoad * 5 - (attackWeight?.recoil ?? 0) * 2.4) * (f.dir || 1) * FIGHTER_SCALE;
  const reactionOffset = hitMass ? hitMass.worldDir * reactionSkid * 7 * FIGHTER_SCALE : 0;
  const stopOffset = -(f.walkStopDir || 0) * stopStrength * 7 * FIGHTER_SCALE;
  const width = (62 + spec.stance * 18 + walkSpread + crouchSpread + impactEase * 16 + landing * 18 + landingWeight * 28 + step * 8 + plant * 10 + anchor * 12 + push * 7 + stopStrength * 22 + attackPlant * 25 + attackDrive * 19 + attackCompression * 10 + reactionFloor * 24 + reactionSkid * 18) * FIGHTER_SCALE * (1 - air * 0.38);
  const height = (8.5 + spec.stance * 2.4 + impactEase * 2 + landing * 2.6 + landingWeight * 4.4 + step * 1.4 + plant * 0.8 + anchor * 1.8 + stopStrength * 3.6 + attackPlant * 3.4 + attackCompression * 1.2 + reactionFloor * 2.7) * FIGHTER_SCALE * (1 - air * 0.48);
  const alpha = clamp(0.3 - air * 0.18 + impactEase * 0.06 + landing * 0.045 + landingWeight * 0.075 + step * 0.025 + plant * 0.018 + anchor * 0.04 + stopStrength * 0.055 + attackPlant * 0.058 + attackCompression * 0.025 + reactionFloor * 0.052, 0.08, 0.56);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.translate(baseX + attackOffset + reactionOffset + stopOffset, FLOOR + 5);
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
    ctx.strokeStyle = `rgba(255, 228, 156, ${0.13 * landing + 0.11 * landingWeight})`;
    ctx.lineWidth = 1.8 * landing + 1.4 * landingWeight;
    ctx.beginPath();
    ctx.ellipse(baseX, FLOOR + 7, 42 + landing * 30 + landingWeight * 42, 6 + landing * 5 + landingWeight * 7, 0, 0, Math.PI * 2);
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

  if (f.grounded && stopStrength > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const stopDir = f.walkStopDir || f.dir || 1;
    const skidX = baseX - stopDir * (24 + stopStrength * 20) * FIGHTER_SCALE;
    ctx.fillStyle = `rgba(50, 30, 16, ${0.08 + stopStrength * 0.045})`;
    ctx.beginPath();
    ctx.ellipse(skidX, FLOOR + 8, 20 + stopStrength * 18, 4.2 + stopStrength * 2, -stopDir * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (f.grounded && hitMass && reactionSkid > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const skidX = baseX - hitMass.worldDir * (28 + reactionSkid * 16) * FIGHTER_SCALE;
    ctx.fillStyle = `rgba(45, 28, 15, ${0.08 + reactionSkid * 0.055})`;
    ctx.beginPath();
    ctx.ellipse(skidX, FLOOR + 8, 22 + reactionSkid * 18, 4.2 + reactionFloor * 1.6, -hitMass.worldDir * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const footPlant = Math.max(clamp((f.footPlantPulse ?? 0) / 10, 0, 1), anchor * 0.75, stop * 0.68, landingWeight * 0.72, attackPlant * 0.46, attackCompression * 0.36, reactionFloor * 0.34);
  if (f.grounded && footPlant > 0.04) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const side = stopStrength > attackPlant && stopStrength > reactionFloor
      ? f.walkAnchorSide || f.footPlantSide || 1
      : hitMass && reactionFloor > attackPlant ? (hitMass.worldDir === (f.dir || 1) ? -1 : 1) : attackWeight ? attackWeight.footSide : attackMass ? attackMass.footSide : f.walkAnchorSide || f.footPlantSide || 1;
    const footX = baseX + side * (26 + Math.abs(stride) * 12) * FIGHTER_SCALE * (f.dir || 1);
    ctx.fillStyle = `rgba(42, 25, 13, ${0.12 * footPlant})`;
    ctx.beginPath();
    ctx.ellipse(footX, FLOOR + 8, 24 + footPlant * 10, 4.8 + footPlant * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255, 228, 156, ${0.1 * footPlant})`;
    ctx.lineWidth = 1.2 + footPlant;
    ctx.beginPath();
    ctx.ellipse(footX, FLOOR + 6, 17 + footPlant * 8, 3.2 + footPlant, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawMovementPoseFX(f, crouch, walking, stride) {
  const jump = clamp((f.jumpPulse ?? 0) / 12, 0, 1);
  const landing = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  const landingWeight = landing * clamp(f.landingStrength ?? 1, 0.42, 1.65);
  const air = !f.grounded ? clamp((FLOOR - f.y) / 155, 0, 1) : 0;
  const plant = walking ? clamp(f.walkPlant ?? 0, 0, 1) : 0;
  const anchor = walking ? clamp((f.walkAnchorPulse ?? 0) / 12, 0, 1) : 0;
  const push = walking ? clamp((f.walkPushPulse ?? 0) / 9, 0, 1) : 0;
  const stop = f.grounded ? clamp((f.walkStopPulse ?? 0) / 16, 0, 1) : 0;
  const stopStrength = stop * clamp(f.walkStopSpeed ?? 0, 0, 1.45);
  const attackMass = f.attack ? attackMassProfile(f) : null;
  const attackWeight = f.attack ? attackBodyWeightProfile(f) : null;
  const attackPlant = attackMass ? clamp(Math.max(attackMass.plant, attackWeight?.plant ?? 0), 0, 1.55) : 0;
  const attackDrive = attackMass ? clamp(Math.max(attackMass.drive + attackMass.snap * 0.35, attackWeight?.drive ?? 0), 0, 1.75) : 0;
  const attackCompression = attackWeight ? clamp(attackWeight.compression + attackWeight.brace * 0.18, 0, 1.7) : 0;
  const hitMass = f.hurt > 0 || (f.reactionPulse ?? 0) > 0 ? hitReactionMassProfile(f) : null;
  const reactionFloor = hitMass ? clamp(hitMass.floor, 0, 1.7) : 0;
  const reactionSkid = hitMass ? clamp(hitMass.skid, 0, 1.85) : 0;
  const footPlant = Math.max(clamp((f.footPlantPulse ?? 0) / 10, 0, 1), anchor * 0.78, stop * 0.65, landingWeight * 0.7, attackPlant * 0.45, attackCompression * 0.34, reactionFloor * 0.34);
  if (jump <= 0.03 && landing <= 0.03 && air <= 0.03 && plant <= 0.08 && footPlant <= 0.03 && push <= 0.03 && stopStrength <= 0.03 && attackPlant <= 0.03 && attackCompression <= 0.03 && reactionSkid <= 0.03) return;

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
    ctx.strokeStyle = `rgba(255, 224, 142, ${0.12 * landing + 0.12 * landingWeight})`;
    ctx.lineWidth = 2.2 * landing + 1.7 * landingWeight;
    ctx.beginPath();
    ctx.ellipse(0, 2 + localCrouch, 44 + landing * 15 + landingWeight * 26, 6 + landing * 3 + landingWeight * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (footPlant > 0.03) {
    const side = (hitMass && reactionFloor > attackPlant ? (hitMass.worldDir === (f.dir || 1) ? -1 : 1) : attackWeight ? attackWeight.footSide : attackMass ? attackMass.footSide : f.walkAnchorSide || f.footPlantSide || 1) * 30;
    ctx.strokeStyle = `rgba(255, 226, 145, ${0.16 * footPlant})`;
    ctx.lineWidth = 1.8 + footPlant * 1.4;
    ctx.beginPath();
    ctx.ellipse(side, 4 + localCrouch, 20 + footPlant * 9, 4.5 + footPlant * 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (Math.abs(f.vx) > 0.6) {
      ctx.strokeStyle = `rgba(255, 236, 184, ${0.1 * footPlant})`;
      ctx.lineWidth = 1.3 + footPlant;
      ctx.beginPath();
      ctx.moveTo(side - Math.sign(f.vx) * 7, 4 + localCrouch);
      ctx.quadraticCurveTo(side - Math.sign(f.vx) * 17, 7 + localCrouch, side - Math.sign(f.vx) * (27 + push * 8), 6 + localCrouch);
      ctx.stroke();
    }
  }

  if (stopStrength > 0.04) {
    const stopDir = f.walkStopDir || moveDir;
    const support = (f.walkAnchorSide || f.footPlantSide || 1) * 30;
    ctx.strokeStyle = `rgba(255, 236, 184, ${0.08 + stopStrength * 0.09})`;
    ctx.lineWidth = 1.2 + stopStrength * 1.2;
    ctx.beginPath();
    ctx.moveTo(support - stopDir * 5, 5 + localCrouch);
    ctx.quadraticCurveTo(support - stopDir * (19 + stopStrength * 10), 8 + localCrouch, support - stopDir * (36 + stopStrength * 18), 6 + localCrouch);
    ctx.stroke();
  }

  if (attackPlant > 0.04) {
    const side = ((attackWeight?.footSide ?? attackMass.footSide) || -1) * 32;
    const driveDir = f.dir || 1;
    const attackPress = Math.max(attackPlant, attackCompression);
    ctx.strokeStyle = `rgba(255, 232, 158, ${0.08 + attackDrive * 0.1 + attackCompression * 0.035})`;
    ctx.lineWidth = 1.4 + attackPress * 1.25;
    ctx.beginPath();
    ctx.ellipse(side - driveDir * attackDrive * 7, 5 + localCrouch + attackCompression * 0.8, 20 + attackPress * 13, 4 + attackPress * 2.2, -driveDir * 0.06, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(trim, 0.07 + attackDrive * 0.12 + attackCompression * 0.04);
    ctx.lineWidth = 1.2 + attackDrive * 1.5 + attackCompression * 0.45;
    ctx.beginPath();
    ctx.moveTo(side - driveDir * 4, 1 + localCrouch);
    ctx.quadraticCurveTo(side - driveDir * (18 + attackDrive * 10), 8 + localCrouch, side - driveDir * (36 + attackDrive * 18), 6 + localCrouch);
    ctx.stroke();
  }

  if (hitMass && reactionSkid > 0.04) {
    const localImpactDir = hitMass.worldDir === (f.dir || 1) ? 1 : -1;
    const support = -localImpactDir * 30;
    ctx.strokeStyle = `rgba(255, 232, 166, ${0.08 + reactionSkid * 0.08})`;
    ctx.lineWidth = 1.4 + reactionFloor * 1.3;
    ctx.beginPath();
    ctx.ellipse(support, 5 + localCrouch, 22 + reactionFloor * 13, 4.4 + reactionFloor * 1.8, localImpactDir * 0.05, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 246, 210, ${0.08 + reactionSkid * 0.1})`;
    ctx.lineWidth = 1.1 + reactionSkid * 1.2;
    ctx.beginPath();
    ctx.moveTo(support + localImpactDir * 4, 3 + localCrouch);
    ctx.quadraticCurveTo(support - localImpactDir * (18 + reactionSkid * 12), 9 + localCrouch, support - localImpactDir * (38 + reactionSkid * 18), 6 + localCrouch);
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
  const stride = walking ? (f.walkStrideSmooth ?? Math.sin(walkCycle)) : 0;
  const plant = walking ? clamp(f.walkPlant ?? Math.abs(Math.cos(walkCycle)), 0, 1) : 0;
  const footPlant = clamp((f.footPlantPulse ?? 0) / 8, 0, 1);
  const stopPulse = clamp((f.walkStopPulse ?? 0) / 16, 0, 1);
  const stopWeight = stopPulse * clamp(f.walkStopSpeed ?? 0, 0, 1.45);
  const anchorPulse = walking ? clamp((f.walkAnchorPulse ?? 0) / 12, 0, 1) : stopPulse * 0.72;
  const pushPulse = walking ? clamp((f.walkPushPulse ?? 0) / 9, 0, 1) : 0;
  const rangeBrace = clamp(Math.max(f.rangePressure ?? 0, (f.bracePulse ?? 0) / 14), 0, 1);
  const transition = fighterTransitionMotion(f, walking);
  const bob = walking
    ? plant * 1.22 + footPlant * 0.5 + anchorPulse * 0.42 + stopWeight * 0.38 - Math.max(0, Math.sin(walkCycle * 2)) * 0.9 - pushPulse * 0.32 + rangeBrace * 0.45
    : Math.sin(t * 9) * (f.grounded ? 1.3 : 0) + stopWeight * 1.15;
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
  const visualScaleX = f.profileId === "p5" ? 0.82 : 1;
  const visualScaleY = f.profileId === "p5" ? 1.38 : 1;

  drawWorldContactShadow(f, baseX, walking, stride, impactEase);

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(impactLean + transition.rotation);
  ctx.scale(
    f.dir * (1 + attackStretch + hurtSquash) * transition.scaleX * visualScaleX,
    (1 + breathing - attackStretch * 0.28) * transition.scaleY * visualScaleY
  );
  ctx.scale(FIGHTER_SCALE, FIGHTER_SCALE);

  const pigForm = f.profileId === "p1" && f.pigMorph > 10 && f.pigMorph < 66;
  if (pigForm) {
    drawPchanPigForm(f, crouch);
    drawDynamicFighterLighting(f, crouch);
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

  const unifiedSprite = usesUnifiedSprite(f);
  if (!unifiedSprite) {
    drawFighterRimLight(f, crouch);
    drawMovementPoseFX(f, crouch, walking, stride);
    drawEntrancePoseEffect(f, crouch);
  }
  if (f.attack && !unifiedSprite) drawAttackAnticipationCue(f, crouch);
  if (f.attack && !unifiedSprite) drawAttackBodyGlow(f, crouch);
  if (f.attack && !unifiedSprite) drawAttackKineticFX(f, crouch, "back");
  if (!winner && f.energy >= 45 && f.hurt <= 0 && !(unifiedSprite && f.attack)) drawEnergyAura(f, crouch);
  drawFighterIdentityAura(f, crouch, walking, stride);
  if (!unifiedSprite) drawSpriteUnderlay(f, pose, crouch);

  if (drawRasterBodySprite(f, crouch, walking ? stride : 0, walking, transition)) {
    drawHeroRimComposite(f, crouch, impactEase);
    drawFighterWearOverlay(f, crouch);
    if (f.attack && !unifiedSprite) drawAttackKineticFX(f, crouch, "front");
    if (!unifiedSprite) {
      if (f.blocking) drawGuard(f.trim, crouch, f);
      else if ((f.counterWindow ?? 0) > 0 && f.hurt <= 0 && !winner) drawCounterReadyFX(f.trim, crouch, f);
      if (f.hitFlash > 0) drawHitFlash(f, crouch);
      if (f.hurt > 0) drawHurtRim(f, crouch);
      drawDamageReactionFX(f, crouch);
      if (f.health < 30 && f.hurt <= 0 && !winner) drawLowHealthStagger(f, crouch);
      if (winner) drawResultPoseEffect(f, crouch);
    }
    ctx.restore();

    const box = attackBox(f);
    if (!unifiedSprite && box && f.attack.frame >= f.attack.activeStart - 2 && f.attack.frame <= f.attack.activeEnd + 2) {
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
  drawVectorContactOcclusion(f, crouch, walking ? stride : 0);
  drawMaguilaHeavyGroundPolish(f, pose, crouch, walking, stride);
  drawPinoReflexPolish(f, pose, crouch, walking, stride);
  drawSimiolinReachPolish(f, pose, crouch, walking, stride);
  drawLiliGuardPolish(f, pose, crouch, walking, stride);
  drawHead(f, crouch, walking ? stride : 0);
  drawFighterWearOverlay(f, crouch);
  if (f.attack) drawAttackKineticFX(f, crouch, "front");
  drawFighterStageLighting(f, crouch);
  drawHeroRimComposite(f, crouch, impactEase);

  if (f.blocking) drawGuard(f.trim, crouch, f);
  else if ((f.counterWindow ?? 0) > 0 && f.hurt <= 0 && !winner) drawCounterReadyFX(f.trim, crouch, f);
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

function drawHeroRimComposite(f, crouch, impactEase = 0) {
  const energy = clamp((f.energy ?? 0) / 100, 0, 1);
  const danger = clamp((38 - (f.health ?? 100)) / 38, 0, 1);
  const attack = f.attack ? attackPhase(f.attack).power : 0;
  const pulse = 0.5 + Math.sin(roundFrame * 0.07 + f.x * 0.01) * 0.5;
  const cleanSprite = usesUnifiedSprite(f);
  const scale = cleanSprite ? 0.88 : 1;
  const alpha = (0.045 + energy * 0.035 + danger * 0.026 + attack * 0.05 + impactEase * 0.07) * (cleanSprite ? 0.72 : 1);
  const warmX = f.dir > 0 ? -42 : 42;
  const coolX = -warmX;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  let rim = ctx.createLinearGradient(warmX, -190 + crouch, coolX * 0.4, -42 + crouch);
  rim.addColorStop(0, `rgba(255, 229, 156, ${alpha})`);
  rim.addColorStop(0.34, colorWithAlpha(f.trim, alpha * (0.7 + pulse * 0.18)));
  rim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(-10 * f.dir, -102 + crouch, 62 * scale, 112 * scale, -0.06 * f.dir, 0, Math.PI * 2);
  ctx.fill();

  rim = ctx.createLinearGradient(coolX, -178 + crouch, warmX * 0.2, -48 + crouch);
  rim.addColorStop(0, `rgba(102, 221, 255, ${alpha * 0.72})`);
  rim.addColorStop(0.5, colorWithAlpha(f.color, alpha * 0.24));
  rim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(20 * f.dir, -99 + crouch, 42 * scale, 103 * scale, 0.04 * f.dir, 0, Math.PI * 2);
  ctx.fill();

  if (attack > 0.08 || impactEase > 0.08 || danger > 0.15) {
    const radius = 58 + attack * 36 + impactEase * 28;
    const glow = ctx.createRadialGradient(0, -96 + crouch, 10, 0, -96 + crouch, radius);
    glow.addColorStop(0, colorWithAlpha(f.trim, (0.035 + attack * 0.05 + impactEase * 0.08) * scale));
    glow.addColorStop(0.48, colorWithAlpha(f.color, (0.018 + danger * 0.02) * scale));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, -94 + crouch, radius * 0.72, radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function fighterWearState(f) {
  const damageTaken = clamp((f.roundDamageTaken ?? 0) / 92, 0, 1);
  const healthWear = clamp((100 - (f.health ?? 100)) / 78, 0, 1);
  const danger = clamp((34 - (f.health ?? 100)) / 34, 0, 1);
  const recent = clamp((f.damagePulse ?? 0) / 38, 0, 1);
  const guard = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const ko = winner && f.id !== roundWinnerId ? clamp(resultFrame / 62, 0, 1) : 0;
  const amount = clamp(Math.max(damageTaken * 0.8, healthWear * 0.72, ko * 0.86) + recent * 0.22 + guard * 0.1, 0, 1.35);
  return { amount, damageTaken, healthWear, danger, recent, guard, ko };
}

function drawFighterWearOverlay(f, crouch) {
  const wear = fighterWearState(f);
  if (wear.amount <= 0.035) return;

  const mobile = isMobileFightView();
  const intensity = wear.amount * (usesUnifiedSprite(f) ? 0.76 : 1);
  const trim = f.trim || "#fff1bd";
  const bruise = f.profileId === "p2" || f.profileId === "p6" ? "#8a2f45" : "#6d2c22";
  const clothAlpha = mobile ? 0.52 : 1;
  const breath = 0.5 + Math.sin(roundFrame * 0.09 + f.x * 0.02) * 0.5;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(34, 17, 12, ${0.035 + intensity * 0.07})`;
  ctx.beginPath();
  ctx.ellipse(0, -92 + crouch, 43 + intensity * 9, 76 + intensity * 12, -0.04 * f.dir, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(bruise, (0.11 + intensity * 0.2) * clothAlpha);
  ctx.lineWidth = 2.2 + intensity * 1.6;
  const slashSide = f.id === "right" ? -1 : 1;
  for (let i = 0; i < (mobile ? 2 : 3); i += 1) {
    const y = -130 + crouch + i * 32 + Math.sin(i + f.x) * 2;
    const x = slashSide * (-26 + i * 16);
    ctx.beginPath();
    ctx.moveTo(x - slashSide * (16 + intensity * 6), y - 7);
    ctx.lineTo(x + slashSide * (18 + intensity * 8), y + 5);
    ctx.stroke();
  }

  if (wear.danger > 0.02) {
    ctx.fillStyle = `rgba(26, 10, 8, ${0.08 + wear.danger * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(-8 * f.dir, -116 + crouch + breath * 2, 31 + wear.danger * 8, 34 + wear.danger * 10, -0.08 * f.dir, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(trim, (0.055 + wear.recent * 0.12 + wear.danger * 0.05) * clothAlpha);
  ctx.lineWidth = 1.2 + wear.recent * 1.1;
  for (const mark of [
    [-27, -105 + crouch, 20, -8],
    [22, -76 + crouch, -18, 8],
    [-19, -39 + crouch, 16, 5],
  ]) {
    ctx.beginPath();
    ctx.moveTo(mark[0], mark[1]);
    ctx.lineTo(mark[0] + mark[2], mark[1] + mark[3]);
    ctx.stroke();
  }

  if (wear.healthWear > 0.28 && !mobile) {
    ctx.fillStyle = `rgba(255, 247, 214, ${0.035 + wear.healthWear * 0.075})`;
    for (const drop of [
      [-16, -127 + crouch, 3.2],
      [18, -112 + crouch, 2.6],
      [4, -83 + crouch, 2.8],
    ]) {
      ctx.beginPath();
      ctx.ellipse(drop[0] + Math.sin(roundFrame * 0.07 + drop[0]) * 0.8, drop[1] + breath * 3, drop[2] * 0.58, drop[2] * 1.55, 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (wear.guard > 0.04) {
    ctx.strokeStyle = colorWithAlpha("#dff8ff", 0.08 + wear.guard * 0.18);
    ctx.lineWidth = 1.3 + wear.guard;
    ctx.beginPath();
    ctx.moveTo(-34, -146 + crouch);
    ctx.lineTo(32, -57 + crouch);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFighterIdentityAura(f, crouch, walking = false, stride = 0) {
  if (!f || f.hurt > 26) return;

  const localCrouch = crouch * 0.18;
  const profileId = f.profileId ?? "";
  const trim = f.trim ?? "#fff1bd";
  const clock = roundFrame + (f.x ?? 0) * 0.07;
  const idle = f.grounded && !walking && !f.attack && f.hurt <= 0 && !winner ? 1 : 0;
  const energy = clamp((f.energy ?? 0) / 100, 0, 1);
  const guard = f.blocking ? clamp(Math.max((f.guardPulse ?? 0) / 18, (f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES), 0, 1) : 0;
  const hurt = clamp((f.hurt ?? 0) / 24, 0, 1);
  const move = walking ? clamp(Math.abs(stride) * 0.72 + Math.abs(f.vx ?? 0) / 8, 0, 1) : 0;
  const attack = f.attack ? attackPhase(f.attack) : null;
  const strike = attack ? Math.max(attack.anticipation * 0.58, attack.strike, attack.snap * 0.75) : 0;
  const special = f.attack?.type === "special" ? Math.max(strike, attack?.power ?? 0) : 0;
  const intro = fighterEntranceCue(f)?.ease ?? 0;
  const ready = clamp((f.specialReadyPulse ?? 0) / 54, 0, 1);
  const cleanSprite = usesUnifiedSprite(f);
  const scale = cleanSprite ? 0.86 : 1;
  const base = clamp(
    0.12 + idle * 0.18 + energy * 0.16 + move * 0.08 + strike * 0.24 + guard * 0.2 + intro * 0.2 + ready * 0.28 - hurt * 0.08,
    0.06,
    0.68
  ) * (cleanSprite ? 0.72 : 1);
  if (base <= 0.035) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const floorPulse = 0.5 + Math.sin(clock * 0.08) * 0.5;
  ctx.strokeStyle = colorWithAlpha(trim, 0.05 + base * 0.16);
  ctx.lineWidth = 1.1 + base * 2.3;
  ctx.beginPath();
  ctx.ellipse(
    0,
    4 + localCrouch,
    (38 + floorPulse * 8 + energy * 12) * scale,
    (5 + floorPulse * 2 + energy * 3) * scale,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  if (profileId === "p1") {
    ctx.strokeStyle = colorWithAlpha("#7fc8ff", 0.08 + base * 0.24 + special * 0.12);
    ctx.lineWidth = 2.1 + strike * 1.8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 42, -28 + localCrouch);
      ctx.bezierCurveTo(
        side * (26 + move * 9),
        -77 + localCrouch,
        side * (48 + special * 10),
        -132 + localCrouch,
        side * (24 + Math.sin(clock * 0.06) * 4),
        -180 + localCrouch
      );
      ctx.stroke();
    }
  } else if (profileId === "p2") {
    ctx.strokeStyle = colorWithAlpha("#5ee0b4", 0.08 + base * 0.24 + guard * 0.16);
    ctx.lineWidth = 1.6 + strike * 1.3 + guard;
    for (let i = 0; i < 2; i += 1) {
      const phase = clock * 0.045 + i * Math.PI;
      ctx.beginPath();
      ctx.ellipse(
        Math.sin(phase) * 11,
        -121 + localCrouch + i * 18,
        35 + strike * 12,
        9 + guard * 5,
        phase * 0.08,
        Math.PI * 0.05,
        Math.PI * 1.42
      );
      ctx.stroke();
    }
  } else if (profileId === "p3") {
    ctx.strokeStyle = colorWithAlpha("#ffffff", 0.08 + base * 0.2 + strike * 0.12);
    ctx.lineWidth = 2.2 + strike * 2.2;
    for (let i = 0; i < 3; i += 1) {
      const width = 48 + i * 15 + strike * 18 + move * 10;
      ctx.beginPath();
      ctx.ellipse(0, 5 + localCrouch, width, 5 + i * 1.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = colorWithAlpha("#65c7f2", 0.06 + base * 0.18);
    ctx.lineWidth = 1.6;
    for (const x of [-42, -23, 23, 42]) {
      ctx.beginPath();
      ctx.moveTo(x, -38 + localCrouch);
      ctx.lineTo(x + Math.sin(clock * 0.04 + x) * 4, -132 + localCrouch);
      ctx.stroke();
    }
  } else if (profileId === "p4") {
    ctx.strokeStyle = colorWithAlpha("#96e06c", 0.09 + base * 0.25 + ready * 0.08);
    ctx.lineWidth = 1.5 + strike * 1.4;
    for (let i = 0; i < 4; i += 1) {
      const side = i % 2 ? 1 : -1;
      const y = -55 - i * 26 + localCrouch + Math.sin(clock * 0.07 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(side * (24 + i * 3), y);
      ctx.lineTo(side * (39 + move * 12), y - 10 - strike * 5);
      ctx.lineTo(side * (25 + special * 10), y - 21);
      ctx.stroke();
    }
  } else if (profileId === "p5") {
    ctx.strokeStyle = colorWithAlpha("#47d5ff", 0.08 + base * 0.22 + special * 0.12);
    ctx.lineWidth = 1.7 + strike * 1.5;
    for (const y of [-74, -111, -148]) {
      const reach = 54 + energy * 11 + strike * 18;
      ctx.beginPath();
      ctx.moveTo(-reach, y + localCrouch + Math.sin(clock * 0.045 + y) * 2);
      ctx.quadraticCurveTo(0, y - 7 + localCrouch, reach, y + localCrouch - Math.cos(clock * 0.04 + y) * 2);
      ctx.stroke();
    }
    ctx.fillStyle = colorWithAlpha(trim, 0.1 + base * 0.2);
    for (const x of [-58, 58]) {
      ctx.beginPath();
      ctx.ellipse(x, -108 + localCrouch, 3.4 + strike * 2, 11 + energy * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (profileId === "p6") {
    ctx.strokeStyle = colorWithAlpha("#ff8ac8", 0.08 + base * 0.22 + guard * 0.22);
    ctx.lineWidth = 1.8 + guard * 2 + strike * 0.8;
    const shield = 24 + guard * 12 + energy * 6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * shield, -41 + localCrouch);
      ctx.quadraticCurveTo(side * (54 + guard * 10), -96 + localCrouch, side * (31 + Math.sin(clock * 0.05) * 3), -160 + localCrouch);
      ctx.stroke();
    }
    ctx.strokeStyle = colorWithAlpha("#343840", 0.1 + base * 0.18);
    ctx.lineWidth = 4 + guard * 2;
    ctx.beginPath();
    ctx.ellipse(0, -101 + localCrouch, 50 + guard * 16, 94 + guard * 16, 0, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
  } else {
    const glow = ctx.createRadialGradient(0, -98 + localCrouch, 8, 0, -98 + localCrouch, 95);
    glow.addColorStop(0, colorWithAlpha(trim, 0.08 + base * 0.1));
    glow.addColorStop(0.45, colorWithAlpha(f.color ?? trim, 0.035 + base * 0.04));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, -98 + localCrouch, 50, 98, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawAttackAnticipationCue(f, crouch) {
  if (!f.attack || f.attack.frame >= f.attack.activeStart) return;
  const phase = attackPhase(f.attack);
  const prep = phase.anticipation;
  if (prep <= 0.08) return;

  const spec = attackVisualSpec(f.attack.type);
  const mass = attackMassProfile(f);
  const read = attackReadabilityProfile(f);
  const signature = spec.special ? fighterSignatureStyle(f) : null;
  const color = signature?.trail ?? spec.color;
  const core = signature?.core ?? spec.core;
  const rim = signature?.rim ?? spec.color;
  const localCrouch = crouch * 0.18;
  const charge = smoothStep01(clamp((phase.windupT - 0.14) / 0.82, 0, 1));
  const peak = Math.sin(clamp(phase.windupT, 0, 1) * Math.PI);
  const release = smoothStep01(clamp((phase.windupT - 0.58) / 0.42, 0, 1));
  const heavy = spec.heavy || spec.grab;
  const anchorX = spec.kick || spec.sweep ? 31 : spec.special ? 23 : 38;
  const anchorY = spec.sweep ? -35 : spec.kick ? -78 : spec.special ? -118 : -121;
  const loadX = anchorX - (spec.kick ? 25 : spec.sweep ? 36 : spec.special ? 18 : 30) * prep;
  const loadY = anchorY + localCrouch + (spec.sweep ? 18 * prep : spec.kick ? -8 * prep : spec.special ? -5 * prep : -4 * prep);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const floorAlpha = clamp(0.04 + mass.plant * 0.07 + prep * 0.035 + charge * 0.035, 0.04, 0.18);
  ctx.fillStyle = colorWithAlpha(color, floorAlpha);
  ctx.beginPath();
  ctx.ellipse(
    -mass.footSide * 31 - f.dir * release * 5,
    4 + localCrouch + mass.crush * 0.8,
    31 + prep * (heavy ? 28 : 19),
    4.5 + prep * 3.5,
    -f.dir * release * 0.05,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(core, 0.14 + prep * 0.2 + charge * 0.12);
  ctx.lineWidth = 1.5 + prep * (heavy ? 2.3 : 1.6) + charge * 0.7;
  ctx.beginPath();
  ctx.ellipse(loadX, loadY, 11 + prep * (spec.special ? 24 : 15), 6 + prep * (spec.special ? 15 : 9), -0.15, 0, Math.PI * 2);
  ctx.stroke();

  const glow = ctx.createRadialGradient(loadX, loadY, 2, loadX, loadY, 34 + prep * (heavy ? 40 : 28));
  glow.addColorStop(0, `rgba(255,255,255,${0.08 + prep * 0.12})`);
  glow.addColorStop(0.36, colorWithAlpha(rim, 0.08 + prep * 0.16));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(loadX, loadY, 36 + prep * (heavy ? 38 : 28), 21 + prep * (heavy ? 24 : 16), -0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(color, 0.16 + prep * 0.22);
  ctx.lineWidth = 1.2 + prep * 1.6;
  const lanes = spec.special ? 4 : 3;
  for (let i = 0; i < lanes; i += 1) {
    const lane = i - (lanes - 1) / 2;
    const pull = (heavy ? 25 : 18) + prep * (heavy ? 28 : 18);
    ctx.beginPath();
    if (spec.sweep) {
      ctx.moveTo(-55 - prep * 18, -22 + localCrouch + lane * 8);
      ctx.quadraticCurveTo(2 + lane * 7, -55 + localCrouch - prep * 8, loadX + 40 + prep * 18, loadY + lane * 4);
    } else if (spec.kick) {
      ctx.moveTo(loadX - pull, loadY + lane * 9);
      ctx.quadraticCurveTo(loadX - 8, loadY - 33 - prep * 12, loadX + 44 + prep * 10, loadY - 6 + lane * 7);
    } else if (spec.special) {
      ctx.moveTo(loadX - 28 - prep * 8, loadY + lane * 9);
      ctx.bezierCurveTo(loadX - 4, loadY - 34 - lane * 5, loadX + 34 + prep * 16, loadY - 12 + lane * 6, loadX + 54 + prep * 18, loadY + lane * 8);
    } else {
      ctx.moveTo(loadX - pull, loadY + lane * 8);
      ctx.quadraticCurveTo(loadX - 6, loadY - 28 - prep * 9, loadX + 42 + prep * 13, loadY + lane * 4);
    }
    ctx.stroke();
  }

  if (release > 0.18) {
    ctx.strokeStyle = colorWithAlpha("#ffffff", 0.18 + release * 0.42);
    ctx.lineWidth = 1.4 + read.clarity * 1.2;
    ctx.beginPath();
    ctx.moveTo(loadX - 8, loadY - 4);
    ctx.lineTo(loadX + 17 + release * 16, loadY - 8 + peak * 3);
    ctx.moveTo(loadX - 5, loadY + 7);
    ctx.lineTo(loadX + 13 + release * 13, loadY + 9 + peak * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnergyAura(f, crouch) {
  const color = f.trim ?? "#fff1bd";
  const cleanSprite = usesUnifiedSprite(f);
  const auraAlpha = cleanSprite ? 0.34 : 1;
  const auraScale = cleanSprite ? 0.82 : 1;
  const pulse = 0.45 + Math.sin(roundFrame * 0.08) * 0.16;
  const readyPulse = clamp((f.specialReadyPulse ?? 0) / 54, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = color;
  ctx.globalAlpha = (0.012 + pulse * 0.014 + readyPulse * 0.055) * auraAlpha;
  ctx.lineWidth = (cleanSprite ? 0.5 : 0.8) + readyPulse * 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -88 + crouch, (48 + readyPulse * 14) * auraScale, (72 + readyPulse * 22) * auraScale, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = (0.008 + pulse * 0.01 + readyPulse * 0.034) * auraAlpha;
  ctx.beginPath();
  ctx.ellipse(0, -93 + crouch, (58 + readyPulse * 18) * auraScale, (84 + readyPulse * 24) * auraScale, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFighterRimLight(f, crouch) {
  const cleanSprite = usesUnifiedSprite(f);
  const alphaBase = f.hurt > 0 ? 0.1 : f.energy >= 45 ? 0.045 : 0.035;
  const alpha = alphaBase * (cleanSprite ? 0.42 : 1);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const rim = ctx.createRadialGradient(-18, -124 + crouch, 12, 0, -96 + crouch, 96);
  rim.addColorStop(0, colorWithAlpha(f.trim, alpha));
  rim.addColorStop(0.46, colorWithAlpha(f.trim, alpha * 0.35));
  rim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(0, -96 + crouch, 54, 104, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFighterStageLighting(f, crouch) {
  const cleanSprite = usesUnifiedSprite(f);
  const lightFactor = cleanSprite ? 0.45 : 1;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const warm = ctx.createLinearGradient(-58, -185 + crouch, 34, -42 + crouch);
  warm.addColorStop(0, `rgba(255, 224, 150, ${0.08 * lightFactor})`);
  warm.addColorStop(0.36, colorWithAlpha(f.trim, 0.03 * lightFactor));
  warm.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = warm;
  ctx.beginPath();
  ctx.ellipse(-12, -103 + crouch, 45, 104, -0.1, 0, Math.PI * 2);
  ctx.fill();

  const coolRim = ctx.createLinearGradient(38, -172 + crouch, 72, -56 + crouch);
  coolRim.addColorStop(0, `rgba(120, 217, 255, ${0.07 * lightFactor})`);
  coolRim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = coolRim;
  ctx.beginPath();
  ctx.ellipse(33, -98 + crouch, 20, 96, 0.05, 0, Math.PI * 2);
  ctx.fill();
  drawDynamicFighterLighting(f, crouch);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(34, 17, 10, ${0.055 * (cleanSprite ? 0.38 : 1)})`;
  ctx.beginPath();
  ctx.ellipse(14, -82 + crouch, 58, 98, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dynamicLightProfile(f) {
  const cleanSprite = usesUnifiedSprite(f);
  const raw = clamp((f.dynamicLightPulse ?? 0) / Math.max(1, f.dynamicLightMax ?? 1), 0, 1);
  const hitLight = smoothStep01(raw) * clamp(f.dynamicLightStrength ?? 0, 0, 1.5) * (cleanSprite ? 0.62 : 1);
  const guard = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const specialPhase = f.attack?.type === "special" ? attackPhase(f.attack) : null;
  const special = specialPhase ? Math.max(specialPhase.anticipation * 0.7, specialPhase.strike, specialPhase.snap) : 0;
  let active = hitLight;
  let color = f.dynamicLightColor ?? "#fff1bd";
  let zone = f.dynamicLightZone ?? "torso";
  let dir = f.dynamicLightDir ?? f.impactDir ?? f.dir ?? 1;

  const guardWeight = cleanSprite ? 0.44 : 0.82;
  if (guard * guardWeight > active) {
    active = guard * guardWeight;
    color = "#bdeaff";
    zone = "guard";
    dir = f.dir ?? 1;
  }

  const specialWeight = cleanSprite ? 0.32 : 0.92;
  if (special * specialWeight > active) {
    active = special * specialWeight;
    color = f.specialStyle?.rim ?? "#fff1bd";
    zone = "torso";
    dir = f.dir ?? 1;
  }

  return { active: clamp(active, 0, cleanSprite ? 0.48 : 1.45), color, zone, dir };
}

function drawDynamicFighterLighting(f, crouch) {
  const light = dynamicLightProfile(f);
  if (light.active <= 0.035) return;
  const localDir = light.dir === (f.dir ?? 1) ? 1 : -1;
  const zone = light.zone === "guard" ? "torso" : light.zone;
  const centerY = zone === "head" ? -136 + crouch : zone === "legs" ? -48 + crouch : -104 + crouch;
  const radiusX = zone === "head" ? 54 : zone === "legs" ? 68 : 66;
  const radiusY = zone === "head" ? 50 : zone === "legs" ? 48 : 116;
  const sideX = localDir * (zone === "head" ? 20 : 28);
  const alpha = clamp(light.active, 0, 1.3);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(sideX, centerY, 4, sideX * 0.45, centerY, 96 + alpha * 38);
  glow.addColorStop(0, `rgba(255,255,255,${0.2 * alpha})`);
  glow.addColorStop(0.26, colorWithAlpha(light.color, 0.28 * alpha));
  glow.addColorStop(0.7, colorWithAlpha(light.color, 0.08 * alpha));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(sideX * 0.18, centerY, radiusX + alpha * 16, radiusY + alpha * 10, -localDir * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(light.color, 0.18 * alpha);
  ctx.lineWidth = 4 + alpha * 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(localDir * -28, centerY - radiusY * 0.58);
  ctx.quadraticCurveTo(localDir * 18, centerY - radiusY * 0.05, localDir * 32, centerY + radiusY * 0.52);
  ctx.stroke();

  if (zone === "head" || light.active > 0.58) {
    ctx.strokeStyle = `rgba(255,255,255,${0.08 * alpha})`;
    ctx.lineWidth = 1.5 + alpha;
    ctx.beginPath();
    ctx.ellipse(localDir * 8, -142 + crouch, 34 + alpha * 10, 31 + alpha * 6, -localDir * 0.08, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpriteUnderlay(f, pose, crouch) {
  const spec = bodySpec(f);
  const cleanSprite = usesUnifiedSprite(f);
  const shoulder = spec.shoulder + (cleanSprite ? 4 : 12);
  const hip = spec.hip + (cleanSprite ? 4 : 12);
  const alpha = cleanSprite ? (f.hurt > 0 ? 0.055 : 0.022) : (f.hurt > 0 ? 0.18 : 0.1);

  ctx.save();
  ctx.fillStyle = `rgba(20, 11, 9, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, -88 + crouch, shoulder, 82, -0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(10, 7, 6, 0.1)";
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

function attackFrameTimeline(f, frameName, frames) {
  if (!f.attack) return null;
  const start = clamp(f.attack.activeStart / Math.max(1, f.attack.duration), 0, 1);
  const end = clamp(f.attack.activeEnd / Math.max(1, f.attack.duration), start, 1);
  const strikeSplit = start + (end - start) * 0.56;
  const settleSplit = end + (1 - end) * 0.34;
  const recoverySplit = end + (1 - end) * 0.68;

  if (frameName === "punch" || frameName === "kick") {
    return [
      { frame: frames[0], end: start * 0.42 },
      { frame: frames[1] ?? frames[0], end: start },
      { frame: frames[2] ?? frames[1] ?? frames[0], end: strikeSplit },
      { frame: frames[3] ?? frames[2] ?? frames[0], end: settleSplit },
      { frame: frames[4] ?? frames[3] ?? frames[frames.length - 1], end: recoverySplit },
      { frame: frames[5] ?? frames[4] ?? frames[frames.length - 1], end: 1 },
    ];
  }

  if (frameName === "sweep") {
    return [
      { frame: 19, end: start * 0.55 },
      { frame: 16, end },
      { frame: 20, end: end + (1 - end) * 0.5 },
      { frame: 9, end: 1 },
    ];
  }

  if (frameName === "special") {
    return [
      { frame: 4, end: start * 0.42 },
      { frame: 13, end: start },
      { frame: f.profileId === "p2" ? 5 : 13, end },
      { frame: 18, end: end + (1 - end) * 0.52 },
      { frame: 13, end: 1 },
    ];
  }

  return null;
}

function frameFromTimeline(f, timeline) {
  const t = clamp(f.attack.frame / Math.max(1, f.attack.duration), 0, 0.999);
  return (timeline.find((item) => t < item.end) ?? timeline[timeline.length - 1])?.frame;
}

function frameBlendFromTimeline(f, timeline, currentFrameIndex) {
  const t = clamp(f.attack.frame / Math.max(1, f.attack.duration), 0, 0.999);
  const blendWidth = 0.038;

  for (let i = 0; i < timeline.length - 1; i += 1) {
    const boundary = timeline[i].end;
    const distance = t - boundary;
    if (Math.abs(distance) > blendWidth) continue;

    const neighborFrame = distance < 0 ? timeline[i + 1].frame : timeline[i].frame;
    if (neighborFrame === currentFrameIndex) return null;

    const strength = 1 - Math.abs(distance) / blendWidth;
    return {
      frameIndex: neighborFrame,
      alpha: clamp(0.012 + strength * 0.028, 0.012, 0.04),
      offsetX: (distance < 0 ? 1 : -1) * strength * 0.8,
      offsetY: Math.sin(strength * Math.PI) * -0.25,
    };
  }

  return null;
}

function rasterBodyFrameBlend(f, frameName, currentFrameIndex, walking) {
  const frames = BODY_SPRITE_FRAMES[frameName] ?? BODY_SPRITE_FRAMES.idle;

  if (f.attack) {
    const timeline = attackFrameTimeline(f, frameName, frames);
    if (!timeline) return null;
    return frameBlendFromTimeline(f, timeline, currentFrameIndex);
  }

  if (frameName === "walk" || walking) {
    return null;
  }

  return null;
}

function rasterBodyFrameIndex(f, frameName, walking) {
  const frames = BODY_SPRITE_FRAMES[frameName] ?? BODY_SPRITE_FRAMES.idle;

  if (f.attack) {
    const timeline = attackFrameTimeline(f, frameName, frames);
    if (timeline) return frameFromTimeline(f, timeline);
  }

  if (frames.length === 1) return frames[0];

  if (frameName === "hurt") {
    const reaction = impactReactionProfile(f);
    const headFrame = frames[0] ?? 11;
    const bodyFrame = frames[1] ?? frames[0] ?? 11;
    const legsFrame = frames[2] ?? frames[1] ?? frames[0] ?? 12;
    const lightFrame = frames[3] ?? frames[0] ?? 11;
    const lowFrame = frames[4] ?? legsFrame;
    const recoverFrame = frames[5] ?? lightFrame;
    if (reaction.t > 0.05) {
      if (reaction.zone === "head") return headFrame;
      if (reaction.zone === "legs") return legsFrame;
      return reaction.kind === "heavy" || reaction.kind === "counter" || reaction.kind === "blast" || reaction.kind === "finish" ? bodyFrame : lightFrame;
    }
    if (f.hurt > 15) return bodyFrame;
    if (f.hurt > 8) return lowFrame;
    return recoverFrame;
  }

  if (frameName === "walk" || walking) {
    const cycle = f.walkCycle ?? roundFrame * 0.2;
    const normalized = ((cycle / (Math.PI * 2)) % 1 + 1) % 1;
    return frames[Math.floor(normalized * frames.length) % frames.length] ?? frames[0];
  }

  return frames[Math.floor(roundFrame / 34) % frames.length] ?? frames[0];
}

function spriteFrameNameForPoseState(state) {
  if (state === "grab") return "punch";
  if (state === "air") return "kick";
  if (state === "punch" || state === "kick" || state === "sweep" || state === "special") return state;
  if (state === "block" || state === "hurt" || state === "victory" || state === "defeat" || state === "walk") return state;
  return "idle";
}

function spriteFrameIndexForPoseState(state) {
  const frameName = spriteFrameNameForPoseState(state);
  const frames = BODY_SPRITE_FRAMES[frameName] ?? BODY_SPRITE_FRAMES.idle;
  if (frameName === "walk") return frames[1] ?? frames[0];
  if (frameName === "punch") return state === "grab" ? frames[1] ?? frames[0] : frames[0];
  if (frameName === "kick") return frames[0];
  if (frameName === "sweep") return 16;
  if (frameName === "special") return 13;
  return frames[0];
}

function drawSpritePoseTransitionBlend(f, image, currentFrameIndex, crouch, compact = false) {
  const poseShift = poseTransitionProfile(f);
  if (poseShift.t <= 0.045 || !image?.complete || !image.naturalWidth) return;
  const focusedSprite = f.profileId === "p1" || f.profileId === "p2";

  const previousIndex = spriteFrameIndexForPoseState(poseShift.from);
  if (previousIndex === currentFrameIndex) return;

  const alpha = clamp(poseShift.t * (poseShift.fromAttack || poseShift.intoAttack ? 0.022 : 0.014), 0, 0.024);
  if (alpha <= 0.008) return;

  const bodyClipTop = -BODY_SPRITE_ANCHOR_Y + 146 + crouch * 0.18;
  const bodyClipHeight = BODY_SPRITE_FRAME_H - 132;
  const lag = poseShift.t * (poseShift.intoAttack ? 4.4 : 3.1);
  const lift = poseShift.wave * (poseShift.fromAttack ? 1.2 : 0.7);

  if (!compact && !focusedSprite) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-BODY_SPRITE_ANCHOR_X - 24, bodyClipTop, BODY_SPRITE_FRAME_W + 48, bodyClipHeight);
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.translate(-poseShift.dir * lag * 0.42, lift * 0.35);
    ctx.rotate(-poseShift.dir * poseShift.wave * 0.003);
    ctx.drawImage(
      image,
      previousIndex * BODY_SPRITE_FRAME_W,
      0,
      BODY_SPRITE_FRAME_W,
      BODY_SPRITE_FRAME_H,
      -BODY_SPRITE_ANCHOR_X,
      -BODY_SPRITE_ANCHOR_Y + crouch * 0.18,
      BODY_SPRITE_FRAME_W,
      BODY_SPRITE_FRAME_H
    );
    ctx.restore();
  }

  if ((poseShift.intoAttack || poseShift.fromAttack) && poseShift.wave > 0.15) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = compact ? clamp(poseShift.wave * 0.018, 0, 0.026) : clamp(poseShift.wave * 0.016, 0, 0.024);
    ctx.strokeStyle = colorWithAlpha(f.trim, 0.9);
    ctx.lineWidth = 0.75;
    ctx.lineCap = "round";
    const shoulderY = -147 + crouch * 0.18;
    const hipY = -56 + crouch * 0.18;
    const lean = poseShift.dir * poseShift.wave * 7;
    ctx.beginPath();
    ctx.moveTo(-28 - lean, shoulderY);
    ctx.quadraticCurveTo(-10 - lean * 0.4, -103 + crouch * 0.18, -22, hipY);
    ctx.moveTo(28 - lean, shoulderY + 4);
    ctx.quadraticCurveTo(12 - lean * 0.35, -100 + crouch * 0.18, 20, hipY + 3);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSpriteFrameBlend(f, image, frameName, currentFrameIndex, crouch, walking, avoidHead = false, compact = false) {
  if (compact || f.profileId === "p1" || f.profileId === "p2") return;
  const blend = rasterBodyFrameBlend(f, frameName, currentFrameIndex, walking);
  if (!blend || blend.alpha <= 0.01 || !image?.complete || !image.naturalWidth) return;

  const clipTop = -BODY_SPRITE_ANCHOR_Y + (avoidHead ? 96 : 28) + crouch * 0.18;
  const clipHeight = BODY_SPRITE_FRAME_H - (avoidHead ? 82 : 18);

  ctx.save();
  ctx.beginPath();
  ctx.rect(-BODY_SPRITE_ANCHOR_X - 18, clipTop, BODY_SPRITE_FRAME_W + 36, clipHeight);
  ctx.clip();
  ctx.globalAlpha = blend.alpha;
  ctx.translate(blend.offsetX, blend.offsetY);
  ctx.drawImage(
    image,
    blend.frameIndex * BODY_SPRITE_FRAME_W,
    0,
    BODY_SPRITE_FRAME_W,
    BODY_SPRITE_FRAME_H,
    -BODY_SPRITE_ANCHOR_X,
    -BODY_SPRITE_ANCHOR_Y + crouch * 0.18,
    BODY_SPRITE_FRAME_W,
    BODY_SPRITE_FRAME_H
  );
  ctx.restore();
}

function drawUnifiedSpriteAnatomyPolish(f, crouch, frameName, frameIndex, walking, stride) {
  if (f.profileId !== "p1" && f.profileId !== "p2") return;

  const localCrouch = crouch * 0.18;
  const motion = secondaryMotionProfile(f, walking ? stride : 0);
  const acting = headActingProfile(f, walking ? stride : 0);
  const phase = attackPhase(f.attack);
  const type = f.attack?.type ?? "";
  const kick = type === "kick" || type === "airKick";
  const landing = smoothStep01(clamp((f.airKickLandingPulse ?? f.landingPulse ?? 0) / 16, 0, 1));
  const action = f.attack ? Math.max(phase.strike, phase.snap * 0.8, phase.followThrough * 0.55) : 0;
  const hurt = clamp((f.hurt ?? 0) / 24, 0, 1);
  const lean = clamp(acting.rotation * 11, -2.4, 2.4);
  const headX = clamp(acting.x * 0.08, -1.8, 1.8);
  const neckY = -186 + localCrouch + clamp(acting.y * 0.08, -1.2, 1.2);
  const trim = f.trim ?? "#fff1bd";

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(23, 11, 8, ${0.12 + hurt * 0.045 + action * 0.035 + landing * 0.025})`;
  ctx.beginPath();
  ctx.ellipse(headX, neckY + 2, f.profileId === "p2" ? 24 : 29, f.profileId === "p2" ? 7 : 8.5, lean * 0.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(32, 17, 12, ${0.08 + hurt * 0.035 + landing * 0.025})`;
  ctx.beginPath();
  ctx.moveTo(-27 + headX * 0.35, neckY + 4);
  ctx.quadraticCurveTo(0 + lean * 0.45, neckY + 15 + landing * 2, 27 + headX * 0.35, neckY + 4);
  ctx.quadraticCurveTo(16, neckY + 21, -16, neckY + 21, -27 + headX * 0.35, neckY + 4);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(trim, f.profileId === "p2" ? 0.12 : 0.1);
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-31 + headX * 0.25, neckY + 10);
  ctx.quadraticCurveTo(-13 + lean * 0.25, neckY + 17, -2, neckY + 14);
  ctx.moveTo(31 + headX * 0.25, neckY + 10);
  ctx.quadraticCurveTo(13 + lean * 0.25, neckY + 17, 2, neckY + 14);
  ctx.stroke();
  ctx.restore();

  drawUnifiedImpactRecoveryPolish(f, localCrouch, motion, acting);
  drawUnifiedKickSupportPolish(f, localCrouch, frameName, frameIndex, kick, landing, phase);
  drawUnifiedHeadAccessoryPolish(f, localCrouch, motion, acting);
}

function drawUnifiedImpactRecoveryPolish(f, localCrouch, motion, acting) {
  const impact = localizedImpactProfile(f);
  const reaction = impactReactionProfile(f);
  const phase = attackPhase(f.attack);
  const attackType = f.attack?.type ?? "";
  const strike = f.attack ? Math.max(phase.strike, phase.snap * 0.9, phase.followThrough * 0.48) : 0;
  const prep = f.attack ? phase.anticipation : 0;
  const kick = attackType === "kick" || attackType === "airKick" || attackType === "sweep";
  const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const damage = Math.max(
    impact.t * 0.94,
    reaction.kind === "guard" ? 0 : reaction.t * 0.72,
    clamp((f.hurt ?? 0) / 30, 0, 1) * 0.42,
  );
  const active = Math.max(damage, guardHit * 0.6, strike * 0.42);
  if (active <= 0.035) return;

  const trim = f.trim ?? "#fff1bd";
  const profileMass = f.profileId === "p1" ? 1.12 : 0.84;
  const profileSnap = f.profileId === "p2" ? 1.18 : 0.88;
  const zone = impact.zone === "head" || impact.zone === "legs" ? impact.zone : "torso";
  const dir = impact.localDir || reaction.localDir || 1;
  const recoil = clamp(Math.max(impact.snap, reaction.snap * 0.74) * profileSnap, 0, 1.7);
  const rebound = clamp(Math.max(impact.rebound, reaction.rebound * 0.72), 0, 1.7);
  const zoneY = zone === "head" ? -158 : zone === "legs" ? -47 : -104;
  const zoneX = -dir * (zone === "head" ? 17 : zone === "legs" ? 9 : 13);
  const zoneRx = zone === "legs" ? 40 : zone === "head" ? 29 : 35;
  const zoneRy = zone === "legs" ? 15 : zone === "head" ? 18 : 22;

  if (damage > 0.045) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(24, 12, 9, ${0.045 + damage * 0.082 * profileMass})`;
    ctx.beginPath();
    ctx.ellipse(
      zoneX - dir * recoil * 5,
      zoneY + localCrouch + impact.shake * 0.9,
      zoneRx + recoil * 7,
      zoneRy + rebound * 2.6,
      -dir * (0.12 + recoil * 0.04),
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (zone !== "legs") {
      ctx.fillStyle = `rgba(20, 10, 8, ${0.036 + damage * 0.054})`;
      ctx.beginPath();
      ctx.ellipse(-33 - dir * recoil * 2, -145 + localCrouch + rebound * 2, 19 + damage * 7, 7.2, -0.22, 0, Math.PI * 2);
      ctx.ellipse(35 - dir * recoil * 4, -143 + localCrouch + rebound * 2, 20 + damage * 8, 7.8, 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(22, 11, 8, ${0.05 + damage * 0.06})`;
      ctx.beginPath();
      ctx.ellipse(-38 + dir * recoil * 4, -4 + localCrouch, 31 + damage * 8, 5.4 + damage * 1.7, -0.08, 0, Math.PI * 2);
      ctx.ellipse(42 + dir * recoil * 3, -3 + localCrouch, 30 + damage * 8, 5.2 + damage * 1.7, 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.strokeStyle = colorWithAlpha(trim, 0.08 + damage * 0.11);
    ctx.lineWidth = 1.15 + recoil * 0.65;
    ctx.beginPath();
    ctx.moveTo(zoneX - dir * (zoneRx * 0.54 + recoil * 8), zoneY + localCrouch - zoneRy * 0.48);
    ctx.quadraticCurveTo(
      zoneX - dir * 4,
      zoneY + localCrouch - zoneRy * 0.92 - rebound * 3,
      zoneX + dir * (zoneRx * 0.48 + recoil * 5),
      zoneY + localCrouch - zoneRy * 0.18
    );
    ctx.moveTo(zoneX - dir * (zoneRx * 0.42 + recoil * 5), zoneY + localCrouch + zoneRy * 0.44);
    ctx.quadraticCurveTo(
      zoneX - dir * 2,
      zoneY + localCrouch + zoneRy * 0.72 + rebound * 2,
      zoneX + dir * (zoneRx * 0.38 + recoil * 4),
      zoneY + localCrouch + zoneRy * 0.28
    );
    ctx.stroke();

    if (f.profileId === "p2" && zone !== "legs") {
      ctx.globalAlpha = clamp(0.035 + damage * 0.12, 0.035, 0.2);
      ctx.strokeStyle = "rgba(255, 239, 220, 0.9)";
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(-25 - dir * recoil * 2, -169 + localCrouch);
      ctx.quadraticCurveTo(-2 - dir * recoil * 4, -152 + localCrouch + rebound * 2, 27 - dir * recoil * 3, -135 + localCrouch);
      ctx.stroke();
    } else if (f.profileId === "p1") {
      ctx.globalAlpha = clamp(0.034 + damage * 0.09, 0.03, 0.17);
      ctx.strokeStyle = colorWithAlpha(trim, 0.82);
      ctx.lineWidth = 2.4 + damage * 1.2;
      ctx.beginPath();
      ctx.moveTo(-43 + dir * recoil * 2, -63 + localCrouch);
      ctx.quadraticCurveTo(-9 + dir * recoil * 3, -55 + localCrouch + rebound * 2, 36 + dir * recoil * 2, -62 + localCrouch);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (strike > 0.055 && f.hurt <= 0) {
    const drive = clamp(strike + prep * 0.4, 0, 1.35);
    const shoulderY = kick ? -118 : -141;
    const hipY = kick ? -69 : -78;
    const reach = kick ? 70 : 58;

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(24, 12, 9, ${0.035 + drive * 0.052 * profileMass})`;
    ctx.beginPath();
    ctx.ellipse(-22 - drive * 2, hipY + localCrouch, 27 + drive * 10, 9 + drive * 2.8, -0.08, 0, Math.PI * 2);
    ctx.ellipse(27 + drive * 4, shoulderY + localCrouch, 24 + drive * 8, 8 + drive * 2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    ctx.strokeStyle = colorWithAlpha(trim, 0.07 + drive * (f.profileId === "p2" ? 0.1 : 0.075));
    ctx.lineWidth = 1.2 + drive * 0.8;
    ctx.beginPath();
    ctx.moveTo(-18 - motion.x * 0.06, -151 + localCrouch + acting.y * 0.04);
    ctx.quadraticCurveTo(18 + drive * 15, -136 + localCrouch - drive * 5, reach + drive * (kick ? 23 : 16), -118 + localCrouch - drive * (kick ? 6 : 3));
    ctx.stroke();

    if (f.profileId === "p2") {
      ctx.globalAlpha = clamp(0.04 + drive * 0.1, 0.04, 0.18);
      ctx.lineWidth = 0.9 + drive * 0.55;
      ctx.beginPath();
      ctx.moveTo(6, -86 + localCrouch);
      ctx.quadraticCurveTo(31 + drive * 9, -80 + localCrouch - drive * 5, 67 + drive * 16, -70 + localCrouch - drive * 9);
      ctx.stroke();
    } else {
      ctx.globalAlpha = clamp(0.035 + drive * 0.08, 0.035, 0.15);
      ctx.lineWidth = 2 + drive * 1.1;
      ctx.beginPath();
      ctx.moveTo(-48, -4 + localCrouch);
      ctx.quadraticCurveTo(-20 + drive * 8, -12 + localCrouch, 18 + drive * 18, -7 + localCrouch);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawUnifiedKickSupportPolish(f, localCrouch, frameName, frameIndex, kick, landing, phase) {
  const airKick = f.attack?.type === "airKick";
  const groundedKick = kick && f.grounded;
  const landingPress = f.grounded ? landing : 0;
  const strike = f.attack ? Math.max(phase.strike, phase.snap * 0.84) : 0;
  const retract = f.attack ? Math.max(phase.followThrough, phase.recovery * 0.88) : 0;
  const active = Math.max(groundedKick ? strike : 0, landingPress * 0.92);
  const profileWeight = f.profileId === "p1" ? 1.12 : f.profileId === "p2" ? 0.84 : 1;
  const supportX = f.profileId === "p2" ? -33 : -39;
  const freeX = f.profileId === "p2" ? 45 : 48;
  const footY = -2 + localCrouch;

  if (active > 0.035) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(36, 21, 12, ${0.08 + active * 0.08 * profileWeight})`;
    ctx.beginPath();
    ctx.ellipse(supportX - active * 5, footY + 4, 25 + active * 14, 5.2 + active * 2.4, -0.05, 0, Math.PI * 2);
    ctx.fill();

    if (landingPress > 0.04) {
      ctx.fillStyle = `rgba(42, 25, 13, ${0.05 + landingPress * 0.055})`;
      ctx.beginPath();
      ctx.ellipse(freeX + landingPress * 4, footY + 4, 20 + landingPress * 11, 4.8 + landingPress * 1.8, 0.04, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255, 232, 156, ${0.08 + active * 0.07})`;
    ctx.lineWidth = 1.15 + active * 0.7;
    ctx.beginPath();
    ctx.ellipse(supportX - active * 4, footY + 2, 18 + active * 10, 3.6 + active * 1.3, -0.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (airKick && !f.grounded && Math.max(strike, retract) > 0.08) {
    const fold = clamp(retract + clamp(f.vy / 13, 0, 1) * 0.28, 0, 1.15);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.strokeStyle = `rgba(26, 13, 10, ${0.055 + fold * 0.05})`;
    ctx.lineWidth = 2.4 + fold * 1.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-30, -76 + localCrouch + fold * 5);
    ctx.quadraticCurveTo(-43 - fold * 6, -51 + localCrouch + fold * 15, -36 - fold * 8, -23 + localCrouch + fold * 18);
    ctx.stroke();
    ctx.restore();
  }
}

function drawUnifiedHeadAccessoryPolish(f, localCrouch, motion, acting) {
  const drama = clamp(Math.max(motion.drama ?? 0, acting.shock ?? 0, acting.strain ?? 0), 0, 1.8);
  const active = Math.max(motion.flutter, Math.abs(motion.x) / 9, drama * 0.72, f.attack ? 0.35 : 0);
  if (active <= 0.12 && f.hurt <= 0) return;

  const compactMotion = {
    ...motion,
    drama,
    flutter: motion.flutter * 0.72,
    x: motion.x * 0.78,
    y: motion.y * 0.62,
    whip: motion.whip * 0.72,
    wave: motion.wave * 0.82,
    afterWave: motion.afterWave * 0.82,
  };

  if (f.profileId === "p1") {
    drawUnifiedPchanBandanaFlutterPolish(localCrouch, compactMotion, acting);
  } else if (f.profileId === "p2") {
    drawAkaneSpriteHairSecondary(compactMotion, localCrouch, { alphaScale: 0.62, strandScale: 0.76 });
  }
}

function drawUnifiedPchanBandanaFlutterPolish(localCrouch, motion, acting) {
  const flutter = clamp(motion.flutter * 0.55 + Math.abs(motion.whip) * 0.16 + (acting.bandanaFlutter ?? 0) * 0.2, 0, 1.2);
  const drama = clamp(motion.drama ?? 0, 0, 1.6);
  if (flutter <= 0.08 && drama <= 0.08) return;

  const baseX = 29 + clamp(acting.x * 0.06 + motion.x * 0.08, -1.6, 1.6);
  const baseY = -228 + localCrouch + clamp(acting.y * 0.04 + motion.y * 0.08, -1.2, 1.2);
  const sway = clamp(motion.whip * 1.2 + motion.wave * 2.2 - (acting.snapDir ?? 0) * drama * 2.2, -5.2, 5.2);
  const lift = clamp(-motion.attackDrive * 0.9 + motion.y * 0.12 - drama * 0.7, -4.2, 3.2);
  const alpha = clamp(0.045 + flutter * 0.055 + drama * 0.018, 0.035, 0.13);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 241, 189, ${alpha})`;
  ctx.lineWidth = 1.2 + flutter * 0.45;
  ctx.beginPath();
  ctx.moveTo(baseX - 5, baseY + 2);
  ctx.quadraticCurveTo(baseX + 6 + sway * 0.5, baseY - 3 + lift, baseX + 15 + sway, baseY + 1 + lift * 0.7);
  ctx.moveTo(baseX - 2, baseY + 7);
  ctx.quadraticCurveTo(baseX + 5 + sway * 0.34, baseY + 12 + lift * 0.45, baseX + 10 + sway * 0.52, baseY + 17 + lift * 0.38);
  ctx.stroke();

  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = `rgba(83, 54, 14, ${alpha * 0.62})`;
  ctx.lineWidth = 0.9 + flutter * 0.24;
  ctx.beginPath();
  ctx.moveTo(baseX + 2, baseY + 4);
  ctx.quadraticCurveTo(baseX + 9 + sway * 0.35, baseY + lift * 0.55, baseX + 14 + sway * 0.74, baseY + 4 + lift * 0.45);
  ctx.stroke();
  ctx.restore();
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
    pose.x = frameIndex === 4 ? -2 : frameIndex === 17 ? -1 : frameIndex === 5 ? 2 : frameIndex === 18 ? 3 : frameIndex === 23 ? 1 : 0;
    pose.y = frameIndex === 5 || frameIndex === 18 ? -45 : frameIndex === 4 ? -42 : frameIndex === 23 ? -44 : -43;
  } else if (frameName === "kick") {
    pose.x = frameIndex === 19 ? 1 : frameIndex === 7 ? -1 : frameIndex === 8 ? -3 : frameIndex === 20 ? -4 : frameIndex === 24 ? -2 : 0;
    pose.y = frameIndex === 8 || frameIndex === 20 ? -44 : frameIndex === 19 ? -43 : frameIndex === 24 ? -43 : -42;
  } else if (frameName === "block") {
    pose.y = -40;
    pose.scale = 0.72;
  } else if (frameName === "hurt") {
    pose.x = frameIndex === 25 ? 10 : frameIndex === 26 ? 7 : frameIndex === 27 ? 4 : frameIndex === 28 ? 2 : frameIndex === 12 ? 8 : 5;
    pose.y = frameIndex === 25 ? -32 : frameIndex === 26 ? -35 : frameIndex === 27 ? -37 : frameIndex === 28 ? -40 : frameIndex === 12 ? -33 : -36;
    pose.scale = frameIndex === 28 ? 0.72 : 0.7;
  } else if (frameName === "special" || frameName === "victory") {
    if (frameName === "special") {
      pose.x = frameIndex === 4 ? -2 : frameIndex === 5 ? 3 : frameIndex === 18 ? 2 : 0;
      pose.scale = frameIndex === 5 ? 0.73 : 0.74;
      pose.y = -44;
    } else {
      pose.x = f.profileId === "p2" ? -1 : 0;
      pose.y = f.profileId === "p2" ? -45 : -46;
      pose.scale = f.profileId === "p2" ? 0.735 : 0.745;
    }
  } else if (frameName === "sweep") {
    pose.x = 4;
    pose.y = -31;
    pose.scale = 0.7;
  } else if (frameName === "defeat") {
    pose.x = f.profileId === "p2" ? 5 : 4;
    pose.y = f.profileId === "p2" ? -20 : -22;
    pose.scale = f.profileId === "p2" ? 0.665 : 0.675;
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

    // Unified sprites already contain their own limb shading and clothing lines.
    // Extra body overlays read as detached duplicate arms/shoulders while moving.
    drawSpriteGuardPoseOverlay(f, crouch, frameName);
    drawUnifiedSpriteAnatomyPolish(f, crouch, frameName, frameIndex, walking, stride);
    drawFighterStageLighting(f, crouch);
    if (winner) drawSpriteCinematicFinish(f, crouch, frameName);
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

  drawSpriteFrameBlend(f, sheet, frameName, frameIndex, crouch, walking, false);
  drawSpritePoseTransitionBlend(f, sheet, frameIndex, crouch);
  drawSpriteAttackFrameWarp(f, sheet, frameX, crouch);
  drawSpriteAttackSilhouetteExtension(f, crouch, frameName);
  drawSpriteImpactWarp(f, sheet, frameX, crouch);
  drawSpriteReactionPoseWarp(f, sheet, frameX, crouch);
  drawSpritePremiumDetails(f, crouch, frameName, walking ? stride : 0);
  drawSpriteContactOcclusion(f, crouch, frameName, walking ? stride : 0);
  drawSpriteLayeredContactShadows(f, crouch, frameName, walking ? stride : 0);
  drawSpriteGuardPoseOverlay(f, crouch, frameName);
  drawSpriteExtremityDetails(f, crouch, frameName, walking ? stride : 0);
  drawSpriteSecondaryMotion(f, crouch, frameName, walking ? stride : 0);

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

function drawSpriteHeadActingWarp(f, crouch, stride) {
  const acting = headActingProfile(f, stride);
  const active = Math.max(
    acting.focus * 0.62,
    Math.abs(acting.rotation) * 7,
    acting.bandanaFlutter * 0.36,
    (acting.shock ?? 0) * 0.8,
    (acting.strain ?? 0) * 0.52,
  );
  if (active <= 0.05 && f.hurt <= 0 && !f.attack && !f.blocking) return;

  const localY = -BODY_SPRITE_ANCHOR_Y + 34 + crouch * 0.18;
  const localX = -BODY_SPRITE_ANCHOR_X + 38;
  const w = 134;
  const h = 108;
  const cx = localX + w * 0.5;
  const shock = clamp(acting.shock ?? 0, 0, 1.45);
  const strain = clamp(acting.strain ?? 0, 0, 1.42);

  ctx.save();
  ctx.translate(acting.x * 0.18, acting.y * 0.16);
  ctx.translate(cx, localY + h * 0.44);
  ctx.rotate(acting.rotation * 0.24);
  ctx.translate(-cx, -(localY + h * 0.44));

  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = clamp(0.035 + acting.squint * 0.07 + active * 0.012, 0.03, 0.12);
  ctx.fillStyle = "rgba(24, 12, 11, 0.9)";
  ctx.beginPath();
  ctx.ellipse(localX + w * 0.35, localY + h * 0.39, w * (0.17 + acting.squint * 0.025), 6 + acting.squint * 2.8, -0.1, 0, Math.PI * 2);
  ctx.ellipse(localX + w * 0.66, localY + h * 0.39, w * (0.17 + acting.squint * 0.025), 6 + acting.squint * 2.8, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(24, 12, 11, 0.76)";
  ctx.lineWidth = 1.2 + acting.focus * 0.55 + strain * 0.35;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(localX + w * 0.24, localY + h * (0.25 - shock * 0.018));
  ctx.quadraticCurveTo(localX + w * 0.36, localY + h * (0.18 - acting.focus * 0.018 - strain * 0.014), localX + w * 0.49, localY + h * (0.27 + shock * 0.012));
  ctx.moveTo(localX + w * 0.55, localY + h * (0.27 + shock * 0.012));
  ctx.quadraticCurveTo(localX + w * 0.69, localY + h * (0.18 - acting.focus * 0.018 - strain * 0.014), localX + w * 0.82, localY + h * (0.26 - shock * 0.018));
  ctx.stroke();

  if (shock > 0.08) {
    ctx.globalAlpha = clamp(0.045 + shock * 0.06, 0.045, 0.13);
    ctx.fillStyle = "rgba(255, 232, 205, 0.95)";
    ctx.beginPath();
    ctx.ellipse(localX + w * 0.32, localY + h * 0.43, w * 0.045, h * 0.026, -0.1, 0, Math.PI * 2);
    ctx.ellipse(localX + w * 0.68, localY + h * 0.43, w * 0.045, h * 0.026, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = clamp(0.025 + acting.focus * 0.045 + acting.cheek * 0.035 + shock * 0.025, 0.025, 0.14);
  ctx.strokeStyle = colorWithAlpha(f.trim, 0.9);
  ctx.lineWidth = 1.3 + acting.focus * 0.45;
  ctx.beginPath();
  ctx.moveTo(localX + w * 0.25, localY + h * 0.23);
  ctx.quadraticCurveTo(cx, localY + h * 0.14 - acting.focus * 2.5, localX + w * 0.76, localY + h * 0.24);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 238, 202, 0.9)";
  ctx.beginPath();
  ctx.ellipse(localX + w * 0.31, localY + h * 0.6, w * 0.14, h * 0.065, -0.18, 0, Math.PI * 2);
  ctx.ellipse(localX + w * 0.69, localY + h * 0.6, w * 0.14, h * 0.065, 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpriteContactOcclusion(f, crouch, frameName, stride) {
  const acting = headActingProfile(f, stride);
  const phase = attackPhase(f.attack);
  const action = f.attack ? Math.max(phase.strike, phase.snap, phase.followThrough * 0.6) : 0;
  const localCrouch = crouch * 0.18;
  const breath = Math.sin(roundFrame * 0.055 + f.x * 0.012);
  const hurt = clamp((f.hurt ?? 0) / 22, 0, 1);
  const guard = f.blocking ? 1 : 0;
  const trim = f.trim ?? "#fff1bd";
  const neckY = -185 + localCrouch + acting.y * 0.12;
  const chestY = -144 + localCrouch + breath * 0.6;
  const shoulderY = -166 + localCrouch;
  const shoulderLift = frameName === "block" ? -4 : frameName === "hurt" ? 3 : 0;
  const profileWeight = f.profileId === "p2" ? 0.9 : 1.05;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";

  const chinShade = ctx.createRadialGradient(acting.x * 0.08, neckY - 7, 4, acting.x * 0.08, neckY - 2, 42);
  chinShade.addColorStop(0, `rgba(20, 10, 8, ${0.25 + hurt * 0.08 + action * 0.06})`);
  chinShade.addColorStop(0.58, "rgba(30, 14, 10, 0.12)");
  chinShade.addColorStop(1, "rgba(30, 14, 10, 0)");
  ctx.fillStyle = chinShade;
  ctx.beginPath();
  ctx.ellipse(acting.x * 0.08, neckY, 31 * profileWeight, 10 + action * 1.6, acting.rotation * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(22, 11, 8, ${0.12 + action * 0.04 + guard * 0.04})`;
  ctx.beginPath();
  ctx.moveTo(-27, neckY + 2);
  ctx.quadraticCurveTo(0, neckY + 13 + breath * 0.4, 27, neckY + 2);
  ctx.bezierCurveTo(17, neckY + 22, -17, neckY + 22, -27, neckY + 2);
  ctx.fill();

  ctx.globalAlpha = 0.72;
  ctx.fillStyle = "rgba(19, 10, 8, 0.14)";
  ctx.beginPath();
  ctx.ellipse(-39, shoulderY + shoulderLift, 26, 9, -0.24, 0, Math.PI * 2);
  ctx.ellipse(39, shoulderY + shoulderLift, 26, 9, 0.24, 0, Math.PI * 2);
  ctx.fill();

  const armShadow = clamp(0.08 + action * 0.12 + guard * 0.1 + hurt * 0.04, 0.06, 0.28);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `rgba(22, 11, 8, ${armShadow})`;
  ctx.lineCap = "round";
  ctx.lineWidth = 7 + guard * 2 + action * 2;

  if (frameName === "block") {
    ctx.beginPath();
    ctx.moveTo(-37, -130 + localCrouch);
    ctx.quadraticCurveTo(-20, -116 + localCrouch, -7, chestY + 18);
    ctx.moveTo(37, -130 + localCrouch);
    ctx.quadraticCurveTo(20, -116 + localCrouch, 7, chestY + 18);
    ctx.stroke();
  } else if (frameName === "punch" || frameName === "special") {
    ctx.beginPath();
    ctx.moveTo(-42, -126 + localCrouch);
    ctx.quadraticCurveTo(-17 - action * 5, -116 + localCrouch, -5, chestY + 15);
    ctx.moveTo(42, -126 + localCrouch);
    ctx.quadraticCurveTo(18 + action * 5, -116 + localCrouch, 8, chestY + 13);
    ctx.stroke();
  } else {
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(-34, -124 + localCrouch);
    ctx.quadraticCurveTo(-21, -111 + localCrouch, -15, chestY + 10);
    ctx.moveTo(34, -124 + localCrouch);
    ctx.quadraticCurveTo(21, -111 + localCrouch, 15, chestY + 10);
    ctx.stroke();
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(trim, 0.08 + action * 0.045);
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-35, shoulderY - 7 + shoulderLift);
  ctx.quadraticCurveTo(-20, shoulderY - 14 + shoulderLift, -5, shoulderY - 8 + shoulderLift);
  ctx.moveTo(35, shoulderY - 7 + shoulderLift);
  ctx.quadraticCurveTo(20, shoulderY - 14 + shoulderLift, 5, shoulderY - 8 + shoulderLift);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 242, 206, 0.075)";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-18, neckY + 16);
  ctx.quadraticCurveTo(0, neckY + 24 + breath * 0.5, 18, neckY + 16);
  ctx.stroke();
  ctx.restore();
}

function fillSoftContactShadow(x, y, rx, ry, rotation, alpha, squeeze = 1) {
  if (alpha <= 0.004) return;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(1, squeeze);
  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, `rgba(18, 9, 7, ${alpha})`);
  grad.addColorStop(0.52, `rgba(26, 13, 9, ${alpha * 0.42})`);
  grad.addColorStop(1, "rgba(26, 13, 9, 0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function strokeContactShadow(points, width, alpha, blur = 0) {
  if (alpha <= 0.004) return;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = `rgba(10, 5, 4, ${alpha * 0.78})`;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = `rgba(18, 9, 7, ${alpha * 0.82})`;
  ctx.lineWidth = width + 3.4;
  traceSecondaryRibbon(points);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(42, 20, 13, ${alpha * 0.46})`;
  ctx.lineWidth = width;
  traceSecondaryRibbon(points);
  ctx.stroke();
  ctx.restore();
}

function strokeContactSeparation(points, color, width, alpha) {
  if (alpha <= 0.004) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colorWithAlpha(color, alpha);
  ctx.lineWidth = width;
  traceSecondaryRibbon(points);
  ctx.stroke();
  ctx.restore();
}

function drawSpriteLayeredContactShadows(f, crouch, frameName, stride) {
  const localCrouch = crouch * 0.18;
  const phase = attackPhase(f.attack);
  const impact = localizedImpactProfile(f);
  const reaction = impactReactionProfile(f);
  const motion = secondaryMotionProfile(f, stride);
  const outfit = outfitSpec(f) ?? {};
  const spec = bodySpec(f);
  const action = f.attack ? Math.max(phase.strike, phase.snap, phase.followThrough * 0.5) : 0;
  const prep = f.attack ? phase.anticipation : 0;
  const guard = f.blocking || frameName === "block" ? clamp(Math.max((f.guardPulse ?? 0) / 18, 0.58), 0, 1) : 0;
  const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const hurt = clamp((f.hurt ?? 0) / 24, 0, 1);
  const hit = impact.t > 0.035 && f.hitZone !== "guard" ? Math.max(impact.snap, reaction.snap * 0.5) : 0;
  const breath = Math.sin(roundFrame * 0.055 + f.x * 0.012);
  const bodyWidth = (spec.shoulder ?? 40) * 1.05;
  const hip = (spec.hip ?? 36) * (spec.belly ? 1.08 : 1);
  const trim = outfit.accent ?? f.trim ?? "#fff1bd";
  const sleeve = outfit.sleeve ?? f.trim ?? "#fff1bd";
  const depth = clamp(0.78 + action * 0.42 + guard * 0.34 + guardHit * 0.4 + hurt * 0.22 + hit * 0.45, 0.55, 1.75);
  const bodyShift = motion.x * 0.08 + impact.shake * 0.4;
  const chestY = -135 + localCrouch + breath * 0.5;
  const waistY = -78 + localCrouch;

  fillSoftContactShadow(0 + bodyShift, -174 + localCrouch + motion.y * 0.08, bodyWidth * 0.68, 13, 0, 0.09 + hurt * 0.05 + action * 0.03);
  fillSoftContactShadow(-bodyWidth * 0.72, -151 + localCrouch, 18, 13, -0.42, 0.06 + depth * 0.04);
  fillSoftContactShadow(bodyWidth * 0.72, -151 + localCrouch, 18, 13, 0.42, 0.06 + depth * 0.04);

  strokeContactShadow(
    [
      { x: -bodyWidth * 0.62, y: chestY - 6 },
      { x: -bodyWidth * 0.45 + motion.x * 0.04, y: chestY + 24 },
      { x: -bodyWidth * 0.35 + motion.x * 0.14, y: waistY + 16 },
    ],
    5.4,
    0.055 + depth * 0.035,
    3
  );
  strokeContactShadow(
    [
      { x: bodyWidth * 0.62, y: chestY - 6 },
      { x: bodyWidth * 0.45 + motion.x * 0.04, y: chestY + 24 },
      { x: bodyWidth * 0.35 + motion.x * 0.14, y: waistY + 16 },
    ],
    5.4,
    0.055 + depth * 0.035,
    3
  );

  fillSoftContactShadow(0 + motion.x * 0.08, -61 + localCrouch, hip + 8, 12, 0, 0.05 + depth * 0.035, 0.62);
  strokeContactShadow(
    [
      { x: -hip + 7, y: -55 + localCrouch },
      { x: 0 + motion.x * 0.12, y: -49 + localCrouch + motion.y * 0.08 },
      { x: hip - 7, y: -55 + localCrouch },
    ],
    4.2,
    0.045 + depth * 0.03,
    2
  );

  if (guard > 0.04) {
    const recoil = guardHit * guardHit;
    strokeContactShadow(
      [
        { x: -39, y: -134 + localCrouch + guard * 3 },
        { x: -18 + recoil * 4, y: -119 + localCrouch + guard * 8 },
        { x: 7 + recoil * 7, y: -103 + localCrouch + guard * 7 },
      ],
      11 + guard * 3.2,
      0.095 + guard * 0.08 + guardHit * 0.08,
      4
    );
    strokeContactShadow(
      [
        { x: 39, y: -132 + localCrouch + guard * 3 },
        { x: 18 + recoil * 5, y: -117 + localCrouch + guard * 8 },
        { x: -5 + recoil * 8, y: -101 + localCrouch + guard * 7 },
      ],
      10 + guard * 3.2,
      0.085 + guard * 0.075 + guardHit * 0.08,
      4
    );
    strokeContactSeparation(
      [
        { x: -32, y: -145 + localCrouch },
        { x: 0, y: -138 + localCrouch - guardHit * 4 },
        { x: 36, y: -143 + localCrouch },
      ],
      sleeve,
      1.5 + guardHit,
      0.12 + guard * 0.05
    );
  } else if (frameName === "punch" || frameName === "special") {
    const strike = Math.max(action, prep * 0.5);
    fillSoftContactShadow(31 - prep * 5, -139 + localCrouch + prep * 1.5, 21 + strike * 9, 18 + strike * 5, -0.28, 0.08 + strike * 0.06);
    strokeContactShadow(
      [
        { x: -37 - strike * 4, y: -128 + localCrouch },
        { x: -20 - strike * 5, y: -115 + localCrouch + motion.wave * 0.8 },
        { x: -6 - strike * 2, y: -93 + localCrouch },
      ],
      7 + strike * 2,
      0.065 + strike * 0.07,
      3
    );
    strokeContactShadow(
      [
        { x: 25 + strike * 2, y: -126 + localCrouch },
        { x: 45 + strike * 8, y: -120 + localCrouch - strike * 4 },
        { x: 64 + strike * 17, y: -118 + localCrouch - strike * 6 },
      ],
      6 + strike * 2.8,
      0.052 + strike * 0.055,
      3
    );
    strokeContactSeparation(
      [
        { x: 20, y: -151 + localCrouch },
        { x: 44 + strike * 12, y: -146 + localCrouch - strike * 5 },
        { x: 73 + strike * 20, y: -139 + localCrouch - strike * 7 },
      ],
      trim,
      1.4 + strike * 0.7,
      0.08 + strike * 0.08
    );
  } else if (frameName === "kick" || frameName === "sweep") {
    const kick = f.attack ? Math.max(phase.strike, phase.snap * 0.9, phase.followThrough * 0.45) : 0.35;
    const sweep = frameName === "sweep";
    fillSoftContactShadow(15 + kick * 8, -81 + localCrouch + (sweep ? 11 : 0), 25 + kick * 15, 18 + kick * 7, 0.24, 0.075 + kick * 0.07);
    strokeContactShadow(
      [
        { x: -hip + 5, y: -50 + localCrouch },
        { x: 8 + kick * 7, y: -45 + localCrouch + (sweep ? 4 : -2) },
        { x: 45 + kick * 26, y: -47 + localCrouch + (sweep ? 7 : -10) },
      ],
      sweep ? 7.2 : 8.8,
      0.065 + kick * 0.07,
      3
    );
    strokeContactSeparation(
      [
        { x: 6, y: -86 + localCrouch },
        { x: 32 + kick * 9, y: -80 + localCrouch - kick * 5 },
        { x: 66 + kick * 21, y: -70 + localCrouch - kick * 8 },
      ],
      trim,
      1.5 + kick * 0.7,
      0.08 + kick * 0.07
    );
  } else if (frameName === "walk") {
    const walkSwing = Math.abs(stride);
    fillSoftContactShadow(-24 - stride * 4, -55 + localCrouch, 15 + walkSwing * 6, 9, -0.18, 0.05 + walkSwing * 0.04);
    fillSoftContactShadow(24 + stride * 4, -55 + localCrouch, 15 + walkSwing * 6, 9, 0.18, 0.05 + walkSwing * 0.04);
    strokeContactSeparation(
      [
        { x: -29, y: -88 + localCrouch },
        { x: -17 + stride * 3, y: -67 + localCrouch },
        { x: -22 + stride * 4, y: -41 + localCrouch },
      ],
      trim,
      1.1,
      0.055 + walkSwing * 0.055
    );
  }

  if (hit > 0.05) {
    const zone = impact.zone === "head" || impact.zone === "legs" ? impact.zone : "torso";
    const centerY = zone === "head" ? -160 + localCrouch : zone === "legs" ? -48 + localCrouch : -105 + localCrouch;
    fillSoftContactShadow(-impact.localDir * (zone === "head" ? 18 : 12), centerY + impact.shake * 1.2, zone === "legs" ? 42 : 34, zone === "head" ? 18 : 24, -impact.localDir * 0.16, 0.05 + hit * 0.06);
  }
}

function drawVectorContactOcclusion(f, crouch, stride) {
  const spec = bodySpec(f);
  const action = f.attack ? attackProgress(f.attack) : 0;
  const guard = f.blocking ? 1 : 0;
  const hurt = clamp((f.hurt ?? 0) / 22, 0, 1);
  const breath = Math.sin(roundFrame * 0.055 + f.x * 0.012);
  const shoulder = spec.shoulder;
  const neckY = -134 + crouch + spec.headY * 0.18;
  const collarY = -125 + crouch;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(24, 12, 9, ${0.16 + action * 0.04 + guard * 0.04 + hurt * 0.04})`;
  ctx.beginPath();
  ctx.ellipse(stride * 0.5, neckY, 28, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(18, 9, 7, 0.12)";
  ctx.beginPath();
  ctx.ellipse(-shoulder + 9, collarY + 9, 18, 8, -0.35, 0, Math.PI * 2);
  ctx.ellipse(shoulder - 9, collarY + 9, 18, 8, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(18, 9, 7, ${0.08 + action * 0.08 + guard * 0.1})`;
  ctx.lineWidth = 5.8 + guard * 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-shoulder + 6, -112 + crouch);
  ctx.quadraticCurveTo(-18, -105 + crouch, -9, -82 + crouch + breath);
  ctx.moveTo(shoulder - 6, -112 + crouch);
  ctx.quadraticCurveTo(18, -105 + crouch, 9, -82 + crouch + breath);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(f.trim, 0.12 + action * 0.06);
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-shoulder + 9, collarY);
  ctx.quadraticCurveTo(-20, collarY - 7, -4, collarY - 2);
  ctx.moveTo(shoulder - 9, collarY);
  ctx.quadraticCurveTo(20, collarY - 7, 4, collarY - 2);
  ctx.stroke();
  ctx.restore();
}

function drawMaguilaRacingSilhouette(f, pose, crouch, walking, stride) {
  const outfit = outfitSpec(f);
  const mobileLite = isMobileFightView();
  const gait = walking ? Math.abs(stride || 0) : 0;
  const breath = Math.sin(roundFrame * 0.05 + f.x * 0.015);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = colorWithAlpha("#ffffff", mobileLite ? 0.12 : 0.18);
  ctx.lineWidth = mobileLite ? 2.2 : 2.9;
  ctx.beginPath();
  ctx.moveTo(-50, -116 + crouch + breath * 0.5);
  ctx.quadraticCurveTo(-12, -104 + crouch - gait * 1.5, 48, -115 + crouch + breath * 0.35);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(outfit.trimLine ?? "#162b52", mobileLite ? 0.12 : 0.17);
  ctx.lineWidth = mobileLite ? 1.7 : 2.2;
  ctx.beginPath();
  ctx.moveTo(-49, -109 + crouch);
  ctx.quadraticCurveTo(-4, -96 + crouch + gait, 46, -108 + crouch);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(outfit.accent ?? "#ffffff", mobileLite ? 0.11 : 0.16);
  ctx.lineWidth = mobileLite ? 1.8 : 2.4;
  for (const leg of [pose.backLeg, pose.frontLeg]) {
    ctx.beginPath();
    ctx.moveTo(leg.knee.x * 0.92, leg.knee.y + 5);
    ctx.quadraticCurveTo((leg.knee.x + leg.foot.x) * 0.5, leg.knee.y + 22, leg.foot.x, leg.foot.y - 3);
    ctx.stroke();
  }

  ctx.strokeStyle = colorWithAlpha("#ffffff", mobileLite ? 0.16 : 0.22);
  ctx.lineWidth = mobileLite ? 2 : 2.6;
  for (const arm of [pose.backArm, pose.frontArm]) {
    ctx.beginPath();
    ctx.ellipse(arm.hand.x, arm.hand.y + 1, mobileLite ? 6 : 7.5, mobileLite ? 2.4 : 3.2, 0.14, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPinoAgileSuitDetails(f, pose, crouch, walking, stride) {
  const mobileLite = isMobileFightView();
  const outfit = outfitSpec(f);
  const gait = walking ? Math.abs(stride || 0) : 0;
  const sway = Math.sin(roundFrame * 0.075 + f.x * 0.012) * (walking ? 0.9 : 0.32);
  const trim = f.trim ?? "#96e06c";
  const accent = outfit?.accent ?? "#d7c9ff";

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.13 : 0.2);
  ctx.lineWidth = mobileLite ? 1.6 : 2.2;
  ctx.beginPath();
  ctx.moveTo(-34 + sway, -116 + crouch);
  ctx.bezierCurveTo(-18 + sway * 0.6, -101 + crouch, 6 + sway, -82 + crouch, 31 + sway * 0.35, -59 + crouch + gait);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(accent, mobileLite ? 0.1 : 0.16);
  ctx.lineWidth = mobileLite ? 1.1 : 1.55;
  ctx.beginPath();
  ctx.moveTo(31 - sway * 0.4, -111 + crouch);
  ctx.quadraticCurveTo(7 + sway, -88 + crouch, -24 + sway * 0.5, -62 + crouch);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.1 : 0.15);
  ctx.lineWidth = mobileLite ? 1.2 : 1.6;
  for (const arm of [pose.backArm, pose.frontArm]) {
    ctx.beginPath();
    ctx.moveTo(arm.elbow.x + (arm.hand.x - arm.elbow.x) * 0.5, arm.elbow.y + (arm.hand.y - arm.elbow.y) * 0.5);
    ctx.quadraticCurveTo(arm.hand.x, arm.hand.y - 2, arm.hand.x + Math.sign(arm.hand.x || 1) * 6, arm.hand.y - 1);
    ctx.stroke();
  }

  for (const leg of [pose.backLeg, pose.frontLeg]) {
    ctx.beginPath();
    ctx.ellipse(leg.foot.x, leg.foot.y + 1, 14 + gait * 4, 2.7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSimiolinLongLineDetails(f, pose, crouch, walking, stride) {
  const mobileLite = isMobileFightView();
  const outfit = outfitSpec(f);
  const trim = f.trim ?? "#47d5ff";
  const accent = outfit?.accent ?? "#ffe2b0";
  const sway = Math.sin(roundFrame * 0.065 + f.x * 0.014) * (walking ? 0.85 : 0.28);
  const gait = walking ? Math.abs(stride || 0) : 0;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.1 : 0.17);
  ctx.lineWidth = mobileLite ? 1.15 : 1.55;
  ctx.beginPath();
  ctx.moveTo(-14 + sway, -126 + crouch);
  ctx.bezierCurveTo(-9 + sway * 0.5, -102 + crouch, -8, -72 + crouch, -6, -43 + crouch);
  ctx.moveTo(14 - sway * 0.4, -125 + crouch);
  ctx.bezierCurveTo(9 - sway * 0.4, -101 + crouch, 8, -72 + crouch, 6, -43 + crouch);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(accent, mobileLite ? 0.08 : 0.13);
  ctx.lineWidth = mobileLite ? 1 : 1.35;
  ctx.beginPath();
  ctx.moveTo(-22 + sway * 0.5, -116 + crouch);
  ctx.quadraticCurveTo(0, -108 + crouch - gait * 1.2, 22 - sway * 0.5, -116 + crouch);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.09 : 0.14);
  ctx.lineWidth = mobileLite ? 1.1 : 1.5;
  for (const arm of [pose.backArm, pose.frontArm]) {
    ctx.beginPath();
    ctx.ellipse(arm.hand.x, arm.hand.y, 6.8, 2.5, 0.08, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const leg of [pose.backLeg, pose.frontLeg]) {
    ctx.beginPath();
    ctx.moveTo(leg.knee.x * 0.9, leg.knee.y + 3);
    ctx.quadraticCurveTo((leg.knee.x + leg.foot.x) * 0.5, leg.knee.y + 24, leg.foot.x, leg.foot.y - 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLiliBlackSuitDetails(f, pose, crouch, walking, stride) {
  const mobileLite = isMobileFightView();
  const outfit = outfitSpec(f);
  const gait = walking ? Math.abs(stride || 0) : 0;
  const sway = Math.sin(roundFrame * 0.07 + f.x * 0.012) * (walking ? 0.55 : 0.22);
  const graphite = outfit?.accent ?? "#343840";
  const sheen = "#7f8794";

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = colorWithAlpha(sheen, mobileLite ? 0.1 : 0.16);
  ctx.lineWidth = mobileLite ? 1.3 : 1.8;
  ctx.beginPath();
  ctx.moveTo(-33 + sway, -116 + crouch);
  ctx.bezierCurveTo(-25 + sway * 0.5, -96 + crouch, -18, -80 + crouch, -29, -52 + crouch);
  ctx.moveTo(33 - sway, -116 + crouch);
  ctx.bezierCurveTo(25 - sway * 0.5, -96 + crouch, 18, -80 + crouch, 29, -52 + crouch);
  ctx.stroke();

  ctx.fillStyle = colorWithAlpha(graphite, mobileLite ? 0.12 : 0.18);
  ctx.beginPath();
  ctx.roundRect(-33, -66 + crouch + gait * 0.6, 66, 5, 3);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(sheen, mobileLite ? 0.08 : 0.13);
  ctx.lineWidth = mobileLite ? 1 : 1.35;
  for (const arm of [pose.backArm, pose.frontArm]) {
    ctx.beginPath();
    ctx.ellipse(arm.hand.x, arm.hand.y + 1, 6.2, 2.3, 0.1, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const leg of [pose.backLeg, pose.frontLeg]) {
    ctx.beginPath();
    ctx.moveTo(leg.knee.x * 0.94, leg.knee.y + 6);
    ctx.quadraticCurveTo((leg.knee.x + leg.foot.x) * 0.5, leg.knee.y + 23, leg.foot.x - Math.sign(leg.foot.x || 1) * 2, leg.foot.y - 1);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMaguilaHeavyGroundPolish(f, pose, crouch, walking, stride) {
  if (f.profileId !== "p3" || usesUnifiedSprite(f)) return;
  drawMaguilaRacingSilhouette(f, pose, crouch, walking, stride);
  if (isMobileFightView()) return;

  const phase = attackPhase(f.attack);
  const attackMass = f.attack ? attackMassProfile(f) : null;
  const attackWeight = f.attack ? attackBodyWeightProfile(f) : null;
  const hitMass = f.hurt > 0 || (f.reactionPulse ?? 0) > 0 ? hitReactionMassProfile(f) : null;
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const landing = clamp((f.landingPulse ?? 0) / 16, 0, 1) * clamp(f.landingStrength ?? 1, 0.6, 1.8);
  const walk = walking ? clamp((f.walkWeight ?? 0) * Math.abs(stride || 0), 0, 1.2) : 0;
  const attackPlant = attackMass ? clamp(Math.max(attackMass.plant, attackWeight?.plant ?? 0), 0, 1.8) : 0;
  const attackDrive = attackMass ? clamp(Math.max(attackMass.drive, attackWeight?.drive ?? 0, phase.snap * 0.9), 0, 1.8) : 0;
  const reactionFloor = hitMass ? clamp(hitMass.floor, 0, 1.8) : 0;
  const reactionSkid = hitMass ? clamp(hitMass.skid, 0, 1.8) : 0;
  const pressure = clamp(Math.max(guard * 0.72, guardHit, landing, walk * 0.72, attackPlant, attackDrive * 0.6, reactionFloor), 0, 1.85);
  if (pressure <= 0.035 && reactionSkid <= 0.04) return;

  const outfit = outfitSpec(f);
  const trim = f.trim ?? "#ffffff";
  const feet = [
    { foot: pose.backLeg.foot, side: -1, plant: pose.backLeg.plant ?? 0.68 },
    { foot: pose.frontLeg.foot, side: 1, plant: pose.frontLeg.plant ?? 0.74 },
  ];
  const supportSide = hitMass && reactionFloor > attackPlant
    ? (hitMass.worldDir === (f.dir || 1) ? -1 : 1)
    : attackWeight ? attackWeight.footSide : attackMass ? attackMass.footSide : f.walkAnchorSide || f.footPlantSide || 1;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (const item of feet) {
    const support = item.side === supportSide ? 1 : 0.52;
    const plant = clamp(item.plant + pressure * support * 0.42, 0, 1.35);
    ctx.fillStyle = `rgba(24, 13, 8, ${0.075 + plant * 0.085 + pressure * support * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(
      item.foot.x - (f.dir || 1) * reactionSkid * 4 * item.side,
      item.foot.y + 9 + pressure * support * 0.8,
      31 + plant * 13 + reactionSkid * 5,
      5.8 + plant * 2.2,
      item.side * 0.04 - (f.dir || 1) * attackDrive * 0.035,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  if (pressure > 0.08) {
    ctx.fillStyle = `rgba(31, 18, 10, ${0.04 + pressure * 0.055})`;
    ctx.beginPath();
    ctx.ellipse(0, -41 + crouch + pressure * 2, 54 + pressure * 10, 10 + pressure * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.strokeStyle = colorWithAlpha(trim, 0.06 + pressure * 0.085);
  ctx.lineWidth = 1.3 + pressure * 0.9;
  for (const item of feet) {
    const support = item.side === supportSide ? 1 : 0.42;
    if (pressure * support <= 0.04) continue;
    ctx.beginPath();
    ctx.ellipse(item.foot.x, item.foot.y + 2, 22 + pressure * 9, 3.8 + pressure * 1.4, item.side * 0.04, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (attackDrive > 0.08 || guardHit > 0.08) {
    const dir = f.dir || 1;
    ctx.strokeStyle = colorWithAlpha(outfit.accent ?? "#ffffff", 0.08 + Math.max(attackDrive, guardHit) * 0.12);
    ctx.lineWidth = 1.4 + Math.max(attackDrive, guardHit) * 0.8;
    ctx.beginPath();
    ctx.moveTo(-38, -84 + crouch + guard * 3);
    ctx.quadraticCurveTo(-8 - dir * attackDrive * 5, -72 + crouch + pressure * 2, 35 - dir * guardHit * 4, -81 + crouch + guard * 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPinoReflexPolish(f, pose, crouch, walking, stride) {
  if (f.profileId !== "p4" || usesUnifiedSprite(f)) return;
  drawPinoAgileSuitDetails(f, pose, crouch, walking, stride);

  const mobileLite = isMobileFightView();
  const phase = attackPhase(f.attack);
  const attack = f.attack ? Math.max(phase.strike, phase.snap * 0.92, phase.followThrough * 0.44) : 0;
  const prep = f.attack ? phase.anticipation : 0;
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const counter = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  const impact = localizedImpactProfile(f);
  const walk = walking ? clamp(Math.abs(stride || 0) * (f.walkWeight ?? 0.8), 0, 1.1) : 0;
  const active = clamp(Math.max(attack, prep * 0.55, guard * 0.42, counter * 0.54, impact.t * 0.42, walk * 0.5), 0, 1.45);
  if (active <= 0.035) return;

  const trim = f.trim ?? "#96e06c";
  const accent = outfitSpec(f)?.accent ?? "#d7c9ff";
  const localDir = (f.dir || 1) === (f.impactDir || f.dir || 1) ? 1 : -1;
  const snap = clamp(Math.max(attack, impact.snap * 0.62, counter * 0.5), 0, 1.35);
  const lean = (f.attack ? f.dir || 1 : localDir) * snap;
  const chestY = -109 + crouch;
  const hipY = -58 + crouch;
  const footPulse = Math.max(attack * 0.7, walk * 0.5, counter * 0.42);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.1 + active * 0.08 : 0.12 + active * 0.14);
  ctx.lineWidth = mobileLite ? 1.35 + active * 0.45 : 1.55 + active * 0.75;
  ctx.beginPath();
  ctx.moveTo(-28 - lean * 5, chestY - 9);
  ctx.quadraticCurveTo(-5 + lean * 8, chestY + 14 - active * 5, 31 + lean * 12, hipY + 5);
  if (!mobileLite) {
    ctx.moveTo(25 + lean * 2, chestY - 5);
    ctx.quadraticCurveTo(6 + lean * 8, chestY + 14, -25 + lean * 9, hipY + 3);
  }
  ctx.stroke();

  if (!mobileLite && (attack > 0.08 || counter > 0.08)) {
    ctx.strokeStyle = colorWithAlpha(accent, 0.08 + active * 0.12);
    ctx.lineWidth = 1.1 + active * 0.6;
    ctx.beginPath();
    ctx.moveTo(-35 - lean * 3, -132 + crouch);
    ctx.quadraticCurveTo(-4 + lean * 12, -142 + crouch - active * 4, 36 + lean * 7, -128 + crouch);
    ctx.moveTo(-20 + lean * 4, -78 + crouch);
    ctx.quadraticCurveTo(10 + lean * 12, -72 + crouch, 39 + lean * 8, -83 + crouch);
    ctx.stroke();
  }

  if (footPulse > 0.05) {
    ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.08 + footPulse * 0.08 : 0.1 + footPulse * 0.12);
    ctx.lineWidth = 1.1 + footPulse * 0.7;
    for (const leg of [pose.backLeg, pose.frontLeg]) {
      ctx.beginPath();
      ctx.ellipse(leg.foot.x, leg.foot.y + 2, 17 + footPulse * 8, 3.2 + footPulse, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSimiolinReachPolish(f, pose, crouch, walking, stride) {
  if (f.profileId !== "p5" || usesUnifiedSprite(f)) return;
  drawSimiolinLongLineDetails(f, pose, crouch, walking, stride);

  const mobileLite = isMobileFightView();
  const phase = attackPhase(f.attack);
  const attack = f.attack ? Math.max(phase.strike, phase.snap, phase.followThrough * 0.38) : 0;
  const prep = f.attack ? phase.anticipation : 0;
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const counter = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  const impact = localizedImpactProfile(f);
  const walk = walking ? clamp(Math.abs(stride || 0) * (f.walkWeight ?? 0.78), 0, 1.1) : 0;
  const active = clamp(Math.max(attack, prep * 0.56, guard * 0.44, counter * 0.56, impact.t * 0.44, walk * 0.62), 0, 1.45);
  if (active <= 0.035) return;

  const trim = f.trim ?? "#47d5ff";
  const accent = outfitSpec(f)?.accent ?? "#ffe2b0";
  const dir = f.dir || 1;
  const reach = clamp(Math.max(attack, phase.snap * 1.05, counter * 0.5), 0, 1.35);
  const sway = Math.sin(roundFrame * 0.08 + f.x * 0.012) * (walking ? 0.85 : 0.36);
  const chestY = -126 + crouch;
  const hipY = -50 + crouch;
  const footPulse = Math.max(attack * 0.62, walk * 0.55, counter * 0.4);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.08 + active * 0.08 : 0.11 + active * 0.13);
  ctx.lineWidth = mobileLite ? 1.1 + active * 0.42 : 1.35 + active * 0.62;
  ctx.beginPath();
  ctx.moveTo(-21 + sway - dir * reach * 2, chestY);
  ctx.quadraticCurveTo(-27 + dir * reach * 6, -94 + crouch - active * 5, -18 + dir * reach * 8, hipY);
  ctx.moveTo(21 - sway * 0.5 + dir * reach * 2, chestY + 1);
  ctx.quadraticCurveTo(27 + dir * reach * 8, -93 + crouch - active * 5, 18 + dir * reach * 10, hipY + 1);
  ctx.stroke();

  if (!mobileLite && (attack > 0.08 || counter > 0.08)) {
    const hand = pose.frontArm.hand;
    const elbow = pose.frontArm.elbow;
    ctx.strokeStyle = colorWithAlpha(accent, 0.07 + active * 0.12);
    ctx.lineWidth = 1 + active * 0.55;
    ctx.beginPath();
    ctx.moveTo(elbow.x - dir * 2, elbow.y);
    ctx.quadraticCurveTo(hand.x + dir * (14 + reach * 16), hand.y - 9 * active, hand.x + dir * (34 + reach * 24), hand.y - 8 * reach);
    ctx.stroke();
  }

  if (footPulse > 0.05) {
    ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.07 + footPulse * 0.07 : 0.08 + footPulse * 0.1);
    ctx.lineWidth = 1 + footPulse * 0.62;
    for (const leg of [pose.backLeg, pose.frontLeg]) {
      ctx.beginPath();
      ctx.ellipse(leg.foot.x, leg.foot.y + 2, 18 + footPulse * 11, 3 + footPulse * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLiliGuardPolish(f, pose, crouch, walking, stride) {
  if (f.profileId !== "p6" || usesUnifiedSprite(f)) return;
  drawLiliBlackSuitDetails(f, pose, crouch, walking, stride);

  const mobileLite = isMobileFightView();
  const phase = attackPhase(f.attack);
  const attack = f.attack ? Math.max(phase.strike * 0.84, phase.snap * 0.72, phase.followThrough * 0.35) : 0;
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const counter = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  const impact = localizedImpactProfile(f);
  const walk = walking ? clamp(Math.abs(stride || 0) * (f.walkWeight ?? 1), 0, 1) : 0;
  const active = clamp(Math.max(guard * 0.9, guardHit, counter * 0.52, attack * 0.48, impact.t * 0.34, walk * 0.38), 0, 1.45);
  if (active <= 0.035) return;

  const outfit = outfitSpec(f);
  const trim = "#717985";
  const guardGlow = f.trim ?? "#ff8ac8";
  const accent = outfit?.accent ?? "#343840";
  const sway = Math.sin(roundFrame * 0.075 + f.x * 0.01) * (walking ? 0.55 : 0.25);
  const brace = clamp(Math.max(guard, guardHit * 1.1, counter * 0.5), 0, 1.25);
  const chestY = -118 + crouch;
  const waistY = -72 + crouch;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.08 + active * 0.08 : 0.1 + active * 0.13);
  ctx.lineWidth = mobileLite ? 1.2 + active * 0.42 : 1.45 + active * 0.65;
  ctx.beginPath();
  ctx.moveTo(-31 + sway, chestY + brace * 2);
  ctx.quadraticCurveTo(-21 - brace * 7, -96 + crouch - active * 2, -8, waistY + active * 2);
  ctx.moveTo(31 - sway, chestY + brace * 2);
  ctx.quadraticCurveTo(21 + brace * 7, -96 + crouch - active * 2, 8, waistY + active * 2);
  ctx.stroke();

  if (!mobileLite && (guard > 0.08 || guardHit > 0.06 || counter > 0.08)) {
    ctx.strokeStyle = colorWithAlpha(accent, 0.08 + active * 0.11);
    ctx.lineWidth = 1.1 + active * 0.55;
    ctx.beginPath();
    ctx.moveTo(-38, -101 + crouch);
    ctx.quadraticCurveTo(0, -121 + crouch - brace * 5, 38, -101 + crouch);
    ctx.moveTo(-34, -60 + crouch);
    ctx.quadraticCurveTo(0, -48 + crouch + brace * 2, 34, -60 + crouch);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(guardGlow, 0.045 + Math.max(guard, guardHit, counter) * 0.065);
    ctx.lineWidth = 0.9 + active * 0.38;
    ctx.beginPath();
    ctx.moveTo(-40, -104 + crouch);
    ctx.quadraticCurveTo(0, -129 + crouch - brace * 4, 40, -104 + crouch);
    ctx.stroke();
  }

  if (active > 0.06) {
    ctx.strokeStyle = colorWithAlpha(trim, mobileLite ? 0.06 + active * 0.06 : 0.07 + active * 0.09);
    ctx.lineWidth = 1 + active * 0.55;
    for (const leg of [pose.backLeg, pose.frontLeg]) {
      ctx.beginPath();
      ctx.ellipse(leg.foot.x, leg.foot.y + 2, 19 + brace * 8 + walk * 4, 3.2 + brace * 0.9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSpriteExtremityDetails(f, crouch, frameName, stride, options = {}) {
  if (options.unified && (f.attack || !f.grounded || frameName === "walk")) return;
  const localCrouch = crouch * 0.18;
  const phase = attackPhase(f.attack);
  const action = f.attack ? Math.max(phase.strike, phase.snap, phase.followThrough * 0.5) : 0;
  const guard = f.blocking ? 1 : 0;
  const walk = frameName === "walk" ? Math.sin((f.walkCycle ?? roundFrame * 0.2) + 0.4) : 0;
  const hurt = clamp((f.hurt ?? 0) / 20, 0, 1);
  const skin = f.skin ?? "#f3bd98";
  const shoe = outfitSpec(f)?.shoe ?? "#6e3a24";
  const trim = f.trim ?? "#fff1bd";

  const hands = spriteHandDetailPose(frameName, action, guard, hurt, localCrouch);
  const feet = spriteFootDetailPose(frameName, action, walk, localCrouch, f);
  applyAttackFootPressure(feet, f);
  applyReactionFootPressure(feet, f);

  for (const foot of feet) drawSpriteFootDetail(foot, shoe, trim);
  for (const hand of hands) drawSpriteHandDetail(hand, skin, trim);
}

function spriteHandDetailPose(frameName, action, guard, hurt, localCrouch) {
  const jitter = hurt * Math.sin(roundFrame * 0.52) * 2.2;
  if (frameName === "block") {
    return [
      { x: -38, y: -124 + localCrouch + jitter, sx: 0.86, sy: 0.78, angle: -0.36, curl: 0.88 },
      { x: 39, y: -120 + localCrouch - jitter * 0.4, sx: 0.9, sy: 0.82, angle: 0.34, curl: 0.9 },
    ];
  }
  if (frameName === "punch" || frameName === "special") {
    return [
      { x: -38 - action * 8, y: -116 + localCrouch + jitter + action * 2, sx: 0.78, sy: 0.72, angle: -0.32, curl: 0.78 },
      { x: 62 + action * 47, y: -123 + localCrouch - action * 8 - jitter * 0.25, sx: 0.94 + action * 0.3, sy: 0.8 - action * 0.04, angle: 0.08 - action * 0.12, curl: 1 },
    ];
  }
  if (frameName === "kick" || frameName === "sweep") {
    return [
      { x: -48 - action * 8, y: -111 + localCrouch - action * 4 + jitter, sx: 0.78, sy: 0.72, angle: -0.44, curl: 0.75 },
      { x: 48 - action * 5, y: -102 + localCrouch + action * 8 - jitter * 0.3, sx: 0.78, sy: 0.72, angle: 0.36, curl: 0.76 },
    ];
  }
  return [
    { x: -50 - guard * 4, y: -111 + localCrouch + jitter, sx: 0.8, sy: 0.74, angle: -0.22, curl: 0.68 },
    { x: 51 + guard * 3, y: -112 + localCrouch - jitter * 0.4, sx: 0.8, sy: 0.74, angle: 0.22, curl: 0.68 },
  ];
}

function spriteFootDetailPose(frameName, action, walk, localCrouch, f = null) {
  if (frameName === "kick") {
    return [
      { x: -49 - action * 8, y: -2 + localCrouch, w: 34, h: 10, angle: -0.14, plant: 0.95, sole: 1 },
      { x: 77 + action * 47, y: -51 - action * 40 + localCrouch, w: 42 + action * 8, h: 10, angle: -0.18 - action * 0.26, plant: 0.12, sole: 0.7 },
    ];
  }
  if (frameName === "sweep") {
    return [
      { x: -57, y: -2 + localCrouch, w: 36, h: 10, angle: -0.1, plant: 1, sole: 1 },
      { x: 83 + action * 54, y: -4 + localCrouch + action * 1.5, w: 49 + action * 9, h: 9, angle: -0.03, plant: 0.7, sole: 1 },
    ];
  }
  if (frameName === "walk") {
    const anchor = clamp((f?.walkAnchorPulse ?? 0) / 12, 0, 1);
    const push = clamp((f?.walkPushPulse ?? 0) / 9, 0, 1);
    const swing = clamp(f?.walkSwing ?? Math.abs(walk), 0, 1);
    const anchorSide = f?.walkAnchorSide ?? (walk >= 0 ? 1 : -1);
    const leftPress = anchorSide < 0 ? anchor : 0;
    const rightPress = anchorSide > 0 ? anchor : 0;
    const leftSwing = anchorSide > 0 ? swing : 0;
    const rightSwing = anchorSide < 0 ? swing : 0;
    return [
      {
        x: -49 - walk * 6 - leftPress * 3.5,
        y: -2 + localCrouch - Math.max(0, walk) * 7 - leftSwing * 3 + leftPress * 1.2,
        w: 34 + leftPress * 5,
        h: 10 - leftPress * 1.1 + leftSwing * 0.9,
        angle: -0.12 + walk * 0.055 - leftPress * 0.035,
        plant: clamp(0.58 - walk * 0.22 + leftPress * 0.38 - leftSwing * 0.12, 0.18, 1),
        sole: 0.9 + leftPress * 0.16,
        press: leftPress,
        push,
      },
      {
        x: 49 + walk * 6 + rightPress * 3.5,
        y: -2 + localCrouch + Math.min(0, walk) * 7 - rightSwing * 3 + rightPress * 1.2,
        w: 34 + rightPress * 5,
        h: 10 - rightPress * 1.1 + rightSwing * 0.9,
        angle: 0.12 + walk * 0.055 + rightPress * 0.035,
        plant: clamp(0.58 + walk * 0.22 + rightPress * 0.38 - rightSwing * 0.12, 0.18, 1),
        sole: 0.9 + rightPress * 0.16,
        press: rightPress,
        push,
      },
    ];
  }
  if (frameName === "defeat") {
    return [
      { x: -31, y: -2 + localCrouch, w: 36, h: 10, angle: -0.16, plant: 0.86, sole: 1 },
      { x: 47, y: -1 + localCrouch, w: 38, h: 10, angle: 0.08, plant: 0.8, sole: 1 },
    ];
  }
  return [
    { x: -46, y: -2 + localCrouch, w: 34, h: 10, angle: -0.12, plant: 0.9, sole: 1 },
    { x: 48, y: -2 + localCrouch, w: 35, h: 10, angle: 0.12, plant: 0.88, sole: 1 },
  ];
}

function applyAttackFootPressure(feet, f) {
  if (!f?.attack || !f.grounded || !Array.isArray(feet) || feet.length < 2) return;
  const mass = attackMassProfile(f);
  const bodyWeight = attackBodyWeightProfile(f);
  if (mass.active <= 0.03) return;

  const supportIndex = bodyWeight.footSide < 0 ? 0 : 1;
  const freeIndex = supportIndex === 0 ? 1 : 0;
  const support = feet[supportIndex];
  const free = feet[freeIndex];
  const press = clamp(Math.max(mass.plant * 0.72 + mass.load * 0.2, bodyWeight.plant * 0.76 + bodyWeight.load * 0.18), 0, 1.12);
  const drive = clamp(Math.max(mass.drive + mass.snap * 0.4, bodyWeight.drive + bodyWeight.follow * 0.18), 0, 1.45);
  const compression = clamp(bodyWeight.compression + bodyWeight.brace * 0.12, 0, 1.25);

  support.press = Math.max(support.press ?? 0, press);
  support.plant = Math.max(support.plant ?? 0, 0.68 + press * 0.28);
  support.w += press * 4.2 + compression * 1.2;
  support.h = Math.max(7.3, support.h - press * 1.1 - compression * 0.35);
  support.y += press * 1.1 + compression * 0.55;
  support.x -= (f.dir || 1) * (drive * 2.4 + bodyWeight.recoil * 0.6);
  support.angle += bodyWeight.footSide < 0 ? -press * 0.038 : press * 0.038;

  if (free) {
    free.plant = Math.max(0.12, (free.plant ?? 0.7) - drive * 0.16);
    free.y -= drive * 1.8 + bodyWeight.lift * 1.2 - bodyWeight.low * 0.4;
    free.x += (f.dir || 1) * (drive * 2.8 + bodyWeight.follow * 0.9);
    free.press = Math.max(free.press ?? 0, drive * 0.12);
  }
}

function applyReactionFootPressure(feet, f) {
  if (!f?.grounded || f.hurt <= 0 || !Array.isArray(feet) || feet.length < 2) return;
  const mass = hitReactionMassProfile(f);
  if (mass.active <= 0.03 || mass.kind === "guard") return;

  const localImpactDir = mass.worldDir === (f.dir || 1) ? 1 : -1;
  const supportIndex = localImpactDir > 0 ? 0 : 1;
  const freeIndex = supportIndex === 0 ? 1 : 0;
  const support = feet[supportIndex];
  const free = feet[freeIndex];
  const press = clamp(mass.floor * 0.72 + mass.skid * 0.16, 0, 1);
  const skid = clamp(mass.skid, 0, 1.5);

  support.press = Math.max(support.press ?? 0, press);
  support.plant = Math.max(support.plant ?? 0, 0.66 + press * 0.3);
  support.w += press * 4.8 + skid * 1.8;
  support.h = Math.max(7.2, support.h - press * 1.2);
  support.y += press * 1.3;
  support.x -= localImpactDir * (press * 2.6 + skid * 2.2);
  support.angle += supportIndex === 0 ? -press * 0.04 : press * 0.04;

  if (free) {
    free.plant = Math.max(0.14, (free.plant ?? 0.7) - skid * 0.12);
    free.y -= mass.zone === "head" ? skid * 0.9 : 0;
    free.x += localImpactDir * skid * 2.6;
  }
}

function drawSpriteHandDetail(hand, skin, trim) {
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(hand.angle);
  ctx.scale(hand.sx, hand.sy);

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(32, 16, 12, 0.16)";
  ctx.beginPath();
  ctx.ellipse(1, 3, 14, 7, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(47, 25, 18, 0.34)";
  ctx.lineWidth = 1.25;
  ctx.lineCap = "round";
  for (let i = -1; i <= 1; i += 1) {
    const x = i * 4.2;
    ctx.beginPath();
    ctx.moveTo(x - 1.2, -5.4);
    ctx.quadraticCurveTo(x + hand.curl * 0.8, -0.5, x + 1.1, 4.2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(35, 18, 13, 0.44)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-8.5, -2.5);
  ctx.quadraticCurveTo(-2, -7.4, 8.5, -2.6);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(hand.angle);
  ctx.scale(hand.sx, hand.sy);
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(lighten(skin, 26), 0.18);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-7, -5.8);
  ctx.quadraticCurveTo(0, -9.6, 8.2, -4.5);
  ctx.stroke();
  ctx.strokeStyle = colorWithAlpha(trim, 0.09);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 13.5, Math.PI * 1.1, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();
}

function drawSpriteFootDetail(foot, shoe, trim) {
  const press = clamp(foot.press ?? 0, 0, 1);
  if (foot.plant > 0.24 && foot.y > -16) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(20, 12, 8, ${0.08 + foot.plant * 0.12 + press * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y + 8 + press * 0.8, foot.w * (0.54 + foot.plant * 0.16 + press * 0.08), 4.6 + press * 0.8, foot.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(foot.angle);
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(22, 13, 10, 0.38)";
  ctx.lineWidth = 1.7 + press * 0.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-foot.w * 0.47, foot.h * (0.18 + press * 0.08));
  ctx.quadraticCurveTo(-foot.w * 0.04, foot.h * (0.62 + foot.sole * 0.1 + press * 0.08), foot.w * 0.48, foot.h * (0.16 + press * 0.08));
  ctx.stroke();

  ctx.strokeStyle = "rgba(22, 13, 10, 0.28)";
  ctx.lineWidth = 1.15;
  for (let i = 0; i < 3; i += 1) {
    const x = foot.w * (0.13 + i * 0.11);
    ctx.beginPath();
    ctx.moveTo(x, -foot.h * 0.26);
    ctx.lineTo(x + 1.8, foot.h * 0.24);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(foot.x, foot.y);
  ctx.rotate(foot.angle);
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(lighten(shoe, 28), 0.16 + press * 0.04);
  ctx.lineWidth = 1.35;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-foot.w * 0.35, -foot.h * (0.35 - press * 0.03));
  ctx.quadraticCurveTo(foot.w * 0.08, -foot.h * (0.62 - press * 0.05), foot.w * 0.36, -foot.h * (0.25 - press * 0.03));
  ctx.stroke();
  ctx.strokeStyle = colorWithAlpha(trim, foot.plant > 0.5 ? 0.1 : 0.16);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-foot.w * 0.34, foot.h * 0.34);
  ctx.lineTo(foot.w * 0.42, foot.h * 0.22);
  ctx.stroke();
  ctx.restore();
}

function drawSpriteGuardPoseOverlay(f, crouch, frameName) {
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const impact = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const counter = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  const active = Math.max(guard, impact, counter * 0.84);
  if (active <= 0.04 || f.attack || f.hurt > 0 || winner) return;

  const guardProfile = characterGuard(f);
  const outfit = outfitSpec(f) ?? {};
  const sleeve = outfit.sleeve ?? f.color ?? "#497ac4";
  const skin = f.skin ?? "#f3bd98";
  const trim = f.trim ?? "#fff1bd";
  const localCrouch = crouch * 0.18;
  const breath = Math.sin(roundFrame * 0.12 + f.x * 0.01);
  const recoil = impact * impact * guardProfile.recoil;
  const counterPulse = counter * guardProfile.counter * (0.7 + Math.sin(roundFrame * 0.32) * 0.3);
  const heavyGuard = f.profileId === "p1";
  const technicalGuard = f.profileId === "p2";

  const frontShoulder = heavyGuard
    ? { x: 28 - recoil * 2, y: -153 + localCrouch + guard * 2 }
    : technicalGuard
      ? { x: 36 - recoil * 2, y: -158 + localCrouch - guard }
      : { x: 34 - recoil * 3, y: -154 + localCrouch + guard * 2 };
  const frontElbow = heavyGuard
    ? { x: 40 + recoil * 3, y: -136 + localCrouch + guard * 5 + breath * 0.55 }
    : technicalGuard
      ? { x: 58 + recoil * 6, y: -139 + localCrouch + guard * 2 + breath * 1.15 }
      : { x: 52 + recoil * 4, y: -132 + localCrouch + guard * 7 + breath };
  const frontHand = heavyGuard
    ? { x: 31 + recoil * 5 + counter * 3, y: -113 + localCrouch + guard * 4 + impact * 2 }
    : technicalGuard
      ? { x: 50 + recoil * 12 + counter * 8, y: -119 + localCrouch + guard * 2 + impact * 5 }
      : { x: 36 + recoil * 9 + counter * 5, y: -111 + localCrouch + guard * 6 + impact * 4 };
  const backShoulder = heavyGuard
    ? { x: -28, y: -148 + localCrouch + guard * 5 }
    : technicalGuard
      ? { x: -30, y: -151 + localCrouch + guard * 3 }
      : { x: -31, y: -150 + localCrouch + guard * 4 };
  const backElbow = heavyGuard
    ? { x: 4 + recoil * 3, y: -131 + localCrouch + guard * 8 - breath * 0.35 }
    : technicalGuard
      ? { x: 12 + recoil * 6, y: -128 + localCrouch + guard * 6 - breath * 0.9 }
      : { x: 9 + recoil * 5, y: -134 + localCrouch + guard * 9 - breath * 0.6 };
  const backHand = heavyGuard
    ? { x: 9 + recoil * 4, y: -106 + localCrouch + guard * 6 + impact * 2 }
    : technicalGuard
      ? { x: 3 + recoil * 9, y: -96 + localCrouch + guard * 6 + impact * 4 }
      : { x: 13 + recoil * 7, y: -107 + localCrouch + guard * 8 + impact * 3 };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = clamp((0.24 + active * 0.46) * guardProfile.shieldAlpha, 0.18, 0.78);
  ctx.shadowColor = "rgba(9, 7, 6, 0.38)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;

  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = darken(sleeve, 18);
  ctx.lineWidth = 17 * guardProfile.shieldWidth + guard * 2 * guardProfile.brace + impact * 4 * guardProfile.recoil;
  ctx.beginPath();
  ctx.moveTo(backShoulder.x, backShoulder.y);
  ctx.quadraticCurveTo(backElbow.x - 12, backElbow.y - 3, backHand.x, backHand.y);
  ctx.moveTo(frontShoulder.x, frontShoulder.y);
  ctx.quadraticCurveTo(frontElbow.x + 7, frontElbow.y - 4, frontHand.x, frontHand.y);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(sleeve, 0.96);
  ctx.lineWidth = 11 * guardProfile.shieldWidth + guard * 2.2 * guardProfile.brace + impact * 2.4 * guardProfile.recoil;
  ctx.beginPath();
  ctx.moveTo(backShoulder.x + 3, backShoulder.y + 1);
  ctx.quadraticCurveTo(backElbow.x - 5, backElbow.y - 1, backHand.x + 2, backHand.y);
  ctx.moveTo(frontShoulder.x - 2, frontShoulder.y + 1);
  ctx.quadraticCurveTo(frontElbow.x + 2, frontElbow.y, frontHand.x - 2, frontHand.y);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(skin, 0.92);
  ctx.lineWidth = 8.4 + impact * 1.4 * guardProfile.recoil;
  ctx.beginPath();
  ctx.moveTo(backHand.x - 5, backHand.y + 1);
  ctx.lineTo(backHand.x + 10, backHand.y + 2);
  ctx.moveTo(frontHand.x - 4, frontHand.y + 1);
  ctx.lineTo(frontHand.x + 13, frontHand.y + 1);
  ctx.stroke();

  ctx.fillStyle = colorWithAlpha(skin, 0.96);
  ctx.beginPath();
  ctx.ellipse(backHand.x + 11, backHand.y + 2, 9.5 + impact * 2 * guardProfile.recoil, 7.4, 0.05, 0, Math.PI * 2);
  ctx.ellipse(frontHand.x + 14, frontHand.y + 1, 10.5 + impact * 2.4 * guardProfile.recoil, 7.6, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = clamp(0.08 + active * 0.12, 0.06, 0.22);
  ctx.strokeStyle = "rgba(19, 10, 8, 0.9)";
  ctx.lineWidth = 4 + guard * 2 * guardProfile.brace;
  ctx.beginPath();
  ctx.moveTo(-38, -73 + localCrouch + guard * 5);
  ctx.quadraticCurveTo(-15, -57 + localCrouch + guard * 8, 4, -40 + localCrouch + guard * 7);
  ctx.moveTo(36, -72 + localCrouch + guard * 4);
  ctx.quadraticCurveTo(21, -55 + localCrouch + guard * 8, 38, -39 + localCrouch + guard * 7);
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = clamp((0.08 + guard * 0.13 + counterPulse * 0.2 + impact * 0.2) * guardProfile.shieldAlpha, 0.05, 0.4);
  ctx.strokeStyle = counter > 0.05 ? colorWithAlpha(trim, 0.96) : colorWithAlpha(guardProfile.color, 0.82);
  ctx.lineWidth = 1.5 + guard * 1.2 * guardProfile.shieldWidth + counter * 1.4 * guardProfile.counter + impact * 1.6 * guardProfile.recoil;
  ctx.beginPath();
  ctx.moveTo(backShoulder.x - 1, backShoulder.y - 6);
  ctx.quadraticCurveTo(4 + recoil * 5, -157 + localCrouch - counter * 6, frontShoulder.x + 9, frontShoulder.y - 5);
  ctx.moveTo(backHand.x - 7, backHand.y - 9);
  ctx.quadraticCurveTo(20 + counter * 8, -124 + localCrouch - counter * 5, frontHand.x + 20, frontHand.y - 8);
  ctx.stroke();

  if (technicalGuard) {
    ctx.globalAlpha = clamp(0.08 + active * 0.2 + counterPulse * 0.18, 0.06, 0.34);
    ctx.strokeStyle = colorWithAlpha(trim, 0.78);
    ctx.lineWidth = 1.2 + guard * 1.1 + impact;
    ctx.beginPath();
    ctx.moveTo(backHand.x - 10, backHand.y - 5);
    ctx.lineTo(frontHand.x + 23 + impact * 7, frontHand.y - 18 - counter * 5);
    ctx.moveTo(backHand.x - 4, backHand.y + 8);
    ctx.lineTo(frontHand.x + 18 + impact * 5, frontHand.y - 2);
    ctx.stroke();
  } else if (heavyGuard) {
    ctx.globalAlpha = clamp(0.06 + active * 0.16, 0.04, 0.26);
    ctx.strokeStyle = colorWithAlpha(guardProfile.color, 0.74);
    ctx.lineWidth = 4 + guard * 2 + impact * 1.4;
    ctx.beginPath();
    ctx.moveTo(backHand.x - 9, backHand.y + 11);
    ctx.quadraticCurveTo(20 + recoil * 3, -106 + localCrouch + guard * 4, frontHand.x + 23, frontHand.y + 11);
    ctx.stroke();
  }

  if (counter > 0.05) {
    ctx.globalAlpha = clamp((0.1 + counterPulse * 0.26) * guardProfile.shieldAlpha, 0.08, 0.4);
    ctx.lineWidth = 2.2 * guardProfile.shieldWidth;
    ctx.beginPath();
    ctx.arc(28 + counter * 5, -115 + localCrouch, (34 + counter * 8) * guardProfile.shieldScale, -0.92 * guardProfile.arc, 0.78 * guardProfile.arc);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSpriteAttackFrameWarp(f, image, frameX, crouch, compact = false) {
  if (!f.attack || f.hurt > 0) return;
  const focusedSprite = f.profileId === "p1" || f.profileId === "p2";
  const frame = attackFrameProfile(f);
  if (frame.bandT <= 0.04) return;
  const readability = attackReadabilityProfile(f);
  const bodyWeight = attackBodyWeightProfile(f);

  const zones = {
    arms: { srcY: 74, h: 120, pad: 18, lineY: -132 },
    torso: { srcY: 108, h: 118, pad: 18, lineY: -112 },
    legs: { srcY: 166, h: 126, pad: 16, lineY: -62 },
  };
  const zone = zones[frame.band] ?? zones.torso;
  const localY = -BODY_SPRITE_ANCHOR_Y + zone.srcY + crouch * 0.18;
  const centerY = localY + zone.h * 0.5;
  const alpha = clamp(0.07 + frame.bandT * 0.13 + readability.snap * 0.035 + bodyWeight.drive * 0.018, 0.06, 0.26);

  if (!compact && !focusedSprite) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-BODY_SPRITE_ANCHOR_X - zone.pad, localY - zone.pad, BODY_SPRITE_FRAME_W + zone.pad * 2, zone.h + zone.pad * 2);
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "source-over";
    ctx.translate(
      frame.bandShiftX + bodyWeight.drive * 1.2 - bodyWeight.recoil * 0.7,
      centerY + frame.bandShiftY + bodyWeight.compression * 1.1 - bodyWeight.lift * 0.65
    );
    ctx.rotate(frame.bandRotate + bodyWeight.drive * 0.004 - bodyWeight.recoil * 0.003);
    ctx.scale(frame.bandScaleX + bodyWeight.drive * 0.01, frame.bandScaleY - bodyWeight.compression * 0.005);
    ctx.translate(0, -centerY);
    ctx.drawImage(
      image,
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
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = compact
    ? clamp(0.01 + frame.arcFan * 0.022 + readability.clarity * 0.008, 0.008, 0.044)
    : clamp(0.1 + frame.arcFan * 0.2 + readability.clarity * 0.06, 0.08, 0.4);
  ctx.strokeStyle = colorWithAlpha(f.trim, 0.62);
  ctx.lineWidth = compact ? 0.55 + frame.arcFan * 0.36 + readability.snap * 0.22 : 1.5 + frame.arcFan * 2 + readability.snap * 1.2;
  ctx.lineCap = "round";
  const lineBaseY = zone.lineY + crouch * 0.18;
  const lanes = compact ? [-0.65, 0.65] : [-1, 0, 1];
  for (const lane of lanes) {
    ctx.beginPath();
    ctx.moveTo(-34 - frame.arcFan * 8, lineBaseY + lane * 11);
    ctx.quadraticCurveTo(
      28 + frame.bandShiftX * 0.35,
      lineBaseY - 18 * frame.arcFan + lane * 5,
      74 + frame.bandShiftX * 0.72,
      lineBaseY + lane * 9 + frame.bandShiftY * 0.28
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpriteAttackMotionTrace(f, crouch, type, power, read, phase) {
  const localCrouch = crouch * 0.18;
  const trim = f.trim ?? "#fff1bd";
  const special = type === "special";
  const kick = type === "kick" || type === "airKick";
  const sweep = type === "sweep";
  const punch = type === "punch" || type === "airPunch" || type === "grab";
  const clarity = clamp(read.clarity, 0, 1.4);
  const snap = clamp(Math.max(phase.snap, phase.strike * 0.72), 0, 1.2);
  const alpha = clamp(0.028 + power * 0.068 + clarity * 0.018, 0.024, 0.11);
  const baseY = sweep ? -18 + localCrouch : kick ? -67 + localCrouch - power * 15 : special ? -126 + localCrouch - power * 8 : -132 + localCrouch - power * 5;
  const startX = punch || special ? 54 : 44;
  const endX = sweep ? 158 + power * 28 : kick ? 164 + power * 34 : special ? 144 + power * 20 : 152 + power * 26;
  const arcY = sweep ? -24 + localCrouch : kick ? -105 + localCrouch - snap * 8 : special ? -154 + localCrouch - snap * 10 : -152 + localCrouch - snap * 7;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < 2; i += 1) {
    const lane = i === 0 ? -0.65 : 0.65;
    const laneAlpha = alpha * (1 - i * 0.2);
    ctx.globalAlpha = laneAlpha;
    ctx.strokeStyle = colorWithAlpha(i === 0 && special ? f.specialStyle?.rim ?? trim : trim, 0.82);
    ctx.lineWidth = 0.8 + power * 0.55 + (1 - i) * 0.12;
    ctx.beginPath();
    ctx.moveTo(startX - power * 12, baseY + lane * (kick || sweep ? 9 : 7));
    ctx.quadraticCurveTo(
      92 + power * 22,
      arcY + lane * (kick || sweep ? 8 : 6),
      endX,
      baseY + lane * (sweep ? 5 : kick ? 4 : 3)
    );
    ctx.stroke();
  }

  ctx.globalAlpha = clamp(alpha * 0.52, 0.018, 0.07);
  ctx.strokeStyle = colorWithAlpha(special ? f.specialStyle?.core ?? trim : "#fff6c9", 0.92);
  ctx.lineWidth = 0.7 + snap * 0.55;
  ctx.beginPath();
  ctx.moveTo(startX + 12, baseY - (kick ? 15 : 8));
  ctx.quadraticCurveTo(112 + power * 16, arcY - 10, endX + 22, baseY - (sweep ? 3 : 10));
  ctx.stroke();

  if (special) {
    ctx.globalAlpha = clamp(0.035 + snap * 0.075, 0.028, 0.11);
    ctx.strokeStyle = colorWithAlpha(f.specialStyle?.rim ?? trim, 0.95);
    ctx.lineWidth = 1.0 + snap * 0.7;
    ctx.beginPath();
    ctx.ellipse(endX - 3, baseY - 2, 22 + snap * 9, 9 + snap * 4, -0.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSpriteAttackSilhouetteExtension(f, crouch, frameName, compact = false) {
  if (!f.attack || f.hurt > 0) return;
  const type = f.attack.type;
  const phase = attackPhase(f.attack);
  const read = attackReadabilityProfile(f);
  const strike = Math.max(phase.strike, phase.snap * 0.95);
  const follow = phase.followThrough * 0.45;
  const power = clamp(Math.max(strike, follow), 0, 1.2);
  if (power <= 0.06) return;

  const punch = type === "punch" || type === "airPunch" || type === "grab";
  const kick = type === "kick" || type === "airKick";
  const sweep = type === "sweep";
  const special = type === "special";
  if (!punch && !kick && !sweep && !special) return;
  if (compact || f.profileId === "p1" || f.profileId === "p2") {
    drawSpriteAttackMotionTrace(f, crouch, type, power, read, phase);
    return;
  }

  const outfit = outfitSpec(f) ?? {};
  const sleeve = outfit.sleeve ?? f.color ?? "#497ac4";
  const pants = outfit.pants ?? f.color ?? "#497ac4";
  const skin = f.skin ?? "#f3bd98";
  const shoe = outfit.shoe ?? f.trim ?? "#6e3a24";
  const trim = f.trim ?? "#fff1bd";
  const localCrouch = crouch * 0.18;
  const alpha = clamp(0.2 + power * 0.42, 0.16, 0.58);
  const clarity = read.clarity;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(8, 6, 5, 0.34)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;

  if (punch || special) {
    const reach = special ? 12 : 18;
    const shoulderX = 31 - phase.anticipation * 7;
    const shoulderY = -137 + localCrouch + phase.anticipation * 2;
    const elbowX = 78 + power * (special ? 18 : 24);
    const elbowY = -134 + localCrouch - power * (special ? 7 : 4);
    const fistX = 112 + power * (special ? 20 : 28) + reach;
    const fistY = -130 + localCrouch - power * (special ? 9 : 5);

    ctx.globalAlpha = clamp(alpha + clarity * 0.06, 0.18, 0.64);
    ctx.strokeStyle = "rgba(20, 11, 8, 0.34)";
    ctx.lineWidth = 24 - power * 1.4;
    ctx.beginPath();
    ctx.moveTo(shoulderX - 2, shoulderY + 4);
    ctx.quadraticCurveTo(elbowX - 20, elbowY + 8, fistX - 14, fistY + 6);
    ctx.stroke();

    ctx.strokeStyle = darken(sleeve, 10);
    ctx.lineWidth = 18 - power * 1.5;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.quadraticCurveTo(elbowX - 19, elbowY + 5, elbowX + 5, elbowY);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(sleeve, 0.95);
    ctx.lineWidth = 12 + power * 2;
    ctx.beginPath();
    ctx.moveTo(elbowX - 4, elbowY);
    ctx.quadraticCurveTo(elbowX + 18, elbowY - 4, fistX - 15, fistY + 1);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(skin, 0.96);
    ctx.lineWidth = 10 + power * 1.6;
    ctx.beginPath();
    ctx.moveTo(fistX - 25, fistY + 1);
    ctx.lineTo(fistX - 6, fistY);
    ctx.stroke();

    ctx.fillStyle = colorWithAlpha(skin, 0.98);
    ctx.beginPath();
    ctx.ellipse(fistX + 1, fistY, 13 + power * 4, 9 + power * 1.6, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(42, 20, 13, 0.58)";
    ctx.lineWidth = 2.2 + clarity * 0.8;
    ctx.beginPath();
    ctx.ellipse(fistX + 1, fistY, 13 + power * 4, 9 + power * 1.6, -0.08, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(trim, 0.78);
    ctx.lineWidth = 2 + clarity * 0.9;
    ctx.beginPath();
    ctx.moveTo(fistX - 20, fistY - 8);
    ctx.quadraticCurveTo(fistX - 4, fistY - 13 - clarity * 3, fistX + 12, fistY - 7);
    ctx.stroke();

    if (!special) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + clarity * 0.12})`;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.ellipse(fistX - 6 + i * 7, fistY - 4 + (i === 1 ? -1 : 0), 2.4 + clarity * 0.8, 1.4 + clarity * 0.4, -0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = clamp(0.16 + power * 0.2, 0.12, 0.34);
    ctx.strokeStyle = colorWithAlpha(trim, 0.95);
    ctx.lineWidth = 2 + power * 1.4;
    ctx.beginPath();
    ctx.moveTo(60, -146 + localCrouch);
    ctx.quadraticCurveTo(101 + power * 18, -155 + localCrouch - power * 8, fistX + 25, fistY - 4);
    ctx.stroke();

    for (let i = 0; i < 2; i += 1) {
      const lane = i === 0 ? -1 : 1;
      ctx.globalAlpha = clamp(0.08 + power * 0.13, 0.08, 0.24);
      ctx.beginPath();
      ctx.moveTo(82, fistY + lane * 9);
      ctx.quadraticCurveTo(111 + power * 18, fistY + lane * (12 - power * 4), fistX + 36, fistY + lane * 6);
      ctx.stroke();
    }

    if (special) {
      const burst = clamp(power * 0.7 + phase.snap * 0.45, 0, 1.1);
      ctx.globalAlpha = clamp(0.12 + burst * 0.28, 0.12, 0.42);
      ctx.strokeStyle = colorWithAlpha(f.specialStyle?.rim ?? trim, 0.95);
      ctx.lineWidth = 2.2 + burst * 1.8;
      ctx.beginPath();
      ctx.ellipse(fistX + 9, fistY - 1, 24 + burst * 9, 11 + burst * 4, -0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fistX - 8, fistY - 18);
      ctx.lineTo(fistX + 23 + burst * 7, fistY - 2);
      ctx.lineTo(fistX - 6, fistY + 15);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (kick || sweep) {
    const groundY = sweep ? -18 + localCrouch : -58 + localCrouch - power * 14;
    const hipX = sweep ? 18 : 24;
    const hipY = sweep ? -76 + localCrouch + power * 8 : -91 + localCrouch;
    const kneeX = sweep ? 76 + power * 22 : 78 + power * 28;
    const kneeY = sweep ? -29 + localCrouch + power * 6 : -67 + localCrouch - power * 12;
    const footX = sweep ? 117 + power * 34 : 120 + power * 38;
    const footY = sweep ? -17 + localCrouch + power * 2 : groundY;

    ctx.globalAlpha = clamp(alpha + clarity * 0.06, 0.18, 0.64);
    ctx.strokeStyle = "rgba(20, 11, 8, 0.34)";
    ctx.lineWidth = sweep ? 25 : 26;
    ctx.beginPath();
    ctx.moveTo(hipX - 1, hipY + 5);
    ctx.quadraticCurveTo(kneeX - 25, kneeY + (sweep ? -3 : 13), footX - 20, footY + (sweep ? 4 : 8));
    ctx.stroke();

    ctx.strokeStyle = darken(pants, 12);
    ctx.lineWidth = sweep ? 18 : 19;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.quadraticCurveTo(kneeX - 24, kneeY + (sweep ? -7 : 9), kneeX, kneeY);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(pants, 0.96);
    ctx.lineWidth = sweep ? 15 + power * 2 : 14 + power * 2.6;
    ctx.beginPath();
    ctx.moveTo(kneeX - 4, kneeY);
    ctx.quadraticCurveTo(kneeX + 24, kneeY - (sweep ? 2 : 9), footX - 21, footY + (sweep ? 0 : 2));
    ctx.stroke();

    ctx.fillStyle = colorWithAlpha(shoe, 0.98);
    ctx.beginPath();
    ctx.ellipse(footX, footY, sweep ? 26 + power * 10 : 24 + power * 8, sweep ? 8 + power * 1.8 : 9 + power * 1.8, sweep ? -0.02 : -0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(32, 16, 11, 0.58)";
    ctx.lineWidth = 2.4 + clarity * 0.8;
    ctx.beginPath();
    ctx.ellipse(footX, footY, sweep ? 26 + power * 10 : 24 + power * 8, sweep ? 8 + power * 1.8 : 9 + power * 1.8, sweep ? -0.02 : -0.16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(trim, 0.78);
    ctx.lineWidth = 2 + clarity;
    ctx.beginPath();
    ctx.moveTo(footX - 21, footY - (sweep ? 6 : 8));
    ctx.quadraticCurveTo(footX + 2, footY - (sweep ? 12 : 15), footX + 24 + clarity * 6, footY - (sweep ? 4 : 8));
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = clamp(0.15 + power * 0.23, 0.12, 0.36);
    ctx.strokeStyle = colorWithAlpha(trim, 0.96);
    ctx.lineWidth = 2.2 + power * 1.8;
    ctx.beginPath();
    ctx.moveTo(48, hipY - 8);
    ctx.quadraticCurveTo(92 + power * 16, footY - (sweep ? 26 : 28), footX + 38, footY - (sweep ? 2 : 5));
    ctx.stroke();

    ctx.globalAlpha = clamp(0.08 + power * 0.11, 0.08, 0.22);
    for (let i = 0; i < 2; i += 1) {
      const lane = i === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(75, footY + lane * 12);
      ctx.quadraticCurveTo(107 + power * 15, footY + lane * (sweep ? 14 : 8), footX + 45, footY + lane * 6);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawSpriteImpactWarp(f, image, frameX, crouch, compact = false) {
  const impact = localizedImpactProfile(f);
  if (impact.t <= 0.035 || f.hitZone === "guard") return;
  const reaction = impactReactionProfile(f);
  const style = characterMotion(f);

  const zones = {
    head: { srcY: 116, h: 66, yBoost: -5, xKick: 7.4, scaleX: 0.036, scaleY: -0.02, rot: 0.052 },
    torso: { srcY: 146, h: 76, yBoost: -2, xKick: 6.2, scaleX: 0.032, scaleY: -0.034, rot: 0.035 },
    legs: { srcY: 202, h: 90, yBoost: 3, xKick: 5.2, scaleX: 0.045, scaleY: -0.048, rot: -0.045 },
  };
  const zone = zones[impact.zone] ?? zones.torso;
  const flavor = impactFlavorWarp(f.impactFlavor);
  const pad = 14;
  const localY = -BODY_SPRITE_ANCHOR_Y + zone.srcY + crouch * 0.18;
  const centerY = localY + zone.h * 0.5 + zone.yBoost;
  const reactionBoost = reaction.zone === impact.zone ? reaction.snap * 0.36 + reaction.rebound * 0.14 : 0;
  const warpAmount = (impact.snap + reactionBoost) * flavor.warp;
  const kick = -impact.localDir * zone.xKick * warpAmount * flavor.kick + (impact.shake + reaction.shake * 0.45) * 2.2;
  const squashX = 1 + zone.scaleX * warpAmount;
  const squashY = 1 + zone.scaleY * warpAmount;
  const rotation = -impact.localDir * zone.rot * (impact.rebound * flavor.warp + reactionBoost * 0.65);
  const fxAlpha = clamp(0.92 + (style.damageFx - 1) * 0.45, 0.82, 1.12);

  if (!compact && f.profileId !== "p1" && f.profileId !== "p2") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-BODY_SPRITE_ANCHOR_X - pad, localY - pad, BODY_SPRITE_FRAME_W + pad * 2, zone.h + pad * 2);
    ctx.clip();
    ctx.globalAlpha = clamp((0.34 + impact.t * 0.28) * fxAlpha, 0.2, 0.72);
    ctx.globalCompositeOperation = "source-over";
    ctx.translate(kick, centerY + impact.shake * 1.3);
    ctx.rotate(rotation);
    ctx.scale(squashX, squashY);
    ctx.translate(0, -centerY);
    ctx.drawImage(
      image,
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
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = compact
    ? clamp((0.045 + impact.t * 0.07) * fxAlpha, 0.026, 0.14)
    : clamp((0.12 + impact.t * 0.18) * fxAlpha, 0.08, 0.38);
  ctx.strokeStyle = colorWithAlpha(flavor.highlight, (impact.zone === "legs" ? 0.9 : 0.86) * fxAlpha);
  ctx.lineWidth = compact ? 0.9 + impact.snap * 0.65 * style.damageFx : 1.8 + impact.snap * 1.4 * style.damageFx;
  ctx.lineCap = "round";
  const impactLanes = compact ? [-0.55, 0.55] : [-1, 0, 1];
  for (const lane of impactLanes) {
    const y = centerY + lane * (impact.zone === "torso" ? 18 : 13) + impact.shake * 4;
    ctx.beginPath();
    ctx.moveTo(impact.localDir * (-54 - impact.snap * 9), y - lane * 5);
    ctx.quadraticCurveTo(impact.localDir * -8, y - 12 * impact.rebound, impact.localDir * (46 + impact.snap * 12), y + lane * 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpriteReactionPoseWarp(f, image, frameX, crouch, compact = false) {
  const reaction = impactReactionProfile(f);
  if (reaction.t <= 0.04 || reaction.kind === "guard" || !image?.complete || !image.naturalWidth) return;
  const style = characterMotion(f);

  const zone = reaction.zone === "head" || reaction.zone === "legs" ? reaction.zone : "torso";
  const kindBoost = reaction.kind === "finish" ? 1.26 : reaction.kind === "counter" || reaction.kind === "blast" ? 1.14 : reaction.kind === "heavy" ? 1.06 : 0.88;
  const force = clamp((reaction.snap * 0.72 + reaction.rebound * 0.34) * kindBoost, 0, 1.45);
  if (force <= 0.025) return;

  const localCrouch = crouch * 0.18;
  const dir = reaction.localDir || 1;
  const alpha = clamp((0.12 + reaction.t * 0.24) * style.damageFx, 0.08, 0.42);
  const sliceSets = {
    head: [
      { srcY: 132, h: 44, tx: -dir * 11.5, ty: -3.2, rot: -dir * 0.055, sx: 1.022, sy: 0.982, a: 0.86 },
      { srcY: 164, h: 62, tx: -dir * 6.2, ty: -0.6, rot: -dir * 0.025, sx: 1.014, sy: 0.99, a: 0.62 },
      { srcY: 222, h: 66, tx: dir * 1.4, ty: 1.2, rot: dir * 0.012, sx: 1.006, sy: 0.996, a: 0.42 },
    ],
    torso: [
      { srcY: 120, h: 54, tx: -dir * 5.4, ty: 0.4, rot: -dir * 0.018, sx: 1.016, sy: 0.992, a: 0.52 },
      { srcY: 154, h: 72, tx: -dir * 10.8, ty: 2.2, rot: -dir * 0.038, sx: 1.038, sy: 0.958, a: 0.9 },
      { srcY: 218, h: 72, tx: -dir * 3.8, ty: 1.6, rot: dir * 0.014, sx: 1.016, sy: 0.982, a: 0.58 },
    ],
    legs: [
      { srcY: 128, h: 56, tx: -dir * 2.6, ty: 1.2, rot: dir * 0.012, sx: 1.006, sy: 0.992, a: 0.42 },
      { srcY: 176, h: 60, tx: -dir * 5.4, ty: 5.2, rot: dir * 0.026, sx: 1.018, sy: 0.962, a: 0.64 },
      { srcY: 224, h: 70, tx: -dir * 10.8, ty: 7.2, rot: dir * 0.056, sx: 1.032, sy: 0.92, a: 0.92 },
    ],
  };

  if (!compact && f.profileId !== "p1" && f.profileId !== "p2") {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    for (const slice of sliceSets[zone]) {
      const localY = -BODY_SPRITE_ANCHOR_Y + slice.srcY + localCrouch;
      const centerY = localY + slice.h * 0.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-BODY_SPRITE_ANCHOR_X - 20, localY - 6, BODY_SPRITE_FRAME_W + 40, slice.h + 12);
      ctx.clip();
      ctx.globalAlpha = alpha * slice.a;
      ctx.translate(slice.tx * force + reaction.shake * 1.4, centerY + slice.ty * force + reaction.shake * 0.7);
      ctx.rotate(slice.rot * force);
      ctx.scale(1 + (slice.sx - 1) * force, 1 + (slice.sy - 1) * force);
      ctx.translate(0, -centerY);
      ctx.drawImage(
        image,
        frameX,
        0,
        BODY_SPRITE_FRAME_W,
        BODY_SPRITE_FRAME_H,
        -BODY_SPRITE_ANCHOR_X,
        -BODY_SPRITE_ANCHOR_Y + localCrouch,
        BODY_SPRITE_FRAME_W,
        BODY_SPRITE_FRAME_H
      );
      ctx.restore();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = compact ? clamp(0.028 + reaction.t * 0.06, 0.018, 0.09) : clamp(0.08 + reaction.t * 0.16, 0.06, 0.24);
  ctx.strokeStyle = reaction.kind === "blast" ? "rgba(156, 229, 255, 0.95)" : "rgba(255, 239, 174, 0.9)";
  ctx.lineWidth = compact ? 0.8 + force * 0.55 : 1.6 + force * 1.2;
  ctx.lineCap = "round";
  const y1 = zone === "head" ? -150 : zone === "legs" ? -62 : -122;
  const y2 = zone === "head" ? -104 : zone === "legs" ? -26 : -78;
  ctx.beginPath();
  ctx.moveTo(-dir * (48 + force * 6), y1 + localCrouch + reaction.shake * 2);
  ctx.quadraticCurveTo(-dir * 12, (y1 + y2) * 0.5 + localCrouch - force * 8, dir * (42 + force * 7), y2 + localCrouch);
  ctx.moveTo(-dir * (36 + force * 4), y2 + localCrouch + 10);
  ctx.quadraticCurveTo(-dir * 5, y2 + localCrouch + 2 - force * 5, dir * (30 + force * 5), y2 + localCrouch + 15);
  ctx.stroke();
  ctx.restore();
}

function secondaryMotionProfile(f, stride = 0) {
  const impact = localizedImpactProfile(f);
  const phase = attackPhase(f.attack);
  const type = f.attack?.type ?? "";
  const dir = f.dir || 1;
  const localSpeed = (f.vx ?? 0) * dir;
  const speed = clamp(Math.abs(f.vx ?? 0) / 4.1, 0, 1.25);
  const attackDrive = f.attack ? Math.max(phase.strike, phase.snap * 1.05, phase.followThrough * 0.56) : 0;
  const attackPrep = f.attack ? phase.anticipation : 0;
  const special = type === "special" ? Math.max(phase.anticipation * 0.7, phase.strike, phase.snap) : 0;
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const hurt = clamp((f.hurt ?? 0) / 24, 0, 1);
  const air = f.grounded ? 0 : 1;
  const land = clamp((f.landingPulse ?? 0) / 16, 0, 1);
  const hit = impact.t > 0.035 && f.hitZone !== "guard" ? Math.max(impact.snap, impact.rebound * 0.78) : 0;
  const faceImpactMax = Math.max(1, f.faceImpactMax ?? 1);
  const faceImpact = smoothStep01(clamp((f.faceImpactPulse ?? 0) / faceImpactMax, 0, 1)) * clamp(f.faceImpactStrength ?? 0, 0, 1.45);
  const reactionMax = Math.max(1, f.reactionMax ?? 1);
  const reaction = smoothStep01(clamp((f.reactionPulse ?? 0) / reactionMax, 0, 1));
  const drama = clamp(Math.max(hit * 0.9, faceImpact * 0.95, reaction * 0.76) + attackDrive * 0.16 + special * 0.12, 0, 1.85);
  const wave = Math.sin(roundFrame * (0.108 + speed * 0.026) + f.x * 0.014 + stride * 0.85);
  const afterWave = Math.sin(roundFrame * 0.205 + f.x * 0.009 + attackDrive * 1.7);
  const flutter = clamp(
    0.12 +
      speed * 0.58 +
      attackPrep * 0.34 +
      attackDrive * 0.92 +
      special * 0.42 +
      hit * 0.9 +
      guardHit * 0.58 +
      air * 0.28 +
      land * 0.48 +
      hurt * 0.22 +
      drama * 0.42,
    0,
    2.25
  );

  const x = clamp(
    -localSpeed * 2.15 -
      attackDrive * 5.6 +
      attackPrep * 2.15 -
      special * 1.4 -
      impact.localDir * hit * 4.8 +
      impact.localDir * drama * 2.2 +
      guard * 1.2 +
      wave * (1.2 + flutter * 1.15),
    -15.5,
    15.5
  );
  const y = clamp(-attackDrive * 2.4 - special * 1.2 - air * 2 + hit * 1.5 + drama * 1.1 + guardHit * 1.3 + afterWave * (0.9 + flutter * 0.7), -9.5, 9.5);
  const whip = clamp(wave * flutter + afterWave * 0.48 + impact.localDir * hit * 0.95 + impact.localDir * drama * 0.62 - attackDrive * 0.38, -2.65, 2.65);

  return {
    x,
    y,
    wave,
    afterWave,
    whip,
    flutter,
    speed,
    attackDrive,
    attackPrep,
    special,
    guardHit,
    hurt,
    land,
    hit,
    drama,
  };
}

function traceSecondaryRibbon(points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) * 0.5;
    const midY = (points[i].y + points[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

function strokeSecondaryRibbon(points, color, width, alpha = 1) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = colorWithAlpha(darken(color, 34), 0.62);
  ctx.lineWidth = width + 3;
  traceSecondaryRibbon(points);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(color, 0.92);
  ctx.lineWidth = width;
  traceSecondaryRibbon(points);
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(lighten(color, 32), 0.2);
  ctx.lineWidth = Math.max(1.1, width * 0.28);
  traceSecondaryRibbon(points);
  ctx.stroke();
  ctx.restore();
}

function drawSpriteSecondaryMotion(f, crouch, frameName, stride, options = {}) {
  const motion = secondaryMotionProfile(f, stride);
  const active = Math.max(motion.flutter, Math.abs(motion.x) / 10, Math.abs(stride) * 0.4);
  if (active <= 0.1 && frameName !== "idle") return;

  const outfit = outfitSpec(f) ?? {};
  const spec = bodySpec(f);
  const localCrouch = crouch * 0.18;
  const jacket = outfit.jacket ?? f.color ?? "#497ac4";
  const belt = outfit.belt ?? f.trim ?? "#fff1bd";
  const sleeve = outfit.sleeve ?? f.trim ?? "#fff1bd";
  const accent = outfit.accent ?? f.trim ?? "#fff1bd";
  const shoulder = spec.shoulder ?? 40;
  const hip = (spec.hip ?? 36) * (spec.belly ? 1.08 : 1);
  const waistY = -59 + localCrouch;
  const hemY = -43 + localCrouch;
  const alpha = clamp(0.22 + active * 0.25, 0.18, 0.58);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colorWithAlpha(jacket, 0.52);
  ctx.strokeStyle = colorWithAlpha(darken(jacket, 24), 0.38);
  ctx.lineWidth = 1.4;

  for (const side of [-1, 1]) {
    const rootX = side * (hip - 9);
    const tipX = side * (hip + 4 + motion.flutter * 2.4) + motion.x * (0.34 + side * 0.03) + side * motion.whip * 1.6;
    const tipY = hemY + 7 + motion.y * 0.35 + motion.wave * side * 1.6 + motion.flutter * 1.2;
    ctx.beginPath();
    ctx.moveTo(rootX, hemY - 8);
    ctx.quadraticCurveTo(side * (hip + 6) + motion.x * 0.15, hemY + 2 + motion.afterWave * 1.2, tipX, tipY);
    ctx.quadraticCurveTo(side * (hip - 3) + motion.x * 0.12, hemY + 5, rootX - side * 7, hemY - 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  const beltLag = clamp(motion.x * 0.52 + motion.whip * 3.2, -12, 12);
  strokeSecondaryRibbon(
    [
      { x: -4, y: waistY - 2 },
      { x: -16 + beltLag * 0.25, y: waistY + 10 + motion.y * 0.16 },
      { x: -24 + beltLag * 0.72, y: waistY + 25 + motion.y * 0.52 + motion.wave * 1.8 },
    ],
    belt,
    5.4,
    clamp(0.45 + active * 0.24, 0.42, 0.78)
  );
  strokeSecondaryRibbon(
    [
      { x: 6, y: waistY - 2 },
      { x: 18 + beltLag * 0.28, y: waistY + 8 - motion.y * 0.08 },
      { x: 30 + beltLag * 0.65, y: waistY + 20 + motion.afterWave * 2.2 },
    ],
    belt,
    4.6,
    clamp(0.36 + active * 0.2, 0.34, 0.68)
  );

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = clamp(0.11 + active * 0.12, 0.08, 0.3);
  ctx.strokeStyle = colorWithAlpha(accent, 0.82);
  ctx.lineWidth = 1.4 + motion.flutter * 0.5;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 13, -135 + localCrouch);
  ctx.bezierCurveTo(-shoulder + 3 + motion.x * 0.12, -112 + localCrouch, -hip + 10 + motion.x * 0.24, -77 + localCrouch, -hip + 14 + motion.x * 0.46, hemY + 2);
  ctx.moveTo(shoulder - 13, -135 + localCrouch);
  ctx.bezierCurveTo(shoulder - 3 + motion.x * 0.12, -112 + localCrouch, hip - 10 + motion.x * 0.24, -77 + localCrouch, hip - 14 + motion.x * 0.46, hemY + 2);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(sleeve, 0.54);
  ctx.lineWidth = 1.8 + motion.guardHit * 0.8;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 8, -129 + localCrouch);
  ctx.quadraticCurveTo(-shoulder - 8 + motion.x * 0.22, -115 + localCrouch + motion.wave * 1.8, -shoulder + 5 + motion.x * 0.3, -98 + localCrouch);
  ctx.moveTo(shoulder - 8, -129 + localCrouch);
  ctx.quadraticCurveTo(shoulder + 8 + motion.x * 0.22, -115 + localCrouch - motion.wave * 1.8, shoulder - 5 + motion.x * 0.3, -98 + localCrouch);
  ctx.stroke();
  ctx.restore();

  if (!options.skipHeadAccessories && f.profileId === "p1") drawPchanSpriteBandanaSecondary(motion, localCrouch);
  if (!options.skipHeadAccessories && f.profileId === "p2") drawAkaneSpriteHairSecondary(motion, localCrouch);
}

function drawPchanSpriteBandanaSecondary(motion, localCrouch, options = {}) {
  const yellow = "#f7dc63";
  const knotX = 30;
  const drama = clamp(motion.drama ?? 0, 0, 1.85);
  const knotY = -230 + localCrouch + motion.y * 0.1 - drama * 0.35;
  const tailScale = options.tailScale ?? 1;
  const alphaScale = options.alphaScale ?? 1;
  const tailX = clamp(motion.x * 0.42 + motion.whip * (3.6 + drama * 0.55), -10, 14) * tailScale;
  const tailY = (motion.y * 0.34 + motion.wave * (1.5 + drama * 0.35) - motion.attackDrive * 1.2 - drama * 0.8) * tailScale;
  const alpha = clamp((0.44 + motion.flutter * 0.16 + drama * 0.045) * alphaScale, 0.18, 0.8);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(knotX + 5, knotY + 5, 8, 5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  strokeSecondaryRibbon(
    [
      { x: knotX, y: knotY },
      { x: knotX + 11 + tailX * 0.32, y: knotY - 5 + tailY * 0.5 },
      { x: knotX + 24 + tailX, y: knotY + 1 + tailY },
    ],
    yellow,
    6.8,
    alpha
  );
  strokeSecondaryRibbon(
    [
      { x: knotX - 1, y: knotY + 6 },
      { x: knotX + 8 + tailX * 0.18, y: knotY + 14 + tailY * 0.38 },
      { x: knotX + 12 + tailX * 0.42, y: knotY + 24 + tailY * 0.58 },
    ],
    yellow,
    5.8,
    clamp(alpha * 0.88, 0.32, 0.64)
  );

  ctx.save();
  ctx.fillStyle = "#151515";
  ctx.globalAlpha = clamp(alpha + 0.12, 0.45, 0.84);
  for (const spot of [
    [knotX + 13 + tailX * 0.28, knotY - 4 + tailY * 0.48, 3.0, 6.0, -0.48],
    [knotX + 22 + tailX * 0.68, knotY + tailY * 0.72, 3.0, 5.8, 0.54],
    [knotX + 8 + tailX * 0.24, knotY + 16 + tailY * 0.48, 2.7, 5.4, -0.24],
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

function drawAkaneSpriteHairSecondary(motion, localCrouch, options = {}) {
  const hair = "#211417";
  const drama = clamp(motion.drama ?? 0, 0, 1.85);
  const strandScale = options.strandScale ?? 1;
  const alphaScale = options.alphaScale ?? 1;
  const roots = [
    { side: -1, rootX: -35, rootY: -232, lowY: -166, length: 1.05 },
    { side: 1, rootX: 35, rootY: -231, lowY: -166, length: 0.96 },
    { side: -1, rootX: -18, rootY: -244, lowY: -204, length: 0.72 },
    { side: 1, rootX: 18, rootY: -244, lowY: -205, length: 0.68 },
  ];
  const alpha = clamp((0.22 + motion.flutter * 0.18 + drama * 0.04) * alphaScale, 0.1, 0.55);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = colorWithAlpha(hair, 0.62);
  ctx.lineWidth = 3.4 + drama * 0.26;
  for (const lock of roots) {
    const sway = (motion.x * (0.28 + lock.length * 0.12) + motion.whip * lock.side * (2.2 + drama * 0.58) + motion.wave * lock.side * (2.4 + drama * 0.45)) * strandScale;
    const rootY = lock.rootY + localCrouch;
    const lowY = lock.lowY + localCrouch + (motion.y * 0.28 + motion.afterWave * lock.length * 1.2 + drama * lock.length * 1.4) * strandScale;
    ctx.globalAlpha = alpha * lock.length;
    ctx.beginPath();
    ctx.moveTo(lock.rootX, rootY);
    ctx.bezierCurveTo(
      lock.rootX + lock.side * (8 + motion.flutter * 2.2) + sway * 0.4,
      rootY + 18,
      lock.rootX + lock.side * (11 + motion.flutter * 3.4) + sway,
      lowY - 20,
      lock.rootX + lock.side * (4 + motion.flutter * 2.6) + sway * 0.82,
      lowY
    );
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = clamp(0.05 + motion.flutter * 0.045 + drama * 0.024, 0.04, 0.16);
  ctx.strokeStyle = "rgba(255, 236, 215, 0.8)";
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    const sway = (motion.x * 0.22 + motion.wave * side * 1.6) * strandScale;
    ctx.beginPath();
    ctx.moveTo(side * 29, -223 + localCrouch);
    ctx.bezierCurveTo(side * 35 + sway, -202 + localCrouch, side * 32 + sway * 0.7, -179 + localCrouch, side * 28 + sway * 0.5, -164 + localCrouch);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpritePremiumDetails(f, crouch, frameName, stride) {
  const outfit = outfitSpec(f) ?? {};
  const breath = Math.sin(roundFrame * 0.055 + f.x * 0.012);
  const action = f.attack ? attackProgress(f.attack) : 0;
  const cloth = secondaryMotionProfile(f, stride);
  const localCrouch = crouch * 0.18;
  const torsoY = -152 + localCrouch + breath * 0.8;
  const waistY = -86 + localCrouch;
  const accent = outfit.accent ?? f.trim;
  const trim = outfit.sleeve ?? f.trim;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "screen";

  const edgeGlow = 0.14 + Math.abs(breath) * 0.04 + action * 0.08 + cloth.flutter * 0.025;
  ctx.strokeStyle = colorWithAlpha(accent, edgeGlow);
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-31, torsoY - 5);
  ctx.bezierCurveTo(-24 + cloth.x * 0.06, torsoY + 17, -20 + cloth.x * 0.14, waistY - 11, -23 + cloth.x * 0.26, waistY + 8);
  ctx.moveTo(31, torsoY - 5);
  ctx.bezierCurveTo(24 + cloth.x * 0.06, torsoY + 17, 20 + cloth.x * 0.14, waistY - 11, 23 + cloth.x * 0.26, waistY + 8);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 1.4;
  for (const x of [-14, 0, 14]) {
    ctx.beginPath();
    const drift = cloth.x * (0.05 + Math.abs(x) * 0.004) + cloth.wave * cloth.flutter * 0.4;
    ctx.moveTo(x, torsoY - 13 + Math.sin(roundFrame * 0.045 + x) * 1.2);
    ctx.bezierCurveTo(x - 3 + drift, torsoY + 14, x + 2 + drift * 1.4, waistY - 14, x - 1 + drift * 1.8, waistY + 4);
    ctx.stroke();
  }

  if (f.profileId === "p1") {
    ctx.strokeStyle = colorWithAlpha("#fff1bd", 0.22 + action * 0.14);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-28, torsoY - 1);
    ctx.lineTo(-7 + cloth.x * 0.22, waistY + 3 + cloth.y * 0.08);
    ctx.moveTo(26, torsoY + 1);
    ctx.lineTo(9 + cloth.x * 0.22, waistY + 4 + cloth.y * 0.08);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha("#7fc8ff", 0.18 + Math.abs(stride) * 0.05);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-38, -126 + localCrouch);
    ctx.quadraticCurveTo(-48 + cloth.x * 0.15, -105 + localCrouch + cloth.wave * 0.8, -39 + cloth.x * 0.22, -84 + localCrouch);
    ctx.moveTo(38, -126 + localCrouch);
    ctx.quadraticCurveTo(48 + cloth.x * 0.15, -105 + localCrouch - cloth.wave * 0.8, 39 + cloth.x * 0.22, -84 + localCrouch);
    ctx.stroke();
  } else if (f.profileId === "p2") {
    ctx.strokeStyle = colorWithAlpha("#bfffe9", 0.2 + action * 0.1);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-24, torsoY - 2);
    ctx.quadraticCurveTo(-9 + cloth.x * 0.1, torsoY + 20, -4 + cloth.x * 0.24, waistY + 1 + cloth.y * 0.08);
    ctx.moveTo(24, torsoY - 2);
    ctx.quadraticCurveTo(9 + cloth.x * 0.1, torsoY + 20, 4 + cloth.x * 0.24, waistY + 1 + cloth.y * 0.08);
    ctx.stroke();

    ctx.strokeStyle = colorWithAlpha(trim, 0.18 + Math.abs(stride) * 0.04);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, -128 + localCrouch);
    ctx.bezierCurveTo(-34 + cloth.x * 0.12, -108 + localCrouch, -27 + cloth.x * 0.22, -92 + localCrouch, -30 + cloth.x * 0.34, -73 + localCrouch);
    ctx.moveTo(30, -128 + localCrouch);
    ctx.bezierCurveTo(34 + cloth.x * 0.12, -108 + localCrouch, 27 + cloth.x * 0.22, -92 + localCrouch, 30 + cloth.x * 0.34, -73 + localCrouch);
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
  const mass = attackMassProfile(f);
  const progress = phase.power;
  const style = f.attack.type === "special" ? fighterSignatureStyle(f) : null;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = style ? style.rim : colorWithAlpha(f.trim, 0.55);
  ctx.globalAlpha = 0.04 + phase.anticipation * 0.045 + phase.strike * 0.095 + phase.recovery * 0.03 + mass.drive * 0.03;
  ctx.lineWidth = f.attack.type === "special" ? 3.2 + mass.drive * 0.8 : 1.6 + phase.strike * 0.75 + mass.plant * 0.45;
  ctx.beginPath();
  ctx.ellipse(-mass.load * 4 + mass.drive * 7, -94 + crouch + mass.crush * 2, 58 + progress * 18 + mass.drive * 10, 106 + progress * 12 - mass.crush * 4, f.dir * (mass.drive - mass.load) * 0.035, 0, Math.PI * 2);
  ctx.stroke();
  if (mass.plant > 0.04) {
    const footSide = mass.footSide * 32;
    ctx.strokeStyle = style ? colorWithAlpha(style.trail, 0.12 + mass.drive * 0.18) : colorWithAlpha(f.trim, 0.12 + mass.drive * 0.12);
    ctx.lineWidth = 1.4 + mass.plant * 1.7;
    ctx.beginPath();
    ctx.moveTo(footSide - f.dir * 7, -4 + crouch * 0.18);
    ctx.quadraticCurveTo(footSide - f.dir * (28 + mass.drive * 18), 3 + crouch * 0.18, footSide - f.dir * (52 + mass.drive * 24), 0 + crouch * 0.18);
    ctx.stroke();
  }
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

    ctx.strokeStyle = colorWithAlpha(style.trail, 0.08 + progress * 0.16);
    ctx.lineWidth = 1.2 + progress * 1.1;
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
  const motion = characterMotion(f);
  const signature = spec.special ? fighterSignatureStyle(f) : null;
  const trailColor = signature?.trail ?? spec.color;
  const coreColor = signature?.core ?? spec.core;
  const rimColor = signature?.rim ?? spec.color;
  const read = attackReadabilityProfile(f);
  const prep = phase.anticipation;
  const strike = Math.max(phase.strike, phase.snap * 0.9);
  const recover = Math.max(phase.recovery * 0.72, phase.followThrough);
  const action = (layer === "back" ? Math.max(prep, strike * 0.35) : Math.max(strike, recover * 0.62))
    * clamp(0.76 + motion.afterimage * 0.08, 0.72, 0.95);
  if (action < 0.035) return;

  const yOffset = crouch * 0.18;
  const baseY = spec.trailY + yOffset;
  const reach = (spec.trailReach + phase.snap * (spec.heavy ? 18 : 12)) * motion.reach;
  const height = spec.trailHeight * motion.lift;
  const frame = attackFrameProfile(f);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (layer === "back") {
    if (prep > 0.04) {
      ctx.strokeStyle = colorWithAlpha(trailColor, 0.04 + prep * 0.08);
      ctx.lineWidth = 1.3 + prep * (spec.heavy ? 2.1 : 1.5);
      ctx.beginPath();
      ctx.moveTo(-44 - prep * 18, baseY + height * 0.34);
      ctx.bezierCurveTo(-18, baseY - height * 1.25, 24 + prep * 24, baseY - height * 1.15, 50 + prep * 18, baseY - height * 0.08);
      ctx.stroke();

      ctx.fillStyle = colorWithAlpha(trailColor, 0.018 + prep * 0.026);
      ctx.beginPath();
      ctx.ellipse(-18 - prep * 12, -94 + yOffset, 62 + prep * 18, 108 + prep * 10, -0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    if (spec.kick && prep > 0.05) {
      ctx.strokeStyle = colorWithAlpha(coreColor, 0.045 + prep * 0.09);
      ctx.lineWidth = 1.2 + prep * 1.1;
      for (let i = 0; i < 2; i += 1) {
        ctx.beginPath();
        ctx.arc(18 + i * 12, -72 + yOffset + i * 7, 32 + prep * 18, Math.PI * 0.85, Math.PI * 1.55);
        ctx.stroke();
      }
    }

    if (spec.sweep && prep > 0.05) {
      ctx.fillStyle = `rgba(255, 218, 116, ${0.018 + prep * 0.032})`;
      ctx.beginPath();
      ctx.ellipse(15 + prep * 18, -2 + yOffset, 72 + prep * 34, 8 + prep * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colorWithAlpha(trailColor, 0.045 + prep * 0.085);
      ctx.lineWidth = 1.1 + prep * 1.1;
      ctx.beginPath();
      ctx.moveTo(-42, -25 + yOffset);
      ctx.quadraticCurveTo(34 + prep * 18, -49 + yOffset, 98 + prep * 20, -27 + yOffset);
      ctx.stroke();
    }

    if (spec.special && prep > 0.04) {
      ctx.strokeStyle = colorWithAlpha(rimColor, 0.045 + prep * 0.12);
      ctx.lineWidth = 1.1 + prep * 1.2;
      for (let i = 0; i < 2; i += 1) {
        const radius = 27 + i * 13 + prep * 16;
        ctx.beginPath();
        ctx.arc(28 + prep * 9, -112 + yOffset, radius, -0.45 + i * 0.18, Math.PI * 1.25 + prep * 0.55);
        ctx.stroke();
      }
    }

    if (strike > 0.05) {
      const pressure = Math.max(strike, phase.snap);
      ctx.fillStyle = `rgba(255, 231, 166, ${0.02 + pressure * 0.035})`;
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
    glow.addColorStop(0, `rgba(255,255,255,${0.06 + strike * 0.11})`);
    glow.addColorStop(0.34, colorWithAlpha(trailColor, 0.05 + strike * 0.1));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(coreX, coreY, reach * (spec.sweep ? 0.58 : 0.5), height * (spec.kick ? 1.25 : spec.special ? 1.45 : 1), spec.sweep ? 0.02 : -0.09, 0, Math.PI * 2);
    ctx.fill();

    const clarity = read.clarity;
    const terminalX = spec.sweep ? reach * 1.03 : spec.kick ? reach * 0.96 : spec.special ? reach * 0.9 : reach * 0.86;
    const terminalY = spec.sweep ? baseY + height * 0.08 : spec.kick ? baseY - height * 0.08 : spec.special ? baseY - height * 0.12 : baseY - height * 0.16;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = clamp(0.035 + clarity * 0.045, 0.026, 0.085);
    ctx.strokeStyle = "rgba(16, 8, 6, 0.92)";
    ctx.lineWidth = (spec.kick || spec.sweep ? 6.2 : 4.8) * read.heavyLine;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (spec.sweep) {
      ctx.moveTo(-18, baseY + height * 0.48);
      ctx.quadraticCurveTo(reach * 0.45, baseY - height * 0.5, terminalX, terminalY + 3);
    } else if (spec.kick) {
      ctx.moveTo(4, baseY + height * 0.48);
      ctx.quadraticCurveTo(reach * 0.45, baseY - height * 1.42, terminalX, terminalY + 5);
    } else if (spec.special) {
      ctx.moveTo(0, baseY + height * 0.12);
      ctx.bezierCurveTo(reach * 0.26, baseY - height * 1.38, reach * 0.67, baseY + height * 0.32, terminalX, terminalY);
    } else {
      ctx.moveTo(4, baseY + height * 0.2);
      ctx.quadraticCurveTo(reach * 0.42, baseY - height * 0.9, terminalX, terminalY);
    }
    ctx.stroke();
    ctx.restore();

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = colorWithAlpha(rimColor, 0.16 + clarity * 0.13);
    ctx.lineWidth = (spec.kick || spec.sweep ? 2.1 : 1.7) + clarity * 0.7;
    ctx.beginPath();
    if (spec.sweep) {
      ctx.moveTo(-18, baseY + height * 0.36);
      ctx.quadraticCurveTo(reach * 0.42, baseY - height * 0.72, terminalX + clarity * 10, terminalY);
    } else if (spec.kick) {
      ctx.moveTo(12, baseY + height * 0.42);
      ctx.quadraticCurveTo(reach * 0.5, baseY - height * 1.5, terminalX + clarity * 8, terminalY);
    } else if (spec.special) {
      ctx.moveTo(2, baseY + height * 0.04);
      ctx.bezierCurveTo(reach * 0.28, baseY - height * 1.5, reach * 0.7, baseY + height * 0.22, terminalX + clarity * 8, terminalY);
    } else {
      ctx.moveTo(8, baseY + height * 0.16);
      ctx.quadraticCurveTo(reach * 0.46, baseY - height * 1.02, terminalX + clarity * 6, terminalY);
    }
    ctx.stroke();

    ctx.fillStyle = colorWithAlpha(coreColor, 0.08 + clarity * 0.07);
    ctx.beginPath();
    ctx.ellipse(terminalX + clarity * 8, terminalY, spec.kick || spec.sweep ? 15 + clarity * 7 : 12 + clarity * 5, spec.kick || spec.sweep ? 4 + clarity * 2 : 3.6 + clarity * 1.8, spec.sweep ? 0 : -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorWithAlpha(coreColor, 0.13 + strike * 0.22);
    ctx.lineWidth = (spec.kick || spec.sweep ? 3.5 : 2.8) + phase.snap * 1.2;
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
      ctx.strokeStyle = colorWithAlpha(rimColor, 0.1 + strike * 0.24);
      ctx.lineWidth = 2 + phase.snap * 1.2;
      for (let i = 0; i < 2; i += 1) {
        const lane = i === 0 ? -0.55 : 0.55;
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

    if (spec.kick) {
      ctx.strokeStyle = colorWithAlpha(coreColor, 0.08 + strike * 0.16);
      ctx.lineWidth = 2.2 + strike * 1.1;
      for (let i = 0; i < 2; i += 1) {
        const lane = i === 0 ? -0.55 : 0.55;
        ctx.beginPath();
        ctx.moveTo(18 + lane * 4, baseY + height * 0.46 + lane * 8);
        ctx.quadraticCurveTo(
          68 + frame.arcFan * 18,
          baseY - height * (1.42 + lane * 0.08),
          132 + frame.arcFan * 24,
          baseY - height * (0.2 - lane * 0.05)
        );
        ctx.stroke();
      }
    }

    if (spec.sweep) {
      ctx.strokeStyle = colorWithAlpha(coreColor, 0.09 + strike * 0.18);
      ctx.lineWidth = 2.8 + strike * 1.2;
      ctx.beginPath();
      ctx.moveTo(-20, -33 + yOffset);
      ctx.quadraticCurveTo(57 + frame.arcFan * 22, -64 + yOffset, 151 + frame.arcFan * 18, -37 + yOffset);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 220, 125, ${0.03 + strike * 0.055})`;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.ellipse(36 + i * 22 + strike * 18, -2 + yOffset + Math.sin(i) * 2, 9 + strike * 6, 3 + strike * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (spec.special) {
      ctx.strokeStyle = colorWithAlpha(rimColor, 0.1 + strike * 0.2);
      ctx.lineWidth = 1.3 + strike * 1.2;
      for (let i = 0; i < 2; i += 1) {
        const lane = i === 0 ? -0.65 : 0.65;
        ctx.beginPath();
        ctx.moveTo(12 + lane * 4, baseY + lane * 7);
        ctx.bezierCurveTo(
          42 + frame.arcFan * 18,
          baseY - height * (1.3 + lane * 0.12),
          88 + frame.arcFan * 22,
          baseY + height * (0.4 - lane * 0.12),
          126 + frame.arcFan * 30,
          baseY - height * (0.04 + lane * 0.04)
        );
        ctx.stroke();
      }
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.08 + strike * 0.13})`;
    ctx.lineWidth = Math.max(0.9, 1.3 + phase.snap * 0.7);
    for (let i = 0; i < 2; i += 1) {
      const lane = i === 0 ? -0.55 : 0.55;
      ctx.beginPath();
      ctx.moveTo(22 + lane * 7, baseY + lane * height * 0.34);
      ctx.quadraticCurveTo(reach * 0.48, baseY - height * (0.62 + lane * 0.08), reach * (0.86 + lane * 0.02), baseY + lane * height * 0.26);
      ctx.stroke();
    }
  }

  if (recover > 0.05) {
    ctx.strokeStyle = colorWithAlpha(trailColor, 0.035 + recover * 0.07);
    ctx.lineWidth = 1.1 + recover * 1.1;
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
  const motion = characterMotion(f);
  const rawDamage = winner ? Math.max(0, (f.damagePulse ?? 0) - resultFrame * 0.78) : (f.damagePulse ?? 0);
  const damage = clamp(rawDamage / 34, 0, 1);
  const level = clamp(f.damageLevel ?? 0, 0, 1.7);
  const styledDamage = clamp(damage * motion.damageFx, 0, 1.35);
  const styledLevel = level * motion.damageFx;
  const localizedImpact = localizedImpactProfile(f);
  const ko = winner && f.id !== roundWinnerId ? clamp(resultFrame / 58, 0, 1) : 0;
  if (damage <= 0.03 && ko <= 0.03) return;

  const localDir = (f.impactDir ?? f.dir) === f.dir ? 1 : -1;
  const shake = Math.sin((roundFrame + resultFrame) * 1.55) * damage * motion.impactShake;
  const zone = f.hitZone ?? "torso";
  const centerY = zone === "head" ? -136 + crouch : zone === "legs" ? -46 + crouch : -98 + crouch;
  const glowRx = zone === "head" ? 48 : zone === "legs" ? 62 : 58;
  const glowRy = zone === "head" ? 48 : zone === "legs" ? 44 : 92;
  const slashTop = zone === "head" ? -158 : zone === "legs" ? -62 : -138;
  const slashGap = zone === "legs" ? 18 : 33;
  const flavor = impactFlavorWarp(f.impactFlavor);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (damage > 0.03) {
    const glow = ctx.createRadialGradient(localDir * 16, centerY, 5, localDir * 10, centerY, 88 + styledLevel * 14);
    glow.addColorStop(0, `rgba(255, 247, 212, ${0.18 * styledDamage})`);
    glow.addColorStop(0.42, colorWithAlpha(flavor.highlight, 0.13 * styledDamage * level));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(localDir * 8, centerY, glowRx + styledLevel * 10, glowRy + styledLevel * 8, -localDir * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorWithAlpha(flavor.highlight, 0.36 * styledDamage);
    ctx.lineWidth = 2.2 + styledLevel * 1.8;
    for (let i = 0; i < 3; i += 1) {
      const lane = i - 1;
      const y = slashTop + crouch + lane * slashGap + shake * 5;
      ctx.beginPath();
      ctx.moveTo(localDir * (-44 - styledDamage * 8), y - lane * 6);
      ctx.lineTo(localDir * (-18 + styledDamage * 18), y + 13);
      ctx.moveTo(localDir * (37 + styledDamage * 10), y + 4);
      ctx.lineTo(localDir * (18 - styledDamage * 14), y + 17);
      ctx.stroke();
    }

    ctx.strokeStyle = colorWithAlpha(flavor.highlight, 0.16 * styledDamage * styledLevel);
    ctx.lineWidth = 6 + styledLevel * 2.5;
    ctx.beginPath();
    ctx.moveTo(localDir * -34, centerY - glowRy * 0.28);
    ctx.quadraticCurveTo(localDir * 8, centerY + shake * 8, localDir * 34, centerY + glowRy * 0.28);
    ctx.stroke();

    if (localizedImpact.t > 0.04) {
      const compression = localizedImpact.snap;
      const impactCenterX = -localizedImpact.localDir * (zone === "head" ? 18 : zone === "legs" ? 12 : 15);
      ctx.strokeStyle = colorWithAlpha(flavor.highlight, 0.2 * styledDamage + compression * 0.12 * motion.damageFx);
      ctx.lineWidth = 1.5 + compression * 1.9 * motion.damageFx;
      for (let i = 0; i < 3; i += 1) {
        const ring = i / 2;
        ctx.beginPath();
        ctx.ellipse(
          impactCenterX + localizedImpact.localDir * ring * 6,
          centerY + shake * 3,
          glowRx * (0.42 + ring * 0.18) + compression * 8,
          glowRy * (0.28 + ring * 0.12) + compression * 5,
          -localizedImpact.localDir * 0.16,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      ctx.strokeStyle = colorWithAlpha(flavor.highlight, 0.12 * styledLevel + compression * 0.08 * motion.damageFx);
      ctx.lineWidth = 4 + compression * 2.5 * motion.damageFx;
      ctx.beginPath();
      ctx.moveTo(impactCenterX - localizedImpact.localDir * (glowRx * 0.35), centerY - glowRy * 0.18);
      ctx.quadraticCurveTo(
        impactCenterX + localizedImpact.localDir * compression * 16,
        centerY + localizedImpact.shake * 7,
        impactCenterX + localizedImpact.localDir * (glowRx * 0.36),
        centerY + glowRy * 0.16
      );
      ctx.stroke();
    }
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
  const zone = f.hitZone ?? "torso";
  const centerY = zone === "head" ? -138 + crouch : zone === "legs" ? -48 + crouch : -102 + crouch;
  const flavor = impactFlavorWarp(f.impactFlavor);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(0, centerY, 8, 0, centerY, zone === "legs" ? 62 : 78);
  glow.addColorStop(0, `rgba(255, 248, 206, ${0.28 * alpha})`);
  glow.addColorStop(0.48, colorWithAlpha(flavor.highlight, 0.2 * alpha));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, centerY, zone === "legs" ? 64 : 58, zone === "head" ? 52 : zone === "legs" ? 46 : 86, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(flavor.highlight, 0.54 * alpha);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-34, centerY - 26);
  ctx.lineTo(30, centerY + 26);
  ctx.moveTo(22, centerY - 32);
  ctx.lineTo(-26, centerY + 36);
  ctx.stroke();

  if (contact > 0) {
    const dir = f.impactDir ?? f.dir;
    const localDir = dir === f.dir ? 1 : -1;
    ctx.translate(localDir * 18, centerY);
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

    ctx.strokeStyle = colorWithAlpha(flavor.highlight, 0.3 * contact);
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
    const entrance = 1 - smoothStep01(clamp(resultFrame / 58, 0, 1));
    const floorPulse = 0.5 + Math.sin(clock * 0.08) * 0.18 + entrance * 0.22;
    ctx.strokeStyle = colorWithAlpha(f.trim, 0.28 + floorPulse * 0.16);
    ctx.lineWidth = 3 + entrance * 2;
    ctx.beginPath();
    ctx.ellipse(0, -4 + crouch, 62 + floorPulse * 18, 13 + floorPulse * 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    const rayCount = isMobileFightView() ? 4 : 5;
    for (let i = 0; i < rayCount; i += 1) {
      const x = -50 + i * (100 / Math.max(1, rayCount - 1)) + Math.sin(clock * 0.04 + i) * 4;
      const top = -204 + crouch + Math.cos(clock * 0.03 + i) * 8;
      const bottom = -36 + crouch;
      const ray = ctx.createLinearGradient(x, top, x + 12, bottom);
      ray.addColorStop(0, colorWithAlpha(f.trim, 0));
      ray.addColorStop(0.44, colorWithAlpha(f.trim, 0.16 + entrance * 0.08));
      ray.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = ray;
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.lineTo(x + 14, top);
      ctx.stroke();
    }

    const spotlight = ctx.createRadialGradient(0, -142 + crouch, 12, 0, -96 + crouch, 126);
    spotlight.addColorStop(0, colorWithAlpha(f.trim, 0.22 + entrance * 0.12));
    spotlight.addColorStop(0.45, `rgba(255, 241, 189, ${0.08 + entrance * 0.08})`);
    spotlight.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spotlight;
    ctx.beginPath();
    ctx.ellipse(0, -96 + crouch, 78, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    if (f.profileId === "p2") {
      ctx.strokeStyle = "rgba(95, 240, 199, 0.22)";
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 3; i += 1) {
        const phase = clock * 0.035 + i * 0.72;
        ctx.beginPath();
        ctx.ellipse(Math.sin(phase) * 18, -120 + crouch + i * 12, 34 + i * 8, 10, phase * 0.12, 0, Math.PI * 1.45);
        ctx.stroke();
      }
    } else if (f.profileId === "p1") {
      ctx.strokeStyle = "rgba(91, 215, 255, 0.22)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-42, -34 + crouch);
      ctx.quadraticCurveTo(-17, -94 + crouch + Math.sin(clock * 0.05) * 6, -32, -164 + crouch);
      ctx.moveTo(43, -34 + crouch);
      ctx.quadraticCurveTo(17, -96 + crouch + Math.cos(clock * 0.05) * 6, 32, -166 + crouch);
      ctx.stroke();
    }
  } else {
    ctx.globalCompositeOperation = "source-over";
    const fall = smoothStep01(clamp(resultFrame / 56, 0, 1));
    const slam = 1 - smoothStep01(clamp((resultFrame - 4) / 36, 0, 1));
    const breath = 0.5 + Math.sin(clock * 0.06) * 0.5;
    ctx.fillStyle = `rgba(12, 8, 7, ${0.3 + fall * 0.16 + slam * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(0, -2 + crouch, 58 + fall * 24 + slam * 18, 10 + fall * 4 + slam * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.22 + breath * 0.08;
    ctx.strokeStyle = colorWithAlpha(f.trim, 0.28);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const x = -34 + i * 22 + Math.sin(clock * 0.05 + i) * 3;
      const y = -18 + crouch - Math.sin(clock * 0.07 + i) * 5;
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 3);
      ctx.quadraticCurveTo(x, y - 4 - fall * 4, x + 18, y + 1);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.2 * (1 - fall * 0.35);
    ctx.fillStyle = "rgba(255, 241, 189, 0.6)";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-18 + i * 18, -52 + crouch + Math.sin(clock * 0.08 + i) * 3, 5, 2.6, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    const dizzy = smoothStep01(clamp((resultFrame - 5) / 34, 0, 1));
    const fade = 1 - smoothStep01(clamp((resultFrame - 190) / 70, 0, 1));
    const starAlpha = dizzy * fade;
    if (starAlpha > 0.03) {
      const stars = fxCount(isMobileFightView() ? 3 : 4);
      const orbitX = 36 + fall * 8;
      const orbitY = 10 + fall * 2;
      const centerY = -142 + crouch + fall * 18;
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = starAlpha;
      for (let i = 0; i < stars; i += 1) {
        const angle = clock * 0.08 + i * ((Math.PI * 2) / stars);
        const x = Math.cos(angle) * orbitX;
        const y = centerY + Math.sin(angle) * orbitY;
        const scale = 0.78 + Math.sin(angle + clock * 0.05) * 0.18;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle * 1.7);
        ctx.fillStyle = "rgba(255, 238, 124, 0.82)";
        ctx.strokeStyle = colorWithAlpha(f.trim, 0.58);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const radius = (point % 2 === 0 ? 7.5 : 3.2) * scale;
          const a = -Math.PI / 2 + point * Math.PI / 5;
          const px = Math.cos(a) * radius;
          const py = Math.sin(a) * radius;
          if (point === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawEntrancePoseEffect(f, crouch) {
  const entrance = fighterEntranceCue(f);
  if (!entrance) return;
  const clock = 180 - countdownFrames;
  const alpha = clamp(entrance.ease * 0.22 + entrance.step * 0.08, 0.04, 0.28);
  const trim = f.trim ?? "#fff1bd";

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(trim, alpha);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, -3 + crouch, 42 + entrance.reveal * 28, 8 + entrance.reveal * 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  const trailSide = -entrance.side;
  const trailCount = isMobileFightView() ? 2 : 3;
  for (let i = 0; i < trailCount; i += 1) {
    const offset = trailSide * (34 + i * 18 + entrance.ease * 18);
    const height = f.profileId === "p2" ? 128 : 150;
    const drift = Math.sin(clock * 0.1 + i) * 4;
    const grad = ctx.createLinearGradient(offset, -36 + crouch, offset + trailSide * 12, -height + crouch);
    grad.addColorStop(0, colorWithAlpha(trim, alpha * 0.7));
    grad.addColorStop(0.62, colorWithAlpha(trim, alpha * 0.18));
    grad.addColorStop(1, colorWithAlpha(trim, 0));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4 + i * 0.45;
    ctx.beginPath();
    ctx.moveTo(offset, -34 + crouch);
    ctx.quadraticCurveTo(offset + trailSide * 11 + drift, -86 + crouch, offset + trailSide * 2, -height + crouch);
    ctx.stroke();
  }

  if (f.profileId === "p2") {
    ctx.strokeStyle = "rgba(255, 95, 111, 0.16)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, -104 + crouch, 48, 18, clock * 0.018, Math.PI * 0.05, Math.PI * 1.12);
    ctx.stroke();
  } else if (f.profileId === "p1") {
    ctx.strokeStyle = "rgba(91, 215, 255, 0.16)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-36, -28 + crouch);
    ctx.quadraticCurveTo(-4, -82 + crouch, -26, -142 + crouch);
    ctx.stroke();
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
  ctx.strokeStyle = isSweep ? "rgba(255, 232, 122, 0.24)" : `rgba(255, 247, 214, ${0.14 + snap * 0.07})`;
  ctx.lineWidth = (isSweep ? 2.4 : 1.9) + snap * 0.65;
  ctx.lineCap = "round";
  const origin = f.dir > 0 ? box.x - 22 : box.x + box.w + 22;
  const target = f.dir > 0 ? box.x + box.w * 0.72 : box.x + box.w * 0.28;
  const lineCount = spec.heavy ? 5 : 4;
  for (let i = 0; i < lineCount; i += 1) {
    const y = box.y + 6 + i * (box.h / lineCount);
    ctx.beginPath();
    ctx.moveTo(origin - f.dir * snap * 10, y + Math.sin(roundFrame * 0.4 + i) * 3);
    ctx.lineTo(target + f.dir * snap * 18, y - 6 + Math.cos(i) * 5);
    ctx.stroke();
  }
  ctx.strokeStyle = outfit.accent;
  ctx.globalAlpha = 0.16 + snap * 0.08;
  ctx.lineWidth = 1.2 + snap * 0.45;
  for (let i = 0; i < 2; i += 1) {
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
  const motion = characterMotion(f);
  const read = attackReadabilityProfile(f);
  const isKick = spec.kick || spec.sweep;
  const kickArcScale = spec.kick ? 0.68 : 1;
  const progress = Math.max(phase.strike, phase.snap * 0.9, phase.anticipation * 0.35, phase.followThrough * 0.28, phase.recovery * 0.22);
  const outfit = outfitSpec(f);
  const x = f.dir > 0 ? box.x + box.w * 0.28 : box.x + box.w * 0.72;
  const y = box.y + box.h * 0.45;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(x, y);
  ctx.scale(f.dir * FIGHTER_SCALE, FIGHTER_SCALE);
  ctx.rotate((spec.sweep ? 0.02 : isKick ? -0.16 : -0.06) * motion.rotation);

  const arcReach = (spec.kick ? 92 : isKick ? 106 : spec.special ? 96 : 82) * motion.reach * (0.96 + read.clarity * 0.06);
  const arcHeight = (spec.kick ? 19 : isKick ? 29 : 21) * motion.lift;
  const glow = ctx.createRadialGradient(24, 0, 4, 24, 0, arcReach);
  glow.addColorStop(
    0,
    spec.heavy
      ? `rgba(255, 231, 122, ${(0.17 + motion.force * 0.025) * kickArcScale})`
      : `rgba(155, 231, 255, ${0.14 + motion.afterimage * 0.04})`
  );
  glow.addColorStop(0.38, colorWithAlpha(outfit.accent, 0.08 + phase.snap * 0.04));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(22 + phase.snap * 8, 0, spec.kick ? 82 * motion.reach : isKick ? 100 * motion.reach : 78 * motion.reach, arcHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(outfit.accent, 0.78);
  ctx.globalAlpha = (0.08 + phase.anticipation * 0.025 + phase.strike * 0.17 + phase.recovery * 0.045)
    * clamp(0.78 + motion.afterimage * 0.06, 0.72, 0.92)
    * kickArcScale;
  ctx.lineWidth = ((spec.kick ? 4.4 : isKick ? 6 : 4.8) + phase.strike * 1.1 + phase.snap * 1.2) * (f.profileId === "p1" ? 1.08 : 0.84);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-12 - phase.anticipation * 12, 13 + phase.anticipation * 5);
  ctx.quadraticCurveTo(
    32,
    (-34 - phase.strike * 8 - phase.snap * 8) * motion.lift,
    spec.kick ? 112 * motion.reach + phase.strike * 14 + phase.snap * 14 : isKick ? 134 * motion.reach + phase.strike * 18 + phase.snap * 18 : 96 * motion.reach + phase.strike * 14 + phase.snap * 12,
    -10 * motion.lift
  );
  ctx.stroke();

  ctx.strokeStyle = spec.color;
  ctx.globalAlpha = (0.11 + phase.strike * 0.2 + phase.snap * 0.1 + phase.recovery * 0.045) * kickArcScale;
  ctx.lineWidth = ((spec.kick ? 2.8 : isKick ? 3.8 : 2.8) + phase.strike * 0.7) * (f.profileId === "p1" ? 1.06 : 0.84);
  ctx.beginPath();
  ctx.moveTo(-10 - phase.anticipation * 10, 8 + phase.anticipation * 4);
  ctx.quadraticCurveTo(
    34,
    (-28 - phase.strike * 8 - phase.snap * 6) * motion.lift,
    spec.kick ? 106 * motion.reach + phase.strike * 12 + phase.snap * 12 : isKick ? 126 * motion.reach + phase.strike * 16 + phase.snap * 16 : 88 * motion.reach + phase.strike * 12 + phase.snap * 10,
    -8 * motion.lift
  );
  ctx.stroke();

  if (phase.snap > 0.05) {
    ctx.fillStyle = `rgba(255,255,255,${(0.08 + phase.snap * 0.13) * kickArcScale})`;
    ctx.beginPath();
    ctx.ellipse(spec.kick ? 102 : isKick ? 118 : 82, -9, 16 + phase.snap * (spec.kick ? 8 : 12), 5 + phase.snap * 3, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  const pointAlpha = clamp((phase.strike * 0.13 + phase.snap * 0.14 + phase.followThrough * 0.045) * kickArcScale, 0, 0.24);
  if (pointAlpha > 0.035) {
    const tipX = spec.kick ? 108 + phase.snap * 12 : isKick ? 126 + phase.snap * 18 : spec.special ? 108 + phase.snap * 16 : 88 + phase.snap * 12;
    const tipY = isKick ? -11 : spec.special ? -16 : -10;
    ctx.globalAlpha = pointAlpha;
    ctx.fillStyle = colorWithAlpha(spec.core, 0.7);
    ctx.beginPath();
    ctx.ellipse(tipX, tipY, spec.kick ? 13 + read.clarity * 5 : isKick ? 18 + read.clarity * 8 : 13 + read.clarity * 5, isKick ? 5.6 + read.clarity * 2 : 4.2 + read.clarity * 1.5, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha("#ffffff", 0.34);
    ctx.lineWidth = 0.9 + read.clarity * 0.45;
    ctx.beginPath();
    ctx.moveTo(tipX - 12, tipY - 5);
    ctx.lineTo(tipX + 12 + read.clarity * 6, tipY - 2);
    ctx.stroke();
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
  const windupLoad = Math.max(Math.sin(windupT * Math.PI) * 0.5, smoothStep01(windupT) * 0.95);
  const windupCarry = attack.frame >= attack.activeStart && attack.frame <= attack.activeStart + 5
    ? (1 - clamp((attack.frame - attack.activeStart) / 5, 0, 1)) * 0.42
    : 0;
  const strikeCarry = attack.frame > attack.activeEnd && attack.frame <= attack.activeEnd + 6
    ? (1 - clamp((attack.frame - attack.activeEnd) / 6, 0, 1)) * 0.36
    : 0;
  const anticipation = attack.frame < attack.activeStart ? windupLoad : windupCarry;
  const strike = attack.frame >= attack.activeStart && attack.frame <= attack.activeEnd ? Math.sin(strikeT * Math.PI) : strikeCarry;
  const recovery = attack.frame > attack.activeEnd ? Math.sin(recoveryT * Math.PI) : 0;
  const settle = attack.frame > attack.activeEnd ? smoothStep01(recoveryT) : 0;
  const snap = attack.frame >= attack.activeStart && attack.frame <= attack.activeStart + 5
    ? 1 - clamp((attack.frame - attack.activeStart) / 5, 0, 1)
    : 0;
  const followThrough = attack.frame > attack.activeEnd && attack.frame <= attack.activeEnd + 6
    ? Math.sin(clamp((attack.frame - attack.activeEnd) / 6, 0, 1) * Math.PI)
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

function attackMassProfile(f) {
  const attack = f?.attack;
  if (!attack) {
    return {
      active: 0,
      load: 0,
      drive: 0,
      snap: 0,
      follow: 0,
      recover: 0,
      plant: 0,
      brace: 0,
      lift: 0,
      crush: 0,
      typeWeight: 1,
      footSide: -1,
    };
  }

  const phase = attackPhase(attack);
  const type = attack.type;
  const heavy = type === "kick" || type === "airKick" || type === "sweep" || type === "special" || type === "grab";
  const low = type === "sweep";
  const air = type === "airPunch" || type === "airKick";
  const motion = characterMotion(f);
  const typeWeight =
    type === "special" ? 1.3 :
    type === "sweep" ? 1.18 :
    type === "kick" || type === "airKick" ? 1.14 :
    type === "grab" ? 1.08 :
    1;
  const styledWeight = typeWeight * motion.force;
  const load = phase.anticipation * styledWeight * motion.load;
  const drive = Math.max(phase.strike, phase.snap * 1.05) * styledWeight * motion.drive;
  const follow = Math.max(phase.followThrough, phase.recovery * 0.42) * styledWeight * motion.recover;
  const recover = phase.recovery * styledWeight * motion.recover;
  const plant = clamp((load * 0.62 + drive * (heavy ? 0.72 : 0.55) + follow * 0.34) * motion.plant, 0, 1.65);
  const brace = clamp((load * (heavy ? 1.05 : 0.85) + recover * 0.38) * motion.brace, 0, 1.55);
  const lift = (air ? drive * 0.5 : low ? -drive * 0.42 : drive * (heavy ? 0.42 : 0.24)) * motion.lift;
  const crush = clamp((load * 0.55 + plant * 0.34 + follow * 0.2) * motion.crush, 0, 1.55);
  const footSide = type === "grab" ? 1 : -1;

  return {
    active: Math.max(load * 0.85, drive, follow * 0.72, recover * 0.42),
    load,
    drive,
    snap: phase.snap * typeWeight,
    follow,
    recover,
    plant,
    brace,
    lift,
    crush,
    typeWeight: styledWeight,
    footSide,
  };
}

function attackBodyWeightProfile(f) {
  const attack = f?.attack;
  if (!attack) {
    return {
      active: 0,
      load: 0,
      drive: 0,
      follow: 0,
      recover: 0,
      plant: 0,
      brace: 0,
      compression: 0,
      lift: 0,
      low: 0,
      recoil: 0,
      footSide: -1,
      freeSide: 1,
      grounded: 0,
    };
  }

  const phase = attackPhase(attack);
  const mass = attackMassProfile(f);
  const spec = attackVisualSpec(attack.type);
  const motion = characterMotion(f);
  const grounded = f?.grounded ? 1 : 0.48;
  const profileMass = f?.profileId === "p1" ? 1.12 : f?.profileId === "p2" ? 0.88 : f?.profileId === "p3" ? 1.24 : 1;
  const recoveryStyle = f?.profileId === "p2" ? 0.86 : f?.profileId === "p1" ? 1.08 : f?.profileId === "p3" ? 1.18 : 1;
  const attackWeight = spec.special ? 1.18 : spec.sweep ? 1.14 : spec.kick ? 1.1 : spec.grab ? 1.04 : 0.94;
  const launchWeight = spec.sweep ? 0.88 : spec.kick ? 1.08 : spec.special ? 1.02 : 0.96;
  const load = clamp((mass.load * 0.82 + phase.anticipation * 0.22) * profileMass * attackWeight * grounded, 0, 1.75);
  const drive = clamp((mass.drive * 0.74 + mass.snap * 0.34) * launchWeight * grounded, 0, 1.95);
  const follow = clamp((mass.follow * 0.72 + phase.followThrough * 0.32) * profileMass, 0, 1.55);
  const recover = clamp((mass.recover * 0.82 + phase.recovery * 0.28) * recoveryStyle, 0, 1.65);
  const brace = clamp((mass.brace * 0.54 + load * 0.68 + recover * 0.16) * grounded, 0, 1.7);
  const plant = clamp((mass.plant * 0.76 + brace * 0.3 + drive * 0.18) * grounded, 0, 1.9);
  const compression = clamp((load * 0.5 + plant * 0.34 + recover * 0.14) * (0.92 + motion.crush * 0.08), 0, 1.6);
  const lift = clamp((Math.max(0, mass.lift) * 0.42 + drive * (spec.kick ? 0.26 : spec.special ? 0.18 : 0.12)) * (0.88 + motion.lift * 0.12), 0, 1.2);
  const low = clamp(spec.sweep ? drive * 0.68 + load * 0.2 : 0, 0, 1.25);
  const recoil = clamp(recover * 0.78 + follow * 0.36, 0, 1.55);
  const footSide = mass.footSide || -1;

  return {
    active: Math.max(load * 0.84, drive, plant * 0.62, recoil * 0.45),
    load,
    drive,
    follow,
    recover,
    plant,
    brace,
    compression,
    lift,
    low,
    recoil,
    footSide,
    freeSide: -footSide,
    grounded,
  };
}

function attackChainProfile(f, currentType = "") {
  const max = Math.max(1, f?.attackChainMax ?? 1);
  const raw = clamp((f?.attackChainPulse ?? 0) / max, 0, 1);
  const active = f?.attack ? smoothStep01(raw) : 0;
  const handoff = f?.attack ? Math.sin((1 - raw) * Math.PI) : 0;
  const combo = clamp((f?.comboPulse ?? 0) / 22, 0, 1);
  const from = f?.attackChainFrom || f?.lastAttackType || "";
  const to = currentType || f?.attackChainTo || "";
  const fromKick = from === "kick" || from === "airKick" || from === "sweep";
  const toKick = to === "kick" || to === "airKick" || to === "sweep";
  const fromPunch = from === "punch" || from === "airPunch" || from === "grab";
  const toPunch = to === "punch" || to === "airPunch" || to === "grab";
  const special = from === "special" || to === "special";

  return {
    active: clamp(active + combo * 0.12, 0, 1.2),
    handoff: clamp(handoff + combo * 0.1, 0, 1.15),
    combo,
    from,
    to,
    fromKick,
    toKick,
    fromPunch,
    toPunch,
    special,
    sameFamily: (fromKick && toKick) || (fromPunch && toPunch) || from === to,
  };
}

function styleAttackFrameForCharacter(f, type, frame) {
  const motion = characterMotion(f);
  const special = type === "special";
  const sweep = type === "sweep";
  const forwardBias = f?.profileId === "p1"
    ? frame.active * (special ? 0.7 : sweep ? 0.45 : 0.9)
    : 0;
  const liftBias = f?.profileId === "p2"
    ? -frame.active * (special ? 1.2 : sweep ? 0.3 : 0.7)
    : frame.active * 0.2;

  return {
    ...frame,
    bodyX: frame.bodyX * motion.reach + forwardBias,
    bodyY: frame.bodyY * motion.lift + liftBias,
    rotation: frame.rotation * motion.rotation,
    scaleX: 1 + (frame.scaleX - 1) * motion.stretchX,
    scaleY: 1 + (frame.scaleY - 1) * motion.stretchY,
    afterimage: frame.afterimage * motion.afterimage,
    bandT: frame.bandT * (f?.profileId === "p1" ? 1.08 : 1),
    bandShiftX: frame.bandShiftX * motion.reach + forwardBias * 1.6,
    bandShiftY: frame.bandShiftY * motion.lift + liftBias * 0.8,
    bandRotate: frame.bandRotate * motion.rotation,
    bandScaleX: 1 + (frame.bandScaleX - 1) * motion.stretchX,
    bandScaleY: 1 + (frame.bandScaleY - 1) * motion.stretchY,
    arcFan: frame.arcFan * motion.arcFan,
  };
}

function attackFrameProfile(f) {
  const attack = f.attack;
  if (!attack) {
    return {
      active: 0,
      bodyX: 0,
      bodyY: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      afterimage: 0,
      band: "torso",
      bandT: 0,
      bandShiftX: 0,
      bandShiftY: 0,
      bandRotate: 0,
      bandScaleX: 1,
      bandScaleY: 1,
      arcFan: 0,
    };
  }

  const phase = attackPhase(attack);
  const wind = phase.anticipation;
  const strike = phase.strike;
  const snap = phase.snap;
  const follow = phase.followThrough;
  const recover = phase.recovery;
  const drive = Math.max(strike, snap * 1.08);
  const recoil = Math.max(follow, recover * 0.68);
  const type = attack.type;

  if (type === "kick" || type === "airKick") {
    const grounded = f.grounded ? 1 : 0.62;
    return styleAttackFrameForCharacter(f, type, {
      active: Math.max(wind * 0.7, drive, recoil * 0.55),
      bodyX: -wind * (3.1 * grounded) + drive * 3.95 - recoil * 1.5,
      bodyY: wind * (2.35 * grounded) - drive * 2.35 + recoil * 1.05,
      rotation: -wind * (0.044 * grounded) + drive * 0.056 - recoil * 0.024,
      scaleX: 1 + wind * (0.018 * grounded) + drive * 0.03,
      scaleY: 1 - wind * (0.02 * grounded) - drive * 0.021 + recoil * 0.006,
      afterimage: drive * 0.07 + snap * 0.045,
      band: "legs",
      bandT: Math.max(wind * 0.44, drive, recoil * 0.42),
      bandShiftX: -wind * (12 * grounded) + drive * 25 - recoil * 5,
      bandShiftY: wind * (5.5 * grounded) - drive * 6.3 + recoil * 2.2,
      bandRotate: -wind * (0.052 * grounded) - drive * 0.1 + recoil * 0.036,
      bandScaleX: 1 + drive * 0.076,
      bandScaleY: 1 - drive * 0.04,
      arcFan: drive,
    });
  }

  if (type === "sweep") {
    return styleAttackFrameForCharacter(f, type, {
      active: Math.max(wind * 0.85, drive, recoil * 0.62),
      bodyX: -wind * 1.3 + drive * 2.55 - recoil * 0.8,
      bodyY: wind * 2.9 + drive * 3.9 + recoil * 1.2,
      rotation: wind * 0.022 + drive * 0.072 - recoil * 0.03,
      scaleX: 1 + drive * 0.038,
      scaleY: 1 - wind * 0.018 - drive * 0.045,
      afterimage: drive * 0.06 + snap * 0.038,
      band: "legs",
      bandT: Math.max(wind * 0.58, drive, recoil * 0.48),
      bandShiftX: -wind * 5 + drive * 26 - recoil * 8,
      bandShiftY: wind * 3 + drive * 8 + recoil * 2,
      bandRotate: wind * 0.04 + drive * 0.11 - recoil * 0.045,
      bandScaleX: 1 + drive * 0.07,
      bandScaleY: 1 - drive * 0.055,
      arcFan: drive,
    });
  }

  if (type === "special") {
    const profileWeight = f.profileId === "p2" ? 1.06 : f.profileId === "p1" ? 1.12 : 1;
    return styleAttackFrameForCharacter(f, type, {
      active: Math.max(wind, drive, recoil * 0.65) * profileWeight,
      bodyX: (-wind * 1.8 + drive * 4.15 - recoil * 1.05) * profileWeight,
      bodyY: (-wind * 0.2 - drive * 1.8 + recoil * 0.55) * profileWeight,
      rotation: (-wind * 0.02 + drive * 0.052 - recoil * 0.02) * profileWeight,
      scaleX: 1 - wind * 0.006 + drive * 0.02,
      scaleY: 1 + wind * 0.01 - drive * 0.012,
      afterimage: wind * 0.035 + drive * 0.09 + snap * 0.052,
      band: "torso",
      bandT: Math.max(wind * 0.72, drive, recoil * 0.44),
      bandShiftX: -wind * 5 + drive * 14 - recoil * 4,
      bandShiftY: -wind * 3 - drive * 5 + recoil * 2,
      bandRotate: -wind * 0.032 + drive * 0.062 - recoil * 0.018,
      bandScaleX: 1 + drive * 0.038,
      bandScaleY: 1 - drive * 0.02 + wind * 0.012,
      arcFan: Math.max(wind * 0.7, drive),
    });
  }

  return styleAttackFrameForCharacter(f, type, {
    active: Math.max(wind * 0.6, drive, recoil * 0.45),
    bodyX: -wind * 1.25 + drive * 2.25 - recoil * 0.65,
    bodyY: wind * 0.45 - drive * 0.8 + recoil * 0.4,
    rotation: -wind * 0.018 + drive * 0.032 - recoil * 0.01,
    scaleX: 1 + drive * 0.016,
    scaleY: 1 - drive * 0.009,
    afterimage: drive * 0.04 + snap * 0.032,
    band: "arms",
    bandT: Math.max(wind * 0.35, drive, recoil * 0.32),
    bandShiftX: -wind * 6 + drive * 18 - recoil * 4,
    bandShiftY: -drive * 3.4 + recoil * 1.2,
    bandRotate: -wind * 0.03 + drive * 0.076,
    bandScaleX: 1 + drive * 0.052,
    bandScaleY: 1 - drive * 0.022,
    arcFan: drive,
  });
}

function headActingProfile(f, stride = 0) {
  const localizedImpact = localizedImpactProfile(f);
  const phase = attackPhase(f.attack);
  const type = f.attack?.type ?? "";
  const dir = f.dir || 1;
  const motion = characterMotion(f);
  const speed = clamp(Math.abs(f.vx ?? 0) / 3.35, 0, 1.3);
  const walkSway = Math.sin((f.walkCycle ?? roundFrame * 0.2) + 0.7) * speed * motion.headSway;
  const attackDrive = f.attack ? Math.max(phase.strike, phase.snap * 1.1, phase.followThrough * 0.65) : 0;
  const attackPrep = f.attack ? phase.anticipation : 0;
  const attackRecover = f.attack ? phase.recovery : 0;
  const headHit =
    localizedImpact.zone === "head" && f.hitZone !== "guard"
      ? localizedImpact.snap
      : f.hurt > 0
        ? localizedImpact.rebound * 0.14
        : 0;
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const specialFocus = type === "special" ? Math.max(phase.anticipation * 0.8, phase.strike, phase.snap) : 0;
  const kickFocus = type === "kick" || type === "airKick" || type === "sweep" ? attackDrive : 0;
  const hurtSquint = clamp((f.hurt ?? 0) / 26, 0, 1);
  const faceImpactMax = Math.max(1, f.faceImpactMax ?? 1);
  const faceImpactT = clamp((f.faceImpactPulse ?? 0) / faceImpactMax, 0, 1);
  const faceImpact = smoothStep01(faceImpactT) * clamp(f.faceImpactStrength ?? 0, 0, 1.45);
  const faceImpactDir = (f.faceImpactDir ?? f.impactDir ?? dir) === dir ? 1 : -1;
  const faceHead = (f.faceImpactZone ?? localizedImpact.zone) === "head";
  const reactionMax = Math.max(1, f.reactionMax ?? 1);
  const reactionT = smoothStep01(clamp((f.reactionPulse ?? 0) / reactionMax, 0, 1));
  const contactT = clamp((f.contactFlash ?? 0) / 14, 0, 1);
  const reactionHeavy =
    f.reactionKind === "finish" ? 1.38 :
    f.reactionKind === "counter" || f.reactionKind === "blast" ? 1.18 :
    f.reactionKind === "heavy" ? 1.08 :
    0.82;
  const receivingDrama = clamp(
    Math.max(
      faceImpact * (faceHead ? 1.18 : 0.78),
      localizedImpact.snap * (faceHead ? 1.08 : 0.62),
      reactionT * reactionHeavy,
      contactT * (faceHead ? 0.92 : 0.58),
    ),
    0,
    1.72,
  );
  const attackingDrama = f.attack
    ? clamp(
        Math.max(phase.snap * 1.08, phase.strike * 0.86, phase.followThrough * 0.46) *
          (type === "special" ? 1.34 : type === "kick" || type === "airKick" || type === "sweep" ? 1.12 : 0.92),
        0,
        1.5,
      )
    : 0;
  const profileExpression = f.profileId === "p2" ? 1.08 : f.profileId === "p1" ? 0.94 : 1;
  const accessoryDrama = clamp(speed * 0.28 + attackingDrama * 0.54 + receivingDrama * 0.78 + guardHit * 0.24, 0, 2.35);
  const effort = clamp(attackPrep * 0.5 + attackDrive * 0.85 + specialFocus * 0.25 + guardHit * 0.55 + headHit * 0.8 + faceImpact * 0.68, 0, 1.9);
  let attackTurn = 0.024;
  if (type === "special") attackTurn = 0.052;
  else if (type === "sweep") attackTurn = 0.04;
  else if (type === "kick" || type === "airKick") attackTurn = 0.034;

  return {
    x:
      -localizedImpact.localDir * headHit * 5.6 +
      -faceImpactDir * faceImpact * (faceHead ? 5.2 : 2.4) +
      localizedImpact.shake * 0.8 -
      faceImpactDir * receivingDrama * (faceHead ? 2.2 : 1.1) +
      dir * attackPrep * 2.2 * motion.headPrep +
      dir * attackDrive * (type === "special" ? 2.2 : 1.35) * motion.headDrive +
      dir * attackingDrama * (f.profileId === "p1" ? 0.8 : 0.46) * motion.headDrive +
      walkSway * 1.1,
    y:
      -headHit * 2.2 +
      -faceImpact * (faceHead ? 1.4 : 0.45) +
      -receivingDrama * (faceHead ? 0.9 : 0.28) +
      (localizedImpact.zone === "legs" ? localizedImpact.rebound * 1.2 : 0) -
      specialFocus * 1.6 * motion.headDrive +
      kickFocus * 0.85 * motion.lift -
      attackingDrama * (f.profileId === "p2" ? 0.62 : 0.34) +
      guard * 0.6,
    rotation:
      (stride * 0.018) -
      localizedImpact.localDir * headHit * 0.075 +
      -faceImpactDir * faceImpact * (faceHead ? 0.052 : 0.022) +
      -faceImpactDir * receivingDrama * (faceHead ? 0.034 : 0.016) +
      localizedImpact.shake * 0.012 -
      dir * attackPrep * 0.025 * motion.headPrep +
      dir * attackDrive * attackTurn * motion.rotation -
      dir * attackingDrama * (type === "special" ? 0.018 : 0.01) * motion.rotation -
      dir * attackRecover * 0.014 * motion.headRecover -
      dir * guardHit * 0.045 +
      walkSway * 0.01,
    scaleX: 1 + headHit * 0.024 + attackDrive * 0.006 * motion.stretchX + receivingDrama * 0.008,
    scaleY: 1 - headHit * 0.018 - attackDrive * 0.004 * motion.stretchY + guardHit * 0.006 - faceImpact * 0.01 - receivingDrama * 0.006,
    focus: clamp(effort + hurtSquint * 0.4 + attackingDrama * 0.2, 0, 1.55),
    squint: clamp((hurtSquint * 0.75 + attackDrive * 0.42 + guardHit * 0.55 + faceImpact * (faceHead ? 0.78 : 0.38) + attackingDrama * 0.16) * profileExpression, 0, 1.32),
    cheek: clamp(attackDrive * 0.45 + headHit * 0.8 + guardHit * 0.45 + faceImpact * 0.62 + receivingDrama * 0.22, 0, 1.24),
    grimace: clamp((faceImpact * (faceHead ? 1.1 : 0.68) + hurtSquint * 0.28 + receivingDrama * 0.42) * profileExpression, 0, 1.36),
    shock: clamp(receivingDrama * (faceHead ? 1.05 : 0.72) + guardHit * 0.28, 0, 1.46),
    strain: clamp(attackingDrama * 0.92 + specialFocus * 0.22 + receivingDrama * 0.18, 0, 1.42),
    snapDir: faceImpactDir,
    hairWhip: accessoryDrama,
    bandanaFlutter: clamp((speed * 0.45 + attackDrive * 0.95 + specialFocus * 0.85 + guardHit * 0.55 + headHit * 0.9 + accessoryDrama * 0.72) * motion.accessory, 0, 2.65),
    bandanaLift: (-attackDrive * 2.8 - specialFocus * 3.2 - accessoryDrama * 1.12) * motion.accessory + headHit * 1.4 + guardHit * 1.8 + receivingDrama * 0.7,
  };
}

function getPose(f, stride) {
  const spec = bodySpec(f);
  const motion = characterMotion(f);
  const guardProfile = characterGuard(f);
  const crouch = f.crouch * 18;
  const phase = attackPhase(f.attack);
  const progress = f.attack ? phase.power : 0;
  const attackType = f.attack?.type;
  const attackMass = f.attack ? attackMassProfile(f) : null;
  const bodyWeight = f.attack ? attackBodyWeightProfile(f) : null;
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

  const walkingPose = f.grounded && f.hurt <= 0 && !f.attack && Math.abs(f.vx) > 0.45;
  if (walkingPose) {
    const weight = clamp((f.walkWeight ?? 0) * motion.walkWeight, 0, 1.35);
    const plant = clamp(f.walkPlant ?? 0, 0, 1);
    const anchor = clamp((f.walkAnchorPulse ?? 0) / 12, 0, 1);
    const push = clamp((f.walkPushPulse ?? 0) / 9, 0, 1);
    const anchorSide = f.walkAnchorSide || f.footPlantSide || 1;
    const frontAnchor = anchorSide > 0 ? anchor : 0;
    const backAnchor = anchorSide < 0 ? anchor : 0;
    const lift = (1 - plant * 0.35) * weight * motion.walkLift;
    const frontLift = Math.max(0, -stride) * lift * (1 + backAnchor * 0.28);
    const backLift = Math.max(0, stride) * lift * (1 + frontAnchor * 0.28);
    const moveLocal = Math.sign(f.vx) === f.dir ? 1 : -1;
    base.torsoTilt += moveLocal * stride * 0.018 * weight - moveLocal * push * 0.012 * motion.walkPush + (backAnchor - frontAnchor) * 0.008;
    base.frontLeg.knee.x += moveLocal * frontLift * 4 * spec.stance;
    base.frontLeg.knee.y -= frontLift * 5;
    base.frontLeg.foot.x += moveLocal * frontLift * 6 * spec.stance;
    base.frontLeg.foot.y -= frontLift * 8.5;
    base.backLeg.knee.x -= moveLocal * backLift * 3.5 * spec.stance;
    base.backLeg.knee.y -= backLift * 4.5;
    base.backLeg.foot.x -= moveLocal * backLift * 5.5 * spec.stance;
    base.backLeg.foot.y -= backLift * 7.5;
    base.frontLeg.knee.y += frontAnchor * 3.4;
    base.frontLeg.foot.y += frontAnchor * 1.2;
    base.frontLeg.foot.x += moveLocal * frontAnchor * 3.2 * spec.stance;
    base.backLeg.knee.y += backAnchor * 3.4;
    base.backLeg.foot.y += backAnchor * 1.2;
    base.backLeg.foot.x -= moveLocal * backAnchor * 3.2 * spec.stance;
    base.frontLeg.plant = clamp(plant + Math.max(0, stride) * 0.3 + frontAnchor * 0.28, 0, 1);
    base.backLeg.plant = clamp(plant + Math.max(0, -stride) * 0.3 + backAnchor * 0.28, 0, 1);
    base.frontLeg.lift = frontLift;
    base.backLeg.lift = backLift;
  }

  const braceT = clamp(Math.max(f.rangePressure ?? 0, (f.bracePulse ?? 0) / 14), 0, 1);
  if (braceT > 0.02 && f.grounded && f.hurt <= 0 && !f.attack) {
    base.torsoTilt -= (f.rangeSide || f.dir || 1) * braceT * 0.026;
    base.frontLeg.knee.y += braceT * 5;
    base.backLeg.knee.y += braceT * 5;
    base.frontLeg.foot.x += 8 * braceT * spec.stance;
    base.backLeg.foot.x -= 10 * braceT * spec.stance;
    base.frontLeg.plant = Math.max(base.frontLeg.plant ?? 0, braceT);
    base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, braceT * 0.82);
  }

  const airKickLandingPose = f.grounded ? smoothStep01(clamp((f.airKickLandingPulse ?? 0) / 16, 0, 1)) : 0;
  if (airKickLandingPose > 0.03 && f.hurt <= 0 && !f.attack && !winner) {
    const press = airKickLandingPose * (f.profileId === "p1" ? 1.12 : f.profileId === "p2" ? 0.84 : 1);
    const landingDir = (f.airKickDir || f.landingDir || f.dir || 1) === (f.dir || 1) ? 1 : -1;
    base.torsoTilt += landingDir * press * 0.028;
    base.frontLeg.knee.y += press * 6.5;
    base.frontLeg.foot.x += landingDir * press * 5 * spec.stance;
    base.backLeg.knee.y += press * 8.5;
    base.backLeg.foot.x -= landingDir * press * 9 * spec.stance;
    base.frontLeg.plant = Math.max(base.frontLeg.plant ?? 0, press * 0.72);
    base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, press * 0.94);
    base.frontArm.hand.y += press * 5;
    base.backArm.hand.y += press * 3;
  }

  const attackEntryT = clamp((f.attackEntryPulse ?? 0) / 14, 0, 1);
  const attackRecoverT = clamp((f.attackRecoverPulse ?? 0) / 16, 0, 1);
  const guardEntryT = clamp((f.guardEntryPulse ?? 0) / 12, 0, 1);
  const guardExitT = clamp((f.guardExitPulse ?? 0) / 10, 0, 1);
  const hurtRecoverT = clamp((f.hurtRecoverPulse ?? 0) / 14, 0, 1);
  const moveTurnT = clamp((f.moveTurnPulse ?? 0) / 10, 0, 1);
  const counterReadyT = clamp((f.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);

  if (f.blocking) {
    if (f.profileId === "p1") {
      base.torsoTilt -= 0.045;
      base.frontArm = {
        shoulder: { x: 25, y: shoulderY + 1 },
        elbow: { x: 34, y: -130 + crouch },
        hand: { x: 31, y: -108 + crouch },
      };
      base.backArm = {
        shoulder: { x: -24, y: shoulderY + 7 },
        elbow: { x: 7, y: -128 + crouch },
        hand: { x: 10, y: -104 + crouch },
      };
      base.frontLeg.knee.x += 11;
      base.frontLeg.knee.y += 4;
      base.frontLeg.foot.x += 7 * spec.stance;
      base.backLeg.knee.y += 7;
      base.backLeg.foot.x -= 14 * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, 0.9);
      base.frontLeg.plant = Math.max(base.frontLeg.plant ?? 0, 0.7);
    } else if (f.profileId === "p2") {
      base.torsoTilt -= 0.016;
      base.frontArm = {
        shoulder: { x: 28, y: shoulderY - 2 },
        elbow: { x: 47, y: -135 + crouch },
        hand: { x: 48, y: -116 + crouch },
      };
      base.backArm = {
        shoulder: { x: -24, y: shoulderY + 5 },
        elbow: { x: 12, y: -125 + crouch },
        hand: { x: 5, y: -94 + crouch },
      };
      base.frontLeg.knee.x += 5;
      base.frontLeg.foot.x += 3 * spec.stance;
      base.frontLeg.foot.y -= 1.5;
      base.backLeg.foot.x -= 6 * spec.stance;
      base.backLeg.foot.y -= 1;
      base.frontLeg.plant = Math.max(base.frontLeg.plant ?? 0, 0.42);
    } else if (f.profileId === "p6") {
      base.torsoTilt -= 0.026;
      base.frontArm = {
        shoulder: { x: 27, y: shoulderY - 1 },
        elbow: { x: 42, y: -132 + crouch },
        hand: { x: 42, y: -111 + crouch },
      };
      base.backArm = {
        shoulder: { x: -25, y: shoulderY + 5 },
        elbow: { x: 7, y: -126 + crouch },
        hand: { x: 4, y: -100 + crouch },
      };
      base.frontLeg.knee.x += 6;
      base.frontLeg.foot.x += 5 * spec.stance;
      base.backLeg.foot.x -= 9 * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, 0.82);
      base.frontLeg.plant = Math.max(base.frontLeg.plant ?? 0, 0.62);
    } else {
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
  }

  if (attackType === "punch" || attackType === "airPunch") {
    const mass = attackMass ?? attackMassProfile(null);
    const drive = mass.drive + mass.snap * 0.32;
    const load = mass.load;
    base.frontArm.elbow = { x: 48 - windup * 14 + activePulse * 46 - recovery * 9, y: -104 + crouch - windup * 7 - activePulse * 3 + recovery * 8 };
    base.frontArm.hand = { x: 58 - windup * 22 + activePulse * 78 - recovery * 12, y: -99 + crouch - windup * 9 - activePulse * 6 + recovery * 9 };
    base.backArm.elbow = { x: -42 - windup * 13 + activePulse * 3 + recovery * 8, y: -107 + crouch - windup * 7 + recovery * 7 };
    base.backArm.hand = { x: -17 - windup * 17 + activePulse * 2 + recovery * 10, y: -91 + crouch - windup * 9 + recovery * 8 };
    base.torsoTilt += -load * 0.028 + drive * 0.035 - recovery * 0.012;
    base.frontLeg.knee.y += load * 2.2 - drive * 1.2;
    base.frontLeg.foot.x += 5 * activePulse - 2 * windup + drive * 5;
    base.backLeg.knee.y += load * 5.2 + drive * 2.4;
    base.backLeg.foot.x -= 11 * activePulse + 4 * windup - recovery * 5 + load * 6 + drive * 5;
    base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.74);
    if (f.profileId === "p1") {
      base.torsoTilt += drive * 0.025 - recovery * 0.008;
      base.frontArm.hand.x += drive * 12 * spec.stance;
      base.frontArm.elbow.x += drive * 6 * spec.stance;
      base.backLeg.foot.x -= (load * 6 + drive * 8) * spec.stance;
      base.frontLeg.foot.x += drive * 5 * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant);
    } else if (f.profileId === "p2") {
      base.torsoTilt -= drive * 0.012;
      base.frontArm.hand.x += drive * 6 * spec.stance;
      base.frontArm.hand.y -= drive * 7;
      base.backArm.hand.y -= windup * 6;
      base.frontLeg.foot.y -= drive * 2.4;
      base.backLeg.foot.x -= load * 3 * spec.stance;
    } else if (f.profileId === "p3") {
      base.torsoTilt += drive * 0.018 - load * 0.012;
      base.frontArm.hand.x += drive * 10 * spec.stance;
      base.frontArm.elbow.x += drive * 5 * spec.stance;
      base.frontArm.hand.y += drive * 2;
      base.backArm.hand.y += load * 4;
      base.backLeg.knee.y += load * 6 + drive * 4;
      base.backLeg.foot.x -= (load * 8 + drive * 6) * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 1.18);
      base.frontLeg.plant = Math.max(base.frontLeg.plant ?? 0, drive * 0.42);
    } else if (f.profileId === "p4") {
      base.torsoTilt -= drive * 0.018 - load * 0.006;
      base.frontArm.hand.x += drive * 12 * spec.stance;
      base.frontArm.hand.y -= drive * 6;
      base.frontArm.elbow.x += drive * 5 * spec.stance;
      base.backArm.hand.x -= windup * 5 * spec.stance;
      base.backArm.hand.y -= windup * 5;
      base.frontLeg.foot.y -= drive * 2;
      base.backLeg.foot.x -= load * 4 * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.68);
    } else if (f.profileId === "p5") {
      base.torsoTilt -= drive * 0.024 - load * 0.004;
      base.frontArm.hand.x += drive * 20 * spec.stance;
      base.frontArm.hand.y -= drive * 8;
      base.frontArm.elbow.x += drive * 10 * spec.stance;
      base.backArm.hand.x -= windup * 6 * spec.stance;
      base.backArm.hand.y -= windup * 7;
      base.frontLeg.foot.x += drive * 4 * spec.stance;
      base.frontLeg.foot.y -= drive * 3;
      base.backLeg.foot.x -= load * 5 * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.58);
    } else if (f.profileId === "p6") {
      base.torsoTilt -= drive * 0.006 + load * 0.006;
      base.frontArm.hand.x += drive * 9 * spec.stance;
      base.frontArm.hand.y -= drive * 3;
      base.frontArm.elbow.x += drive * 4 * spec.stance;
      base.backLeg.foot.x -= (load * 5 + drive * 2) * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.88);
    }
  } else if (attackType === "kick" || attackType === "airKick") {
    const mass = attackMass ?? attackMassProfile(null);
    const snap = mass.snap ?? phase.snap;
    const drive = mass.drive + snap * 0.42;
    const load = mass.load;
    const chamber = clamp(load * 0.78 + windup * 0.92 + phase.anticipation * 0.28, 0, 1.22);
    const extension = clamp(activePulse * 0.9 + snap * 0.46 + drive * 0.18, 0, 1.3);
    const retract = clamp(recovery * 0.9 + phase.followThrough * 0.28, 0, 1.16);
    const airborneKick = attackType === "airKick" ? 1 : 0;
    const fall = airborneKick ? clamp(f.vy / 13, 0, 1) : 0;
    const airRecover = airborneKick ? smoothStep01(clamp((f.airKickRecoverPulse ?? 0) / 24, 0, 1)) : 0;
    const airTuck = airborneKick * clamp(chamber * 0.42 + retract * 0.52 + airRecover * 0.72 + fall * 0.34, 0, 1.28);
    const footLift = f.profileId === "p2" ? 1.12 : f.profileId === "p1" ? 0.78 : 1;
    const supportWeight = clamp(chamber * 0.55 + extension * 0.86 + retract * 0.25, 0, 1.45) * (airborneKick ? 0.58 : 1);
    const supportPlant = !airborneKick ? clamp(supportWeight * 0.7 + load * 0.32 + extension * 0.28, 0, 1.22) : 0;

    base.frontLeg.knee = {
      x: (29 + chamber * 18 + extension * 30 - retract * 13 - airTuck * 7) * spec.stance,
      y: -42 + crouch - chamber * 28 - extension * 18 + retract * 22 - airborneKick * (8 + extension * 5) + airTuck * 6,
    };
    base.frontLeg.foot = {
      x: (39 + chamber * 8 + extension * 84 - retract * 18 - airTuck * 18) * spec.stance,
      y: -8 - chamber * 35 - extension * 44 * footLift + retract * 46 - airborneKick * (12 + extension * 7) + airTuck * 18 + fall * 5,
    };
    base.frontLeg.lift = clamp(chamber * 0.62 + extension * 0.95, 0, 1);
    base.frontLeg.extension = extension;
    base.frontLeg.footAngle = -0.12 + chamber * 0.18 - extension * 0.05 + retract * 0.14;
    base.backLeg.knee = {
      x: (-28 - chamber * 6 - extension * 9 + retract * 5 + airTuck * 6) * spec.stance,
      y: -30 + crouch + supportWeight * 9 + recovery * 3 - airborneKick * (8 + chamber * 7) + airTuck * 11 + fall * 4,
    };
    base.backLeg.foot = {
      x: (-42 - chamber * 12 - extension * 18 + retract * 8 + airTuck * 14) * spec.stance,
      y: -1 + supportWeight * 1.6 - airborneKick * (8 + chamber * 9) + airTuck * 13 + fall * 6,
    };
    if (airborneKick) base.backLeg.plant = 0;
    else base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, clamp(0.58 + supportWeight * 0.42, 0, 1));
    base.backLeg.footAngle = -0.05 - supportWeight * 0.04 - supportPlant * 0.035;
    base.frontArm.elbow = {
      x: (35 - chamber * 6 - extension * 13 + retract * 5) * spec.stance,
      y: -88 + crouch + extension * 11 + retract * 5 + airTuck * 5,
    };
    base.frontArm.hand = {
      x: (46 - chamber * 7 - extension * 16 + retract * 5) * spec.stance,
      y: -65 + crouch + extension * 8 + retract * 5 + airTuck * 7,
    };
    base.backArm.elbow = {
      x: (-41 - chamber * 13 - extension * 11 + retract * 7) * spec.stance,
      y: -110 + crouch - chamber * 7 - extension * 8 + retract * 7 - airborneKick * extension * 5 + airTuck * 3,
    };
    base.backArm.hand = {
      x: (-24 - chamber * 17 - extension * 16 + retract * 8) * spec.stance,
      y: -91 + crouch - chamber * 9 - extension * 9 + retract * 8 - airborneKick * extension * 6 + airTuck * 5,
    };
    base.torsoTilt += -load * 0.042 - chamber * 0.03 + drive * 0.044 - recovery * 0.012 + airborneKick * (extension * 0.018 + fall * 0.018 - airRecover * 0.012);
    if (!airborneKick) {
      base.backLeg.knee.y += supportPlant * 4.4;
      base.backLeg.foot.y += supportPlant * 0.7;
      base.backLeg.foot.x -= supportPlant * 4.8 * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.9, supportWeight * 0.82, supportPlant);
    }
    if (f.profileId === "p1") {
      base.torsoTilt += extension * 0.016;
      base.frontLeg.foot.x += extension * 5 * spec.stance;
      base.frontLeg.foot.y += extension * 7;
      base.frontLeg.footAngle += 0.03;
      base.backLeg.knee.y += load * 5 + extension * 5;
      base.backLeg.foot.x -= (load * 8 + extension * 8) * spec.stance;
      if (!airborneKick) base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 1.12);
    } else if (f.profileId === "p2") {
      base.torsoTilt -= extension * 0.03;
      base.frontLeg.knee.y -= extension * 7;
      base.frontLeg.foot.x += extension * 12 * spec.stance;
      base.frontLeg.foot.y -= extension * 7;
      base.frontLeg.footAngle -= 0.05;
      base.frontArm.hand.y -= extension * 7;
      base.backArm.hand.y -= extension * 9;
      base.backLeg.foot.y -= load * 2;
    } else if (f.profileId === "p3") {
      base.torsoTilt += extension * 0.018 - load * 0.022;
      base.frontLeg.knee.x += extension * 4 * spec.stance;
      base.frontLeg.knee.y += extension * 4;
      base.frontLeg.foot.x += extension * 3 * spec.stance;
      base.frontLeg.foot.y += extension * 10;
      base.frontLeg.footAngle += 0.04;
      base.backLeg.knee.y += load * 8 + extension * 7;
      base.backLeg.foot.x -= (load * 10 + extension * 7) * spec.stance;
      base.backLeg.foot.y += load * 1.4;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 1.22, supportPlant * 1.08);
      base.frontArm.hand.y += extension * 5;
      base.backArm.hand.y += load * 3;
    } else if (f.profileId === "p4") {
      base.torsoTilt -= extension * 0.026 + load * 0.008;
      base.frontLeg.knee.x += extension * 9 * spec.stance;
      base.frontLeg.knee.y -= extension * 5;
      base.frontLeg.foot.x += extension * 13 * spec.stance;
      base.frontLeg.foot.y -= extension * 6;
      base.frontLeg.footAngle -= 0.045;
      base.backLeg.foot.x -= load * 4 * spec.stance;
      base.backLeg.foot.y -= load * 1.5;
      base.frontArm.hand.y -= extension * 5;
      base.backArm.hand.y -= extension * 7;
    } else if (f.profileId === "p5") {
      base.torsoTilt -= extension * 0.036 + load * 0.006;
      base.frontLeg.knee.x += extension * 15 * spec.stance;
      base.frontLeg.knee.y -= extension * 8;
      base.frontLeg.foot.x += extension * 23 * spec.stance;
      base.frontLeg.foot.y -= extension * 12;
      base.frontLeg.footAngle -= 0.075;
      base.backLeg.foot.x -= load * 5 * spec.stance;
      base.backLeg.foot.y -= load * 1.2;
      base.frontArm.hand.y -= extension * 8;
      base.backArm.hand.y -= extension * 10;
    } else if (f.profileId === "p6") {
      base.torsoTilt -= extension * 0.016 + load * 0.006;
      base.frontLeg.knee.x += extension * 7 * spec.stance;
      base.frontLeg.knee.y -= extension * 2;
      base.frontLeg.foot.x += extension * 10 * spec.stance;
      base.frontLeg.foot.y -= extension * 2.5;
      base.frontLeg.footAngle -= 0.03;
      base.backLeg.foot.x -= (load * 5 + extension * 2) * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.92, supportPlant * 0.98);
      base.frontArm.hand.y -= extension * 4;
      base.backArm.hand.y -= extension * 5;
    }
  } else if (attackType === "sweep") {
    const mass = attackMass ?? attackMassProfile(null);
    const drive = mass.drive + mass.snap * 0.36;
    const load = mass.load;
    base.frontLeg.knee = { x: 32 - windup * 9 + activePulse * 45, y: -25 + crouch + activePulse * 11 };
    base.frontLeg.foot = { x: 62 - windup * 14 + activePulse * 78 - recovery * 8, y: -1 };
    base.backLeg.knee = { x: -32 - windup * 4, y: -23 + crouch + activePulse * 10 };
    base.backLeg.foot = { x: -58, y: 0 };
    base.frontArm.elbow = { x: 31 - windup * 5, y: -84 + crouch + activePulse * 13 };
    base.frontArm.hand = { x: 42 - windup * 7, y: -61 + crouch + activePulse * 15 };
    base.backArm.elbow = { x: -32 - windup * 8, y: -89 + crouch + activePulse * 11 };
    base.backArm.hand = { x: -45 - windup * 8, y: -66 + crouch + activePulse * 14 };
    base.torsoTilt += load * 0.025 + drive * 0.042;
    base.frontLeg.foot.x += drive * 18 * spec.stance;
    base.backLeg.foot.x -= load * 10 * spec.stance + drive * 8 * spec.stance;
    base.backLeg.knee.y += load * 7 + drive * 4;
    base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant);
    if (f.profileId === "p1") {
      base.torsoTilt += drive * 0.035;
      base.frontLeg.foot.x += drive * 11 * spec.stance;
      base.backLeg.foot.x -= load * 6 * spec.stance;
      base.backLeg.knee.y += drive * 4;
    } else if (f.profileId === "p2") {
      base.torsoTilt -= windup * 0.018 + drive * 0.012;
      base.frontLeg.foot.x += drive * 16 * spec.stance;
      base.frontLeg.foot.y -= drive * 3;
      base.frontArm.hand.y -= drive * 7;
      base.backArm.hand.y -= drive * 6;
    } else if (f.profileId === "p3") {
      base.torsoTilt += drive * 0.02 + load * 0.015;
      base.frontLeg.foot.x += drive * 9 * spec.stance;
      base.frontLeg.foot.y += drive * 3;
      base.backLeg.knee.y += load * 7 + drive * 5;
      base.backLeg.foot.x -= (load * 8 + drive * 7) * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 1.22);
      base.frontArm.hand.y += drive * 5;
      base.backArm.hand.y += drive * 3;
    } else if (f.profileId === "p4") {
      base.torsoTilt -= drive * 0.018;
      base.frontLeg.foot.x += drive * 15 * spec.stance;
      base.frontLeg.foot.y -= drive * 2.5;
      base.backLeg.foot.x -= load * 4 * spec.stance;
      base.frontArm.hand.y -= drive * 4;
      base.backArm.hand.y -= drive * 5;
    } else if (f.profileId === "p5") {
      base.torsoTilt -= drive * 0.026;
      base.frontLeg.foot.x += drive * 24 * spec.stance;
      base.frontLeg.foot.y -= drive * 2.2;
      base.backLeg.foot.x -= load * 5 * spec.stance;
      base.frontArm.hand.y -= drive * 5;
      base.backArm.hand.y -= drive * 6;
    } else if (f.profileId === "p6") {
      base.torsoTilt += drive * 0.004 - load * 0.006;
      base.frontLeg.foot.x += drive * 12 * spec.stance;
      base.frontLeg.foot.y -= drive * 1.5;
      base.backLeg.foot.x -= load * 6 * spec.stance;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant);
      base.frontArm.hand.y -= drive * 2;
      base.backArm.hand.y -= drive * 3;
    }
  } else if (attackType === "grab") {
    const mass = attackMass ?? attackMassProfile(null);
    const drive = mass.drive + mass.snap * 0.3;
    const load = mass.load;
    base.frontArm.elbow = { x: 48 - windup * 11 + activePulse * 34 - recovery * 8, y: -96 + crouch - windup * 3 - activePulse * 4 + recovery * 4 };
    base.frontArm.hand = { x: 68 - windup * 17 + activePulse * 52 - recovery * 11, y: -92 + crouch - windup * 2 - activePulse * 1 + recovery * 6 };
    base.backArm.elbow = { x: 22 - windup * 9 + activePulse * 41 - recovery * 8, y: -114 + crouch - windup * 4 - activePulse * 2 + recovery * 4 };
    base.backArm.hand = { x: 49 - windup * 13 + activePulse * 56 - recovery * 10, y: -111 + crouch - windup * 4 + activePulse * 3 + recovery * 5 };
    base.torsoTilt += -load * 0.024 + drive * 0.035;
    base.frontLeg.foot.x += 10 * activePulse - 3 * windup + drive * 8 * spec.stance;
    base.backLeg.foot.x -= 9 * activePulse + 4 * windup - recovery * 4 + load * 5 * spec.stance + drive * 4 * spec.stance;
    base.backLeg.knee.y += mass.plant * 3.5;
    base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.72);
  } else if (attackType === "special") {
    const mass = attackMass ?? attackMassProfile(null);
    const drive = mass.drive + mass.snap * 0.38;
    const load = mass.load;
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
    } else if (f.profileId === "p3") {
      base.torsoTilt = -0.065 * activePulse + 0.045 * windup;
      base.frontArm.elbow = { x: 39 - windup * 10 + activePulse * 27, y: -126 + crouch - windup * 5 - activePulse * 10 };
      base.frontArm.hand = { x: 59 - windup * 16 + activePulse * 48, y: -110 + crouch - windup * 6 - activePulse * 6 };
      base.backArm.elbow = { x: -32 - windup * 9 + activePulse * 8, y: -116 + crouch + activePulse * 2 };
      base.backArm.hand = { x: -20 - windup * 12 + activePulse * 20, y: -96 + crouch + activePulse * 4 };
      base.frontLeg.knee.y += windup * 5;
      base.frontLeg.foot.x += 7 * activePulse - 3 * windup;
      base.backLeg.foot.x -= 14 * activePulse + 8 * windup;
      base.backLeg.knee.y += windup * 7 + activePulse * 5;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, 0.9);
    } else if (f.profileId === "p4") {
      base.torsoTilt = -0.105 * activePulse + 0.035 * windup;
      base.frontArm.elbow = { x: 42 - windup * 12 + activePulse * 34, y: -130 + crouch - windup * 7 - activePulse * 11 };
      base.frontArm.hand = { x: 62 - windup * 18 + activePulse * 62, y: -125 + crouch - windup * 9 - activePulse * 7 };
      base.backArm.elbow = { x: -31 - windup * 8 - activePulse * 5, y: -126 + crouch - activePulse * 8 };
      base.backArm.hand = { x: -39 - windup * 10 - activePulse * 10, y: -145 + crouch - activePulse * 12 };
      base.frontLeg.foot.x += 12 * activePulse - 4 * windup;
      base.frontLeg.foot.y -= activePulse * 2;
      base.backLeg.foot.x -= 8 * activePulse + 3 * windup;
    } else if (f.profileId === "p5") {
      base.torsoTilt = -0.118 * activePulse + 0.028 * windup;
      base.frontArm.elbow = { x: 43 - windup * 13 + activePulse * 42, y: -132 + crouch - windup * 7 - activePulse * 13 };
      base.frontArm.hand = { x: 66 - windup * 20 + activePulse * 72, y: -128 + crouch - windup * 10 - activePulse * 10 };
      base.backArm.elbow = { x: -32 - windup * 9 - activePulse * 6, y: -132 + crouch - activePulse * 11 };
      base.backArm.hand = { x: -42 - windup * 12 - activePulse * 11, y: -151 + crouch - activePulse * 14 };
      base.frontLeg.foot.x += 16 * activePulse - 4 * windup;
      base.frontLeg.foot.y -= activePulse * 3;
      base.backLeg.foot.x -= 9 * activePulse + 3 * windup;
    } else if (f.profileId === "p6") {
      base.torsoTilt = -0.082 * activePulse + 0.038 * windup;
      base.frontArm.elbow = { x: 41 - windup * 10 + activePulse * 30, y: -131 + crouch - windup * 7 - activePulse * 8 };
      base.frontArm.hand = { x: 60 - windup * 16 + activePulse * 54, y: -124 + crouch - windup * 9 - activePulse * 6 };
      base.backArm.elbow = { x: -29 - windup * 9 - activePulse * 5, y: -130 + crouch - activePulse * 7 };
      base.backArm.hand = { x: -38 - windup * 11 - activePulse * 10, y: -144 + crouch - activePulse * 10 };
      base.frontLeg.foot.x += 10 * activePulse - 3 * windup;
      base.backLeg.foot.x -= 11 * activePulse + 4 * windup;
      base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, 0.78);
    } else {
      base.frontArm.elbow = { x: 42 - windup * 7 + activePulse * 20, y: -121 + crouch - windup * 4 - activePulse * 8 };
      base.frontArm.hand = { x: 66 - windup * 12 + activePulse * 36, y: -106 + crouch - windup * 5 - activePulse * 5 };
      base.backArm.elbow = { x: 12 - windup * 8 + activePulse * 24, y: -123 + crouch - windup * 5 - activePulse * 9 };
      base.backArm.hand = { x: 46 - windup * 12 + activePulse * 35, y: -107 + crouch - windup * 4 - activePulse * 6 };
      base.frontLeg.foot.x += 7 * activePulse - 3 * windup;
      base.backLeg.foot.x -= 7 * activePulse + 3 * windup;
    }
    base.torsoTilt += -load * 0.03 + drive * 0.04;
    base.frontLeg.foot.x += drive * 8 * spec.stance;
    base.backLeg.foot.x -= load * 8 * spec.stance + drive * 8 * spec.stance;
    base.backLeg.knee.y += mass.plant * 4.5;
    base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, mass.plant * 0.86);
  }

  if (bodyWeight && bodyWeight.active > 0.03 && f.grounded) {
    const supportKey = bodyWeight.footSide < 0 ? "backLeg" : "frontLeg";
    const freeKey = supportKey === "backLeg" ? "frontLeg" : "backLeg";
    const support = base[supportKey];
    const free = base[freeKey];
    const supportSide = bodyWeight.footSide < 0 ? -1 : 1;
    const freeSide = -supportSide;
    const legAttack = attackType === "kick" || attackType === "airKick" || attackType === "sweep";
    const load = bodyWeight.load;
    const drive = bodyWeight.drive;
    const plant = bodyWeight.plant;
    const recoil = bodyWeight.recoil;
    const profileBrace = f.profileId === "p1" ? 1.14 : f.profileId === "p2" ? 0.86 : 1;
    const profileLift = f.profileId === "p2" ? 1.16 : f.profileId === "p1" ? 0.82 : 1;

    base.torsoTilt += (-load * 0.024 + drive * (legAttack ? 0.018 : 0.024) - recoil * 0.014) * profileBrace;
    support.knee.y += bodyWeight.compression * 4.2 * profileBrace + plant * 2.2 + bodyWeight.low * 2.4;
    support.foot.y += bodyWeight.compression * 0.6 + plant * 0.55;
    support.foot.x += supportSide * (load * 5.2 + drive * 3.2 + plant * 2.2 - recoil * 1.4) * spec.stance;
    support.plant = Math.max(support.plant ?? 0, plant * (f.profileId === "p1" ? 1.04 : 0.92));

    free.knee.x += freeSide * (drive * (legAttack ? 6.8 : 3.2) - load * 1.8 + recoil * 1.5) * spec.stance;
    free.foot.x += freeSide * (drive * (legAttack ? 9.8 : 4.6) - load * 1.6 + recoil * 1.9) * spec.stance;
    if (attackType === "sweep") {
      free.knee.y += bodyWeight.low * 3.2;
      free.foot.y += bodyWeight.low * 0.55;
    } else {
      free.knee.y -= bodyWeight.lift * 2.8 * profileLift;
      free.foot.y -= bodyWeight.lift * 4.4 * profileLift;
    }
    free.plant = Math.max(0.12, (free.plant ?? 0.42) - drive * 0.12);

    base.frontArm.hand.x -= supportSide * (load * 3.8 + recoil * 2.4) * spec.stance;
    base.backArm.hand.x -= supportSide * (load * 2.6 + drive * 2.2) * spec.stance;
    base.frontArm.hand.y += bodyWeight.compression * 1.8 - drive * (legAttack ? 2.5 : 1.2);
    base.backArm.hand.y += bodyWeight.compression * 1.4 - drive * 1.7;
  }

  const framePose = attackFrameProfile(f);
  if (f.attack && framePose.active > 0.03) {
    base.torsoTilt += framePose.rotation * 0.58;
    if (attackType === "kick" || attackType === "airKick") {
      base.frontLeg.knee.x += framePose.bandShiftX * 0.28 * spec.stance;
      base.frontLeg.knee.y += framePose.bandShiftY * 0.55;
      base.frontLeg.foot.x += framePose.bandShiftX * 0.58 * spec.stance;
      base.frontLeg.foot.y += framePose.bandShiftY * 0.86;
      base.frontLeg.extension = Math.max(base.frontLeg.extension ?? 0, clamp(framePose.bandT * 0.94, 0, 1.18));
      base.frontLeg.lift = Math.max(base.frontLeg.lift ?? 0, clamp(framePose.bandT * 0.8, 0, 1));
      base.frontLeg.footAngle = (base.frontLeg.footAngle ?? 0) + framePose.bandRotate * 0.32 - framePose.bandT * 0.025;
      base.backLeg.knee.y += framePose.bandT * 5;
      base.backLeg.foot.x -= framePose.bandT * 8 * spec.stance;
      base.frontArm.hand.x -= framePose.bandT * 8 * spec.stance;
      base.backArm.hand.x -= framePose.bandT * 12 * spec.stance;
    } else if (attackType === "sweep") {
      base.frontLeg.knee.x += framePose.bandShiftX * 0.24 * spec.stance;
      base.frontLeg.knee.y += framePose.bandShiftY * 0.62;
      base.frontLeg.foot.x += framePose.bandShiftX * 0.7 * spec.stance;
      base.frontLeg.foot.y += framePose.bandShiftY * 0.58;
      base.backLeg.knee.y += framePose.bandT * 10;
      base.backLeg.foot.x -= framePose.bandT * 12 * spec.stance;
      base.frontArm.hand.y += framePose.bandT * 11;
      base.backArm.hand.y += framePose.bandT * 9;
    } else if (attackType === "special") {
      const lift = framePose.bandT;
      base.frontArm.elbow.x += framePose.bandShiftX * 0.28 * spec.stance;
      base.frontArm.hand.x += framePose.bandShiftX * 0.5 * spec.stance;
      base.frontArm.hand.y += framePose.bandShiftY * 0.72 - lift * 6;
      base.backArm.elbow.x += framePose.bandShiftX * 0.14 * spec.stance;
      base.backArm.hand.x += framePose.bandShiftX * 0.34 * spec.stance;
      base.backArm.hand.y -= lift * 8;
      base.frontLeg.foot.x += lift * 5 * spec.stance;
      base.backLeg.foot.x -= lift * 7 * spec.stance;
    }
  }

  const chain = attackChainProfile(f, attackType);
  if (f.attack && chain.active > 0.025) {
    const flow = chain.active;
    const handoff = chain.handoff;
    const comboSnap = chain.combo;
    const turn = chain.fromKick && chain.toPunch ? 1 : chain.fromPunch && chain.toKick ? -1 : 0;

    base.torsoTilt += turn * handoff * 0.022 - flow * (chain.toKick ? 0.012 : 0.006) + comboSnap * 0.01;
    base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, flow * 0.86);
    base.frontLeg.plant = Math.max(base.frontLeg.plant ?? 0, handoff * 0.44);
    base.backLeg.knee.y += flow * 3.2;
    base.backLeg.foot.x -= (5.5 * flow + 3.5 * handoff) * spec.stance;
    base.frontLeg.knee.y += handoff * 1.8;

    if (chain.fromPunch && !chain.toPunch) {
      base.frontArm.elbow.x -= (4.5 * flow + 3 * handoff) * spec.stance;
      base.frontArm.elbow.y += 3.5 * flow;
      base.frontArm.hand.x -= (7 * flow + 3 * handoff) * spec.stance;
      base.frontArm.hand.y += 5.5 * flow;
      base.backArm.hand.x -= 3.5 * flow * spec.stance;
    }

    if (chain.fromKick && !chain.toKick) {
      base.frontLeg.knee.x -= (6.5 * flow + 4 * handoff) * spec.stance;
      base.frontLeg.knee.y += 4.2 * flow;
      base.frontLeg.foot.x -= (10 * flow + 5 * handoff) * spec.stance;
      base.frontLeg.foot.y += 2.4 * flow;
      base.frontArm.hand.y -= 3.5 * handoff;
      base.backArm.hand.y -= 2.8 * handoff;
    }

    if (chain.toPunch) {
      base.frontArm.elbow.x -= 3.2 * flow * spec.stance;
      base.frontArm.elbow.y -= 2.2 * handoff;
      base.frontArm.hand.x -= 4.8 * flow * spec.stance;
      base.frontArm.hand.y -= 2.6 * handoff;
      base.backArm.elbow.y -= 2.6 * flow;
      base.backArm.hand.y -= 3.2 * flow;
    } else if (chain.toKick) {
      base.frontArm.elbow.x -= 4.4 * handoff * spec.stance;
      base.frontArm.hand.x -= 6.8 * handoff * spec.stance;
      base.backArm.elbow.x -= 5.2 * handoff * spec.stance;
      base.backArm.hand.x -= 7.2 * handoff * spec.stance;
      base.backArm.hand.y -= 4.2 * handoff;
    }

    if (chain.special) {
      base.frontArm.hand.y -= 4.5 * handoff;
      base.backArm.hand.y -= 5.5 * handoff;
      base.frontLeg.foot.x += 3.5 * comboSnap * spec.stance;
      base.backLeg.foot.x -= 4.5 * comboSnap * spec.stance;
    }
  }

  if (!winner) {
    if (moveTurnT > 0.02 && walkingPose) {
      const moveLocal = Math.sign(f.vx) === f.dir ? 1 : -1;
      base.torsoTilt += moveLocal * moveTurnT * 0.025;
      base.frontArm.elbow.x -= moveLocal * moveTurnT * 4.5 * spec.stance;
      base.frontArm.hand.x -= moveLocal * moveTurnT * 6 * spec.stance;
      base.backArm.elbow.x -= moveLocal * moveTurnT * 3.5 * spec.stance;
      base.backArm.hand.x -= moveLocal * moveTurnT * 5 * spec.stance;
      base.frontLeg.knee.y += moveTurnT * 3;
      base.backLeg.knee.y += moveTurnT * 4;
      base.frontLeg.foot.x += moveLocal * moveTurnT * 4 * spec.stance;
      base.backLeg.foot.x -= moveLocal * moveTurnT * 4 * spec.stance;
    }

    if (guardEntryT > 0.02 && f.blocking && !f.attack) {
      base.torsoTilt -= guardEntryT * 0.035 * guardProfile.brace;
      base.frontArm.elbow.x += guardEntryT * 3 * spec.stance * guardProfile.brace;
      base.frontArm.elbow.y -= guardEntryT * 8 * guardProfile.handLift;
      base.frontArm.hand.x += guardEntryT * 2 * spec.stance * guardProfile.brace;
      base.frontArm.hand.y -= guardEntryT * 10 * guardProfile.handLift;
      base.backArm.elbow.x += guardEntryT * 5 * spec.stance * guardProfile.brace;
      base.backArm.elbow.y -= guardEntryT * 7 * guardProfile.handLift;
      base.backArm.hand.x += guardEntryT * 5 * spec.stance * guardProfile.brace;
      base.backArm.hand.y -= guardEntryT * 9 * guardProfile.handLift;
      base.frontLeg.knee.y += guardEntryT * 4 * guardProfile.crouch;
      base.backLeg.knee.y += guardEntryT * 5 * guardProfile.crouch;
      base.backLeg.foot.x -= guardEntryT * 7 * spec.stance * guardProfile.brace;
    }

    if (guardExitT > 0.02 && !f.blocking && !f.attack && f.hurt <= 0) {
      const open = smoothStep01(guardExitT);
      base.torsoTilt += open * 0.018;
      base.frontArm.elbow.x += open * 6 * spec.stance;
      base.frontArm.elbow.y -= open * 3;
      base.frontArm.hand.x += open * 8 * spec.stance;
      base.frontArm.hand.y -= open * 5;
      base.backArm.elbow.x -= open * 4 * spec.stance;
      base.backArm.hand.x -= open * 5 * spec.stance;
      base.frontLeg.foot.x += open * 3 * spec.stance;
      base.backLeg.foot.x -= open * 4 * spec.stance;
    }

    if (counterReadyT > 0.03 && f.hurt <= 0 && !f.attack) {
      const coil = Math.sin((1 - counterReadyT) * Math.PI);
      const counter = counterReadyT * guardProfile.counter;
      base.torsoTilt += f.dir * (0.014 + coil * 0.02) * counter;
      if (f.profileId === "p2") {
        base.frontArm.elbow.x += (5 + coil * 9) * spec.stance * counter;
        base.frontArm.elbow.y -= (4 + coil * 6) * guardProfile.handLift;
        base.frontArm.hand.x += (8 + coil * 14) * spec.stance * counter;
        base.frontArm.hand.y -= (7 + coil * 8) * guardProfile.handLift;
        base.backArm.hand.x -= 5 * spec.stance * counter;
        base.frontLeg.foot.y -= 2 * counter;
      } else {
        base.frontArm.elbow.x += (3 + coil * 5) * spec.stance * counter;
        base.frontArm.hand.x += (5 + coil * 8) * spec.stance * counter;
        base.backArm.elbow.y -= (2 + coil * 4) * guardProfile.handLift;
        base.backArm.hand.y -= (3 + coil * 5) * guardProfile.handLift;
        base.backLeg.foot.x -= 4 * spec.stance * counter;
        base.backLeg.plant = Math.max(base.backLeg.plant ?? 0, 0.68 * counter);
      }
    }

    if (attackEntryT > 0.02 && f.attack) {
      base.torsoTilt -= attackEntryT * 0.035;
      base.frontArm.elbow.x -= attackEntryT * 5 * spec.stance;
      base.frontArm.elbow.y += attackEntryT * 3;
      base.frontArm.hand.x -= attackEntryT * 8 * spec.stance;
      base.frontArm.hand.y += attackEntryT * 4;
      base.backArm.elbow.x -= attackEntryT * 3 * spec.stance;
      base.backArm.elbow.y -= attackEntryT * 3;
      base.backArm.hand.x -= attackEntryT * 5 * spec.stance;
      base.backArm.hand.y -= attackEntryT * 5;
      base.frontLeg.knee.y += attackEntryT * 3;
      base.backLeg.knee.y += attackEntryT * 5;
      base.backLeg.foot.x -= attackEntryT * 5 * spec.stance;
    }

    if (attackRecoverT > 0.02 && !f.attack && f.hurt <= 0) {
      const settle = smoothStep01(attackRecoverT);
      base.torsoTilt += settle * 0.02;
      base.frontArm.elbow.x -= settle * 3 * spec.stance;
      base.frontArm.elbow.y += settle * 4;
      base.frontArm.hand.x -= settle * 4 * spec.stance;
      base.frontArm.hand.y += settle * 6;
      base.backArm.elbow.x += settle * 3 * spec.stance;
      base.backArm.elbow.y += settle * 3;
      base.backArm.hand.x += settle * 4 * spec.stance;
      base.backArm.hand.y += settle * 4;
      base.frontLeg.knee.y += settle * 3;
      base.backLeg.knee.y += settle * 2;
    }

    if (hurtRecoverT > 0.02 && f.hurt <= 0 && !f.attack) {
      const rebound = Math.sin(hurtRecoverT * Math.PI) * motion.hurtRecover;
      const impactDir = f.impactDir ?? f.dir;
      base.torsoTilt -= impactDir * rebound * 0.035;
      base.frontArm.elbow.x -= impactDir * rebound * 5 * spec.stance;
      base.frontArm.elbow.y -= rebound * 5;
      base.frontArm.hand.x -= impactDir * rebound * 7 * spec.stance;
      base.frontArm.hand.y -= rebound * 6;
      base.backArm.elbow.x -= impactDir * rebound * 4 * spec.stance;
      base.backArm.hand.x -= impactDir * rebound * 5 * spec.stance;
      base.frontLeg.knee.y += rebound * 3;
      base.backLeg.foot.x -= impactDir * rebound * 6 * spec.stance;
    }
  }

  const localizedImpact = localizedImpactProfile(f);
  if (!winner && localizedImpact.t > 0.035 && f.hurt > 0) {
    const snap = localizedImpact.snap;
    const recoil = localizedImpact.rebound;
    const localDir = localizedImpact.localDir;
    const absorbStyle = f.profileId === "p1" ? 0.78 : f.profileId === "p2" ? 1.16 : f.profileId === "p3" ? 0.66 : 1;
    const liftStyle = f.profileId === "p1" ? 0.72 : f.profileId === "p2" ? 1.18 : f.profileId === "p3" ? 0.56 : 1;

    if (localizedImpact.zone === "head") {
      base.torsoTilt -= localDir * (0.035 + recoil * 0.028) * absorbStyle;
      base.frontArm.elbow.x += localDir * snap * 7 * spec.stance * absorbStyle;
      base.frontArm.elbow.y -= snap * 8 * liftStyle;
      base.frontArm.hand.x += localDir * snap * 9 * spec.stance * absorbStyle;
      base.frontArm.hand.y -= snap * 12 * liftStyle;
      base.backArm.elbow.x += localDir * snap * 5 * spec.stance * absorbStyle;
      base.backArm.elbow.y -= snap * 6 * liftStyle;
      base.backArm.hand.x += localDir * snap * 7 * spec.stance * absorbStyle;
      base.backArm.hand.y -= snap * 10 * liftStyle;
      base.frontLeg.knee.y += recoil * 3 * liftStyle;
      base.backLeg.foot.x -= localDir * snap * 4 * spec.stance * absorbStyle;
    } else if (localizedImpact.zone === "legs") {
      base.torsoTilt += localDir * (0.028 + snap * 0.018) * absorbStyle;
      base.frontLeg.knee.x -= localDir * snap * 12 * spec.stance * absorbStyle;
      base.frontLeg.knee.y += snap * 14 * liftStyle;
      base.frontLeg.foot.x += localDir * snap * 10 * spec.stance * absorbStyle;
      base.backLeg.knee.x += localDir * snap * 8 * spec.stance * absorbStyle;
      base.backLeg.knee.y += snap * 12 * liftStyle;
      base.backLeg.foot.x -= localDir * snap * 12 * spec.stance * absorbStyle;
      base.frontArm.elbow.y += recoil * 8 * liftStyle;
      base.frontArm.hand.y += recoil * 11 * liftStyle;
      base.backArm.elbow.y += recoil * 6 * liftStyle;
      base.backArm.hand.y += recoil * 8 * liftStyle;
    } else {
      base.torsoTilt += localDir * (0.026 + recoil * 0.018) * absorbStyle;
      base.frontArm.elbow.x -= localDir * snap * 5 * spec.stance * absorbStyle;
      base.frontArm.hand.x -= localDir * snap * 7 * spec.stance * absorbStyle;
      base.backArm.elbow.x -= localDir * snap * 4 * spec.stance * absorbStyle;
      base.backArm.hand.x -= localDir * snap * 6 * spec.stance * absorbStyle;
      base.frontArm.elbow.y += recoil * 6 * liftStyle;
      base.frontArm.hand.y += recoil * 8 * liftStyle;
      base.backArm.elbow.y += recoil * 4 * liftStyle;
      base.backArm.hand.y += recoil * 6 * liftStyle;
      base.frontLeg.knee.y += snap * 5 * liftStyle;
      base.backLeg.knee.y += snap * 4 * liftStyle;
      base.frontLeg.foot.x += localDir * snap * 5 * spec.stance * absorbStyle;
      base.backLeg.foot.x -= localDir * snap * 7 * spec.stance * absorbStyle;
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

  const hitMass = hitReactionMassProfile(f);
  if (!winner && f.hurt > 0 && hitMass.active > 0.035 && hitMass.kind !== "guard") {
    const localDir = hitMass.localDir;
    const worldLocal = hitMass.worldDir === (f.dir || 1) ? 1 : -1;
    const snap = clamp(hitMass.snap, 0, 1.85);
    const recoil = clamp(hitMass.rebound, 0, 1.85);
    const floor = clamp(hitMass.floor, 0, 1.7);
    const skid = clamp(hitMass.skid, 0, 1.85);
    const absorbStyle = f.profileId === "p1" ? 0.82 : f.profileId === "p2" ? 1.12 : f.profileId === "p3" ? 0.68 : 1;
    const liftStyle = f.profileId === "p1" ? 0.74 : f.profileId === "p2" ? 1.18 : f.profileId === "p3" ? 0.58 : 1;
    const braceFoot = worldLocal > 0 ? "backLeg" : "frontLeg";
    const freeFoot = braceFoot === "backLeg" ? "frontLeg" : "backLeg";

    base.torsoTilt += (localDir * hitMass.fold * snap * 0.05 + localDir * recoil * 0.018) * absorbStyle;
    base[braceFoot].knee.y += floor * 5.5;
    base[braceFoot].foot.y += floor * 1.4;
    base[braceFoot].foot.x -= worldLocal * (floor * 7 + skid * 6) * spec.stance;
    base[braceFoot].plant = Math.max(base[braceFoot].plant ?? 0, floor * 0.92);
    base[freeFoot].knee.y += floor * 2.3;
    base[freeFoot].foot.x += worldLocal * skid * 4.5 * spec.stance;

    if (hitMass.zone === "head") {
      base.frontArm.elbow.x += localDir * snap * 10 * spec.stance * absorbStyle;
      base.frontArm.elbow.y -= (snap * 8 + recoil * 3) * liftStyle;
      base.frontArm.hand.x += localDir * snap * 13 * spec.stance * absorbStyle;
      base.frontArm.hand.y -= (snap * 15 + recoil * 5) * liftStyle;
      base.backArm.elbow.x += localDir * snap * 7 * spec.stance * absorbStyle;
      base.backArm.elbow.y -= snap * 6 * liftStyle;
      base.backArm.hand.x += localDir * snap * 11 * spec.stance * absorbStyle;
      base.backArm.hand.y -= snap * 12 * liftStyle;
      base.frontLeg.knee.y += floor * 2;
    } else if (hitMass.zone === "legs") {
      base.frontLeg.knee.x -= localDir * snap * 9 * spec.stance * absorbStyle;
      base.frontLeg.knee.y += snap * 11 * liftStyle + floor * 6;
      base.frontLeg.foot.x += localDir * snap * 9 * spec.stance * absorbStyle;
      base.backLeg.knee.x += localDir * snap * 8 * spec.stance * absorbStyle;
      base.backLeg.knee.y += snap * 13 * liftStyle + floor * 7;
      base.backLeg.foot.x -= localDir * snap * 11 * spec.stance * absorbStyle;
      base.frontArm.elbow.y += snap * 8 * liftStyle;
      base.frontArm.hand.y += snap * 12 * liftStyle;
      base.backArm.elbow.y += snap * 6 * liftStyle;
      base.backArm.hand.y += snap * 9 * liftStyle;
    } else {
      base.frontArm.elbow.x -= localDir * snap * 6 * spec.stance * absorbStyle;
      base.frontArm.elbow.y += recoil * 7 * liftStyle + floor * 1.5;
      base.frontArm.hand.x -= localDir * snap * 9 * spec.stance * absorbStyle;
      base.frontArm.hand.y += recoil * 9 * liftStyle + floor * 2.2;
      base.backArm.elbow.x -= localDir * snap * 5 * spec.stance * absorbStyle;
      base.backArm.elbow.y += recoil * 5 * liftStyle;
      base.backArm.hand.x -= localDir * snap * 8 * spec.stance * absorbStyle;
      base.backArm.hand.y += recoil * 7 * liftStyle;
      base.frontLeg.knee.y += floor * 4 * liftStyle;
      base.backLeg.knee.y += floor * 4.5 * liftStyle;
    }
  }

  const airKickRecoverPose = airborne && !f.attack ? smoothStep01(clamp((f.airKickRecoverPulse ?? 0) / 24, 0, 1)) : 0;
  if (airKickRecoverPose > 0.03 && f.hurt <= 0 && !winner) {
    const fall = clamp(f.vy / 13, 0, 1);
    const fold = clamp(airKickRecoverPose + fall * 0.28, 0, 1.2);
    const localDir = (f.airKickDir || f.jumpDir || f.dir || 1) === (f.dir || 1) ? 1 : -1;
    base.torsoTilt += localDir * fold * 0.024;
    base.frontLeg.knee.x -= fold * 14 * spec.stance;
    base.frontLeg.knee.y += fold * 10;
    base.frontLeg.foot.x -= fold * 28 * spec.stance;
    base.frontLeg.foot.y += fold * 16;
    base.backLeg.knee.x += fold * 8 * spec.stance;
    base.backLeg.knee.y -= fold * 5;
    base.backLeg.foot.x += fold * 13 * spec.stance;
    base.backLeg.foot.y -= fold * 4;
    base.frontArm.hand.y += fold * 7;
    base.backArm.hand.y -= fold * 5;
  }

  if (airborne) {
    base.frontLeg.knee.y -= 18;
    base.frontLeg.foot.y -= 18;
    base.backLeg.knee.y -= 10;
    base.backLeg.foot.y -= 8;
  }

  const entrance = fighterEntranceCue(f);
  if (entrance && f.grounded && f.hurt <= 0 && !f.attack) {
    const guard = entrance.ease;
    const settle = entrance.step;
    if (f.profileId === "p2") {
      base.torsoTilt -= 0.035 * guard;
      base.frontArm.elbow = { x: 42 * spec.stance, y: -121 + crouch - settle * 4 };
      base.frontArm.hand = { x: 48 * spec.stance, y: -142 + crouch - settle * 8 };
      base.backArm.elbow = { x: -36 * spec.stance, y: -98 + crouch + guard * 5 };
      base.backArm.hand = { x: -28 * spec.stance, y: -82 + crouch + guard * 7 };
      base.frontLeg.foot.x += 5 * spec.stance * guard;
      base.backLeg.foot.x -= 4 * spec.stance * guard;
    } else if (f.profileId === "p1") {
      base.torsoTilt += 0.025 * guard;
      base.frontArm.elbow = { x: 45 * spec.stance, y: -112 + crouch + guard * 4 };
      base.frontArm.hand = { x: 48 * spec.stance, y: -92 + crouch + guard * 4 };
      base.backArm.elbow = { x: -42 * spec.stance, y: -118 + crouch - settle * 3 };
      base.backArm.hand = { x: -35 * spec.stance, y: -98 + crouch - settle * 4 };
      base.frontLeg.foot.x += 8 * spec.stance * guard;
      base.backLeg.foot.x -= 8 * spec.stance * guard;
      base.frontLeg.knee.y += guard * 4;
      base.backLeg.knee.y += guard * 5;
    }
  }

  if (winner) {
    if (f.id === roundWinnerId) {
      const victory = clamp(Math.max(0, (f.victoryPulse ?? 60) - resultFrame * 0.9) / 60, 0, 1);
      const cheer = Math.sin(Math.min(resultFrame, 72) * 0.17) * clamp(resultFrame / 48, 0, 1);
      if (f.profileId === "p2") {
        base.torsoTilt = -0.07 - victory * 0.03 + cheer * 0.012;
        base.frontArm = {
          shoulder: { x: shoulderX, y: shoulderY },
          elbow: { x: 47 * spec.stance, y: -147 + crouch - victory * 5 },
          hand: { x: 58 * spec.stance, y: -166 + crouch - victory * 8 - Math.max(0, cheer) * 4 },
        };
        base.backArm = {
          shoulder: { x: -shoulderX, y: shoulderY + 4 },
          elbow: { x: -39 * spec.stance, y: -110 + crouch + cheer * 2 },
          hand: { x: -28 * spec.stance, y: -94 + crouch + cheer * 3 },
        };
        base.frontLeg.foot.x += 5 * spec.stance;
        base.backLeg.foot.x -= 6 * spec.stance;
      } else {
        base.torsoTilt = -0.055 - victory * 0.025;
        base.frontArm = {
          shoulder: { x: shoulderX, y: shoulderY },
          elbow: { x: 45 * spec.stance, y: -151 + crouch - victory * 5 },
          hand: { x: 52 * spec.stance, y: -178 + crouch - victory * 7 },
        };
        base.backArm = {
          shoulder: { x: -shoulderX, y: shoulderY + 4 },
          elbow: { x: -38 * spec.stance, y: -111 + crouch + cheer * 1.5 },
          hand: { x: -24 * spec.stance, y: -93 + crouch + cheer * 2 },
        };
        base.frontLeg.foot.x += 10 * spec.stance;
        base.backLeg.foot.x -= 10 * spec.stance;
        base.frontLeg.knee.y += 3;
        base.backLeg.knee.y += 4;
      }
    } else {
      const fall = smoothStep01(clamp(resultFrame / 46, 0, 1));
      const limp = smoothStep01(clamp((resultFrame - 10) / 54, 0, 1));
      base.torsoTilt = 0.12 + fall * (f.profileId === "p2" ? 0.25 : 0.18);
      base.frontArm.elbow.y += fall * 10;
      base.backArm.elbow.y += fall * 12;
      base.frontArm.hand = { x: (42 + fall * 10) * spec.stance, y: -48 + crouch + fall * 18 + limp * 4 };
      base.backArm.hand = { x: (-38 - fall * 8) * spec.stance, y: -46 + crouch + fall * 20 + limp * 5 };
      base.frontLeg.knee.y += 8 + fall * 12;
      base.backLeg.knee.y += 10 + fall * 14;
      base.frontLeg.foot.x += (10 + fall * 9) * spec.stance;
      base.backLeg.foot.x -= (12 + fall * 9) * spec.stance;
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
  const maxReach = upperLen + lowerLen - clamp((upperLen + lowerLen) * 0.06, 3.2, 5.4);
  const minReach = Math.max(2, Math.abs(upperLen - lowerLen) + 0.5);
  const distance = clamp(rawDistance, minReach, maxReach);
  const ux = dx / rawDistance;
  const uy = dy / rawDistance;
  const end = {
    ...targetEnd,
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
  if (f.profileId === "p3") drawMaguilaRacingTorsoDetails(f, outfit, shoulder, chest, waist, hip, top, bottom, crouch);

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

    ctx.fillStyle = "rgba(22, 43, 82, 0.22)";
    ctx.beginPath();
    ctx.roundRect(-20, -98 + crouch, 40, 9, 4);
    ctx.fill();
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

function drawMaguilaRacingTorsoDetails(f, outfit, shoulder, chest, waist, hip, top, bottom, crouch) {
  const spec = bodySpec(f);
  const mobileLite = isMobileFightView();
  if (mobileLite) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.roundRect(-30, top + 20, 8, bottom - top - 20, 5);
    ctx.roundRect(-4, top + 21, 8, bottom - top - 21, 5);
    ctx.roundRect(22, top + 20, 8, bottom - top - 20, 5);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(12, 31, 63, 0.82)";
    ctx.beginPath();
    ctx.roundRect(-20, -101 + crouch, 40, 14, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath();
    ctx.roundRect(-14, -96 + crouch, 28, 2.4, 2);
    ctx.roundRect(-14, -91 + crouch, 28, 2.4, 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const phase = attackPhase(f.attack);
  const impact = localizedImpactProfile(f);
  const guard = f.blocking ? clamp((f.guardPulse ?? 0) / 18, 0, 1) : 0;
  const guardHit = clamp((f.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const attack = f.attack ? Math.max(phase.strike, phase.snap * 0.9, phase.followThrough * 0.48) : 0;
  const load = f.attack ? phase.anticipation : 0;
  const belly = spec.belly ?? 1;
  const lowerWaist = waist * belly;
  const lowerHip = hip * 1.08;
  const pressure = clamp(Math.max(attack * 0.72, load * 0.55, guard * 0.48, guardHit, impact.t * 0.72), 0, 1.65);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(13, 25, 42, ${0.07 + pressure * 0.045})`;
  ctx.beginPath();
  ctx.ellipse(0, -73 + crouch + pressure * 1.7, lowerWaist * 0.86, 25 + pressure * 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(9, 26, 55, 0.2)";
  ctx.lineWidth = 1.6 + pressure * 0.55;
  for (let y = -96 + crouch; y <= -62 + crouch; y += 17) {
    ctx.beginPath();
    ctx.moveTo(-lowerWaist + 1, y);
    ctx.bezierCurveTo(-waist * 0.35, y + 5 + pressure, waist * 0.35, y + 5 + pressure, lowerWaist - 1, y);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(-33, top + 18, 9, bottom - top - 17, 5);
  ctx.roundRect(-5, top + 19, 10, bottom - top - 18, 5);
  ctx.roundRect(24, top + 18, 9, bottom - top - 17, 5);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(outfit.accent ?? "#ffffff", 0.16 + pressure * 0.06);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-lowerWaist + 11, -74 + crouch);
  ctx.bezierCurveTo(-waist * 0.32, -64 + crouch + pressure, waist * 0.32, -64 + crouch + pressure, lowerWaist - 11, -74 + crouch);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(12, 31, 63, 0.88)";
  ctx.beginPath();
  ctx.roundRect(-23, -102 + crouch, 46, 16, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.74)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(-16, -97 + crouch, 32, 3, 2);
  ctx.roundRect(-16, -91 + crouch, 32, 3, 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(waist - 16, -123 + crouch, 22, 17, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(12, 31, 63, 0.72)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "rgba(12, 31, 63, 0.92)";
  ctx.beginPath();
  ctx.arc(waist - 5, -114 + crouch, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHead(f, crouch, stride, headScaleMultiplier = 1, options = {}) {
  const spec = bodySpec(f);
  const headShape = headShapeProfile(f);
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
    const neckLean = clamp((f.vx ?? 0) * 0.08 + (f.attack ? attackPhase(f.attack).strike * (f.dir || 1) * 1.5 : 0), -2.6, 2.6);
    const neckGrad = ctx.createLinearGradient(0, neckTop, 0, neckBottom);
    neckGrad.addColorStop(0, lighten(skin, 16));
    neckGrad.addColorStop(1, darken(skin, 18));
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.roundRect(-neckW / 2 + neckLean * 0.3, neckTop, neckW, neckH, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(43, 24, 18, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(39, 20, 15, 0.28)";
    ctx.beginPath();
    ctx.ellipse(neckLean * 0.16, neckTop - 2, neckW * 0.6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(36, 18, 13, 0.14)";
    ctx.beginPath();
    ctx.ellipse(neckLean * 0.2, neckBottom + 2, neckW * 0.9, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = colorWithAlpha(f.trim ?? "#fff1bd", f.profileId === "p2" ? 0.16 : 0.13);
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-neckW * 0.8, neckBottom + 3);
    ctx.quadraticCurveTo(-neckW * 0.25 + neckLean * 0.15, neckBottom + 8, -2, neckBottom + 6);
    ctx.moveTo(neckW * 0.8, neckBottom + 3);
    ctx.quadraticCurveTo(neckW * 0.25 + neckLean * 0.15, neckBottom + 8, 2, neckBottom + 6);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  const acting = headActingProfile(f, options.lockRotation ? 0 : stride);
  const headAngle =
    (options.lockRotation ? 0 : f.hurt > 0 ? Math.sin(f.hurt) * 0.03 : 0) +
    acting.rotation;
  ctx.translate(acting.x, acting.y);
  ctx.rotate(headAngle);
  ctx.scale(acting.scaleX, acting.scaleY);
  if (headShape.scaleX !== 1 || headShape.scaleY !== 1) {
    const headAnchorY = y + headH * headShape.anchorY;
    ctx.translate(0, headAnchorY);
    ctx.scale(headShape.scaleX, headShape.scaleY);
    ctx.translate(0, -headAnchorY);
  }
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
    drawFaceActingPass(f, clipX, clipY, clipW, clipH, acting, options.faceMask);
    drawFaceWearPass(f, clipX, clipY, clipW, clipH, options.faceMask);
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
  const secondary = secondaryMotionProfile(f, 0);
  const sway =
    Math.sin(roundFrame * 0.075 + f.x * 0.011) * 1.6 +
    clamp((f.vx ?? 0) * 0.22, -1.8, 1.8) +
    secondary.x * 0.18 +
    secondary.wave * secondary.flutter * 0.72;

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

function drawFaceActingPass(f, clipX, clipY, clipW, clipH, acting, maskMode) {
  if (maskMode !== "sprite") return;
  const focus = clamp(acting.focus ?? 0, 0, 1.45);
  const squint = clamp(acting.squint ?? 0, 0, 1.2);
  const cheek = clamp(acting.cheek ?? 0, 0, 1.1);
  const grimace = clamp(acting.grimace ?? 0, 0, 1.24);
  const shock = clamp(acting.shock ?? 0, 0, 1.46);
  const strain = clamp(acting.strain ?? 0, 0, 1.42);
  if (focus <= 0.03 && squint <= 0.03 && cheek <= 0.03 && grimace <= 0.03 && shock <= 0.03 && strain <= 0.03) return;

  const eyeY = clipY + clipH * 0.38;
  const mouthY = clipY + clipH * 0.76;
  const lean = clamp(acting.rotation * 14, -0.7, 0.7);
  const snapDir = clamp(acting.snapDir ?? 0, -1, 1);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(31, 16, 14, ${0.06 + squint * 0.1 + grimace * 0.035 + strain * 0.03})`;
  ctx.beginPath();
  ctx.ellipse(clipX + clipW * 0.35 + lean * 4 + snapDir * shock * 2.4, eyeY - shock * 0.8, clipW * (0.18 + squint * 0.03 + shock * 0.008), clipH * (0.055 + squint * 0.02 + shock * 0.006), -0.08 + lean * 0.08, 0, Math.PI * 2);
  ctx.ellipse(clipX + clipW * 0.66 + lean * 4 + snapDir * shock * 2.4, eyeY + 1 - shock * 0.8, clipW * (0.18 + squint * 0.03 + shock * 0.008), clipH * (0.055 + squint * 0.02 + shock * 0.006), 0.08 + lean * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(32, 15, 13, ${0.07 + focus * 0.1 + grimace * 0.04 + strain * 0.045})`;
  ctx.lineWidth = 1.4 + focus * 0.8 + strain * 0.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(clipX + clipW * 0.22 + snapDir * shock * 1.8, eyeY - clipH * (0.15 + focus * 0.035 + grimace * 0.018 + strain * 0.012));
  ctx.quadraticCurveTo(clipX + clipW * 0.35 + snapDir * shock * 2.2, eyeY - clipH * (0.2 + focus * 0.04 + grimace * 0.018 + strain * 0.014), clipX + clipW * 0.48 + snapDir * shock * 1.5, eyeY - clipH * (0.13 - grimace * 0.006 - shock * 0.008));
  ctx.moveTo(clipX + clipW * 0.54 + snapDir * shock * 1.5, eyeY - clipH * (0.13 - shock * 0.008));
  ctx.quadraticCurveTo(clipX + clipW * 0.69 + snapDir * shock * 2.2, eyeY - clipH * (0.2 + focus * 0.04 + grimace * 0.018 + strain * 0.014), clipX + clipW * 0.83 + snapDir * shock * 1.8, eyeY - clipH * (0.14 + focus * 0.035 + grimace * 0.018 + strain * 0.012));
  ctx.stroke();

  if (strain > 0.08) {
    ctx.strokeStyle = `rgba(32, 15, 13, ${0.035 + strain * 0.085})`;
    ctx.lineWidth = 0.9 + strain * 0.45;
    ctx.beginPath();
    ctx.moveTo(clipX + clipW * 0.46, eyeY + clipH * 0.12);
    ctx.quadraticCurveTo(clipX + clipW * 0.5 + lean * 2, eyeY + clipH * (0.18 + strain * 0.018), clipX + clipW * 0.55, eyeY + clipH * 0.12);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255, 237, 204, ${0.035 + cheek * 0.055 + shock * 0.025})`;
  ctx.beginPath();
  ctx.ellipse(clipX + clipW * 0.31 - lean * 4, clipY + clipH * 0.62, clipW * 0.17, clipH * 0.09, -0.18, 0, Math.PI * 2);
  ctx.ellipse(clipX + clipW * 0.69 - lean * 4, clipY + clipH * 0.62, clipW * 0.17, clipH * 0.09, 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 248, 218, ${0.055 + focus * 0.07 + grimace * 0.04 + shock * 0.035})`;
  ctx.lineWidth = 1.2 + focus * 0.45 + grimace * 0.4 + shock * 0.18;
  ctx.beginPath();
  ctx.moveTo(clipX + clipW * 0.3 + snapDir * shock * 1.8, mouthY + cheek * 1.3 - grimace * 1.3 - shock * 0.8);
  ctx.quadraticCurveTo(clipX + clipW * 0.5 + snapDir * shock * 1.2, mouthY + clipH * (0.04 + cheek * 0.02 + grimace * 0.035 + shock * 0.012), clipX + clipW * 0.72 + snapDir * shock * 0.8, mouthY + cheek * 1.1 - grimace * 1.1 + shock * 0.4);
  ctx.stroke();

  if (shock > 0.08) {
    ctx.globalAlpha = clamp(0.045 + shock * 0.06, 0.045, 0.13);
    ctx.fillStyle = "rgba(255, 255, 245, 0.9)";
    ctx.beginPath();
    ctx.ellipse(clipX + clipW * 0.34 + snapDir * shock * 2.6, eyeY - clipH * 0.006, clipW * 0.035, clipH * 0.018, -0.2, 0, Math.PI * 2);
    ctx.ellipse(clipX + clipW * 0.66 + snapDir * shock * 2.6, eyeY - clipH * 0.006, clipW * 0.035, clipH * 0.018, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (grimace > 0.05 || shock > 0.08) {
    ctx.globalCompositeOperation = "multiply";
    ctx.strokeStyle = `rgba(35, 15, 12, ${0.06 + grimace * 0.11 + shock * 0.055})`;
    ctx.lineWidth = 1 + grimace * 0.6 + shock * 0.2;
    ctx.beginPath();
    ctx.moveTo(clipX + clipW * 0.34 + snapDir * shock * 1.2, mouthY + clipH * (0.012 + grimace * 0.02 + shock * 0.012));
    ctx.lineTo(clipX + clipW * 0.66 + snapDir * shock * 1.2, mouthY + clipH * (0.012 + grimace * 0.018 + shock * 0.01));
    ctx.stroke();
  }
  ctx.restore();
}

function drawFaceWearPass(f, clipX, clipY, clipW, clipH, maskMode) {
  const wear = fighterWearState(f);
  if (wear.amount <= 0.04) return;

  const cheekAlpha = maskMode === "sprite" ? 1 : 0.72;
  const side = f.id === "right" ? -1 : 1;
  const bruise = f.profileId === "p2" || f.profileId === "p6" ? "rgba(104, 35, 58," : "rgba(95, 39, 28,";
  const eyeY = clipY + clipH * 0.38;
  const cheekY = clipY + clipH * 0.62;
  const mouthY = clipY + clipH * 0.76;
  const fatigue = clamp(wear.healthWear * 0.72 + wear.danger * 0.4 + wear.ko * 0.5, 0, 1.2);
  const fresh = clamp(wear.recent + wear.guard * 0.38, 0, 1.2);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `${bruise} ${0.035 * cheekAlpha + wear.amount * 0.085 * cheekAlpha})`;
  ctx.beginPath();
  ctx.ellipse(clipX + clipW * (side > 0 ? 0.35 : 0.65), cheekY, clipW * (0.16 + wear.amount * 0.025), clipH * (0.08 + wear.amount * 0.02), side * -0.24, 0, Math.PI * 2);
  ctx.fill();

  if (fatigue > 0.04) {
    ctx.fillStyle = `rgba(32, 16, 14, ${0.035 + fatigue * 0.105})`;
    ctx.beginPath();
    ctx.ellipse(clipX + clipW * 0.34, eyeY + clipH * 0.07, clipW * 0.17, clipH * 0.045, -0.08, 0, Math.PI * 2);
    ctx.ellipse(clipX + clipW * 0.66, eyeY + clipH * 0.07, clipW * 0.17, clipH * 0.045, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  if (fresh > 0.05) {
    ctx.strokeStyle = `rgba(54, 20, 16, ${0.08 + fresh * 0.16})`;
    ctx.lineWidth = 1 + fresh * 0.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(clipX + clipW * (side > 0 ? 0.58 : 0.28), clipY + clipH * 0.5);
    ctx.lineTo(clipX + clipW * (side > 0 ? 0.75 : 0.45), clipY + clipH * 0.57);
    ctx.moveTo(clipX + clipW * (side > 0 ? 0.4 : 0.72), mouthY - clipH * 0.04);
    ctx.lineTo(clipX + clipW * (side > 0 ? 0.52 : 0.6), mouthY + clipH * 0.025);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  if (fatigue > 0.12) {
    ctx.fillStyle = `rgba(255, 246, 220, ${0.035 + fatigue * 0.065})`;
    for (const drop of [
      [0.24, 0.42, 1.8],
      [0.78, 0.48, 1.5],
    ]) {
      ctx.beginPath();
      ctx.ellipse(clipX + clipW * drop[0], clipY + clipH * drop[1] + Math.sin(roundFrame * 0.08 + drop[0] * 10) * 1.2, drop[2], drop[2] * 2.4, 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (wear.danger > 0.08) {
    ctx.strokeStyle = colorWithAlpha(f.trim || "#fff1bd", 0.035 + wear.danger * 0.09);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(clipX + clipW * 0.22, clipY + clipH * 0.18);
    ctx.quadraticCurveTo(clipX + clipW * 0.5, clipY + clipH * (0.08 - wear.danger * 0.02), clipX + clipW * 0.8, clipY + clipH * 0.2);
    ctx.stroke();
  }
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
  const secondary = secondaryMotionProfile(f, 0);
  const acting = headActingProfile(f, 0);
  const drama = clamp((acting.hairWhip ?? 0) * 0.42 + (acting.shock ?? 0) * 0.62 + (acting.strain ?? 0) * 0.28, 0, 1.7);
  const snapDir = clamp(acting.snapDir ?? 0, -1, 1);
  const sway =
    Math.sin(roundFrame * 0.09 + f.x * 0.018) * 2 +
    clamp((f.vx ?? 0) * 0.34, -2.4, 2.4) +
    secondary.x * 0.42 +
    secondary.wave * secondary.flutter * 1.1 -
    snapDir * drama * 4.2;
  const hurt = f.hurt > 0 ? Math.sin(f.hurt * 0.7) * (1.5 + drama * 0.8) : 0;
  const leftX = x + headW * 0.18;
  const rightX = x + headW * 0.82;
  const topY = y + headH * 0.18;
  const lowY = y + headH * 0.78;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(36, 18, 22, 0.24)";
  ctx.lineWidth = 2.4 + secondary.flutter * 0.45 + drama * 0.34;
  ctx.beginPath();
  ctx.moveTo(leftX + sway * 0.25, topY);
  ctx.bezierCurveTo(leftX - 9 + sway, topY + 18 - drama * 2, leftX - 10 + sway * 0.5, lowY - 10 + secondary.y * 0.35 - drama * 2, leftX + 2 + hurt + sway * 0.12, lowY + secondary.y * 0.2 + drama * 1.5);
  ctx.moveTo(rightX + sway * 0.22, topY + 2);
  ctx.bezierCurveTo(rightX + 8 + sway, topY + 19 - drama * 2, rightX + 8 + sway * 0.4, lowY - 12 + secondary.y * 0.35 - drama * 2, rightX - 1 - hurt + sway * 0.12, lowY - 1 + secondary.y * 0.2 + drama * 1.5);
  if (drama > 0.08) {
    ctx.moveTo(x + headW * 0.5 + sway * 0.12, y + headH * 0.1);
    ctx.bezierCurveTo(
      x + headW * 0.44 + sway * 0.28 - snapDir * drama * 2,
      y + headH * 0.3,
      x + headW * 0.38 + sway * 0.22 - snapDir * drama * 3,
      y + headH * 0.55,
      x + headW * 0.43 - snapDir * drama * 4,
      y + headH * 0.76,
    );
  }
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 245, 226, ${0.08 + drama * 0.035})`;
  ctx.lineWidth = 1.3 + drama * 0.14;
  ctx.beginPath();
  ctx.moveTo(leftX + 2, topY + 5);
  ctx.bezierCurveTo(leftX - 4 + sway * 0.5, topY + 24, leftX - 3 + sway * 0.18, lowY - 14, leftX + 4 + sway * 0.1, lowY - 4);
  ctx.moveTo(rightX - 2, topY + 6);
  ctx.bezierCurveTo(rightX + 4 + sway * 0.5, topY + 24, rightX + 3 + sway * 0.18, lowY - 16, rightX - 4 + sway * 0.1, lowY - 4);
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
  const acting = headActingProfile(f, 0);
  const secondary = secondaryMotionProfile(f, 0);
  const drama = clamp((acting.hairWhip ?? 0) * 0.36 + (acting.shock ?? 0) * 0.7 + (acting.strain ?? 0) * 0.24, 0, 1.75);
  const snapDir = clamp(acting.snapDir ?? 0, -1, 1);
  const action = f.attack ? Math.max(attackProgress(f.attack), acting.bandanaFlutter * 0.55) : acting.bandanaFlutter * 0.25;
  const flutter =
    Math.sin(roundFrame * (0.13 + acting.bandanaFlutter * 0.035) + f.x * 0.018) * (2 + acting.bandanaFlutter * 2.2) +
    clamp((f.vx ?? 0) * 0.48, -3.5, 3.5) -
    f.dir * acting.rotation * 18 +
    secondary.x * 0.62 +
    secondary.whip * 2.4 -
    snapDir * drama * 5.6;
  const hurtFlick = f.hurt > 0 ? Math.sin(f.hurt * 0.85) * (2.2 + acting.bandanaFlutter * 1.2 + drama * 1.4) : 0;
  const tailLift = Math.cos(roundFrame * 0.1 + f.x * 0.01) * 1.2 - action * 2.8 + acting.bandanaLift + secondary.y * 0.35 - drama * 1.8;
  const bandLeft = x + headW * 0.26;
  const bandRight = x + headW * 0.76;
  const bandTop = y - headH * 0.025 + 1.8 - clamp(acting.focus * 0.85 + drama * 0.32, 0, 1.65) - secondary.attackDrive * 0.4;
  const knotX = x + headW * 0.72 + clamp(acting.x * 0.08, -1.1, 1.1);
  const knotY = y + headH * 0.055 + 1.9 + clamp(acting.y * 0.06, -0.9, 0.9);

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
  ctx.quadraticCurveTo(x + headW * 0.5 + acting.rotation * 22, bandTop + 0.5 - acting.focus * 0.5, bandRight, bandTop + 7);
  ctx.lineTo(bandRight - 2, bandTop + 15 + action * 0.7);
  ctx.quadraticCurveTo(x + headW * 0.5 - acting.rotation * 16, bandTop + 10 + action * 0.3, bandLeft - 2, bandTop + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(knotX, knotY, 6.8, 7.8, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(knotX + 4, knotY - 2);
  ctx.quadraticCurveTo(
    knotX + 16 + flutter,
    knotY - 4 + tailLift - drama * 1.4,
    knotX + 25 + flutter * (1.35 + acting.bandanaFlutter * 0.08 + secondary.flutter * 0.035 + drama * 0.035),
    knotY + 4 + tailLift + hurtFlick
  );
  ctx.quadraticCurveTo(knotX + 16 + flutter * 0.6, knotY + 10 + tailLift + action * 1.5, knotX + 5, knotY + 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(knotX + 1, knotY + 5);
  ctx.quadraticCurveTo(knotX + 12 + flutter * 0.5, knotY + 13 + tailLift + action * 1.2 + drama, knotX + 15 + flutter * (0.75 + drama * 0.035), knotY + 24 + hurtFlick + action * 2.2 + drama * 1.4);
  ctx.quadraticCurveTo(knotX + 5 + flutter * 0.25, knotY + 22 + tailLift + action * 1.4, knotX - 3, knotY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (acting.bandanaFlutter > 0.18 || drama > 0.08) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = clamp(0.08 + acting.bandanaFlutter * 0.08 + drama * 0.045, 0.08, 0.26);
    ctx.strokeStyle = "#fff1bd";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bandLeft + 8, bandTop + 6);
    ctx.quadraticCurveTo(x + headW * 0.5, bandTop + 1, bandRight - 8, bandTop + 6);
    ctx.moveTo(knotX + 7, knotY - 1);
    ctx.quadraticCurveTo(knotX + 18 + flutter * 0.55, knotY + tailLift, knotX + 25 + flutter, knotY + 3 + tailLift);
    ctx.stroke();
    ctx.restore();
  }

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
  const legExtension = clamp(leg.extension ?? 0, 0, 1.2);
  const legLift = clamp(leg.lift ?? 0, 0, 1);

  drawLimbSegment(leg.hip, leg.knee, pant, 24 * thighWidth, 16 * thighWidth, 1 + legExtension * 0.08);
  drawLimbSegment(leg.knee, leg.foot, pant, 19 * calfWidth, 10 * calfWidth, 1 + legExtension * 0.05);
  drawSpriteJointCover(leg.hip, pant, 12 * thighWidth, 9 * thighWidth, hipAngle, front ? 0.96 : 0.82);
  drawSpriteJointCover(leg.knee, pant, (9 + legExtension * 1.3) * calfWidth, (7 + legExtension * 0.7) * calfWidth, kneeAngle, front ? 1 : 0.84);
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
    ctx.lineWidth = 2.2 + legExtension * 0.7;
    ctx.beginPath();
    ctx.moveTo(leg.hip.x + 4, leg.hip.y + 5);
    ctx.quadraticCurveTo(leg.knee.x + 6, leg.knee.y - 3, leg.foot.x + 4, leg.foot.y - 9);
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.strokeStyle = `rgba(28, 17, 13, ${0.14 + legExtension * 0.08})`;
    ctx.lineWidth = 1.35 + legExtension * 0.6;
    ctx.beginPath();
    ctx.moveTo(leg.knee.x - 2, leg.knee.y + 4);
    ctx.quadraticCurveTo(leg.knee.x + 9, leg.knee.y + 12, leg.foot.x + 3, leg.foot.y - 3);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(leg.foot.x, leg.foot.y);
  const plant = clamp(leg.plant ?? 0, 0, 1);
  const lift = legLift;
  const computedFootAngle = (leg.foot.x - leg.knee.x) * 0.012 * (1 - plant * 0.5) - lift * 0.08;
  const footAngle = Number.isFinite(leg.footAngle) ? leg.footAngle : computedFootAngle;
  const footLength = 43 * spec.foot + legExtension * 9;
  const footHeight = 16 - legExtension * 1.7;
  ctx.rotate(footAngle);
  ctx.scale(1 + plant * 0.045 + legExtension * 0.08, 1 - plant * 0.04 + lift * 0.025 - legExtension * 0.045);
  const footGrad = ctx.createLinearGradient(-15, -9, 27 * spec.foot + legExtension * 7, 7);
  footGrad.addColorStop(0, darken(outfit.shoe, 26));
  footGrad.addColorStop(0.38, outfit.shoe);
  footGrad.addColorStop(1, lighten(outfit.shoe, 16));
  ctx.fillStyle = footGrad;
  ctx.beginPath();
  ctx.roundRect(-16 - legExtension * 1.5, -9, footLength, footHeight, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.48)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(9, 10, 12, 0.28)";
  ctx.beginPath();
  ctx.roundRect(-16 - legExtension * 1.5, 2, footLength, 5, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.roundRect(8 * spec.foot + legExtension * 3, -8, 12 * spec.foot + legExtension * 2, 4, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(1, -7, 15 * spec.foot + legExtension * 4, 4);
  ctx.strokeStyle = "rgba(35, 21, 17, 0.34)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i += 1) {
    const x = 13 + i * 5 * spec.foot + legExtension * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, -6);
    ctx.lineTo(x + 2, 4);
    ctx.stroke();
  }
  drawVectorFootAnatomy(spec, outfit, plant, lift, legExtension);
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
  drawVectorHandAnatomy(f, arm, spec, front);

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

function drawVectorFootAnatomy(spec, outfit, plant, lift, extension = 0) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(20, 12, 9, 0.32)";
  ctx.lineWidth = 1.45 + extension * 0.28;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-13, 4.8);
  ctx.quadraticCurveTo(2 * spec.foot + extension * 2, 8 + plant * 1.4, 25 * spec.foot + extension * 5, 3.8);
  ctx.stroke();

  ctx.strokeStyle = "rgba(20, 12, 9, 0.22)";
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i += 1) {
    const x = 3 + i * 5.2 * spec.foot + extension * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, -5.8 + lift * 1.2);
    ctx.quadraticCurveTo(x + 1.2, -0.4, x + 2.4, 4.6);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(lighten(outfit.shoe, 28), 0.16);
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(-9, -7.2);
  ctx.quadraticCurveTo(4 * spec.foot + extension * 2, -11 - extension * 0.8, 23 * spec.foot + extension * 5, -5.5);
  ctx.stroke();
  ctx.restore();
}

function drawVectorHandAnatomy(f, arm, spec, front) {
  const attack = f.attack ? attackProgress(f.attack) : 0;
  const punch = front && (f.attack?.type === "punch" || f.attack?.type === "airPunch" || f.attack?.type === "special");
  const curl = punch ? 1 : 0.62 + attack * 0.18;
  const skin = f.skin ?? "#f5c7a9";

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = `rgba(45, 23, 17, ${front ? 0.34 : 0.24})`;
  ctx.lineWidth = punch ? 1.7 : 1.3;
  ctx.lineCap = "round";
  for (let i = -1; i <= 1; i += 1) {
    const x = arm.hand.x + i * 4.5 * spec.hand;
    ctx.beginPath();
    ctx.moveTo(x - 1.2 * spec.hand, arm.hand.y - 6.2 * spec.hand);
    ctx.quadraticCurveTo(
      x + curl * 1.1 * spec.hand,
      arm.hand.y - 1.4 * spec.hand,
      x + 1.2 * spec.hand,
      arm.hand.y + 4.4 * spec.hand
    );
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(34, 17, 12, 0.38)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arm.hand.x - 8 * spec.hand, arm.hand.y - 2.4 * spec.hand);
  ctx.quadraticCurveTo(arm.hand.x, arm.hand.y - 8.8 * spec.hand, arm.hand.x + 8.5 * spec.hand, arm.hand.y - 2.5 * spec.hand);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(lighten(skin, 28), punch ? 0.22 : 0.15);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(arm.hand.x - 7 * spec.hand, arm.hand.y - 5.5 * spec.hand);
  ctx.quadraticCurveTo(arm.hand.x - 1 * spec.hand, arm.hand.y - 10 * spec.hand, arm.hand.x + 8 * spec.hand, arm.hand.y - 4.8 * spec.hand);
  ctx.stroke();
  ctx.restore();
}

function drawLimbSegment(a, b, color, widthA, widthB, volume = 1) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  const length = Math.hypot(b.y - a.y, b.x - a.x);
  const startW = widthA * volume;
  const endW = widthB * volume;
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
  const guardProfile = characterGuard(f);
  const guard = clamp((f?.guardPulse ?? 0) / 18, 0, 1);
  const impact = clamp((f?.guardImpact ?? 0) / GUARD_IMPACT_FRAMES, 0, 1);
  const counter = clamp((f?.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  const pulse = 0.5 + Math.sin(roundFrame * 0.32) * 0.5;
  const centerX = 22 + impact * 5 * guardProfile.recoil + (f?.profileId === "p2" ? 4 : f?.profileId === "p1" ? -2 : 0);
  const centerY = -106 + crouch + impact * 2 * guardProfile.recoil + (f?.profileId === "p2" ? -4 : f?.profileId === "p1" ? 1 : 0);
  const radius = (30 + guard * 5 * guardProfile.brace + impact * 12 * guardProfile.recoil) * guardProfile.shieldScale;
  const arcStart = -1.35 * guardProfile.arc;
  const arcEnd = 1.38 * guardProfile.arc;
  const guardColor = guardProfile.color ?? color;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const glow = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, radius + 36);
  glow.addColorStop(0, colorWithAlpha(color, (0.18 + impact * 0.2 + counter * 0.14) * guardProfile.shieldAlpha));
  glow.addColorStop(0.42, colorWithAlpha(counter > 0.05 ? "#fff1bd" : guardColor, (0.08 + counter * 0.04) * guardProfile.shieldAlpha));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius + 24 * guardProfile.shieldWidth, radius + 38, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(color, (0.5 + guard * 0.22 + impact * 0.3 + counter * 0.08) * guardProfile.shieldAlpha);
  ctx.lineWidth = (4.4 + impact * 3.8 * guardProfile.recoil + counter * 0.7) * guardProfile.shieldWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, arcStart, arcEnd);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,255,255,${(0.38 + impact * 0.36 + counter * 0.26) * guardProfile.shieldAlpha})`;
  ctx.lineWidth = 1.9 + impact * 2.2 * guardProfile.recoil + counter * 0.6;
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY, radius + 9 + impact * 3, -1.12 * guardProfile.arc, 1.13 * guardProfile.arc);
  ctx.stroke();

  if (impact > 0.05 || counter > 0.05) {
    ctx.strokeStyle = counter > 0.05 ? `rgba(255, 241, 189, ${0.24 + counter * 0.44 * guardProfile.counter})` : colorWithAlpha(guardColor, 0.2 + impact * 0.36 * guardProfile.shieldAlpha);
    ctx.lineWidth = 1.5 + impact * 1.5 * guardProfile.spark + counter * 0.7;
    const lanes = Math.max(2, Math.round(3 * guardProfile.spark));
    for (let i = 0; i < lanes; i += 1) {
      const lane = lanes === 1 ? 0 : (i / (lanes - 1) - 0.5) * 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 7 + lane * 5, centerY - radius * 0.78 + lane * 7);
      ctx.lineTo(centerX + 22 + impact * 16 * guardProfile.recoil + lane * 7, centerY + lane * 12);
      ctx.stroke();
    }
  }

  if (counter > 0.05) {
    ctx.strokeStyle = `rgba(255, 241, 189, ${(0.22 + pulse * 0.22 + counter * 0.16) * guardProfile.counter})`;
    ctx.lineWidth = (2.2 + counter * 1.1) * guardProfile.shieldWidth;
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY, radius + 18, -0.85 * guardProfile.arc, 0.82 * guardProfile.arc);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 241, 189, ${(0.16 + pulse * 0.18 + counter * 0.2) * guardProfile.counter})`;
    for (let i = 0; i < 2; i += 1) {
      const y = centerY - 14 + i * 28;
      ctx.beginPath();
      ctx.moveTo(centerX + radius * 0.48, y - 6);
      ctx.lineTo(centerX + radius * 0.68 + pulse * 3, y);
      ctx.lineTo(centerX + radius * 0.48, y + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawCounterReadyFX(color, crouch, f) {
  const counter = clamp((f?.counterWindow ?? 0) / COUNTER_WINDOW_FRAMES, 0, 1);
  if (counter <= 0.04) return;

  const pulse = 0.5 + Math.sin(roundFrame * 0.38) * 0.5;
  const spark = counter * (0.76 + pulse * 0.34);
  const centerX = 31 + counter * 5;
  const centerY = -112 + crouch;
  const radius = 32 + spark * 14;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const glow = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, radius + 34);
  glow.addColorStop(0, colorWithAlpha(color, 0.12 + spark * 0.18));
  glow.addColorStop(0.38, `rgba(255, 241, 189, ${0.08 + spark * 0.1})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius + 23, radius + 32, -0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 241, 189, ${0.22 + spark * 0.42})`;
  ctx.lineWidth = 2.2 + spark * 2.2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -0.92, 0.82);
  ctx.stroke();

  ctx.strokeStyle = colorWithAlpha(color, 0.22 + spark * 0.32);
  ctx.lineWidth = 1.7 + spark * 1.4;
  ctx.beginPath();
  ctx.moveTo(centerX - 26, centerY - 18);
  ctx.quadraticCurveTo(centerX + 6 + spark * 10, centerY - 36 - spark * 8, centerX + 38 + spark * 10, centerY - 12);
  ctx.moveTo(centerX - 18, centerY + 12);
  ctx.quadraticCurveTo(centerX + 11 + spark * 8, centerY + 25 + spark * 3, centerX + 44 + spark * 9, centerY + 8);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 241, 189, ${0.16 + spark * 0.28})`;
  ctx.lineWidth = 1.6 + spark;
  for (let i = 0; i < 2; i += 1) {
    const y = centerY - 10 + i * 20;
    ctx.beginPath();
    ctx.moveTo(centerX + radius * 0.42, y - 6);
    ctx.lineTo(centerX + radius * 0.66 + pulse * 3, y);
    ctx.lineTo(centerX + radius * 0.42, y + 6);
    ctx.stroke();
  }

  ctx.fillStyle = `rgba(255, 241, 189, ${0.16 + spark * 0.32})`;
  for (let i = 0; i < 3; i += 1) {
    const angle = -0.55 + i * 0.42 + pulse * 0.08;
    const x = centerX + Math.cos(angle) * (radius + 4 + i * 3);
    const y = centerY + Math.sin(angle) * (radius * 0.72 + i * 2);
    ctx.beginPath();
    ctx.ellipse(x, y, 2.2 + spark * 1.8, 1.2 + spark, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawProjectiles() {
  for (const p of projectiles) {
    const style = p.style ?? SPECIAL_STYLES.p1;
    const profile = specialProjectileProfile(p.profileId);
    for (let i = 0; i < p.trail.length; i += 1) {
      const point = p.trail[i];
      const alpha = (i + 1) / p.trail.length;
      const trailAlpha = 0.035 + alpha * (p.profileId === "p3" || p.profileId === "p6" ? 0.22 : 0.16);
      ctx.fillStyle = colorWithAlpha(style.trail, trailAlpha);
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, p.r * alpha * (profile.radius >= 18 ? 1.65 : 1.35), p.r * alpha * (p.profileId === "p2" || p.profileId === "p4" ? 0.52 : 0.78), p.vx > 0 ? 0 : Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const pulse = Math.sin(p.life * 0.45) * 3;
    const glowSize = (profile.radius >= 18 ? 38 : 31) + pulse;
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, glowSize);
    glow.addColorStop(0, style.core);
    glow.addColorStop(0.35, style.rim);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    drawSpecialSatellites(p, style, pulse);
    drawSpecialCore(p, style, pulse);
  }
}

function drawSpecialSatellites(p, style, pulse) {
  const profile = specialProjectileProfile(p.profileId);
  const age = p.age ?? 0;
  const dir = p.dir || (p.vx > 0 ? 1 : -1);
  const count = p.profileId === "p2" || p.profileId === "p4" ? 3 : p.profileId === "p6" ? 5 : 4;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i += 1) {
    const phase = age * (profile.spinRate || 0.08) + i * (Math.PI * 2 / count);
    const radius = p.r * (p.profileId === "p5" ? 1.55 : p.profileId === "p3" ? 1.32 : 1.18);
    const sx = p.x - dir * p.r * 0.22 + Math.cos(phase) * radius * 0.82;
    const sy = p.y + Math.sin(phase) * radius * (p.profileId === "p2" || p.profileId === "p4" ? 0.42 : 0.62);
    ctx.fillStyle = i % 2 ? colorWithAlpha(style.core, 0.68) : colorWithAlpha(style.trail, 0.58);
    ctx.beginPath();
    if (p.profileId === "p5") {
      ctx.ellipse(sx, sy, 3.8 + pulse * 0.18, 8.5, phase, 0, Math.PI * 2);
    } else if (p.profileId === "p6") {
      ctx.roundRect(sx - 4, sy - 4, 8, 8, 2);
    } else {
      ctx.arc(sx, sy, 3.5 + Math.max(0, pulse) * 0.12, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
}

function drawSpecialCore(p, style, pulse) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((p.age ?? p.life) * (p.spinRate ?? 0.08) * (p.vx > 0 ? 1 : -1));
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
    } else if (p.kind === "signatureSlash") {
      const progress = 1 - p.life / (p.maxLife ?? 12);
      const length = p.size * (1 - progress * 0.18);
      const width = (p.width ?? 14) * (1 - progress * 0.62);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle ?? 0);
      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";
      ctx.strokeStyle = colorWithAlpha(p.color, 0.26 * alpha);
      ctx.lineWidth = width * 2.6;
      ctx.beginPath();
      ctx.moveTo(-length * 0.48, length * 0.06);
      ctx.quadraticCurveTo(-length * 0.04, -length * 0.24, length * 0.58, -length * 0.02);
      ctx.stroke();

      ctx.strokeStyle = colorWithAlpha(p.core ?? "#fff7d6", 0.5 * alpha);
      ctx.lineWidth = Math.max(1.4, width * 0.64);
      ctx.beginPath();
      ctx.moveTo(-length * 0.38, length * 0.02);
      ctx.quadraticCurveTo(length * 0.02, -length * 0.16, length * 0.5, -length * 0.01);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255,255,255,${0.44 * alpha})`;
      ctx.lineWidth = Math.max(1, width * 0.22);
      ctx.beginPath();
      ctx.moveTo(-length * 0.22, -width * 0.18);
      ctx.lineTo(length * 0.42, -width * 0.18);
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "signatureStar") {
      const progress = 1 - p.life / (p.maxLife ?? 11);
      const radius = p.size * (1 + progress * 0.32);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle ?? 0) + progress * 0.18);
      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";
      ctx.strokeStyle = colorWithAlpha(p.color, 0.38 * alpha);
      ctx.lineWidth = Math.max(1.6, 5 * (1 - progress));
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI * i) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * radius * 0.18, Math.sin(angle) * radius * 0.18);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
      ctx.fillStyle = colorWithAlpha(p.core ?? "#fff7d6", 0.34 * alpha);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
      ctx.fill();
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
  if (!winner) return;
  if (overlay.dataset.screen === "winner" && !overlay.classList.contains("hidden")) return;
  const timeOver = roundFinishKind === "time";
  const reveal = smoothStep01(clamp(resultFrame / 24, 0, 1));
  const snap = Math.max(0, 1 - resultFrame / 24);
  const panelAlpha = overlay.classList.contains("hidden") ? 0.5 : 0.24;
  const width = timeOver ? 350 : matchOver ? 336 : 278;
  const height = matchOver ? 68 : 62;
  const x = W / 2 - width / 2;
  const y = 84 - reveal * 7 - snap * 4;
  const label = timeOver ? "TIME OVER" : matchOver ? "FINAL K.O." : "K.O.";
  const subtitle = timeOver
    ? `${winner.toUpperCase()} GANA POR DECISION`
    : matchOver
      ? `${winner.toUpperCase()} GANA MATCH`
      : `${winner.toUpperCase()} GANA ROUND ${toRoman(roundNumber)}`;
  const banner = ctx.createLinearGradient(x, y, x + width, y + height);
  banner.addColorStop(0, `rgba(24, 7, 6, ${panelAlpha})`);
  banner.addColorStop(0.48, `rgba(116, 25, 18, ${panelAlpha + 0.08})`);
  banner.addColorStop(1, `rgba(24, 7, 6, ${panelAlpha})`);

  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.translate(W / 2, y + height / 2);
  ctx.scale(1 + snap * 0.08, 1 + snap * 0.08);
  ctx.translate(-W / 2, -(y + height / 2));
  ctx.fillStyle = banner;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 226, 132, ${0.42 + panelAlpha * 0.26})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 241, 189, ${0.18 + snap * 0.28})`;
  ctx.lineWidth = 5 + snap * 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 18, y + height * 0.5);
  ctx.lineTo(x + width - 18, y + height * 0.5);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = `rgba(255, 241, 189, ${0.88 + panelAlpha * 0.08})`;
  ctx.font = `${matchOver ? 40 : 38}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = `rgba(43, 20, 16, ${0.62 + panelAlpha * 0.14})`;
  ctx.strokeText(label, W / 2, y + (matchOver ? 28 : 26));
  ctx.fillText(label, W / 2, y + (matchOver ? 28 : 26));

  ctx.font = "900 11px system-ui, sans-serif";
  ctx.fillStyle = `rgba(255, 226, 132, ${0.72 + panelAlpha * 0.12})`;
  ctx.fillText(subtitle, W / 2, y + (matchOver ? 52 : 47));
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawFinishFreezeFrame() {
  if (!finishFreezeCue || !winner) return;
  if (overlay.dataset.screen === "winner" && !overlay.classList.contains("hidden")) return;

  const age = Math.max(0, resultFrame - (finishFreezeCue.startFrame ?? 0));
  const maxLife = finishFreezeCue.maxLife ?? 84;
  if (age > maxLife) return;

  const intro = smoothStep01(clamp(age / 14, 0, 1));
  const outro = smoothStep01(clamp((maxLife - age) / 22, 0, 1));
  const alpha = intro * outro;
  if (alpha <= 0.01) return;

  const winnerFighter = fighters.find((fighter) => fighter.id === finishFreezeCue.winnerId) ?? fighters.find((fighter) => fighter.name === winner) ?? fighters[0];
  const loserFighter = fighters.find((fighter) => fighter.id === finishFreezeCue.loserId) ?? fighters.find((fighter) => fighter !== winnerFighter) ?? fighters[1];
  const color = finishFreezeCue.color || winnerFighter?.trim || "#fff1bd";
  const loserColor = finishFreezeCue.loserColor || loserFighter?.trim || "#75f0cb";
  const dir = finishFreezeCue.dir || winnerFighter?.dir || 1;
  const snap = Math.max(0, 1 - age / 18);
  const pulse = 0.5 + Math.sin((resultFrame + age) * 0.22) * 0.5;
  const panelW = 246 + snap * 18;
  const panelH = 120;
  const leftX = 26 - snap * 18;
  const rightX = W - panelW - 26 + snap * 18;
  const y = H - 164;
  const winnerLeft = winnerFighter === fighters[0];
  const winX = winnerLeft ? leftX : rightX;
  const loseX = winnerLeft ? rightX : leftX;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "multiply";
  const shade = ctx.createLinearGradient(0, H * 0.18, 0, H);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(0.42, "rgba(34, 10, 8, 0.18)");
  shade.addColorStop(1, "rgba(0,0,0,0.56)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorWithAlpha(color, 0.2 + pulse * 0.18);
  ctx.lineWidth = 8 + snap * 5;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i += 1) {
    const offset = (i - 1.5) * 38;
    ctx.beginPath();
    ctx.moveTo(W / 2 - dir * (210 + offset), 88 + i * 9);
    ctx.lineTo(W / 2 + dir * (215 - offset), H - 72 - i * 16);
    ctx.stroke();
  }

  ctx.fillStyle = colorWithAlpha(color, 0.08 + snap * 0.04);
  ctx.beginPath();
  ctx.moveTo(-40, H * 0.62);
  ctx.lineTo(W + 40, H * 0.48 + dir * 16);
  ctx.lineTo(W + 40, H);
  ctx.lineTo(-40, H);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  drawFinishNameplate(winX, y, panelW, panelH, winnerFighter, color, true, winnerLeft, finishFreezeCue);
  drawFinishNameplate(loseX, y + 10, panelW, panelH - 18, loserFighter, loserColor, false, !winnerLeft, finishFreezeCue);

  const centerY = y + 50 - snap * 6;
  ctx.save();
  ctx.translate(W / 2, centerY);
  ctx.scale(1 + snap * 0.08, 1 + snap * 0.08);
  ctx.shadowColor = colorWithAlpha(color, 0.66);
  ctx.shadowBlur = 18 + snap * 18;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(24, 8, 6, 0.86)";
  ctx.fillStyle = "#fff1bd";
  ctx.font = `${matchOver ? 42 : 36}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`;
  ctx.strokeText(finishFreezeCue.label || "REMATE FINAL", 0, 0);
  ctx.fillText(finishFreezeCue.label || "REMATE FINAL", 0, 0);
  ctx.shadowBlur = 8;
  ctx.fillStyle = colorWithAlpha(color, 0.92);
  ctx.font = "900 12px system-ui, sans-serif";
  ctx.fillText((finishFreezeCue.title || "ROUND CERRADO").toUpperCase(), 0, -35);
  ctx.fillStyle = "rgba(255, 247, 214, 0.82)";
  ctx.font = "850 11px system-ui, sans-serif";
  ctx.fillText((finishFreezeCue.detail || fighterPresentation(winnerFighter).signature).toUpperCase(), 0, 32);
  ctx.restore();

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = colorWithAlpha(color, 0.12 + snap * 0.08);
  ctx.beginPath();
  ctx.ellipse(W / 2, y + 58, 172 + snap * 24, 38 + snap * 10, -dir * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFinishNameplate(x, y, width, height, fighter, color, winnerPlate, faceLeft, cue) {
  if (!fighter) return;
  const trim = color || fighter.trim || "#fff1bd";
  const portraitSize = winnerPlate ? 78 : 62;
  const portraitX = faceLeft ? x + 12 : x + width - portraitSize - 12;
  const infoX = faceLeft ? x + portraitSize + 24 : x + width - portraitSize - 24;
  const align = faceLeft ? "left" : "right";
  const grad = ctx.createLinearGradient(x, y, x + width, y + height);
  grad.addColorStop(0, colorWithAlpha(faceLeft ? trim : "#08090c", winnerPlate ? 0.38 : 0.22));
  grad.addColorStop(0.46, "rgba(12, 10, 10, 0.64)");
  grad.addColorStop(1, colorWithAlpha(faceLeft ? "#08090c" : trim, winnerPlate ? 0.38 : 0.22));

  ctx.save();
  ctx.globalAlpha *= winnerPlate ? 1 : 0.72;
  ctx.shadowColor = winnerPlate ? colorWithAlpha(trim, 0.36) : "rgba(0,0,0,0.32)";
  ctx.shadowBlur = winnerPlate ? 18 : 8;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = colorWithAlpha(trim, winnerPlate ? 0.78 : 0.34);
  ctx.lineWidth = winnerPlate ? 2 : 1.2;
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = colorWithAlpha(trim, winnerPlate ? 0.14 : 0.06);
  ctx.beginPath();
  if (faceLeft) {
    ctx.moveTo(x + 18, y + 4);
    ctx.lineTo(x + width * 0.52, y + 4);
    ctx.lineTo(x + width * 0.35, y + height - 4);
    ctx.lineTo(x + 8, y + height - 4);
  } else {
    ctx.moveTo(x + width - 18, y + 4);
    ctx.lineTo(x + width * 0.48, y + 4);
    ctx.lineTo(x + width * 0.65, y + height - 4);
    ctx.lineTo(x + width - 8, y + height - 4);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.beginPath();
  ctx.roundRect(portraitX, y + 12, portraitSize, portraitSize, 8);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(trim, winnerPlate ? 0.82 : 0.42);
  ctx.lineWidth = winnerPlate ? 2 : 1.2;
  ctx.stroke();
  if (fighter.face?.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(portraitX + 4, y + 16, portraitSize - 8, portraitSize - 8, 6);
    ctx.clip();
    ctx.drawImage(fighter.face, portraitX - portraitSize * 0.06, y + 10, portraitSize * 1.12, portraitSize * 1.12);
    ctx.restore();
  }

  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.78)";
  ctx.shadowBlur = 4;
  ctx.fillStyle = winnerPlate ? "#fff1bd" : "rgba(255, 247, 214, 0.62)";
  ctx.font = `900 ${winnerPlate ? 23 : 17}px Impact, Haettenschweiler, 'Arial Black', system-ui, sans-serif`;
  ctx.fillText(fighter.name.toUpperCase(), infoX, y + (winnerPlate ? 37 : 32));
  ctx.fillStyle = colorWithAlpha(trim, winnerPlate ? 0.92 : 0.54);
  ctx.font = `900 ${winnerPlate ? 10 : 8}px system-ui, sans-serif`;
  ctx.fillText((winnerPlate ? cue.detail : fighterPresentation(fighter).discipline).toUpperCase(), infoX, y + (winnerPlate ? 58 : 50));
  if (winnerPlate) {
    ctx.fillStyle = "rgba(255, 247, 214, 0.74)";
    ctx.font = "850 9px system-ui, sans-serif";
    ctx.fillText(`${Math.round(fighter.roundDamage ?? 0)} DANO / ${fighter.roundMaxCombo || 0} HIT MAX`, infoX, y + 78);
  }
  ctx.restore();
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
    overlay.querySelector("h1").textContent = playerWon && !hasNext ? `${winner} campeon` : playerWon ? `${winner} avanza` : "Torneo perdido";
    overlayCopy.textContent = playerWon
      ? hasNext
        ? `Rival ${tournamentIndex + 1}/${tournamentOpponents.length} superado. Proximo combate en el Dojo Tendo.`
        : `Ganaste la escalera completa del Dojo Tendo. ${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}.`
      : `${winner} gano el match. Volve al selector para reintentar el torneo.`;
    startButton.textContent = hasNext ? "SIGUIENTE RIVAL" : "VOLVER";
  } else {
    overlay.querySelector("h1").textContent = matchOver
      ? `Victoria de ${winner}`
      : roundFinishKind === "time"
        ? `${winner} gana por decision`
        : `${winner} gana round ${roundNumber}`;
    overlayCopy.textContent = matchOver
      ? `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Revancha disponible.`
      : roundFinishKind === "time"
        ? `Time over. ${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Prepara el siguiente round.`
        : `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Prepara el siguiente round.`;
  startButton.textContent = matchOver ? "REVANCHA" : "SIGUIENTE ROUND";
  }
  renderWinnerPanel();
  overlay.classList.remove("hidden");
  syncShellState();
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

function particleBudget() {
  return isMobileFightView() ? MOBILE_MAX_PARTICLES : MAX_PARTICLES;
}

function fxBudgetScale() {
  const budget = particleBudget();
  const load = particles.length / Math.max(1, budget);
  const deviceScale = isMobileFightView() ? 0.58 : 1;
  if (load > 0.86) return deviceScale * 0.34;
  if (load > 0.72) return deviceScale * 0.56;
  return deviceScale;
}

function fxCount(count, minimum = 1) {
  return Math.max(minimum, Math.round(count * fxBudgetScale()));
}

function syncShellState() {
  const fighting = running && !paused && !winner && overlay.classList.contains("hidden");
  gameShell.classList.toggle("is-fighting", fighting);
  gameShell.dataset.screen = overlay.classList.contains("hidden") ? "fight" : overlay.dataset.screen;
}

function setCpuMode(enabled) {
  cpuEnabled = enabled;
  modeButton.textContent = cpuEnabled ? "CPU" : "2P";
  modeButton.setAttribute("aria-pressed", String(cpuEnabled));
  updateFighterLabels();
  if (overlayMode === "home") overlayCopy.textContent = homeOverlayCopy();
  if (!fighterSelect.classList.contains("hidden") && overlayMode === "home") renderFighterSelect();
  if (!fighterSelect.classList.contains("hidden") && overlayMode === "online") renderOnlinePanel();
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
  if (onlineHostActive()) sendOnlineSetup();
  playSound("select");
}

function renderFighterSelect() {
  fighterSelect.innerHTML = "";
  fighterSelect.classList.remove("versus-panel", "online-panel", "winner-panel");
  fighterSelect.append(makeHomePremierePanel(selectedLeftId, selectedRightId));
  fighterSelect.append(makeSelectColumn("left", "Izquierda", selectedLeftId));

  const versus = document.createElement("div");
  versus.className = "fighter-select-versus";
  const mode = document.createElement("span");
  mode.textContent = tournamentMode ? "TORNEO" : cpuEnabled ? "CPU" : "2P";
  const mark = document.createElement("strong");
  mark.textContent = "VS";
  const rounds = document.createElement("em");
  rounds.textContent = "MEJOR DE III";
  versus.append(mode, mark, rounds, makeFighterSelectScout(selectedLeftId, selectedRightId));
  fighterSelect.append(versus);

  fighterSelect.append(makeSelectColumn("right", "Derecha", selectedRightId));
}

function makeHomePremierePanel(leftId, rightId) {
  const leftProfile = fighterProfiles[leftId];
  const rightProfile = fighterProfiles[rightId];
  const leftPresentation = fighterPresentation(leftProfile);
  const rightPresentation = fighterPresentation(rightProfile);
  const scout = matchupScout(leftProfile, rightProfile);
  const panel = document.createElement("section");
  panel.className = "home-premiere-panel";
  panel.style.setProperty("--left-color", leftProfile.color);
  panel.style.setProperty("--left-trim", leftProfile.trim);
  panel.style.setProperty("--right-color", rightProfile.color);
  panel.style.setProperty("--right-trim", rightProfile.trim);

  const headline = document.createElement("div");
  headline.className = "home-premiere-headline";
  const event = document.createElement("span");
  event.textContent = tournamentMode ? "TORNEO DOJO TENDO" : cpuEnabled ? "CPU EXHIBITION" : "LOCAL DUEL";
  const title = document.createElement("b");
  title.textContent = `${leftProfile.name} VS ${rightProfile.name}`;
  const tempo = document.createElement("em");
  tempo.textContent = scout.tempo;
  headline.append(event, title, tempo);
  panel.append(headline);

  const leftRead = makePremiereFighterRead(leftProfile, leftPresentation, scout.leftPlan, "left");
  const centerRead = document.createElement("div");
  centerRead.className = "home-premiere-center";
  const round = document.createElement("span");
  round.textContent = "MEJOR DE III";
  const clash = document.createElement("strong");
  clash.textContent = "OPENING BOUT";
  const warning = document.createElement("em");
  warning.textContent = scout.warning;
  centerRead.append(round, clash, warning);

  const rightRead = makePremiereFighterRead(rightProfile, rightPresentation, scout.rightPlan, "right");
  panel.append(leftRead, centerRead, rightRead);

  const stats = document.createElement("div");
  stats.className = "home-premiere-statline";
  const labels = ["FUE", "VEL", "ENE"];
  const leftStats = menuStatValues(leftProfile);
  const rightStats = menuStatValues(rightProfile);
  for (let i = 0; i < labels.length; i += 1) {
    const row = document.createElement("span");
    row.style.setProperty("--left-stat", `${leftStats[i]}%`);
    row.style.setProperty("--right-stat", `${rightStats[i]}%`);
    const label = document.createElement("b");
    label.textContent = labels[i];
    const leftTrack = document.createElement("i");
    leftTrack.className = "left";
    const rightTrack = document.createElement("i");
    rightTrack.className = "right";
    row.append(label, leftTrack, rightTrack);
    stats.append(row);
  }
  panel.append(stats);
  return panel;
}

function makePremiereFighterRead(profile, presentation, plan, side) {
  const read = document.createElement("article");
  read.className = "home-premiere-fighter";
  read.dataset.side = side;
  const name = document.createElement("strong");
  name.textContent = profile.name;
  const discipline = document.createElement("span");
  discipline.textContent = presentation.discipline;
  const signature = document.createElement("b");
  signature.textContent = presentation.signature;
  const edge = document.createElement("em");
  edge.textContent = plan;
  read.append(name, discipline, signature, edge);
  return read;
}

function renderVersusPanel(roundLabel) {
  fighterSelect.innerHTML = "";
  fighterSelect.classList.remove("online-panel", "winner-panel");
  fighterSelect.classList.add("versus-panel");
  const leftRole = tournamentActive ? "Rival" : cpuEnabled ? "CPU" : "Jugador 1";
  const rightRole = tournamentActive ? "Jugador" : "Jugador 2";
  const leftPresentation = fighterPresentation(fighters[0]);
  const rightPresentation = fighterPresentation(fighters[1]);
  fighterSelect.append(makeVersusCard(fighters[0], leftRole, "left"));

  const center = document.createElement("div");
  center.className = "versus-panel-center";
  const label = document.createElement("span");
  label.textContent = roundLabel;
  center.append(label);
  const mark = document.createElement("strong");
  mark.textContent = "VS";
  center.append(mark);
  const caption = document.createElement("em");
  caption.textContent = tournamentActive ? "TORNEO" : cpuEnabled ? "CPU" : "2P";
  center.append(caption);

  const matchup = document.createElement("div");
  matchup.className = "versus-matchup";
  const leftRead = document.createElement("span");
  leftRead.textContent = leftPresentation.discipline;
  const clash = document.createElement("b");
  clash.textContent = "CHOQUE";
  const rightRead = document.createElement("span");
  rightRead.textContent = rightPresentation.discipline;
  matchup.append(leftRead, clash, rightRead);
  center.append(matchup);

  fighterSelect.append(center);

  fighterSelect.append(makeVersusCard(fighters[1], rightRole, "right"));
}

function roundResultAccolade(winnerFighter, runnerUp) {
  const stats = winnerFighter ?? {};
  const clean = (stats.roundDamageTaken ?? 0) <= 0.5 && roundFinishKind !== "time";
  if (clean && (winnerFighter?.health ?? 0) >= 99) {
    return { label: "PERFECT", detail: "Sin recibir dano", color: "#fff1bd" };
  }
  if (roundFinishKind === "time") {
    return { label: "DECISION", detail: "Gano por control del round", color: "#ffdf7a" };
  }
  if ((winnerFighter?.health ?? 0) <= 22 && (runnerUp?.health ?? 0) <= 0) {
    return { label: "CLUTCH", detail: "Cerre con poca vida", color: "#ff8f6b" };
  }
  if ((stats.roundMaxCombo ?? 0) >= 7) {
    return { label: "DOJO RUSH", detail: `${stats.roundMaxCombo} golpes encadenados`, color: "#7ef0cf" };
  }
  if ((stats.roundCounters ?? 0) >= 2) {
    return { label: "COUNTER MASTER", detail: `${stats.roundCounters} contraataques limpios`, color: "#ffd44d" };
  }
  if ((stats.roundBlocks ?? 0) >= 6) {
    return { label: "DEFENSA SOLIDA", detail: `${stats.roundBlocks} bloqueos`, color: "#bdeaff" };
  }
  if ((stats.roundSpecials ?? 0) >= 2) {
    return { label: "TECNICA FIRME", detail: `${stats.roundSpecials} especiales usados`, color: winnerFighter?.trim ?? "#fff1bd" };
  }
  return { label: "VICTORIA LIMPIA", detail: `${Math.round(stats.roundDamage ?? 0)} dano aplicado`, color: winnerFighter?.trim ?? "#fff1bd" };
}

function roundResultVerdict(winnerFighter, runnerUp) {
  const winnerDamage = Math.round(winnerFighter?.roundDamage ?? 0);
  const runnerDamage = Math.round(runnerUp?.roundDamage ?? 0);
  const winnerCombo = winnerFighter?.roundMaxCombo ?? 0;
  const runnerCombo = runnerUp?.roundMaxCombo ?? 0;
  const winnerDefense = (winnerFighter?.roundBlocks ?? 0) * 2 + (winnerFighter?.roundCounters ?? 0) * 4 + (winnerFighter?.roundSpecials ?? 0) * 3;
  const runnerDefense = (runnerUp?.roundBlocks ?? 0) * 2 + (runnerUp?.roundCounters ?? 0) * 4 + (runnerUp?.roundSpecials ?? 0) * 3;
  const damageGap = winnerDamage - runnerDamage;
  const comboGap = winnerCombo - runnerCombo;
  const defenseGap = winnerDefense - runnerDefense;
  const totalDamage = Math.max(1, winnerDamage + runnerDamage);
  const totalCombo = Math.max(1, winnerCombo + runnerCombo);
  const totalDefense = Math.max(1, winnerDefense + runnerDefense);
  let label = "VENTAJA CERRADA";
  let detail = `${winnerFighter.name} sostuvo el round cuando el duelo se achico.`;

  if (matchOver) {
    label = "CONTROL DEL MATCH";
    detail = `${winnerFighter.name} cerro la serie ${fighters[0].wins}-${fighters[1].wins}.`;
  } else if (roundFinishKind === "time") {
    label = "LECTURA DEL RELOJ";
    detail = `${winnerFighter.name} administro la ventaja hasta el final.`;
  } else if (damageGap >= 22) {
    label = "PRESION SUPERIOR";
    detail = `${winnerFighter.name} gano el intercambio por ${damageGap} de dano.`;
  } else if (comboGap >= 3) {
    label = "RITMO ENCADENADO";
    detail = `${winnerFighter.name} encontro el combo mas largo del round.`;
  } else if (defenseGap >= 5) {
    label = "RESPUESTA LIMPIA";
    detail = `${winnerFighter.name} convirtio defensa en oportunidad.`;
  }

  return {
    label,
    detail,
    metrics: [
      {
        label: "DANO",
        value: `${winnerDamage}-${runnerDamage}`,
        fill: clamp(winnerDamage / totalDamage, 0.08, 1),
      },
      {
        label: "COMBO",
        value: `${winnerCombo || 0}-${runnerCombo || 0}`,
        fill: clamp(winnerCombo / totalCombo, 0.08, 1),
      },
      {
        label: "CTRL",
        value: `${winnerDefense}-${runnerDefense}`,
        fill: clamp(winnerDefense / totalDefense, 0.08, 1),
      },
    ],
  };
}

function makeWinnerVerdict(winnerFighter, runnerUp) {
  const verdict = roundResultVerdict(winnerFighter, runnerUp);
  const panel = document.createElement("section");
  panel.className = "winner-card-verdict";

  const header = document.createElement("div");
  header.className = "winner-verdict-head";
  const kicker = document.createElement("span");
  kicker.textContent = "VEREDICTO";
  const label = document.createElement("b");
  label.textContent = verdict.label;
  header.append(kicker, label);
  panel.append(header);

  const detail = document.createElement("p");
  detail.textContent = verdict.detail;
  panel.append(detail);

  const bars = document.createElement("div");
  bars.className = "winner-verdict-bars";
  for (const metric of verdict.metrics) {
    const row = document.createElement("div");
    row.className = "winner-verdict-meter";
    row.style.setProperty("--fill", `${Math.round(metric.fill * 100)}%`);

    const metricLabel = document.createElement("span");
    metricLabel.textContent = metric.label;
    const value = document.createElement("b");
    value.textContent = metric.value;
    const track = document.createElement("i");
    row.append(metricLabel, value, track);
    bars.append(row);
  }
  panel.append(bars);
  return panel;
}

function renderWinnerPanel() {
  const winnerFighter = fighters.find((fighter) => fighter.id === roundWinnerId) ?? fighters.find((fighter) => fighter.name === winner) ?? fighters[0];
  const runnerUp = fighters.find((fighter) => fighter !== winnerFighter) ?? fighters[1];
  const presentation = fighterPresentation(winnerFighter);
  const winnerHealth = Math.max(0, Math.round(winnerFighter.health));
  const accolade = roundResultAccolade(winnerFighter, runnerUp);

  fighterSelect.innerHTML = "";
  fighterSelect.classList.remove("versus-panel", "online-panel");
  fighterSelect.classList.add("winner-panel");
  fighterSelect.style.setProperty("--fighter-color", winnerFighter.color);
  fighterSelect.style.setProperty("--fighter-trim", winnerFighter.trim);

  const card = document.createElement("section");
  card.className = "winner-card";
  card.style.setProperty("--fighter-color", winnerFighter.color);
  card.style.setProperty("--fighter-trim", winnerFighter.trim);

  const portrait = document.createElement("div");
  portrait.className = "winner-card-portrait";
  const image = document.createElement("img");
  image.src = winnerFighter.face.src;
  image.alt = winnerFighter.name;
  portrait.append(image);
  card.append(portrait);

  const info = document.createElement("div");
  info.className = "winner-card-info";
  const kicker = document.createElement("span");
  kicker.className = "winner-card-kicker";
  kicker.textContent = matchOver ? "MATCH CERRADO" : `ROUND ${toRoman(roundNumber)}`;
  info.append(kicker);

  const name = document.createElement("strong");
  name.textContent = winnerFighter.name;
  info.append(name);

  const trait = document.createElement("em");
  trait.textContent = `${fighterTrait(winnerFighter)} / ${presentation.signature}`;
  info.append(trait);

  const accoladeNode = document.createElement("div");
  accoladeNode.className = "winner-card-accolade";
  accoladeNode.style.setProperty("--accolade-color", accolade.color);
  const accoladeLabel = document.createElement("b");
  accoladeLabel.textContent = accolade.label;
  const accoladeDetail = document.createElement("span");
  accoladeDetail.textContent = accolade.detail;
  accoladeNode.append(accoladeLabel, accoladeDetail);
  info.append(accoladeNode);

  info.append(makeWinnerVerdict(winnerFighter, runnerUp));

  info.append(makeFighterDossier(winnerFighter, true));

  const result = document.createElement("div");
  result.className = "winner-card-result";
  for (const [label, value] of [
    ["Score", `${fighters[0].wins}-${fighters[1].wins}`],
    ["Salud", `${winnerHealth}%`],
    ["Dano", Math.round(winnerFighter.roundDamage ?? 0)],
    ["Combo", winnerFighter.roundMaxCombo ? `${winnerFighter.roundMaxCombo} HIT` : "-"],
    ["Bloq", winnerFighter.roundBlocks ?? 0],
    ["Esp", winnerFighter.roundSpecials ?? 0],
  ]) {
    const chip = document.createElement("span");
    const chipLabel = document.createElement("b");
    chipLabel.textContent = label;
    chip.append(chipLabel, document.createTextNode(value));
    result.append(chip);
  }
  info.append(result);
  card.append(info);

  fighterSelect.append(card);
  fighterSelect.classList.remove("hidden");
}

function makeVersusCard(fighter, role, side) {
  const card = document.createElement("section");
  card.className = "versus-card";
  card.dataset.side = side;
  card.style.setProperty("--fighter-color", fighter.color);
  card.style.setProperty("--fighter-trim", fighter.trim);
  const presentation = fighterPresentation(fighter);

  const roleTag = document.createElement("span");
  roleTag.className = "versus-card-role";
  roleTag.textContent = role;
  card.append(roleTag);

  const portraitStage = document.createElement("div");
  portraitStage.className = "versus-card-portrait";
  const image = document.createElement("img");
  image.src = fighter.face.src;
  image.alt = fighter.name;
  portraitStage.append(image);
  card.append(portraitStage);

  const info = document.createElement("div");
  info.className = "versus-card-info";
  const name = document.createElement("strong");
  name.textContent = fighter.name;
  info.append(name);

  const trait = document.createElement("em");
  trait.textContent = fighterTrait(fighter);
  info.append(trait);

  const signature = document.createElement("div");
  signature.className = "versus-card-signature";
  const signatureLabel = document.createElement("b");
  signatureLabel.textContent = presentation.signature;
  const signaturePlan = document.createElement("span");
  signaturePlan.textContent = presentation.callout;
  signature.append(signatureLabel, signaturePlan);
  info.append(signature);

  info.append(makeFighterDossier(fighter, true));
  info.append(makeMenuStats(fighter));
  card.append(info);
  return card;
}

function makeSelectColumn(side, title, selectedId) {
  const column = document.createElement("section");
  column.className = "fighter-select-column";
  column.dataset.side = side;
  column.style.setProperty("--fighter-color", fighterProfiles[selectedId].color);
  column.style.setProperty("--fighter-trim", fighterProfiles[selectedId].trim);
  column.style.setProperty("--fighter-accent", fighterProfiles[selectedId].outfit.accent);

  const headingWrap = document.createElement("div");
  headingWrap.className = "fighter-select-heading";
  const heading = document.createElement("h2");
  heading.textContent = title;
  headingWrap.append(heading);
  const sideTag = document.createElement("span");
  sideTag.className = "fighter-select-side-tag";
  sideTag.textContent = side === "left" && cpuEnabled ? "CPU" : side === "left" ? "J1" : "J2";
  headingWrap.append(sideTag);
  column.append(headingWrap);

  const selectedProfile = fighterProfiles[selectedId];
  const showcase = document.createElement("div");
  showcase.className = "fighter-showcase";
  showcase.dataset.fighter = selectedId;

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
  const trait = document.createElement("em");
  trait.className = "fighter-showcase-trait";
  trait.textContent = fighterTrait(selectedProfile);
  info.append(trait);
  info.append(makeFighterDossier(selectedProfile));
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
    button.style.setProperty("--choice-color", profile.color);
    button.style.setProperty("--choice-trim", profile.trim);
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

function fighterTrait(profile) {
  const key = profile.profileId ?? profile.id;
  return {
    p1: "Potencia pesada",
    p2: "Tecnica veloz",
    p3: "Racing power",
    p4: "Reflejos",
    p5: "Alcance largo",
    p6: "Defensa solida",
  }[key] ?? "Equilibrio";
}

function fighterPresentation(profile) {
  const key = profile.profileId ?? profile.id;
  return FIGHTER_PRESENTATION[key] ?? {
    discipline: "Dojo libre",
    signature: "Golpe limpio",
    temperament: "Equilibrio y lectura.",
    callout: "busca el centro y responde con calma",
    archetype: "All-rounder",
    edge: "Se adapta al duelo",
    risk: "Sin ventaja gratis",
  };
}

function makeIdentityList(profile, compact = false) {
  const presentation = fighterPresentation(profile);
  const wrap = document.createElement("div");
  wrap.className = compact ? "fighter-identity-list compact" : "fighter-identity-list";
  const rows = [
    ["ARQ", presentation.archetype],
    ["VENT", presentation.edge],
    ["RIES", presentation.risk],
  ];
  for (const [label, value] of compact ? rows.slice(0, 2) : rows) {
    const chip = document.createElement("span");
    chip.className = "fighter-identity-chip";
    const key = document.createElement("b");
    key.textContent = label;
    chip.append(key, document.createTextNode(value));
    wrap.append(chip);
  }
  return wrap;
}

function makeFighterDossier(profile, compact = false) {
  const presentation = fighterPresentation(profile);
  const wrap = document.createElement("div");
  wrap.className = compact ? "fighter-dossier compact" : "fighter-dossier";

  const bio = document.createElement("p");
  bio.className = "fighter-showcase-bio";
  bio.textContent = presentation.temperament;
  wrap.append(bio);

  const chips = document.createElement("div");
  chips.className = "fighter-technique-list";
  for (const label of [presentation.discipline, presentation.signature]) {
    const chip = document.createElement("span");
    chip.className = "fighter-technique-chip";
    chip.textContent = label;
    chips.append(chip);
  }
  wrap.append(chips);
  wrap.append(makeIdentityList(profile, compact));
  return wrap;
}

function menuStatValues(profile) {
  return {
    athletic: [78, 88, 74],
    balanced: [80, 76, 82],
    heavy: [92, 62, 88],
    lean: [68, 92, 72],
    racingHeavy: [94, 58, 86],
    slimFemale: [70, 94, 78],
    softFemale: [72, 78, 86],
    tallLean: [64, 90, 74],
  }[profile.build] ?? [75, 75, 75];
}

function matchupScout(leftProfile, rightProfile) {
  const leftStats = menuStatValues(leftProfile);
  const rightStats = menuStatValues(rightProfile);
  const [leftPower, leftSpeed, leftEnergy] = leftStats;
  const [rightPower, rightSpeed, rightEnergy] = rightStats;
  const speedGap = leftSpeed - rightSpeed;
  const powerGap = leftPower - rightPower;
  const energyGap = leftEnergy - rightEnergy;
  const leftPresentation = fighterPresentation(leftProfile);
  const rightPresentation = fighterPresentation(rightProfile);
  let tempo = "Duelo parejo";
  if (Math.abs(speedGap) >= 14) tempo = speedGap > 0 ? `${leftProfile.name} impone ritmo` : `${rightProfile.name} impone ritmo`;
  else if (Math.abs(powerGap) >= 14) tempo = powerGap > 0 ? `${leftProfile.name} pega mas pesado` : `${rightProfile.name} pega mas pesado`;
  else if (Math.abs(energyGap) >= 10) tempo = energyGap > 0 ? `${leftProfile.name} sostiene presion` : `${rightProfile.name} sostiene presion`;

  return {
    tempo,
    leftPlan: leftPresentation.edge,
    rightPlan: rightPresentation.edge,
    warning: Math.abs(powerGap) >= 18
      ? "Evitar trades limpios"
      : Math.abs(speedGap) >= 18
        ? "Controlar entradas"
        : "La ventaja cambia por spacing",
  };
}

function makeFighterSelectScout(leftId, rightId) {
  const leftProfile = fighterProfiles[leftId];
  const rightProfile = fighterProfiles[rightId];
  const scout = matchupScout(leftProfile, rightProfile);
  const panel = document.createElement("div");
  panel.className = "fighter-select-scout";
  const label = document.createElement("b");
  label.textContent = "SCOUT";
  const tempo = document.createElement("span");
  tempo.textContent = scout.tempo;
  const plans = document.createElement("em");
  plans.textContent = `${leftProfile.name}: ${scout.leftPlan} / ${rightProfile.name}: ${scout.rightPlan}`;
  const warning = document.createElement("i");
  warning.textContent = scout.warning;
  panel.append(label, tempo, plans, warning);
  return panel;
}

function makeMenuStats(profile) {
  const stats = menuStatValues(profile);
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
    if (onlineGuestActive()) requestOnlinePauseToggle();
    else {
      resumeGame();
      if (onlineHostActive()) sendOnlineSnapshot(true);
    }
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
  if (matchOver && onlineConnected()) {
    prepareOnlineRematchLobby();
    return;
  }
  if (overlayMode === "help") {
    showHomeOverlay();
    return;
  }
  if (overlayMode === "online") {
    if (onlineHostActive()) {
      if (!onlineState.localReady) {
        setOnlineLocalReady(true);
        return;
      }
      if (onlineBothReady()) {
        startOnlineMatch();
        return;
      }
      setOnlineStatus(onlineReadyStatusText());
      return;
    }
    if (onlineGuestActive()) {
      if (!onlineState.localReady) {
        setOnlineLocalReady(true);
        return;
      }
      setOnlineStatus(onlineReadyStatusText());
      return;
    }
    if (paused) {
      resumeGame();
      return;
    }
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
  if (onlineHostActive()) sendOnlineSnapshot(true);
}

function requestOnlinePauseToggle() {
  if (!running || winner) return;
  if (onlineGuestActive()) {
    sendOnlineMessage({ type: "pause" });
    setOnlineStatus(paused ? "Pedido para seguir enviado." : "Pedido de pausa enviado.");
    return;
  }
  togglePause();
}

function showHelpOverlay() {
  overlayMode = "help";
  overlay.dataset.screen = "help";
  paused = running && !winner;
  overlay.querySelector("h1").textContent = "Controles";
  overlayCopy.textContent =
    `${fighters[1].name}: en telefono joystick, pina, patada y especial. En teclado: flechas mover/saltar/bloquear, K golpe, L patada, O especial, P agarre, abajo+L barrida. ${fighters[0].name}: A/D, W, S, F, G, R y T. Esc pausa.`;
  startButton.textContent = paused ? "SEGUIR" : "LISTO";
  fighterSelect.classList.add("hidden");
  overlay.classList.remove("hidden");
  syncShellState();
}

function onlineSupported() {
  return "RTCPeerConnection" in window;
}

function encodeOnlineSignal(description) {
  return btoa(JSON.stringify(description)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function decodeOnlineSignal(code) {
  const compact = code.trim().replace(/\s+/gu, "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = compact.padEnd(Math.ceil(compact.length / 4) * 4, "=");
  return JSON.parse(atob(padded));
}

function makeRoomId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `mk3-${Date.now().toString(36).slice(-5)}-${random}`;
}

function buildInviteLink(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  return url.toString();
}

function loadPeerJs() {
  if (window.Peer) return Promise.resolve(window.Peer);
  if (loadPeerJs.promise) return loadPeerJs.promise;
  loadPeerJs.promise = new Promise((resolve, reject) => {
    let cdnIndex = 0;
    const tryNextCdn = () => {
      const src = PEERJS_CDN_URLS[cdnIndex];
      cdnIndex += 1;
      if (!src) {
        reject(new Error("No pude cargar el conector online gratuito."));
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => window.Peer ? resolve(window.Peer) : tryNextCdn();
      script.onerror = () => {
        script.remove();
        tryNextCdn();
      };
      document.head.append(script);
    };
    tryNextCdn();
  });
  return loadPeerJs.promise;
}

function onlineChannelIsOpen(channel = onlineState.channel) {
  if (!channel) return false;
  if (channel.readyState) return channel.readyState === "open";
  return Boolean(channel.open);
}

function setOnlineStatus(status) {
  onlineState.status = status;
  syncOnlineButtons();
  if (overlayMode === "online") {
    startButton.textContent = onlinePrimaryActionLabel();
    renderOnlinePanel();
  }
}

function onlineReadyStatusText() {
  if (!onlineConnected()) {
    if (onlineState.role === "host") return "Compartí el link y espera al invitado.";
    if (onlineState.role === "guest") return "Conectando con el anfitrion...";
    return "Crea un link para invitar o unite con codigo.";
  }
  if (onlineBothReady()) {
    return onlineState.role === "host"
      ? "Ambos jugadores listos. Ya podes iniciar la pelea online."
      : "Ambos jugadores listos. Esperando que el anfitrion inicie.";
  }
  if (onlineState.localReady) return "Listo. Esperando que el otro jugador confirme.";
  if (onlineState.remoteReady) return "El otro jugador ya esta listo. Marca LISTO para empezar.";
  return "Elijan luchador y marquen LISTO cuando esten preparados.";
}

function onlineLatencyLabel() {
  if (!onlineConnected()) return "Sin conexion";
  if (!onlineState.latencyMs) return "Midiendo";
  if (onlineState.latencyMs < 90) return `Fluida ${onlineState.latencyMs} ms`;
  if (onlineState.latencyMs < 170) return `Buena ${onlineState.latencyMs} ms`;
  if (onlineState.latencyMs < 280) return `Media ${onlineState.latencyMs} ms`;
  return `Lenta ${onlineState.latencyMs} ms`;
}

function onlineReadyLabel(ready) {
  return ready ? "LISTO" : "FALTA LISTO";
}

function onlinePrimaryActionLabel() {
  if (onlineHostActive()) {
    if (onlineBothReady()) return "INICIAR ONLINE";
    return onlineState.localReady ? "ESPERANDO LISTOS" : "MARCAR LISTO";
  }
  if (onlineGuestActive()) return onlineState.localReady ? "LISTO" : "MARCAR LISTO";
  return paused ? "SEGUIR" : "VOLVER";
}

function syncOnlineButtons() {
  const active = onlineConnected();
  onlineButton.textContent = active ? "Online OK" : "Online";
  onlineMenuButton.textContent = active ? "ONLINE OK" : "ONLINE";
  onlineButton.setAttribute("aria-pressed", String(active || overlayMode === "online"));
  onlineMenuButton.setAttribute("aria-pressed", String(active || overlayMode === "online"));
}

function resetOnlineConnection(keepCodes = false) {
  if (onlineState.channel) {
    onlineState.channel.onopen = null;
    onlineState.channel.onmessage = null;
    onlineState.channel.onclose = null;
    onlineState.channel.onerror = null;
    try { onlineState.channel.close(); } catch {}
  }
  if (onlineState.pc) {
    onlineState.pc.ondatachannel = null;
    onlineState.pc.onconnectionstatechange = null;
    onlineState.pc.oniceconnectionstatechange = null;
    try { onlineState.pc.close(); } catch {}
  }
  if (onlineState.peer) {
    onlineState.peer.off?.("open");
    onlineState.peer.off?.("connection");
    onlineState.peer.off?.("error");
    try { onlineState.peer.destroy(); } catch {}
  }
  onlineState.role = "";
  onlineState.localSide = "";
  onlineState.remoteSide = "";
  onlineState.pc = null;
  onlineState.peer = null;
  onlineState.channel = null;
  onlineState.connected = false;
  onlineState.inviteReady = false;
  onlineState.localReady = false;
  onlineState.remoteReady = false;
  onlineState.lastPingAt = 0;
  onlineState.latencyMs = 0;
  onlineState.lastInputPayload = "";
  onlineState.lastSnapshotFrame = -1;
  onlineState.snapshotTick = 0;
  onlineState.remoteInput = emptyInput();
  if (!keepCodes) {
    onlineState.offerCode = "";
    onlineState.answerCode = "";
    onlineState.inviteLink = "";
    onlineState.roomId = "";
  }
  onlineState.signaling = "";
  setOnlineStatus("Sin conexion online.");
}

function createOnlinePeerConnection() {
  const pc = new RTCPeerConnection({ iceServers: ONLINE_ICE_SERVERS });
  pc.onconnectionstatechange = () => {
    const state = pc.connectionState || pc.iceConnectionState;
    if (state === "connected") setOnlineStatus("Conexion online establecida.");
    else if (state === "failed" || state === "disconnected" || state === "closed") {
      onlineState.connected = false;
      onlineState.localReady = false;
      onlineState.remoteReady = false;
      setOnlineStatus("La conexion online se corto. Podés crear una sala nueva.");
    }
  };
  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
      setOnlineStatus("Conexion online establecida.");
    }
  };
  return pc;
}

function waitForIceGathering(pc) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    const timer = setTimeout(done, 4200);
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

function handleOnlineChannelOpen() {
  onlineState.connected = true;
  onlineState.localReady = false;
  onlineState.remoteReady = false;
  onlineState.lastPingAt = 0;
  onlineState.latencyMs = 0;
  onlineState.remoteInput = emptyInput();
  setCpuMode(false);
  setOnlineStatus(onlineState.role === "host"
    ? "Invitado conectado. Elijan luchador y marquen LISTO."
    : "Conectado. Elegi tu luchador y marca LISTO.");
  tickOnlineHeartbeat(true);
  if (onlineState.role === "host") {
    sendOnlineSetup();
    sendOnlineSnapshot(true);
  } else {
    sendLocalOnlineInput(true);
    sendOnlineSelection();
  }
}

function setupOnlineChannel(channel) {
  onlineState.channel = channel;
  channel.onopen = handleOnlineChannelOpen;
  channel.onmessage = (event) => {
    try {
      handleOnlineMessage(JSON.parse(event.data));
    } catch {
      setOnlineStatus("Llego un mensaje online que no se pudo leer.");
    }
  };
  channel.onclose = () => {
    onlineState.connected = false;
    onlineState.localReady = false;
    onlineState.remoteReady = false;
    setOnlineStatus("La conexion online se cerro.");
  };
  channel.onerror = () => {
    onlineState.connected = false;
    onlineState.localReady = false;
    onlineState.remoteReady = false;
    setOnlineStatus("Hubo un error en la conexion online.");
  };
}

function setupOnlinePeerChannel(connection) {
  onlineState.channel = connection;
  connection.on("open", handleOnlineChannelOpen);
  connection.on("data", (data) => {
    try {
      handleOnlineMessage(typeof data === "string" ? JSON.parse(data) : data);
    } catch {
      setOnlineStatus("Llego un mensaje online que no se pudo leer.");
    }
  });
  connection.on("close", () => {
    onlineState.connected = false;
    onlineState.localReady = false;
    onlineState.remoteReady = false;
    setOnlineStatus("La conexion online se cerro.");
  });
  connection.on("error", () => {
    onlineState.connected = false;
    onlineState.localReady = false;
    onlineState.remoteReady = false;
    setOnlineStatus("Hubo un error en la conexion online.");
  });
}

async function createOnlineInviteLink() {
  if (!onlineSupported()) {
    setOnlineStatus("Este navegador no soporta WebRTC.");
    return;
  }
  try {
    resetOnlineConnection();
    setCpuMode(false);
    onlineState.role = "host";
    onlineState.localSide = "left";
    onlineState.remoteSide = "right";
    onlineState.signaling = "link";
    onlineState.roomId = makeRoomId();
    onlineState.inviteLink = buildInviteLink(onlineState.roomId);
    onlineState.inviteReady = false;
    onlineState.remoteInput = emptyInput();
    const roomId = onlineState.roomId;
    setOnlineStatus("Preparando sala online. Esperá a que diga Link listo.");
    const Peer = await loadPeerJs();
    if (onlineState.role !== "host" || onlineState.roomId !== roomId) return;
    onlineState.peer = new Peer(roomId, { debug: 0 });
    onlineState.peer.on("open", () => {
      onlineState.inviteReady = true;
      setOnlineStatus("Link listo. Compartilo y dejá esta pantalla abierta.");
    });
    onlineState.peer.on("connection", (connection) => {
      setupOnlinePeerChannel(connection);
    });
    onlineState.peer.on("error", (error) => {
      onlineState.peer = null;
      onlineState.channel = null;
      onlineState.connected = false;
      onlineState.inviteReady = false;
      onlineState.inviteLink = "";
      onlineState.roomId = "";
      onlineState.manualVisible = true;
      setOnlineStatus(`No pude preparar el link automatico: ${error.message}. Usa codigos manuales o reintenta.`);
    });
    renderOnlinePanel();
  } catch (error) {
    if (onlineState.role === "host" && onlineState.inviteLink) {
      onlineState.inviteReady = false;
      onlineState.inviteLink = "";
      onlineState.roomId = "";
      onlineState.manualVisible = true;
      setOnlineStatus(`${error.message} Usa codigos manuales o reintenta el link.`);
    } else {
      resetOnlineConnection(true);
      onlineState.manualVisible = true;
      setOnlineStatus(`${error.message} Usa el modo manual como respaldo.`);
    }
  }
}

async function joinOnlineInviteRoom(roomId) {
  if (!onlineSupported()) {
    setOnlineStatus("Este navegador no soporta WebRTC.");
    return;
  }
  if (!roomId) {
    setOnlineStatus("No encontre la sala online en el link.");
    return;
  }
  try {
    resetOnlineConnection(true);
    setCpuMode(false);
    onlineState.role = "guest";
    onlineState.localSide = "right";
    onlineState.remoteSide = "left";
    onlineState.signaling = "link";
    onlineState.roomId = roomId;
    onlineState.inviteLink = buildInviteLink(roomId);
    onlineState.inviteReady = false;
    setOnlineStatus("Uniendote a la sala online...");
    const Peer = await loadPeerJs();
    onlineState.peer = new Peer(undefined, { debug: 0 });
    onlineState.peer.on("open", () => {
      const connection = onlineState.peer.connect(roomId, { reliable: true });
      setupOnlinePeerChannel(connection);
      setOnlineStatus("Conectando con el anfitrion...");
    });
    onlineState.peer.on("error", (error) => {
      resetOnlineConnection(true);
      onlineState.manualVisible = true;
      setOnlineStatus(`No encontre al anfitrion online. En la compu espera "Link listo" y deja esa pantalla abierta. Si sigue fallando, usen codigos manuales.`);
    });
    renderOnlinePanel();
  } catch (error) {
    resetOnlineConnection(true);
    setOnlineStatus(`${error.message} Pedile al anfitrion usar codigos manuales.`);
  }
}

async function createOnlineRoom() {
  if (!onlineSupported()) {
    setOnlineStatus("Este navegador no soporta WebRTC.");
    return;
  }
  try {
    resetOnlineConnection();
    setCpuMode(false);
    onlineState.role = "host";
    onlineState.localSide = "left";
    onlineState.remoteSide = "right";
    onlineState.remoteInput = emptyInput();
    onlineState.pc = createOnlinePeerConnection();
    setupOnlineChannel(onlineState.pc.createDataChannel("mini-kombat-input"));
    const offer = await onlineState.pc.createOffer();
    await onlineState.pc.setLocalDescription(offer);
    setOnlineStatus("Creando codigo de sala...");
    await waitForIceGathering(onlineState.pc);
    onlineState.offerCode = encodeOnlineSignal(onlineState.pc.localDescription);
    setOnlineStatus("Sala creada. Compartile el codigo al invitado.");
  } catch (error) {
    resetOnlineConnection(true);
    setOnlineStatus(`No pude crear la sala: ${error.message}`);
  }
}

async function joinOnlineRoom(code) {
  if (!onlineSupported()) {
    setOnlineStatus("Este navegador no soporta WebRTC.");
    return;
  }
  if (!code.trim()) {
    setOnlineStatus("Pegá el codigo de sala para unirte.");
    return;
  }
  try {
    const offer = decodeOnlineSignal(code);
    resetOnlineConnection(true);
    setCpuMode(false);
    onlineState.role = "guest";
    onlineState.localSide = "right";
    onlineState.remoteSide = "left";
    onlineState.pc = createOnlinePeerConnection();
    onlineState.pc.ondatachannel = (event) => setupOnlineChannel(event.channel);
    await onlineState.pc.setRemoteDescription(offer);
    const answer = await onlineState.pc.createAnswer();
    await onlineState.pc.setLocalDescription(answer);
    setOnlineStatus("Generando respuesta para el anfitrion...");
    await waitForIceGathering(onlineState.pc);
    onlineState.answerCode = encodeOnlineSignal(onlineState.pc.localDescription);
    setOnlineStatus("Respuesta lista. Enviale este codigo al anfitrion.");
  } catch (error) {
    resetOnlineConnection(true);
    setOnlineStatus(`No pude unirme: ${error.message}`);
  }
}

async function acceptOnlineAnswer(code) {
  if (onlineState.role !== "host" || !onlineState.pc) {
    setOnlineStatus("Primero creá una sala.");
    return;
  }
  if (!code.trim()) {
    setOnlineStatus("Pegá la respuesta del invitado.");
    return;
  }
  try {
    await onlineState.pc.setRemoteDescription(decodeOnlineSignal(code));
    setOnlineStatus("Respuesta recibida. Conectando...");
  } catch (error) {
    setOnlineStatus(`No pude aceptar la respuesta: ${error.message}`);
  }
}

function sendOnlineMessage(message) {
  if (!onlineChannelIsOpen()) return false;
  try {
    if (onlineState.channel.readyState) onlineState.channel.send(JSON.stringify(message));
    else onlineState.channel.send(message);
    return true;
  } catch {
    onlineState.connected = false;
    setOnlineStatus("No pude enviar datos online.");
    return false;
  }
}

function tickOnlineHeartbeat(force = false) {
  if (!onlineConnected()) return;
  const now = performance.now();
  if (!force && now - onlineState.lastPingAt < ONLINE_PING_EVERY_MS) return;
  onlineState.lastPingAt = now;
  sendOnlineMessage({ type: "ping", at: now });
}

function applyOnlinePong(message) {
  if (typeof message.at !== "number") return;
  onlineState.latencyMs = Math.round(Math.max(0, performance.now() - message.at));
  if (overlayMode === "online") renderOnlinePanel();
}

function sendOnlineReady() {
  if (onlineState.role === "host") {
    sendOnlineSetup();
    return;
  }
  if (onlineState.role === "guest") {
    sendOnlineMessage({
      type: "ready",
      ready: onlineState.localReady,
      fighterId: selectedRightId,
    });
  }
}

function setOnlineLocalReady(nextReady) {
  if (!onlineConnected()) {
    setOnlineStatus("Todavia falta completar la conexion online.");
    return;
  }
  if (running && !winner) return;
  onlineState.localReady = Boolean(nextReady);
  sendOnlineReady();
  playSound(onlineState.localReady ? "menu" : "select");
  setOnlineStatus(onlineReadyStatusText());
}

function applyOnlineReady(message) {
  if (onlineState.role === "host") {
    const nextId = fighterProfiles[message.fighterId] ? message.fighterId : "";
    if (nextId && (!running || winner)) {
      selectedRightId = nextId;
      fighters = buildFighters();
      updateFighterLabels();
    }
    onlineState.remoteReady = Boolean(message.ready);
    setOnlineStatus(onlineReadyStatusText());
    sendOnlineSetup();
    return;
  }
  if (onlineState.role === "guest") {
    onlineState.remoteReady = Boolean(message.ready);
    setOnlineStatus(onlineReadyStatusText());
  }
}

function handleOnlineMessage(message) {
  if (!message || typeof message !== "object") return;
  if (message.type === "ping") {
    sendOnlineMessage({ type: "pong", at: message.at });
    return;
  }
  if (message.type === "pong") {
    applyOnlinePong(message);
    return;
  }
  if (message.type === "ready") {
    applyOnlineReady(message);
    return;
  }
  if (message.type === "input" && onlineState.role === "host") {
    onlineState.remoteInput = normalizeInput(message.input);
    return;
  }
  if (message.type === "select" && onlineState.role === "host") {
    applyOnlineGuestSelection(message);
    return;
  }
  if (message.type === "pause" && onlineState.role === "host") {
    applyOnlinePauseRequest();
    return;
  }
  if (message.type === "setup" && onlineState.role === "guest") {
    applyOnlineSetup(message);
    return;
  }
  if (message.type === "snapshot" && onlineState.role === "guest") {
    applyOnlineSnapshot(message);
  }
}

function sendOnlineSetup() {
  if (!onlineHostActive()) return;
  sendOnlineMessage({
    type: "setup",
    leftId: selectedLeftId,
    rightId: selectedRightId,
    roundNumber,
    hostReady: onlineHostReady(),
    guestReady: onlineGuestReady(),
  });
}

function applyOnlineSetup(message) {
  selectedLeftId = fighterProfiles[message.leftId] ? message.leftId : selectedLeftId;
  selectedRightId = fighterProfiles[message.rightId] ? message.rightId : selectedRightId;
  onlineState.remoteReady = Boolean(message.hostReady);
  onlineState.localReady = Boolean(message.guestReady);
  tournamentMode = false;
  tournamentActive = false;
  cpuEnabled = false;
  fighters = buildFighters();
  roundNumber = message.roundNumber || 1;
  updateFighterLabels();
  setCpuMode(false);
  if (overlayMode === "online") {
    startButton.textContent = onlinePrimaryActionLabel();
    onlineState.status = onlineReadyStatusText();
  }
  if (overlayMode === "online") renderOnlinePanel();
}

function sendOnlineSelection() {
  if (onlineState.role !== "guest") return;
  sendOnlineMessage({
    type: "select",
    side: "right",
    fighterId: selectedRightId,
    ready: onlineState.localReady,
  });
}

function applyOnlineGuestSelection(message) {
  if (running && !winner) return;
  const nextId = fighterProfiles[message.fighterId] ? message.fighterId : "";
  if (!nextId) return;
  selectedRightId = nextId;
  onlineState.remoteReady = Boolean(message.ready);
  fighters = buildFighters();
  updateFighterLabels();
  setOnlineStatus(onlineReadyStatusText());
  sendOnlineSetup();
}

function setOnlineLocalFighter(nextId) {
  if (!fighterProfiles[nextId] || (running && !winner)) return;
  ensureAudio();
  if (onlineState.role === "host") {
    selectedLeftId = nextId;
    onlineState.localReady = false;
    fighters = buildFighters();
    updateFighterLabels();
    sendOnlineSetup();
    setOnlineStatus(onlineConnected()
      ? onlineReadyStatusText()
      : `${fighterProfiles[nextId].name} listo. Comparti el link cuando quieras.`);
  } else if (onlineState.role === "guest") {
    selectedRightId = nextId;
    onlineState.localReady = false;
    fighters = buildFighters();
    updateFighterLabels();
    sendOnlineSelection();
    setOnlineStatus(onlineConnected()
      ? onlineReadyStatusText()
      : `${fighterProfiles[nextId].name} listo. Se enviara al conectar.`);
  }
  playSound("select");
}

function applyOnlinePauseRequest() {
  if (!running || winner) return;
  togglePause();
  setOnlineStatus(paused ? "Pelea pausada por pedido del invitado." : "Pelea reanudada.");
}

function serializeFighter(f) {
  const data = {};
  for (const [key, value] of Object.entries(f)) {
    if (value === null || ["number", "string", "boolean"].includes(typeof value)) data[key] = value;
  }
  data.attack = f.attack ? { ...f.attack } : null;
  return data;
}

function applyFighterSnapshot(f, data) {
  const attack = data.attack ? { ...data.attack } : null;
  for (const [key, value] of Object.entries(data)) {
    if (key !== "attack") f[key] = value;
  }
  f.attack = attack;
  f.specialStyle = SPECIAL_STYLES[f.profileId] ?? SPECIAL_STYLES.p1;
  f.outfit = normalizeOutfit(f.color, f.trim, f.outfit);
  f.onlinePrevInput = f.onlinePrevInput ?? emptyInput();
}

function serializeProjectiles() {
  return projectiles.map((p) => ({
    owner: p.owner,
    x: p.x,
    y: p.y,
    baseY: p.baseY,
    vx: p.vx,
    vy: p.vy,
    life: p.life,
    maxLife: p.maxLife,
    r: p.r,
    damage: p.damage,
    color: p.color,
    profileId: p.profileId,
    dir: p.dir,
    waveAmp: p.waveAmp,
    waveRate: p.waveRate,
    spinRate: p.spinRate,
    pierce: Boolean(p.pierce),
    age: p.age ?? 0,
    trail: Array.isArray(p.trail) ? p.trail.slice(-12).map((point) => ({ x: point.x, y: point.y })) : [],
  }));
}

function sendOnlineSnapshot(force = false) {
  if (!onlineHostActive()) return;
  onlineState.snapshotTick += 1;
  if (!force && onlineState.snapshotTick % ONLINE_SYNC_EVERY !== 0) return;
  sendOnlineMessage({
    type: "snapshot",
    leftId: selectedLeftId,
    rightId: selectedRightId,
    roundNumber,
    running,
    paused,
    winner,
    matchOver,
    roundWinnerId,
    matchWinnerId,
    roundFinishKind,
    countdownFrames,
    roundTimerFrames,
    koFreeze,
    roundFrame,
    resultFrame,
    flash,
    shake,
    hitStopFrames,
    cameraZoom,
    cameraPan,
    cameraLift,
    cameraImpactPulse,
    cameraImpactMax,
    cameraImpactDir,
    cameraImpactStrength,
    cinematicHitPulse,
    cinematicHitMax,
    cinematicHitDir,
    cinematicHitColor,
    cinematicHitStrength,
    cinematicHitZoom,
    cinematicHitPan,
    cinematicHitLift,
    cinematicHitRoll,
    cinematicHitBand,
    screenTearPulse,
    screenTearMax,
    screenTearDir,
    screenTearColor,
    screenTearStrength,
    finishFreezeCue,
    finalPressurePulse,
    finalPressureSecondCue,
    fighters: fighters.map(serializeFighter),
    projectiles: serializeProjectiles(),
  });
}

function applyOnlineSnapshot(snapshot) {
  if (fighterProfiles[snapshot.leftId] && fighterProfiles[snapshot.rightId] && (snapshot.leftId !== selectedLeftId || snapshot.rightId !== selectedRightId)) {
    selectedLeftId = snapshot.leftId;
    selectedRightId = snapshot.rightId;
    fighters = buildFighters();
    updateFighterLabels();
  }

  running = Boolean(snapshot.running);
  paused = Boolean(snapshot.paused);
  winner = snapshot.winner || "";
  matchOver = Boolean(snapshot.matchOver);
  roundWinnerId = snapshot.roundWinnerId || "";
  matchWinnerId = snapshot.matchWinnerId || "";
  roundFinishKind = snapshot.roundFinishKind || "ko";
  roundNumber = snapshot.roundNumber || roundNumber;
  countdownFrames = Math.max(0, snapshot.countdownFrames || 0);
  roundTimerFrames = Math.max(0, snapshot.roundTimerFrames ?? roundTimerFrames);
  koFreeze = Math.max(0, snapshot.koFreeze || 0);
  roundFrame = snapshot.roundFrame || 0;
  resultFrame = snapshot.resultFrame || 0;
  flash = snapshot.flash || 0;
  shake = snapshot.shake || 0;
  hitStopFrames = snapshot.hitStopFrames || 0;
  cameraZoom = snapshot.cameraZoom || 1;
  cameraPan = snapshot.cameraPan || 0;
  cameraLift = snapshot.cameraLift ?? 8;
  cameraImpactPulse = snapshot.cameraImpactPulse || 0;
  cameraImpactMax = snapshot.cameraImpactMax || 1;
  cameraImpactDir = snapshot.cameraImpactDir || 1;
  cameraImpactStrength = snapshot.cameraImpactStrength || 0;
  cinematicHitPulse = snapshot.cinematicHitPulse || 0;
  cinematicHitMax = snapshot.cinematicHitMax || 1;
  cinematicHitDir = snapshot.cinematicHitDir || 1;
  cinematicHitColor = snapshot.cinematicHitColor || "#fff1bd";
  cinematicHitStrength = snapshot.cinematicHitStrength || 0;
  cinematicHitZoom = snapshot.cinematicHitZoom || 0.022;
  cinematicHitPan = snapshot.cinematicHitPan || 6.4;
  cinematicHitLift = snapshot.cinematicHitLift || 2.6;
  cinematicHitRoll = snapshot.cinematicHitRoll || 0;
  cinematicHitBand = snapshot.cinematicHitBand || 1;
  screenTearPulse = snapshot.screenTearPulse || 0;
  screenTearMax = snapshot.screenTearMax || 1;
  screenTearDir = snapshot.screenTearDir || 1;
  screenTearColor = snapshot.screenTearColor || "#fff1bd";
  screenTearStrength = snapshot.screenTearStrength || 0;
  finishFreezeCue = snapshot.finishFreezeCue || null;
  finalPressurePulse = snapshot.finalPressurePulse || 0;
  finalPressureSecondCue = snapshot.finalPressureSecondCue || 0;

  if (Array.isArray(snapshot.fighters)) {
    for (const fighterData of snapshot.fighters) {
      const fighter = fighters.find((f) => f.id === fighterData.id);
      if (fighter) applyFighterSnapshot(fighter, fighterData);
    }
  }

  projectiles.length = 0;
  if (Array.isArray(snapshot.projectiles)) {
    for (const p of snapshot.projectiles) {
      projectiles.push({
        ...p,
        style: SPECIAL_STYLES[p.profileId] ?? SPECIAL_STYLES.p1,
        trail: Array.isArray(p.trail) ? p.trail : [],
      });
    }
  }

  if (paused && running && !winner) {
    showPauseOverlay();
    return;
  }
  if (running || winner) overlay.classList.add("hidden");
  syncShellState();
}

function sendLocalOnlineInput(force = false) {
  if (!onlineGuestActive()) return;
  const fighter = fighters.find((f) => f.id === onlineLocalFighterId()) ?? fighters[1];
  const input = normalizeInput(readHumanInputForFighter(fighter));
  const payload = JSON.stringify(input);
  if (!force && payload === onlineState.lastInputPayload) return;
  onlineState.lastInputPayload = payload;
  sendOnlineMessage({ type: "input", input });
}

function updateOnlineGuestView() {
  sendLocalOnlineInput();
  updateCameraImpactPulse();
  updateParticles();
  updateFloatingTexts();
  if (flash > 0) flash -= 1;
  if (shake > 0) shake -= 1;
}

function startOnlineMatch() {
  if (!onlineHostActive()) {
    setOnlineStatus("Todavia falta conectar al invitado.");
    return;
  }
  if (!onlineBothReady()) {
    setOnlineStatus(onlineReadyStatusText());
    return;
  }
  tournamentMode = false;
  tournamentActive = false;
  setCpuMode(false);
  fighters = buildFighters();
  fighters[0].wins = 0;
  fighters[1].wins = 0;
  roundNumber = 1;
  matchOver = false;
  roundWinnerId = "";
  matchWinnerId = "";
  sendOnlineSetup();
  resetRound();
  sendOnlineSnapshot(true);
  setOnlineStatus("Pelea online iniciada.");
}

function prepareOnlineRematchLobby() {
  if (!onlineConnected()) {
    resetGame();
    return;
  }
  clearRoundTimers();
  running = false;
  paused = false;
  winner = "";
  matchOver = false;
  roundWinnerId = "";
  matchWinnerId = "";
  roundNumber = 1;
  flash = 0;
  shake = 0;
  hitStopFrames = 0;
  koFreeze = 0;
  resultFrame = 0;
  roundFrame = 0;
  countdownFrames = 0;
  finishFreezeCue = null;
  fighters = buildFighters();
  fighters[0].wins = 0;
  fighters[1].wins = 0;
  projectiles.length = 0;
  onlineState.localReady = false;
  onlineState.remoteReady = false;
  onlineState.lastInputPayload = "";
  updateFighterLabels();
  showOnlineOverlay();
  setOnlineStatus(onlineState.role === "host"
    ? "Revancha preparada. Marquen LISTO para volver a pelear."
    : "Revancha preparada. Elegi luchador y marca LISTO.");
  if (onlineState.role === "host") sendOnlineSetup();
  else sendOnlineReady();
}

function makeOnlineButton(label, className, onClick, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.disabled = disabled;
  let lastHandledAt = 0;
  const handlePress = (event) => {
    if (button.disabled) return;
    const now = Date.now();
    if (now - lastHandledAt < 420) return;
    lastHandledAt = now;
    const result = onClick(event);
    if (result?.catch) result.catch((error) => setOnlineStatus(error.message || "No pude completar la accion online."));
  };
  button.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    event.preventDefault();
    handlePress(event);
  });
  button.addEventListener("click", handlePress);
  return button;
}

function makeOnlineTextarea(id, value, placeholder, readOnly = false) {
  const textarea = document.createElement("textarea");
  textarea.id = id;
  textarea.value = value || "";
  textarea.placeholder = placeholder;
  textarea.readOnly = readOnly;
  textarea.spellcheck = false;
  return textarea;
}

function makeOnlineFighterPicker(title, selectedId, editable, onPick, note = "") {
  const picker = document.createElement("section");
  picker.className = "online-fighter-picker";
  const selectedProfile = fighterProfiles[selectedId];
  picker.style.setProperty("--fighter-color", selectedProfile.color);
  picker.style.setProperty("--fighter-trim", selectedProfile.trim);

  const header = document.createElement("div");
  header.className = "online-fighter-picker-head";
  const label = document.createElement("strong");
  label.textContent = title;
  const current = document.createElement("span");
  current.textContent = note || selectedProfile.name;
  header.append(label, current);
  picker.append(header);

  const grid = document.createElement("div");
  grid.className = "online-fighter-grid";
  for (const id of fighterIds) {
    const profile = fighterProfiles[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fighter-choice";
    button.dataset.fighter = id;
    button.style.setProperty("--choice-color", profile.color);
    button.style.setProperty("--choice-trim", profile.trim);
    button.setAttribute("aria-pressed", String(id === selectedId));
    button.disabled = !editable;

    const image = document.createElement("img");
    image.src = profile.face.src;
    image.alt = profile.name;
    const text = document.createElement("span");
    text.textContent = profile.name;
    button.append(image, text);
    if (editable) button.addEventListener("click", () => onPick(id));
    grid.append(button);
  }
  picker.append(grid);
  return picker;
}

function makeOnlineLobbyPlayer(title, profile, ready, local) {
  const player = document.createElement("div");
  player.className = `online-lobby-player ${ready ? "is-ready" : ""}`;
  player.style.setProperty("--fighter-trim", profile.trim);

  const image = document.createElement("img");
  image.src = profile.face.src;
  image.alt = profile.name;

  const text = document.createElement("div");
  const label = document.createElement("span");
  label.textContent = local ? `${title} - vos` : title;
  const name = document.createElement("strong");
  name.textContent = profile.name;
  const state = document.createElement("em");
  state.textContent = onlineReadyLabel(ready);
  text.append(label, name, state);

  player.append(image, text);
  return player;
}

function makeOnlineLobbyStatus() {
  const lobby = document.createElement("div");
  lobby.className = "online-lobby-state";
  lobby.append(
    makeOnlineLobbyPlayer("Anfitrion", fighterProfiles[selectedLeftId], onlineHostReady(), onlineState.role === "host"),
    makeOnlineLobbyPlayer("Invitado", fighterProfiles[selectedRightId], onlineGuestReady(), onlineState.role === "guest"),
  );

  const quality = document.createElement("div");
  quality.className = "online-connection-quality";
  quality.innerHTML = `<strong>Conexion</strong><span>${onlineLatencyLabel()}</span>`;
  lobby.append(quality);
  return lobby;
}

function onlineInviteShareText() {
  return `Unite a mi pelea de Mini Kombat IV: ${onlineState.inviteLink}`;
}

function mobileSharePreferred() {
  return /android|iphone|ipad|ipod/iu.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth <= 920);
}

function openOnlineShareFallback(text) {
  if (!mobileSharePreferred()) return false;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const opened = window.open(url, "_blank");
  if (!opened) return false;
  opened.opener = null;
  setOnlineStatus("Se abrio WhatsApp para compartir el link.");
  return true;
}

function selectOnlineCode(value) {
  const textarea = Array.from(document.querySelectorAll(".online-code-block textarea"))
    .find((node) => node.value === value);
  if (!textarea) return false;
  textarea.readOnly = false;
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange?.(0, textarea.value.length);
  textarea.readOnly = true;
  return true;
}

function copyOnlineCode(code) {
  if (!code) {
    setOnlineStatus("Todavia no hay codigo para copiar.");
    return;
  }
  const write = navigator.clipboard?.writeText?.(code);
  if (!write) {
    selectOnlineCode(code);
    setOnlineStatus("No pude copiar automatico. El link quedo seleccionado para copiar manualmente.");
    return;
  }
  write
    .then(() => setOnlineStatus("Codigo copiado."))
    .catch(() => {
      selectOnlineCode(code);
      setOnlineStatus("No pude copiarlo automaticamente. El link quedo seleccionado para copiar manualmente.");
    });
}

async function shareOnlineInviteLink() {
  if (!onlineState.inviteLink) {
    setOnlineStatus("Todavia no hay link para compartir.");
    return;
  }
  if (onlineState.role === "host" && !onlineState.inviteReady) {
    setOnlineStatus("Esperá a que diga Link listo antes de compartir.");
    return;
  }
  const shareText = onlineInviteShareText();
  if (navigator.share && window.isSecureContext) {
    try {
      await navigator.share({
        title: "Mini Kombat IV Online",
        text: "Unite a mi pelea de Mini Kombat IV.",
        url: onlineState.inviteLink,
      });
      setOnlineStatus("Link compartido. Esperando invitado...");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        setOnlineStatus("No se compartio el link.");
        return;
      }
    }
  }
  if (openOnlineShareFallback(shareText)) return;
  copyOnlineCode(onlineState.inviteLink);
}

function renderOnlinePanel() {
  fighterSelect.innerHTML = "";
  fighterSelect.classList.remove("versus-panel", "winner-panel");
  fighterSelect.classList.add("online-panel");

  const panel = document.createElement("section");
  panel.className = "online-card";

  const status = document.createElement("div");
  status.className = `online-status ${onlineConnected() ? "is-connected" : ""}`;
  status.textContent = onlineState.status;
  panel.append(status);

  const role = document.createElement("div");
  role.className = "online-role";
  role.innerHTML = onlineState.role
    ? `<strong>${onlineState.role === "host" ? "Anfitrion" : "Invitado"}</strong><span>${onlineState.localSide === "left" ? "Controlas izquierda" : "Controlas derecha"}</span>`
    : "<strong>Modo experimental</strong><span>Funciona gratis con codigos WebRTC. Puede fallar en algunas redes estrictas.</span>";
  panel.append(role);

  if (onlineState.role) panel.append(makeOnlineLobbyStatus());

  if (onlineState.role === "host") {
    const hostCanEdit = (!running || winner) && !onlineState.localReady;
    const guestNote = onlineConnected()
      ? `${fighterProfiles[selectedRightId].name} - ${onlineReadyLabel(onlineGuestReady())}`
      : "Esperando invitado";
    panel.append(
      makeOnlineFighterPicker("Tu luchador", selectedLeftId, hostCanEdit, setOnlineLocalFighter, onlineState.localReady ? "Listo confirmado" : ""),
      makeOnlineFighterPicker("Invitado", selectedRightId, false, () => {}, guestNote),
    );
  } else if (onlineState.role === "guest") {
    const guestCanEdit = (!running || winner) && !onlineState.localReady;
    panel.append(makeOnlineFighterPicker("Elegi tu luchador", selectedRightId, guestCanEdit, setOnlineLocalFighter, onlineState.localReady ? "Listo confirmado" : ""));
  }

  const actions = document.createElement("div");
  actions.className = "online-action-grid";
  if (!onlineState.role) {
    actions.append(makeOnlineButton("CREAR LINK", "primary-online", () => createOnlineInviteLink()));
  } else if (onlineState.role === "host" && onlineState.manualVisible && !onlineState.inviteLink && !onlineConnected()) {
    actions.append(makeOnlineButton("REINTENTAR LINK", "primary-online", () => createOnlineInviteLink()));
  }
  if (onlineState.inviteLink && onlineState.role === "host" && !onlineConnected()) {
    if (onlineState.inviteReady) {
      actions.append(
        makeOnlineButton("COMPARTIR LINK", "primary-online", shareOnlineInviteLink),
        makeOnlineButton("COPIAR LINK", "", () => copyOnlineCode(onlineState.inviteLink)),
      );
    } else {
      actions.append(makeOnlineButton("PREPARANDO LINK", "", () => {}, true));
    }
  }
  if (!onlineState.role || onlineState.manualVisible) {
    actions.append(makeOnlineButton(onlineState.manualVisible ? "OCULTAR CODIGOS" : "USAR CODIGOS", "", () => {
      onlineState.manualVisible = !onlineState.manualVisible;
      renderOnlinePanel();
    }));
  }
  if (onlineState.manualVisible) {
    actions.append(
      makeOnlineButton("CREAR SALA MANUAL", "", () => createOnlineRoom()),
      makeOnlineButton("UNIRME CON CODIGO", "", () => {
        const code = document.querySelector("#online-offer-input")?.value ?? "";
        joinOnlineRoom(code);
      }),
    );
  }
  if (onlineState.role === "host" && onlineState.offerCode && !onlineConnected() && onlineState.manualVisible) {
    actions.append(makeOnlineButton("CONECTAR RESPUESTA", "", () => {
      const code = document.querySelector("#online-answer-input")?.value ?? "";
      acceptOnlineAnswer(code);
    }));
  }
  if (onlineConnected()) {
    actions.append(makeOnlineButton(onlineState.localReady ? "QUITAR LISTO" : "MARCAR LISTO", onlineState.localReady ? "" : "primary-online", () => setOnlineLocalReady(!onlineState.localReady)));
  }
  if (onlineHostActive() && onlineBothReady()) actions.append(makeOnlineButton("INICIAR PELEA", "primary-online", startOnlineMatch));
  if (onlineState.role || onlineConnected()) actions.append(makeOnlineButton("CORTAR", "danger-online", () => resetOnlineConnection()));
  panel.append(actions);

  if (onlineState.inviteLink && onlineState.role === "host") {
    const linkWrap = document.createElement("label");
    linkWrap.className = "online-code-block online-link-block";
    linkWrap.append(document.createElement("span"));
    linkWrap.querySelector("span").textContent = onlineState.inviteReady
      ? "Link para enviar al invitado"
      : "Link pendiente: espera Link listo";
    const linkInput = makeOnlineTextarea("online-invite-link", onlineState.inviteLink, "Link de invitacion online.", true);
    linkWrap.append(linkInput);
    panel.append(linkWrap);
  }

  if (onlineState.manualVisible && onlineState.role !== "guest") {
    const offerWrap = document.createElement("label");
    offerWrap.className = "online-code-block";
    offerWrap.append(document.createElement("span"));
    offerWrap.querySelector("span").textContent = onlineState.offerCode ? "Codigo para enviar al invitado" : "Codigo de sala del anfitrion";
    offerWrap.append(makeOnlineTextarea("online-offer-input", onlineState.offerCode, "Si sos invitado, pega aca el codigo de sala.", Boolean(onlineState.offerCode)));
    if (onlineState.offerCode) offerWrap.append(makeOnlineButton("COPIAR CODIGO", "", () => copyOnlineCode(onlineState.offerCode)));
    panel.append(offerWrap);
  }

  if (onlineState.manualVisible && (onlineState.role !== "guest" || onlineState.answerCode)) {
    const answerWrap = document.createElement("label");
    answerWrap.className = "online-code-block";
    answerWrap.append(document.createElement("span"));
    answerWrap.querySelector("span").textContent = onlineState.answerCode ? "Respuesta para enviar al anfitrion" : "Respuesta del invitado";
    answerWrap.append(makeOnlineTextarea("online-answer-input", onlineState.answerCode, "Si sos anfitrion, pega aca la respuesta del invitado.", onlineState.role === "guest" && Boolean(onlineState.answerCode)));
    if (onlineState.answerCode) answerWrap.append(makeOnlineButton("COPIAR RESPUESTA", "", () => copyOnlineCode(onlineState.answerCode)));
    panel.append(answerWrap);
  }

  const note = document.createElement("p");
  note.className = "online-note";
  note.textContent = onlineConnected()
    ? "Cuando ambos estados muestren LISTO, el anfitrion puede iniciar la pelea."
    : onlineState.inviteLink && !onlineState.inviteReady
    ? "Esperá a que el estado diga Link listo antes de compartirlo."
    : onlineState.manualVisible
    ? "Modo respaldo: anfitrion crea sala manual, invitado pega ese codigo, y devuelve la respuesta al anfitrion."
    : "Flujo recomendado: crea el link, compartilo por WhatsApp o mensaje y espera a que el invitado entre.";
  panel.append(note);
  fighterSelect.append(panel);
}

function showOnlineOverlay() {
  overlayMode = "online";
  overlay.dataset.screen = "online";
  paused = running && !winner;
  overlay.querySelector("h1").textContent = "Online";
  overlayCopy.textContent =
    "Crea un link, compartilo y esperen a que ambos elijan luchador y marquen LISTO.";
  fighterSelect.classList.remove("hidden");
  renderOnlinePanel();
  startButton.textContent = onlinePrimaryActionLabel();
  overlay.classList.remove("hidden");
  syncShellState();
  syncOnlineButtons();
}

function onlineRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");
  return room && /^mk3-[a-z0-9-]+$/iu.test(room) ? room : "";
}

function maybeAutoJoinOnlineFromUrl() {
  const room = onlineRoomFromUrl();
  if (!room) return;
  showOnlineOverlay();
  joinOnlineInviteRoom(room);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)) event.preventDefault();
  const freshPress = !event.repeat && !keys.has(key);
  if (key === "escape") {
    event.preventDefault();
    requestOnlinePauseToggle();
    return;
  }
  keys.add(key);
  if (onlineGuestActive()) sendLocalOnlineInput(true);
  if (freshPress && running && koFreeze <= 0 && countdownFrames <= 0) handleActionKey(key);
  if (freshPress && (key === "enter" || key === " ") && (!running || paused)) advanceOverlay();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
  if (onlineGuestActive()) sendLocalOnlineInput(true);
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
  if (onlineGuestActive()) {
    sendLocalOnlineInput(true);
    return;
  }
  for (const f of fighters) {
    if (!canStartLocalActionFor(f)) continue;
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
  if (onlineGuestActive()) {
    sendLocalOnlineInput(true);
    return;
  }
  if (!pressed || !running || koFreeze > 0 || countdownFrames > 0) return;
  const player = fighters.find((f) => f.id === touchControlsFighterId());
  if (!player || !canStartLocalActionFor(player)) return;
  if (action === "special" || (action === "punch" && touchInput.block)) startSpecial(player);
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
    const travel = mobileStickBase ? Math.min(34, Math.round(Math.min(mobileStickBase.offsetWidth, mobileStickBase.offsetHeight) * 0.34)) : 34;
    mobileStickKnob.style.transform = `translate(calc(-50% + ${Math.round(x * travel)}px), calc(-50% + ${Math.round(y * travel)}px))`;
  }
  if (onlineGuestActive()) sendLocalOnlineInput();
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

if (mobilePauseButton) {
  mobilePauseButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureAudio();
    mobilePauseButton.classList.add("is-tapped");
    window.setTimeout(() => mobilePauseButton.classList.remove("is-tapped"), 220);
    requestOnlinePauseToggle();
  });
}

function preventZoomGesture(event) {
  if (event.cancelable) event.preventDefault();
}

["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
  document.addEventListener(eventName, preventZoomGesture, { passive: false });
});

document.addEventListener("dblclick", (event) => {
  if (event.target.closest("#mobile-controls, #mobile-pause")) event.preventDefault();
}, { passive: false });

if (mobileControls) {
  mobileControls.addEventListener("touchstart", preventZoomGesture, { passive: false });
  mobileControls.addEventListener("touchend", (event) => {
    const now = Date.now();
    if (now - lastControlTap < 450 && event.cancelable) event.preventDefault();
    lastControlTap = now;
  }, { passive: false });
}

if (mobilePauseButton) {
  mobilePauseButton.addEventListener("touchstart", preventZoomGesture, { passive: false });
  mobilePauseButton.addEventListener("touchend", preventZoomGesture, { passive: false });
}

setCpuMode(cpuEnabled);
setTournamentMode(tournamentMode);
setDifficulty(cpuDifficulty);
setSound(soundEnabled);
showHomeOverlay();
maybeAutoJoinOnlineFromUrl();
requestAnimationFrame(loop);
