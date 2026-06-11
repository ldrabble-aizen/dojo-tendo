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

const W = canvas.width;
const H = canvas.height;
const FLOOR = 424;
const GRAVITY = 0.72;
const keys = new Set();
let lastControlTap = 0;
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
const faces = {
  p1: loadImage("assets/fighter-1-face.png"),
  p2: loadImage("assets/fighter-2-face.png"),
  p3: loadImage("assets/fighter-3-face.png"),
  p4: loadImage("assets/fighter-4-face.png"),
  p5: loadImage("assets/fighter-5-face.png"),
  p6: loadImage("assets/fighter-6-face.png"),
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
let koFreeze = 0;
let roundFrame = 0;
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

const BODY_SPECS = {
  athletic: {
    shoulder: 41,
    waist: 27,
    hip: 34,
    limb: 0.98,
    hand: 0.92,
    foot: 0.94,
    headW: 88,
    headH: 94,
    headY: 18,
    stance: 0.95,
  },
  balanced: {
    shoulder: 44,
    waist: 30,
    hip: 37,
    limb: 1.03,
    hand: 1,
    foot: 1,
    headW: 92,
    headH: 98,
    headY: 16,
    stance: 1,
  },
  heavy: {
    shoulder: 50,
    waist: 36,
    hip: 43,
    limb: 1.14,
    hand: 1.12,
    foot: 1.12,
    headW: 98,
    headH: 102,
    headY: 14,
    stance: 1.12,
  },
  lean: {
    shoulder: 39,
    waist: 26,
    hip: 32,
    limb: 0.94,
    hand: 0.9,
    foot: 0.9,
    headW: 88,
    headH: 94,
    headY: 18,
    stance: 0.9,
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
    build: "athletic",
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
    color: "#318f79",
    trim: "#f0d36b",
    face: faces.p3,
    skin: "#d6a07e",
    build: "heavy",
    mark: "M",
    outfit: {
      jacket: "#318f79",
      pants: "#226454",
      sleeve: "#f0d36b",
      belt: "#f0d36b",
      shoe: "#d2ae46",
      accent: "#8ef0d7",
      pattern: "power",
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
    build: "lean",
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
    build: "athletic",
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
    makeFighter({ ...fighterProfiles[selectedLeftId], id: "left", profileId: selectedLeftId, x: 214, dir: 1, controls: leftControls }),
    makeFighter({ ...fighterProfiles[selectedRightId], id: "right", profileId: selectedRightId, x: 746, dir: -1, controls: rightControls }),
  ];
}

function makeFighter({ id, profileId, name, x, dir, color, trim, face, controls, skin, build, mark, outfit }) {
  return {
    id,
    profileId,
    name,
    x,
    y: FLOOR,
    vx: 0,
    vy: 0,
    w: 62,
    h: 146,
    dir,
    color,
    trim,
    face,
    skin,
    build,
    mark,
    outfit: normalizeOutfit(color, trim, outfit),
    controls,
    health: 100,
    energy: 52,
    grounded: true,
    blocking: false,
    crouch: 0,
    attack: null,
    cooldown: 0,
    hurt: 0,
    specialCooldown: 0,
    counterWindow: 0,
    hitFlash: 0,
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
  fighters[0].wins = 0;
  fighters[1].wins = 0;
  roundNumber = 1;
  matchOver = false;
  roundWinnerId = "";
  matchWinnerId = "";
  resetRound();
}

function resetRound() {
  Object.assign(fighters[0], {
    x: 214,
    y: FLOOR,
    vx: 0,
    vy: 0,
    dir: 1,
    health: 100,
    energy: 52,
    attack: null,
    cooldown: 0,
    hurt: 0,
    hitFlash: 0,
    blocking: false,
    grounded: true,
    specialCooldown: 0,
    counterWindow: 0,
  });

  Object.assign(fighters[1], {
    x: 746,
    y: FLOOR,
    vx: 0,
    vy: 0,
    dir: -1,
    health: 100,
    energy: 52,
    attack: null,
    cooldown: 0,
    hurt: 0,
    hitFlash: 0,
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
  koFreeze = 0;
  roundFrame = 0;
  countdownFrames = 180;
  paused = false;
  running = true;
  overlay.classList.add("hidden");
}

function showHomeOverlay() {
  overlayMode = "home";
  overlay.dataset.screen = "home";
  overlay.dataset.mode = tournamentMode ? "tournament" : "match";
  onlineButton.setAttribute("aria-pressed", "false");
  onlineMenuButton.setAttribute("aria-pressed", "false");
  overlay.querySelector("h1").textContent = "Mini Kombat III";
  overlayCopy.textContent =
    tournamentMode
      ? "Modo torneo: elegí tu luchador a la derecha y el primer rival a la izquierda. En telefono gira la pantalla y usa los botones tactiles."
      : `Elegí tus luchadores. En telefono gira la pantalla y usa los botones tactiles. Izquierda usa A/D, W, S, F, G, R y T${cpuEnabled ? " o CPU" : ""}. Derecha usa flechas, K, L, O y P.`;
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
  const close = distance < 95;
  const mid = distance < 210;
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

    if (opponent.attack && distance < 140 && Math.random() < difficulty.block) {
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
  };
  playSound("special");
}

function throwSpecial(f) {
  projectiles.push({
    owner: f.id,
    x: f.x + f.dir * 48,
    y: f.y - 116,
    vx: f.dir * 7.4,
    life: 92,
    r: 16,
    damage: 12,
    color: f.trim,
    trail: [],
  });
  burst(f.x + f.dir * 40, f.y - 116, f.trim, 12);
}

function update() {
  if (koFreeze > 0) {
    koFreeze -= 1;
    updateParticles();
    updateFloatingTexts();
    return;
  }

  if (!running) {
    updateParticles();
    updateFloatingTexts();
    return;
  }

  if (paused) return;
  if (countdownFrames > 0) {
    countdownFrames -= 1;
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
    winner = winnerFighter.name;
    roundWinnerId = winnerFighter.id;
    winnerFighter.wins += 1;
    matchOver = winnerFighter.wins >= 2;
    if (matchOver) matchWinnerId = winnerFighter.id;
    running = false;
    koFreeze = 18;
    shake = 16;
    flash = 16;
    addText(winnerFighter.x, winnerFighter.y - 190, matchOver ? "MATCH" : "ROUND", "#fff1bd");
    playSound(matchOver ? tournamentActive && winnerFighter.id !== "right" ? "lose" : "victory" : "ko");
    setTimeout(showWinner, 760);
  }

  if (flash > 0) flash -= 1;
  if (shake > 0) shake -= 1;
}

function updateFighter(f, opponent) {
  const input = inputFor(f);
  const wantSpecial = input.special;
  const wantBlock = input.block && f.grounded && !f.attack && !wantSpecial;
  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const speed = wantBlock ? 1.2 : 3.35;

  f.blocking = wantBlock;
  f.crouch += ((wantBlock ? 1 : 0) - f.crouch) * 0.18;
  if (f.counterWindow > 0) f.counterWindow -= 1;
  if (f.hitFlash > 0) f.hitFlash -= 1;

  if (f.hurt > 0) {
    f.hurt -= 1;
    f.vx *= 0.88;
  } else {
    f.vx += (move * speed - f.vx) * 0.4;
  }

  if (input.jump && f.grounded && !wantBlock && f.hurt <= 0) {
    f.vy = -13.1;
    f.grounded = false;
    playSound("jump");
  }

  if (wantSpecial) startSpecial(f);
  else if (input.grab) startAttack(f, "grab");
  else if (input.kick && input.block) startAttack(f, "sweep");
  else if (input.punch) startAttack(f, f.grounded ? "punch" : "airPunch");
  else if (input.kick) startAttack(f, f.grounded ? "kick" : "airKick");

  f.x += f.vx;
  f.y += f.vy;
  f.vy += GRAVITY;

  if (f.y >= FLOOR) {
    f.y = FLOOR;
    f.vy = 0;
    f.grounded = true;
  }

  f.x = clamp(f.x, 64, W - 64);
  if (f.cooldown > 0) f.cooldown -= 1;
  if (f.specialCooldown > 0) f.specialCooldown -= 1;

  if (f.attack) {
    f.attack.frame += 1;
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
      landHit(owner, target, p.damage, true);
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
  if (overlap > 0 && Math.abs(a.y - b.y) < 120) {
    const push = overlap / 2;
    if (a.x < b.x) {
      a.x -= push;
      b.x += push;
    } else {
      a.x += push;
      b.x -= push;
    }
    a.x = clamp(a.x, 64, W - 64);
    b.x = clamp(b.x, 64, W - 64);
  }
}

function bodyBox(f) {
  const crouch = f.blocking ? 16 : 0;
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
    f.attack.type === "sweep" ? 34 : f.attack.type === "kick" || f.attack.type === "airKick" ? 77 : 112;
  return {
    x: f.dir > 0 ? f.x + 21 : f.x - 21 - f.attack.reach,
    y: f.y - yOffset,
    w: f.attack.reach,
    h: f.attack.height,
  };
}

function landHit(attacker, target, damage, projectile = false) {
  const unblockable = attacker?.attack?.type === "grab";
  const counter = attacker?.counterWindow > 0;
  const blocked = !unblockable && target.blocking && attacker && target.dir !== attacker.dir;
  const finalDamage = blocked ? Math.ceil(damage * 0.28) : damage + (counter ? 4 : 0);

  target.health = clamp(target.health - finalDamage, 0, 100);
  target.hurt = blocked ? 9 : attacker?.attack?.type === "grab" ? 30 : projectile ? 21 : 24;
  target.hitFlash = blocked ? 8 : projectile ? 18 : 14;
  target.vx = (attacker?.dir ?? target.dir * -1) * (blocked ? 3 : projectile ? 5 : 6.2);
  target.vy = target.grounded ? (blocked ? -1.4 : projectile ? -3.2 : -4.2) : target.vy;
  if (attacker) attacker.energy = clamp(attacker.energy + (blocked ? 3 : 8), 0, 100);
  if (blocked) target.counterWindow = 34;
  if (counter && attacker) attacker.counterWindow = 0;
  flash = blocked ? 3 : 6;
  shake = blocked ? Math.max(shake, 3) : Math.max(shake, projectile ? 8 : 6);
  playSound(blocked ? "block" : "hit");
  addText(
    target.x,
    target.y - 154,
    blocked ? "BLOCK" : counter ? "COUNTER" : unblockable ? "GRAB" : projectile ? "SPECIAL" : "HIT",
    blocked ? "#bdeaff" : counter ? "#fff1bd" : "#ffd44d",
  );
  burst(
    target.x - target.dir * 22,
    target.y - 102,
    blocked ? "#bdeaff" : projectile ? "#fff0a6" : "#ffd44d",
    blocked ? 10 : projectile ? 22 : 18,
  );
  impactBurst(
    target.x - target.dir * 26,
    target.y - (projectile ? 116 : blocked ? 108 : 96),
    blocked ? "#bdeaff" : projectile ? "#fff0a6" : counter ? "#fff1bd" : "#ffd44d",
    blocked,
  );
  impactShockwave(
    target.x - target.dir * 28,
    target.y - (projectile ? 116 : 100),
    blocked ? "#bdeaff" : projectile ? "#fff0a6" : counter ? "#fff1bd" : "#ffd44d",
    blocked,
  );
  floorDust(target.x, target.y + 3, blocked ? 5 : 9);
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

function impactBurst(x, y, color, blocked) {
  const count = blocked ? 4 : 7;
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      angle: -0.7 + i * (1.4 / Math.max(1, count - 1)),
      length: blocked ? 18 + Math.random() * 14 : 26 + Math.random() * 26,
      life: blocked ? 13 + Math.random() * 8 : 16 + Math.random() * 12,
      size: blocked ? 3 : 4,
      color,
      kind: "slash",
    });
  }
}

function impactShockwave(x, y, color, blocked) {
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: blocked ? 14 : 20,
    maxLife: blocked ? 14 : 20,
    size: blocked ? 14 : 22,
    growth: blocked ? 1.5 : 2.25,
    color,
    kind: "ring",
  });

  const count = blocked ? 4 : 7;
  for (let i = 0; i < count; i += 1) {
    const angle = -0.75 + i * (1.5 / Math.max(1, count - 1));
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (1.1 + Math.random() * 2.2),
      vy: Math.sin(angle) * (1 + Math.random() * 1.9),
      life: 12 + Math.random() * 8,
      size: blocked ? 2.5 : 3.5,
      color,
      kind: "spark",
    });
  }
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

function updateParticles() {
  particles = particles.filter((p) => {
    p.x += p.vx ?? 0;
    p.y += p.vy ?? 0;
    if (p.kind !== "slash" && p.kind !== "ring") p.vy = (p.vy ?? 0) + 0.13;
    p.life -= 1;
    return p.life > 0;
  });
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

function applyCamera() {
  const [a, b] = fighters;
  const distance = Math.abs(a.x - b.x);
  const center = (a.x + b.x) / 2;
  const zoom = 1 + (1 - clamp(distance / 620, 0, 1)) * 0.075;
  const pan = clamp((W / 2 - center) * 0.09, -34, 34);
  ctx.translate(W / 2 + pan, H / 2 + 8);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -H / 2);
}

function draw() {
  ctx.save();
  if (shake > 0) {
    const amount = shake * 0.22;
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

  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 245, 205, ${flash / 26})`;
    ctx.fillRect(0, 0, W, H);
  }

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
  const totalSeconds = Math.ceil(countdownFrames / 60);
  const label = totalSeconds > 0 ? String(totalSeconds) : "LUCHAR";
  const pulse = 1 + Math.sin(countdownFrames * 0.18) * 0.04;

  ctx.save();
  ctx.fillStyle = "rgba(8, 9, 12, 0.46)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.fillRect(0, 185, W, 154);
  ctx.strokeStyle = "rgba(255, 241, 189, 0.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 185);
  ctx.lineTo(W, 185);
  ctx.moveTo(0, 339);
  ctx.lineTo(W, 339);
  ctx.stroke();

  ctx.translate(W / 2, H / 2 - 8);
  ctx.scale(pulse, pulse);
  ctx.textAlign = "center";
  ctx.font = label === "LUCHAR" ? "900 92px system-ui, sans-serif" : "900 126px system-ui, sans-serif";
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
  const attack = f.attack ? attackProgress(f.attack) : 0;
  const speed = clamp(Math.abs(f.vx) / 7, 0, 1);
  const width = 74 * (1 - air * 0.4) + attack * 10 + speed * 6;
  const height = 17 * (1 - air * 0.45);
  const alpha = (f.hurt > 0 ? 0.32 : 0.22) * (1 - air * 0.55);
  const offset = clamp(f.vx * -2.2, -16, 16);

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

  ctx.fillStyle = "rgba(42, 24, 18, 0.9)";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 52, 18, 104, 66, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 241, 189, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 44, 26, 88, 50);
  ctx.fillStyle = "#fff1bd";
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(winner ? "KO" : "VS", W / 2, 63);
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.fillText(matchOver ? "MATCH" : `ROUND ${roundNumber}`, W / 2, 84);
}

function drawHudPanel(x, y, width, f, reverse) {
  ctx.fillStyle = "rgba(23, 18, 16, 0.76)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, 72, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 241, 189, 0.48)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 5, y + 5, width - 10, 62);

  const portraitX = reverse ? x + width - 60 : x + 12;
  drawHudPortrait(portraitX, y + 11, f);

  const barX = reverse ? x + 20 : x + 74;
  const nameX = reverse ? x + width - 74 : x + 74;
  const align = reverse ? "right" : "left";

  ctx.fillStyle = "rgba(255, 247, 214, 0.95)";
  ctx.font = "900 14px system-ui, sans-serif";
  ctx.textAlign = align;
  ctx.fillText(f.name.toUpperCase(), nameX, y + 18);

  drawHealth(barX, y + 25, 288, f, reverse);
  drawEnergy(reverse ? x + width - 264 : x + 74, y + 57, 190, f, reverse);
  drawWins(reverse ? x + 42 : x + width - 80, y + 57, f, reverse);
}

function drawHudPortrait(x, y, f) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.roundRect(x, y, 48, 48, 6);
  ctx.fill();
  ctx.strokeStyle = f.trim;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, 42, 42);
  if (f.face.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, 40, 40, 5);
    ctx.clip();
    ctx.drawImage(f.face, x - 2, y - 4, 56, 56);
    ctx.restore();
  }
}

function drawHealth(x, y, width, f, reverse) {
  ctx.fillStyle = "rgba(42, 24, 18, 0.72)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, 28, 6);
  ctx.fill();

  const pct = f.health / 100;
  const barWidth = Math.max(0, (width - 8) * pct);
  const bx = reverse ? x + width - 4 - barWidth : x + 4;
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "#37c878");
  gradient.addColorStop(0.58, "#ffe16a");
  gradient.addColorStop(1, "#e94b4f");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(bx, y + 4, barWidth, 20, 4);
  ctx.fill();
}

function drawEnergy(x, y, width, f, reverse) {
  ctx.fillStyle = "rgba(20, 32, 42, 0.74)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, 10, 4);
  ctx.fill();

  const barWidth = (width - 4) * (f.energy / 100);
  const bx = reverse ? x + width - 2 - barWidth : x + 2;
  ctx.fillStyle = f.energy >= 45 ? "#fff0a6" : "#69c8ff";
  ctx.beginPath();
  ctx.roundRect(bx, y + 2, barWidth, 6, 3);
  ctx.fill();
}

function drawWins(x, y, f, reverse) {
  for (let i = 0; i < 2; i += 1) {
    const px = reverse ? x - i * 18 : x + i * 18;
    ctx.fillStyle = i < f.wins ? "#fff1bd" : "rgba(42, 24, 18, 0.68)";
    ctx.beginPath();
    ctx.arc(px, y + 5, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function bodySpec(f) {
  return BODY_SPECS[f.build] ?? BODY_SPECS.balanced;
}

function outfitSpec(f) {
  return f.outfit;
}

function drawFighter(f) {
  const t = performance.now() / 1000;
  const walking = Math.abs(f.vx) > 0.5 && f.grounded && f.hurt <= 0;
  const bob = Math.sin(t * 9) * (walking ? 3.2 : f.grounded ? 1.3 : 0);
  const hurtShift = f.hurt > 0 ? Math.sin(f.hurt * 1.4) * 4 : 0;
  const crouch = f.crouch * 18;
  const baseX = f.x + hurtShift;
  const baseY = f.y + bob;
  const stride = walking ? Math.sin(t * 14) : 0;
  const pose = getPose(f, stride);
  const attackStretch = f.attack ? attackProgress(f.attack) * 0.035 : 0;
  const breathing = f.grounded && f.hurt <= 0 ? Math.sin(t * 2.7 + f.x * 0.02) * 0.012 : 0;
  const hurtSquash = f.hurt > 0 ? Math.sin(f.hurt * 0.7) * 0.012 : 0;

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(f.dir * (1 + attackStretch + hurtSquash), 1 + breathing - attackStretch * 0.28);

  if (f.energy >= 45 && f.hurt <= 0) drawEnergyAura(f.trim, crouch);

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

  if (f.blocking) drawGuard(f.trim, crouch);
  if (f.hitFlash > 0) drawHitFlash(f, crouch);
  if (f.hurt > 0) drawHurtRim(f, crouch);
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

function drawHurtRim(f, crouch) {
  const alpha = clamp(f.hurt / 18, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(255, 239, 179, ${0.34 * alpha})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, -103 + crouch, 56, 92, -0.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255, 78, 64, ${0.22 * alpha})`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, -93 + crouch, 48, 82, 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHitFlash(f, crouch) {
  const alpha = clamp(f.hitFlash / 16, 0, 1);
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
  ctx.restore();
}

function drawResultPoseEffect(f, crouch) {
  ctx.save();
  if (f.id === roundWinnerId) {
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i += 1) {
      const angle = roundFrame * 0.035 + i * 1.26;
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
    ctx.strokeStyle = "rgba(255, 241, 189, 0.58)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -170 + crouch, 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 241, 189, 0.62)";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(-18 + i * 18, -171 + crouch + Math.sin(roundFrame * 0.12 + i) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSpeedLines(f, box) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const outfit = outfitSpec(f);
  const isSweep = f.attack.type === "sweep";
  ctx.strokeStyle = isSweep ? "rgba(255, 232, 122, 0.38)" : "rgba(255, 247, 214, 0.3)";
  ctx.lineWidth = isSweep ? 4 : 3;
  ctx.lineCap = "round";
  const origin = f.dir > 0 ? box.x - 22 : box.x + box.w + 22;
  const target = f.dir > 0 ? box.x + box.w * 0.72 : box.x + box.w * 0.28;
  for (let i = 0; i < 7; i += 1) {
    const y = box.y + 6 + i * (box.h / 7);
    ctx.beginPath();
    ctx.moveTo(origin, y + Math.sin(roundFrame * 0.4 + i) * 3);
    ctx.lineTo(target, y - 6 + Math.cos(i) * 5);
    ctx.stroke();
  }
  ctx.strokeStyle = outfit.accent;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 2;
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
  const isKick = f.attack.type === "kick" || f.attack.type === "airKick" || f.attack.type === "sweep";
  const progress = attackProgress(f.attack);
  const outfit = outfitSpec(f);
  const x = f.dir > 0 ? box.x + box.w * 0.28 : box.x + box.w * 0.72;
  const y = box.y + box.h * 0.45;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.translate(x, y);
  ctx.scale(f.dir, 1);
  ctx.rotate(isKick ? -0.16 : -0.06);

  const glow = ctx.createRadialGradient(24, 0, 4, 24, 0, isKick ? 96 : 74);
  glow.addColorStop(0, isKick ? "rgba(255, 231, 122, 0.34)" : "rgba(155, 231, 255, 0.34)");
  glow.addColorStop(0.42, colorWithAlpha(outfit.accent, 0.18));
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(22, 0, isKick ? 92 : 72, isKick ? 26 : 19, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colorWithAlpha(outfit.accent, 0.78);
  ctx.globalAlpha = 0.28 + progress * 0.24;
  ctx.lineWidth = isKick ? 12 : 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-12, 13);
  ctx.quadraticCurveTo(32, -34, isKick ? 134 : 96, -10);
  ctx.stroke();

  ctx.strokeStyle = isKick ? "#ffe87a" : "#9be7ff";
  ctx.globalAlpha = 0.35 + progress * 0.22;
  ctx.lineWidth = isKick ? 7 : 5;
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.quadraticCurveTo(34, -28, isKick ? 126 : 88, -8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function attackProgress(attack) {
  if (!attack) return 0;
  return Math.sin(clamp(attack.frame / attack.duration, 0, 1) * Math.PI);
}

function getPose(f, stride) {
  const spec = bodySpec(f);
  const crouch = f.crouch * 18;
  const progress = attackProgress(f.attack);
  const attackType = f.attack?.type;
  const airborne = !f.grounded;
  const torsoTilt =
    (f.hurt > 0 ? -0.07 : 0) +
    (airborne ? -0.05 : 0) +
    (attackType === "punch" || attackType === "airPunch" ? 0.05 * progress : 0) +
    (attackType === "kick" || attackType === "airKick" ? -0.04 * progress : 0);

  const hipY = -56 + crouch;
  const shoulderY = -118 + crouch;
  const hipX = 20 * spec.stance;
  const shoulderX = 30 * spec.stance;
  const base = {
    torsoTilt,
    frontArm: {
      shoulder: { x: shoulderX, y: shoulderY },
      elbow: { x: 58 * spec.stance, y: -83 + crouch },
      hand: { x: 80 * spec.stance, y: -61 + crouch },
    },
    backArm: {
      shoulder: { x: -shoulderX, y: shoulderY + 4 },
      elbow: { x: -52 * spec.stance, y: -82 + crouch },
      hand: { x: -38 * spec.stance, y: -60 + crouch },
    },
    frontLeg: {
      hip: { x: hipX, y: hipY },
      knee: { x: (27 + stride * 12) * spec.stance, y: -30 + crouch },
      foot: { x: (34 + stride * 19) * spec.stance, y: -2 },
    },
    backLeg: {
      hip: { x: -hipX, y: hipY },
      knee: { x: (-27 - stride * 10) * spec.stance, y: -30 + crouch },
      foot: { x: (-36 - stride * 16) * spec.stance, y: -2 },
    },
  };

  if (f.blocking) {
    base.frontArm = {
      shoulder: { x: 26, y: shoulderY },
      elbow: { x: 42, y: -121 + crouch },
      hand: { x: 46, y: -96 + crouch },
    };
    base.backArm = {
      shoulder: { x: -24, y: shoulderY + 6 },
      elbow: { x: 16, y: -119 + crouch },
      hand: { x: 18, y: -94 + crouch },
    };
    base.frontLeg.knee.x += 8;
    base.backLeg.foot.x -= 8;
  }

  if (attackType === "punch" || attackType === "airPunch") {
    base.frontArm.elbow = { x: 58 + progress * 24, y: -96 + crouch - progress * 4 };
    base.frontArm.hand = { x: 78 + progress * 68, y: -92 + crouch - progress * 8 };
    base.backArm.elbow = { x: -44, y: -98 + crouch };
    base.backArm.hand = { x: -8, y: -84 + crouch };
  } else if (attackType === "kick" || attackType === "airKick") {
    base.frontLeg.knee = { x: 52 + progress * 36, y: -44 - progress * 18 + crouch };
    base.frontLeg.foot = { x: 70 + progress * 86, y: -30 - progress * 26 };
    base.frontArm.elbow = { x: 46, y: -76 + crouch };
    base.frontArm.hand = { x: 54, y: -48 + crouch };
    base.backArm.elbow = { x: -42, y: -100 + crouch };
    base.backArm.hand = { x: -22, y: -80 + crouch };
  } else if (attackType === "sweep") {
    base.frontLeg.knee = { x: 42 + progress * 25, y: -24 + crouch };
    base.frontLeg.foot = { x: 78 + progress * 66, y: -2 };
    base.backLeg.knee = { x: -32, y: -18 + crouch };
    base.backLeg.foot = { x: -58, y: 0 };
    base.frontArm.hand.y += 9;
    base.backArm.hand.y += 7;
  } else if (attackType === "grab") {
    base.frontArm.elbow = { x: 60 + progress * 18, y: -90 + crouch };
    base.frontArm.hand = { x: 88 + progress * 34, y: -88 + crouch };
    base.backArm.elbow = { x: 38 + progress * 18, y: -104 + crouch };
    base.backArm.hand = { x: 78 + progress * 30, y: -106 + crouch };
    base.frontLeg.foot.x += 18 * progress;
  } else if (attackType === "special") {
    base.frontArm.elbow = { x: 54, y: -112 + crouch };
    base.frontArm.hand = { x: 82 + progress * 20, y: -98 + crouch };
    base.backArm.elbow = { x: 24, y: -114 + crouch };
    base.backArm.hand = { x: 62 + progress * 20, y: -98 + crouch };
  }

  if (airborne) {
    base.frontLeg.knee.y -= 18;
    base.frontLeg.foot.y -= 18;
    base.backLeg.knee.y -= 10;
    base.backLeg.foot.y -= 8;
  }

  if (winner) {
    if (f.id === roundWinnerId) {
      base.torsoTilt = -0.08;
      base.frontArm = {
        shoulder: { x: shoulderX, y: shoulderY },
        elbow: { x: 42 * spec.stance, y: -155 + crouch },
        hand: { x: 54 * spec.stance, y: -184 + crouch },
      };
      base.backArm = {
        shoulder: { x: -shoulderX, y: shoulderY + 4 },
        elbow: { x: -42 * spec.stance, y: -151 + crouch },
        hand: { x: -54 * spec.stance, y: -178 + crouch },
      };
      base.frontLeg.foot.x += 8 * spec.stance;
      base.backLeg.foot.x -= 8 * spec.stance;
    } else {
      base.torsoTilt = 0.2;
      base.frontArm.hand = { x: 48 * spec.stance, y: -42 + crouch };
      base.backArm.hand = { x: -40 * spec.stance, y: -38 + crouch };
      base.frontLeg.knee.y += 10;
      base.backLeg.knee.y += 12;
      base.frontLeg.foot.x += 12 * spec.stance;
      base.backLeg.foot.x -= 14 * spec.stance;
    }
  }

  return base;
}

function drawTorso(f, crouch) {
  const spec = bodySpec(f);
  const outfit = outfitSpec(f);
  const giLight = lighten(outfit.jacket, 28);
  const giDark = darken(outfit.jacket, 34);
  const giDeep = darken(outfit.jacket, 48);
  const shoulder = spec.shoulder;
  const waist = spec.waist;
  const hip = spec.hip;
  const top = -137 + crouch;
  const bottom = -32 + crouch;

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, -37 + crouch, hip + 6, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(38, 22, 17, 0.76)";
  ctx.beginPath();
  ctx.moveTo(-shoulder - 4, top + 11);
  ctx.quadraticCurveTo(0, top - 14, shoulder + 4, top + 11);
  ctx.lineTo(waist + 5, bottom + 3);
  ctx.lineTo(-waist - 5, bottom + 3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = giDark;
  ctx.beginPath();
  ctx.moveTo(-shoulder, top + 9);
  ctx.quadraticCurveTo(-shoulder - 9, -78 + crouch, -waist, bottom);
  ctx.lineTo(waist, bottom);
  ctx.quadraticCurveTo(shoulder + 9, -78 + crouch, shoulder, top + 9);
  ctx.quadraticCurveTo(0, top - 11, -shoulder, top + 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(38, 22, 17, 0.68)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = outfit.jacket;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 2, top + 11);
  ctx.quadraticCurveTo(-shoulder - 5, -74 + crouch, -waist, bottom);
  ctx.lineTo(waist, bottom);
  ctx.quadraticCurveTo(shoulder + 5, -74 + crouch, shoulder - 2, top + 11);
  ctx.quadraticCurveTo(0, top - 7, -shoulder + 2, top + 11);
  ctx.fill();
  ctx.strokeStyle = "rgba(38, 22, 17, 0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = giLight;
  ctx.beginPath();
  ctx.moveTo(-shoulder + 14, top + 12);
  ctx.lineTo(6, -82 + crouch);
  ctx.lineTo(-10, -35 + crouch);
  ctx.lineTo(-waist - 2, -35 + crouch);
  ctx.quadraticCurveTo(-shoulder + 3, -78 + crouch, -shoulder + 14, top + 12);
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
  ctx.ellipse(-shoulder + 12, top + 23, 15, 26, -0.4, 0, Math.PI * 2);
  ctx.ellipse(shoulder - 12, top + 23, 15, 26, 0.4, 0, Math.PI * 2);
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
  ctx.moveTo(-21, -119 + crouch);
  ctx.lineTo(-5, -101 + crouch);
  ctx.lineTo(-17, -87 + crouch);
  ctx.lineTo(-35, -113 + crouch);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(21, -119 + crouch);
  ctx.lineTo(5, -101 + crouch);
  ctx.lineTo(17, -87 + crouch);
  ctx.lineTo(35, -113 + crouch);
  ctx.closePath();
  ctx.fill();

  drawOutfitPattern(f, outfit, shoulder, waist, hip, top, bottom, crouch);

  ctx.fillStyle = outfit.belt;
  ctx.beginPath();
  ctx.roundRect(-hip - 7, -63 + crouch, (hip + 7) * 2, 13, 4);
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

function drawHead(f, crouch, stride) {
  const spec = bodySpec(f);
  const headW = spec.headW;
  const headH = spec.headH;
  const x = -headW / 2;
  const y = -224 + crouch + Math.abs(stride) * 2 + spec.headY;

  const skin = f.skin ?? "#f2b891";
  const neckTop = -119 + crouch;
  const neckBottom = -91 + crouch;
  const neckGrad = ctx.createLinearGradient(0, neckTop, 0, neckBottom);
  neckGrad.addColorStop(0, lighten(skin, 16));
  neckGrad.addColorStop(1, darken(skin, 18));
  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.roundRect(-17, neckTop, 34, neckBottom - neckTop, 11);
  ctx.fill();
  ctx.strokeStyle = "rgba(43, 24, 18, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.rotate(stride * 0.018 + (f.hurt > 0 ? Math.sin(f.hurt) * 0.03 : 0));
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, -146 + crouch + spec.headY, 38, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(22, 14, 12, 0.16)";
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 8, headW - 24, headH - 15, 18);
  ctx.fill();

  if (f.face.complete) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.56)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 7;
    ctx.drawImage(f.face, x, y, headW, headH);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.18;
    ctx.drawImage(f.face, x - 2, y - 2, headW, headH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const rim = ctx.createLinearGradient(x, y, x + headW, y + headH);
    rim.addColorStop(0, "rgba(255,255,255,0.18)");
    rim.addColorStop(0.48, "rgba(255,255,255,0)");
    rim.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.roundRect(x + 7, y + 6, headW - 14, headH - 12, 20);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(36, 21, 16, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, y + headH - 10, headW * 0.3, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(f.trim, 0.32);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, y + headH * 0.52, headW * 0.42, -0.72, 0.72);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#e5c0a9";
    ctx.fillRect(x, y, headW, headH);
  }
  ctx.restore();
}

function drawLeg(f, leg, front) {
  const spec = bodySpec(f);
  const outfit = outfitSpec(f);
  const pant = front ? outfit.pants : darken(outfit.pants, 28);
  drawLimbSegment(leg.hip, leg.knee, pant, 23 * spec.limb, 16 * spec.limb);
  drawLimbSegment(leg.knee, leg.foot, pant, 19 * spec.limb, 11 * spec.limb);

  ctx.fillStyle = front ? outfit.accent : "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.ellipse(leg.knee.x, leg.knee.y, 8 * spec.limb, 6 * spec.limb, 0, 0, Math.PI * 2);
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
  drawLimbSegment(arm.shoulder, arm.elbow, sleeve, 20 * spec.limb, 13 * spec.limb);
  drawLimbSegment(arm.elbow, arm.hand, sleeve, 16 * spec.limb, 9 * spec.limb);

  if (front) {
    ctx.strokeStyle = outfit.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arm.shoulder.x - 2, arm.shoulder.y + 3);
    ctx.quadraticCurveTo(arm.elbow.x + 2, arm.elbow.y - 2, arm.hand.x - 5, arm.hand.y - 6);
    ctx.stroke();
  }

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
  ctx.arc(arm.elbow.x, arm.elbow.y, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(61, 34, 24, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arm.hand.x - 5 * spec.hand, arm.hand.y + 2);
  ctx.quadraticCurveTo(arm.hand.x, arm.hand.y + 6, arm.hand.x + 6 * spec.hand, arm.hand.y + 1);
  ctx.stroke();

  if (front && f.attack?.type === "special") {
    const progress = attackProgress(f.attack);
    ctx.strokeStyle = f.trim;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(arm.hand.x, arm.hand.y, 18 + progress * 9, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLimbSegment(a, b, color, widthA, widthB) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);

  const grad = ctx.createLinearGradient(a.x + nx * widthA * 0.45, a.y + ny * widthA * 0.45, a.x - nx * widthA * 0.45, a.y - ny * widthA * 0.45);
  grad.addColorStop(0, lighten(color, 18));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 28));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * widthA * 0.5, a.y + ny * widthA * 0.5);
  ctx.lineTo(a.x - nx * widthA * 0.5, a.y - ny * widthA * 0.5);
  ctx.lineTo(b.x - nx * widthB * 0.5, b.y - ny * widthB * 0.5);
  ctx.lineTo(b.x + nx * widthB * 0.5, b.y + ny * widthB * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(35, 21, 17, 0.52)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = "rgba(55, 30, 22, 0.28)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
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

function drawGuard(color, crouch) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(20, -106 + crouch, 27, -1.25, 1.35);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(22, -106 + crouch, 36, -1.05, 1.1);
  ctx.stroke();
}

function drawProjectiles() {
  for (const p of projectiles) {
    for (let i = 0; i < p.trail.length; i += 1) {
      const point = p.trail[i];
      const alpha = (i + 1) / p.trail.length;
      ctx.fillStyle = `rgba(255, 247, 210, ${0.05 + alpha * 0.14})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, p.r * alpha * 1.15, 0, Math.PI * 2);
      ctx.fill();
    }

    const pulse = Math.sin(p.life * 0.45) * 3;
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 34 + pulse);
    glow.addColorStop(0, "#fff7d2");
    glow.addColorStop(0.35, p.color);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff7d2";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
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
  const alpha = overlay.classList.contains("hidden") ? 0.72 : 0.28;
  const x = W / 2 - 132;
  const y = 108;
  const banner = ctx.createLinearGradient(x, y, x + 264, y + 68);
  banner.addColorStop(0, `rgba(30, 8, 7, ${alpha})`);
  banner.addColorStop(0.48, `rgba(126, 33, 21, ${alpha})`);
  banner.addColorStop(1, `rgba(30, 8, 7, ${alpha})`);
  ctx.fillStyle = banner;
  ctx.beginPath();
  ctx.roundRect(x, y, 264, 68, 8);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 226, 132, ${0.5 + alpha * 0.24})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 241, 189, ${0.86 + alpha * 0.1})`;
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = `rgba(43, 20, 16, ${0.74 + alpha * 0.12})`;
  ctx.strokeText("K.O.", W / 2, y + 29);
  ctx.fillText("K.O.", W / 2, y + 29);

  ctx.font = "800 11px system-ui, sans-serif";
  ctx.fillStyle = `rgba(255, 226, 132, ${0.74 + alpha * 0.1})`;
  ctx.fillText(`${winner.toUpperCase()} GANA`, W / 2, y + 52);
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
      ? `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Revancha en Mini Kombat III.`
      : `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Siguiente round.`;
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
