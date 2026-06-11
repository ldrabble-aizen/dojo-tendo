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
  { key: "idle1", pose: "idle", lean: -1, arm: "ready", legs: "stanceA" },
  { key: "idle2", pose: "idle", lean: 1, arm: "ready", legs: "stanceB" },
  { key: "walk1", pose: "walk", lean: 2, arm: "walkA", legs: "walkA" },
  { key: "walk2", pose: "walk", lean: -2, arm: "walkB", legs: "walkB" },
  { key: "punch1", pose: "punch", lean: 4, arm: "punchPrep", legs: "brace" },
  { key: "punch2", pose: "punch", lean: 8, arm: "punchHit", legs: "braceWide" },
  { key: "punch3", pose: "punch", lean: 2, arm: "punchRecover", legs: "stanceB" },
  { key: "kick1", pose: "kick", lean: -4, arm: "counter", legs: "kickPrep" },
  { key: "kick2", pose: "kick", lean: -9, arm: "counter", legs: "kickHit" },
  { key: "kick3", pose: "kick", lean: -3, arm: "ready", legs: "kickRecover" },
  { key: "block", pose: "block", lean: -2, arm: "block", legs: "brace" },
  { key: "hurt1", pose: "hurt", lean: 10, arm: "hurt", legs: "stumble" },
  { key: "hurt2", pose: "hurt", lean: 5, arm: "hurtLow", legs: "stumbleLow" },
  { key: "special", pose: "special", lean: -5, arm: "special", legs: "braceWide" },
  { key: "victory", pose: "victory", lean: -3, arm: "victory", legs: "stanceA" },
  { key: "defeat", pose: "defeat", lean: 16, arm: "defeat", legs: "defeat" },
  { key: "sweep", pose: "sweep", lean: 13, arm: "sweep", legs: "sweep" },
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
      shoulder: 42,
      chest: 34,
      waist: 24,
      hip: 31,
      neck: 17,
      arm: 1.0,
      leg: 1.0,
      hand: 1.04,
      foot: 1.04,
    },
    extras: "bandana",
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
      shoulder: 32,
      chest: 27,
      waist: 18,
      hip: 28,
      neck: 14,
      arm: 0.82,
      leg: 0.88,
      hand: 0.86,
      foot: 0.88,
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

