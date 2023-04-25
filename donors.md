# Donors

**❤️❤️❤️Thank you to all who have donated to keep this extension alive.❤️❤️❤️**

<div id="donor-list">
</div>

<script>
const url = 'https://chromestone.github.io/OriginalBirds/supporters.json';
const container = document.getElementById('donor-list');

fetch(url).then(response => response.json()).then(data => {

		const donors = data.donors;

		const listItemContainer = document.createElement('div'); // create a container for the list items
		listItemContainer.style.display = 'flex'; // set the display property to flex to allow wrapping

		donors.forEach(donor => {
			const listItem = document.createElement('div'); // create a div for each donor
			listItem.textContent = donor;
			listItem.style.padding = '10px'; // add some padding for spacing

			listItemContainer.appendChild(listItem); // append the div to the container
		});

	container.appendChild(listItemContainer); // append the container to the main container
})
.catch(error => console.error(error));
</script>
