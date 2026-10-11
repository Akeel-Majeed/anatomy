export const SOURCE = {
  title: "Hippocampus - Wikipedia",
  url: "https://en.wikipedia.org/wiki/Hippocampus",
  fetched: "2026-10-11",
  convention: "",
};

export const PARTS = [
  { n: 1, id: "dg", name: "Dentate gyrus", synonyms: ["gyrus dentatus"], borders: ["hilus"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 2, id: "dg-molecular", name: "Molecular layer", synonyms: [], layerOf: "dg", borders: ["dg-granule"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 3, id: "dg-granule", name: "Granule cell layer", synonyms: [], layerOf: "dg", borders: ["dg-molecular"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 4, id: "hilus", name: "Hilus", synonyms: ["CA4", "polymorphic layer"], borders: ["dg", "ca3"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 5, id: "ca3", name: "CA3", synonyms: [], borders: ["hilus", "ca2", "alveus"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 6, id: "ca2", name: "CA2", synonyms: [], borders: ["ca3", "ca1", "alveus"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 7, id: "ca1", name: "CA1", synonyms: [], borders: ["ca2", "subiculum", "alveus"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 8, id: "ca1-oriens", name: "Stratum oriens", synonyms: [], layerOf: "ca1", borders: ["ca1-pyramidale"], source: "https://en.wikipedia.org/wiki/Hippocampus_anatomy" },
  { n: 9, id: "ca1-pyramidale", name: "Stratum pyramidale", synonyms: [], layerOf: "ca1", borders: ["ca1-oriens", "ca1-radiatum"], source: "https://en.wikipedia.org/wiki/Hippocampus_anatomy" },
  { n: 10, id: "ca1-radiatum", name: "Stratum radiatum", synonyms: [], layerOf: "ca1", borders: ["ca1-pyramidale", "ca1-lacunosum-moleculare"], source: "https://en.wikipedia.org/wiki/Hippocampus_anatomy" },
  { n: 11, id: "ca1-lacunosum-moleculare", name: "Stratum lacunosum-moleculare", synonyms: [], layerOf: "ca1", borders: ["ca1-radiatum"], source: "https://en.wikipedia.org/wiki/Hippocampus_anatomy" },
  { n: 12, id: "subiculum", name: "Subiculum", synonyms: [], borders: ["ca1", "presubiculum"], source: "https://en.wikipedia.org/wiki/Subiculum" },
  { n: 13, id: "presubiculum", name: "Presubiculum", synonyms: [], borders: ["subiculum", "parasubiculum"], source: "https://en.wikipedia.org/wiki/Subiculum" },
  { n: 14, id: "parasubiculum", name: "Parasubiculum", synonyms: [], borders: ["presubiculum", "ec"], source: "https://en.wikipedia.org/wiki/Subiculum" },
  { n: 15, id: "ec", name: "Entorhinal cortex", synonyms: ["cortex entorhinalis"], borders: ["parasubiculum"], source: "https://en.wikipedia.org/wiki/Entorhinal_cortex" },
  { n: 16, id: "alveus", name: "Alveus", synonyms: [], borders: ["ca3", "ca2", "ca1", "fimbria"], source: "https://en.wikipedia.org/wiki/Hippocampus_anatomy" },
  { n: 17, id: "fimbria", name: "Fimbria", synonyms: ["fimbria hippocampi"], borders: ["alveus"], source: "https://en.wikipedia.org/wiki/Hippocampus_anatomy" },
];

export const PATHS = [
  { id: "perforant", name: "Perforant path", from: "ec", to: "dg", source: "https://en.wikipedia.org/wiki/Perforant_path" },
  { id: "mossy", name: "Mossy fibres", from: "dg", to: "ca3", source: "https://en.wikipedia.org/wiki/Mossy_fiber_(hippocampus)" },
  { id: "schaffer", name: "Schaffer collaterals", from: "ca3", to: "ca1", source: "https://en.wikipedia.org/wiki/Schaffer_collateral" },
  { id: "ca1-sub", name: "CA1 to subiculum", from: "ca1", to: "subiculum", source: "https://en.wikipedia.org/wiki/Subiculum" },
  { id: "sub-ec", name: "Subiculum to entorhinal cortex", from: "subiculum", to: "ec", source: "https://en.wikipedia.org/wiki/Subiculum" },
];
