/* What's new e2e: real page + extension; NTL_WN.loadNotes must fetch the GitHub release body of a released tag and
   md() must render it; then open the popup and check the body filled. Run: node tools/e2e_wn.js [version] */
const cp = require("child_process"), fs = require("fs"), os = require("os"), path = require("path"), http = require("http");
const CHROME = (fs.existsSync(path.resolve(__dirname, "cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe")) ? path.resolve(__dirname, "cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe") : path.resolve(__dirname, "../../tools/cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe")), EXT = path.resolve(__dirname, "..");
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "ntlv-e2e-")), PORT = 9337, VER = process.argv[2] || "5.59";
const chrome = cp.spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE, "--load-extension=" + EXT, "--disable-features=HttpsFirstBalancedModeAutoEnable,HttpsUpgrades,HttpsFirstModeV2ForEngagedSites", "about:blank"], { stdio: "ignore" });
const getJSON = url => new Promise((res, rej) => http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => res(JSON.parse(d))); }).on("error", rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function cdp(wsUrl) { const ws = new WebSocket(wsUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); let id = 0; const pending = {}, events = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } else if (m.method) events.push(m); };
  const send = (method, params) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const evalp = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result && r.result.exceptionDetails) return "EXC " + (r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description || r.result.exceptionDetails.text); return r.result && r.result.result ? r.result.result.value : undefined; };
  return { send, evalp, events, close: () => ws.close() }; }
(async () => { try {
  await sleep(2500);
  let page = (await getJSON("http://127.0.0.1:" + PORT + "/json")).find(t => t.type === "page");
  const c = await cdp(page.webSocketDebuggerUrl); await c.send("Page.enable"); await c.send("Runtime.enable");
  await c.send("Page.navigate", { url: "http://slither.io/" }); await sleep(9000);
  console.log("ver:", await c.evalp(`localStorage.getItem("wyrmversion")`));
  console.log("notes(" + VER + "):", await c.evalp(`NTL_WN.loadNotes("${VER}").then(function(t){return (t||"").slice(0,120).replace(/\\n/g,"⏎")})`));
  console.log("cache:", await c.evalp(`(localStorage.getItem("wy_wn_md")||"").slice(0,60)`));
  console.log("render:", await c.evalp(`NTL_WN.md(JSON.parse(localStorage.getItem("wy_wn_md")).md).slice(0,300)`));
  /* open the popup for the running version and wait for the body */
  await c.evalp(`localStorage.removeItem("wy_wn_md"); NTL_WN.close(); NTL_WN.show(); 1`); await sleep(5000);
  console.log("popup:", await c.evalp(`(function(){var b=document.getElementById("wn-body");return b?("class="+b.className+" html="+b.innerHTML.slice(0,200)):"NO POPUP"})()`));
  console.log("foot:", await c.evalp(`(document.querySelector("#wn-foot small")||{}).innerHTML`));
  console.log("css:", await c.evalp(`(function(){var b=document.getElementById("wn-body");var t=b&&b.querySelector("table,pre,h2,ul");return t?getComputedStyle(t).borderRadius+" "+t.tagName:"none"})()`));
  c.close();
} catch (e) { console.error("ERR", e); } finally { chrome.kill(); setTimeout(() => { try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {} process.exit(0); }, 500); } })();
