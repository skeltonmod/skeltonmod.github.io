var W = 192, H = 192, HUDW = 16, HUDH = 12;
var CW = W + HUDW;          
var CH = H + HUDH;

var SOUND_DIR = 'soundforlum/';
      var soundEnabled = true;
      try { soundEnabled = window.localStorage.getItem('lumcorr.sound') !== 'off'; } catch (e) {}


var SFX_DEFS = {
  bolt:      { file: 'shooting/', count: 6, volume: 0.5 },
  crystal:   { file: 'crystal/',  count: 5 },
  die:       { file: 'die/',      count: 3 },
  impact:    { file: 'explode/',  count: 5 },
  starfish:  { file: 'starfish/', count: 5 },
  crying:    { file: 'crying/',   count: 4 },
  cutscene:  { file: 'cutscene' },
  playerdie: { file: 'playerdie' },
  enemyfire: { file: 'enemyfire' },
  eating:    { file: 'eating' },
  fluttery:  { file: 'fluttery' }
};
var MUSIC_DEFS = { intro: 'intro.mp3', level1: 'level1.mp3', level2: 'level2.mp3', cut: 'cut.mp3', end: 'end.mp3' };
var sfx = {}, music = {}, sfxLast = {};
var currentMusic = null, wantedMusic = null;


var MAX_VOICES = 8;
var audioCtx = null, sfxGain = null, activeVoices = 0;
var sfxBuffers = {};     
var sfxVolume = {};      
var sfxFallback = {};    

function markBroken(e) {
  var a = (e && e.target) ? e.target : this;
  if (a) a.broken = true;
}

function safePlay(a) {
  if (!a || a.broken) return;
  try {
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  } catch (err) {}
}

function initAudioContext() {
  if (audioCtx !== null) return audioCtx || null;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { audioCtx = false; return null; }
  try {
    audioCtx = new AC();
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 1;
    sfxGain.connect(audioCtx.destination);
  } catch (e) { audioCtx = false; return null; }
  return audioCtx;
}

