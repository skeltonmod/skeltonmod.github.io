import { iso, rnd, ri } from '../core/constants.js';

export const pickups = {
  drop(kind, x, y) {
    this.picks.push({ kind, x, y, z: 4, vz: rnd(40, 60), vx: rnd(-1, 1), vy: rnd(-1, 1), rest: 0, t: rnd(0, 6), spr: this.add.image(0, 0, kind).setOrigin(0.5, 1) });
  },

  updatePicks(dt) {
    const p = this.p;
    for (let i = this.picks.length - 1; i >= 0; i--) {
      const o = this.picks[i]; o.t += dt;
      if (o.z > 0 || o.vz > 0) {
        o.vz -= 230 * dt; o.z += o.vz * dt;
        const nx = o.x + o.vx * dt, ny = o.y + o.vy * dt;
        if (!this.solidAt(nx, o.y)) o.x = nx; if (!this.solidAt(o.x, ny)) o.y = ny;
        if (o.z <= 0) { o.z = 0; if (o.vz < -30) o.vz = -o.vz * 0.4; else { o.vz = 0; o.vx = o.vy = 0; } }
      } else o.rest += dt;
      if (!p.dead) {
        const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
        if (o.rest > 0.25 && d < 1.4) { o.x += dx / d * 4 * dt; o.y += dy / d * 4 * dt; }
        if (d < 0.35 && o.rest > 0.1) {
          if (o.kind === 'coin') { const g = ri(1, 4) * this.lvl; p.gold += g; this.pop(p.x, p.y, 14, '+' + g, 'w'); }
          else if (o.kind === 'potion') { if (p.potions >= 9) continue; p.potions++; this.say('got a potion', 1.2); }
          else { p.mp = Math.min(p.maxmp, p.mp + 5); this.pop(p.x, p.y, 14, '+5', 'c'); }
          o.spr.destroy(); this.picks.splice(i, 1); continue;
        }
      }
      const sp = iso(o.x, o.y), bob = o.rest > 0 && Math.floor(o.t * 2.5) % 2 ? 1 : 0;
      o.spr.setPosition(sp.x, sp.y + 1 - o.z - bob).setDepth(o.x + o.y);
    }
  },
};
