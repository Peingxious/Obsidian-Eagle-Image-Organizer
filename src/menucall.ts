import { Menu, MenuItem, MarkdownView, Notice, Modal, App, Setting } from 'obsidian';
import MyPlugin from './main';
import * as path from 'path';
import { onElement } from './onElement';
import { print, setDebug } from './main';
import { exec, spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { EditorView} from '@codemirror/view';
import { t } from './i18n';
import { FolderSelectModal } from './FolderSelectModal';

export function handleLinkClick(plugin: MyPlugin, event: MouseEvent, url: string) {
	const menu = new Menu();
	const inPreview = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() == "preview";
	const topLevelActions: Array<() => void> = [];
	if (inPreview) {
		addEagleImageMenuPreviewMode(plugin, menu, url, event, false, topLevelActions);
	} else {
		addEagleImageMenuSourceMode(plugin, menu, url, event, topLevelActions);
	}
	registerEscapeButton(plugin, menu);
	menu.register(
		onElement(
			activeDocument,
			"keydown" as keyof HTMLElementEventMap,
			"*",
			(e: KeyboardEvent) => {
				if (e.key >= "1" && e.key <= "9") {
					const index = parseInt(e.key, 10) - 1;
					const action = topLevelActions[index];
					if (action) {
						e.preventDefault();
						e.stopPropagation();
						action();
						menu.hide();
					}
				}
			}
		)
	);
	let offset = 0;
	menu.showAtPosition({ x: event.pageX, y: event.pageY + offset });
}

export function eagleImageContextMenuCall(this: MyPlugin, event: MouseEvent) {
	const img = event.target as HTMLImageElement;
	const inTable: boolean = img.closest('table') != null;
	const inCallout: boolean = img.closest('.callout') != null;
	if (img.id == 'af-zoomed-image') return;
	if (!img.src.startsWith('http')) return;
    event.preventDefault();
	event.stopPropagation();
	this.app.workspace.getActiveViewOfType(MarkdownView)?.editor?.blur();
	img.classList.remove('image-ready-click-view', 'image-ready-resize');
	const url = img.src;
	const menu = new Menu();
	const inPreview = this.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() == "preview";
	const topLevelActions: Array<() => void> = [];
	if (inPreview) {
		addEagleImageMenuPreviewMode(this, menu, url, event, false, topLevelActions);
	} else {
		addEagleImageMenuSourceMode(this, menu, url, event, topLevelActions);
	}
	registerEscapeButton(this, menu);
	menu.register(
		onElement(
			activeDocument,
			"keydown" as keyof HTMLElementEventMap,
			"*",
			(e: KeyboardEvent) => {
				if (e.key >= "1" && e.key <= "9") {
					const index = parseInt(e.key, 10) - 1;
					const action = topLevelActions[index];
					if (action) {
						e.preventDefault();
						e.stopPropagation();
						action();
						menu.hide();
					}
				}
			}
		)
	);
	let offset = 0;
	if (!inPreview && (inTable || inCallout)) offset = -138;
	menu.showAtPosition({ x: event.pageX, y: event.pageY + offset });
}

export function registerEscapeButton(plugin: MyPlugin, menu: Menu, document: Document = activeDocument) {
	menu.register(
		onElement(
			document,
			"keydown" as keyof HTMLElementEventMap,
			"*",
			(e: KeyboardEvent) => {
				if (e.key === "Escape") {
					e.preventDefault();
					e.stopPropagation();
					menu.hide();
				}
			}
		)
	);
}

export async function addEagleImageMenuPreviewMode(plugin: MyPlugin, menu: Menu, oburl: string, event: MouseEvent, isSourceMode: boolean = false, topLevelActions?: Array<() => void>) {
	const imageInfo = await fetchImageInfo(oburl);

    if (imageInfo) {
        const { id, name, ext, annotation, tags, url, folders } = imageInfo;
        const openInEagle = () => {
            const eagleLink = `eagle://item/${id}`;
            navigator.clipboard.writeText(eagleLink);
            window.open(eagleLink, '_self');
        };
        const copyEagleUrl = () => {
            navigator.clipboard.writeText(url);
            new Notice(t('menu.copyToClipboardSuccess'));
        };
        const openEagleHttpUrl = () => {
            window.open(url, '_self');
        };
        
        // Open File Submenu / Primary: 在 Eagle 中打开
        menu.addItem((item: MenuItem) => {
            const defaultAction = () => {
                openInEagle();
            };
            item
                .setTitle(t('menu.openFileSubmenu'))
                .setIcon("file-symlink")
                .onClick(defaultAction);

            if (topLevelActions) {
                topLevelActions.push(defaultAction);
            }
            
            const subMenu = (item as any).setSubmenu() as Menu;

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("file-symlink")
                    .setTitle(t('menu.openInObsidian'))
                    .onClick(async (event: MouseEvent) => {
                        // 根据设置决定如何打开链接
                        const openMethod = plugin.settings.openInObsidian || 'newPage';
                        
                        if (openMethod === 'newPage') {
                            // 在新页面打开（默认行为）
                            window.open(oburl, '_blank');
                        } else if (openMethod === 'popup') {
                            // 使用 Obsidian 的独立窗口打开
                            const leaf = plugin.app.workspace.getLeaf('window');
                            await leaf.setViewState({
                                type: 'webviewer',
                                state: {
                                    url: oburl,
                                    navigate: true,
                                },
                                active: true,
                            });
                        } else if (openMethod === 'rightPane') {
                            // 在右侧新栏中打开
                            const leaf = plugin.app.workspace.getLeaf('split', 'vertical');
                            await leaf.setViewState({
                                type: 'webviewer',
                                state: {
                                    url: oburl,
                                    navigate: true,
                                },
                                active: true,
                            });
                        }
                    })
            );

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("file-symlink")
                    .setTitle(t('menu.openInEagle'))
                    .onClick(() => {
                        openInEagle();
                    })
            );

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("square-arrow-out-up-right")
                    .setTitle(t('menu.openInDefaultApp'))
                    .onClick(() => {
                        const libraryPath = plugin.settings.libraryPath;
                        const localFilePath = path.join(
                            libraryPath,
                            "images",
                            `${id}.info`,
                            `${name}.${ext}`
                        );
            
                        new Notice(localFilePath);
                        // print(`文件的真实路径是: ${localFilePath}`);
            
                        // 使用 spawn 调用 explorer.exe 打开文件
                        const child = spawn('explorer.exe', [localFilePath], { shell: true });
                        child.on('error', (error) => {
                            print('Error opening file:', error);
                            new Notice(t('menu.cannotOpenFile'));
                        });

                        child.on('exit', (code) => {
                            if (code === 0) {
                                print('The file has been opened successfully');
                            } else {
                                print(`The file cannot be opened normally, exit code: ${code}`);
                            }
                        });
                    })
            );

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("external-link")
                    .setTitle(t('menu.openInOtherApps'))
                    .onClick(() => {
                        const libraryPath = plugin.settings.libraryPath;
                        const localFilePath = path.join(
                            libraryPath,
                            "images",
                            `${id}.info`,
                            `${name}.${ext}`
                        );
            
                        new Notice(localFilePath);
                        // print(`文件的真实路径是: ${localFilePath}`);
            
                        // 使用 rundll32 调用系统的"打开方式"对话框
                        const child = spawn('rundll32', ['shell32.dll,OpenAs_RunDLL', localFilePath], { shell: true });

                        child.on('error', (error) => {
                            print('Error opening file:', error);
                            new Notice(t('menu.cannotOpenFile'));
                        });

                        child.on('exit', (code) => {
                            if (code === 0) {
                                print('The file has been opened successfully');
                            } else {
                                print(`The file cannot be opened normally, exit code: ${code}`);
                            }
                        });
                    })
            );
        });
        
        // 预先计算 tags 数组，供复制数据和修改属性共用
        const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());

        // Copy Data Submenu / Primary: 打开链接
        menu.addItem((item: MenuItem) => {
            const defaultAction = () => {
                openEagleHttpUrl();
            };
            item
                .setTitle(t('menu.copyDataSubmenu'))
                .setIcon("copy")
                .onClick(defaultAction);

            if (topLevelActions) {
                topLevelActions.push(defaultAction);
            }
            
            const subMenu = (item as any).setSubmenu() as Menu;

            // 复制源文件
            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("copy")
                    .setTitle(t('menu.copySourceFile'))
                    .onClick(() => {
                        const libraryPath = plugin.settings.libraryPath;
                        const localFilePath = path.join(
                            libraryPath,
                            "images",
                            `${id}.info`,
                            `${name}.${ext}`
                        );
                        try {
                            copyFileToClipboardCMD(localFilePath);
                            new Notice(t('menu.copyToClipboardSuccess'), 3000);
                        } catch (error) {
                            console.error(error);
                            new Notice(t('menu.copyToClipboardFailed'), 3000);
                        }
                    })
            );

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("case-sensitive")
                    .setTitle(t('menu.eagleName', { name }))
                    .onClick(() => {
                        navigator.clipboard.writeText(name);
                        new Notice(t('menu.copyToClipboardSuccess'));
                    })
            );

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("letter-text")
                    .setTitle(t('menu.eagleAnnotation', { 
                        annotation: annotation.length > 14 ? annotation.substring(0, 14) + "..." : annotation 
                    }))
                    .onClick(() => {
                        navigator.clipboard.writeText(annotation);
                        new Notice(t('menu.copyToClipboardSuccess'));
                    })
            );

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("link-2")
                    .setTitle(t('menu.eagleUrl', { url }))
                    .onClick(() => {
                        copyEagleUrl();
                    })
            );

            subMenu.addItem((subItem) =>
                subItem
                    .setIcon("tags")
                    .setTitle(t('menu.eagleTags', { tags: tagsArray.join(', ') }))
                    .onClick(() => {
                        const tagsString = tagsArray.join(', ');
                        navigator.clipboard.writeText(tagsString)
                            .then(() => new Notice(t('menu.copyToClipboardSuccess')))
                            .catch(err => new Notice(t('menu.copyTagsFailed')));
                    })
            );

            if (isSourceMode) {
                subMenu.addItem((subItem) =>
                    subItem
                        .setIcon("trash-2")
                        .setTitle(t('menu.clearMarkdownLink'))
                        .onClick(() => {
                            try {
                                const target = getMouseEventTarget(event);
                                const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                                const editorView = (editor as any).cm as EditorView;
                                const target_pos = editorView.posAtDOM(target);
                                deleteCurTargetLink(oburl, plugin, target_pos);
                            } catch {
                                new Notice(t('menu.clearFileError'));
                            }
                        })
                );
            }
        });

        menu.addItem((item: MenuItem) => {
            const defaultAction = () => {
                new ModifyPropertiesModal(plugin.app, id, name, annotation, url, tagsArray, (newId, newName, newAnnotation, newUrl, newTags) => {
                    // 在这里处理保存逻辑
                }).open();
            };
            item
                .setIcon("wrench")
                .setTitle(t('menu.modifyProperties'))
                .onClick(defaultAction);

            if (topLevelActions) {
                topLevelActions.push(defaultAction);
            }
        });

        menu.addItem((item: MenuItem) => {
            const defaultAction = () => {
                new FolderSelectModal(plugin.app, plugin, [id], folders || []).open();
            };
            item
                .setIcon("folder")
                .setTitle(t('menu.manageFolders'))
                .onClick(defaultAction);

            if (topLevelActions) {
                topLevelActions.push(defaultAction);
            }
        });
        // 其他菜单项可以继续使用 { id, name, ext } 数据
    }

	menu.showAtPosition({ x: event.pageX, y: event.pageY });
}

