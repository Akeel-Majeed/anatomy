# Anatomy 3D viewer implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Spec: `docs/superpowers/specs/2026-10-12-anatomy-3d-viewer-design.md`.

**Goal:** `/anatomy` builds a rotatable, labelled 3D model of a biological structure from open atlas meshes as one offline HTML file, with the isometric route kept for cells, circuits and sections.

**Architecture:** `scripts/atlas.mjs` fetches and caches atlas archives and extracts parts; `kit/mesh.mjs` packs OBJ text into compact typed arrays; `kit/mesh-view.js` is a plain-WebGL runtime inlined into the page; each example has `truth.mjs`, `check.mjs`, `build.mjs` and committed `meshes/*.json`; `scripts/view-check.mjs` proves visibility and picking headless.

**Tech stack:** Node 22+ built-ins only (`node:fs`, `node:zlib`, `node:https`, `node:http`), WebGL 1, the kit's `pageHtml` and `plateHtml` for the page and card, `scripts/capture.mjs` and `scripts/drive.mjs` for headless checks.

**House rules:** no comments in code except a `ponytail:` note on a deliberate ceiling; ES modules; the existing kit files, scripts and examples stay byte-identical; no course, module, university or textbook names anywhere; commit trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
|---|---|
| `scripts/atlas.mjs` | CLI: fetch and cache an atlas, find parts by name, extract and pack parts to JSON |
| `kit/mesh.mjs` | `packObj`, `unpackMesh`, `clusterDecimate`, `octEncode`/`octDecode`, zip reading helpers |
| `kit/mesh-view.js` | Browser runtime: WebGL renderer, orbit camera, picking, tags, interactions, `window.anatomy` |
| `examples/brain/{truth,check,build}.mjs`, `meshes/`, `brain.html`, `brain-light.html` | Whole human brain by lobe |
| `examples/hippocampus-3d/…` | Human hippocampus with neighbours; mouse hippocampal formation |
| `examples/hippocampus-section/` | The isometric coronal section, moved from `examples/hippocampus/` |
| `scripts/view-check.mjs` | Headless visibility, picking, console and frame-time check |
| `SKILL.md`, `references/neuro.md`, `README.md`, `CHANGELOG.md`, `evals/evals.json`, `.github/workflows/ci.yml` | Skill text and docs |

Facts verified on 2026-10-12: headless Chrome at `/usr/bin/google-chrome` renders WebGL and `--screenshot` captures it with `preserveDrawingBuffer: true` or a `requestAnimationFrame` loop; Allen meshes download by id with no key (CA1 id 382 is 12,620 faces); BodyParts3D archives are at `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/`; the lobes and insula (FMA72969–FMA72978) are in `partof_BP3D_4.0_obj_99.zip`, the rest of the brain in `isa_BP3D_4.0_obj_99.zip`; the dead SOAP API is not used.

---

### Task 1: `kit/mesh.mjs` packer and zip reader

**Files:** create `kit/mesh.mjs`, `kit/mesh-test.mjs`.

Exports:

```js
export function packObj(text, { maxFaces = 60000 } = {})
// → { faces, verts, bbox: [minx,miny,minz,maxx,maxy,maxz], positions: Int16Array(verts*3), normals: Int8Array(verts*2), indices: Uint16Array|Uint32Array(faces*3) }
export function toJson(packed, meta)        // → string: { ...meta, faces, verts, bbox, index: "u16"|"u32", positions: base64, normals: base64, indices: base64 }
export function unpackMesh(json)            // inverse of toJson, returns Float32Array positions in atlas units and Float32Array normals
export function clusterDecimate(positions, indices, cell)   // vertex clustering on a grid of size `cell`, drops degenerate faces
export function zipEntries(buffer)          // → Map name → { offset, compressedSize, size, method } from the central directory
export function zipRead(buffer, entry)      // → Buffer, inflateRawSync for method 8, slice for method 0
```

