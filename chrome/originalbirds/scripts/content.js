// checkmark selector to get html with checkmark svg
const CHECK_SELECTOR = 'div[data-testid="UserName"] > ' + 'div > '.repeat(4) + 'div[dir] > ' + 'span > '.repeat(4) + 'div:nth-child(1)';

// targets user name on their profile/feed page
const USER_SELECTOR = 'div[data-testid="UserName"] > ' + 'div > '.repeat(5) + 'div[dir] > span';
// targets top heading on user page
const HEADING_SELECTOR = 'h2[role="heading"] > ' + 'div > '.repeat(4) + 'span:nth-child(2) > span';

// targets feed topmost post
const FEED_SELECTOR = 'div[data-testid="User-Name"] > div > div > div > a > div > span';

// targets user feed or thread reply with (nested) post
const THREAD_REPLY_POST_SELECTOR = 'div[data-testid="User-Name"] > div:nth-child(2) > ' + 'div > '.repeat(4) + 'span';

// targets user name when writing a popup reply
const COMPOSE_REPLY_TWEET_SELECTOR = 'div[data-testid="User-Name"] > div:nth-child(2) > div > div > div[dir] > span';

// targets overlay upon hovering on user
const HOVER_CARD_SELECTOR = 'div[data-testid="HoverCard"] > ' + 'div > '.repeat(6) + 'a > div > :is(div, span) > span';

// targets recommendation and people you might like
const RECOMMENDATION_SELECTOR = 'div[data-testid="UserCell"] > ' + 'div > '.repeat(7) + 'a > div > div[dir] > span';

// targets messages
const CONVERSATION_SELECTOR = 'div[data-testid="conversation"] > ' + 'div > '.repeat(12) + 'div[dir] > span';
const ACTIVE_MESSAGE_SELECTOR = 'div[data-testid="cellInnerDiv"] > ' + 'div > '.repeat(5) + 'a > div > div[dir] > span';

// targets embed tweets
const EMBED_ORIGINAL_SELECTOR = 'article[role] >' + 'div > '.repeat(5) + 'a[dir]:nth-child(1) > span:nth-child(2)';
const EMBED_TWEET_SELECTOR = 'article[role] >' + 'div > '.repeat(6) + 'a > div > div[dir] > span';

