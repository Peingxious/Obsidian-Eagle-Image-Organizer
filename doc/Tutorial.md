# Obsidian Eagle Image Organizer User Guide

This plugin seamlessly connects Obsidian with your Eagle library, supporting fast insertion, management, and synchronization of images, videos, audio, and more.

## 1. Basic Configuration

### 1.1 Connecting Eagle Libraries

The plugin supports managing multiple Eagle libraries and handles path differences for the same library across different devices (e.g., Windows/Mac or different drives).

1. Go to the **Eagle Libraries** section in the plugin settings.
2. Click **+** to add a library.
3. Enter a **Library Name**.
4. In **Library Paths**, enter the absolute path to the Eagle library folder (the folder ending in `.library`).
    - If you sync your library across multiple devices, you can add multiple paths for the same library (e.g., `D:\Eagle\MyLib.library` on your home PC and `E:\Assets\MyLib.library` on your work PC). The plugin will automatically detect and use the valid path for the current device.
5. Click the **checkmark icon** next to the library name to set it as the currently active library.

### 1.2 Server Port

The plugin starts a local server to serve Eagle images.

- **Port**: Default is `6060`. If this port is already in use, you can change it in the settings. (Note: Eagle itself does not yet support custom ports for its API, so it is usually best to keep the plugin default if possible).

## 2. Core Features

### 2.1 Insert Image from Eagle

Search for and insert assets directly within Obsidian without needing to open the Eagle app.

- **Usage**:
    1. Open the Command Palette (`Ctrl/Cmd + P`) and type `Insert Image From Eagle`.
    2. Enter keywords in the search box.
    3. Use the Up/Down arrow keys to select an asset and press `Enter` to insert it.
- **Folder Filters**:
    - Configure **Folder Filters** in the settings to add your frequently used Eagle folders.
    - In the insert modal, you can quickly filter the search results by these folders.

### 2.2 Drag & Drop / Paste

- **From Eagle to Obsidian**: Drag images or copy image links from Eagle and paste them into your Obsidian notes. The plugin automatically generates links like `![Title](http://localhost:6060/...)` for real-time preview.
- **From Local to Eagle**: Drag or paste local images into a note. The plugin automatically uploads them to your Eagle library and replaces them with Eagle links.
    - **Upload Settings**: You can specify a target **Folder ID** in the settings for these uploads.

### 2.3 Reverse Sync

Ensures that the link titles in Obsidian match the actual filenames in Eagle.

- **Auto Sync**: Enable `Reverse Sync on Open` in the settings. The plugin will check and update link titles every time you open a note.
- **Manual Sync**: Run the command `Reverse Sync Eagle Links in Current File` to manually refresh the links in the current document.

### 2.4 Tag Synchronization

Sync Eagle asset tags to your Obsidian note's YAML Frontmatter or content.

- **Usage**: Run the command `Synchronized Page Tabs`.

## 3. Image Viewing & Management

### 3.1 Context Menu

Right-click on an Eagle image link (in Preview or Editor mode) to access a variety of features:

- **Open in Eagle**: Locate and select the asset in the Eagle app.
- **Modify Properties**: Edit the asset's name, annotation, URL, and tags.
- **Manage Folders**: Move the asset to other Eagle folders.
- **Copy Markdown Link**: Copy the standard Markdown link for the asset.

### 3.2 Zoom & Preview

- **Click to Preview**: Click an image to view it in full size (supports zoom with scroll wheel).
- **Size Control**:
    - **Adaptive Ratio**: Set the image width relative to the window width (0.1 - 1.0).
    - **Image Size**: Set a fixed default width (in pixels). If left empty, the adaptive ratio is used.

## 4. Advanced Settings

- **Open in Obsidian**: Choose how asset links open in Obsidian (New Page, Popup, or Right Pane).
- **Website Upload**: If enabled, pasted URL images will also be uploaded to Eagle (default is off, only local files are uploaded).
- **Debug Mode**: Enable this for developer debugging (outputs detailed logs to the console).

---

_Note: This plugin requires the Eagle application to be running locally._
