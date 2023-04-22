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

/*
function retrieveCheckmark() {

	return new Promise((resolve) => {

		// create a new iFrame element
		var iframe = document.createElement('iframe');

		// hide the iFrame by setting its display property to 'none'
		iframe.style.display = 'none';

		// set the iFrame's source to the URL of the page with the dynamically loaded data
		iframe.src = 'https://twitter.com/elonmusk';

		// append the iFrame to the current page's document body
		document.body.appendChild(iframe);

		// wait for the iFrame to load
		iframe.onload = function() {

			// access the content document of the iFrame
			var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

			// query for an element using a CSS selector
			var elem = iframeDoc.querySelector("#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span > span.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-1pos5eu.r-qvutc0 > span > span > div:nth-child(1)");

			// do something with the element
			if (elem) {

				resolve(elem.outerHTML);
			}
			else {

				resolve(null);
			}
		};
	});
}
*/

async function verifyUserPage(targetElement) {

	const url = new URL(window.location);
	const handle = location.pathname.split('/')[1];
	console.log(targetElement.firstChild.textContent);

	const verified = await verifyHandles([handle]);
	console.log(verified);
	if (verified[0]) {

		console.log("verified!");
		const result = await retrieveCheckmark();
		console.log(result);

		//const test = await retrieveCheckmark();
		/*
		const check_html = await retrieveCheckmark();
		console.log(check_html);
		if (check_html) {

			var div = document.createElement('div');
			div.innerHTML = check_html.trim();
		}*/
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

// chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
//     var myTabId = tabs[0].id;
//     chrome.tabs.sendMessage(myTabId, {text: "hi"}, function(response) {
//         alert(response);
//     });
// });
