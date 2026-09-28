"use strict";
let PAL_HEX = [],
  RGB = [],
  PAL32 = [],
  ID = [],
  SHADES = [],
  SH = [];
const W = 384,
  H = 216,
  N = 20,
  BH = 6,
  G = 18,
  DAY = 64,
  STEP = 1 / 60;
const ADULT_AGE = 50,
  MAX_POP = 40,
  MAX_HP = 6;
const cv = document.getElementById("game");
const ctx = cv.getContext("2d");
const img = ctx.createImageData(W, H);
const buf = new Uint32Array(img.data.buffer);
function nearest(r, g, b) {
  let bi = 0,
    bd = 1e9;
  for (let i = 0; i < RGB.length; i++) {
    const q = RGB[i];
    const d = (q[0] - r) ** 2 + (q[1] - g) ** 2 + (q[2] - b) ** 2;
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return bi;
}
function setPalette(hexes) {
  PAL_HEX = hexes;
  RGB = hexes.map((h) => [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]);
  PAL32 = RGB.map(
    ([r, g, b]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0,
  );
  ID = hexes.map((_, i) => i);

  // stupid palette shifter
  SHADES = [
    ID,
    RGB.map(([r, g, b]) =>
      nearest(r * 0.8, g * 0.76, Math.min(255, b * 0.82 + 20)),
    ),
    RGB.map(([r, g, b]) =>
      nearest(r * 0.5, g * 0.52, Math.min(255, b * 0.62 + 34)),
    ),
  ];
  SH = ID;
}

function hl(x, y, w, c) {
  if (y < 0 || y >= H) return;
  let x0 = x,
    x1 = x + w;
  if (x0 < 0) x0 = 0;
  if (x1 > W) x1 = W;
  if (x1 <= x0) return;
  const o = y * W;
  buf.fill(PAL32[SH[c]], o + x0, o + x1);
}
function rect(x, y, w, h, c) {
  for (let j = 0; j < h; j++) hl(x, y + j, w, c);
}
function vl(x, y, h, c) {
  if (x < 0 || x >= W || h <= 0) return;
  let y0 = y,
    y1 = y + h;
  if (y0 < 0) y0 = 0;
  if (y1 > H) y1 = H;
  const v = PAL32[SH[c]];
  for (let j = y0; j < y1; j++) buf[j * W + x] = v;
}
function px(x, y, c) {
  if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = PAL32[SH[c]];
}
function line(x0, y0, x1, y1, c) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0),
    sx = x0 < x1 ? 1 : -1,
    dy = -Math.abs(y1 - y0),
    sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (let k = 0; k < 400; k++) {
    px(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) {
      e += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      e += dx;
      y0 += sy;
    }
  }
}
function fillPoly(pts, c) {
  let minY = 1e9,
    maxY = -1e9;
  for (const p of pts) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  const y0 = Math.max(0, Math.ceil(minY - 0.5)),
    y1 = Math.min(H - 1, Math.floor(maxY - 0.5));
  const xs = [];
  for (let y = y0; y <= y1; y++) {
    const sy = y + 0.5;
    xs.length = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i],
        q = pts[(i + 1) % pts.length];
      if ((p[1] <= sy && q[1] > sy) || (q[1] <= sy && p[1] > sy))
        xs.push(p[0] + ((sy - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.round(xs[k]),
        xb = Math.round(xs[k + 1]);
      if (xb > xa) hl(xa, y, xb - xa, c);
    }
  }
}
function dither(cx, cy, rw, rh, c) {
  for (let dy = -rh; dy <= rh; dy++) {
    const w = Math.round(
      rw * Math.sqrt(Math.max(0, 1 - (dy / (rh + 0.5)) ** 2)),
    );
    for (let dx = -w; dx <= w; dx++)
      if (((cx + dx + cy + dy) & 1) === 0) px(cx + dx, cy + dy, c);
  }
}

const ROLES = [
  "hat",
  "hatDark",
  "brim",
  "hair",
  "accent",
  "shirt",
  "shirtDark",
  "pants",
  "skin",
  "eyes",
];
const ROLE_BASE = 1000;
let FONT = null,
  CHAR = null,
  SPR = null,
  TILES = null,
  MAT = null,
  PALM = null;
async function loadImageData(url) {
  const im = new Image();
  im.src = url;
  await im.decode();
  const c = document.createElement("canvas");
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext("2d");
  x.drawImage(im, 0, 0);
  return x.getImageData(0, 0, im.width, im.height);
}
const loadJSON = (url) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  });
const hexAt = (d, i) =>
  [d.data[i], d.data[i + 1], d.data[i + 2]]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
function makeCoder(keys) {
  const cache = new Map();
  return (d, x, y) => {
    const i = (y * d.width + x) * 4;
    if (d.data[i + 3] < 128) return -1;
    const hx = hexAt(d, i);
    if (keys && keys[hx] !== undefined) return ROLE_BASE + keys[hx];
    let v = cache.get(hx);
    if (v === undefined) {
      v = nearest(d.data[i], d.data[i + 1], d.data[i + 2]);
      cache.set(hx, v);
    }
    return v;
  };
}
function cut(d, x0, y0, w, h, anchor, coder) {
  const data = new Int16Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) data[y * w + x] = coder(d, x0 + x, y0 + y);
  return { w, h, ax: anchor ? anchor[0] : 0, ay: anchor ? anchor[1] : 0, data };
}
async function loadAssets(base) {
  const pal = await loadImageData(base + "palette.png");
  const hexes = [];
  for (let x = 4; x < pal.width; x += 8)
    hexes.push(hexAt(pal, (4 * pal.width + x) * 4));
  setPalette(hexes);
  const plain = makeCoder(null);
  const [fj, fd] = await Promise.all([
    loadJSON(base + "font.json"),
    loadImageData(base + "font.png"),
  ]);
  FONT = { w: fj.glyphW, h: fj.glyphH, stride: fj.stride, glyphs: {} };
  [...fj.chars].forEach((ch, k) => {
    const on = [];
    for (let y = 0; y < fj.glyphH; y++)
      for (let x = 0; x < fj.glyphW; x++)
        if (fd.data[(y * fd.width + k * fj.stride + x) * 4 + 3] >= 128)
          on.push(x, y);
    FONT.glyphs[ch] = on;
  });
  const [cj, cd] = await Promise.all([
    loadJSON(base + "characters.json"),
    loadImageData(base + "characters.png"),
  ]);
  const keys = {};
  for (const [hx, role] of Object.entries(cj.keys))
    keys[hx.replace("#", "").toLowerCase()] = ROLES.indexOf(role);
  const coder = makeCoder(keys);
  CHAR = {};
  for (const [body, frames] of Object.entries(cj.bodies)) {
    CHAR[body] = { swimRows: frames.swimRows || 5 };
    for (const f of cj.frames) {
      const m = frames[f];
      CHAR[body][f] = cut(
        cd,
        m.rect[0],
        m.rect[1],
        m.rect[2],
        m.rect[3],
        m.anchor,
        coder,
      );
    }
  }
  // props
  const [pj, pd] = await Promise.all([
    loadJSON(base + "props.json"),
    loadImageData(base + "props.png"),
  ]);
  SPR = {};
  for (const [n, m] of Object.entries(pj.sprites))
    SPR[n] = cut(
      pd,
      m.rect[0],
      m.rect[1],
      m.rect[2],
      m.rect[3],
      m.anchor,
      plain,
    );
  PALM = pj.palm;
  // tiles
  const [tj, td] = await Promise.all([
    loadJSON(base + "tiles.json"),
    loadImageData(base + "tiles.png"),
  ]);
  const [tw, th] = tj.topSize,
    [fw, fh] = tj.faceSize,
    [ww, wh] = tj.waterfallSize;
  TILES = {
    tops: {},
    faces: {},
    waterfall: {},
    bands: tj.bands,
    edgePx: tj.edgePx,
    faceW: fw,
    faceH: fh,
    wfH: wh,
  };
  for (const [n, list] of Object.entries(tj.tops))
    TILES.tops[n] = list.map(([x, y]) => cut(td, x, y, tw, th, [8, 0], plain));
  for (const [n, sides] of Object.entries(tj.faces))
    TILES.faces[n] = {
      L: cut(td, sides.L[0], sides.L[1], fw, fh, null, plain),
      R: cut(td, sides.R[0], sides.R[1], fw, fh, null, plain),
    };
  for (const side of ["L", "R"])
    TILES.waterfall[side] = cut(
      td,
      tj.waterfall[side][0],
      tj.waterfall[side][1],
      ww,
      wh,
      null,
      plain,
    );
  MAT = {};
  for (const [n, [x, y]] of Object.entries(tj.materials))
    MAT[n] = plain(td, x + 1, y + 1);
}
function text(s, x, y, c, sc = 1, sh = -1) {
  if (sh >= 0) text(s, x + sc, y + sc, sh, sc, -1);
  for (let k = 0; k < s.length; k++) {
    const on = FONT.glyphs[s[k]] || FONT.glyphs["?"] || [];
    for (let i = 0; i < on.length; i += 2)
      rect(
        x + k * FONT.stride * sc + on[i] * sc,
        y + on[i + 1] * sc,
        sc,
        sc,
        c,
      );
  }
}
const textW = (s, sc = 1) => (s.length * FONT.stride - 1) * sc;
function blitSpr(s, x, y, flip, roles, rows) {
  const n = rows ? Math.min(rows, s.h) : s.h,
    top = rows ? y - n : y - s.ay;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < s.w; i++) {
      let c = s.data[j * s.w + i];
      if (c < 0) continue;
      if (c >= ROLE_BASE) {
        c = roles ? roles[c - ROLE_BASE] : -1;
        if (c < 0) continue;
      }
      px(flip ? x + s.ax - i : x + i - s.ax, top + j, c);
    }
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(i, j, s) {
  let h = (i * 374761393 + j * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const rnd = Math.random,
  clamp = (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp = (a, b, t) => a + (b - a) * t;
const pick = (a) => a[Math.floor(rnd() * a.length)];

// camera code
let rot = 0,
  RA = 0,
  RB = 0,
  PX = 0,
  PY = 0,
  OX = W / 2,
  OY = 46;
function rotP(x, z) {
  switch (rot) {
    case 0:
      RA = x;
      RB = z;
      break;
    case 1:
      RA = N - z;
      RB = x;
      break;
    case 2:
      RA = N - x;
      RB = N - z;
      break;
    default:
      RA = z;
      RB = N - x;
  }
}
function unrot(a, b) {
  switch (rot) {
    case 0:
      return [a, b];
    case 1:
      return [b, N - a];
    case 2:
      return [N - a, N - b];
    default:
      return [N - b, a];
  }
}
function proj(x, y, z) {
  rotP(x, z);
  PX = Math.round(OX + (RA - RB) * 8);
  PY = Math.round(OY + (RA + RB) * 4 - y * BH);
}
function unproj(sx, sy, y) {
  const p = (sx - OX) / 8,
    q = (sy - OY + y * BH) / 4;
  return unrot((p + q) / 2, (q - p) / 2);
}
function objKey(x, z) {
  rotP(x, z);
  const A = Math.floor(RA),
    B = Math.floor(RB);
  return A + B + 1.5 + (RA - A + (RB - B)) * 0.2;
}

let cells,
  cellsFlat,
  cellList,
  villagers,
  nuts,
  corpses,
  parts,
  pops,
  ghosts,
  houses,
  trees,
  rocks,
  logs;
let time,
  food,
  wood,
  stone,
  deaths,
  births,
  paused = false,
  seed,
  uid,
  held = null,
  heldHist = [],
  nameCount;
const MNAMES = [
  "RED",
  "DENNY",
  "LEO",
  "GUS",
  "VINCENT",
  "PIP",
  "SAL",
  "TED",
  "VIC",
  "WES",
  "JAMES",
  "ELI",
  "JUN",
  "RAY",
  "ABE",
  "BRANN",
  "JOE",
  "KIT",
  "WENDALE",
  "KHOLYA",
  "LUKE",
  "ELON",
];
const FNAMES = [
  "RIEL",
  "MADELLE",
  "JOY",
  "GRACE",
  "PAULA",
  "KATE",
  "KIM",
  "IZA",
  "JHOANNA",
  "BEVERLY",
  "HARRIET",
  "FAYE",
  "KAYE",
  "GRACE",
  "LIAM",
  "HANNEH",
  "JUDY",
  "KATE",
  "ERICA",
  "JULIE",
];
const SHIRTS = [
  [14, 17],
  [9, 8],
  [21, 23],
  [22, 4],
  [13, 18],
  [11, 22],
  [25, 24],
];
const DRESSES = [
  [27, 15],
  [14, 17],
  [12, 13],
  [11, 22],
  [26, 27],
  [9, 8],
];
const HAIRS = [17, 6, 13, 12, 18];
const PANTS = [17, 5, 8, 16, 24];
const HATS = [
  { h: 12, H: 13, B: 13 },
  { h: 12, H: 13, B: 13 },
  { h: 14, H: 17, B: 17 },
  { h: 9, H: 8, B: 8 },
  { h: 17, H: 17, B: -1 },
  { h: 6, H: 6, B: -1 },
  { h: 13, H: 13, B: -1 },
];
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const DEFAULTS = {
  aggression: 100,
  lethal: 1,
  mischief: 100,
  births: 100,
  maxPop: MAX_POP,
  accidents: true,
  speed: 1,
  crops: 100,
  gore: true,
  showLog: true,
  showStats: true,
  startMen: 4,
  startWomen: 3,
};
const S = Object.assign({}, DEFAULTS),
  SETTINGS_KEY = "coconut-isle-settings";
try {
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
  if (s)
    for (const k in DEFAULTS)
      if (typeof s[k] === typeof DEFAULTS[k]) S[k] = s[k];
} catch (_) {}
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(S));
  } catch (_) {}
}
const angry = (p) => rnd() < (p * S.aggression) / 100;
const get = (i, j) => (i >= 0 && j >= 0 && i < N && j < N ? cells[i][j] : null);
const cellAt = (x, z) => get(Math.floor(x), Math.floor(z));
const currentDay = () => Math.floor(time / DAY) + 1;
const alive = (v) => !!v && villagers.includes(v);
const adults = (s) => villagers.filter((v) => !v.child && v.sex === s);

function newCell(i, j, h, bottom, deco) {
  return {
    i,
    j,
    h,
    type: "grass",
    bottom,
    bias: 0,
    bv: 0,
    acc: 0,
    farm: null,
    obj: null,
    deco,
    variant: Math.floor(deco * 997) % 4,
    edge: false,
    A: 0,
    B: 0,
    nA: null,
    nB: null,
    nbs: [],
    dots: [],
    decals: [],
    reserved: null,
  };
}

