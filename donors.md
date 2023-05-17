---
title: Original Birds
---

<style>
	ul {
		list-style: none;
		padding-left: 1em;
	}

	ul[id^="gold"] > li:before {
		content: "💛";
		background-color: #1d9bf0;
		padding: 3px;
		margin-right: 0.1em;
	}

	ul[id^="silver"] > li:before {
		content: "🤍";
		background-color: #1d9bf0;
		padding: 3px;
		margin-right: 0.1em;
	}

	ul[id^="bronze"] > li:before {
		content: "🧡";
		background-color: #1d9bf0;
		padding: 3px;
		margin-right: 0.1em;
	}
</style>

# Donors

**❤️❤️❤️Thank you to all who have donated to keep this extension alive. We appreciate your generosity!❤️❤️❤️**

<ul id="gold-list" style="margin: 0;">
</ul>
<ul id="silver-list" style="margin: 0;">
</ul>
<ul id="bronze-list" style="margin: 0;">
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
		const gold = document.getElementById("gold-list");
		const silver = document.getElementById("silver-list");
		const bronze = document.getElementById("bronze-list");

		// Extract the list of supporters from the JSON data
		const supporters = data.supporters;
		// Loop through the list of supporters and create a list item for each one
		for (const handle of Object.keys(supporters)) {

			// filter for contributors
			if (supporters[handle].type !== "subscriber") {

				continue;
			}

			let the_list = null;
			const tier = donor.tier;
			if (tier === "gold") {

				the_list = gold;
			}
			else if (tier === "silver") {

				the_list = silver;
			}
			else if (tier === "bronze") {

				the_list = bronze;
			}

			if (the_list === null) {

				// something bad happened
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