function armPose(kind, b) {
  const shoulderY = 108;
  const l = b.arm;
  const poses = {
    ready: [
      [{ x: 74, y: shoulderY }, { x: 61, y: 136 }, { x: 61, y: 164 }, { x: 70, y: 187 }],
      [{ x: 136, y: shoulderY }, { x: 151, y: 134 }, { x: 151, y: 164 }, { x: 140, y: 187 }],
    ],
    walkA: [
      [{ x: 74, y: shoulderY }, { x: 59, y: 132 }, { x: 55, y: 160 }, { x: 64, y: 184 }],
      [{ x: 136, y: shoulderY }, { x: 151, y: 132 }, { x: 155, y: 160 }, { x: 146, y: 184 }],
    ],
    walkB: [
      [{ x: 74, y: shoulderY }, { x: 65, y: 132 }, { x: 69, y: 160 }, { x: 78, y: 184 }],
      [{ x: 136, y: shoulderY }, { x: 145, y: 132 }, { x: 141, y: 160 }, { x: 132, y: 184 }],
    ],
    punchPrep: [
      [{ x: 73, y: 109 }, { x: 56, y: 128 }, { x: 49, y: 151 }, { x: 61, y: 170 }],
      [{ x: 136, y: 107 }, { x: 151, y: 105 }, { x: 162, y: 112 }, { x: 174, y: 123 }],
    ],
    punchHit: [
      [{ x: 73, y: 110 }, { x: 57, y: 137 }, { x: 58, y: 164 }, { x: 70, y: 184 }],
      [{ x: 136, y: 106 }, { x: 164, y: 102 }, { x: 188, y: 101 }, { x: 207, y: 100 }],
    ],
    punchRecover: [
      [{ x: 73, y: 109 }, { x: 58, y: 135 }, { x: 59, y: 163 }, { x: 69, y: 184 }],
      [{ x: 136, y: 107 }, { x: 149, y: 119 }, { x: 157, y: 143 }, { x: 149, y: 166 }],
    ],
    counter: [
      [{ x: 74, y: 109 }, { x: 59, y: 126 }, { x: 58, y: 148 }, { x: 69, y: 168 }],
      [{ x: 136, y: 108 }, { x: 148, y: 128 }, { x: 145, y: 151 }, { x: 135, y: 171 }],
    ],
    block: [
      [{ x: 75, y: 110 }, { x: 91, y: 116 }, { x: 93, y: 139 }, { x: 84, y: 158 }],
      [{ x: 135, y: 110 }, { x: 118, y: 116 }, { x: 116, y: 139 }, { x: 126, y: 158 }],
    ],
    hurt: [
      [{ x: 74, y: 111 }, { x: 54, y: 126 }, { x: 46, y: 154 }, { x: 56, y: 180 }],
      [{ x: 137, y: 111 }, { x: 155, y: 134 }, { x: 161, y: 163 }, { x: 151, y: 188 }],
    ],
    hurtLow: [
      [{ x: 75, y: 122 }, { x: 58, y: 150 }, { x: 56, y: 180 }, { x: 68, y: 205 }],
      [{ x: 135, y: 122 }, { x: 151, y: 150 }, { x: 150, y: 181 }, { x: 137, y: 205 }],
    ],
    special: [
      [{ x: 74, y: 105 }, { x: 91, y: 77 }, { x: 102, y: 56 }, { x: 101, y: 38 }],
      [{ x: 136, y: 105 }, { x: 162, y: 92 }, { x: 183, y: 84 }, { x: 202, y: 80 }],
    ],
    victory: [
      [{ x: 74, y: 106 }, { x: 67, y: 77 }, { x: 70, y: 51 }, { x: 82, y: 31 }],
      [{ x: 136, y: 106 }, { x: 146, y: 77 }, { x: 145, y: 51 }, { x: 132, y: 31 }],
    ],
    sweep: [
      [{ x: 73, y: 139 }, { x: 56, y: 160 }, { x: 54, y: 186 }, { x: 68, y: 207 }],
      [{ x: 136, y: 139 }, { x: 153, y: 160 }, { x: 158, y: 185 }, { x: 146, y: 207 }],
    ],
    defeat: [
      [{ x: 75, y: 176 }, { x: 61, y: 197 }, { x: 58, y: 222 }, { x: 72, y: 240 }],
      [{ x: 135, y: 176 }, { x: 151, y: 197 }, { x: 154, y: 222 }, { x: 139, y: 240 }],
    ],
  };
  return (poses[kind] ?? poses.ready).map((arm) => arm.map((p) => ({ x: p.x, y: p.y, w: l })));
}

