const BP3D = "https://lifesciencedb.jp/bp3d/";

export const SOURCE = { title: "BodyParts3D 4.0", url: BP3D, licence: "CC BY-SA 2.1 JP", fetched: "2026-10-12" };
export const FRAME = { up: [0, 0, 1], front: [0, -1, 0], open: [35, 30] };
export const PARTS = [
  { n: 1, id: "hippocampus", name: "Hippocampus", synonyms: [], tone: "#e08a7a", atlas: { db: "bp3d", ids: ["FMA62493"], names: ["hippocampus"] }, source: BP3D },
  { n: 2, id: "amygdala", name: "Amygdala", synonyms: ["Amygdaloid body"], tone: "#e0b36b", atlas: { db: "bp3d", ids: ["FMA61841"], names: ["amygdala"] }, source: BP3D },
  { n: 3, id: "fornix", name: "Fornix", synonyms: ["Fornix of forebrain"], tone: "#efe9d6", atlas: { db: "bp3d", ids: ["FMA61965"], names: ["fornix of forebrain"] }, source: BP3D },
  { n: 4, id: "parahippocampal", name: "Parahippocampal gyrus", synonyms: [], tone: "#c9a3b8", atlas: { db: "bp3d", ids: ["FMA61918"], names: ["parahippocampal gyrus"] }, source: BP3D },
];
export const PATHS = [];
