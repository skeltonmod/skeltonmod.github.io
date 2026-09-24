import { MW, MH, iso, rnd, ri, pick, others } from '../core/constants.js';
import { GIBS, RUNS } from '../data/manifest.js';
import { tex } from '../data/sheets.js';

export const gore = {
  addPart(o) {
    if (this.parts.length > 900) this.settle(this.parts.shift());
    o.spr = this.add.image(0, 0, ...tex(o.key)); o.life = o.life ?? 99; this.parts.push(o);
  },

  spray(x, y, z, dx, dy, n, c, spread, speed) {
    const base = (dx || dy) ? Math.atan2(dy, dx) : 0, sp = (dx || dy) ? spread : 3.14;
    for (let i = 0; i < n; i++) {
      const a = base + rnd(-sp, sp), s = rnd(0.3, 1) * speed;
      const cc = Math.random() < 0.12 ? pick(others(c)) : c;
      const q = Math.random(), stamp = q < 0.72 ? 'd_' + cc + '1' : q < 0.92 ? 'd_' + cc + '2' : pick(RUNS[cc]);
      this.addPart({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(10, 60), key: 'd_' + cc + '1', stamp,
        blood: cc === 'm' ? 1 : 0, bounce: c === 'w' ? 0.4 : 0, flick: c });
    }
  },

  gib(x, y, z, c, ux, uy, s) {
    const a = Math.atan2(uy, ux) + rnd(-1.5, 1.5), key = pick(GIBS[c]);
    this.addPart({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: rnd(40, 100), key, stamp: key, bounce: 0.45, slide: true, col: c, gibFlick: true, blood: c === 'm' ? 2 : 0 });
  },

  glyph(x, y, c) {
    if (this.solidAt(x, y)) return;
    const g = this.glyphs[c], p = iso(x, y);
    g.setText(pick('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz?!:;<>=+-'));
    this.rt.draw(g, Math.round(p.x - 4), Math.round(p.y - 5));
    if (Math.random() < 0.7) this.rt.draw('kline', Math.round(p.x - 4 + ri(-1, 1)), Math.round(p.y - 5 + ri(1, 6)));
  },

  updateParts(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      if (q.flick && Math.random() < 0.3) q.spr.setTexture(...tex('d_' + (Math.random() < 0.7 ? q.flick : pick('mcw')) + '1'));
      if (q.gibFlick && Math.random() < 0.15) { q.stamp = pick(GIBS[Math.random() < 0.8 ? q.col : pick('mcw')]); q.spr.setTexture(...tex(q.stamp)); }
      if (q.float) {
        q.life -= dt; q.z += q.vz * dt;
        if (q.life <= 0) { q.spr.destroy(); this.parts.splice(i, 1); continue; }
      } else if (q.sliding) {
        const f = Math.pow(0.03, dt); q.vx *= f; q.vy *= f;
        const ox = q.x, oy = q.y;
        const nx = q.x + q.vx * dt; if (this.solidAt(nx, q.y)) q.vx *= -0.3; else q.x = nx;
        const ny = q.y + q.vy * dt; if (this.solidAt(q.x, ny)) q.vy *= -0.3; else q.y = ny;
        q.smear = (q.smear || 0) + Math.hypot(q.x - ox, q.y - oy);
        if (q.smear > 0.07) { q.smear = 0; this.stamp(Math.random() < 0.8 ? 'd_' + q.col + '1' : pick(RUNS[q.col]), q.x, q.y, q.col === 'm' ? 1 : 0); }
        if (Math.hypot(q.vx, q.vy) < 0.25) { this.settle(q); this.parts.splice(i, 1); continue; }
      } else {
        q.vz -= 230 * dt;
        const nx = q.x + q.vx * dt; if (this.solidAt(nx, q.y)) q.vx *= -0.4; else q.x = nx;
        const ny = q.y + q.vy * dt; if (this.solidAt(q.x, ny)) q.vy *= -0.4; else q.y = ny;
        q.z += q.vz * dt;
        if (q.z <= 0) {
          q.z = 0;
          if (q.bounce && q.vz < -35) {
            q.vz = -q.vz * q.bounce; q.vx *= 0.6; q.vy *= 0.6;
            if (q.col) this.stamp(pick(RUNS[q.col]), q.x, q.y, q.col === 'm' ? 1 : 0);
          } else if (q.slide && Math.hypot(q.vx, q.vy) > 0.3) { q.sliding = true; q.vz = 0; }
          else { this.settle(q); this.parts.splice(i, 1); continue; }
        }
      }
      const sp = iso(q.x, q.y); q.spr.setPosition(Math.round(sp.x), Math.round(sp.y - q.z)).setDepth(q.x + q.y + 0.2);
    }
  },

  settle(q) {
    const key = q.stamp;
    if (key) this.stamp(key, q.x, q.y, q.blood);
    if (q.gibFlick && Math.random() < 0.5) this.stamp(pick(RUNS[pick([q.col, q.col, 'm', 'c', 'w'])]), q.x + rnd(-0.12, 0.12), q.y + rnd(-0.12, 0.12));
    q.spr.destroy();
  },

  stamp(key, x, y, blood) {
    if (this.solidAt(x, y)) return;
    const p = iso(x, y), [t, fr] = tex(key), f = this.textures.getFrame(t, fr);
    this.rt.drawFrame(t, fr, Math.round(p.x - f.width / 2), Math.round(p.y - f.height / 2));
    if (blood) this.bloodAdd(x, y, blood, 0);
  },

  bloodAdd(x, y, amt, rad) {
    const gx = Math.floor(x * 4), gy = Math.floor(y * 4);
    for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
      const X = gx + i, Y = gy + j; if (X >= 0 && Y >= 0 && X < MW * 4 && Y < MH * 4) this.bloodGrid[Y * MW * 4 + X] += amt;
    }
  },
};