function legPose(kind, b) {
  const hipY = kind === "defeat" ? 198 : kind === "sweep" ? 185 : 176;
  const l = b.leg;
  const poses = {
    stanceA: [
      [{ x: 86, y: hipY }, { x: 76, y: 209 }, { x: 66, y: 244 }, { x: 53, y: 281 }],
      [{ x: 124, y: hipY }, { x: 132, y: 210 }, { x: 139, y: 244 }, { x: 152, y: 281 }],
    ],
    stanceB: [
      [{ x: 85, y: hipY }, { x: 72, y: 209 }, { x: 60, y: 244 }, { x: 42, y: 281 }],
      [{ x: 123, y: hipY }, { x: 133, y: 210 }, { x: 146, y: 244 }, { x: 162, y: 281 }],
    ],
    walkA: [
      [{ x: 86, y: hipY }, { x: 74, y: 209 }, { x: 60, y: 241 }, { x: 35, y: 281 }],
      [{ x: 123, y: hipY }, { x: 136, y: 209 }, { x: 148, y: 241 }, { x: 169, y: 281 }],
    ],
    walkB: [
      [{ x: 86, y: hipY }, { x: 80, y: 210 }, { x: 77, y: 242 }, { x: 70, y: 281 }],
      [{ x: 123, y: hipY }, { x: 128, y: 209 }, { x: 131, y: 242 }, { x: 139, y: 281 }],
    ],
    brace: [
      [{ x: 84, y: hipY }, { x: 73, y: 210 }, { x: 64, y: 244 }, { x: 47, y: 281 }],
      [{ x: 126, y: hipY }, { x: 136, y: 210 }, { x: 146, y: 244 }, { x: 163, y: 281 }],
    ],
    braceWide: [
      [{ x: 82, y: hipY }, { x: 67, y: 211 }, { x: 55, y: 244 }, { x: 35, y: 281 }],
      [{ x: 127, y: hipY }, { x: 143, y: 210 }, { x: 157, y: 244 }, { x: 184, y: 281 }],
    ],
    kickPrep: [
      [{ x: 84, y: hipY }, { x: 72, y: 209 }, { x: 64, y: 244 }, { x: 48, y: 281 }],
      [{ x: 124, y: hipY }, { x: 139, y: 199 }, { x: 146, y: 184 }, { x: 152, y: 169 }],
    ],
    kickHit: [
      [{ x: 84, y: hipY }, { x: 70, y: 211 }, { x: 60, y: 245 }, { x: 40, y: 281 }],
      [{ x: 124, y: hipY }, { x: 151, y: 187 }, { x: 181, y: 166 }, { x: 213, y: 151 }],
    ],
    kickRecover: [
      [{ x: 84, y: hipY }, { x: 73, y: 211 }, { x: 64, y: 245 }, { x: 48, y: 281 }],
      [{ x: 124, y: hipY }, { x: 135, y: 203 }, { x: 147, y: 235 }, { x: 160, y: 281 }],
    ],
    stumble: [
      [{ x: 83, y: hipY }, { x: 70, y: 212 }, { x: 63, y: 246 }, { x: 54, y: 281 }],
      [{ x: 124, y: hipY }, { x: 136, y: 214 }, { x: 148, y: 249 }, { x: 173, y: 281 }],
    ],
    stumbleLow: [
      [{ x: 83, y: 198 }, { x: 66, y: 223 }, { x: 55, y: 253 }, { x: 37, y: 284 }],
      [{ x: 124, y: 198 }, { x: 141, y: 222 }, { x: 156, y: 253 }, { x: 183, y: 284 }],
    ],
    sweep: [
      [{ x: 84, y: 191 }, { x: 65, y: 217 }, { x: 51, y: 251 }, { x: 28, y: 286 }],
      [{ x: 122, y: 191 }, { x: 151, y: 207 }, { x: 188, y: 218 }, { x: 226, y: 224 }],
    ],
    defeat: [
      [{ x: 83, y: 206 }, { x: 63, y: 224 }, { x: 43, y: 247 }, { x: 22, y: 281 }],
      [{ x: 124, y: 204 }, { x: 147, y: 219 }, { x: 170, y: 242 }, { x: 191, y: 276 }],
    ],
  };
  return (poses[kind] ?? poses.stanceA).map((leg) => leg.map((p) => ({ x: p.x, y: p.y, w: l })));
}

function hand(point, fighter, scale = 1) {
  const r = 9 * fighter.build.hand * scale;
  return `<ellipse cx="${point.x}" cy="${point.y}" rx="${r}" ry="${r * 0.82}" fill="url(#skin)" class="skinEdge"/>
  <path d="M ${point.x - r * 0.48} ${point.y + 2} Q ${point.x} ${point.y + r * 0.48} ${point.x + r * 0.56} ${point.y + 1}" class="knuckle"/>`;
}

function foot(point, fighter, dir = 1) {
  const b = fighter.build;
  const w = 30 * b.foot;
  const h = 12 * b.foot;
  return `<path d="M ${point.x - w * 0.48} ${point.y - h * 0.4} C ${point.x - w * 0.12} ${point.y - h * 0.95} ${point.x + w * 0.52 * dir} ${point.y - h * 0.9} ${point.x + w * 0.7 * dir} ${point.y + h * 0.02} C ${point.x + w * 0.42 * dir} ${point.y + h * 0.7} ${point.x - w * 0.3} ${point.y + h * 0.68} ${point.x - w * 0.58} ${point.y + h * 0.2} Z" fill="url(#shoe)" class="shoeEdge"/>
  <path d="M ${point.x - w * 0.2} ${point.y + h * 0.34} L ${point.x + w * 0.48 * dir} ${point.y + h * 0.28}" class="sole"/>
  <path d="M ${point.x + w * 0.06 * dir} ${point.y - h * 0.48} Q ${point.x + w * 0.38 * dir} ${point.y - h * 0.62} ${point.x + w * 0.54 * dir} ${point.y - h * 0.08}" class="shoeHi"/>`;
}

