async function loadHandles() {

	const response = await fetch("../data/verified_handles.txt");
	const data = await response.text();
	const handles = data.split('\n');

	const handlesSet = new Set(handles);
	console.log(handlesSet.has('taylorswift13'));
	console.log(handlesSet.has('"taylorswift13"'));
	// console.log(handlesSet.size);
	// const thingy = {handlesSet: handlesSet};
	// console.log(thingy.handlesSet.size);
	chrome.storage.local.set({handles : JSON.stringify([...handlesSet])});
}

loadHandles();
