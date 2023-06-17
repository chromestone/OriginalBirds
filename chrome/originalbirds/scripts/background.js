const JSON_DATA_URL_PREFIX = "data:application/json;base64,";
const DEFAULT_DOMAIN_NAME = "https://original-birds.pages.dev";

// this is not a true value,
// rather it is used to force a checkmark cache if an update deems it necessary.
const LAST_TWITTER_UPDATE = new Date("2023-04-22T16:00:00.000Z");

const DEFAULT_HANDLES_VERSION = Object.freeze(["0"]);

const DEFAULT_HANDLES_VERSION_URL = DEFAULT_DOMAIN_NAME + "/version.txt";
const DEFAULT_HANDLES_URL = DEFAULT_DOMAIN_NAME + "/verified_handles.txt";

const DEFAULT_SELECTORS_VERSION = Object.freeze(["0"]);

const DEFAULT_SELECTORS_URL = DEFAULT_DOMAIN_NAME + "/selectors.json";

const SUPPORTERS_URL = DEFAULT_DOMAIN_NAME + "/supporters.json";

const CLOSEME_LISTENER = {
	waitingForResponse: false,
	tabId: null,
	callbacks: [],
	run: function(sender, sendResponse) {

		if (this.waitingForResponse) {

			if (this.tabId == null) {

				this.callbacks.push([sender, sendResponse]);
			}
			else {

				const closeme = sender.tab.id === this.tabId;
				sendResponse({closeme: closeme});
				if (closeme) {

					this.waitingForResponse = false;
					this.tabId = null;
				}
			}
		}
		else {

			sendResponse({closeme: false});
		}
	},
	flush: function() {

		this.callbacks.forEach((theArgs) => this.run(...theArgs));
		this.callbacks = [];
	}
};

let updatesChecked = false;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

	if (msg.text === "closeme?") {

		CLOSEME_LISTENER.run(sender, sendResponse);
		return true;
	}
	if (msg.text === "checkforupdates?") {

		sendResponse({checkingupdates: !updatesChecked});
		if (!updatesChecked) {

			updatesChecked = true;
			checkForUpdates(false);
		}
		return true;
	}
	else if (msg.text === "fetchhandles?") {

		chrome.storage.local.get([
			"handles", "handlesversion", "handlesversionurl", "handlesurl"
		], (result) => {

			result.handlesversion ??= ["0"];

			setDefaultHandles(result.handles === undefined ? null : result.handlesversion).
			then((version) => fetchHandles(result.handlesversionurl, result.handlesurl, version)).
			then(sendResponse);
		});
		return true;
	}
	else if (msg.text === "fetchselectors?") {

		chrome.storage.local.get(["selectors", "selectorsurl"], (result) => {

			if (result.selectorsurl?.trimStart().startsWith(JSON_DATA_URL_PREFIX) === true) {

				fetchSelectors(result.selectorsurl).then(sendResponse);
			}
			else {

				setDefaultSelectors(parseSelectorsVersion(result.selectors)).
				then((version) => fetchSelectors(result.selectorsurl, version)).
				then(sendResponse);
			}
		});
		return true;
	}
	else if (msg.text === "cachecheckmark!") {

		cacheCheckmark();
	}
	return false;
});

chrome.runtime.onInstalled.addListener(checkForUpdates);

function cacheCheckmark() {

	if (CLOSEME_LISTENER.waitingForResponse) {

		return;
	}
	CLOSEME_LISTENER.waitingForResponse = true;

	chrome.tabs.create({url: "https://twitter.com/elonmusk", active: false}, (tab) => {

		CLOSEME_LISTENER.tabId = tab.id;
		// if the previous line does not outpace the content script's request
		// then clearing the backlog handles it
		CLOSEME_LISTENER.flush();
	});
}

function versionCompare(versionA, versionB) {

	if (versionA.length > versionB.length) {

		return 1;
	}
	else if (versionA.length < versionB.length) {

		return -1;
	}

	const collator = new Intl.Collator("en", {sensitivity: "base"});
	return collator.compare(versionA, versionB);
}

function updateNeeded(currentVersionData, latestVersionData) {

	const [currentVersion, currentMoniker = null] = currentVersionData;
	const [latestVersion, latestMoniker = null] = latestVersionData;

	// do not use new here
	const monikerSame = (currentMoniker === null && latestMoniker === null) ||
		(currentMoniker !== null && latestMoniker !== null &&
			String(currentMoniker) === String(latestMoniker));

	return !monikerSame || versionCompare(currentVersion, latestVersion) < 0;
}

