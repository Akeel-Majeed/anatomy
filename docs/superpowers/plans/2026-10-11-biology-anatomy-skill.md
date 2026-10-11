# Biology Anatomy Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/anatomy` into a skill that draws accurate, labelled, interactive isometric teaching models of biological structures, neuroanatomy first, proven by a hippocampus example.

**Architecture:** `SKILL.md` is edited in place and worded for any biological structure; the neuro vocabulary, sources and recipes live in a new `references/neuro.md`. Every figure is built from a committed `truth.mjs` (parts, layers, borders, paths, one source URL per row) that the build asserts against, so the key cannot drift from the source. `examples/hippocampus/` is built through the new skill text as a user would and proves it; evals, README, CHANGELOG and CI follow.

**Tech Stack:** Node 24 (built-in modules only), the repo's own kit (`kit/iso-kit.mjs`, `kit/lathe.mjs`, `kit/tube.mjs`, `kit/audit.mjs`), headless Chrome at `/usr/bin/google-chrome` for `scripts/capture.mjs`, `scripts/drive.mjs` and `scripts/lines.mjs`. No new dependencies. Spec: `docs/superpowers/specs/2026-10-11-biology-anatomy-skill-design.md`.

**House rules that apply to every task** (from `CONTRIBUTING.md`): no comments in code; the kit and every existing example stay byte-identical (CI rebuilds them and fails on any change); run every command from the repo root; commit after each task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `SKILL.md` | The skill: description, the one idea, workflow, craft rules, references. Edited in place. | 1–4, 11 |
| `references/neuro.md` | New. Sources without keys, the truth table, the neuro parts vocabulary with kit recipes, tissue tones, the scope of introductory neuroanatomy, the anatomy check, anti-patterns. | 5 |
| `examples/hippocampus/truth.mjs` | New. The committed truth table: `SOURCE`, `PARTS`, `PATHS`. Data only. | 6 |
| `examples/hippocampus/check.mjs` | New. `checkTruth(PARTS, PATHS, drawn)`: referential integrity of the table, and coverage of drawn regions and pins when given. Used by the build and runnable alone. | 6 |
| `examples/hippocampus/section.mjs` | New. The coronal section as 2D polygons in the cut face's plane: one per region id, one band per layer id, one polyline per path id. | 7 |
| `examples/hippocampus/build.mjs` | New. Stand, cast, pins, cords, card, key, quiz, live script; `--light`, `--audit`. Writes `hippocampus.html` and `hippocampus-light.html`. | 7 |
| `evals/evals.json` | Five anatomy prompts. | 8 |
| `README.md` | Purpose, quick start, usage habits, examples table, limits, credit. | 9 |
| `CHANGELOG.md`, `.github/workflows/ci.yml` | Unreleased entry; one CI step. | 10 |

---

### Task 1: SKILL.md frontmatter, intro and examples list

**Files:**
- Modify: `SKILL.md:1-21`

- [ ] **Step 1: Replace the frontmatter description (lines 1–4)**

Replace the whole `description:` value with:

```yaml
---
name: anatomy
description: Build crafted, highly detailed, interactive isometric teaching models of biological structures (a brain region, a nucleus, a tract, a neuron or cell type, later an organ), labelled with numbered pins and a key, every name checked against a cited source, with many small precise solid parts, four-tone shading, correct painter's order, a framed card with title, hint and live readout, calm eased motion, a pulse along the pathways and a quiz mode that hides the names. Use this whenever someone wants to see, learn, revise or label the parts of a biological structure ("show me the structures of the hippocampus", "label the parts of a neuron", "the anatomy of the basal ganglia for my exam"), an anatomy figure for teaching, lecture notes or a revision site, an interactive anatomy explainer, or an isometric SVG of a structure, even if they never say "isometric". Neuroanatomy is the proven domain. Works framework-free (JS that writes SVG and HTML) and in React/Next.js, and can add WebGL shaders and 3D parts from the kit when a figure needs them.
---
```

- [ ] **Step 2: Replace the intro paragraph and the examples list (lines 8–21)**

Replace everything from `This skill makes figures like a small instrument on a bench` through `The test rig is the quality bar for the drawing itself. The Raptor is the bar for shader work: a WebGL effect has to reach its standard of world-space, no-pop, seamless rendering.` with:

```markdown
This skill makes figures like the teaching models in an anatomy lab: a matte cast of the real structure on a base with a post and a label plate, one face cut to show the section the textbooks use, every named part its own solid with a small numbered pin, and a key under the card. The reader learns the structure because the model is the structure, drawn true to a cited source. Every name the figure shows comes from the same truth table that builds its parts, and every number its readout shows comes from the same model that moves them.

Nine complete examples ship with the skill. `examples/hippocampus/` is the one to open first for any biological figure. The others are machines built with the same kit; each is the reference for a technique, so open the one that has the technique you need. Each framework-free example is built with `node examples/<name>/build.mjs`, which writes a standalone HTML page next to the script; add `--light` for the light theme.

- `examples/hippocampus/` is the reference for this skill: the hippocampal formation in coronal section as a teaching model on a stand. Its regions are prisms along the cast's long axis, its layers are bands on the cut face, every part has a numbered pin, the key is generated from `truth.mjs`, the trisynaptic circuit's cords pulse in order, and Q hides the names. `node build.mjs --audit` proves the geometry and the build asserts the key against the truth table.
- `examples/arcade-cabinet/` is the reference for a concave prism along any axis (its side wall, `prismPaths`), a pulse running chunk by chunk along a cable, a camera placed so a cutaway's inside stays in view, and live parts drawn in reserved slots of the settled order. About 240 solids and 15 cables; `--audit` proves it.
- `examples/raptor-engine/` is the reference for parts that lift apart on hover with staggered springs and per-frame depth re-sorting, for the audit (`kit/audit.mjs`) at rest, apart and in every frame between, for dense pipework from `kit/tube.mjs`, and for smooth shading and fades. A WebGL plume renders between its back and front SVG.
- `examples/desk-computer/` is the reference for drawing in the plane of a face (its CRT, with `sideMatrix`): a cut face's layers and numbers use the same matrices. About 85 solids.
- `examples/ripple-tank/` is the reference for a high camera (44°) that looks into something open, and for WebGL layers registered to the isometric planes and driven by a pure model.
- `examples/dial-indicator/` is the smallest, about 300 lines: the reference for the vanilla loop, the idle tour, pointer mapping and the keyboard.
- `examples/test-rig/` and `examples/spot-plate/` are production React/Next figures: the server/client split, element props, and one control driving many parts.
- `examples/turning-dial/` is the optional 3D mode: parts that turn in true 3D, materials, a hinge chain and a free body.

The hippocampus is the quality bar for a biological figure: its cut face, pins and key. The test rig is the bar for the drawing itself, and the Raptor for shader work.
```

- [ ] **Step 3: Check the file still parses as a skill**

Run: `head -4 SKILL.md | grep -c "^name: anatomy$"`
Expected: `1`

- [ ] **Step 4: Commit**

```bash
rtk git add SKILL.md && rtk git commit -q -m "$(printf 'SKILL.md: describe the skill as biological teaching models\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 2: SKILL.md, "The model is the explanation"

**Files:**
- Modify: `SKILL.md`, the section `## The one idea that matters` through the end of the **Every creation is highly detailed** bullets (ends with `add the real parts that are missing wherever a region is plain.`)

- [ ] **Step 1: Replace the section**

Replace from `## The one idea that matters` up to and including the line beginning `- **Check it last.**` with:

