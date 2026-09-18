/* after an OTA bundle is stored (run e2e_ota.js first? no — this one installs then probes the reload with Runtime events on) */
const cp = require("child_process"), fs = require("fs"), os = require("os"), path = require("path"), http = require("http");
const CHROME = path.resolve(__dirname, "cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe"), EXT = path.resolve(__dirname, "..", "NTL EyesBack Mod");
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "ntlv-e2e-")), PORT = 9334;
const chrome = cp.spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE, "--load-extension=" + EXT, "--disable-features=HttpsFirstBalancedModeAutoEnable,HttpsUpgrades,HttpsFirstModeV2ForEngagedSites", "about:blank"], { stdio: "ignore" });
const getJSON = url => new Promise((res, rej) => http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(JSON.parse(d))); }).on("error", rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function cdp(wsUrl) { const ws = new WebSocket(wsUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); let id = 0; const pending = {}, events = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } else if (m.method) events.push(m); };
  const send = (method, params) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const evalp = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result && r.result.exceptionDetails) return "EXC " + (r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description || r.result.exceptionDetails.text); return r.result && r.result.result ? r.result.result.value : JSON.stringify(r); };
  return { send, evalp, events, close: () => ws.close() }; }
(async () => { try {
  await sleep(2500);
  let page = (await getJSON("http://127.0.0.1:" + PORT + "/json")).find(t => t.type === "page");
  const c = await cdp(page.webSocketDebuggerUrl); await c.send("Page.enable"); await c.send("Runtime.enable"); await c.send("Log.enable");
  await c.send("Page.navigate", { url: "http://slither.io/" }); await sleep(9000);
  await c.evalp(`NTL_UP.setBeta(true)`); await sleep(4000);
  console.log(await c.evalp(`NTL_UP.install().then(function(ok){return "install:"+ok+" "+NTL_UP.status})`));
  await sleep(1500);   // NTL_UP reloads after 0.7 s — our CDP session stays on the same target
  c.events.length = 0;
  await sleep(12000);
  console.log("url:", await c.evalp("location.href"));
  console.log("state:", await c.evalp(`JSON.stringify({ver:localStorage.getItem("wyrmversion"), src:localStorage.getItem("wyrmsource"), err:localStorage.getItem("wyrm_err"), rolled:localStorage.getItem("wyrmrolledback"), dx:typeof NTL_DX, up:typeof NTL_UP, jq:typeof jQuery, scripts:[...document.scripts].map(s=>(s.src||"inline").slice(-40)+":"+s.textContent.length).join(" | ")})`));
  const ex = c.events.filter(e => e.method === "Runtime.exceptionThrown").map(e => (e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description || e.params.exceptionDetails.text || "").slice(0, 300));
  console.log("exceptions:", JSON.stringify(ex.slice(0, 5)));
  const logs = c.events.filter(e => e.method === "Log.entryAdded").map(e => e.params.entry.level + ": " + e.params.entry.text.slice(0, 200));
  console.log("log:", JSON.stringify(logs.slice(0, 8)));
  const cons = c.events.filter(e => e.method === "Runtime.consoleAPICalled").map(e => e.params.type + ": " + e.params.args.map(a => a.value || a.description).join(" ").slice(0, 200));
  console.log("console:", JSON.stringify(cons.slice(0, 8)));
  const fr = await c.send("Page.getFrameTree"); const fid = fr.result.frameTree.frame.id;
  const iw = await c.send("Page.createIsolatedWorld", { frameId: fid, worldName: "probe", grantUniveralAccess: true });
  const iso = async expr => { const r = await c.send("Runtime.evaluate", { expression: expr, contextId: iw.result.executionContextId, returnByValue: true, awaitPromise: true }); return r.result && r.result.exceptionDetails ? "EXC " + (r.result.exceptionDetails.exception||{}).description : JSON.stringify(r.result && r.result.result && r.result.result.value); };
  const T = require("./e2e_tests.js");
  for (const k of Object.keys(T)) { c.events.length = 0; const r = await iso("(" + T[k].toString() + ")()"); await sleep(800);
    const probe = k.startsWith("T1") ? "typeof window.__t1" : k.startsWith("T2") ? "typeof window.__t2" : "typeof NTL_DX + / + typeof NTL_UP";
    console.log(k + ":", r, "→", await c.evalp(probe), "| csp:", JSON.stringify(c.events.filter(e => e.method === "Log.entryAdded").map(e => e.params.entry.text.slice(0, 70)))); }
  c.close();
} catch (e) { console.log("ERR", e); } chrome.kill(); setTimeout(() => { try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {} process.exit(0); }, 1500); })();
