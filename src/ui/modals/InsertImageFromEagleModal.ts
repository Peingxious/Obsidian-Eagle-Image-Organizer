import { App, Modal, Notice, MarkdownView } from 'obsidian';
import { MyPluginSettings, FolderFilterConfig } from '../../setting';
import MyPlugin from '../../main';
import { print } from '../../utils/logger';
import { t } from '../../i18n';

interface EagleFolder {
	id: string;
	name: string;
	children?: EagleFolder[];
}

export class InsertImageFromEagleModal extends Modal {
	private plugin: MyPlugin;
	private settings: MyPluginSettings;
	private searchInput: HTMLInputElement;
	private resultsContainer: HTMLElement;
	private infoEl: HTMLElement;
	private searchTimer: number | null = null;
	private selectedIndex: number = -1;
	private currentItems: any[] = [];
	private resultElements: HTMLElement[] = [];
	private currentPort: number = 6060;
	private selectedFolderFilterIds: Set<string> = new Set();
	private folderTree: EagleFolder[] | null = null;

	constructor(app: App, plugin: MyPlugin) {
		super(app);
		this.plugin = plugin;
		this.settings = plugin.settings;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h3', { text: t('modal.insertImage.title') });

		this.renderSearchRow(contentEl);
		this.renderFilters(contentEl);
		this.renderInfoEl(contentEl);
		this.renderResultsContainer(contentEl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private renderSearchRow(contentEl: HTMLElement) {
		const searchRow = contentEl.createDiv();
		searchRow.style.display = 'flex';
		searchRow.style.gap = '8px';
		searchRow.style.marginBottom = '8px';

		this.searchInput = searchRow.createEl('input', {
			type: 'text',
			placeholder: t('modal.insertImage.placeholder'),
		});
		this.searchInput.style.flex = '1';
		this.searchInput.addEventListener('input', () => this.scheduleSearch());
		this.searchInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
	}

	private renderFilters(contentEl: HTMLElement) {
		const filters = this.settings.folderFilters || [];
		if (filters.length === 0) {
			this.selectedFolderFilterIds.clear();
			return;
		}

		const savedIds = this.settings.selectedFolderFilterIds || [];
		this.selectedFolderFilterIds = new Set(savedIds);

		const filterRow = contentEl.createDiv();
		filterRow.style.display = 'flex';
		filterRow.style.alignItems = 'center';
		filterRow.style.flexWrap = 'wrap';
		filterRow.style.gap = '8px';
		filterRow.style.marginBottom = '6px';

		const label = filterRow.createDiv();
		label.textContent = t('modal.insertImage.filterLabel');
		label.style.fontSize = '12px';
		label.style.opacity = '0.7';

		const optionsContainer = filterRow.createDiv();
		optionsContainer.style.display = 'flex';
		optionsContainer.style.flexWrap = 'wrap';
		optionsContainer.style.gap = '6px';

		const renderChips = () => {
			optionsContainer.empty();
			this.createChip(optionsContainer, t('modal.insertImage.filterAll'), null, renderChips);
			for (const filter of filters) {
				if (filter.folderId) {
					this.createChip(optionsContainer, filter.name || filter.folderId, filter.folderId, renderChips);
				}
			}
		};

		renderChips();
	}

	private createChip(container: HTMLElement, text: string, folderId: string | null, onUpdate: () => void) {
		const chip = container.createDiv();
		chip.textContent = text;
		chip.style.padding = '2px 8px';
		chip.style.borderRadius = '999px';
		chip.style.cursor = 'pointer';
		chip.style.fontSize = '12px';
		chip.style.border = '1px solid var(--background-modifier-border)';

		const isActive = folderId === null
			? this.selectedFolderFilterIds.size === 0
			: this.selectedFolderFilterIds.has(folderId);

		if (isActive) {
			chip.style.backgroundColor = 'var(--interactive-accent)';
			chip.style.color = 'var(--text-on-accent)';
		}

		chip.onclick = async () => {
			if (folderId === null) {
				this.selectedFolderFilterIds.clear();
			} else {
				if (this.selectedFolderFilterIds.has(folderId)) {
					this.selectedFolderFilterIds.delete(folderId);
				} else {
					this.selectedFolderFilterIds.add(folderId);
				}
			}

			this.settings.selectedFolderFilterIds = Array.from(this.selectedFolderFilterIds);
			await this.plugin.saveSettings();
			onUpdate();
			this.scheduleSearch();
		};
	}

	private renderInfoEl(contentEl: HTMLElement) {
		this.infoEl = contentEl.createDiv();
		this.infoEl.style.marginBottom = '6px';
		this.infoEl.textContent = '';
	}

	private renderResultsContainer(contentEl: HTMLElement) {
		this.resultsContainer = contentEl.createDiv();
		this.resultsContainer.style.maxHeight = '420px';
		this.resultsContainer.style.overflowY = 'auto';
		this.resultsContainer.style.display = 'flex';
		this.resultsContainer.style.flexDirection = 'column';
		this.resultsContainer.style.gap = '6px';
	}

	private handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			this.moveSelection(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			this.moveSelection(-1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (this.selectedIndex !== -1 && this.currentItems[this.selectedIndex]) {
				this.insertImage(this.currentItems[this.selectedIndex], this.currentPort);
			} else {
				this.search();
			}
		}
	}

	private scheduleSearch() {
		if (this.searchTimer !== null) window.clearTimeout(this.searchTimer);
		this.searchTimer = window.setTimeout(() => this.search(), 250);
	}

	private async search() {
		const query = this.searchInput.value.trim();
		if (!query) {
			this.resultsContainer.empty();
			this.infoEl.textContent = '';
			return;
		}

		this.infoEl.textContent = t('modal.insertImage.searching');
		const port = this.settings.port || 6060;
		const params = await this.buildSearchParams(query, port);
		const url = `http://localhost:${port}/api/item/list?${params.toString()}`;

		try {
			const response = await fetch(url);
			const result = await response.json();

			if (result.status !== 'success' || !Array.isArray(result.data)) {
				this.infoEl.textContent = t('modal.insertImage.noResult');
				return;
			}

			const terms = query.toLowerCase().split(/\s+/).filter(v => v.length > 0);
			const exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff'];
			const items = result.data.filter((item: any) => {
				if (!item?.name || !item?.ext) return false;
				const ext = String(item.ext).toLowerCase();
				if (!exts.includes(ext)) return false;
				const name = String(item.name).toLowerCase();
				return terms.every(term => name.includes(term));
			});

			if (items.length === 0) {
				this.infoEl.textContent = t('modal.insertImage.noResult');
				this.resultsContainer.empty();
				return;
			}

			this.infoEl.textContent = '';
			this.renderResults(items, port);
		} catch (e) {
			print('InsertImageFromEagleModal search error', e);
			this.infoEl.textContent = t('modal.insertImage.noResult');
		}
	}

	private async buildSearchParams(query: string, port: number): Promise<URLSearchParams> {
		const params = new URLSearchParams();
		params.set('limit', '1000');
		params.set('orderBy', '-CREATEDATE');
		
		const terms = query.toLowerCase().split(/\s+/).filter(v => v.length > 0);
		const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
		if (sortedTerms.length > 0) params.set('keyword', sortedTerms[0]);

		const selectedIds = Array.from(this.selectedFolderFilterIds);
		if (selectedIds.length > 0) {
			const folderIdsToSend = await this.getFolderIdsWithSubfolders(selectedIds, port);
			if (folderIdsToSend.length > 0) params.set('folders', folderIdsToSend.join(','));
		}
		
		params.set('t', Date.now().toString());
		return params;
	}

	private async getFolderIdsWithSubfolders(selectedIds: string[], port: number): Promise<string[]> {
		const filters = (this.settings.folderFilters || []) as FolderFilterConfig[];
		const expandIds = selectedIds.filter(id => filters.find(f => f.folderId === id)?.includeSubfolders !== false);
		const exactIds = selectedIds.filter(id => filters.find(f => f.folderId === id)?.includeSubfolders === false);

		const folderIdsSet = new Set<string>(exactIds);
		if (expandIds.length > 0) {
			const tree = await this.ensureFolderTree(port);
			if (tree) {
				const descendants = this.collectFolderAndDescendants(expandIds, tree);
				descendants.forEach(id => folderIdsSet.add(id));
			} else {
				expandIds.forEach(id => folderIdsSet.add(id));
			}
		}
		return Array.from(folderIdsSet);
	}

	private async ensureFolderTree(port: number): Promise<EagleFolder[] | null> {
		if (this.folderTree) return this.folderTree;
		try {
			const response = await fetch(`http://localhost:${port}/api/folder/list?t=${Date.now()}`);
			const result = await response.json();
			if (result.status === 'success' && Array.isArray(result.data)) {
				this.folderTree = result.data;
				return this.folderTree;
			}
		} catch (e) {
			print('InsertImageFromEagleModal folder list error', e);
		}
		return null;
	}

	private collectFolderAndDescendants(rootIds: string[], tree: EagleFolder[]): string[] {
		const index = new Map<string, EagleFolder>();
		const stack: EagleFolder[] = [...tree];
		while (stack.length > 0) {
			const node = stack.pop()!;
			index.set(node.id, node);
			if (node.children) stack.push(...node.children);
		}

		const result = new Set<string>();
		for (const id of rootIds) {
			const root = index.get(id);
			if (!root) {
				result.add(id);
				continue;
			}
			const innerStack: EagleFolder[] = [root];
			while (innerStack.length > 0) {
				const node = innerStack.pop()!;
				if (!result.has(node.id)) {
					result.add(node.id);
					if (node.children) innerStack.push(...node.children);
				}
			}
		}
		return Array.from(result);
	}

	private renderResults(items: any[], port: number) {
		this.resultsContainer.empty();
		this.currentItems = items;
		this.resultElements = [];
		this.currentPort = port;
		this.selectedIndex = -1;

		const maxItems = 200;
		for (let i = 0; i < items.length && i < maxItems; i++) {
			this.renderResultItem(items[i], i, port);
		}
	}

	private renderResultItem(item: any, index: number, port: number) {
		const row = this.resultsContainer.createDiv();
		this.resultElements.push(row);

		row.style.display = 'flex';
		row.style.alignItems = 'center';
		row.style.gap = '10px';
		row.style.padding = '4px 6px';
		row.style.borderRadius = '4px';
		row.style.cursor = 'pointer';
		
		row.onmouseover = () => { if (this.selectedIndex !== index) row.style.backgroundColor = 'var(--nav-item-background-hover)'; };
		row.onmouseout = () => { if (this.selectedIndex !== index) row.style.backgroundColor = 'transparent'; };
		row.onclick = () => this.insertImage(item, port);

		const thumbWrapper = row.createDiv();
		thumbWrapper.style.cssText = 'width:80px;height:80px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:4px;background-color:var(--background-secondary);';

		const img = thumbWrapper.createEl('img');
		img.src = `http://localhost:${port}/images/${item.id}.info`;
		img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';

		const textWrapper = row.createDiv();
		textWrapper.style.cssText = 'display:flex;flex-direction:column;flex:1 1 auto;min-width:0;';

		const titleEl = textWrapper.createDiv();
		titleEl.textContent = item.name || item.id;
		titleEl.style.cssText = 'font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

		const infoEl = textWrapper.createDiv();
		infoEl.style.cssText = 'font-size:11px;opacity:0.7;';
		infoEl.textContent = item.ext ? String(item.ext).toUpperCase() : '';
	}

	private moveSelection(direction: number) {
		if (this.resultElements.length === 0) return;
		const prevIndex = this.selectedIndex;
		this.selectedIndex = Math.max(0, Math.min(this.selectedIndex + direction, this.resultElements.length - 1));
		
		if (prevIndex !== -1) this.resultElements[prevIndex].style.backgroundColor = 'transparent';
		const el = this.resultElements[this.selectedIndex];
		if (el) {
			el.style.backgroundColor = 'var(--background-modifier-active-hover)';
			el.scrollIntoView({ block: 'nearest' });
		}
	}

	private insertImage(item: any, port: number) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice(t('modal.insertImage.noActiveEditor'));
			return;
		}
		const editor = view.editor;
		const size = this.settings.imageSize || '';
		const name = item.name || item.id;
		const url = `http://localhost:${port}/images/${item.id}.info`;
		
		let alt = `${name}.${item.ext}`;
		if (size) alt = `${alt}|${size}`;
		
		editor.replaceSelection(`![${alt}](${url})`);
		new Notice(t('modal.insertImage.insertSuccess'));
		this.close();
	}
}
