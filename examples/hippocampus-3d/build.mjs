import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { checkTable, readMeshes } from "./check.mjs";
import { HUMAN, MOUSE } from "./truth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const HINT = "DRAG TO TURN · HOVER A PART · ARROWS STEP · Q QUIZ";

const CARDS = [
  { table: HUMAN, fig: "Fig 1", title: "HUMAN HIPPOCAMPUS · NEIGHBOURS", what: "the human hippocampus with its neighbours", caption: `${HUMAN.SOURCE.title} · ${HUMAN.SOURCE.licence} · fetched ${HUMAN.SOURCE.fetched}` },
  { table: MOUSE, fig: "Fig 2", title: "MOUSE HIPPOCAMPAL FORMATION", what: "the mouse hippocampal formation", caption: `Allen Mouse Brain CCF 2017 · ${MOUSE.SOURCE.licence} · fetched ${MOUSE.SOURCE.fetched} · mouse, not human` },
];

const byAtlas = readMeshes(join(HERE, "meshes"));
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const cardHtml = ({ table, fig, title, what, caption }, index) => {
  const { PARTS, FRAME } = table;
  checkTable(table, byAtlas);
  const raw = byAtlas.get(PARTS[0].atlas.db).raw;
  const data = { frame: FRAME, parts: PARTS.map(({ n, id, name, tone, atlas }) => ({ n, id, name, tone, meshes: atlas.ids.map((id) => raw.get(id)) })) };
  const label = `A rotatable 3D model of ${what} with ${PARTS.length} numbered parts: ${PARTS.map((p) => `${p.n} ${p.name}`).join(", ")}. Drag to turn, hover a part to name it, arrow keys step through the parts, Q toggles quiz mode, which hides the names.`;
  const body = `<div class="an-stage" tabindex="0" role="img" aria-label="${esc(label)}"><canvas class="an-gl"></canvas><div class="an-tags" aria-hidden="true"></div><span class="an-sr" role="status" aria-live="polite"></span></div><button class="an-quiz" type="button" aria-pressed="false">Quiz</button>`;
  const keyHtml = `<span class="iso-keys">${PARTS.map((p) => `<span class="iso-key" data-key="${p.id}"><b class="an-n">${p.n}</b> <span class="an-name">${esc(p.name)}</span></span>`).join("")}</span>`;
  const legend = `<figcaption class="iso-legend">${keyHtml}<span class="iso-caption">${esc(caption)}</span></figcaption>`;
  const card = k.plateHtml({ fig, title, hint: HINT, readout: `${PARTS.length} parts`, body }).replace("</figure>", `${legend}</figure>`);
  const json = `<script type="application/json" id="an-data-${index + 1}">${JSON.stringify(data).replace(/<\/script/gi, "<\\/script")}</script>`;
  return card + json;
};

const body = CARDS.map(cardHtml).join("");
const viewer = readFileSync(join(HERE, "..", "..", "kit", "mesh-view.js"), "utf8").replace(/^export /gm, "");
const script = `${viewer}\ndocument.querySelectorAll(".an-stage").forEach((stage, i) => mountAnatomy(stage, JSON.parse(document.getElementById("an-data-" + (i + 1)).textContent)));`;
const page = k.pageHtml({ title: "Hippocampus · 3D", theme: THEME, body, script });
if (page.length > 10 * 1024 * 1024) throw new Error(`page is ${(page.length / 1024 / 1024).toFixed(1)} MB, over 10 MB`);
const name = THEME === "light" ? "hippocampus-3d-light.html" : "hippocampus-3d.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, CARDS.map((c) => `${c.table.PARTS.length} parts`).join(" + "));
