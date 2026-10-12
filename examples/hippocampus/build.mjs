import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { checkTruth } from "./check.mjs";
import { PARTS, PATHS, SOURCE } from "./truth.mjs";
import { CORDS, LAYERS, LAYER_LINES, PIECES, PINS, REGIONS, STEM_PINS } from "./section.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const W = 600;
const H = 480;

const PLATE = { x: -52, y: -66, w: 104, d: 132, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const RIB_H = 4;
const DEPTH = 60;
const X0 = DEPTH / 2;
const LIFT = 6;
const MOVE = [LIFT, 0, 0];
const SPRING = { stagger: 0, stiffness: 64, damping: 14.2, substeps: 4 };
const CORD_R = 0.4;
const PROUD = CORD_R + 0.2;
const PIN_R = 1.6;
const PIN_H = 1.2;

const REGION_IDS = PARTS.filter((part) => !part.layerOf).map((part) => part.id);
const TONES = {
  dg: "mid",
  "dg-molecular": "lo",
  "dg-granule": "mid",
  hilus: "lo",
  ca3: "mid",
  ca2: "lo",
  ca1: "mid",
  "ca1-oriens": "mid",
  "ca1-pyramidale": "lo",
  "ca1-radiatum": "mid",
  "ca1-lacunosum-moleculare": "lo",
  subiculum: "lo",
  presubiculum: "mid",
  parasubiculum: "lo",
  ec: "mid",
  alveus: "hi",
  fimbria: "hi",
};

const sectionPoints = Object.values(REGIONS).flat();
const uMin = Math.min(...sectionPoints.map(([u]) => u));
const uMax = Math.max(...sectionPoints.map(([u]) => u));
const vMin = Math.min(...sectionPoints.map(([, v]) => v));
const vMax = Math.max(...sectionPoints.map(([, v]) => v));
const Z0 = RIB_H - vMin;
const face = ([u, v], s = 0) => [X0 - s, -u, Z0 + v];
const F = G.frameOf([X0, 0, Z0], [-1, 0, 0], [0, -1, 0], [0, 0, 1]);
const stemAt = (id) => [X0 - STEM_PINS[id], -PINS[id][0], Z0 + PINS[id][1]];

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    face([uMin, vMax]),
    face([uMax, vMax]),
    face([uMin, vMin]),
    face([uMax, vMin]),
    face([uMin, vMax], DEPTH),
    face([uMax, vMax], DEPTH),
    ...Object.keys(STEM_PINS).map((id) => G.add3(stemAt(id), [0, 0, 6])),
  ],
  W,
  H,
  { pad: 30, azimuth: 35, elevation: 30 },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const flat = (points, s = 0, closed = false) => k.pathOf(points.map((p) => at(face(p, s))), closed);

const signed = (poly) => poly.reduce((a, [x, y], i) => {
  const [x2, y2] = poly[(i + 1) % poly.length];
  return a + x * y2 - x2 * y;
}, 0);
const screenOriented = (pts) => (signed(pts) < 0 ? [...pts].reverse() : pts);
function prismPaths(F, poly, s0, s1, isSeam = () => false, silhouetteAt = () => false) {
  const ring = signed(poly) > 0 ? poly : [...poly].reverse();
  const n = ring.length;
  const W3 = (s, [x, y]) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];
  const capNear = G.dot3(F.a, V) > 0;
  const [nearS, farS] = capNear ? [s1, s0] : [s0, s1];
  const near = ring.map((p) => at(W3(nearS, p)));
  const far = ring.map((p) => at(W3(farS, p)));
  const normals = ring.map(([x0, y0], i) => {
    const [x1, y1] = ring[(i + 1) % n];
    return G.unit3(G.add3(G.mul3(F.u, y1 - y0), G.mul3(F.v, -(x1 - x0))));
  });
  const seam = ring.map((p, i) => isSeam(p, ring[(i + 1) % n]));
  const facing = normals.map((m, i) => !seam[i] && G.dot3(m, V) > 1e-9);
  const outline = [];
  const crease = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (seam[i]) {
      for (const v of [i, j]) if (silhouetteAt(ring[v])) outline.push(k.pathOf([near[v], far[v]]));
      continue;
    }
    if (facing[i]) {
      crease.push(k.pathOf([near[i], near[j]]));
      outline.push(k.pathOf([far[i], far[j]]));
    } else outline.push(k.pathOf([near[i], near[j]]));
    const prev = (i + n - 1) % n;
    if (!seam[prev] && facing[prev] !== facing[i]) outline.push(k.pathOf([near[i], far[i]]));
  }
  const parts = [k.pathOf(screenOriented(near), true), k.pathOf(screenOriented(far), true)];
  const buckets = [[], [], [], [], []];
  for (let i = 0; i < n; i++) {
    if (!facing[i]) continue;
    const quad = screenOriented([near[i], near[(i + 1) % n], far[(i + 1) % n], far[i]]);
    parts.push(k.pathOf(quad, true));
    buckets[G.toneOf(normals[i], P)].push(k.pathOf(quad, true));
  }
  const capTone = G.toneOf(capNear ? F.a : G.mul3(F.a, -1), P);
  buckets[capTone].push(k.pathOf(screenOriented(near), true));
  return { fill: parts.join(""), outline: outline.join(""), crease: crease.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((b) => b.join("")) };
}

