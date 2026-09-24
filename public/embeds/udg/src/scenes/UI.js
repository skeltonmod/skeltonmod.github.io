import { VW, VH, COL } from '../core/constants.js';
import { txt } from '../gfx/fonts.js';

export class UI extends Phaser.Scene {
  constructor() { super('ui'); }
  create() {
    this.g = this.add.graphics();
    this.tFloor = txt(this, 1, 1, '', 'c');
    this.tLv = txt(this, 22, 1, '', 'w');
    this.coin = this.add.image(0, 3, 'coin').setOrigin(0, 0);
    this.tGold = txt(this, 0, 1, '', 'w');
    this.tHp = txt(this, 1, 119, '', 'm');
    this.potIcon = this.add.image(82, 119, 'potion').setOrigin(0, 0);
    this.tPot = txt(this, 88, 119, '', 'w');
    this.orbIcon = this.add.image(100, 121, 'orb').setOrigin(0, 0);
    this.tMp = txt(this, 105, 119, '', 'c');
    this.g2 = this.add.graphics();
    this.tMsg = txt(this, 0, 104, '', 'w');
    this.overLines = [txt(this, 0, 44, 'you died', 'm'), txt(this, 0, 56, '', 'w'), txt(this, 0, 65, '', 'w'), txt(this, 0, 74, '', 'w'), txt(this, 0, 86, '', 'c')];
    this.overLines.forEach(t => t.setVisible(false));
    this.gw = this.add.graphics().setDepth(20);

    this.isTouch = this.sys.game.device.input.touch;
    this.btns = { A: { x: 116, y: 100, r: 8 }, B: { x: 100, y: 107, r: 7 }, P: { x: 118, y: 83, r: 6 } };
    this.btnTxt = {};
    if (this.isTouch) for (const k in this.btns) { const b = this.btns[k]; this.btnTxt[k] = txt(this, b.x - 3, b.y - 4, k, k === 'A' ? 'm' : k === 'B' ? 'c' : 'w'); }
    this.joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.input.on('pointerdown', ptr => {
      if (!ptr.wasTouch) return;
      const gs = this.gs(); if (!gs) return;
      if (gs.over) { gs.restartGame(); return; }
      for (const k in this.btns) { const b = this.btns[k]; if (Math.hypot(ptr.x - b.x, ptr.y - b.y) < b.r + 4) { gs['touch' + k] = true; return; } }
      if (this.joy.id === null && ptr.x < 88) Object.assign(this.joy, { id: ptr.id, ox: ptr.x, oy: ptr.y, x: ptr.x, y: ptr.y });
    });
    this.input.on('pointermove', ptr => {
      if (ptr.id !== this.joy.id) return;
      this.joy.x = ptr.x; this.joy.y = ptr.y;
      const gs = this.gs(), dx = ptr.x - this.joy.ox, dy = ptr.y - this.joy.oy;
      if (gs) gs.touchVec = Math.hypot(dx, dy) > 2 ? { x: dx, y: dy } : null;
    });
    const up = ptr => { if (ptr.id !== this.joy.id) return; this.joy.id = null; const gs = this.gs(); if (gs) gs.touchVec = null; };
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
  }
  gs() { const s = this.scene.get('game'); return s && s.p ? s : null; }

