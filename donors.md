# Donors

**❤️❤️❤️Thank you to all who have donated to keep this extension alive. We appreciate your generosity!❤️❤️❤️**

<ul id="donor-list">
</ul>

<script>
	const url = 'https://chromestone.github.io/OriginalBirds/supporters.json';

	// Fetch the JSON data from the URL
	fetch(url).then(response => response.json()).then(data => {

		if (typeof data.supporters === 'undefined') {

			console.error("Supporters undefined!");
			return;
		}

		// Get the container element to display the list
		const container = document.getElementById('donor-list');

		// Extract the list of supporters from the JSON data
		const supporters = data.supporters;
		// Loop through the list of supporters and create a list item for each one
		for (const handle of Object.keys(supporters)) {

			// filter for donors
			if (supporters[handle].type != "donor") {

				continue;
			}

			const listItem = document.createElement('li');
			const linkElement = document.createElement('a');
			linkElement.href = "https://twitter.com/" + handle;
			linkElement.textContent = "@" + handle;
			listItem.appendChild(linkElement);
			container.appendChild(listItem);
		}
	})
	.catch(error => console.error(error));
</script>
