import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { unpackMesh } from "../../kit/mesh.mjs";
import { checkTruth } from "./check.mjs";
import { FRAME, PARTS, SOURCE } from "./truth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const MESHES = join(HERE, "meshes");

const raw = new Map(readdirSync(MESHES).filter((file) => file.endsWith(".json")).map((file) => [file.slice(0, -5), JSON.parse(readFileSync(join(MESHES, file), "utf8"))]));
const meshes = new Map([...raw].map(([id, json]) => [id, unpackMesh(json)]));
const atlasNames = new Map([...raw].map(([id, json]) => [id, json.name]));
checkTruth(PARTS, meshes, atlasNames);

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const data = { frame: FRAME, parts: PARTS.map(({ n, id, name, tone, atlas }) => ({ n, id, name, tone, meshes: atlas.ids.map((id) => raw.get(id)) })) };
const LABEL = `A rotatable 3D model of the human limbic system, ${PARTS.length} numbered parts: ${PARTS.map((p) => `${p.n} ${p.name}`).join(", ")}. Drag to turn, hover a part to name it, arrow keys step through the parts, Q toggles quiz mode, which hides the names.`;
const body = `<div class="an-stage" tabindex="0" role="img" aria-label="${esc(LABEL)}"><canvas class="an-gl"></canvas><div class="an-tags" aria-hidden="true"></div><span class="an-sr" role="status" aria-live="polite"></span></div><button class="an-quiz" type="button" aria-pressed="false">Quiz</button>`;
const keyHtml = `<span class="iso-keys">${PARTS.map((p) => `<span class="iso-key" data-key="${p.id}"><b class="an-n">${p.n}</b> <span class="an-name">${esc(p.name)}</span></span>`).join("")}</span>`;
const caption = `${SOURCE.title} · ${SOURCE.licence} · fetched ${SOURCE.fetched}`;
const legend = `<figcaption class="iso-legend">${keyHtml}<span class="iso-caption">${esc(caption)}</span></figcaption>`;
const card = k.plateHtml({ fig: "Fig 1", title: "LIMBIC SYSTEM · HUMAN", hint: "DRAG TO TURN · HOVER A PART · ARROWS STEP · Q QUIZ", readout: `${PARTS.length} parts`, body }).replace("</figure>", `${legend}</figure>`);
const json = `<script type="application/json" id="an-data">${JSON.stringify(data).replace(/<\/script/gi, "<\\/script")}</script>`;

const viewer = readFileSync(join(HERE, "..", "..", "kit", "mesh-view.js"), "utf8").replace(/^export /gm, "");
const script = `${viewer}\nmountAnatomy(document.querySelector(".an-stage"), JSON.parse(document.getElementById("an-data").textContent));`;
const page = k.pageHtml({ title: "Limbic system · 3D", theme: THEME, body: card + json, script });
if (page.length > 10 * 1024 * 1024) throw new Error(`page is ${(page.length / 1024 / 1024).toFixed(1)} MB, over 10 MB`);
const name = THEME === "light" ? "limbic-system-light.html" : "limbic-system.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${PARTS.length} parts`);
