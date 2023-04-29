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

function waitForElement(selector) {

	return new Promise((resolve) => {

		const targetElement = document.querySelector(selector);
		if (targetElement !== null) {

			resolve(targetElement);
		}

		const observer = new MutationObserver((mutations) => {

			const targetElement = document.querySelector(selector);
			if (targetElement !== null) {

				observer.disconnect();
				resolve(targetElement);
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
	});
}

function setCheckmark(targetElement) {

	chrome.storage.local.set({checkmark : targetElement.outerHTML});
	chrome.storage.local.remove("closeme");
	window.close();
}

function getProperties(keys) {

	return new Promise((resolve) => {

		chrome.storage.local.get(keys, resolve);
	});
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
	return i == n ? elem : null;
}

class CheckmarkManager {

	constructor(verifiedHandles, checkHtml, showBlue, showLegacy, donors, contributors) {

		this.verifiedHandles = verifiedHandles;
		this.checkHtml = checkHtml;
		this.showBlue = showBlue;
		this.showLegacy = showLegacy;
		this.donors = donors;
		this.contributors = contributors;
		this.checkmarkIds = new Set();
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

	updateUserPage(user_selector, heading_selector) {

		const handleElement = document.querySelector(user_selector);
		if (handleElement === null) {

			return;
		}

		const handle = handleElement.textContent?.substring(1).toLowerCase();
		const parent = nth_element(handleElement, "parentElement", 7);

		// BEGIN SUPPORTER SECTION

		const color = this._getSupporterColor(handle);
		if (color !== null) {

			const nameElement = nth_element(parent, "firstElementChild", 7);
			if (nameElement != null) {

				nameElement.style.color = color;
				// nameElement.style.backgroundColor = "black";
				// nameElement.style.borderRadius = "1em";
			}
		}

		// END SUPPORTER SECTION

		const verified = this.verifiedHandles.has(handle);

		const targetElement = nth_element(parent, "firstElementChild", 6);
		// this should not happen unless html structure changed
		// double equal checks for undefined as well
		if (targetElement == null) {

			console.log("Warning: Original Birds could not locate checkmark parent.");
		}
		else {

			if (!this.showBlue) {

				// TODO
/*
				const verifiedIcons = targetElement.querySelectorAll();
				for (const child of targetElement.children) {

					if (this.checkmarkIds.has(child.id)) {

						continue;
					}


				}
				c.replace(/^(rgb|rgba)\(/,'').replace(/\)$/,'').replace(/\s/g,'').split(',');
*/
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

					let myId = myRandomId();
					while (this.checkmarkIds.has(myId)) {

						myId = myRandomId();
					}
					this.checkmarkIds.add(myId);

					const div = document.createElement("span");

					div.id = myId;
					div.style.verticalAlign = "middle";

					div.appendChild(this.checkHtml.cloneNode(true));
					const svg = div.querySelector('svg');
					if (svg !== null) {

						svg.style.color = "#2DB32D";//"#800080";
						// lowers chance of deleting our own checkmark when not showing blue
						svg["data-testid"] = myId;
					}

					targetElement.appendChild(div);
				}
			}
		}

		this._updateHeading(heading_selector, color, verified);
	}

	_updateHeading(selector, color, verified) {

		const headingElement = document.querySelector(selector);
		if (headingElement === null) {

			return;
		}

		// BEGIN SUPPORTER SECTION

		if (color !== null) {

			const nameElement = headingElement.parentElement?.parentElement?.
				firstElementChild?.firstElementChild?.firstElementChild;
			if (nameElement != null) {

				nameElement.style.color = color;
				// nameElement.style.backgroundColor = "black";
				// nameElement.style.borderRadius = "1em";
			}
		}

		// END SUPPORTER SECTION

		if (!verified) {

			return;
		}

		for (const child of headingElement.children) {

			if (this.checkmarkIds.has(child.id)) {

				return;
			}
		}

		let myId = myRandomId();
		while (this.checkmarkIds.has(myId)) {

			myId = myRandomId();
		}
		this.checkmarkIds.add(myId);

		const div = document.createElement("span");

		div.id = myId;
		div.style.display = "flex";

		div.appendChild(this.checkHtml.cloneNode(true));
		const svg = div.querySelector('svg');
		if (svg !== null) {
	
			svg.style.color = "#2DB32D";
		}

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

					nameElement.style.color = color;
					// nameElement.style.backgroundColor = "black";
					// nameElement.style.borderRadius = "1em";
				}
			}

			// END SUPPORTER SECTION

			if (!this.verifiedHandles.has(handle)) {

				continue;
			}

			const targetElement = element2Target(element);
			// this should not happen unless html structure changed
			// double equal checks for undefined as well
			if (targetElement == null) {

				console.log("Warning: Original Birds could not locate checkmark parent.");
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

			let myId = myRandomId();
			while (this.checkmarkIds.has(myId)) {

				myId = myRandomId();
			}
			this.checkmarkIds.add(myId);

			const div = document.createElement("span");

			div.id = myId;
			div.style.display = "flex";

			div.appendChild(this.checkHtml.cloneNode(true));
			const svg = div.querySelector('svg');
			if (svg !== null) {

				svg.style.color = "#2DB32D";
			}

			targetElement.appendChild(div);
		}
	}
}

async function checkmarkManagerFactory() {

	const properties = await getProperties(["handles", "checkmark", "showblue", "showlegacy", "supporters"]);

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

	const showBlue = typeof properties.showblue === 'undefined' ? true : properties.showblue;
	const showLegacy = typeof properties.showlegacy === 'undefined' ? true : properties.showlegacy;

	let donors, contributors;
	// BEGIN SUPPORTER SECTION

	if (typeof properties.supporters === 'undefined') {

		console.log("Warning: Original Birds could not load supporters :( .");
		donors = new Set();
		contributors = new Set();
	}
	else {

		const supporters = JSON.parse(properties.supporters);

		if (typeof supporters.donors === 'undefined') {
	
			console.log("Warning: Original Birds could not load donors :( .");
			donors = new Set();
		}
		else {

			donors = new Set(supporters.donors.map((obj) => obj.handle.toLowerCase()))
		}

		if (typeof supporters.contributors === 'undefined') {
	
			console.log("Warning: Original Birds could not load contributors :( .");
			contributors = new Set();
		}
		else {

			contributors =  new Set(supporters.contributors.map((obj) => obj.handle.toLowerCase()));
		}
	}

	// END SUPPORTER SECTION

	return new CheckmarkManager(verifiedHandles, checkHtml, showBlue, showLegacy, donors, contributors);
}

async function registerRecurringObserver(manager) {

	if (manager === null) {

		return;
	}

	var invocations = 10;

	function addCheckmark() {

		if (invocations > 0) {

			invocations -= 1;

			//console.log(manager.showBlue + ", " + manager.showLegacy);
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

			window.setTimeout(addCheckmark, 500);
		}
	}
	addCheckmark();

	const observer = new MutationObserver((mutations) => {

		if (invocations <= 0) {

			invocations = 1;
			window.setTimeout(addCheckmark, 500);
		}
		else {

			invocations = Math.min(10, invocations + 1);
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
/*
	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

		// console.log(msg);
		if (msg.text == "settingschanged") {

			chrome.storage.local.get(["showblue", "showlegacy"], (result) => {

				manager.showBlue = typeof result.showblue === 'undefined' ? true : result.showblue;
				manager.showLegacy = typeof result.showlegacy === 'undefined' ? true : result.showlegacy;
				addCheckmarkInvoker(null);
			});
		}
	});*/
}

chrome.runtime.sendMessage({ text: "tab_id?" }, response => {

	chrome.storage.local.get("closeme", (result) => {

		// go to page known to contain checkmark and cache it
		if (typeof result.closeme !== 'undefined' && result.closeme == response.tab) {

			waitForElement(CHECK_SELECTOR).then(setCheckmark);
		}
		else {

			checkmarkManagerFactory().then(registerRecurringObserver);
		}
	});
});
