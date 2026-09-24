import { COL, iso, rnd, ri } from '../core/constants.js';
import { EDEF } from '../data/enemies.js';
import { OUTLINE } from './outline.js';

export const enemies = {
  spawnEnemy(type, x, y) {
    const D = EDEF[type], mul = 1 + 0.25 * (this.lvl - 1);
    const e = {
      type, def: D, x, y, r: D.r, hp: Math.round(D.hp * mul), dmg: D.dmg + Math.floor((this.lvl - 1) / 2),
      kx: 0, ky: 0, cd: rnd(0.3, 1), wind: 0, aggro: false, t: rnd(0, 9), seed: rnd(0, 9), wt: 0, wx: 0, wy: 0,
      flash: 0, drip: 0, spdMul: rnd(0.9, 1.1), spr: this.add.sprite(0, 0, type).setOrigin(0.5, 1).play({ key: type, startFrame: ri(0, 1) }),
    };
    e.maxhp = e.hp; this.enemies.push(e);
    this.addOutline(e.spr, OUTLINE.enemy)
    if (D.segs) {
      e.ang = rnd(0, 6.283); e.segs = [];
      for (let i = 0; i < D.segs; i++) {
        const last = i === D.segs - 1;
        e.segs.push({ x: x - Math.cos(e.ang) * 0.05 * i, y: y - Math.sin(e.ang) * 0.05 * i, r: 0.13,
          spr: this.add.image(0, 0, last ? 'snake_tail' : 'snake_seg', last ? 0 : i % 2).setOrigin(0.5, 0.8) });
        this.addOutline(e.segs[i].spr, OUTLINE.enemy);
      }
    }
  },

  bodyPts(e) { return e.segs ? [e, ...e.segs] : [e]; },

  updateEnemy(e, dt) {
    const p = this.p, D = e.def;
    e.t += dt; e.cd -= dt; e.flash -= dt;
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1e-3, ux = dx / dist, uy = dy / dist;
    if (!p.dead) {
      if (!e.aggro) { if (dist < 6.5 && this.los(e.x, e.y, p.x, p.y)) { e.aggro = true; this.pop(e.x, e.y, D.z + 14, '!', 'm'); } }
      else if (dist > 13) e.aggro = false;
    } else e.aggro = false;
    let mx = 0, my = 0;
    if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) this.enemyAct(e, dist, ux, uy); }
    else if (e.aggro) {
      const see = this.los(e.x, e.y, p.x, p.y);
      let tx = ux, ty = uy;
      if (!see) { const f = this.flowDir(e); if (f) { tx = f.x; ty = f.y; } }
      if (D.ranged) {
        if (dist < 2.6 && see) { mx = -ux; my = -uy; }
        else if (dist > 4.8 || !see) { mx = tx; my = ty; }
        else { const s = Math.sin(e.t * 1.3 + e.seed) > 0 ? 1 : -1; mx = -uy * s * 0.6; my = ux * s * 0.6; }
        if (see && dist < 7 && e.cd <= 0) { e.wind = D.wind; e.cd = 2.2 + Math.random(); }
      } else {
        mx = tx; my = ty;
        if (e.type === 'bat') { const s = Math.sin(e.t * 7 + e.seed) * 0.9; mx += -ty * s; my += tx * s; }
        if (dist < e.r + p.r + 0.3 && e.cd <= 0) { e.wind = D.wind; e.cd = 1.1; }
      }
    } else {
      e.wt -= dt;
      if (e.wt <= 0) { e.wt = rnd(0.8, 2.2); if (Math.random() < 0.5) { const a = rnd(0, 6.283); e.wx = Math.cos(a) * 0.4; e.wy = Math.sin(a) * 0.4; } else e.wx = e.wy = 0; }
      mx = e.wx; my = e.wy;
    }
    let l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; l = 1; }
    if (e.wind > 0) mx = my = 0;
    if (e.segs && l > 0.01 && e.wind <= 0) {
      const want = Math.atan2(my, mx) + Math.sin(e.t * 6 + e.seed) * 0.9;
      e.ang += Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(want - e.ang), -5 * dt, 5 * dt);
      mx = Math.cos(e.ang) * l; my = Math.sin(e.ang) * l;
    }
    e.x += (mx * D.spd * e.spdMul + e.kx) * dt; e.y += (my * D.spd * e.spdMul + e.ky) * dt;
    const dec = Math.pow(0.0015, dt); e.kx *= dec; e.ky *= dec;
    this.resolve(e);
    e.mvx = mx; e.mvy = my;
    if (e.segs) this.chain(e);
    if (e.hp < e.maxhp * 0.5 && D.blood !== 'w') { e.drip -= dt; if (e.drip <= 0) { e.drip = 0.45; this.spray(e.x, e.y, D.z + 3, 0, 0, 1, D.blood, 3.14, 0.3); } }
  },

  chain(e) {
    let prev = e;
    for (const s of e.segs) {
      const dx = s.x - prev.x, dy = s.y - prev.y, d = Math.hypot(dx, dy) || 1e-3, SP = 0.3;
      if (d > SP) { s.x = prev.x + dx / d * SP; s.y = prev.y + dy / d * SP; }
      this.resolve(s); prev = s;
    }
  },

  enemyAct(e, dist, ux, uy) {
    const p = this.p; if (p.dead) return;
    if (e.def.ranged) this.fire(e.x, e.y, ux, uy, 'e', e.dmg);
    else { e.kx += ux * 3.5; e.ky += uy * 3.5; if (dist < e.r + p.r + 0.6) this.hurtPlayer(e.dmg, ux, uy); }
  },

  drawEnemy(e) {
    const sp = iso(e.x, e.y), z = e.def.z ? e.def.z + Math.round(Math.sin(e.t * 5)) : 0;
    e.spr.setPosition(sp.x, sp.y - z).setDepth(e.x + e.y);
    const sx = (e.mvx || 0) - (e.mvy || 0); if (Math.abs(sx) > 0.05) e.spr.setFlipX(sx < 0);
    const blink = e.wind > 0 && Math.floor(e.wind * 25) % 2 === 0, lit = e.flash > 0 || blink;
    if (lit) e.spr.setTintFill(COL.w); else e.spr.clearTint();
    this.syncOutline(e.spr);
    if (e.segs) {
      e.spr.setFlipX(Math.cos(e.ang) - Math.sin(e.ang) < 0);
      e.segs.forEach((s, i) => {
        const p = iso(s.x, s.y), bob = Math.round(Math.sin(e.t * 10 - i * 0.9) * 0.6);
        s.spr.setPosition(p.x, p.y - bob).setDepth(s.x + s.y - 0.01);
        if (lit) s.spr.setTintFill(COL.w); else s.spr.clearTint();
        this.syncOutline(s.spr);
      });
    }
  },
};
