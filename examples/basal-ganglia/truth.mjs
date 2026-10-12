const BP3D = "https://lifesciencedb.jp/bp3d/";

export const SOURCE = { title: "BodyParts3D 4.0", url: BP3D, licence: "CC BY-SA 2.1 JP", fetched: "2026-10-12" };
export const FRAME = { up: [0, 0, 1], front: [0, -1, 0], open: [110, -15] };
export const PARTS = [
  { n: 1, id: "caudate", name: "Caudate nucleus", synonyms: [], tone: "#e0b36b", atlas: { db: "bp3d", ids: ["FMA61833"], names: ["caudate nucleus"] }, source: BP3D },
  { n: 2, id: "putamen", name: "Putamen", synonyms: [], tone: "#e6a86b", atlas: { db: "bp3d", ids: ["FMA61834"], names: ["putamen"] }, source: BP3D },
  { n: 3, id: "pallidus", name: "Globus pallidus", synonyms: ["Pallidum"], tone: "#c9c96a", atlas: { db: "bp3d", ids: ["FMA61835"], names: ["globus pallidus"] }, source: BP3D },
  { n: 4, id: "thalamus", name: "Thalamus", synonyms: [], tone: "#8fb8d9", atlas: { db: "bp3d", ids: ["FMA62007"], names: ["thalamus"] }, source: BP3D },
];
export const PATHS = [];