const R = A.recorder(P, { order: REGION_IDS, spring: SPRING });
const drawn = { regions: new Set(), pins: new Set() };
function put(name, ref, svg, shapes, { piece = "", bias = 0, ...rest } = {}) {
  return R.put({ name, at: ref, bias, svg, shapes, piece, move: piece ? MOVE : [0, 0, 0], ...rest });
}

const back = [];
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  R.solid(A.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, { name: "stand.flange" }));
  R.solid(A.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, { name: "stand.foot" }));
}
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
R.solid(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate" }, 8));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
const plateScrews = k.corners(PLATE, 10);
back.push(Ln(plateScrews.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
back.push(Dots(plateScrews.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
const STRIP = { x: PLATE.x + 10, y: PLATE.y + PLATE.d - 12, w: PLATE.w - 20, d: 6, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
R.solid(A.slab(STRIP, 0, 0.6, { name: "stand.strip" }, 3));
const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y, 0.6, [1.6, 3], P);
back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
back.push(Dots([at([STRIP.x + 2, STRIP.y + 3, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3, 0.6])], { size: 0.45 }));
const LABEL = { x: X0 + 9.5, y: -42, w: 10, d: 84, r: 1.2 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
R.solid(A.slab(LABEL, 0, 0.8, { name: "stand.label" }, 3));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 6.4, LABEL.y + LABEL.d - 6], 0.8, P, "y"), "Hippocampal formation · coronal", { size: 3.4, tone: "lo" }));
back.push(Dots([at([LABEL.x + LABEL.w / 2, LABEL.y + 2.4, 0.8]), at([LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d - 2.4, 0.8])], { size: 0.45 }));
for (const y of [-3, 39]) {
  const rib = { x: -X0 - 4, y, w: DEPTH + 8, d: 6, r: 1 };
  back.push(S(k.slabOf(rib, 0, RIB_H, P, 3, 0.4), { tone: "mid" }));
  R.solid(A.slab(rib, 0, RIB_H, { name: "stand.rib" }, 3));
  back.push(Dots([at([rib.x + 2.2, y + 3, RIB_H]), at([rib.x + rib.w - 2.2, y + 3, RIB_H])], { size: 0.45 }));
}

const PIECES_OF = Object.fromEntries(REGION_IDS.map((id) => [id, PIECES[id] ?? [REGIONS[id]]]));
const prisms = Object.fromEntries(REGION_IDS.map((id) => [id, PIECES_OF[id].map((poly) => R.solid(A.prism(F, poly, 0, DEPTH, { name: id })))]));
const edgeKey = (a, b) => `${a[0]},${a[1]}|${b[0]},${b[1]}`;
const seamOf = (id, index) => {
  const others = new Set(PIECES_OF[id].flatMap((poly, j) => (j === index ? [] : poly.map((p, i) => edgeKey(p, poly[(i + 1) % poly.length])))));
  return (a, b) => others.has(edgeKey(a, b)) || others.has(edgeKey(b, a));
};
for (const id in PIECES) {
  PIECES_OF[id].forEach((poly, index) => {
    if (!poly.some((p, j) => seamOf(id, index)(p, poly[(j + 1) % poly.length]))) throw new Error(`${id}: piece ${index} shares no edge with its siblings`);
  });
}
const centroid = (poly) => poly.reduce((sum, [u, v]) => [sum[0] + u / poly.length, sum[1] + v / poly.length], [0, 0]);
const silhouettesOf = (poly) => {
  const ring = signed(poly) > 0 ? poly : [...poly].reverse();
  const facing = ring.map(([x0, y0], i) => {
    const [x1, y1] = ring[(i + 1) % ring.length];
    return G.dot3(G.unit3(G.add3(G.mul3(F.u, y1 - y0), G.mul3(F.v, -(x1 - x0)))), V) > 1e-9;
  });
  const keys = new Set(ring.filter((_, i) => facing[(i + ring.length - 1) % ring.length] !== facing[i]).map((p) => edgeKey(p, p)));
  return (p) => keys.has(edgeKey(p, p));
};
const inside = (poly, [u, v]) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x0, y0] = poly[j];
    const [x1, y1] = poly[i];
    if (y0 > v !== y1 > v && u < x0 + ((v - y0) * (x1 - x0)) / (y1 - y0)) hit = !hit;
  }
  return hit;
};
const planar = ([, y, z]) => [-y, z - Z0];
const regionAt = (p) => REGION_IDS.find((id) => inside(REGIONS[id], planar(p))) ?? "";

