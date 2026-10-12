import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { unpackMesh } from "../../kit/mesh.mjs";
import { checkTruth } from "../brain/check.mjs";
import { HUMAN, MOUSE } from "./truth.mjs";

// Reads meshes/*.json and returns, per atlas, the maps checkTruth wants: id → unpacked mesh and id → atlas name.
export function readMeshes(dir) {
  const raw = readdirSync(dir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")));
  const byAtlas = new Map();
  for (const json of raw) {
    if (!byAtlas.has(json.atlas)) byAtlas.set(json.atlas, { raw: new Map(), meshes: new Map(), names: new Map() });
    const atlas = byAtlas.get(json.atlas);
    atlas.raw.set(json.id, json);
    atlas.meshes.set(json.id, unpackMesh(json));
    atlas.names.set(json.id, json.name);
  }
  return byAtlas;
}

export function checkTable(table, byAtlas) {
  const db = table.PARTS[0].atlas.db;
  const atlas = byAtlas.get(db) ?? { meshes: new Map(), names: new Map() };
  return checkTruth(table.PARTS, atlas.meshes, atlas.names);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const byAtlas = readMeshes(join(dirname(fileURLToPath(import.meta.url)), "meshes"));
  for (const table of [HUMAN, MOUSE]) checkTable(table, byAtlas);
  console.log("check.mjs: self-test passed");
}
