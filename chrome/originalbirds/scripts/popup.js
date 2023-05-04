if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {

	// Set the background color of your extension"s page to a dark color
	document.body.style.backgroundColor = "#202124";//"black";
	const textElements = document.getElementsByClassName("text-color");
	for (const element of textElements) {

		element.style.color = "white";
	}
}

$('.toggle').toggles({type : "select"});

chrome.storage.local.get(["showblue", "showlegacy"], (result) => {

	$('#blue').toggles(result.showblue ?? true);
	$('#legacy').toggles(result.showlegacy ?? true);

	$('#blue').on("toggle", (e, active) => {

		chrome.storage.local.set({"showblue" : active});
	});

	$('#legacy').on("toggle", (e, active) => {

		chrome.storage.local.set({"showlegacy" : active});
	});

	$('.toggle').toggleClass("disabled", false);
});
