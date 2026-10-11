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
