# Contributors

**💜💜💜Thank you to all who have helped with the development of this extension.💜💜💜**

<div id="donor-list">
</div>

<script>
	const url = 'https://chromestone.github.io/OriginalBirds/supporters.json';

	// Fetch the JSON data from the URL
	fetch(url).then(response => response.json()).then(data => {
		// Extract the list of donors from the JSON data
		const donors = data.contributors;

		// Get the container element to display the list
		const container = document.getElementById('donor-list');

		// Loop through the list of donors and create a list item for each one
		donors.forEach(donor => {
			const listItem = document.createElement('li');
			listItem.textContent = donor.handle;
			container.appendChild(listItem);
		});
	})
	.catch(error => console.error(error));
</script>
