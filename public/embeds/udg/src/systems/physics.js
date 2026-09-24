export const physics = {
  resolve(o) {
    const r = o.r;
    for (let ty = Math.floor(o.y - r); ty <= Math.floor(o.y + r); ty++)
      for (let tx = Math.floor(o.x - r); tx <= Math.floor(o.x + r); tx++) {
        if (!this.solid(tx, ty)) continue;
        const cx = Phaser.Math.Clamp(o.x, tx, tx + 1), cy = Phaser.Math.Clamp(o.y, ty, ty + 1);
        let dx = o.x - cx, dy = o.y - cy; const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        if (d2 > 1e-8) { const d = Math.sqrt(d2); o.x += dx / d * (r - d); o.y += dy / d * (r - d); }
        else {
          const l = o.x - tx, rr = tx + 1 - o.x, t = o.y - ty, b = ty + 1 - o.y, m = Math.min(l, rr, t, b);
          if (m === l) o.x = tx - r; else if (m === rr) o.x = tx + 1 + r; else if (m === t) o.y = ty - r; else o.y = ty + 1 + r;
        }
      }
  },

  separate() {
    const p = this.p, E = this.enemies;
    for (let i = 0; i < E.length; i++) {
      const a = E[i];
      for (let j = i + 1; j < E.length; j++) {
        const b = E[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
        if (d < m && d > 1e-4) { const f = (m - d) / 2 / d; a.x -= dx * f; a.y -= dy * f; b.x += dx * f; b.y += dy * f; }
      }
      if (!p.dead) {
        const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy), m = a.r + p.r;
        if (d < m && d > 1e-4) { const f = (m - d) / d; a.x += dx * f * 0.7; a.y += dy * f * 0.7; p.x -= dx * f * 0.3; p.y -= dy * f * 0.3; }
      }
      for (const o of this.props) {
        const dx = a.x - o.x, dy = a.y - o.y, d = Math.hypot(dx, dy), m = a.r + o.r;
        if (d < m && d > 1e-4) { const f = (m - d) / d; a.x += dx * f; a.y += dy * f; }
      }
      this.resolve(a);
    }
    if (!p.dead) {
      for (const o of this.props) {
        const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy), m = p.r + o.r;
        if (d < m && d > 1e-4) { const f = (m - d) / d; p.x += dx * f; p.y += dy * f; }
      }
      this.resolve(p);
    }
  },
};