  update(time) {
    const gs = this.gs(); if (!gs) return;
    const p = gs.p, g = this.g; g.clear();
    g.fillStyle(COL.k).fillRect(0, 0, VW, 10);
    g.fillStyle(COL.c).fillRect(0, 10, VW, 1);
    g.fillStyle(COL.w).fillRect(0, 9, Math.round(VW * p.xp / p.next), 1);
    this.tFloor.setText('B' + gs.lvl);
    this.tLv.setText('Lv' + p.lv);
    this.tGold.setText('' + p.gold); this.tGold.x = VW - this.tGold.width;
    this.coin.x = this.tGold.x - 6;
    g.fillStyle(COL.c).fillRect(0, 116, VW, 1);
    g.fillStyle(COL.k).fillRect(0, 117, VW, 11);
    this.tHp.setText('' + p.hp);
    const bx = 22, bw = 56;
    g.fillStyle(COL.w).fillRect(bx, 118, bw, 6);
    g.fillStyle(COL.k).fillRect(bx + 1, 119, bw - 2, 4);
    const hw = Math.round((bw - 2) * Math.max(0, p.hp) / p.maxhp);
    const lowBlink = p.hp < p.maxhp * 0.3 && Math.floor(time / 200) % 2;
    g.fillStyle(lowBlink ? COL.w : COL.m).fillRect(bx + 1, 119, hw, 4);
    g.fillStyle(COL.w).fillRect(bx, 124, bw, 3);
    g.fillStyle(COL.k).fillRect(bx + 1, 125, bw - 2, 1);
    g.fillStyle(COL.c).fillRect(bx + 1, 125, Math.round((bw - 2) * p.mp / p.maxmp), 1);
    this.tPot.setText('' + p.potions);
    this.tMp.setText('' + p.mp);

    const g2 = this.g2; g2.clear();
    const show = gs.msgT > 0 && !gs.over;
    this.tMsg.setVisible(show);
    if (show) {
      this.tMsg.setText(gs.msgText); this.tMsg.x = Math.round((VW - this.tMsg.width) / 2);
      g2.fillStyle(COL.k).fillRect(this.tMsg.x - 2, 103, this.tMsg.width + 4, 10);
    }
    if (this.isTouch && !gs.over) {
      for (const k in this.btns) {
        const b = this.btns[k], pressed = gs['touch' + k];
        g2.fillStyle(COL.k).fillCircle(b.x, b.y, b.r);
        g2.fillStyle(pressed ? COL.w : (k === 'A' ? COL.m : k === 'B' ? COL.c : COL.w)).fillCircle(b.x, b.y, b.r);
        g2.fillStyle(COL.k).fillCircle(b.x, b.y, b.r - 1);
      }
      if (this.joy.id !== null) {
        g2.fillStyle(COL.c).fillCircle(this.joy.ox, this.joy.oy, 11); g2.fillStyle(COL.k).fillCircle(this.joy.ox, this.joy.oy, 10);
        const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy, l = Math.hypot(dx, dy), m = Math.min(l, 8) / (l || 1);
        g2.fillStyle(COL.w).fillCircle(Math.round(this.joy.ox + dx * m), Math.round(this.joy.oy + dy * m), 4);
      }
    }
    for (const k in this.btnTxt) this.btnTxt[k].setVisible(this.isTouch && !gs.over).setDepth(10);

    const ov = gs.over; this.overLines.forEach(t => t.setVisible(ov));
    if (ov) {
      g2.fillStyle(COL.m).fillRect(12, 38, 104, 60); g2.fillStyle(COL.k).fillRect(13, 39, 102, 58);
      const L = this.overLines;
      L[1].setText('on B' + gs.lvl + ' at lv' + p.lv); L[2].setText('kills ' + p.kills); L[3].setText('gold ' + p.gold);
      L[4].setText(this.isTouch ? 'tap to retry' : 'press r'); L[4].setVisible(Math.floor(time / 400) % 2 === 0);
      L.forEach(t => { t.x = Math.round((VW - t.width) / 2); });
      this.children.bringToTop(this.g2); L.forEach(t => this.children.bringToTop(t));
    }
    const gw = this.gw; gw.clear(); gw.fillStyle(COL.k);
    if (gs.descending) gw.fillRect(0, 0, VW, Math.min(16, Math.ceil(gs.wipe * 16)) * 8);
    else if (gs.reveal > 0) { const h = Math.ceil(gs.reveal / 0.35 * 16) * 8; gw.fillRect(0, VH - h, VW, h); }
    this.children.bringToTop(gw);
  }
}
