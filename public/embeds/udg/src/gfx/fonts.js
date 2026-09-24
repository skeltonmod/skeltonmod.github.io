import { COL } from '../core/constants.js';

export function buildFonts(scene) {
  const src = scene.textures.get('fontsrc').getSourceImage();
  const cols = Math.floor(src.width / 8), rows = Math.floor(src.height / 8), n = cols * rows;
  const ch = Math.ceil((n + 1) / 16);
  for (const c of ['w', 'c', 'm', 'k']) {
    const key = 'font_' + c, t = scene.textures.createCanvas(key + '_tex', 128, ch * 8), ctx = t.getContext();
    for (let i = 0; i < n; i++) {
      const d = i + 1;
      ctx.drawImage(src, (i % cols) * 8, Math.floor(i / cols) * 8, 8, 8, (d % 16) * 8, Math.floor(d / 16) * 8, 8, 8);
    }
    const img = ctx.getImageData(0, 0, 128, ch * 8), p = img.data, v = COL[c];
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    for (let j = 0; j < p.length; j += 4) {
      if (p[j + 3] > 0 && (p[j] | p[j + 1] | p[j + 2])) { p[j] = r; p[j + 1] = g; p[j + 2] = b; p[j + 3] = 255; }
      else p[j + 3] = 0;
    }
    ctx.putImageData(img, 0, 0); t.refresh();
    scene.cache.bitmapFont.add(key, Phaser.GameObjects.RetroFont.Parse(scene, {
      image: key + '_tex', width: 8, height: 8, chars: Phaser.GameObjects.RetroFont.TEXT_SET1,
      charsPerRow: 16, spacing: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, lineSpacing: 0,
    }));
  }
}
export const txt = (scene, x, y, s, c = 'w') => scene.add.bitmapText(x, y, 'font_' + c, s, 8).setLetterSpacing(-1);