- [ ] **Step 1: Write `kit/mesh-test.mjs`** that builds a cube OBJ string (8 vertices, 12 faces, duplicate `v` lines for two corners), packs it, asserts `verts === 8`, `faces === 12`, every normal unit-length within 0.02 after `octDecode`, positions round-trip within one quantum, and that `clusterDecimate` of a 40×40 grid plane with `cell` equal to two spacings yields under half the faces. Also asserts `zipEntries` and `zipRead` round-trip a zip built in the test from `node:zlib` (`deflateRawSync`) with a hand-written local header and central directory.
- [ ] **Step 2: Run** `node kit/mesh-test.mjs` and confirm it fails because `kit/mesh.mjs` does not exist.
- [ ] **Step 3: Implement `kit/mesh.mjs`.** OBJ parsing: only `v` and `f` lines matter; `f` entries may be `i`, `i/t`, `i//n`, `i/t/n`, negative indices allowed; polygons with more than three vertices fan-triangulated. Weld by exact coordinate string. Normals are area-weighted face normals summed per vertex and normalised. Quantize positions to 0…65535 inside the bbox, stored as Int16 by subtracting 32768. Normals octahedral-encoded to two Int8. Indices Uint16 when verts ≤ 65535 else Uint32. If faces > maxFaces, call `clusterDecimate` with a cell chosen as `cbrt(volume(bbox) / (maxFaces / 2))` and repeat with a larger cell until under budget.
- [ ] **Step 4: Run** `node kit/mesh-test.mjs` until it prints `mesh-test: passed`.
- [ ] **Step 5: Commit** `kit/mesh.mjs kit/mesh-test.mjs` with message `Add the mesh packer and zip reader`.

### Task 2: `scripts/atlas.mjs`

**Files:** create `scripts/atlas.mjs`.

```
node scripts/atlas.mjs bp3d --find hippocamp
node scripts/atlas.mjs allen --find subiculum
node scripts/atlas.mjs bp3d FMA62493 FMA61841 --out examples/hippocampus-3d/meshes [--max-faces 60000]
node scripts/atlas.mjs allen 382 423 --out examples/hippocampus-3d/meshes
```

- Cache dir `~/.cache/anatomy/<atlas>/` (`$ANATOMY_CACHE` overrides). Downloads follow redirects, print one progress line per 10 MB, and are atomic (write to `.part`, rename).
- `bp3d`: downloads `isa_parts_list_e.txt` and `partof_parts_list_e.txt` first; `--find` prints `FMAid\tname\tisa|partof` for every match (case-insensitive substring); extraction downloads only the archive that holds the id; the OBJ inside is `<FMAid>.obj` (confirm from the central directory and fall back to a search for the id in entry names).
- `allen`: downloads `structure_graph_download/1.json` for names; `--find` prints `id\tacronym\tname`; extraction downloads `structure_meshes/<id>.obj`.
- For each extracted id, writes `<out>/<id>.json` via `toJson(packed, { atlas, id, name, units: "mm"|"um", fetched: YYYY-MM-DD, licence })` and prints `id → name (faces, KB)`.
- Exits non-zero with a clear line when an id is not in the parts list.

- [ ] **Step 1:** Implement with `node:https`/`node:http`, `kit/mesh.mjs` for zip and pack. No comments.
- [ ] **Step 2: Verify** `node scripts/atlas.mjs allen --find subiculum` lists SUB 502, PRE 1084, PAR 843, POST 1037, ProS; `node scripts/atlas.mjs allen 382 --out /tmp/x` writes `382.json` with `name: "Field CA1"` and 12,620 faces; `node scripts/atlas.mjs bp3d --find "frontal lobe"` lists FMA72969 and FMA72970 as `partof`.
- [ ] **Step 3: Commit** `Add the atlas fetcher`.

### Task 3: `kit/mesh-view.js` and `examples/brain/`

