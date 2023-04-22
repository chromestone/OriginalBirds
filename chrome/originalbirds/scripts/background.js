chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	if (msg.text == "tab_id?") {
		sendResponse({tab: sender.tab.id});
	}
});

chrome.tabs.create({url: "https://twitter.com/elonmusk"}, function(tab) {

	console.log(tab.id);
	chrome.storage.local.set({closeme : tab.id});
});

async function loadHandles() {

	const response = await fetch("../data/verified_handles.txt");
	const data = await response.text();
	const handles = data.split('\n');

	const handlesSet = new Set(handles);
	chrome.storage.local.set({handles : [...handlesSet]});
}

loadHandles();
