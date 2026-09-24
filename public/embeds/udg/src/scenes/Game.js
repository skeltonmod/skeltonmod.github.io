import { COL, iso } from '../core/constants.js';
import { dungeon } from '../systems/dungeon.js';
import { player } from '../systems/player.js';
import { physics } from '../systems/physics.js';
import { combat } from '../systems/combat.js';
import { enemies } from '../systems/enemies.js';
import { gore } from '../systems/gore.js';
import { pickups } from '../systems/pickups.js';
import { view } from '../systems/view.js';
import { outline } from '../systems/outline.js';

export class Game extends Phaser.Scene {
  constructor() { super('game'); }
  init(d) { this.lvl = d.depth || 1; this.carry = d.player || null; this.restarting = false; }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    Object.assign(this, {
      parts: [], projs: [], fxs: [], enemies: [], props: [], picks: [],
      hitstop: 0, shakeT: 0, shakeA: 0, wipe: 0, reveal: 0.35, over: false, overT: 0, descending: false,
      msgText: '', msgT: 0, flowT: 0, low: new Set(), touchVec: null, touchA: false, touchB: false, touchP: false,
      cleared: false,
    });
    this.genMap();
    this.buildWorld();
    this.makePlayer();
    this.populate();
    this.setupInput();
    this.computeFlow();
    const p = iso(this.p.x, this.p.y); this.camX = p.x - 64; this.camY = p.y - 70; this.camV = { x: 0, y: 0 };
    this.glyphs = {}; for (const c of 'mcw') this.glyphs[c] = this.make.bitmapText({ font: 'font_' + c, text: 'x', size: 8 }, false);
    this.swordStamp = this.make.image({ key: 'sword' }, false).setOrigin(0.15, 0.5);
    if (!this.scene.isActive('ui')) this.scene.launch('ui');
    this.scene.bringToTop('ui');
    this.say(this.lvl === 1 ? 'find the stairs' : 'floor B' + this.lvl, 2.5);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);
    this.updateFx(dt);
    if (this.hitstop > 0) { this.hitstop -= dt; this.updateCamera(dt); return; }
    if (this.reveal > 0) this.reveal -= dt;
    if (this.msgT > 0) this.msgT -= dt;
    if (this.descending) {
      this.wipe += dt / 0.35;
      if (this.wipe >= 1 && !this.restarting) { this.restarting = true; this.scene.restart({ depth: this.lvl + 1, player: this.stats() }); return; }
    }
    if (!this.p.dead) this.updatePlayer(dt);
    else {
      this.overT += dt; if (this.overT > 1.4) this.over = true;
      if (this.over && (Phaser.Input.Keyboard.JustDown(this.keys.R) || Phaser.Input.Keyboard.JustDown(this.keys.Z))) this.restartGame();
    }
    this.flowT -= dt; if (this.flowT <= 0) { this.flowT = 0.25; this.computeFlow(); }
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.separate();
    for (const e of this.enemies) this.drawEnemy(e, dt);
    for (const o of this.props) {
      o.flash -= dt; const p = iso(o.x, o.y);
      o.spr.setPosition(p.x, p.y + 2).setDepth(o.x + o.y);
      if (o.flash > 0) o.spr.setTintFill(COL.w); else o.spr.clearTint();
    }
    this.updateProjs(dt);
    this.updateParts(dt);
    this.updatePicks(dt);
    this.updateCutaway();
    if (!this.cleared && this.enemies.length === 0) { this.cleared = true; this.say('floor clear', 2); }
    this.updateCamera(dt);
  }
}

Object.assign(Game.prototype, { ...dungeon, ...player, ...physics, ...combat, ...enemies, ...gore, ...pickups, ...view, ...outline });
