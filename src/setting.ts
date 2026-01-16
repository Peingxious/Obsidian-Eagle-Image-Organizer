import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import MyPlugin from './main';
import { startServer, refreshServer, stopServer } from './server';
import { t } from './i18n';

export interface EagleLibrary {
	id: string;
	name: string;
	paths: string[];
}

export interface MyPluginSettings {
	mySetting: string;
	port: number;
	libraryPath: string;
	folderId?: string;
	folderScope: string;
	clickView: boolean;
	adaptiveRatio: number;
	advancedID: boolean;
	obsidianStoreId: string;
	imageSize: number | undefined;
	websiteUpload: boolean;
	libraryPaths: string[];
	debug: boolean;
	openInObsidian: string;
	libraries?: EagleLibrary[];
	currentLibraryId?: string;
	archivedTags?: string[];
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	port: 6060,
	libraryPath: '',
	folderId: '',
	clickView: false,
	adaptiveRatio: 0.8,
	advancedID: false,
	obsidianStoreId: '',
	imageSize: undefined,
	websiteUpload: false,
	libraryPaths: [],
	folderScope: '',
	debug: false,
	openInObsidian: 'newPage',
	libraries: [],
	currentLibraryId: undefined,
	archivedTags: [],
}


export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const prevLibrariesDetails = containerEl.querySelector('details[data-eagle-libraries]') as HTMLDetailsElement | null;
		const prevLibrariesOpen = prevLibrariesDetails ? prevLibrariesDetails.open : true;

		containerEl.empty();

		new Setting(containerEl)
			.setName(t('setting.port.name'))
			.setDesc(t('setting.port.desc'))
			.addText(text => text
				.setPlaceholder(t('setting.port.placeholder'))
				.setValue(this.plugin.settings.port.toString())
				.onChange(async (value) => {
					this.plugin.settings.port = parseInt(value);
					await this.plugin.saveSettings();
				}));

		const librariesDetails = containerEl.createEl('details');
		librariesDetails.setAttr('data-eagle-libraries', 'true');
		librariesDetails.open = prevLibrariesOpen;
		const librariesSummary = librariesDetails.createEl('summary');
		librariesSummary.setText(t('setting.libraries.title'));

		new Setting(librariesDetails)
			.setName(t('setting.libraries.title'))
			.setDesc(t('setting.libraries.desc', { path: this.plugin.settings.libraryPath || '' }))
			.addButton(button => {
				button.setButtonText(t('setting.libraries.addLibrary'))
					.setCta()
					.onClick(async () => {
						if (!this.plugin.settings.libraries) {
							this.plugin.settings.libraries = [];
						}
						const id = `lib-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
						this.plugin.settings.libraries.push({
							id,
							name: t('setting.libraries.defaultName'),
							paths: [],
						});
						this.plugin.settings.currentLibraryId = id;
						await this.plugin.saveSettings();
						await this.plugin.updateLibraryPath();
						this.display();
					});
			});

		const libraries = this.plugin.settings.libraries || [];
		libraries.forEach((lib, index) => {
			const libContainer = librariesDetails.createDiv();
			libContainer.addClass('eagle-library-item');
			if (lib.id === this.plugin.settings.currentLibraryId) {
				libContainer.addClass('eagle-library-active');
			}

			const header = new Setting(libContainer)
				.setClass('eagle-library-header')
				.setName(t('setting.libraries.libraryName'))
				.addText(text => text
					.setPlaceholder(t('setting.libraries.libraryName'))
					.setValue(lib.name)
					.onChange(async (value) => {
						lib.name = value;
						await this.plugin.saveSettings();
					}));

			header.addExtraButton(button => {
				const isActive = lib.id === this.plugin.settings.currentLibraryId;
				button.setIcon(isActive ? 'check' : 'arrow-right');
				button.setTooltip(isActive ? t('setting.libraries.active') : t('setting.libraries.setActive'));
				if (isActive) {
					button.extraSettingsEl.addClass('eagle-active-icon');
				}
				button.onClick(async () => {
					this.plugin.settings.currentLibraryId = lib.id;
					await this.plugin.saveSettings();
					await this.plugin.updateLibraryPath();
					this.display();
				});
			});

			header.addExtraButton(button => {
				button.setIcon('plus-with-circle');
				button.setTooltip(t('setting.libraryPaths.add'));
				button.onClick(async () => {
					lib.paths.push('');
					await this.plugin.saveSettings();
					this.display();
				});
			});

			header.addExtraButton(button => {
				button.setIcon('trash');
				button.setTooltip(t('setting.libraries.removeLibrary'));
				button.onClick(async () => {
					if (!this.plugin.settings.libraries) {
						return;
					}
					if (this.plugin.settings.libraries.length <= 1) {
						return;
					}
					this.plugin.settings.libraries.splice(index, 1);
					if (this.plugin.settings.currentLibraryId === lib.id) {
						const first = this.plugin.settings.libraries[0];
						this.plugin.settings.currentLibraryId = first.id;
					}
					await this.plugin.saveSettings();
					await this.plugin.updateLibraryPath();
					this.display();
				});
			});

			lib.paths.forEach((p, pathIndex) => {
				new Setting(libContainer)
					.setClass('eagle-path-setting')
					.addText(text => text
						.setPlaceholder(t('setting.libraryPaths.pathPlaceholder'))
						.setValue(p)
						.onChange(async (value) => {
							lib.paths[pathIndex] = value;
							await this.plugin.saveSettings();
							await this.plugin.updateLibraryPath();
						}))
					.addExtraButton(button => {
						button.setIcon('cross')
						.setTooltip(t('setting.libraryPaths.remove'))
						.onClick(async () => {
							lib.paths.splice(pathIndex, 1);
							await this.plugin.saveSettings();
							await this.plugin.updateLibraryPath();
							this.display();
						});
					});
			});
		});

		new Setting(containerEl)
			.setName(t('setting.folderId.name'))
			.setDesc(t('setting.folderId.desc'))
			.addText(text => text
				.setPlaceholder(t('setting.folderId.placeholder'))
				.setValue(this.plugin.settings.folderId || '')
				.onChange(async (value) => {
					this.plugin.settings.folderId = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t('setting.folderScope.name'))
			.setDesc(t('setting.folderScope.desc'))
			.addText(text => text
				.setPlaceholder(t('setting.folderScope.placeholder'))
				.setValue(this.plugin.settings.folderScope || '')
				.onChange(async (value) => {
					this.plugin.settings.folderScope = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
		.setName(t('setting.imageSize.name'))
		.setDesc(t('setting.imageSize.desc'))
		.addText(text => text
			.setPlaceholder(t('setting.imageSize.placeholder'))
			.setValue(this.plugin.settings.imageSize?.toString() || '')
			.onChange(async (value) => {
				this.plugin.settings.imageSize = value ? parseInt(value) : undefined;
				await this.plugin.saveSettings();
			}));

        new Setting(containerEl)
            .setName(t('setting.clickView.name'))
            .setDesc(t('setting.clickView.desc'))
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.clickView)
                    .onChange(async (value) => {
                        this.plugin.settings.clickView = value;
                        await this.plugin.saveSettings();
                    });
            });

		new Setting(containerEl)
		.setName(t('setting.adaptiveRatio.name'))
		.setDesc(t('setting.adaptiveRatio.desc'))
		.addSlider((slider) => {
			slider.setLimits(0.1, 1, 0.05);
			slider.setValue(this.plugin.settings.adaptiveRatio);
			slider.onChange(async (value) => {
				this.plugin.settings.adaptiveRatio = value;
				new Notice(t('setting.adaptiveRatio.notice', { value }));
				await this.plugin.saveSettings();
			});
			slider.setDynamicTooltip();
		});

		new Setting(containerEl)
            .setName(t('setting.advancedId.name'))
            .setDesc(t('setting.advancedId.desc'))
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.advancedID)
                    .onChange(async (value) => {
                        this.plugin.settings.advancedID = value;
                        await this.plugin.saveSettings();
                    });
            });

		new Setting(containerEl)
			.setName(t('setting.obsidianStoreId.name'))
			.setDesc(t('setting.obsidianStoreId.desc'))
			.addText(text => text
				.setPlaceholder(t('setting.obsidianStoreId.placeholder'))
				.setValue(this.plugin.settings.obsidianStoreId)
				.onChange(async (value) => {
					this.plugin.settings.obsidianStoreId = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
		.setName(t('setting.openInObsidian.name'))
		.setDesc(t('setting.openInObsidian.desc'))
		.addDropdown(dropdown => {
			dropdown.addOption('newPage', t('setting.openInObsidian.newPage'))
				.addOption('popup', t('setting.openInObsidian.popup'))
				.addOption('rightPane', t('setting.openInObsidian.rightPane'))
				.setValue(this.plugin.settings.openInObsidian || 'newPage')
				.onChange(async (value) => {
					this.plugin.settings.openInObsidian = value;
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl)
		.setName(t('setting.websiteUpload.name'))
		.setDesc(t('setting.websiteUpload.desc'))
		.addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.websiteUpload)
				.onChange(async (value) => {
					this.plugin.settings.websiteUpload = value;
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl)
			.setName(t('setting.refreshServer.name'))
			.setDesc(t('setting.refreshServer.desc'))
			.addButton(button => button
				.setButtonText(t('setting.refreshServer.button'))
				.onClick(() => {
					refreshServer(this.plugin.settings.libraryPath, this.plugin.settings.port);
				}));

		new Setting(containerEl)
			.setName(t('setting.debug.name'))
			.setDesc(t('setting.debug.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debug)
				.onChange(async (value) => {
					this.plugin.settings.debug = value;
					await this.plugin.saveSettings();
				}));
			
	}
}