function decodeSfx(name, index, url) {
  window.fetch(url)
    .then(function (r) { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
    .then(function (raw) {
      return new Promise(function (resolve, reject) {
        
        var p = audioCtx.decodeAudioData(raw, resolve, reject);
        if (p && p.then) p.then(resolve, reject);
      });
    })
    .then(function (buffer) { sfxBuffers[name][index] = buffer; })
    .catch(function () { sfxBuffers[name][index] = null; });
}



function makeFallbackVoices(url, volume) {
  var voices = [], i, a;
  for (i = 0; i < 3; i++) {
    a = new Audio(url);
    a.preload = 'auto';
    a.onerror = markBroken;
    a.volume = volume;
    voices.push(a);
  }
  return { voices: voices, next: 0 };
}

function loadSounds() {
  var name, d, n, i, url, a;
  var ctx = initAudioContext();
  var useWebAudio = !!ctx && typeof window.fetch === 'function';

  for (name in SFX_DEFS) {
    d = SFX_DEFS[name]; n = d.count || 1;
    sfxVolume[name] = d.volume || 1;
    sfxBuffers[name] = new Array(n);
    if (!useWebAudio) sfxFallback[name] = [];
    for (i = 0; i < n; i++) {
      url = SOUND_DIR + d.file + (d.count ? i : '') + '.wav';
      if (useWebAudio) { sfxBuffers[name][i] = undefined; decodeSfx(name, i, url); }
      else sfxFallback[name].push(makeFallbackVoices(url, sfxVolume[name]));
    }
  }

  for (name in MUSIC_DEFS) {
    a = new Audio();
    a.loop = true;
    a.preload = 'none';            
    a.onerror = markBroken;
    a.trackSrc = SOUND_DIR + MUSIC_DEFS[name];
    music[name] = a;
  }
}

function playSfx(name) {
  if (!soundEnabled || attractMode) return;
  if (sfxLast[name] !== undefined && clock - sfxLast[name] < 3) return;

  var list = sfxBuffers[name];
  if (!list) return;
  sfxLast[name] = clock;

  var fb = sfxFallback[name];
  if (fb) {
    var ring = fb[randomInt(fb.length)];
    var voice = ring.voices[ring.next];
    ring.next = (ring.next + 1) % ring.voices.length;
    if (voice.broken) return;
    try { voice.currentTime = 0; } catch (e) {}
    safePlay(voice);
    return;
  }

  if (!audioCtx || activeVoices >= MAX_VOICES) return;
  if (audioCtx.state === 'suspended') return;

  
  var n = list.length, start = randomInt(n), buffer = null, i;
  for (i = 0; i < n; i++) {
    buffer = list[(start + i) % n];
    if (buffer) break;
    buffer = null;
  }
  if (!buffer) return;

  try {
    var src = audioCtx.createBufferSource();
    src.buffer = buffer;
    var g = audioCtx.createGain();
    g.gain.value = sfxVolume[name];
    src.connect(g);
    g.connect(sfxGain);
    activeVoices++;
    src.onended = function () {
      activeVoices--;
      try { src.disconnect(); g.disconnect(); } catch (e) {}
    };
    src.start(0);
  } catch (e) { activeVoices--; }
}

function playMusic(name) {
  wantedMusic = name;
  var track = music[name] || null;
  if (!soundEnabled) return;
  if (track && track === currentMusic && !track.paused) return;
  if (currentMusic && currentMusic !== track) currentMusic.pause();
  currentMusic = track;
  if (!track || track.broken) return;
  if (!track.src) { track.src = track.trackSrc; track.load(); }
  try { track.currentTime = 0; } catch (e) {}
  safePlay(track);
}

function levelTrack() {
  var areas = 0;
  for (var i = 1; i <= wave && i < SETTING_ORDER.length; i++) if (SETTING_ORDER[i] === 'intermission') areas++;
  return areas % 2 === 0 ? 'level1' : 'level2';
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  try { window.localStorage.setItem('lumcorr.sound', soundEnabled ? 'on' : 'off'); } catch (e) {}
  if (!soundEnabled) { if (currentMusic) currentMusic.pause(); }
  else if (wantedMusic) { currentMusic = null; playMusic(wantedMusic); }
}

function resumeAudio() {
  if (!soundEnabled) return;
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(function () {});
  if (currentMusic && currentMusic.paused && !currentMusic.broken) safePlay(currentMusic);
}
window.addEventListener('keydown', resumeAudio);
window.addEventListener('pointerdown', resumeAudio);
window.addEventListener('touchstart', resumeAudio);

function randomInt(max) { return Math.floor(Math.random() * max); }
function randomIntIn(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function randomIn(a, b) { return a + Math.random() * (b - a); }
function randomFloat(r) { return Math.random() * r; }
function jitter(c, r) { return c + (Math.random() * 2 - 1) * r; }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function randomColor() { return [randomInt(256), randomInt(256), randomInt(256)]; }

function blankRule() {
  var r = [], i, j;
  for (i = 0; i < 9; i++) { r[i] = []; for (j = 0; j < 9; j++) r[i][j] = 3; }
  return r;
}
function swap01(input) {
  var s = blankRule(), out = blankRule(), ones, twos, n, zeroes;
  for (ones = 0; ones < 9; ones++) for (twos = 0; twos < 9; twos++) {
    n = input[ones][twos];
    if (n === 1) n = 0; else if (n === 0) n = 1;
    s[ones][twos] = n;
  }
  for (ones = 0; ones < 9; ones++) for (twos = 0; twos < 9; twos++) {
    zeroes = 8 - (twos + ones);
    if (zeroes >= 0) out[ones][twos] = s[zeroes][twos];
  }
  return out;
}
function swap02(input) {
  var s = blankRule(), out = blankRule(), ones, twos, n, zeroes;
  for (ones = 0; ones < 9; ones++) for (twos = 0; twos < 9; twos++) {
    n = input[ones][twos];
    if (n === 2) n = 0; else if (n === 0) n = 2;
    s[ones][twos] = n;
  }
  for (ones = 0; ones < 9; ones++) for (twos = 0; twos < 9; twos++) {
    zeroes = 8 - (twos + ones);
    if (zeroes >= 0) out[ones][twos] = s[ones][zeroes];
  }
  return out;
}


var RULES = {
  wastelands: swap02([[2,0,0,0,3,3,2,3,3],[0,0,3,3,2,1,2,3,3],[0,0,0,2,1,2,3,1,0],[1,3,2,1,0,0,0,2,2],[0,0,3,2,3,3,3,3,3],[0,0,2,3,2,3,0,0,1],[1,3,3,3,3,1,3,2,3],[0,3,0,3,0,0,2,1,3],[0,0,1,0,0,2,3,1,0]]),
  coral:      [[3,3,2,2,0,1,2,2,1],[2,0,2,1,2,0,2,2,2],[1,3,2,3,2,2,3,0,0],[1,2,0,0,3,3,2,0,0],[2,2,3,2,3,1,1,2,3],[1,3,1,1,0,0,3,1,0],[1,3,1,0,0,3,0,2,2],[1,1,2,3,2,1,3,1,3],[1,1,2,3,1,1,1,1,0]],
  ironCastle: swap02([[3,2,1,1,2,2,3,3,2],[0,2,2,2,3,3,0,2,0],[1,3,2,0,0,0,0,0,1],[3,3,0,0,0,0,1,0,3],[1,0,0,3,3,2,1,2,3],[3,3,1,3,1,1,1,2,0],[0,2,1,3,0,1,2,2,3],[3,3,2,1,0,2,1,2,1],[0,0,2,2,2,0,3,3,1]]),
  something:  swap01([[2,3,2,3,2,1,3,1,2],[3,0,2,2,2,3,3,3,0],[2,2,0,3,3,2,3,1,0],[3,2,2,2,3,0,0,3,1],[0,1,2,2,1,3,0,2,3],[1,0,3,3,0,1,3,2,3],[3,1,1,3,3,3,0,3,2],[2,1,0,2,3,0,2,1,1],[1,2,0,1,2,3,1,0,2]]),
  castle:     [[2,2,1,0,2,3,1,2,3],[3,1,1,0,1,1,0,3,0],[0,3,1,3,3,1,3,3,2],[3,2,3,1,3,3,2,1,1],[3,1,3,3,3,0,2,3,3],[0,1,2,3,1,0,3,3,0],[3,2,2,3,2,0,3,0,1],[0,1,1,2,0,2,1,1,0],[1,1,1,0,3,3,1,0,0]],
  psiStorm:   [[3,1,3,0,2,0,0,2,2],[1,1,0,0,3,0,1,2,0],[0,2,1,1,1,1,2,3,0],[3,0,1,1,3,1,3,3,2],[0,0,1,1,3,0,0,2,2],[3,3,3,2,3,2,1,1,2],[1,1,3,0,0,3,3,1,1],[1,3,2,1,1,1,1,2,0],[1,3,2,0,2,1,0,3,2]],
  burning:    swap01(swap02([[3,0,3,1,0,1,2,3,1],[0,0,1,2,1,2,3,3,2],[0,0,2,0,1,0,3,1,0],[3,1,3,0,1,1,3,1,0],[1,1,3,1,1,2,1,0,2],[0,3,2,1,1,1,2,2,3],[3,3,3,2,3,1,2,1,3],[1,1,3,3,3,1,1,0,3],[3,1,3,2,2,2,0,3,3]])),
  chasm:      swap02([[0,1,2,3,1,0,0,3,2],[3,1,3,1,1,3,3,3,1],[0,3,1,1,2,2,2,3,0],[0,0,1,3,2,2,3,3,3],[3,1,0,1,2,3,0,3,3],[1,3,3,3,0,0,3,0,1],[3,1,2,1,2,2,0,0,3],[0,0,0,1,3,2,1,0,1],[1,2,3,2,1,3,1,0,2]])
};

var EFFECT_RULE = [[0,3,3,1,2,3,3,3,2],[0,0,0,1,2,0,0,0,2],[0,0,1,3,3,3,2,1,1],[0,0,3,0,3,0,3,0,2],[0,1,2,2,1,0,2,2,0],[1,3,1,3,3,2,1,2,2],[1,2,1,1,1,1,2,2,0],[3,1,0,0,1,3,2,3,0],[2,1,3,1,3,3,0,1,1]];

var CHAR0 = 'PSI GUY';

var ILLUSTRATED_LISTS = [
  { title: 'bestiary', items: [
    [8, 'SKELETOID', 'sometimes feels lost'], [12, 'REPLETE', 'fiery disposition'],
    [16, 'SHY EYE', 'a real wallflower'], [32, 'STARFISH', 'makes starfish'],
    [36, 'lowercase starfish', 'attacks in groups'], [42, 'SOWER', 'sows new cells'],
    [44, 'CHEW CHEW', 'chews you']] },
  { title: 'bestiary', items: [
    [80, 'SHUTTLE', 'brings presents'], [38, 'SEEKER', 'explodes when shot'],
    [66, 'TURRET', 'territorial'], [18, 'EATER', 'insatiable appetite'],
    [20, 'THE BLOB', 'lays eggs'], [22, 'EGG', 'what will it become?']] },
  { title: 'the good stuff', items: [
    [24, 'CRYSTAL', 'resonant psi matrix. the CRYSTALS were stolen, and must be reclaimed if there is ever to be order in the land.'],
    [78, CHAR0, 'has powerful psionic powers and a very handsome moustache.'],
    [6, 'EXTRA LIFE', 'soul transference device']] }
];

var SETTINGS = {
  'wastelands':   { rule: 'wastelands', empty: 0, damage: 2, boltRadius: 3,  sowerRange: 10, minCells: 5000,  maxCells: 7000,  clearing: 68 },
  'coral forest': { rule: 'coral',      empty: 1, damage: 2, boltRadius: 2,  sowerRange: 16, minCells: 3000,  maxCells: 3500,  clearing: 68 },
  'iron castle':  { rule: 'ironCastle', empty: 0, damage: 2, boltRadius: 4,  sowerRange: 10, minCells: 3000,  maxCells: 3500,  clearing: 68 },
  'something':    { rule: 'something',  empty: 0, damage: 2, boltRadius: 4,  sowerRange: 10, minCells: 5000,  maxCells: 7000,  clearing: 68 },
  'castle':       { rule: 'castle',     empty: 2, damage: 1, boltRadius: 6,  sowerRange: 6,  minCells: 750,   maxCells: 1000,  clearing: 96 },
  'psi storm':    { rule: 'psiStorm',   empty: 2, damage: 0, boltRadius: 7,  sowerRange: 10, minCells: 2000,  maxCells: 6000,  clearing: 68 },
  'the burning lands': { rule: 'burning', empty: 2, damage: 0, boltRadius: 4, sowerRange: 12, minCells: 15000, maxCells: 16000, clearing: 70 },
  'chasm of psychic rocks': { rule: 'chasm', empty: 2, damage: 1, boltRadius: 4, sowerRange: 10, minCells: 6000, maxCells: 8000, clearing: 68 },
  'walls':        { rule: 'castle',     empty: 2, damage: 1, boltRadius: 6,  sowerRange: 6,  minCells: 750,   maxCells: 1000,  clearing: 96 },
  'ready?':       { rule: 'wastelands', empty: 0, damage: 2, boltRadius: 3,  sowerRange: 10, minCells: 5000,  maxCells: 7000,  clearing: 68 },
  'attract':      { rule: 'castle',     empty: 2, damage: 1, boltRadius: 6,  sowerRange: 6,  minCells: 750,   maxCells: 1000,  clearing: 96 },
  'intermission': { rule: 'castle',     empty: 2, damage: 1, boltRadius: 6,  sowerRange: 6,  minCells: 750,   maxCells: 1000,  clearing: 96 }
};

var SETTING_ORDER = ['attract','ready?','wastelands','wastelands','wastelands','intermission',
  'iron castle','iron castle','iron castle','intermission','coral forest','coral forest',
  'coral forest','intermission','something','something','something','intermission',
  'intermission','castle','walls'];

var WAVE_NAME = ['attract mode','collect the psi crystals. safety not guaranteed','the coral forest','the coral forest',
  'the coral forest', CHAR0 + ' trains hard to be as heroic as possible','psi storm',
  'they have all been cocooned! but what will they become?','the castle','the burning lands',
  'the luminous corridor'];

var RESET_CELLS = [false,false,true,false,false,true,true,false,false,true,true,false,false,true,true,false];
var PAUSE_FOR_NAME = [false,true,true,false,false,true,false,true,true,false,true];
var WAVE_CUTSCENE_IMAGE = [0,0,0,0,0,1,0,2,0,3];

var blues = [[144,237,246],[0,117,118],[7,9,25]];
var purples = [[255,31,255],[146,2,126],[77,4,56]];
var coral0 = [[127,255,254],[69,2,48],[127,255,244]];
var coral1 = [[235,217,108],[62,49,42],[255,0,66]];
var purpleCoral = [[146,2,126],[77,4,56],[255,31,255]];
var orangeCoral = [[236,202,128],[0,0,0],[236,120,50]];
var castle0 = [[127,255,254],[64,128,0],[127,255,244]];
var castle1 = [[127,255,254],[128,0,111],[254,46,55]];
var reds = [[104,199,142],[40,106,107],[116,3,53]];
var menuColor = [[28,68,62],[28,68,62],[14,246,146]];

function waveColorFor(w) {
  var table = [null,null,coral0,coral1,purpleCoral,null,castle0,castle1,purpleCoral,null,
               orangeCoral,reds,coral0,null,coral1,null,purpleCoral,blues,null,blues,purples];
  var c = table[Math.min(table.length - 1, w)];
  if (c) return [c[0].slice(), c[1].slice(), c[2].slice()];
  return [randomColor(), randomColor(), randomColor()];
}

var TIPS = [
  "carve escape routes ahead of time! you never know when you'll need them",
  "you can delay waves of monsters by leaving a few starfish alive",
  "STARFISH need to eat cells to make starfish. a starving STARFISH cannot reproduce.",
  "when " + CHAR0 + " dies, his eyes fill with tears. this makes powerful psi-waves which destroy all bullets in the world.",
  "crystals explode when shot, taking enemies with them. a few carefully sacrificed crystals can be a big help.",
  "you can defuse a detonating crystal by picking it up! safety not guaranteed.",
  "try looping around the world's edges to escape an explosion",
  "drag a little to creep without firing. crystals don't like being shot at.",
];


var grid = new Uint8Array(W * H);       
var gridScratch = new Uint8Array(W * H);
var fxGrid = new Uint8Array(W * H);     
var fxScratch = new Uint8Array(W * H);
var changeTime = new Int32Array(W * H);

var rule = RULES.castle;
var emptyState = 2, damageState = 1;
var color = [[0,0,0],[255,0,255],[255,175,200]];
var effectColor = [[0,255,0],[218,0,15],[255,89,31]];
var explosionTimer = 0;
var liveCellCount = 0;

var clock = 0;
var antiflicker = true;

function applyRuleLooping(src, dst, r, track) {
  var x, y, ones, twos, v, o, cur, i;
  var rowUp, rowMid, rowDn, xl, xr, rr;
  for (y = 0; y < H; y++) {
    rowUp = ((y - 1 + H) % H) * W;
    rowMid = y * W;
    rowDn = ((y + 1) % H) * W;
    for (x = 0; x < W; x++) {
      xl = (x - 1 + W) % W; xr = (x + 1) % W;
      ones = 0; twos = 0;
      v = src[rowUp + xl]; if (v === 1) ones++; else if (v === 2) twos++;
      v = src[rowUp + x];  if (v === 1) ones++; else if (v === 2) twos++;
      v = src[rowUp + xr]; if (v === 1) ones++; else if (v === 2) twos++;
      v = src[rowMid + xl]; if (v === 1) ones++; else if (v === 2) twos++;
      v = src[rowMid + xr]; if (v === 1) ones++; else if (v === 2) twos++;
      v = src[rowDn + xl]; if (v === 1) ones++; else if (v === 2) twos++;
      v = src[rowDn + x];  if (v === 1) ones++; else if (v === 2) twos++;
      v = src[rowDn + xr]; if (v === 1) ones++; else if (v === 2) twos++;
      rr = r[ones];
      o = rr[twos];
      i = rowMid + x;
      cur = src[i];
      if (o === 3) { dst[i] = cur; }
      else {
        dst[i] = o;
        if (track && o !== cur) changeTime[i] = clock;
      }
    }
  }
}

function stepTerrain() {
  applyRuleLooping(grid, gridScratch, rule, true);
  var t = grid; grid = gridScratch; gridScratch = t;
}
function stepEffectLayer() {
  applyRuleLooping(fxGrid, fxScratch, EFFECT_RULE, false);
  var t = fxGrid; fxGrid = fxScratch; fxScratch = t;
}


function clearRegion(x, y, radius) {
  var cx = Math.floor(x), cy = Math.floor(y), oX, oY, tx, ty;
  for (oY = cy - radius; oY <= cy + radius; oY++) {
    ty = (oY % H + H) % H;
    for (oX = cx - radius; oX <= cx + radius; oX++) {
      tx = (oX % W + W) % W;
      grid[ty * W + tx] = emptyState;
    }
  }
}
function addNoiseToRegion(x, y, radius) {
  var cx = Math.floor(x), cy = Math.floor(y), oX, oY, tx, ty;
  for (oY = -radius; oY <= radius; oY++) {
    ty = ((cy + oY) % H + H) % H;
    for (oX = -radius; oX <= radius; oX++) {
      tx = ((cx + oX) % W + W) % W;
      grid[ty * W + tx] = randomInt(3);
    }
  }
}

function noiseBurst(x, y, radius) {
  var left = Math.floor(x - radius), top = Math.floor(y - radius);
  var right = Math.floor(x + radius), bottom = Math.floor(y + radius), px, py;
  for (py = top; py < bottom; py++) {
    if (py < 0 || py >= H) continue;
    for (px = left; px < right; px++) {
      if (px < 0 || px >= W) continue;
      fxGrid[py * W + px] = randomIntIn(1, 2);
    }
  }
  explosionTimer = 64;
}
function makeWallRectangle(l, t, w, h) {
  var left = Math.floor(l), top = Math.floor(t);
  var right = Math.floor(l + w), bottom = Math.floor(t + h), x, y;
  for (y = top; y < bottom; y++) {
    if (y < 0 || y >= H) continue;
    for (x = left; x < right; x++) {
      if (x < 0 || x >= W) continue;
      grid[y * W + x] = randomIntIn(0, 2);
    }
  }
}

function cleanArea(x, y, radius) {
  var cx = Math.floor(x), cy = Math.floor(y);
  var oX, oY, bx, by, ones, twos, x2, y2, tx, ty, v, i;
  for (oY = cy - radius; oY <= cy + radius; oY++) {
    by = (oY % H + H) % H;
    for (oX = cx - radius; oX <= cx + radius; oX++) {
      bx = (oX % W + W) % W;
      ones = 0; twos = 0;
      for (x2 = -1; x2 <= 1; x2++) for (y2 = -1; y2 <= 1; y2++) {
        if (x2 === 0 && y2 === 0) continue;
        tx = (bx + x2 + W) % W; ty = (by + y2 + H) % H;
        v = grid[ty * W + tx];
        if (v === 1) ones++; else if (v === 2) twos++;
      }
      i = by * W + bx;
      if (grid[i] !== emptyState && (ones + twos) <= 1) grid[i] = emptyState;
    }
  }
}
function isRectangleSolid(x, y, sizeX, sizeY) {
  var oX, oY, tx, ty;
  for (oY = -sizeY; oY <= sizeY; oY++) {
    ty = Math.floor(y + oY);
    if (ty < 0 || ty >= H) continue;
    for (oX = -sizeX; oX <= sizeX; oX++) {
      tx = Math.floor(x + oX);
      if (tx < 0 || tx >= W) continue;
      if (grid[ty * W + tx] !== emptyState) return true;
    }
  }
  return false;
}


var TW = 9, TH = 9;
var wallTemplate = [];
function initializeTemplate() {
  var i, j;
  wallTemplate = [];
  for (i = 0; i < TW; i++) { wallTemplate[i] = []; for (j = 0; j < TH; j++) wallTemplate[i][j] = Math.random() < 0.5; }
}
function templateRect(l, t, w, h, type) {
  var x, y;
  for (y = t; y <= t + h - 1; y++) for (x = l; x <= l + w - 1; x++) {
    if (wallTemplate[x]) wallTemplate[x][y] = type;
  }
}
function resetStates() {
  var x, y, cw, ch;
  explosionTimer = 64;
  for (x = 0; x < W * H; x++) { grid[x] = emptyState; fxGrid[x] = 0; }
  cw = W / TW; ch = H / TH;
  for (y = 0; y < TH; y++) for (x = 0; x < TW; x++) {
    if (wallTemplate[x] && wallTemplate[x][y]) makeWallRectangle(x * cw, y * ch, cw, ch);
  }
}
function resetTimers() { for (var i = 0; i < W * H; i++) changeTime[i] = clock; }
function resetCellGrid() {
  initializeTemplate();
  templateRect(0, 0, TW, 1, false);
  templateRect(0, 0, 1, TH, false);
  templateRect(0, TH - 1, TW, 1, false);
  templateRect(TW - 1, 0, 1, TH, false);
  templateRect(3, 3, TW - 6, TH - 6, false);
  resetTimers();
  resetStates();
}


var game = null;
var caBmd = null;          
var imgData = null, pdata = null;

function initPixelLayer() {
  caBmd = game.make.bitmapData(W, H);
  imgData = caBmd.context.createImageData(W, H);
  pdata = imgData.data;
  for (var i = 3; i < pdata.length; i += 4) pdata[i] = 255;
}
function setPixel(x, y, r, g, b) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  var i = (y * W + x) * 4;
  pdata[i] = r; pdata[i + 1] = g; pdata[i + 2] = b;
}
function drawRectangleOutline(l, t, rgt, btm, r, g, b) {
  var x, y;
  t = Math.max(0, t); btm = Math.min(H - 1, btm);
  l = Math.max(0, l); rgt = Math.min(W - 1, rgt);
  for (y = t; y <= btm; y++) { setPixel(l, y, r, g, b); setPixel(rgt, y, r, g, b); }
  for (x = l; x <= rgt; x++) { setPixel(x, t, r, g, b); setPixel(x, btm, r, g, b); }
}
function drawFilledRect(l, t, rgt, btm, r, g, b) {
  var x, y;
  t = Math.max(0, t); btm = Math.min(H - 1, btm);
  l = Math.max(0, l); rgt = Math.min(W - 1, rgt);
  for (y = t; y <= btm; y++) for (x = l; x <= rgt; x++) setPixel(x, y, r, g, b);
}


function drawCells() {
  var x, y, i, c, pi;
  if (antiflicker) {
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if ((clock - changeTime[i]) > 2) {
        c = color[grid[i]]; pi = i * 4;
        pdata[pi] = c[0]; pdata[pi + 1] = c[1]; pdata[pi + 2] = c[2];
      }
    }
  } else {
    for (i = 0; i < W * H; i++) {
      c = color[grid[i]]; pi = i * 4;
      pdata[pi] = c[0]; pdata[pi + 1] = c[1]; pdata[pi + 2] = c[2];
    }
  }
}
function drawEffectLayer() {
  var i, c, pi, v;
  for (i = 0; i < W * H; i++) {
    v = fxGrid[i];
    if (v !== 0) { c = effectColor[v]; pi = i * 4; pdata[pi] = c[0]; pdata[pi + 1] = c[1]; pdata[pi + 2] = c[2]; }
  }
}
function flushPixels() { caBmd.context.putImageData(imgData, 0, 0); caBmd.dirty = true; }

var sheetData = null, SHEET_W = 64, sheetCols = 8;
function captureSheetPixels(img) {
  var c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  var cx = c.getContext('2d');
  cx.drawImage(img, 0, 0);
  sheetData = cx.getImageData(0, 0, img.width, img.height).data;
  SHEET_W = img.width;
  sheetCols = Math.floor(img.width / SPRITE_SIZE);
}
function blitSprite(frame, cxf, cyf) {
  if (!sheetData) return;
  var sx = (frame % sheetCols) * SPRITE_SIZE, sy = Math.floor(frame / sheetCols) * SPRITE_SIZE;
  var dx0 = Math.floor(cxf - SPRITE_HALF), dy0 = Math.floor(cyf - SPRITE_HALF);
  var x, y, si, di, dx, dy;
  for (y = 0; y < SPRITE_SIZE; y++) {
    dy = dy0 + y; if (dy < 0 || dy >= H) continue;
    for (x = 0; x < SPRITE_SIZE; x++) {
      dx = dx0 + x; if (dx < 0 || dx >= W) continue;
      si = ((sy + y) * SHEET_W + (sx + x)) * 4;
      if (sheetData[si + 3] === 0) continue;
      di = (dy * W + dx) * 4;
      pdata[di] = sheetData[si]; pdata[di + 1] = sheetData[si + 1]; pdata[di + 2] = sheetData[si + 2];
    }
  }
}


var effects = [];

function Puff(x, y, radius, r, g, b) {
  this.x = x; this.y = y; this.r = r; this.g = g; this.b = b;
  this.timer = Math.floor(2 * radius); this.remove = false; this.kind = 'puff';
}
Puff.prototype.step = function () { if (--this.timer <= 0) this.remove = true; };
Puff.prototype.draw = function () {
  var cx = Math.floor(this.x), cy = Math.floor(this.y);
  var radius = Math.floor(0.25 * this.timer), count = radius * radius, p;
  for (p = 0; p < count; p++) setPixel(Math.floor(jitter(this.x, radius)), Math.floor(jitter(this.y, radius)), this.r, this.g, this.b);
  var rr = Math.max(0, radius - 1);
  drawRectangleOutline(cx - rr, cy - rr, cx + rr, cy + rr, this.r, this.g, this.b);
};

function ShrinkingRectangle(target, radius, r, g, b) {
  this.target = target; this.x = target.px; this.y = target.py;
  this.r = r; this.g = g; this.b = b;
  this.timer = Math.floor(radius / 2); this.delay = 0; this.remove = false; this.kind = 'ring';
}
ShrinkingRectangle.prototype.step = function () {
  if (this.delay > 0) { this.delay--; return; }
  if (--this.timer <= 0) this.remove = true;
  if (this.target && !this.target.remove) { this.x = this.target.px; this.y = this.target.py; }
};
ShrinkingRectangle.prototype.draw = function () {
  if (this.delay > 0) return;
  var cx = Math.floor(this.x), cy = Math.floor(this.y), rr = 2 * this.timer;
  drawRectangleOutline(cx - rr, cy - rr, cx + rr, cy + rr, this.r, this.g, this.b);
};

function WarningRectangle(l, t, r, b, duration) {
  this.left = l; this.top = t; this.right = r; this.bottom = b;
  this.x = (r + l) / 2; this.y = (b + t) / 2;
  this.waitWhileNeeded = false; this.needed = true;
  this.timer = duration; this.duration = duration; this.remove = false; this.kind = 'warn';
}
WarningRectangle.prototype.step = function () {
  this.timer--;
  if (this.waitWhileNeeded) { if (!this.needed) this.remove = true; }
  else if (this.timer <= 0) this.remove = true;
  if (this.timer < -32) this.remove = true;
};
WarningRectangle.prototype.draw = function () {
  var blend = Math.min(1, (this.duration - this.timer) / 8);
  var cl = Math.floor(Math.max(0, lerp(this.x, this.left, blend)));
  var ct = Math.floor(Math.max(0, lerp(this.y, this.top, blend)));
  var cr = Math.floor(Math.min(W - 1, lerp(this.x, this.right, blend)));
  var cb = Math.floor(Math.min(H - 1, lerp(this.y, this.bottom, blend)));
  var x, y;
  for (y = ct; y <= cb; y++) for (x = cl; x <= cr; x++) {
    if (grid[y * W + x] === emptyState) setPixel(x, y, 92, 0, 4);
    else setPixel(x, y, 255, 0, 255);
  }
};

function addEffect(e) { effects.push(e); return e; }

var explosionGroup = null;

function setFrame(s, f) {
  if (s.frame !== f) s.frame = f;
}

function spawnExplosion(x, y, delay) {
  var s = explosionGroup.getFirstDead(true, Math.floor(x), Math.floor(y), 'explosions', 12);
  s.anchor.set(0.5);
  s.reset(Math.floor(x), Math.floor(y));
  s.exTimer = 16; s.exDelay = delay || 0; setFrame(s, EXPLOSION_FRAME0);
  return s;
}
function stepExplosions() {
  explosionGroup.forEachAlive(function (s) {
    if (s.exDelay > 0) { s.exDelay--; s.visible = false; return; }
    s.visible = true;
    s.exTimer--;
    setFrame(s, EXPLOSION_FRAME0 + clamp(Math.floor((16 - s.exTimer) / 4), 0, 3));
    if (s.exTimer <= 0) s.kill();
  });
}

var entities = [];
var entityGroup = null;
var playerCharacter = null;
var playerActive = false, respawnPlayer = false, respawnAllowed = true;

var enemyCount = 0, previousEnemyCount = 0;
var enemyProjectileCount = 0, previousEnemyProjectileCount = 0;
var cellRegulatorCount = 0, explosionCount = 0;
var desiredEnemyCount = 50, desiredEnemyProjectileCount = 10;
var crystalsEarned = 0, crystalSpawnTimer = 0;
var noBulletTimer = 0;
var score = 0, lives = -1, deaths = 3, extraLifeCounter = 0, scoreTimer = 0;
var boltTimer = 0;

var playerBoltBlastRadius = 4, playerBoltBlastEffectRadius = 4;
var monsterBoltRadius = 2;
var sowerRange = 16;
var minimumLiveCellCount = 750, maximumLiveCellCount = 1000;
var starfishBroodLimit = 6;
var skeletoidsCircleWalls = true;

function Ent(x, y, frame) {
  Phaser.Sprite.call(this, game, Math.floor(x), Math.floor(y), 'sprites', frame);
  this.anchor.set(0.5);
  this.px = x; this.py = y;
  this.spriteBase = frame;
  this.remove = false;
  this.sizeX = 2; this.sizeY = 2;
  this.velocityX = 0; this.velocityY = 0;
  this.integrity = 1; this.energy = 0; this.scoreValue = 0;
  this.damageTimer = 0; this.jiggly = false;
  this.hasEntered = false; this.projectile = false;
  this.type = 'entity';
  this.animated = true;
}
Ent.prototype = Object.create(Phaser.Sprite.prototype);
Ent.prototype.constructor = Ent;

Ent.prototype.sync = function () {
  var jx = 0, jy = 0;
  if (this.jiggly) { jx = randomIntIn(-1, 1); jy = randomIntIn(-1, 1); }
  this.x = Math.floor(this.px) + jx;
  this.y = Math.floor(this.py) + jy;
  setFrame(this, this.spriteBase + (this.animated ? (Math.floor(clock / 7) % 2) : 0));
  this.tint = this.damageTimer > 0 ? 0xff00ff : 0xffffff;
};
Ent.prototype.damage = function () { };
Ent.prototype.step = function () { };

function damageSimple(amount) {
  this.damageTimer = 4;
  this.integrity -= amount;
  this.energy += 12 * amount;
  addEffect(new Puff(this.px, this.py, 4, 255, 0, 255));
  if (this.integrity <= 0 && !this.remove) {
    if (this.notifyRemove) this.notifyRemove();
    this.remove = true;
    if (!isNaN(this.scoreValue)) { crystalsEarned += this.scoreValue; crystalSpawnTimer = 16; }
    spawnExplosion(this.px, this.py, 0);
    playSfx('die');
  }
}
function damageExplodingProjectile(amount) {
  this.damageTimer = 4;
  this.integrity -= amount;
  addEffect(new Puff(this.px, this.py, 4, 255, 0, 255));
  if (this.integrity <= 0 && !this.remove) {
    this.remove = true;
    playSfx('playerdie');
    crystalsEarned += this.scoreValue; crystalSpawnTimer = 16;
    spawnExplosion(this.px, this.py, 0);
    playSfx('impact');
    noiseBurst(this.px, this.py, 6);
    var i, a;
    for (i = 0; i < 8; i++) {
      a = i * 2 * Math.PI / 8;
      addEntity(new MonsterBolt(this.px, this.py, this.px + Math.cos(a), this.py + Math.sin(a)));
    }
  }
}
function damagePlayer(amount) {
  this.damageTimer = 4;
  this.integrity -= amount;
  addEffect(new Puff(this.px, this.py, 4, 255, 0, 255));
  if (!this.remove && this.integrity <= 0) {
    this.remove = true;
    spawnExplosion(this.px, this.py, 0);
    if (lives === 0) {
      var ring, a, b;
      for (ring = 0; ring < 17; ring++) {
        for (a = 0; a < Math.PI * 2; a += Math.PI / 16) {
          b = new Bolt(this.px, this.py);
          b.velocityX = 4 * Math.cos(a + Math.PI / 64 * ring);
          b.velocityY = 4 * Math.sin(a + Math.PI / 64 * ring);
          b.delay = ring * 2;
          addEntity(b);
        }
      }
    }
  }
}

function addEntity(e) { entities.push(e); entityGroup.add(e); return e; }

function damageAnimationUpdate(o) {
  if (o.damageTimer > 0) {
    o.damageTimer--;
    o.jiggly = o.damageTimer > 0;
  }
}
function damageTouchingPlayer(o) {
  var p = playerCharacter;
  if (!p || p.remove) return;
  var lx = o.sizeX + p.sizeX, ly = o.sizeY + p.sizeY;
  if (Math.abs(p.px - o.px) < lx && Math.abs(p.py - o.py) < ly) p.damage(1);
}
function edgeBehavior(o, buffer) {
  buffer = buffer === undefined ? 4 : buffer;
  if (!o.hasEntered && o.px > 0 && o.px < W && o.py > 0 && o.py < H) o.hasEntered = true;
  if (o.hasEntered) {
    if (o.px > W + buffer || o.px < -buffer || o.py < -buffer || o.py > H + buffer) o.remove = true;
  }
}
function limitVelocity(o) {
  var v = Math.sqrt(o.velocityX * o.velocityX + o.velocityY * o.velocityY);
  if (v > o.velocityMax) { o.velocityX = o.velocityMax * o.velocityX / v; o.velocityY = o.velocityMax * o.velocityY / v; }
}

function retarget(o, wander, sight, error) {
  var dx = o.targetX - o.px, dy = o.targetY - o.py;
  var distance = Math.max(Math.abs(dx), Math.abs(dy));
  if ((o.hasEntered && o.targetTimer > 60) || distance < 1) {
    o.targetTimer = 0;
    o.targetX = jitter(o.px, wander);
    o.targetY = jitter(o.py, wander);
    var p = playerCharacter;
    if (p && !p.remove && Math.abs(p.px - o.px) < sight && Math.abs(p.py - o.py) < sight) {
      o.targetX = jitter(p.px, error);
      o.targetY = jitter(p.py, error);
    }
  }
  o.targetTimer++;
}

function sniffForFood(o, range, wantState) {
  var r = randomIn(1, range), a = randomIn(0, 2 * Math.PI);
  var tx = Math.floor(o.px + r * Math.cos(a)), ty = Math.floor(o.py + r * Math.sin(a));
  if (tx < 0 || tx >= W || ty < 0 || ty >= H) return;
  var s = grid[ty * W + tx];
  var hit = wantState === undefined ? (s !== emptyState) : (s === wantState);
  if (hit) { o.targetX = tx; o.targetY = ty; }
}
function eatAround(o) {
  var oX, oY, tx, ty, i;
  for (oY = -o.sizeY; oY <= o.sizeY; oY++) for (oX = -o.sizeX; oX <= o.sizeX; oX++) {
    tx = ((Math.floor(o.px + oX) % W) + W) % W;
    ty = ((Math.floor(o.py + oY) % H) + H) % H;
    i = ty * W + tx;
    if (grid[i] !== emptyState) { grid[i] = emptyState; o.energy++; }
  }
}


function Bolt(x, y) {
  Ent.call(this, x, y, 31);
  this.sizeX = 2; this.sizeY = 2;
  this.projectile = true; this.delay = 0; this.animated = false;
  this.type = 'bolt';
}
Bolt.prototype = Object.create(Ent.prototype);
Bolt.prototype.constructor = Bolt;
Bolt.prototype.step = function () {
  if (this.delay > 0) { this.delay--; this.visible = false; return; }
  this.visible = true;
  this.px += this.velocityX; this.py += this.velocityY;
  if (this.remove) return;

  var hitCell = false, oX, oY, tx, ty;
  cleanArea(((Math.floor(this.px) % W) + W) % W, ((Math.floor(this.py) % H) + H) % H, 4);
  for (oY = -this.sizeY; oY <= this.sizeY; oY++) for (oX = -this.sizeX; oX <= this.sizeX; oX++) {
    tx = ((Math.floor(this.px + oX) % W) + W) % W;
    ty = ((Math.floor(this.py + oY) % H) + H) % H;
    if (grid[ty * W + tx] === damageState) { this.remove = true; hitCell = true; }
  }
  if (hitCell) clearRegion(this.px, this.py, playerBoltBlastRadius);
  if (this.px > W || this.px < 0 || this.py > H || this.py < 0) this.remove = true;

  var i, e, lx, ly;
  for (i = 0; i < entities.length; i++) {
    e = entities[i];
    if (e === this || e === playerCharacter || e.projectile || e.remove) continue;
    lx = (6 + e.sizeX) * 0.5; ly = (6 + e.sizeY) * 0.5;
    if (Math.abs(e.px - this.px) < lx && Math.abs(e.py - this.py) < ly) {
      this.remove = true;
      e.damage(1);
    }
  }
  if (this.remove) {
    addEffect(new Puff(this.px, this.py, 8, 255, 0, 255));
    noiseBurst(this.px, this.py, playerBoltBlastEffectRadius);
  }
};
Bolt.prototype.sync = function () { this.visible = false; };

Bolt.prototype.drawPixels = function () {
  if (this.delay > 0) return;
  var endX = this.px + 2 * this.velocityX, endY = this.py + 2 * this.velocityY, i;
  for (i = 0; i <= 1.0001; i += 0.2) blitSprite(30, lerp(this.px, endX, i), lerp(this.py, endY, i));
  for (i = 0; i <= 1.0001; i += 0.2) blitSprite(31, lerp(this.px, endX, i), lerp(this.py, endY, i));
};

function MonsterBolt(x, y, targetX, targetY) {
  Ent.call(this, x, y, 40);
  this.sizeX = monsterBoltRadius; this.sizeY = monsterBoltRadius;
  var d = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2)) || 1;
  this.velocityX = 0.5 * (targetX - x) / d;
  this.velocityY = 0.5 * (targetY - y) / d;
  this.projectile = true;
  this.type = 'monsterbolt';
}
MonsterBolt.prototype = Object.create(Ent.prototype);
MonsterBolt.prototype.constructor = MonsterBolt;
MonsterBolt.prototype.step = function () {
  enemyProjectileCount++;
  this.px += this.velocityX; this.py += this.velocityY;
  if (this.remove) return;

  var hitCell = false, oX, oY, tx, ty;
  for (oY = -this.sizeY; oY <= this.sizeY; oY++) for (oX = -this.sizeX; oX <= this.sizeX; oX++) {
    tx = ((Math.floor(this.px + oX) % W) + W) % W;
    ty = ((Math.floor(this.py + oY) % H) + H) % H;
    if (grid[ty * W + tx] !== emptyState) { this.remove = true; hitCell = true; }
  }
  if (hitCell) clearRegion(this.px, this.py, playerBoltBlastRadius);
  if (this.px > W || this.px < 0 || this.py > H || this.py < 0) this.remove = true;

  var p = playerCharacter;
  if (p && !p.remove) {
    var lx = (4 + p.sizeX) * 0.5, ly = (4 + p.sizeY) * 0.5;
    if (Math.abs(p.px - this.px) < lx && Math.abs(p.py - this.py) < ly) { this.remove = true; p.damage(1); }
  }
  if (this.remove) addEffect(new Puff(this.px, this.py, 8, 255, 0, 255));
};


