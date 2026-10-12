# Anatomy 3D viewer design

Date: 2026-10-12. Supersedes the figure and example sections of `2026-10-11-biology-anatomy-skill-design.md`; the truth table, anatomy check, key and quiz from that spec carry over.

## 1. Why

The first user test of the isometric hippocampus showed the limit of drawn geometry: the section was built from arcs of one circle and boxes on a lathe drum, so it read as a bearing, not tissue. The user wants what a 3D brain model gives: a rotatable model with each structure coloured and named on hover. Hand-drawn geometry cannot be made to look biological; atlas meshes can, and they are more accurate than anything drawn by hand.

Decision: the rotatable 3D mesh viewer becomes the main output of `/anatomy`. The isometric route stays only for things no atlas provides as a mesh: cell types, circuits and cut sections with layers.

## 2. The figure

One HTML file, no dependencies, works offline, light and dark themes as now.

- The same framed card as the isometric figures (title line, hint line, live readout, caption) with a WebGL canvas as the body instead of an SVG.
- Each named part is one mesh in its own tissue tone. Left and right copies of a part are one entry.
- Drag rotates (azimuth free, elevation clamped to ±85°), wheel or pinch zooms within limits, R resets. Touch works. Until the first interaction the model turns slowly on an idle turntable; `prefers-reduced-motion` disables the idle turn.
- Hover lights a part and the readout shows `n · Name`. Click or tap holds the selection; click empty space releases it. Arrow keys step through the parts in key order; the stepped part is lit and the others dimmed, the camera does not move. Escape clears.
- Numbered tags: each part carries its number as a small HTML tag anchored to a point on its surface. A tag is shown only while its anchor is the visible surface at that pixel, so tags never float over the wrong part.
- Q toggles quiz mode: names vanish from the key and the readout, numbers stay. The readout announces changes through an `aria-live` region.
- The key under the card is generated from the truth table. The caption cites the atlas, its licence and the fetch date.

Lighting: one key light from the camera's upper left, a fill from the opposite side, hemisphere ambient, and a soft rim term so silhouettes separate. Dimmed parts are greyed and darkened, never transparent, so no depth sorting is needed. Picking uses a colour-ID render to an offscreen framebuffer read on pointer move at most once per frame.

## 3. Where the shapes come from

Two open atlases, no keys, fetched once and cached under `~/.cache/anatomy/`.

| Atlas | What it covers | Access |
|---|---|---|
| BodyParts3D (Database Center for Life Science, Japan), CC BY-SA 2.1 JP | The human body as ~2,900 named parts keyed by FMA id: lobes left and right, insula, cerebellum, midbrain, pons, medulla, hippocampus, amygdala, fornix, thalamus, hypothalamus, parahippocampal gyrus, 47 gyri, and the organs | Two OBJ archives at `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/`: `isa_BP3D_4.0_obj_99.zip` and `partof_BP3D_4.0_obj_99.zip`, about 143 MB each, with parts lists `isa_parts_list_e.txt` and `partof_parts_list_e.txt`. The lobes and insula are only in the `partof` archive. |
| Allen Mouse Brain Common Coordinate Framework (Allen Institute) | Every structure in the mouse brain, including hippocampal subfields CA1, CA2, CA3, dentate gyrus, subiculum, presubiculum, parasubiculum, postsubiculum, entorhinal area | One OBJ per structure at `http://download.alleninstitute.org/informatics-archive/current-release/mouse_ccf/annotation/ccf_2017/structure_meshes/<id>.obj`; names and ids from `http://api.brain-map.org/api/v2/structure_graph_download/1.json`. Meshes are 4k to 30k triangles. |

Coordinate frames differ: BodyParts3D is in millimetres with anatomical axes; the Allen CCF is in micrometres with x anterior to posterior, y superior to inferior, z left to right. Each atlas has a frame entry in `references/neuro.md` giving the up and front vectors, and the build applies it so every figure opens facing the viewer in anatomical position, anterior forward, as a model on a desk would.

## 4. Pieces

### `scripts/atlas.mjs`