export async function addEagleImageMenuSourceMode(plugin: MyPlugin, menu: Menu, url: string, event: MouseEvent, topLevelActions?: Array<() => void>) {
	await addEagleImageMenuPreviewMode(plugin, menu, url, event, true, topLevelActions);
	menu.showAtPosition({ x: event.pageX, y: event.pageY });
} 

// 修改eagle属性中的annotation,url,tags
class ModifyPropertiesModal extends Modal {
	id: string;
	name: string;
	annotation: string;
	url: string;
	tags: string[];
	onSubmit: (id: string, name: string, annotation: string, url: string, tags: string[]) => void;

	constructor(app: App, id: string, name: string, annotation: string, url: string, tags: string[], onSubmit: (id: string, name: string, annotation: string, url: string, tags: string[]) => void) {
		super(app);
		this.id = id;
		this.name = name;
		this.annotation = annotation;
		this.url = url;
		this.tags = tags;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Modify Properties' });

		new Setting(contentEl)
			.setName(t('modal.modifyProperties.annotation'))
			.addText(text => text
				.setValue(this.annotation)
				.onChange(value => {
					this.annotation = value;
				})
				.inputEl.style.width = '400px'
			);

		new Setting(contentEl)
			.setName(t('modal.modifyProperties.url'))
			.addText(text => text
				.setValue(this.url)
				.onChange(value => {
					this.url = value;
				})
				.inputEl.style.width = '400px'
			);

		new Setting(contentEl)
			.setName(t('modal.modifyProperties.tags'))
			.setDesc(t('modal.modifyProperties.tagsDesc'))
			.addText(text => text
				.setValue(this.tags.join(', '))
				.onChange(value => {
					this.tags = value.split(',').map(tag => tag.trim());
				})
				.inputEl.style.width = '400px'
			);

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText(t('modal.modifyProperties.save'))
				.setCta()
				.onClick(() => {
					// 构建数据对象
					const data = {
						id: this.id,
						// name: this.name,
						tags: this.tags,
						annotation: this.annotation,
						url: this.url,
					};

					// 设置请求选项
					const requestOptions: RequestInit = {
						method: 'POST',
						body: JSON.stringify(data),
						redirect: 'follow' as RequestRedirect
					};

					// 发送请求
					fetch("http://localhost:41595/api/item/update", requestOptions)
						.then(response => response.json())
						.then(result => {
							print(result);
							new Notice(t('modal.modifyProperties.uploadSuccess'));
						})
						.catch(error => {
							print('error', error);
							new Notice(t('modal.modifyProperties.uploadFailed'));
						});

					// 调用 onSubmit 回调
					this.onSubmit(this.id, this.name, this.annotation, this.url, this.tags);
					this.close();
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


function copyFileToClipboardCMD(filePath: string) {

	if (!existsSync(filePath)) {
        console.error(`File ${filePath} does not exist`);
        return;
    }

    const callback = (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
			new Notice(t('menu.commandError', { message: error.message }), 3000);
			console.error(`Error executing command: ${error.message}`);
			return;
        }
    };

    if (process.platform === 'darwin') {
		execSync(`open -R "${filePath}"`);
        execSync(`osascript -e 'tell application "System Events" to keystroke "c" using command down'`);
        execSync(`osascript -e 'tell application "System Events" to keystroke "w" using command down'`);
		execSync(`open -a "Obsidian.app"`);
    } else if (process.platform === 'linux') {
    } else if (process.platform === 'win32') {
		let safeFilePath = filePath.replace(/'/g, "''");
        exec(`powershell -command "Set-Clipboard -Path '${safeFilePath}'"`, callback);
    }
}

export async function fetchImageInfo(url: string, port: number = 41595): Promise<{ id: string, name: string, ext: string, annotation: string, tags: string[], url: string, folders: string[] } | null> {
	const match = url.match(/\/images\/(.*)\.info/);
	if (match && match[1]) {
		const requestOptions: RequestInit = {
			method: 'GET',
			redirect: 'follow' as RequestRedirect
		};

		try {
			// Use proxy port and add timestamp to prevent caching
			const response = await fetch(`http://localhost:${port}/api/item/info?id=${match[1]}&t=${Date.now()}`, requestOptions);
			const result = await response.json();

			if (result.status === "success" && result.data) {
				return result.data;
			} else {
				print('Failed to fetch item info');
			}
		} catch (error) {
			print('Error fetching item info', error);
		}
	} else {
		print('Invalid image source format');
	}
	return null;
}

export const getMouseEventTarget = (event: MouseEvent): HTMLElement => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    return target;
}

export function deleteCurTargetLink(
    url: string,
    plugin: MyPlugin,
    target_pos: number,
) {
    const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
        new Notice(t('deleteLink.noActiveView'), 3000);
        return;
    }
    const editor = activeView.editor;
    const editorView = (editor as any).cm as EditorView;
    
    // 获取目标行和文本
    const target_line = editorView.state.doc.lineAt(target_pos);
    const line_text = target_line.text;
    
    // 检查是否在表格或callout中
    const target = editorView.domAtPos(target_pos).node as HTMLElement;
    const inTable = !!target.closest('table');
    const inCallout = !!target.closest('.callout');
    
    if (!inTable && !inCallout) {
        // 普通文本中的链接
        const finds = findLinkInLine(url, line_text);
        if (finds.length === 0) {
            new Notice(t('deleteLink.notFoundInLine'), 3000);
            return;
        }
        else if (finds.length !== 1) {
            new Notice(t('deleteLink.multipleInLine'), 3000);
            return;
        }
        else {
            editor.replaceRange('', 
                {line: target_line.number-1, ch: finds[0][0]}, 
                {line: target_line.number-1, ch: finds[0][1]}
            );
            return;
        }
    }
    
    // 处理表格或callout中的链接
    const startReg: {[key: string]: RegExp} = {
        'table': /^\s*\|/,
        'callout': /^>/,
    };
    
    const mode = inTable ? 'table' : 'callout';
    let finds_lines: number[] = [];
    let finds_all: [number, number][] = [];
    
    // 向下搜索
    for (let i = target_line.number; i <= editor.lineCount(); i++) {
        const line_text = editor.getLine(i-1);
        if (!startReg[mode].test(line_text)) break;
        
        const finds = findLinkInLine(url, line_text);
        if (finds.length > 0) {
            finds_lines.push(...new Array(finds.length).fill(i));
            finds_all.push(...finds);
        }
    }
    
    // 向上搜索
    for (let i = target_line.number-1; i >= 1; i--) {
        const line_text = editor.getLine(i-1);
        if (!startReg[mode].test(line_text)) break;
        
        const finds = findLinkInLine(url, line_text);
        if (finds.length > 0) {
            finds_lines.push(...new Array(finds.length).fill(i));
            finds_all.push(...finds);
        }
    }
    
    if (finds_all.length === 0) {
        new Notice(t('deleteLink.notFoundInScope', { scope: mode }), 3000);
        return;
    }
    else if (finds_all.length !== 1) {
        new Notice(t('deleteLink.multipleInScope', { scope: mode }), 3000);
        return;
    }
    else {
        editor.replaceRange('', 
            {line: finds_lines[0]-1, ch: finds_all[0][0]}, 
            {line: finds_lines[0]-1, ch: finds_all[0][1]}
        );
    }
    
    editor.focus();
}

// 查找一行中包含特定URL的链接
function findLinkInLine(url: string, line: string): [number, number][] {
    const results: [number, number][] = [];
    
    // 匹配Markdown链接: ![alt](url) 或 [text](url)
    const regex = new RegExp(`(!?\\[[^\\]]*\\]\\(${escapeRegExp(url)}[^)]*\\))`, 'g');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
        results.push([match.index, match.index + match[0].length]);
    }
    
    return results;
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