function discPin(part) {
  const p = PINS[part.id];
  const Fn = G.frameOf(face(p), [1, 0, 0], [0, -1, 0], [0, 0, 1]);
  const shape = R.solid(A.disc(Fn, 0, PIN_H, PIN_R, { name: `pin.${part.id}` }));
  const number = k.faceTextSvg(k.sideMatrix([X0 + PIN_H + 0.05, -p[0]], Z0 + p[1] - 0.78, P, "right"), String(part.n), { size: 2.2, tone: "hi", anchor: "middle" });
  put(`pin.${part.id}`, face(p, -PIN_H / 2), `<g data-pin="${part.id}">${S(G.disc(0, PIN_H, PIN_R, Fn, P), { tone: "hi" })}${number}</g>`, [shape], { piece: part.layerOf ?? part.id });
}
function stemPin(part) {
  const [cx, cy, z] = stemAt(part.id);
  const shapes = [R.solid(A.cylinder(cx, cy, 0.35, z, 4, { name: `pin.${part.id}.stem` })), R.solid(A.cylinder(cx, cy, 1.4, z + 4, 0.8, { name: `pin.${part.id}` }))];
  const number = k.faceTextSvg(k.topMatrix([cx + 0.7, cy], z + 4.8, P, "y"), String(part.n), { size: 1.9, tone: "hi", anchor: "middle" });
  put(`pin.${part.id}`, [cx, cy, z + 2.4], `<g data-pin="${part.id}">${S(k.cylinder(cx, cy, 0.35, z, 4, P, 12), { tone: "hi", crease: "none" })}${S(k.cylinder(cx, cy, 1.4, z + 4, 0.8, P, 16), { tone: "hi" })}${number}</g>`, shapes, { piece: part.id });
}
function pin(part) {
  if (part.id in STEM_PINS) stemPin(part);
  else discPin(part);
  drawn.pins.add(part.id);
}