function Hunter(x, y) {
  Ent.call(this, x, y, 8);
  this.scoreValue = 1;
  this.sizeX = this.sizeY = 3;
  this.velocityMax = 0.5;
  this.acceleration = 0.025;
  this.eatsFood = false;
  this.explodeTimer = 40; this.exploding = false; this.blastRadius = 16;
  this.targetTimer = randomInt(60);
  this.targetX = W / 2; this.targetY = H / 2;
  this.avoidPoint = [];
  this.obstructedTimer = 0;
  this.wallCircleDirection = Math.random() < 0.5 ? -1 : 1;
  this.outOfBoundsTimer = 0;
  this.integrity = 2;
  this.type = 'hunter';
  this.damage = damageSimple;
}
Hunter.prototype = Object.create(Ent.prototype);
Hunter.prototype.constructor = Hunter;
Hunter.prototype.step = function () {
  var margin = -2;
  if (this.px < -margin || this.px > W + margin || this.py < -margin || this.py > H + margin) {
    this.outOfBoundsTimer++;
    if (this.outOfBoundsTimer > 96) { warpToEdge(this, margin); this.outOfBoundsTimer = 0; }
  } else this.outOfBoundsTimer = 0;

  enemyCount++;

  if (skeletoidsCircleWalls && (clock % 256) === 0) {
    this.wallCircleDirection = Math.random() < 0.5 ? -1 : 1;
  }

 
  var i2 = 0, avoidCount = 0, nudgeX = 0, nudgeY = 0, offsetX, offsetY, distance;
  while (i2 < this.avoidPoint.length) {
    var ap = this.avoidPoint[i2];
    offsetX = ap.x - this.px; offsetY = ap.y - this.py;
    distance = Math.max(Math.floor(Math.abs(offsetX) + W) % W, Math.floor(Math.abs(offsetY) + H) % H);
    if (distance < 6) { nudgeX += offsetX; nudgeY += offsetY; avoidCount++; }
    if (distance > 10 || grid[ap.y * W + ap.x] === emptyState) this.avoidPoint.splice(i2, 1);
    else i2++;
  }

  if (avoidCount > 0) {
    this.obstructedTimer++;
    var len = Math.sqrt(nudgeX * nudgeX + nudgeY * nudgeY);
    if (len !== 0) { nudgeX /= len; nudgeY /= len; }
    this.velocityX += -0.1 * nudgeX;
    this.velocityY += -0.1 * nudgeY;
    if (skeletoidsCircleWalls) {
      this.velocityX += 0.1 * (this.wallCircleDirection * nudgeY);
      this.velocityY += 0.1 * (this.wallCircleDirection * -nudgeX);
    }
  } else this.obstructedTimer = 0;

  if (this.obstructedTimer > 128) { this.damage(1); clearRegion(this.px, this.py, 6); }

  if (avoidCount === 0 && !this.exploding) {
    offsetX = this.targetX - this.px; offsetY = this.targetY - this.py;
    distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY) || 1;
    this.velocityX += this.acceleration * offsetX / distance;
    this.velocityY += this.acceleration * offsetY / distance;
  }
  limitVelocity(this);
  damageTouchingPlayer(this);

  var newX = this.px + this.velocityX, newY = this.py + this.velocityY;
  if (isRectangleSolid(newX, this.py, this.sizeX, this.sizeY)) { this.velocityX = 0; newX = this.px; }
  if (isRectangleSolid(newX, newY, this.sizeX, this.sizeY)) { this.velocityY = 0; newY = this.py; }
  this.px = newX; this.py = newY;
  this.velocityX *= 0.95; this.velocityY *= 0.95;

  edgeBehavior(this, 4);

  if (this.exploding) {
    this.explodeTimer--;
    if (Math.random() < 0.1) addEffect(new Puff(jitter(this.px, 2), jitter(this.py, 2), 8, 255, 0, 255));
    if (this.explodeTimer <= 0) {
      this.remove = true;
      if (this.warningRectangle) this.warningRectangle.needed = false;
      addNoiseToRegion(this.px, this.py, this.blastRadius);
    }
  }

  if (!this.remove && this.hasEntered) {
    if (this.eatsFood) {
      var oX, oY, tx, ty, i;
      for (oY = -this.sizeY; oY <= this.sizeY; oY++) for (oX = -this.sizeX; oX <= this.sizeX; oX++) {
        tx = ((Math.floor(this.px + oX) % W) + W) % W;
        ty = ((Math.floor(this.py + oY) % H) + H) % H;
        i = ty * W + tx;
        if (grid[i] === damageState) { grid[i] = emptyState; this.velocityX *= 0.9; this.velocityY *= 0.9; }
      }
    }
   
    var checkRadius = randomIn(1, 8), checkAngle = randomIn(0, 2 * Math.PI);
    offsetX = this.targetX - this.px; offsetY = this.targetY - this.py;
    distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    if (distance > 0) { offsetX /= distance; offsetY /= distance; }
    var testX = Math.floor(this.px + 6 * offsetX + checkRadius * Math.cos(checkAngle));
    var testY = Math.floor(this.py + 6 * offsetY + checkRadius * Math.sin(checkAngle));
    if (testX >= 0 && testX < W && testY >= 0 && testY < H) {
      if (grid[testY * W + testX] !== emptyState) this.avoidPoint.push({ x: testX, y: testY });
    }
    retarget(this, 32, 80, 16);
  }
  damageAnimationUpdate(this);
};

