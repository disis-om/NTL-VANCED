/* End-to-end OTA test: headless Chrome + the unpacked extension + real slither.io + real GitHub.
   node tools/e2e_ota.js            (from Desktop/wyrm)
   1. launches Chrome with --load-extension=<mod folder>, opens slither.io, waits for the launcher
   2. installs the beta bundle through NTL_UP (real download + hash + storage), reloads
   3. reports whether the OTA bundle booted (#login present, wyrmsource=ota, wyrm_err, rolled back?) */
const cp = require("child_process"), fs = require("fs"), os = require("os"), path = require("path"), http = require("http");
const CHROME = path.resolve(__dirname, "cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe");
const EXT = path.resolve(__dirname, "..", "NTL EyesBack Mod");
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "ntlv-e2e-"));
const PORT = 9333;
const chrome = cp.spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE, "--load-extension=" + EXT, "--window-size=1400,900", "about:blank"], { stdio: "ignore" });
function getJSON(url) { return new Promise((res, rej) => http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on("error", rej)); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = {}; const events = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } else if (m.method) events.push(m); };
  const send = (method, params) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const evalp = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); return r.result && r.result.result ? r.result.result.value : r; };
  return { send, evalp, events, close: () => ws.close() };
}
(async () => {
  try {
    await sleep(2500);
    let targets = await getJSON("http://127.0.0.1:" + PORT + "/json");
    let page = targets.find(t => t.type === "page");
    const c = await cdp(page.webSocketDebuggerUrl);
    await c.send("Page.enable"); await c.send("Runtime.enable");
    await c.send("Page.navigate", { url: "http://slither.io/" });
    await sleep(9000);
    const s1 = await c.evalp(`JSON.stringify({login:!!document.getElementById("login"), mybox:!!document.getElementById("mybox"), ver:localStorage.getItem("wyrmversion"), src:localStorage.getItem("wyrmsource"), loader:localStorage.getItem("wyrmloader"), up:typeof NTL_UP, err:localStorage.getItem("wyrm_err")})`);
    console.log("boot (packaged):", s1);
    /* install the beta bundle for real */
    await c.evalp(`(function(){NTL_UP.setBeta(true);})()`);
    await sleep(4000);
    const m = await c.evalp(`JSON.stringify(NTL_UP.manifest ? {v:NTL_UP.manifest.version, ch:NTL_UP.manifest.channel} : null)`);
    console.log("manifest:", m);
    const inst = await c.evalp(`NTL_UP.install().then(function(ok){return "install:"+ok+" status:"+NTL_UP.status}).catch(function(e){return "install threw "+e})`);
    console.log(inst);
    await sleep(6000);                 // NTL_UP reloads 0.7 s after install; give the new page time to boot
    targets = await getJSON("http://127.0.0.1:" + PORT + "/json"); page = targets.find(t => t.type === "page" && /slither/.test(t.url));
    const c2 = await cdp(page.webSocketDebuggerUrl); await c2.send("Runtime.enable");
    await sleep(5000);
    const s2 = await c2.evalp(`JSON.stringify({login:!!document.getElementById("login"), mybox:!!document.getElementById("mybox"), ver:localStorage.getItem("wyrmversion"), src:localStorage.getItem("wyrmsource"), err:localStorage.getItem("wyrm_err"), rolled:localStorage.getItem("wyrmrolledback"), up:typeof NTL_UP, title:document.title})`);
    console.log("after OTA reload:", s2);
    await sleep(8000);                 // watchdog window
    const s3 = await c2.evalp(`JSON.stringify({login:!!document.getElementById("login"), ver:localStorage.getItem("wyrmversion"), src:localStorage.getItem("wyrmsource"), err:localStorage.getItem("wyrm_err"), rolled:localStorage.getItem("wyrmrolledback")})`);
    console.log("after watchdog window:", s3);
    const sw = (await getJSON("http://127.0.0.1:" + PORT + "/json")).find(t => t.type === "service_worker" || /background/.test(t.url));
    if (sw) { const c3 = await cdp(sw.webSocketDebuggerUrl); const st = await c3.evalp(`new Promise(r=>chrome.storage.local.get(["wyrm_bundle","wyrm_boot","wyrm_boot_ok"],x=>r(JSON.stringify({has:!!x.wyrm_bundle, v:x.wyrm_bundle&&x.wyrm_bundle.version, len:x.wyrm_bundle&&x.wyrm_bundle.code.length, boot:x.wyrm_boot, ok:x.wyrm_boot_ok}))))`); console.log("storage:", st); c3.close(); }
    c.close(); c2.close();
  } catch (e) { console.log("E2E error", e); }
  chrome.kill(); setTimeout(() => { try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {} process.exit(0); }, 1500);
})();