```markdown
## The one idea that matters

**The model is the explanation.** Don't draw boxes, arrows and labels, and don't invent a stand-in object. Draw the real structure as a well-made teaching model, true to a cited source, with every named part its own solid and its own pin. Here is how a structure maps to a model:

| Structure | Model |
|---|---|
| A region (the hippocampal formation, the thalamus) | A cast on a stand with one face cut to the textbook's section, each sub-region its own solid |
| A nucleus (the nuclei of the amygdala, the substantia nigra) | A body inside a cutaway of its neighbour, with the cut edge drawn |
| A tract or pathway (the corticospinal tract, the perforant path) | A bundle of cords from one named part to another, each end on a synapse dot |
| A neuron or a cell | Soma, dendrites, axon hillock, an axon with myelin collars and nodes, terminals; glia as their own bodies |
| A circuit (the trisynaptic circuit, the basal ganglia loops) | Pathways on a model, with a pulse that runs them in order |
| A layered structure (the cortex, the retina, the cerebellar cortex) | A block whose layers are bands on the cut face, each band a named part |

Three ways this fails:

- **Too abstract.** Coloured blobs, floating slabs or labelled boxes don't read as anything.
- **Too mechanical.** Bevels, screws and knurls on tissue, so the structure looks like a machine part. The stand is machined; the cast is not.
- **Wrong.** A name, a border or a connection the source does not support. This is the only failure that costs the reader an exam mark, and the truth table and the anatomy check exist to catch it.

The fix for the first two is a recognisable, well-made model built from many small, precise, purposeful parts. The fix for the third is never drawing a part the truth table doesn't have, and never typing a name anywhere but the truth table.

**Every creation is highly detailed.** This holds for every figure, however small the structure or the request: a quick figure of one nucleus is still a dense, real model on a real stand, never a blob on a slab. What scales with the size (workflow step 1) is how far you push it: a Figure gets the 4× sweep over the cast and its pins, a Hero or an Epic over the whole drawing.
- **Read the real thing.** Build it the way the structure is built: every layer, every border, every fibre bundle with its ends, the sulcus that separates two parts, and the stand, clamp, label plate and pins that hold and name them.
- **Two looks.** At 1× it reads as one clear model. At 4× every region still has something true to find: a layer's band, a cord in its groove, a pin's number. A bare face or an empty corner is unfinished work, not calm.
- **Purposeful, never noise.** Detail comes from parts the source names or the stand needs. Each one sits on another part, ends on an edge, and fades rather than stops.
- **Check it last.** Before you finish, zoom to 4× (over the cast and pins for a Figure, the whole drawing for a Hero or an Epic) and add the real parts that are missing wherever a region is plain.
```

- [ ] **Step 2: Verify no machine-metaphor instruction remains**

Run: `grep -n "Invent the object\|pin-tumbler\|gantry plotter\|chest of seven drawers" SKILL.md`
Expected: no output from the replaced section (step 3 of the workflow still says "Invent the object" until Task 3; that is the only hit allowed).

- [ ] **Step 3: Commit**

```bash
rtk git add SKILL.md && rtk git commit -q -m "$(printf 'SKILL.md: the model is the explanation\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 3: SKILL.md workflow steps

**Files:**
- Modify: `SKILL.md`, the `## Workflow` section, steps 1, 2, 3, 4, 6, 8, 9 and 10

- [ ] **Step 1: Replace step 1's three size bullets**

Keep the step's first sentence and its last bullet (`Whatever the size, have a working page...`). Replace the three size bullets with:

```markdown
   - **Figure**: one structure with 6–12 named parts and no cut face (a neuron with its glia, one nucleus), 40–80 parts, SVG with at most one WebGL layer. About 30–90 minutes. Build it without asking.
   - **Hero**: a region with a cut face, pathways and parts that lift apart (the hippocampal formation, the spinal cord with a reflex arc, the basal ganglia with both pathways), 80–150 parts, or one 3D subject. About 2–4 hours. Say so, then build it unless the user asked for something quick.
   - **Epic**: a whole brain, a mid-sagittal brain with everything named, a multi-region circuit, or the 3D mode on more than one subject. 6 hours or more. Do not start it. Give the estimate, propose a Hero version that keeps the core of the structure (the brainstem and diencephalon alone, one lobe, one loop), and list what the full version would add. Build the Epic only when the user chooses it.
```

- [ ] **Step 2: Replace step 2 ("Truth first")**

```markdown
2. **Truth first.** Before any parts list, fetch the source and write `truth.mjs` beside the build script, a pure module the build imports (the test rig's `rig.ts` is the same idea for numbers). Fetch with WebFetch, which needs no key; the build never fetches, so `truth.mjs` is a committed snapshot with its fetch date. Wikipedia is the default source: the structure's article, then each sub-part's article where the main one lacks its borders or connections. Take the name from the infobox's Terminologia Anatomica or NeuroNames entry, not from the prose; take borders and connections from the prose; use NeuroNames, the Allen Brain Atlas or Gray's on Wikisource for a border the first source leaves unclear. `truth.mjs` exports `SOURCE` (`title`, `url`, `fetched`, `convention`), `PARTS` (one row per named part: `n`, `id`, `name`, `synonyms`, `borders`, `source`, and `layerOf` for a layer that is a band on another part's face) and `PATHS` (`id`, `name`, `from`, `to`, `source`) in circuit order. Every row has its own source URL. If the user pasted a label list, those names, that count and that order are used verbatim, `SOURCE.convention` says where they came from, and fetching only fills borders and paths. You cannot fetch textbooks: when the user names one, ask for that figure's labels pasted. When the table is written, read the source a second time, row by row, and fix every row it does not support. `references/neuro.md` has the schema, the sources and how to read them.
```

- [ ] **Step 3: Replace step 3 ("Invent the object")**

```markdown
3. **Choose the presentation.** Pick the cut the textbooks use (coronal for the hippocampus, transverse for the spinal cord, sagittal for the cerebellum), decide which parts lift apart (regions do; a layer lifts with its region), and say in one sentence what moves and what that motion means: for a circuit, the pulse along its pathways in order. Never copy a reference image: take its view and its labels, not its drawing.
```

- [ ] **Step 4: Replace step 4 ("Parts list")**

```markdown
4. **Parts list.** Write at least 40 parts (40–80 for a Figure, 80–150 for a Hero, more for an Epic), grouped: stand (base plate, feet, groove, corner screws, label plate, post, clamp), cast (one solid per region row of `PARTS`, the cut face, each `layerOf` row as a band on its parent's face), pins (one per `PARTS` row: stem, head and number), pathways (one cord per `PATHS` row, in a groove, ending on synapse dots) and controls (the quiz toggle). Each part sits on another part, and each named part is one row of the truth table. `references/neuro.md` has the vocabulary with recipes; `references/craft.md` has the stand's.
```

- [ ] **Step 5: Append one sentence to step 6 ("Build geometry once")**

After `Only parts whose shape changes are rebuilt per frame.` add:

```markdown
 Each region is its own solid (a prism along the cast's long axis, following the arcade cabinet's `prismPaths`, or a lathe), so it can lift apart and the audit can order it; a layer is a band drawn in its parent's face plane with `sideMatrix` or `topMatrix`, and a pin's head carries its number as `faceTextSvg` in the same plane.
```

- [ ] **Step 6: Replace step 8 ("Frame it")**

```markdown
8. **Frame it.** Put the figure in a card: `Fig n` at top left, the structure and its cut as the title at top right, the interaction hint at bottom left (`Hover a pin · arrows step · Q quiz`) and the live readout at bottom right. The key under the card is generated from `PARTS`: the number, then the name, each in its own span so quiz mode can hide the name. The caption cites `SOURCE` and, when set, its convention. Words stay out of the drawing apart from the pins' numbers and at most one engraved label on the label plate.
```

- [ ] **Step 7: Replace step 9 ("Make it live")**

```markdown
9. **Make it live.** Hovering a part or its pin, or stepping with the arrow keys, lifts that part a little on a spring, makes it the one `lit` part and writes `n · name` in the readout; a layer lifts and lights with its parent. The idle tour runs a pulse along the pathways in `PATHS` order and names each path in the readout as the pulse runs it; hovering a cord runs its pulse. Q, or the toggle in the card, sets `data-quiz` on the card: the key's names hide, hover shows only the number, click or Enter reveals the name, Q again restores it. Calm time-based motion that stops when offscreen and goes still under reduced motion; attributes on refs, no re-render per frame. See `references/motion.md`.
```

- [ ] **Step 8: Replace the first sentence of step 10 and add the anatomy check as its first bullet**

Replace `10. **Verify like a critic.** The owner finds faults by zooming in, so you zoom in first. Read every PNG you make.` with:

```markdown
10. **Verify like a critic.** The reader finds faults by zooming in and by checking the key against their notes, so you do both first. Read every PNG you make.
   - **Run the anatomy check to zero.** The build asserts (`check.mjs` in the hippocampus example) that every `PARTS` row has a drawn region (a solid, or a band on its parent's face for a `layerOf` row) and a pin, every pin maps to a row, every `borders`, `layerOf`, `from` and `to` is a `PARTS` id, and it fails naming the part when any is missing. Capture the cut face at 4× and read it beside the source's figure: every `borders` entry is a visible shared edge, and no two parts touch that the table says don't. Every key name matches its source or the user's list exactly, case and spelling. Then read the source once more against the finished key.
```

Then in the last bullet of step 10, replace `is it instantly a real object, rich in small parts with volume, with every line ending on something?` with `is it instantly a real model, rich in small parts with volume, with every line ending on something and every name true?`.

- [ ] **Step 9: Verify**

Run: `grep -n "Invent the object" SKILL.md; grep -c "Choose the presentation\|Run the anatomy check" SKILL.md`
Expected: first grep prints nothing; second prints `2`.

