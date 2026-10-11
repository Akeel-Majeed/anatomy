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

- `examples/hippocampus/`: the reference. The formation lying in a cradle, its cut face the +x wall and its long axis along x, under `fitProjection(points, 600, 480, { pad: 30, azimuth: 35, elevation: 30 })`: 11 regions as prisms (14 after splits), 6 layers as bands on the cut face, 17 pins, 5 cords in 13 tube runs with a pulse, a generated key, each region pulled out along the face normal on hover, quiz mode. 92 items, 55 recorded solids.
- `examples/arcade-cabinet/`: a concave prism along any axis (`prismPaths`), a pulse along a cable chunk by chunk (`live.js`, `data-hot`), and a camera azimuth chosen so a cutaway's inside faces the viewer.
- `examples/raptor-engine/`: parts that lift on springs, the audit in every frame.
- `examples/desk-computer/`: drawing in a face plane with `sideMatrix`.

## 2. Sources without keys

Fetch with Claude Code's WebFetch, which needs no API key. The build script never fetches: `truth.mjs` is a committed snapshot with its fetch date, so a build is reproducible and CI runs offline.

**Wikipedia** is the default. For a structure:

1. Fetch `https://en.wikipedia.org/wiki/<Structure>`. Read the infobox first: its *Latin*, *TA98/TA2* and *NeuroNames* rows give the nomenclature; use the English name that heads the article as `name`, and keep the Latin term as a synonym.
2. Read the *Structure* or *Anatomy* section for what the structure contains, what it borders, and the section the article's figure uses.
3. For every sub-part the article names without giving its borders, fetch that sub-part's own article and repeat.
4. For pathways, read the *Connections*, *Circuitry* or *Function* section, and the pathway's own article (for example `Perforant_path`, `Schaffer_collateral`).

**Second sources**, for a border or a name the first leaves unclear:

- NeuroNames at BrainInfo: `http://braininfo.rprc.washington.edu/` (search the name; the page gives the standard name, synonyms and the hierarchy).
- The Allen Brain Atlas reference ontology: `https://atlas.brain-map.org/` and its structure pages.
- Gray's Anatomy (1918) on Wikisource: `https://en.wikisource.org/wiki/Anatomy_of_the_Human_Body`.

