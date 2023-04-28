if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
	// Set the background color of your extension"s page to a dark color
	document.body.style.backgroundColor = "black";
	const textElements = document.getElementsByClassName("text-color");
	for (const element of textElements) {

		element.style.color = "white";
	}
}

chrome.storage.local.get("lastlaunch", (result) => {

	console.log(result);
});

$('.toggle').toggles({type : "select"});

$('#blue').on("toggle", function(e, active) {
	if (active) {
		console.log("Toggle is now ON!");
	} else {
		console.log("Toggle is now OFF!");
	}
});

$('#legacy').on("toggle", function(e, active) {
	if (active) {
		console.log("Toggle is now ON!");
	} else {
		console.log("Toggle is now OFF!");
	}
});
