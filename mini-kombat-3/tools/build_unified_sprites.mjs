import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(toolDir);
const assetsDir = join(rootDir, "assets");

const FRAME_W = 210;
const FRAME_H = 300;
const ANCHOR_X = 105;
const ANCHOR_Y = 286;

const frameMeta = [
  ["idle", 0],
  ["idle", 1],
  ["walk", 2],
  ["walk", 3],
  ["punch", 4],
  ["punch", 5],
  ["punch", 6],
  ["kick", 7],
  ["kick", 8],
  ["kick", 9],
  ["block", 10],
  ["hurt", 11],
  ["hurt", 12],
  ["special", 13],
  ["victory", 14],
  ["defeat", 15],
  ["sweep", 16],
  ["punch", 17],
  ["punch", 18],
  ["kick", 19],
  ["kick", 20],
  ["walk", 21],
  ["idle", 22],
];

const fighters = {
  p1: {
    title: "Pchan unified sprite sheet",
    out: "sprite-pchan-unified.svg",
    body: "sprite-pchan-body.svg",
    face: "fighter-1-face.png",
    color: "#2677bf",
    trim: "#f6c445",
    skin: "#f1bd98",
    jacket: "#2677bf",
    sleeve: "#f6c445",
    spec: {
      headW: 92,
      headH: 98,
      headY: 16,
      neckW: 26,
      facePad: 4,
      headScale: 0.94,
    },
    headwear: "bandana",
  },
  p2: {
    title: "Akane unified sprite sheet",
    out: "sprite-akane-unified.svg",
    body: "sprite-akane-body.svg",
    face: "fighter-2-face.png",
    color: "#cc3a3f",
    trim: "#5ee0b4",
    skin: "#f4c3a3",
    jacket: "#cc3a3f",
    sleeve: "#5ee0b4",
    spec: {
      headW: 84,
      headH: 92,
      headY: 20,
      neckW: 20,
      facePad: 5,
      headScale: 0.94,
    },
    hair: true,
  },
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function dataUri(path, mime) {
  const data = readFileSync(path).toString("base64");
  return `data:${mime};base64,${data}`;
}

function spriteHeadPose(profileId, frameName, frameIndex) {
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
    pose.x = -3;
    pose.y = -38;
    pose.scale = 0.72;
  } else if (frameName === "hurt") {
    pose.x = frameIndex === 12 ? 8 : 5;
    pose.y = frameIndex === 12 ? -33 : -36;
    pose.scale = 0.7;
  } else if (frameName === "special" || frameName === "victory") {
    pose.x = frameName === "victory" ? -2 : 0;
    pose.y = -44;
  } else if (frameName === "sweep") {
    pose.x = 4;
    pose.y = -31;
    pose.scale = 0.7;
  } else if (frameName === "defeat") {
    pose.x = 14;
    pose.y = 0;
    pose.scale = 0.64;
  }

  if (profileId === "p1") pose.y -= 3;
  return pose;
}

function headTilt(profileId, frameName, frameIndex) {
  const agile = profileId === "p2";
  if (frameName === "block") return agile ? -9 : -7;
  if (frameName === "hurt") return frameIndex === 12 ? (agile ? 24 : 20) : (agile ? 16 : 14);
  if (frameName === "victory") return agile ? -7 : -5;
  if (frameName === "defeat") return agile ? 28 : 24;
  if (frameName === "sweep") return agile ? 13 : 11;
  return 0;
}

function faceMaskPath(x, y, w, h) {
  const cx = x + w / 2;
  return `M ${cx} ${y}
    C ${x + w * 0.84} ${y + h * 0.03} ${x + w * 0.98} ${y + h * 0.22} ${x + w * 0.92} ${y + h * 0.55}
    C ${x + w * 0.86} ${y + h * 0.86} ${x + w * 0.66} ${y + h * 1.02} ${cx} ${y + h}
    C ${x + w * 0.34} ${y + h * 1.02} ${x + w * 0.14} ${y + h * 0.86} ${x + w * 0.08} ${y + h * 0.55}
    C ${x + w * 0.02} ${y + h * 0.22} ${x + w * 0.16} ${y + h * 0.03} ${cx} ${y} Z`;
}

