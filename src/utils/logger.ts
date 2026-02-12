let DEBUG = false;

export const print = (message?: any, ...optionalParams: any[]) => {
	if (DEBUG) {
		console.log(message, ...optionalParams);
	}
};

export function setDebug(value: boolean) {
	DEBUG = value;
}