function groove(region, run) {
  const flatRun = run.map(planar);
  const tip = flatRun[0];
  const edge = flatRun[flatRun.length - 1];
  const d = [edge[0] - tip[0], edge[1] - tip[1]];
  const length = Math.hypot(d[0], d[1]);
  if (length < 0.5) return null;
  const u = [d[0] / length, d[1] / length];
  const n = [-u[1], u[0]];
  const g = CORD_R + 0.35;
  const side = (p, sign) => [p[0] + n[0] * g * sign, p[1] + n[1] * g * sign];
  const cap = Array.from({ length: 7 }, (_, i) => {
    const a = (Math.PI / 2) * (1 - i / 3);
    return [tip[0] + (n[0] * Math.cos(a) - u[0] * Math.sin(a)) * g, tip[1] + (n[1] * Math.cos(a) - u[1] * Math.sin(a)) * g];
  });
  return { region, tip, svg: Ln(flat([side(edge, 1), ...cap, side(edge, -1)]), { tone: "faint" }) };
}
const SEAM_INSET = 0.5;
const EXTEND = 4.5;
const BOUTON_R = 0.7;
function regionRuns(route) {
  const total = G.pathLength(route);
  const regionAlong = (s) => regionAt(G.pointAlong(route, s));
  const runs = [{ from: 0, region: regionAlong(0) }];
  for (let s = 0.25; s < total; s += 0.25) {
    const region = regionAlong(s);
    if (region === runs[runs.length - 1].region) continue;
    let lo = s - 0.25;
    let hi = s;
    while (hi - lo > 0.005) {
      const mid = (lo + hi) / 2;
      if (regionAlong(mid) === runs[runs.length - 1].region) lo = mid;
      else hi = mid;
    }
    runs[runs.length - 1].to = hi;
    runs.push({ from: hi, region });
  }
  runs[runs.length - 1].to = total;
  return runs;
}
function insetSeams(route, runs) {
  runs.slice(1).forEach((run, index) => {
    const before = runs[index];
    const [u, v] = planar(G.pointAlong(route, run.from));
    const downRight = [u + 0.6, v - 0.6];
    const nextIsInFront = run.region ? !inside(REGIONS[run.region], downRight) : inside(REGIONS[before.region], downRight);
    const shift = nextIsInFront ? SEAM_INSET : -SEAM_INSET;
    before.to += shift;
    run.from += shift;
  });
}
function extendRides(runs) {
  runs.forEach((run, index) => {
    if (run.region) return;
    const give = Math.min(EXTEND, (run.to - run.from) / 2);
    if (index > 0 && runs[index - 1].region) {
      runs[index - 1].to += give;
      run.from += give;
    }
    if (index < runs.length - 1 && runs[index + 1].region) {
      runs[index + 1].from -= give;
      run.to -= give;
    }
  });
}
function cord(path) {
  const pts = CORDS[path.id];
  const first = pts[0];
  const last = pts[pts.length - 1];
  const route = G.fillet([face(first), ...pts.map((p) => face(p, -PROUD)), face(last)], 3, 10, { P, tube: CORD_R });
  const runs = regionRuns(route);
  const head = runs[0];
  const tail = runs[runs.length - 1];
  const grooves = [head.region && groove(head.region, G.cut(route, head.from, head.to)), tail.region && groove(tail.region, G.cut(route, tail.from, tail.to).reverse())].filter(Boolean);
  insetSeams(route, runs);
  extendRides(runs);
  const boutons = [0, runs.length - 1].map((index) => `${path.id}.end${index}`);
  runs.forEach((run, index) => {
    const points = G.cut(route, run.from, run.to);
    const touch = REGION_IDS.filter((id) => id === run.region || points.some((p) => prisms[id].some((shape) => A.sdf(shape, p) <= CORD_R + 0.6)));
    if (index === 0) touch.push(boutons[0]);
    if (index === runs.length - 1) touch.push(boutons[1]);
    R.route(path.id, points, CORD_R, { owner: path.id, bundle: path.id, piece: run.region, move: run.region ? MOVE : [0, 0, 0], limp: true, touch, ends: [index === 0, index === runs.length - 1] });
  });
  const rideOf = (s) => runs.find((run) => s >= run.from && s <= run.to)?.region ?? "";
  tubePieces(route, CORD_R, P, { maxLength: 5, spacing: 0.6, breaks: runs.slice(1).map((run) => run.from) }).forEach((piece, index) =>
    put(`${path.id}:${index}`, piece.mid, tubeSvg(piece, { tone: "mid" }), [A.tube(piece.points, piece.radii)], { piece: rideOf((piece.from + piece.to) / 2), route: path.id, chunk: index, attrs: ` data-route="${path.id}" data-chunk="${index}"` }),
  );
  [first, last].forEach((tip, index) => {
    const centre = face(tip, -(BOUTON_R - 0.1));
    const region = regionAt(face(tip));
    put(boutons[index], centre, Dots([at(centre)], { size: BOUTON_R * KS, tone: "hi" }), [R.solid(A.ball(centre, BOUTON_R, { name: boutons[index], owner: region }))], { piece: region });
  });
  return grooves;
}

