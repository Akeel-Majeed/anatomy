import { deflateRawSync } from "node:zlib";
import { packObj, toJson, unpackMesh, clusterDecimate, octEncode, octDecode, zipEntries, zipRead } from "./mesh.mjs";

const assert = (ok, message) => {
  if (!ok) throw new Error(`mesh-test: ${message}`);
};

const corners = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const cube = `${corners.map((c) => `v ${c.join(" ")}`).join("\n")}
v 0 0 0
v 1 1 1
vt 0 0
vn 0 0 1
f 1 4 3 2
f 5 6 -1 8
f 9/1 2/1 6/1 5/1
f 3//1 4//1 8//1 10//1
f 1/1/1 5/1/1 8/1/1 4/1/1
f 2 3 7 6
f 2 2 3
`;
const packed = packObj(cube);
assert(packed.verts === 8, `cube verts ${packed.verts}`);
assert(packed.faces === 12, `cube faces ${packed.faces}`);
assert(packed.indices instanceof Uint16Array && packed.indices.length === 36, "cube indices");
const mesh = unpackMesh(toJson(packed, { atlas: "test", id: "cube", name: "Cube", units: "mm" }));
assert(mesh.name === "Cube" && mesh.index === "u16", "meta round-trip");
for (let i = 0; i < 8; i++) {
  const expected = corners[i].map((c) => (c - 0.5) / Math.sqrt(0.75));
  let dot = 0;
  let length = 0;
  for (let a = 0; a < 3; a++) {
    assert(Math.abs(mesh.positions[i * 3 + a] - corners[i][a]) <= 1 / 65535, `position ${i} axis ${a}`);
    dot += mesh.normals[i * 3 + a] * expected[a];
    length += mesh.normals[i * 3 + a] ** 2;
  }
  assert(Math.abs(Math.sqrt(length) - 1) < 0.02, `normal ${i} length`);
  assert(dot > 0.9, `normal ${i} points out (${dot.toFixed(3)})`);
}
for (const raw of [[0, 0, 1], [0, 0, -1], [0.6, -0.8, 0], [-0.3, 0.4, -0.866]]) {
  const n = raw.map((v) => v / Math.hypot(...raw));
  const back = octDecode(...octEncode(...n));
  assert(back.every((v, a) => Math.abs(v - n[a]) < 1e-6), `oct round-trip ${n}`);
}

const side = 40;
const grid = (z) => {
  const positions = new Float32Array(side * side * 3);
  const faces = [];
  for (let j = 0; j < side; j++) {
    for (let i = 0; i < side; i++) {
      positions.set([i, j, z], (j * side + i) * 3);
      if (i && j) {
        const v = j * side + i;
        faces.push(v - side - 1, v - side, v, v - side - 1, v, v - 1);
      }
    }
  }
  return { positions, indices: Uint32Array.from(faces) };
};
const plane = grid(0);
assert(plane.indices.length / 3 === 3042, "plane faces");
const thin = clusterDecimate(plane.positions, plane.indices, 2);
assert(thin.indices.length > 0 && thin.indices.length / 3 < 3042 / 2, `clusterDecimate left ${thin.indices.length / 3} faces`);
assert(thin.positions.length / 3 < plane.positions.length / 3, "clusterDecimate merged vertices");

const sheets = [grid(0), grid(1)];
const objOf = (meshes) => {
  let base = 0;
  let text = "";
  for (const m of meshes) {
    for (let i = 0; i < m.positions.length; i += 3) text += `v ${m.positions[i]} ${m.positions[i + 1]} ${m.positions[i + 2]}\n`;
    for (let f = 0; f < m.indices.length; f += 3) text += `f ${base + m.indices[f] + 1} ${base + m.indices[f + 1] + 1} ${base + m.indices[f + 2] + 1}\n`;
    base += m.positions.length / 3;
  }
  return text;
};
const budget = packObj(objOf(sheets), { maxFaces: 1000 });
assert(budget.faces > 0 && budget.faces <= 1000, `decimated to ${budget.faces} faces`);
assert(packObj(objOf(sheets)).faces === 6084, "no decimation under budget");

const zipOf = (files) => {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const [name, data, method, extra] of files) {
    const body = method === 8 ? deflateRawSync(data) : data;
    const nameBytes = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(extra.length, 28);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(method, 10);
    header.writeUInt32LE(body.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(nameBytes.length, 28);
    header.writeUInt32LE(offset, 42);
    parts.push(local, nameBytes, extra, body);
    central.push(header, nameBytes);
    offset += local.length + nameBytes.length + extra.length + body.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
};
const obj = Buffer.from(cube.repeat(50));
const zip = zipOf([["FMA1.obj", obj, 8, Buffer.from("xxxx")], ["notes/readme.txt", Buffer.from("hello"), 0, Buffer.alloc(0)]]);
const entries = zipEntries(zip);
assert(entries.size === 2 && entries.get("FMA1.obj").method === 8 && entries.get("FMA1.obj").size === obj.length, "zip entries");
assert(zipRead(zip, entries.get("FMA1.obj")).equals(obj), "zip inflate");
assert(zipRead(zip, entries.get("notes/readme.txt")).toString() === "hello", "zip stored");

console.log("mesh-test: passed");
