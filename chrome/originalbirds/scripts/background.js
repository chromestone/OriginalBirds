let closemeListener = (_, sendResponse) => sendResponse({closeme: false});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

	if (msg.text === "closeme?") {

		closemeListener(sender, sendResponse);
		return true;
	}
	else if (msg.text === "cachecheckmark!") {

		cacheCheckmark();
	}
	return false;
});

const LAST_TWITTER_UPDATE = new Date("2023-04-22T16:00:00.000Z");

const DEFAULT_SELECTORS = {
	// checkmark selector to get html with checkmark svg
	checkselector: {
		selector: 'div[data-testid="UserName"] > ' + '* > '.repeat(4) + '[dir] > ' + '* > '.repeat(4) + ':nth-child(1)',
		element2target: [],
		element2name: [],
		element2border: []
	},

	// targets user name on their profile/feed page
	userselector: {
		selector: 'div[data-testid="UserName"] > ' + '* > '.repeat(5) + '[dir] > *',
		element2target: [],
		element2name: [],
		element2border: []
	},
	// targets top heading on user page
	headingselector: {
		selector: 'h2[role="heading"] > ' + '* > '.repeat(4) + ':last-child > *',
		element2target: [],
		element2name: [],
		element2border: []
	},

	selectors: [
		// targets feed topmost post
		// targets user feed or thread reply with (nested) post
		{
			selector: 'div[data-testid="User-Name"] > :last-child > * > * > * > [dir] > *',
			element2target: [],
			element2name: [],
			element2border: []
		},
		// targets user name when writing a popup reply
		{
			selector: 'div[data-testid="User-Name"] > :last-child > * > * > [dir] > span',
			element2target: [],
			element2name: [],
			element2border: []
		},
		// targets overlay upon hovering on user
		{
			selector: 'div[data-testid="HoverCard"] > ' + '* > '.repeat(8) + '[dir] > span',
			element2target: [],
			element2name: [],
			element2border: []
		},
		// targets recommendation and people you might like
		{
			selector: 'div[data-testid="UserCell"] > ' + '* > '.repeat(9) + '[dir] > *',
			element2target: [],
			element2name: [],
			element2border: []
		},
		// targets messages column
		{
			selector: 'div[data-testid="conversation"] > ' + '* > '.repeat(12) + '[dir] > *',
			element2target: [],
			element2name: [],
			element2border: []
		},
		// targets active message header
		{
			selector: 'div[data-testid="cellInnerDiv"] > ' + 'div > '.repeat(5) + 'a > div > div[dir] > span',
			element2target: [],
			element2name: [],
			element2border: []
		},
		// targets original embed tweets
		{
			selector: 'article[role] > ' + '* > '.repeat(5) + 'a:nth-child(1) > span:last-child',
			element2target: [],
			element2name: [],
			element2border: []
		},
		// targets embed tweets
		{
			selector: 'article[role] > ' + '* > '.repeat(8) + '[dir] > span',
			element2target: [],
			element2name: [],
			element2border: []
		},
	]
};

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
	return 0;
}

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

async function fetchHandles() {

	let data;
	try {

		const response = await fetch("https://original-birds.pages.dev/verified_handles.txt");
		if (!response.ok) {

			throw new Error("Original Birds encountered status [" + response.status + "] retrieving the list.");
		}
		data = await response.text();
	}
	catch (error) {

		console.log("Warning: Original Birds could not retrieve the latest legacy users list.");
		console.log(error.message);

		try {

			const response = await fetch("../data/verified_handles.txt");
			data = await response.text();
		}
		catch (error) {

			console.error("Original Birds could not find a local fallback list.");
			console.error(error);
			return;
		}
	}

	const handles = data.split('\n').filter((str) => str !== "").map((str) => str.toLowerCase());

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	chrome.storage.local.set({handles: handles, lasthandlesupdate: theDate.toJSON()});
}

async function fetchSelectors() {

	let data;
	try {

		/* TODO
		const response = await fetch("https://original-birds.pages.dev/selectors.json");
		if (!response.ok) {

			throw new Error("Original Birds encountered status [" + response.status + "] retrieving the list.");
		}
		data = await response.text();
		*/
		throw new Error("This is a test.");
	}
	catch (error) {

		console.log("Warning: Original Birds could not retrieve the latest selectors.");
		console.log(error.message);

		data = JSON.stringify(DEFAULT_SELECTORS);
	}

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	chrome.storage.local.set({selectors: data, lastlaunch: theDate.toJSON()});
}

async function fetchSupporters() {

	try {

		const response = await fetch("https://original-birds.pages.dev/supporters.json");
		if (!response.ok) {

			throw new Error("Original Birds encountered status [" + response.status + "] retrieving supporters.");
		}
		const data = await response.text();

		const theDate = new Date();
		theDate.setHours(0,0,0,0);

		chrome.storage.local.set({supporters: data, lastlaunch: theDate.toJSON()});
	}
	catch (error) {

		console.error(error);
	}
}

chrome.storage.local.get([
	"checkmark", "handles", "selectors", "supporters", "lastlaunch",
	"lastcheckmarkupdate", "lasthandlesupdate",
	"checkmarkfrequency", "handlesfrequency"], (result) => {

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	result.checkmarkfrequency ??= "automatic";
	result.handlesfrequency ??= "monthly";

	result.lastcheckmarkupdate ??= new Date("2023-04-26T16:00:00.000Z");

	if (result.checkmark === undefined ||
		(result.checkmarkfrequency === "automatic" ?
		// check if last Twitter update is newer than when checkmark was last retrieved
		result.lastcheckmarkupdate <= LAST_TWITTER_UPDATE :
		// only update on user set frequency
		(result.checkmarkfrequency !== "never" &&
		Math.abs(theDate - new Date(result.lastcheckmarkupdate)) >=
		freq2millis(result.checkmarkfrequency)))) {

		cacheCheckmark();
	}

	if (result.handles === undefined ||
		result.lasthandlesupdate === undefined ||
		(result.handlesfrequency !== "never" &&
		Math.abs(theDate - new Date(result.lasthandlesupdate)) >=
		freq2millis(result.handlesfrequency))) {

		fetchHandles();
	}

	const overdue = result.lastlaunch === undefined ||
		Math.abs(theDate - new Date(result.lastlaunch)) >= freq2millis("daily");

	if (result.selectors === undefined || overdue) {

		fetchSelectors();
	}

	// BEGIN SUPPORTER SECTION

	if (result.supporters === undefined || overdue) {

		fetchSupporters();
	}

	// END SUPPORTER SECTION
});
