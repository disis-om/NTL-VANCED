/* NTL VANCED — runs at document_start (before slither's own HTML is parsed).
   1. Preloads the big extension files so their disk read / compile overlaps slither's page load instead of starting
      after window.load (main-mt.js only when no OTA bundle is stored — the OTA code comes from chrome.storage).
   2. Paints the boot skeleton: a themed, shimmering ghost of the launcher + an iOS-style spinner, up from the very
      first frame until the real launcher exists (NTL_SK in the bundle fades it out; hard stop at 15 s). */
(function () {
  var url = function (f) { return chrome.runtime.getURL(f); };
  function link(rel, as, href) { try { var l = document.createElement("link"); l.rel = rel; if (as) l.as = as; l.href = href; (document.head || document.documentElement).appendChild(l); } catch (e) {} }
  link("preload", "style", url("bootstrap.css"));
  ["jquery-2.2.4.min.js", "fstags.js", "emoji-data.js"].forEach(function (f) { link("preload", "script", url(f)); });
  try { chrome.storage.local.get(["wyrm_bundle"], function (st) { if (!(st && st.wyrm_bundle && st.wyrm_bundle.code)) link("preload", "script", url("main-mt.js")); }); } catch (e) { link("preload", "script", url("main-mt.js")); }

  /* ---- boot skeleton ---- */
  var T = { p: "#e0202a", b: "#2d5bd8", l: "#ff9aa0", s: "#9ab8ff", bg1: "#1a1114", bg2: "#100a0c", bg3: "#0b0708" };
  try { var j = JSON.parse(localStorage.getItem("wy_theme") || "null"); if (j && j.p && j.bg1) T = j; } catch (e) {}
  var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  var css = [
    "#wy-skel{position:fixed;inset:0;z-index:2147482800;background:radial-gradient(1200px 600px at 50% 40%," + T.bg1 + " 0%," + T.bg2 + " 55%," + T.bg3 + " 100%);font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#e6e9ef;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity .28s ease;pointer-events:auto;}",
    "#wy-skel.out{opacity:0;pointer-events:none;}",
    "#wy-skel .brand{position:absolute;left:22px;top:18px;font:bold 10px Arial;letter-spacing:2.4px;color:#8b93a7;}#wy-skel .brand b{display:block;margin-top:3px;font-size:15px;letter-spacing:1px;background:linear-gradient(90deg," + T.l + "," + T.s + ");-webkit-background-clip:text;background-clip:text;color:transparent;}",
    "#wy-skel .g{width:min(560px,92vw);display:grid;grid-template-columns:1fr 1fr;gap:12px;}",
    "#wy-skel .k{position:relative;overflow:hidden;border-radius:14px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.06);}",
    "#wy-skel .k:after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.07) 40%,rgba(" + rgb(T.l) + ",.16) 50%,rgba(255,255,255,.07) 60%,transparent 100%);animation:wySkSh 1.6s cubic-bezier(.4,0,.2,1) infinite;}",
    "#wy-skel .nick{grid-column:1/-1;height:52px;border-radius:16px;}#wy-skel .t{height:58px;}#wy-skel .play{grid-column:1/-1;height:54px;border-radius:16px;background:linear-gradient(90deg,rgba(" + rgb(T.p) + ",.28),rgba(" + rgb(T.b) + ",.22));border-color:rgba(255,255,255,.1);}",
    "#wy-skel .t i{position:absolute;left:14px;top:50%;width:26px;height:26px;margin-top:-13px;border-radius:9px;background:rgba(255,255,255,.08);}#wy-skel .t u{position:absolute;left:52px;top:18px;width:38%;height:9px;border-radius:5px;background:rgba(255,255,255,.1);}#wy-skel .t s{position:absolute;left:52px;top:34px;width:52%;height:7px;border-radius:4px;background:rgba(255,255,255,.06);}",
    "#wy-skel .sp{margin-top:34px;display:flex;align-items:center;gap:12px;font:bold 10px Arial;letter-spacing:2px;color:#8b93a7;}",
    "#wy-skel .ios{position:relative;width:22px;height:22px;}#wy-skel .ios i{position:absolute;left:50%;top:0;width:2.4px;height:6px;margin-left:-1.2px;border-radius:2px;background:" + T.l + ";transform-origin:50% 11px;animation:wySkFade 1s linear infinite;}",
    "@keyframes wySkSh{to{transform:translateX(100%)}}@keyframes wySkFade{0%{opacity:1}100%{opacity:.15}}",
    "@media (max-width:520px){#wy-skel .g{gap:9px;}#wy-skel .t{height:52px;}#wy-skel .brand{left:16px;top:14px;}}"
  ].join("\n");
  function rgb(h) { h = String(h || "#fff").replace("#", ""); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; }); var n = parseInt(h, 16) || 0; return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255); }
  function tile() { return '<div class="k t"><i></i><u></u><s></s></div>'; }
  var bars = ""; for (var i = 0; i < 12; i++) bars += '<i style="transform:rotate(' + (i * 30) + 'deg);animation-delay:' + (-(11 - i) / 12) + 's"></i>';
  function paint() {
    if (!document.documentElement || document.getElementById("wy-skel")) return;
    var st = document.createElement("style"); st.id = "wy-skel-css"; st.textContent = css;
    var d = document.createElement("div"); d.id = "wy-skel";
    d.innerHTML = '<div class="brand">NTL VANCED<b>Loading</b></div><div class="g"><div class="k nick"></div>' + tile() + tile() + tile() + tile() + tile() + tile() + '<div class="k play"></div></div><div class="sp"><span class="ios">' + bars + "</span>LOADING</div>";
    (document.head || document.documentElement).appendChild(st);
    document.documentElement.appendChild(d);   // stays a child of <html>: slither's inline script rewrites body's innerHTML
  }
  function remove() { var d = document.getElementById("wy-skel"); if (!d) return; d.classList.add("out"); setTimeout(function () { try { d.remove(); var s2 = document.getElementById("wy-skel-css"); if (s2) s2.remove(); } catch (e) {} }, 320); }
  /* Chrome replaces the document root (and drops anything hung on it) at least once between document_start and the
     bundle running, so the overlay is kept alive by a 100 ms poll instead of a one-shot observer: paint whenever it is
     missing, fade the moment the bundle sets html[data-wy-ready] (the page cannot reach this world), hard stop at 15 s. */
  function ready() { return document.documentElement && document.documentElement.hasAttribute("data-wy-ready"); }
  var t0 = Date.now(), done = false;
  var iv = setInterval(function () {
    if (done) { clearInterval(iv); return; }
    if (ready() || Date.now() - t0 > 15000) { done = true; clearInterval(iv); remove(); return; }
    if (document.body && !document.getElementById("wy-skel")) paint();
  }, 100);
  if (document.body) paint();
})();
