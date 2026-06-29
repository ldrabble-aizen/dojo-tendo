import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(toolDir);
const assetsDir = join(rootDir, "assets");

const FRAME_W = 210;
const FRAME_H = 300;
const ANCHOR_X = 105;
const ANCHOR_Y = 286;

const frames = [
  { key: "idle1", pose: "idle", lean: -5, arm: "readyHigh", legs: "stanceA", torsoTop: -1, torsoBottom: 2, shadowRx: 60 },
  { key: "idle2", pose: "idle", lean: 4, arm: "ready", legs: "stanceB", torsoTop: -3, torsoBottom: 0, shadowRx: 62 },
  { key: "walk1", pose: "walk", lean: 4, arm: "walkA", legs: "walkA", torsoTop: 1, shadowRx: 58 },
  { key: "walk2", pose: "walk", lean: -4, arm: "walkB", legs: "walkB", torsoTop: -1, shadowRx: 48 },
  { key: "punch1", pose: "punch", lean: -9, arm: "punchPrep", legs: "braceLoad", torsoTop: 3, torsoBottom: 5, shadowRx: 68 },
  { key: "punch2", pose: "punch", lean: 19, arm: "punchHit", legs: "lungeDeep", torsoTop: -7, torsoBottom: -5, shadowRx: 82 },
  { key: "punch3", pose: "punch", lean: 1, arm: "punchRecover", legs: "rebound", torsoTop: 0, torsoBottom: 1, shadowRx: 60 },
  { key: "kick1", pose: "kick", lean: -11, arm: "kickBalance", legs: "kickChamber", torsoTop: 2, torsoBottom: 3, shadowRx: 64 },
  { key: "kick2", pose: "kick", lean: -20, arm: "kickBalanceWide", legs: "kickHit", torsoTop: -6, torsoBottom: -5, shadowRx: 84 },
  { key: "kick3", pose: "kick", lean: -2, arm: "kickGuard", legs: "kickRecover", torsoTop: 0, torsoBottom: 1, shadowRx: 60 },
  { key: "block", pose: "block", lean: -13, arm: "block", legs: "brace", torsoTop: 2, torsoBottom: 8, shadowRx: 72 },
  { key: "hurt1", pose: "hurt", lean: 18, arm: "hurt", legs: "stumble", torsoTop: 7, torsoBottom: 8, shadowRx: 66 },
  { key: "hurt2", pose: "hurt", lean: 24, arm: "hurtLow", legs: "stumbleLow", torsoTop: 13, torsoBottom: 12, shadowRx: 72 },
  { key: "special", pose: "special", lean: -10, arm: "special", legs: "braceWide", torsoTop: -4, torsoBottom: -2, shadowRx: 76 },
  { key: "victory", pose: "victory", lean: -7, arm: "victory", legs: "braceWide", torsoTop: -6, torsoBottom: -2, shadowRx: 60 },
  { key: "defeat", pose: "defeat", lean: 32, arm: "defeat", legs: "defeat", torsoTop: 8, torsoBottom: 7, shadowRx: 82 },
  { key: "sweep", pose: "sweep", lean: 18, arm: "sweep", legs: "sweep", shadowRx: 78 },
  { key: "punchDrive", pose: "punch", lean: 11, arm: "punchDrive", legs: "lungeLoad", torsoTop: -1, torsoBottom: 0, shadowRx: 72 },
  { key: "punchFollow", pose: "punch", lean: 21, arm: "punchFollow", legs: "lungeDeep", torsoTop: -8, torsoBottom: -6, shadowRx: 84 },
  { key: "kickWind", pose: "kick", lean: -8, arm: "kickBalance", legs: "kickPrep", torsoTop: 1, torsoBottom: 3, shadowRx: 68 },
  { key: "kickFollow", pose: "kick", lean: -23, arm: "kickBalanceWide", legs: "kickFollow", torsoTop: -6, torsoBottom: -6, shadowRx: 86 },
  { key: "walk3", pose: "walk", lean: 2, arm: "walkCross", legs: "walkCross", torsoTop: 0, shadowRx: 56 },
  { key: "idle3", pose: "idle", lean: -3, arm: "readyHigh", legs: "stanceA", torsoTop: -1, torsoBottom: 1, shadowRx: 60 },
  { key: "punchSettle", pose: "punch", lean: 8, arm: "punchSettle", legs: "lungeRecover", torsoTop: -2, torsoBottom: -1, shadowRx: 70 },
  { key: "kickSettle", pose: "kick", lean: -10, arm: "kickSettle", legs: "kickSettle", torsoTop: -2, torsoBottom: -1, shadowRx: 74 },
  { key: "hurtHead", pose: "hurt", lean: 20, arm: "hurtHead", legs: "stumbleHead", torsoTop: 9, torsoBottom: 10, shadowRx: 74 },
  { key: "hurtBody", pose: "hurt", lean: 16, arm: "hurtBody", legs: "stumbleBody", torsoTop: 7, torsoBottom: 9, shadowRx: 74 },
  { key: "hurtLegs", pose: "hurt", lean: 10, arm: "hurtLegs", legs: "stumbleLegs", torsoTop: 11, torsoBottom: 14, shadowRx: 84 },
  { key: "hurtRecover", pose: "hurt", lean: 7, arm: "hurtRecover", legs: "stumbleRecover", torsoTop: 4, torsoBottom: 5, shadowRx: 68 },
];

