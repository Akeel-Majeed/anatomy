# Changelog

All notable changes to Anatomy are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The skill has no version numbers yet, so entries are dated.

## [Unreleased]

### Added

- **The 3D route is the main output.** `/anatomy` now builds a rotatable, labelled model of a structure from the real meshes of open anatomical atlases, as one offline HTML file: each named part in its own tissue tone with a numbered tag, hover to name, arrows to step, Q for quiz, the atlas and its licence in the caption, and the key generated from a truth table that records each part's atlas ids and names. The isometric route stays for cell types, circuits and cut sections with layers, which no atlas has as a mesh. `SKILL.md` puts the 3D workflow first (decide the route, truth first with `atlas.mjs --find`, fetch and pack, build from the brain example, verify, deliver) and keeps the isometric workflow under "Section route"; `references/neuro.md` gains the route rule, the two atlases with ids for the common requests, the frame per atlas, the tissue tone per class, the 3D truth table and check, the cache and the licences.
- `scripts/atlas.mjs`, the atlas fetcher: finds parts by name in the atlas's own list (`bp3d --find`, `allen --find`), downloads and caches BodyParts3D archives and Allen CCF structure meshes under `~/.cache/anatomy/<atlas>/` with no API key, extracts the requested ids and writes one packed JSON per part. Node built-ins only.
- `kit/mesh.mjs`, the mesh packer: parses an OBJ, welds vertices, computes smooth normals, quantizes positions to 16 bits inside the part's bounding box and normals to octahedral bytes, thins parts over a face budget by vertex clustering, and reads zip archives from their central directory with `node:zlib`. `kit/mesh-test.mjs` is its test.
- `kit/mesh-view.js`, the viewer inlined into every 3D page: plain WebGL 1, one shader pair with a key, fill and rim light, an orbit camera with an idle turn, colour-ID picking, tags that show only while their anchor is the visible surface, hover, hold, arrow stepping, Escape, quiz mode, an `aria-live` readout, and `window.anatomy` for the checks.
- `scripts/view-check.mjs`: turns a built 3D page to six views in headless Chrome and fails unless every part is visible from one of them, every visible tag's anchor picks its own part, the console is clean and frames are within budget.
- `examples/brain/`, the whole human brain by lobe from BodyParts3D: frontal, parietal, temporal and occipital lobes, insula, cerebellum, midbrain, pons and medulla oblongata, nine numbered parts. The reference for every 3D figure, with `truth.mjs`, `check.mjs` (`checkTruth` and its self-test), `build.mjs` and the packed meshes committed with their licence so CI builds offline.
- `examples/hippocampus-3d/`, one page with two cards: the human hippocampus with the amygdala, fornix and parahippocampal gyrus from BodyParts3D, and the mouse hippocampal formation (CA1, CA2, CA3, dentate gyrus, subiculum, presubiculum, parasubiculum, postsubiculum, entorhinal area) from the Allen Mouse Brain Common Coordinate Framework.
- The skill draws biological structures as labelled teaching models, neuroanatomy first. The section route is built around a truth table (`truth.mjs`: parts, layers, borders, pathways, one source URL per row, fetched without API keys) that the build asserts the key against; every named part is its own solid with a numbered pin; the key is generated; a pulse runs the pathways; Q hides the names for revision. `references/neuro.md` holds its sources, schema, parts vocabulary with kit recipes, the scope of introductory neuroanatomy and the anatomy check.
- `examples/hippocampus-section/`, the hippocampal formation in coronal section: the reference for the section route. It draws in both themes, passes `--audit`, and its build fails when the truth table and the drawing disagree.
- The five evals are now anatomy prompts: the brain by lobe, the hippocampus with its neighbours in 3D, the brainstem parts, the thalamus and hypothalamus, and a neuron with its glia on the section route.
- `examples/arcade-cabinet/`, an upright arcade cabinet with its side panel off. A quarter rolls down the coin chute past the coin-switch wire into the cash box, the switch's pulse runs along its cable to the board, and the CRT warms up, self-tests and runs an attract mode drawn in the plane of the tilted monitor; the stick closes a microswitch under the panel. It draws in the light and dark themes and passes `--audit`.
- `examples/spot-plate/`, a second React figure from the same site as `test-rig`: six pairs of glass drops that run together into one piece of glass as a fan of feeler blades sets `merge`. It draws in the light and dark themes.
- A first section-route workflow step, **Size it before you start**: every section request is sized as a Figure (about 30–90 minutes), a Hero (2–4 hours) or an Epic (6 hours or more), and the estimate is told to the user first. An Epic is not started until the user chooses it over a proposed Hero version. Every size has a working page within the first hour, and Claude reports when a step runs past twice its share of the estimate. A 3D figure of parts the atlas has takes minutes and is never an Epic.
- CI steps "Brain" and "Hippocampus 3D" that build each 3D example in both themes, run its `check.mjs` and `scripts/view-check.mjs`, and a "Mesh packer" step that runs `kit/mesh-test.mjs`.

### Fixed

- `examples/test-rig/` drew its glass button dark in the light theme. `stretch.css` now has light values for its own colours.

### Changed

- The isometric hippocampus example is now `examples/hippocampus-section/`, its pages `hippocampus-section.html` and `hippocampus-section-light.html`, so that `hippocampus-3d` sits beside it; the CI step is "Hippocampus section".
- The kit's turning mode (`kit/turn*.mjs`, `examples/turning-dial/`) is described as "turning parts" in `SKILL.md` and `README.md`, so that "3D" means the atlas viewer.
- `README.md` leads with the 3D route and the brain example, adds a "Sources and licences" section naming both atlases and the CC BY-SA 2.1 JP licence of the BodyParts3D meshes under `examples/*/meshes/`, and credits the upstream repository.
- The section-route workflow steps are numbered 1–10 under their own heading.
- The 4× detail sweep scales with the size: the subject and mechanism for a Figure, the whole drawing for a Hero or an Epic. The density rule itself still holds for every section figure.

## 2026-10-08

### Changed

- The skill is now called Anatomy: `name: anatomy` in `SKILL.md`, invoked as `/anatomy`. It was developed privately as `isometric-objects` before this date, without releases.
- The CSS tokens are now `--anatomy-*` (for example `--anatomy-card`, `--anatomy-face`, `--anatomy-shade-0`); they were `--iso-*`. Every example is rebuilt with the new names.
- The figure card (`.iso-plate`) is square and flat: no rounded corners and no floating shadow, just a 1 px rule in the drawing's mid tone.
- `SKILL.md` makes high detail a standing rule for every figure, raises the parts list to at least 40 parts (60–150 for a hero figure), and adds a 4× detail pass to the final check.

### Added

- The public repository: a README with screenshots of the examples, the MIT license, a contributing guide, a code of conduct, a security policy, issue forms, a pull request template, and a CI workflow that rebuilds every example and fails if a committed page changes.
- What the skill contains at this point: the workflow and craft rules in `SKILL.md`; the kit (SVG core, round parts, pipes, the geometry audit, the WebGL layer, React components, and the 3D mode in beta); eight references; the headless Chrome checks in `scripts/`; six examples (`dial-indicator`, `desk-computer`, `raptor-engine`, `ripple-tank`, `test-rig`, `turning-dial`); and five evals.
