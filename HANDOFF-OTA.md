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