const spokeMidpoint = (poly) => {
  const k = Math.floor(poly.length / 4);
  const [a, b] = [poly[k], poly[poly.length - 1 - k]];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
};
function layersOf(id, pieceIndex, piece) {
  const out = [];
  for (const part of PARTS) {
    if (part.layerOf !== id) continue;
    const poly = LAYERS[part.id][pieceIndex];
    if (!poly) continue;
    if (!inside(piece, spokeMidpoint(poly))) throw new Error(`${part.id}: band piece ${pieceIndex} lies outside ${id} piece ${pieceIndex}`);
    out.push(`<path class="hp-band" data-tone="${TONES[part.id]}" data-fill="${part.id}" d="${flat(poly, 0, true)}"/>`);
    const line = LAYER_LINES[part.id][pieceIndex];
    if (line) out.push(Ln(flat(line), { tone: "faint" }));
    drawn.regions.add(part.id);
  }
  return out.join("");
}
function region(id, grooves) {
  PIECES_OF[id].forEach((poly, index) => {
    const cap = `<path class="hp-cap" data-tone="${TONES[id]}" data-fill="${id}" d="${flat(poly, 0, true)}"/>`;
    const inPiece = grooves.filter((g) => inside(poly, g.tip)).map((g) => g.svg);
    put(id, face(centroid(poly), DEPTH / 2), S(prismPaths(F, poly, 0, DEPTH, seamOf(id, index), silhouettesOf(REGIONS[id])), { tone: "hi" }) + cap + layersOf(id, index, poly) + inPiece.join(""), [prisms[id][index]], { piece: id });
  });
  drawn.regions.add(id);
}

for (const part of PARTS) pin(part);
const GROOVES = {};
for (const path of PATHS) for (const g of cord(path)) (GROOVES[g.region] ??= []).push(g);
for (const id of REGION_IDS) region(id, GROOVES[id] ?? []);
checkTruth(PARTS, PATHS, drawn);

const states = [0, ...REGION_IDS.flatMap((id) => [0.25, 0.5, 0.75, 1].map((s) => ({ label: `${id}@${s}`, shares: Object.fromEntries(REGION_IDS.map((other) => [other, other === id ? s : 0])) })))];
A.settle(R, P, { states });
R.items.sort((a, b) => a.key - b.key);
const lift = G.dot3(MOVE, V);
const f2 = (v) => Math.round(v * 100) / 100;
const cast = R.items.map((item) => `<g class="it" data-name="${item.name}" data-k="${f2(item.key)}" data-m="${item.piece ? f2(lift) : 0}"${item.piece ? ` data-part="${item.piece}"` : ""}${item.attrs ?? ""}>${item.svg}</g>`);

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const LABEL_TEXT = `A teaching model of the hippocampal formation in coronal section: a matte cast lying in a cradle on a base plate, its near end cut flat to show the section with ${PARTS.length} numbered parts, each a solid of its own or a band on the cut face, and ${PATHS.length} cords for the pathways of the circuit. Hover a pin or a part to slide it forward and name it, arrow keys step through the numbers, Enter names the selected part, Q toggles quiz mode, which hides the names in the key, and Escape lets the tour resume.`;
const svg = k.figureSvg({ width: W, height: H, label: LABEL_TEXT, body: [...back, `<g class="hp-cast">${cast.join("")}</g>`] });

