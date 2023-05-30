// checkmark selector to get html with checkmark svg
const CHECK_SELECTOR = 'div[data-testid="UserName"] > ' + '* > '.repeat(4) + '[dir] > ' + '* > '.repeat(4) + ':nth-child(1)';

const ACTIVE_MESSAGE_SELECTOR = 'div[data-testid="cellInnerDiv"] > ' + 'div > '.repeat(5) + 'a > div > div[dir] > span';

const VERIFIED_ICON_SELECTOR = 'svg[data-testid="icon-verified"]';
const TWITTER_BLUE_RGB = Object.freeze([29, 155, 240]);

const CHECKMARK_LOCATION = Object.freeze({
	HEADING: 0,
	BIO: 1
});

const DONOR_STYLE = Object.freeze({"namecolor": "#FFDB98"});
const CONTRIBUTOR_STYLE = Object.freeze({"namecolor": "#FFCDFF"});

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

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	return new Promise((resolve) => chrome.storage.local.set({
		checkmark: DOMPurify.sanitize(targetElement.outerHTML),
		lastcheckmarkupdate: theDate.toJSON()
	}, () => resolve(null)));
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

	constructor(selectors, verifiedHandles, checkHtml, properties) {

		this.selectors = selectors;
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

		// do not use new here
		if (!Number.isInteger(this.invocations = Number(properties.invocations ?? 10))) {

			this.invocations = 10;
		}
		if (!Number.isInteger(this.pollDelay = Number(properties.polldelay ?? 200))) {

			this.pollDelay = 200;
		}

		this.invocations = Math.max(1, this.invocations);
		this.pollDelay = Math.max(0, this.invocations);

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

		let supportersObj;
		try {

			supportersObj = JSON.parse(properties.supporters ?? "{}")?.supporters;
		}
		catch (error) {

			console.log(error.message);
		}

		if (supportersObj == null) {

			console.log("Warning: Original Birds could not load supporters :( .");
			this.supporters = new Map();
		}
		else {

			this.supporters = new Map(Object.entries(supportersObj).map(([k, v]) => {

				k = k.toLowerCase();

				if (v.style === undefined) {

					if (v.type === "donor") {

						return [k, DONOR_STYLE];
					}
					if (v.type === "contributor") {

						return [k, CONTRIBUTOR_STYLE];
					}
					return null;
				}
				// mapped value can be null but not undefined
				return [k, v.style];
			}).filter((entry) => entry !== null));
		}

		// END SUPPORTER SECTION
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

	_updateUserPage({selector, nthparent, parent2target, parent2name = null}, heading_selector) {

		const handleElement = document.querySelector(selector);
		if (handleElement === null) {

			return;
		}

		const handle = handleElement.textContent?.substring(1).toLowerCase();
		const parent = nth_element(handleElement, "parentElement", nthparent);
		const handleStyle = getComputedStyle(handleElement.parentElement);

		// BEGIN SUPPORTER SECTION

		const supporterStyle = this.supporters.get(handle);
		if (supporterStyle != null) {

			if (supporterStyle.handlecolor != null) {

				handleElement.style["color"] = supporterStyle.handlecolor;
			}

			if (parent2name != null && supporterStyle.namecolor != null) {

				const nameElement = parent.querySelector(parent2name);
				if (nameElement != null) {

					nameElement.style["color"] = supporterStyle.namecolor;
				}
			}
		}

		// END SUPPORTER SECTION

		const verified = this.showLegacy ? this.verifiedHandles.has(handle) : false;

		if (this.doBlueUpdate || verified) {

			const targetElement = parent.querySelector(parent2target);
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

		this._updateHeading(heading_selector, supporterStyle, verified, handleStyle);
	}

	_updateHeading({selector, nthparent, parent2name = null}, supporterStyle, verified, handleStyle) {

		const headingElement = document.querySelector(selector);
		if (headingElement === null) {

			return;
		}

		// BEGIN SUPPORTER SECTION

		if (supporterStyle != null) {

			if (parent2name != null && supporterStyle.namecolor != null) {

				const nameElement = nth_element(headingElement, "parentElement", nthparent)?.querySelector(parent2name);
				if (nameElement != null) {

					nameElement.style["color"] = supporterStyle.namecolor;
				}
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

	_updateCheckmark({
		selector, nthparent, parent2target, parent2name = null,
		parent2border = null, closestborder = null, indexstart = 1
	}) {

		for (const handleElement of document.querySelectorAll(selector)) {

			const handle = handleElement.textContent?.substring(indexstart).toLowerCase();
			const parent = nth_element(handleElement, "parentElement", nthparent);

			// BEGIN SUPPORTER SECTION

			const supporterStyle = this.supporters.get(handle);
			if (supporterStyle != null) {

				if (supporterStyle.handlecolor != null) {

					handleElement.style["color"] = supporterStyle.handlecolor;
				}
	
				if (parent2name != null && supporterStyle.namecolor != null) {

					const nameElement = parent.querySelector(parent2name);
					if (nameElement != null) {

						nameElement.style["color"] = supporterStyle.namecolor;
					}
				}

				if ((parent2border != null || closestborder != null) &&
					supporterStyle.bordercolor != null) {

					const borderElement = parent2border != null ?
						nth_element(parent, "parentElement", parent2border) :
						parent.closest(closestborder);
					if (borderElement != null) {

						borderElement.style["border-color"] = supporterStyle.bordercolor;
						borderElement.style["border-width"] = "3px";
						borderElement.style["margin-bottom"] = "-3px";
					}
				}
			}

			// END SUPPORTER SECTION

			const verified = this.showLegacy ? this.verifiedHandles.has(handle) : false;

			// this combination of settings runs Twitter as normal
			// nothing to do
			if (!(this.doBlueUpdate || verified)) {

				continue;
			}

			const targetElement = parent.querySelector(parent2target);
			// this should not happen unless html structure changed
			// double equal checks for undefined as well
			if (targetElement == null) {

				console.log("Warning: Original Birds could not locate checkmark parent.");
				continue;
			}

			const handleStyle = getComputedStyle(handleElement.parentElement);

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

	updateCheckmark() {

		this._updateUserPage(this.selectors.userselector, this.selectors.headingselector);

		for (const checkmarkArgs of this.selectors.selectors) {

			this._updateCheckmark(checkmarkArgs);
		}
	}
}

async function checkmarkManagerFactory() {

	const properties = await getProperties([
		"checkmark", "handles", "selectors", "showblue", "showlegacy", "bluelook", "legacylook",
		"bluecolor", "legacycolor", "bluetext", "legacytext", "blueimage", "legacyimage",
		"invocations", "polldelay", "supporters"
	]);

	if (properties.selectors === undefined) {

		console.error("Original Birds could not load selectors.");
		return null;
	}
	if (properties.handles === undefined) {

		console.error("Original Birds could not load verified handles.");
		return null;
	}
	if (properties.checkmark === undefined) {

		console.error("Original Birds could not load checkmark.");
		return null;
	}

	const selectorObjValid = ((dummyElement) => (selectorObj) => {

		// required properties
		if (selectorObj.selector == null || selectorObj.parent2target == null ||
			selectorObj.nthparent == null) {

			return false;
		}

		try {

			// do not use new here
			dummyElement.querySelector(selectorObj.selector = String(selectorObj.selector));
			dummyElement.querySelector(selectorObj.parent2target = String(selectorObj.parent2target));

			if (selectorObj.parent2name != null) {

				// do not use new here
				dummyElement.querySelector(selectorObj.parent2name = String(selectorObj.parent2name));
			}
			if (selectorObj.closestborder != null) {

				// do not use new here
				dummyElement.querySelector(selectorObj.closestborder = String(selectorObj.closestborder));
			}

			// do not use new here
			if (!Number.isInteger(selectorObj.nthparent = Number(selectorObj.nthparent)) ||
				selectorObj.nthparent < 0) {

				return false;
			}

			if (selectorObj.parent2border != null &&
				(!Number.isInteger(selectorObj.parent2border = Number(selectorObj.parent2border)) ||
				selectorObj.parent2border < 0)) {

				return false;
			}
		}
		catch(error) {

			console.log(error.message);
			return false;
		}
		return true;
	})(document.createDocumentFragment());

	let selectors;
	try {

		selectors = JSON.parse(properties.selectors);

		if (selectors.userselector != null && !selectorObjValid(selectors.userselector)) {

			console.log("Warning: Original Birds skipped userselector.");
			selectors.userselector = null;
		}

		if (selectors.headingselector != null) {

			// dummy value so we don't have to change the validation function
			selectors.headingselector.parent2target = ':scope';
			if (!selectorObjValid(selectors.headingselector)) {

				console.log("Warning: Original Birds skipped headingselector.");
				selectors.headingselector = null;
			}
		}

		if (selectors.selectors instanceof Array) {

			const l = selectors.selectors.length;
			selectors.selectors = selectors.selectors.filter(selectorObjValid);
			if (selectors.selectors.length !== l) {

				console.log("Warning: Original Birds skipped " + (l - selectors.selectors.length) + " elements in selectors.");
			}
		}
		else {

			console.log("Warning: Original Birds encounted unexpected selectors type.");
			selectors.selectors = [];
		}
	}
	catch (error) {

		console.error("Original Birds could not load selectors.");
		console.error(error);
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

	return new CheckmarkManager(selectors, verifiedHandles, checkHtml, properties);
}

function registerRecurringObserver(manager) {

	if (manager === null) {

		return;
	}

	var invocations = manager.invocations;
	var stopped = false;

	function invokeManager() {

		if (invocations > 0) {

			invocations -= 1;
			stopped = false;

			manager._updateUserPage(USER_SELECTOR, HEADING_SELECTOR);
			manager.updateCheckmark();

			window.setTimeout(invokeManager, manager.pollDelay);
		}
		else {

			stopped = true;
		}
	}
	invokeManager();

	const observer = new MutationObserver((_) => {

		if (stopped) {

			invocations = 1;
			invokeManager();
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