async function setDefaultHandles(currentVersionData) {

	// skip when moniker is set or default version is not newer
	if (currentVersionData != null &&
		(currentVersionData.length > 1 ||
			!updateNeeded(currentVersionData, DEFAULT_HANDLES_VERSION))) {

		return Promise.resolve(currentVersionData);
	}

	let data;
	try {

		const response = await fetch("../data/verified_handles.txt");
		data = await response.text();
	}
	catch (error) {

		console.error(error);
		console.log("Warning: Original Birds could not find a local fallback handles list.");
		return Promise.resolve(currentVersionData);
	}

	const handles = data.split("\n").filter((str) => str !== "").map((str) => str.toLowerCase());

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	return new Promise((resolve) => chrome.storage.local.set({
		handles: handles,
		handlesversion: DEFAULT_HANDLES_VERSION,
		lasthandlesupdate: theDate.toJSON()
	}, () => resolve(DEFAULT_HANDLES_VERSION)));
}

async function fetchHandlesVersion(versionURL) {

	try {

		const inputURL = new URL(versionURL ?? DEFAULT_HANDLES_VERSION_URL);

		if (!(inputURL.protocol === "https:" && inputURL.search === "" &&
			inputURL.username === "" && inputURL.password === "")) {

			console.log("Warning: Original Birds encountered invalid handles VERSION URL.");
			return null;
		}

		const response = await fetch(inputURL, {cache: "no-store", redirect: "error"});

		if (!response.ok) {

			console.log(
				"Warning: Original Birds encountered status [" +
				response.status +
				"] retrieving the handles list VERSION."
			);
			return null;
		}

		const data = await response.text();
		return data.split(",", 2);
	}
	catch (error) {

		console.error(error);
		console.log("Warning: Original Birds could not retrieve the handles list VERSION.");
		return null;
	}
}

async function fetchHandles(versionURL, handlesURL, currentVersionData) {

	const latestVersionData = await fetchHandlesVersion(versionURL);
	if (latestVersionData === null) {

		return Promise.resolve({success: false});
	}
	if (currentVersionData != null && !updateNeeded(currentVersionData, latestVersionData)) {

		return Promise.resolve({success: true});
	}

	let data;
	try {

		const inputURL = new URL(handlesURL ?? DEFAULT_HANDLES_URL);

		if (!(inputURL.protocol === "https:" && inputURL.search === "" &&
			inputURL.username === "" && inputURL.password === "")) {

			console.log("Warning: Original Birds encountered invalid handles URL.");
			return Promise.resolve({success: false});
		}

		const response = await fetch(inputURL, {cache: "no-store", redirect: "error"});

		if (!response.ok) {

			console.log(
				"Warning: Original Birds encountered status [" +
				response.status +
				"] retrieving the handles list."
			);
			return Promise.resolve({success: false});
		}

		data = await response.text();
	}
	catch (error) {

		console.error(error);
		console.log("Warning: Original Birds could not retrieve the latest handles list.");
		return Promise.resolve({success: false});
	}

	const handles = data.split("\n").filter((str) => str !== "").map((str) => str.toLowerCase());

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	return new Promise((resolve) => chrome.storage.local.set({
		handles: handles,
		handlesversion: latestVersionData,
		lasthandlesupdate: theDate.toJSON()
	}, () => resolve({success: true})));
}

function parseSelectorsVersion(selectorsJSON) {

	try {

		const selectors = JSON.parse(selectorsJSON ?? "{}");
		if (Array.isArray(selectors.version)) {

			return selectors.version;
		}
	}
	catch(error) {

		console.error(error);
		console.log("Warning: Original Birds failed to parse selectors version.");
	}

	return null;
}

function setDefaultSelectors(currentVersionData) {

	// skip when moniker is set or default version is not newer
	if (currentVersionData != null &&
		(currentVersionData.length > 1 ||
			!updateNeeded(currentVersionData, DEFAULT_SELECTORS_VERSION))) {

		return Promise.resolve(currentVersionData);
	}

	const data = JSON.stringify({
		version: DEFAULT_SELECTORS_VERSION,

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
	}, () => resolve(DEFAULT_SELECTORS_VERSION)));
}