function genWorld(sd) {
  seed = sd;
  const R = mulberry32(sd);
  const hs = (i, j, s) => hash2(i, j, sd * 7 + s);
  cells = [];
  cellsFlat = new Array(N * N).fill(null);
  cellList = [];
  villagers = [];
  nuts = [];
  corpses = [];
  parts = [];
  pops = [];
  ghosts = [];
  houses = [];
  trees = [];
  rocks = [];
  logs = [];
  time = DAY * 0.06;
  food = 6;
  wood = 3;
  stone = 0;
  deaths = 0;
  births = 0;
  uid = 0;
  held = null;
  nameCount = {
    m: Math.floor(R() * MNAMES.length),
    f: Math.floor(R() * FNAMES.length),
    m0: 0,
    f0: 0,
  };
  nameCount.m0 = nameCount.m;
  nameCount.f0 = nameCount.f;
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28];
  const hills = [];
  const nh = 2 + Math.floor(R() * 2);
  for (let k = 0; k < nh; k++) {
    const a = R() * 6.28,
      d = 2.5 + R() * 4;
    hills.push({
      x: 9.5 + Math.cos(a) * d,
      z: 9.5 + Math.sin(a) * d,
      r: 1.8 + R() * 1.7,
      h: 1 + Math.floor(R() * 3),
    });
  }
  for (let i = 0; i < N; i++) {
    cells[i] = [];
    for (let j = 0; j < N; j++) {
      const dx = i + 0.5 - 9.5,
        dz = j + 0.5 - 9.5,
        d = Math.hypot(dx, dz),
        a = Math.atan2(dz, dx);
      const edge =
        8.2 +
        0.9 * Math.sin(a * 3 + ph[0]) +
        0.5 * Math.sin(a * 5 + ph[1]) +
        0.3 * Math.sin(a * 9 + ph[2]);
      if (d > edge) {
        cells[i][j] = null;
        continue;
      }
      let h = 2;
      for (const hl of hills) {
        const hd = Math.hypot(i + 0.5 - hl.x, j + 0.5 - hl.z);
        if (hd < hl.r)
          h = Math.max(
            h,
            2 + Math.round(hl.h * Math.min(1, (hl.r - hd) / 1.1 + 0.25)),
          );
      }
      const c = newCell(
        i,
        j,
        Math.min(h, 6),
        -(1.1 + (edge - d) * 0.55 + hs(i, j, 1) * 1.1),
        hs(i, j, 2),
      );
      cells[i][j] = c;
      cellsFlat[i * N + j] = c;
      cellList.push(c);
    }
  }
  const pondC = cellList.filter(
    (c) =>
      c.h === 2 &&
      Math.hypot(c.i - 9.5, c.j - 9.5) < 6 &&
      DIRS.every(([a, b]) => {
        const n = get(c.i + a, c.j + b);
        return n && n.h === 2;
      }),
  );
  if (pondC.length) {
    const p = pondC[Math.floor(R() * pondC.length)];
    const pr = 1.3 + R() * 0.6;
    for (const c of cellList)
      if (c.h === 2 && Math.hypot(c.i - p.i, c.j - p.j) <= pr) {
        c.type = "water";
        c.h = 1.5;
      }
    let best = null;
    for (const [a, b] of DIRS) {
      const run = [];
      let i = p.i,
        j = p.j,
        ok = true;
      for (let k = 0; k < N; k++) {
        i += a;
        j += b;
        const n = get(i, j);
        if (!n) break;
        if (n.h !== 2 && n.type !== "water") {
          ok = false;
          break;
        }
        run.push(n);
      }
      if (ok && run.length && (!best || run.length < best.length)) best = run;
    }
    if (best)
      for (const c of best) {
        c.type = "water";
        c.h = 1.5;
      }
  }
  for (const c of cellList) {
    c.nbs = DIRS.map(([a, b]) => get(c.i + a, c.j + b)).filter(Boolean);
    c.edge = c.nbs.length < 4;
  }
  for (const c of cellList)
    if (
      c.type === "grass" &&
      c.h === 2 &&
      c.nbs.some((n) => n.type === "water") &&
      R() < 0.8
    )
      c.type = "sand";
  for (const c of cellList)
    for (let k = 0; k < 7; k++) {
      const r = Math.floor(hs(c.i, c.j, 10 + k) * 8);
      const hw = r < 4 ? 2 * (r + 1) : 2 * (8 - r);
      c.dots.push({
        x: -hw + Math.floor(hs(c.i, c.j, 20 + k) * hw * 2),
        y: r,
        v: k < 4 ? 0 : k < 6 ? 1 : c.deco > 0.8 ? 2 : 1,
      });
    }
  const free = (c) => c && (c.type === "grass" || c.type === "sand") && !c.obj;
  const shuffled = cellList.slice().sort(() => R() - 0.5);
  let nt = 7 + Math.floor(R() * 3);
  for (const c of shuffled) {
    if (!nt) break;
    if (!free(c) || c.h > 3) continue;
    if (c.nbs.some((n) => n.obj)) continue;
    addTree(c, R);
    nt--;
  }

  let nr = 4 + Math.floor(R() * 2);
  for (const c of shuffled
    .slice()
    .sort((a, b) => b.h - a.h + (R() - 0.5) * 3)) {
    if (!nr) break;
    if (!free(c) || c.nbs.some((n) => n.obj)) continue;
    addRocks(c, 4 + Math.floor(R() * 4), R);
    nr--;
  }
  const flat = (c) => free(c) && c.type === "grass" && c.h === 2 && !c.edge;
  let plot = null;
  for (const c of shuffled) {
    const blk = [];
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 2; b++) blk.push(get(c.i + a, c.j + b));
    if (blk.every(flat)) {
      plot = blk;
      break;
    }
  }
  if (plot) {
    const st = ["ripe", "growing", "growing", "tilled", "mark", "ripe"];
    plot.forEach((c, k) => {
      c.type = "farm";
      c.farm = {
        s: st[k],
        g: st[k] === "ripe" ? 1 : 0.3 + R() * 0.4,
        wet: k === 1,
        wetT: 8,
        kind: ["radish", "wheat", "cabbage"][Math.floor(R() * 3)],
        claim: null,
      };
    });
  }
  const homeC = shuffled.find(
    (c) =>
      flat(c) &&
      (!plot ||
        plot.some((p) => Math.abs(p.i - c.i) + Math.abs(p.j - c.j) === 1)),
  );
  if (homeC) addHouse(homeC, 1);
  const siteC =
    shuffled.find(
      (c) =>
        free(c) &&
        c.type === "grass" &&
        c.h >= 3 &&
        c.nbs.some((n) => walkable(n) && Math.abs(n.h - c.h) <= 1),
    ) || shuffled.find(flat);
  if (siteC) addHouse(siteC, 0.3);
  const spots = shuffled.filter(
    (c) => walkable(c) && Math.hypot(c.i - 9.5, c.j - 9.5) < 6,
  );
  const sexes = [
    ...Array(S.startMen).fill("m"),
    ...Array(S.startWomen).fill("f"),
  ];
  for (let k = 0; k < sexes.length && spots.length; k++) {
    const c = spots[k % spots.length];
    villagers.push(
      makeV(c.i + 0.5 + (rnd() - 0.5) * 0.4, c.j + 0.5 + (rnd() - 0.5) * 0.4, {
        sex: sexes[k],
      }),
    );
  }
  updateRot();
  log("WELCOME TO TURTLE TOWN");
}
function addTree(c, R = rnd) {
  const t = {
    kind: "tree",
    cell: c,
    nuts: 1 + Math.floor(R() * 3),
    grow: 6 + R() * 10,
    phase: R() * 6,
    shake: 0,
    lean: R() < 0.5 ? -1 : 1,
    worker: null,
  };
  c.obj = t;
  trees.push(t);
  return t;
}
function addRocks(c, n, R = rnd) {
  const r = {
    kind: "rocks",
    cell: c,
    n,
    worker: null,
    tint: Array.from({ length: 7 }, () => Math.floor(R() * 3)),
  };
  c.obj = r;
  rocks.push(r);
  return r;
}
function addHouse(c, p) {
  const h = { kind: "house", cell: c, p, builders: [] };
  c.obj = h;
  houses.push(h);
  return h;
}
function updateRot() {
  for (const c of cellList) {
    rotP(c.i + 0.5, c.j + 0.5);
    c.A = Math.floor(RA);
    c.B = Math.floor(RB);
  }
  for (const c of cellList) {
    let w = unrot(c.A + 1.5, c.B + 0.5);
    c.nA = cellAt(w[0], w[1]);
    w = unrot(c.A + 0.5, c.B + 1.5);
    c.nB = cellAt(w[0], w[1]);
  }
}
function walkable(c) {
  return !!c && c.type !== "water" && !c.obj;
}

function wallH(h) {
  return 1.3 * clamp((h.p - 0.15) / 0.55, 0, 1);
}
function roofF(h) {
  return h.p > 0.7 ? clamp((h.p - 0.7) / 0.3, 0, 1) : 0;
}
function structTop(h) {
  return wallH(h) + roofF(h) * 0.6;
}
function groundAt(x, z) {
  const c = cellAt(x, z);
  if (!c) return -Infinity;
  let g = c.h + c.bias;
  if (c.obj && c.obj.kind === "house") g += structTop(c.obj);
  return g;
}
function standY(v, c) {
  let y = c.h + c.bias;
  if (c.obj && c.obj.kind === "house") y += structTop(c.obj);
  return y;
}

function nextName(sex) {
  const L = sex === "f" ? FNAMES : MNAMES;
  const k = nameCount[sex]++;
  const round = Math.floor((k - nameCount[sex + "0"]) / L.length);
  return L[k % L.length] + (round ? round + 1 : "");
}
function buildMap(v) {
  const r = new Int16Array(ROLES.length).fill(-1),
    set = (k, c) => {
      r[ROLES.indexOf(k)] = c;
    };
  set("skin", 19);
  set("eyes", 6);
  set("shirt", v.shirt[0]);
  set("shirtDark", v.shirt[1]);
  set("hair", v.hair);
  if (v.child) {
    set("accent", v.sex === "f" ? 27 : -1);
    set("pants", v.sex === "f" ? 19 : v.pants);
  } else if (v.sex === "f") {
    set("accent", 27);
    set("pants", 19);
  } else {
    set("hat", v.hat.h);
    set("hatDark", v.hat.H);
    set("brim", v.hat.B);
    set("pants", v.pants);
  }
  return r;
}
function makeV(x, z, o = {}) {
  const c = cellAt(x, z);
  const sex = o.sex || (rnd() < 0.5 ? "m" : "f");
  const child = !!o.child;
  const v = {
    kind: "v",
    id: ++uid,
    name: nextName(sex),
    sex,
    child,
    age: child ? 0 : ADULT_AGE,
    hp: MAX_HP,
    weapon: null,
    partner: null,
    crush: null,
    vendetta: null,
    foe: null,
    mother: o.mother || null,
    birthCd: 15 + rnd() * 25,
    swing: 0,
    grudge: null,
    vendLethal: false,
    lethal: false,
    kbx: 0,
    kbz: 0,
    kbT: 0,
    x,
    z,
    y: c ? c.h : 2,
    vx: 0,
    vy: 0,
    vz: 0,
    state: "idle",
    t: rnd() * 1.5,
    path: [],
    seg: null,
    job: null,
    face: rnd() < 0.5 ? 1 : -1,
    anim: rnd() * 5,
    shirt: pick(sex === "f" ? DRESSES : SHIRTS),
    pants: pick(PANTS),
    hat: pick(HATS),
    hair: pick(HAIRS),
    carry: null,
    throwCd: 6 + rnd() * 12,
    mischief: rnd(),
    peakY: 0,
    koAfter: false,
    cause: "",
    killer: null,
    jx: (rnd() - 0.5) * 0.3,
    jz: (rnd() - 0.5) * 0.3,
    target: null,
  };
  v.map = buildMap(v);
  return v;
}
function makeNut(x, y, z) {
  const n = {
    kind: "n",
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    state: "air",
    age: 0,
    ignore: null,
    claim: null,
    peakY: y,
  };
  nuts.push(n);
  return n;
}
function log(s) {
  logs.unshift({ s, t: time });
  if (logs.length > 4) logs.pop();
}
function pop(s, x, y, z, c) {
  pops.push({ s, x, y, z, t: 0, c });
}
function burst(x, y, z, n, cols, sp = 1.5, up = 2) {
  for (let k = 0; k < n; k++) {
    const a = rnd() * 6.28,
      s = sp * (0.3 + rnd());
    parts.push({
      x,
      y,
      z,
      vx: Math.cos(a) * s,
      vz: Math.sin(a) * s,
      vy: up * (0.5 + rnd()),
      life: 0.5 + rnd() * 0.5,
      c: cols[k % cols.length],
    });
  }
}
function hearts(v) {
  for (let k = 0; k < 2; k++)
    parts.push({
      x: v.x + (rnd() - 0.5) * 0.4,
      y: v.y + 1.8 + k * 0.5,
      z: v.z,
      vx: 0,
      vy: 0.7,
      vz: 0,
      life: 1.4,
      heart: true,
      float: true,
      c: 14,
    });
}

function gore(v, drops, gibs) {
  if (!S.gore) return;
  for (let k = 0; k < drops; k++) {
    const a = rnd() * 6.28,
      s = 0.4 + rnd() * 0.9;
    parts.push({
      x: v.x,
      y: v.y + 0.6,
      z: v.z,
      vx: Math.cos(a) * s,
      vz: Math.sin(a) * s,
      vy: 1 + rnd() * 1.5,
      life: 6,
      c: rnd() < 0.75 ? 14 : 17,
      stick: true,
      s: 1,
    });
  }
  for (let k = 0; k < gibs; k++) {
    const a = rnd() * 6.28,
      s = 0.6 + rnd() * 1.1;
    parts.push({
      x: v.x,
      y: v.y + 0.7,
      z: v.z,
      vx: Math.cos(a) * s,
      vz: Math.sin(a) * s,
      vy: 1.8 + rnd() * 1.5,
      life: 6,
      c: 14,
      c2: rnd() < 0.5 ? 17 : 19,
      stick: true,
      s: 2,
    });
  }
}


const K0 = 45,
  KN = 32,
  DAMP = 3.5;
function updateLattice(dt) {
  for (const c of cellList) {
    let f = -K0 * c.bias - DAMP * c.bv;
    for (const n of c.nbs) f += KN * (n.bias - c.bias);
    c.acc = f;
  }
  for (const c of cellList) {
    c.bv += c.acc * dt;
    c.bias += c.bv * dt;
    if (Math.abs(c.bias) < 1e-4 && Math.abs(c.bv) < 1e-3) {
      c.bias = 0;
      c.bv = 0;
    }
  }
}

function bfs(start) {
  const dist = new Int16Array(N * N).fill(-1),
    prev = new Int16Array(N * N).fill(-1);
  if (!start) return { dist, prev, start };
  const q = [start];
  dist[start.i * N + start.j] = 0;
  let qi = 0;
  while (qi < q.length) {
    const c = q[qi++];
    const dc = dist[c.i * N + c.j];
    for (const [a, b] of DIRS) {
      const n = get(c.i + a, c.j + b);
      if (!walkable(n)) continue;
      const k = n.i * N + n.j;
      if (dist[k] >= 0) continue;
      if (Math.abs(n.h - c.h) > 1.01) continue;
      dist[k] = dc + 1;
      prev[k] = c.i * N + c.j;
      q.push(n);
    }
  }
  return { dist, prev, start };
}
function reconstruct(res, c) {
  const out = [];
  let k = c.i * N + c.j;
  const sk = res.start.i * N + res.start.j;
  let guard = 0;
  while (k !== sk && k >= 0 && guard++ < 400) {
    out.push(cellsFlat[k]);
    k = res.prev[k];
  }
  return out.reverse();
}

