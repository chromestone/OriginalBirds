chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

	if (msg.text == "tab_id?") {

		sendResponse({tab : sender.tab.id});
	}
});

chrome.storage.local.get("checkmark", function(result) {

	if (typeof result.checkmark === 'undefined') {

		chrome.tabs.create({url : "https://twitter.com/elonmusk", active : false}, function(tab) {

			chrome.storage.local.set({closeme : tab.id});
		});
	}
});

async function loadHandles() {

	const response = await fetch("../data/verified_handles.txt");
	const data = await response.text();
	const handles = data.split('\n').filter((str) => str !== "").map((str) => str.toLowerCase());

	const handlesSet = new Set(handles);
	chrome.storage.local.set({handles : [...handlesSet]});
}

chrome.storage.local.get("handles", (result) => {

	if (typeof result.handles === 'undefined') {

		loadHandles();
	}
});
chrome.runtime.onStartup.addListener(loadHandles);

async function getSupporters() {

	const response = await fetch("https://chromestone.github.io/OriginalBirds/supporters.json");
	const data = await response.text();

	chrome.storage.local.set({supporters : data});
	const theDate = new Date();
	theDate.setHours(0,0,0,0);
	chrome.storage.local.set({lastlaunch : theDate.toJSON()});
}

chrome.storage.local.get(["supporters", "lastlaunch"], (result) => {

	const oneWeekInMilliseconds = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
	const theDate =new Date();
	theDate.setHours(0,0,0,0);
	if (typeof result.supporters === 'undefined' || typeof result.lastlaunch === 'undefined' ||
		Math.abs(theDate - new Date(result.lastlaunch)) >= oneWeekInMilliseconds) {

		getSupporters();
	}
});