function warpToEdge(o, margin) {
  var edge = randomInt(4);
  if (edge === 0) { o.px = -margin; o.py = randomInt(H - margin * 2) + margin; }
  else if (edge === 1) { o.px = randomInt(W - margin * 2) + margin; o.py = -margin; }
  else if (edge === 2) { o.px = W + margin; o.py = randomInt(H - margin * 2) + margin; }
  else { o.px = randomInt(W - margin * 2) + margin; o.py = H + margin; }
}


function Shy(x, y) {
  Ent.call(this, x, y, 16);
  this.scoreValue = 5;
  this.sizeX = this.sizeY = 3;
  this.velocityMax = 0.5;
  this.targetTimer = randomInt(60);
  this.targetX = W / 2; this.targetY = H / 2;
  this.timer = 120; this.integrity = 4; this.energy = 40;
  this.type = 'shy';
  this.damage = damageSimple;
}
Shy.prototype = Object.create(Ent.prototype);
Shy.prototype.constructor = Shy;
Shy.prototype.step = function () {
  enemyCount++;
  this.velocityX += 0.025 * (this.targetX - this.px);
  this.velocityY += 0.025 * (this.targetY - this.py);
  limitVelocity(this);
  damageTouchingPlayer(this);
  this.px += this.velocityX; this.py += this.velocityY;
  this.velocityX *= 0.5; this.velocityY *= 0.5;
  edgeBehavior(this, 4);

  if (!this.remove) {
    this.timer++;
    if (this.hasEntered) {
      eatAround(this);
      if (noBulletTimer === 0 && previousEnemyProjectileCount < desiredEnemyProjectileCount &&
          this.timer > 40 && this.energy > 12) {
        this.timer = 0; this.energy -= 12;
        var p = playerCharacter;
        if (p && !p.remove) addEntity(new MonsterBolt(this.px, this.py, jitter(p.px, 8), jitter(p.py, 8)));
        else addEntity(new MonsterBolt(this.px, this.py, randomIn(0, W), randomIn(0, H)));
        previousEnemyProjectileCount++;
        playSfx('enemyfire');
      }
      sniffForFood(this, 12);
    }
    var dx = this.targetX - this.px, dy = this.targetY - this.py;
    if ((this.hasEntered && this.targetTimer > 60) || Math.max(Math.abs(dx), Math.abs(dy)) < 1) {
      this.targetTimer = 0;
      this.targetX = clamp(jitter(this.px, 32), 4, W - 4);
      this.targetY = clamp(jitter(this.py, 32), 4, H - 4);
    }
    this.targetTimer++;
  }
  damageAnimationUpdate(this);
};


