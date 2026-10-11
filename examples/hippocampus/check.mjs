export function checkTruth(PARTS, PATHS, drawn = null) {
  const ids = new Set();
  const ns = new Set();
  const fail = (message) => {
    throw new Error(`truth: ${message}`);
  };
  for (const part of PARTS) {
    if (ids.has(part.id)) fail(`duplicate id ${part.id}`);
    if (ns.has(part.n)) fail(`duplicate n ${part.n} (${part.id})`);
    if (!part.name) fail(`${part.id} has no name`);
    if (!part.source) fail(`${part.id} has no source`);
    ids.add(part.id);
    ns.add(part.n);
  }
  const byId = new Map(PARTS.map((part) => [part.id, part]));
  for (const part of PARTS) {
    if (part.layerOf && !byId.has(part.layerOf)) fail(`${part.id}.layerOf ${part.layerOf} is not a part`);
    for (const other of part.borders ?? []) {
      if (!byId.has(other)) fail(`${part.id} borders ${other}, which is not a part`);
      if (!(byId.get(other).borders ?? []).includes(part.id)) fail(`${part.id} borders ${other} but not the other way`);
    }
  }
  for (const path of PATHS) {
    if (!byId.has(path.from)) fail(`${path.id}.from ${path.from} is not a part`);
    if (!byId.has(path.to)) fail(`${path.id}.to ${path.to} is not a part`);
    if (!path.source) fail(`${path.id} has no source`);
  }
  if (drawn) {
    for (const part of PARTS) {
      if (!drawn.regions.has(part.id)) fail(`${part.id} (${part.name}) has no drawn region`);
      if (!drawn.pins.has(part.id)) fail(`${part.id} (${part.name}) has no pin`);
    }
    for (const id of drawn.pins) if (!byId.has(id)) fail(`pin ${id} has no truth row`);
  }
  return { parts: PARTS.length, paths: PATHS.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ok = [
    { n: 1, id: "a", name: "A", synonyms: [], borders: ["b"], source: "s" },
    { n: 2, id: "b", name: "B", synonyms: [], borders: ["a"], source: "s" },
    { n: 3, id: "a-l", name: "A layer", synonyms: [], layerOf: "a", borders: [], source: "s" },
  ];
  const paths = [{ id: "p", name: "P", from: "a", to: "b", source: "s" }];
  const expectThrow = (parts, ps, drawn, text) => {
    let caught = "";
    try {
      checkTruth(parts, ps, drawn);
    } catch (error) {
      caught = error.message;
    }
    if (!caught.includes(text)) throw new Error(`expected "${text}", got "${caught}"`);
  };
  checkTruth(ok, paths);
  checkTruth(ok, paths, { regions: new Set(["a", "b", "a-l"]), pins: new Set(["a", "b", "a-l"]) });
  expectThrow([...ok, { ...ok[0], n: 9 }], paths, null, "duplicate id a");
  expectThrow([ok[0], { ...ok[1], borders: [] }, ok[2]], paths, null, "not the other way");
  expectThrow(ok, [{ ...paths[0], to: "zz" }], null, "not a part");
  expectThrow(ok, paths, { regions: new Set(["a", "b"]), pins: new Set(["a", "b", "a-l"]) }, "has no drawn region");
  expectThrow(ok, paths, { regions: new Set(["a", "b", "a-l"]), pins: new Set(["a", "b"]) }, "has no pin");
  expectThrow(ok, paths, { regions: new Set(["a", "b", "a-l"]), pins: new Set(["a", "b", "a-l", "q"]) }, "has no truth row");
  console.log("check.mjs: self-test passed");
}
