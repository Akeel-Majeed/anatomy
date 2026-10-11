# Anatomy for biology: neuroanatomy teaching models

Date: 2026-10-11. Status: design, awaiting review.

## 1. Goal

Turn this fork of the Anatomy skill into a skill for learning biological anatomy. A student or researcher asks for a structure ("show me the hippocampus with every part labelled") and gets an accurate, labelled, interactive isometric figure they can open in a browser and revise from. Neuroanatomy is the first domain. The workflow is written so that organs, cells and other domains can be added later as a reference and an example each, without rewriting the skill.

Accuracy is the first requirement. A figure with one wrong label is worse than no figure.

## 2. What a request produces

**A teaching model on a stand.** The figure is a crafted model of the real structure, like the plastic teaching models in an anatomy lab: a cast of the true shape on a base with a post and a label plate, one face cut to show the section the textbooks use (coronal for the hippocampus), and each named part a separate solid. The model keeps the skill's existing look: solid parts, four-tone shading, painter's order, a framed card.

**Pins and key.** Every named part carries one small numbered pin: a thin cylinder with a head disc and the number as face text on the head. The number is text the model displays, so the skill's one-label rule does not apply to it. The key under the card lists number and name, generated from the truth table (section 3). Names never appear on leader lines or floating in the drawing.

**Live behaviour.** Hovering a part or a pin, or stepping with the arrow keys, lifts that part a little on a spring, makes it the one `lit` part, and writes its number and name in the readout, as `3 · CA1`. A layer lifts with its parent and is lit as a band. Pathways (section 3) are cords laid in shallow grooves on the cut face, each running from one named part to another and ending on a synapse dot. On the idle tour a pulse travels the pathways in the order of the `PATHS` array, which the skill writes in circuit order, and the readout names each path as the pulse runs it. The pulse is the one thing that moves; its meaning is the signal through the circuit. Hovering a cord runs its pulse.

**Quiz mode.** Pressing Q, or clicking a small toggle in the card's hint corner, hides the names in the key and leaves the numbers. Hover still lifts a part, but the readout shows only its number. Click or Enter reveals the name in the readout. Q again restores the key. The toggle state lives in one `data-quiz` attribute on the card root and page-local CSS hides the names.

**Themes and accessibility.** Light and dark, as today. Reduced motion stills the pulse and the lift. The card root is focusable, with the arrow keys and Q documented in the `aria-label`.

## 3. Truth

**The truth table.** Before the parts list, the skill writes `truth.mjs` beside the build script, a pure module like the test rig's `rig.ts`. It exports three things:

```js
export const SOURCE = {
  title: "Hippocampus - Wikipedia",
  url: "https://en.wikipedia.org/wiki/Hippocampus",
  fetched: "2026-10-11",
  convention: "",
};

export const PARTS = [
  {
    n: 1,
    id: "dg",
    name: "Dentate gyrus",
    synonyms: ["gyrus dentatus"],
    borders: ["hilus", "ca3"],
    source: "https://en.wikipedia.org/wiki/Dentate_gyrus",
  },
  {
    n: 2,
    id: "dg-granule",
    name: "Granule cell layer",
    synonyms: [],
    layerOf: "dg",
    borders: ["dg-molecular", "dg-polymorphic"],
    source: "https://en.wikipedia.org/wiki/Dentate_gyrus",
  },
];

export const PATHS = [
  { id: "perforant", name: "Perforant path", from: "ec", to: "dg", source: "https://en.wikipedia.org/wiki/Perforant_path" },
];
```

`n` is the pin number and the key order. `id` is what the geometry refers to. `borders` lists the ids this part touches on the cut face. A row with `layerOf` is a layer: it is drawn as a band on its parent's cut face, lifts with its parent, and still has its own pin and key entry. Every row has its own `source` URL. `convention` is empty unless the user supplied names from a course or textbook, in which case it names that source (for example "lecture handout, week 4"), and the caption says "Names follow <convention>".

