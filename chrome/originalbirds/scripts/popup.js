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
