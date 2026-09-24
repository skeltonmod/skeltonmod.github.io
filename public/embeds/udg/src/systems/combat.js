import { iso, rnd, ri, pick, norm } from "../core/constants.js";
import { POOLS, GLV } from "../data/manifest.js";

export const combat = {
  fire(x, y, ux, uy, owner, dmg) {
    const spd = owner === "p" ? 8 : 4.2;
    this.projs.push({
      x: x + ux * 0.3,
      y: y + uy * 0.3,
      vx: ux * spd,
      vy: uy * spd,
      owner,
      dmg,
      z: 5,
      life: 2.5,
      spr: this.add.image(0, 0, owner === "p" ? "bolt" : "orbshot"),
    });
  },

  hurtEnemy(e, dmg, ux, uy, kb, crit) {
    if (!this.enemies.includes(e)) return;
    e.hp -= dmg;
    e.flash = 0.1;
    e.aggro = true;
    if (e.type !== "brute") e.wind = 0;
    e.kx += (ux * kb) / e.def.mass;
    e.ky += (uy * kb) / e.def.mass;
    this.spray(e.x, e.y, e.def.z + 4, ux, uy, 5 + dmg, e.def.blood, 0.8, 2.6);
    this.pop(
      e.x,
      e.y,
      e.def.z + 12,
      crit ? dmg + "!" : "" + dmg,
      crit ? "m" : "w",
    );
    if (e.hp <= 0) this.killEnemy(e, ux, uy);
  },

  killEnemy(e, ux, uy) {
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.killOutline(e.spr);
    e.spr.destroy();
    const D = e.def,
      c = D.blood,
      body = this.bodyPts(e);
    body.forEach((b, i) => {
      if (c !== "w" && i % 2 === 0) {
        this.stamp(e.type === "brute" ? "cp_big_m" : pick(POOLS[c]), b.x, b.y);
        this.bloodAdd(b.x, b.y, 4, 2);
      }
    });
    if (e.segs)
      e.segs.forEach((s2, i) => {
        this.killOutline(s2.spr);
        s2.spr.destroy();
        if (i % 2 === 0) this.stamp("c_snseg_g" + ri(0, GLV - 1), s2.x, s2.y);
      });
    this.stamp(
      D.corpse + "_g" + ri(0, GLV - 1),
      e.x + ux * 0.1,
      e.y + uy * 0.1,
    );
    for (const b of body) {
      this.spray(
        b.x,
        b.y,
        D.z + 5,
        ux,
        uy,
        Math.round((22 + (e.type === "brute" ? 20 : 0)) / (e.segs ? 3 : 1)),
        c,
        1.4,
        3.2,
      );
      for (let i = 0; i < D.gibs; i++)
        this.gib(b.x, b.y, D.z + 5, c === "w" ? "w" : c, ux, uy, rnd(1, 3.4));
    }
    for (let i = 0, n = ri(1, 3) + (e.segs ? 3 : 0); i < n; i++) {
      const b = pick(body);
      this.glyph(
        b.x + rnd(-0.5, 0.5),
        b.y + rnd(-0.5, 0.5),
        Math.random() < 0.7 ? (c === "w" ? "w" : c) : pick("mcw"),
      );
    }
    const p = this.p;
    p.kills++;
    this.gainXP(D.xp + Math.floor(this.lvl / 2));
    const r = Math.random();
    if (r < 0.5) this.drop("coin", e.x, e.y);
    else if (r < 0.62) this.drop("orb", e.x, e.y);
    else if (r < 0.7) this.drop("potion", e.x, e.y);
    this.hitstop = 0.05;
    this.shake(2, 0.14);
  },

  hurtProp(o, dmg, ux, uy) {
    o.hp -= dmg;
    o.flash = 0.08;
    const bits =
      o.kind === "pot"
        ? ["shard", "shard2", "shard3"]
        : ["splint", "splint2", "splint3"];
    for (let i = 0; i < 3; i++) {
      const k = pick(bits);
      this.addPart({
        x: o.x,
        y: o.y,
        z: 4,
        vx: ux * rnd(0.5, 2) + rnd(-1, 1),
        vy: uy * rnd(0.5, 2) + rnd(-1, 1),
        vz: rnd(30, 60),
        key: k,
        stamp: k,
        bounce: 0.4,
      });
    }
    if (o.hp > 0) return;
    this.props.splice(this.props.indexOf(o), 1);
    o.spr.destroy();
    for (let i = 0; i < 12; i++) {
      const k = pick(bits);
      const a = rnd(0, 6.283),
        s = rnd(0.5, 2.8);
      this.addPart({
        x: o.x,
        y: o.y,
        z: 3,
        vx: Math.cos(a) * s + ux,
        vy: Math.sin(a) * s + uy,
        vz: rnd(30, 80),
        key: k,
        stamp: k,
        bounce: 0.45,
      });
    }
    const r = Math.random();
    if (r < 0.35) this.drop("coin", o.x, o.y);
    else if (r < 0.45) this.drop("potion", o.x, o.y);
    else if (r < 0.55) this.drop("orb", o.x, o.y);
  },

  hurtPlayer(d, ux, uy) {
    const p = this.p;
    if (p.inv > 0 || p.dead) return;
    p.hp -= d;
    p.inv = 0.8;
    p.kx += ux * 5;
    p.ky += uy * 5;
    this.spray(p.x, p.y, 5, ux, uy, 8 + d * 2, "m", 0.9, 2.4);
    this.pop(p.x, p.y, 14, "" + d, "m");
    this.shake(2, 0.16);
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.spr.setVisible(false);
      this.syncOutline(p.spr);
      this.overT = 0;
      this.stamp("cp_big_m", p.x, p.y);
      this.bloodAdd(p.x, p.y, 5, 2);
      this.stamp("c_player_g" + ri(0, GLV - 1), p.x, p.y);
      p.sword.setVisible(false);
      const sp = iso(p.x + ux * 0.6, p.y + uy * 0.6);
      if (!this.solidAt(p.x + ux * 0.6, p.y + uy * 0.6))
        this.rt.draw(
          this.swordStamp.setRotation(rnd(0, 6.283)),
          Math.round(sp.x),
          Math.round(sp.y),
        );
      this.spray(p.x, p.y, 5, ux, uy, 45, "m", 3.1, 2.6);
      for (let i = 0; i < 10; i++)
        this.gib(p.x, p.y, 5, pick("mmc"), ux, uy, rnd(1, 3));
      for (let i = 0; i < 4; i++)
        this.glyph(p.x + rnd(-0.6, 0.6), p.y + rnd(-0.6, 0.6), pick("mmw"));
      this.hitstop = 0.15;
      this.shake(3, 0.3);
      this.say("you died", 99);
    }
  },

  updateProjs(dt) {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const q = this.projs[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      let dead = q.life <= 0;
      const col = q.owner === "p" ? "c" : "m",
        u = norm(q.vx, q.vy);
      if (!dead && this.solidAt(q.x, q.y)) {
        dead = true;
        q.x -= u.x * 0.15;
        q.y -= u.y * 0.15;
        this.spray(q.x, q.y, q.z, -u.x, -u.y, 6, col, 1.2, 2);
      }
      if (!dead && q.owner === "p") {
        for (const e of this.enemies)
          if (
            this.bodyPts(e).some(
              (b) => Math.hypot(b.x - q.x, b.y - q.y) < (b.r || e.r) + 0.15,
            )
          ) {
            this.hurtEnemy(e, q.dmg, u.x, u.y, 3);
            dead = true;
            break;
          }
        if (!dead)
          for (const o of this.props)
            if (Math.hypot(o.x - q.x, o.y - q.y) < o.r + 0.1) {
              this.hurtProp(o, 3, u.x, u.y);
              dead = true;
              break;
            }
      } else if (
        !dead &&
        !this.p.dead &&
        Math.hypot(this.p.x - q.x, this.p.y - q.y) < this.p.r + 0.15
      ) {
        this.hurtPlayer(q.dmg, u.x, u.y);
        dead = true;
      }
      if (dead) {
        q.spr.destroy();
        this.projs.splice(i, 1);
        continue;
      }
      const sp = iso(q.x, q.y);
      q.spr.setPosition(sp.x, sp.y - q.z).setDepth(q.x + q.y + 0.1);
    }
  },
};
