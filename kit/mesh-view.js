export const MESH_VIEW_CSS = `
.an-stage{position:relative;width:100%;aspect-ratio:5/4;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}
.an-stage:active{cursor:grabbing}
.an-stage:focus{outline:none}
.an-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.an-gl{display:block;width:100%;height:100%}
.an-tags{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.an-tag{position:absolute;left:0;top:0;box-sizing:border-box;min-width:18px;height:18px;padding:0 4px;border:1px solid var(--anatomy-muted);border-radius:9px;background:var(--anatomy-card);color:var(--anatomy-strong);font:11px/16px var(--anatomy-mono);text-align:center;transition:background .15s var(--anatomy-ease),color .15s var(--anatomy-ease)}
.an-tag[data-hot]{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
.an-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.an-quiz{position:absolute;left:20px;bottom:36px;margin:0;padding:3px 7px;font:10.5px/1 var(--anatomy-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);background:none;border:1px solid var(--anatomy-mid);border-radius:3px;cursor:pointer}
.an-quiz[aria-pressed="true"]{color:var(--anatomy-text);border-color:var(--anatomy-text)}
.an-n{color:var(--anatomy-text);font-family:var(--anatomy-mono);font-weight:500}
.iso-figure[data-quiz] .an-name{visibility:hidden}
.iso-key[data-key]{cursor:pointer;transition:color .15s var(--anatomy-ease)}
.iso-key[data-hot],.iso-key[data-hot] .an-n{color:var(--anatomy-strong)}
.iso-key[data-held] .an-n{color:var(--anatomy-lit);text-decoration:underline;text-underline-offset:3px}
@media (max-width:560px){.an-quiz{bottom:54px}}
`;

const VERT = `attribute vec3 aP;attribute vec3 aN;uniform mat3 uRot;uniform vec3 uCentre;uniform vec3 uScale;varying vec3 vN;
void main(){vec3 v=uRot*(aP-uCentre);vN=uRot*aN;gl_Position=vec4(v*uScale,1.);}`;
const FRAG = `precision mediump float;uniform vec3 uBase;uniform float uPick;uniform float uId;varying vec3 vN;
void main(){if(uPick>.5){gl_FragColor=vec4(uId/255.,0.,0.,1.);return;}
vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;
vec3 key=normalize(vec3(-.5,.7,.6));vec3 fill=normalize(vec3(.6,-.4,.5));
vec3 c=uBase*(.35+.65*max(0.,dot(n,key)))+.18*max(0.,dot(n,fill))+.12*pow(1.-max(0.,n.z),3.);
gl_FragColor=vec4(c,1.);}`;

const bytes = (text, T) => {
  const s = atob(text);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return new T(u.buffer);
};
function decode(m) {
  const q = bytes(m.positions, Int16Array);
  const oct = bytes(m.normals, Int8Array);
  const pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) {
    const a = i % 3;
    pos[i] = m.bbox[a] + ((q[i] + 32768) / 65535) * (m.bbox[a + 3] - m.bbox[a]);
  }
  const nor = new Float32Array(pos.length);
  for (let i = 0; i < oct.length / 2; i++) {
    const u = oct[i * 2] / 127;
    const v = oct[i * 2 + 1] / 127;
    const z = 1 - Math.abs(u) - Math.abs(v);
    let x = u;
    let y = v;
    if (z < 0) [x, y] = [(1 - Math.abs(v)) * Math.sign(u || 1), (1 - Math.abs(u)) * Math.sign(v || 1)];
    const l = Math.hypot(x, y, z) || 1;
    nor.set([x / l, y / l, z / l], i * 3);
  }
  return { pos, nor, idx: bytes(m.indices, m.index === "u16" ? Uint16Array : Uint32Array) };
}
function concat(meshes) {
  const parts = meshes.map(decode);
  const verts = parts.reduce((n, p) => n + p.pos.length / 3, 0);
  const faces = parts.reduce((n, p) => n + p.idx.length, 0);
  const data = new Float32Array(verts * 6);
  const idx = new (verts > 65535 ? Uint32Array : Uint16Array)(faces);
  let v = 0;
  let f = 0;
  for (const p of parts) {
    for (let i = 0; i < p.pos.length / 3; i++) {
      data.set(p.pos.subarray(i * 3, i * 3 + 3), (v + i) * 6);
      data.set(p.nor.subarray(i * 3, i * 3 + 3), (v + i) * 6 + 3);
    }
    for (let i = 0; i < p.idx.length; i++) idx[f + i] = p.idx[i] + v;
    v += p.pos.length / 3;
    f += p.idx.length;
  }
  const c = [0, 0, 0];
  for (let i = 0; i < verts; i++) for (let a = 0; a < 3; a++) c[a] += data[i * 6 + a] / verts;
  let best = 0;
  let near = Infinity;
  for (let i = 0; i < verts; i++) {
    const d = Math.hypot(data[i * 6] - c[0], data[i * 6 + 1] - c[1], data[i * 6 + 2] - c[2]);
    if (d < near) [near, best] = [d, i];
  }
  return { data, idx, verts, anchor: [data[best * 6], data[best * 6 + 1], data[best * 6 + 2]] };
}

