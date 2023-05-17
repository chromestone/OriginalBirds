---
title: Original Birds
---

<style>
	ul {
		list-style: none;
		padding-left: 1em;
	}

	ul > li:before {
		content: "💜";
		background-color: #1d9bf0;
		padding: 3px;
		margin-right: 0.1em;
	}
</style>

# Contributors

**💜💜💜Thank you to all who have helped with the development of this extension.💜💜💜**

<ul id="contributor-list">
</ul>

<script>
	const url = "https://original-birds.pages.dev/supporters.json";

	// Fetch the JSON data from the URL
	fetch(url).then(response => response.json()).then(data => {
		if (typeof data.supporters === 'undefined') {

			console.error("Supporters undefined!");
			return;
		}

		// Get the container element to display the list
		const container = document.getElementById("contributor-list");

		// Extract the list of supporters from the JSON data
		const supporters = data.supporters;
		// Loop through the list of supporters and create a list item for each one
		for (const handle of Object.keys(supporters)) {

			// filter for contributors
			if (supporters[handle].type !== "contributor") {

				continue;
			}

			const listItem = document.createElement("li");
			const linkElement = document.createElement("a");
			linkElement.href = "https://twitter.com/" + handle;
			linkElement.textContent = "@" + handle;
			listItem.appendChild(linkElement);
			container.appendChild(listItem);
		}
	})
	.catch(error => console.error(error));
</script>
