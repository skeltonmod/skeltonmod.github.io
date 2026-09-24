import { MW, iso, ri, smoothDamp } from '../core/constants.js';
import { txt } from '../gfx/fonts.js';

export const view = {
  updateCutaway() {
    const p = this.p, pt = p.x + p.y, pd = p.x - p.y, next = new Set();
    if (!p.dead) {
      const bx = Math.floor(p.x), by = Math.floor(p.y);
      for (let ty = by - 1; ty <= by + 4; ty++) for (let tx = bx - 1; tx <= bx + 4; tx++) {
        const i = ty * MW + tx; if (!this.walls.has(i)) continue;
        const s = tx + ty + 1.5, dd = tx - ty;
        if (s > pt && s - pt < 3.4 && Math.abs(dd - pd) < 2.3) next.add(i);
      }
    }
    for (const i of this.low) if (!next.has(i)) { const w = this.walls.get(i); w.setTexture('wall').setOrigin(0.5, 0.75); if (w.torch) w.torch.setVisible(true); }
    for (const i of next) if (!this.low.has(i)) { const w = this.walls.get(i); w.setTexture('wall_lo').setOrigin(0.5, 0.6); if (w.torch) w.torch.setVisible(false); }
    this.low = next;
  },

  shake(a, t) { if (a >= this.shakeA || this.shakeT <= 0) { this.shakeA = a; this.shakeT = t; } },

  updateCamera(dt) {
    const sp = iso(this.p.x, this.p.y), tx = sp.x - 64, ty = sp.y - 70;
    this.camX = smoothDamp(this.camX, tx, this.camV, 'x', 0.11, dt);
    this.camY = smoothDamp(this.camY, ty, this.camV, 'y', 0.11, dt);
    let sx = Math.round(sp.x) - Math.round(sp.x - this.camX), sy = Math.round(sp.y) - Math.round(sp.y - this.camY);
    if (this.shakeT > 0) { this.shakeT -= dt; sx += ri(-this.shakeA, this.shakeA); sy += ri(-this.shakeA, this.shakeA); }
    this.cameras.main.setScroll(sx, sy);
  },

  pop(x, y, z, s, c) {
    const sp = iso(x, y), t = txt(this, 0, 0, s, c).setOrigin(0.5, 1).setDepth(1e5);
    this.fxs.push({ t, x: sp.x + ri(-2, 2), y: sp.y - z, life: 0.6 });
  },

  updateFx(dt) {
    for (let i = this.fxs.length - 1; i >= 0; i--) {
      const f = this.fxs[i]; f.life -= dt; f.y -= 16 * dt * (f.life > 0.3 ? 1 : 0.2);
      if (f.life <= 0) { f.t.destroy(); this.fxs.splice(i, 1); continue; }
      f.t.setPosition(Math.round(f.x), Math.round(f.y));
    }
  },
};