**What to take and what not to.** Take names from an infobox or a nomenclature source, never from a caption or running prose, where authors abbreviate ("CA1" for "field CA1 of the hippocampus" is fine only if the infobox or the user's list says so). Take borders and connections from prose that states them; a figure alone is not a source for a border. Do not take sizes or counts unless the source gives them, and then put them in the caption, not the drawing.

**The user's list wins.** When the user pastes a label list (from a lecture, a textbook figure, an atlas), use those names, that count and that order verbatim. Set `SOURCE.convention` to where they came from, in the user's words ("lecture handout, week 4"), and let the caption say "Names follow <convention>". Fetch only to fill `borders` and `PATHS`. You cannot fetch textbooks, so when a user names one, ask for the figure's labels pasted rather than guessing the book's names.

## 3. The truth table

`truth.mjs` is data only, beside the build script. This is a fragment of the hippocampus table, trimmed to two rows; the ids its `borders` and `PATHS` name are rows it leaves out:

```js
export const SOURCE = {
  title: "Hippocampus - Wikipedia",
  url: "https://en.wikipedia.org/wiki/Hippocampus",
  fetched: "2026-10-11",
  convention: "",
};

export const PARTS = [
  { n: 1, id: "dg", name: "Dentate gyrus", synonyms: ["gyrus dentatus"], borders: ["ca3"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
  { n: 2, id: "dg-granule", name: "Granule cell layer", synonyms: [], layerOf: "dg", borders: ["dg-molecular"], source: "https://en.wikipedia.org/wiki/Dentate_gyrus" },
];

export const PATHS = [
  { id: "perforant", name: "Perforant path", from: "ec", to: "dg", source: "https://en.wikipedia.org/wiki/Perforant_path" },
];
```

- `n` is the pin number and the key order, 1-based, unique.
- `id` is what the geometry refers to: lower-case, hyphens, unique.
- `borders` lists the ids this part shares an edge with on the cut face, or touches where the figure has no cut face. Symmetric: if `a` lists `b`, `b` lists `a`. A layer lists its sibling layers and any region its band faces along its length; the ends of a band on its parent's neighbours follow from the parent's `borders` and are not listed.
- `layerOf` names the region a layer is a band on. A layer has its own pin and key row, lifts with its parent, and is not its own solid.
- `PATHS` are in circuit order; the pulse runs them in array order. `from` and `to` are `PARTS` ids.
- Every row has its own `source` URL, even when it is the same as the one above. A border counts as sourced when either of its two rows' pages states it; a synonym must appear in its own row's page.

The key is generated from `PARTS` and each part's solid and pin are built from its row by `id`, so a part's name is typed in exactly one place. `examples/hippocampus/check.mjs` holds `checkTruth(PARTS, PATHS, drawn)`; copy the file beside any new build. `drawn` is `{ regions, pins }`, two `Set`s of ids, and `regions` holds every row's id, a layer's band included. It throws, naming the row, on a duplicate `n` or `id`, a `borders`, `layerOf`, `from` or `to` that is not an id, an asymmetric border, and, when `drawn` is given, a row with no drawn region or no pin and a pin with no row.

## 4. Parts vocabulary, with recipes

Import `k` from `kit/iso-kit.mjs`, `G` from `kit/lathe.mjs`, `T` from `kit/tube.mjs` and `A` from `kit/audit.mjs`, as the examples do.

### Stand, post and label plate

Reuse `craft.md` section 3 as it is: the base plate on feet with corner screws and a groove, the ruler strip, the label plate with three rule lines (`free: true`), a post with a clamp. A cast that lies flat sits in a shallow cradle: two low ribs (`k.slabOf`) under its long axis, so the audit's `supports` sees it held. A cast that stands is clamped to the post. The label plate carries the one engraved label the drawing may have: the structure's name, as `faceTextSvg` on `topMatrix`. At the hippocampus's scale the ruler's ticks are `[1.6, 3]`, not `craft.md`'s `[2, 3.6]`: a 3.6 major is 7.5 px there, past the 7 px up to which `lines.mjs` lets a tick stand on one end.

### The cast: regions as prisms along the long axis

A region of a section is a polygon in the cut face's plane, extruded along the cast's long axis. Copy `prismPaths` from `examples/hippocampus/build.mjs` together with its local helpers `signed` and `screenOriented` and the two lines it closes over, `const V = G.viewOf(P)` and `const at = (p) => k.iso(p, P)` (it draws a concave polygon as facets with its true silhouette as the outline, where `G.prismOf` would hull it, and takes `isHidden` and `flipAt` for a split edge), and record each prism with `A.prism(F, polygon, s0, s1, { name })` where `F` is `G.frameOf(origin, axis, u, v)` with `axis` along the length and `u`, `v` spanning the cut face. One prism per region row, unless the region is a C seen obliquely: where a curved region wraps another and each is in front of the other somewhere (the dentate gyrus round the hilus, CA1 and the alveus arcing over and down the right of it) there is no order, and the fix is two prisms per region, split at an angle where neither its outer nor its inner surface changes facing (`PIECES` in `section.mjs`: the dentate gyrus at 45° from its centre, CA1 and the alveus at 40°), the split edge hidden (`hiddenOf`: no quad, outline or crease), the layers and layer lines split at the same angle, and the silhouette verticals at the split vertices taken from the full polygon (`flipsOf`). Neighbouring regions share edges exactly (the same vertex list on the shared edge), which the audit accepts as flush contact. Give the back end of the cast a second cut or let it stop at the cradle; it is a block cut from the structure, as a histology block is.

A region pulled out on hover moves along the cut face's outward normal, `MOVE = [LIFT, 0, 0]` for the +x face, never up the face: a lift in z is in-plane there, CA1 rises into the alveus and the hilus into the dentate gyrus, and `solidClearances` fails every flight frame. Every item of the region carries that `move` (`put` sets it from `piece`), and `A.settle(R, P, { states })` takes states that pull one region at a time, each `{ label, shares }` with `shares` keyed by piece, at 0.25, 0.5, 0.75 and 1.

Keep the section polygons in a `section.mjs` beside the build, keyed by `PARTS` id, in face coordinates `[u, v]` (u across the face, v up), with the layers and cords in the same coordinates. That file is the anatomical drawing; the build only places it.

### The cut face: layers as bands

A `layerOf` row is a closed polygon inside its parent's polygon, drawn as a flat fill in the face plane, not extruded: map each `[u, v]` to world with the frame, project with `k.iso`, and draw with `k.pathOf(points, true)` as a `<path class="hp-band" data-tone="mid">` that page CSS fills by tone. Its border is two hairlines in the `faint` tone, the band's long edges drawn as open polylines with `lineSvg` that end on the parent's outline, so the line check sees them; a closed hairline has no ends, and the check cannot catch a band that stops short. It lifts with its parent, so put it inside the parent's `<g data-part>`. Bands run edge to edge of their parent. The cut face must be parallel to the x or y wall: `sideMatrix` lays text only on those two faces, and an oblique face has no kit text matrix. Its keyword names the wall: `"right"` is a ±x face, with the text running along −y, and `"left"` a ±y face, text along x.

### A nucleus inside a cutaway

Draw the neighbour as a prism with a notch (a concave polygon) and the nucleus as `G.sphereOf` or a lathe (`G.solidOf`) sitting in the notch, recorded with `A.ball` or `A.solid`, its rim tangent to the notch (flush contact, not sunk). The cut edge of the neighbour is the notch's outline.

### A tract or pathway: cords in a groove

A cord is a route from one named part to another: its `[u, v]` points from `section.mjs`, run `r + 0.2` proud of the face along its normal with `r ≤ 0.4` and filleted with `G.fillet`, cut into `tubePieces` chunks drawn by `tubeSvg`, as the hippocampus's `cord` does. A cord lying over a region is swept through when that region is pulled out, so it cannot be one `piece`: record one `R.route` per region it lies over, with the same `owner` and `bundle`, `piece` the region, `move` passed explicitly (the kit's default is `[0, 0, 0]`, and `looseEnds` fails a still cord under a moving region at the first state) and `ends` only on the first and last run; each chunk rides the region under its `(piece.from + piece.to) / 2`. A run reaches 4.5 units (`EXTEND`) past any edge whose side face is visible, else the pulled-out cap covers the air chunk and the audit cycles, and each break sits 0.5 toward the region that is up-left of the other. `touch` is computed, not typed: every region within `r + 0.6` of the run's samples (`A.sdf` against its prisms), plus the boutons. The last leg at each end turns into the face, which `terminals` requires (an oblique 11° entry leaves the rim 0.39 out of the face), but it cannot hairpin, which `selfOverlaps` fails, so the end is a real bouton: `A.ball` of r 0.7 centred 0.6 proud, so sunk 0.1, with `owner` the region, not the cord, else it does not count as cover, named in the end run's `touch` and drawn as a `hi` dot. Draw a groove under each end run as one faint polyline, `r + 0.35` either side of the centreline, round the tip and open on the region's border. Each chunk's group carries `data-route="<id>" data-chunk="<n>"` so the pulse can light it.