**Files:** create `kit/mesh-view.js`, `examples/brain/truth.mjs`, `examples/brain/check.mjs`, `examples/brain/build.mjs`, `examples/brain/meshes/*.json` (from atlas.mjs), `examples/brain/meshes/LICENCE.md`, `examples/brain/brain.html`, `examples/brain/brain-light.html`; add `meshScript()` to `scripts/inline-kit.mjs` is **not** allowed (scripts stay byte-identical), so `build.mjs` reads `kit/mesh-view.js` itself with `readFileSync`.

Parts (from BodyParts3D `partof`): frontal lobe (FMA72969, FMA72970), parietal lobe (FMA72973, FMA72974), temporal lobe (FMA72971, FMA72972), occipital lobe (FMA72975, FMA72976), insula (FMA72977, FMA72978); from `isa`: cerebellum FMA67944, midbrain FMA61993, pons FMA67943, medulla oblongata FMA62004. Nine numbered entries in that order.

`truth.mjs` exactly as the spec §4, plus a `tone` per part from this table (hex is the base colour; the shader lights it):

| class | tone | used for |
|---|---|---|
| frontal | `#d98c9a` | frontal lobe |
| parietal | `#8fb8d9` | parietal lobe |
| temporal | `#c9c96a` | temporal lobe |
| occipital | `#e6a86b` | occipital lobe |
| insula | `#b08cd9` | insula |
| cerebellum | `#9b6fc9` | cerebellum |
| brainstem | `#6f8fd9` | midbrain, pons, medulla |
| nucleus | `#e0b36b` | amygdala, thalamus, hypothalamus, basal ganglia |
| hippocampus | `#e08a7a` | hippocampus and its mouse subfields (lighten 8% per subfield step) |
| tract | `#efe9d6` | fornix, alveus, fimbria, corpus callosum |
| cortex | `#d9a3a3` | any other gyrus or cortical area |

`check.mjs`: `checkTruth(PARTS, meshes, atlasNames)` as the spec §4, `meshes` a Map id → unpacked mesh, `atlasNames` a Map atlas id → name from the JSON files; self-test with a good table and five bad ones; `node examples/brain/check.mjs` prints `check.mjs: self-test passed`.

`build.mjs`:

- Reads `meshes/*.json`, runs `checkTruth`, builds the page with `k.pageHtml` and `k.plateHtml({ fig: "Fig 1", title: "HUMAN BRAIN · LOBES", hint: "DRAG TO TURN · HOVER A PART · ARROWS STEP · Q QUIZ", caption: "BodyParts3D 4.0, CC BY-SA 2.1 JP, fetched 2026-10-12", body })` where `body` is `<div class="an-stage" tabindex="0" role="img" aria-label="…"><canvas class="an-gl"></canvas><div class="an-tags"></div><span class="an-sr" role="status" aria-live="polite"></span></div>`, the key `<span class="iso-key" data-key><b class="an-n">n</b> <span class="an-name">name</span></span>` for each part in order, and a `<button class="an-quiz">Quiz</button>`.
- Embeds the packed meshes as one `<script type="application/json" id="an-data">` with `{ frame, parts: [{ n, id, name, tone, meshes: [json…] }] }`; `frame` is `{ up: [0,0,1], front: [0,-1,0] }` for BodyParts3D (confirm by capture: anterior faces the viewer, the cerebellum sits low at the back) and `{ up: [0,-1,0], front: [-1,0,0] }` for Allen (confirm the same way).
- Inlines `kit/mesh-view.js` in a module script that calls `mountAnatomy(stage, data)`.
- `--light` writes `brain-light.html` with `theme: "light"`.

`kit/mesh-view.js` exports `mountAnatomy(stage, data)` and sets `window.anatomy`:

- Camera: orbit around the union bbox centre, distance so the model fills 70% of the shorter canvas side; azimuth 0 looks at `front`; elevation 15° on open; clamp elevation ±85°; zoom 0.5–3×. Device pixel ratio capped at 2.
- Rendering: one program; vertex shader transforms positions (dequantized by bbox) and octahedral normals; fragment shader: `tone * (0.35 + 0.65 * max(0, n·key)) + 0.18 * max(0, n·fill) + rim` with `rim = 0.12 * pow(1 - max(0, n·view), 3)`; states per part: `normal`, `lit` (tone mixed 35% toward white), `dim` (tone desaturated and darkened to 45%). Background transparent so the card colour shows.
- Picking: offscreen framebuffer at quarter resolution, part index encoded in RGB, `readPixels` once per frame at the pointer position.
- Idle turn 6° per second until the first pointer or key event, off under `prefers-reduced-motion`.
- Tags: one `<span class="an-tag">n</span>` per part positioned by projecting the part's anchor (the vertex nearest the centroid, projected along the view direction onto the surface) each frame; visible only when picking at the projected point returns the same part. Q hides nothing in tags.
- Interactions and the readout text exactly as spec §2. Readout `${n} · ${name}` in the `data-readout` corner, number only in quiz mode. Key `.iso-key[data-key]` gets `data-hot` on hover and `data-held` on hold; `.iso-figure[data-quiz] .an-name { visibility: hidden }`.
- `window.anatomy = { parts: [{ n, id, name }], view(azimuthDeg, elevationDeg), pick(x, y) → id|null, anchors() → [{ id, x, y, visible }], frameMs }`.

- [ ] **Step 1:** Run `node scripts/atlas.mjs bp3d FMA72969 FMA72970 FMA72973 FMA72974 FMA72971 FMA72972 FMA72975 FMA72976 FMA72977 FMA72978 FMA67944 FMA61993 FMA67943 FMA62004 --out examples/brain/meshes` and record the face counts.
- [ ] **Step 2:** Write `truth.mjs`, `check.mjs` with its self-test, run it, commit `brain: truth table and check`.
- [ ] **Step 3:** Write `kit/mesh-view.js` and `build.mjs`; build; open `brain.html` with `node scripts/capture.mjs examples/brain/brain.html --out /tmp/brain-front.png --select .iso-plate` and look: lobes in distinct tones, anterior facing, cerebellum low at the back. Fix the frame if not.
- [ ] **Step 4:** Drive it: `node scripts/drive.mjs examples/brain/brain.html --actions steps.json` with hover at the frontal lobe's anchor expecting the readout `1 · Frontal lobe`, `ArrowRight` twice expecting `3 · Temporal lobe`, `q` expecting the readout `3` and `.an-name` hidden, a drag changing `anatomy.view` azimuth.
- [ ] **Step 5:** Build `--light`; capture; commit `brain: 3D viewer example`.

### Task 4: `scripts/view-check.mjs`

- [ ] **Step 1:** Write it on top of the same headless-Chrome plumbing `scripts/drive.mjs` uses (copy the connection code, do not import or modify `drive.mjs`): for each of the six views `[[0,0],[180,0],[90,0],[-90,0],[0,85],[0,-85]]` call `anatomy.view`, wait two frames, read `anatomy.anchors()` and `anatomy.pick` at each visible anchor; assert every part visible somewhere, every visible anchor picks itself, console clean, median `anatomy.frameMs` under 16. Print `view-check: ok · 9 parts · 6 views · 4.1 ms` or the failures, exit non-zero on any.
- [ ] **Step 2:** Run on `examples/brain/brain.html`; commit `Add view-check`.

### Task 5: `examples/hippocampus-3d/`