```
node scripts/atlas.mjs bp3d FMA62493 FMA61841 --out examples/hippocampus-3d/meshes
node scripts/atlas.mjs allen 382 423 463 726 --out examples/hippocampus-3d/meshes
node scripts/atlas.mjs bp3d --find "hippocamp"
node scripts/atlas.mjs allen --find "subiculum"
```

- Downloads the archive or structure file on first use into `~/.cache/anatomy/<atlas>/`, with a progress line, and reuses it after.
- `--find` greps the atlas's own parts list and prints id, name and which archive holds it.
- For each requested id it extracts the OBJ, runs the packer (below) and writes `<out>/<id>.json`, and prints the atlas's name for the id so the truth table can be checked against it.
- Node built-ins only. Unzipping uses `node:zlib` on the zip's central directory, no `unzip` binary.

### `kit/mesh.mjs` (Node side)

`packObj(text, { maxFaces })` parses an OBJ, welds duplicate vertices, computes smooth per-vertex normals, and returns `{ bbox, positions, normals, indices, faces }` with positions quantized to 16-bit integers inside the part's bounding box and normals as 8-bit octahedral pairs. A part above `maxFaces` (default 60,000) is thinned by vertex clustering on a grid sized to land under the budget. The packed JSON is base64 of the typed arrays plus the bbox and counts, so a part of 12,000 triangles is about 100 KB.

### `kit/mesh-view.js` (browser side, inlined into the page like the kit runtime)

About three hundred lines of plain WebGL 1: context with `preserveDrawingBuffer: true` so headless screenshots capture the frame, one shader pair, one vertex buffer per part, orbit camera, picking framebuffer, the interactions in §2, tag projection, and `window.anatomy = { parts, view(azimuth, elevation), pick(x, y), anchors() }` for the checks.

### `examples/<name>/build.mjs`

Imports the kit's page shell and card CSS, the truth table, the packed meshes, the frame for the atlas, and writes `<name>.html` (`--light` writes the light theme). Runs the truth check before writing. No audit, no painter: depth comes from the z-buffer.

### Truth table

`truth.mjs` keeps `SOURCE`, `PARTS` and `PATHS`:

```js
export const SOURCE = { title: "BodyParts3D 4.0", url: "https://lifesciencedb.jp/bp3d/", licence: "CC BY-SA 2.1 JP", fetched: "2026-10-12" };
export const PARTS = [
  { n: 1, id: "frontal", name: "Frontal lobe", synonyms: [], atlas: { db: "bp3d", ids: ["FMA72969", "FMA72970"], names: ["right frontal lobe", "left frontal lobe"] }, source: "https://lifesciencedb.jp/bp3d/" },
];
export const PATHS = [];
```

- `name` is the atlas's English name with the side stripped and the first letter capitalised, unless the user pasted a label list, in which case the user's name is used and the atlas's stays in `atlas.names`.
- `atlas.names` records what the atlas calls each id at fetch time. The check compares them with the cached parts list.
- `PATHS` is empty for 3D figures in this version (§8).

### `check.mjs`

`checkTruth(PARTS, meshes, atlasNames)` throws on: duplicate `n` or `id`; a part with no mesh or a mesh file with no part; a mesh with zero triangles or any non-finite coordinate; an `atlas.names` entry that differs from the atlas's own list; a page over 10 MB. Self-test as now.

### `scripts/view-check.mjs`

Loads the built page headless, and for each of six views (front, back, left, right, top, bottom) reads `window.anatomy.anchors()` and `pick` to assert: every part is visible from at least one view; picking at every visible anchor returns that part; the console is clean; a frame renders in under 16 ms on the CPU rasteriser. Exits non-zero on any failure.

## 5. Examples

