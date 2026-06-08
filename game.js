const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start");
const restartButton = document.querySelector("#restart");
const modeButton = document.querySelector("#mode");
const difficultyButton = document.querySelector("#difficulty");
const soundButton = document.querySelector("#sound");
const helpButton = document.querySelector("#help");
const overlayCopy = document.querySelector("#overlay-copy");

const W = canvas.width;
const H = canvas.height;
const FLOOR = 424;
const GRAVITY = 0.72;
const keys = new Set();
const projectiles = [];
const faces = {
  p1: loadImage("assets/fighter-1-face.png"),
  p2: loadImage("assets/fighter-2-face.png"),
};

let running = false;
let winner = "";
let flash = 0;
let shake = 0;
let koFreeze = 0;
let roundFrame = 0;
let cpuEnabled = true;
let cpuFighterId = "p1";
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

const difficultyLevels = [
  { name: "Facil", think: 28, block: 0.35, attack: 0.38, special: 0.2 },
  { name: "Normal", think: 18, block: 0.62, attack: 0.56, special: 0.42 },
  { name: "Dificil", think: 10, block: 0.78, attack: 0.72, special: 0.6 },
];

const fighters = [
  makeFighter({
    id: "p1",
    name: "Pchan",
    x: 214,
    color: "#2677bf",
    trim: "#f6c445",
    face: faces.p1,
    controls: {
      left: "a",
      right: "d",
      jump: "w",
      block: "s",
      punch: "f",
      kick: "g",
      special: "r",
      grab: "t",
    },
  }),
  makeFighter({
    id: "p2",
    name: "Akane",
    x: 746,
    color: "#cc3a3f",
    trim: "#5ee0b4",
    face: faces.p2,
    controls: {
      left: "arrowleft",
      right: "arrowright",
      jump: "arrowup",
      block: "arrowdown",
      punch: "k",
      kick: "l",
      special: "o",
      grab: "p",
    },
  }),
];

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function makeFighter({ id, name, x, color, trim, face, controls }) {
  return {
    id,
    name,
    x,
    y: FLOOR,
    vx: 0,
    vy: 0,
    w: 62,
    h: 146,
    dir: id === "p1" ? 1 : -1,
    color,
    trim,
    face,
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
    punch: 0.08,
    kick: 0.1,
    hit: 0.16,
    block: 0.09,
    jump: 0.08,
    special: 0.34,
    ko: 0.72,
  }[type] ?? 0.1;

  const freqs = {
    punch: [170, 80],
    kick: [120, 64],
    hit: [90, 42],
    block: [360, 220],
    jump: [260, 410],
    special: [520, 160],
    ko: [78, 30],
  }[type] ?? [200, 100];

  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  osc.frequency.setValueAtTime(freqs[0], now);
  osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
  osc.type = type === "special" ? "sawtooth" : "triangle";
  gain.gain.setValueAtTime(type === "ko" ? 0.18 : 0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "block" ? 900 : 520, now);

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
    blocking: false,
    grounded: true,
    specialCooldown: 0,
    counterWindow: 0,
  });

  particles = [];
  floatingTexts = [];
  projectiles.length = 0;
  winner = "";
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
  overlay.querySelector("h1").textContent = "Dojo Tendo";
  overlayCopy.textContent =
    "Mejor de 3 rounds. Akane juega con flechas, K golpe, L patada, O especial y P agarre. Pchan arranca como CPU.";
  startButton.textContent = "LUCHAR";
  overlay.classList.remove("hidden");
}

function showPauseOverlay() {
  overlay.querySelector("h1").textContent = "Pausa";
  overlayCopy.textContent =
    "Esc para seguir. Reiniciar empieza el match de cero. El boton CPU alterna rival automatico o dos jugadores.";
  startButton.textContent = "SEGUIR";
  overlay.classList.remove("hidden");
}

function resumeGame() {
  paused = false;
  overlay.classList.add("hidden");
}

