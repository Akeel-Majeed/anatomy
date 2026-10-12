const BP3D = "https://lifesciencedb.jp/bp3d/";
const ALLEN = "https://atlas.brain-map.org/";

export const HUMAN = {
  SOURCE: { title: "BodyParts3D 4.0", url: BP3D, licence: "CC BY-SA 2.1 JP", fetched: "2026-10-12" },
  FRAME: { up: [0, 0, 1], front: [0, -1, 0], open: [35, 30] },
  PARTS: [
    { n: 1, id: "hippocampus", name: "Hippocampus", synonyms: [], tone: "#e08a7a", atlas: { db: "bp3d", ids: ["FMA62493"], names: ["hippocampus"] }, source: BP3D },
    { n: 2, id: "amygdala", name: "Amygdala", synonyms: ["Amygdaloid body"], tone: "#e0b36b", atlas: { db: "bp3d", ids: ["FMA61841"], names: ["amygdala"] }, source: BP3D },
    { n: 3, id: "fornix", name: "Fornix", synonyms: ["Fornix of forebrain"], tone: "#efe9d6", atlas: { db: "bp3d", ids: ["FMA61965"], names: ["fornix of forebrain"] }, source: BP3D },
    { n: 4, id: "parahippocampal", name: "Parahippocampal gyrus", synonyms: [], tone: "#c9a3b8", atlas: { db: "bp3d", ids: ["FMA61918"], names: ["parahippocampal gyrus"] }, source: BP3D },
  ],
  PATHS: [],
};

// Tones: hippocampus #e08a7a and cortex #c9a3b8 mixed 8/16/24% toward white per subfield step.
export const MOUSE = {
  SOURCE: { title: "Allen Mouse Brain Common Coordinate Framework v3 (CCF 2017)", url: ALLEN, licence: "Allen Institute Terms of Use", fetched: "2026-10-12" },
  FRAME: { up: [0, -1, 0], front: [-1, 0, 0], open: [35, 30] },
  PARTS: [
    { n: 1, id: "ca1", name: "Field CA1", synonyms: [], tone: "#e08a7a", atlas: { db: "allen", ids: ["382"], names: ["Field CA1"] }, source: ALLEN },
    { n: 2, id: "ca2", name: "Field CA2", synonyms: [], tone: "#e29385", atlas: { db: "allen", ids: ["423"], names: ["Field CA2"] }, source: ALLEN },
    { n: 3, id: "ca3", name: "Field CA3", synonyms: [], tone: "#e59d8f", atlas: { db: "allen", ids: ["463"], names: ["Field CA3"] }, source: ALLEN },
    { n: 4, id: "dg", name: "Dentate gyrus", synonyms: [], tone: "#e7a69a", atlas: { db: "allen", ids: ["726"], names: ["Dentate gyrus"] }, source: ALLEN },
    { n: 5, id: "sub", name: "Subiculum", synonyms: [], tone: "#c9a3b8", atlas: { db: "allen", ids: ["502"], names: ["Subiculum"] }, source: ALLEN },
    { n: 6, id: "presub", name: "Presubiculum", synonyms: [], tone: "#cdaabe", atlas: { db: "allen", ids: ["1084"], names: ["Presubiculum"] }, source: ALLEN },
    { n: 7, id: "parasub", name: "Parasubiculum", synonyms: [], tone: "#d2b2c3", atlas: { db: "allen", ids: ["843"], names: ["Parasubiculum"] }, source: ALLEN },
    { n: 8, id: "postsub", name: "Postsubiculum", synonyms: [], tone: "#d6b9c9", atlas: { db: "allen", ids: ["1037"], names: ["Postsubiculum"] }, source: ALLEN },
    { n: 9, id: "ent", name: "Entorhinal area", synonyms: [], tone: "#d9a3a3", atlas: { db: "allen", ids: ["909"], names: ["Entorhinal area"] }, source: ALLEN },
  ],
  PATHS: [],
};
