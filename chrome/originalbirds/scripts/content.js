// checkmark
const CHECK_SELECTOR = "#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span > span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-1pos5eu.r-qvutc0 > span > span > div:nth-child(1)";

// user feed - name and checkmark container
const USER_SELECTOR = "#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span";

// user feed | explore | thread reply
const FEED_SELECTOR = "div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a > div > span";
// name and checkmark container (relative to post parent)
const FEED_CHECK_SELECTOR = "div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs > div > a > div";

// thread reply with post - handle
const THREAD_REPLY_POST_SELECTOR = "div.css-1dbjc4n.r-1kqtdi0.r-1867qdf.r-rs99b7.r-1loqt21.r-adacv.r-1ny4l3l.r-1udh08x.r-o7ynqc.r-6416eg > div > div.css-1dbjc4n.r-eqz5dr.r-1fz3rvf.r-1s2bzr4 > div > div > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-18u37iz.r-1wbh5a2.r-13hce6t > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > div > div > span";
// name and checkmark container (relative to post parent)
const THREAD_REPLY_POST_CHECK_SELECTOR = "div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wbh5a2.r-dnmrzs > div > div > div > div";

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

	//console.log(targetElement);
	console.log("setCheckmark");
	chrome.storage.local.set({checkmark : targetElement.outerHTML});
	window.close();
	//window.setTimeout(window.close, 20000);
}

// returns a Promise that yields a list of verified handles
function verifiedHandles(handles) {

	return new Promise((resolve) => {

		chrome.storage.local.get("handles", function(result) {

			const handlesSet = new Set(result.handles);
			resolve(handles.map(element => handlesSet.has(element)));
		});
	});
}

function retrieveCheckmark() {

	return new Promise((resolve) => {

		chrome.storage.local.get("checkmark", function(result) {

			resolve(result.checkmark);
		});
	});
}

async function verifyUserPage(targetElement) {

	const url = new URL(window.location);
	const handle = location.pathname.split('/')[1];
	console.log(targetElement.firstChild.textContent);

	const verified = await verifiedHandles([handle]);
	console.log(verified);
	if (verified[0]) {

		console.log("verified!");

		const checkHtml = await retrieveCheckmark();
		console.log(checkHtml);
		if (checkHtml) {

			const div = document.createElement('span');
			div.style.verticalAlign = "middle";
			div.innerHTML = checkHtml;
			const svg = div.querySelector('svg');
			if (svg) {

				svg.style.color = "#2DB32D";//"#800080";
				// svg.style.verticalAlign = "middle";
			}
			targetElement.appendChild(div);
		}
	}
}

function registerFeedObserver() {

	var FEEDS_PROCESSED = new Set();

	const feedObserver = new MutationObserver((mutations) => {

		// console.log(FEEDS_PROCESSED.size);

		const targetElements = [...document.querySelectorAll(FEED_SELECTOR)];
		//console.log(targetElements.length);

		const notProcessed = targetElements.filter((element) =>
			!FEEDS_PROCESSED.has(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id)
		);

		for (const element of notProcessed) {

			FEEDS_PROCESSED.add(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id);
		}

		if (notProcessed.length == 0) {

			return;
		}

		verifiedHandles(notProcessed.map((element) => element.textContent.substring(1))).then((verified) => {

			const doProcessing = notProcessed.filter((_, idx) => verified[idx]);
			//console.log(doProcessing.length);

			if (doProcessing.length == 0) {

				return;
			}

			retrieveCheckmark().then((checkHtml) => {

				//checkHtml = checkHtml.trim();

				for (const element of doProcessing) {

					const targetElement = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(FEED_CHECK_SELECTOR);
					let div = document.createElement('span');
					//div.style.verticalAlign = "middle";
					div.style.display = "flex";
					div.innerHTML = checkHtml;
					let svg = div.querySelector('svg');
					if (svg) {

						svg.style.color = "#2DB32D";//"#800080";
						// svg.style.verticalAlign = "middle";
					}
					targetElement.appendChild(div);
					//console.log(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id);
					// FEEDS_PROCESSED.add(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id);
				}
			});
/*
			// for (const element of targetElements) {
			doProcessing.forEach((element) => {

					//const id = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id;
					//if (!FEEDS_PROCESSED.has(id)) {

					FEEDS_PROCESSED.add(id);
					retrieveCheckmark().then((checkHtml) => {

						var div = document.createElement('span');
						div.innerHTML = checkHtml.trim();
						var svg = div.querySelector('svg');
						if (svg) {

							svg.style.color = "#2DB32D";//"#800080";
							svg.style.verticalAlign = "middle";
						}
						element.appendChild(div);
					});
					//}*/
			//});
		});
	});
	feedObserver.observe(document.body, { childList: true, subtree: true });
}

function registerThreadReplyPostObserver() {

	var FEEDS_PROCESSED = new Set();

	const feedObserver = new MutationObserver((mutations) => {

		const targetElements = [...document.querySelectorAll(THREAD_REPLY_POST_SELECTOR)];

		const notProcessed = targetElements.filter((element) =>
			!FEEDS_PROCESSED.has(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id)
		);

		for (const element of notProcessed) {

			FEEDS_PROCESSED.add(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id);
		}

		if (notProcessed.length == 0) {

			return;
		}

		verifiedHandles(notProcessed.map((element) => element.textContent.substring(1))).then((verified) => {

			const doProcessing = notProcessed.filter((_, idx) => verified[idx]);
			//console.log(doProcessing.length);

			if (doProcessing.length == 0) {

				return;
			}

			retrieveCheckmark().then((checkHtml) => {

				//checkHtml = checkHtml.trim();

				for (const element of doProcessing) {

					console.log(element);
					const targetElement = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(THREAD_REPLY_POST_CHECK_SELECTOR);
					console.log(targetElement);
					let div = document.createElement('span');
					div.style.display = "flex";
					div.innerHTML = checkHtml;
					let svg = div.querySelector('svg');
					if (svg) {

						svg.style.color = "#2DB32D";//"#800080";
					}
					targetElement.appendChild(div);
					console.log(element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id);
				}
			});
		});
	});
	feedObserver.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.sendMessage({ text: "tab_id?" }, tabObj => {
	//console.log('My tabId is', tabId);
	chrome.storage.local.get("closeme", function(result) {

		console.log("resp received");
		//console.log(tabObj.tab);
		//console.log(result.closeme);
		if (tabObj.tab == result.closeme) {

			waitForElement(CHECK_SELECTOR).then(setCheckmark);
		}
		else {

			waitForElement(USER_SELECTOR).then(verifyUserPage);
			registerFeedObserver();
			registerThreadReplyPostObserver();
		}
	});
});