The key is generated from `PARTS`. Each part's solid and pin are built from its row by `id`. So the key cannot drift from the table, and the table is the only place a name is typed.

**Fetching without keys.** The skill fetches with Claude Code's built-in WebFetch, which needs no API key. The build script never fetches: `truth.mjs` is a committed snapshot with its fetch date, so builds are reproducible and CI runs offline. Wikipedia is the default source: the structure's article, plus each sub-part's article where the main one lacks its borders or connections. The name is taken from the infobox's Terminologia Anatomica or NeuroNames entry, not from the prose, and the prose is read for borders and connections. NeuroNames (BrainInfo), the Allen Brain Atlas and Gray's Anatomy on Wikisource are the second sources for a border the first source leaves unclear. After the table is written, the skill reads the source a second time, row by row, and fixes any row the source does not support.

**The user's list wins.** If the user pastes a label list from their lecture, textbook or atlas, those names, that count and that order are used verbatim. Fetching then only fills borders and paths. The skill cannot fetch textbooks, so when a user names one it asks for that figure's labels pasted, rather than guessing the book's names.

## 4. The anatomy check

Runs in the verify step before the geometry checks.

1. **Build assertion.** `build.mjs` asserts that every `PARTS` row has a drawn region (a solid, or for a `layerOf` row a band on its parent's face) and a pin, every pin maps to a row, every `layerOf` and every `borders` entry is a `PARTS` id, and every `PATHS` endpoint is a `PARTS` id. One missing part fails the build with a message naming it.
2. **Adjacency at 4×.** The cut face is captured at 4× and read beside the fetched reference figure. Every `borders` entry must be a visible shared edge on the cut face, and no two parts touch that the table says do not.
3. **Names verbatim.** Every key name matches its source or the user's list exactly, including case and spelling.
4. **Second reading.** The source is read again against the finished key.

The existing geometry checks (audit to zero, line ends to zero, 4× close-ups of every junction in both themes) still run after it.

## 5. Sizing

Step 1 of the workflow keeps its three sizes with biology examples:

- **Figure** (40–80 parts, 30–90 minutes): one structure with 6–12 named parts and no cut face, such as a neuron with its glia.
- **Hero** (80–150 parts, 2–4 hours): a region with a cut face, pathways and parts that lift apart, such as the hippocampal formation, the spinal cord with a reflex arc, or the basal ganglia.
- **Epic** (6 hours or more): a whole brain, a mid-sagittal brain with everything named, or a multi-region circuit. Not started; a Hero version is proposed first.

## 6. Changes to `SKILL.md`

Edited in place. Everything not listed keeps its text.

- **Frontmatter `description`.** Rewritten: crafted, interactive isometric teaching models of biological structures, labelled and checked against a cited source. Triggers: "show me the structures of", "label the parts of", "anatomy of", a brain region, nucleus, tract, neuron or cell type, "for my exam", "revision", "teaching model", and the existing isometric and interactive-explainer phrases. Neuroanatomy is named as the proven domain.
- **Intro paragraph.** Describes the teaching model on a stand and says the kit's look is unchanged.
- **Examples list.** `examples/hippocampus/` first, described in full. Each machine example keeps one line naming the kit technique it is the reference for (the arcade cabinet for a concave prism along an axis and a pulse along a cable, the Raptor for lifting apart and the audit, the desk computer for drawing in a face plane, the ripple tank for a high camera, the turning dial for 3D).
- **"The one idea that matters"** becomes **"The model is the explanation."** Draw the real structure as a well-made teaching model; never invent a stand-in object. The table maps structure to treatment: a region is a cast with a cut face; a nucleus is a body inside a cutaway of its neighbour; a tract is a bundle of cords between two named parts; a neuron is soma, dendrites, axon with myelin collars and terminal; a circuit is pathways on a model with a pulse. Three failure modes: too abstract (coloured blobs), too mechanical (bevels and screws on tissue), and wrong (any name, border or connection the source does not support), the last being the only one that fails an exam.
- **Workflow.** Step 1 keeps its text and gains the sizing examples of section 5. Step 2 "Truth first" becomes the fetch and the truth table of section 3. Step 3 "Invent the object" becomes "Choose the presentation": which cut (the one the textbooks use), which parts lift apart, what moves and what that motion means, in one sentence. Step 4 "Parts list" groups parts as stand (base, feet, post, label plate), cast (one solid per truth row, the cut face, layers as bands), pins (one per row), pathways (one cord per path row) and controls (the quiz toggle); the 40-part minimum stays. Steps 5, 6 and 7 keep their text, with one sentence added to step 6: each named part is its own solid, so it can lift apart and the audit can order it. Step 8 "Frame it": the title is the structure and the cut, the key comes from `PARTS`, the readout names the hovered part, the caption cites `SOURCE` and the convention. Step 9 "Make it live": the hover lift, arrow-key stepping, the pathway pulse and quiz mode of section 2. Step 10 "Verify like a critic" gains the anatomy check of section 4 as its first item.
- **Craft rules.** Two added. **Tissue, not machinery:** regions are smooth bodies with no bevels, screws or knurls, drawn as tone bands with hairline borders, grey matter darker than white matter, and the hovered part the one `lit`; only the stand keeps the machined vocabulary. **Pins and key:** one numbered pin per named part, its number is text the model displays, names live in the key and the readout, never on leader lines. The "Lines resolve" rule is reworded so a pin's number is allowed and a pin always stands on its part.
- **References list.** `references/neuro.md` added with one line, and a sentence that a later domain gets its own reference beside it.

The WebGL and 3D sections stay as they are: they are kit features a future figure may use.

## 7. `references/neuro.md`, new

1. **The look.** What a lab teaching model looks like: matte cast, a cut face with the section drawn on it, numbered pins, a base and post, a key card. Which figures to open for which technique.
2. **Sources without keys.** Wikipedia and how to read its infobox for the canonical name; NeuroNames, the Allen Brain Atlas and Gray's on Wikisource as second sources; what to take from a source (names, borders, connections) and what not to (approximations in prose).
3. **The truth table.** The schema of section 3, the pasted-list override, the convention field, and the assertion recipe for `build.mjs`.
4. **Parts vocabulary with kit recipes.** The stand and label plate (reusing `craft.md`); the cast as a prism along the long axis following the arcade cabinet's concave wall; the cut face with layers drawn in the face plane with `sideMatrix`; a region as its own solid; a nucleus as a dome or sphere inside a cutaway; a tract as a bundle from `tube.mjs`; a neuron as a sphere soma, tube dendrites and an axon tube with myelin collars gapping it; a pin as a thin cylinder, a head disc and `faceTextSvg`; a pathway groove and its pulse following the arcade cabinet's cable pulse; the quiz toggle.
5. **Tones for tissue.** Grey and white matter, layers as bands, one `lit` part, no accent colour unless colour is the subject.
6. **Scope of introductory neuroanatomy.** A list of the structures introductory courses examine, as a vocabulary checklist: divisions of the nervous system, lobes, ventricles, meninges, limbic system, basal ganglia, thalamus and hypothalamus, brainstem, cerebellum, spinal cord, cranial nerves, neuron and glia types, the synapse, the retina, the cochlea, the reflex arc. Scope only, no nomenclature.
7. **The anatomy check and anti-patterns.** Section 4 in full, then: coloured blobs, machined tissue, a wrong label, a pin in the air, a cord that lands on nothing, a key that was typed rather than generated.

## 8. `examples/hippocampus/`, new

The proof of the skill. A Hero.

- **Presentation.** The block lies on the stand with its long axis running away from the viewer. The coronal cut face is vertical and toward the camera at azimuth 35° and elevation 30°, so the section reads at about 0.8 scale both ways. Each region is its own prism along the axis, so the cut face is tiled by region end faces and each region lifts apart.
- **Expected parts**, to be confirmed by the fetch, which is the source of the truth table and not this list: dentate gyrus, hilus, CA3, CA2, CA1, subiculum, presubiculum, parasubiculum, entorhinal cortex, fimbria and alveus as regions, each its own solid; the dentate gyrus's molecular, granule and polymorphic layers and CA1's strata oriens, pyramidale, radiatum and lacunosum-moleculare as `layerOf` rows, bands on their parent's end face.
- **Expected paths:** perforant path, mossy fibres, Schaffer collaterals, CA1 to subiculum, subiculum to entorhinal cortex.
- **Files.** `truth.mjs`, `build.mjs`, `hippocampus.html`, `hippocampus-light.html`. `node build.mjs --audit` ends `audit passed`. A CI step rebuilds both pages.
- **The one runnable check beyond the audit:** removing a `PARTS` row makes the build fail and name the part.

## 9. Evals

`evals/evals.json` replaces the five machine prompts with five anatomy prompts. Each expected output names the truth table with a source per row, the build assertion, a pin on every part, adjacency read at 4×, and the existing geometry criteria.

1. The hippocampal formation in coronal section with every structure and the trisynaptic circuit labelled, one HTML file, light theme. The shipped example's own prompt.
2. A pyramidal neuron with its three glial cell types, parts labelled for self-testing, dark, standalone. A Figure; exercises quiz mode.
3. The basal ganglia direct and indirect pathways on a coronal model with the signal running each pathway, as a React component plus an HTML preview, dark. A Hero; exercises the React path.
4. A spinal cord cross-section with the stretch reflex arc, using exactly the labels pasted in the prompt. Exercises the verbatim override and the convention field.
5. The whole human brain in mid-sagittal section with everything labelled. An Epic; the expected output is the estimate, a proposed Hero (the brainstem and diencephalon) and no build until the user chooses.

## 10. README, CHANGELOG and CI

- **README.** New tagline and hero paragraph; a quick-start prompt for a structure; the three habits become name the structure, paste your label list, say the cut; the examples table with the hippocampus first; a limits entry that the figure is a teaching model, not histology, and that accuracy is as good as the cited source, so the key should be checked against the reader's own course; a credit line to the upstream repository. Install and requirements stay.
- **CHANGELOG.** An Unreleased entry describing the change of purpose, the new reference, the example and the evals.
- **CI.** One step for the hippocampus example, both themes.

## 11. Designed for expansion

`SKILL.md` speaks of "a biological structure" throughout. The truth table, teaching model, pins, key, quiz mode and anatomy check are domain-agnostic. Domain knowledge lives in `references/<domain>.md`; `neuro.md` is the first. Adding organs or cells later means one reference with its vocabulary and recipes, one example, and trigger phrases in the description. The workflow does not change.

## 12. Out of scope

- Organ, cell and molecular vocabularies.
- Fetching at build time.
- Any change to `kit/` or `scripts/`.
- WebGL and 3D in the first example.
- A numbered swatch style in the card key; the number leads the label text.
- Any course- or textbook-specific nomenclature in the skill.

## 13. Success criteria

- `node examples/hippocampus/build.mjs` and `--light` write both pages; `--audit` ends `audit passed`; `node scripts/lines.mjs` prints `line ends: 0` on both; captures were read at 1× and 4×.
- Removing a `PARTS` row fails the build with the part's name.
- CI is green with the new step and every other committed page unchanged.
- In a fresh session, eval 2 produces `truth.mjs` with a source per row, a pin on every part, a generated key and a working quiz toggle.
- `SKILL.md` contains no instruction to invent a stand-in object and no rule that forbids pin numbers.

## 14. Order of work

1. `SKILL.md` and `references/neuro.md`.
2. `examples/hippocampus/`, built through that text as a user would.
3. Revise the text from what the build taught.
4. Evals, README, CHANGELOG, CI.
