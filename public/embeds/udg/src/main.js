import { VW, VH } from './core/constants.js';
import { Boot } from './scenes/Boot.js';
import { Title } from './scenes/Title.js';
import { Game } from './scenes/Game.js';
import { UI } from './scenes/UI.js';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: VW, height: VH,
  backgroundColor: '#000000',
  pixelArt: true, roundPixels: true, antialias: false,
  input: { activePointers: 3 },
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Title, Game, UI],
});

function fit() {
  const s = Math.max(1, Math.floor(Math.min(window.innerWidth, window.innerHeight) / VH));
  game.scale.setZoom(4);
}

window.addEventListener('resize', fit);
game.events.once('ready', fit);
window.game = game;
