const r2 = (value) => Math.round(value * 100) / 100;
const dir = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
const polar = (c, r, deg) => {
  const [x, y] = dir(deg);
  return [r2(c[0] + r * x), r2(c[1] + r * y)];
};
const angles = (a0, a1, step = 5) => {
  const count = Math.round(Math.abs(a1 - a0) / step);
  return Array.from({ length: count + 1 }, (_, i) => a0 + (a1 - a0) * (i / count));
};
const arc = (c, r, a0, a1, step) => angles(a0, a1, step).map((a) => polar(c, r, a));
const signed = (poly) => poly.reduce((sum, [x, y], i) => {
  const [x2, y2] = poly[(i + 1) % poly.length];
  return sum + x * y2 - x2 * y;
}, 0);
const ccw = (poly) => (signed(poly) > 0 ? poly : [...poly].reverse());
const band = (c, a0, a1, rIn, rOut, step) => ccw([...arc(c, rOut, a0, a1, step), ...arc(c, rIn, a1, a0, step)]);
const bands = (c, a0, a1, split, rIn, rOut) => [band(c, a0, split, rIn, rOut), band(c, split, a1, rIn, rOut)];
const arcs = (c, r, a0, a1, split) => [arc(c, r, a0, split), arc(c, r, split, a1)];

const C = [4, 2];
const RI = 22;
const RO = 42;
const RA = 46.5;
const T = RO - RI;
const CA3 = [205, 140];
const CA2 = [140, 120];
const CA1 = [120, 0];
const SUB = [0, -40];
const ALVEUS = [205, 0];
const FIMBRIA = [200, 175];
const CA_SPLIT = 40;

const FC = [8.1, -18];
const RF = 16;
const TAIL_V = -34;
const T1 = [20.36, -28.29];
const T2 = [8.1, TAIL_V];
const TAIL_TOP = TAIL_V + T / 2;
const TAIL_BOTTOM = TAIL_V - T / 2;
const PRESUB_U = [T2[0], -12];
const PARASUB_U = [-12, -32];
const EC_U = [-32, -56];

const H = [3, 0];
const DG_IN = 8;
const DG_MID = 12;
const DG_OUT = 18;
const DG = [230, 530];
const DG_SPLIT = 405;

const offset = (p, deg, by) => {
  const [x, y] = dir(deg);
  return [r2(p[0] + x * by), r2(p[1] + y * by)];
};
const subiculum = ccw([
  ...arc(C, RO, SUB[0], SUB[1]),
  offset(T1, SUB[1], T / 2),
  ...arc(FC, RF + T / 2, -40, -90).slice(1),
  [T2[0], TAIL_BOTTOM],
  [T2[0], TAIL_TOP],
  ...arc(FC, RF - T / 2, -90, -40).slice(1),
  offset(T1, SUB[1], -T / 2),
  ...arc(C, RI, SUB[1], SUB[0]),
]);
const tailBox = ([u0, u1]) => ccw([[u0, TAIL_BOTTOM], [u1, TAIL_BOTTOM], [u1, TAIL_TOP], [u0, TAIL_TOP]]);

const ca3End = [polar(C, RI, CA3[0]), polar(C, RO, CA3[0])];
const hilus = ccw([
  ca3End[0],
  ca3End[1],
  polar(H, DG_OUT, DG[0]),
  ...arc(H, DG_IN, DG[0], DG[1]),
  polar(H, DG_OUT, DG[1]),
]);
const fimbriaBase = arc(C, RA, FIMBRIA[1], FIMBRIA[0]);
const fimbria = ccw([...fimbriaBase, [-48, -13.9], [-51, -4], [-50, 6.05]]);

export const REGIONS = {
  dg: band(H, DG[0], DG[1], DG_IN, DG_OUT),
  hilus,
  ca3: band(C, CA3[0], CA3[1], RI, RO),
  ca2: band(C, CA2[0], CA2[1], RI, RO),
  ca1: band(C, CA1[0], CA1[1], RI, RO),
  subiculum,
  presubiculum: tailBox(PRESUB_U),
  parasubiculum: tailBox(PARASUB_U),
  ec: tailBox(EC_U),
  alveus: band(C, ALVEUS[0], ALVEUS[1], RO, RA),
  fimbria,
};

