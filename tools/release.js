#!/usr/bin/env node
/* NTL VANCED release — run from the repo root:
     node tools/release.js            → stable release of manifest.version_name
     node tools/release.js --beta     → beta release (updates/beta.json only)
     node tools/release.js --dry      → show what would happen, touch nothing
   Steps: syntax check → sha256/size of main-mt.js → release notes (NTL_WN.NOTES[ver]
   or the top CHANGELOG line) → write updates/<channel>.json → build the zip
   (tools/mkzip.ps1) → git commit + tag v<ver> → push (branch + tag) → GitHub
   release with the zip attached. The extension fetches updates/<channel>.json
   from the main branch and the bundle from jsDelivr at the tag (raw.github as
   fallback), so a release is live the moment the push lands. */
const fs = require("fs"), path = require("path"), cp = require("child_process"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, ".."), REPO = "disis-om/NTL-VANCED", MIN_LOADER = 3;
const args = process.argv.slice(2), beta = args.includes("--beta"), dry = args.includes("--dry");
function sh(cmd, opts) { console.log("  $ " + cmd); if (dry) return ""; return cp.execSync(cmd, Object.assign({ cwd: ROOT, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" }, opts || {})).trim(); }

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const ver = manifest.version_name, tag = "v" + ver, channel = beta ? "beta" : "stable";
if (!ver) throw new Error("manifest.version_name missing");
console.log("release " + tag + " (" + channel + ")");

/* 1. bundle */
const bundlePath = path.join(ROOT, "main-mt.js");
cp.execSync("node --check \"" + bundlePath + "\"", { stdio: "inherit" });
const buf = fs.readFileSync(bundlePath), sha = crypto.createHash("sha256").update(buf).digest("hex");
console.log("  main-mt.js " + (buf.length / 1048576).toFixed(2) + " MB sha256 " + sha.slice(0, 16) + "…");

/* 2. notes: updates/notes/<ver>.md, else NTL_WN.NOTES[ver], else the top changelog line */
const src = buf.toString("utf8");
let notes = "";
{
  const nf = path.join(ROOT, "updates", "notes", ver + ".md");   // preferred: updates/notes/<ver>.md = the GitHub release body
  if (fs.existsSync(nf)) notes = fs.readFileSync(nf, "utf8").trim() + "\n";
  const m = new RegExp('"' + ver.replace(/\./g, "\\.") + '": (".*?")(?=,\\n|\\n  \\})', "s").exec(src.slice(src.indexOf("var NOTES = {"), src.indexOf("var NOTES = {") + 200000));
  if (m) { try { notes = JSON.parse(m[1]); } catch (e) {} }
  if (!notes) { const c = /\{ v: "([^"]+)", d: "([^"]+)", t: "((?:[^"\\]|\\.)*)" \}/.exec(src.slice(src.indexOf("var CHANGELOG = ["))); if (c && c[1] === ver) notes = "# v" + ver + "\n" + JSON.parse('"' + c[3] + '"'); }
  if (!notes) notes = "# v" + ver + "\nSee the changelog in Vanced › Changelog.";
}

/* 3. update manifest */
const info = {
  version: ver, channel: channel, date: new Date().toISOString().slice(0, 10), size: buf.length, sha256: sha, minLoader: MIN_LOADER,
  url: "https://cdn.jsdelivr.net/gh/" + REPO + "@" + tag + "/main-mt.js",
  fallbackUrl: "https://raw.githubusercontent.com/" + REPO + "/" + tag + "/main-mt.js",
  zip: "https://github.com/" + REPO + "/releases/download/" + tag + "/NTL-VANCED-" + tag + ".zip",
  notes: notes
};
const upDir = path.join(ROOT, "updates"); if (!fs.existsSync(upDir)) fs.mkdirSync(upDir);
const upFile = path.join(upDir, channel + ".json");
console.log("  write updates/" + channel + ".json");
if (!dry) fs.writeFileSync(upFile, JSON.stringify(info, null, 2) + "\n");
if (!beta) {   // a stable release supersedes an older beta manifest
  const bf = path.join(upDir, "beta.json");
  try { const b = JSON.parse(fs.readFileSync(bf, "utf8")); if (num(b.version) < num(ver) && !dry) fs.writeFileSync(bf, JSON.stringify(info, null, 2) + "\n"); } catch (e) {}
}
function num(v) { const p = String(v || "0").split(/[.\-]/); return (+p[0] || 0) * 1e6 + (+p[1] || 0) * 1e3 + (+p[2] || 0); }

/* 4. zip */
const zipOut = path.join(path.dirname(ROOT), "NTL-VANCED-" + tag + ".zip");
sh("powershell -NoProfile -ExecutionPolicy Bypass -File \"" + path.join(ROOT, "tools", "mkzip.ps1") + "\" -Out \"" + zipOut + "\"");

/* 5. git + GitHub */
sh("git add -A");
sh("git commit -m \"release " + tag + " (" + channel + ")\" --allow-empty");
sh("git tag -f " + tag);
sh("git push origin HEAD:main");
sh("git push -f origin " + tag);
const notesFile = path.join(require("os").tmpdir(), "ntlv-notes-" + ver + ".md");
if (!dry) fs.writeFileSync(notesFile, notes);
sh("gh release create " + tag + " \"" + zipOut + "\" --title \"NTL VANCED " + tag + (beta ? " (beta)" : "") + "\" --notes-file \"" + notesFile + "\"" + (beta ? " --prerelease" : " --latest") + " --repo " + REPO + " || gh release upload " + tag + " \"" + zipOut + "\" --clobber --repo " + REPO);
/* 6. jsDelivr purge so the @main manifests refresh at once */
if (!dry) { const https = require("https"); for (const p of ["updates/stable.json", "updates/beta.json", "../" + tag + "/main-mt.js"]) https.get(("https://purge.jsdelivr.net/gh/" + REPO + "@main/" + p).replace("@main/../", "@"), res => { console.log("  purge " + p + " → " + res.statusCode); res.resume(); }).on("error", () => {}); }
setTimeout(() => console.log("done: " + tag + " → " + channel + " · " + info.url), 1500);
