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
const HOVER_CARD_SELECTOR = 'div[data-testid="HoverCard"] > ' + 'div > '.repeat(6) + 'a > div > div > span';

// targets recommendation and people you might like
const RECOMMENDATION_SELECTOR = 'div[data-testid="UserCell"] > ' + 'div > '.repeat(7) + 'a > div > div[dir] > span';

// targets messages
const CONVERSATION_SELECTOR = 'div[data-testid="conversation"] > ' + 'div > '.repeat(12) + 'div[dir] > span';
const ACTIVE_MESSAGE_SELECTOR = 'div[data-testid="cellInnerDiv"] > ' + 'div > '.repeat(5) + 'a > div > div[dir] > span';

const SPAN_WITH_ID = 'span[id]';

// const CHECKMARK_TOOLTIP = "A legacy verified user used this Twitter handle in the past.";

function waitForElement(selector) {
	return new Promise((resolve) => {
		const observer = new MutationObserver((mutations) => {
			const targetElement = document.querySelector(selector);
			if (targetElement) {
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

	constructor(verifiedHandles, checkHtml) {

		this.verifiedHandles = verifiedHandles;
		this.checkHtml = checkHtml;
		this.checkmarkIds = new Set();
	}

	updateUserPage(user_selector, heading_selector) {

		const handleElement = document.querySelector(user_selector);
		if (handleElement === null || !this.verifiedHandles.has(handleElement.textContent?.substring(1).toLowerCase())) {

			return;
		}

		const parent = handleElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.
			parentElement?.parentElement;
		const targetElement = parent?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.
			firstElementChild?.lastElementChild;
		// this should not happen unless html structure changed
		// double equal checks for undefined as well
		if (parent == null || targetElement == null) {

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

				//div.classList.add("tooltip");

				div.id = myId;
				// div.style.verticalAlign = "middle";

				div.innerHTML = this.checkHtml;
				const svg = div.querySelector('svg');
				if (svg !== null) {

					svg.style.color = "#2DB32D";//"#800080";
				}

				//const tooltipSpan = document.createElement("span");
				//tooltipSpan.classList.add('tooltiptext');
				//tooltipSpan.textContent = CHECKMARK_TOOLTIP;
				//div.appendChild(tooltipSpan);

				targetElement.appendChild(div);
			}
		}

		const headingElement = document.querySelector(heading_selector);
		if (headingElement === null) {

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

	updateCheckmark(selector, element2Target) {

		for (const element of document.querySelectorAll(selector)) {

			if (!this.verifiedHandles.has(element.textContent?.substring(1).toLowerCase())) {

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

		console.log("Warning: Original Birds could not load verified handles.");
		return;
	}
	const checkHtml = await getCheckmark();
	if (checkHtml === null) {

		console.log("Warning: Original Birds could not load checkmark.");
		return;
	}

	const manager = new CheckmarkManager(verifiedHandles, checkHtml);

	var invocations = 10;

	function addCheckmark() {

		if (invocations > 0) {

			invocations -= 1;

			//const theDate = Date.now();
			manager.updateUserPage(USER_SELECTOR, HEADING_SELECTOR);
			manager.updateCheckmark(FEED_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4));
			manager.updateCheckmark(THREAD_REPLY_POST_SELECTOR,
				(element) => nth_element(element.closest('div[data-testid="User-Name"]'), "firstElementChild", 4));
			manager.updateCheckmark(HOVER_CARD_SELECTOR,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild?.lastElementChild);
			manager.updateCheckmark(RECOMMENDATION_SELECTOR,
				(element) => nth_element(element, "parentElement", 6)?.firstElementChild?.firstElementChild?.lastElementChild);
			manager.updateCheckmark(CONVERSATION_SELECTOR,
				(element) => nth_element(element, "parentElement", 5)?.firstElementChild?.firstElementChild);
			manager.updateCheckmark(ACTIVE_MESSAGE_SELECTOR,
				(element) => nth_element(element, "parentElement", 6)?.firstElementChild?.firstElementChild?.firstElementChild);
			//console.log(Date.now() - theDate);

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
/*
function createTooltipCSS() {

	const style = document.createElement('style');
	style.innerHTML = `
		.tooltip {
			position: relative;
			display: inline-block;
			border-bottom: 1px dotted black;
		}

		.tooltip .tooltiptext {
			visibility: hidden;
			width: 120px;
			background-color: black;
			color: #fff;
			text-align: center;
			border-radius: 6px;
			padding: 5px 0;

			position: absolute;
			z-index: 100;
			top: 100%;
			left: 50%;
			margin-left: -60px;
		}

		.tooltip:hover .tooltiptext {
			visibility: visible;
		}`;
	document.getElementsByTagName('head')[0].appendChild(style);
}
*/
chrome.runtime.sendMessage({ text: "tab_id?" }, response => {

	chrome.storage.local.get("closeme", (result) => {

		// go to page known to contain checkmark and cache it
		if (typeof result.closeme !== 'undefined' && result.closeme == response.tab) {

			waitForElement(CHECK_SELECTOR).then(setCheckmark);
		}
		else {

			//createTooltipCSS();
			registerRecurringObserver();
		}
	});
});
