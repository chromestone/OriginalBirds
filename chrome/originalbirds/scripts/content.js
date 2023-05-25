// checkmark selector to get html with checkmark svg
const CHECK_SELECTOR = 'div[data-testid="UserName"] > ' + '* > '.repeat(4) + '[dir] > ' + '* > '.repeat(4) + ':nth-child(1)';

// targets user name on their profile/feed page
const USER_SELECTOR = 'div[data-testid="UserName"] > ' + '* > '.repeat(5) + '[dir] > *';
// targets top heading on user page
const HEADING_SELECTOR = 'h2[role="heading"] > ' + '* > '.repeat(4) + ':last-child > *';

// targets feed topmost post
// targets user feed or thread reply with (nested) post
const FEED_SELECTOR = 'div[data-testid="User-Name"] > :last-child > * > * > * > [dir] > *';

// targets user name when writing a popup reply
const COMPOSE_REPLY_TWEET_SELECTOR = 'div[data-testid="User-Name"] > :last-child > * > * > [dir] > span';

// targets overlay upon hovering on user
const HOVER_CARD_SELECTOR = 'div[data-testid="HoverCard"] > ' + '* > '.repeat(8) + '[dir] > span';

// targets recommendation and people you might like
const RECOMMENDATION_SELECTOR = 'div[data-testid="UserCell"] > ' + '* > '.repeat(9) + '[dir] > *';

// targets messages
const CONVERSATION_SELECTOR = 'div[data-testid="conversation"] > ' + '* > '.repeat(12) + '[dir] > *';
const ACTIVE_MESSAGE_SELECTOR = 'div[data-testid="cellInnerDiv"] > ' + 'div > '.repeat(5) + 'a > div > div[dir] > span';

// targets embed tweets
const EMBED_ORIGINAL_SELECTOR = 'article[role] > ' + '* > '.repeat(5) + 'a:nth-child(1) > span:last-child';
const EMBED_TWEET_SELECTOR = 'article[role] > ' + '* > '.repeat(8) + '[dir] > span';

const VERIFIED_ICON_SELECTOR = 'svg[data-testid="icon-verified"]';
const TWITTER_BLUE_RGB = Object.freeze([29, 155, 240]);

const CHECKMARK_LOCATION = Object.freeze({
	HEADING: 0,
	BIO: 1
});

function waitForElement(selector) {

	return new Promise((resolve) => {

		const targetElement = document.querySelector(selector);
		if (targetElement !== null) {

			resolve(targetElement);
			return;
		}

		const observer = new MutationObserver((_) => {

			const targetElement = document.querySelector(selector);
			if (targetElement !== null) {

				observer.disconnect();
				resolve(targetElement);
			}
		});
		observer.observe(document.body, {childList: true, subtree: true});
	});
}

function setCheckmark(targetElement) {

	return new Promise((resolve) =>
		chrome.storage.local.set({checkmark: DOMPurify.sanitize(targetElement.outerHTML)}, () => resolve(null)));
}

