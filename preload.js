/* NTL VANCED — runs at document_start (before slither's own HTML is parsed).
   Preloads the big extension files so their disk read / compile overlaps slither's own page load instead of starting
   after window.load (main-mt.js only when no OTA bundle is stored — an OTA bundle comes from chrome.storage instead).
   Nothing is drawn here: the loading ghosts were removed on 22 Sep 2026 (kept in tools/modules/preload_with_skeleton.js). */
(function () {
  var url = function (f) { return chrome.runtime.getURL(f); };
  function link(rel, as, href) { try { var l = document.createElement("link"); l.rel = rel; if (as) l.as = as; l.href = href; (document.head || document.documentElement).appendChild(l); } catch (e) {} }
  link("preload", "style", url("bootstrap.css"));
  ["jquery-2.2.4.min.js", "fstags.js", "emoji-data.js"].forEach(function (f) { link("preload", "script", url(f)); });
  try { chrome.storage.local.get(["wyrm_bundle"], function (st) { if (!(st && st.wyrm_bundle && st.wyrm_bundle.code)) link("preload", "script", url("main-mt.js")); }); } catch (e) { link("preload", "script", url("main-mt.js")); }
  try { localStorage.removeItem("wy_skel"); } catch (e) {}   /* drop the layout snapshot older builds stored */
})();
