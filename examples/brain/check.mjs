export function checkTruth(PARTS, meshes, atlasNames) {
  const fail = (message) => {
    throw new Error(`truth: ${message}`);
  };
  const ids = new Set();
  const claimed = new Set();
  PARTS.forEach((part, index) => {
    if (ids.has(part.id)) fail(`duplicate id ${part.id}`);
    ids.add(part.id);
    if (part.n !== index + 1) fail(`${part.id} has n ${part.n}, expected ${index + 1}`);
    if (!/^#[0-9a-f]{6}$/.test(part.tone ?? "")) fail(`${part.id} has no tone`);
    part.atlas.ids.forEach((id, i) => {
      if (claimed.has(id)) fail(`duplicate atlas id ${id} (${part.id})`);
      claimed.add(id);
      const mesh = meshes.get(id);
      if (!mesh) fail(`${part.id} has no mesh for ${id}`);
      if (!mesh.faces) fail(`${id} (${part.id}) has zero faces`);
      for (let k = 0; k < mesh.positions.length; k++) if (!Number.isFinite(mesh.positions[k])) fail(`${id} (${part.id}) has a non-finite position`);
      if (part.atlas.names[i] !== atlasNames.get(id)) fail(`${part.id} names ${id} "${part.atlas.names[i]}" but the atlas says "${atlasNames.get(id)}"`);
    });
  });
  for (const id of meshes.keys()) if (!claimed.has(id)) fail(`mesh ${id} has no part`);
  return { parts: PARTS.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mesh = (faces = 1, bad = false) => ({ faces, positions: Float32Array.from([0, 0, bad ? NaN : 0]) });
  const meshes = new Map([["X1", mesh()], ["X2", mesh()], ["Y1", mesh()]]);
  const names = new Map([["X1", "right x"], ["X2", "left x"], ["Y1", "y"]]);
  const ok = [
    { n: 1, id: "x", name: "X", tone: "#a1b2c3", atlas: { db: "t", ids: ["X1", "X2"], names: ["right x", "left x"] } },
    { n: 2, id: "y", name: "Y", tone: "#000000", atlas: { db: "t", ids: ["Y1"], names: ["y"] } },
  ];
  const expectThrow = (parts, ms, text) => {
    let caught = "";
    try {
      checkTruth(parts, ms, names);
    } catch (error) {
      caught = error.message;
    }
    if (!caught.includes(text)) throw new Error(`expected "${text}", got "${caught}"`);
  };
  checkTruth(ok, meshes, names);
  expectThrow([ok[0], { ...ok[1], id: "x" }], meshes, "duplicate id x");
  expectThrow([ok[0], { ...ok[1], n: 3 }], meshes, "has n 3, expected 2");
  expectThrow([ok[0], { ...ok[1], atlas: { ...ok[1].atlas, ids: ["Y9"] } }], meshes, "no mesh for Y9");
  expectThrow([ok[0]], meshes, "mesh Y1 has no part");
  expectThrow(ok, new Map([...meshes, ["Y1", mesh(0)]]), "zero faces");
  expectThrow(ok, new Map([...meshes, ["Y1", mesh(1, true)]]), "non-finite position");
  expectThrow([ok[0], { ...ok[1], atlas: { ...ok[1].atlas, names: ["why"] } }], meshes, 'but the atlas says "y"');
  expectThrow([ok[0], { ...ok[1], tone: "#ABC" }], meshes, "has no tone");
  console.log("check.mjs: self-test passed");
}