const unit = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mul = (A, B) => A.map((row) => [0, 1, 2].map((c) => row[0] * B[0][c] + row[1] * B[1][c] + row[2] * B[2][c]));
const apply = (M, v) => M.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
const hex = (tone) => [1, 3, 5].map((i) => parseInt(tone.slice(i, i + 2), 16) / 255);
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const shades = (tone) => {
  const c = hex(tone);
  const l = lum(c);
  return { normal: c, lit: c.map((x) => x + (1 - x) * 0.35), dim: c.map((x) => (x + (l - x) * 0.6) * 0.45) };
};

export function mountAnatomy(stage, data) {
  if (!document.getElementById("an-css")) document.head.append(Object.assign(document.createElement("style"), { id: "an-css", textContent: MESH_VIEW_CSS }));
  const canvas = stage.querySelector(".an-gl");
  const tagBox = stage.querySelector(".an-tags");
  const sr = stage.querySelector(".an-sr");
  const figure = stage.closest(".iso-figure");
  const readout = figure.querySelector("[data-readout]");
  const quizButton = figure.querySelector(".an-quiz");
  const keys = new Map([...figure.querySelectorAll(".iso-key[data-key]")].map((el) => [el.dataset.key, el]));
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: true, alpha: true });
  if (!gl) {
    readout.textContent = "WebGL is off";
    return null;
  }
  gl.getExtension("OES_element_index_uint");

  const up = unit(data.frame.up);
  const front = unit(data.frame.front);
  const right = unit(cross(up, front));
  const basis = [right, up, unit(cross(right, up))];
  const parts = data.parts.map((part) => ({ ...concat(part.meshes), n: part.n, id: part.id, name: part.name, shades: shades(part.tone) }));
  const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    for (let i = 0; i < part.verts; i++) {
      for (let a = 0; a < 3; a++) {
        box[a] = Math.min(box[a], part.data[i * 6 + a]);
        box[a + 3] = Math.max(box[a + 3], part.data[i * 6 + a]);
      }
    }
  }
  const centre = [0, 1, 2].map((a) => (box[a] + box[a + 3]) / 2);
  let radius = 0;
  for (const part of parts) for (let i = 0; i < part.verts; i++) radius = Math.max(radius, Math.hypot(part.data[i * 6] - centre[0], part.data[i * 6 + 1] - centre[1], part.data[i * 6 + 2] - centre[2]));

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const U = Object.fromEntries(["uRot", "uCentre", "uScale", "uBase", "uPick", "uId"].map((name) => [name, gl.getUniformLocation(program, name)]));
  const aP = gl.getAttribLocation(program, "aP");
  const aN = gl.getAttribLocation(program, "aN");
  gl.enableVertexAttribArray(aP);
  gl.enableVertexAttribArray(aN);
  for (const part of parts) {
    part.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, part.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, part.data, gl.STATIC_DRAW);
    part.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, part.idx, gl.STATIC_DRAW);
    part.count = part.idx.length;
    part.type = part.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    part.tag = Object.assign(document.createElement("span"), { className: "an-tag", textContent: String(part.n), hidden: true });
    tagBox.append(part.tag);
  }
  gl.uniform3fv(U.uCentre, centre);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  const fbo = gl.createFramebuffer();
  const pickTex = gl.createTexture();
  const pickDepth = gl.createRenderbuffer();

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const open = data.frame.open ?? [0, 15];
const cam = { az: open[0], el: open[1], zoom: 1 };
  const S = { hot: null, held: null, step: null, quiz: false, idle: !still };
  let W = 0;
  let H = 0;
  let pw = 0;
  let ph = 0;
  let pixels = null;
  let rot = null;
  let scale = null;
  let geometry = true;
  let raf = 0;
  let last = 0;
  let frameMs = 0;
  const anchors = parts.map((part) => ({ id: part.id, x: 0, y: 0, visible: false }));

  const byId = (id) => parts.find((part) => part.id === id);
  const litId = () => S.hot ?? S.held ?? S.step;
  const sample = (x, y) => {
    if (!pixels || x < 0 || y < 0 || x >= W || y >= H) return -1;
    const bx = Math.min(pw - 1, Math.floor((x / W) * pw));
    const by = Math.min(ph - 1, Math.floor((1 - y / H) * ph));
    return pixels[(by * pw + bx) * 4] - 1;
  };
  const pick = (x, y) => parts[sample(x, y)]?.id ?? null;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const [w, h] = [Math.max(1, Math.round(canvas.clientWidth * dpr)), Math.max(1, Math.round(canvas.clientHeight * dpr))];
    if (w === canvas.width && h === canvas.height) return;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = w;
    canvas.height = h;
    pw = Math.max(1, Math.round(canvas.width / 2));
    ph = Math.max(1, Math.round(canvas.height / 2));
    gl.bindTexture(gl.TEXTURE_2D, pickTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pw, ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindRenderbuffer(gl.RENDERBUFFER, pickDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, pw, ph);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, pickDepth);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    pixels = new Uint8Array(pw * ph * 4);
    geometry = true;
    render();
    if (S.idle) draw();
  }
  function camera() {
    const a = (cam.az * Math.PI) / 180;
    const e = (cam.el * Math.PI) / 180;
    const Ry = [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
    const Rx = [[1, 0, 0], [0, Math.cos(e), -Math.sin(e)], [0, Math.sin(e), Math.cos(e)]];
    rot = mul(mul(Rx, Ry), basis);
    const half = radius / 0.92 / cam.zoom;
    const aspect = W / H;
    scale = [1 / (half * Math.max(aspect, 1)), 1 / (half * Math.max(1 / aspect, 1)), -1 / (2 * radius)];
    gl.uniformMatrix3fv(U.uRot, false, [0, 1, 2].flatMap((c) => [rot[0][c], rot[1][c], rot[2][c]]));
    gl.uniform3fv(U.uScale, scale);
  }
  function drawParts(picking) {
    gl.uniform1f(U.uPick, picking ? 1 : 0);
    const lit = litId();
    parts.forEach((part, index) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, part.vbo);
      gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.ibo);
      gl.uniform1f(U.uId, index + 1);
      gl.uniform3fv(U.uBase, part.shades[part.id === lit ? "lit" : S.step ? "dim" : "normal"]);
      gl.drawElements(gl.TRIANGLES, part.count, part.type, 0);
    });
  }
  function project(p) {
    const v = apply(rot, [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]]);
    return [((v[0] * scale[0] + 1) / 2) * W, ((1 - v[1] * scale[1]) / 2) * H];
  }
  function spot(index, x, y) {
    const bx = Math.floor((x / W) * pw);
    const by = Math.floor((1 - y / H) * ph);
    const own = (i, j) => i >= 0 && j >= 0 && i < pw && j < ph && pixels[(j * pw + i) * 4] === index + 1;
    if (own(bx, by)) return [x, y];
    for (let r = 1; r <= pw / 6; r++) {
      for (let k = -r; k <= r; k++) {
        for (let [i, j] of [[bx + k, by - r], [bx + k, by + r], [bx - r, by + k], [bx + r, by + k]]) {
          if (!own(i, j)) continue;
          const [di, dj] = [Math.sign(i - bx), Math.sign(j - by)];
          for (let t = 0; t < 10 && own(i + di, j + dj); t++) [i, j] = [i + di, j + dj];
          return [((i + 0.5) / pw) * W, (1 - (j + 0.5) / ph) * H];
        }
      }
    }
    return null;
  }
  // ponytail: frameMs leaves out the wait inside readPixels, which is GPU time: about 300 ms under SwiftShader, under 2 ms on a GPU
  function render() {
    const t0 = performance.now();
    let wait = 0;
    camera();
    if (geometry) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, pw, ph);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drawParts(true);
      const t1 = performance.now();
      gl.readPixels(0, 0, pw, ph, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      wait = performance.now() - t1;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      geometry = false;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawParts(false);
    const lit = litId();
    parts.forEach((part, index) => {
      const at = spot(index, ...project(part.anchor));
      const [x, y] = at ?? [0, 0];
      Object.assign(anchors[index], { x, y, visible: Boolean(at) });
      part.tag.hidden = !at;
      if (at) part.tag.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`;
      part.tag.toggleAttribute("data-hot", part.id === lit);
    });
    frameMs = performance.now() - t0 - wait;
  }
  function frame(now) {
    raf = 0;
    if (!pixels) return;
    if (S.idle) {
      if (last) cam.az = (cam.az + (6 * (now - last)) / 1000) % 360;
      last = now;
      geometry = true;
    }
    render();
    if (S.idle) draw();
  }
  function draw() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function wake() {
    S.idle = false;
  }
  function say() {
    const part = byId(litId());
    const text = part ? (S.quiz ? String(part.n) : `${part.n} · ${part.name}`) : `${parts.length} parts`;
    readout.textContent = text;
    sr.textContent = text;
  }
  function show() {
    const lit = litId();
    for (const [id, el] of keys) {
      el.toggleAttribute("data-hot", id === lit);
      el.toggleAttribute("data-held", id === S.held);
    }
    say();
    draw();
  }
  function hover(id) {
    if (S.hot === id) return;
    S.hot = id;
    show();
  }
  function turn(az, el) {
    cam.az = az % 360;
    cam.el = Math.max(-85, Math.min(85, el));
    geometry = true;
    draw();
  }
  function zoomTo(z) {
    cam.zoom = Math.max(0.5, Math.min(3, z));
    geometry = true;
    draw();
  }
  function setQuiz(on) {
    S.quiz = on;
    figure.toggleAttribute("data-quiz", on);
    quizButton?.setAttribute("aria-pressed", String(on));
    say();
  }

  const pointers = new Map();
  let drag = null;
  let pinch = 0;
  const local = (event) => {
    const r = canvas.getBoundingClientRect();
    return [event.clientX - r.left, event.clientY - r.top];
  };
  stage.addEventListener("pointerdown", (event) => {
    wake();
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, local(event));
    drag = { x: event.clientX, y: event.clientY, az: cam.az, el: cam.el, moved: false };
    if (pointers.size === 2) pinch = Math.hypot(...[...pointers.values()].reduce((a, b) => [a[0] - b[0], a[1] - b[1]]));
    stage.focus({ preventScroll: true });
  });
  stage.addEventListener("pointermove", (event) => {
    wake();
    const at = local(event);
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, at);
    if (pointers.size === 2) {
      const d = Math.hypot(...[...pointers.values()].reduce((a, b) => [a[0] - b[0], a[1] - b[1]]));
      if (pinch) zoomTo((cam.zoom * d) / pinch);
      pinch = d;
      return;
    }
    if (drag && pointers.size === 1) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 3) drag.moved = true;
      if (drag.moved) turn(drag.az + dx * 0.5, drag.el + dy * 0.5);
      return;
    }
    hover(pick(...at));
  });
  const release = (event) => {
    pointers.delete(event.pointerId);
    if (!pointers.size && drag && !drag.moved && event.type === "pointerup") {
      S.held = pick(...local(event));
      S.step = null;
      show();
    }
    if (!pointers.size) drag = null;
    pinch = 0;
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  document.addEventListener("pointermove", (event) => {
    if (!drag && !stage.contains(event.target) && !event.target.closest?.(".iso-key[data-key]")) hover(null);
  });
  stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    wake();
    zoomTo(cam.zoom * Math.exp(-event.deltaY * 0.0015));
  }, { passive: false });
  stage.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key;
    const n = byId(litId())?.n ?? 0;
    if (key === "ArrowRight" || key === "ArrowDown") S.step = parts[n % parts.length].id;
    else if (key === "ArrowLeft" || key === "ArrowUp") S.step = parts[((n || 1) + parts.length - 2) % parts.length].id;
    else if (key === "Escape") S.hot = S.held = S.step = null;
    else if (key === "q" || key === "Q") return setQuiz(!S.quiz);
    else if (key === "r" || key === "R") {
      Object.assign(cam, { az: open[0], el: open[1], zoom: 1 });
      geometry = true;
    } else return;
    event.preventDefault();
    wake();
    if (key.startsWith("Arrow")) S.hot = S.held = null;
    show();
  });
  for (const [id, el] of keys) {
    el.addEventListener("pointerenter", () => hover(id));
    el.addEventListener("pointerleave", () => hover(null));
  }
  quizButton?.addEventListener("click", () => setQuiz(!S.quiz));
  new ResizeObserver(resize).observe(stage);

  const api = {
    parts: parts.map(({ n, id, name }) => ({ n, id, name })),
    view(az, el) {
      if (az === undefined) return { azimuth: cam.az, elevation: cam.el, zoom: cam.zoom };
      wake();
      turn(az, el);
    },
    pick,
    anchors: () => anchors.map((a) => ({ ...a })),
    get frameMs() {
      return frameMs;
    },
  };
  window.anatomy ??= { stages: [] };
  window.anatomy.stages.push(api);
  if (window.anatomy.stages.length === 1) Object.defineProperties(window.anatomy, Object.getOwnPropertyDescriptors(api));
  say();
  return api;
}
