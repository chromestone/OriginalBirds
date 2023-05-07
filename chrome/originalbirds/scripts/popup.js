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
$('#polldelay,#invocations').spinner({icons: {down: "ui-icon-blank", up: "ui-icon-blank"}});
$('.ui-spinner-input').css("margin-right", ".4em");
$('.ui-spinner a.ui-spinner-button').css("display", "none");

$('.toggle').toggles({type : "select"});

chrome.storage.local.get(["showblue", "showlegacy", "checkmark"], (result) => {

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

	console.log(changes);
	if (changes.hasOwnProperty("checkmark")) {

		$('#checkmarkhtml').val(changes.checkmark.newValue ?? "");
		$('#reloadcheckmark').prop("disabled", false);
	}
});

$('#reloadcheckmark').on("click", function() {

	$(this).prop("disabled", true);
	chrome.runtime.sendMessage({text: "cachecheckmark!"});
});

$('#reloadcheckmark').on("click", function() {

	$(this).prop("disabled", true);
	chrome.runtime.sendMessage({text: "cachecheckmark!"});
});

$('#polldelaybutton').on("click", function() {

	console.log($('#polldelay').spinner("value"));
});
