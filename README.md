<p align="center">
  <img src="icon128.png" width="96" alt="NTL VANCED">
</p>

<h1 align="center">NTL VANCED</h1>
<p align="center"><b>powered by wyrm</b></p>
<p align="center">A refined build of the NTL MOD for <a href="https://slither.io">slither.io</a> — desktop & Android, with over-the-air updates.</p>

<p align="center">
  Developer — <b>OM RAJPUT</b> · <a href="https://www.omrajput.in">https://www.omrajput.in</a>
</p>

---

## Install (once)

1. Download the latest zip from **[Releases](../../releases/latest)**.
2. Chrome / Edge / Brave (desktop): `chrome://extensions` → Developer mode → **Load unpacked** (unzip first) — or drag the zip in.
   Android (Kiwi, Lemur, Mises …): extensions page → load from the zip.
3. Disable the store version of NTL if you have it — two mods on one page clash.
4. Open slither.io.

After that you never reinstall: **updates arrive inside the game** (see below).

## Updates

The extension is a small loader. The mod itself (`main-mt.js`) is fetched from this repo and cached in the browser:

- On the home screen it checks `updates/stable.json` (every 6 h, or **Vanced › General › Updates › CHECK NOW**).
- A new version shows its release notes with an **UPDATE** button. Tap → download from jsDelivr → SHA-256 verified → stored → reload. Done.
- **Beta updates**: switch it on in Vanced › General › Updates to get `updates/beta.json` builds first. **STABLE** puts you back on the latest stable release any time; **PACKAGED** drops the OTA bundle and runs the version that shipped in the zip.
- If a bundle fails to start, the loader rolls back to the previous one automatically.
- Releases that change the extension itself (manifest, loader) can't be applied over the air — the popup links the new zip instead.

## Features

Eyes Back · Center Eyes · Spine mode · Performance mode · bot thinking overlay · Revamp Keys with hold / toggle / tap modes · on-screen controls editor · arrow control with a skin gallery · aim cursor skins · one chat picker (emoji, GIF, stickers, memes) · TEAM | GLOBAL chat tabs · premium launcher, server picker with saved arenas, team map, live Battledome preview · Vanced settings with UI size, panel transparency, changelog and What's new.

Full developer notes: [`WYRM-MOD-NOTES.md`](WYRM-MOD-NOTES.md).

## Repo layout

| Path | What |
|---|---|
| `manifest.json`, `tinyscr.js` (loader), `background.js`, `main-mt.js` (the mod bundle), assets | the extension — this is exactly what the zip contains |
| `updates/stable.json`, `updates/beta.json` | what the extension polls: version, sha256, download URLs, release notes |
| `tools/release.js` | one command per release: manifest, zip, tag, push, GitHub release |
| `tools/mkzip.ps1` | builds a spec-correct zip (forward-slash entries; `Compress-Archive` breaks Android loaders) |

## Release (maintainers)

```bash
node tools/release.js          # stable
node tools/release.js --beta   # beta channel only
```

Bump `version_name` in `manifest.json`, add the changelog line and (for ship builds) `NTL_WN.NOTES[version]` first.

## Credits

Built on **NTL MOD** by ntl-slither.com. Global chat room and arrow-control mechanism from **SlitherControl+** (not an NTL or NTL VANCED service). GIFs, stickers and memes by **KLIPY**. Live arena data by **Wyrm**.

## License

The mod's own code (everything under the `NTL_*` modules and `tools/`) — MIT. The NTL game client remains the property of its authors.
