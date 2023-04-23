chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

	if (msg.text == "tab_id?") {

		sendResponse({tab : sender.tab.id});
	}
});

chrome.storage.local.get('checkmark', function(result) {

	if (typeof result.checkmark === 'undefined') {

		chrome.tabs.create({url : "https://twitter.com/elonmusk", active : false}, function(tab) {

			chrome.storage.local.set({closeme : tab.id});
		});
	}
});

async function loadHandles() {

	const response = await fetch("../data/verified_handles.txt");
	const data = await response.text();
	const handles = data.split('\n');

	const handlesSet = new Set(handles);
	chrome.storage.local.set({handles : [...handlesSet]});
}

chrome.storage.local.get('handles', (result) => {

	if (typeof result.handles === 'undefined') {

		loadHandles();
	}
});
chrome.runtime.onStartup.addListener(loadHandles);
