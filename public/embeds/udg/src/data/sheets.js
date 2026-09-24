const seq = (prefix, n, from = 0) =>
  Array.from({ length: n }, (_, i) => prefix + (i + from));

export const CHAR_SHEETS = {
  player: {
    size: [6, 7],
    frames: ["pf0", "pf1", "pb0", "pb1"],
    anims: {
      p_f: { frames: [0, 1], rate: 7 },
      p_b: { frames: [2, 3], rate: 7 },
    },
  },
  slime: {
    size: [8, 6],
    frames: ["sl0", "sl1"],
    anims: { slime: { frames: [0, 1], rate: 3 } },
  },
  bat: {
    size: [8, 8],
    frames: ["bt0", "bt1"],
    anims: { bat: { frames: [0, 1], rate: 10 } },
  },
  skel: {
    size: [8, 11],
    frames: ["sk0", "sk1"],
    anims: { skel: { frames: [0, 1], rate: 5 } },
  },
  cult: {
    size: [8, 8],
    frames: ["cu0", "cu1"],
    anims: { cult: { frames: [0, 0, 1], rate: 3 } },
  },
  brute: {
    size: [16, 16],
    frames: ["br0", "br1"],
    anims: { brute: { frames: [0, 1], rate: 10 } },
  },
  snake: {
    size: [7, 6],
    frames: ["sn_h0", "sn_h1"],
    anims: { snake: { frames: [0, 0, 1], rate: 6 } },
  },
  snake_seg: { size: [8, 5], frames: ["sn_s", "sn_s2"] },
  snake_tail: { size: [6, 6], frames: ["sn_t"] },
};

const corpse = (name, size) => ({
  size,
  frames: [...seq(`c_${name}_g`, 6), `c_${name}`, `c_${name}_f`],
});
export const GORE_SHEETS = {
  corpse_slime: corpse("slime", [16, 5]),
  corpse_bat: corpse("bat", [14, 5]),
  corpse_snhead: corpse("snhead", [15, 5]),
  corpse_snseg: corpse("snseg", [12, 4]),
  corpse_skel: corpse("skel", [17, 5]),
  corpse_cult: corpse("cult", [18, 6]),
  corpse_brute: corpse("brute", [22, 6]),
  corpse_player: corpse("player", [19, 6]),
  gibs_m: {
    size: [5, 3],
    frames: [...seq("gb_m_", 10), "gib_m", "gib_m2", "gib_m3"],
  },
  gibs_c: {
    size: [5, 3],
    frames: [...seq("gb_c_", 10), "gib_c", "gib_c2", "gib_c3"],
  },
  gibs_w: {
    size: [6, 3],
    frames: [...seq("gb_w_", 10), "bone", "bone2", "bone3"],
  },
  pools_m: {
    size: [26, 9],
    frames: [...seq("cp_m_", 8), "pool_m", "cp_big_m"],
  },
  pools_c: { size: [17, 7], frames: seq("cp_c_", 8) },
  pools_w: { size: [18, 7], frames: seq("cp_w_", 8) },
  runs_m: { size: [6, 1], frames: seq("gr_m_", 10) },
  runs_c: { size: [5, 1], frames: seq("gr_c_", 10) },
  runs_w: { size: [6, 1], frames: seq("gr_w_", 10) },
  blood: {
    size: [3, 3],
    frames: [...seq("d_m", 4, 1), ...seq("d_c", 4, 1), ...seq("d_w", 4, 1)],
  },
  debris: {
    size: [2, 2],
    frames: ["shard", "shard2", "shard3", "splint", "splint2", "splint3"],
  },
};

export const SHEET_GROUPS = { characters: CHAR_SHEETS, gore: GORE_SHEETS };
export const SHEETS = { ...CHAR_SHEETS, ...GORE_SHEETS };

const FRAME_OF = {};
for (const [sheet, def] of Object.entries(SHEETS))
  def.frames.forEach((name, i) => {
    FRAME_OF[name] = [sheet, i];
  });

export const tex = (name) => FRAME_OF[name] || [name];

export const PF = { front: 0, back: 2 };
