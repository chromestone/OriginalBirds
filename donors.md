# Donors

**❤️❤️❤️Thank you to all who have donated to keep this extension alive. We appreciate your generosity!❤️❤️❤️**

<ul id="donor-list">
</ul>

<script>
	const url = 'https://chromestone.github.io/OriginalBirds/supporters.json';

	// Fetch the JSON data from the URL
	fetch(url).then(response => response.json()).then(data => {
		// Extract the list of donors from the JSON data
		const donors = data.donors;

		// Get the container element to display the list
		const container = document.getElementById('donor-list');

		// Loop through the list of donors and create a list item for each one
		donors.forEach(donor => {
			const listItem = document.createElement('li');
			const linkElement = document.createElement('a');
			linkElement.href = "https://twitter.com/" + donor.handle;
			linkElement.textContent = "@" + donor.handle;
			listItem.appendChild(linkElement);
			container.appendChild(listItem);
		});
	})
	.catch(error => console.error(error));
</script>