function inputFor(f) {
  if (cpuEnabled && f.id === cpuFighterId) return f.ai;
  const c = f.controls;
  return {
    left: keys.has(c.left),
    right: keys.has(c.right),
    jump: keys.has(c.jump),
    block: keys.has(c.block),
    punch: keys.has(c.punch),
    kick: keys.has(c.kick),
    special: keys.has(c.special) || (keys.has(c.block) && keys.has(c.punch)),
    grab: keys.has(c.grab),
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
    winnerFighter.wins += 1;
    matchOver = winnerFighter.wins >= 2;
    running = false;
    koFreeze = 18;
    shake = 16;
    flash = 16;
    addText(winnerFighter.x, winnerFighter.y - 190, matchOver ? "MATCH" : "ROUND", "#fff1bd");
    playSound("ko");
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

function updateParticles() {
  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.13;
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

  requestAnimationFrame(loop);
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
  ctx.fillStyle = "rgba(42, 24, 18, 0.34)";
  ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2 - 8);
  ctx.scale(pulse, pulse);
  ctx.textAlign = "center";
  ctx.font = "900 118px system-ui, sans-serif";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(83, 31, 21, 0.9)";
  ctx.fillStyle = "#fff1bd";
  ctx.strokeText(label, 0, 0);
  ctx.fillText(label, 0, 0);
  ctx.font = "900 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 247, 214, 0.92)";
  ctx.fillText("preparate", 0, 44);
  ctx.restore();
}

function drawStage() {
  const wall = ctx.createLinearGradient(0, 0, 0, FLOOR);
  wall.addColorStop(0, "#f1dfc4");
  wall.addColorStop(0.45, "#e5c99e");
  wall.addColorStop(1, "#b37a45");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, FLOOR);

  drawGardenView();

  ctx.fillStyle = "#6f3e22";
  ctx.fillRect(0, 0, W, 18);
  ctx.fillRect(0, 266, W, 18);
  ctx.fillRect(0, 396, W, 20);
  for (let x = 22; x < W; x += 126) {
    ctx.fillStyle = "#7c4828";
    ctx.fillRect(x, 18, 18, 398);
  }

  drawShojiPanels();
  drawDojoSign();
  drawTatamiFloor();
}

function drawGardenView() {
  const garden = ctx.createLinearGradient(0, 80, 0, 270);
  garden.addColorStop(0, "#b8d8e6");
  garden.addColorStop(0.58, "#80a96b");
  garden.addColorStop(1, "#446a45");
  ctx.fillStyle = garden;
  ctx.fillRect(345, 54, 270, 214);

  ctx.fillStyle = "#5f8f63";
  ctx.beginPath();
  ctx.ellipse(420, 242, 128, 42, 0, 0, Math.PI * 2);
  ctx.ellipse(552, 238, 116, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d9898b";
  for (let i = 0; i < 18; i += 1) {
    ctx.beginPath();
    ctx.arc(378 + i * 11, 125 + Math.sin(i) * 10, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(466, 64, 28, 184);
  ctx.fillRect(344, 152, 272, 8);
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
  ctx.fillStyle = "#4d2c1a";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 122, 198, 244, 52, 5);
  ctx.fill();
  ctx.fillStyle = "#e7c06c";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 112, 207, 224, 34, 4);
  ctx.fill();
  ctx.fillStyle = "#2b1a14";
  ctx.font = "900 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DOJO TENDO", W / 2, 232);
}

