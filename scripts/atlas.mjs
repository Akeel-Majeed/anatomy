import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { packObj, toJson, zipEntries, zipRead } from "../kit/mesh.mjs";

const argv = process.argv.slice(2);
const take = (flag, fallback) => {
  const at = argv.indexOf(flag);
  if (at < 0) return fallback;
  const value = argv[at + 1];
  argv.splice(at, 2);
  return value;
};
const find = take("--find", null);
const out = take("--out", null);
const maxFaces = Number(take("--max-faces", 60000));
const [atlas, ...ids] = argv;
if (!["bp3d", "allen"].includes(atlas) || !(find || (ids.length && out))) {
  console.log(`Fetch atlas meshes and pack them for the 3D viewer.

  node scripts/atlas.mjs <bp3d|allen> --find <text>
  node scripts/atlas.mjs <bp3d|allen> <id...> --out <dir> [--max-faces 60000]

Archives and parts lists are cached under ~/.cache/anatomy/<atlas>/ ($ANATOMY_CACHE overrides).`);
  process.exit(1);
}

const cache = join(process.env.ANATOMY_CACHE || join(homedir(), ".cache", "anatomy"), atlas);
mkdirSync(cache, { recursive: true });

const response = (url, range) =>
  new Promise((resolve, reject) => {
    const headers = { "user-agent": "anatomy-atlas", ...(range ? { range } : {}) };
    (url.startsWith("https") ? httpsGet : httpGet)(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(response(new URL(res.headers.location, url).href, range));
      } else if (res.statusCode === 200 || res.statusCode === 206) resolve(res);
      else {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
    }).on("error", reject);
  });

const PIECES = 6;
const BIG = 32 << 20;

async function fetchFile(url) {
  const file = join(cache, basename(url));
  if (existsSync(file)) return file;
  const probe = await response(url, "bytes=0-0");
  const total = Number((probe.headers["content-range"] || "").split("/")[1]) || 0;
  probe.resume();
  if (probe.statusCode === 206 && total > BIG) {
    const step = Math.ceil(total / PIECES);
    const pieces = await Promise.all(
      Array.from({ length: PIECES }, async (_, i) => {
        const piece = `${file}.piece${i}`;
        const res = await response(url, `bytes=${i * step}-${Math.min(total, (i + 1) * step) - 1}`);
        await pipeline(res, createWriteStream(piece));
        process.stderr.write(`${basename(file)}: piece ${i + 1} of ${PIECES}\n`);
        return piece;
      }),
    );
    writeFileSync(`${file}.part`, Buffer.concat(pieces.map((piece) => readFileSync(piece))));
    pieces.forEach((piece) => unlinkSync(piece));
  } else {
    const res = await response(url);
    let got = 0;
    let shown = 0;
    res.on("data", (chunk) => {
      got += chunk.length;
      if (got - shown >= 10 << 20) {
        shown = got;
        process.stderr.write(`${basename(file)}: ${got >> 20} MB\n`);
      }
    });
    await pipeline(res, createWriteStream(`${file}.part`));
  }
  renameSync(`${file}.part`, file);
  return file;
}

const BP3D = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/";
const ALLEN = "http://download.alleninstitute.org/informatics-archive/current-release/mouse_ccf/annotation/ccf_2017/structure_meshes/";
const META = { bp3d: { units: "mm", licence: "CC BY-SA 2.1 JP" }, allen: { units: "um", licence: "Allen Institute Terms of Use" } };

async function bp3dParts() {
  const parts = new Map();
  for (const list of ["isa", "partof"]) {
    const rows = readFileSync(await fetchFile(`${BP3D}${list}_element_parts.txt`), "utf8").split("\n").slice(1);
    for (const row of rows) {
      const [id, name, element] = row.split("\t").map((s) => s.trim());
      if (!id) continue;
      const key = `${id}:${list}`;
      if (!parts.has(key)) parts.set(key, { id, name, list, elements: [] });
      parts.get(key).elements.push(element);
    }
  }
  return [...parts.values()];
}

async function allenParts() {
  const parts = [];
  const walk = (node) => {
    parts.push({ id: String(node.id), acronym: node.acronym, name: node.name });
    node.children.forEach(walk);
  };
  walk(JSON.parse(readFileSync(await fetchFile("http://api.brain-map.org/api/v2/structure_graph_download/1.json"), "utf8")).msg[0]);
  return parts;
}

const mergeObj = (texts) => {
  let base = 0;
  return texts
    .map((text) => {
      const shifted = text.replace(/^f .*/gm, (line) => line.replace(/(\s)(\d+)/g, (_, space, i) => space + (Number(i) + base)));
      base += (text.match(/^v /gm) || []).length;
      return shifted;
    })
    .join("\n");
};

function write(id, name, text) {
  const packed = packObj(text, { maxFaces });
  const json = toJson(packed, { atlas, id, name, ...META[atlas], fetched: new Date().toISOString().slice(0, 10) });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${id}.json`), json);
  console.log(`${id} → ${name} (${packed.faces} faces, ${Math.round(json.length / 1024)} KB)`);
}

async function main() {
  const parts = atlas === "bp3d" ? await bp3dParts() : await allenParts();
  if (find) {
    const hits = parts.filter((p) => p.name.toLowerCase().includes(find.toLowerCase()));
    if (!hits.length) throw new Error(`no ${atlas} part matches "${find}"`);
    for (const p of hits) console.log(atlas === "bp3d" ? `${p.id}\t${p.name}\t${p.list}\t${p.elements.length} elements` : `${p.id}\t${p.acronym}\t${p.name}`);
    return;
  }
  const archives = new Map();
  for (const id of ids) {
    const rows = parts.filter((p) => p.id === id);
    if (!rows.length) throw new Error(`${id} is not in the ${atlas} parts list`);
    if (atlas === "allen") {
      write(id, rows[0].name, readFileSync(await fetchFile(`${ALLEN}${id}.obj`), "utf8"));
      continue;
    }
    const row = rows.find((r) => existsSync(join(cache, `${r.list}_BP3D_4.0_obj_99.zip`))) ?? rows[0];
    const stem = `${row.list}_BP3D_4.0_obj_99`;
    if (!archives.has(stem)) {
      const buffer = readFileSync(await fetchFile(`${BP3D}${stem}.zip`));
      archives.set(stem, { buffer, entries: zipEntries(buffer) });
    }
    const { buffer, entries } = archives.get(stem);
    const texts = row.elements.map((element) => {
      const entry = entries.get(`${stem}/${element}.obj`) ?? entries.get([...entries.keys()].find((n) => basename(n) === `${element}.obj`));
      if (!entry) throw new Error(`${element}.obj for ${id} is not in ${stem}.zip`);
      return zipRead(buffer, entry).toString();
    });
    write(id, row.name, mergeObj(texts));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
