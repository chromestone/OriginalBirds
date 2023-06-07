$('button').button();

chrome.storage.local.get(["blueimage", "legacyimage"], (result) => {

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
});

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

	const canvas = document.getElementById("canvasblueimage");
	const imageURL = (canvas == null || $(canvas).prop("hidden")) ? "" : canvas.toDataURL();
	if (imageURL.length > 0) {

		$('#blueerror').prop("hidden", true);

		chrome.storage.local.set({
			"bluelook": "image",
			"blueimage": imageURL
		}, () => $(this).prop("disabled", false));
		return;
	}

	$('#blueerror').prop("hidden", false);
	$(this).prop("disabled", false);
});

$('#savelegacybutton').on("click", function() {

	$(this).prop("disabled", true);

	const canvas = document.getElementById("canvaslegacyimage");
	const imageURL = (canvas == null || $(canvas).prop("hidden")) ? "" : canvas.toDataURL();
	if (imageURL.length > 0) {

		$('#legacyerror').prop("hidden", true);

		chrome.storage.local.set({
			"legacylook": "image",
			"legacyimage": imageURL
		}, () => $(this).prop("disabled", false));
		return;
	}

	$('#legacyerror').prop("hidden", false);
	$(this).prop("disabled", false);
});
