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
  { key: "idle1", pose: "idle", lean: -1, arm: "ready", legs: "stanceA", torsoTop: 1, shadowRx: 52 },
  { key: "idle2", pose: "idle", lean: 1, arm: "ready", legs: "stanceB", torsoTop: -1, shadowRx: 54 },
  { key: "walk1", pose: "walk", lean: 4, arm: "walkA", legs: "walkA", torsoTop: 1, shadowRx: 58 },
  { key: "walk2", pose: "walk", lean: -4, arm: "walkB", legs: "walkB", torsoTop: -1, shadowRx: 48 },
  { key: "punch1", pose: "punch", lean: -5, arm: "punchPrep", legs: "braceLoad", torsoTop: 4, torsoBottom: 3, shadowRx: 62 },
  { key: "punch2", pose: "punch", lean: 12, arm: "punchHit", legs: "lunge", torsoTop: -3, torsoBottom: -1, shadowRx: 72 },
  { key: "punch3", pose: "punch", lean: 1, arm: "punchRecover", legs: "rebound", torsoTop: 2, torsoBottom: 1, shadowRx: 56 },
  { key: "kick1", pose: "kick", lean: -8, arm: "kickGuard", legs: "kickChamber", torsoTop: 3, torsoBottom: 2, shadowRx: 58 },
  { key: "kick2", pose: "kick", lean: -13, arm: "kickGuard", legs: "kickHit", torsoTop: -2, torsoBottom: -2, shadowRx: 74 },
  { key: "kick3", pose: "kick", lean: -2, arm: "ready", legs: "kickRecover", torsoTop: 1, shadowRx: 55 },
  { key: "block", pose: "block", lean: -2, arm: "block", legs: "brace" },
  { key: "hurt1", pose: "hurt", lean: 10, arm: "hurt", legs: "stumble" },
  { key: "hurt2", pose: "hurt", lean: 5, arm: "hurtLow", legs: "stumbleLow" },
  { key: "special", pose: "special", lean: -5, arm: "special", legs: "braceWide" },
  { key: "victory", pose: "victory", lean: -3, arm: "victory", legs: "stanceA" },
  { key: "defeat", pose: "defeat", lean: 16, arm: "defeat", legs: "defeat" },
  { key: "sweep", pose: "sweep", lean: 13, arm: "sweep", legs: "sweep" },
  { key: "punchDrive", pose: "punch", lean: 6, arm: "punchDrive", legs: "lungeLoad", torsoTop: 0, torsoBottom: 1, shadowRx: 66 },
  { key: "punchFollow", pose: "punch", lean: 15, arm: "punchFollow", legs: "lungeDeep", torsoTop: -5, torsoBottom: -3, shadowRx: 76 },
  { key: "kickWind", pose: "kick", lean: -4, arm: "kickBalance", legs: "kickPrep", torsoTop: 2, torsoBottom: 2, shadowRx: 62 },
  { key: "kickFollow", pose: "kick", lean: -16, arm: "kickBalanceWide", legs: "kickFollow", torsoTop: -2, torsoBottom: -3, shadowRx: 78 },
  { key: "walk3", pose: "walk", lean: 2, arm: "walkCross", legs: "walkCross", torsoTop: 0, shadowRx: 56 },
  { key: "idle3", pose: "idle", lean: 0, arm: "readyHigh", legs: "stanceA", torsoTop: 0, shadowRx: 53 },
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
      forearm: 0.98,
      thigh: 1.12,
      calf: 0.98,
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
      upperArm: 0.76,
      forearm: 0.68,
      thigh: 0.84,
      calf: 0.72,
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

