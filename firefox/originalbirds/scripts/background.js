let closemeListener = (_, sendResponse) => sendResponse({closeme: false});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

	if (msg.text === "closeme?") {

		closemeListener(sender, sendResponse);
		return true;
	}
	else if (msg.text === "cachecheckmark!") {

		cacheCheckmark();
	}
	return false;
});

function cacheCheckmark() {

	const callbacks = [];
	closemeListener = (...theArgs) => callbacks.push(theArgs);
	chrome.tabs.create({url: "https://twitter.com/elonmusk", active: false}, (tab) => {

		closemeListener = (sender, sendResponse) => sendResponse({closeme: sender.tab.id === tab.id});
		// if the previous line does not outpace the content script's request
		// then clearing the backlog handles it
		callbacks.forEach((theArgs) => closemeListener(...theArgs));
	});
}

async function loadHandles() {

	const response = await fetch("../data/verified_handles.txt");
	const data = await response.text();
	const handles = data.split('\n').filter((str) => str !== "").map((str) => str.toLowerCase());

	const handlesSet = new Set(handles);
	chrome.storage.local.set({handles: Array.from(handlesSet)});
}

async function getSupporters() {

	const response = await fetch("https://original-birds.pages.dev/supporters.json");
	const data = await response.text();

	chrome.storage.local.set({supporters: data});
	const theDate = new Date();
	theDate.setHours(0,0,0,0);
	chrome.storage.local.set({lastlaunch: theDate.toJSON()});
}

chrome.storage.local.get([
	"handles", "supporters", "lastlaunch"
], (result) => {

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	// this is not a true value,
	// rather it is used to force a checkmark cache if an update deems it necessary.
	const LAST_TWITTER_UPDATE = new Date("2023-04-22T16:00:00.000Z");
	result.lastcheckmarkupdate ??= new Date("2023-04-26T16:00:00.000Z");

	if (result.checkmark === undefined ||
		// check if last Twitter update is newer than when checkmark was last retrieved
		LAST_TWITTER_UPDATE >= result.lastcheckmarkupdate) {

			browser.permissions.contains({origins: ["https://*.twitter.com/*"]}).then((result) =>
				result && cacheCheckmark());
	}

	const oneWeekInMilliseconds = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

	const overdue = typeof result.lastlaunch === 'undefined' ||
		Math.abs(theDate - new Date(result.lastlaunch)) >= oneWeekInMilliseconds;

	if (typeof result.handles === 'undefined' || overdue) {

		loadHandles();
	}

	if (typeof result.supporters === 'undefined' || overdue) {

		getSupporters();
	}
});
