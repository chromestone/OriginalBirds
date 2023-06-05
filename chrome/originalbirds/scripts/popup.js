if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {

	const headLink = document.createElement("link");
	headLink.rel = "stylesheet";
	headLink.href = "css/dark-hive/jquery-ui.css";
	document.head.appendChild(headLink);

	// Set the background color of your extension's page to a dark color
	document.body.style["background-color"] = "black";// "#202124";
	$('.text-color').css("color", "white");
}
else {

	const headLink = document.createElement("link");
	headLink.rel = "stylesheet";
	headLink.href = "css/base/jquery-ui.css";
	document.head.appendChild(headLink);
}

// INITIALIZATION

$('.toggle').toggles({type: "select"});

$('#tabs').tabs();
$('button').button();
$('#fieldsetblue > input[type="radio"]').checkboxradio().change(function() {

	$('#fieldsetblue > div.radiocontent').prop("hidden", true);

	const id = $(this).attr("id");
	if (id == "radiobluetext") {

		$('#divbluetext').prop("hidden", false);
	}
	else if (id == "radioblueimage") {

		$('#divblueimage').prop("hidden", false);
	}
	else {

		$('#divbluedefault').prop("hidden", false);
	}
});
$('#fieldsetlegacy > input[type="radio"]').checkboxradio().change(function() {

	$('#fieldsetlegacy > div.radiocontent').prop("hidden", true);

	const id = $(this).attr("id");
	if (id == "radiolegacytext") {

		$('#divlegacytext').prop("hidden", false);
	}
	else if (id == "radiolegacyimage") {

		$('#divlegacyimage').prop("hidden", false);
	}
	else {

		$('#divlegacydefault').prop("hidden", false);
	}
});

// POPULATE VALUES

chrome.storage.local.get([
	"checkmark", "showblue", "showlegacy", "bluelook", "legacylook", "bluecolor", "legacycolor",
	"bluetext", "legacytext", "blueimage", "legacyimage", "invocations", "polldelay"
], (result) => {

	// GENERAL

	$('#blue').toggles(result.showblue ?? true);
	$('#legacy').toggles(result.showlegacy ?? true);

	$('#blue').on("toggle", (_, active) => {

		chrome.storage.local.set({showblue: active});
	});

	$('#legacy').on("toggle", (_, active) => {

		chrome.storage.local.set({showlegacy: active});
	});

	$('.toggle').toggleClass("disabled", false);

	// APPEARANCE

	const blueLook = result.bluelook ?? "default";
	const legacyLook = result.legacylook ?? "default";

	if (blueLook == "text") {

		$('#radiobluetext').trigger("click");
	}
	else if (blueLook == "image") {

		$('#radioblueimage').trigger("click");
	}

	if (legacyLook == "text") {

		$('#radiolegacytext').trigger("click");
	}
	else if (legacyLook == "image") {

		$('#radiolegacyimage').trigger("click");
	}

	$('#bluecolor').val(result.bluecolor ?? "");
	$('#legacycolor').val(result.legacycolor ?? "");

	$('#bluetext').val(result.bluetext ?? "");
	$('#legacytext').val(result.legacytext ?? "");

	const blueURL = result.blueimage ?? "";
	const legacyURL = result.legacyimage ?? "";

	if (blueURL.length > 0) {

		const inputImg = document.createElement("img");
		$(inputImg).on("load", function() {

			const canvas = document.getElementById("canvasblueimage");
			const context = canvas.getContext("2d");
			context.drawImage(inputImg, 0, 0, 64, 64);
			$(canvas).prop("hidden", false);
		});
		$(inputImg).attr("src", blueURL);
	}

	if (legacyURL.length > 0) {

		const inputImg = document.createElement("img");
		$(inputImg).on("load", function() {

			const canvas = document.getElementById("canvaslegacyimage");
			const context = canvas.getContext("2d");
			context.drawImage(inputImg, 0, 0, 64, 64);
			$(canvas).prop("hidden", false);
		});
		$(inputImg).attr("src", legacyURL);
	}

	// ADVANCED

	const checkHtml = result.checkmark ?? "";
	const checkBlob = new Blob([checkHtml], {type: "text/plain"});
	$('#checkmarkdownload').attr("href", URL.createObjectURL(checkBlob));
	$('#checkmarkhtml').val(checkHtml);

	$('#invocations').val(result.invocations ?? 10);
	$('#polldelay').val(result.polldelay ?? 200);
});

