/* Lobby e2e: simulate a round (playing true → false) on the real page; the lobby must open with the last score, quick
   toggles must flip, HOME must close it, and a real mouse click on PLAY AGAIN must reach NTL's connect (u9). */
const cp = require("child_process"), fs = require("fs"), os = require("os"), path = require("path"), http = require("http");
const CHROME = (fs.existsSync(path.resolve(__dirname, "cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe")) ? path.resolve(__dirname, "cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe") : path.resolve(__dirname, "../../tools/cft/chrome/win64-153.0.8010.52/chrome-win64/chrome.exe")), EXT = path.resolve(__dirname, "..");
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "ntlv-e2e-")), PORT = 9341;
const chrome = cp.spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--window-size=1280,800", "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE, "--load-extension=" + EXT, "--disable-features=HttpsFirstBalancedModeAutoEnable,HttpsUpgrades,HttpsFirstModeV2ForEngagedSites", "about:blank"], { stdio: "ignore" });
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
  await c.evalp(`try{localStorage.setItem("wy_seen_ver",localStorage.getItem("wyrmversion"));NTL_WN.close();}catch(e){} document.getElementById("nick").value="Om"; document.querySelector("#lastscore").innerHTML='<span style="opacity:.45">Your final length was </span><b>1234</b>'; ii=false; playing=true; 1`);
  await sleep(600); await c.evalp(`playing=false; 1`); await sleep(900);
  console.log("lobby open:", await c.evalp(`JSON.stringify({open:NTL_LB.open_,stats:NTL_LB.stats,title:(document.getElementById("lb-title")||{}).textContent,who:(document.getElementById("lb-who")||{}).textContent,main:(document.querySelector("#lb-score .c.main .v")||{}).textContent,qs:!!document.getElementById("lb-qs")})`));
  { const r = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 70 }); fs.writeFileSync(process.env.TEMP + "/lb_shot.jpg", Buffer.from(r.result.data, "base64")); }
  /* quick toggle: spine (pure mod toggle) via real mouse */
  const rect = async sel => JSON.parse(await c.evalp(`JSON.stringify(document.querySelector('${sel}').getBoundingClientRect())`));
  async function click(sel) { const r = await rect(sel); const x = r.x + r.width / 2, y = r.y + r.height / 2; for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await c.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); await sleep(300); }
  await click('#lb-qs');
  console.log("quick settings page:", await c.evalp(`document.getElementById("wy-lb").classList.contains("qs")`)); { const r = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 70 }); fs.writeFileSync(process.env.TEMP + "/lb_shot2.jpg", Buffer.from(r.result.data, "base64")); } await click('#lb-back'); console.log("back:", await c.evalp(`!document.getElementById("wy-lb").classList.contains("qs")`));
  await click('#lb-home');
  console.log("home closes:", await c.evalp(`!NTL_LB.open_`));
  await c.evalp(`NTL_LB.open(); window.__u9=0; var _u9=u9; u9=function(){window.__u9=1;}; 1`); await sleep(200);
  await click('#lb-play');
  console.log("play again → u9:", await c.evalp(`JSON.stringify({u9:window.__u9,open:NTL_LB.open_})`));
  await c.evalp(`NTL_LB.open(); 1`); await sleep(100);
  await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(200);
  console.log("esc closes:", await c.evalp(`!NTL_LB.open_`));
  /* auto-respawn on → no lobby */
  await c.evalp(`ii=true; playing=true; 1`); await sleep(500); await c.evalp(`playing=false; 1`); await sleep(900);
  console.log("autorespawn skips lobby:", await c.evalp(`!NTL_LB.open_`));
  const ex = c.events.filter(e => e.method === "Runtime.exceptionThrown").map(e => (e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description || e.params.exceptionDetails.text).slice(0, 160));
  console.log("exceptions:", JSON.stringify(ex.slice(0, 5)));
  c.close();
} catch (e) { console.error("ERR", e); } finally { chrome.kill(); setTimeout(() => { try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {} process.exit(0); }, 500); } })();
