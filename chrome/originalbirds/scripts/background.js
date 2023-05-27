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

function getFrequency(freq) {

	if (freq === "daily") {

		return 24 * 60 * 60 * 1000;
	}
	if (freq === "weekly") {

		return 7 * 24 * 60 * 60 * 1000;
	}
	if (freq === "monthly") {

		return 28 * 24 * 60 * 60 * 1000;
	}
	if (freq === "yearly") {

		return 365 * 24 * 60 * 60 * 1000;
	}
	return 0;
}

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

async function fetchHandles() {

	let data;
	try {

		const response = await fetch("https://original-birds.pages.dev/verified_handles.txt");
		data = await response.text();
	}
	catch (error) {

		console.log(error.message);
		console.log("Warning: Original Birds could not retrieve the latest legacy users list.");

		try {

			const response = await fetch("../data/verified_handles.txt");
			data = await response.text();
		}
		catch (error) {

			console.error(error);
			return;
		}
	}

	const handles = data.split('\n').filter((str) => str !== "").map((str) => str.toLowerCase());
	const handlesSet = new Set(handles);

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	chrome.storage.local.set({handles: Array.from(handlesSet), lasthandlesupdate: theDate.toJSON});
}

async function fetchSupporters() {

	const response = await fetch("https://original-birds.pages.dev/supporters.json");
	const data = await response.text();

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	chrome.storage.local.set({supporters: data, lastlaunch: theDate.toJSON()});
}

chrome.storage.local.get([
	"checkmark", "handles", "selectors", "supporters",
	"lasthandlesupdate", "lastselectorsupdate", "lastlaunch",
	"checkmarkfrequency", "handlesfrequency", "selectorsfrequency"], (result) => {

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	// TODO: checkmark freq
	if (result.checkmark === undefined) {

		cacheCheckmark();
	}

	if (result.supporters === undefined ||
		result.lastlaunch === undefined ||
		Math.abs(theDate - new Date(result.lasthandlesupdate)) >=
		getFrequency(result.handlesfrequency ?? "weekly")) {

		fetchHandles();
	}

	if (result.supporters === undefined ||
		result.lastlaunch === undefined ||
		Math.abs(theDate - new Date(result.lastlaunch)) >= 24 * 60 * 60 * 1000) {

		fetchSupporters();
	}
});
