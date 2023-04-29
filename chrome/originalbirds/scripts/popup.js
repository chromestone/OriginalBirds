if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {

	// Set the background color of your extension"s page to a dark color
	document.body.style.backgroundColor = "black";
	const textElements = document.getElementsByClassName("text-color");
	for (const element of textElements) {

		element.style.color = "white";
	}
}

function broadcastSettingsChanged() {

	chrome.tabs.query({url : "https://*.twitter.com/*"}, (tabs) => {

		const message = {text : "settingschanged"};
		for (const t of tabs) {

			//console.log(t.title);
			//try {

			chrome.tabs.sendMessage(t.id, message).
			catch((error) => {

				console.error(error);
			});
			//}
			//catch (error) {

			//	console.log(error);
			//}
		}
	});
}

$('.toggle').toggles({type : "select"});

chrome.storage.local.get(["showblue", "showlegacy"], (result) => {

	//console.log(result);

	$('#blue').toggles(typeof result.showblue === 'undefined' ? true : result.showblue);
	$('#legacy').toggles(typeof result.showlegacy === 'undefined' ? true : result.showlegacy);

	$('#blue').on("toggle", (e, active) => {

		chrome.storage.local.set({"showblue" : active});
		//console.log("hi");
		broadcastSettingsChanged();
		// chrome.runtime.sendMessage({text : "settingschanged"});
		//console.log("sent");
	});

	$('#legacy').on("toggle", (e, active) => {

		chrome.storage.local.set({"showlegacy" : active});
		//console.log("hi");
		broadcastSettingsChanged();
		//chrome.runtime.sendMessage({text : "settingschanged"});
		//console.log("sent");
	});

	$('.toggle').toggleClass("disabled", false);
});