function getProperties(keys) {

	return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function myRandomId() {

	return "id_" + Date.now().toString() + "_" + Math.random().toString(16).slice(2);
}

function nth_element(elem, dir, n) {

	if (elem == null) {

		return null;
	}

	let i = 0;
	while ( i < n && ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {

		if ( elem.nodeType === 1 ) {

			i += 1;
		}
	}
	return i === n ? elem : null;
}

class CheckmarkManager {

	constructor(verifiedHandles, checkHtml, properties) {

		this.verifiedHandles = verifiedHandles;
		this.checkHtml = checkHtml;

		// do not use new here
		this.showBlue = Boolean(properties.showblue ?? true);
		this.showLegacy = Boolean(properties.showlegacy ?? true);
		this.blueColor = String(properties.bluecolor ?? "");
		this.legacyColor = String(properties.legacycolor ?? "");

		this.useBlueColor = this.blueColor.length > 0;

		if (this.legacyColor.length === 0) {

			this.legacyColor = "#2DB32D";
		}

		this.useBlueText = false;
		this.useBlueImage = false;
		if (properties.bluelook === "text") {

			// do not use new here
			this.blueText = String(properties.bluetext ?? "").substring(0, 64);
			this.useBlueText = this.blueText.length > 0;
		}
		else if (properties.bluelook === "image") {

			// do not use new here
			this.blueURL = String(properties.blueimage ?? "");
			this.useBlueImage = this.blueURL.length > 0;
		}

		this.useLegacyText = false;
		this.useLegacyImage = false;
		if (properties.legacylook === "text") {

			// do not use new here
			this.legacyText = String(properties.legacytext ?? "").substring(0, 64);
			this.useLegacyText = this.legacyText.length > 0;
		}
		else if (properties.legacylook === "image") {

			// do not use new here
			this.legacyURL = String(properties.legacyimage ?? "");
			this.useLegacyImage = this.legacyURL.length > 0;
		}

		this.doBlueUpdate = !this.showBlue || this.useBlueColor || this.useBlueText || this.useBlueImage;

		this.invocations = Math.max(1, parseInt(properties.invocations ?? 10));
		this.pollDelay = Math.max(0, parseInt(properties.polldelay ?? 200));

		this.blueIds = new Set();
		this.legacyIds = new Set();

		this.blueBioId = myRandomId();
		while ((this.blueHeadingId = myRandomId()) === this.blueBioId);
		this.blueIds.add(this.blueBioId);
		this.blueIds.add(this.blueHeadingId);

		while (this.blueIds.has(this.legacyBioId = myRandomId()));
		while (this.blueIds.has(this.legacyHeadingId = myRandomId()) || this.legacyHeadingId === this.legacyBioId);
		this.legacyIds.add(this.legacyBioId);
		this.legacyIds.add(this.legacyHeadingId);

		// BEGIN SUPPORTER SECTION

		if (typeof properties.supporters === 'undefined') {

			console.log("Warning: Original Birds could not load supporters :( .");
			this.donors = new Set();
			this.contributors = new Set();
		}
		else {

			const supportersJSON = JSON.parse(properties.supporters);

			if (typeof supportersJSON.supporters === 'undefined') {

				console.log("Warning: Original Birds could not load supporters :( .");
				this.donors = new Set();
				this.contributors = new Set();
			}
			else {

				const supporters = supportersJSON.supporters;
				const supportersKeys = Object.keys(supporters);
				this.donors = new Set(supportersKeys.
					filter((key) => supporters[key].type === "donor" || supporters[key].type === "subscriber").
					map((key) => key.toLowerCase()));
				this.contributors = new Set(supportersKeys.
					filter((key) => supporters[key].type === "contributor").
					map((key) => key.toLowerCase()));
				console.log(this.donors);
				console.log(this.contributors);
			}
		}
	}

	_getSupporterColor(handle) {

		if (this.donors.has(handle)) {

			return "#FFDB98";
		}
		if (this.contributors.has(handle)) {

			return "#FFCDFF";
		}
		return null;
	}

	_updateBlue(targetElement, handleStyle, location = null) {

		let blueSvg = null;
		for (const svg of targetElement.querySelectorAll(VERIFIED_ICON_SELECTOR)) {

			const svgColor = getComputedStyle(svg).getPropertyValue("color");
			const colorValues = svgColor.replaceAll(/[^\d,]/g, "").split(",");

			if (colorValues.length < 3) {

				console.log("Warning: Original Birds encountered invalid color: [" + svgColor + "]");
				continue;
			}

			const absDistance =
				Math.abs(parseInt(colorValues[0]) - TWITTER_BLUE_RGB[0]) +
				Math.abs(parseInt(colorValues[1]) - TWITTER_BLUE_RGB[1]) +
				Math.abs(parseInt(colorValues[2]) - TWITTER_BLUE_RGB[2]);
			if (absDistance > 30) {

				continue;
			}

			blueSvg = svg;
			break;
		}

		if (blueSvg === null) {

			if (location === CHECKMARK_LOCATION.HEADING) {

				document.getElementById(this.blueHeadingId)?.remove();
			}
			else if (location === CHECKMARK_LOCATION.BIO) {

				document.getElementById(this.blueBioId)?.remove();
			}

			return;
		}

		if (!this.showBlue) {

			if (location === CHECKMARK_LOCATION.BIO) {

				let furthestParent = blueSvg;
				while (furthestParent.parentElement != targetElement) {

					furthestParent = furthestParent.parentElement;
				}
				furthestParent.style["display"] = "none";
			}
			else {

				blueSvg.style["display"] = "none";
			}
		}
		else if (this.useBlueText || this.useBlueImage) {

			blueSvg.style["display"] = "none";

			let myId;
			if (location === CHECKMARK_LOCATION.HEADING || location === CHECKMARK_LOCATION.BIO) {

				myId = location === CHECKMARK_LOCATION.HEADING ? this.blueHeadingId : this.blueBioId;
				const div = document.getElementById(myId);
				if (div !== null) {

					return;
				}
			}
			else {

				for (const child of targetElement.children) {

					if (this.blueIds.has(child.id)) {

						return;
					}
				}

				while (this.blueIds.has(myId = myRandomId()) || this.legacyIds.has(myId));
				this.blueIds.add(myId);
			}

			const div = document.createElement("span");
			div.id = myId;

			if (this.useBlueText) {

				let span = div;

				if (location === CHECKMARK_LOCATION.HEADING) {

					span = document.createElement("span");
					div.appendChild(span);
				}
				else if (location === CHECKMARK_LOCATION.BIO) {

					const alignerElement = targetElement.parentElement?.parentElement;
					if (alignerElement == null) {

						console.log("Warning: Original Birds could not align blue text.");
					}
					else {

						alignerElement.style["vertical-align"] = "bottom";
					}
				}

				span.style["color"] = handleStyle.getPropertyValue("color");
				span.style["font-family"] = handleStyle.getPropertyValue("font-family");
				span.style["font-size"] = handleStyle.getPropertyValue("font-size");
				span.style["margin-left"] = "2px";

				span.textContent = this.blueText;
			}
			else if (this.useBlueImage) {

				div.style["display"] = "flex";
				div.style["margin-left"] = "2px";

				const blueImg = document.createElement("img");
				blueImg.width = 20;
				blueImg.height = 20;
				blueImg.src = this.blueURL;
				div.appendChild(blueImg);
			}

			let furthestParent = blueSvg;
			while (furthestParent.parentElement != targetElement) {

				furthestParent = furthestParent.parentElement;
			}
			furthestParent.after(div);
		}
		else if (this.useBlueColor) {

			blueSvg.style["color"] = this.blueColor;
		}
	}

	_updateLegacy(div, handleStyle, location = null) {

		if (this.useLegacyText) {

			if (location === CHECKMARK_LOCATION.HEADING) {

				const span = document.createElement("span");
				div.appendChild(span);
				div = span;
			}

			div.style["color"] = handleStyle.getPropertyValue("color");
			div.style["font-family"] = handleStyle.getPropertyValue("font-family");
			div.style["font-size"] = handleStyle.getPropertyValue("font-size");
			div.style["margin-left"] = "2px";

			div.textContent = this.legacyText;
		}
		else if (this.useLegacyImage) {

			if (location === CHECKMARK_LOCATION.HEADING) {

				div.style["display"] = "inline-flex";
			}
			else {

				div.style["display"] = "flex";
			}

			div.style["margin-left"] = "2px";

			const legacyImg = document.createElement("img");
			legacyImg.width = 20;
			legacyImg.height = 20;
			legacyImg.src = this.legacyURL;
			div.appendChild(legacyImg);
		}
		else {

			if (location === CHECKMARK_LOCATION.HEADING) {

				div.style["display"] = "inline-flex";
			}
			else {

				div.style["display"] = "flex";
			}

			div.setAttribute("title", "This handle is in the legacy verified list.");

			div.appendChild(this.checkHtml.cloneNode(true));
			const svg = div.querySelector('svg');
			if (svg !== null) {

				svg.style["color"] = this.legacyColor;
			}
		}
	}

	updateUserPage(user_selector, heading_selector) {

		const handleElement = document.querySelector(user_selector);
		if (handleElement === null) {

			return;
		}

		const handle = handleElement.textContent?.substring(1).toLowerCase();
		const parent = nth_element(handleElement, "parentElement", 5);
		const handleStyle = getComputedStyle(handleElement.parentElement);

		// BEGIN SUPPORTER SECTION

		const color = this._getSupporterColor(handle);
		if (color !== null) {

			const nameElement = nth_element(parent, "firstElementChild", 5);
			if (nameElement != null) {

				nameElement.style["color"] = color;
			}
		}

		// END SUPPORTER SECTION

		const verified = this.showLegacy ? this.verifiedHandles.has(handle) : false;

		if (this.doBlueUpdate || verified) {

			const targetElement = nth_element(parent, "firstElementChild", 4)?.lastElementChild?.lastElementChild?.lastElementChild;
			// this should not happen unless html structure changed
			// double equal checks for undefined as well
			if (targetElement == null) {

				console.log("Warning: Original Birds could not locate checkmark parent.");
			}
			else {

				if (this.doBlueUpdate) {

					this._updateBlue(targetElement, handleStyle, CHECKMARK_LOCATION.BIO);
				}

				if (verified) {

					let div = document.getElementById(this.legacyBioId);
					if (div === null) {

						div = document.createElement("span");
						div.id = this.legacyBioId;

						this._updateLegacy(div, handleStyle, CHECKMARK_LOCATION.BIO);
					}

					if (div !== targetElement.lastElementChild) {

						targetElement.appendChild(div);
					}
				}
			}
		}

		if (!verified) {

			document.getElementById(this.legacyBioId)?.remove();
		}

		this._updateHeading(heading_selector, color, verified, handleStyle);
	}

	_updateHeading(selector, color, verified, handleStyle) {

		const headingElement = document.querySelector(selector);
		if (headingElement === null) {

			return;
		}

		// BEGIN SUPPORTER SECTION

		if (color !== null) {

			const nameElement = headingElement.parentElement?.parentElement?.
				firstElementChild?.firstElementChild?.firstElementChild;
			if (nameElement != null) {

				nameElement.style["color"] = color;
			}
		}

		// END SUPPORTER SECTION

		if (this.doBlueUpdate) {

			this._updateBlue(headingElement, handleStyle, CHECKMARK_LOCATION.HEADING);
		}

		if (!verified) {

			document.getElementById(this.legacyHeadingId)?.remove();
			return;
		}

		let div = document.getElementById(this.legacyHeadingId);
		if (div === null) {

			div = document.createElement("span");
			div.id = this.legacyHeadingId;

			this._updateLegacy(div, handleStyle, CHECKMARK_LOCATION.HEADING);
		}

		if (div !== headingElement.lastElementChild) {

			headingElement.appendChild(div);
		}
	}

	updateCheckmark(selector, element2Target, element2Name, start=1) {

		for (const element of document.querySelectorAll(selector)) {

			const handle = element.textContent?.substring(start).toLowerCase();

			// BEGIN SUPPORTER SECTION

			const color = this._getSupporterColor(handle);
			if (color !== null) {

				const nameElement = element2Name(element);
				if (nameElement != null) {

					nameElement.style["color"] = color;
				}
			}

			// END SUPPORTER SECTION

			const verified = this.showLegacy ? this.verifiedHandles.has(handle) : false;

			// this combination of settings runs Twitter as normal
			// nothing to do
			if (!(this.doBlueUpdate || verified)) {

				continue;
			}

			const targetElement = element2Target(element);
			// this should not happen unless html structure changed
			// double equal checks for undefined as well
			if (targetElement == null) {

				console.log("Warning: Original Birds could not locate checkmark parent.");
				continue;
			}

			const handleStyle = getComputedStyle(element.parentElement);

			if (this.doBlueUpdate) {

				this._updateBlue(targetElement, handleStyle);
			}

			if (!verified) {

				continue;
			}

			let checkmarkFound = false;
			for (const child of targetElement.children) {

				if (this.legacyIds.has(child.id)) {

					checkmarkFound = true;
					break;
				}
			}
			if (checkmarkFound) {

				continue;
			}

			let myId;
			while (this.blueIds.has(myId = myRandomId()) || this.legacyIds.has(myId));
			this.legacyIds.add(myId);

			const div = document.createElement("span");
			div.id = myId;

			this._updateLegacy(div, handleStyle);

			targetElement.appendChild(div);
		}
	}
}

async function checkmarkManagerFactory() {

	const properties = await getProperties([
		"handles", "checkmark", "showblue", "showlegacy", "bluelook", "legacylook",
		"bluecolor", "legacycolor", "bluetext", "legacytext", "blueimage", "legacyimage",
		"invocations", "polldelay", "supporters"
	]);

	if (typeof properties.checkmark === 'undefined') {

		console.error("Original Birds could not load checkmark.");
		return null;
	}
	if (typeof properties.handles === 'undefined') {

		console.error("Original Birds could not load verified handles.");
		return null;
	}

	const parser = new DOMParser();
	const checkDoc = parser.parseFromString(DOMPurify.sanitize(properties.checkmark), "text/html");

	const checkHtml = checkDoc?.body?.firstChild;
	if (checkHtml == null || checkDoc.querySelector("parsererror") !== null) {

		console.error("Original Birds could not load checkmark.");
		return;
	}
	const verifiedHandles = new Set(properties.handles);

	return new CheckmarkManager(verifiedHandles, checkHtml, properties);
}

function registerRecurringObserver(manager) {

	if (manager === null) {

		return;
	}

	var invocations = manager.invocations;
	var stopped = false;

	function addCheckmark() {

		if (invocations > 0) {

			invocations -= 1;
			stopped = false;

			manager.updateUserPage(USER_SELECTOR, HEADING_SELECTOR);
			manager.updateCheckmark(FEED_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4)?.lastElementChild?.lastElementChild,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 7));
			manager.updateCheckmark(COMPOSE_REPLY_TWEET_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 3)?.lastElementChild?.lastElementChild,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 6));
			manager.updateCheckmark(HOVER_CARD_SELECTOR,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild?.lastElementChild?.lastElementChild,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild?.firstElementChild);
			manager.updateCheckmark(RECOMMENDATION_SELECTOR,
				(element) => nth_element(nth_element(element, "parentElement", 6)?.firstElementChild?.firstElementChild, "lastElementChild", 3),
				(element) => nth_element(nth_element(element, "parentElement", 6), "firstElementChild", 6));
			manager.updateCheckmark(CONVERSATION_SELECTOR,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild?.lastElementChild?.lastElementChild,
				(element) => nth_element(nth_element(element, "parentElement", 5), "firstElementChild", 5));
			manager.updateCheckmark(ACTIVE_MESSAGE_SELECTOR,
				(element) => nth_element(element, "parentElement", 6)?.firstElementChild?.firstElementChild?.firstElementChild?.lastElementChild?.lastElementChild,
				(element) => nth_element(nth_element(element, "parentElement", 6), "firstElementChild", 6));
			manager.updateCheckmark(EMBED_ORIGINAL_SELECTOR,
				(element) => nth_element(nth_element(element, "parentElement", 3), "firstElementChild", 6)?.lastElementChild?.lastElementChild,
				(element) => nth_element(nth_element(element, "parentElement", 3), "firstElementChild", 9),
				0);
			manager.updateCheckmark(EMBED_TWEET_SELECTOR,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild?.lastElementChild?.lastElementChild,
				(element) => nth_element(nth_element(element, "parentElement", 5), "firstElementChild", 5));

			window.setTimeout(addCheckmark, manager.pollDelay);
		}
		else {

			stopped = true;
		}
	}
	addCheckmark();

	const observer = new MutationObserver((_) => {

		if (stopped) {

			invocations = 1;
			addCheckmark();
		}
		else {

			// don't let invocations exceed the maximum dictated by the manager
			invocations = Math.min(manager.invocations, invocations + 1);
		}
	});
	observer.observe(document.body, {childList: true, subtree: true});
}

chrome.runtime.sendMessage({text: "closeme?"}, (response) => {

	// go to page known to contain checkmark and cache it
	if (response.closeme) {

		waitForElement(CHECK_SELECTOR).then(setCheckmark).then((_) => window.close());
	}
	else {

		checkmarkManagerFactory().then(registerRecurringObserver);
	}
});