const fighters = {
  pchan: {
    title: "Pchan body sprite sheet v2",
    out: "sprite-pchan-body.svg",
    bodyClass: "athletic",
    skin: ["#ffd9bb", "#f1bd98", "#be7958"],
    jacket: ["#4fb3ee", "#2677bf", "#113f83"],
    pants: ["#2873c3", "#174d93", "#0e2b5e"],
    trim: ["#ffe77d", "#f6c445", "#a96a18"],
    shoe: ["#ffe47a", "#e6b536", "#8d5e14"],
    edge: "#21130f",
    dark: "#101f36",
    light: "#e7f6ff",
    build: {
      shoulder: 46,
      chest: 39,
      waist: 25,
      hip: 34,
      neck: 18,
      arm: 1.04,
      leg: 1.03,
      upperArm: 1.14,
      forearm: 1,
      thigh: 1.12,
      calf: 1.02,
      hand: 1.04,
      foot: 1.08,
      stance: 1.06,
      legLength: 1.01,
      shoulderInset: 9,
      shoulderCap: 1.08,
      motion: "power",
    },
    extras: "pchan",
  },
  akane: {
    title: "Akane body sprite sheet v2",
    out: "sprite-akane-body.svg",
    bodyClass: "slim",
    skin: ["#ffe2ca", "#f4c3a3", "#c98e72"],
    jacket: ["#f2696f", "#cc3a3f", "#8b1d2a"],
    pants: ["#c73a43", "#9f2731", "#661525"],
    trim: ["#a9ffe7", "#5ee0b4", "#258f79"],
    shoe: ["#93f4da", "#46ccb0", "#1f806f"],
    edge: "#21130f",
    dark: "#4c111a",
    light: "#ffe7df",
    build: {
      shoulder: 31,
      chest: 25,
      waist: 16,
      hip: 30,
      neck: 12,
      arm: 0.78,
      leg: 0.91,
      upperArm: 0.78,
      forearm: 0.74,
      thigh: 0.84,
      calf: 0.78,
      hand: 0.78,
      foot: 0.86,
      stance: 0.96,
      legLength: 1.03,
      shoulderInset: 6,
      shoulderCap: 0.78,
      motion: "agile",
    },
    extras: "sash",
  },
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function gradient(id, colors) {
  return `
    <linearGradient id="${id}" x1="0" y1="70" x2="0" y2="286" gradientUnits="userSpaceOnUse">
      <stop stop-color="${colors[0]}" offset="0"/>
      <stop stop-color="${colors[1]}" offset="0.58"/>
      <stop stop-color="${colors[2]}" offset="1"/>
    </linearGradient>`;
}

function radial(id, colors) {
  return `
    <radialGradient id="${id}" cx="35%" cy="25%" r="78%">
      <stop stop-color="${colors[0]}" offset="0"/>
      <stop stop-color="${colors[1]}" offset="0.62"/>
      <stop stop-color="${colors[2]}" offset="1"/>
    </radialGradient>`;
}

function limbPath(a, b, c, d, sw, ew) {
  const dx = d.x - a.x;
  const dy = d.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  return `M ${a.x + nx * sw} ${a.y + ny * sw} C ${b.x + nx * sw} ${b.y + ny * sw} ${c.x + nx * ew} ${c.y + ny * ew} ${d.x + nx * ew} ${d.y + ny * ew} L ${d.x - nx * ew} ${d.y - ny * ew} C ${c.x - nx * ew} ${c.y - ny * ew} ${b.x - nx * sw} ${b.y - ny * sw} ${a.x - nx * sw} ${a.y - ny * sw} Z`;
}

function lerpPoint(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function segmentPath(a, d, sw, ew) {
  return limbPath(a, lerpPoint(a, d, 0.34), lerpPoint(a, d, 0.74), d, sw, ew);
}

function segmentAngle(a, d) {
  return Math.atan2(d.y - a.y, d.x - a.x) * 180 / Math.PI;
}

function surfacePoint(a, d, t, side, offset) {
  const base = lerpPoint(a, d, t);
  const dx = d.x - a.x;
  const dy = d.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  return {
    x: base.x + nx * side * offset,
    y: base.y + ny * side * offset,
  };
}

function surfaceCurve(a, d, t1, t2, side, offset1, offset2, cls) {
  const p1 = surfacePoint(a, d, t1, side, offset1);
  const p2 = surfacePoint(a, d, t2, side, offset2);
  const mid = surfacePoint(a, d, (t1 + t2) / 2, side, (offset1 + offset2) / 2 + 1.2);
  return `<path d="M ${p1.x} ${p1.y} Q ${mid.x} ${mid.y} ${p2.x} ${p2.y}" class="${cls}"/>`;
}

function shortWrap(point, a, d, radius, cls) {
  const angle = segmentAngle(a, d);
  return `<path d="M ${point.x - radius} ${point.y + radius * 0.14} Q ${point.x} ${point.y + radius * 0.48} ${point.x + radius} ${point.y + radius * 0.08}" class="${cls}" transform="rotate(${angle} ${point.x} ${point.y})"/>`;
}

function jointPatch(point, color, rx, ry, angle, front = false) {
  return `<g transform="rotate(${angle} ${point.x} ${point.y})">
    <ellipse cx="${point.x}" cy="${point.y}" rx="${rx}" ry="${ry}" fill="${color}" class="softJoint"/>
    <ellipse cx="${point.x - rx * 0.14}" cy="${point.y - ry * 0.2}" rx="${rx * 0.46}" ry="${ry * 0.3}" fill="url(#jointLight)" opacity="${front ? ".34" : ".22"}"/>
    <path d="M ${point.x - rx * 0.72} ${point.y + ry * 0.08} Q ${point.x} ${point.y + ry * 0.44} ${point.x + rx * 0.72} ${point.y + ry * 0.04}" class="jointShade"/>
  </g>`;
}

function bodyPaintLayers(fighter, cx, shoulder, chest, waist, hip, torsoTop, torsoBottom, torsoPath) {
  const slim = fighter.bodyClass === "slim";
  const chestY = torsoTop + (slim ? 44 : 48);
  const midY = torsoTop + (slim ? 78 : 84);
  const hemY = torsoBottom - 9;
  const centerW = Math.max(9, waist * (slim ? 0.42 : 0.5));
  const pchanPanels = fighter.extras === "pchan"
    ? `<path d="M ${cx - shoulder + 15} ${torsoTop + 26} C ${cx - chest * 0.42} ${torsoTop + 50} ${cx - waist * 0.5} ${torsoBottom - 33} ${cx - centerW} ${hemY}" class="wideTrim"/>
       <path d="M ${cx + shoulder - 15} ${torsoTop + 26} C ${cx + chest * 0.42} ${torsoTop + 50} ${cx + waist * 0.5} ${torsoBottom - 33} ${cx + centerW} ${hemY}" class="wideTrim"/>
       <path d="M ${cx - chest * 0.34} ${torsoTop + 42} C ${cx - 5} ${midY - 8} ${cx - 6} ${torsoBottom - 35} ${cx - 3} ${hemY - 2}" class="bluePanelHi"/>
       <path d="M ${cx + chest * 0.3} ${torsoTop + 42} C ${cx + 12} ${midY + 1} ${cx + 8} ${torsoBottom - 31} ${cx + 5} ${hemY - 1}" class="panelShadow"/>`
    : "";
  const akanePanels = fighter.extras === "sash"
    ? `<path d="M ${cx - chest * 0.78} ${chestY} C ${cx - chest * 0.36} ${chestY + 12} ${cx - waist * 0.32} ${midY + 17} ${cx - waist * 0.64} ${torsoBottom - 23}" class="clothEdge"/>
       <path d="M ${cx + chest * 0.78} ${chestY} C ${cx + chest * 0.36} ${chestY + 12} ${cx + waist * 0.32} ${midY + 17} ${cx + waist * 0.64} ${torsoBottom - 23}" class="clothEdge"/>
       <path d="M ${cx - waist - 5} ${torsoBottom - 49} C ${cx - waist * 0.28} ${torsoBottom - 38} ${cx + waist * 0.34} ${torsoBottom - 38} ${cx + waist + 5} ${torsoBottom - 49}" class="waistShadow"/>
       <ellipse cx="${cx}" cy="${chestY + 9}" rx="${chest * 0.54}" ry="13" fill="url(#bodyWarm)" opacity=".18"/>`
    : "";

  return `
    <path d="${torsoPath}" fill="url(#sideRim)" opacity=".5"/>
    <path d="M ${cx - shoulder + 8} ${torsoTop + 25} C ${cx - chest - 2} ${midY - 4} ${cx - waist - 4} ${torsoBottom - 27} ${cx - hip + 4} ${torsoBottom - 2}" class="panelShadow"/>
    <path d="M ${cx + shoulder - 8} ${torsoTop + 25} C ${cx + chest + 2} ${midY - 2} ${cx + waist + 3} ${torsoBottom - 26} ${cx + hip - 4} ${torsoBottom - 2}" class="panelShadow"/>
    <path d="M ${cx - chest * 0.54} ${chestY} C ${cx - chest * 0.18} ${chestY + 14} ${cx - waist * 0.26} ${torsoBottom - 34} ${cx - waist * 0.12} ${torsoBottom - 15}" class="softFold"/>
    <path d="M ${cx + chest * 0.52} ${chestY + 2} C ${cx + chest * 0.18} ${chestY + 17} ${cx + waist * 0.24} ${torsoBottom - 34} ${cx + waist * 0.1} ${torsoBottom - 15}" class="softFoldDark"/>
    <path d="M ${cx - waist * 0.72} ${torsoBottom - 21} Q ${cx} ${torsoBottom - 7} ${cx + waist * 0.72} ${torsoBottom - 21}" class="clothEdge"/>
    ${pchanPanels}
    ${akanePanels}
  `;
}

function styleArmPoint(point, b, kind, armIndex, pointIndex) {
  const p = { ...point };
  if (b.motion === "power") {
    if (kind === "ready" || kind === "readyHigh") {
      p.x += armIndex === 0 ? [0, -4, -7, -8][pointIndex] ?? 0 : [0, 3, 6, 7][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, 0, -2, -6][pointIndex] ?? 0 : [0, -3, -8, -12][pointIndex] ?? 0;
    } else if (kind === "punchPrep" && armIndex === 1) {
      p.x -= [0, 8, 16, 20][pointIndex] ?? 0;
      p.y += [0, -2, -6, -9][pointIndex] ?? 0;
    } else if (kind === "punchDrive" && armIndex === 1) {
      p.x += [0, 5, 10, 13][pointIndex] ?? 0;
      p.y += [0, -4, -6, -6][pointIndex] ?? 0;
    } else if (kind === "punchHit" && armIndex === 1) {
      p.x += [0, 5, 12, 15][pointIndex] ?? 0;
      p.y += [0, -4, -7, -8][pointIndex] ?? 0;
    } else if (kind === "punchFollow" && armIndex === 1) {
      p.x += [0, 6, 12, 14][pointIndex] ?? 0;
      p.y += [0, -3, -7, -8][pointIndex] ?? 0;
    } else if (kind === "punchSettle" && armIndex === 1) {
      p.x += [0, 3, 6, 7][pointIndex] ?? 0;
      p.y += [0, -2, -4, -4][pointIndex] ?? 0;
    } else if (kind.includes("punch") && armIndex === 0) {
      p.x -= [0, 4, 7, 8][pointIndex] ?? 0;
      p.y += [0, 3, 6, 8][pointIndex] ?? 0;
    } else if (kind === "kickSettle" && armIndex === 0) {
      p.x -= [0, 3, 5, 5][pointIndex] ?? 0;
      p.y += [0, -1, -2, -2][pointIndex] ?? 0;
    } else if (kind === "kickSettle" && armIndex === 1) {
      p.x -= [0, 2, 4, 5][pointIndex] ?? 0;
      p.y += [0, 0, 3, 6][pointIndex] ?? 0;
    } else if (kind.includes("kick") && armIndex === 0) {
      p.x -= [0, 4, 7, 8][pointIndex] ?? 0;
      p.y += [0, -1, -3, -4][pointIndex] ?? 0;
    } else if (kind.includes("kick") && armIndex === 1) {
      p.x += [0, 1, 2, 2][pointIndex] ?? 0;
      p.y += [0, 1, 2, 3][pointIndex] ?? 0;
    } else if (kind === "block") {
      p.x += armIndex === 0 ? [0, 7, 12, 10][pointIndex] ?? 0 : [0, -7, -12, -10][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, -6, -13, -18][pointIndex] ?? 0 : [0, -5, -12, -17][pointIndex] ?? 0;
    } else if (kind === "hurtHead") {
      p.x += armIndex === 0 ? [0, -12, -25, -34][pointIndex] ?? 0 : [0, 10, 22, 30][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, -10, -12, -4][pointIndex] ?? 0 : [0, -8, 1, 14][pointIndex] ?? 0;
    } else if (kind === "hurtBody") {
      p.x += armIndex === 0 ? [0, -7, -14, -18][pointIndex] ?? 0 : [0, 4, 8, 10][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, 3, 15, 27][pointIndex] ?? 0 : [0, 7, 17, 28][pointIndex] ?? 0;
    } else if (kind === "hurtLegs") {
      p.x += armIndex === 0 ? [0, -6, -12, -17][pointIndex] ?? 0 : [0, 8, 17, 24][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, 9, 19, 28][pointIndex] ?? 0 : [0, 4, 14, 25][pointIndex] ?? 0;
    } else if (kind === "hurtRecover") {
      p.x += armIndex === 0 ? [0, -4, -8, -9][pointIndex] ?? 0 : [0, 4, 8, 9][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, 0, 6, 12][pointIndex] ?? 0 : [0, -2, 3, 10][pointIndex] ?? 0;
    } else if (kind === "hurt") {
      p.x += armIndex === 0 ? [0, -10, -20, -27][pointIndex] ?? 0 : [0, 8, 16, 22][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, -1, 9, 22][pointIndex] ?? 0 : [0, 4, 16, 29][pointIndex] ?? 0;
    } else if (kind === "hurtLow") {
      p.x += armIndex === 0 ? [0, -7, -13, -16][pointIndex] ?? 0 : [0, 5, 9, 12][pointIndex] ?? 0;
      p.y += [0, 10, 21, 30][pointIndex] ?? 0;
    } else if (kind === "victory") {
      p.x += armIndex === 0 ? [0, -8, -14, -17][pointIndex] ?? 0 : [0, 8, 14, 17][pointIndex] ?? 0;
      p.y += [0, -8, -15, -19][pointIndex] ?? 0;
    } else if (kind === "defeat") {
      p.x += armIndex === 0 ? [0, -4, -8, -12][pointIndex] ?? 0 : [0, 5, 11, 16][pointIndex] ?? 0;
      p.y += [0, 13, 25, 37][pointIndex] ?? 0;
    }
  } else if (b.motion === "agile") {
    if (kind === "ready" || kind === "readyHigh") {
      p.y -= armIndex === 1 ? [0, 7, 13, 18][pointIndex] ?? 0 : [0, 4, 8, 12][pointIndex] ?? 0;
      p.x += armIndex === 1 ? [0, -5, -8, -10][pointIndex] ?? 0 : [0, 4, 7, 8][pointIndex] ?? 0;
    } else if (kind === "kickSettle" && armIndex === 0) {
      p.y -= [0, 3, 5, 6][pointIndex] ?? 0;
      p.x -= [0, 2, 3, 4][pointIndex] ?? 0;
    } else if (kind === "kickSettle" && armIndex === 1) {
      p.y += [0, 1, 3, 5][pointIndex] ?? 0;
      p.x -= [0, 3, 9, 14][pointIndex] ?? 0;
    } else if (kind.includes("kick") && armIndex === 0) {
      p.y -= [0, 5, 9, 12][pointIndex] ?? 0;
      p.x -= [0, 3, 5, 6][pointIndex] ?? 0;
    } else if (kind.includes("kick") && armIndex === 1) {
      p.y += [0, 1, 5, 9][pointIndex] ?? 0;
      p.x -= [0, 5, 15, 25][pointIndex] ?? 0;
    } else if (kind === "punchSettle" && armIndex === 1) {
      p.x += [0, 2, 5, 7][pointIndex] ?? 0;
      p.y -= [0, 2, 5, 6][pointIndex] ?? 0;
    } else if (kind.includes("punch") && armIndex === 1) {
      p.x += [0, 4, 9, 12][pointIndex] ?? 0;
      p.y -= [0, 4, 8, 10][pointIndex] ?? 0;
    } else if (kind.includes("punch") && armIndex === 0) {
      p.x += [0, 2, 5, 8][pointIndex] ?? 0;
      p.y += [0, 1, 2, 3][pointIndex] ?? 0;
    } else if (kind === "block") {
      p.x += armIndex === 0 ? [0, 9, 15, 13][pointIndex] ?? 0 : [0, -9, -15, -13][pointIndex] ?? 0;
      p.y -= [0, 8, 17, 22][pointIndex] ?? 0;
    } else if (kind === "hurtHead") {
      p.x += armIndex === 0 ? [0, -8, -16, -22][pointIndex] ?? 0 : [0, 7, 14, 20][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, -12, -16, -10][pointIndex] ?? 0 : [0, -8, 0, 12][pointIndex] ?? 0;
    } else if (kind === "hurtBody") {
      p.x += armIndex === 0 ? [0, -6, -12, -16][pointIndex] ?? 0 : [0, 5, 10, 14][pointIndex] ?? 0;
      p.y += [0, 4, 14, 24][pointIndex] ?? 0;
    } else if (kind === "hurtLegs") {
      p.x += armIndex === 0 ? [0, -5, -9, -13][pointIndex] ?? 0 : [0, 8, 15, 20][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, 8, 17, 26][pointIndex] ?? 0 : [0, 3, 13, 23][pointIndex] ?? 0;
    } else if (kind === "hurtRecover") {
      p.x += armIndex === 0 ? [0, -3, -6, -7][pointIndex] ?? 0 : [0, 3, 6, 7][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, 0, 5, 10][pointIndex] ?? 0 : [0, -2, 2, 8][pointIndex] ?? 0;
    } else if (kind === "hurt") {
      p.x += armIndex === 0 ? [0, -9, -17, -23][pointIndex] ?? 0 : [0, 7, 14, 20][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, -4, 5, 17][pointIndex] ?? 0 : [0, 2, 12, 24][pointIndex] ?? 0;
    } else if (kind === "hurtLow") {
      p.x += armIndex === 0 ? [0, -5, -10, -14][pointIndex] ?? 0 : [0, 4, 8, 11][pointIndex] ?? 0;
      p.y += [0, 8, 18, 28][pointIndex] ?? 0;
    } else if (kind === "victory") {
      p.x += armIndex === 0 ? [0, -4, -7, -8][pointIndex] ?? 0 : [0, 6, 10, 12][pointIndex] ?? 0;
      p.y += armIndex === 0 ? [0, -10, -20, -28][pointIndex] ?? 0 : [0, -6, -12, -16][pointIndex] ?? 0;
    } else if (kind === "defeat") {
      p.x += armIndex === 0 ? [0, -3, -6, -9][pointIndex] ?? 0 : [0, 5, 10, 14][pointIndex] ?? 0;
      p.y += [0, 12, 24, 36][pointIndex] ?? 0;
    }
  }
  return p;
}

function styleLegPoint(point, b, kind, legIndex, pointIndex) {
  const p = { ...point };
  if (b.motion === "power") {
    if (kind === "stanceA" || kind === "stanceB" || kind === "brace") {
      const dir = legIndex === 0 ? -1 : 1;
      const brace = kind === "brace";
      p.x += dir * ((brace ? [0, 6, 13, 20] : [0, 2, 5, 9])[pointIndex] ?? 0);
      p.y += (brace ? [0, 7, 11, 6] : [0, 2, 3, 1])[pointIndex] ?? 0;
    } else if (kind.includes("lunge")) {
      const dir = legIndex === 0 ? -1 : 1;
      p.x += dir * ([0, 5, 11, 16][pointIndex] ?? 0);
      p.y += [0, 3, 4, 1][pointIndex] ?? 0;
    } else if (kind === "braceLoad" && pointIndex > 0) {
      p.x += legIndex === 0 ? -8 : 8;
      p.y += pointIndex === 1 ? 4 : 2;
    } else if (kind === "kickSettle") {
      if (legIndex === 1) {
        p.x += [0, 3, 6, 7][pointIndex] ?? 0;
        p.y += [0, -1, 1, 3][pointIndex] ?? 0;
      } else if (pointIndex > 0) {
        p.x -= [0, 2, 4, 5][pointIndex] ?? 0;
        p.y += [0, 3, 5, 3][pointIndex] ?? 0;
      }
    } else if (kind === "kickHit" || kind === "kickFollow") {
      if (legIndex === 1) {
        p.x += [0, 3, 7, 9][pointIndex] ?? 0;
        p.y += [0, -2, -4, -5][pointIndex] ?? 0;
      } else if (pointIndex > 0) {
        p.x -= [0, 4, 8, 11][pointIndex] ?? 0;
        p.y += [0, 4, 8, 5][pointIndex] ?? 0;
      }
    } else if (kind === "stumble") {
      p.x += legIndex === 0 ? -([0, 3, 8, 15][pointIndex] ?? 0) : [0, 6, 14, 24][pointIndex] ?? 0;
      p.y += [0, 5, 8, 3][pointIndex] ?? 0;
    } else if (kind === "stumbleLow") {
      p.x += legIndex === 0 ? -([0, 7, 15, 24][pointIndex] ?? 0) : [0, 5, 12, 22][pointIndex] ?? 0;
      p.y += [0, 10, 16, 7][pointIndex] ?? 0;
    } else if (kind === "stumbleHead") {
      p.x += legIndex === 0 ? -([0, 2, 5, 8][pointIndex] ?? 0) : [0, 4, 9, 14][pointIndex] ?? 0;
      p.y += [0, 7, 10, 4][pointIndex] ?? 0;
    } else if (kind === "stumbleBody") {
      p.x += legIndex === 0 ? -([0, 3, 8, 14][pointIndex] ?? 0) : [0, 5, 12, 20][pointIndex] ?? 0;
      p.y += [0, 6, 9, 5][pointIndex] ?? 0;
    } else if (kind === "stumbleLegs") {
      p.x += legIndex === 0 ? -([0, 6, 12, 18][pointIndex] ?? 0) : [0, 3, 7, 12][pointIndex] ?? 0;
      p.y += legIndex === 0 ? [0, 13, 20, 9][pointIndex] ?? 0 : [0, 5, 10, 5][pointIndex] ?? 0;
    } else if (kind === "stumbleRecover") {
      const dir = legIndex === 0 ? -1 : 1;
      p.x += dir * ([0, 4, 9, 15][pointIndex] ?? 0);
      p.y += [0, 4, 7, 2][pointIndex] ?? 0;
    } else if (kind === "defeat") {
      p.x += legIndex === 0 ? -([0, 9, 22, 36][pointIndex] ?? 0) : [0, 7, 18, 30][pointIndex] ?? 0;
      p.y += [0, 9, 16, 6][pointIndex] ?? 0;
    }
  } else if (b.motion === "agile") {
    if (kind === "stanceA" || kind === "stanceB" || kind === "brace") {
      const dir = legIndex === 0 ? -1 : 1;
      const brace = kind === "brace";
      p.x += dir * ((brace ? [0, 3, 8, 14] : [0, 0, 2, 4])[pointIndex] ?? 0);
      p.y += (brace ? [0, 5, 8, 5] : [0, -1, -2, -1])[pointIndex] ?? 0;
    } else if (kind === "kickSettle") {
      if (legIndex === 1) {
        p.x += [0, 3, 4, -1][pointIndex] ?? 0;
        p.y -= [0, 3, 4, 2][pointIndex] ?? 0;
      } else if (pointIndex > 1) {
        p.x -= 4;
        p.y += 3;
      }
    } else if (kind === "kickHit") {
      if (legIndex === 1) {
        p.x += [0, 4, 6, -2][pointIndex] ?? 0;
        p.y -= [0, 6, 13, 17][pointIndex] ?? 0;
      } else if (pointIndex > 1) {
        p.x -= 7;
        p.y += 3;
      }
    } else if (kind === "kickFollow") {
      if (legIndex === 1) {
        p.x += [0, 3, 4, -3][pointIndex] ?? 0;
        p.y -= [0, 5, 10, 12][pointIndex] ?? 0;
      } else if (pointIndex > 1) {
        p.x -= 6;
        p.y += 4;
      }
    } else if (kind === "kickChamber" && legIndex === 1) {
      p.x += [0, 5, 7, 1][pointIndex] ?? 0;
      p.y -= [0, 7, 15, 20][pointIndex] ?? 0;
    } else if (kind.includes("lunge")) {
      const dir = legIndex === 0 ? -1 : 1;
      p.x += dir * ([0, 2, 5, 8][pointIndex] ?? 0);
      p.y -= [0, 1, 1, 2][pointIndex] ?? 0;
    } else if (kind === "walkCross" && pointIndex > 1) {
      p.y -= 2;
    } else if (kind === "stumble") {
      p.x += legIndex === 0 ? -([0, 2, 6, 11][pointIndex] ?? 0) : [0, 5, 12, 20][pointIndex] ?? 0;
      p.y += [0, 5, 8, 3][pointIndex] ?? 0;
    } else if (kind === "stumbleLow") {
      p.x += legIndex === 0 ? -([0, 5, 12, 19][pointIndex] ?? 0) : [0, 4, 10, 17][pointIndex] ?? 0;
      p.y += [0, 9, 14, 7][pointIndex] ?? 0;
    } else if (kind === "stumbleHead") {
      p.x += legIndex === 0 ? -([0, 2, 5, 8][pointIndex] ?? 0) : [0, 3, 7, 12][pointIndex] ?? 0;
      p.y += [0, 6, 9, 4][pointIndex] ?? 0;
    } else if (kind === "stumbleBody") {
      p.x += legIndex === 0 ? -([0, 3, 7, 12][pointIndex] ?? 0) : [0, 4, 9, 15][pointIndex] ?? 0;
      p.y += [0, 6, 8, 5][pointIndex] ?? 0;
    } else if (kind === "stumbleLegs") {
      p.x += legIndex === 0 ? -([0, 5, 10, 16][pointIndex] ?? 0) : [0, 2, 6, 10][pointIndex] ?? 0;
      p.y += legIndex === 0 ? [0, 11, 18, 8][pointIndex] ?? 0 : [0, 4, 8, 5][pointIndex] ?? 0;
    } else if (kind === "stumbleRecover") {
      const dir = legIndex === 0 ? -1 : 1;
      p.x += dir * ([0, 3, 7, 11][pointIndex] ?? 0);
      p.y += [0, 4, 6, 2][pointIndex] ?? 0;
    } else if (kind === "defeat") {
      p.x += legIndex === 0 ? -([0, 7, 18, 30][pointIndex] ?? 0) : [0, 5, 14, 24][pointIndex] ?? 0;
      p.y += [0, 8, 14, 6][pointIndex] ?? 0;
    }
  }
  return p;
}

function armPose(kind, b) {
  const shoulderY = 108;
  const l = b.arm;
  const poses = {
    ready: [
      [{ x: 74, y: shoulderY - 1 }, { x: 60, y: 121 }, { x: 63, y: 139 }, { x: 78, y: 150 }],
      [{ x: 136, y: shoulderY - 2 }, { x: 151, y: 115 }, { x: 153, y: 131 }, { x: 141, y: 142 }],
    ],
    readyHigh: [
      [{ x: 74, y: shoulderY - 3 }, { x: 59, y: 114 }, { x: 63, y: 130 }, { x: 81, y: 140 }],
      [{ x: 136, y: shoulderY - 4 }, { x: 150, y: 109 }, { x: 154, y: 124 }, { x: 143, y: 134 }],
    ],
    walkA: [
      [{ x: 74, y: shoulderY }, { x: 59, y: 132 }, { x: 55, y: 160 }, { x: 64, y: 184 }],
      [{ x: 136, y: shoulderY }, { x: 151, y: 132 }, { x: 155, y: 160 }, { x: 146, y: 184 }],
    ],
    walkB: [
      [{ x: 74, y: shoulderY }, { x: 65, y: 132 }, { x: 69, y: 160 }, { x: 78, y: 184 }],
      [{ x: 136, y: shoulderY }, { x: 145, y: 132 }, { x: 141, y: 160 }, { x: 132, y: 184 }],
    ],
    walkCross: [
      [{ x: 74, y: shoulderY }, { x: 63, y: 131 }, { x: 61, y: 158 }, { x: 72, y: 181 }],
      [{ x: 136, y: shoulderY }, { x: 148, y: 131 }, { x: 149, y: 158 }, { x: 138, y: 181 }],
    ],
    punchPrep: [
      [{ x: 73, y: 109 }, { x: 59, y: 123 }, { x: 55, y: 145 }, { x: 66, y: 163 }],
      [{ x: 136, y: 105 }, { x: 128, y: 98 }, { x: 119, y: 110 }, { x: 116, y: 124 }],
    ],
    punchDrive: [
      [{ x: 73, y: 110 }, { x: 57, y: 132 }, { x: 55, y: 156 }, { x: 68, y: 174 }],
      [{ x: 136, y: 104 }, { x: 150, y: 95 }, { x: 166, y: 94 }, { x: 181, y: 94 }],
    ],
    punchHit: [
      [{ x: 73, y: 110 }, { x: 59, y: 132 }, { x: 60, y: 155 }, { x: 75, y: 172 }],
      [{ x: 136, y: 104 }, { x: 156, y: 95 }, { x: 171, y: 96 }, { x: 181, y: 99 }],
    ],
    punchFollow: [
      [{ x: 73, y: 112 }, { x: 60, y: 137 }, { x: 61, y: 162 }, { x: 76, y: 180 }],
      [{ x: 136, y: 106 }, { x: 155, y: 99 }, { x: 174, y: 103 }, { x: 184, y: 113 }],
    ],
    punchSettle: [
      [{ x: 73, y: 111 }, { x: 59, y: 130 }, { x: 59, y: 153 }, { x: 71, y: 170 }],
      [{ x: 136, y: 106 }, { x: 155, y: 103 }, { x: 171, y: 111 }, { x: 181, y: 126 }],
    ],
    punchRecover: [
      [{ x: 73, y: 109 }, { x: 58, y: 124 }, { x: 58, y: 145 }, { x: 70, y: 162 }],
      [{ x: 136, y: 106 }, { x: 149, y: 112 }, { x: 152, y: 131 }, { x: 142, y: 147 }],
    ],
    kickGuard: [
      [{ x: 74, y: 107 }, { x: 58, y: 118 }, { x: 53, y: 139 }, { x: 62, y: 159 }],
      [{ x: 136, y: 107 }, { x: 124, y: 111 }, { x: 120, y: 132 }, { x: 128, y: 149 }],
    ],
    kickBalance: [
      [{ x: 74, y: 107 }, { x: 55, y: 114 }, { x: 48, y: 134 }, { x: 55, y: 154 }],
      [{ x: 136, y: 107 }, { x: 123, y: 111 }, { x: 119, y: 132 }, { x: 127, y: 151 }],
    ],
    kickBalanceWide: [
      [{ x: 74, y: 107 }, { x: 51, y: 116 }, { x: 44, y: 139 }, { x: 54, y: 160 }],
      [{ x: 136, y: 107 }, { x: 121, y: 114 }, { x: 120, y: 137 }, { x: 133, y: 156 }],
    ],
    kickSettle: [
      [{ x: 74, y: 107 }, { x: 56, y: 116 }, { x: 51, y: 137 }, { x: 60, y: 158 }],
      [{ x: 136, y: 107 }, { x: 124, y: 115 }, { x: 123, y: 137 }, { x: 134, y: 155 }],
    ],
    counter: [
      [{ x: 74, y: 109 }, { x: 59, y: 126 }, { x: 58, y: 148 }, { x: 69, y: 168 }],
      [{ x: 136, y: 108 }, { x: 148, y: 128 }, { x: 145, y: 151 }, { x: 135, y: 171 }],
    ],
    block: [
      [{ x: 75, y: 106 }, { x: 91, y: 94 }, { x: 105, y: 107 }, { x: 99, y: 127 }],
      [{ x: 135, y: 106 }, { x: 119, y: 94 }, { x: 105, y: 108 }, { x: 113, y: 128 }],
    ],
    hurt: [
      [{ x: 74, y: 112 }, { x: 52, y: 122 }, { x: 38, y: 150 }, { x: 42, y: 177 }],
      [{ x: 137, y: 112 }, { x: 159, y: 131 }, { x: 169, y: 162 }, { x: 161, y: 191 }],
    ],
    hurtHead: [
      [{ x: 73, y: 112 }, { x: 50, y: 101 }, { x: 35, y: 117 }, { x: 28, y: 143 }],
      [{ x: 137, y: 112 }, { x: 160, y: 111 }, { x: 176, y: 137 }, { x: 171, y: 165 }],
    ],
    hurtBody: [
      [{ x: 74, y: 118 }, { x: 55, y: 139 }, { x: 55, y: 165 }, { x: 67, y: 184 }],
      [{ x: 136, y: 118 }, { x: 151, y: 139 }, { x: 150, y: 165 }, { x: 136, y: 184 }],
    ],
    hurtLegs: [
      [{ x: 75, y: 124 }, { x: 58, y: 150 }, { x: 49, y: 181 }, { x: 55, y: 207 }],
      [{ x: 135, y: 123 }, { x: 157, y: 140 }, { x: 171, y: 169 }, { x: 168, y: 196 }],
    ],
    hurtLow: [
      [{ x: 75, y: 126 }, { x: 58, y: 159 }, { x: 55, y: 195 }, { x: 66, y: 221 }],
      [{ x: 135, y: 126 }, { x: 153, y: 159 }, { x: 153, y: 195 }, { x: 139, y: 221 }],
    ],
    hurtRecover: [
      [{ x: 74, y: 113 }, { x: 58, y: 128 }, { x: 57, y: 151 }, { x: 69, y: 169 }],
      [{ x: 136, y: 112 }, { x: 150, y: 128 }, { x: 151, y: 151 }, { x: 139, y: 169 }],
    ],
    special: [
      [{ x: 74, y: 103 }, { x: 88, y: 73 }, { x: 101, y: 51 }, { x: 103, y: 32 }],
      [{ x: 136, y: 103 }, { x: 164, y: 88 }, { x: 187, y: 78 }, { x: 207, y: 73 }],
    ],
    victory: [
      [{ x: 74, y: 106 }, { x: 62, y: 80 }, { x: 62, y: 55 }, { x: 74, y: 34 }],
      [{ x: 136, y: 106 }, { x: 151, y: 77 }, { x: 155, y: 50 }, { x: 143, y: 28 }],
    ],
    sweep: [
      [{ x: 73, y: 139 }, { x: 56, y: 160 }, { x: 54, y: 186 }, { x: 68, y: 207 }],
      [{ x: 136, y: 139 }, { x: 153, y: 160 }, { x: 158, y: 185 }, { x: 146, y: 207 }],
    ],
    defeat: [
      [{ x: 75, y: 178 }, { x: 59, y: 207 }, { x: 55, y: 236 }, { x: 68, y: 258 }],
      [{ x: 135, y: 178 }, { x: 154, y: 207 }, { x: 160, y: 237 }, { x: 146, y: 260 }],
    ],
  };
  const shoulderInset = b.shoulderInset ?? 8;
  const targetShoulders = [105 - (b.shoulder - shoulderInset), 105 + (b.shoulder - shoulderInset)];
  return (poses[kind] ?? poses.ready).map((arm, armIndex) => {
    const delta = targetShoulders[armIndex] - arm[0].x;
    return arm.map((p, pointIndex) => {
      const influence = [1, 0.66, 0.34, 0.16][pointIndex] ?? 0.16;
      return styleArmPoint({ x: p.x + delta * influence, y: p.y, w: l }, b, kind, armIndex, pointIndex);
    });
  });
}

function legPose(kind, b) {
  const hipY = kind === "defeat" ? 198 : kind === "sweep" ? 185 : 176;
  const l = b.leg;
  const poses = {
    stanceA: [
      [{ x: 84, y: hipY + 1 }, { x: 72, y: 211 }, { x: 62, y: 246 }, { x: 45, y: 281 }],
      [{ x: 126, y: hipY }, { x: 136, y: 211 }, { x: 145, y: 246 }, { x: 161, y: 281 }],
    ],
    stanceB: [
      [{ x: 83, y: hipY }, { x: 69, y: 211 }, { x: 57, y: 246 }, { x: 37, y: 281 }],
      [{ x: 126, y: hipY + 1 }, { x: 137, y: 211 }, { x: 150, y: 246 }, { x: 169, y: 281 }],
    ],
    walkA: [
      [{ x: 86, y: hipY }, { x: 74, y: 209 }, { x: 60, y: 241 }, { x: 35, y: 281 }],
      [{ x: 123, y: hipY }, { x: 136, y: 209 }, { x: 148, y: 241 }, { x: 169, y: 281 }],
    ],
    walkB: [
      [{ x: 86, y: hipY }, { x: 80, y: 210 }, { x: 77, y: 242 }, { x: 70, y: 281 }],
      [{ x: 123, y: hipY }, { x: 128, y: 209 }, { x: 131, y: 242 }, { x: 139, y: 281 }],
    ],
    walkCross: [
      [{ x: 86, y: hipY }, { x: 78, y: 208 }, { x: 68, y: 239 }, { x: 50, y: 281 }],
      [{ x: 123, y: hipY }, { x: 132, y: 208 }, { x: 140, y: 239 }, { x: 158, y: 281 }],
    ],
    brace: [
      [{ x: 82, y: hipY + 3 }, { x: 68, y: 215 }, { x: 58, y: 250 }, { x: 38, y: 281 }],
      [{ x: 128, y: hipY + 3 }, { x: 142, y: 215 }, { x: 153, y: 250 }, { x: 174, y: 281 }],
    ],
    braceLoad: [
      [{ x: 82, y: hipY + 4 }, { x: 66, y: 219 }, { x: 55, y: 253 }, { x: 33, y: 281 }],
      [{ x: 128, y: hipY + 3 }, { x: 144, y: 216 }, { x: 158, y: 248 }, { x: 182, y: 281 }],
    ],
    braceWide: [
      [{ x: 82, y: hipY }, { x: 67, y: 211 }, { x: 55, y: 244 }, { x: 35, y: 281 }],
      [{ x: 127, y: hipY }, { x: 143, y: 210 }, { x: 157, y: 244 }, { x: 184, y: 281 }],
    ],
    lunge: [
      [{ x: 80, y: hipY + 2 }, { x: 61, y: 217 }, { x: 47, y: 249 }, { x: 22, y: 281 }],
      [{ x: 129, y: hipY - 1 }, { x: 151, y: 207 }, { x: 170, y: 239 }, { x: 199, y: 281 }],
    ],
    lungeLoad: [
      [{ x: 81, y: hipY + 3 }, { x: 64, y: 217 }, { x: 51, y: 250 }, { x: 27, y: 281 }],
      [{ x: 128, y: hipY }, { x: 148, y: 207 }, { x: 164, y: 240 }, { x: 190, y: 281 }],
    ],
    lungeDeep: [
      [{ x: 79, y: hipY + 2 }, { x: 58, y: 218 }, { x: 43, y: 251 }, { x: 18, y: 281 }],
      [{ x: 130, y: hipY - 1 }, { x: 155, y: 207 }, { x: 175, y: 238 }, { x: 204, y: 281 }],
    ],
    lungeRecover: [
      [{ x: 82, y: hipY + 2 }, { x: 66, y: 216 }, { x: 54, y: 249 }, { x: 34, y: 281 }],
      [{ x: 127, y: hipY }, { x: 143, y: 210 }, { x: 158, y: 243 }, { x: 180, y: 281 }],
    ],
    rebound: [
      [{ x: 84, y: hipY + 1 }, { x: 74, y: 212 }, { x: 66, y: 246 }, { x: 51, y: 281 }],
      [{ x: 125, y: hipY + 1 }, { x: 136, y: 212 }, { x: 148, y: 246 }, { x: 166, y: 281 }],
    ],
    kickPrep: [
      [{ x: 82, y: hipY + 2 }, { x: 68, y: 214 }, { x: 58, y: 249 }, { x: 39, y: 281 }],
      [{ x: 125, y: hipY - 2 }, { x: 141, y: 196 }, { x: 149, y: 178 }, { x: 154, y: 162 }],
    ],
    kickChamber: [
      [{ x: 81, y: hipY + 4 }, { x: 65, y: 219 }, { x: 53, y: 253 }, { x: 32, y: 281 }],
      [{ x: 125, y: hipY - 3 }, { x: 146, y: 192 }, { x: 145, y: 164 }, { x: 127, y: 146 }],
    ],
    kickHit: [
      [{ x: 82, y: hipY + 3 }, { x: 65, y: 216 }, { x: 54, y: 250 }, { x: 33, y: 281 }],
      [{ x: 126, y: hipY - 2 }, { x: 153, y: 181 }, { x: 178, y: 161 }, { x: 202, y: 145 }],
    ],
    kickFollow: [
      [{ x: 82, y: hipY + 3 }, { x: 64, y: 217 }, { x: 52, y: 251 }, { x: 31, y: 281 }],
      [{ x: 126, y: hipY - 2 }, { x: 151, y: 184 }, { x: 176, y: 168 }, { x: 198, y: 157 }],
    ],
    kickSettle: [
      [{ x: 83, y: hipY + 3 }, { x: 67, y: 216 }, { x: 56, y: 250 }, { x: 37, y: 281 }],
      [{ x: 125, y: hipY - 1 }, { x: 145, y: 195 }, { x: 154, y: 209 }, { x: 159, y: 235 }],
    ],
    kickRecover: [
      [{ x: 84, y: hipY }, { x: 73, y: 211 }, { x: 64, y: 245 }, { x: 48, y: 281 }],
      [{ x: 124, y: hipY }, { x: 135, y: 203 }, { x: 147, y: 235 }, { x: 160, y: 281 }],
    ],
    stumble: [
      [{ x: 83, y: hipY }, { x: 70, y: 212 }, { x: 63, y: 246 }, { x: 54, y: 281 }],
      [{ x: 124, y: hipY }, { x: 136, y: 214 }, { x: 148, y: 249 }, { x: 173, y: 281 }],
    ],
    stumbleHead: [
      [{ x: 82, y: hipY + 2 }, { x: 69, y: 216 }, { x: 62, y: 251 }, { x: 54, y: 281 }],
      [{ x: 126, y: hipY + 1 }, { x: 140, y: 215 }, { x: 154, y: 249 }, { x: 174, y: 281 }],
    ],
    stumbleBody: [
      [{ x: 82, y: hipY + 2 }, { x: 69, y: 216 }, { x: 61, y: 250 }, { x: 52, y: 281 }],
      [{ x: 126, y: hipY + 2 }, { x: 140, y: 216 }, { x: 154, y: 250 }, { x: 176, y: 281 }],
    ],
    stumbleLegs: [
      [{ x: 82, y: hipY + 4 }, { x: 65, y: 224 }, { x: 59, y: 258 }, { x: 50, y: 281 }],
      [{ x: 127, y: hipY + 2 }, { x: 136, y: 214 }, { x: 148, y: 248 }, { x: 166, y: 281 }],
    ],
    stumbleLow: [
      [{ x: 83, y: 198 }, { x: 66, y: 223 }, { x: 55, y: 253 }, { x: 37, y: 284 }],
      [{ x: 124, y: 198 }, { x: 141, y: 222 }, { x: 156, y: 253 }, { x: 183, y: 284 }],
    ],
    stumbleRecover: [
      [{ x: 83, y: hipY + 1 }, { x: 70, y: 214 }, { x: 62, y: 248 }, { x: 47, y: 281 }],
      [{ x: 126, y: hipY + 1 }, { x: 139, y: 214 }, { x: 151, y: 248 }, { x: 172, y: 281 }],
    ],
    sweep: [
      [{ x: 80, y: 193 }, { x: 59, y: 220 }, { x: 43, y: 254 }, { x: 18, y: 286 }],
      [{ x: 125, y: 188 }, { x: 156, y: 203 }, { x: 195, y: 212 }, { x: 232, y: 217 }],
    ],
    defeat: [
      [{ x: 83, y: 206 }, { x: 63, y: 224 }, { x: 43, y: 247 }, { x: 22, y: 281 }],
      [{ x: 124, y: 204 }, { x: 147, y: 219 }, { x: 170, y: 242 }, { x: 191, y: 276 }],
    ],
  };
  const stance = b.stance ?? 1;
  const legLength = b.legLength ?? 1;
  const targetHips = [105 - b.hip * 0.62, 105 + b.hip * 0.62];
  return (poses[kind] ?? poses.stanceA).map((leg, legIndex) => {
    const delta = targetHips[legIndex] - leg[0].x;
    return leg.map((p, pointIndex) => {
      const hipInfluence = [1, 0.76, 0.5, 0.32][pointIndex] ?? 0.32;
      const baseX = p.x + delta * hipInfluence;
      const spread = pointIndex === 0 ? 1 : stance;
      return styleLegPoint({
        x: 105 + (baseX - 105) * spread,
        y: pointIndex === 0 ? p.y : p.y + (p.y - hipY) * (legLength - 1),
        w: l,
      }, b, kind, legIndex, pointIndex);
    });
  });
}

function hand(point, fighter, scale = 1) {
  const r = 9 * fighter.build.hand * scale;
  return `<g>
    <ellipse cx="${point.x}" cy="${point.y}" rx="${r}" ry="${r * 0.82}" fill="url(#skin)" class="skinEdge"/>
    <ellipse cx="${point.x + r * 0.2}" cy="${point.y + r * 0.04}" rx="${r * 0.46}" ry="${r * 0.38}" fill="url(#skin)" class="fingerMass"/>
    <path d="M ${point.x - r * 0.55} ${point.y + r * 0.02} Q ${point.x - r * 0.18} ${point.y + r * 0.42} ${point.x + r * 0.55} ${point.y + r * 0.05}" class="knuckle"/>
    <path d="M ${point.x - r * 0.18} ${point.y + r * 0.06} L ${point.x - r * 0.06} ${point.y + r * 0.42} M ${point.x + r * 0.18} ${point.y + r * 0.03} L ${point.x + r * 0.24} ${point.y + r * 0.36}" class="fingerLine"/>
    <ellipse cx="${point.x - r * 0.22}" cy="${point.y - r * 0.2}" rx="${r * 0.28}" ry="${r * 0.16}" fill="#fff7df" opacity=".18"/>
  </g>`;
}

function foot(point, fighter, dir = 1) {
  const b = fighter.build;
  const facing = dir >= 0 ? 1 : -1;
  const w = 34 * b.foot;
  const h = 14 * b.foot;
  const heelX = point.x - facing * w * 0.5;
  const toeX = point.x + facing * w * 0.8;
  const instepX = point.x + facing * w * 0.18;
  const archX = point.x + facing * w * 0.48;
  return `<g>
    <path d="M ${heelX} ${point.y - h * 0.15}
      C ${point.x - facing * w * 0.26} ${point.y - h * 0.72} ${instepX} ${point.y - h * 0.9} ${toeX} ${point.y - h * 0.26}
      C ${point.x + facing * w * 0.76} ${point.y + h * 0.3} ${archX} ${point.y + h * 0.66} ${heelX + facing * w * 0.08} ${point.y + h * 0.48}
      C ${point.x - facing * w * 0.34} ${point.y + h * 0.38} ${heelX - facing * w * 0.08} ${point.y + h * 0.14} ${heelX} ${point.y - h * 0.15} Z" fill="url(#shoe)" class="shoeEdge"/>
    <path d="M ${heelX + facing * w * 0.04} ${point.y + h * 0.33}
      C ${point.x - facing * w * 0.16} ${point.y + h * 0.6} ${archX} ${point.y + h * 0.58} ${toeX - facing * w * 0.08} ${point.y + h * 0.14}" class="sole"/>
    <path d="M ${heelX + facing * w * 0.14} ${point.y + h * 0.02}
      Q ${heelX - facing * w * 0.04} ${point.y + h * 0.38} ${point.x - facing * w * 0.2} ${point.y + h * 0.5}" class="heel"/>
    <path d="M ${point.x + facing * w * 0.02} ${point.y - h * 0.42}
      Q ${point.x + facing * w * 0.38} ${point.y - h * 0.64} ${toeX - facing * w * 0.16} ${point.y - h * 0.08}" class="shoeHi"/>
    <ellipse cx="${point.x + facing * w * 0.4}" cy="${point.y - h * 0.18}" rx="${w * 0.14}" ry="${h * 0.16}" fill="#fff7c9" opacity=".2"/>
  </g>`;
}

function drawFrame(fighter, frame, index) {
  const b = fighter.build;
  const x0 = index * FRAME_W;
  const lean = frame.lean;
  const torsoTop = (frame.pose === "defeat" ? 154 : frame.pose === "sweep" ? 126 : 82) + (frame.torsoTop ?? 0);
  const torsoBottom = (frame.pose === "defeat" ? 210 : frame.pose === "sweep" ? 190 : 179) + (frame.torsoBottom ?? 0);
  const neckY = torsoTop - 17;
  const arms = armPose(frame.arm, b);
  const legs = legPose(frame.legs, b);
  const shoulder = b.shoulder;
  const chest = b.chest;
  const waist = b.waist;
  const hip = b.hip;
  const hipY = (frame.pose === "defeat" ? 203 : frame.pose === "sweep" ? 189 : 177) + (frame.torsoBottom ?? 0);
  const cx = 105;
  const shadowRx = frame.shadowRx ?? (frame.pose === "defeat" ? 74 : 54);
  const shadowOpacity = frame.pose === "kick" && frame.legs === "kickHit" ? 0.11 : 0.16;

  const legSvg = legs.map((leg, legIndex) => {
    const color = legIndex === 0 ? "url(#pantsDark)" : "url(#pants)";
    const thighScale = b.thigh ?? b.leg;
    const calfScale = b.calf ?? b.leg;
    const thighStart = (legIndex === 0 ? 12 : 13) * thighScale;
    const kneeWidth = (legIndex === 0 ? 8.8 : 9.6) * thighScale;
    const calfStart = (legIndex === 0 ? 8.4 : 9.1) * calfScale;
    const ankleWidth = (legIndex === 0 ? 5.8 : 6.4) * calfScale;
    const thighPath = segmentPath(leg[0], leg[1], thighStart, kneeWidth);
    const shinPath = limbPath(leg[1], lerpPoint(leg[1], leg[2], 0.38), leg[2], leg[3], calfStart, ankleWidth);
    const kneeAngle = segmentAngle(leg[0], leg[2]);
    const side = legIndex === 0 ? -1 : 1;
    const thighCore = surfaceCurve(leg[0], leg[1], 0.16, 0.78, side, thighStart * 0.34, kneeWidth * 0.18, "anatomyHi");
    const thighShadow = surfaceCurve(leg[0], leg[1], 0.22, 0.7, -side, thighStart * 0.2, kneeWidth * 0.12, "anatomyShade");
    const calfCore = surfaceCurve(leg[1], leg[3], 0.16, 0.72, -side, calfStart * 0.32, ankleWidth * 0.18, "anatomyHi");
    const calfShadow = surfaceCurve(leg[1], leg[3], 0.22, 0.78, side, calfStart * 0.22, ankleWidth * 0.12, "anatomyShade");
    return `<path d="${thighPath}" fill="${color}" class="limbEdge"/>
    <path d="${shinPath}" fill="${color}" class="limbEdge"/>
    <path d="${thighPath}" fill="url(#limbSheen)" opacity="${legIndex === 0 ? ".2" : ".3"}"/>
    <path d="${shinPath}" fill="url(#limbShade)" opacity="${legIndex === 0 ? ".28" : ".2"}"/>
    <path d="${thighPath}" fill="url(#limbRim)" opacity="${legIndex === 0 ? ".18" : ".26"}"/>
    <path d="${shinPath}" fill="url(#limbRim)" opacity="${legIndex === 0 ? ".14" : ".22"}"/>
    ${thighCore}
    ${thighShadow}
    ${calfCore}
    ${calfShadow}
    ${jointPatch(leg[1], color, 7.4 * thighScale, 5.1 * thighScale, kneeAngle, legIndex === 1)}
    ${shortWrap(leg[1], leg[0], leg[2], 6.2 * thighScale, "jointWrap")}
    ${shortWrap(leg[3], leg[2], leg[3], 4.1 * calfScale, "ankleWrap")}
    <path d="M ${leg[0].x - 4} ${leg[0].y + 14} C ${leg[1].x - 3} ${leg[1].y - 7} ${leg[1].x + 2} ${leg[1].y + 3} ${leg[2].x + 2} ${leg[2].y - 5}" class="limbHi"/>
    <path d="M ${leg[1].x - 2} ${leg[1].y + 7} C ${leg[2].x - 5} ${leg[2].y + 8} ${leg[3].x - 7} ${leg[3].y - 8} ${leg[3].x - 5} ${leg[3].y - 1}" class="clothCrease"/>
    <path d="M ${leg[0].x + 2} ${leg[0].y + 16} C ${leg[1].x + 6} ${leg[1].y + 4} ${leg[2].x + 5} ${leg[2].y + 7} ${leg[3].x + 3} ${leg[3].y - 7}" class="legPlane"/>
    ${foot(leg[3], fighter, legIndex === 0 ? -1 : 1)}`;
  }).join("");

  const backArm = arms[0];
  const frontArm = arms[1];
  const armSvg = (arm, front) => {
    const hideRearAttackArm = !front && (frame.pose === "punch" || frame.pose === "kick" || frame.pose === "sweep" || frame.pose === "special");
    if (hideRearAttackArm) return "";
    const color = front ? "url(#trim)" : "url(#sleeveDark)";
    const upperScale = b.upperArm ?? b.arm;
    const forearmScale = b.forearm ?? b.arm;
    const upperStart = (front ? 9.6 : 8.8) * upperScale;
    const elbowWidth = (front ? 6.8 : 6.2) * upperScale;
    const forearmStart = (front ? 7.4 : 6.8) * forearmScale;
    const wristWidth = (front ? 5.2 : 4.8) * forearmScale;
    const upperPath = segmentPath(arm[0], arm[1], upperStart, elbowWidth);
    const forearmPath = limbPath(arm[1], lerpPoint(arm[1], arm[2], 0.42), arm[2], arm[3], forearmStart, wristWidth);
    const elbowAngle = segmentAngle(arm[0], arm[2]);
    const side = front ? 1 : -1;
    const upperCore = surfaceCurve(arm[0], arm[1], 0.14, 0.72, side, upperStart * 0.34, elbowWidth * 0.18, "anatomyHi");
    const upperShadow = surfaceCurve(arm[0], arm[1], 0.18, 0.68, -side, upperStart * 0.22, elbowWidth * 0.14, "anatomyShade");
    const forearmCore = surfaceCurve(arm[1], arm[3], 0.16, 0.74, -side, forearmStart * 0.3, wristWidth * 0.2, "anatomyHi");
    const forearmShadow = surfaceCurve(arm[1], arm[3], 0.22, 0.76, side, forearmStart * 0.2, wristWidth * 0.12, "anatomyShade");
    return `<path d="${upperPath}" fill="${color}" class="limbEdge"/>
    <path d="${forearmPath}" fill="${color}" class="limbEdge"/>
    <path d="${upperPath}" fill="url(#limbSheen)" opacity="${front ? ".32" : ".2"}"/>
    <path d="${forearmPath}" fill="url(#limbShade)" opacity="${front ? ".18" : ".27"}"/>
    <path d="${upperPath}" fill="url(#limbRim)" opacity="${front ? ".24" : ".15"}"/>
    <path d="${forearmPath}" fill="url(#limbRim)" opacity="${front ? ".22" : ".12"}"/>
    ${upperCore}
    ${upperShadow}
    ${forearmCore}
    ${forearmShadow}
    ${jointPatch(arm[1], color, 6.1 * upperScale, 4.5 * upperScale, elbowAngle, front)}
    ${shortWrap(arm[1], arm[0], arm[2], 5.4 * upperScale, "jointWrap")}
    ${shortWrap(arm[3], arm[2], arm[3], 3.6 * forearmScale, "wristWrap")}
    <path d="M ${arm[0].x - (front ? -2 : 2)} ${arm[0].y + 8} C ${arm[1].x} ${arm[1].y - 4} ${arm[2].x} ${arm[2].y - 3} ${arm[3].x} ${arm[3].y - 5}" class="limbHi"/>
    <path d="M ${arm[1].x - 2} ${arm[1].y + 7} C ${arm[2].x - 4} ${arm[2].y + 6} ${arm[3].x - 5} ${arm[3].y - 5} ${arm[3].x - 4} ${arm[3].y + 1}" class="clothCrease"/>
    <path d="M ${arm[0].x + (front ? 4 : -4)} ${arm[0].y + 8} C ${arm[1].x + (front ? 5 : -5)} ${arm[1].y + 3} ${arm[2].x + (front ? 5 : -5)} ${arm[2].y + 4} ${arm[3].x + (front ? 3 : -3)} ${arm[3].y - 4}" class="armPlane"/>
    ${hand(arm[3], fighter, front ? 1 : 0.94)}`;
  };

  const torsoPath = `M ${cx - shoulder} ${torsoTop + 18}
    C ${cx - chest - 4} ${torsoTop + 5} ${cx - waist - 7} ${torsoBottom - 45} ${cx - hip} ${torsoBottom}
    C ${cx - waist * 0.5} ${torsoBottom + 9} ${cx + waist * 0.5} ${torsoBottom + 9} ${cx + hip} ${torsoBottom}
    C ${cx + waist + 7} ${torsoBottom - 45} ${cx + chest + 4} ${torsoTop + 5} ${cx + shoulder} ${torsoTop + 18}
    Q ${cx} ${torsoTop - 6} ${cx - shoulder} ${torsoTop + 18} Z`;

  const hipPlate = `M ${cx - hip - 2} ${hipY - 11} Q ${cx} ${hipY - 1} ${cx + hip + 2} ${hipY - 11} L ${cx + hip - 4} ${hipY + 14} Q ${cx} ${hipY + 22} ${cx - hip + 4} ${hipY + 14} Z`;
  const collar = `<path d="M ${cx - b.neck * 1.05} ${torsoTop + 14}
    Q ${cx} ${torsoTop + 30} ${cx + b.neck * 1.05} ${torsoTop + 14}
    L ${cx + b.neck * 0.66} ${torsoTop + 29}
    Q ${cx} ${torsoTop + 38} ${cx - b.neck * 0.66} ${torsoTop + 29} Z" fill="url(#jacketDark)" opacity=".68"/>
  <path d="M ${cx - b.neck * 1.08} ${torsoTop + 15} Q ${cx} ${torsoTop + 31} ${cx + b.neck * 1.08} ${torsoTop + 15}" fill="none" stroke="url(#trim)" stroke-width="2.3" stroke-linecap="round" opacity=".42"/>`;
  const cap = b.shoulderCap ?? 1;
  const shoulderCaps = `<ellipse cx="${cx - shoulder + 9}" cy="${torsoTop + 24}" rx="${11 * cap}" ry="${9 * cap}" transform="rotate(-18 ${cx - shoulder + 9} ${torsoTop + 24})" fill="url(#jacketDark)" class="jointEdge"/>
  <ellipse cx="${cx + shoulder - 9}" cy="${torsoTop + 24}" rx="${12 * cap}" ry="${9.5 * cap}" transform="rotate(18 ${cx + shoulder - 9} ${torsoTop + 24})" fill="url(#jacket)" class="jointEdge"/>`;

  const folds = `<path d="M ${cx - shoulder + 11} ${torsoTop + 23} L ${cx - 4} ${torsoBottom - 21} L ${cx + waist - 4} ${torsoTop + 28}" class="trimLine"/>
  <path d="M ${cx - waist * 0.7} ${torsoTop + 27} C ${cx - waist * 0.32} ${torsoTop + 58} ${cx - waist * 0.3} ${torsoBottom - 14} ${cx - waist * 0.18} ${torsoBottom - 2}" class="fold"/>
  <path d="M ${cx + waist * 0.55} ${torsoTop + 31} C ${cx + waist * 0.12} ${torsoTop + 59} ${cx + waist * 0.28} ${torsoBottom - 29} ${cx + waist * 0.2} ${torsoBottom - 6}" class="darkFold"/>
  <path d="M ${cx - chest * 0.52} ${torsoTop + 39} C ${cx - chest * 0.28} ${torsoTop + 53} ${cx - chest * 0.18} ${torsoBottom - 37} ${cx - waist * 0.32} ${torsoBottom - 18}" class="clothCrease"/>
  <path d="M ${cx + chest * 0.54} ${torsoTop + 40} C ${cx + chest * 0.34} ${torsoTop + 60} ${cx + chest * 0.23} ${torsoBottom - 34} ${cx + waist * 0.36} ${torsoBottom - 18}" class="shadowCrease"/>`;

  const belt = `<path d="M ${cx - hip - 5} ${torsoBottom - 13} Q ${cx} ${torsoBottom - 3} ${cx + hip + 5} ${torsoBottom - 13} L ${cx + hip + 3} ${torsoBottom + 2} Q ${cx} ${torsoBottom + 12} ${cx - hip - 3} ${torsoBottom + 2} Z" fill="url(#trim)" class="beltEdge"/>
  <path d="M ${cx - 7} ${torsoBottom - 14} L ${cx} ${torsoBottom - 5} L ${cx + 7} ${torsoBottom - 14} L ${cx + 6} ${torsoBottom + 6} L ${cx} ${torsoBottom + 11} L ${cx - 6} ${torsoBottom + 6} Z" fill="url(#jacketDark)" opacity=".72"/>`;

  const identity = fighter.extras === "sash"
    ? `<path d="M ${cx - waist - 7} ${torsoBottom - 46} C ${cx - waist * 0.35} ${torsoBottom - 38} ${cx + waist * 0.35} ${torsoBottom - 38} ${cx + waist + 7} ${torsoBottom - 46}" class="waistShape"/>
       <path d="M ${cx - shoulder + 12} ${torsoTop + 23} C ${cx - 3} ${torsoTop + 58} ${cx + 18} ${torsoBottom - 29} ${cx + waist + 1} ${torsoBottom - 5}" stroke="url(#trim)" stroke-width="5" stroke-linecap="round" opacity=".95"/>`
    : "";
  const punchTrail = "";
  const kickTrail = "";
  const reactionFx = "";

  return `<g clip-path="url(#body-frame-${index})">
    <g transform="translate(${x0} 0)">
    <rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" fill="none"/>
    <ellipse cx="${ANCHOR_X}" cy="${ANCHOR_Y + 2}" rx="${shadowRx}" ry="10" fill="#000" opacity="${shadowOpacity}"/>
    <g transform="rotate(${lean} ${cx} ${torsoBottom})">
      ${legSvg}
      <path d="${hipPlate}" fill="url(#pants)" class="limbEdge"/>
      <path d="${hipPlate}" fill="url(#hipShade)" opacity=".42"/>
      ${armSvg(backArm, false)}
      <path d="${torsoPath}" fill="url(#jacket)" class="bodyEdge"/>
      <path d="${torsoPath}" fill="url(#bodySheen)" opacity=".72"/>
      <path d="${torsoPath}" fill="url(#torsoShade)" opacity=".5"/>
      ${bodyPaintLayers(fighter, cx, shoulder, chest, waist, hip, torsoTop, torsoBottom, torsoPath)}
      ${shoulderCaps}
      ${folds}
      ${belt}
      ${collar}
      ${identity}
      ${armSvg(frontArm, true)}
      ${punchTrail}
      ${kickTrail}
      ${reactionFx}
    </g>
    </g>
  </g>`;
}

function makeSheet(fighter) {
  const frameClips = frames.map((_, index) => `<clipPath id="body-frame-${index}" clipPathUnits="userSpaceOnUse"><rect x="${index * FRAME_W}" y="0" width="${FRAME_W}" height="${FRAME_H}"/></clipPath>`).join("\n    ");
  const defs = `
  <defs>
    ${frameClips}
    ${gradient("jacket", fighter.jacket)}
    ${gradient("jacketDark", [fighter.jacket[1], fighter.jacket[2], fighter.dark])}
    ${gradient("pants", fighter.pants)}
    ${gradient("pantsDark", [fighter.pants[1], fighter.pants[2], fighter.dark])}
    ${gradient("trim", fighter.trim)}
    ${gradient("sleeveDark", [fighter.jacket[1], fighter.jacket[2], fighter.dark])}
    ${gradient("shoe", fighter.shoe)}
    ${radial("skin", fighter.skin)}
    <linearGradient id="bodySheen" x1="55" y1="75" x2="145" y2="190" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity=".28" offset="0"/>
      <stop stop-color="#ffffff" stop-opacity=".03" offset=".48"/>
      <stop stop-color="#000000" stop-opacity=".2" offset="1"/>
    </linearGradient>
    <linearGradient id="torsoShade" x1="58" y1="85" x2="151" y2="184" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity=".16" offset="0"/>
      <stop stop-color="#000000" stop-opacity="0" offset=".42"/>
      <stop stop-color="#000000" stop-opacity=".28" offset="1"/>
    </linearGradient>
    <linearGradient id="limbSheen" x1="50" y1="90" x2="130" y2="260" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity=".22" offset="0"/>
      <stop stop-color="#ffffff" stop-opacity=".02" offset=".58"/>
      <stop stop-color="#000000" stop-opacity="0" offset="1"/>
    </linearGradient>
    <linearGradient id="limbShade" x1="48" y1="100" x2="180" y2="280" gradientUnits="userSpaceOnUse">
      <stop stop-color="#000000" stop-opacity="0" offset="0"/>
      <stop stop-color="#000000" stop-opacity=".18" offset=".66"/>
      <stop stop-color="#000000" stop-opacity=".3" offset="1"/>
    </linearGradient>
    <linearGradient id="limbRim" x1="40" y1="90" x2="180" y2="260" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity=".24" offset="0"/>
      <stop stop-color="#ffffff" stop-opacity=".06" offset=".36"/>
      <stop stop-color="#000000" stop-opacity=".18" offset="1"/>
    </linearGradient>
    <linearGradient id="sideRim" x1="52" y1="72" x2="150" y2="192" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity=".24" offset="0"/>
      <stop stop-color="#ffffff" stop-opacity=".02" offset=".45"/>
      <stop stop-color="#000000" stop-opacity=".28" offset="1"/>
    </linearGradient>
    <radialGradient id="jointLight" cx="34%" cy="24%" r="70%">
      <stop stop-color="#ffffff" stop-opacity=".54" offset="0"/>
      <stop stop-color="#ffffff" stop-opacity=".08" offset=".55"/>
      <stop stop-color="#000000" stop-opacity=".18" offset="1"/>
    </radialGradient>
    <radialGradient id="bodyWarm" cx="45%" cy="30%" r="82%">
      <stop stop-color="#ffffff" stop-opacity=".28" offset="0"/>
      <stop stop-color="${fighter.trim[0]}" stop-opacity=".12" offset=".52"/>
      <stop stop-color="#000000" stop-opacity=".18" offset="1"/>
    </radialGradient>
    <linearGradient id="hipShade" x1="70" y1="164" x2="140" y2="205" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" stop-opacity=".08" offset="0"/>
      <stop stop-color="#000000" stop-opacity=".2" offset="1"/>
    </linearGradient>
  </defs>`;

  const css = `<style>
    .bodyEdge, .limbEdge, .beltEdge { stroke: ${fighter.edge}; stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
    .limbEdge { stroke-width: 2.5; }
    .jointEdge { stroke: ${fighter.edge}; stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
    .softJoint { stroke: ${fighter.edge}; stroke-width: 1.25; stroke-linejoin: round; stroke-linecap: round; opacity: .78; }
    .skinEdge { stroke: #4c2a1e; stroke-width: 2; }
    .shoeEdge { stroke: #3d2813; stroke-width: 2; }
    .fold { fill: none; stroke: ${fighter.light}; stroke-width: 2.2; stroke-linecap: round; opacity: .34; }
    .darkFold { fill: none; stroke: ${fighter.dark}; stroke-width: 2.2; stroke-linecap: round; opacity: .32; }
    .trimLine { fill: none; stroke: url(#trim); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .wideTrim { fill: none; stroke: url(#trim); stroke-width: 6.5; stroke-linecap: round; stroke-linejoin: round; opacity: .95; }
    .limbHi { fill: none; stroke: ${fighter.light}; stroke-width: 1.55; stroke-linecap: round; opacity: .22; }
    .armPlane, .legPlane { fill: none; stroke: ${fighter.dark}; stroke-width: 1.15; stroke-linecap: round; opacity: .22; }
    .anatomyHi { fill: none; stroke: ${fighter.light}; stroke-width: 1.25; stroke-linecap: round; opacity: .2; }
    .anatomyShade { fill: none; stroke: ${fighter.dark}; stroke-width: 1.35; stroke-linecap: round; opacity: .24; }
    .jointWrap { fill: none; stroke: ${fighter.light}; stroke-width: 1.35; stroke-linecap: round; opacity: .2; }
    .wristWrap, .ankleWrap { fill: none; stroke: ${fighter.dark}; stroke-width: 1.05; stroke-linecap: round; opacity: .28; }
    .clothCrease { fill: none; stroke: ${fighter.light}; stroke-width: 1.25; stroke-linecap: round; opacity: .22; }
    .clothEdge { fill: none; stroke: ${fighter.light}; stroke-width: 1.65; stroke-linecap: round; opacity: .24; }
    .shadowCrease { fill: none; stroke: ${fighter.dark}; stroke-width: 1.35; stroke-linecap: round; opacity: .28; }
    .panelShadow { fill: none; stroke: ${fighter.dark}; stroke-width: 2.4; stroke-linecap: round; opacity: .28; }
    .bluePanelHi { fill: none; stroke: ${fighter.light}; stroke-width: 2.2; stroke-linecap: round; opacity: .26; }
    .softFold { fill: none; stroke: ${fighter.light}; stroke-width: 1.5; stroke-linecap: round; opacity: .24; }
    .softFoldDark { fill: none; stroke: ${fighter.dark}; stroke-width: 1.5; stroke-linecap: round; opacity: .26; }
    .jointShade { fill: none; stroke: ${fighter.dark}; stroke-width: 1.15; stroke-linecap: round; opacity: .32; }
    .waistShadow { fill: none; stroke: ${fighter.dark}; stroke-width: 2.4; stroke-linecap: round; opacity: .26; }
    .waistShape { fill: none; stroke: url(#trim); stroke-width: 2.6; stroke-linecap: round; opacity: .5; }
    .knuckle { fill: none; stroke: #5b3022; stroke-width: 1.5; stroke-linecap: round; opacity: .5; }
    .fingerLine { fill: none; stroke: #5b3022; stroke-width: 1.1; stroke-linecap: round; opacity: .38; }
    .fingerMass { stroke: #4c2a1e; stroke-width: 1.2; opacity: .72; }
    .sole { fill: none; stroke: #14110d; stroke-width: 2; stroke-linecap: round; opacity: .46; }
    .heel { fill: none; stroke: #14110d; stroke-width: 1.6; stroke-linecap: round; opacity: .32; }
    .shoeHi { fill: none; stroke: #fff7c9; stroke-width: 2; stroke-linecap: round; opacity: .42; }
    .punchTrail, .kickTrail { fill: none; stroke: url(#trim); stroke-width: 6; stroke-linecap: round; opacity: .34; }
    .punchTrail.fine, .kickTrail.fine { stroke-width: 2.4; opacity: .28; }
    .blockGuard { fill: none; stroke: #d9fff6; stroke-width: 5.2; stroke-linecap: round; opacity: .3; }
    .blockSpark, .hurtSpark { fill: none; stroke: #fff4b8; stroke-width: 3; stroke-linecap: round; opacity: .5; }
    .hurtSpark { stroke: #ffd3b0; opacity: .42; }
    .victoryGlow { fill: none; stroke: url(#trim); stroke-width: 4.4; stroke-linecap: round; opacity: .28; }
    .defeatDust { fill: none; stroke: #241811; stroke-width: 4.4; stroke-linecap: round; opacity: .24; }
    .defeatDust.fine { stroke-width: 2; opacity: .2; }
  </style>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_W * frames.length}" height="${FRAME_H}" viewBox="0 0 ${FRAME_W * frames.length} ${FRAME_H}">
  <title>${esc(fighter.title)}</title>
  ${defs}
  ${css}
  ${frames.map((frame, index) => drawFrame(fighter, frame, index)).join("\n")}
</svg>
`;
}

for (const fighter of Object.values(fighters)) {
  writeFileSync(join(assetsDir, fighter.out), makeSheet(fighter).replace(/[ \t]+$/gm, ""));
}

console.log(`Wrote ${Object.values(fighters).map((fighter) => fighter.out).join(", ")}`);
