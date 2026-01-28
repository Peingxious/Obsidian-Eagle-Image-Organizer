# Obsidian Eagle Image Organizer 使用教程

本插件旨在无缝连接 Obsidian 与 Eagle 素材库，支持图片、视频、音频等多种格式的快速插入、管理与同步。

## 1. 基础配置

### 1.1 连接 Eagle 库

插件支持管理多个 Eagle 库，并能够处理同一库在不同设备（如 Windows/Mac 或不同盘符）上的路径差异。

1. 打开插件设置页面的 **Eagle Libraries** 部分。
2. 点击 **+** 添加一个库。
3. 输入 **Library Name**（库名称）。
4. 在 **Library Paths** 中输入 Eagle 库文件夹的绝对路径（以 `.library` 结尾的文件夹）。
    - 如果您在多台设备上同步使用，可以为同一个库添加多个路径（例如家中电脑是 `D:\Eagle\MyLib.library`，公司电脑是 `E:\Assets\MyLib.library`），插件会自动识别当前设备有效的路径。
5. 点击库名称旁的 **对勾图标** 将其设为当前活动库。

### 1.2 服务端口

插件会在本地启动一个服务器用于传输 Eagle 图片。

- **端口号**：默认为 `6060`。如果该端口被占用，请在设置中修改并在 Eagle 软件中保持一致（目前 Eagle 尚不支持自定义端口，通常只需保持插件默认即可）。

## 2. 核心功能

### 2.1 插入素材 (Insert Image from Eagle)

无需打开 Eagle，直接在 Obsidian 中搜索并插入素材。

- **操作**：
    1. 在命令面板 (`Ctrl/Cmd + P`) 中输入 `Insert Image From Eagle`。
    2. 在弹出的搜索框中输入关键词。
    3. 使用上下键选择素材，按 `Enter` 插入。
- **文件夹筛选**：
    - 在设置中配置 **Folder Filters**，添加您常用的 Eagle 文件夹。
    - 在插入模态框中，可以快速筛选特定文件夹的内容。

### 2.2 拖拽与粘贴

- **从 Eagle 到 Obsidian**：直接从 Eagle 软件中拖拽图片或复制图片链接粘贴到 Obsidian 笔记中。插件会自动生成形如 `![标题](http://localhost:6060/...)` 的链接，支持实时预览。
- **从本地到 Eagle**：将本地图片拖拽或粘贴到笔记中，插件会自动将其上传到 Eagle 库，并替换为 Eagle 链接。
    - **上传设置**：可在设置中指定上传的目标文件夹 (`Folder ID`)。

### 2.3 反向同步 (Reverse Sync)

确保 Obsidian 中的链接标题与 Eagle 中的实际文件名保持一致。

- **自动同步**：在设置中开启 `Reverse Sync on Open`。每次打开笔记时，插件会自动检查并更新链接标题。
- **手动同步**：运行命令 `Reverse Sync Eagle Links in Current File`，手动刷新当前文档的链接标题。

### 2.4 标签同步

将 Eagle 素材的标签同步到 Obsidian 笔记的 YAML Frontmatter 或内容中。

- **操作**：运行命令 `Synchronized Page Tabs`。

## 3. 图片查看与管理

### 3.1 图片右键菜单

在预览模式或编辑模式下，右键点击 Eagle 图片链接，可访问丰富的功能：

- **Open in Eagle**：在 Eagle 软件中定位并选中该素材。
- **Modify Properties**：直接修改素材的名称、注释、URL 和标签。
- **Manage Folders**：将素材移动到其他 Eagle 文件夹。
- **Copy Markdown Link**：复制标准 Markdown 链接。

### 3.2 图片缩放与预览

- **点击预览**：点击图片可查看大图（支持滚轮缩放）。
- **尺寸控制**：
    - **Adaptive Ratio**：设置图片相对于窗口宽度的自适应比例（0.1 - 1.0）。
    - **Image Size**：设置图片的默认固定宽度（像素），留空则使用自适应比例。

## 4. 高级设置

- **Open in Obsidian 方式**：设置在 Obsidian 中打开素材链接时的行为（新标签页、弹窗或右侧窗格）。
- **Website Upload**：开启后，粘贴的 URL 图片也会被上传到 Eagle（默认关闭，仅上传本地文件）。
- **Debug Mode**：开发者调试模式，开启后会在控制台输出详细日志。

---

_注意：本插件依赖本地 Eagle 软件运行，请确保 Eagle 处于开启状态。_
