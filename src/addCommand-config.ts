import MyPlugin from './main';
import { syncTags } from "./synchronizedpagetabs";
import { jumpModal, openInsertImageFromEagleModal } from "./eaglejumpobsidian";
import { MarkdownView, Notice } from "obsidian";
import { t } from "./i18n";

export const addCommandSynchronizedPageTabs = (myPlugin: MyPlugin) => {
	myPlugin.addCommand({
		id: "synchronized-page-tabs",
		name: "Synchronized Page Tabs",
		callback: async () => {
			syncTags(myPlugin.app, myPlugin.settings);
		},
	});
};

export const addCommandEagleJump = (myPlugin: MyPlugin) => {
	myPlugin.addCommand({
		id: "eagle-jump-obsidian",
		name: "Eagle Jump Obsidian",
		callback: async () => {
			jumpModal(myPlugin.app, myPlugin.settings);
		},
	});
};

export const addCommandInsertImageFromEagle = (myPlugin: MyPlugin) => {
	myPlugin.addCommand({
		id: "insert-image-from-eagle",
		name: "Insert Image From Eagle",
		callback: async () => {
			openInsertImageFromEagleModal(myPlugin);
		},
	});
};

export const addCommandReverseSync = (myPlugin: MyPlugin) => {
	myPlugin.addCommand({
		id: "reverse-sync-eagle-links",
		name: "Reverse Sync Eagle Links in Current File",
		callback: async () => {
			const view = myPlugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				// Force sync even if setting is off, or just call the function?
				// The function checks the setting. We should probably bypass the setting check for manual trigger?
				// Or better, make the function accept a 'force' parameter.
				// For now, I'll let the function handle it, but I'll modify the function to accept an optional 'force' flag.
				// Since I can't easily change the function signature in main.ts from here without editing main.ts first,
				// I'll assume I will edit main.ts to accept 'force'.
				await myPlugin.reverseSync(view, true); 
			} else {
				new Notice(t('modal.insertImage.noActiveEditor'));
			}
		},
	});
};