function Seeker(x, y) {
  Ent.call(this, x, y, 38);
  this.scoreValue = 1;
  this.sizeX = this.sizeY = 2;
  this.velocityMax = 0.25;
  this.acceleration = 0.025;
  this.exploding = false; this.explodeTimer = 40; this.blastRadius = 16;
  this.targetTimer = randomInt(60);
  this.targetX = W / 2; this.targetY = H / 2;
  this.integrity = 1;
  this.type = 'seeker';
  this.damage = damageExplodingProjectile;
}
Seeker.prototype = Object.create(Ent.prototype);
Seeker.prototype.constructor = Seeker;
Seeker.prototype.step = function () {
  enemyCount++;
  if (!this.exploding) {
    var dx = this.targetX - this.px, dy = this.targetY - this.py;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.velocityX += this.acceleration * dx / d;
    this.velocityY += this.acceleration * dy / d;
  }
  limitVelocity(this);
  var p = playerCharacter;
  if (p && !p.remove) {
    if (Math.abs(p.px - this.px) < (this.sizeX + p.sizeX) && Math.abs(p.py - this.py) < (this.sizeY + p.sizeY)) p.damage(1);
  }
  this.px += this.velocityX; this.py += this.velocityY;
  this.velocityX *= 0.95; this.velocityY *= 0.95;
  edgeBehavior(this, 4);
  if (!this.remove && this.hasEntered) retarget(this, 32, 80, 16);
  damageAnimationUpdate(this);
};


function Mother(x, y) {
  Ent.call(this, x, y, 32);
  this.scoreValue = 5;
  this.sizeX = this.sizeY = 3;
  this.velocityMax = 0.5;
  this.targetTimer = randomInt(60);
  this.targetX = W / 2; this.targetY = H / 2;
  this.timer = 120; this.integrity = 5; this.energy = 40;
  this.managed = [];
  this.type = 'starfish';
  this.damage = damageSimple;
}
Mother.prototype = Object.create(Ent.prototype);
Mother.prototype.constructor = Mother;
Mother.prototype.step = function () {
  var i = 0;
  while (i < this.managed.length) { if (this.managed[i].remove) this.managed.splice(i, 1); else i++; }

  enemyCount++;
  this.velocityX += 0.0025 * (this.targetX - this.px);
  this.velocityY += 0.0025 * (this.targetY - this.py);
  limitVelocity(this);
  var p = playerCharacter;
  if (p && !p.remove) {
    if (Math.abs(p.px - this.px) < (this.sizeX + p.sizeX) * 0.5 && Math.abs(p.py - this.py) < (this.sizeY + p.sizeY) * 0.5) p.damage(1);
  }
  this.px += this.velocityX; this.py += this.velocityY;
  this.velocityX *= 0.85; this.velocityY *= 0.85;
  edgeBehavior(this, 4);

  if (!this.remove) {
    this.timer++;
    if ((this.timer % 4) === 0 && this.hasEntered) {
      eatAround(this);
     
      if (this.timer > 60 && this.energy > 20 && this.managed.length < starfishBroodLimit &&
          previousEnemyCount < desiredEnemyCount + 5) {
        this.timer = 0;
        playSfx('starfish');
        for (i = 0; i < 2; i++) {
          var baby = new Hunter(jitter(this.px, 6), jitter(this.py, 6));
          baby.spriteBase = 36;
          baby.integrity = 1;
          baby.velocityX = jitter(0, 5); baby.velocityY = jitter(0, 5);
          baby.velocityMax = 1.0;
          baby.scoreValue = 0;
          baby.eatsFood = false;
          this.managed.push(baby);
          addEntity(baby);
          this.energy -= 4;
          addEffect(new ShrinkingRectangle(baby, 64, 128, 255, 0));
        }
      }
      sniffForFood(this, 12);
    }
    var dx = this.targetX - this.px, dy = this.targetY - this.py;
    if ((this.hasEntered && this.targetTimer > 60) || Math.max(Math.abs(dx), Math.abs(dy)) < 1) {
      this.targetTimer = 0;
      this.targetX = clamp(jitter(this.px, 32), 4, W - 4);
      this.targetY = clamp(jitter(this.py, 32), 4, H - 4);
      if (p && !p.remove && Math.abs(p.px - this.px) < 64 && Math.abs(p.py - this.py) < 64) {
        this.targetX = p.px; this.targetY = p.py;
      }
    }
    this.targetTimer++;
  }
  damageAnimationUpdate(this);
};


function Eater(x, y) {
  Ent.call(this, x, y, 18);
  this.scoreValue = 1;
  this.sizeX = this.sizeY = 3;
  this.velocityMax = 0.875;
  this.acceleration = 0.005;
  this.targetTimer = randomInt(60);
  this.targetX = W / 2; this.targetY = H / 2;
  this.target = null;
  this.integrity = 4;
  this.type = 'eater';
  this.damage = damageSimple;
}
Eater.prototype = Object.create(Ent.prototype);
Eater.prototype.constructor = Eater;
Eater.prototype.findTarget = function () {
  var best = null, bestD = 1e9, i, e, d;
  for (i = 0; i < entities.length; i++) {
    e = entities[i];
    if (e.remove || e.type !== 'crystal') continue;
    d = Math.abs(e.px - this.px) + Math.abs(e.py - this.py);
    if (d < bestD) { bestD = d; best = e; }
  }
  this.target = best;
};
Eater.prototype.step = function () {
  enemyCount++;
  if ((clock % 32) === 0 || !this.target || this.target.remove) this.findTarget();

  if (this.target && !this.target.remove) { this.targetX = this.target.px; this.targetY = this.target.py; }
  else if (playerCharacter && !playerCharacter.remove) { this.targetX = playerCharacter.px; this.targetY = playerCharacter.py; }

 
  if (this.target && !this.target.remove &&
      Math.abs(this.target.px - this.px) < 4 && Math.abs(this.target.py - this.py) < 4) {
    this.target.remove = true;
    playSfx('eating');
    spawnExplosion(this.target.px, this.target.py, 0);
    this.target = null;
  }

  var dx = this.targetX - this.px, dy = this.targetY - this.py;
  var d = Math.sqrt(dx * dx + dy * dy) || 1;
  this.velocityX += this.acceleration * dx / d;
  this.velocityY += this.acceleration * dy / d;
  limitVelocity(this);
  damageTouchingPlayer(this);

  var newX = this.px + this.velocityX, newY = this.py + this.velocityY;
  if (isRectangleSolid(newX, this.py, this.sizeX, this.sizeY)) { clearRegion(newX, this.py, 3); }
  this.px = newX; this.py = newY;
  this.velocityX *= 0.95; this.velocityY *= 0.95;
  edgeBehavior(this, 6);
  damageAnimationUpdate(this);
};


function Crystal(x, y) {
  Ent.call(this, x, y, 24 + 2 * randomInt(2));
  this.sizeX = this.sizeY = 2;
  this.velocityMax = 0;
  this.integrity = 1;
  this.exploding = false; this.explodeTimer = 80; this.blastRadius = 30;
  this.scoreValue = 0;
  this.type = 'crystal';
  this.warningRectangle = null;
}
Crystal.prototype = Object.create(Ent.prototype);
Crystal.prototype.constructor = Crystal;

Crystal.prototype.damage = function () {
  if (this.remove || this.exploding) return;
  this.exploding = true;
  this.spriteBase += 2;
  this.jiggly = true;
  addEffect(new Puff(this.px, this.py, 12, 255, 0, 255));
  var wr = new WarningRectangle(this.px - this.blastRadius, this.py - this.blastRadius,
                                this.px + this.blastRadius, this.py + this.blastRadius, 80);
  wr.waitWhileNeeded = true;
  addEffect(wr);
  this.warningRectangle = wr;
};
Crystal.prototype.step = function () {
  var p = playerCharacter;
  if (p && !p.remove && Math.abs(p.px - this.px) < 8 && Math.abs(p.py - this.py) < 8) {
    this.remove = true;
    playSfx('crystal');
    increaseScore(1);
    addEffect(new Puff(this.px, this.py, 8, 255, 0, 255));
    clearRegion(this.px, this.py, 8);
    if (this.warningRectangle) this.warningRectangle.needed = false;
  }
  if (this.exploding) {
    this.explodeTimer--;
    if (explosionCount < 1) {
      explosionCount++;
      if (this.explodeTimer <= 0) {
        this.remove = true;
        if (this.warningRectangle) this.warningRectangle.needed = false;
        explodeAt(this.px, this.py, this.blastRadius);
      }
    }
  }
};

function explodeAt(x, y, radius) {
  playSfx('impact');
  noiseBurst(x, y, Math.max(0, radius));
  clearRegion(x, y, radius);
  spawnExplosion(x, y, 0);
  var i, e;
  for (i = 0; i < entities.length; i++) {
    e = entities[i];
    if (Math.abs(e.px - x) < radius && Math.abs(e.py - y) < radius) e.damage(5);
  }
}



function Sower(x, y) {
  Ent.call(this, x, y, 42);
  this.scoreValue = 4;
  this.sizeX = this.sizeY = 3;
  this.velocityMax = 1;
  this.targetX = x; this.targetY = y;
  if (x < 0 || x > W) this.targetX = W / 2 + (W / 2 - x);
  if (y < 0 || y > H) this.targetY = H / 2 + (H / 2 - y);
  this.integrity = 2; this.delay = 60;
  this.type = 'sower';
  this.damage = damageSimple;
}
Sower.prototype = Object.create(Ent.prototype);
Sower.prototype.constructor = Sower;
Sower.prototype.step = function () {
  cellRegulatorCount++;
  if ((clock % 4) === 0 && liveCellCount < minimumLiveCellCount + 2048) {
    var oX, oY, tx, ty;
    for (oY = -sowerRange; oY <= sowerRange; oY++) {
      ty = Math.floor(this.py + oY);
      if (ty < 0 || ty >= H) continue;
      for (oX = -sowerRange; oX <= sowerRange; oX++) {
        tx = Math.floor(this.px + oX);
        if (tx < 0 || tx >= W) continue;
        grid[ty * W + tx] = randomInt(3);
      }
    }
  }
  this.velocityX += 0.0025 * (this.targetX - this.px);
  this.velocityY += 0.0025 * (this.targetY - this.py);
  limitVelocity(this);
  var p = playerCharacter;
  if (p && !p.remove &&
      Math.abs(p.px - this.px) < (this.sizeX + p.sizeX) * 0.5 &&
      Math.abs(p.py - this.py) < (this.sizeY + p.sizeY) * 0.5) p.damage(1);
  if (this.delay > 0) this.delay--;
  else { this.px += this.velocityX; this.py += this.velocityY; }
  edgeBehavior(this, 8);
  damageAnimationUpdate(this);
};