async function fetchSelectors(selectorsURL, currentVersionData = null) {

	selectorsURL = (selectorsURL ?? DEFAULT_SELECTORS_URL).trim();

	let data;
	try {

		if (selectorsURL.startsWith(JSON_DATA_URL_PREFIX)) {

			data = atob(selectorsURL.substring(JSON_DATA_URL_PREFIX.length));
		}
		else {

			const inputURL = new URL(selectorsURL);

			if (!(inputURL.protocol === "https:" && inputURL.search === "" &&
				inputURL.username === "" && inputURL.password === "")) {

				console.log("Warning: Original Birds encountered invalid selectors URL.");
				return Promise.resolve({success: false});
			}

			const response = await fetch(inputURL, {cache: "no-store", redirect: "error"});

			if (!response.ok) {

				console.log(
					"Warning: Original Birds encountered status [" +
					response.status +
					"] retrieving the selectors."
				);
				return Promise.resolve({success: false});
			}

			data = await response.text();

			// only perform version check when not using data URL
			// also validates JSON
			const latestVersionData = parseSelectorsVersion(data);
			if (latestVersionData === null) {

				return Promise.resolve({success: false});
			}
			if (currentVersionData !== null && !updateNeeded(currentVersionData, latestVersionData)) {

				return Promise.resolve({success: true});
			}
		}
	}
	catch (error) {

		console.error(error);
		console.log("Warning: Original Birds could not retrieve the latest selectors.");
		return Promise.resolve({success: false});
	}

	const theDate = new Date();
	theDate.setHours(0,0,0,0);

	return new Promise((resolve) => chrome.storage.local.set({
		selectors: data,
		lastlaunch: theDate.toJSON()
	}, () => resolve({success: true})));
}

async function fetchSupporters() {

	try {

		const response = await fetch(SUPPORTERS_URL, {cache: "no-store", redirect: "error"});

		if (!response.ok) {

			console.log(
				"Warning: Original Birds encountered status [" +
				response.status +
				"] retrieving supporters."
			);
			return;
		}

		const data = await response.text();

		// validate JSON
		JSON.parse(data);

		const theDate = new Date();
		theDate.setHours(0,0,0,0);

		chrome.storage.local.set({supporters: data, lastlaunch: theDate.toJSON()});
	}
	catch (error) {

		console.error(error);
		console.log("Warning: Original Birds encountered an error retrieving supporters.");
	}
}

function freq2millis(freq) {

	return (
		freq === "daily"    ?       24 * 60 * 60 * 1000 :
		freq === "weekly"   ?   7 * 24 * 60 * 60 * 1000 :
		freq === "monthly"  ?  28 * 24 * 60 * 60 * 1000 :
		freq === "yearly"   ? 365 * 24 * 60 * 60 * 1000 : Infinity
	);
}

function checkForUpdates(onInstall = true) {

	chrome.storage.local.get([
		"checkmark", "handles", "selectors", "supporters",
		"lastlaunch", "lastcheckmarkupdate", "lasthandlesupdate",
		"handlesfrequency", "handlesversion", "handlesversionurl", "handlesurl",
		"selectorsurl"
	], (result) => {

		const theDate = new Date();
		theDate.setHours(0,0,0,0);

		result.lastcheckmarkupdate ??= new Date("2023-04-26T16:00:00.000Z");

		// don't check onInstall here because this action is obtrusive
		// and this condition already checks the version
		if (result.checkmark === undefined ||
			// check if last Twitter update is newer than when checkmark was last retrieved
			LAST_TWITTER_UPDATE >= result.lastcheckmarkupdate) {

			cacheCheckmark();
		}

		result.handlesfrequency ??= "weekly";
		result.handlesversion ??= ["0"];

		if (onInstall ||
			result.handles === undefined ||
			result.lasthandlesupdate === undefined ||
			Math.abs(theDate - new Date(result.lasthandlesupdate)) >= freq2millis(result.handlesfrequency)) {

			setDefaultHandles(result.handles === undefined ? null : result.handlesversion).
			then((version) => fetchHandles(result.handlesversionurl, result.handlesurl, version));
		}

		const overdue = (
			onInstall ||
			result.lastlaunch === undefined ||
			Math.abs(theDate - new Date(result.lastlaunch)) >= freq2millis("daily")
		);

		if (result.selectorsurl?.trimStart().startsWith(JSON_DATA_URL_PREFIX) === true) {

			fetchSelectors(result.selectorsurl);
		}
		else if (result.selectors === undefined || overdue) {

			setDefaultSelectors(parseSelectorsVersion(result.selectors)).
			then((version) => fetchSelectors(result.selectorsurl, version));
		}

		// BEGIN SUPPORTER SECTION

		if (result.supporters === undefined || overdue) {

			fetchSupporters();
		}

		// END SUPPORTER SECTION
	});
}