const CSS = `
.hp-stage{touch-action:pan-y}
.hp-stage:focus{outline:none}
.hp-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.hp-cap[data-tone="hi"],.hp-band[data-tone="hi"]{fill:var(--anatomy-top)}
.hp-cap[data-tone="mid"],.hp-band[data-tone="mid"]{fill:var(--anatomy-shade-2)}
.hp-cap[data-tone="lo"],.hp-band[data-tone="lo"]{fill:var(--anatomy-shade-0)}
.hp-cap[data-tone="lit"],.hp-band[data-tone="lit"]{fill:var(--anatomy-lit-top)}
.it[data-hot] .tb-body,.it[data-hot] .tb-shine,.it[data-hot] .tb-shade{fill:var(--anatomy-lit)}
.it[data-hot] .tb-edge{stroke:var(--anatomy-lit)}
.hp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.hp-cast [data-part],.hp-cast [data-route]{cursor:pointer}
.hp-quiz{position:absolute;left:20px;bottom:36px;margin:0;padding:3px 7px;font:10.5px/1 var(--anatomy-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);background:none;border:1px solid var(--anatomy-mid);border-radius:3px;cursor:pointer}
.hp-quiz[aria-pressed="true"]{color:var(--anatomy-text);border-color:var(--anatomy-text)}
.iso-figure[data-quiz] .hp-name{visibility:hidden}
@media (max-width:560px){.hp-quiz{bottom:54px}}
.hp-n{color:var(--anatomy-text);font-family:var(--anatomy-mono);font-weight:500}
`;

