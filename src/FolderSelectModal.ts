import { App, Modal, Notice, Setting } from 'obsidian';
import { t } from './i18n';
import MyPlugin from './main';
import * as fs from 'fs';
import * as path from 'path';

interface EagleFolder {
    id: string;
    name: string;
    children: EagleFolder[];
    parent?: string;
}

export class FolderSelectModal extends Modal {
    private plugin: MyPlugin;
    private itemIds: string[];
    private folders: EagleFolder[] = [];
    private selectedFolderIds: Set<string> = new Set();
    private searchQuery: string = '';
    private folderListEl: HTMLElement;

    constructor(app: App, plugin: MyPlugin, itemIds: string[], initialFolderIds: string[] = []) {
        super(app);
        this.plugin = plugin;
        this.itemIds = itemIds;
        initialFolderIds.forEach(id => this.selectedFolderIds.add(id));
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: t('modal.folderSelect.title') });

        // Search
        new Setting(contentEl)
            .setName(t('modal.folderSelect.search'))
            .addText(text => text
                .setPlaceholder(t('modal.folderSelect.searchPlaceholder'))
                .onChange(value => {
                    this.searchQuery = value.toLowerCase();
                    this.renderFolderList();
                }));

        // New Folder
        new Setting(contentEl)
            .setName(t('modal.folderSelect.newFolder'))
            .setDesc(t('modal.folderSelect.newFolderDesc'))
            .addText(text => text
                .setPlaceholder(t('modal.folderSelect.newFolderPlaceholder'))
                .onChange(value => {
                   text.inputEl.dataset.value = value;
                }))
            .addButton(btn => btn
                .setButtonText(t('modal.folderSelect.create'))
                .onClick(async () => {
                    const input = btn.buttonEl.parentElement?.parentElement?.querySelector('input');
                    const name = input?.value;
                    if (name) {
                        await this.createFolder(name);
                        if (input) input.value = '';
                        await this.fetchFolders();
                        this.renderFolderList();
                    }
                }));

        this.folderListEl = contentEl.createDiv({ cls: 'eagle-folder-list' });
        this.folderListEl.style.maxHeight = '300px';
        this.folderListEl.style.overflowY = 'auto';
        this.folderListEl.style.border = '1px solid var(--background-modifier-border)';
        this.folderListEl.style.padding = '10px';
        this.folderListEl.style.marginTop = '10px';

        // Buttons
        const buttonSetting = new Setting(contentEl);
        buttonSetting.addButton(btn => btn
            .setButtonText(t('modal.folderSelect.cancel'))
            .onClick(() => this.close()));
        buttonSetting.addButton(btn => btn
            .setButtonText(t('modal.folderSelect.save'))
            .setCta()
            .onClick(() => this.save()));

        await this.fetchFolders();
        this.renderFolderList();
    }

    async fetchFolders() {
        try {
            const response = await fetch(`http://localhost:${this.plugin.settings.port || 6060}/api/folder/list?t=${Date.now()}`);
            if (!response.ok) {
                new Notice('Failed to fetch folders from Eagle');
                return;
            }
            const result = await response.json();
            if (result.status === 'success' && Array.isArray(result.data)) {
                this.folders = result.data;
            } else {
                new Notice('Failed to fetch folders from Eagle');
            }
        } catch (error) {
            new Notice('Error connecting to Eagle');
            console.error(error);
        }
    }

    async createFolder(name: string) {
        try {
            const parent = this.plugin.settings.folderScope;
            const response = await fetch(`http://localhost:${this.plugin.settings.port || 6060}/api/folder/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderName: name, parent: parent || undefined })
            });
            if (!response.ok) {
                new Notice(t('modal.folderSelect.createFailed'));
                return;
            }
            const result = await response.json();
            if (result.status === 'success') {
                new Notice(t('modal.folderSelect.createSuccess'));
            } else {
                new Notice(t('modal.folderSelect.createFailed'));
            }
        } catch (error) {
             new Notice(t('modal.folderSelect.createFailed'));
        }
    }

    renderFolderList() {
        this.folderListEl.empty();
        const scopeId = this.plugin.settings.folderScope;
        
        let roots = this.folders;
        
        if (scopeId) {
             const findScope = (nodes: EagleFolder[]): EagleFolder | null => {
                 for (const node of nodes) {
                     if (node.id === scopeId) return node;
                     if (node.children) {
                         const found = findScope(node.children);
                         if (found) return found;
                     }
                 }
                 return null;
             };
             const scopedRoot = findScope(this.folders);
             if (scopedRoot) {
                 roots = [scopedRoot];
             }
        }

        const renderTree = (nodes: EagleFolder[], depth: number, container: HTMLElement) => {
             for (const node of nodes) {
                 const hasChildren = node.children && node.children.length > 0;
                 const matchesSearch = !this.searchQuery || node.name.toLowerCase().includes(this.searchQuery);
                 
                 // Logic: 
                 // If no search: show tree.
                 // If search: show matches. If parent matches, show it. If child matches, show it.
                 // This is a bit complex for a simple modal.
                 // Let's implement a simpler version: If search is active, show flat list of matches.
                 // If no search, show tree.
                 
                 if (this.searchQuery) {
                     // Recursive search collection
                     const collectMatches = (n: EagleFolder, list: EagleFolder[]) => {
                         if (n.name.toLowerCase().includes(this.searchQuery)) {
                             list.push(n);
                         }
                         if (n.children) {
                             n.children.forEach(c => collectMatches(c, list));
                         }
                     };
                     // Only do this at the top level call
                     if (depth === 0) {
                        const matches: EagleFolder[] = [];
                        nodes.forEach(n => collectMatches(n, matches));
                        
                        // Deduplicate if needed (though tree structure shouldn't have dups)
                        matches.forEach(m => {
                             const div = container.createDiv({ cls: 'eagle-folder-item' });
                             div.style.paddingLeft = '5px';
                             div.style.display = 'flex';
                             div.style.alignItems = 'center';
                             
                             const cb = div.createEl('input', { type: 'checkbox' });
                             cb.checked = this.selectedFolderIds.has(m.id);
                             cb.onchange = () => {
                                 if (cb.checked) this.selectedFolderIds.add(m.id);
                                 else this.selectedFolderIds.delete(m.id);
                             };
                             
                             div.createSpan({ text: m.name, cls: 'eagle-folder-name' }).style.marginLeft = "8px";
                        });
                        return; // Stop standard recursion
                     }
                 } else {
                     // Standard tree render
                     const div = container.createDiv({ cls: 'eagle-folder-item' });
                     div.style.paddingLeft = `${depth * 20}px`;
                     div.style.display = 'flex';
                     div.style.alignItems = 'center';

                     const cb = div.createEl('input', { type: 'checkbox' });
                     cb.checked = this.selectedFolderIds.has(node.id);
                     cb.onchange = () => {
                         if (cb.checked) this.selectedFolderIds.add(node.id);
                         else this.selectedFolderIds.delete(node.id);
                     };

                     div.createSpan({ text: node.name, cls: 'eagle-folder-name' }).style.marginLeft = "8px";

                     if (hasChildren) {
                         renderTree(node.children, depth + 1, container);
                     }
                 }
             }
        };
        
        renderTree(roots, 0, this.folderListEl);
    }

    async save() {
        try {
            const folders = Array.from(this.selectedFolderIds);
            const libraryPath = this.plugin.settings.libraryPath;

            for (const id of this.itemIds) {
                const dirPath = path.join(libraryPath, 'images', `${id}.info`);
                const metaPath = path.join(dirPath, 'metadata.json');

                const raw = await fs.promises.readFile(metaPath, 'utf8');
                const data = JSON.parse(raw);
                data.folders = folders;
                await fs.promises.writeFile(metaPath, JSON.stringify(data, null, 2), 'utf8');
            }
            new Notice(t('modal.folderSelect.saveSuccess'));
            this.close();
        } catch (error) {
            new Notice(t('modal.folderSelect.saveFailed'));
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}
