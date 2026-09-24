import { SPRITE_KEYS } from '../data/manifest.js';
import { SHEETS } from '../data/sheets.js';
import { buildFonts } from '../gfx/fonts.js';
import { buildAnimations } from '../gfx/animations.js';

export class Boot extends Phaser.Scene {
  constructor() { super('boot'); }
  preload() {
    this.load.image('fontsrc', 'assets/font.png');
    for (const [key, { size: [frameWidth, frameHeight] }] of Object.entries(SHEETS))
      this.load.spritesheet(key, `assets/sheets/${key}.png`, { frameWidth, frameHeight });
    for (const key of SPRITE_KEYS) this.load.image(key, `assets/sprites/${key}.png`);
    this.load.on('loaderror', f => console.error('Missing asset:', f.src));
  }
  create() {
    buildFonts(this);
    buildAnimations(this);
    this.scene.start('title');
  }
}
