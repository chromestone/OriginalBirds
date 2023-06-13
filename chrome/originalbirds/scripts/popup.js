const DEFAULT_SELECTORS_URL = "https://original-birds.pages.dev/selectors.json";

const DEFAULT_HANDLES_VERSION_URL = "https://original-birds.pages.dev/version.txt";
const DEFAULT_HANDLES_URL = "https://original-birds.pages.dev/verified_handles.txt";

// INITIALIZATION

$('#tabs').tabs();
$('button').button();
$('#fieldsetblue > input[type="radio"]').checkboxradio().change(function() {

	$('#fieldsetblue > div.radiocontent').prop("hidden", true);

	const id = $(this).attr("id");
	$(id === "radiobluetext" ? '#divbluetext' :
		id === "radioblueimage" ? '#divblueimage' : '#divbluedefault').prop("hidden", false);
});
$('#fieldsetlegacy > input[type="radio"]').checkboxradio().change(function() {

	$('#fieldsetlegacy > div.radiocontent').prop("hidden", true);

	const id = $(this).attr("id");
	$(id === "radiolegacytext" ? '#divlegacytext' :
		id === "radiolegacyimage" ? '#divlegacyimage' : '#divlegacydefault').prop("hidden", false);
});

// POPULATE VALUES

chrome.storage.local.get([
	"checkmark", "showblue", "showlegacy", "bluelook", "legacylook", "bluecolor", "legacycolor",
	"bluetext", "legacytext", "blueimage", "legacyimage", "invocations", "polldelay",
	"handlesfrequency", "handlesversion", "handlesversionurl", "handlesurl",
	"selectors", "selectorsurl"
], (result) => {

	if (result.checkmark === undefined) {

		chrome.runtime.sendMessage({text: "cachecheckmark!"});
	}

	// GENERAL

	// do not use new here
	$('#blue').toggles({on: Boolean(result.showblue ?? true)});
	$('#legacy').toggles({on: Boolean(result.showlegacy ?? true)});

	$('#blue').on("toggle", function (_, active) {

		$(this).toggleClass("disabled", true);
		chrome.storage.local.set({showblue: active}, () =>
			$(this).toggleClass("disabled", false));
	});

	$('#legacy').on("toggle", (_, active) => {

		$(this).toggleClass("disabled", true);
		chrome.storage.local.set({showlegacy: active}, () =>
			$(this).toggleClass("disabled", false));
	});

	$('.toggle').toggleClass("disabled", false);

	// APPEARANCE

	const blueLook = result.bluelook ?? "default";
	const legacyLook = result.legacylook ?? "default";

	$(blueLook === "text" ? '#radiobluetext' :
		blueLook === "image" ? '#radioblueimage' : '#radiobluedefault').trigger("click");
	$(legacyLook === "text" ? '#radiolegacytext' :
		legacyLook === "image" ? '#radiolegacyimage' : '#radiolegacydefault').trigger("click");

	// do not use new here
	$('#bluecolor').val(String(result.bluecolor ?? ""));
	$('#legacycolor').val(String(result.legacycolor ?? ""));

	$('#bluetext').val(String(result.bluetext ?? ""));
	$('#legacytext').val(String(result.legacytext ?? ""));

	const blueURL = String(result.blueimage ?? "");
	const legacyURL = String(result.legacyimage ?? "");

	if (blueURL.length > 0 && blueURL.startsWith("data:")) {

		const inputImg = document.createElement("img");
		$(inputImg).on("load", function() {

			const canvas = document.getElementById("canvasblueimage");
			const context = canvas.getContext("2d");
			context.drawImage(inputImg, 0, 0, 64, 64);
			$(canvas).prop("hidden", false);
		});
		$(inputImg).attr("src", blueURL);
	}

	if (legacyURL.length > 0 && legacyURL.startsWith("data:")) {

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

	// do not use new here
	const checkHtml = String(result.checkmark ?? "");
	const checkBlob = new Blob([checkHtml], {type: "text/plain"});
	$('#checkmarkdownload').attr("href", URL.createObjectURL(checkBlob));
	$('#checkmarkhtml').val(checkHtml);

	// do not use new here
	const selectorsJSON = String(result.selectors ?? "");
	const selectorsBlob = new Blob([selectorsJSON], {type: "application/json"});
	$('#selectorsdownload').attr("href", URL.createObjectURL(selectorsBlob));
	$('#selectorsjson').val(selectorsJSON);

	const handlesVersion = result.handlesversion ?? ["0"];
	// do not use new here
	$('#handlesversion').text(String(Array.isArray(handlesVersion) && handlesVersion.length > 0 ?
		handlesVersion[0] : "???"));

	// do not use new here
	// does not trigger change function
	$('#handlesfrequency').val(String(result.handlesfrequency ?? "weekly"))

	// do not use new here
	$('#invocations').val(Number(result.invocations ?? 10).toString());
	$('#polldelay').val(Number(result.polldelay ?? 200).toString());

	$('#selectorsurl').val(String(result.selectorsurl ?? DEFAULT_SELECTORS_URL));

	$('#handlesversionurl').val(String(result.handlesversionurl ?? DEFAULT_HANDLES_VERSION_URL));
	$('#handlesurl').val(String(result.handlesurl ?? DEFAULT_HANDLES_URL));
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
	if (color.length === 0 || color.match(/^#[0-9A-Fa-f]{6}$/)) {

		const radioId = $('#fieldsetblue > input[type="radio"]:checked').attr("id");
		const look = radioId === "radiobluetext" ?
			"text" : radioId === "radioblueimage" ? "image" : "default";

		const text = $('#bluetext').val()?.substring(0, 64) ?? "";
		if (look !== "text" || text.length > 0) {

			const canvas = document.getElementById("canvasblueimage");
			const imageURL = (canvas === null || $(canvas).prop("hidden")) ?
				"" : canvas.toDataURL();
			if (look !== "image" || imageURL.length > 0) {

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
	if (color.length === 0 || color.match(/^#[0-9A-Fa-f]{6}$/)) {

		const radioId = $('#fieldsetlegacy > input[type="radio"]:checked').attr("id");
		const look = radioId === "radiolegacytext" ?
			"text" : radioId === "radiolegacyimage"? "image" : "default";

		const text = $('#legacytext').val()?.substring(0, 64) ?? "";
		if (look !== "text" || text.length > 0) {

			const canvas = document.getElementById("canvaslegacyimage");
			const imageURL = (canvas === null || $(canvas).prop("hidden")) ?
				"" : canvas.toDataURL();
			if (look !== "image" || imageURL.length > 0) {

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

chrome.storage.local.onChanged.addListener((changes) => {

	if (changes.checkmark !== undefined) {

		// do not use new here
		const checkHtml = String(changes.checkmark.newValue ?? "");
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

$('#reloadselectors').on("click", function() {

	$(this).prop("disabled", true);
	chrome.runtime.sendMessage({text: "fetchselectors?"}, (response) => {

		$('#selectorssuccess').prop("hidden", !response.success);
		$('#selectorserror').prop("hidden", response.success);

		if (!response.success) {

			$(this).prop("disabled", false);
			return;
		}

		chrome.storage.local.get("selectors", (result) => {

			// do not use new here
			const selectorsJSON = String(result.selectors ?? "");
			const selectorsBlob = new Blob([selectorsJSON], {type: "application/json"});
			const prevURL = $('#selectorsdownload').attr("href");
			if (prevURL != null) {

				URL.revokeObjectURL(prevURL);
			}
			$('#selectorsdownload').attr("href", URL.createObjectURL(selectorsBlob));
			$('#selectorsjson').val(selectorsJSON);

			$(this).prop("disabled", false);
		});
	});
});

$('#handlesfrequency').change(function() {

	$(this).prop("disabled", true);
	chrome.storage.local.set({handlesfrequency: $(this).val()}, () =>
		$(this).prop("disabled", false));
});

$('#fetchhandles').on("click", function() {

	$(this).prop("disabled", true);
	chrome.runtime.sendMessage({text: "fetchhandles?"}, (response) => {

		$('#handlessuccess').prop("hidden", !response.success);
		$('#handleserror').prop("hidden", response.success);
		$(this).prop("disabled", false);
	});
});

$('#invocationsbutton').on("click", function() {

	$(this).prop("disabled", true);
	const value = $('#invocations').val() ?? "";
	if (value.match(/^[1-9]\d{0,6}$/)) {

		chrome.storage.local.set({
			invocations: parseInt(value)
		}, () => $(this).prop("disabled", false));
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

		chrome.storage.local.set({
			polldelay: parseInt(value)
		}, () => $(this).prop("disabled", false));
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

	let versionValue, handlesValue;
	try {

		const versionURL = new URL($('#handlesversionurl').val() ?? "");
		if (versionURL.protocol === "https:" && versionURL.search === "" &&
			versionURL.username === "" && versionURL.password === "") {

			versionValue = versionURL.toString();
		}

		const inputURL = new URL($('#handlesurl').val() ?? "");
		if (inputURL.protocol === "https:" && inputURL.search === "" &&
			inputURL.username === "" && inputURL.password === "") {

			handlesValue = inputURL.toString();
		}
	}
	catch(error) {

		console.log(error.message);
	}

	if (versionValue == null || handlesValue == null) {

		$('#handlesurlerror').prop("hidden", false);
		return;
	}

	chrome.storage.local.get(["handlesversionurl", "handlesurl"], (result) =>
		chrome.storage.local.set({
			handlesversionurl: versionValue,
			handlesurl: handlesValue
		}, () => chrome.runtime.sendMessage({text: "fetchhandles?"}, (response) => {

			$('#handlesurlerror').prop("hidden", response.success);

			if (!response.success) {

				// reset to original value
				chrome.storage.local.set({
					handlesversionurl: result.handlesversionurl ?? DEFAULT_HANDLES_VERSION_URL,
					handlesurl: result.handlesurl ?? DEFAULT_HANDLES_URL
				}, () => $(this).prop("disabled", false));
				return;
			}

			$(this).prop("disabled", false);
		}))
	);
});

$('#selectorsbutton').on("click", function() {

	$(this).prop("disabled", true);
	const JSON_DATA_URL_PREFIX = "data:application/json;base64,";

	const value = ($('#selectorsurl').val() ?? "").trim();

	let selectorsValue;
	try {

		if (value.startsWith(JSON_DATA_URL_PREFIX)) {

			const decodedData = atob(value.substring(JSON_DATA_URL_PREFIX.length));
			// validate JSON
			JSON.parse(decodedData);
			selectorsValue = value;
		}
		else {

			const inputURL = new URL(value);
			if (inputURL.protocol === "https:" && inputURL.search === "" &&
				inputURL.username === "" && inputURL.password === "") {

				selectorsValue = inputURL.toString();
			}
		}
	}
	catch(error) {

		console.log(error.message);
	}

	if (selectorsValue == null) {

		$('#selectorsurlerror').prop("hidden", false);
		return;
	}

	chrome.storage.local.get("selectorsurl", (result) =>
		chrome.storage.local.set({selectorsurl: selectorsValue}, () =>
			chrome.runtime.sendMessage({text: "fetchselectors?"}, (response) => {

				$('#selectorsurlerror').prop("hidden", response.success);

				if (!response.success) {

					// reset to original value
					chrome.storage.local.set({
						selectorsurl: result.selectorsurl ?? DEFAULT_SELECTORS_URL
					}, () => $(this).prop("disabled", false));
					return;
				}

				$(this).prop("disabled", false);
			})
		)
	);
});

$('#advancedresetbutton').on("click", function() {

	$(this).prop("disabled", true);

	$('#handlesfrequency').val("weekly")

	$('#invocations').val((10).toString());
	$('#polldelay').val((200).toString());

	$('#selectorsurl').val(DEFAULT_SELECTORS_URL);

	$('#handlesversionurl').val(DEFAULT_HANDLES_VERSION_URL);
	$('#handlesurl').val(DEFAULT_HANDLES_URL);

	chrome.storage.local.set({
		handlesfrequency: "weekly",
		invocations: 10,
		polldelay: 200,
		selectorsurl: DEFAULT_SELECTORS_URL,
		handlesversionurl: DEFAULT_HANDLES_VERSION_URL,
		handlesurl: DEFAULT_HANDLES_URL
	}, () => $(this).prop("disabled", false));
});