const DATA = {
  P,
  MOVE,
  SPRING,
  REGION_IDS,
  PARTS: PARTS.map(({ n, id, name, layerOf }) => ({ n, id, name, layerOf: layerOf ?? null })),
  PATHS: PATHS.map(({ id, name }) => ({ id, name })),
};
const LIVE = `
const D = ${JSON.stringify(DATA)};
const P = D.P;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const figure = document.querySelector(".iso-figure");
const readout = document.querySelector("[data-readout]");
const status = document.querySelector("[data-status]");
const button = document.querySelector(".hp-quiz");
const TOUR_START = 1400;
const TOUR_RESUME = 3600;
const PULSE_RATE = 24;
const PATH_PAUSE = 0.5;
const cast = svg.querySelector(".hp-cast");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const byId = new Map(D.PARTS.map((part) => [part.id, part]));
const byN = new Map(D.PARTS.map((part) => [part.n, part]));
const regionOf = (id) => byId.get(id).layerOf ?? id;
const items = [...cast.querySelectorAll(":scope > .it")];
const keyed = items.map((g) => ({ g, k: Number(g.dataset.k), m: Number(g.dataset.m), piece: g.dataset.part ?? "" }));
let current = keyed.map((_, index) => index);
const groups = Object.fromEntries(D.REGION_IDS.map((id) => [id, items.filter((g) => g.dataset.part === id)]));
const solids = Object.fromEntries(D.REGION_IDS.map((id) => [id, items.filter((g) => g.dataset.name === id).map((g) => g.querySelector(".iso-solid"))]));
const fills = Object.fromEntries(D.PARTS.map((part) => [part.id, [...svg.querySelectorAll('[data-fill="' + part.id + '"]')]]));
for (const list of Object.values(fills)) for (const el of list) el.dataset.tone0 = el.dataset.tone;
const routes = D.PATHS.map((path) => [...svg.querySelectorAll('[data-route="' + path.id + '"]')].sort((a, b) => a.dataset.chunk - b.dataset.chunk));
const [mx, my] = axisVector(P, D.MOVE);
const springs = Object.fromEntries(D.REGION_IDS.map((id) => [id, { x: 0, v: 0, target: 0, shown: 0 }]));
const state = { selected: null, revealed: false, quiz: false, tour: null, once: null, hot: null };
let frame = 0;
let last = 0;
let visible = false;
let idle = 0;

const say = (text) => {
  if (readout.textContent !== text) readout.textContent = text;
};
const announce = (text) => {
  if (status.textContent !== text) status.textContent = text;
};
function valueText() {
  if (!state.selected) return "";
  const part = byId.get(state.selected);
  return state.quiz && !state.revealed ? "Pin " + part.n : part.n + ", " + part.name;
}
function describe() {
  const pulse = state.once ?? state.tour;
  if (pulse && !state.selected) return say(D.PATHS[pulse.path].name);
  if (!state.selected) return say(D.PARTS.length + " parts");
  const part = byId.get(state.selected);
  say(state.quiz && !state.revealed ? String(part.n) : part.n + " · " + part.name);
}
function light(id) {
  for (const list of Object.values(fills)) for (const el of list) el.dataset.tone = el.dataset.tone0;
  for (const list of Object.values(solids)) for (const el of list) el.removeAttribute("data-lit");
  if (!id) return;
  const part = byId.get(id);
  for (const el of fills[id]) el.dataset.tone = "lit";
  if (part.layerOf) return;
  for (const el of solids[id]) el.setAttribute("data-lit", "");
  for (const other of D.PARTS) if (other.layerOf === id) for (const el of fills[other.id]) el.dataset.tone = "lit";
}
function select(id, reveal = false) {
  state.selected = id;
  state.revealed = reveal;
  const region = id ? regionOf(id) : null;
  for (const [key, s] of Object.entries(springs)) s.target = key === region ? 1 : 0;
  light(id);
  describe();
  announce(valueText());
}
function setHot(el) {
  if (state.hot === el) return;
  if (state.hot) state.hot.removeAttribute("data-hot");
  state.hot = el;
  if (el) el.setAttribute("data-hot", "");
}
function stopTour() {
  state.tour = null;
  state.once = null;
  setHot(null);
}
function resume() {
  if (still.matches) return;
  select(null);
  state.tour = { path: 0, pos: 0, wait: 0 };
  run();
}
function wake() {
  clearTimeout(idle);
  idle = setTimeout(resume, TOUR_RESUME);
}
function act(fn) {
  stopTour();
  fn();
  wake();
  run();
}
function pulseStep(dt) {
  const pulse = state.once ?? state.tour;
  if (!pulse) return false;
  const list = routes[pulse.path];
  if (pulse.wait > 0) {
    pulse.wait -= dt;
    setHot(null);
    return true;
  }
  pulse.pos += PULSE_RATE * dt;
  if (pulse.pos >= list.length) {
    setHot(null);
    if (state.once) {
      state.once = null;
      return Boolean(state.tour);
    }
    pulse.path = (pulse.path + 1) % routes.length;
    pulse.pos = 0;
    pulse.wait = PATH_PAUSE;
    return true;
  }
  setHot(list[Math.floor(pulse.pos)]);
  return true;
}
function springStep(dt, calm) {
  let moving = false;
  for (const id of D.REGION_IDS) {
    const s = springs[id];
    if (calm) {
      s.x = s.target;
      s.v = 0;
    } else {
      const h = dt / D.SPRING.substeps;
      for (let i = 0; i < D.SPRING.substeps; i++) {
        s.v += (D.SPRING.stiffness * (s.target - s.x) - D.SPRING.damping * s.v) * h;
        s.x += s.v * h;
      }
      if (Math.abs(s.target - s.x) < 5e-4 && Math.abs(s.v) < 5e-4) {
        s.x = s.target;
        s.v = 0;
      }
    }
    if (s.x !== s.shown) {
      s.shown = s.x;
      const text = s.x ? "translate(" + (mx * s.x).toFixed(2) + " " + (my * s.x).toFixed(2) + ")" : "";
      for (const g of groups[id]) text ? g.setAttribute("transform", text) : g.removeAttribute("transform");
    }
    if (s.x !== s.target || s.v !== 0) moving = true;
  }
  return moving;
}
function resort() {
  const order = keyed.map((e, index) => ({ index, key: e.k + e.m * (e.piece ? springs[e.piece].x : 0) })).sort((a, b) => a.key - b.key).map((e) => e.index);
  if (order.every((index, pos) => index === current[pos])) return;
  current = order;
  const frag = document.createDocumentFragment();
  for (const index of order) frag.appendChild(keyed[index].g);
  cast.appendChild(frag);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const moving = springStep(dt, calm);
  if (moving) resort();
  if (calm) stopTour();
  const pulsing = calm ? false : pulseStep(dt);
  describe();
  frame = visible && (moving || pulsing) ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
function setQuiz(on) {
  state.quiz = on;
  figure.toggleAttribute("data-quiz", on);
  button.setAttribute("aria-pressed", String(on));
  state.revealed = false;
  describe();
  announce(on ? "Quiz on, names hidden" : "Quiz off");
}
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);
function hoverAt(target) {
  const cordEl = target.closest("[data-route]");
  if (cordEl) {
    const path = D.PATHS.findIndex((item) => item.id === cordEl.dataset.route);
    if (state.once && state.once.path === path) return wake();
    return act(() => {
      select(null);
      state.once = { path, pos: 0, wait: 0 };
      announce(D.PATHS[path].name);
    });
  }
  const pinEl = target.closest("[data-pin]");
  const partEl = target.closest("[data-part]");
  const id = pinEl ? pinEl.dataset.pin : partEl ? partEl.dataset.part : null;
  if (!id) return;
  if (id === state.selected || (!pinEl && state.selected && regionOf(state.selected) === id)) return wake();
  act(() => select(id));
}
svg.addEventListener("pointermove", (event) => hoverAt(event.target));
svg.addEventListener("click", (event) => {
  const pinEl = event.target.closest("[data-pin]");
  const partEl = event.target.closest("[data-part]");
  const id = pinEl ? pinEl.dataset.pin : partEl ? partEl.dataset.part : null;
  if (id) act(() => select(id, true));
  stage.focus({ preventScroll: true });
});
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  const n = state.selected ? byId.get(state.selected).n : 0;
  const count = D.PARTS.length;
  let next = null;
  if (key === "ArrowRight" || key === "ArrowDown") next = (n % count) + 1;
  else if (key === "ArrowLeft" || key === "ArrowUp") next = n <= 1 ? count : n - 1;
  else if (key === "Home") next = 1;
  else if (key === "End") next = count;
  else if (key === "Enter" || key === " ") {
    if (!state.selected) return;
    act(() => select(state.selected, true));
  } else if (key === "q" || key === "Q") setQuiz(!state.quiz);
  else if (key === "Escape") act(() => select(null));
  else return;
  event.preventDefault();
  if (next !== null) act(() => select(byN.get(next).id));
});
button.addEventListener("click", () => setQuiz(!state.quiz));
stage.addEventListener("focus", () => announce(valueText()));
describe();
if (!still.matches) idle = setTimeout(resume, TOUR_START);
`;

