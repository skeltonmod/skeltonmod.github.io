import { COL } from "../core/constants.js";

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export const OUTLINE = { player: COL.c, enemy: COL.m };

export const outline = {
  addOutline(spr, color) {
    spr.outline = DIRS.map(([dx, dy]) =>
      this.add
        .image(0, 0, spr.texture.key, spr.frame.name)
        .setOrigin(spr.originX, spr.originY)
        .setTintFill(color)
        .setData("off", [dx, dy]),
    );
    return spr;
  },

  syncOutline(spr) {
    if (!spr.outline) return;
    for (const o of spr.outline) {
      const [dx, dy] = o.getData("off");
      o.setTexture(spr.texture.key, spr.frame.name)
        .setPosition(spr.x + dx, spr.y + dy)
        .setFlipX(spr.flipX)
        .setRotation(spr.rotation)
        .setVisible(spr.visible)
        .setDepth(spr.depth - 0.001);
    }
  },

  killOutline(spr) {
    if (spr.outline) spr.outline.forEach((o) => o.destroy());
    spr.outline = null;
  },
};