function headFrameGeometry(fighter, profileId, frameName, frameIndex) {
  const pose = spriteHeadPose(profileId, frameName, frameIndex);
  const spec = fighter.spec;
  const headScale = spec.headScale * pose.scale;
  const headW = spec.headW * headScale;
  const headH = spec.headH * headScale;
  const headCrouch = pose.y + (frameName === "block" ? 2 : 0);
  const cx = ANCHOR_X + pose.x;
  const x = cx - headW / 2;
  const y = ANCHOR_Y - 224 + headCrouch + spec.headY;
  return { cx, x, y, headW, headH, headScale, pose };
}

function neckAndCollar(fighter, g) {
  const neckTop = g.y + g.headH * 0.72;
  const neckBottom = g.y + g.headH + 9;
  const neckW = Math.max(14, fighter.spec.neckW * g.headScale * 0.82);
  const collarY = g.y + g.headH + 2;
  return `
    <ellipse cx="${g.cx}" cy="${collarY + 2}" rx="${g.headW * 0.34}" ry="9" fill="rgba(12,8,7,.28)"/>
    <path d="M ${g.cx - neckW * 0.5} ${neckTop} C ${g.cx - neckW * 0.52} ${neckTop + 12} ${g.cx - neckW * 0.4} ${neckBottom} ${g.cx} ${neckBottom} C ${g.cx + neckW * 0.4} ${neckBottom} ${g.cx + neckW * 0.52} ${neckTop + 12} ${g.cx + neckW * 0.5} ${neckTop} Z" fill="url(#skin)" class="skinEdge"/>
    <ellipse cx="${g.cx}" cy="${neckTop + 2}" rx="${neckW * 0.56}" ry="4.5" fill="rgba(48,24,18,.24)"/>
    <path d="M ${g.cx - g.headW * 0.36} ${collarY + 2} Q ${g.cx - g.headW * 0.21} ${collarY - 4} ${g.cx - neckW * 0.34} ${neckTop + 11} L ${g.cx - 3} ${collarY + 17} Q ${g.cx - g.headW * 0.22} ${collarY + 14} ${g.cx - g.headW * 0.42} ${collarY + 12} Z" fill="${fighter.jacket}" class="miniEdge"/>
    <path d="M ${g.cx + g.headW * 0.36} ${collarY + 2} Q ${g.cx + g.headW * 0.21} ${collarY - 4} ${g.cx + neckW * 0.34} ${neckTop + 11} L ${g.cx + 3} ${collarY + 17} Q ${g.cx + g.headW * 0.22} ${collarY + 14} ${g.cx + g.headW * 0.42} ${collarY + 12} Z" fill="${fighter.jacket}" class="miniEdge"/>
    <path d="M ${g.cx - g.headW * 0.25} ${collarY + 4} L ${g.cx - 4} ${collarY + 14} M ${g.cx + g.headW * 0.25} ${collarY + 4} L ${g.cx + 4} ${collarY + 14}" fill="none" stroke="${fighter.sleeve}" stroke-width="2.4" stroke-linecap="round"/>
  `;
}

