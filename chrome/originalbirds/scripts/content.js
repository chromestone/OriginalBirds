// checkmark
const CHECK_SELECTOR = 'div[data-testid="UserName"] > div > div > div > div > div[dir="ltr"] > span > span > span > span > div:nth-child(1)';

// user feed - name and checkmark container
//const USER_SELECTOR = 'div[data-testid="UserName"] > div > div > div > div > div[dir="ltr"] > span';
const USER_SELECTOR = 'div[data-testid="UserName"] > div > div > div > div > div > div[dir="ltr"] > span';
// top heading on user page
const HEADING_SELECTOR = 'h2[role="heading"] > div > div > div > div > span:nth-child(2) > span';

// parent
// also handles the OP of thread
//const FEED_SELECTOR = 'div[data-testid="User-Name"] >  div > div > a';
const FEED_SELECTOR = 'div[data-testid="User-Name"] > div > div > div > a > div > span';
//const FEED_SELECTOR = 'div[data-testid="User-Name"] > div > div > div > a > div[dir="ltr"] > span';
// TODO move document
// name and checkmark container (relative to post parent)

// thread reply with post - handle
const THREAD_REPLY_POST_SELECTOR = 'div[data-testid="User-Name"] > div:nth-child(2) > div > div > div > div > span';
//const THREAD_REPLY_POST_SELECTOR = 'div[data-testid="User-Name"] > div:nth-child(2) > div > div > div > div[dir="ltr"] > span';
// TODO move document
// name and checkmark container (relative to post parent)

// TODO document
const HOVER_CARD_SELECTOR = 'div[data-testid="HoverCard"] > div > div > div > div > div > div > a > div > div > span';
// const HOVER_CARD_SELECTOR = 'div[data-testid="HoverCard"] > div > div > div > div > div > div > a > div > div[dir="ltr"] > span';

// TODO document
const RECOMMENDATION_SELECTOR = 'div[data-testid="UserCell"] > div > div > div > div > div > div > div > a > div > div[dir="ltr"] > span';

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
/*
function getHoverObserver() {

	var FEEDS_PROCESSED = new Set();

	return () => {

		const targetElements = [...document.querySelectorAll(HOVER_CARD_SELECTOR)];

		if (targetElements.length == 0) {

			return;
		}

		//verifiedHandles(targetElements.map((element) => element.textContent?.substring(1))).then((verified) => {
		if (typeof window.originalBirdsHandlesSet === 'undefined') {

			return;
		}

		const doProcessing = targetElements.filter(element => window.originalBirdsHandlesSet.has(element.textContent?.substring(1)));

		//const doProcessing = targetElements.filter((_, idx) => verified[idx]);

		if (doProcessing.length == 0) {

			return;
		}

		retrieveCheckmark().then((checkHtml) => {

			if (checkHtml === null) {

				return;
			}

			for (const element of doProcessing) {

				const parent = element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
				const targetElement = parent?.firstElementChild?.firstElementChild?.lastElementChild;
				// check undefined as well
				if (parent == null || targetElement == null) {

					console.log("This should not happen.");
					continue;
				}

				//console.log(targetElement);
				let checkmarkFound = false;
				for (const child of targetElement.children) {

					//console.log(child.id);
					if (FEEDS_PROCESSED.has(child.id)) {

						checkmarkFound = true;
						break;
					}
				}
				if (checkmarkFound) {

					continue;
				}

				let myId = myRandomId();
				while (FEEDS_PROCESSED.has(myId)) {

					myId = myRandomId();
				}
				FEEDS_PROCESSED.add(myId);
				//console.log(myId);

				const div = document.createElement("span");

				div.id = myId;
				div.style.display = "flex";

				div.innerHTML = checkHtml;
				const svg = div.querySelector('svg');
				if (svg !== null) {

					svg.style.color = "#2DB32D";
				}

				targetElement.appendChild(div);
			}
		});
		//});
	};
}

// side bar recommended birds
function getRecommendedObserver() {

	var FEEDS_PROCESSED = new Set();

	return () => {

		const targetElements = [...document.querySelectorAll(RECOMMENDATION_SELECTOR)];

		if (targetElements.length == 0) {

			return;
		}

		if (typeof window.originalBirdsHandlesSet === 'undefined') {

			return;
		}

		const doProcessing = targetElements.filter(element => window.originalBirdsHandlesSet.has(element.textContent?.substring(1)));

		//const doProcessing = targetElements.filter((_, idx) => verified[idx]);

		if (doProcessing.length == 0) {

			return;
		}

		retrieveCheckmark().then((checkHtml) => {

			if (checkHtml === null) {

				return;
			}

			for (const element of doProcessing) {

				const parent = element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.
					parentElement;
				const targetElement = parent?.firstElementChild?.firstElementChild?.lastElementChild;
				// check undefined as well
				if (parent == null || targetElement == null) {

					console.log("This should not happen.");
					continue;
				}

				let checkmarkFound = false;
				for (const child of targetElement.children) {

					if (FEEDS_PROCESSED.has(child.id)) {

						checkmarkFound = true;
						break;
					}
				}
				if (checkmarkFound) {

					continue;
				}

				let myId = myRandomId();
				while (FEEDS_PROCESSED.has(myId)) {

					myId = myRandomId();
				}
				FEEDS_PROCESSED.add(myId);

				const div = document.createElement("span");

				div.id = myId;
				div.style.display = "flex";

				div.innerHTML = checkHtml;
				const svg = div.querySelector('svg');
				if (svg !== null) {

					svg.style.color = "#2DB32D";
				}

				targetElement.appendChild(div);
			}
		});
		//});
	};
}
*/
class CheckmarkManager {