// APPEARANCE

$('#blueimage').on("change", function() {

	const files = $(this).prop("files");
	if ((files?.length ?? 0) > 0) {

		const inputURL = URL.createObjectURL(files[0]);
		const inputImg = document.createElement("img");
		$(inputImg).on("load", function() {

			const canvas = document.getElementById("canvasblueimage");
			const context = canvas.getContext("2d");
			context.drawImage(inputImg, 0, 0, 64, 64);
			$(canvas).prop("hidden", false);

			URL.revokeObjectURL(inputURL);
		});
		$(inputImg).attr("src", inputURL);
	}
});

$('#legacyimage').on("change", function() {

	const files = $(this).prop("files");
	if ((files?.length ?? 0) > 0) {

		const inputURL = URL.createObjectURL(files[0]);
		const inputImg = document.createElement("img");
		$(inputImg).on("load", function() {

			const canvas = document.getElementById("canvaslegacyimage");
			const context = canvas.getContext("2d");
			context.drawImage(inputImg, 0, 0, 64, 64);
			$(canvas).prop("hidden", false);

			URL.revokeObjectURL(inputURL);
		});
		$(inputImg).attr("src", inputURL);
	}
});

$('#savebluebutton').on("click", function() {

	$(this).prop("disabled", true);

	const color = $('#bluecolor').val() ?? "";
	if (color.length === 0 || color.match(/^#[0-9A-F]{6}$/i)) {

		const radioId = $('#fieldsetblue > input[type="radio"]:checked').attr("id");
		let look;
		if (radioId == "radiobluetext") {

			look = "text";
		}
		else if (radioId == "radioblueimage") {

			look = "image";
		}
		else {

			look = "default";
		}

		const text = $('#bluetext').val()?.substring(0, 64) ?? "";
		if (look != "text" || text.length > 0) {

			const canvas = document.getElementById("canvasblueimage");
			const imageURL = (canvas == null || $(canvas).prop("hidden")) ? "" : canvas.toDataURL();
			if (look != "image" || imageURL.length > 0) {

				$('#blueerror').prop("hidden", true);

				chrome.storage.local.set({
					bluelook: look,
					bluecolor: color,
					bluetext: text,
					blueimage: imageURL
				}, () => $(this).prop("disabled", false));
				return;
			}
		}
	}

	$('#blueerror').prop("hidden", false);
	$(this).prop("disabled", false);
});

$('#savelegacybutton').on("click", function() {

	$(this).prop("disabled", true);

	const color = $('#legacycolor').val() ?? "";
	if (color.length === 0 || color.match(/^#[0-9A-F]{6}$/i)) {

		const radioId = $('#fieldsetlegacy > input[type="radio"]:checked').attr("id");
		let look;
		if (radioId == "radiolegacytext") {

			look = "text";
		}
		else if (radioId == "radiolegacyimage") {

			look = "image";
		}
		else {

			look = "default";
		}

		const text = $('#legacytext').val()?.substring(0, 64) ?? "";
		if (look != "text" || text.length > 0) {

			const canvas = document.getElementById("canvaslegacyimage");
			const imageURL = (canvas == null || $(canvas).prop("hidden")) ? "" : canvas.toDataURL();
			if (look != "image" || imageURL.length > 0) {

				$('#legacyerror').prop("hidden", true);

				chrome.storage.local.set({
					legacylook: look,
					legacycolor: color,
					legacytext: text,
					legacyimage: imageURL
				}, () => $(this).prop("disabled", false));
				return;
			}
		}
	}

	$('#legacyerror').prop("hidden", false);
	$(this).prop("disabled", false);
});

// ADVANCED

chrome.storage.onChanged.addListener((changes) => {

	if (changes.checkmark !== undefined) {

		const checkHtml = changes.checkmark.newValue ?? "";
		const checkBlob = new Blob([checkHtml], {type: "text/plain"});
		const prevURL = $('#checkmarkdownload').attr("href");
		if (prevURL != null) {

			URL.revokeObjectURL(prevURL);
		}
		$('#checkmarkdownload').attr("href", URL.createObjectURL(checkBlob));
		$('#checkmarkhtml').val(checkHtml);

		$('#reloadcheckmark').prop("disabled", false);
	}
});

$('#reloadcheckmark').on("click", function() {

	$(this).prop("disabled", true);
	chrome.runtime.sendMessage({text: "cachecheckmark!"});
});

$('#invocationsbutton').on("click", function() {

	$(this).prop("disabled", true);
	const value = $('#invocations').val() ?? "";
	if (value.match(/^[1-9]\d{0,6}$/)) {

		chrome.storage.local.set({invocations: parseInt(value)}, () => $(this).prop("disabled", false));
	}
	else {

		$('#invocations').effect({
			effect: "shake",
			complete: () => $(this).prop("disabled", false)
		});
	}
});

$('#polldelaybutton').on("click", function() {

	$(this).prop("disabled", true);
	const value = $('#polldelay').val() ?? "";
	if (value.match(/^[1-9]\d{0,6}$/)) {

		chrome.storage.local.set({polldelay: parseInt(value)}, () => $(this).prop("disabled", false));
	}
	else {

		$('#polldelay').effect({
			effect: "shake",
			complete: () => $(this).prop("disabled", false)
		});
	}
});

$('#handlesbutton').on("click", function() {

	$(this).prop("disabled", true);
	const versionValue = $('#handlesversionurl').val() ?? "";
	const handlesValue = $('#handlesurl').val() ?? "";

	let versionURL;
	let success = false;
	try {

		versionURL = new URL(versionValue);
		success = versionURL.protocol === "https:" && versionURL.search === "" &&
			versionURL.username === "" && versionURL.password === "";
	}
	catch(error) {

		console.log(error.message);
	}

	if (!success) {

		$('label[for="handlesversionurl"] > p').effect({
			effect: "shake",
			complete: () => $(this).prop("disabled", false)
		});
		return;
	}
	
	try {

		const inputURL = new URL(handlesValue);

		if (inputURL.protocol === "https:" && inputURL.search === "" &&
			inputURL.username === "" && inputURL.password === "") {

			chrome.storage.local.set({
				handlesversionurl: versionURL.toString(),
				handlesurl: inputURL.toString()
			}, () => $(this).prop("disabled", false));
			return;
		}
	}
	catch(error) {

		console.log(error.message);
	}

	$('label[for="handlesurl"] > p').effect({
		effect: "shake",
		complete: () => $(this).prop("disabled", false)
	});
});

$('#selectorsbutton').on("click", function() {

	$(this).prop("disabled", true);
	const value = ($('#selectorsurl').val() ?? "").trim();

	try {

		const base64Prefix = 'data:application/json;base64,';
		if (value.startsWith(base64Prefix)) {

			const decodedData = atob(value.substring(base64Prefix.length));
			// validate JSON
			JSON.parse(decodedData);

			chrome.storage.local.set({selectorsurl: value}, () => $(this).prop("disabled", false));
			return;
		}

		const inputURL = new URL(value);

		if (inputURL.protocol === "https:" && inputURL.search === "" &&
			inputURL.username === "" && inputURL.password === "") {

			chrome.storage.local.set({selectorsurl: inputURL.toString()}, () => $(this).prop("disabled", false));
			return;
		}
	}
	catch(error) {

		console.log(error.message);
	}

	$('#fieldsetselectors > legend').effect({
		effect: "shake",
		complete: () => $(this).prop("disabled", false)
	});
});
