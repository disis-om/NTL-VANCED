/* isolated-world injection tests, evaluated by e2e_probe.js — each returns a string */
module.exports = {
  T1_small_ext_sourceURL: function () {
    var t = document.createElement("script"); t.textContent = "window.__t1=1\n//# sourceURL=chrome-extension://abc/x.js"; document.documentElement.appendChild(t); return "ok";
  },
  T2_small_http_sourceURL: function () {
    var t = document.createElement("script"); t.textContent = "window.__t2=1\n//# sourceURL=http://slither.io/ota.js"; document.documentElement.appendChild(t); return "ok";
  },
  T3_big_no_sourceURL: function () {
    var big = Array.prototype.find.call(document.scripts, function (x) { return x.textContent.length > 1e6; });
    var code = big.textContent; var i = code.lastIndexOf("\n//# sourceURL="); if (i > 0) code = code.slice(0, i);
    var t = document.createElement("script"); t.textContent = code; document.documentElement.appendChild(t); return String(code.length);
  }
};