function jointPatch(point, color, rx, ry, angle, front = false) {
  return `<g transform="rotate(${angle} ${point.x} ${point.y})">
    <ellipse cx="${point.x}" cy="${point.y}" rx="${rx}" ry="${ry}" fill="${color}" class="softJoint"/>
    <ellipse cx="${point.x - rx * 0.1}" cy="${point.y - ry * 0.18}" rx="${rx * 0.58}" ry="${ry * 0.36}" fill="url(#jointLight)" opacity="${front ? ".42" : ".28"}"/>
    <path d="M ${point.x - rx * 0.66} ${point.y + ry * 0.18} Q ${point.x} ${point.y + ry * 0.56} ${point.x + rx * 0.66} ${point.y + ry * 0.12}" class="jointShade"/>
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
    if (kind === "punchDrive" && armIndex === 1) {
      p.x += [0, 2, 4, 4][pointIndex] ?? 0;
      p.y += [0, -2, -3, -2][pointIndex] ?? 0;
    } else if (kind === "punchFollow" && armIndex === 1) {
      p.x += [0, 2, 3, 1][pointIndex] ?? 0;
      p.y += [0, -2, -3, -4][pointIndex] ?? 0;
    } else if (kind.includes("punch") && armIndex === 0) {
      p.x -= [0, 2, 4, 5][pointIndex] ?? 0;
      p.y += [0, 2, 3, 3][pointIndex] ?? 0;
    }
  } else if (b.motion === "agile") {
    if (kind === "ready" || kind === "readyHigh") {
      p.y -= armIndex === 1 ? [0, 3, 5, 5][pointIndex] ?? 0 : [0, 1, 2, 2][pointIndex] ?? 0;
      p.x += armIndex === 1 ? [0, -2, -3, -3][pointIndex] ?? 0 : [0, 1, 2, 2][pointIndex] ?? 0;
    } else if (kind.includes("kick") && armIndex === 0) {
      p.y -= [0, 3, 5, 6][pointIndex] ?? 0;
      p.x -= [0, 1, 2, 3][pointIndex] ?? 0;
    } else if (kind.includes("punch") && armIndex === 1) {
      p.y -= [0, 1, 2, 2][pointIndex] ?? 0;
    }
  }
  return p;
}

function styleLegPoint(point, b, kind, legIndex, pointIndex) {
  const p = { ...point };
  if (b.motion === "power") {
    if (kind.includes("lunge")) {
      const dir = legIndex === 0 ? -1 : 1;
      p.x += dir * ([0, 2, 5, 7][pointIndex] ?? 0);
      p.y += [0, 1, 1, 0][pointIndex] ?? 0;
    } else if (kind === "braceLoad" && pointIndex > 0) {
      p.x += legIndex === 0 ? -3 : 3;
    }
  } else if (b.motion === "agile") {
    if (kind === "kickHit" || kind === "kickFollow") {
      if (legIndex === 1) {
        p.x += [0, 2, 4, 5][pointIndex] ?? 0;
        p.y -= [0, 2, 4, 5][pointIndex] ?? 0;
      } else if (pointIndex > 1) {
        p.x -= 3;
        p.y += 1;
      }
    } else if (kind === "walkCross" && pointIndex > 1) {
      p.y -= 2;
    }
  }
  return p;
}

function armPose(kind, b) {
  const shoulderY = 108;
  const l = b.arm;
  const poses = {
    ready: [
      [{ x: 74, y: shoulderY }, { x: 61, y: 136 }, { x: 61, y: 164 }, { x: 70, y: 187 }],
      [{ x: 136, y: shoulderY }, { x: 151, y: 134 }, { x: 151, y: 164 }, { x: 140, y: 187 }],
    ],
    readyHigh: [
      [{ x: 74, y: shoulderY }, { x: 61, y: 132 }, { x: 60, y: 158 }, { x: 69, y: 179 }],
      [{ x: 136, y: shoulderY }, { x: 150, y: 130 }, { x: 150, y: 156 }, { x: 139, y: 179 }],
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
      [{ x: 73, y: 110 }, { x: 61, y: 124 }, { x: 58, y: 145 }, { x: 70, y: 160 }],
      [{ x: 136, y: 107 }, { x: 132, y: 104 }, { x: 126, y: 116 }, { x: 124, y: 129 }],
    ],
    punchDrive: [
      [{ x: 73, y: 110 }, { x: 59, y: 129 }, { x: 58, y: 151 }, { x: 70, y: 169 }],
      [{ x: 136, y: 106 }, { x: 149, y: 99 }, { x: 168, y: 98 }, { x: 187, y: 97 }],
    ],
    punchHit: [
      [{ x: 73, y: 110 }, { x: 62, y: 130 }, { x: 64, y: 151 }, { x: 77, y: 167 }],
      [{ x: 136, y: 106 }, { x: 164, y: 98 }, { x: 188, y: 97 }, { x: 207, y: 96 }],
    ],
    punchFollow: [
      [{ x: 73, y: 111 }, { x: 63, y: 134 }, { x: 64, y: 157 }, { x: 78, y: 174 }],
      [{ x: 136, y: 107 }, { x: 160, y: 100 }, { x: 183, y: 102 }, { x: 201, y: 108 }],
    ],
    punchRecover: [
      [{ x: 73, y: 110 }, { x: 59, y: 134 }, { x: 59, y: 160 }, { x: 70, y: 181 }],
      [{ x: 136, y: 107 }, { x: 151, y: 121 }, { x: 155, y: 145 }, { x: 144, y: 166 }],
    ],
    kickGuard: [
      [{ x: 74, y: 109 }, { x: 61, y: 124 }, { x: 58, y: 146 }, { x: 67, y: 165 }],
      [{ x: 136, y: 108 }, { x: 126, y: 114 }, { x: 124, y: 135 }, { x: 132, y: 152 }],
    ],
    kickBalance: [
      [{ x: 74, y: 109 }, { x: 58, y: 119 }, { x: 52, y: 139 }, { x: 59, y: 158 }],
      [{ x: 136, y: 108 }, { x: 124, y: 114 }, { x: 121, y: 135 }, { x: 129, y: 153 }],
    ],
    kickBalanceWide: [
      [{ x: 74, y: 109 }, { x: 55, y: 120 }, { x: 49, y: 142 }, { x: 58, y: 162 }],
      [{ x: 136, y: 108 }, { x: 123, y: 117 }, { x: 123, y: 139 }, { x: 134, y: 157 }],
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
    walkCross: [
      [{ x: 86, y: hipY }, { x: 78, y: 208 }, { x: 68, y: 239 }, { x: 50, y: 281 }],
      [{ x: 123, y: hipY }, { x: 132, y: 208 }, { x: 140, y: 239 }, { x: 158, y: 281 }],
    ],
    brace: [
      [{ x: 84, y: hipY }, { x: 73, y: 210 }, { x: 64, y: 244 }, { x: 47, y: 281 }],
      [{ x: 126, y: hipY }, { x: 136, y: 210 }, { x: 146, y: 244 }, { x: 163, y: 281 }],
    ],
    braceLoad: [
      [{ x: 83, y: hipY + 2 }, { x: 70, y: 216 }, { x: 60, y: 249 }, { x: 39, y: 281 }],
      [{ x: 126, y: hipY + 2 }, { x: 139, y: 216 }, { x: 151, y: 249 }, { x: 172, y: 281 }],
    ],
    braceWide: [
      [{ x: 82, y: hipY }, { x: 67, y: 211 }, { x: 55, y: 244 }, { x: 35, y: 281 }],
      [{ x: 127, y: hipY }, { x: 143, y: 210 }, { x: 157, y: 244 }, { x: 184, y: 281 }],
    ],
    lunge: [
      [{ x: 82, y: hipY }, { x: 66, y: 213 }, { x: 52, y: 246 }, { x: 28, y: 281 }],
      [{ x: 127, y: hipY }, { x: 147, y: 209 }, { x: 164, y: 242 }, { x: 190, y: 281 }],
    ],
    lungeLoad: [
      [{ x: 82, y: hipY + 1 }, { x: 68, y: 214 }, { x: 56, y: 247 }, { x: 34, y: 281 }],
      [{ x: 127, y: hipY + 1 }, { x: 144, y: 209 }, { x: 158, y: 242 }, { x: 181, y: 281 }],
    ],
    lungeDeep: [
      [{ x: 82, y: hipY }, { x: 63, y: 215 }, { x: 49, y: 248 }, { x: 25, y: 281 }],
      [{ x: 127, y: hipY }, { x: 150, y: 209 }, { x: 169, y: 241 }, { x: 196, y: 281 }],
    ],
    rebound: [
      [{ x: 84, y: hipY + 1 }, { x: 74, y: 212 }, { x: 66, y: 246 }, { x: 51, y: 281 }],
      [{ x: 125, y: hipY + 1 }, { x: 136, y: 212 }, { x: 148, y: 246 }, { x: 166, y: 281 }],
    ],
    kickPrep: [
      [{ x: 84, y: hipY }, { x: 72, y: 209 }, { x: 64, y: 244 }, { x: 48, y: 281 }],
      [{ x: 124, y: hipY }, { x: 139, y: 199 }, { x: 146, y: 184 }, { x: 152, y: 169 }],
    ],
    kickChamber: [
      [{ x: 83, y: hipY + 2 }, { x: 69, y: 216 }, { x: 57, y: 250 }, { x: 38, y: 281 }],
      [{ x: 124, y: hipY - 1 }, { x: 143, y: 195 }, { x: 142, y: 171 }, { x: 127, y: 155 }],
    ],
    kickHit: [
      [{ x: 84, y: hipY }, { x: 70, y: 211 }, { x: 60, y: 245 }, { x: 40, y: 281 }],
      [{ x: 124, y: hipY }, { x: 153, y: 185 }, { x: 184, y: 164 }, { x: 213, y: 147 }],
    ],
    kickFollow: [
      [{ x: 84, y: hipY }, { x: 68, y: 212 }, { x: 58, y: 246 }, { x: 38, y: 281 }],
      [{ x: 124, y: hipY }, { x: 151, y: 188 }, { x: 179, y: 173 }, { x: 207, y: 163 }],
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
  const w = 30 * b.foot;
  const h = 12 * b.foot;
  return `<g>
    <path d="M ${point.x - w * 0.48} ${point.y - h * 0.4} C ${point.x - w * 0.12} ${point.y - h * 0.95} ${point.x + w * 0.52 * dir} ${point.y - h * 0.9} ${point.x + w * 0.7 * dir} ${point.y + h * 0.02} C ${point.x + w * 0.42 * dir} ${point.y + h * 0.7} ${point.x - w * 0.3} ${point.y + h * 0.68} ${point.x - w * 0.58} ${point.y + h * 0.2} Z" fill="url(#shoe)" class="shoeEdge"/>
    <path d="M ${point.x - w * 0.44} ${point.y + h * 0.26} C ${point.x - w * 0.06} ${point.y + h * 0.58} ${point.x + w * 0.42 * dir} ${point.y + h * 0.52} ${point.x + w * 0.62 * dir} ${point.y + h * 0.16}" class="sole"/>
    <path d="M ${point.x - w * 0.36} ${point.y + h * 0.12} Q ${point.x - w * 0.48} ${point.y + h * 0.54} ${point.x - w * 0.18} ${point.y + h * 0.64}" class="heel"/>
    <path d="M ${point.x + w * 0.06 * dir} ${point.y - h * 0.48} Q ${point.x + w * 0.38 * dir} ${point.y - h * 0.62} ${point.x + w * 0.54 * dir} ${point.y - h * 0.08}" class="shoeHi"/>
    <ellipse cx="${point.x + w * 0.38 * dir}" cy="${point.y - h * 0.2}" rx="${w * 0.14}" ry="${h * 0.16}" fill="#fff7c9" opacity=".2"/>
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
    return `<path d="${thighPath}" fill="${color}" class="limbEdge"/>
    <path d="${shinPath}" fill="${color}" class="limbEdge"/>
    <path d="${thighPath}" fill="url(#limbSheen)" opacity="${legIndex === 0 ? ".2" : ".3"}"/>
    <path d="${shinPath}" fill="url(#limbShade)" opacity="${legIndex === 0 ? ".28" : ".2"}"/>
    <path d="${thighPath}" fill="url(#limbRim)" opacity="${legIndex === 0 ? ".18" : ".26"}"/>
    <path d="${shinPath}" fill="url(#limbRim)" opacity="${legIndex === 0 ? ".14" : ".22"}"/>
    ${jointPatch(leg[1], color, 7.4 * thighScale, 5.1 * thighScale, kneeAngle, legIndex === 1)}
    <path d="M ${leg[0].x - 4} ${leg[0].y + 14} C ${leg[1].x - 3} ${leg[1].y - 7} ${leg[1].x + 2} ${leg[1].y + 3} ${leg[2].x + 2} ${leg[2].y - 5}" class="limbHi"/>
    <path d="M ${leg[1].x - 2} ${leg[1].y + 7} C ${leg[2].x - 5} ${leg[2].y + 8} ${leg[3].x - 7} ${leg[3].y - 8} ${leg[3].x - 5} ${leg[3].y - 1}" class="clothCrease"/>
    <path d="M ${leg[0].x + 2} ${leg[0].y + 16} C ${leg[1].x + 6} ${leg[1].y + 4} ${leg[2].x + 5} ${leg[2].y + 7} ${leg[3].x + 3} ${leg[3].y - 7}" class="legPlane"/>
    ${foot(leg[3], fighter, legIndex === 0 ? -1 : 1)}`;
  }).join("");

  const backArm = arms[0];
  const frontArm = arms[1];
  const armSvg = (arm, front) => {
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
    return `<path d="${upperPath}" fill="${color}" class="limbEdge"/>
    <path d="${forearmPath}" fill="${color}" class="limbEdge"/>
    <path d="${upperPath}" fill="url(#limbSheen)" opacity="${front ? ".32" : ".2"}"/>
    <path d="${forearmPath}" fill="url(#limbShade)" opacity="${front ? ".18" : ".27"}"/>
    <path d="${upperPath}" fill="url(#limbRim)" opacity="${front ? ".24" : ".15"}"/>
    <path d="${forearmPath}" fill="url(#limbRim)" opacity="${front ? ".22" : ".12"}"/>
    ${jointPatch(arm[1], color, 6.1 * upperScale, 4.5 * upperScale, elbowAngle, front)}
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
  const neck = `<path d="M ${cx - b.neck * 0.52} ${neckY} C ${cx - b.neck * 0.6} ${neckY + 11} ${cx - b.neck * 0.46} ${neckY + 22} ${cx} ${neckY + 25} C ${cx + b.neck * 0.46} ${neckY + 22} ${cx + b.neck * 0.6} ${neckY + 11} ${cx + b.neck * 0.52} ${neckY} Z" fill="url(#skin)" class="skinEdge"/>
  <ellipse cx="${cx}" cy="${neckY + 25}" rx="${b.neck * 0.78}" ry="6" fill="#21130f" opacity=".22"/>`;
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

  return `<g transform="translate(${x0} 0)">
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
    .softJoint { stroke: ${fighter.edge}; stroke-width: 1.45; stroke-linejoin: round; stroke-linecap: round; opacity: .92; }
    .skinEdge { stroke: #4c2a1e; stroke-width: 2; }
    .shoeEdge { stroke: #3d2813; stroke-width: 2; }
    .fold { fill: none; stroke: ${fighter.light}; stroke-width: 2.2; stroke-linecap: round; opacity: .34; }
    .darkFold { fill: none; stroke: ${fighter.dark}; stroke-width: 2.2; stroke-linecap: round; opacity: .32; }
    .trimLine { fill: none; stroke: url(#trim); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .wideTrim { fill: none; stroke: url(#trim); stroke-width: 6.5; stroke-linecap: round; stroke-linejoin: round; opacity: .95; }
    .limbHi { fill: none; stroke: ${fighter.light}; stroke-width: 1.55; stroke-linecap: round; opacity: .22; }
    .armPlane, .legPlane { fill: none; stroke: ${fighter.dark}; stroke-width: 1.15; stroke-linecap: round; opacity: .22; }
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
