/* NTL VANCED OTA boot — runs as an extension-URL script (allowed by the content-script CSP) in the page world:
   takes the OTA bundle text the loader parked in #wyrm-ota-src (type=text/plain, never executed by the browser),
   installs an error catcher for the loader's watchdog, and evaluates the bundle under the page's CSP (slither.io has none). */
(function () {
  var el = document.getElementById("wyrm-ota-src"); if (!el) return;
  var code = el.textContent, ver = el.getAttribute("data-ver") || "", ext = el.getAttribute("data-ext") || ""; el.parentNode.removeChild(el);
  try { localStorage.removeItem("wyrm_err"); } catch (e) {}
  window.addEventListener("error", function (e) { try { if (!localStorage.getItem("wyrm_err")) localStorage.setItem("wyrm_err", (e && e.message || "") + " @" + (e && e.lineno || 0) + ":" + (e && e.colno || 0)); } catch (x) {} }, true);
  try { (0, eval)(code + "\n//# sourceURL=chrome-extension://" + ext + "/main-mt.js?ota=" + ver); }
  catch (e) { try { localStorage.setItem("wyrm_err", "boot: " + (e && e.message || e)); } catch (x) {} }
})();