function ChewChew(x, y) {
  Ent.call(this, x, y, 44);
  this.scoreValue = 4;
  this.sizeX = this.sizeY = 6;
  this.velocityMax = 0.75;
  this.targetX = x; this.targetY = y;
  if (x < 0 || x > W) this.targetX = W / 2 + (W / 2 - x);
  if (y < 0 || y > H) this.targetY = H / 2 + (H / 2 - y);
  this.integrity = 4; this.delay = 60;
  this.type = 'chewchew';
  this.damage = damageSimple;
}
ChewChew.prototype = Object.create(Ent.prototype);
ChewChew.prototype.constructor = ChewChew;
ChewChew.prototype.step = function () {
  cellRegulatorCount--;
  var oX, oY, tx, ty;
  for (oY = -6; oY <= 6; oY++) {
    ty = Math.floor(this.py + oY);
    if (ty < 0 || ty >= H) continue;
    for (oX = -6; oX <= 6; oX++) {
      tx = Math.floor(this.px + oX);
      if (tx < 0 || tx >= W) continue;
      grid[ty * W + tx] = emptyState;
    }
  }
  this.velocityX += 0.0025 * (this.targetX - this.px);
  this.velocityY += 0.0025 * (this.targetY - this.py);
  limitVelocity(this);
  var p = playerCharacter;
  if (p && !p.remove &&
      Math.abs(p.px - this.px) < (this.sizeX + p.sizeX) * 0.5 &&
      Math.abs(p.py - this.py) < (this.sizeY + p.sizeY) * 0.5) p.damage(1);
  if (this.delay > 0) this.delay--;
  else { this.px += this.velocityX; this.py += this.velocityY; }
  edgeBehavior(this, 8);
  damageAnimationUpdate(this);
};



function Turret(x, y) {
  Ent.call(this, x, y, 20);
  this.scoreValue = 5;
  this.sizeX = this.sizeY = 3;
  this.velocityMax = 0.3;
  this.targetTimer = randomInt(60);
  this.targetX = W / 2; this.targetY = H / 2;
  this.timer = randomInt(90);
  this.integrity = 4;
  this.type = 'turret';
  this.damage = damageSimple;
}
Turret.prototype = Object.create(Ent.prototype);
Turret.prototype.constructor = Turret;
Turret.prototype.step = function () {
  enemyCount++;
  this.velocityX += 0.01 * (this.targetX - this.px);
  this.velocityY += 0.01 * (this.targetY - this.py);
  limitVelocity(this);
  damageTouchingPlayer(this);
  this.px += this.velocityX; this.py += this.velocityY;
  this.velocityX *= 0.8; this.velocityY *= 0.8;
  edgeBehavior(this, 4);

  if (!this.remove && this.hasEntered) {
    this.timer++;
    var p = playerCharacter;
    if (this.timer > 90 && noBulletTimer === 0 &&
        previousEnemyProjectileCount < desiredEnemyProjectileCount && p && !p.remove) {
      var d = Math.abs(p.px - this.px) + Math.abs(p.py - this.py);
      if (d < 48 * 2) {
        this.timer = 0;
        var i, a, base = Math.atan2(p.py - this.py, p.px - this.px);
        for (i = -1; i <= 1; i++) {
          a = base + i * 0.25;
          addEntity(new MonsterBolt(this.px, this.py, this.px + Math.cos(a) * 10, this.py + Math.sin(a) * 10));
          previousEnemyProjectileCount++;
        }
      }
    }
    retarget(this, 40, 96, 24);
  }
  damageAnimationUpdate(this);
};


function Player(x, y) {
  Ent.call(this, x, y, 78);
  this.sizeX = this.sizeY = 2;
  this.integrity = 1;
  this.spawnTimer = 0;
  this.type = 'player';
  this.damage = function () { };  
}
Player.prototype = Object.create(Ent.prototype);
Player.prototype.constructor = Player;
Player.prototype.step = function () {
  if (this.spawnTimer < 120) {
    this.spawnTimer++;
    if (this.spawnTimer === 120) this.damage = damagePlayer;
  }
  this.px += this.velocityX; this.py += this.velocityY;
  var tx = ((Math.floor(this.px) % W) + W) % W;
  var ty = ((Math.floor(this.py) % H) + H) % H;
  if (grid[ty * W + tx] === damageState) this.damage(1);
  damageAnimationUpdate(this);
};
Player.prototype.sync = function () {
  Ent.prototype.sync.call(this);
  if (this.spawnTimer < 120) this.tint = (Math.floor(clock / 3) % 2) === 0 ? 0xff00ff : 0xffffff;
};
var textGroup = null, textPool = [], textUsed = 0;
var TEXT_COLORS = [0xff1fff, 0xe01ce0, 0xc018c0, 0xa014a0, 0x801080];

function textColorNow() { return TEXT_COLORS[Math.abs((Math.floor(clock / 8) % 6) - 2)]; }
function textBegin() { textUsed = 0; }
function textEnd() { for (var i = textUsed; i < textPool.length; i++) textPool[i].visible = false; }

function glyph(code, x, y, tint, angle) {
  if (code === 32 || code < FONT_FIRST || code > FONT_LAST) return;
  var s;
  if (textUsed < textPool.length) s = textPool[textUsed];
  else { s = game.make.sprite(0, 0, 'font', 0); s.anchor.set(0.5); textGroup.add(s); textPool.push(s); }
  textUsed++;
  s.visible = true;
  setFrame(s, code - FONT_FIRST);
  s.x = Math.floor(x); s.y = Math.floor(y);
  s.tint = tint === undefined ? textColorNow() : tint;
  angle = angle || 0;
  if (s.angle !== angle) s.angle = angle;
}
function drawString(str, x, y, tint) {
  for (var i = 0; i < str.length; i++) glyph(str.charCodeAt(i), x + i * FONT_ADVANCE, y, tint);
}
function drawStringCentered(str, cx, y, tint) {
  drawString(str, cx - (str.length * FONT_ADVANCE) / 2 + FONT_ADVANCE / 2, y, tint);
}
function drawStringVertical(str, x, y, tint) {
  for (var i = 0; i < str.length; i++) glyph(str.charCodeAt(i), x, y + i * FONT_ADVANCE, tint, 90);
}
function wrapLines(str, wrapWidth) {
  var lines = [], start = 0, len;
  while (start < str.length) {
    if (str[start] === ' ') { start++; continue; }
    len = wrapWidth;
    if (start + len >= str.length) len = str.length - start;
    else {
      while (len > 0 && str[start + len - 1] !== ' ') len--;
      if (len === 0) len = wrapWidth;
    }
    lines.push(str.substr(start, len).replace(/\s+$/, ''));
    start += len;
  }
  return lines;
}
function drawStringWrappedCentered(str, cx, y, wrapWidth, tint) {
  var lines = wrapLines(str, wrapWidth), i;
  for (i = 0; i < lines.length; i++) drawStringCentered(lines[i], cx, y + i * FONT_LINE, tint);
  return lines.length;
}
function drawStringWrappedLeft(str, x, y, wrapWidth, tint) {
  var lines = wrapLines(str, wrapWidth), i;
  for (i = 0; i < lines.length; i++) drawString(lines[i], x, y + i * FONT_LINE, tint);
  return lines.length;
}


var wave = 0, currentSetting = 'attract';
var attractMode = true;
var enemyList = [];
var enemyGroupSpawnTimer = 30, enemyGroupSpawnFrequency = 32;
var sowerTimer = 256, makingSowers = false, sowerCount = 0;
var makingChewchews = false, chewchewCount = 0;
var endingWave = false, waveEndTimer = 0, waveEndTimer2 = 0;
var cut = false, cutSceneText = '', currentCutsceneImage = 0, advanceTimer = 0;
var CUT_SCENE_DURATION = 360;
var showMessage = false, messageString = '', messageTimer = 0, messageDuration = -1, messageOpaque = false;
var transitionTimer = 999, transitionDirection = 1, transitionDuration = 30;
var gameOver = false, gameOverTimer = 0;
var highScore = 0;
var selectedTip = 0;

var hudGraphics = null, transitionGraphics = null, cutsceneSprite = null;

function loadHighScore() {
  try { var v = window.localStorage.getItem('lumcorr.highscore'); if (v !== null) highScore = parseInt(v, 10) || 0; }
  catch (e) { highScore = 0; }
}
function saveHighScore() {
  try { if (score > highScore) { highScore = score; window.localStorage.setItem('lumcorr.highscore', String(highScore)); } }
  catch (e) { if (score > highScore) highScore = score; }
}

function messageCenter(str, duration, opaque) {
  messageString = str;
  messageTimer = 0;
  messageDuration = duration === undefined ? -1 : duration;
  messageOpaque = !!opaque;
  showMessage = true;
}

function increaseScore(amount) {
  score += amount;
  scoreTimer = 0;
  if ((extraLifeCounter === 0 && score >= 32) || (score > 0 && score % 64 === 0)) {
    extraLifeCounter++;
    lives++;
    messageCenter('extra life', 120, true);
  }
}


function applySetting(name) {
  var s = SETTINGS[name] || SETTINGS['walls'];
  rule = RULES[s.rule];
  emptyState = s.empty;
  damageState = s.damage;
  playerBoltBlastRadius = s.boltRadius;
  playerBoltBlastEffectRadius = s.boltRadius;
  sowerRange = s.sowerRange;
  minimumLiveCellCount = s.minCells;
  maximumLiveCellCount = s.maxCells;
}


function setupSpawnList() {
  enemyGroupSpawnFrequency = 32;
  desiredEnemyCount = 8 + 2 * wave;
  desiredEnemyProjectileCount = 3 + 1 * (wave - 3);
  if (wave === 2) { crystalsEarned = 3; crystalSpawnTimer = 0; }

  var t = clamp(Math.min(wave - 2, 6) / 6, 0, 1);
  function bl(low, high) { return Math.floor(low + (high - low) * t); }

  var total = [{ type: 'hunter', total: bl(16, 24), current: 0, min: bl(2, 8), max: bl(4, 12) }];
  if (wave > 1) total.push({ type: 'shy', total: bl(2, 4), current: 0, min: 1, max: 1 });
  if (wave > 2) total.push({ type: 'eater', total: bl(2, 6), current: 0, min: 1, max: bl(1, 2) });
  if (wave > 6) total.push({ type: 'turret', total: 6, current: 0, min: 1, max: 1 });
  if (wave > 4) total.push({ type: 'seeker', total: bl(4, 12), current: 0, min: 1, max: bl(2, 4) });
  if (wave > 3 && wave !== 6) total.push({ type: 'STARFISH', total: 4, current: 0, min: 1, max: 1 });

  enemyList = [];
  var adding = true;
  while (adding) {
    adding = false;
    var candidate = [], i;
    for (i = 0; i < total.length; i++) {
      if (total[i].current < total[i].total) { adding = true; candidate.push(total[i]); }
    }
    if (candidate.length > 0) {
      var sel = candidate[Math.floor(Math.random() * candidate.length)];
      var n = Math.max(1, randomIntIn(Math.max(1, sel.min), Math.max(1, sel.max))), group = [];
      for (i = 0; i < n; i++) if (sel.total > sel.current) { group.push(sel.type); sel.current++; }
      if (group.length) enemyList.push(group);
    }
  }
  enemyGroupSpawnTimer = 1;
  sowerTimer = 256;
  makingSowers = false;
  makingChewchews = false;
  sowerCount = 0;
}

function removeAllButCrystals() {
  var i = 0;
  while (i < entities.length) {
    if (entities[i].type !== 'crystal') { entities[i].destroy(); entities.splice(i, 1); }
    else i++;
  }
  playerCharacter = null;
}

function initializeWorld() {
  advanceTimer = 0;
  cut = false;
  showMessage = false;  
  enemyCount = 0; enemyProjectileCount = 0;
  enemyList = [];
  waveEndTimer2 = 0;
  boltTimer = 0;
  effects = [];
  explosionGroup.callAll('kill');

  currentSetting = SETTING_ORDER[Math.min(SETTING_ORDER.length - 1, wave)];
  color = waveColorFor(wave);
  effectColor = [[0, 255, 0], [218, 0, 15], [255, 89, 31]];
  applySetting(currentSetting);

  if (currentSetting === 'intermission' || currentSetting === 'ready?') {
    removeAllButCrystals();
    cut = true;
    currentCutsceneImage = WAVE_CUTSCENE_IMAGE[Math.min(WAVE_CUTSCENE_IMAGE.length - 1, wave)];
    color = [menuColor[0].slice(), menuColor[1].slice(), menuColor[2].slice()];
    cutSceneText = WAVE_NAME[Math.min(WAVE_NAME.length - 1, wave)];
    respawnPlayer = false;
  }

  color[emptyState] = [0, 0, 0];

  if (!attractMode && RESET_CELLS[Math.min(RESET_CELLS.length - 1, wave)]) {
    var keepPlayer = playerCharacter;
    var i = 0;
    while (i < entities.length) {
      if (entities[i].type !== 'crystal' && entities[i] !== keepPlayer) { entities[i].destroy(); entities.splice(i, 1); }
      else i++;
    }
    if (keepPlayer && !keepPlayer.remove) { keepPlayer.px = W / 2; keepPlayer.py = H / 2; }
    resetCellGrid();
  }

  if (!attractMode && PAUSE_FOR_NAME[Math.min(PAUSE_FOR_NAME.length - 1, wave)] && !cut) {
    messageCenter(currentSetting, 256, true);
  }

  if (cut) { transitionTimer = 0; transitionDirection = -1; }
  else { transitionTimer = 0; transitionDirection = 1; }
  if (!attractMode) {
    if (cut) { playMusic('cut'); playSfx('cutscene'); }
    else playMusic(levelTrack());
  }
  setupSpawnList();
}

