# HANDOFF — OTA updater (18 Sep 2026, evening)

## Where things are
- Repo **github.com/disis-om/NTL-VANCED** = the mod folder `Desktop\wyrm\NTL EyesBack Mod` (git, branch `main`). Releases so far: **v5.47** (stable), **v5.48** (stable, current `updates/stable.json`), **v5.49-beta** (beta, current `updates/beta.json`).
- **v5.50 released (stable)** with loader v3 — OTA verified end-to-end. Anyone on ≤5.49 must install the 5.50 zip once (`minLoader: 3`); after that everything is OTA.
- `tools/release.js` (stable) / `--beta` does everything (updates json, zip via `tools/mkzip.ps1`, commit, tag, push, GitHub release). Zips land in `Desktop\wyrm`.

## How the updater works (short)
- `tinyscr.js` = loader. `wyrmPick()` reads `chrome.storage.local.wyrm_bundle {version, code, sha256}`; if present injects `code` as an inline `<script>` (page world) instead of the packaged `main-mt.js`; writes `localStorage wyrmversion / wyrmsource(ota|packaged) / wyrmpackaged / wyrmloader`.
- Rollback: loader sets `wyrm_boot=version` before injecting; the bundle's `NTL_UP` sets `wyrm_boot_ok=version` 1.5 s after it ran. Next load: boot set but ok missing → bundle deleted, packaged runs, `wyrmrolledback` toast.
- `NTL_UP` (module in main-mt.js, before WHAT'S NEW): checks `raw.githubusercontent.com/disis-om/NTL-VANCED/main/updates/{stable,beta}.json`, popup with notes, UPDATE → download (jsDelivr `@v<ver>/main-mt.js`, raw fallback) → SHA-256 (crypto.subtle **or the JS fallback — slither.io is http, no SubtleCrypto**) → `ntlStorageSet {wyrm_bundle}` via `chrome.runtime.sendMessage(FA, …)` → reload. Vanced › **Updates & About** section: CHECK NOW / UPDATE / STABLE / PACKAGED, Beta switch.

## SOLVED (18 Sep, late): OTA bundle did not boot
**Cause:** in MV3 the content-script world carries the extension's CSP (`script-src 'self' …`), so an inline `<script>` created by `tinyscr.js` is blocked (CDP log: "Executing inline script violates … script-src 'self'"); a CDP-made isolated world has no CSP, which is why harness injection worked. **Fix (loader v3):** park the bundle in `<script type=text/plain id=wyrm-ota-src>` and load `ota-boot.js` (extension URL = allowed by `'self'`, web-accessible), which `eval`s it in the page world under the page's (absent) CSP, with an error catcher. Verified with `tools/e2e_ota.js` (Chrome for Testing + real GitHub): install → reload → `src=ota`, launcher built, `wyrm_boot_ok` set. 5.50 ships as a zip (`MIN_LOADER=3`).

## Original bug notes
Owner on **5.48** (desktop Chrome, also SlitherControl+ installed) turned Beta on → popup → UPDATE → "Installed — reloading" → after reload the page is **blank** (only the SlitherControl+ bar, no NTL launcher) → Ctrl+R → loader rolled back → 5.48 packaged runs again. So the **OTA bundle does not execute** on his machine.
Facts established:
- The 5.49-beta bundle from jsDelivr **parses and runs** when injected inline from page context (`tools/harness/inj_test.html`: parse OK, modules defined; fails only at jQuery which the real page provides). Hash matches. No CSP on slither.io / slither.com/io.
- Rollback happened ⇒ `wyrm_boot_ok` was never set ⇒ the bundle never ran far enough to define/boot `NTL_UP` (a parse error, an early throw, or the inline script never executed in the page world from the content-script-created element).
- Suspects not yet excluded: (1) the 7.9 MB string being corrupted/truncated on its way page → `chrome.runtime.sendMessage` → background → `chrome.storage.local` → content script (`u()`); (2) inline `<script>` created by the content script with a 7.9 MB `textContent`; (3) something in the owner's other extension (SlitherControl+) interfering.
- 5.50 (unreleased, in the working copy) adds: page-world error catcher (`localStorage.wyrm_err`), a 6 s **watchdog** in the loader (no `#login`/`#mybox` → drop bundle, `wyrmrolledback` with the error text, auto-reload), and a `new Function(code)` parse check + "contains `var NTL_UP`" check before storing. **Ship 5.50 as a zip, have the owner retry the beta update; the toast will now say what went wrong** (`wyrmrolledback` text is shown by `NTL_UP.boot()`).
- `tools/e2e_ota.js` = attempt to reproduce in headless Chrome for Testing (`tools/cft/…/chrome.exe`, downloaded) with `--load-extension`. Branded Chrome 152 ignores `--load-extension`; with Chrome for Testing the CDP `Runtime.evaluate` calls returned `undefined` (script needs debugging: target selection / evaluate result shape). Finishing that harness would let us reproduce without the owner.
- Likely fix if (1) is confirmed: chunk the bundle into ≤1 MB pieces in storage (`wyrm_bundle_0..n`) and join in the loader; if (2): inject via `t.src = URL.createObjectURL(new Blob([code]))` created **in the page world** (post the code to the page via `window.postMessage` and let a small inline bootstrap build the blob URL), or via `chrome.scripting.executeScript({world:"MAIN"})` from the background (needs `scripting` permission).

## Files touched today
`tinyscr.js` (loader v1→v2), `main-mt.js` (`NTL_UP`, Vanced section, SHA-256 JS, parse check), `tools/release.js`, `tools/mkzip.ps1` (repo-aware, exclusions), `updates/*.json`, `README.md`, `.gitignore`, `.gitattributes` (`* -text`), `WYRM-MOD-NOTES.md` §3.6ab, `tools/e2e_ota.js`, `tools/harness/{up_test,inj_test}.html`.

## Later on 18 Sep (after the OTA fix) — all released, all verified
- **5.52–5.56**: every-start update check (stable + beta), popup returns until installed (no snooze), two manifest mirrors (raw + jsDelivr, newest wins) + jsDelivr purge in `release.js`, a check requested during a running check is queued (Beta toggle right after start). 5.55-beta / 5.56 stable were the owner's channel tests — passed.
- **5.57-beta → 5.58 stable**: arrow-control touch layer `#wy-arcap` (z 118, mobile, only while a round runs) so panels never eat steering touches; roster solo-dot (NTL `h3/I3`) via delegated hover/tap in `NTL_TP`; **Content transparency** slider (`--wy-fg-a`, `wy_fg_a`) next to Panel transparency.
- **5.58–5.59**: server picker search on touch (stop touch events at `#sv-box`/`#sv-search`, focus on touchend) + search by id/`#id`/ip/country code/country name (`CN` map, code from NTL `R9` via the flag cell's `data-srv-flag`). **5.59 real fix:** hidden rows stayed visible because `#sv-body #select-srv-body > div{display:grid!important}` (2 ids) beat `#sv-body .sv-hide`; hide rule now `#sv-body #select-srv-body > div.sv-hide …`. Verified with `tools/e2e_sv.js` (real Chrome for Testing + extension).
- **Rule learned:** harness pages lie about NTL's real DOM/CSS — for anything touching NTL's own elements, verify with the Chrome-for-Testing e2e scripts (`tools/e2e_*.js`, binary in `tools/cft/`, ignored by git).
- Chrome's extensions page shows the **zip's** manifest version (e.g. 5.50) — it cannot follow OTA; the running version is in Vanced / the HUD.

## 19 Sep — 5.60 stable: release notes come from GitHub
- **Write notes in `updates/notes/<ver>.md`** (GitHub-flavoured markdown: images, video URLs, tables, code, nested/ordered/task lists, inline HTML). `tools/release.js` uses that file as the GitHub release body *and* as `notes` in `updates/<channel>.json`. `NTL_WN.NOTES[...]` is now only a fallback for old versions — stop adding to it.
- `NTL_WN.loadNotes(ver)`: GitHub API `releases/tags/v<ver>` body → raw `updates/notes/<ver>.md` → jsDelivr → built-in `NOTES`; cached 1 h in `localStorage.wy_wn_md`. The What's new popup opens with a spinner and fills when the notes arrive; foot has "View on GitHub". Update popup (`#up-body`) renders the json `notes` with the same renderer (`.wy-md` class, CSS in `NTL_WN`, injected at load).
- Renderer = `NTL_WN.md()`; whitelisted inline HTML only, `on*=` / `javascript:` stripped. Bare `github.com/user-attachments/assets/…` URL on its own line = video; `![]()` = always image.
- Arrow control: `#ar-line` canvas in `#wy-ar` draws NTL's assist (`xe`) from head to arrow while the finger is down and the arrow is visible.
- Verify with `node tools/e2e_wn.js <released version>` (real Chrome for Testing; binary at `Desktop\wyrm\tools\cft`).