### A neuron

Soma: `G.sphereOf` or a short lathe. Dendrites: routes that leave the soma radially, rim on the sphere, branching at ball tees (`craft.md` section 8). Axon hillock: a lathe that tapers from the soma into the axon's radius. Axon: one route; myelin as collars (`G.ringBand`) that gap the route (`gaps`), with a bare node between each pair. Terminals: the route ends on small balls. Glia: an astrocyte as a soma with short radiating routes ending on the neuron and a capillary; an oligodendrocyte as a soma whose processes end on the collars; a microglial cell as a small body with fine processes. Every end sits on something; the audit's `looseEnds` fails the rest.

### A pin

Each `PARTS` row gets one pin. On a vertical cut face: a short disc along the face's normal, recorded as `A.disc(Fn, 0, 1.2, 1.6, { name: "pin.<id>" })` and drawn as `solidSvg(G.disc(0, 1.2, 1.6, Fn, P), { tone: "hi" })`, where `Fn` is a frame whose axis is the face normal at the pin's point (the arcade cabinet's leveler is the pattern), with the number as `faceTextSvg` on `sideMatrix` at the disc's face, size 2.2, `anchor: "middle"`. On a top face: a stem `k.cylinder(cx, cy, 0.35, z, 4, P, 12)` and a head `k.cylinder(cx, cy, 1.4, z + 4, 0.8, P, 16)`, the number on `topMatrix` at the head's top. The pin's `<g>` carries `data-pin="<id>"`, inside the part's `<g data-part="<id>">` so it lifts with the part. A pin stands on its part: the audit's `supports` sees the disc or the stem touching the part.

### Pathway pulse

The pulse lights one chunk of one cord at a time, in `PATHS` order, chunk order within a path: the live script keeps `routes = PATHS.map(p => [...stage.querySelectorAll(`[data-route="${p.id}"]`)].sort((a, b) => a.dataset.chunk - b.dataset.chunk))` (the settled order is depth order, not chunk order), advances a position at 24 chunks per second, sets `data-hot` on the chunk's group at the head and removes it from the previous one, Page CSS lights the group, as the arcade cabinet's does: `[data-hot] .tb-body, [data-hot] .tb-shine, [data-hot] .tb-shade { fill: var(--anatomy-lit) } [data-hot] .tb-edge { stroke: var(--anatomy-lit) }` (a tube chunk's outline is `.tb-edge`, `kit/tube.mjs`; `.iso-edge` is a solid's, and the kit's own CSS never colours a tube group by `data-tone`). The readout shows `${path.name}` while the pulse is on that path. Nothing is re-rendered: only attributes change. The idle tour runs it after 1.4 s of no interaction; hovering a cord runs that cord's pulse once. A chunk rides the region under `(piece.from + piece.to) / 2`, the span `tubePieces` gives each piece; a length accumulated across chunks drifts over their 0.5 overlaps and a chunk moves with the wrong region. Selection follows `pointermove`, not `pointerover`: a pulled-out region slides out from under a parked pointer and the browser's synthetic `pointerover` on what arrives under it re-selects, so a layer never stayed selected and the tour never resumed with the pointer on the model. `hoverAt` ignores a move over the body of the region already holding the selection, and a cord hover clears the selection so the readout shows the path.

### Quiz toggle

A `<button type="button" class="hp-quiz" aria-pressed="false">Quiz</button>` inside the card, bottom left above the hint: `bottom: 36px` (54 px under 560 px wide), since the 18 px under the hint has no room for it. Q or the button toggles `data-quiz` on the `<figure>`. Page CSS: `.iso-figure[data-quiz] .hp-name { visibility: hidden }`. In quiz mode the readout shows only `n` on hover; click or Enter writes `n · name`; leaving quiz mode writes the full readout again.

## 5. Tissue tones

Keep `craft.md` section 4's hierarchy: base and feet `lo`, the post, clamp and label plate `mid`, the cast `hi` with its regions as `mid` and `hi` bands so neighbours differ by one tone, grey matter the darker of the two and white matter the lighter. Borders between regions are `faint` hairlines, and every shared edge has one: in the dark theme one tone of difference is barely visible, and the hairlines carry the borders. At most one part is `lit`: the hovered one, or the pulse's head chunk on the idle tour; none at rest. No colour unless colour is the subject (a stain, a tracer).

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

1. **The build assertion.** `checkTruth(PARTS, PATHS, { regions, pins })` runs on every build and fails naming the part. Add an id to `regions` only where a solid or a band was actually emitted for it, never in a loop that adds every row: a band skipped by a placement test must fail here, not pass silently. Nothing else is checked until it passes.
2. **Adjacency at 4×.** `node scripts/capture.mjs page.html --out shots/face.png --zoom x,y,w,h` with the cut face's region in CSS pixels (4× is the default `--zoom-scale`; `verify.md` has the flags), then read the PNG beside the source's figure. Every `borders` entry is a visible shared edge; no two parts touch that the table says don't. With no cut face, read each `borders` entry as a visible contact at 4×.
3. **Names verbatim.** Diff the key's text against the source's names or the user's list: case, spelling, hyphens.
4. **Second reading.** Open the source again and read it row by row against the finished key. Fix the table, rebuild, repeat.

Then the audit, `A.auditOrExit(R, P, { frames: states.slice(1), apart: true })` (`apart` is a boolean in the kit, not a list of states; the flight states go in `frames`), which `node build.mjs --audit` runs to `audit passed`, the line check (`node scripts/lines.mjs page.html --out shots/lines.png` prints a `line ends: 0 of …` line), both themes, and the 4× close-ups of every pin, every border, every cord end and every layer band.

## 8. Anti-patterns

- **Coloured blobs.** A region with no border, no layer and no pin, filled with a colour. Draw its real shape and its neighbours.
- **Machined tissue.** Bevels, screws, knurls or seams on the cast. Those belong to the stand.
- **A wrong label.** A name not in the source or the user's list, or a border the source does not state. The anatomy check exists for this; run it.
- **A typed key.** Key text written by hand rather than generated from `PARTS`. It will drift.
- **A pin in the air.** A pin whose stem or disc does not touch its part, or a pin on a layer that is not inside the layer's band.
- **A cord that lands on nothing.** A path whose end is not a synapse dot on the part the row names, or that crosses another part's face instead of running along the border.
- **A floating band.** A layer that stops inside its parent instead of running border to border.
- **Names in the drawing.** Any text but pin numbers and the label plate.