function nextWave() { wave++; initializeWorld(); }

function beginAttractMode() {
  attractMode = true;
  clearEntities();
  wave = 0;
  lives = -1; deaths = 3; score = 0;
  initializeWorld();
  rule = RULES.castle;
  color = [[255, 0, 255], [128, 0, 128], [0, 0, 0]];
  emptyState = 2; damageState = 1; sowerRange = 6;
  color[emptyState] = [0, 0, 0];
  resetCellGrid();
  playerActive = false; respawnPlayer = false;
  showMessage = false;
  gameOver = false;
}

function beginGame() {
  startRun();
  attractMode = false;
  gameOver = false;
  clearEntities();
  wave = 1;
  lives = 3; deaths = 0; score = 0; extraLifeCounter = 0;
  crystalsEarned = 0;
  playerActive = true; respawnPlayer = true;
  noBulletTimer = 0;
  selectedTip = randomInt(TIPS.length);
  resetCellGrid();
  initializeWorld();
}

function clearEntities() {
  for (var i = 0; i < entities.length; i++) entities[i].destroy();
  entities = [];
  effects = [];
  playerCharacter = null;
}

function explodeSkipPlayers(x, y, radius) {
  clearRegion(x, y, radius);
  noiseBurst(x, y, radius);
  for (var i = 0; i < entities.length; i++) {
    var e = entities[i];
    if (e.type === 'player') continue;
    if (Math.abs(e.px - x) < radius && Math.abs(e.py - y) < radius) e.damage(5);
  }
}

function spawnPlayer() {
  explodeSkipPlayers(W / 2, H / 2, 32);
  var p = new Player(W / 2, H / 2);
  addEntity(p);
  for (var ring = 0; ring < 4; ring++) {
    var r = new ShrinkingRectangle(p, 64, 255, 0, 255);
    r.delay = 2 * ring;
    addEffect(r);
  }
  playerCharacter = p;
}

function enterGameOver() {
  gameOver = true;
  gameOverTimer = 0;
  saveHighScore();
  playerCharacter = null;
  showMessage = false;
  beginNameEntry();
}


function createByName(type, x, y) {
  switch (type) {
    case 'hunter':   return new Hunter(x, y);
    case 'shy':      return new Shy(x, y);
    case 'eater':    return new Eater(x, y);
    case 'seeker':   return new Seeker(x, y);
    case 'STARFISH': return new Mother(x, y);
    case 'turret':   return new Turret(x, y);
    case 'sower':    return new Sower(x, y);
    case 'chew chew':return new ChewChew(x, y);
    case 'crystal':  return new Crystal(x, y);
  }
  return new Hunter(x, y);
}

function edgeSpawnWithWarning(margin, warningRadius, warningDuration) {
  var edge = randomInt(4), cx, cy;
  if (edge === 0) {
    cx = -margin; cy = randomInt(H - margin * 2) + margin;
    addEffect(new WarningRectangle(1, cy - warningRadius, W - 2, cy + warningRadius, warningDuration));
  } else if (edge === 1) {
    cx = randomInt(W - margin * 2) + margin; cy = -margin;
    addEffect(new WarningRectangle(cx - warningRadius, 1, cx + warningRadius, H - 2, warningDuration));
  } else if (edge === 2) {
    cx = W + margin; cy = randomInt(H - margin * 2) + margin;
    addEffect(new WarningRectangle(1, cy - warningRadius, W - 2, cy + warningRadius, warningDuration));
  } else {
    cx = randomInt(W - margin * 2) + margin; cy = H + margin;
    addEffect(new WarningRectangle(cx - warningRadius, 1, cx + warningRadius, H - 2, warningDuration));
  }
  return { x: cx, y: cy };
}

function updateSpawning() {
  if (enemyGroupSpawnTimer > 0) enemyGroupSpawnTimer--;
  if (sowerTimer > 0) sowerTimer--;
  if (crystalSpawnTimer > 0) crystalSpawnTimer--;
  if (noBulletTimer > 0) noBulletTimer--;

  var radius = Math.sqrt(2) * W / 2;
  var angle = randomFloat(2 * Math.PI);
  var centerX = W / 2 + Math.cos(angle) * radius;
  var centerY = H / 2 + Math.sin(angle) * radius;
  var spawnEntities = false;
  var group = ['hunter', 'hunter', 'hunter', 'hunter', 'hunter', 'hunter'];

 
  if ((enemyList.length > 0 || previousEnemyCount > 0) && !makingSowers && !makingChewchews && sowerTimer <= 0) {
    if (liveCellCount < minimumLiveCellCount) { makingSowers = true; sowerCount = 0; }
    else if (liveCellCount > maximumLiveCellCount) { makingChewchews = true; chewchewCount = 0; }
  }

  if (makingSowers) {
    var s = edgeSpawnWithWarning(16, 16, 180);
    centerX = s.x; centerY = s.y;
    sowerCount++;
    group = ['sower'];
    spawnEntities = true;
    sowerTimer = 16;
    if (liveCellCount > minimumLiveCellCount + 500 || sowerCount >= 2) { makingSowers = false; sowerTimer = 512; }
  } else if (makingChewchews && sowerTimer <= 0) {
    var c = edgeSpawnWithWarning(32, 4, 180);
    centerX = c.x; centerY = c.y;
    chewchewCount++;
    group = ['chew chew'];
    spawnEntities = true;
    sowerTimer = 64;
    if (liveCellCount < maximumLiveCellCount) { makingChewchews = false; sowerTimer = 512; }
  } else if (enemyCount < desiredEnemyCount && enemyGroupSpawnTimer <= 0) {
    enemyGroupSpawnTimer = enemyGroupSpawnFrequency;
    if (crystalSpawnTimer <= 0 && crystalsEarned > 0) {
      group = [];
      var count = Math.min(10, crystalsEarned), i;
      for (i = 0; i < count; i++) { crystalsEarned--; group.push('crystal'); }
      radius *= 0.5;
      centerX = W / 2 + Math.cos(angle) * radius;
      centerY = H / 2 + Math.sin(angle) * radius;
      spawnEntities = true;
      enemyGroupSpawnTimer = 16;
    } else if (enemyList.length > 0 && enemyCount + enemyList[enemyList.length - 1].length <= desiredEnemyCount) {
      group = enemyList.pop();
      spawnEntities = true;
    }
  }

  if (spawnEntities) {
    var groupRadius = Math.sqrt(Math.max(0, group.length - 1)) * 5, k, m, sx, sy;
    for (k = 0; k < group.length; k++) {
      sx = jitter(centerX, groupRadius);
      sy = jitter(centerY, groupRadius);
      if (group[k] === 'crystal') { sx = clamp(sx, 8, W - 8); sy = clamp(sy, 8, H - 8); }
      m = createByName(group[k], sx, sy);
      addEntity(m);
      if (group[k] === 'crystal') addEffect(new ShrinkingRectangle(m, 64, 255, 0, 255));
      else addEffect(new ShrinkingRectangle(m, 64, 128, 255, 0));
    }
  }
}


var keys = null;
function updatePlayerInput() {
  if (boltTimer > 0) boltTimer--;
  var p = playerCharacter;
  if (!p || p.remove) return;

   var inputX = 0, inputY = 0, firing = false;
  if (keys.left.isDown  || keys.left2.isDown)  inputX -= 1;
  if (keys.right.isDown || keys.right2.isDown) inputX += 1;
  if (keys.up.isDown    || keys.up2.isDown)    inputY -= 1;
  if (keys.down.isDown  || keys.down2.isDown)  inputY += 1;

  if (touch.active && !game.input.activePointer.isDown) touchRelease();

  if (inputX !== 0 || inputY !== 0) {
    firing = !keys.hold.isDown;
  } else if (touch.active) {
    inputX = touch.x;
    inputY = touch.y;
    firing = touch.fire;
  }

  var acceleration = 0.65, friction = 0.55;
  p.velocityX += acceleration * inputX;
  p.velocityY += acceleration * inputY;
  p.velocityX *= friction;
  p.velocityY *= friction;

  if (p.px < 0) p.px += W;
  if (p.px > W - 1) p.px -= W;
  if (p.py < 0) p.py += H;
  if (p.py > H - 1) p.py -= H;

  cleanArea(p.px, p.py, 6);

  if (boltTimer === 0 && firing && (inputX !== 0 || inputY !== 0)) {
    boltTimer = 8;
    var d = Math.sqrt(inputX * inputX + inputY * inputY);
    var b = new Bolt(p.px, p.py);
    b.velocityX = 2.0 * inputX / d;
    b.velocityY = 2.0 * inputY / d;
    addEntity(b);
    playSfx('bolt');
    addEffect(new Puff(p.px + b.velocityX, p.py + b.velocityY, 8, 255, 0, 255));
  }
}


function updateWorld() {
  updateSpawning();
  updatePlayerInput();

  previousEnemyCount = enemyCount;
  previousEnemyProjectileCount = enemyProjectileCount;
  enemyCount = 0; enemyProjectileCount = 0;
  cellRegulatorCount = 0; explosionCount = 0;

  var i;
  for (i = 0; i < entities.length; i++) entities[i].step();

 
  if (!respawnPlayer && playerCharacter && playerCharacter.remove) {
    playerCharacter = null;
    lives--; deaths++;
    if (lives >= 0) respawnPlayer = true;
    else enterGameOver();
  }

  i = 0;
  while (i < entities.length) {
    if (entities[i].remove) { entities[i].destroy(); entities.splice(i, 1); }
    else i++;
  }

  for (i = 0; i < effects.length; i++) effects[i].step();
  i = 0;
  while (i < effects.length) { if (effects[i].remove) effects.splice(i, 1); else i++; }

  if (!attractMode && !gameOver) {
   
    if (!endingWave && enemyCount <= 2 && enemyList.length === 0) {
      endingWave = true;
      waveEndTimer = 0;
    }
    if (endingWave) {
      var remaining = Math.max(0, 3 - Math.floor(waveEndTimer / 60));
      messageCenter('new wave in ' + remaining, -1, true);
      waveEndTimer++;
      if (waveEndTimer > 180) {
        showMessage = false;
        waveEndTimer2++;
        if (waveEndTimer2 > 64) { wave++; endingWave = false; initializeWorld(); }
      }
    }
  }

  if (attractMode && enemyCount <= 4 && enemyList.length === 0) initializeWorld();

  if (respawnPlayer && respawnAllowed && !gameOver) {
    spawnPlayer();
    respawnPlayer = false;
  }
}


function drawHud() {
  var x = W + 7, y = 8, i;
  hudSpritesBegin();
  for (i = 0; i < deaths && i < 16; i++) { hudSprite(2, x, y); y += 10; }
  for (i = 0; i <= lives && i < 16; i++) { hudSprite(78 + Math.floor(clock / 7) % 2, x, y); y += 10; }
  hudSpritesEnd();

  var s = 'score ' + score;
  var t = clamp(scoreTimer / 16, 0, 1);
  var tint = t < 0.5 ? 0xffffff : 0xff00ff;
  drawStringVertical(s, W + 8, H - s.length * FONT_ADVANCE - 4, tint);
}

var hudGroup = null, hudPool = [], hudUsed = 0;
function hudSpritesBegin() { hudUsed = 0; }
function hudSprite(frame, x, y) {
  var s;
  if (hudUsed < hudPool.length) s = hudPool[hudUsed];
  else { s = game.make.sprite(0, 0, 'sprites', 0); s.anchor.set(0.5); hudGroup.add(s); hudPool.push(s); }
  hudUsed++;
  s.visible = true; setFrame(s, frame); s.x = x; s.y = y;
}
function hudSpritesEnd() { for (var i = hudUsed; i < hudPool.length; i++) hudPool[i].visible = false; }