const keyHtml = `<span class="iso-keys">${PARTS.map((p) => `<span class="iso-key" data-key="${p.id}"><b class="hp-n">${p.n}</b> <span class="hp-name">${esc(p.name)}</span></span>`).join("")}</span>`;
const caption = `${SOURCE.title}, fetched ${SOURCE.fetched}${SOURCE.convention ? ` · Names follow ${SOURCE.convention}` : ""}`;
const legend = `<figcaption class="iso-legend">${keyHtml}<span class="iso-caption">${esc(caption)}</span></figcaption>`;
const body = `<div class="iso-stage hp-stage" tabindex="0" role="group" aria-label="${esc(LABEL_TEXT)}">${svg}<span class="hp-sr" role="status" aria-live="polite" data-status></span></div><button type="button" class="hp-quiz" aria-pressed="false">Quiz</button>`;
const card = k.plateHtml({ fig: "Fig 1", title: "Hippocampal formation · coronal", hint: "Hover a pin · arrows step · Q quiz", readout: `${PARTS.length} parts`, body }).replace("</figure>", `${legend}</figure>`);

const page = k.pageHtml({ title: "Hippocampal formation", theme: THEME, body: `<style>${CSS}</style>${card}`, script: kitScript() + LIVE });
const name = THEME === "light" ? "hippocampus-light.html" : "hippocampus.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `${R.tubes.length} tube runs`, `scale ${KS.toFixed(3)}`);

A.auditOrExit(R, P, { frames: states.slice(1), apart: true });