function headSilhouette(fighter, g, profileId, frameIndex) {
  if (profileId !== "p2") {
    return `
      <ellipse cx="${g.cx}" cy="${g.y + g.headH * 0.59}" rx="${g.headW * 0.42}" ry="${g.headH * 0.5}" fill="rgba(34,18,13,.18)"/>
      <ellipse cx="${g.cx - g.headW * 0.36}" cy="${g.y + g.headH * 0.52}" rx="${g.headW * 0.11}" ry="${g.headH * 0.28}" fill="rgba(110,59,43,.18)" transform="rotate(-10 ${g.cx - g.headW * 0.36} ${g.y + g.headH * 0.52})"/>
      <ellipse cx="${g.cx + g.headW * 0.36}" cy="${g.y + g.headH * 0.52}" rx="${g.headW * 0.11}" ry="${g.headH * 0.28}" fill="rgba(110,59,43,.18)" transform="rotate(10 ${g.cx + g.headW * 0.36} ${g.y + g.headH * 0.52})"/>
    `;
  }
  const sway = Math.sin(frameIndex * 0.72) * 1.4;
  const hair = "#211417";
  return `
    <path d="M ${g.x + g.headW * 0.48} ${g.y - 4}
      C ${g.x + g.headW * 0.76} ${g.y - 5} ${g.x + g.headW * 0.92 + sway} ${g.y + g.headH * 0.12} ${g.x + g.headW * 0.94} ${g.y + g.headH * 0.38}
      C ${g.x + g.headW * 0.82} ${g.y + g.headH * 0.24} ${g.x + g.headW * 0.64} ${g.y + g.headH * 0.12} ${g.x + g.headW * 0.5} ${g.y + g.headH * 0.12}
      C ${g.x + g.headW * 0.34} ${g.y + g.headH * 0.12} ${g.x + g.headW * 0.18} ${g.y + g.headH * 0.24} ${g.x + g.headW * 0.06} ${g.y + g.headH * 0.38}
      C ${g.x + g.headW * 0.08 - sway} ${g.y + g.headH * 0.12} ${g.x + g.headW * 0.22} ${g.y - 5} ${g.x + g.headW * 0.48} ${g.y - 4} Z" fill="${hair}" opacity=".78"/>
    <path d="M ${g.x + g.headW * 0.16 + sway} ${g.y + g.headH * 0.16}
      C ${g.x + g.headW * 0.02 + sway} ${g.y + g.headH * 0.42} ${g.x + g.headW * 0.05} ${g.y + g.headH * 0.74} ${g.x + g.headW * 0.24} ${g.y + g.headH * 0.94}
      C ${g.x + g.headW * 0.2} ${g.y + g.headH * 0.65} ${g.x + g.headW * 0.22} ${g.y + g.headH * 0.34} ${g.x + g.headW * 0.3} ${g.y + g.headH * 0.09} Z" fill="${hair}" opacity=".7"/>
    <path d="M ${g.x + g.headW * 0.84 + sway} ${g.y + g.headH * 0.18}
      C ${g.x + g.headW * 0.98 + sway} ${g.y + g.headH * 0.42} ${g.x + g.headW * 0.95} ${g.y + g.headH * 0.74} ${g.x + g.headW * 0.76} ${g.y + g.headH * 0.94}
      C ${g.x + g.headW * 0.8} ${g.y + g.headH * 0.65} ${g.x + g.headW * 0.78} ${g.y + g.headH * 0.34} ${g.x + g.headW * 0.7} ${g.y + g.headH * 0.09} Z" fill="${hair}" opacity=".7"/>
  `;
}

function faceAndFinish(fighter, g, clipId) {
  const facePad = fighter.spec.facePad;
  const clipX = g.x + facePad;
  const clipY = g.y + facePad;
  const clipW = g.headW - facePad * 2;
  const clipH = g.headH - facePad * 1.55;
  const mask = faceMaskPath(clipX, clipY, clipW, clipH);
  return `
    <clipPath id="${clipId}"><path d="${mask}"/></clipPath>
    <path d="${faceMaskPath(clipX - 2, clipY - 2, clipW + 4, clipH + 4)}" fill="rgba(18,12,10,.12)"/>
    <g clip-path="url(#${clipId})">
      <use href="#faceAsset" xlink:href="#faceAsset" x="${g.x}" y="${g.y}" width="${g.headW}" height="${g.headH}" class="faceTone"/>
    </g>
    <path d="${mask}" fill="url(#faceShade)" opacity=".78"/>
    <ellipse cx="${g.cx}" cy="${g.y + g.headH - 11}" rx="${g.headW * 0.27}" ry="7" fill="rgba(36,21,16,.18)"/>
    <path d="M ${clipX + clipW * 0.22} ${clipY + clipH * 0.86} Q ${clipX + clipW * 0.5} ${clipY + clipH * 0.99} ${clipX + clipW * 0.78} ${clipY + clipH * 0.86}" fill="none" stroke="rgba(42,22,17,.16)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M ${clipX + clipW * 0.2} ${clipY + clipH * 0.16} C ${clipX + clipW * 0.34} ${clipY + clipH * 0.06} ${clipX + clipW * 0.64} ${clipY + clipH * 0.05} ${clipX + clipW * 0.82} ${clipY + clipH * 0.19}" fill="none" stroke="rgba(255,245,226,.11)" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="${g.cx}" cy="${g.y + g.headH * 0.92}" rx="${g.headW * 0.34}" ry="8" fill="rgba(34,18,14,.24)"/>
    <path d="M ${g.cx - g.headW * 0.34} ${g.y + g.headH * 0.98} Q ${g.cx} ${g.y + g.headH * 1.08} ${g.cx + g.headW * 0.34} ${g.y + g.headH * 0.98}" fill="none" stroke="${fighter.trim}" stroke-width="2" opacity=".22" stroke-linecap="round"/>
  `;
}