function pathTo(res, t, blocked) {
  const k = t.i * N + t.j;
  if (!blocked && walkable(t))
    return res.dist[k] < 0 ? null : reconstruct(res, t);
  let best = null,
    bd = 1e9;
  for (const [a, b] of DIRS) {
    const n = get(t.i + a, t.j + b);
    if (!n) continue;
    const nk = n.i * N + n.j;
    if (res.dist[nk] >= 0 && res.dist[nk] < bd && Math.abs(n.h - t.h) <= 1) {
      bd = res.dist[nk];
      best = n;
    }
  }
  if (!best) return null;
  const p = reconstruct(res, best);
  p.push(t);
  return p;
}
function pathNextTo(res, t) {
  const p = pathTo(res, t, true);
  if (p) p.pop();
  return p;
}

// villa jah brain
function farmNeed(c) {
  const f = c.farm;
  if (!f || f.claim) return null;
  if (f.s === "mark") return "till";
  if (f.s === "tilled") return "plant";
  if (f.s === "growing" && !f.wet) return "water";
  if (f.s === "ripe") return "harvest";
  return null;
}
const WORK_T = {
  till: 2.2,
  plant: 1.6,
  water: 1.2,
  harvest: 1.4,
  chop: 3,
  mine: 3.5,
  craft: 2,
};
function dropJob(v) {
  const j = v.job;
  if (j) {
    if (j.type === "build") {
      const h = j.cell.obj;
      if (h && h.builders) {
        const k = h.builders.indexOf(v);
        if (k >= 0) h.builders.splice(k, 1);
      }
    } else if (j.type === "farm") {
      if (j.cell.farm && j.cell.farm.claim === v) j.cell.farm.claim = null;
    } else if (j.type === "nut") {
      if (j.nut.claim === v) j.nut.claim = null;
    } else if (j.type === "chop" || j.type === "mine") {
      if (j.res.worker === v) j.res.worker = null;
    }
    if (j.plan && j.plan.reserved === v) j.plan.reserved = null;
  }
  v.job = null;
  v.path = [];
  v.seg = null;
  v.target = null;
  if (v.carry) {
    const n = v.carry;
    n.state = "air";
    n.x = v.x;
    n.z = v.z;
    n.y = v.y + 1.6;
    n.vx = rnd() - 0.5;
    n.vz = rnd() - 0.5;
    n.vy = 1;
    n.ignore = v;
    n.age = 0;
    n.peakY = n.y;
    v.carry = null;
  }
}
function pickTarget(v) {
  const c = [];
  let tw = 0;
  for (const o of villagers) {
    if (
      o === v ||
      o.child ||
      o.state === "held" ||
      o.state === "air" ||
      o.state === "swim"
    )
      continue;
    const d = Math.hypot(o.x - v.x, o.z - v.z);
    if (d < 1.5 || d > 8) continue;
    const w = o.job && o.job.type === "build" && o.state === "work" ? 4 : 1;
    c.push([o, w]);
    tw += w;
  }
  let r = rnd() * tw;
  for (const [o, w] of c) {
    r -= w;
    if (r <= 0) return o;
  }
  return null;
}
function startWalk(v, job, path) {
  v.job = job;
  v.path = path;
  v.seg = null;
  v.state = "walk";
}
function startCraft(v, what) {
  if (what === "club") wood -= 1;
  else {
    wood -= 1;
    stone -= 2;
  }
  dropJob(v);
  v.job = { type: "craft", what, need: "build" };
  v.state = "work";
  v.t = WORK_T.craft;
}
function pair(a, b) {
  a.partner = b;
  b.partner = a;
  a.crush = b.crush = null;
  a.vendetta = b.vendetta = null;
  hearts(a);
  hearts(b);
  log(a.name + " AND " + b.name + " PAIRED UP");
}
function haveBaby(f) {
  const d = f.partner;
  const k = makeV(f.x + (rnd() - 0.5) * 0.3, f.z + (rnd() - 0.5) * 0.3, {
    child: true,
    mother: f,
  });
  villagers.push(k);
  births++;
  hearts(f);
  hearts(d);
  f.birthCd = 40 + rnd() * 30;
  burst(k.x, k.y + 0.5, k.z, 6, [0, 26], 1, 1.2);
  log(f.name + " AND " + d.name + " HAD A " + (k.sex === "f" ? "GIRL" : "BOY"));
}
function reach(res, o) {
  const c = cellAt(o.x, o.z);
  return c && (walkable(c) ? pathTo(res, c) : pathNextTo(res, c));
}
// rivals are always the same sex (the intricacies of human interaction :D )
function loveLogic(v, res) {
  const opp = v.sex === "m" ? "f" : "m";
  if (v.vendetta && (!alive(v.vendetta) || v.vendetta.child)) v.vendetta = null;
  if (v.crush && !alive(v.crush)) v.crush = null;
  if (v.grudge) {
    if (alive(v.grudge) && !v.grudge.child && !v.vendetta && angry(0.75)) {
      v.vendetta = v.grudge;
      v.vendLethal =
        adults(v.sex).length - adults(v.sex === "m" ? "f" : "m").length >= 2;
      pop("GRR", v.x, v.y + 1.8, v.z, 14);
    }
    v.grudge = null;
  }
  const mine = adults(v.sex).length,
    theirs = adults(opp).length,
    surplus = mine - theirs;
  // jealousy
  if (v.partner && alive(v.partner) && !v.vendetta) {
    const P = v.partner;
    const rival = villagers.find(
      (o) =>
        o !== v &&
        !o.child &&
        o.sex === v.sex &&
        Math.hypot(o.x - P.x, o.z - P.z) < 2.5,
    );
    if (rival && angry(0.45)) {
      v.vendetta = rival;
      v.vendLethal = surplus >= 2;
      pop("GRR", v.x, v.y + 1.8, v.z, 14);
      log(v.name + " IS JEALOUS OF " + rival.name);
    }
  }
  // cheating allegations
  if (v.partner && !v.vendetta && angry(0.05)) {
    const taken = adults(opp).filter((o) => o.partner && o.partner !== v);
    if (taken.length) {
      v.crush = pick(taken);
      v.vendetta = v.crush.partner;
      v.vendLethal = surplus > 0;
      log(v.name + " HAS EYES FOR " + v.crush.name);
    }
  }
  if (!v.partner && !v.vendetta) {
    const free = adults(opp).filter((o) => !o.partner);
    if (free.length && rnd() < 0.65) {
      let best = null,
        bd = 1e9;
      for (const o of free) {
        const d = Math.hypot(o.x - v.x, o.z - v.z);
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      const p = reach(res, best);
      if (p) {
        v.crush = best;
        startWalk(v, { type: "court", f: best }, p);
        return true;
      }
    }
    const aggro =
      surplus > 0
        ? Math.min(0.95, 0.55 + surplus * 0.15)
        : free.length
          ? 0.15
          : 0.4;
    if (angry(aggro)) {
      if (!v.crush || !v.crush.partner) {
        const taken = adults(opp).filter((o) => o.partner && o.partner !== v);
        if (taken.length) v.crush = pick(taken);
      }
      if (v.crush && v.crush.partner && v.crush.partner !== v) {
        v.vendetta = v.crush.partner;
        v.vendLethal = surplus > 0;
      } else if (!theirs) {
        const rivals = adults(v.sex).filter((o) => o !== v);
        if (rivals.length) {
          v.vendetta = pick(rivals);
          v.vendLethal = true;
        }
      }
    }
  }
  if (v.vendetta) {
    if (!v.weapon && wood >= 1 && rnd() < 0.5) {
      startCraft(v, "club");
      return true;
    }
    if (v.weapon === "club" && wood >= 1 && stone >= 2 && rnd() < 0.45) {
      startCraft(v, "sword");
      return true;
    }
    const p = reach(res, v.vendetta);
    if (p) {
      startWalk(v, { type: "hunt", foe: v.vendetta }, p);
      return true;
    }
  }
  // arms race for whichever sex outnumbers the other xdd
  if (surplus > 0 && angry(0.25)) {
    if (!v.weapon && wood >= 2) {
      startCraft(v, "club");
      return true;
    }
    if (v.weapon === "club" && wood >= 2 && stone >= 2) {
      startCraft(v, "sword");
      return true;
    }
  }
  return false;
}
function kidWander(v) {
  const here = cellAt(v.x, v.z);
  const res = bfs(here);
  const m = alive(v.mother) ? v.mother : null;
  const opts = [];
  for (const c of cellList) {
    const d = res.dist[c.i * N + c.j];
    if (d < 1 || d > 6) continue;
    if (c.edge) continue;
    if (m && Math.abs(c.i + 0.5 - m.x) + Math.abs(c.j + 0.5 - m.z) > 2.5)
      continue;
    opts.push(c);
  }
  if (!opts.length) {
    v.state = "idle";
    v.t = 1 + rnd();
    return;
  }
  const dest = pick(opts);
  startWalk(v, { type: "wander", cell: dest }, reconstruct(res, dest));
}
function decide(v) {
  if (v.child) {
    kidWander(v);
    return;
  }
  if (v.carry) {
    if (v.throwCd <= 0 && S.mischief > 0) {
      const t = pickTarget(v);
      if (t) {
        v.state = "windup";
        v.t = 0.7;
        v.target = t;
        return;
      }
    }
    if (rnd() < 0.3) {
      const n = v.carry;
      v.carry = null;
      nuts.splice(nuts.indexOf(n), 1);
      food += 1;
      pop("+1", v.x, v.y + 1.8, v.z, 11);
    }
  }
  const here = cellAt(v.x, v.z);
  const res = bfs(here);
  if (loveLogic(v, res)) return;
  if (
    v.sex === "f" &&
    v.partner &&
    alive(v.partner) &&
    v.birthCd <= 0 &&
    S.births > 0 &&
    villagers.length < S.maxPop &&
    houses.some((h) => h.p >= 1) &&
    Math.hypot(v.partner.x - v.x, v.partner.z - v.z) < 6 &&
    rnd() < 0.5
  ) {
    haveBaby(v);
    v.state = "idle";
    v.t = 1.5;
    return;
  }
  let best = null,
    bs = 1e9;
  const consider = (job, path, score) => {
    if (path && score < bs) {
      bs = score;
      best = { job, path };
    }
  };
  for (const h of houses)
    if (h.p < 1 && h.builders.length < 2) {
      const p = pathTo(res, h.cell);
      if (p)
        consider(
          { type: "build", cell: h.cell },
          p,
          p.length + h.builders.length * 3 - 3 + rnd() * 4,
        );
    }
  for (const c of cellList) {
    const need = farmNeed(c);
    if (!need) continue;
    const p = pathTo(res, c);
    if (p) consider({ type: "farm", cell: c, need }, p, p.length + rnd() * 4);
  }
  if (wood < 8)
    for (const t of trees) {
      if (t.worker) continue;
      const p = pathNextTo(res, t.cell);
      if (p)
        consider(
          { type: "chop", res: t, cell: t.cell, need: "chop" },
          p,
          p.length + 1 + rnd() * 5,
        );
    }
  if (stone < 6)
    for (const r of rocks) {
      if (r.worker) continue;
      const p = pathNextTo(res, r.cell);
      if (p)
        consider(
          { type: "mine", res: r, cell: r.cell, need: "mine" },
          p,
          p.length + 2 + rnd() * 5,
        );
    }
  if (!v.carry)
    for (const n of nuts) {
      if (n.state !== "rest" || n.claim) continue;
      const nc = cellAt(n.x, n.z);
      if (!nc || !walkable(nc)) continue;
      const p = pathTo(res, nc);
      if (p)
        consider(
          { type: "nut", cell: nc, nut: n },
          p,
          p.length * 0.9 +
            2 -
            (v.mischief > 0.45 ? 4 * v.mischief : 0) +
            rnd() * 3,
        );
    }
  if (!best || rnd() < 0.25) {
    const plan = planWork(v, res);
    if (plan) consider(plan.job, plan.path, -1);
  }
  if (best && (rnd() < 0.85 || best.job.plan)) {
    const j = best.job;
    if (j.plan) j.plan.reserved = v;
    else if (j.type === "build") j.cell.obj.builders.push(v);
    else if (j.type === "farm") j.cell.farm.claim = v;
    else if (j.type === "nut") j.nut.claim = v;
    else if (j.res) j.res.worker = v;
    startWalk(v, j, best.path);
    return;
  }
  const opts = [];
  for (const c of cellList) {
    const d = res.dist[c.i * N + c.j];
    if (d >= 2 && d <= 7) opts.push(c);
  }
  if (!opts.length) {
    v.state = "idle";
    v.t = 1 + rnd();
    return;
  }
  const dest = pick(opts);
  startWalk(v, { type: "wander", cell: dest }, reconstruct(res, dest));
}
function canSite(c) {
  return (
    walkable(c) &&
    c.type !== "farm" &&
    !c.edge &&
    !c.reserved &&
    !villagers.some((o) => o.state !== "air" && cellAt(o.x, o.z) === c) &&
    c.nbs.some((n) => walkable(n) && Math.abs(n.h - c.h) <= 1)
  );
}
function canSow(c) {
  return (
    walkable(c) &&
    (c.type === "grass" || c.type === "sand") &&
    !c.edge &&
    !c.reserved &&
    c.h <= 3
  );
}
function planWork(v, res) {
  const sites =
    houses.filter((h) => h.p < 1).length +
    cellList.filter((c) => c.reserved && c.reservedFor === "house").length;
  const fields =
    cellList.filter((c) => c.farm).length +
    cellList.filter((c) => c.reserved && c.reservedFor === "farm").length;
  const reach = (c) => {
    for (const n of c.nbs) {
      const d = res.dist[n.i * N + n.j];
      if (d >= 0 && d <= 12) return true;
    }
    return false;
  };
  const nearHome = (c) =>
    houses.some(
      (h) => Math.abs(h.cell.i - c.i) + Math.abs(h.cell.j - c.j) <= 4,
    );
  if (
    sites === 0 &&
    food >= 4 &&
    wood >= 3 &&
    houses.length < Math.ceil(villagers.length / 2) + 1 &&
    rnd() < 0.6
  ) {
    const opts = cellList.filter(
      (c) =>
        canSite(c) &&
        reach(c) &&
        !houses.some(
          (h) => Math.abs(h.cell.i - c.i) + Math.abs(h.cell.j - c.j) < 2,
        ),
    );
    if (opts.length) {
      opts.sort((a, b) => nearHome(b) - nearHome(a) || rnd() - 0.5);
      const c = opts[Math.floor(rnd() * Math.min(4, opts.length))];
      const path = pathNextTo(res, c);
      if (path) {
        c.reservedFor = "house";
        return { job: { type: "plan", what: "house", cell: c, plan: c }, path };
      }
    }
  }
  if (fields < Math.min(24, villagers.length + 4)) {
    const farms = cellList.filter((c) => c.farm);
    const opts = cellList.filter(
      (c) =>
        canSow(c) &&
        res.dist[c.i * N + c.j] >= 0 &&
        (!farms.length || c.nbs.some((n) => n.farm)),
    );
    if (opts.length) {
      const c = pick(opts);
      const path = pathTo(res, c);
      if (path) {
        c.reservedFor = "farm";
        return { job: { type: "plan", what: "farm", cell: c, plan: c }, path };
      }
    }
  }
  return null;
}
function standSpot(v, c) {
  if (c.obj && c.obj.kind === "house") {
    const k = Math.max(0, c.obj.builders.indexOf(v));
    const o = k ? 0.2 : -0.2;
    return [c.i + 0.5 + o, c.j + 0.5 + o * (k ? -1 : 1)];
  }
  return [c.i + 0.5 + v.jx, c.j + 0.5 + v.jz];
}
function faceToward(v, x0, z0, x1, z1) {
  rotP(x1, z1);
  const a = RA,
    b = RB;
  rotP(x0, z0);
  const s = a - RA - (b - RB);
  if (s > 0.01) v.face = 1;
  else if (s < -0.01) v.face = -1;
}
function stepWalk(v, dt) {
  const j = v.job;
  if (j && j.type === "hunt") {
    const f = j.foe;
    if (!alive(f)) {
      dropJob(v);
      v.state = "idle";
      v.t = 0.3;
      return;
    }
    if (
      Math.hypot(f.x - v.x, f.z - v.z) < 0.9 &&
      f.state !== "air" &&
      f.state !== "swim" &&
      f.state !== "held"
    ) {
      startFight(v, f);
      return;
    }
  }
  if (!v.seg) {
    if (!v.path.length) {
      arrive(v);
      return;
    }
    const n = v.path[0];
    const isJobSite = j && j.type === "build" && j.cell === n;
    if (n.type === "water" || (n.obj && !isJobSite)) {
      dropJob(v);
      v.state = "idle";
      v.t = 0.3;
      return;
    }
    v.path.shift();
    const [tx, tz] = standSpot(v, n);
    const ty = standY(v, n);
    const d = Math.hypot(tx - v.x, tz - v.z);
    const dh = ty - v.y;
    const speed = j && j.type === "hunt" ? 2.1 : v.child ? 1.3 : 1.6;
    v.seg = {
      x0: v.x,
      y0: v.y,
      z0: v.z,
      x1: tx,
      z1: tz,
      cell: n,
      t: 0,
      dur: Math.max(0.15, d / speed) + (Math.abs(dh) > 0.3 ? 0.15 : 0),
      arc: Math.abs(dh) > 0.05 ? 0.35 + Math.max(0, dh) * 0.35 : 0,
    };
  }
  const s = v.seg;
  s.t += dt;
  const u = Math.min(1, s.t / s.dur);
  faceToward(v, s.x0, s.z0, s.x1, s.z1);
  v.x = lerp(s.x0, s.x1, u);
  v.z = lerp(s.z0, s.z1, u);
  v.y = lerp(s.y0, standY(v, s.cell), u) + s.arc * Math.sin(Math.PI * u);
  if (u >= 1) v.seg = null;
}
function arrive(v) {
  const j = v.job;
  if (!j || j.type === "wander") {
    v.job = null;
    v.state = "idle";
    v.t = 0.8 + rnd() * 2;
    const c = cellAt(v.x, v.z);
    if (!v.child && S.accidents && c && c.edge && rnd() < 0.08) {
      const voids = DIRS.filter(([a, b]) => !get(c.i + a, c.j + b));
      const [a, b] = pick(voids);
      airborne(v, a * 1.7, 1.8, b * 1.7, "edge");
      pop("OOPS", v.x, v.y + 1.8, v.z, 12);
      log(v.name + " WANDERED OFF THE EDGE");
    }
    return;
  }
  if (j.type === "plan") {
    const c = j.cell;
    if (c.reserved === v) c.reserved = null;
    v.job = null;
    if (j.what === "farm" && canSow(c)) {
      c.type = "farm";
      c.farm = {
        s: "mark",
        g: 0,
        wet: false,
        wetT: 0,
        kind: "radish",
        claim: v,
      };
      v.job = { type: "farm", cell: c, need: "till" };
      v.state = "work";
      v.t = WORK_T.till;
      burst(c.i + 0.5, c.h, c.j + 0.5, 4, [18, 21], 1, 1);
      return;
    }
    if (j.what === "house" && food >= 4 && wood >= 3 && canSite(c)) {
      food -= 4;
      wood -= 3;
      const h = addHouse(c, 0);
      h.builders.push(v);
      v.job = { type: "build", cell: c };
      v.path = [c];
      v.seg = null;
      v.state = "walk";
      burst(c.i + 0.5, c.h, c.j + 0.5, 6, [18, 13], 1, 1.5);
      log(v.name + " STARTED A HOUSE");
      return;
    }
    v.state = "idle";
    v.t = 0.3;
    return;
  }
  if (j.type === "court") {
    const f = j.f;
    v.job = null;
    v.state = "idle";
    v.t = 0.3;
    if (!alive(f)) return;
    if (Math.hypot(f.x - v.x, f.z - v.z) > 2.2) return;
    if (!f.partner && !v.partner) pair(v, f);
    else if (f.partner && f.partner !== v && angry(1)) {
      v.crush = f;
      v.vendetta = f.partner;
      v.vendLethal = adults(v.sex).length > adults(f.sex).length;
      pop("GRR", v.x, v.y + 1.8, v.z, 14);
    }
    return;
  }
  if (j.type === "hunt") {
    const f = j.foe;
    v.job = null;
    if (alive(f) && Math.hypot(f.x - v.x, f.z - v.z) < 1.4) startFight(v, f);
    else {
      v.state = "idle";
      v.t = 0.1;
    }
    return;
  }
  if (j.type === "chop" || j.type === "mine") {
    const c = j.cell;
    if (c.obj !== j.res) {
      dropJob(v);
      v.state = "idle";
      v.t = 0.3;
      return;
    }
    faceToward(v, v.x, v.z, c.i + 0.5, c.j + 0.5);
    v.state = "work";
    v.t = WORK_T[j.need];
    return;
  }
  if (j.type === "farm") {
    if (!j.cell.farm) {
      dropJob(v);
      v.state = "idle";
      v.t = 0.3;
      return;
    }
    v.state = "work";
    v.t = WORK_T[j.need];
    return;
  }
  if (j.type === "build") {
    if (!j.cell.obj || j.cell.obj.p >= 1) {
      dropJob(v);
      v.state = "idle";
      v.t = 0.3;
      return;
    }
    v.state = "work";
    return;
  }
  if (j.type === "nut") {
    const n = j.nut;
    dropJob(v);
    if (
      n.state === "rest" &&
      nuts.includes(n) &&
      Math.hypot(n.x - v.x, n.z - v.z) < 1
    ) {
      n.state = "carried";
      v.carry = n;
      n.claim = null;
    }
    v.state = "idle";
    v.t = 0.4;
    return;
  }
  v.job = null;
  v.state = "idle";
  v.t = 0.3;
}
function airborne(v, vx, vy, vz, cause) {
  dropJob(v);
  v.state = "air";
  v.foe = null;
  v.vx = vx;
  v.vy = vy;
  v.vz = vz;
  v.peakY = v.y;
  if (cause) v.cause = cause;
  v.seg = null;
}
function slip(v) {
  const a = rnd() * 6.28;
  airborne(v, Math.cos(a) * 2.4, 2, Math.sin(a) * 2.4, "roof");
  pop("WHOA!", v.x, v.y + 1.8, v.z, 12);
  log(v.name + " SLIPPED OFF A ROOF");
}
function doWork(v, dt) {
  const j = v.job;
  if (j.type === "build") {
    const h = j.cell.obj;
    if (!h || h.p >= 1) {
      dropJob(v);
      v.state = "idle";
      v.t = 0.3;
      return;
    }
    h.p = Math.min(1, h.p + dt / 22);
    if (rnd() < dt * 3)
      burst(v.x + v.face * 0.2, v.y + 0.3, v.z, 1, [18, 13], 0.8, 1.5);
    if (S.accidents && h.p > 0.28 && rnd() < dt * 0.035) {
      slip(v);
      return;
    }
    if (h.p >= 1) completeHouse(h);
    return;
  }
  v.t -= dt;
  const need = j.need;
  if (rnd() < dt * 6) {
    const cols =
      need === "water"
        ? [10, 9]
        : need === "plant"
          ? [13, 21]
          : need === "harvest"
            ? [20, 21]
            : need === "chop"
              ? [18, 13]
              : need === "mine"
                ? [1, 2]
                : need === "build"
                  ? [18, 2]
                  : [18, 17];
    burst(
      v.x + v.face * 0.25,
      v.y + (need === "water" ? 0.8 : need === "chop" ? 0.7 : 0.1),
      v.z,
      1,
      cols,
      0.6,
      need === "water" ? 0 : 1.4,
    );
  }
  if (need === "chop" && j.res) j.res.shake = Math.max(j.res.shake, 0.35);
  if (v.t > 0) return;
  if (j.type === "craft") {
    v.weapon = j.what;
    pop(
      j.what === "sword" ? "SWORD" : "CLUB",
      v.x,
      v.y + 1.8,
      v.z,
      j.what === "sword" ? 0 : 18,
    );
    if (rnd() < 0.5) log(v.name + " MADE A " + j.what.toUpperCase());
  } else if (j.type === "chop") {
    wood += 1;
    pop("+WOOD", v.x, v.y + 1.8, v.z, 18);
    if (rnd() < 0.2) dropNut(j.res);
    j.res.worker = null;
  } else if (j.type === "mine") {
    const r = j.res;
    stone += 1;
    r.n -= 1;
    r.worker = null;
    pop("+ROCK", v.x, v.y + 1.8, v.z, 1);
    burst(r.cell.i + 0.5, r.cell.h + 0.5, r.cell.j + 0.5, 3, [1, 2, 3], 1, 1.5);
    if (r.n <= 0) {
      r.cell.obj = null;
      rocks.splice(rocks.indexOf(r), 1);
    }
  } else {
    const f = j.cell.farm;
    if (f) {
      if (need === "till") f.s = "tilled";
      else if (need === "plant") {
        f.s = "growing";
        f.g = 0;
        f.wet = false;
        f.kind = ["radish", "wheat", "cabbage"][Math.floor(rnd() * 3)];
      } else if (need === "water") {
        f.wet = true;
        f.wetT = 10;
      } else if (need === "harvest") {
        f.s = "tilled";
        f.g = 0;
        food += 2;
        pop("+2", v.x, v.y + 1.8, v.z, 11);
      }
    }
  }
  dropJob(v);
  v.state = "idle";
  v.t = 0.3 + rnd() * 0.5;
}
function completeHouse(h) {
  h.p = 1;
  const c = h.cell;
  const exits = c.nbs.filter((n) => walkable(n) && Math.abs(n.h - c.h) <= 1);
  for (const b of h.builders.slice()) {
    b.job = null;
    b.state = "walk";
    b.path = exits.length ? [pick(exits)] : [];
    b.seg = null;
  }
  h.builders.length = 0;
  burst(c.i + 0.5, c.h + 2, c.j + 0.5, 12, [0, 1, 12], 1.5, 2);
  log("A HOUSE WAS FINISHED");
}
function throwNut(v) {
  const t = v.target,
    n = v.carry;
  v.target = null;
  if (!n) {
    v.state = "idle";
    v.t = 0.3;
    return;
  }
  if (!t || !alive(t) || t.state === "held") {
    v.state = "idle";
    v.t = 0.5;
    return;
  }
  const sx = v.x,
    sy = v.y + 1.6,
    sz = v.z;
  const d = Math.hypot(t.x - sx, t.z - sz);
  const T = 0.4 + d * 0.09;
  const tx = t.x + (rnd() - 0.5) * 0.7,
    tz = t.z + (rnd() - 0.5) * 0.7,
    ty = t.y + 0.7;
  Object.assign(n, {
    state: "air",
    x: sx,
    y: sy,
    z: sz,
    vx: (tx - sx) / T,
    vz: (tz - sz) / T,
    vy: (ty - sy + 0.5 * G * T * T) / T,
    ignore: v,
    age: 0,
    peakY: sy,
  });
  v.carry = null;
  v.throwCd = 15 + rnd() * 15;
  faceToward(v, sx, sz, t.x, t.z);
  if (rnd() < 0.5) log(v.name + " THREW A COCONUT AT " + t.name);
  v.state = "idle";
  v.t = 0.6;
}
function hitV(v, n) {
  pop("BONK!", v.x, v.y + 1.9, v.z, 12);
  burst(v.x, v.y + 1.4, v.z, 4, [12, 0], 1.2, 1.5);
  if (v.state === "swim" || v.state === "held") return;
  if (rnd() < 0.3) gore(v, 1, 0);
  const wasHigh = v.job && v.job.type === "build" && v.state === "work";
  airborne(v, n.vx * 0.3, 1.6, n.vz * 0.3, wasHigh ? "roof" : "nut");
  v.koAfter = true;
  log("BONK! " + v.name + " GOT HIT BY A COCONUT");
}

function canFight(v) {
  return (
    v.state === "idle" ||
    v.state === "walk" ||
    v.state === "work" ||
    v.state === "windup"
  );
}
function startFight(a, b) {
  dropJob(a);
  a.state = "fight";
  a.foe = b;
  a.t = 0.25;
  a.lethal =
    a.vendetta === b && (S.lethal === 2 || (S.lethal === 1 && !!a.vendLethal));
  if (!b.child && canFight(b)) {
    dropJob(b);
    b.state = "fight";
    b.foe = a;
    b.t = 0.5;
    b.lethal = a.lethal;
  }
  if (rnd() < 0.5) pop("!", a.x, a.y + 1.9, a.z, 14);
}
function fightStep(v, dt) {
  const f = v.foe;
  v.swing = Math.max(0, v.swing - dt);
  if (
    !alive(f) ||
    f.state === "air" ||
    f.state === "swim" ||
    f.state === "held"
  ) {
    v.foe = null;
    v.state = "idle";
    v.t = 0.4;
    return;
  }
  const dx = f.x - v.x,
    dz = f.z - v.z,
    d = Math.hypot(dx, dz) || 0.001;
  faceToward(v, v.x, v.z, f.x, f.z);
  if (d > 3) {
    v.foe = null;
    v.state = "idle";
    v.t = 0.2;
    return;
  }
  if (d > 0.7) {
    const nx = v.x + (dx / d) * 1.4 * dt,
      nz = v.z + (dz / d) * 1.4 * dt;
    const c0 = cellAt(v.x, v.z),
      c1 = cellAt(nx, nz);
    if (c1 && (c1 === c0 || (walkable(c1) && Math.abs(c1.h - c0.h) <= 1))) {
      v.x = nx;
      v.z = nz;
      v.y = standY(v, c1);
    } else if (d > 1.4) {
      v.foe = null;
      v.state = "idle";
      v.t = 0.3;
      return;
    }
  }
  v.t -= dt;
  if (v.t <= 0) {
    v.t = 0.5 + rnd() * 0.3;
    v.swing = 0.22;
    if (d < 0.95 && rnd() < 0.7) strike(v, f);
  }
}
function strike(a, b) {
  const dmg = a.weapon === "sword" ? 3.5 : a.weapon === "club" ? 2 : 1;
  b.hp -= dmg;
  gore(b, a.weapon === "sword" ? 2 : 1, 0);
  if (rnd() < 0.4)
    pop(
      a.weapon === "sword" ? "SLASH" : a.weapon === "club" ? "WHACK" : "POW",
      b.x,
      b.y + 1.8,
      b.z,
      a.weapon === "sword" ? 0 : 12,
    );
  const dx = b.x - a.x,
    dz = b.z - a.z,
    l = Math.hypot(dx, dz) || 1,
    ux = dx / l,
    uz = dz / l;
  if (b.hp <= 0) {
    if (a.lethal) kill(b, a);
    else beat(b, a);
    return;
  }
  const kb = a.weapon === "sword" ? 2.6 : a.weapon === "club" ? 2.2 : 1.5;
  b.grudge = a;
  b.killer = a;
  const bc = cellAt(b.x, b.z);

  if (
    (bc && bc.obj && bc.obj.kind === "house") ||
    rnd() < (a.weapon ? 0.3 : 0.15)
  ) {
    airborne(b, ux * kb * 1.5, 2.8, uz * kb * 1.5, "fight");
    b.grudge = a;
    b.killer = a;
    pop("WHAM", b.x, b.y + 1.8, b.z, 12);
    burst(b.x, b.y + 0.2, b.z, 3, [18, 13], 1, 1);
    return;
  }
  b.kbx = ux * kb;
  b.kbz = uz * kb;
  b.kbT = 0.3;
  a.kbx = -ux * 0.5;
  a.kbz = -uz * 0.5;
  a.kbT = 0.12;
  if (!b.child && canFight(b)) {
    dropJob(b);
    b.state = "fight";
    b.foe = a;
    b.t = 0.45;
    b.lethal = a.lethal;
  }
}
function beat(b, a) {
  b.hp = 2;
  dropJob(b);
  b.foe = null;
  b.state = "ko";
  b.t = 5;
  b.grudge = a;
  gore(b, 1, 0);
  pop("BEATEN", b.x, b.y + 1.8, b.z, 14);
  log(a.name + " BEAT UP " + b.name);
  a.foe = null;
  a.vendetta = null;
  a.state = "idle";
  a.t = 0.8;
  const c = a.crush;
  if (c && alive(c) && c.partner === b) {
    b.partner = null;
    c.partner = null;
    if (a.partner) {
      const old = a.partner;
      old.partner = null;
      old.grudge = c;
      log(a.name + " LEFT " + old.name + " FOR " + c.name);
    } else log(a.name + " STOLE " + c.name + " FROM " + b.name);
    pair(a, c);
    b.crush = c;
  }
}
function kill(b, a) {
  b.cause = "killed";
  b.killer = a;
  const w = a.weapon;
  die(b, 5, 2);
  log(a.name + " KILLED " + b.name + (w ? " WITH A " + w.toUpperCase() : ""));
  a.foe = null;
  a.vendetta = null;
  a.state = "idle";
  a.t = 0.8;
  if (a.crush && alive(a.crush) && !a.crush.partner && a.partner !== a.crush) {
    if (a.partner) {
      const old = a.partner;
      old.partner = null;
      old.grudge = a.crush;
      log(a.name + " LEFT " + old.name + " FOR " + a.crush.name);
    }
    pair(a, a.crush);
  }
}


function landV(v) {
  const c = cellAt(v.x, v.z);
  const fall = v.peakY - v.y;
  if (!c) return;
  c.bv -= Math.min(5, 0.6 + fall * 1.2);
  if (c.type === "water") {
    burst(v.x, v.y, v.z, 10, [10, 0, 11], 1.5, 3);
    pop("SPLASH", v.x, v.y + 1.2, v.z, 10);
    v.state = "swim";
    v.t = 0;
    v.koAfter = false;
    v.vx = v.vz = v.vy = 0;
    return;
  }
  if (c.obj) {
    let dx = v.x - (c.i + 0.5),
      dz = v.z - (c.j + 0.5);
    const l = Math.hypot(dx, dz) || 1;
    if (l < 0.05) {
      const a = rnd() * 6.28;
      dx = Math.cos(a);
      dz = Math.sin(a);
    } else {
      dx /= l;
      dz /= l;
    }
    v.vx = dx * 2.4;
    v.vz = dz * 2.4;
    v.vy = 1.6;
    v.y += 0.02;
    v.peakY = Math.max(v.y, v.peakY - 1.2);
    return;
  }
  burst(v.x, v.y, v.z, 4, [18, 13], 1, 1.2);
  if (fall >= 3.2 && !v.child) {
    die(v, 3, 1);
    return;
  }
  if (fall >= 1.6 || v.koAfter) {
    v.state = "ko";
    v.t = 3 + Math.min(4, fall);
    v.koAfter = false;
    pop("OUCH", v.x, v.y + 1.4, v.z, 14);
    if (!v.child && fall >= 1.6) gore(v, 1, 0);
    if (!logs[0] || !logs[0].s.includes(v.name))
      log(v.name + " IS KNOCKED OUT");
    return;
  }
  v.state = "idle";
  v.t = 0.4;
  v.vx = v.vz = 0;
}
function forget(v) {
  for (const o of villagers) {
    if (o.partner === v) {
      o.partner = null;
      if (!o.child) pop("...", o.x, o.y + 1.8, o.z, 1);
    }
    if (o.crush === v) o.crush = null;
    if (o.grudge === v) o.grudge = null;
    if (o.vendetta === v) o.vendetta = null;
    if (o.mother === v) o.mother = null;
    if (o.foe === v) {
      o.foe = null;
      if (o.state === "fight") {
        o.state = "idle";
        o.t = 0.6;
      }
    }
    if (o.job && (o.job.foe === v || o.job.f === v)) {
      dropJob(o);
      if (o.state === "walk") {
        o.state = "idle";
        o.t = 0.3;
      }
    }
  }
}
function die(v, drops, gibs) {
  const i = villagers.indexOf(v);
  if (i >= 0) villagers.splice(i, 1);
  dropJob(v);
  forget(v);
  deaths++;
  const c = cellAt(v.x, v.z);
  if (c && c.type !== "water") {
    gore(v, drops, gibs);
    corpses.push({
      kind: "c",
      x: v.x,
      y: v.y,
      z: v.z,
      vx: 0,
      vy: 0,
      vz: 0,
      state: "rest",
      body: v.child ? "child" : v.sex === "f" ? "woman" : "man",
      map: (() => {
        const m = v.map.slice();
        m[ROLES.indexOf("eyes")] = 3;
        return m;
      })(),
      flip: v.face < 0,
      peakY: v.y,
      name: v.name,
    });
    if (corpses.length > 90) corpses.shift();
    ghosts.push({ x: v.x, y: v.y, z: v.z, t: 0 });
  }
  if (v.cause !== "killed") {
    const msg =
      {
        roof: "RIP " + v.name + ". WORKPLACE ACCIDENT",
        you: "RIP " + v.name + ". YOU DID THAT",
        nut: "RIP " + v.name + ". COCONUT RELATED",
        fight: v.killer
          ? v.killer.name + " KNOCKED " + v.name + " TO THEIR DEATH"
          : "RIP " + v.name + ". LOST A FIGHT",
      }[v.cause] || "RIP " + v.name + ". FELL TOO FAR";
    log(c ? msg : v.name + " FELL OFF THE WORLD");
  }
}
function updateCorpse(o, dt) {
  if (o.state === "air") {
    if (airStep(o, dt)) {
      const c = cellAt(o.x, o.z);
      if (c.type === "water") {
        burst(o.x, o.y, o.z, 8, [10, 0], 1.2, 2.5);
        corpses.splice(corpses.indexOf(o), 1);
        return;
      }
      if (c.obj) {
        let dx = o.x - (c.i + 0.5),
          dz = o.z - (c.j + 0.5);
        const l = Math.hypot(dx, dz);
        if (l < 0.05) {
          dx = 1;
          dz = 0;
        } else {
          dx /= l;
          dz /= l;
        }
        o.vx = dx * 1.8;
        o.vz = dz * 1.8;
        o.vy = 1.4;
        o.y += 0.02;
        return;
      }
      c.bv -= 1.5;
      o.state = "rest";
      o.vx = o.vy = o.vz = 0;
      if (o.peakY - o.y > 2) gore(o, 1, 0);
    }
    if (o.y < -16) corpses.splice(corpses.indexOf(o), 1);
  } else if (o.state === "rest") {
    const c = cellAt(o.x, o.z);
    if (!c) {
      o.state = "air";
      return;
    }
    o.y = c.h + c.bias;
    launchCheck(o, c);
  }
}
function swimStep(v, dt) {
  let best = null,
    bd = 1e9;
  for (const c of cellList) {
    if (!walkable(c) || c.h > 2.6) continue;
    const d = Math.hypot(c.i + 0.5 - v.x, c.j + 0.5 - v.z);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  const wc = cellAt(v.x, v.z);
  v.y = (wc ? wc.h + wc.bias : 1.5) - 0.55 + Math.sin(time * 5 + v.id) * 0.04;
  if (!best) return;
  if (bd < 0.95) {
    v.state = "walk";
    v.job = null;
    v.path = [best];
    v.seg = null;
    return;
  }
  const dx = (best.i + 0.5 - v.x) / bd,
    dz = (best.j + 0.5 - v.z) / bd;
  faceToward(v, v.x, v.z, best.i + 0.5, best.j + 0.5);
  v.x += dx * dt * 0.9;
  v.z += dz * dt * 0.9;
  if (rnd() < dt * 4)
    parts.push({
      x: v.x,
      y: v.y + 0.5,
      z: v.z,
      vx: 0,
      vy: 0.2,
      vz: 0,
      life: 0.4,
      c: 0,
    });
}

// physics
function airStep(o, dt) {
  o.vy -= G * dt;
  let nx = o.x + o.vx * dt;
  if (groundAt(nx, o.z) > o.y + 0.25) {
    o.vx *= -0.35;
    nx = o.x;
  }
  let nz = o.z + o.vz * dt;
  if (groundAt(nx, nz) > o.y + 0.25) {
    o.vz *= -0.35;
    nz = o.z;
  }
  o.x = nx;
  o.z = nz;
  o.y += o.vy * dt;
  if (o.y > o.peakY) o.peakY = o.y;
  const g = groundAt(o.x, o.z);
  if (o.y <= g && o.vy <= 0) {
    o.y = g;
    return true;
  }
  return false;
}
function launchCheck(o, c) {
  if (c && c.bv > 2.6 && c.bias > 0.04) {
    if (o.kind === "v") {
      const s = o.child ? 0 : 0.8;
      airborne(
        o,
        (rnd() - 0.5) * s,
        c.bv * (o.child ? 0.6 : 1.1) + 1,
        (rnd() - 0.5) * s,
        "you",
      );
    } else {
      o.state = "air";
      o.vy = c.bv * 1.2 + 1;
      o.peakY = o.y;
    }
    return true;
  }
  return false;
}
function knockStep(v, c0, dt) {
  v.kbT -= dt;
  const nx = v.x + v.kbx * dt,
    nz = v.z + v.kbz * dt;
  v.kbx *= 1 - 6 * dt;
  v.kbz *= 1 - 6 * dt;
  const c1 = cellAt(nx, nz);
  if (!c1 || c1.type === "water" || c1.h < c0.h - 0.9) {
    v.x = nx;
    v.z = nz;
    airborne(v, v.kbx * 1.5, 1.2, v.kbz * 1.5, "fight");
    return true;
  }
  if (c1 === c0 || (walkable(c1) && c1.h <= c0.h + 0.5)) {
    v.x = nx;
    v.z = nz;
    v.y = standY(v, c1);
  } else {
    v.kbx = v.kbz = 0;
    v.kbT = 0;
  }
  v.y += Math.sin((Math.PI * Math.max(0, v.kbT)) / 0.3) * 0.18;
  return false;
}
function updateV(v, dt) {
  v.anim += dt;
  v.throwCd -= (dt * S.mischief) / 100;
  v.birthCd -= (dt * S.births) / 100;
  if (v.child) {
    v.age += dt;
    if (v.age >= ADULT_AGE) {
      v.child = false;
      v.hp = MAX_HP;
      v.shirt = pick(v.sex === "f" ? DRESSES : SHIRTS);
      v.map = buildMap(v);
      log(v.name + " GREW UP");
    }
  }
  if (v.state !== "fight") v.lethal = false;
  if (v.hp < MAX_HP && v.state !== "fight")
    v.hp = Math.min(MAX_HP, v.hp + dt * 0.12);
  const grounded =
    v.state === "idle" ||
    v.state === "work" ||
    v.state === "windup" ||
    v.state === "ko" ||
    v.state === "fight";
  if (grounded) {
    const c = cellAt(v.x, v.z);
    if (!c) {
      airborne(v, 0, 0, 0, v.cause);
      return;
    }
    v.y = standY(v, c);
    if (launchCheck(v, c)) return;
    if (v.kbT > 0 && knockStep(v, c, dt)) return;
  }
  switch (v.state) {
    case "idle":
      v.t -= dt;
      if (v.t <= 0) decide(v);
      break;
    case "walk":
      stepWalk(v, dt);
      break;
    case "work":
      doWork(v, dt);
      break;
    case "fight":
      fightStep(v, dt);
      break;
    case "windup":
      v.t -= dt;
      if (v.target) faceToward(v, v.x, v.z, v.target.x, v.target.z);
      if (v.t <= 0) throwNut(v);
      break;
    case "ko":
      v.t -= dt;
      if (v.t <= 0) {
        v.state = "idle";
        v.t = 0.5;
        v.cause = "";
      }
      break;
    case "swim":
      swimStep(v, dt);
      break;
    case "air":
      if (airStep(v, dt)) landV(v);
      else if (v.y < -16) {
        const i = villagers.indexOf(v);
        if (i >= 0) villagers.splice(i, 1);
        forget(v);
        deaths++;
        log(v.name + " FELL OFF THE WORLD");
      }
      break;
  }
  if (v.carry) {
    const n = v.carry;
    n.x = v.x;
    n.z = v.z;
    n.y = v.y + (v.state === "swim" ? 0.9 : 1.75);
  }
}
function updateNut(n, dt) {
  n.age += dt;
  if (n.state === "air") {
    const landed = airStep(n, dt);
    const sp = Math.hypot(n.vx, n.vy, n.vz);
    if (sp > 2.2)
      for (const v of villagers) {
        if (v.child || (v === n.ignore && n.age < 0.5) || v.state === "held")
          continue;
        const top = v.state === "ko" || v.state === "swim" ? 0.5 : 1.6;
        if (
          Math.hypot(v.x - n.x, v.z - n.z) < 0.38 &&
          n.y >= v.y - 0.1 &&
          n.y <= v.y + top
        ) {
          hitV(v, n);
          n.ignore = v;
          n.age = 0;
          n.vx *= -0.3;
          n.vz *= -0.3;
          n.vy = Math.abs(n.vy) * 0.3 + 1;
          break;
        }
      }
    if (landed) {
      const c = cellAt(n.x, n.z);
      if (c.type === "water") {
        burst(n.x, n.y, n.z, 6, [10, 0], 1, 2);
        nuts.splice(nuts.indexOf(n), 1);
        return;
      }
      if (c.obj) {
        let dx = n.x - (c.i + 0.5),
          dz = n.z - (c.j + 0.5);
        const l = Math.hypot(dx, dz);
        if (l < 0.05) {
          dx = 1;
          dz = 0;
        } else {
          dx /= l;
          dz /= l;
        }
        n.vx = dx * 1.8;
        n.vz = dz * 1.8;
        n.vy = 1.5;
        n.y += 0.02;
        return;
      }
      c.bv -= Math.min(4, -n.vy * 0.3);
      if (n.vy < -3) {
        n.vy = -n.vy * 0.35;
        n.vx *= 0.6;
        n.vz *= 0.6;
        burst(n.x, n.y, n.z, 3, [18, 13], 0.8, 1);
      } else {
        n.state = "rest";
        n.vx = n.vy = n.vz = 0;
        n.ignore = null;
      }
    }
    if (n.y < -16) nuts.splice(nuts.indexOf(n), 1);
  } else if (n.state === "rest") {
    const c = cellAt(n.x, n.z);
    if (!c) {
      n.state = "air";
      return;
    }
    n.y = c.h + c.bias;
    launchCheck(n, c);
  } else if (n.state === "carried") {
    if (!villagers.some((v) => v.carry === n)) {
      n.state = "air";
      n.peakY = n.y;
    }
  }
}
function stickDecal(p) {
  const c = cellAt(p.x, p.z);
  if (!c || c.type === "water" || c.obj) return;
  c.decals.push({ x: p.x - c.i, z: p.z - c.j, c: p.c, c2: p.c2, s: p.s });
  if (c.decals.length > 40) c.decals.shift();
}
function updateWorld(dt) {
  time += dt;
  updateLattice(dt);
  for (const t of trees) {
    t.shake = Math.max(0, t.shake - dt * 2);
    if (t.nuts < 3) {
      t.grow -= dt;
      if (t.grow <= 0) {
        t.nuts++;
        t.grow = 10 + rnd() * 10;
      }
    }
    if (t.nuts > 0) {
      const c = t.cell;
      const under = villagers.some(
        (v) =>
          v.state !== "air" &&
          Math.hypot(v.x - c.i - 0.5, v.z - c.j - 0.5) < 1.3,
      );
      if (rnd() < dt * (under ? 0.05 : 0.02)) dropNut(t);
    }
  }
  for (const c of cellList) {
    const f = c.farm;
    if (f && f.s === "growing" && f.wet) {
      f.g += ((dt / 18) * S.crops) / 100;
      f.wetT -= dt;
      if (f.wetT <= 0) f.wet = false;
      if (f.g >= 1) {
        f.s = "ripe";
        f.g = 1;
      }
    }
  }
  for (const v of villagers.slice()) if (villagers.includes(v)) updateV(v, dt);
  for (const n of nuts.slice()) updateNut(n, dt);
  for (const o of corpses.slice()) if (o !== held) updateCorpse(o, dt);
  const resting = nuts.filter((n) => n.state === "rest" && !n.claim);
  if (resting.length > 16) nuts.splice(nuts.indexOf(resting[0]), 1);
  for (const p of parts) {
    p.life -= dt;
    if (p.float) {
      p.y += p.vy * dt;
      continue;
    }
    p.vy -= G * 0.6 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    const g = groundAt(p.x, p.z);
    if (p.y < g && p.vy < 0) {
      if (p.stick) {
        stickDecal(p);
        p.life = 0;
      } else {
        p.y = g;
        p.vx *= 0.5;
        p.vz *= 0.5;
        p.vy = 0;
      }
    }
  }
  parts = parts.filter((p) => p.life > 0 && p.y > -16);
  for (const p of pops) p.t += dt;
  pops = pops.filter((p) => p.t < 1.3);
  for (const gh of ghosts) {
    gh.t += dt;
    gh.y += dt * 0.9;
  }
  ghosts = ghosts.filter((g) => g.t < 3.2);
  for (const c of cellList)
    if (c.type === "water" && c.edge && rnd() < dt * 3) {
      const voids = DIRS.filter(([a, b]) => !get(c.i + a, c.j + b));
      if (voids.length) {
        const [a, b] = voids[0];
        parts.push({
          x: c.i + 0.5 + a * 0.55 + (rnd() - 0.5) * 0.8 * Math.abs(b),
          y: c.bottom - 2,
          z: c.j + 0.5 + b * 0.55 + (rnd() - 0.5) * 0.8 * Math.abs(a),
          vx: a * 0.3,
          vy: -1,
          vz: b * 0.3,
          life: 1.2,
          c: rnd() < 0.5 ? 0 : 10,
        });
      }
    }
}
function dropNut(t) {
  if (t.nuts <= 0) return;
  t.nuts--;
  const c = t.cell;
  const a = rnd() * 6.28,
    r = 0.35 + rnd() * 0.3;
  makeNut(c.i + 0.5 + Math.cos(a) * r, c.h + 2.5, c.j + 0.5 + Math.sin(a) * r);
}

function colTop(m) {
  return 8 - (m >> 1);
}

function drawFaceSeg(c, L, bx, by, lo, hi, top) {
  const side = L ? "L" : "R";
  if (c.type === "water") {
    const tex = TILES.waterfall[side],
      tt = Math.floor(time * 30),
      wh = TILES.wfH;
    for (let d = 0; d < 8; d++) {
      const dx = L ? -d - 1 : d;
      const off = colTop(d);
      const y0 = by + off - Math.round(hi * BH),
        y1 = by + off - Math.round((lo - 3) * BH);
      for (let y = y0; y < y1; y++) {
        if (y1 - y < 8 && (y + dx) & 1) continue;
        const cc = tex.data[((((y - tt) % wh) + wh) % wh) * tex.w + d];
        if (cc >= 0) px(bx + dx, y, cc);
      }
    }
    return;
  }
  const kind =
    c.type === "farm"
      ? "farm"
      : c.type === "sand"
        ? "sand"
        : c.h >= 4
          ? "high"
          : "grass";
  const edge = TILES.faces[kind + "Edge"][side],
    topPx = Math.round(top * BH),
    edgeFrom = topPx - TILES.edgePx;
  const p0 = Math.round(hi * BH),
    p1 = Math.round(lo * BH),
    fh = TILES.faceH,
    bands = TILES.bands;
  for (let d = 0; d < 8; d++) {
    const dx = L ? -d - 1 : d,
      base = by + colTop(d);
    for (let hp = p1 + 1; hp <= p0; hp++) {
      let tex = null,
        row;
      if (hp > edgeFrom) {
        tex = edge;
        row = Math.min(fh - 1, topPx - hp);
      } else {
        for (const b of bands)
          if (hp >= b.fromPx) {
            tex = TILES.faces[b.face][side];
            break;
          }
        row = ((hp % fh) + fh) % fh;
      }
      if (!tex) continue;
      const cc = tex.data[row * tex.w + d];
      if (cc >= 0) px(bx + dx, base - hp, cc);
    }
  }
}
function drawFace(c, n, L, bx, by, top) {
  const bot = c.bottom;
  if (!n) {
    drawFaceSeg(c, L, bx, by, bot, top, top);
    return;
  }
  const nt = n.h + n.bias;
  if (top > nt + 0.001) drawFaceSeg(c, L, bx, by, Math.max(bot, nt), top, top);
  if (bot < n.bottom - 0.001)
    drawFaceSeg(c, L, bx, by, bot, Math.min(top, n.bottom), top);
}
function drawCell(c) {
  const bx = OX + (c.A - c.B) * 8,
    by = OY + (c.A + c.B) * 4,
    top = c.h + c.bias;
  drawFace(c, c.nB, true, bx, by, top);
  drawFace(c, c.nA, false, bx, by, top);
  const ty = by - Math.round(top * BH);
  const f = c.farm,
    T = TILES.tops;
  if (c.type === "water") {
    blitSpr(T.water[Math.floor(time * 5) % T.water.length], bx, ty, false);
    for (let r = 0; r < 8; r++) {
      const hw = r < 4 ? 2 * (r + 1) : 2 * (8 - r);
      for (let x = -hw; x < hw; x++)
        if (hash2(c.i * 16 + x, c.j * 8 + r, Math.floor(time * 2)) > 0.985)
          px(bx + x, ty + r, 0);
    }
    return;
  }
  let tile;
  if (c.type === "sand") tile = T.sand[c.variant % T.sand.length];
  else if (f && f.s !== "mark")
    tile = (f.wet ? T.farmWet : T.farmDry)[c.variant % T.farmDry.length];
  else if (c.h >= 4) tile = T.high[c.variant % T.high.length];
  else if (c.deco > 0.8)
    tile = T.grassFlower[c.deco > 0.9 ? 1 % T.grassFlower.length : 0];
  else tile = T.grass[c.variant % T.grass.length];
  blitSpr(tile, bx, ty, false);
  if (f && f.s === "mark") blitSpr(T.farmMark[0], bx, ty, false);
  for (const d of c.decals) {
    proj(c.i + d.x, top, c.j + d.z);
    px(PX, PY, d.c);
    if (d.s === 2) px(PX + 1, PY, d.c2);
  }
  if (f && (f.s === "growing" || f.s === "ripe")) {
    const P = [
      [0.3, 0.3],
      [0.7, 0.3],
      [0.3, 0.7],
      [0.7, 0.7],
    ]
      .map(([a, b]) => {
        proj(c.i + a, top, c.j + b);
        return [PX, PY, RA + RB];
      })
      .sort((p, q) => p[2] - q[2]);
    for (const [x, y] of P) drawCrop(x, y, f);
  }
}
function drawCrop(x, y, f) {
  const n =
    f.s === "ripe"
      ? f.kind === "wheat"
        ? "cropWheat"
        : f.kind === "cabbage"
          ? "cropCabbage"
          : "cropRadish"
      : f.g < 0.34
        ? "cropSprout"
        : f.g < 0.67
          ? "cropYoung"
          : "cropGrown";
  blitSpr(SPR[n], x, y, false);
}
function drawTree(t) {
  const c = t.cell;
  proj(c.i + 0.5, c.h + c.bias, c.j + 0.5);
  const bx = PX,
    by = PY;
  const sway =
    Math.sin(time * 1.3 + t.phase) * 0.8 + Math.sin(time * 30) * t.shake * 2.5;
  dither(bx + t.lean * 3, by + 1, 5, 1, 6);
  const TH = PALM.trunkHeight,
    tr = SPR.palmTrunk;
  for (let k = 0; k < TH; k++) {
    const off = Math.round(
      t.lean * Math.sin((k / TH) * 1.4) * 2.4 + (sway * k) / TH,
    );
    const row = k % tr.h;
    for (let i = 0; i < tr.w; i++) {
      const cc = tr.data[(tr.h - 1 - row) * tr.w + i];
      if (cc >= 0) px(bx + off + i - tr.ax, by - 1 - k, cc);
    }
  }
  const tx = bx + Math.round(t.lean * Math.sin(1.4) * 2.4 + sway),
    ty = by - 1 - TH;
  blitSpr(SPR.palmBack, tx, ty, false);
  for (let k = 0; k < t.nuts && k < PALM.nutSlots.length; k++)
    blitSpr(
      SPR.palmNut,
      tx + PALM.nutSlots[k][0],
      ty + PALM.nutSlots[k][1],
      false,
    );
  blitSpr(SPR.palmFront, tx, ty, false);
}

const ROCKPOS = [
  [0.28, 0.3, 0],
  [0.72, 0.28, 0],
  [0.3, 0.72, 0],
  [0.72, 0.7, 0],
  [0.42, 0.4, 0.55],
  [0.6, 0.58, 0.55],
  [0.5, 0.5, 1.05],
];
function drawRocks(r) {
  const c = r.cell,
    g = c.h + c.bias;
  proj(c.i + 0.5, g, c.j + 0.5);
  dither(PX, PY + 1, 6, 1, 6);
  const list = [];
  for (let k = 0; k < Math.min(r.n, ROCKPOS.length); k++) {
    const [a, b, y] = ROCKPOS[k];
    proj(c.i + a, g + y, c.j + b);
    list.push([y, RA + RB, PX, PY, r.tint[k]]);
  }
  list.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  for (const [, , x, y, t] of list)
    blitSpr(SPR["boulder" + t] || SPR.boulder0, x, y, false);
}
function drawHouse(h) {
  const c = h.cell,
    g0 = c.h + c.bias,
    wh = wallH(h),
    rf = roofF(h);
  const a0 = c.A + 0.15,
    a1 = c.A + 0.85,
    b0 = c.B + 0.15,
    b1 = c.B + 0.85,
    ma = c.A + 0.5,
    mb = c.B + 0.5,
    ov = 0.08;
  const P = (a, b, y) => [OX + (a - b) * 8, OY + (a + b) * 4 - y * BH];
  const pole = (a, b) => {
    const p = P(a, b, g0),
      q = P(a, b, g0 + 1.8);
    vl(
      Math.round(p[0]),
      Math.round(q[1]),
      Math.round(p[1] - q[1]),
      MAT.scaffold,
    );
  };
  if (h.p < 1) {
    pole(a0 - 0.05, b0 - 0.05);
    pole(a1 + 0.05, b0 - 0.05);
    pole(a0 - 0.05, b1 + 0.05);
  }
  if (h.p < 0.15) {
    fillPoly(
      [
        P(a0, b0, g0 + 0.05),
        P(a1, b0, g0 + 0.05),
        P(a1, b1, g0 + 0.05),
        P(a0, b1, g0 + 0.05),
      ],
      MAT.floor,
    );
  }
  const yT = g0 + wh;
  if (wh > 0) {
    fillPoly(
      [P(a0, b1, g0), P(a1, b1, g0), P(a1, b1, yT), P(a0, b1, yT)],
      MAT.wallLit,
    );
    fillPoly(
      [P(a1, b0, g0), P(a1, b1, g0), P(a1, b1, yT), P(a1, b0, yT)],
      MAT.wallShade,
    );
    if (wh > 0.8) {
      fillPoly(
        [
          P(ma - 0.12, b1, g0),
          P(ma + 0.12, b1, g0),
          P(ma + 0.12, b1, g0 + 0.72),
          P(ma - 0.12, b1, g0 + 0.72),
        ],
        MAT.door,
      );
      const night = SH !== ID && h.p >= 1;
      const prev = SH;
      if (night) SH = ID;
      fillPoly(
        [
          P(a1, mb - 0.14, g0 + 0.45),
          P(a1, mb + 0.14, g0 + 0.45),
          P(a1, mb + 0.14, g0 + 0.85),
          P(a1, mb - 0.14, g0 + 0.85),
        ],
        night ? MAT.windowLit : MAT.window,
      );
      SH = prev;
    }
    if (rf === 0)
      fillPoly(
        [P(a0, b0, yT), P(a1, b0, yT), P(a1, b1, yT), P(a0, b1, yT)],
        MAT.floor,
      );
  }
  if (rf > 0) {
    const yP = yT + 0.8 * rf;
    if (rot % 2 === 0) {
      fillPoly(
        [
          P(a0 - ov, b0 - ov, yT),
          P(a1 + ov, b0 - ov, yT),
          P(a1 + ov, mb, yP),
          P(a0 - ov, mb, yP),
        ],
        MAT.roofShade,
      );
      fillPoly([P(a1, b0, yT), P(a1, b1, yT), P(a1, mb, yP)], MAT.wallShade);
      fillPoly(
        [
          P(a0 - ov, mb, yP),
          P(a1 + ov, mb, yP),
          P(a1 + ov, b1 + ov, yT),
          P(a0 - ov, b1 + ov, yT),
        ],
        MAT.roofLit,
      );
      const r0 = P(a0 - ov, mb, yP),
        r1 = P(a1 + ov, mb, yP);
      line(r0[0], r0[1], r1[0], r1[1], MAT.ridge);
    } else {
      fillPoly(
        [
          P(a0 - ov, b0 - ov, yT),
          P(ma, b0 - ov, yP),
          P(ma, b1 + ov, yP),
          P(a0 - ov, b1 + ov, yT),
        ],
        MAT.roofShade,
      );
      fillPoly([P(a0, b1, yT), P(a1, b1, yT), P(ma, b1, yP)], MAT.wallLit);
      fillPoly(
        [
          P(ma, b0 - ov, yP),
          P(a1 + ov, b0 - ov, yT),
          P(a1 + ov, b1 + ov, yT),
          P(ma, b1 + ov, yP),
        ],
        MAT.roofLit,
      );
      const r0 = P(ma, b0 - ov, yP),
        r1 = P(ma, b1 + ov, yP);
      line(r0[0], r0[1], r1[0], r1[1], MAT.ridge);
    }
  }
  if (h.p < 1) {
    pole(a1 + 0.05, b1 + 0.05);
    const p = P(a0 - 0.05, b1 + 0.05, g0 + 1),
      q = P(a1 + 0.05, b1 + 0.05, g0 + 1),
      r = P(a1 + 0.05, b0 - 0.05, g0 + 1);
    line(p[0], p[1], q[0], q[1], MAT.scaffold);
    line(q[0], q[1], r[0], r[1], MAT.scaffold);
  }
}
const TOOL = {
  build: "toolHammer",
  water: "toolCan",
  till: "toolHoe",
  harvest: "toolBasket",
  chop: "toolAxe",
  mine: "toolPick",
  plant: "toolSeeds",
};
function drawVillager(v) {
  proj(v.x, v.y, v.z);
  const fx = PX,
    fy = PY,
    roles = v.map,
    flip = v.face < 0;
  const set = CHAR[v.child ? "child" : v.sex === "f" ? "woman" : "man"];
  const st = v.state;
  if (st === "ko") {
    blitSpr(set.ko, fx, fy, flip, roles);
    for (let k = 0; k < 3; k++) {
      const a = time * 5 + k * 2.09;
      const sx = fx + Math.round(Math.cos(a) * 5),
        sy = fy - 9 + Math.round(Math.sin(a) * 1.5);
      px(sx, sy, 12);
      if (k === 0) {
        px(sx - 1, sy, 12);
        px(sx + 1, sy, 12);
        px(sx, sy - 1, 12);
        px(sx, sy + 1, 12);
      }
    }
    return;
  }
  if (st === "swim") {
    blitSpr(set.stand, fx, fy, flip, roles, set.swimRows);
    const ph = Math.floor(time * 4) & 1;
    px(fx - 5 + ph, fy, 0);
    px(fx + 4 - ph, fy, 0);
    px(fx - 4, fy + 1, 11);
    px(fx + 3, fy + 1, 11);
    return;
  }
  let frame = set.stand,
    bob = 0;
  if (st === "air" || st === "held") frame = set.flail;
  else if (st === "fight") frame = v.swing > 0 ? set.work : set.stand;
  else if (v.carry || st === "windup")
    frame = st === "walk" && Math.floor(v.anim * 7) & 1 ? set.workw : set.work;
  else if (st === "work") {
    frame = Math.floor(v.anim * 4) & 1 ? set.work : set.stand;
  } else if (st === "walk") {
    const w = Math.floor(v.anim * (v.child ? 9 : 7)) & 1;
    frame = w ? set.walk : set.stand;
    bob = w ? 0 : -1;
  }
  blitSpr(frame, fx, fy + bob, flip, roles);
  const up = frame === set.work || frame === set.workw;
  const hxp = fx + (flip ? -4 : 3);
  if (v.weapon && st !== "work" && !v.carry && st !== "windup")
    blitSpr(SPR[v.weapon + (up ? "Raised" : "")], hxp, fy - (up ? 8 : 5), flip);
  if (st === "work" && v.job) {
    const spr = SPR[TOOL[v.job.need || "build"]];
    if (spr) blitSpr(spr, hxp, fy - (up ? 11 : 6), flip);
  }
}
function drawNut(n) {
  proj(n.x, n.y, n.z);
  blitSpr(SPR.coconut, PX, PY, false);
}
function drawCorpse(o) {
  proj(o.x, o.y, o.z);
  blitSpr(CHAR[o.body].ko, PX, PY, o.flip, o.map);
}
function shadowAt(x, z, big) {
  const c = cellAt(x, z);
  if (!c || c.obj || c.type === "water") return;
  proj(x, c.h + c.bias, z);
  dither(PX, PY, big ? 3 : 1, big ? 1 : 0, 6);
}
const SKY = { day: [9, 10], dusk: [15, 27], night: [7, 8], dawn: [15, 26] };
const STARS = Array.from({ length: 50 }, (_, k) => [
  Math.floor(hash2(k, 1, 9) * W),
  Math.floor(hash2(k, 2, 9) * H),
]);
const CLOUDS = Array.from({ length: 8 }, (_, k) => ({
  x: hash2(k, 3, 5) * W,
  y: k < 5 ? 10 + hash2(k, 4, 5) * 60 : 170 + hash2(k, 4, 5) * 36,
  w: 14 + Math.floor(hash2(k, 5, 5) * 22),
  s: 1.5 + hash2(k, 6, 5) * 3,
}));
function phaseOf(f) {
  if (f < 0.55) return ["day", 0];
  if (f < 0.62) return ["dusk", 1];
  if (f < 0.9) return ["night", 2];
  if (f < 0.97) return ["dawn", 1];
  return ["day", 0];
}
function drawSky() {
  const f = (time / DAY) % 1,
    [ph, sh] = phaseOf(f);
  SH = ID;
  const b = SKY[ph];
  const mid = H >> 1;
  for (let y = 0; y < H; y++) {
    if (y >= mid - 3 && y < mid + 3) {
      for (let x = 0; x < W; x++) px(x, y, (x + y) & 1 ? b[0] : b[1]);
    } else hl(0, y, W, y < mid ? b[0] : b[1]);
  }
  if (ph === "night")
    for (let k = 0; k < STARS.length; k++)
      if ((k + Math.floor(time * 2)) % 9)
        px(STARS[k][0], STARS[k][1], k % 3 ? 1 : 0);
  const isDay = f < 0.58 || f > 0.95;
  const u = isDay ? ((f + 0.05) % 1) / 0.63 : (f - 0.58) / 0.37;
  const sx = Math.round(20 + u * (W - 40)),
    sy = Math.round(60 - Math.sin(u * Math.PI) * 44);
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++)
      if (dx * dx + dy * dy <= 10)
        px(
          sx + dx,
          sy + dy,
          isDay
            ? dx * dx + dy * dy <= 3
              ? 0
              : 12
            : dx > 1 && dy < 1
              ? b[0]
              : 1,
        );
  SH = SHADES[sh];
  for (const cl of CLOUDS) {
    const x = Math.round(((cl.x + time * cl.s) % (W + 60)) - 40),
      y = Math.round(cl.y);
    hl(x, y, cl.w, 0);
    hl(x + 2, y + 1, cl.w - 3, 0);
    hl(x + 3, y + 2, cl.w - 6, 1);
    hl(x + 4, y - 1, cl.w - 10, 0);
    hl(x + 7, y - 2, Math.max(2, cl.w - 16), 0);
  }
}
const items = [];
function render() {
  drawSky();
  const [, sh] = phaseOf((time / DAY) % 1);
  SH = SHADES[sh];
  items.length = 0;
  for (const c of cellList) {
    items.push({ k: c.A + c.B + 1, t: 0, o: c });
    if (c.obj)
      items.push({
        k: c.A + c.B + 1.45,
        t: c.obj.kind === "tree" ? 1 : c.obj.kind === "rocks" ? 9 : 2,
        o: c.obj,
      });
  }
  for (const v of villagers) {
    if (v === held) continue;
    items.push({ k: objKey(v.x, v.z), t: 3, o: v });
    if (v.state === "air") {
      const c = cellAt(v.x, v.z);
      if (c) items.push({ k: c.A + c.B + 1.02, t: 6, o: v });
    }
  }
  for (const n of nuts) {
    if (n === held) continue;
    const carrier =
      n.state === "carried" ? villagers.find((v) => v.carry === n) : null;
    items.push({
      k: carrier ? objKey(carrier.x, carrier.z) + 0.001 : objKey(n.x, n.z),
      t: 4,
      o: n,
    });
    if (n.state === "air") {
      const c = cellAt(n.x, n.z);
      if (c) items.push({ k: c.A + c.B + 1.02, t: 7, o: n });
    }
  }
  for (const o of corpses) {
    if (o === held) continue;
    items.push({ k: objKey(o.x, o.z) - 0.05, t: 5, o });
  }
  for (const p of parts) items.push({ k: objKey(p.x, p.z) + 0.01, t: 8, o: p });
  items.sort((a, b) => a.k - b.k);
  for (const it of items) {
    const o = it.o;
    switch (it.t) {
      case 0:
        drawCell(o);
        break;
      case 1:
        drawTree(o);
        break;
      case 2:
        drawHouse(o);
        break;
      case 3:
        drawVillager(o);
        break;
      case 4:
        drawNut(o);
        break;
      case 5:
        drawCorpse(o);
        break;
      case 6:
        shadowAt(o.x, o.z, true);
        break;
      case 7:
        shadowAt(o.x, o.z, false);
        break;
      case 8:
        proj(o.x, o.y, o.z);
        if (o.heart) blitSpr(SPR.heart, PX, PY, false);
        else {
          px(PX, PY, o.c);
          if (o.s === 2) px(PX + 1, PY, o.c2);
        }
        break;
      case 9:
        drawRocks(o);
        break;
    }
  }
  if (held) {
    const c = cellAt(held.x, held.z);
    if (c && !c.obj) {
      proj(held.x, c.h + c.bias, held.z);
      dither(PX, PY, 3, 1, 6);
    }
    if (held.kind === "v") drawVillager(held);
    else if (held.kind === "c") drawCorpse(held);
    else drawNut(held);
  }
  for (const g of ghosts) {
    proj(g.x, g.y, g.z);
    const fade = g.t > 2 ? Math.floor((g.t - 2) * 4) : 0;
    if (fade > 3) continue;
    const gs = SPR.ghost,
      x0 = PX + Math.round(Math.sin(g.t * 3) * 2);
    for (let j = 0; j < gs.h; j++)
      for (let i = 0; i < gs.w; i++) {
        const cc = gs.data[j * gs.w + i];
        if (cc < 0) continue;
        if (fade && (i + j + fade) % (5 - fade) === 0) continue;
        px(x0 + i - gs.ax, PY - gs.ay + j, cc);
      }
  }
  drawHover();
  SH = ID;
  for (const p of pops) {
    proj(p.x, p.y, p.z);
    const s = p.s;
    text(s, PX - (textW(s) >> 1), PY - 6 - Math.round(p.t * 12), p.c, 1, 6);
  }
  drawHUD();
  if (UI.open) drawSettings();
  ctx.putImageData(img, 0, 0);
}
function drawHover() {
  if (!mouse.in || held) return;
  if (UI.open) {
    const h = uiHit(mouse.x, mouse.y);
    cv.style.cursor = UI.drag || (h && (h.r || h.b)) ? "pointer" : "";
    return;
  }
  cv.style.cursor = gearHot(mouse.x, mouse.y)
    ? "pointer"
    : pickObject(mouse.x, mouse.y)
      ? "grab"
      : "pointer";
}
function drawHUD() {
  SH = ID;
  let x = 4;
  const seg = (lab, val, c) => {
    text(lab, x, 4, 1, 1, 6);
    x += textW(lab) + 4;
    const s = String(val);
    text(s, x, 4, c, 1, 6);
    x += textW(s) + 8;
  };
  let m = 0,
    f = 0,
    k = 0;
  for (const v of villagers) {
    if (v.child) k++;
    else if (v.sex === "m") m++;
    else f++;
  }
  if (S.showStats) {
    seg("MEN", m, m > f ? 14 : 0);
    seg("WOMEN", f, 0);
    seg("KIDS", k, 26);
    seg("FOOD", food, 12);
    seg("WOOD", wood, 18);
    seg("ROCK", stone, 1);
    seg("RIP", deaths, 14);
    const ds2 =
      "DAY " + currentDay() + (S.speed !== 1 ? "  " + S.speed + "X" : "");
    text(ds2, W - 4 - textW(ds2), H - 9, 1, 1, 6);
  }
  if (S.showLog)
    logs.forEach((l, i) => {
      text(l.s, 4, H - 9 - i * 7, [0, 1, 2, 3][i], 1, 6);
    });
  if (paused && !UI.open) {
    const s = "PAUSED";
    text(s, (W - textW(s, 2)) >> 1, 90, 12, 2, 6);
  }
  if (!UI.open) drawGear(gearHot(mouse.x, mouse.y) && mouse.in);
}

// ui and settings thingamajig
const UI = { open: false, sel: -1, drag: null };
const UIW = 236,
  UIX = (W - UIW) >> 1,
  UIY = 8,
  TRK = UIX + 104,
  TRW = 84,
  VALX = UIX + UIW - 8;
const pct = (v) => v + "%";
const ROWS = [
  { h: "VILLAGERS" },
  {
    k: "aggression",
    label: "AGGRESSION",
    min: 0,
    max: 200,
    step: 10,
    c: 14,
    fmt: (v) => (v ? pct(v) : "PEACE"),
  },
  {
    k: "lethal",
    label: "LETHAL FIGHTS",
    opts: ["NEVER", "AUTO", "ALWAYS"],
    c: 14,
  },
  {
    k: "mischief",
    label: "COCONUT THROWING",
    min: 0,
    max: 200,
    step: 10,
    c: 13,
    fmt: (v) => (v ? pct(v) : "OFF"),
  },
  {
    k: "births",
    label: "BIRTH RATE",
    min: 0,
    max: 300,
    step: 25,
    c: 27,
    fmt: (v) => (v ? pct(v) : "OFF"),
  },
  { k: "maxPop", label: "MAX POPULATION", min: 5, max: 80, step: 5, c: 10 },
  { k: "accidents", label: "ACCIDENTS", toggle: true },
  { h: "WORLD" },
  {
    k: "speed",
    label: "SIM SPEED",
    vals: [0.25, 0.5, 1, 1.5, 2, 3, 4],
    c: 9,
    fmt: (v) => v + "X",
  },
  {
    k: "crops",
    label: "CROP GROWTH",
    min: 25,
    max: 300,
    step: 25,
    c: 21,
    fmt: pct,
  },
  { k: "gore", label: "BLOOD", toggle: true },
  { h: "DISPLAY" },
  { k: "showLog", label: "EVENT LOG", toggle: true },
  { k: "showStats", label: "STATS AND DAY", toggle: true },
  { h: "NEW ISLAND" },
  { k: "startMen", label: "STARTING MEN", min: 0, max: 12, step: 1, c: 1 },
  { k: "startWomen", label: "STARTING WOMEN", min: 0, max: 12, step: 1, c: 26 },
];
let uy = UIY + 17;
for (const r of ROWS) {
  r.y = uy + (r.h ? 2 : 0);
  uy += r.h ? 11 : 9;
}
const BTNY = uy + 3,
  UIH = BTNY + 15 - UIY;
const BTNS = [
  {
    label: "NEW ISLAND",
    act: () => {
      genWorld((Math.random() * 1e9) | 0);
      closeSettings();
    },
  },
  {
    label: "DEFAULTS",
    act: () => {
      Object.assign(S, DEFAULTS);
      saveSettings();
    },
  },
  { label: "DONE", act: () => closeSettings() },
];
function btnRects() {
  let x = UIX + 8;
  return BTNS.map((b, i) => {
    const w = textW(b.label) + 10;
    const bx = i === BTNS.length - 1 ? UIX + UIW - 8 - w : x;
    x += w + 4;
    return [bx, BTNY, w, 11, b];
  });
}
const nPos = (r) =>
  r.vals ? r.vals.length : Math.round((r.max - r.min) / r.step) + 1;
const posOf = (r) =>
  r.vals
    ? Math.max(0, r.vals.indexOf(S[r.k]))
    : Math.round((S[r.k] - r.min) / r.step);
function setPos(r, i) {
  i = clamp(i, 0, nPos(r) - 1);
  S[r.k] = r.vals ? r.vals[i] : r.min + i * r.step;
  saveSettings();
}
function segs(r) {
  let x = TRK;
  return r.opts.map((o) => {
    const w = textW(o) + 5,
      s = [x, w];
    x += w + 2;
    return s;
  });
}
function adjust(r, d) {
  if (r.toggle) S[r.k] = !S[r.k];
  else if (r.opts) S[r.k] = clamp(S[r.k] + d, 0, r.opts.length - 1);
  else {
    setPos(r, posOf(r) + d);
    return;
  }
  saveSettings();
}
function openSettings() {
  if (held) release();
  UI.open = true;
  UI.sel = -1;
  UI.drag = null;
}
function closeSettings() {
  UI.open = false;
  UI.drag = null;
}
const inR = (mx, my, x, y, w, h) =>
  mx >= x && mx < x + w && my >= y && my < y + h;
function uiHit(mx, my) {
  for (const [x, y, w, h, b] of btnRects())
    if (inR(mx, my, x, y, w, h)) return { b };
  for (const r of ROWS)
    if (!r.h && inR(mx, my, UIX + 3, r.y - 2, UIW - 6, 9)) return { r };
  return inR(mx, my, UIX, UIY, UIW, UIH) ? {} : null;
}
function uiDown(mx, my) {
  const h = uiHit(mx, my);
  if (!h) {
    closeSettings();
    return;
  }
  if (h.b) {
    h.b.act();
    return;
  }
  const r = h.r;
  if (!r) return;
  UI.sel = ROWS.indexOf(r);
  if (r.toggle) adjust(r, 1);
  else if (r.opts) {
    const k = segs(r).findIndex(([x, w]) => mx >= x - 1 && mx < x + w + 1);
    S[r.k] = k >= 0 ? k : (S[r.k] + 1) % r.opts.length;
    saveSettings();
  } else if (mx >= TRK - 6) {
    UI.drag = r;
    uiDrag(mx);
  }
}
function uiDrag(mx) {
  const r = UI.drag;
  if (r)
    setPos(r, Math.round(clamp((mx - TRK) / (TRW - 1), 0, 1) * (nPos(r) - 1)));
}
function uiKey(k) {
  if (k === "escape" || k === "s" || k === "enter") {
    closeSettings();
    return;
  }
  const rows = ROWS.filter((r) => !r.h);
  let i = rows.indexOf(ROWS[UI.sel]);
  if (k === "arrowdown" || k === "arrowup") {
    i =
      i < 0 ? 0 : (i + (k === "arrowdown" ? 1 : rows.length - 1)) % rows.length;
    UI.sel = ROWS.indexOf(rows[i]);
  } else if (i >= 0 && (k === "arrowleft" || k === "arrowright"))
    adjust(rows[i], k === "arrowright" ? 1 : -1);
  else if (i >= 0 && k === " " && rows[i].toggle) adjust(rows[i], 1);
}

// crafty ain't it, it's like coding in pico 8
const GEAR = [
  "....#....",
  ".#.###.#.",
  "..#####..",
  ".###.###.",
  "###...###",
  ".###.###.",
  "..#####..",
  ".#.###.#.",
  "....#....",
];
const GX = W - 13,
  GY = 3;
const gearHot = (mx, my) => inR(mx, my, GX - 2, GY - 2, 13, 13);
function drawGear(hot) {
  GEAR.forEach((row, j) => {
    for (let i = 0; i < row.length; i++)
      if (row[i] === "#") {
        px(GX + i + 1, GY + j + 1, 6);
      }
  });
  GEAR.forEach((row, j) => {
    for (let i = 0; i < row.length; i++)
      if (row[i] === "#") px(GX + i, GY + j, hot ? 12 : 1);
  });
}
function drawSettings() {
  SH = ID;
  for (let y = 0; y < H; y++)
    for (let x = y & 1; x < W; x += 2) buf[y * W + x] = PAL32[6];
  rect(UIX, UIY, UIW, UIH, 6);
  hl(UIX, UIY, UIW, 3);
  hl(UIX, UIY + UIH - 1, UIW, 3);
  vl(UIX, UIY, UIH, 3);
  vl(UIX + UIW - 1, UIY, UIH, 3);
  text("SETTINGS", UIX + 8, UIY + 6, 12);
  const hint = "ESC TO CLOSE";
  text(hint, VALX - textW(hint), UIY + 6, 3);
  const hov = mouse.in && !UI.drag ? uiHit(mouse.x, mouse.y) : null;
  for (const r of ROWS) {
    const y = r.y;
    if (r.h) {
      text(r.h, UIX + 8, y, 2);
      const x0 = UIX + 12 + textW(r.h);
      hl(x0, y + 2, VALX - x0, 4);
      continue;
    }
    const on = (hov && hov.r === r) || UI.drag === r || ROWS[UI.sel] === r;
    if (on) rect(UIX + 3, y - 2, UIW - 6, 9, 7);
    text(r.label, UIX + 8, y, on ? 0 : 1);
    const v = S[r.k];
    if (r.toggle) {
      rect(TRK, y - 1, 7, 7, 4);
      rect(TRK + 1, y, 5, 5, 6);
      if (v) rect(TRK + 2, y + 1, 3, 3, 21);
      const s = v ? "ON" : "OFF";
      text(s, VALX - textW(s), y, v ? 21 : 3);
    } else if (r.opts) {
      segs(r).forEach(([x, w], i) => {
        const sel = i === v;
        rect(x, y - 1, w, 7, sel ? r.c : 4);
        text(r.opts[i], x + 3, y, sel ? 0 : 2);
      });
    } else {
      const t = posOf(r) / (nPos(r) - 1),
        kx = TRK + Math.round(t * (TRW - 1));
      rect(TRK, y + 1, TRW, 3, 4);
      rect(TRK, y + 1, kx - TRK, 3, r.c || 12);
      if (r.vals ? r.vals.includes(DEFAULTS[r.k]) : true) {
        const dx =
          TRK +
          Math.round(
            ((r.vals
              ? r.vals.indexOf(DEFAULTS[r.k])
              : (DEFAULTS[r.k] - r.min) / r.step) /
              (nPos(r) - 1)) *
              (TRW - 1),
          );
        px(dx, y + 5, 3);
      }
      rect(kx - 1, y - 1, 3, 7, on ? 0 : 1);
      const s = r.fmt ? r.fmt(v) : String(v);
      text(s, VALX - textW(s), y, 0);
    }
  }
  for (const [x, y, w, h, b] of btnRects()) {
    const on = hov && hov.b === b;
    rect(x, y, w, h, on ? 12 : 4);
    text(b.label, x + 5, y + 3, on ? 6 : 0);
  }
}

const mouse = { x: 0, y: 0, in: false };
function pickCell(mx, my) {
  let best = null,
    bk = -1e9;
  for (const c of cellList) {
    const bx = OX + (c.A - c.B) * 8,
      ty = OY + (c.A + c.B) * 4 - Math.round((c.h + c.bias) * BH);
    const dx = Math.floor(mx) - bx;
    if (dx < -8 || dx > 7) continue;
    const m = dx < 0 ? -dx - 1 : dx;
    const ry = Math.floor(my) - ty;
    const colH = Math.round((c.h - c.bottom) * BH);
    if (ry >= m >> 1 && ry < colTop(m) + colH) {
      const k = c.A + c.B;
      if (k > bk) {
        bk = k;
        best = c;
      }
    }
  }
  return best;
}
function pickObject(mx, my) {
  let best = null,
    bk = -1e9;
  const test = (o, x0, y0, x1, y1) => {
    if (mx >= x0 - 2 && mx <= x1 + 2 && my >= y0 - 2 && my <= y1 + 2) {
      const k = objKey(o.x, o.z);
      if (k > bk) {
        bk = k;
        best = o;
      }
    }
  };
  for (const v of villagers) {
    if (v.child) continue;
    proj(v.x, v.y, v.z);
    if (v.state === "ko") test(v, PX - 6, PY - 7, PX + 6, PY);
    else test(v, PX - 4, PY - 11, PX + 4, PY + 1);
  }
  for (const n of nuts) {
    if (n.state === "carried") continue;
    proj(n.x, n.y, n.z);
    test(n, PX - 2, PY - 4, PX + 2, PY);
  }
  for (const o of corpses) {
    proj(o.x, o.y, o.z);
    test(o, PX - 5, PY - 6, PX + 5, PY);
  }
  return best;
}
function evPos(e) {
  const r = cv.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * W;
  mouse.y = ((e.clientY - r.top) / r.height) * H;
}
cv.addEventListener("pointermove", (e) => {
  evPos(e);
  mouse.in = true;
  if (UI.drag) uiDrag(mouse.x);
});
cv.addEventListener("pointerleave", () => {
  if (!held) mouse.in = false;
});
cv.addEventListener("contextmenu", (e) => e.preventDefault());
cv.addEventListener("pointerdown", (e) => {
  evPos(e);
  mouse.in = true;
  try {
    cv.setPointerCapture(e.pointerId);
  } catch (_) {}
  const mx = mouse.x,
    my = mouse.y;
  if (UI.open) {
    uiDown(mx, my);
    return;
  }
  if (gearHot(mx, my)) {
    openSettings();
    return;
  }
  const o = pickObject(mx, my);
  if (o) {
    if (o.kind === "v") {
      dropJob(o);
      o.foe = null;
      o.cause = "you";
      o.koAfter = false;
    } else if (o.kind === "n") {
      const cv2 = villagers.find((v) => v.carry === o);
      if (cv2) cv2.carry = null;
      if (o.claim) {
        const w = o.claim;
        if (w.job && w.job.nut === o) dropJob(w);
      }
    }
    o.state = "held";
    held = o;
    heldHist = [];
    cv.style.cursor = "grabbing";
    updateHeld();
    return;
  }
  const c = pickCell(mx, my);
  if (!c) return;
  if (c.obj && c.obj.kind === "tree") {
    const t = c.obj;
    t.shake = 1;
    const k = t.nuts;
    for (let i = 0; i < k; i++) dropNut(t);
    if (!k) pop("NO NUTS", c.i + 0.5, c.h + 2.6, c.j + 0.5, 1);
    return;
  }
  c.bv -= 9;
  burst(c.i + 0.5, c.h + c.bias, c.j + 0.5, 5, [18, 13, 21], 1.2, 1.5);
});
function release() {
  UI.drag = null;
  if (!held) return;
  const o = held;
  held = null;
  cv.style.cursor = "";
  let vx = 0,
    vz = 0,
    vy = 0;
  if (heldHist.length > 1) {
    const a = heldHist[0],
      b = heldHist[heldHist.length - 1];
    const dt = (b.t - a.t) / 1000;
    if (dt > 0.01) {
      vx = (b.x - a.x) / dt;
      vz = (b.z - a.z) / dt;
      vy = (-(b.sy - a.sy) / dt) * 0.05;
    }
  }
  const sp = Math.hypot(vx, vz);
  if (sp > 7) {
    vx *= 7 / sp;
    vz *= 7 / sp;
  }
  vy = clamp(vy, -2, 8);
  o.state = "air";
  o.vx = vx;
  o.vz = vz;
  o.vy = vy;
  o.peakY = o.y;
  if (o.kind === "n") {
    o.ignore = null;
    o.age = 1;
  } else if (o.kind === "v") o.cause = "you";
}
cv.addEventListener("pointerup", release);
cv.addEventListener("pointercancel", release);
function updateHeld() {
  if (!held) return;
  const off = held.kind === "v" ? 10 : held.kind === "c" ? 5 : 3;
  let p = unproj(mouse.x, mouse.y + off, 4);
  let c = cellAt(p[0], p[1]);
  let hy = (c ? c.h + c.bias : 2) + 2.2;
  p = unproj(mouse.x, mouse.y + off, hy);
  c = cellAt(p[0], p[1]);
  if (c) {
    const g = groundAt(p[0], p[1]);
    if (hy < g + 1.2) {
      hy = g + 1.2;
      p = unproj(mouse.x, mouse.y + off, hy);
    }
  }
  held.x = p[0];
  held.z = p[1];
  held.y = hy;
  const now = performance.now();
  heldHist.push({ x: held.x, z: held.z, sy: mouse.y, t: now });
  while (heldHist.length > 2 && now - heldHist[0].t > 90) heldHist.shift();
}


function rotate(d) {
  rot = (rot + d + 4) % 4;
  updateRot();
}
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (UI.open) {
    if (k.startsWith("arrow") || k === " ") e.preventDefault();
    uiKey(k);
    return;
  }
  if (k === "s" || k === "escape") openSettings();
  else if (k === "q") rotate(-1);
  else if (k === "e") rotate(1);
  else if (k === " ") {
    e.preventDefault();
    paused = !paused;
  } else if (k === "n") genWorld((Math.random() * 1e9) | 0);
});
function fit() {
  let s = Math.min(window.innerWidth / W, window.innerHeight / H);
  if (s >= 2) s = Math.floor(s);
  cv.style.width = Math.floor(W * s) + "px";
  cv.style.height = Math.floor(H * s) + "px";
}
window.addEventListener("resize", fit);

let last = performance.now(),
  acc = 0;
function frame(now) {
  let dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!paused && !UI.open) {
    acc += dt * S.speed;
    const max = 6 * Math.ceil(S.speed);
    let n = 0;
    while (acc >= STEP && n < max) {
      updateWorld(STEP);
      acc -= STEP;
      n++;
    }
    if (n === max) acc = 0;
  }
  updateHeld();
  render();
  requestAnimationFrame(frame);
}
fit();
loadAssets("assets/")
  .then(() => {
    FONT.glyphs["%"] = [0, 0, 2, 0, 2, 1, 1, 2, 0, 3, 0, 4, 2, 4];
    genWorld(20260928);
    requestAnimationFrame(frame);
  })
  .catch((err) => {
    console.error(err);
    ctx.fillStyle = "#212123";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f2f0e5";
    ctx.font = "9px monospace";
  });