function drawFrame(fighter, frame, index) {
  const b = fighter.build;
  const x0 = index * FRAME_W;
  const lean = frame.lean;
  const torsoTop = frame.pose === "defeat" ? 154 : frame.pose === "sweep" ? 126 : 82;
  const torsoBottom = frame.pose === "defeat" ? 210 : frame.pose === "sweep" ? 190 : 179;
  const neckY = torsoTop - 17;
  const arms = armPose(frame.arm, b);
  const legs = legPose(frame.legs, b);
  const shoulder = b.shoulder;
  const chest = b.chest;
  const waist = b.waist;
  const hip = b.hip;
  const hipY = frame.pose === "defeat" ? 203 : frame.pose === "sweep" ? 189 : 177;
  const cx = 105;

  const legSvg = legs.map((leg, legIndex) => {
    const color = legIndex === 0 ? "url(#pantsDark)" : "url(#pants)";
    const sw = (legIndex === 0 ? 10 : 11) * b.leg;
    const ew = (legIndex === 0 ? 7 : 8) * b.leg;
    return `<path d="${limbPath(leg[0], leg[1], leg[2], leg[3], sw, ew)}" fill="${color}" class="limbEdge"/>
    <ellipse cx="${leg[1].x}" cy="${leg[1].y}" rx="${7 * b.leg}" ry="${5 * b.leg}" fill="${legIndex === 0 ? "url(#pantsDark)" : "url(#pants)"}" class="limbEdge"/>
    ${foot(leg[3], fighter, legIndex === 0 ? -1 : 1)}`;
  }).join("");

  const backArm = arms[0];
  const frontArm = arms[1];
  const armSvg = (arm, front) => {
    const color = front ? "url(#trim)" : "url(#sleeveDark)";
    const sw = (front ? 9 : 8) * b.arm;
    const ew = (front ? 6.5 : 6) * b.arm;
    return `<path d="${limbPath(arm[0], arm[1], arm[2], arm[3], sw, ew)}" fill="${color}" class="limbEdge"/>
    <ellipse cx="${arm[1].x}" cy="${arm[1].y}" rx="${6 * b.arm}" ry="${4.8 * b.arm}" fill="${color}" class="limbEdge"/>
    ${hand(arm[3], fighter, front ? 1 : 0.94)}`;
  };

  const torsoPath = `M ${cx - shoulder} ${torsoTop + 18}
    C ${cx - chest - 4} ${torsoTop + 5} ${cx - waist - 7} ${torsoBottom - 45} ${cx - hip} ${torsoBottom}
    C ${cx - waist * 0.5} ${torsoBottom + 9} ${cx + waist * 0.5} ${torsoBottom + 9} ${cx + hip} ${torsoBottom}
    C ${cx + waist + 7} ${torsoBottom - 45} ${cx + chest + 4} ${torsoTop + 5} ${cx + shoulder} ${torsoTop + 18}
    Q ${cx} ${torsoTop - 6} ${cx - shoulder} ${torsoTop + 18} Z`;

  const hipPlate = `M ${cx - hip - 2} ${hipY - 11} Q ${cx} ${hipY - 1} ${cx + hip + 2} ${hipY - 11} L ${cx + hip - 4} ${hipY + 14} Q ${cx} ${hipY + 22} ${cx - hip + 4} ${hipY + 14} Z`;
  const neck = `<path d="M ${cx - b.neck * 0.52} ${neckY} C ${cx - b.neck * 0.6} ${neckY + 11} ${cx - b.neck * 0.46} ${neckY + 22} ${cx} ${neckY + 25} C ${cx + b.neck * 0.46} ${neckY + 22} ${cx + b.neck * 0.6} ${neckY + 11} ${cx + b.neck * 0.52} ${neckY} Z" fill="url(#skin)" class="skinEdge"/>
  <ellipse cx="${cx}" cy="${neckY + 25}" rx="${b.neck * 0.78}" ry="6" fill="#21130f" opacity=".22"/>`;

  const folds = `<path d="M ${cx - shoulder + 11} ${torsoTop + 23} L ${cx - 4} ${torsoBottom - 21} L ${cx + waist - 4} ${torsoTop + 28}" class="trimLine"/>
  <path d="M ${cx - waist * 0.7} ${torsoTop + 27} C ${cx - waist * 0.32} ${torsoTop + 58} ${cx - waist * 0.3} ${torsoBottom - 14} ${cx - waist * 0.18} ${torsoBottom - 2}" class="fold"/>
  <path d="M ${cx + waist * 0.55} ${torsoTop + 31} C ${cx + waist * 0.12} ${torsoTop + 59} ${cx + waist * 0.28} ${torsoBottom - 29} ${cx + waist * 0.2} ${torsoBottom - 6}" class="darkFold"/>`;

  const belt = `<path d="M ${cx - hip - 5} ${torsoBottom - 13} Q ${cx} ${torsoBottom - 3} ${cx + hip + 5} ${torsoBottom - 13} L ${cx + hip + 3} ${torsoBottom + 2} Q ${cx} ${torsoBottom + 12} ${cx - hip - 3} ${torsoBottom + 2} Z" fill="url(#trim)" class="beltEdge"/>
  <path d="M ${cx - 7} ${torsoBottom - 14} L ${cx} ${torsoBottom - 5} L ${cx + 7} ${torsoBottom - 14} L ${cx + 6} ${torsoBottom + 6} L ${cx} ${torsoBottom + 11} L ${cx - 6} ${torsoBottom + 6} Z" fill="url(#jacketDark)" opacity=".72"/>`;

  const identity = fighter.extras === "bandana"
    ? `<path d="M ${cx - 20} ${neckY + 1} C ${cx - 4} ${neckY - 4} ${cx + 15} ${neckY - 2} ${cx + 27} ${neckY + 3}" stroke="url(#trim)" stroke-width="7" stroke-linecap="round" opacity=".88"/>
       <path d="M ${cx + 25} ${neckY + 2} C ${cx + 38} ${neckY - 1} ${cx + 45} ${neckY + 7} ${cx + 50} ${neckY + 15}" stroke="url(#trim)" stroke-width="7" stroke-linecap="round" opacity=".82"/>
       <circle cx="${cx + 9}" cy="${neckY + 1}" r="2.3" fill="#151515"/><circle cx="${cx + 31}" cy="${neckY + 5}" r="2.3" fill="#151515"/>`
    : `<path d="M ${cx - waist - 7} ${torsoBottom - 46} C ${cx - waist * 0.35} ${torsoBottom - 38} ${cx + waist * 0.35} ${torsoBottom - 38} ${cx + waist + 7} ${torsoBottom - 46}" class="waistShape"/>
       <path d="M ${cx - shoulder + 12} ${torsoTop + 23} C ${cx - 3} ${torsoTop + 58} ${cx + 18} ${torsoBottom - 29} ${cx + waist + 1} ${torsoBottom - 5}" stroke="url(#trim)" stroke-width="5" stroke-linecap="round" opacity=".95"/>`;

  return `<g transform="translate(${x0} 0)">
    <rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" fill="none"/>
    <ellipse cx="${ANCHOR_X}" cy="${ANCHOR_Y + 2}" rx="${frame.pose === "defeat" ? 74 : 54}" ry="10" fill="#000" opacity=".16"/>
    <g transform="rotate(${lean} ${cx} ${torsoBottom})">
      ${legSvg}
      <path d="${hipPlate}" fill="url(#pants)" class="limbEdge"/>
      ${armSvg(backArm, false)}
      <path d="${torsoPath}" fill="url(#jacket)" class="bodyEdge"/>
      <path d="${torsoPath}" fill="url(#bodySheen)" opacity=".72"/>
      ${folds}
      ${belt}
      ${neck}
      ${identity}
      ${armSvg(frontArm, true)}
      ${frame.pose === "special" ? `<circle cx="202" cy="80" r="18" fill="none" stroke="url(#trim)" stroke-width="4" opacity=".54"/><circle cx="202" cy="80" r="8" fill="url(#trim)" opacity=".38"/>` : ""}
      ${frame.pose === "kick" && frame.legs === "kickHit" ? `<path d="M 145 166 C 170 141 205 137 236 148" fill="none" stroke="url(#trim)" stroke-width="7" stroke-linecap="round" opacity=".45"/>` : ""}
    </g>
  </g>`;
}

function makeSheet(fighter) {
  const defs = `
  <defs>
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
  </defs>`;

  const css = `<style>
    .bodyEdge, .limbEdge, .beltEdge { stroke: ${fighter.edge}; stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
    .limbEdge { stroke-width: 2.5; }
    .skinEdge { stroke: #4c2a1e; stroke-width: 2; }
    .shoeEdge { stroke: #3d2813; stroke-width: 2; }
    .fold { fill: none; stroke: ${fighter.light}; stroke-width: 2.2; stroke-linecap: round; opacity: .34; }
    .darkFold { fill: none; stroke: ${fighter.dark}; stroke-width: 2.2; stroke-linecap: round; opacity: .32; }
    .trimLine { fill: none; stroke: url(#trim); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .waistShape { fill: none; stroke: url(#trim); stroke-width: 2.6; stroke-linecap: round; opacity: .5; }
    .knuckle { fill: none; stroke: #5b3022; stroke-width: 1.5; stroke-linecap: round; opacity: .5; }
    .sole { fill: none; stroke: #14110d; stroke-width: 2; stroke-linecap: round; opacity: .46; }
    .shoeHi { fill: none; stroke: #fff7c9; stroke-width: 2; stroke-linecap: round; opacity: .42; }
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
