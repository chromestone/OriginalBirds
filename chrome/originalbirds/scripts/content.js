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
// name and checkmark container (relative to post parent)
//const FEED_CHECK_SELECTOR = "div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs > div > a > div";

// thread reply with post - handle
//const THREAD_REPLY_POST_SELECTOR = "div.css-1dbjc4n.r-1kqtdi0.r-1867qdf.r-rs99b7.r-1loqt21.r-adacv.r-1ny4l3l.r-1udh08x.r-o7ynqc.r-6416eg > div > div.css-1dbjc4n.r-eqz5dr.r-1fz3rvf.r-1s2bzr4 > div > div > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > div > div > span";
const THREAD_REPLY_POST_SELECTOR = 'div[data-testid="User-Name"] > div:nth-child(2) > div > div > div > div > span';
// name and checkmark container (relative to post parent)
// const THREAD_REPLY_POST_CHECK_SELECTOR = "div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs > div > div > div > div";

const HOVER_CARD_SELECTOR = 'div[data-testid="HoverCard"] > div > div > div > div > div > div > a > div > div > span';

const SPAN_WITH_ID = 'span[id]';

// const CHECKMARK_TOOLTIP = "A legacy verified user used this Twitter handle in the past.";

function myRandomId() {

	return "id_" + Date.now().toString() + Math.random().toString(16).slice(2);
}

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
	//window.setTimeout(window.close, 20000);
}

// returns a Promise that returns a list indicating if the ith handle is verified
function verifiedHandles(handles) {

	return new Promise((resolve) => {

		chrome.storage.local.get("handles", (result) => {

			const handlesSet = new Set(typeof result.handles === 'undefined' ? [] : result.handles);
			resolve(handles.map(element => handlesSet.has(element)));
		});
	});
}

function retrieveCheckmark() {

	return new Promise((resolve) => {

		chrome.storage.local.get("checkmark", (result) => {

			resolve(typeof result.checkmark === 'undefined' ? null : result.checkmark);
		});
	});
}

function getUserPageObserver() {

	var FEEDS_PROCESSED = new Set();

	return async () => {

		const handleElement = document.querySelector(USER_SELECTOR);
		if (handleElement === null) {

			return;
		}

		const verified = await verifiedHandles([handleElement.textContent?.substring(1)]);
		if (!verified[0]) {

			return;
		}

		const checkHtml = await retrieveCheckmark();
		if (checkHtml === null) {

			return;
		}

		const parent = handleElement.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.
			parentElement?.parentElement;
		const targetElement = parent?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.
			firstElementChild?.lastElementChild;
		// check undefined as well
		if (parent == null || targetElement == null) {

			console.log("This should not happen.");
		}
		else {

			let checkmarkFound = false;
			for (const child of targetElement.children) {

				if (FEEDS_PROCESSED.has(child.id)) {

					checkmarkFound = true;
					break;
				}
			}
			if (!checkmarkFound) {

				let myId = myRandomId();
				while (FEEDS_PROCESSED.has(myId)) {

					myId = myRandomId();
				}
				FEEDS_PROCESSED.add(myId);

				const div = document.createElement("span");

				div.classList.add("tooltip");

				div.id = myId;
				// div.style.verticalAlign = "middle";

				div.innerHTML = checkHtml;
				const svg = div.querySelector('svg');
				if (svg !== null) {

					svg.style.color = "#2DB32D";//"#800080";
				}

				const tooltipSpan = document.createElement("span");
				tooltipSpan.classList.add('tooltiptext');
				tooltipSpan.textContent = CHECKMARK_TOOLTIP;
				div.appendChild(tooltipSpan);

				targetElement.appendChild(div);
			}
		}

		const headingElement = document.querySelector(HEADING_SELECTOR);

		let checkmarkFound = false;
		for (const child of headingElement.children) {

			if (FEEDS_PROCESSED.has(child.id)) {

				checkmarkFound = true;
				break;
			}
		}
		if (!checkmarkFound) {

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

			headingElement.appendChild(div);
		}
	};
}

function getFeedObserver(selector) {

	var FEEDS_PROCESSED = new Set();

	return () => {

		const targetElements = [...document.querySelectorAll(selector)];

		if (targetElements.length == 0) {

			return;
		}

		verifiedHandles(targetElements.map((element) => element.textContent?.substring(1))).then((verified) => {

			const doProcessing = targetElements.filter((_, idx) => verified[idx]);

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
					const targetElement = parent?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild;
					// check undefined as well
					if (parent == null || targetElement == null) {

						console.log("This should not happen.");
						continue;
					}

					console.log(targetElement);
					let checkmarkFound = false;
					for (const child of targetElement.children) {

						console.log(child.id);
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
					console.log(myId);

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
		});
	};
}

function getHoverObserver() {

	var FEEDS_PROCESSED = new Set();

	return () => {

		const targetElements = [...document.querySelectorAll(HOVER_CARD_SELECTOR)];

		if (targetElements.length == 0) {

			return;
		}

		verifiedHandles(targetElements.map((element) => element.textContent?.substring(1))).then((verified) => {

			const doProcessing = targetElements.filter((_, idx) => verified[idx]);

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

					console.log(targetElement);
					let checkmarkFound = false;
					for (const child of targetElement.children) {

						console.log(child.id);
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
					console.log(myId);

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
		});
	};
}

function registerRecurringObserver() {

	const updateUserPage = getUserPageObserver();
	const updateFeed = getFeedObserver(FEED_SELECTOR);
	const updateReplyPost = getFeedObserver(THREAD_REPLY_POST_SELECTOR);
	const updateHoverCard = getHoverObserver();

	const observer = new MutationObserver((mutations) => {

		updateUserPage();
		updateFeed();
		updateReplyPost();
		updateHoverCard();
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
			// registerOneTimeObserver();
			registerRecurringObserver();
		}
	});
});
