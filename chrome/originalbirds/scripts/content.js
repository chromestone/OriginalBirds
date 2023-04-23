// checkmark
const CHECK_SELECTOR = 'div[data-testid="UserName"] > div > div > div > div > div[dir="ltr"] > span > span > span > span > div:nth-child(1)';

// user feed - name and checkmark container
const USER_SELECTOR = 'div[data-testid="UserName"] > div > div > div > div > div[dir="ltr"] > span';
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

async function checkmarkUserPage(targetElement) {

	const checkHtml = await retrieveCheckmark();
	if (checkHtml === null) {

		return;
	}

	const div = document.createElement("span");

	div.style.verticalAlign = "middle";

	div.innerHTML = checkHtml;
	const svg = div.querySelector('svg');
	if (svg !== null) {

		svg.style.color = "#2DB32D";//"#800080";
	}

	targetElement.appendChild(div);
}

async function checkmarkUserHeading(targetElement) {

	const checkHtml = await retrieveCheckmark();
	if (checkHtml === null) {

		return;
	}

	const div = document.createElement("span");

	div.style.display = "flex";

	div.innerHTML = checkHtml;
	const svg = div.querySelector('svg');
	if (svg !== null) {

		svg.style.color = "#2DB32D";
	}

	targetElement.appendChild(div);
}

async function registerOneTimeObserver() {

	const url = new URL(window.location);
	const splitted = url.pathname.split("/").filter((str) => str !== "");
	if (splitted.length == 1) {

		const verified = await verifiedHandles(splitted);
		if (verified[0]) {

			waitForElement(USER_SELECTOR).then(checkmarkUserPage);
			waitForElement(HEADING_SELECTOR).then(checkmarkUserHeading);
		}
	}
	else if (splitted.length >= 2 && splitted[1] == "status") {

		// TODO
	}
}

function getFeedObserver() {

	var FEEDS_PROCESSED = new Set();

	return () => {

		const targetElements = [...document.querySelectorAll(FEED_SELECTOR)];

		const notProcessed = targetElements.filter((element) => {

			const parent = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
			return parent.hasAttribute("id") && !FEEDS_PROCESSED.has(parent.id);
		}
		);

		for (const element of notProcessed) {

			FEEDS_PROCESSED.add(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id);
		}

		if (notProcessed.length == 0) {

			return;
		}

		verifiedHandles(notProcessed.map((element) => element.textContent.substring(1))).then((verified) => {

			const doProcessing = notProcessed.filter((_, idx) => verified[idx]);

			if (doProcessing.length == 0) {

				return;
			}

			retrieveCheckmark().then((checkHtml) => {

				for (const element of doProcessing) {

					const targetElement = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild.firstElementChild.firstElementChild.firstElementChild;

					let div = document.createElement("span");

					div.style.display = "flex";

					div.innerHTML = checkHtml;
					let svg = div.querySelector('svg');
					if (svg) {

						svg.style.color = "#2DB32D";
					}

					targetElement.appendChild(div);
				}
			});
		});
	};
}

function getThreadReplyPostObserver() {

	var FEEDS_PROCESSED = new Set();

	return () => {

		const targetElements = [...document.querySelectorAll(THREAD_REPLY_POST_SELECTOR)];

		const notProcessed = targetElements.filter((element) =>
			!FEEDS_PROCESSED.has(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id)
		);

		for (const element of notProcessed) {

			FEEDS_PROCESSED.add(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id);
		}

		if (notProcessed.length == 0) {

			return;
		}

		verifiedHandles(notProcessed.map((element) => element.textContent.substring(1))).then((verified) => {

			const doProcessing = notProcessed.filter((_, idx) => verified[idx]);

			if (doProcessing.length == 0) {

				return;
			}

			retrieveCheckmark().then((checkHtml) => {

				for (const element of doProcessing) {

					//const targetElement = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(THREAD_REPLY_POST_CHECK_SELECTOR);
					const targetElement = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.firstChild.firstChild.firstChild.firstChild;

					let div = document.createElement('span');

					div.style.display = "flex";

					div.innerHTML = checkHtml;
					let svg = div.querySelector('svg');
					if (svg) {

						svg.style.color = "#2DB32D";
					}

					targetElement.appendChild(div);
				}
			});
		});
	};
}

function registerRecurringObserver() {

	const updateFeed = getFeedObserver();
	const updateReplyPost = getThreadReplyPostObserver();

	const observer = new MutationObserver((mutations) => {

		updateFeed();
		updateReplyPost();
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

			registerOneTimeObserver();
			registerRecurringObserver();
		}
	});
});
