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

/*
// declare a function to open a new tab and find an element on that page
function retrieveCheckmark() {

	// return new Promise((resolve) => {

		// create a new tab
		chrome.tabs.create({url: "https://twitter.com/elonmusk"}, function(tab) {

			console.log(tab.id);
			chrome.storage.local.set({closeme : tab.id});
		});
		/*
			// wait for the tab to load
			chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

				// check if the tab has finished loading and is active
				if (tabId === tab.id && changeInfo.status === "complete" && tab.active) {

					// find an element with class "example-element"
					chrome.tabs.executeScript(tab.id, {code: "document.querySelector('#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span > span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-1pos5eu.r-qvutc0 > span > span > div:nth-child(1)').outerHTML"},
						function(result) {
							// log the result to the console
							console.log(result);
					});
				}
				else {

					//TODO
					;
				}
			});
	// });
	retrieveCheckmark();
}*/
