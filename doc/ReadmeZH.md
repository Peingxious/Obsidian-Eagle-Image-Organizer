# Obsidian Eagle Image Organizer

这是一个用于 Obsidian 的示例插件，主要用于连接 Obsidian 与 Eagle 软件。

[eagle](https://eagle.cool) 是一款强大的附件管理软件，可以轻松管理大量图片、视频、音频素材，满足“收藏、整理、查找”的各类场景需求，支持 Windows 系统。

## 功能概述

本插件的功能包括：

- **素材插入**：在 Obsidian 中直接搜索并插入 Eagle 素材。
- **拖拽上传**：将本地图片拖入笔记自动上传至 Eagle。
- **反向同步**：自动或手动更新笔记中 Eagle 链接的标题，保持与 Eagle 文件名一致。
- **标签同步**：将 Eagle 素材标签同步至笔记。
- **图片管理**：在笔记中直接修改 Eagle 素材属性（名称、标签、注释等）或移动文件夹。
- **多库支持**：支持配置多个 Eagle 库路径，适应多设备同步环境。

## 初次使用配置说明

1.  **配置 Eagle 库 (Eagle Libraries)**：
    - 进入插件设置，点击 **+** 添加库。
    - 输入库名称，并在 **Library Paths** 中填入 Eagle 库文件夹的绝对路径（`.library` 结尾）。
    - 支持为同一库添加多个路径（应对不同电脑盘符差异）。
    - 点击名称旁的对勾图标将其设为当前活动库。

2.  **配置监听端口 (Port)**：
    - 默认为 `6060`。需确保与 Eagle 软件未冲突（Eagle 目前不支持自定义 API 端口，通常保持默认即可）。

完成配置后，建议重启 Obsidian 以确保服务正常启动。

## 核心功能展示

### 搜索并插入 Eagle 素材

通过命令面板运行 `Insert Image From Eagle`（建议设置快捷键）：

- **多关键词搜索**：支持空格分隔的多个关键词。
- **文件夹筛选**：可在设置中配置常用文件夹，在搜索时快速过滤。
- **键盘导航**：`↑` `↓` 选择，`Enter` 插入。

### 从本地上传至 Eagle

- 将本地图片拖拽或粘贴到 Obsidian 笔记中，插件会自动上传至 Eagle 并生成预览链接。
- 可在设置中指定上传的目标文件夹 (`Folder ID`)。

### 反向同步 (Reverse Sync)

- 开启 `Reverse Sync on Open` 设置后，打开笔记时自动更新链接标题。
- 或手动运行 `Reverse Sync Eagle Links in Current File` 命令。

## 文件夹相关设置

插件在设置页提供了三类文件夹配置：

- **Incoming Target Folder** (上传目标文件夹)
    - 指定从 Obsidian 上传文件到 Eagle 时的默认存放文件夹 ID。

- **Project Folder Roots** (项目文件夹根)
    - 用于管理素材移动的根目录。
    - 在右键菜单 "Manage Folders" 中，这些根目录下的子文件夹将作为选项出现，方便快速分类素材。

- **Folder Filters** (插入筛选文件夹)
    - 为 "Insert Image From Eagle" 搜索窗口提供筛选标签。
    - 配置后，搜索窗口顶部会出现对应的文件夹标签，点击即可仅在该文件夹（及其子文件夹）范围内搜索。

## 安装指南

### 通过 BRAT 安装

将 `https://github.com/zyjGraphein/Obsidian-Eagle-Image-Organizer` 添加到 [BRAT](https://github.com/TfTHacker/obsidian42-brat)。

### 手动安装

访问最新发布页面，下载 `main.js`、`manifest.json`、`style.css`，放入 `<your_vault>/.obsidian/plugins/Obsidian-Eagle-Image-Organizer/`。

## 使用指南

- 文字教程（[中文](doc/TutorialZH.md) / [EN](doc/Tutorial.md)）
- 视频教程（[Obsidian EagleBridge -bilibili](https://www.bilibili.com/video/BV1voQsYaE5W/?share_source=copy_web&vd_source=491bedf306ddb53a3baa114332c02b93)）

## 注意事项

- 使用插件时，Eagle 必须在后台运行。
- 若 Eagle 未运行，图片可能无法预览，上传和管理功能将失效。
- 导出的 PDF 中图片可见，但视频/音频等动态链接在脱离本地环境后无法访问。

## 鸣谢

- 基于 [Eagle API](https://api.eagle.cool) 开发。
- 参考了 [AttachFlow](https://github.com/Yaozhuwa/AttachFlow) (右键菜单/缩放)、[auto-embed](https://github.com/GnoxNahte/obsidian-auto-embed) (嵌入预览) 等优秀插件的设计。

## 许可证

[GNU GPL v3](https://github.com/zyjGraphein/Obsidian-Eagle-Image-Organizer/blob/master/LICENSE)

## 支持

如果您喜欢这个插件，欢迎请我喝杯咖啡！

<img src="../assets/coffee.png" width="400">
