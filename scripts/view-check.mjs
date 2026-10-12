import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VIEWS = [[0, 0], [180, 0], [90, 0], [-90, 0], [0, 85], [0, -85]];

if (typeof WebSocket === "undefined" && !process.execArgv.includes("--experimental-websocket")) {
  const child = spawn(process.execPath, ["--experimental-websocket", ...process.argv.slice(1)], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 1));
} else {
  await main();
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const playwright = join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(playwright)) {
    for (const dir of readdirSync(playwright).sort().reverse()) {
      for (const sub of ["chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-linux/chrome"]) {
        candidates.push(join(playwright, dir, sub));
      }
    }
  }
  return candidates.find((path) => existsSync(path));
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.log("Check a 3D figure headless: every part visible from one of six views, every tag picks its part, console clean, frames under 16 ms.\n\n  node view-check.mjs <page.html>");
    process.exit(1);
  }
  const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(resolve(target)).href;
  const binary = chromePath();
  if (!binary) {
    console.error("No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.");
    process.exit(1);
  }
  const profile = mkdtempSync(join(tmpdir(), "iso-view-check-"));
  const chrome = spawn(binary, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "about:blank"]);
  const port = await new Promise((done, fail) => {
    let text = "";
    const timer = setTimeout(() => fail(new Error("Chrome did not start")), 20000);
    chrome.stderr.on("data", (chunk) => {
      text += chunk;
      const match = text.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        done(Number(match[1]));
      }
    });
  });
  const finish = (code) => {
    chrome.kill("SIGKILL");
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
    process.exit(code);
  };
  try {
    const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();
    const problems = [];
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      } else if (data.method === "Runtime.consoleAPICalled" && (data.params.type === "error" || data.params.type === "warning")) {
        problems.push(`console.${data.params.type}: ${data.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ").slice(0, 600)}`);
      } else if (data.method === "Runtime.exceptionThrown") {
        const detail = data.params.exceptionDetails;
        problems.push(`exception: ${detail.exception?.description ?? detail.text}`.slice(0, 600));
      }
    };
    await new Promise((done) => (socket.onopen = done));
    const send = (method, params = {}) =>
      new Promise((done) => {
        const call = ++id;
        pending.set(call, done);
        socket.send(JSON.stringify({ id: call, method, params }));
      });
    const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
    const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url });
    await sleep(1500);
    const stages = (await evaluate("window.anatomy ? window.anatomy.stages.length : 0")) ?? 0;
    if (!stages) problems.push("no window.anatomy.stages on the page");
    let parts = 0;
    const frames = [];
    for (let s = 0; s < stages; s++) {
      const seen = new Map();
      for (const [az, el] of VIEWS) {
        const result = await evaluate(`(()=>{const st=window.anatomy.stages[${s}];st.view(${az},${el});return new Promise((done)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{const anchors=st.anchors();done({anchors,picks:anchors.map((a)=>a.visible?st.pick(a.x,a.y):null),ms:st.frameMs})})))})()`);
        if (!result) {
          problems.push(`stage ${s + 1} view ${az},${el}: no result`);
          continue;
        }
        frames.push(result.ms);
        result.anchors.forEach((anchor, index) => {
          seen.set(anchor.id, (seen.get(anchor.id) ?? false) || anchor.visible);
          if (anchor.visible && result.picks[index] !== anchor.id) problems.push(`stage ${s + 1} view ${az},${el}: tag ${anchor.id} at ${anchor.x.toFixed(0)},${anchor.y.toFixed(0)} picks ${result.picks[index]}`);
        });
      }
      parts += seen.size;
      for (const [partId, visible] of seen) if (!visible) problems.push(`stage ${s + 1}: ${partId} is not visible from any of the ${VIEWS.length} views`);
    }
    const sorted = frames.sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    if (median >= 16) problems.push(`median frame ${median.toFixed(1)} ms is not under 16 ms`);
    if (problems.length) console.log(`view-check: ${problems.length} problem${problems.length === 1 ? "" : "s"}\n${problems.map((line) => `  ${line}`).join("\n")}`);
    else console.log(`view-check: ok · ${parts} parts · ${VIEWS.length} views · ${median.toFixed(1)} ms`);
    socket.close();
    finish(problems.length ? 1 : 0);
  } catch (error) {
    console.error(error);
    finish(1);
  }
}
