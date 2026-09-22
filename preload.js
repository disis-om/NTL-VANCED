/* NTL VANCED — runs at document_start (before slither's own HTML is parsed).
   1. Preloads the big extension files so their disk read / compile overlaps slither's page load instead of starting
      after window.load (main-mt.js only when no OTA bundle is stored — the OTA code comes from chrome.storage).
   2. Paints the loading ghosts: not one fake card in the middle, but one shimmer per panel, exactly where that panel
      was on this screen last time (the bundle writes the rectangles to localStorage.wy_skel while the home screen is
      up, so a moved chat box or roster is ghosted where the player put it). Each ghost disappears on its own the
      moment its real element is on screen; the whole layer is dropped when the bundle reports ready, or after 15 s. */
(function () {
  var url = function (f) { return chrome.runtime.getURL(f); };
  function link(rel, as, href) { try { var l = document.createElement("link"); l.rel = rel; if (as) l.as = as; l.href = href; (document.head || document.documentElement).appendChild(l); } catch (e) {} }
  link("preload", "style", url("bootstrap.css"));
  ["jquery-2.2.4.min.js", "fstags.js", "emoji-data.js"].forEach(function (f) { link("preload", "script", url(f)); });
  try { chrome.storage.local.get(["wyrm_bundle"], function (st) { if (!(st && st.wyrm_bundle && st.wyrm_bundle.code)) link("preload", "script", url("main-mt.js")); }); } catch (e) { link("preload", "script", url("main-mt.js")); }

  /* ---- theme (same palette the mod will use) ---- */
  var T = { p: "#e0202a", b: "#2d5bd8", l: "#ff9aa0", s: "#9ab8ff", bg1: "#1a1114", bg2: "#100a0c", bg3: "#0b0708" };
  try { var j = JSON.parse(localStorage.getItem("wy_theme") || "null"); if (j && j.p && j.bg1) T = j; } catch (e) {}
  function rgb(h) { h = String(h || "#fff").replace("#", ""); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; }); var n = parseInt(h, 16) || 0; return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255); }
  var css = [
    "#wy-skel{position:fixed;inset:0;z-index:2147482800;pointer-events:none;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;}",
    "#wy-skel .bg{position:absolute;inset:0;background:radial-gradient(1200px 600px at 50% 40%," + T.bg1 + " 0%," + T.bg2 + " 55%," + T.bg3 + " 100%);transition:opacity .3s ease;}",
    "#wy-skel .k{position:absolute;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);overflow:hidden;transition:opacity .25s ease;box-shadow:0 10px 30px rgba(0,0,0,.25);}",
    "#wy-skel .k.play{background:linear-gradient(90deg,rgba(" + rgb(T.p) + ",.30),rgba(" + rgb(T.b) + ",.24));border-color:rgba(255,255,255,.10);}",
    "#wy-skel .k.round{border-radius:50%;}",
    "#wy-skel .k:after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.06) 40%,rgba(" + rgb(T.l) + ",.16) 50%,rgba(255,255,255,.06) 60%,transparent 100%);animation:wySkSh 1.5s cubic-bezier(.4,0,.2,1) infinite;}",
    "#wy-skel .k.out{opacity:0;}",
    "#wy-skel .ln{position:absolute;left:12px;height:8px;border-radius:5px;background:rgba(255,255,255,.075);}",
    "#wy-skel .brand{position:absolute;left:22px;bottom:16px;font:bold 10px Arial;letter-spacing:2.4px;color:#8b93a7;transition:opacity .25s ease;}#wy-skel .brand b{display:block;margin-top:3px;font-size:15px;letter-spacing:1px;background:linear-gradient(90deg," + T.l + "," + T.s + ");-webkit-background-clip:text;background-clip:text;color:transparent;}",
    "#wy-skel .ios{position:absolute;width:20px;height:20px;}#wy-skel .ios i{position:absolute;left:50%;top:0;width:2.2px;height:5.5px;margin-left:-1.1px;border-radius:2px;background:" + T.l + ";transform-origin:50% 10px;animation:wySkFade 1s linear infinite;}",
    "@keyframes wySkSh{to{transform:translateX(100%)}}@keyframes wySkFade{0%{opacity:1}100%{opacity:.15}}"
  ].join("\n");
  var spinner = ""; for (var i = 0; i < 12; i++) spinner += '<i style="transform:rotate(' + (i * 30) + 'deg);animation-delay:' + (-(11 - i) / 12) + 's"></i>';

  /* ---- last known layout: [{id, l, t, w, h, r, lines, kind}], captured by the bundle ---- */
  var snap = null;
  try { var raw = JSON.parse(localStorage.getItem("wy_skel") || "null"); if (raw && raw.v && raw.boxes && raw.boxes.length) snap = raw; } catch (e) {}
  function boxes() {
    var W = innerWidth, H = innerHeight;
    if (snap) {
      var sx = snap.vw ? W / snap.vw : 1, sy = snap.vh ? H / snap.vh : 1;
      return snap.boxes.map(function (b) {
        var l = b.l * sx, t = b.t * sy, w = b.w, h = b.h;                       /* position follows the viewport, size stays */
        if (b.ar) l = W - (snap.vw - b.l - b.w) - w;                            /* right-anchored panels stay on the right */
        if (b.ab) t = H - (snap.vh - b.t - b.h) - h;
        return { id: b.id, l: l, t: t, w: w, h: h, r: b.r, kind: b.kind, lines: b.lines };
      });
    }
    /* first ever start: a ghost of the default launcher, nothing else */
    var w = Math.min(380, W - 40), l = (W - w) / 2, t = Math.max(60, H * 0.28), o = [];
    o.push({ id: "mybox", l: l, t: t, w: w, h: 46, r: 16 });
    for (var k = 0; k < 6; k++) o.push({ id: null, l: l + (k % 2) * (w / 2 + 5), t: t + 58 + Math.floor(k / 2) * 66, w: w / 2 - 5, h: 58, r: 14, kind: "tile" });
    o.push({ id: null, l: l, t: t + 262, w: w, h: 54, r: 16, kind: "play" });
    return o;
  }
  var root = null, kills = [];
  function paint() {
    if (!document.documentElement || document.getElementById("wy-skel")) return;
    var st = document.createElement("style"); st.id = "wy-skel-css"; st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
    root = document.createElement("div"); root.id = "wy-skel";
    var html = '<div class="bg"></div><div class="brand">NTL VANCED<b>Loading</b></div>';
    boxes().forEach(function (b, n) {
      var cls = "k" + (b.kind === "play" ? " play" : "") + (b.kind === "round" ? " round" : "");
      var inner = "";
      if (b.kind === "play") inner = '<span class="ios" style="left:50%;top:50%;margin:-10px 0 0 -10px">' + spinner + "</span>";
      else if (b.lines) for (var q = 0; q < b.lines; q++) inner += '<span class="ln" style="top:' + (14 + q * 16) + "px;width:" + (b.w * (q % 3 === 0 ? 0.62 : q % 3 === 1 ? 0.44 : 0.53) | 0) + 'px"></span>';
      else if (b.kind === "tile") inner = '<span class="ln" style="left:14px;top:18px;width:22px;height:22px;border-radius:8px"></span><span class="ln" style="left:48px;top:19px;width:' + (b.w * 0.38 | 0) + 'px"></span><span class="ln" style="left:48px;top:35px;width:' + (b.w * 0.54 | 0) + 'px;height:6px"></span>';
      html += '<div class="' + cls + '" data-for="' + (b.id || "") + '" data-n="' + n + '" style="left:' + Math.round(b.l) + "px;top:" + Math.round(b.t) + "px;width:" + Math.round(b.w) + "px;height:" + Math.round(b.h) + "px" + (b.r ? ";border-radius:" + b.r + "px" : "") + '">' + inner + "</div>";
    });
    root.innerHTML = html;
    document.documentElement.appendChild(root);
  }
  function visible(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none"; }
  function fade(node) { if (!node || node.classList.contains("out")) return; node.classList.add("out"); setTimeout(function () { try { node.remove(); } catch (e) {} }, 300); }
  function removeAll() {
    var d = document.getElementById("wy-skel"); if (!d) return;
    Array.prototype.forEach.call(d.children, function (n) { n.classList.add("out"); n.style.opacity = 0; });
    setTimeout(function () { try { d.remove(); var s2 = document.getElementById("wy-skel-css"); if (s2) s2.remove(); } catch (e) {} }, 320);
    done = true;
  }
  function ready() { return document.documentElement && document.documentElement.hasAttribute("data-wy-ready"); }
  var t0 = Date.now(), done = false;
  var iv = setInterval(function () {
    if (done) { clearInterval(iv); return; }
    if (Date.now() - t0 > 15000) { clearInterval(iv); removeAll(); return; }
    if (document.body && !document.getElementById("wy-skel")) paint();        /* Chrome swaps the document root early on */
    var d = document.getElementById("wy-skel"); if (!d) return;
    /* each ghost goes as soon as the real thing is there */
    Array.prototype.forEach.call(d.querySelectorAll(".k[data-for]"), function (n) {
      var id = n.getAttribute("data-for"); if (!id) return;
      if (visible(document.getElementById(id))) fade(n);
    });
    if (ready()) { clearInterval(iv); setTimeout(removeAll, 120); }
  }, 100);
  if (document.body) paint();
})();