- [ ] **Step 1:** `node scripts/atlas.mjs bp3d FMA62493 FMA61841 FMA61965 FMA61918 --out examples/hippocampus-3d/meshes` and `node scripts/atlas.mjs allen 382 423 463 726 502 1084 843 1037 909 --out examples/hippocampus-3d/meshes`.
- [ ] **Step 2:** `truth.mjs` with two tables `HUMAN` and `MOUSE` (each `{ SOURCE, PARTS }`), `check.mjs` reusing `checkTruth` from `examples/brain/check.mjs` (import it; do not copy), `build.mjs` writing one page with two cards (`Fig 1` human, `Fig 2` mouse) and two keys, each stage mounted separately. Numbers restart at 1 per card.
- [ ] **Step 3:** Build, capture both cards, run view-check on the page (it must handle several stages: iterate `document.querySelectorAll(".an-stage")`, so Task 4's script reads `window.anatomy` as an array when more than one stage mounts; make `mountAnatomy` push into `window.anatomy.stages` and keep the single-stage API on the first), commit `hippocampus-3d: human and mouse`.

### Task 6: Move the section example

- [ ] `git mv examples/hippocampus examples/hippocampus-section`; rename `hippocampus.html` and `hippocampus-light.html` to `hippocampus-section.html` and `-light`; update the output names in its `build.mjs` and any path in `.github/workflows/ci.yml`; rebuild; commit `Move the isometric section to examples/hippocampus-section`.

### Task 7: `SKILL.md`

Rewrite per spec §6. Keep the structure (front matter, intro, layout, workflow, sizing, craft rules, kit table, references list, examples list) and the parts that still apply to the isometric route. Required changes:

- Front-matter description: rotatable 3D models from cited atlases first; isometric second; same trigger phrases.
- Intro paragraph: "the atlas is the model".
- Layout tree: add `kit/mesh.mjs`, `kit/mesh-view.js`, `scripts/atlas.mjs`, `scripts/view-check.mjs`, `examples/brain/`, `examples/hippocampus-3d/`, rename the section example.
- Workflow steps 1–6 as spec §6, with the isometric workflow kept under a "Section route" heading.
- Sizing: a 3D figure is minutes; Epic no longer applies to a whole brain.
- Craft rules: add a "3D figures" block (tissue tones, anatomical position, tags never float, dim never transparent, card chrome) before "Tissue, not machinery".
- Examples list: brain first, hippocampus-3d second, hippocampus-section third with one line saying what it is.
- No course, module, university or textbook names.

- [ ] Rewrite, then `grep -n "examples/hippocampus/" SKILL.md` must return nothing; commit `SKILL.md: 3D route first`.

### Task 8: `references/neuro.md`

- [ ] Add a section "Sources" with the two atlas tables (ids for: lobes, insula, cerebellum, brainstem parts, hippocampus, amygdala, fornix, parahippocampal gyrus, thalamus, hypothalamus, corpus callosum; mouse HPF subfields and ids), the frame entries, the tone table from Task 3, the route rule, the cache location and the licence note; keep the isometric sections under a "Section route" heading. Commit `neuro.md: atlases, frames, tones`.

### Task 9: README, CHANGELOG, evals, CI

- [ ] README: tagline and intro for 3D first; quick start `/anatomy show me the brain by lobe so I can rotate it and name each one`; figure table with brain, hippocampus-3d, hippocampus-section; a "Sources and licences" section; install links unchanged.
- [ ] CHANGELOG Unreleased: the 3D route, the atlas fetcher, the packer, the viewer, view-check, the two examples, the move.
- [ ] `evals/evals.json`: five prompts as spec §6.
- [ ] CI: steps "Brain" and "Hippocampus 3D" that build, build `--light`, run `check.mjs` and `view-check.mjs`; the section step renamed. Commit `Docs, evals and CI for the 3D route`.

### Task 10: Final review

- [ ] Byte-identity: `git diff --stat main -- kit scripts examples/arcade-cabinet examples/desk-computer examples/dial-indicator examples/raptor-engine examples/ripple-tank examples/spot-plate examples/test-rig examples/turning-dial LICENSE` shows only the two new kit files and the two new scripts.
- [ ] `grep -rniE "ucl|psyc0|phol0|module code" --include=*.md --include=*.json --include=*.mjs . | grep -v node_modules` returns nothing.
- [ ] All example builds and checks pass; captures of the brain from front, left and top read right against the atlas's own viewer.
- [ ] Merge `anatomy-3d` into `main` with `--no-ff`; push only when the user says so.
