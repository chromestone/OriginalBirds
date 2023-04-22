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

	console.log(targetElement);
	chrome.storage.local.set({checkmark : targetElement.outerHTML});
	window.close();
}

function verifyHandles(handles) {

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

	const verified = await verifyHandles([handle]);
	console.log(verified);
	if (verified[0]) {

		console.log("verified!");

		const check_html = await retrieveCheckmark();
		console.log(check_html);
		if (check_html) {

			var div = document.createElement('span');
			div.innerHTML = check_html.trim();
			var svg = div.querySelector('svg');
			if (svg) {

				svg.style.color = "#800080";
			}
			targetElement.appendChild(div);
		}
	}
}

chrome.runtime.sendMessage({ text: "tab_id?" }, tabObj => {
	//console.log('My tabId is', tabId);
	chrome.storage.local.get("closeme", function(result) {

		console.log(tabObj.tab);
		console.log(result.closeme);
		if (tabObj.tab == result.closeme) {

			waitForElement('#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span > span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-1pos5eu.r-qvutc0 > span > span > div:nth-child(1)').then(setCheckmark);
		}
		else {

			waitForElement('#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span').then(verifyUserPage);
		}
	});
});
