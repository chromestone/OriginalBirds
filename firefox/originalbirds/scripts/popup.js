if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {

	const headLink = document.createElement("link");
	headLink.rel = "stylesheet";
	headLink.href = "css/dark-hive/jquery-ui.css";
	document.head.appendChild(headLink);

	// Set the background color of your extension's page to a dark color
	document.body.style.backgroundColor = "black";// "#202124";
	$('.text-color').css("color", "white");
}
else {

	const headLink = document.createElement("link");
	headLink.rel = "stylesheet";
	headLink.href = "css/base/jquery-ui.css";
	document.head.appendChild(headLink);
}

$('#tabs').tabs();
$('button').button();

$('.toggle').toggles({type: "select"});

function displayNormalSpan() {

	chrome.storage.local.get(["showblue", "showlegacy", "checkmark"], (result) => {

		if (typeof result.checkmark === 'undefined') {

			chrome.runtime.sendMessage({text: "cachecheckmark!"});
		}

		$('#blue').toggles(result.showblue ?? true);
		$('#legacy').toggles(result.showlegacy ?? true);

		$('#blue').on("toggle", (_, active) => {
	
			chrome.storage.local.set({"showblue" : active});
		});
	
		$('#legacy').on("toggle", (_, active) => {
	
			chrome.storage.local.set({"showlegacy" : active});
		});

		$('.toggle').toggleClass("disabled", false);

		$('#checkmarkhtml').val(result.checkmark ?? "");
	});

	chrome.storage.onChanged.addListener((changes) => {

		if (changes.hasOwnProperty("checkmark")) {
	
			$('#checkmarkhtml').val(changes.checkmark.newValue ?? "");
			$('#reloadcheckmark').prop("disabled", false);
		}
	});

	$('#reloadcheckmark').on("click", function() {
	
		$(this).prop("disabled", true);
		chrome.runtime.sendMessage({text: "cachecheckmark!"});
	});

	document.body.style["margin-top"] = "0";
	document.body.style["margin-bottom"] = "0";
	document.body.style["margin-left"] = "0";
	$('#normal_span').attr("hidden", false);
}

function actionListener(_, __) {

	$('#perm').toggleClass("disabled", true);
	browser.permissions.request({origins: ['https://*.twitter.com/*']}).then((result) => {

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

browser.permissions.contains({origins: ["https://*.twitter.com/*"]}).then((result) => {

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
