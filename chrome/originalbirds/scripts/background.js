const JSON_DATA_URL_PREFIX = "data:application/json;base64,";
const DEFAULT_SELECTORS_URL = "https://original-birds.pages.dev/selectors.json";

let closemeListener = (_, sendResponse) => sendResponse({closeme: false});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

	if (msg.text === "closeme?") {

		closemeListener(sender, sendResponse);
		return true;
	}
	else if (msg.text === "fetchselectors?") {

		chrome.storage.local.get("selectorsurl", (result) => 
			fetchSelectors(result.selectorsurl ?? DEFAULT_SELECTORS_URL).then((success) =>
				sendResponse({success: success})));
		return true;
	}
	else if (msg.text === "cachecheckmark!") {

		cacheCheckmark();
	}
	return false;
});

function cacheCheckmark() {

	const callbacks = [];
	closemeListener = (...theArgs) => callbacks.push(theArgs);
	chrome.tabs.create({url: "https://twitter.com/elonmusk", active: false}, (tab) => {

		closemeListener = (sender, sendResponse) => sendResponse({closeme: sender.tab.id === tab.id});
		// if the previous line does not outpace the content script's request
		// then clearing the backlog handles it
		callbacks.forEach((theArgs) => closemeListener(...theArgs));
	});
}

async function setDefaultHandles() {

	let data;
	try {

		const response = await fetch("../data/verified_handles.txt");
		data = await response.text();
	}
	catch (error) {

		console.log("Warning: Original Birds could not find a local fallback list.");
		console.error(error);
		return Promise.resolve(null);
	}

	const handles = data.split('\n').filter((str) => str !== "").map((str) => str.toLowerCase());

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	return new Promise((resolve) => chrome.storage.local.set({
		handles: handles,
		lasthandlesupdate: theDate.toJSON()
	}, () => resolve(null)));
}

async function fetchHandles() {

	let data;
	try {

		const response = await fetch("https://original-birds.pages.dev/verified_handles.txt",
			{cache: "no-store", redirect: "error"});

		if (!response.ok) {

			throw new Error("Original Birds encountered status [" + response.status + "] retrieving the list.");
		}

		data = await response.text();
	}
	catch (error) {

		console.log("Warning: Original Birds could not retrieve the latest legacy users list.");
		console.error(error);
		return;
	}

	const handles = data.split('\n').filter((str) => str !== "").map((str) => str.toLowerCase());

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	chrome.storage.local.set({handles: handles, lasthandlesupdate: theDate.toJSON()});
}

function setDefaultSelectors() {

	const data = JSON.stringify({
		verifiediconselector: 'svg[data-testid="icon-verified"]',

		// targets user name on their profile/feed page
		userselector: {
			selector: 'div[data-testid="UserName"]' + ' > *'.repeat(5) + ' > [dir] > span',
			nthparent: 5,
			parent2target: ':scope' + ' > :nth-child(1)'.repeat(4) + ' > :last-child'.repeat(3),
			parent2name: ':scope' + ' > :nth-child(1)'.repeat(5)
		},
		// targets top heading on user page
		headingselector: {
			selector: 'div[data-testid="primaryColumn"] h2' + ' > *'.repeat(4) + ' > :last-child > span',
			nthparent: 2,
			parent2name: ':scope' + ' > :nth-child(1)'.repeat(3)
		},

		selectors: [
			// targets feed topmost post
			// targets user feed or thread reply with (nested) post
			{
				selector: 'div[data-testid="User-Name"] > :last-child > * > * > * > [dir] > span',
				nthparent: 6,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(4) + ' > :last-child'.repeat(2),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(7),
				closestborder: 'div[data-testid="cellInnerDiv"] > *,' +
					'div[role="link"]:has(' + ' > *'.repeat(6) + ' > div[data-testid="User-Name"])'
			},
			// targets user name when writing a popup reply
			{
				selector: 'div[data-testid="User-Name"] > :last-child > * > * > [dir] > span',
				nthparent: 5,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(3) + ' > :last-child'.repeat(2),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(6)
			},
			// targets overlay upon hovering on user
			{
				selector: 'div[data-testid="HoverCard"]' + ' > *'.repeat(8) + ' > [dir] > span',
				nthparent: 5,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(2) + ' > :last-child'.repeat(2),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(3),
				closestborder: 'div[data-testid="HoverCard"]'
			},
			// targets recommendation or "(people) you might like" or "who to follow"
			{
				selector: 'div[data-testid="UserCell"]' + ' > *'.repeat(9) + ' > [dir] > span',
				nthparent: 6,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(2) + '> :last-child'.repeat(3),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(6),
				closestborder: 'div[data-testid="UserCell"]'
			},
			// targets messages column
			{
				selector: 'div[data-testid="conversation"]' + ' > *'.repeat(12) + ' > [dir] > span',
				nthparent: 5,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(2) + ' > :last-child'.repeat(2),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(5)
			},
			// targets active message header
			{
				selector: 'div[data-testid="DmActivityContainer"] div[data-testid="cellInnerDiv"]' + ' > *'.repeat(7) + ' > [dir] > span',
				nthparent: 6,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(3) + ' > :last-child'.repeat(2),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(6)
			},
			// targets original embed tweets
			{
				selector: '#app article[role]' + ' > *'.repeat(5) + ' > a:nth-child(1):has(> span)',
				nthparent: 2,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(6) + ' > :last-child'.repeat(2),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(9)
			},
			// targets embed tweets
			{
				selector: '#app article[role]' + ' > *'.repeat(8) + ' > [dir] > span',
				nthparent: 5,
				parent2target: ':scope' + ' > :nth-child(1)'.repeat(2) + ' > :last-child'.repeat(2),
				parent2name: ':scope' + ' > :nth-child(1)'.repeat(5),
				closestborder: '#app > * > * > *'
			},
		]
	});

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	return new Promise((resolve) => chrome.storage.local.set({
		selectors: data,
		lastlaunch: theDate.toJSON()
	}, () => resolve(null)));
}

