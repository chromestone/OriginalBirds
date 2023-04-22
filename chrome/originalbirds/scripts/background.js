var handlesSet;
async function loadHandles() {

	const response = await fetch("../data/verified_handles.txt");
	const data = await response.text();
	const handles = data.split('\n');

	handlesSet = new Set(handles);
	console.log(handlesSet.size);
}

loadHandles();