- `examples/brain/`: the whole human brain by lobe, the figure the user showed: frontal, parietal, temporal, occipital lobes, insula, cerebellum, and the brainstem as midbrain, pons and medulla oblongata, from BodyParts3D. Nine parts, nine numbers.
- `examples/hippocampus-3d/`: one page, two cards. Card one: the human hippocampus with its neighbours from BodyParts3D: hippocampus, amygdala, fornix, parahippocampal gyrus. Card two: the mouse hippocampal formation from the Allen atlas: CA1, CA2, CA3, dentate gyrus, subiculum, presubiculum, parasubiculum, postsubiculum, entorhinal area, with the caption saying it is the mouse.
- `examples/hippocampus/` (the isometric coronal section) moves to `examples/hippocampus-section/` and is described as the section route. It stays buildable and in CI. Its shape is not fixed in this work.

Packed meshes for the examples are committed under `examples/<name>/meshes/` with a `LICENCE.md` naming the atlas and its licence, so CI builds offline.

## 6. Skill text

`SKILL.md` is rewritten in place:

- Description: rotatable 3D models of biological structures from cited atlases, with the isometric figures as the second route.
- "The atlas is the model": no invented geometry for anything an atlas has. The three failures become: wrong (a name not in the atlas), invented (a structure drawn by hand when a mesh exists), and mechanical (machine vocabulary on tissue).
- Workflow: 1 read the request and decide the route (3D if the atlas has the parts, isometric for cells, circuits and layered sections); 2 truth first: `atlas.mjs --find` for every requested name, write `truth.mjs`, a pasted label list wins; 3 fetch and pack; 4 write `build.mjs` from the brain example; 5 verify: check, view-check, three captures (front, left, top) read by eye; 6 deliver one file and say what the atlas does not have.
- Sizing: a 3D figure of parts the atlas has is minutes, not hours; the isometric estimates stay for the isometric route.
- Craft rules for 3D: tissue tones per class (cortex, white matter, nuclei, brainstem, cerebellum) from `references/neuro.md`; anatomical position on open; tags never float; dim, never make transparent; the card chrome matches the family.
- The kit table gains `kit/mesh.mjs`, `kit/mesh-view.js`, `scripts/atlas.mjs`, `scripts/view-check.mjs`.

`references/neuro.md` gains: the two atlas tables with ids for the common requests (lobes, brainstem, cerebellum, limbic structures, diencephalon, mouse hippocampal formation), the frame entries, the tissue tone table, and the rule for which route to take. The isometric sections stay for the section route.

`README.md`: new tagline, the brain figure first, quick start `/anatomy show me the brain by lobe so I can rotate it and name each one`, a sources section, the licence note for BodyParts3D. `CHANGELOG.md` Unreleased entries. `evals/evals.json`: five prompts, four 3D (brain by lobe; hippocampus and amygdala; brainstem parts; thalamus and hypothalamus) and one isometric (a neuron with glia). CI: a step per example that builds, builds `--light`, runs `check.mjs` and `view-check.mjs`.

## 7. Verification

- `node examples/brain/check.mjs` self-test passes; `node examples/brain/build.mjs` and `--light` write the pages; `node scripts/view-check.mjs examples/brain/brain.html` passes.
- `scripts/capture.mjs` works on WebGL pages; captures at three views are read by eye against the atlas's own viewer before the example is called done.
- Kit files other than the two new ones, the other examples and `LICENSE` are byte-identical to upstream.

## 8. Out of scope

Pathways drawn in 3D; transparency or ghosted context; cut planes through a mesh; human hippocampal subfield meshes (no key-free source); textures; VR. The drum section's shape.

## 9. Success

The user runs `/anatomy show me the brain by lobe` in a fresh session and gets a single HTML file that opens offline, rotates with the mouse, names each lobe on hover, lists them in a numbered key, hides the names on Q, and cites BodyParts3D. The same for the hippocampus with its neighbours and the mouse subfields.

## 10. Order of work

1. `scripts/atlas.mjs` and `kit/mesh.mjs` with a test on a cached OBJ.
2. `kit/mesh-view.js` and `examples/brain/` end to end, with `check.mjs` and `scripts/view-check.mjs`.
3. `examples/hippocampus-3d/`; move the section example.
4. SKILL.md, neuro.md, README, CHANGELOG, evals, CI.
5. Final review, merge to main, push.