async function fetchSelectors(urlString) {

	urlString = (urlString ?? "").trim();

	let data;
	try {

		if (urlString.startsWith(JSON_DATA_URL_PREFIX)) {

			const decodedData = atob(urlString.substring(JSON_DATA_URL_PREFIX.length));
			data = JSON.parse(decodedData);
		}
		else {

			const inputURL = new URL(urlString);

			if (!(inputURL.protocol === "https:" && inputURL.search === "" &&
				inputURL.username === "" && inputURL.password === "")) {

				console.log("Warning: Original Birds encountered invalid selectors URL.");
				return false;
			}

			const response = await fetch(inputURL, {cache: "no-store", redirect: "error"});

			if (!response.ok) {

				throw new Error(
					"Original Birds encountered status [" +
					response.status +
					"] retrieving the selectors."
				);
			}

			data = await response.text();
		}
	}
	catch (error) {

		console.log("Warning: Original Birds could not retrieve the latest selectors.");
		console.error(error);
		return false;
	}

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	chrome.storage.local.set({selectors: data, lastlaunch: theDate.toJSON()});
	return true;
}

async function fetchSupporters() {

	try {

		const response = await fetch("https://original-birds.pages.dev/supporters.json",
			{cache: "no-store", redirect: "error"});

		if (!response.ok) {

			throw new Error("Original Birds encountered status [" + response.status + "] retrieving supporters.");
		}

		const data = await response.text();

		const theDate = new Date();
		theDate.setHours(0,0,0,0);

		chrome.storage.local.set({supporters: data, lastlaunch: theDate.toJSON()});
	}
	catch (error) {

		console.log("Warning: Original Birds encountered an error retrieving supporters.");
		console.log(error.message);
	}
}

function freq2millis(freq) {

	if (freq === "daily") {

		return 24 * 60 * 60 * 1000;
	}
	if (freq === "weekly") {

		return 7 * 24 * 60 * 60 * 1000;
	}
	if (freq === "monthly") {

		return 28 * 24 * 60 * 60 * 1000;
	}
	if (freq === "yearly") {

		return 365 * 24 * 60 * 60 * 1000;
	}
	return Infinity;
}

chrome.storage.local.get([
	"checkmark", "handles", "selectors", "supporters", "lastlaunch",
	"lastcheckmarkupdate", "lasthandlesupdate", "handlesfrequency",
	"selectorsurl"
], (result) => {

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	// this is not a true value,
	// rather it is used to force a checkmark cache if an update deems it necessary.
	const LAST_TWITTER_UPDATE = new Date("2023-04-22T16:00:00.000Z");
	result.lastcheckmarkupdate ??= new Date("2023-04-26T16:00:00.000Z");

	if (result.checkmark === undefined ||
		// check if last Twitter update is newer than when checkmark was last retrieved
		LAST_TWITTER_UPDATE >= result.lastcheckmarkupdate) {

		console.log("checkmark");
		cacheCheckmark();
	}

	result.handlesfrequency ??= "monthly";

	if (result.handles === undefined) {

		setDefaultHandles().then(fetchHandles);
	}
	else if (result.lasthandlesupdate === undefined ||
		Math.abs(theDate - new Date(result.lasthandlesupdate)) >= freq2millis(result.handlesfrequency)) {

		fetchHandles();
	}

	const overdue = result.lastlaunch === undefined ||
		Math.abs(theDate - new Date(result.lastlaunch)) >= freq2millis("daily");

	const selectorsURL = result.selectorsurl ?? DEFAULT_SELECTORS_URL;
	if (result.selectors === undefined) {

		setDefaultSelectors().then((_) => fetchSelectors(selectorsURL));
	}
	else if (overdue) {

		fetchSelectors(selectorsURL);
	}

	// BEGIN SUPPORTER SECTION

	if (result.supporters === undefined || overdue) {

		fetchSupporters();
	}

	// END SUPPORTER SECTION
});
