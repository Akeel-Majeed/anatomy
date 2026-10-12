const BP3D = "https://lifesciencedb.jp/bp3d/";

export const SOURCE = { title: "BodyParts3D 4.0", url: BP3D, licence: "CC BY-SA 2.1 JP", fetched: "2026-10-12" };
export const FRAME = { up: [0, 0, 1], front: [0, -1, 0], open: [40, 10] };
export const PARTS = [
  { n: 1, id: "hippocampus", name: "Hippocampus", synonyms: [], tone: "#e08a7a", atlas: { db: "bp3d", ids: ["FMA62493"], names: ["hippocampus"] }, source: BP3D },
  { n: 2, id: "fornix", name: "Fornix", synonyms: ["Fornix of forebrain"], tone: "#efe9d6", atlas: { db: "bp3d", ids: ["FMA61965"], names: ["fornix of forebrain"] }, source: BP3D },
  { n: 3, id: "mammillary", name: "Mammillary body", synonyms: ["Mammillary bodies"], tone: "#e0b36b", atlas: { db: "bp3d", ids: ["FMA74877"], names: ["mammillary body"] }, source: BP3D },
  { n: 4, id: "thalamus", name: "Thalamus", synonyms: [], tone: "#8fb8d9", atlas: { db: "bp3d", ids: ["FMA62007"], names: ["thalamus"] }, source: BP3D },
  { n: 5, id: "hypothalamus", name: "Hypothalamus", synonyms: [], tone: "#9fc7b8", atlas: { db: "bp3d", ids: ["FMA62008"], names: ["hypothalamus"] }, source: BP3D },
  { n: 6, id: "amygdala", name: "Amygdala", synonyms: ["Amygdaloid body"], tone: "#d9a060", atlas: { db: "bp3d", ids: ["FMA61841"], names: ["amygdala"] }, source: BP3D },
  { n: 7, id: "cingulate", name: "Cingulate gyrus", synonyms: [], tone: "#d9a3a3", atlas: { db: "bp3d", ids: ["FMA62434"], names: ["cingulate gyrus"] }, source: BP3D },
  { n: 8, id: "parahippocampal", name: "Parahippocampal gyrus", synonyms: [], tone: "#c9a3b8", atlas: { db: "bp3d", ids: ["FMA61918"], names: ["parahippocampal gyrus"] }, source: BP3D },
];
export const PATHS = [];
