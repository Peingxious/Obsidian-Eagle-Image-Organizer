import { moment } from "obsidian";
import { en, type TranslationKey } from "./lang/en";
import { zh } from "./lang/zh";

type Lang = "en" | "zh";

function getCurrentLanguage(): Lang {
	const locale = moment.locale();
	if (locale.startsWith("zh")) return "zh";
	return "en";
}

const dictionaries: Record<Lang, Record<TranslationKey, string>> = {
	en,
	zh,
};

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
	try {
		const lang = getCurrentLanguage();
		const dict = dictionaries[lang] || en;
		let text = dict[key] ?? en[key] ?? key;

		if (params) {
			for (const [name, value] of Object.entries(params)) {
				text = text.replace(new RegExp(`{${name}}`, "g"), String(value));
			}
		}

		return text;
	} catch (error) {
		console.error("i18n error:", error);
		return key;
	}
}

export type { TranslationKey };