function drawTatamiFloor() {
  ctx.fillStyle = "#8fbb72";
  ctx.fillRect(0, FLOOR - 8, W, H - FLOOR + 8);
  ctx.fillStyle = "#6a8f58";
  ctx.fillRect(0, FLOOR - 8, W, 8);
  ctx.strokeStyle = "rgba(50, 77, 44, 0.55)";
  ctx.lineWidth = 3;

  for (let y = FLOOR + 24; y < H; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  for (let x = -60; x < W; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR - 8);
    ctx.lineTo(x + 78, H);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(41, 54, 38, 0.18)";
  ctx.fillRect(0, FLOOR + 62, W, 12);
}

function drawHud() {
  drawHealth(34, 36, 384, fighters[0], false);
  drawHealth(W - 418, 36, 384, fighters[1], true);

  ctx.fillStyle = "rgba(42, 24, 18, 0.82)";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 42, 24, 84, 58, 8);
  ctx.fill();
  ctx.fillStyle = "#fff1bd";
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(winner ? "KO" : "VS", W / 2, 63);
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.fillText(matchOver ? "MATCH" : `ROUND ${roundNumber}`, W / 2, 84);

  drawEnergy(34, 68, 190, fighters[0], false);
  drawEnergy(W - 224, 68, 190, fighters[1], true);
  drawWins(238, 68, fighters[0], false);
  drawWins(W - 272, 68, fighters[1], true);

  ctx.fillStyle = "rgba(255, 247, 214, 0.95)";
  ctx.font = "900 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(fighters[0].name.toUpperCase(), 34, 28);
  ctx.textAlign = "right";
  ctx.fillText(fighters[1].name.toUpperCase(), W - 34, 28);
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

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(f.dir, 1);

  ctx.fillStyle = "rgba(0,0,0,0.26)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 62, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLeg(pose.backLeg, f.color, f.trim, false);
  drawLeg(pose.frontLeg, f.color, f.trim, true);

  ctx.save();
  ctx.rotate(pose.torsoTilt);
  drawTorso(f, crouch);
  ctx.restore();

  drawArm(f, pose.backArm, false);
  drawArm(f, pose.frontArm, true);
  drawHead(f, crouch, walking ? stride : 0);

  if (f.blocking) drawGuard(f.trim, crouch);
  ctx.restore();

  const box = attackBox(f);
  if (box && f.attack.frame >= f.attack.activeStart - 2 && f.attack.frame <= f.attack.activeEnd + 2) {
    ctx.fillStyle = f.attack.type === "kick" ? "rgba(255, 212, 77, 0.16)" : "rgba(155, 231, 255, 0.16)";
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
}

function attackProgress(attack) {
  if (!attack) return 0;
  return Math.sin(clamp(attack.frame / attack.duration, 0, 1) * Math.PI);
}

function getPose(f, stride) {
  const crouch = f.crouch * 18;
  const progress = attackProgress(f.attack);
  const attackType = f.attack?.type;
  const airborne = !f.grounded;
  const torsoTilt =
    (f.hurt > 0 ? -0.07 : 0) +
    (airborne ? -0.05 : 0) +
    (attackType === "punch" || attackType === "airPunch" ? 0.05 * progress : 0) +
    (attackType === "kick" || attackType === "airKick" ? -0.04 * progress : 0);

  const hipY = -48 + crouch;
  const shoulderY = -110 + crouch;
  const base = {
    torsoTilt,
    frontArm: {
      shoulder: { x: 27, y: shoulderY },
      elbow: { x: 55, y: -78 + crouch },
      hand: { x: 76, y: -58 + crouch },
    },
    backArm: {
      shoulder: { x: -27, y: shoulderY + 4 },
      elbow: { x: -50, y: -76 + crouch },
      hand: { x: -36, y: -56 + crouch },
    },
    frontLeg: {
      hip: { x: 18, y: hipY },
      knee: { x: 26 + stride * 11, y: -25 + crouch },
      foot: { x: 34 + stride * 19, y: -2 },
    },
    backLeg: {
      hip: { x: -18, y: hipY },
      knee: { x: -26 - stride * 9, y: -25 + crouch },
      foot: { x: -36 - stride * 16, y: -2 },
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

  return base;
}

function drawTorso(f, crouch) {
  const giLight = lighten(f.color, 28);
  const giDark = darken(f.color, 34);

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, -37 + crouch, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = giDark;
  ctx.beginPath();
  ctx.roundRect(-42, -128 + crouch, 84, 101, 17);
  ctx.fill();

  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.moveTo(-42, -120 + crouch);
  ctx.quadraticCurveTo(-50, -74 + crouch, -31, -29 + crouch);
  ctx.lineTo(31, -29 + crouch);
  ctx.quadraticCurveTo(50, -74 + crouch, 42, -120 + crouch);
  ctx.quadraticCurveTo(0, -139 + crouch, -42, -120 + crouch);
  ctx.fill();

  ctx.fillStyle = giLight;
  ctx.beginPath();
  ctx.moveTo(-29, -118 + crouch);
  ctx.lineTo(5, -82 + crouch);
  ctx.lineTo(-11, -35 + crouch);
  ctx.lineTo(-35, -35 + crouch);
  ctx.quadraticCurveTo(-43, -78 + crouch, -29, -118 + crouch);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.moveTo(15, -120 + crouch);
  ctx.lineTo(37, -104 + crouch);
  ctx.lineTo(33, -43 + crouch);
  ctx.lineTo(8, -82 + crouch);
  ctx.fill();

  ctx.strokeStyle = "rgba(58, 31, 20, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -116 + crouch);
  ctx.lineTo(8, -82 + crouch);
  ctx.lineTo(-2, -35 + crouch);
  ctx.stroke();

  ctx.fillStyle = f.trim;
  ctx.beginPath();
  ctx.roundRect(-46, -63 + crouch, 92, 12, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(-2, -61 + crouch, 8, 11);
}

function drawHead(f, crouch, stride) {
  const size = 114;
  const x = -size / 2;
  const y = -221 + crouch + Math.abs(stride) * 2;

  ctx.fillStyle = "#f2b891";
  ctx.beginPath();
  ctx.roundRect(-15, -118 + crouch, 30, 34, 8);
  ctx.fill();

  ctx.save();
  ctx.rotate(stride * 0.018 + (f.hurt > 0 ? Math.sin(f.hurt) * 0.03 : 0));
  if (f.face.complete) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(f.face, x, y, size, size);
  } else {
    ctx.fillStyle = "#e5c0a9";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawLeg(leg, color, trim, front) {
  const pant = front ? color : darken(color);
  drawLimbSegment(leg.hip, leg.knee, pant, 23, 15);
  drawLimbSegment(leg.knee, leg.foot, pant, 20, 12);

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.arc(leg.knee.x, leg.knee.y, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(leg.foot.x, leg.foot.y);
  ctx.rotate((leg.foot.x - leg.knee.x) * 0.012);
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.roundRect(-12, -7, 34, 12, 6);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(2, -6, 13, 4);
  ctx.restore();
}

function drawArm(f, arm, front) {
  const sleeve = front ? f.trim : darken(f.color);
  drawLimbSegment(arm.shoulder, arm.elbow, sleeve, 20, 12);
  drawLimbSegment(arm.elbow, arm.hand, sleeve, 17, 10);

  ctx.fillStyle = "#f5c7a9";
  ctx.beginPath();
  ctx.ellipse(arm.hand.x, arm.hand.y, front ? 11 : 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(arm.elbow.x, arm.elbow.y, 5.5, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * widthA * 0.5, a.y + ny * widthA * 0.5);
  ctx.lineTo(a.x - nx * widthA * 0.5, a.y - ny * widthA * 0.5);
  ctx.lineTo(b.x - nx * widthB * 0.5, b.y - ny * widthB * 0.5);
  ctx.lineTo(b.x + nx * widthB * 0.5, b.y + ny * widthB * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(55, 30, 22, 0.28)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
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
    ctx.globalAlpha = clamp(p.life / 24, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawKOBanner() {
  if (!winner) return;
  const alpha = overlay.classList.contains("hidden") ? 0.82 : 0.35;
  ctx.fillStyle = `rgba(69, 22, 19, ${alpha})`;
  ctx.fillRect(0, 178, W, 104);
  ctx.fillStyle = "#fff1bd";
  ctx.font = "900 68px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("K.O.", W / 2, 252);
}

function showWinner() {
  overlay.querySelector("h1").textContent = matchOver ? `${winner} gana` : `${winner} gana round ${roundNumber}`;
  overlayCopy.textContent = matchOver
    ? `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Revancha en el Dojo Tendo.`
    : `${fighters[0].name} ${fighters[0].wins} - ${fighters[1].wins} ${fighters[1].name}. Siguiente round.`;
  startButton.textContent = matchOver ? "REVANCHA" : "SIGUIENTE ROUND";
  overlay.classList.remove("hidden");
}

function loop() {
  update();
  draw();
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

function darken(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 42);
  const g = Math.max(0, ((n >> 8) & 255) - 42);
  const b = Math.max(0, (n & 255) - 42);
  return `rgb(${r}, ${g}, ${b})`;
}

function lighten(hex, amount = 28) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amount);
  const g = Math.min(255, ((n >> 8) & 255) + amount);
  const b = Math.min(255, (n & 255) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setCpuMode(enabled) {
  cpuEnabled = enabled;
  modeButton.textContent = cpuEnabled ? "CPU" : "2P";
  modeButton.setAttribute("aria-pressed", String(cpuEnabled));
  document.querySelector(".fighter-label.left").textContent = cpuEnabled ? "Pchan CPU" : "Pchan";
  document.querySelector(".fighter-label.right").textContent = "Akane";
}

function setDifficulty(nextIndex) {
  cpuDifficulty = nextIndex;
  difficultyButton.textContent = difficultyLevels[cpuDifficulty].name;
}

function setSound(enabled) {
  soundEnabled = enabled;
  soundButton.textContent = soundEnabled ? "Sonido" : "Mudo";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
}

function advanceOverlay() {
  ensureAudio();
  if (paused) {
    resumeGame();
    return;
  }
  if (winner && !matchOver) {
    roundNumber += 1;
    resetRound();
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
  paused = running && !winner;
  overlay.querySelector("h1").textContent = "Controles";
  overlayCopy.textContent =
    "Akane: flechas mover/saltar/bloquear, K golpe, L patada, O especial, P agarre, abajo+L barrida. En 2P, Pchan usa A/D, W, S, F, G, R y T. Esc pausa.";
  startButton.textContent = paused ? "SEGUIR" : "LISTO";
  overlay.classList.remove("hidden");
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
modeButton.addEventListener("click", () => setCpuMode(!cpuEnabled));
difficultyButton.addEventListener("click", () => setDifficulty((cpuDifficulty + 1) % difficultyLevels.length));
soundButton.addEventListener("click", () => {
  ensureAudio();
  setSound(!soundEnabled);
});
helpButton.addEventListener("click", showHelpOverlay);

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

setCpuMode(cpuEnabled);
setDifficulty(cpuDifficulty);
setSound(soundEnabled);
showHomeOverlay();
loop();
