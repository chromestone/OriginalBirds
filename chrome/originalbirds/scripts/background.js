// global.ready = false;
var ready = false;

function waitForReady(callback) {

	if (global.ready) {

		callback();
	}
	else {

		window.setTimeout(function() {

			waitForReady(global.ready, callback);
		}, 100);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

	if (request.request == "verifyHandles") {

		waitForReady(myBoolean, function() {

			const isInSetArray = request.handles.map(element => global.handlesSet.has(element));
			sendResponse({"isVerified" : isInSetArray})
		});
	}
})

async function loadHandles() {

	const response = await fetch("../data/verified_handles.txt");
	const data = await response.text();
	const handles = data.split('\n');

	global.handlesSet = new Set(handles);
	global.ready = true;
}

loadHandles();
