import { App, Modal, Notice, Setting } from 'obsidian';
import { MyPluginSettings } from '../../setting';
import { print } from '../../utils/logger';
import { t } from '../../i18n';

export class EagleJumpModal extends Modal {
	private settings: MyPluginSettings;

	constructor(app: App, settings: MyPluginSettings) {
		super(app);
		this.settings = settings;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: t('modal.eagleJump.title') });

		let linkInput: HTMLInputElement;

		new Setting(contentEl)
			.addText(text => {
				linkInput = text.inputEl;
				text.setPlaceholder(t('modal.eagleJump.placeholder'));
				linkInput.style.width = '400px';
			});

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.cssText = 'display:flex;align-items:end;justify-content:center;';

		new Setting(buttonContainer)
			.addButton(btn => btn
				.setButtonText(t('modal.eagleJump.jump'))
				.setCta()
				.onClick(() => this.handleJump(linkInput.value.trim())));

		new Setting(buttonContainer)
			.addButton(btn => btn
				.setButtonText(t('modal.eagleJump.cancel'))
				.onClick(() => this.close()));
	}

	onClose() {
		this.contentEl.empty();
	}

	private handleJump(link: string) {
		if (!link) {
			new Notice(t('modal.eagleJump.invalidLink'));
			return;
		}

		const eaglePattern = /^eagle:\/\/item\/([A-Z0-9]+)$/;
		const imagePattern = /http:\/\/localhost:\d+\/images\/([A-Z0-9]+)\.info/;

		const eagleMatch = link.match(eaglePattern);
		const imageMatch = link.match(imagePattern);

		if (eagleMatch || imageMatch) {
			const itemId = eagleMatch ? eagleMatch[1] : (imageMatch ? imageMatch[1] : null);
			if (itemId) {
				this.searchInObsidian(itemId);
			} else {
				new Notice(t('modal.eagleJump.cannotExtractId'));
			}
		} else {
			new Notice(t('modal.eagleJump.invalidLink'));
		}
		this.close();
	}

	private searchInObsidian(itemId: string) {
		print(`Search ID in Obsidian: ${itemId}`);
		let searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
		if (!searchLeaf) {
			searchLeaf = this.app.workspace.getLeaf(true);
			searchLeaf.setViewState({ type: 'search' });
		}
		this.app.workspace.revealLeaf(searchLeaf);
		const searchView = searchLeaf.view;
		if (searchView && typeof (searchView as any).setQuery === 'function') {
			(searchView as any).setQuery(itemId);
		} else {
			new Notice(t('modal.eagleJump.searchNotSupported'));
		}
	}
}
