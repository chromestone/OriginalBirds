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

waitForElement('#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span').then((targetElement) => {
	// Do something with targetElement
	console.log(targetElement);
	const url = new URL(window.location);
	console.log(window.location.pathname.split('/')[1]);
	console.log(targetElement.firstChild.textContent);

	const dbName = 'originalBirds';
	const request = indexedDB.open(dbName);

	request.onsuccess = function(event) {
	const db = event.target.result;
	const transaction = db.transaction('handles', 'readonly');
	const objectStore = transaction.objectStore('handles');

	// Log errors if any
	transaction.onerror = function(event) {
	console.error('IndexedDB error:', event.target.error);
	};

	const username = window.location.pathname.split('/')[1];
	const index = objectStore.index('handles');
	const getRequest = index.get(username);
	getRequest.onsuccess = function(event) {
		const record = event.target.result;
		if (record) {
		  console.log('User found:', record);
		} else {
		  console.log('User not found');
		}
		};
	};
});

/*
// Create a MutationObserver instance
const observer = new MutationObserver((mutationsList, observer) => {
	// Iterate over the list of mutations
	for (const mutation of mutationsList) {
		// Check if any of the added nodes match the target element
		if (mutation.addedNodes) {
			for (const node of mutation.addedNodes) {
				if (node.matches && node.matches('#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span')) {
					// Do something when the target element is loaded
					console.log('Target element loaded!');

					const url = new URL(window.location);
					console.log(location.pathname.split('/')[1]);
					console.log(node.firstChild.textContent);

					// Disconnect the observer to stop observing
					observer.disconnect();
				}
			}
		}
	}
});

// Start observing the document for mutations
observer.observe(document.documentElement, {
	childList: true,
	subtree: true,
	attributes: true
});
*/
// console.log(document.querySelector("#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span"));


// Add an event listener for the window.onload event
// window.onload = () => {
//   // Run your extension code here
//   console.log('Page has fully loaded!');
//   console.log(document.querySelector("#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span"));
// };


// const nametag = document.querySelector("#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div > div > div > div.css-1dbjc4n.r-kemksi.r-1kqtdi0.r-1ljd8xs.r-13l2t4g.r-1phboty.r-16y2uox.r-1jgb5lz.r-11wrixw.r-61z16t.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div:nth-child(3) > div > div > div > div > div.css-1dbjc4n.r-6gpygo.r-14gqq1x > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs.r-1ny4l3l > div > div > span");

// console.log(nametag);
// if (nametag) {

// 	const url = new URL(window.location);
// 	console.log(location.pathname.split('/')[1]);
// 	console.log(nametag.firstChild.textContent);
// }