- [ ] **Step 10: Commit**

```bash
rtk git add SKILL.md && rtk git commit -q -m "$(printf 'SKILL.md: truth-first workflow with pins, key, quiz and the anatomy check\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 4: SKILL.md craft rules and references list

**Files:**
- Modify: `SKILL.md`, `## Craft rules (short form)` and `## References`

- [ ] **Step 1: Insert two rules after the "Small precise detail, never noise" bullet**

```markdown
- **Tissue, not machinery.** The cast is smooth: regions are solids with no bevels, screws or knurls, drawn as tone bands with hairline borders, grey matter a tone darker than white matter, layers as bands on the cut face. Only the stand, the pins and the label plate keep the machined vocabulary. The hovered part is the one `lit`.
- **Pins and key.** Every named part carries one pin: a thin stem standing on the part, a head disc, and the part's number as face text on the head. The number is text the model displays, so it doesn't count against the one-label rule. Names live in the key and the readout, never on leader lines or in the drawing.
```

- [ ] **Step 2: Reword the "Lines resolve" bullet's last sentence**

Replace `There are no leader lines, balloons, dimension arrows or labels floating in the air.` with `There are no leader lines, balloons, dimension arrows or labels floating in the air; a pin's number sits on its head and the pin stands on its part.`

- [ ] **Step 3: Add the neuro reference to the References list, first in the list, and a closing sentence**

Insert before `- \`references/craft.md\`:`:

```markdown
- `references/neuro.md`: the biology side: what a teaching model looks like, sources without keys and how to read them, the truth table and the pasted-list override, the neuro parts vocabulary with kit recipes (stand, cast, cut face and layers, nucleus, tract, neuron, pin, pathway and pulse, quiz toggle), tissue tones, the scope of introductory neuroanatomy, the anatomy check and the anti-patterns. Read it before step 2.
```

Append after the last list item:

```markdown

A later domain (organs, cells) gets its own reference beside `neuro.md`, with its vocabulary and one example. The workflow, the truth table, the pins, the key, quiz mode and the anatomy check are the same for every domain.
```

- [ ] **Step 4: Verify**

Run: `grep -c "Tissue, not machinery\|Pins and key\|references/neuro.md" SKILL.md`
Expected: `3`

- [ ] **Step 5: Commit**

```bash
rtk git add SKILL.md && rtk git commit -q -m "$(printf 'SKILL.md: tissue and pin rules, neuro reference\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 5: `references/neuro.md`

**Files:**
- Create: `references/neuro.md`

- [ ] **Step 1: Write the file**

```markdown
# Neuroanatomy: the biology side of the kit

This is the reference for any biological figure. It covers what a teaching model looks like, where its names come from, the truth table that holds them, the parts vocabulary with kit recipes, tissue tones, what introductory neuroanatomy covers, the anatomy check and the faults that fail a figure. `craft.md` still holds the stand's vocabulary, the tones and the painter's order; `kit.md` the API; `motion.md` the live behaviour.

## Contents

1. The look
2. Sources without keys
3. The truth table
4. Parts vocabulary, with recipes
5. Tissue tones
6. The scope of introductory neuroanatomy
7. The anatomy check
8. Anti-patterns

## 1. The look

A teaching model is the plastic cast on a stand in every anatomy lab: matte, a little larger than life, one face cut flat to the section the textbooks draw, the regions of the cut face coloured by tone with a hairline border between them, small numbered pins stuck into each part, and a printed key card. It stands on a base with a post or a cradle and a label plate. Parts come off in the hand. That is the whole look: the cast is smooth and organic, the stand is machined.

Open these before you start:

- `examples/hippocampus/`: the reference. A cast as prisms along its long axis, a cut face with layers, pins, a generated key, cords with a pulse, hover lift, quiz mode.
- `examples/arcade-cabinet/`: a concave prism along any axis (`prismPaths`), a pulse along a cable chunk by chunk, a camera that keeps a cutaway in view.
- `examples/raptor-engine/`: parts that lift on springs, the audit in every frame.
- `examples/desk-computer/`: drawing in a face plane with `sideMatrix`.

## 2. Sources without keys

Fetch with Claude Code's WebFetch, which needs no API key. The build script never fetches: `truth.mjs` is a committed snapshot with its fetch date, so a build is reproducible and CI runs offline.

**Wikipedia** is the default. For a structure:

1. Fetch `https://en.wikipedia.org/wiki/<Structure>`. Read the infobox first: its *Latin*, *TA98/TA2* and *NeuroNames* rows give the canonical name; use the English name the infobox heads the article with, and keep the Latin as a synonym.
2. Read the *Structure* or *Anatomy* section for what the structure contains, what it borders, and the section the article's figure uses.
3. For every sub-part the article names without giving its borders, fetch that sub-part's own article and repeat.
4. For pathways, read the *Connections*, *Circuitry* or *Function* section, and the pathway's own article (for example `Perforant_path`, `Schaffer_collateral`).

**Second sources**, for a border or a name the first leaves unclear:

- NeuroNames at BrainInfo: `http://braininfo.rprc.washington.edu/` (search the name; the page gives the standard name, synonyms and the hierarchy).
- The Allen Brain Atlas reference ontology: `https://atlas.brain-map.org/` and its structure pages.
- Gray's Anatomy (1918) on Wikisource: `https://en.wikisource.org/wiki/Gray%27s_Anatomy`.

