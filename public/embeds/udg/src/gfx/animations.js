import { CHAR_SHEETS } from '../data/sheets.js';

export function buildAnimations(s) {
  const A = s.anims, fr = (...k) => k.map(key => ({ key }));
  for (const [sheet, def] of Object.entries(CHAR_SHEETS))
    for (const [key, a] of Object.entries(def.anims || {}))
      A.create({ key, frames: a.frames.map(frame => ({ key: sheet, frame })), frameRate: a.rate, repeat: -1 });
  A.create({ key: 'torch', frames: fr('torch0', 'torch1'), frameRate: 6, repeat: -1 });
  A.create({ key: 'stairs', frames: fr('stairs0', 'stairs1'), frameRate: 3, repeat: -1 });
}