var pipGroup = null, pipPool = [];
function drawWaveBar() {
  var label = attractMode ? 'luminous corridor' : ('wave ' + wave);
  drawString(label, 3, H + 6, 0xff00ff);

  var pips = 0, g;
  for (g = 0; g < enemyList.length; g++) pips += enemyList[g].length;
  pips = Math.min(pips, 24);

  while (pipPool.length < pips) {
    var s = game.make.graphics(0, 0);
    s.beginFill(0xff00ff); s.drawRect(0, 0, 1, 3); s.endFill();
    pipGroup.add(s); pipPool.push(s);
  }
  for (g = 0; g < pipPool.length; g++) {
    if (g < pips) { pipPool[g].visible = true; pipPool[g].x = CW - 4 - g * 2; pipPool[g].y = H + 5; }
    else pipPool[g].visible = false;
  }
}

function drawMessage() {
  if (!showMessage || cut) return;
  messageTimer++;
  if (messageDuration !== -1 && messageTimer > messageDuration) { showMessage = false; return; }
  var y = Math.floor(H / 2);
  if (messageOpaque) drawFilledRect(0, y - 6, W - 1, y + 5, 0, 0, 0);
  drawStringCentered(messageString, W / 2, y);
}

function drawCutscene() {
  advanceTimer++;
  drawFilledRect(0, 0, W - 1, H - 1, 0, 0, 0);
  var boxTop = Math.floor(H / 2) - 40;
  drawRectangleOutline(8, boxTop, W - 9, boxTop + 80, 255, 0, 255);
  cutsceneSprite.visible = true;
  setFrame(cutsceneSprite, currentCutsceneImage * 2 + (Math.floor(clock / 7) % 2));
  cutsceneSprite.x = W / 2;
  cutsceneSprite.y = boxTop + 22;
  drawStringWrappedCentered(cutSceneText, W / 2, boxTop + 48, 24);
  if (advanceTimer > 28 && (Math.floor(advanceTimer / 16) % 2) === 0) {
    drawStringCentered('press fire', W / 2, H - 20, 0xffffff);
  }
  if (advanceTimer > CUT_SCENE_DURATION) endCutscene();
}
function endCutscene() {
  cut = false;
  cutsceneSprite.visible = false;
  nextWave();
  if (!playerCharacter) respawnPlayer = true;
}

function drawTransition() {
  transitionGraphics.clear();
  if (transitionTimer > transitionDuration) { transitionGraphics.visible = false; return; }
  transitionGraphics.visible = true;
  var t = clamp(transitionTimer / transitionDuration, 0, 1);
  if (transitionDirection === -1) t = 1 - t;
  var cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  var length = Math.floor(W * t), half = Math.floor(length / 2);
  var dist = Math.floor((W / 2) * t);
  transitionGraphics.beginFill(0x000000);
  transitionGraphics.drawRect(0, cy - half, cx - dist, length);
  transitionGraphics.drawRect(0, 0, W, cy - dist);
  transitionGraphics.drawRect(cx + dist, cy - half, cx - dist, length);
  transitionGraphics.drawRect(0, cy + dist, W, cy - dist);
  transitionGraphics.endFill();
  transitionGraphics.beginFill(0xff00ff);
  transitionGraphics.drawRect(cx - dist, cy - half, 1, length);
  transitionGraphics.drawRect(cx + dist, cy - half, 1, length);
  transitionGraphics.drawRect(cx - half, cy - dist, length, 1);
  transitionGraphics.drawRect(cx - half, cy + dist, length, 1);
  transitionGraphics.endFill();
  transitionTimer++;
}

function drawTouchStick() {
  if (!touch.active || cut) return;
  var lit = touch.fire ? 255 : 128, a, i;
  for (i = 0; i < 16; i++) {
    a = i * Math.PI / 8;
    setPixel(Math.floor(touchOriginX + Math.cos(a) * TOUCH_RANGE),
             Math.floor(touchOriginY + Math.sin(a) * TOUCH_RANGE), lit, 0, lit);
  }
  drawFilledRect(Math.floor(touchX) - 1, Math.floor(touchY) - 1,
                 Math.floor(touchX) + 1, Math.floor(touchY) + 1, 255, 0, 255);
}


function drawFrameBorder() {
  drawFilledRect(0, 0, W - 1, 0, 255, 0, 255);
  drawFilledRect(0, H - 1, W - 1, H - 1, 255, 0, 255);
  drawFilledRect(0, 0, 0, H - 1, 255, 0, 255);
  drawFilledRect(W - 1, 0, W - 1, H - 1, 255, 0, 255);
}


var fireWasDown = false;

var PlayState = {
  create: function () {
    game.stage.backgroundColor = '#000000';
    initPixelLayer();
    game.add.image(0, 0, caBmd);

    entityGroup = game.add.group();
    explosionGroup = game.add.group();
    explosionGroup.createMultiple(24, 'explosions', 12, false);
    explosionGroup.setAll('anchor.x', 0.5);
    explosionGroup.setAll('anchor.y', 0.5);

    cutsceneSprite = game.add.sprite(W / 2, H / 2, 'cutscenes', 0);
    cutsceneSprite.anchor.set(0.5);
    cutsceneSprite.visible = false;

    transitionGraphics = game.add.graphics(0, 0);

    hudGraphics = game.add.graphics(0, 0);
    hudGraphics.beginFill(0x000000);
    hudGraphics.drawRect(W, 0, HUDW, CH);
    hudGraphics.drawRect(0, H, CW, HUDH);
    hudGraphics.endFill();

    hudGroup = game.add.group();
    pipGroup = game.add.group();
    textGroup = game.add.group();

    keys = game.input.keyboard.addKeys({
      up:    Phaser.Keyboard.W, down:  Phaser.Keyboard.S,
      left:  Phaser.Keyboard.A, right: Phaser.Keyboard.D,
      up2:   Phaser.Keyboard.UP,   down2:  Phaser.Keyboard.DOWN,
      left2: Phaser.Keyboard.LEFT, right2: Phaser.Keyboard.RIGHT,
      hold:  Phaser.Keyboard.SHIFT,
      start: Phaser.Keyboard.ENTER, start2: Phaser.Keyboard.SPACEBAR
    });
    
    game.input.keyboard.addKeyCapture([
      Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.LEFT,
      Phaser.Keyboard.RIGHT, Phaser.Keyboard.SPACEBAR]);
    
    game.input.keyboard.addKey(Phaser.Keyboard.M).onDown.add(toggleSound);
     
    game.input.maxPointers = 1;
    game.input.onDown.add(touchDown, this);
    game.input.onUp.add(touchUp, this);
    game.input.addMoveCallback(touchMove, this);

    loadSounds();
    loadHighScore();
    fetchLeaderboard();
    beginAttractMode();
  },

  update: function () {
    clock++;
    scoreTimer++;

    stepTerrain();
    drawCells();
    var moveDown =
      keys.up.isDown   || keys.down.isDown  || keys.left.isDown  || keys.right.isDown ||
      keys.up2.isDown  || keys.down2.isDown || keys.left2.isDown || keys.right2.isDown;
    var fireDown = keys.start.isDown || keys.start2.isDown || moveDown || touch.active;


    var firePressed = fireDown && !fireWasDown;
    fireWasDown = fireDown;

    if (gameOver) {
      gameOverTimer++;
      updateWorld();  
      if (!updateNameEntry() && firePressed && gameOverTimer > 60) beginAttractMode();
    } else if (attractMode) {
      if (firePressed) beginGame();
      updateWorld();
    } else if (cut) {
      if (firePressed && advanceTimer > 28) endCutscene();
    } else {
      updateWorld();
    }

   
    if (explosionTimer > 0) {
      explosionTimer--;
      if (explosionTimer > 0) {
        if ((clock % 2) === 0) stepEffectLayer();
        drawEffectLayer();
      }
    }

    var i;
    for (i = 0; i < effects.length; i++) effects[i].draw();
    for (i = 0; i < entities.length; i++) if (entities[i].drawPixels) entities[i].drawPixels();

    entityGroup.visible = !cut;
    explosionGroup.visible = !cut;
    drawTouchStick();
    drawFrameBorder();

    textBegin();

    if (cut) drawCutscene();
    else cutsceneSprite.visible = false;

    drawMessage();

    if (gameOver) {
      drawGameOverPanel();
    } else if (attractMode) {
      drawAttractPanels();
    }

    flushPixels();

   
    for (i = 0; i < entities.length; i++) entities[i].sync();
    stepExplosions();

    drawHud();
    drawWaveBar();
    textEnd();

    drawTransition();

    if ((clock % 10) === 0) {
      liveCellCount = 0;
      for (i = 0; i < W * H; i++) if (grid[i] === damageState) liveCellCount++;
    }
  }
};


var PreloadState = {
  init: function () {
    this.tick = 0;
    this.loaded = 0;
    this.total = 2;
    this.shown = 0;
    this.fontReady = false;
    this.failed = false;
  },

  create: function () {
    var self = this;
    game.stage.backgroundColor = '#000000';

    var f = new Image();
    f.onload = function () {
      game.cache.addSpriteSheet('font', null, f, FONT_SIZE, FONT_SIZE, -1, 0, 0);
      textGroup = game.add.group();
      textPool = [];
      textUsed = 0;
      self.fontReady = true;
      self.loadAssets();
    };
    f.onerror = function () { self.loadAssets(); };
    f.src = FONT_URI;
  },

  loadAssets: function () {
    var self = this;
    function fail() { self.failed = true; self.loaded++; }

    var a = new Image();
    a.onload = function () {
      game.cache.addSpriteSheet('sprites', null, a, SPRITE_SIZE, SPRITE_SIZE, -1, 0, 0);
      game.cache.addSpriteSheet('explosions', null, a, EXPLOSION_SIZE, EXPLOSION_SIZE, -1, 0, 0);
      captureSheetPixels(a);
      self.loaded++;
    };
    a.onerror = fail;
    a.src = SPRITES_URI;

    var b = new Image();
    b.onload = function () {
      game.cache.addSpriteSheet('cutscenes', null, b, 128, 32, -1, 0, 0);
      self.loaded++;
    };
    b.onerror = fail;
    b.src = CUTSCENES_URI;
  },

  update: function () {
    this.tick++;

    var complete = this.loaded >= this.total;
    this.shown += ((complete ? 1 : this.loaded / this.total) - this.shown) * 0.12;

    if (this.fontReady) this.draw();

    if (complete && this.tick > 36 && this.shown > 0.985) game.state.start('Play');
  },

  draw: function () {
    var cx = CW / 2, cy = CH / 2;
    var tint = TEXT_COLORS[Math.abs((Math.floor(this.tick / 8) % 6) - 2)];
    var cells = 24, filled = Math.floor(cells * this.shown + 0.0001), i;

    textBegin();

    drawStringCentered('the luminous corridor', cx, cy - 20, tint);

    if (this.failed) drawStringCentered('assets missing', cx, cy + 16, 0xffffff);
    else drawStringCentered(Math.round(this.shown * 100) + '%', cx, cy + 16, 0x8000a0);

    var dots = 1 + (Math.floor(this.tick / 16) % 3);
    drawStringCentered('loading' + String('...').slice(0, dots), cx, cy + 30, 0xffffff);

    textEnd();
  },

  shutdown: function () {
    textGroup = null;
    textPool = [];
    textUsed = 0;
  }
};

var BootState = {
  init: function () {
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.renderer.renderSession.roundPixels = true;
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

    Phaser.Canvas.setImageRenderingCrisp(game.canvas);
    game.time.desiredFps = 65;
    game.time.desiredMinFps = 30;
    game.forceSingleUpdate = false;

    resize();
    setTimeout(resize, 0);
    setTimeout(resize, 250);
  },
  create: function () { game.state.start('Preload'); }
};

function resize() {
  if (!game || !game.scale) return;
  var vv = window.visualViewport;
  var availW = (vv ? vv.width : window.innerWidth) - 16;
  var availH = (vv ? vv.height : window.innerHeight) - 16;
  var raw = Math.min(availW / CW, availH / CH);
  var z = raw >= 2 ? Math.floor(raw) : Math.max(0.5, raw);
  game.scale.setUserScale(z, z, 0, 0);
}

window.addEventListener('load', function () {  
  if (window.PIXI && PIXI.scaleModes) PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

  var RENDERER = Phaser.AUTO;

  game = new Phaser.Game({
    width: CW,
    height: CH,
    renderer: RENDERER,
    parent: 'game-root',
    transparent: false,
    antialias: false,
    enableDebug: false
  });

  game.state.add('Boot', BootState);
  game.state.add('Preload', PreloadState);
  game.state.add('Play', PlayState);
  game.state.start('Boot');
});