**What to take and what not to.** Take names from an infobox or a nomenclature source, never from a caption or running prose, where authors abbreviate ("CA1" for "field CA1 of the hippocampus" is fine only if the infobox or the user's list says so). Take borders and connections from prose that states them; a figure alone is not a source for a border. Do not take sizes or counts unless the source gives them, and then put them in the caption, not the drawing.

**The user's list wins.** When the user pastes a label list (from a lecture, a textbook figure, an atlas), use those names, that count and that order verbatim. Set `SOURCE.convention` to where they came from, in the user's words ("lecture handout, week 4"), and let the caption say "Names follow <convention>". Fetch only to fill `borders` and `PATHS`. You cannot fetch textbooks, so when a user names one, ask for the figure's labels pasted rather than guessing the book's names.

## 3. The truth table

`truth.mjs` is data only, beside the build script:

```js
export const SOURCE = {
  title: "Hippocampus - Wikipedia",
  url: "https://en.wikipedia.org/wiki/Hippocampus",
  fetched: "2026-10-11",
  convention: "",
};

export const PARTS = [
  { n: 1, id: "dg", name: "Dentate gyrus", synonyms: ["gyrus dentatus"], borders: ["hilus", "ca3"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 2, id: "dg-granule", name: "Granule cell layer", synonyms: [], layerOf: "dg", borders: ["dg-molecular", "dg-polymorphic"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
];

export const PATHS = [
  { id: "perforant", name: "Perforant path", from: "ec", to: "dg", source: "https://en.wikipedia.org/wiki/Perforant_path" },
];
```

- `n` is the pin number and the key order, 1-based, unique.
- `id` is what the geometry refers to: lower-case, hyphens, unique.
- `borders` lists the ids this part shares an edge with on the cut face. Symmetric: if `a` lists `b`, `b` lists `a`.
- `layerOf` names the region a layer is a band on. A layer has its own pin and key row, lifts with its parent, and is not its own solid.
- `PATHS` are in circuit order; the pulse runs them in array order. `from` and `to` are `PARTS` ids.
- Every row has its own `source` URL, even when it is the same as the one above.

The key is generated from `PARTS` and each part's solid and pin are built from its row by `id`, so a name is typed in exactly one place. `examples/hippocampus/check.mjs` holds `checkTruth(PARTS, PATHS, drawn)`: copy it beside any new build. It throws, naming the row, on a duplicate `n` or `id`, a `borders`, `layerOf`, `from` or `to` that is not an id, an asymmetric border, and, when `drawn` is given, a row with no drawn region or no pin and a pin with no row.

## 4. Parts vocabulary, with recipes

Import `k` from `kit/iso-kit.mjs`, `G` from `kit/lathe.mjs`, `T` from `kit/tube.mjs` and `A` from `kit/audit.mjs`, as the examples do.

### Stand, post and label plate

Reuse `craft.md` section 3 as it is: the base plate on feet with corner screws and a groove, the ruler strip, the label plate with three rule lines (`free: true`), a post with a clamp. A cast that lies flat sits in a shallow cradle: two low ribs (`k.slabOf`) under its long axis, so the audit's `supports` sees it held. A cast that stands is clamped to the post. The label plate carries the one engraved label the drawing may have: the structure's name, as `faceTextSvg` on `topMatrix`.

### The cast: regions as prisms along the long axis

A region of a section is a polygon in the cut face's plane, extruded along the cast's long axis. Copy `prismPaths` from `examples/arcade-cabinet/build.mjs` (it draws a concave polygon as facets with the hull as outline), and record it with `A.prism(F, polygon, s0, s1, { name })` where `F` is `G.frameOf(origin, axis, u, v)` with `axis` along the length and `u`, `v` spanning the cut face. One prism per region row; neighbouring regions share edges exactly (the same vertex list on the shared edge), which the audit accepts as flush contact. Give the back end of the cast a second cut or let it stop at the cradle; it is a block cut from the structure, as a histology block is.

Keep the section polygons in a `section.mjs` beside the build, keyed by `PARTS` id, in face coordinates `[u, v]` (u across the face, v up), with the layers and cords in the same coordinates. That file is the anatomical drawing; the build only places it.

### The cut face: layers as bands

A `layerOf` row is a closed polygon inside its parent's polygon, drawn as a flat fill in the face plane, not extruded: map each `[u, v]` to world with the frame, project with `k.iso`, and draw with `k.pathOf(points, true)` as a `<path>` carrying `data-tone`. Its border is a hairline in the `faint` tone, drawn as a `lineSvg` on the same points. It lifts with its parent, so put it inside the parent's `<g data-part>`. Bands run edge to edge of their parent: a band that stops inside its parent floats, and the line check fails it.

### A nucleus inside a cutaway

Draw the neighbour as a prism with a notch (a concave polygon) and the nucleus as `G.sphereOf` or a lathe (`G.solidOf`) sitting in the notch, recorded with `A.ball` or `A.solid`, its rim tangent to the notch (flush contact, not sunk). The cut edge of the neighbour is the notch's outline.

### A tract or pathway: cords in a groove

A cord is a route from one named part to another: `R.route(id, points, r, { piece, limp: true, ends: [true, true] })` with `T.tubePieces` chunks drawn by `T.tubeSvg`, as the arcade cabinet's `cable` helper does. On a cut face, the points lie `r + 0.2` proud of the face along its normal; draw a groove under it as two faint lines on the face, `r` either side of the centreline, ending on the parts' borders. Each end finishes on a synapse dot (`k.dotsSvg`, size 0.5, recorded with `A.ball`) that sits on the part the path names. Each chunk carries `data-route="<id>" data-chunk="<n>"` so the pulse can light it.

### A neuron

Soma: `G.sphereOf` or a short lathe. Dendrites: routes that leave the soma tangent, branching at ball tees (`craft.md` section 8). Axon hillock: a lathe that tapers from the soma into the axon's radius. Axon: one route; myelin as collars (`G.ringBand`) that gap the route (`gaps`), with a bare node between each pair. Terminals: the route ends on small balls. Glia: an astrocyte as a soma with short radiating routes ending on the neuron and a capillary; an oligodendrocyte as a soma whose processes end on the collars; a microglial cell as a small body with fine processes. Every end sits on something; the audit's `looseEnds` fails the rest.

### A pin

Each `PARTS` row gets one pin. On a vertical cut face: a short disc along the face's normal, `G.disc(Fn, 0, 1.2, 1.6, { name: "pin.<id>" })` where `Fn` is a frame whose axis is the face normal at the pin's point, drawn by `G.solidOf` in the `hi` tone, with the number as `faceTextSvg` on `sideMatrix` at the disc's face, size 2.2, `anchor: "middle"`. On a top face: a stem `k.cylinder(cx, cy, 0.35, z, 4, P, 12)` and a head `k.cylinder(cx, cy, 1.4, z + 4, 0.8, P, 16)`, the number on `topMatrix` at the head's top. The pin's `<g>` carries `data-pin="<id>"`, inside the part's `<g data-part="<id>">` so it lifts with the part. A pin stands on its part: the audit's `supports` sees the disc or the stem touching the part.

### Pathway pulse

The pulse lights one chunk of one cord at a time, in `PATHS` order, chunk order within a path: the live script keeps `routes = PATHS.map(p => [...stage.querySelectorAll(`[data-route="${p.id}"]`)])`, advances a position at 24 chunks per second, sets `data-tone="lit"` on the chunk at the head and restores the previous chunk's tone, and writes `${path.name}` in the readout while the pulse is on that path. Nothing is re-rendered: only attributes change. The idle tour runs it after 1.4 s of no interaction; hovering a cord runs that cord's pulse once.

### Quiz toggle

A `<button type="button" class="hp-quiz" aria-pressed="false">Quiz</button>` inside the card, bottom left under the hint. Q or the button toggles `data-quiz` on the `<figure>`. Page CSS: `.iso-figure[data-quiz] .hp-name { visibility: hidden }`. In quiz mode the readout shows only `n` on hover; click or Enter writes `n · name`; leaving quiz mode writes the full readout again.

## 5. Tissue tones

Keep `craft.md` section 4's hierarchy: stand `lo`, structure `mid`, the cast `hi` with its regions as `mid` and `hi` bands so neighbours differ by one tone, grey matter the darker of the two and white matter the lighter. Borders between regions are `faint` hairlines. Exactly one part is `lit`: the hovered one, or none at rest. No colour unless colour is the subject (a stain, a tracer).

## 6. The scope of introductory neuroanatomy

A checklist of what first courses examine, for picking the parts a request implies. Scope only; names come from the source.

- Divisions: central and peripheral; somatic and autonomic; sympathetic and parasympathetic.
- The brain: the lobes and their major sulci and gyri; the cerebral cortex and its six layers; the corpus callosum; the ventricles and the flow of cerebrospinal fluid; the meninges.
- Deep structures: the basal ganglia (striatum, globus pallidus, subthalamic nucleus, substantia nigra), the thalamus, the hypothalamus, the amygdala, the hippocampal formation, the limbic system.
- The brainstem: midbrain, pons, medulla; the cranial nerves and their nuclei; the reticular formation.
- The cerebellum: the cortex's three layers, the deep nuclei, the peduncles.
- The spinal cord: grey horns, white columns, roots, ganglia, the major tracts, the reflex arc.
- Cells: neuron types and parts; astrocytes, oligodendrocytes, microglia, Schwann cells; the synapse.
- Sensory systems: the retina's layers and the visual pathway; the cochlea and the auditory pathway; the somatosensory pathways.
- Circuits: the trisynaptic circuit; the basal ganglia direct and indirect pathways; the stretch reflex.

## 7. The anatomy check

Run it before the geometry checks, in this order:

1. **The build assertion.** `checkTruth(PARTS, PATHS, { regions, pins })` runs on every build and fails naming the part. Nothing else is checked until it passes.
2. **Adjacency at 4×.** `node scripts/capture.mjs page.html --out shots/ --zoom 4 --at <cut face>` (see `verify.md` for the flags), then read the PNG beside the source's figure. Every `borders` entry is a visible shared edge; no two parts touch that the table says don't.
3. **Names verbatim.** Diff the key's text against the source's names or the user's list: case, spelling, hyphens.
4. **Second reading.** Open the source again and read it row by row against the finished key. Fix the table, rebuild, repeat.

Then the audit (`node build.mjs --audit` ends `audit passed`), the line check (`node scripts/lines.mjs page.html --out shots/lines.png` prints `line ends: 0`), both themes, and the 4× close-ups of every pin, every border, every cord end and every layer band.

## 8. Anti-patterns

- **Coloured blobs.** A region with no border, no layer and no pin, filled with a colour. Draw its real shape and its neighbours.
- **Machined tissue.** Bevels, screws, knurls or seams on the cast. Those belong to the stand.
- **A wrong label.** A name not in the source or the user's list, or a border the source does not state. The anatomy check exists for this; run it.
- **A typed key.** Key text written by hand rather than generated from `PARTS`. It will drift.
- **A pin in the air.** A pin whose stem or disc does not touch its part, or a pin on a layer that is not inside the layer's band.
- **A cord that lands on nothing.** A path whose end is not a synapse dot on the part the row names, or that crosses another part's face instead of running along the border.
- **A floating band.** A layer that stops inside its parent instead of running border to border.
- **Names in the drawing.** Any text but pin numbers and the label plate.
```

- [ ] **Step 2: Verify the file's contents list matches its headings**

Run: `grep -c "^## [0-9]" references/neuro.md`
Expected: `8`

- [ ] **Step 3: Commit**

```bash
rtk git add references/neuro.md && rtk git commit -q -m "$(printf 'references/neuro.md: sources, truth table, vocabulary, anatomy check\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 6: The hippocampus truth table and its check

**Files:**
- Create: `examples/hippocampus/check.mjs`
- Create: `examples/hippocampus/truth.mjs`

- [ ] **Step 1: Write the check with its own self-test**

`examples/hippocampus/check.mjs`:

```js
export function checkTruth(PARTS, PATHS, drawn = null) {
  const ids = new Set();
  const ns = new Set();
  const fail = (message) => {
    throw new Error(`truth: ${message}`);
  };
  for (const part of PARTS) {
    if (ids.has(part.id)) fail(`duplicate id ${part.id}`);
    if (ns.has(part.n)) fail(`duplicate n ${part.n} (${part.id})`);
    if (!part.name) fail(`${part.id} has no name`);
    if (!part.source) fail(`${part.id} has no source`);
    ids.add(part.id);
    ns.add(part.n);
  }
  const byId = new Map(PARTS.map((part) => [part.id, part]));
  for (const part of PARTS) {
    if (part.layerOf && !byId.has(part.layerOf)) fail(`${part.id}.layerOf ${part.layerOf} is not a part`);
    for (const other of part.borders ?? []) {
      if (!byId.has(other)) fail(`${part.id} borders ${other}, which is not a part`);
      if (!(byId.get(other).borders ?? []).includes(part.id)) fail(`${part.id} borders ${other} but not the other way`);
    }
  }
  for (const path of PATHS) {
    if (!byId.has(path.from)) fail(`${path.id}.from ${path.from} is not a part`);
    if (!byId.has(path.to)) fail(`${path.id}.to ${path.to} is not a part`);
    if (!path.source) fail(`${path.id} has no source`);
  }
  if (drawn) {
    for (const part of PARTS) {
      if (!drawn.regions.has(part.id)) fail(`${part.id} (${part.name}) has no drawn region`);
      if (!drawn.pins.has(part.id)) fail(`${part.id} (${part.name}) has no pin`);
    }
    for (const id of drawn.pins) if (!byId.has(id)) fail(`pin ${id} has no truth row`);
  }
  return { parts: PARTS.length, paths: PATHS.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ok = [
    { n: 1, id: "a", name: "A", synonyms: [], borders: ["b"], source: "s" },
    { n: 2, id: "b", name: "B", synonyms: [], borders: ["a"], source: "s" },
    { n: 3, id: "a-l", name: "A layer", synonyms: [], layerOf: "a", borders: [], source: "s" },
  ];
  const paths = [{ id: "p", name: "P", from: "a", to: "b", source: "s" }];
  const expectThrow = (parts, ps, drawn, text) => {
    let caught = "";
    try {
      checkTruth(parts, ps, drawn);
    } catch (error) {
      caught = error.message;
    }
    if (!caught.includes(text)) throw new Error(`expected "${text}", got "${caught}"`);
  };
  checkTruth(ok, paths);
  checkTruth(ok, paths, { regions: new Set(["a", "b", "a-l"]), pins: new Set(["a", "b", "a-l"]) });
  expectThrow([...ok, { ...ok[0], n: 9 }], paths, null, "duplicate id a");
  expectThrow([ok[0], { ...ok[1], borders: [] }, ok[2]], paths, null, "not the other way");
  expectThrow(ok, [{ ...paths[0], to: "zz" }], null, "not a part");
  expectThrow(ok, paths, { regions: new Set(["a", "b"]), pins: new Set(["a", "b", "a-l"]) }, "has no drawn region");
  expectThrow(ok, paths, { regions: new Set(["a", "b", "a-l"]), pins: new Set(["a", "b"]) }, "has no pin");
  expectThrow(ok, paths, { regions: new Set(["a", "b", "a-l"]), pins: new Set(["a", "b", "a-l", "q"]) }, "has no truth row");
  console.log("check.mjs: self-test passed");
}
```

- [ ] **Step 2: Run the self-test**

Run: `node examples/hippocampus/check.mjs`
Expected: `check.mjs: self-test passed`

- [ ] **Step 3: Fetch the sources with WebFetch, in this order, and note the date**

Fetch each with a prompt of "List the named sub-structures, what each borders, and the named connections, with the infobox's Latin, TA and NeuroNames names":

1. `https://en.wikipedia.org/wiki/Hippocampus` (the *Anatomy* section: the regions of the hippocampal formation and the coronal section's layout)
2. `https://en.wikipedia.org/wiki/Hippocampal_formation`
3. `https://en.wikipedia.org/wiki/Dentate_gyrus` (its three layers)
4. `https://en.wikipedia.org/wiki/Hippocampus_proper` (CA1, CA2, CA3, the hilus/CA4, the strata)
5. `https://en.wikipedia.org/wiki/Subiculum`, `https://en.wikipedia.org/wiki/Entorhinal_cortex`, `https://en.wikipedia.org/wiki/Fimbria_of_hippocampus`, `https://en.wikipedia.org/wiki/Alveus_of_the_hippocampus`
6. `https://en.wikipedia.org/wiki/Perforant_path`, `https://en.wikipedia.org/wiki/Mossy_fiber_(hippocampus)`, `https://en.wikipedia.org/wiki/Schaffer_collateral`, `https://en.wikipedia.org/wiki/Trisynaptic_circuit`

Run `date -I` and put it in `SOURCE.fetched`.

- [ ] **Step 4: Write `truth.mjs` from what the sources say**

The file has exactly the shape below. The expected rows are listed from the spec; every row's `name`, `borders` and `source` must come from the fetched text, and a row the sources do not support is dropped, not kept. Keep layers' `borders` to their neighbouring layers within the same parent.

```js
export const SOURCE = {
  title: "Hippocampus - Wikipedia",
  url: "https://en.wikipedia.org/wiki/Hippocampus",
  fetched: "2026-10-11",
  convention: "",
};

export const PARTS = [
  { n: 1, id: "dg", name: "Dentate gyrus", synonyms: ["gyrus dentatus"], borders: ["hilus", "ca3"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 2, id: "dg-molecular", name: "Molecular layer", synonyms: [], layerOf: "dg", borders: ["dg-granule"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 3, id: "dg-granule", name: "Granule cell layer", synonyms: [], layerOf: "dg", borders: ["dg-molecular", "dg-polymorphic"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 4, id: "dg-polymorphic", name: "Polymorphic layer", synonyms: [], layerOf: "dg", borders: ["dg-granule"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 5, id: "hilus", name: "Hilus", synonyms: ["CA4"], borders: ["dg", "ca3"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 6, id: "ca3", name: "CA3", synonyms: [], borders: ["hilus", "dg", "ca2"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 7, id: "ca2", name: "CA2", synonyms: [], borders: ["ca3", "ca1"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 8, id: "ca1", name: "CA1", synonyms: [], borders: ["ca2", "subiculum", "alveus"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 9, id: "ca1-oriens", name: "Stratum oriens", synonyms: [], layerOf: "ca1", borders: ["ca1-pyramidale"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 10, id: "ca1-pyramidale", name: "Stratum pyramidale", synonyms: [], layerOf: "ca1", borders: ["ca1-oriens", "ca1-radiatum"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 11, id: "ca1-radiatum", name: "Stratum radiatum", synonyms: [], layerOf: "ca1", borders: ["ca1-pyramidale", "ca1-lacunosum-moleculare"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 12, id: "ca1-lacunosum-moleculare", name: "Stratum lacunosum-moleculare", synonyms: [], layerOf: "ca1", borders: ["ca1-radiatum"], source: "https://en.wikipedia.org/wiki/Hippocampus_proper" },
  { n: 13, id: "subiculum", name: "Subiculum", synonyms: [], borders: ["ca1", "presubiculum"], source: "https://en.wikipedia.org/wiki/Subiculum" },
  { n: 14, id: "presubiculum", name: "Presubiculum", synonyms: [], borders: ["subiculum", "parasubiculum"], source: "https://en.wikipedia.org/wiki/Subiculum" },
  { n: 15, id: "parasubiculum", name: "Parasubiculum", synonyms: [], borders: ["presubiculum", "ec"], source: "https://en.wikipedia.org/wiki/Subiculum" },
  { n: 16, id: "ec", name: "Entorhinal cortex", synonyms: [], borders: ["parasubiculum"], source: "https://en.wikipedia.org/wiki/Entorhinal_cortex" },
  { n: 17, id: "alveus", name: "Alveus", synonyms: [], borders: ["ca1", "fimbria"], source: "https://en.wikipedia.org/wiki/Alveus_of_the_hippocampus" },
  { n: 18, id: "fimbria", name: "Fimbria", synonyms: ["fimbria hippocampi"], borders: ["alveus"], source: "https://en.wikipedia.org/wiki/Fimbria_of_hippocampus" },
];

export const PATHS = [
  { id: "perforant", name: "Perforant path", from: "ec", to: "dg", source: "https://en.wikipedia.org/wiki/Perforant_path" },
  { id: "mossy", name: "Mossy fibres", from: "dg", to: "ca3", source: "https://en.wikipedia.org/wiki/Mossy_fiber_(hippocampus)" },
  { id: "schaffer", name: "Schaffer collaterals", from: "ca3", to: "ca1", source: "https://en.wikipedia.org/wiki/Schaffer_collateral" },
  { id: "ca1-sub", name: "CA1 to subiculum", from: "ca1", to: "subiculum", source: "https://en.wikipedia.org/wiki/Subiculum" },
  { id: "sub-ec", name: "Subiculum to entorhinal cortex", from: "subiculum", to: "ec", source: "https://en.wikipedia.org/wiki/Subiculum" },
];
```

Every `borders` list above is the spec's expectation; correct it from the fetched text where the source says otherwise (for example if the source gives CA3 a border with the hilus only, drop `dg` from CA3 and `ca3` from DG). Keep the border lists symmetric or the check fails.

- [ ] **Step 5: Run the integrity check on the real table**

Run: `node --input-type=module -e "import { checkTruth } from './examples/hippocampus/check.mjs'; import { PARTS, PATHS } from './examples/hippocampus/truth.mjs'; console.log(checkTruth(PARTS, PATHS));"`
Expected: `{ parts: 18, paths: 5 }` (or the counts the sources supported)

- [ ] **Step 6: Second reading**

Re-fetch `https://en.wikipedia.org/wiki/Hippocampus_proper` and `https://en.wikipedia.org/wiki/Dentate_gyrus` with the prompt "Quote the sentences that name the layers and the neighbouring regions", and read them against every row. Fix rows, re-run step 5.

- [ ] **Step 7: Commit**

```bash
rtk git add examples/hippocampus/check.mjs examples/hippocampus/truth.mjs && rtk git commit -q -m "$(printf 'hippocampus: truth table and its check\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 7: The hippocampus example

This task is the skill's own workflow, run on the skill's own text: read `SKILL.md`, `references/neuro.md`, `references/craft.md` sections 3, 5 and 8, `references/motion.md`, `references/verify.md`, and `examples/arcade-cabinet/build.mjs` before writing geometry. Budget 2–4 hours; run `date` at each step. The decisions below are fixed by the spec; the geometry inside them is yours.

**Files:**
- Create: `examples/hippocampus/section.mjs`
- Create: `examples/hippocampus/build.mjs`
- Create (by the build): `examples/hippocampus/hippocampus.html`, `examples/hippocampus/hippocampus-light.html`

**Fixed decisions**

- Camera: `fitProjection(points, 600, 480, { pad: 30, azimuth: 35, elevation: 30 })`. Decide which of the two visible vertical faces is the cut face from `sideMatrix(at, z, P, "left" | "right")` and lay the cast's long axis along the other floor axis, so the cut face is the end nearest the viewer. If the arcade cabinet's choice (azimuth 146 to turn a cutaway to the viewer) reads better at 1×, use it; record the choice in the aria-label's description.
- Stand: a base plate on four feet with corner screws and a groove, a ruler strip, a label plate engraved `Hippocampal formation · coronal` (`faceTextSvg` on `topMatrix`, the one allowed label), and a cradle of two ribs the cast lies in.
- Cast: a block about 120 wide, 90 tall and 60 deep in world units, one prism per region row, all sharing the cut face's plane, the back end a plain second cut.
- Section: `section.mjs` exports `REGIONS` (id → `[[u, v], …]`), `LAYERS` (id → `[[u, v], …]`, inside the parent's polygon, running border to border) and `CORDS` (path id → `[[u, v], …]`, running along borders, never across a face), in face coordinates with `u` across the face and `v` up, the face centred on `[0, 0]`. Draw the section from the fetched source's figure, honouring every `borders` entry as a shared edge: the dentate gyrus is a C that cups the hilus, CA3 continues from the hilus and curves into CA2 then CA1, CA1 continues into the subiculum, presubiculum, parasubiculum and the entorhinal cortex along the lower edge, the alveus is a thin band over CA1's outer edge, and the fimbria is a small body on the alveus at the medial end. The layers of CA1 run parallel to its outer edge, from the alveus inward: oriens, pyramidale, radiatum, lacunosum-moleculare. The dentate layers run from its outer edge inward: molecular, granule, polymorphic.
- Pins: one per `PARTS` row, the disc kind of `neuro.md` section 4 for parts on the cut face and the stem kind for the fimbria on top, each inside its part's `<g data-part="<id>">` with `data-pin="<id>"`.
- Cords: one per `PATHS` row, `neuro.md` section 4, chunks tagged `data-route`/`data-chunk`, ends on synapse dots on the parts the row names.
- Lift: `R = A.recorder(P, { order: REGION_IDS, spring: SPRING })` with `SPRING = { stagger: 0, stiffness: 64, damping: 14.2, substeps: 4 }`, every region's items with `piece: id` and `move: [0, 0, 6]`. Settle with custom states, one region at a time: `states = [0, ...REGION_IDS.flatMap((id, i) => [0.25, 0.5, 0.75, 1].map((s) => ({ label: `${id}@${s}`, shares: REGION_IDS.map((_, j) => (i === j ? s : 0)) })))]`, passed as `A.settle(R, P, { states })` and `A.auditOrExit(R, P, { frames: states.slice(1), apart: states.slice(1) })`.
- Key and caption: built by the build, not by `plateHtml`'s `keys`, so the number and name are separate spans:

```js
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const keyHtml = `<span class="iso-keys">${PARTS.map((p) => `<span class="iso-key" data-key="${p.id}"><b class="hp-n">${p.n}</b> <span class="hp-name">${esc(p.name)}</span></span>`).join("")}</span>`;
const caption = `${SOURCE.title}, fetched ${SOURCE.fetched}${SOURCE.convention ? ` · Names follow ${SOURCE.convention}` : ""}`;
const legend = `<figcaption class="iso-legend">${keyHtml}<span class="iso-caption">${esc(caption)}</span></figcaption>`;
const card = k.plateHtml({ fig: "Fig 1", title: "Hippocampal formation · coronal", hint: "Hover a pin · arrows step · Q quiz", readout: `${PARTS.length} parts`, body }).replace("</figure>", `${legend}</figure>`);
```

- Quiz button: `<button type="button" class="hp-quiz" aria-pressed="false">Quiz</button>` appended inside `body` after the stage; page CSS positions it at the card's bottom left under the hint and `.iso-figure[data-quiz] .hp-name{visibility:hidden}`.
- The build assertion, before any HTML is written:

```js
import { checkTruth } from "./check.mjs";
import { PARTS, PATHS, SOURCE } from "./truth.mjs";
const drawn = { regions: new Set(), pins: new Set() };
```

Each region builder adds its id to `drawn.regions`, each layer builder adds its id, each pin builder adds its id to `drawn.pins`; then `checkTruth(PARTS, PATHS, drawn);` runs right after the geometry and before `A.settle`.

- Live script (inlined with `kitScript()`): a spring per region; `pointerover`/`focus` on `[data-part]` or `[data-pin]` sets that region's target to 1 and the rest to 0, sets `data-tone="lit"` on the part's fills (restoring the previous), and writes the readout; arrow keys step `n`; Q and the button toggle `data-quiz` on the `<figure>` and `aria-pressed` on the button; in quiz mode hover writes only `${n}` and click or Enter writes `${n} · ${name}`; the pulse of `neuro.md` section 4 runs on the idle tour after 1.4 s and on a cord's hover; the loop stops when settled and offscreen, and reduced motion jumps to targets with no pulse. The stage is `tabindex="0" role="group"` with an `aria-label` that explains the keys.

- [ ] **Step 1: Write the parts list as a comment-free list in your reply, 80–150 parts, grouped stand, cast, pins, cords, controls**

Expected: at least 80 lines, each a real part that sits on another.

- [ ] **Step 2: Write `section.mjs`**

Run after writing: `node --input-type=module -e "import * as S from './examples/hippocampus/section.mjs'; import { PARTS, PATHS } from './examples/hippocampus/truth.mjs'; for (const p of PARTS) if (!(p.layerOf ? S.LAYERS[p.id] : S.REGIONS[p.id])) throw new Error('no polygon for ' + p.id); for (const q of PATHS) if (!S.CORDS[q.id]) throw new Error('no cord for ' + q.id); console.log('section covers the table');"`
Expected: `section covers the table`

- [ ] **Step 3: Write `build.mjs` with the stand, the cast and the assertion, no pins or cords yet**

Run: `node examples/hippocampus/build.mjs`
Expected: it throws `truth: dg (Dentate gyrus) has no pin`. That proves the assertion is wired.

- [ ] **Step 4: Add the pins, the cords, the key, the quiz button and the live script**

Run: `node examples/hippocampus/build.mjs && node examples/hippocampus/build.mjs --light`
Expected: both pages written, no error.

- [ ] **Step 5: Prove the assertion from the other side**

Temporarily delete the `fimbria` row from `truth.mjs`, run `node examples/hippocampus/build.mjs`, expect `Error: truth: alveus borders fimbria, which is not a part`; restore the row; then temporarily delete the fimbria's pin builder call, run the build, expect `truth: fimbria (Fimbria) has no pin`; restore it.

- [ ] **Step 6: Audit to zero**

Run: `node examples/hippocampus/build.mjs --audit`
Expected: the report ends `audit passed` with 0 on every failing line. Fix geometry, never keys, until it does.

- [ ] **Step 7: Line check to zero, both themes**

Run:
```bash
node scripts/lines.mjs examples/hippocampus/hippocampus.html --out /tmp/claude-1000/-home-akeel-projects-anatomy/4db6a713-0a95-4f62-aca0-854a80520cd3/scratchpad/hp-lines.png
node scripts/lines.mjs examples/hippocampus/hippocampus-light.html --out /tmp/claude-1000/-home-akeel-projects-anatomy/4db6a713-0a95-4f62-aca0-854a80520cd3/scratchpad/hp-lines-light.png
```
Expected: `line ends: 0` twice. Read both PNGs.

- [ ] **Step 8: Captures and the anatomy check**

Run `node scripts/capture.mjs examples/hippocampus/hippocampus.html --out <scratchpad>/hp/` with the desktop, phone (390), hover and 4× close-up options from `references/verify.md`, then the same on the light page. Read every PNG. Check the cut face at 4× against the Wikipedia coronal figure: every `borders` row is a shared edge, nothing else touches. Then with `scripts/drive.mjs`: hover pin 8 (CA1 lifts, readout `8 · CA1`), press Q (names hidden), hover pin 8 (readout `8`), click (readout `8 · CA1`), let the tour run 6 s (the pulse crosses all five cords, readout shows each path's name). Read the contact sheet.

- [ ] **Step 9: Commit the example and its built pages**

```bash
rtk git add examples/hippocampus/ && rtk git commit -q -m "$(printf 'Add the hippocampus example\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 8: Evals

**Files:**
- Modify: `evals/evals.json` (replace the whole file)

- [ ] **Step 1: Write the file**

```json
{
  "skill_name": "anatomy",
  "evals": [
    {
      "id": 1,
      "prompt": "I'm revising the hippocampus for an exam. Show me a coronal section with every structure labelled: the dentate gyrus and its layers, the CA fields and the strata of CA1, the subiculum, presubiculum, parasubiculum and entorhinal cortex, the alveus and fimbria, and the trisynaptic circuit. One HTML file I can open, light theme.",
      "expected_output": "A single standalone light HTML page of a teaching model on a stand: a cast of the hippocampal formation with its coronal cut face toward the viewer, each region its own solid, each layer a band on its parent's face, one numbered pin per named part, a key under the card generated from a committed truth.mjs that has a source URL on every row, and a caption citing the source. The perforant path, mossy fibres, Schaffer collaterals and the subicular outputs are cords ending on synapse dots, and a pulse runs them in order on the idle tour with the readout naming each. Hovering a pin lifts and lights its part and writes its number and name; Q hides the names and click reveals one. The build asserts every truth row has a drawn region and a pin (checkTruth). The cut face was captured at 4x and every borders entry read as a shared edge beside the source's figure; every key name matches the source verbatim; the source was read a second time. node build.mjs --audit ends audit passed with 0 on every line, scripts/lines.mjs prints line ends: 0 on both themes, and 4x close-ups of every pin, border, layer band and cord end were taken and read.",
      "files": []
    },
    {
      "id": 2,
      "prompt": "Make me a figure of a pyramidal neuron with the three glial cell types around it, with every part labelled so I can test myself: soma, dendrites, axon hillock, axon, myelin sheath, nodes of Ranvier, axon terminals, astrocyte, oligodendrocyte, microglia. Dark theme, standalone HTML.",
      "expected_output": "A Figure (the response says so and estimates 30-90 minutes): a dark standalone page of a neuron on a stand with a truth.mjs listing the ten parts the user named verbatim, SOURCE.convention set to the user's list, and sources fetched only for borders and connections. The soma is a sphere or lathe, dendrites are routes that leave it tangent and branch at ball tees, the axon hillock tapers, the axon is one route with myelin collars gapping it and bare nodes between, terminals end on balls, and each glial cell is its own body whose processes end on something (the neuron, a collar, a capillary). One pin per part, a generated key, quiz mode working (Q hides names, click reveals). checkTruth passes, --audit ends audit passed, line ends: 0, 4x close-ups of every end and collar in both themes were read.",
      "files": []
    },
    {
      "id": 3,
      "prompt": "For our teaching site, build the basal ganglia direct and indirect pathways on a coronal model: striatum, globus pallidus externa and interna, subthalamic nucleus, substantia nigra pars compacta and reticulata, and the thalamus. Show the signal running each pathway. A React component we can drop into our Next.js app, plus an HTML preview, dark theme.",
      "expected_output": "A Hero (the response says so and gives the estimate). A truth.mjs with one row per nucleus and one PATHS row per link of the direct and indirect pathways in circuit order, each with its source URL. Geometry in plain modules, the static art in a server component with draw.tsx, one client component for the lift, the pulse and quiz mode, and a standalone dark HTML preview. Each nucleus is its own solid in a cutaway block, pins on every nucleus, the key generated from PARTS, the pulse runs the direct pathway then the indirect, naming each link in the readout. checkTruth passes, the preview's build reports audit passed and line ends: 0, 4x close-ups of every cord end and nucleus border were read, and the adjacency on the cut face was checked against the source's figure.",
      "files": []
    },
    {
      "id": 4,
      "prompt": "Spinal cord cross-section with the stretch reflex arc. Use exactly these labels from my lecture, nothing else: dorsal horn, ventral horn, lateral horn, dorsal root, dorsal root ganglion, ventral root, dorsal column, lateral column, ventral column, central canal, grey commissure, muscle spindle, Ia afferent, alpha motor neuron. Light theme, one file.",
      "expected_output": "A Hero. truth.mjs has exactly the fourteen names the user gave, in the user's order and spelling, SOURCE.convention records that they came from the user's lecture, and the caption says names follow it. Wikipedia was fetched only to fill borders (horns, columns, commissure and canal on the cut face) and the reflex arc's PATHS (spindle to Ia afferent to alpha motor neuron to muscle). The cord is a block with the transverse cut face toward the viewer, grey matter a tone darker than white, each horn and column its own solid, the roots and the arc as cords ending on synapse dots, one pin per label. The pulse runs the arc. checkTruth passes, audit passed, line ends: 0, 4x adjacency check done.",
      "files": []
    },
    {
      "id": 5,
      "prompt": "Show me the whole human brain in mid-sagittal section with everything labelled, for revision.",
      "expected_output": "The response sizes the request as an Epic before any work, gives the estimate (6 hours or more), proposes a Hero that keeps the core (for example the brainstem and diencephalon in mid-sagittal section: midbrain, pons, medulla, thalamus, hypothalamus, pituitary, pineal, corpus callosum's splenium, cerebellum as one body) with its own estimate, lists what the full version would add (every gyrus and sulcus of the medial surface, the ventricles, the meninges), and does not start building until the user chooses. If the user picks the Hero, it is built with the truth table, pins, key and anatomy check like every figure.",
      "files": []
    }
  ]
}
```

- [ ] **Step 2: Verify it parses**

Run: `node -e "const e = require('./evals/evals.json'); console.log(e.evals.length, e.evals.every(x => x.prompt && x.expected_output))"`
Expected: `5 true`

- [ ] **Step 3: Commit**

```bash
rtk git add evals/evals.json && rtk git commit -q -m "$(printf 'Evals: five anatomy prompts\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 9: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the title block's tagline (lines 1–3)**

```html
<h1 align="center">Anatomy</h1>

<p align="center"><b>A Claude skill that teaches a biological structure by building it as a labelled teaching model.</b><br>Crafted, interactive isometric figures with numbered pins, a key, and every name checked against a cited source. In SVG, with WebGL and 3D from the same kit.</p>
```

- [ ] **Step 2: Replace the hero image caption and the paragraph after the rule**

Replace the `<p align="center"><sub><code>examples/raptor-engine</code>, light theme, firing...` line with:

```html
<p align="center"><sub><code>examples/raptor-engine</code>, light theme, one of the machine examples that are the kit's technique references. The hippocampus example's screenshot replaces this once it is captured.</sub></p>
```

Replace the paragraph beginning `Ask Claude for a figure that explains a technical idea` and the one after it (`Then Claude builds that thing...`) with:

```markdown
Ask Claude to show you a structure, and Anatomy fetches a cited source, writes a truth table of every named part, its borders and its connections, and builds the structure as a teaching model on a stand: a cast with one face cut to the textbook's section, every named part its own solid with a numbered pin, a key under the card, and the pathways as cords that pulse in circuit order. Hover a pin and the part lifts and names itself. Press Q and the names hide, so you can test yourself.

Then Claude checks its own work: the build fails if the key and the truth table disagree, the cut face is read at 4× beside the source's figure, every name is matched to the source verbatim, and the geometry audit proves nothing passes through anything.
```

- [ ] **Step 3: Replace the quick-start prompt and the usage section's prompts**

Quick start: replace `/anatomy explain how a token bucket rate limiter works, interactive` (both occurrences) with `/anatomy show me the hippocampus in coronal section with every structure labelled`.

In **Usage**, replace the four `<details>` prompts with:

```text
/anatomy a pyramidal neuron with the three glial cell types around it, every part labelled so I can test myself. Dark theme, one HTML file.
```

```text
/anatomy the basal ganglia direct and indirect pathways on a coronal model, with the signal running each pathway. A React component plus an HTML preview, dark.
```

```text
/anatomy spinal cord cross-section with the stretch reflex arc. Use exactly these labels from my lecture: dorsal horn, ventral horn, dorsal root, dorsal root ganglion, ventral root, muscle spindle, Ia afferent, alpha motor neuron. Light, one file.
```

```text
/anatomy the cerebellar cortex in sagittal section: molecular, Purkinje and granular layers, with a Purkinje cell drawn across them. Just the SVG file and a PNG preview.
```

Replace the three habits with:

```markdown
1. **Name the structure and the cut.** Say which structure and which section (coronal, sagittal, transverse). Anatomy fetches the source and writes the truth table; that is most of the work.
2. **Paste your label list.** If your course names things a certain way, paste the labels from your lecture or textbook figure. They are used verbatim, in your order, and the caption says so.
3. **Say where it will live.** A standalone HTML page, a lone SVG file, or a React/Next.js component; light or dark.
```

- [ ] **Step 4: Add the hippocampus to the examples table, first row**

```markdown
| [`hippocampus`](examples/hippocampus) | The hippocampal formation in coronal section as a teaching model: regions as prisms, layers as bands on the cut face, a pin on every part, a key generated from `truth.mjs`, the trisynaptic circuit's cords pulsing in order, hover lift and quiz mode. The reference for every biological figure. | `node examples/hippocampus/build.mjs` |
```

And add `node examples/hippocampus/build.mjs --audit` to the sentence listing the audit-capable examples.

- [ ] **Step 5: Replace the Limits list**

```markdown
- **It draws teaching models, not histology.** A cast with a cut face, pins and a key. Not a stained section, not a photograph, not a chart.
- **Accuracy is as good as the cited source.** Every name and border comes from the fetched source or your pasted list, and the build checks the key against it, but the source can differ from your course. Check the key against your own notes before an exam.
- **It is slow on purpose.** A figure takes a long session: the fetch, the truth table, the parts list, the geometry, the audit, and close-ups of every pin and border in both themes.
- **Shaders need WebGL.** Without it the SVG still reads, and under reduced motion every figure goes still.
```

- [ ] **Step 6: Add the credit line above the License heading**

```markdown
## Credit

This is a fork of [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), which draws technical ideas as invented machines. The kit, the craft rules, the audit and the machine examples are its work. This fork turns the skill toward biological anatomy.
```

- [ ] **Step 7: Verify**

Run: `grep -c "hippocampus" README.md`
Expected: at least `6`

- [ ] **Step 8: Commit**

```bash
rtk git add README.md && rtk git commit -q -m "$(printf 'README: the skill now teaches biological structures\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 10: CHANGELOG and CI

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add to the Unreleased section of CHANGELOG.md, at the top of its Added list**

```markdown
- The skill now draws biological structures as labelled teaching models, neuroanatomy first. `SKILL.md` is rewritten around a truth table (`truth.mjs`: parts, layers, borders, pathways, one source URL per row, fetched without API keys) that the build asserts the key against; every named part is its own solid with a numbered pin; the key is generated; a pulse runs the pathways; Q hides the names for revision. `references/neuro.md` holds the sources, the schema, the neuro parts vocabulary with kit recipes, the scope of introductory neuroanatomy and the anatomy check.
- `examples/hippocampus/`, the hippocampal formation in coronal section: the reference for every biological figure. It draws in both themes, passes `--audit`, and its build fails when the truth table and the drawing disagree.
- The five evals are now anatomy prompts: the hippocampus, a neuron with its glia, the basal ganglia pathways, a spinal cord with a pasted label list, and a mid-sagittal brain that must be sized down before building.
```

And under the Unreleased **Changed** list:

```markdown
- `README.md` describes the skill's new purpose and credits the upstream repository.
```

- [ ] **Step 2: Add the CI step after "Dial indicator"**

```yaml
      - name: Hippocampus
        run: |
          node examples/hippocampus/build.mjs
          node examples/hippocampus/build.mjs --light
          node examples/hippocampus/check.mjs
```

- [ ] **Step 3: Verify the YAML is well formed and the other examples are byte-identical**

Run:
```bash
node -e "require('fs').readFileSync('.github/workflows/ci.yml','utf8').split('\n').forEach((l,i)=>{if(/\t/.test(l))throw new Error('tab on line '+(i+1))});console.log('ci.yml ok')"
for e in dial-indicator desk-computer arcade-cabinet ripple-tank; do node examples/$e/build.mjs && node examples/$e/build.mjs --light; done; rtk git status --short examples/
```
Expected: `ci.yml ok`, and `git status` shows no modified files under `examples/` other than none (the hippocampus is already committed).

- [ ] **Step 4: Commit**

```bash
rtk git add CHANGELOG.md .github/workflows/ci.yml && rtk git commit -q -m "$(printf 'CHANGELOG and CI for the biology skill\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

### Task 11: Revise the skill text from what the build taught

**Files:**
- Modify: `SKILL.md`, `references/neuro.md`

- [ ] **Step 1: List what the hippocampus build needed that the text did not say**

Reread `examples/hippocampus/build.mjs` and `section.mjs` against `SKILL.md` steps 2–10 and `neuro.md` section 4. Write down every recipe, helper, state list, CSS line or check the build needed that the text does not give, and every sentence of the text the build contradicted.

- [ ] **Step 2: Fold each item into the text**

Update the recipe in `neuro.md` section 4 or the step in `SKILL.md` so the next figure does not rediscover it. Update the hippocampus line in `SKILL.md`'s examples list with the real part count and the camera used.

- [ ] **Step 3: Verify the success criteria of the spec, section 13**

Run:
```bash
node examples/hippocampus/build.mjs --audit | tail -3
node scripts/lines.mjs examples/hippocampus/hippocampus.html | tail -1
grep -c "Invent the object\|invent a physical thing" SKILL.md
```
Expected: `audit passed`; `line ends: 0`; `0`.

- [ ] **Step 4: Commit**

```bash
rtk git add SKILL.md references/neuro.md && rtk git commit -q -m "$(printf 'Revise the skill text from the hippocampus build\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')"
```

---

## Self-review

**Spec coverage.** Section 2 (figure, pins, live, quiz, themes): Tasks 3, 4, 7. Section 3 (truth table, fetching, user list): Tasks 3, 5, 6. Section 4 (anatomy check): Tasks 3, 5, 6, 7. Section 5 (sizing): Task 3. Section 6 (SKILL.md): Tasks 1–4. Section 7 (neuro.md): Task 5. Section 8 (example): Tasks 6, 7. Section 9 (evals): Task 8. Section 10 (README, CHANGELOG, CI): Tasks 9, 10. Section 11 (expansion): Task 4 step 3. Section 13 (success criteria): Tasks 7, 10, 11. Section 14 (order): the task order.

**Placeholders.** The hippocampus geometry in Task 7 is not given as code: the task is the skill's own workflow and the decisions that bound it are fixed. Every other code step is complete.

**Names.** `checkTruth`, `drawn.regions`, `drawn.pins`, `REGIONS`, `LAYERS`, `CORDS`, `REGION_IDS`, `SPRING`, `hp-n`, `hp-name`, `hp-quiz`, `data-quiz`, `data-part`, `data-pin`, `data-route`, `data-chunk` are used with the same spelling in Tasks 5, 6, 7 and 8.
