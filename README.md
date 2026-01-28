# Obsidian Eagle Image Organizer

This is a sample plugin for Obsidian, designed to integrate Obsidian with the Eagle software.

[eagle](https://eagle.cool) is a powerful attachment management software that allows for easy management of large quantities of images, videos, and audio materials, suitable for various scenarios such as collection, organization, and search. It supports Windows systems.

## Features Overview

This plugin includes the following functionalities:

- **Asset Insertion**: Search and insert Eagle assets directly in Obsidian.
- **Drag & Drop Upload**: Drag local images into notes to automatically upload them to Eagle.
- **Reverse Sync**: Automatically or manually update Eagle link titles in notes to match Eagle filenames.
- **Tag Synchronization**: Sync Eagle asset tags to Obsidian notes.
- **Asset Management**: Modify Eagle asset properties (name, tags, annotations, etc.) or move folders directly from Obsidian.
- **Multi-Library Support**: Configure multiple Eagle library paths to support multi-device synchronization environments.

[![GitHub stars](https://img.shields.io/github/stars/zyjGraphein/Obsidian-EagleBridge?style=flat&label=Stars)](https://github.com/zyjGraphein/Obsidian-EagleBridge/stargazers)
[![Total Downloads](https://img.shields.io/github/downloads/zyjGraphein/Obsidian-EagleBridge/total?style=flat&label=Total%20Downloads)](https://github.com/zyjGraphein/Obsidian-EagleBridge/releases)
[![GitHub Release](https://img.shields.io/github/v/release/zyjGraphein/Obsidian-EagleBridge?style=flat&label=Release)](https://github.com/zyjGraphein/Obsidian-EagleBridge/releases/latest)

## Initial Setup Instructions

1.  **Configure Eagle Libraries**:
    - Go to plugin settings and click **+** to add a library.
    - Enter a library name and provide the absolute path to the Eagle library folder (ending in `.library`) in **Library Paths**.
    - You can add multiple paths for the same library to handle drive letter differences across computers.
    - Click the checkmark icon next to the library name to set it as active.

2.  **Configure Listening Port**:
    - Default is `6060`. Ensure it does not conflict with other services (Eagle currently does not support custom API ports, so keeping the default is recommended).

After configuration, it is recommended to restart Obsidian to ensure the service starts correctly.

## Core Features Showcase

### Search and Insert Eagle Assets

Run `Insert Image From Eagle` via Command Palette (hotkey recommended):

- **Multi-keyword Search**: Support space-separated keywords.
- **Folder Filters**: Configure frequently used folders in settings for quick filtering.
- **Keyboard Navigation**: `↑` `↓` to select, `Enter` to insert.

### Upload Local Files to Eagle

- Drag or paste local images into Obsidian notes; the plugin automatically uploads them to Eagle and generates a preview link.
- You can specify a target **Folder ID** in settings.

### Reverse Sync

- Enable `Reverse Sync on Open` to automatically update link titles when opening notes.
- Or manually run the `Reverse Sync Eagle Links in Current File` command.

## Folder-related Settings

The plugin provides three types of folder configurations in settings:

- **Incoming Target Folder**
    - Specifies the default folder ID in Eagle for files uploaded from Obsidian.

- **Project Folder Roots**
    - Roots for managing asset moves.
    - Subfolders under these roots will appear as options in the "Manage Folders" context menu, facilitating quick asset classification.

- **Folder Filters**
    - Provides filter tabs for the "Insert Image From Eagle" search window.
    - Configured folders appear as tabs at the top of the search window; clicking one restricts search to that folder (and its subfolders).

## Installation Instructions

### Install via BRAT

Add `https://github.com/zyjGraphein/Obsidian-Eagle-Image-Organizer` to [BRAT](https://github.com/TfTHacker/obsidian42-brat).

### Manual Installation

Visit the latest release page, download `main.js`, `manifest.json`, and `style.css`, and place them into `<your_vault>/.obsidian/plugins/Obsidian-Eagle-Image-Organizer/`.

## Usage Guide

- Text Tutorial ([中文](doc/TutorialZH.md) / [EN](doc/Tutorial.md))
- Video Tutorial ([Obsidian EagleBridge -bilibili](https://www.bilibili.com/video/BV1voQsYaE5W/?share_source=copy_web&vd_source=491bedf306ddb53a3baa114332c02b93))

## Notes

- Eagle must be running in the background when using this plugin.
- If Eagle is not running, images may not preview, and upload/management features will fail.
- Images are visible in exported PDFs, but dynamic links (video/audio) will not be accessible outside the local environment.

## Credits

- Built on [Eagle API](https://api.eagle.cool).
- Inspired by [AttachFlow](https://github.com/Yaozhuwa/AttachFlow) (Context menu/Zoom) and [auto-embed](https://github.com/GnoxNahte/obsidian-auto-embed) (Embedded preview).

## License

[GNU GPL v3](https://github.com/zyjGraphein/Obsidian-Eagle-Image-Organizer/blob/master/LICENSE)

## Support

If you like this plugin, you can buy me a coffee!

<img src="assets/coffee.png" width="400">
