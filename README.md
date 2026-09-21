<p align="center">
  <img src="icon128.png" width="96" alt="NTL VANCED">
</p>

<h1 align="center">NTL VANCED</h1>

<p align="center">
  A refined build of the NTL MOD for <a href="https://slither.io">slither.io</a> — desktop and Android, with over-the-air updates.<br>
  <sub>powered by wyrm</sub>
</p>

<p align="center">
  <a href="../../releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/disis-om/NTL-VANCED?label=stable&color=8058d0"></a>
  <a href="../../releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/disis-om/NTL-VANCED/total?color=3a7bd5"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-lightgrey"></a>
</p>

---

## Overview

NTL VANCED keeps everything the NTL MOD does — the bot, teams, tags, skins, key mapping — and adds a modern interface, phone-grade controls, a real chat, themes and a self-updating client. Nothing in the game protocol is changed; every NTL feature and service keeps working.

## Highlights

| | |
|---|---|
| **Interface** | Launcher home screen, themed NTL settings, post-round lobby, UI size and transparency controls, one consistent dark theme |
| **Themes** | Nine wallpapers plus your own image — the whole interface recolours from the picture; adjustable wallpaper blur |
| **Controls** | Revamp Keys with hold / toggle / tap modes, on-screen controls editor, arrow control with a skin gallery, aim cursor, Eyes Back, Center Eyes |
| **Gameplay** | Spine mode, performance mode, bot thinking overlay, diagnostics |
| **Chat** | Emoji, GIFs, stickers and memes in one picker, TEAM and GLOBAL tabs in one box |
| **Servers** | Server picker with search by id, IP or country, favourites and saved custom arenas |
| **Updates** | Stable and beta channels delivered in-game, with release notes and one-tap install |
| **Compatibility** | NTL 9.68 playerID support |

## Installation

1. Download the latest zip from **[Releases](../../releases/latest)** and unzip it.
2. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked** and select the folder.
   On Android (Kiwi, Lemur, Mises and other Chromium browsers with extension support) load the zip from the extensions page.
3. Disable any other NTL build — two mods on one page conflict.
4. Open slither.io.

Install once. Later versions arrive inside the game.

## Updates

The extension checks this repository on every start and every six hours (`updates/stable.json`, and `updates/beta.json` when the beta channel is enabled). A new version shows its release notes with an **UPDATE** button; the bundle is downloaded from jsDelivr, verified by SHA-256, stored locally and loaded on the next start.

- **Vanced › Updates & About** — check now, switch channels, return to the latest stable build (**STABLE**) or to the version shipped in the zip (**PACKAGED**).
- A build that fails to start is rolled back automatically.
- Changes to the extension itself (manifest, loader) require the new zip; the update notice links it.

## Repository

| Path | Contents |
|---|---|
| `manifest.json`, `preload.js`, `tinyscr.js`, `background.js` | extension shell and loader |
| `main-mt.js` | the mod bundle (NTL client plus the `NTL_*` modules) |
| `themes/` | wallpapers |
| `updates/` | update manifests and release notes |

## Credits

Built on **NTL MOD** by ntl-slither.com. Global chat and the arrow-control mechanism originate from **SlitherControl+**. GIFs, stickers and memes by **KLIPY**.

Developer: **Om Rajput** — [omrajput.in](https://www.omrajput.in)

## License

The NTL VANCED modules are released under the MIT License. The NTL game client remains the property of its authors.