function pchanBandana(g, frameIndex) {
  const yellow = "#f7dc63";
  const shadow = "#b77d19";
  const mark = "#151515";
  const flutter = Math.sin(frameIndex * 0.74) * 1.8;
  const tailLift = Math.cos(frameIndex * 0.48) * 1.1 - (frameIndex === 5 || frameIndex === 8 ? 2 : 0);
  const bandLeft = g.x + g.headW * 0.26;
  const bandRight = g.x + g.headW * 0.76;
  const bandTop = g.y - g.headH * 0.025 + 2.6;
  const knotX = g.x + g.headW * 0.72;
  const knotY = g.y + g.headH * 0.055 + 2.2;
  const spots = [
    [bandLeft + g.headW * 0.13, bandTop + 8, 3.6, 7.4, -24],
    [bandLeft + g.headW * 0.34, bandTop + 10, 3.4, 7.2, 12],
    [knotX + 12 + flutter * 0.9, knotY + 3 + tailLift, 3.4, 7.2, 41],
    [knotX + 7 + flutter * 0.35, knotY + 15 + tailLift, 3.2, 6.8, -11],
  ];
  return `
    <ellipse cx="${knotX + 7}" cy="${knotY + 5}" rx="12" ry="8" fill="rgba(0,0,0,.26)" transform="rotate(-7 ${knotX + 7} ${knotY + 5})"/>
    <path d="M ${bandLeft} ${bandTop + 8} Q ${g.x + g.headW * 0.5} ${bandTop + 1} ${bandRight} ${bandTop + 7} L ${bandRight - 2} ${bandTop + 15} Q ${g.x + g.headW * 0.5} ${bandTop + 10} ${bandLeft - 2} ${bandTop + 16} Z" fill="${yellow}" stroke="${shadow}" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="${knotX}" cy="${knotY}" rx="6.8" ry="7.8" fill="${yellow}" stroke="${shadow}" stroke-width="2" transform="rotate(-20 ${knotX} ${knotY})"/>
    <path d="M ${knotX + 4} ${knotY - 2} Q ${knotX + 16 + flutter} ${knotY - 4 + tailLift} ${knotX + 25 + flutter * 1.4} ${knotY + 4 + tailLift} Q ${knotX + 16 + flutter * 0.6} ${knotY + 10 + tailLift} ${knotX + 5} ${knotY + 7} Z" fill="${yellow}" stroke="${shadow}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M ${knotX + 1} ${knotY + 5} Q ${knotX + 12 + flutter * 0.5} ${knotY + 13 + tailLift} ${knotX + 15 + flutter * 0.7} ${knotY + 24} Q ${knotX + 5 + flutter * 0.25} ${knotY + 22 + tailLift} ${knotX - 3} ${knotY + 10} Z" fill="${yellow}" stroke="${shadow}" stroke-width="2" stroke-linejoin="round"/>
    ${spots.map(([x, y, w, h, r]) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2" fill="${mark}" transform="rotate(${r} ${x} ${y})"/>`).join("")}
  `;
}

function akaneWisps(g, frameIndex) {
  const sway = Math.sin(frameIndex * 0.65) * 1.8;
  const leftX = g.x + g.headW * 0.18;
  const rightX = g.x + g.headW * 0.82;
  const topY = g.y + g.headH * 0.18;
  const lowY = g.y + g.headH * 0.78;
  return `
    <path d="M ${leftX + sway * 0.25} ${topY} C ${leftX - 9 + sway} ${topY + 18} ${leftX - 10 + sway * 0.5} ${lowY - 10} ${leftX + 2} ${lowY}" fill="none" stroke="rgba(36,18,22,.24)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M ${rightX + sway * 0.22} ${topY + 2} C ${rightX + 8 + sway} ${topY + 19} ${rightX + 8 + sway * 0.4} ${lowY - 12} ${rightX - 1} ${lowY - 1}" fill="none" stroke="rgba(36,18,22,.24)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M ${leftX + 2} ${topY + 5} C ${leftX - 4 + sway * 0.5} ${topY + 24} ${leftX - 3} ${lowY - 14} ${leftX + 4} ${lowY - 4} M ${rightX - 2} ${topY + 6} C ${rightX + 4 + sway * 0.5} ${topY + 24} ${rightX + 3} ${lowY - 16} ${rightX - 4} ${lowY - 4}" fill="none" stroke="rgba(255,245,226,.08)" stroke-width="1.3" stroke-linecap="round"/>
  `;
}

function headOverlay(fighter, profileId, frameName, frameIndex) {
  const g = headFrameGeometry(fighter, profileId, frameName, frameIndex);
  const clipId = `${profileId}-clip-${frameIndex}`;
  const tilt = headTilt(profileId, frameName, frameIndex);
  return `<g transform="translate(${frameIndex * FRAME_W} 0)">
    <g transform="rotate(${tilt} ${g.cx} ${g.y + g.headH * 0.78})">
    ${headSilhouette(fighter, g, profileId, frameIndex)}
    ${neckAndCollar(fighter, g)}
    ${faceAndFinish(fighter, g, clipId)}
    ${profileId === "p2" ? akaneWisps(g, frameIndex) : ""}
    ${fighter.headwear === "bandana" ? pchanBandana(g, frameIndex) : ""}
    </g>
  </g>`;
}

function makeSheet(profileId, fighter) {
  const bodyHref = dataUri(join(assetsDir, fighter.body), "image/svg+xml");
  const faceHref = dataUri(join(assetsDir, fighter.face), "image/png");
  const width = FRAME_W * frameMeta.length;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${FRAME_H}" viewBox="0 0 ${width} ${FRAME_H}">
  <title>${esc(fighter.title)}</title>
  <defs>
    <radialGradient id="skin" cx="35%" cy="25%" r="78%">
      <stop stop-color="#ffe4ce" offset="0"/>
      <stop stop-color="${fighter.skin}" offset=".62"/>
      <stop stop-color="#9f634b" offset="1"/>
    </radialGradient>
    <linearGradient id="faceShade" x1="40" y1="20" x2="150" y2="110" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff" stop-opacity=".1" offset="0"/>
      <stop stop-color="#fff" stop-opacity="0" offset=".5"/>
      <stop stop-color="#000" stop-opacity=".18" offset="1"/>
    </linearGradient>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#000" flood-opacity=".32"/>
    </filter>
    <symbol id="faceAsset" viewBox="0 0 1 1" preserveAspectRatio="none">
      <image href="${faceHref}" xlink:href="${faceHref}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"/>
    </symbol>
  </defs>
  <style>
    .miniEdge { stroke: rgba(28,16,13,.58); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .skinEdge { stroke: rgba(76,42,30,.52); stroke-width: 1.6; stroke-linejoin: round; }
    .faceTone { opacity: .98; }
  </style>
  <image href="${bodyHref}" x="0" y="0" width="${width}" height="${FRAME_H}" preserveAspectRatio="none"/>
  ${frameMeta.map(([frameName, frameIndex]) => headOverlay(fighter, profileId, frameName, frameIndex)).join("\n")}
</svg>
`;
}

for (const [profileId, fighter] of Object.entries(fighters)) {
  writeFileSync(join(assetsDir, fighter.out), makeSheet(profileId, fighter).replace(/[ \t]+$/gm, ""));
}

console.log(`Wrote ${Object.values(fighters).map((fighter) => fighter.out).join(", ")}`);
