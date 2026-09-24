export const VW = 128,
  VH = 128;

export const CSS = { k: "#000000", c: "#55ffff", m: "#ff55ff", w: "#ffffff" };
export const COL = { k: 0x000000, c: 0x55ffff, m: 0xff55ff, w: 0xffffff };

export const MW = 44,
  MH = 44;
export const OX = MH * 8 + 16,
  OY = 16;

export const iso = (x, y) => ({ x: (x - y) * 8 + OX, y: (x + y) * 4 + OY });
export const unIso = (sx, sy) => {
  const a = (sx - OX) / 8,
    b = (sy - OY) / 4;
  return { x: (a + b) / 2, y: (b - a) / 2 };
};

export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const norm = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};
export const others = (c) => "mcw".replace(c, "");

export const smoothDamp = (cur, target, v, k, st, dt) => {
  const om = 2 / st,
    x = om * dt,
    ex = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const ch = cur - target,
    tmp = (v[k] + om * ch) * dt;
  v[k] = (v[k] - om * tmp) * ex;
  return target + (ch + tmp) * ex;
};
