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

// targets overlay upon hovering on user
const HOVER_CARD_SELECTOR = 'div[data-testid="HoverCard"] > ' + 'div > '.repeat(6) + 'a > div > :is(div, span) > span';

// targets recommendation and people you might like
const RECOMMENDATION_SELECTOR = 'div[data-testid="UserCell"] > ' + 'div > '.repeat(7) + 'a > div > div[dir] > span';

// targets messages
const CONVERSATION_SELECTOR = 'div[data-testid="conversation"] > ' + 'div > '.repeat(12) + 'div[dir] > span';
const ACTIVE_MESSAGE_SELECTOR = 'div[data-testid="cellInnerDiv"] > ' + 'div > '.repeat(5) + 'a > div > div[dir] > span';

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

function getCheckmark() {

	return new Promise((resolve) => {

		chrome.storage.local.get("checkmark", (result) => {

			resolve(typeof result.checkmark === 'undefined' ? null : result.checkmark);
		});
	});
}

function getVerifiedHandles() {

	return new Promise((resolve) => {

		chrome.storage.local.get("handles", (result) => {

			resolve(typeof result.handles === 'undefined' ? null : new Set(result.handles));
		});
	});
}

function getSupporters() {

	return new Promise((resolve) => {

		chrome.storage.local.get("supporters", (result) => {

			resolve(typeof result.supporters === 'undefined' ? null : result.supporters);
		});
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

	constructor(verifiedHandles, checkHtml, donors, contributors) {

		this.verifiedHandles = verifiedHandles;
		this.checkHtml = checkHtml;
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

			const nameElement = nth_element(parent, "firstElementChild", 5);
			if (nameElement != null) {

				nameElement.style.color = color;
			}
		}

		// END SUPPORTER SECTION

		if (!this.verifiedHandles.has(handle)) {

			this._updateHeading(heading_selector, color, false);
			return;
		}

		const targetElement = nth_element(parent, "firstElementChild", 6);
		// this should not happen unless html structure changed
		// double equal checks for undefined as well
		if (targetElement == null) {

			console.log("Error: Original Birds could not locate checkmark parent.");
		}
		else {

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

				div.innerHTML = this.checkHtml;
				const svg = div.querySelector('svg');
				if (svg !== null) {

					svg.style.color = "#2DB32D";//"#800080";
				}

				targetElement.appendChild(div);
			}
		}

		this._updateHeading(heading_selector, color, true);
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

		div.innerHTML = this.checkHtml;
		const svg = div.querySelector('svg');
		if (svg !== null) {
	
			svg.style.color = "#2DB32D";
		}

		headingElement.appendChild(div);
	}

	updateCheckmark(selector, element2Target, element2Name) {

		for (const element of document.querySelectorAll(selector)) {

			const handle = element.textContent?.substring(1).toLowerCase();

			// BEGIN SUPPORTER SECTION

			const color = this._getSupporterColor(handle);
			if (color !== null) {

				const nameElement = element2Name(element);
				if (nameElement != null) {

					nameElement.style.color = color;
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

				console.log("Error: Original Birds could not locate checkmark parent.");
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

			div.innerHTML = this.checkHtml;
			const svg = div.querySelector('svg');
			if (svg !== null) {

				svg.style.color = "#2DB32D";
			}

			targetElement.appendChild(div);
		}
	}
}

async function registerRecurringObserver() {

	const verifiedHandles = await getVerifiedHandles();
	if (verifiedHandles === null) {

		console.log("Error: Original Birds could not load verified handles.");
		return;
	}
	const checkHtml = await getCheckmark();
	if (checkHtml === null) {

		console.log("Error: Original Birds could not load checkmark.");
		return;
	}

	const supportersStr = await getSupporters();
	if (supportersStr === null) {

		console.log("Warning: Original Birds could not load supporters :( .");
	}
	const supporters = JSON.parse(supportersStr);
	if (typeof supporters.donors === 'undefined') {

		console.log("Warning: Original Birds could not load donors :( .");
	}
	if (typeof supporters.contributors === 'undefined') {

		console.log("Warning: Original Birds could not load contributors :( .");
	}
	const donors = typeof supporters.donors === 'undefined' ? new Set() : new Set(supporters.donors.map((obj) => obj.handle.toLowerCase()));
	const contributors = typeof supporters.contributors === 'undefined' ? new Set() : new Set(supporters.contributors.map((obj) => obj.handle.toLowerCase()));

	const manager = new CheckmarkManager(verifiedHandles, checkHtml, donors, contributors);

	var invocations = 10;

	function addCheckmark() {

		if (invocations > 0) {

			invocations -= 1;

			manager.updateUserPage(USER_SELECTOR, HEADING_SELECTOR);
			manager.updateCheckmark(FEED_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4),
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 7));
			manager.updateCheckmark(THREAD_REPLY_POST_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4),
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 7));
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
}

chrome.runtime.sendMessage({ text: "tab_id?" }, response => {

	chrome.storage.local.get("closeme", (result) => {

		// go to page known to contain checkmark and cache it
		if (typeof result.closeme !== 'undefined' && result.closeme == response.tab) {

			waitForElement(CHECK_SELECTOR).then(setCheckmark);
		}
		else {

			registerRecurringObserver();
		}
	});
});