const VERIFIED_ICON_SELECTOR = 'svg[data-testid="icon-verified"]';
const TWITTER_BLUE_RGB = [29, 155, 240];

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
		chrome.storage.local.set({checkmark: targetElement.outerHTML}, () =>
			chrome.storage.local.remove("closeme", () =>
				resolve(null))));
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

		this.invocations = Math.max(1, parseInt(properties.invocations ?? 10));
		this.pollDelay = Math.max(0, parseInt(properties.polldelay ?? 200));

		this.doBlueUpdate = !this.showBlue || this.useBlueColor || this.useBlueText || this.useBlueImage;
		this.checkmarkIds = new Set();

		// BEGIN SUPPORTER SECTION

		if (typeof properties.supporters === 'undefined') {

			console.log("Warning: Original Birds could not load supporters :( .");
			this.donors = new Set();
			this.contributors = new Set();
		}
		else {

			const supporters = JSON.parse(properties.supporters);

			if (typeof supporters.donors === 'undefined') {

				console.log("Warning: Original Birds could not load donors :( .");
				this.donors = new Set();
			}
			else {

				this.donors = new Set(supporters.donors.map((obj) => obj.handle.toLowerCase()));
			}

			if (typeof supporters.contributors === 'undefined') {

				console.log("Warning: Original Birds could not load contributors :( .");
				this.contributors = new Set();
			}
			else {

				this.contributors =  new Set(supporters.contributors.map((obj) => obj.handle.toLowerCase()));
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

		const verifiedIcons = targetElement.querySelectorAll(VERIFIED_ICON_SELECTOR);
		for (const svg of verifiedIcons) {

			if (this.checkmarkIds.has(svg["data-testid"])) {

				continue;
			}

			const svgColor = getComputedStyle(svg).getPropertyValue("color");
			const colorValues = svgColor.replace(/^(rgb|rgba)\(/,'').replace(/\)$/,'').replace(/\s/g,'').split(',');

			if (colorValues.length < 3) {

				console.log("Warning: Original Birds encountered invalid color: [" + svgColor + "]");
				continue;
			}

			let absDistance = 0;
			for (let i = 0; i < 3; i++) {

				absDistance += Math.abs(parseInt(colorValues[i]) - TWITTER_BLUE_RGB[i]);
			}
			if (absDistance > 30) {

				continue;
			}

			if (!this.showBlue) {

				if (location === "bio") {

					let furthestParent = svg;
					while (furthestParent.parentElement != targetElement) {

						furthestParent = furthestParent.parentElement;
					}
					furthestParent.style["display"] = "none";
				}
				else {

					svg.style["display"] = "none";
				}
			}
			else if (this.useBlueText || this.useBlueImage) {

				svg.style["display"] = "none";

				if (targetElement === svg.parentElement) {

					const wrapper = document.createElement("span");
					svg.parentElement.insertBefore(wrapper, svg);
					wrapper.appendChild(svg);
				}

				let checkmarkFound = false;
				for (const child of svg.parentElement.children) {

					if (this.checkmarkIds.has(child.id)) {

						checkmarkFound = true;
						break;
					}
				}
				if (checkmarkFound) {

					continue;
				}

				let myId;
				while (this.checkmarkIds.has(myId = myRandomId()));
				this.checkmarkIds.add(myId);

				const div = document.createElement("span");
				div.id = myId;

				if (this.useBlueText) {

					if (location === "bio") {

						let furthestParent = svg.parentElement;
						while (furthestParent.parentElement != targetElement) {

							furthestParent = furthestParent.parentElement;
						}
						furthestParent.style["vertical-align"] = "baseline";
					}

					div.style["color"] = handleStyle.getPropertyValue("color");
					div.style["font-family"] = handleStyle.getPropertyValue("font-family");
					div.style["font-size"] = handleStyle.getPropertyValue("font-size");
					div.style["margin-left"] = "2px";

					div.textContent = this.blueText;
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

				svg.after(div);
			}
			else if (this.useBlueColor) {

				svg.style["color"] = this.blueColor;
			}

			break;
		}
	}

	_updateLegacy(div, handleStyle, location = null) {

		if (this.useLegacyText) {

			if (location === "heading") {

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

			if (location === "heading") {

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

			if (location === "heading") {

				div.style["display"] = "inline-flex";
			}
			else {

				div.style["display"] = "flex";
			}

			div.setAttribute("title", "This handle is in the legacy verified list.");

			div.appendChild(this.checkHtml.cloneNode(true));
			const svg = div.querySelector('svg');
			if (svg !== null) {

				svg.style["color"] = this.legacyColor;//"#800080";
				// lowers chance of deleting our own checkmark when not showing blue
				svg.setAttribute("data-testid", div.id);
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
		const handleStyle = getComputedStyle(handleElement);

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

					this._updateBlue(targetElement, handleStyle, "bio");
				}

				if (verified) {

					let checkmarkFound = false;
					for (const child of targetElement.children) {

						if (this.checkmarkIds.has(child.id)) {

							checkmarkFound = true;
							break;
						}
					}
					if (!checkmarkFound) {

						let myId;
						while (this.checkmarkIds.has(myId = myRandomId()));
						this.checkmarkIds.add(myId);

						const div = document.createElement("span");
						div.id = myId;

						this._updateLegacy(div, handleStyle, "bio");

						targetElement.appendChild(div);
					}
				}
			}
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

			this._updateBlue(headingElement, handleStyle, "heading");
		}

		if (!verified) {

			return;
		}

		for (const child of headingElement.children) {

			if (this.checkmarkIds.has(child.id)) {

				return;
			}
		}

		let myId;
		while (this.checkmarkIds.has(myId = myRandomId()));
		this.checkmarkIds.add(myId);

		const div = document.createElement("span");
		div.id = myId;

		this._updateLegacy(div, handleStyle, "heading");

		headingElement.appendChild(div);
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

			const handleStyle = getComputedStyle(element);

			if (this.doBlueUpdate) {

				this._updateBlue(targetElement, handleStyle);
			}

			if (!verified) {

				continue;
			}

			let checkmarkFound = false;
			for (const child of targetElement.children) {

				if (this.checkmarkIds.has(child.id)) {

					checkmarkFound = true;
					break;
				}
			}
			if (checkmarkFound) {

				continue;
			}

			let myId;
			while (this.checkmarkIds.has(myId = myRandomId()));
			this.checkmarkIds.add(myId);

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
	const checkDoc = parser.parseFromString(properties.checkmark, "text/html");

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
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4),
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 7));
			manager.updateCheckmark(THREAD_REPLY_POST_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4),
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 7));
			manager.updateCheckmark(COMPOSE_REPLY_TWEET_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4),
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 6));
			manager.updateCheckmark(HOVER_CARD_SELECTOR,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild?.lastElementChild,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild?.firstElementChild);
			manager.updateCheckmark(RECOMMENDATION_SELECTOR,
				(element) => nth_element(element, "parentElement", 6)?.firstElementChild?.firstElementChild?.lastElementChild,
				(element) => nth_element(nth_element(element, "parentElement", 6), "firstElementChild", 6));
			manager.updateCheckmark(CONVERSATION_SELECTOR,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild,
				(element) => nth_element(nth_element(element, "parentElement", 5), "firstElementChild", 5));
			manager.updateCheckmark(ACTIVE_MESSAGE_SELECTOR,
				(element) => nth_element(element, "parentElement", 6)?.firstElementChild?.firstElementChild?.firstElementChild,
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
