# Obsidian Eagle Image Organizer

This is a plugin for Obsidian that allows you to connect to Eagle, enabling you to easily insert and manage Eagle assets (images/videos/audio, etc.) in your notes, and supports workflows like uploading, reverse syncing, and tag syncing.

[Eagle](https://eagle.cool) is a powerful digital asset management tool for organizing and searching large collections of images, videos, and audio.

## Features Overview

- **Asset Insertion**: Search and insert Eagle assets directly within Obsidian.
- **Drag & Drop / Paste Upload**: Drag or paste local images into notes to automatically upload them to Eagle.
- **Reverse Sync**: Automatically or manually update Eagle link titles in notes to match the actual Eagle filenames.
- **Tag Sync**: Sync YAML tags from the current note to the linked Eagle items.
- **Asset Management**: Modify Eagle asset properties (name, tags, comments, etc.) or move them to folders via the right-click menu.
- **Multi-Library Support**: Configure multiple Eagle library paths for compatibility across different devices.

[![GitHub stars](https://img.shields.io/github/stars/zyjGraphein/Obsidian-EagleBridge?style=flat&label=Stars)](https://github.com/zyjGraphein/Obsidian-EagleBridge/stargazers)
[![Total Downloads](https://img.shields.io/github/downloads/zyjGraphein/Obsidian-EagleBridge/total?style=flat&label=Total%20Downloads)](https://github.com/zyjGraphein/Obsidian-EagleBridge/releases)
[![GitHub Release](https://img.shields.io/github/v/release/zyjGraphein/Obsidian-EagleBridge?style=flat&label=Release)](https://github.com/zyjGraphein/Obsidian-EagleBridge/releases/latest)

## Setup

1. **Configure Eagle Library**
   - Open plugin settings, click **+** to add a library.
   - Enter the absolute path of your Eagle library (folder ending in `.library`) in **Library Paths**.
   - You can add multiple paths for the same library (for different drive letters on different devices).
   - Click the checkmark icon next to the library name to set it as active.

2. **Configure Port**
   - Default port is `6060`; ensure it doesn't conflict with other services.
   - Recommended to restart Obsidian after configuration to ensure the local server starts correctly.

## Core Functions

### Search and Insert Eagle Assets
- Run `Insert Image From Eagle` from the Command Palette (setting a hotkey is recommended).
- Supports multi-keyword search (space-separated).
- Supports folder filtering and keyboard navigation.

### Upload Local Files to Eagle
- Drag or paste local images into Obsidian; they will be automatically uploaded to Eagle and a preview link will be generated.
- You can specify the **Folder ID** for uploads in the settings.

### Reverse Sync
- Enable `Reverse Sync on Open` to automatically update Eagle link titles to actual filenames when opening a note.
- Or manually run the `Reverse Sync Eagle Links in Current File` command.

## Installation

### Via BRAT
- Add `https://github.com/zyjGraphein/Obsidian-Eagle-Image-Organizer` to [BRAT](https://github.com/TfTHacker/obsidian42-brat).

### Manual Installation
- Download `main.js`, `manifest.json`, and `style.css` from the latest Release page and place them in `<your_vault>/.obsidian/plugins/Obsidian-Eagle-Image-Organizer/`.

## Usage Guide

- Tutorials: [English](doc/Tutorial.md) / [Chinese](doc/TutorialZH.md)
- Video: [Obsidian EagleBridge - bilibili](https://www.bilibili.com/video/BV1voQsYaE5W/?share_source=copy_web&vd_source=491bedf306ddb53a3baa114332c02b93)

## Support

If you like this plugin, consider buying me a coffee!

## Changelog

### 0.3.8
- Fix: Fixed an issue where Notices were not displaying in newer versions.
- Improvement: Optimized i18n language detection logic.
- Improvement: Command names in the Command Palette now support English/Chinese localization.
- Fix: Enhanced error handling stability for paste and drag-and-drop operations.
