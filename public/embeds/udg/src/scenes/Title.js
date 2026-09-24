import { VW, rnd, pick } from '../core/constants.js';
import { GIBS, POOLS, RUNS } from '../data/manifest.js';
import { tex } from '../data/sheets.js';
import { txt } from '../gfx/fonts.js';

export class Title extends Phaser.Scene {
  constructor() { super('title'); }
  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const O = { x: 64, y: 70 }, P = (x, y) => ({ x: (x - y) * 8 + O.x, y: (x + y) * 4 + O.y });
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
      const p = P(x + 0.5, y + 0.5); this.add.image(p.x, p.y, 'fl' + ((x * 7 + y * 3) & 1 ? 0 : (x + y) & 1 ? 1 : 2)).setDepth(-100);
    }
    const wall = (x, y) => { const p = P(x + 0.5, y + 0.5); this.add.image(p.x, p.y, 'wall').setOrigin(0.5, 0.75).setDepth(x + y + 1.5); };
    for (let x = -3; x <= 2; x++) wall(x, -3);
    for (let y = -2; y <= 2; y++) wall(-3, y);
    let p = P(-1.5, -2); this.add.sprite(p.x, p.y - 6, 'torch0').play('torch').setDepth(10);
    p = P(-2, 0.5); this.add.sprite(p.x, p.y - 6, 'torch0').play('torch').setDepth(10);
    p = P(1.2, 1.4); this.add.image(p.x, p.y, ...tex(POOLS.m[0])).setDepth(-50);
    p = P(1.3, 1.3); this.add.image(p.x, p.y, ...tex('c_cult_g0')).setDepth(-49);
    p = P(-1, 1.2); this.add.image(p.x, p.y, ...tex('c_skel_g1')).setDepth(-49);
    for (let i = 0; i < 22; i++) { p = P(rnd(-1.5, 2), rnd(-0.5, 2)); this.add.image(Math.round(p.x), Math.round(p.y), ...tex(pick(['d_m1', 'd_m1', 'd_c1', ...GIBS.m, ...RUNS.m]))).setDepth(-48); }
    p = P(0.2, 0.2); this.add.image(p.x + 1, p.y - 5, 'sword').setOrigin(0.15, 0.5).setRotation(-0.6).setDepth(0.9);
    p = P(0.2, 0.2); this.hero = this.add.sprite(p.x, p.y, 'player').setOrigin(0.5, 1).play('p_f').setDepth(1);
    p = P(1.8, -0.6); this.add.sprite(p.x, p.y, 'slime').setOrigin(0.5, 1).play('slime').setDepth(2);

    const t1 = txt(this, 0, 3, 'untitled', 'm').setScale(2); t1.x = Math.round((VW - t1.width) / 2);
    const t2 = txt(this, 0, 20, 'dungeon game 2026', 'c'); t2.x = Math.round((VW - t2.width) / 2);
    const touch = this.sys.game.device.input.touch;
    const lines = touch ? ['stick move', 'A slash  B bolt'] : ['arrow keys to move', 'z slash', 'x bolt  q potion'];
    lines.forEach((s, i) => { const t = txt(this, 0, 96 + i * 9, s, 'w'); t.x = Math.round((VW - t.width) / 2); });
    this.go = txt(this, 0, 121, touch ? 'tap to start' : 'press z to start', 'm');
    this.go.x = Math.round((VW - this.go.width) / 2);
    this.time.addEvent({ delay: 420, loop: true, callback: () => this.go.setVisible(!this.go.visible) });

    const start = () => { if (this.started) return; this.started = true; this.scene.start('game', { depth: 1 }); };
    this.input.keyboard.on('keydown', e => { if (['z', 'Z', ' ', 'Enter', 'j', 'J'].includes(e.key)) start(); });
    this.input.on('pointerdown', start);
  }
}
