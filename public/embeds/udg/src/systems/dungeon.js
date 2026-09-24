import { MW, MH, iso, rnd, ri, pick, norm } from '../core/constants.js';
import { EDEF } from '../data/enemies.js';

export const dungeon = {
  solid(tx, ty) { return tx < 0 || ty < 0 || tx >= MW || ty >= MH || this.map[ty * MW + tx] === 1; },

  solidAt(x, y) { return this.solid(Math.floor(x), Math.floor(y)); },

  genMap() {
    const m = this.map = new Uint8Array(MW * MH).fill(1), R = this.rooms = [];
    for (let t = 0; t < 500 && R.length < 11; t++) {
      const w = ri(5, 9), h = ri(5, 9), x = ri(2, MW - w - 3), y = ri(2, MH - h - 3);
      if (R.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
      R.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
    }
    const carve = (x, y) => { if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1) m[y * MW + x] = 0; };
    for (const r of R) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y);
    for (const r of R) if (r.w >= 7 && r.h >= 7 && Math.random() < 0.6)
      for (const [x, y] of [[r.x + 2, r.y + 2], [r.x + r.w - 3, r.y + 2], [r.x + 2, r.y + r.h - 3], [r.x + r.w - 3, r.y + r.h - 3]]) m[y * MW + x] = 1;
    const hseg = (x0, x1, y) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 1; x++) { carve(x, y); carve(x, y + 1); } };
    const vseg = (y0, y1, x) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1) + 1; y++) { carve(x, y); carve(x + 1, y); } };
    const corr = (a, b) => {
      if (Math.random() < 0.5) { hseg(a.cx, b.cx, a.cy); vseg(a.cy, b.cy, b.cx); }
      else { vseg(a.cy, b.cy, a.cx); hseg(a.cx, b.cx, b.cy); }
    };
    for (let i = 1; i < R.length; i++) {
      let best = 0, bd = 1e9;
      for (let j = 0; j < i; j++) { const d = Math.abs(R[i].cx - R[j].cx) + Math.abs(R[i].cy - R[j].cy); if (d < bd) { bd = d; best = j; } }
      corr(R[i], R[best]);
    }
    for (let k = 0; k < 2 && R.length > 3; k++) corr(pick(R), pick(R));
    const d = this.bfs(R[0].cx, R[0].cy);
    let far = R[R.length - 1], fd = -1;
    for (const r of R.slice(1)) { const v = d[r.cy * MW + r.cx]; if (v > fd) { fd = v; far = r; } }
    m[far.cy * MW + far.cx] = 0;
    this.stairRoom = far;
  },

  bfs(sx, sy) {
    const d = new Int16Array(MW * MH).fill(-1), q = new Int32Array(MW * MH);
    let h = 0, t = 0; const s = sy * MW + sx; d[s] = 0; q[t++] = s;
    while (h < t) {
      const c = q[h++], cx = c % MW, cy = (c / MW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy; if (this.solid(nx, ny)) continue;
        const n = ny * MW + nx; if (d[n] < 0) { d[n] = d[c] + 1; q[t++] = n; }
      }
    }
    return d;
  },

  computeFlow() { if (!this.p.dead) this.flow = this.bfs(Math.floor(this.p.x), Math.floor(this.p.y)); },

  flowDir(e) {
    if (!this.flow) return null;
    const tx = Math.floor(e.x), ty = Math.floor(e.y), cur = this.flow[ty * MW + tx];
    let best = null, bv = cur < 0 ? 1e9 : cur;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = tx + dx, ny = ty + dy;
      if (this.solid(nx, ny) || (dx && dy && (this.solid(tx + dx, ty) || this.solid(tx, ty + dy)))) continue;
      const v = this.flow[ny * MW + nx]; if (v >= 0 && v < bv) { bv = v; best = { x: nx + 0.5, y: ny + 0.5 }; }
    }
    return best ? norm(best.x - e.x, best.y - e.y) : null;
  },

  los(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 4);
    for (let i = 1; i < n; i++) { const t = i / n; if (this.solidAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; }
    return true;
  },

  buildWorld() {
    const rw = (MW + MH) * 8 + 32, rh = (MW + MH) * 4 + 40;
    this.rt = this.add.renderTexture(0, 0, rw, rh).setOrigin(0, 0).setDepth(-1e5);
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
      if (this.solid(tx, ty)) continue;
      const h = (tx * 73 + ty * 151) % 17, p = iso(tx + 0.5, ty + 0.5);
      this.rt.draw(h < 2 ? 'fl1' : h < 4 ? 'fl2' : 'fl0', p.x - 8, p.y - 4);
    }
    this.walls = new Map();
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
      if (!this.solid(tx, ty)) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (!this.solid(tx + dx, ty + dy)) { near = true; break; }
      if (!near) continue;
      const p = iso(tx + 0.5, ty + 0.5);
      this.walls.set(ty * MW + tx, this.add.image(p.x, p.y, 'wall').setOrigin(0.5, 0.75).setDepth(tx + ty + 1.5));
      if (Math.random() < 0.16) {
        let tp = null;
        if (!this.solid(tx, ty + 1) && this.solid(tx - 1, ty) && this.solid(tx + 1, ty)) tp = iso(tx + 0.5, ty + 1);
        else if (!this.solid(tx + 1, ty) && this.solid(tx, ty - 1) && this.solid(tx, ty + 1)) tp = iso(tx + 1, ty + 0.5);
        if (tp) this.walls.get(ty * MW + tx).torch = this.add.sprite(tp.x, tp.y - 6, 'torch0').play({ key: 'torch', startFrame: ri(0, 1) }).setDepth(tx + ty + 1.6);
      }
    }
    const sr = this.stairRoom; this.stairs = { x: sr.cx + 0.5, y: sr.cy + 0.5 };
    const sp = iso(this.stairs.x, this.stairs.y);
    this.add.sprite(sp.x, sp.y, 'stairs0').play('stairs').setDepth(-9e4);
    this.bloodGrid = new Float32Array(MW * 4 * MH * 4);
  },

  roomCell(r) {
    for (let t = 0; t < 30; t++) {
      const x = ri(r.x, r.x + r.w - 1), y = ri(r.y, r.y + r.h - 1);
      if (!this.solid(x, y) && !(x === r.cx && y === r.cy)) return { x: x + rnd(0.3, 0.7), y: y + rnd(0.3, 0.7) };
    }
    return { x: r.cx + 0.5, y: r.cy + 0.5 };
  },

  populate() {
    const types = Object.keys(EDEF).filter(k => EDEF[k].minD <= this.lvl);
    const pool = []; types.forEach(k => { for (let i = 0; i < EDEF[k].w; i++) pool.push(k); });
    this.rooms.forEach((r, i) => {
      if (i > 0) {
        const n = ri(1, Math.min(6, 2 + Math.floor(this.lvl / 2)));
        for (let k = 0; k < n; k++) { const c = this.roomCell(r); this.spawnEnemy(pick(pool), c.x, c.y); }
      }
      const nProps = ri(0, 3);
      for (let k = 0; k < nProps; k++) {
        const side = ri(0, 3); let x, y, ox = 0, oy = 0;
        if (side === 0) { x = ri(r.x, r.x + r.w - 1); y = r.y; oy = -1; }
        else if (side === 1) { x = ri(r.x, r.x + r.w - 1); y = r.y + r.h - 1; oy = 1; }
        else if (side === 2) { x = r.x; y = ri(r.y, r.y + r.h - 1); ox = -1; }
        else { x = r.x + r.w - 1; y = ri(r.y, r.y + r.h - 1); ox = 1; }
        if (this.solid(x, y) || !this.solid(x + ox, y + oy) || (x === r.cx && y === r.cy)) continue;
        if (this.props.some(o => Math.floor(o.x) === x && Math.floor(o.y) === y)) continue;
        const kind = Math.random() < 0.6 ? 'pot' : 'crate';
        this.props.push({ kind, x: x + 0.5, y: y + 0.5, r: 0.3, hp: kind === 'pot' ? 1 : 3, flash: 0, spr: this.add.image(0, 0, kind).setOrigin(0.5, 1) });
      }
    });
  },
};