	constructor(verifiedHandles, checkHtml) {

		this.verifiedHandles = verifiedHandles;
		this.checkHtml = checkHtml;
		this.checkmarkIds = new Set();
	}

	updateUserPage(user_selector, heading_selector) {

		const handleElement = document.querySelector(user_selector);
		if (handleElement === null || !this.verifiedHandles.has(handleElement.textContent?.substring(1))) {

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

			if (!this.verifiedHandles.has(element.textContent?.substring(1))) {

				continue;
			}

			//const parent = element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.
			//	parentElement;
			//const targetElement = parent?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild;
			//const parent = element2Parent(element);
			const targetElement = element2Target(element);//parent2Target(parent);
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

	//const updateUserPage = getUserPageObserver();
	//const updateFeed = getFeedObserver(FEED_SELECTOR);
	//const updateReplyPost = getFeedObserver(THREAD_REPLY_POST_SELECTOR);
	//const updateHoverCard = getHoverObserver();
	//const updateRecommended = getRecommendedObserver();

	function addCheckmark() {

		console.log(invocations);
		if (invocations > 0) {

			invocations -= 1;

			manager.updateUserPage(USER_SELECTOR, HEADING_SELECTOR);
			manager.updateCheckmark(FEED_SELECTOR,
				(element) => element.closest('div[data-testid="User-Name"]')?.
					firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild);
			manager.updateCheckmark(THREAD_REPLY_POST_SELECTOR,
				(element) => element.closest('div[data-testid="User-Name"]')?.
					firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild);
			manager.updateCheckmark(HOVER_CARD_SELECTOR,
				(element) => element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.
					firstElementChild?.firstElementChild?.lastElementChild);
			manager.updateCheckmark(RECOMMENDATION_SELECTOR,
				(element) => element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.
					parentElement?.
					firstElementChild?.firstElementChild?.lastElementChild);

			window.setTimeout(addCheckmark, 500);
		}
		console.log("stopped");
	}
	addCheckmark();

	const observer = new MutationObserver((mutations) => {

		if (invocations <= 0) {

			invocations = 1;
			window.setTimeout(addCheckmark, 500);
		}
		else {

			invocations = Math.max(10, invocations + 1);
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
