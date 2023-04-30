if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {

	// Set the background color of your extension"s page to a dark color
	document.body.style.backgroundColor = "#202124";//"black";
	const textElements = document.getElementsByClassName("text-color");
	for (const element of textElements) {

		element.style.color = "white";
	}
}

$('.toggle').toggles({type : "select"});

function goCacheCheckmark() {

	chrome.storage.local.get("checkmark", function(result) {

		if (typeof result.checkmark === 'undefined') {

			chrome.tabs.create({url : "https://twitter.com/elonmusk", active : false}, function(tab) {

				chrome.storage.local.set({closeme : tab.id});
			});
		}
	});
}

function displayNormalSpan() {

	goCacheCheckmark();
	chrome.storage.local.get(["showblue", "showlegacy"], (result) => {

		$('#blue').toggles(typeof result.showblue === 'undefined' ? true : result.showblue);
		$('#legacy').toggles(typeof result.showlegacy === 'undefined' ? true : result.showlegacy);
	
		$('#blue').on("toggle", (e, active) => {
	
			chrome.storage.local.set({"showblue" : active});
		});
	
		$('#legacy').on("toggle", (e, active) => {
	
			chrome.storage.local.set({"showlegacy" : active});
		});

		$('.toggle').toggleClass("disabled", false);
		$('#legacy').toggleClass("disabled", false);
	});
	$('#normal_span').attr("hidden", false);
}

function actionListener(e, active) {

	$('#perm').toggleClass("disabled", true);
	browser.permissions.request({ origins: ['https://*.twitter.com/*'] }).then((result) => {

		if (result) {

			$('#permission_span').attr("hidden", true);
			displayNormalSpan();
		}
		else {

			$('#perm').toggles(false);
			$('#perm').toggleClass("disabled", false);
		}
	});
}

browser.permissions.contains({ origins: ["https://*.twitter.com/*"] }).then((result) => {

	if (result) {

		displayNormalSpan();
	}
	else {

		$('#perm').on("toggle", actionListener);
		$('#perm').toggleClass("disabled", false);
		$('#permission_span').removeAttr("hidden");
	}
}).catch((error) => {

	console.error(error);
});
