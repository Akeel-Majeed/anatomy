import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { unpackMesh } from "../../kit/mesh.mjs";
import { checkTruth } from "../brain/check.mjs";
import { PARTS } from "./truth.mjs";

export { checkTruth };

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "meshes");
  const raw = readdirSync(dir).filter((file) => file.endsWith(".json")).map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")));
  checkTruth(PARTS, new Map(raw.map((json) => [json.id, unpackMesh(json)])), new Map(raw.map((json) => [json.id, json.name])));
  console.log("check.mjs: self-test passed");
}