export const PIECES = {
  dg: bands(H, DG[0], DG[1], DG_SPLIT, DG_IN, DG_OUT),
  ca1: bands(C, CA1[0], CA1[1], CA_SPLIT, RI, RO),
  alveus: bands(C, ALVEUS[0], ALVEUS[1], CA_SPLIT, RO, RA),
};

const CA1_CUTS = [RO, 37.6, 33.6, 27, RI];
export const LAYERS = {
  "dg-molecular": bands(H, DG[0], DG[1], DG_SPLIT, DG_MID, DG_OUT),
  "dg-granule": bands(H, DG[0], DG[1], DG_SPLIT, DG_IN, DG_MID),
  "ca1-oriens": bands(C, CA1[0], CA1[1], CA_SPLIT, CA1_CUTS[1], CA1_CUTS[0]),
  "ca1-pyramidale": bands(C, CA1[0], CA1[1], CA_SPLIT, CA1_CUTS[2], CA1_CUTS[1]),
  "ca1-radiatum": bands(C, CA1[0], CA1[1], CA_SPLIT, CA1_CUTS[3], CA1_CUTS[2]),
  "ca1-lacunosum-moleculare": bands(C, CA1[0], CA1[1], CA_SPLIT, CA1_CUTS[4], CA1_CUTS[3]),
};

export const LAYER_LINES = {
  "dg-molecular": arcs(H, DG_MID, DG[0], DG[1], DG_SPLIT),
  "dg-granule": [],
  "ca1-oriens": arcs(C, CA1_CUTS[1], CA1[0], CA1[1], CA_SPLIT),
  "ca1-pyramidale": arcs(C, CA1_CUTS[2], CA1[0], CA1[1], CA_SPLIT),
  "ca1-radiatum": arcs(C, CA1_CUTS[3], CA1[0], CA1[1], CA_SPLIT),
  "ca1-lacunosum-moleculare": [],
};

export const PINS = {
  dg: polar(H, 15, -20),
  "dg-molecular": polar(H, 15, 100),
  "dg-granule": polar(H, 10, 40),
  hilus: [6, -3],
  ca3: polar(C, 32, 172),
  ca2: polar(C, 32, 130),
  ca1: polar(C, 30.3, 28),
  "ca1-oriens": polar(C, 39.8, 80),
  "ca1-pyramidale": polar(C, 35.6, 80),
  "ca1-radiatum": polar(C, 30.3, 80),
  "ca1-lacunosum-moleculare": polar(C, 24.5, 80),
  subiculum: polar(C, 32, -20),
  presubiculum: [-2, TAIL_V],
  parasubiculum: [-22, TAIL_V],
  ec: [-40, TAIL_V - 3],
  alveus: polar(C, (RO + RA) / 2, 60),
  fimbria: [-46, 6.05],
};
export const STEM_PINS = { fimbria: 7 };

const SULCUS = RI - 1.2;
const LANE_LOW = TAIL_TOP + 1.6;
const LANE_HIGH = TAIL_TOP + 4;
const PERFORANT_END = polar(H, 16.5, 265);
export const CORDS = {
  perforant: [[-54, TAIL_V + 1], [-54, LANE_HIGH], [PERFORANT_END[0], LANE_HIGH], PERFORANT_END],
  mossy: [polar(H, 16.5, 150), polar(C, 26, 162)],
  schaffer: [polar(C, 25, 150), ...angles(150, 60, 5).map((a) => polar(C, SULCUS, a)), polar(C, 30.3, 60)],
  "ca1-sub": [polar(C, 32, 10), polar(C, 32, -10)],
  "sub-ec": [[12, -30], [12, LANE_LOW], [-48, LANE_LOW], [-48, TAIL_V + 1]],
};
