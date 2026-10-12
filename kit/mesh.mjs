import { inflateRawSync } from "node:zlib";

const bboxOf = (positions) => {
  const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      box[a] = Math.min(box[a], positions[i + a]);
      box[a + 3] = Math.max(box[a + 3], positions[i + a]);
    }
  }
  return box;
};

const vertexNormals = (positions, indices) => {
  const normals = new Float32Array(positions.length);
  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f] * 3;
    const b = indices[f + 1] * 3;
    const c = indices[f + 2] * 3;
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const i of [a, b, c]) {
      normals[i] += nx;
      normals[i + 1] += ny;
      normals[i + 2] += nz;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= length;
    normals[i + 1] /= length;
    normals[i + 2] /= length;
  }
  return normals;
};

export function octEncode(x, y, z) {
  const l = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
  let u = x / l;
  let v = y / l;
  if (z < 0) [u, v] = [(1 - Math.abs(v)) * Math.sign(u || 1), (1 - Math.abs(u)) * Math.sign(v || 1)];
  return [u, v];
}

export function octDecode(u, v) {
  const z = 1 - Math.abs(u) - Math.abs(v);
  let x = u;
  let y = v;
  if (z < 0) [x, y] = [(1 - Math.abs(v)) * Math.sign(u || 1), (1 - Math.abs(u)) * Math.sign(v || 1)];
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

export function clusterDecimate(positions, indices, cell) {
  const box = bboxOf(positions);
  const cells = new Map();
  const clusterOf = new Uint32Array(positions.length / 3);
  const sums = [];
  for (let i = 0; i < clusterOf.length; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const key = `${Math.floor((x - box[0]) / cell)},${Math.floor((y - box[1]) / cell)},${Math.floor((z - box[2]) / cell)}`;
    let c = cells.get(key);
    if (c === undefined) {
      c = sums.length / 4;
      cells.set(key, c);
      sums.push(0, 0, 0, 0);
    }
    clusterOf[i] = c;
    sums[c * 4] += x;
    sums[c * 4 + 1] += y;
    sums[c * 4 + 2] += z;
    sums[c * 4 + 3]++;
  }
  const out = new Float32Array((sums.length / 4) * 3);
  for (let c = 0; c < sums.length / 4; c++) for (let a = 0; a < 3; a++) out[c * 3 + a] = sums[c * 4 + a] / sums[c * 4 + 3];
  const seen = new Set();
  const faces = [];
  for (let f = 0; f < indices.length; f += 3) {
    const a = clusterOf[indices[f]];
    const b = clusterOf[indices[f + 1]];
    const c = clusterOf[indices[f + 2]];
    if (a === b || b === c || a === c) continue;
    const key = a < b && a < c ? `${a},${b},${c}` : b < c ? `${b},${c},${a}` : `${c},${a},${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    faces.push(a, b, c);
  }
  return { positions: out, indices: Uint32Array.from(faces) };
}

export function packObj(text, { maxFaces = 60000 } = {}) {
  const weld = new Map();
  const welded = [];
  const coords = [];
  const faces = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line[0] === "v" && line[1] === " ") {
      const key = line.slice(2).trim().split(/\s+/, 3).join(" ");
      let w = weld.get(key);
      if (w === undefined) {
        w = coords.length / 3;
        weld.set(key, w);
        coords.push(...key.split(" ").map(Number));
      }
      welded.push(w);
    } else if (line[0] === "f" && line[1] === " ") {
      const refs = line.slice(2).trim().split(/\s+/).map((ref) => {
        const i = parseInt(ref, 10);
        return welded[i < 0 ? welded.length + i : i - 1];
      });
      for (let k = 1; k + 1 < refs.length; k++) {
        const [a, b, c] = [refs[0], refs[k], refs[k + 1]];
        if (a !== b && b !== c && a !== c) faces.push(a, b, c);
      }
    }
  }
  let positions = Float32Array.from(coords);
  let indices = Uint32Array.from(faces);
  if (indices.length / 3 > maxFaces) {
    const box = bboxOf(positions);
    let cell = Math.cbrt(((box[3] - box[0]) * (box[4] - box[1]) * (box[5] - box[2])) / (maxFaces / 2));
    for (;;) {
      const thin = clusterDecimate(positions, indices, cell);
      if (thin.indices.length / 3 <= maxFaces) {
        ({ positions, indices } = thin);
        break;
      }
      cell *= 1.25;
    }
  }
  const bbox = bboxOf(positions);
  const normals = vertexNormals(positions, indices);
  const verts = positions.length / 3;
  const q = new Int16Array(verts * 3);
  for (let i = 0; i < q.length; i++) {
    const a = i % 3;
    const span = bbox[a + 3] - bbox[a];
    q[i] = span ? Math.round(((positions[i] - bbox[a]) / span) * 65535) - 32768 : 0;
  }
  const oct = new Int8Array(verts * 2);
  for (let i = 0; i < verts; i++) {
    const [u, v] = octEncode(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    oct[i * 2] = Math.round(u * 127);
    oct[i * 2 + 1] = Math.round(v * 127);
  }
  return { faces: indices.length / 3, verts, bbox, positions: q, normals: oct, indices: verts <= 65535 ? Uint16Array.from(indices) : indices };
}

const base64 = (array) => Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString("base64");

export function toJson(packed, meta) {
  const { faces, verts, bbox, positions, normals, indices } = packed;
  return JSON.stringify({ ...meta, faces, verts, bbox, index: indices instanceof Uint16Array ? "u16" : "u32", positions: base64(positions), normals: base64(normals), indices: base64(indices) });
}

export function unpackMesh(json) {
  const m = typeof json === "string" ? JSON.parse(json) : json;
  const bytes = (text) => {
    const b = Buffer.from(text, "base64");
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  };
  const q = new Int16Array(bytes(m.positions));
  const oct = new Int8Array(bytes(m.normals));
  const positions = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) {
    const a = i % 3;
    positions[i] = m.bbox[a] + ((q[i] + 32768) / 65535) * (m.bbox[a + 3] - m.bbox[a]);
  }
  const normals = new Float32Array((oct.length / 2) * 3);
  for (let i = 0; i < oct.length / 2; i++) normals.set(octDecode(oct[i * 2] / 127, oct[i * 2 + 1] / 127), i * 3);
  const indices = m.index === "u16" ? new Uint16Array(bytes(m.indices)) : new Uint32Array(bytes(m.indices));
  return { ...m, positions, normals, indices };
}

// ponytail: no ZIP64 and no CRC check; the atlas archives are under 4 GB with far fewer than 65535 entries
export function zipEntries(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("zip: no end of central directory");
  const count = buffer.readUInt16LE(end + 10);
  let at = buffer.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(at) !== 0x02014b50) throw new Error("zip: bad central directory");
    const nameLength = buffer.readUInt16LE(at + 28);
    entries.set(buffer.toString("utf8", at + 46, at + 46 + nameLength), { method: buffer.readUInt16LE(at + 10), compressedSize: buffer.readUInt32LE(at + 20), size: buffer.readUInt32LE(at + 24), offset: buffer.readUInt32LE(at + 42) });
    at += 46 + nameLength + buffer.readUInt16LE(at + 30) + buffer.readUInt16LE(at + 32);
  }
  return entries;
}

export function zipRead(buffer, entry) {
  const at = entry.offset;
  if (buffer.readUInt32LE(at) !== 0x04034b50) throw new Error("zip: bad local header");
  const start = at + 30 + buffer.readUInt16LE(at + 26) + buffer.readUInt16LE(at + 28);
  const data = buffer.subarray(start, start + entry.compressedSize);
  if (entry.method === 8) return inflateRawSync(data);
  if (entry.method === 0) return data;
  throw new Error(`zip: method ${entry.method} not supported`);
}
