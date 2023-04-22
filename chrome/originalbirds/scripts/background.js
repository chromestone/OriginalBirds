// Open a new IndexedDB database with a name and a version
const dbName = 'originalBirds';
const dbVersion = 1;
const request = indexedDB.open(dbName, dbVersion);

// Create a new object store for the usernames
request.onupgradeneeded = function(event) {
	console.log('started');
	const db = event.target.result;
	const objectStore = db.createObjectStore('handles', { keyPath: 'id', autoIncrement: true });
	objectStore.createIndex('handles', 'handles', { unique: true });
	console.log('finished');
};

// Log errors if any
request.onerror = function(event) {
	console.error('IndexedDB error:', event.target.error);
};

/*
// If the database is opened successfully, add the usernames to the object store
request.onsuccess = function(event) {
  var db = event.target.result;
  var transaction = db.transaction("handles", "readwrite");
  var objectStore = transaction.objectStore("handles");

  // Read the usernames from the file
  fetch('../data/verified_handles.txt')
    .then(response => response.text())
    .then(data => {
      // Split the usernames into an array and create an array of add promises
      var usernames = data.split('\n');
      var addPromises = [];
      for (var i = 0; i < usernames.length; i++) {
        addPromises.push(objectStore.add({username: usernames[i]}));
      }

      // Wait for all the add promises to complete before closing the transaction and the database
      Promise.all(addPromises)
        .then(() => {
          transaction.oncomplete = function() {
            db.close();
          };
        });
    });
};*/

/*
request.onsuccess = function(event) {
  var db = event.target.result;
  var transaction = db.transaction("handles", "readwrite");
  var objectStore = transaction.objectStore("handles");

  // Read the usernames from the file
  fetch('../data/verified_handles.txt')
    .then(response => response.text())
    .then(data => {
      // Split the usernames into an array and add them to the object store
      var usernames = data.split('\n');
      for (var i = 0; i < usernames.length; i++) {
        objectStore.add({username: usernames[i]});
      }

      // Close the transaction and the database
      transaction.oncomplete = function() {
        db.close();
      };
    });
};
*/
/*
// If the database is opened successfully, add the usernames to the object store
request.onsuccess = function(event) {
	var db = event.target.result;
	var transaction = db.transaction("handles", "readwrite");
	var objectStore = transaction.objectStore("handles");

	// Read the usernames from the file
	fetch('../data/verified_handles.txt')
	.then(response => response.text())
	.then(data => {
		// Split the usernames into an array and add them to the object store
		var usernames = data.split('\n');
		for (var i = 0; i < usernames.length; i++) {
			objectStore.add({username: usernames[i]});
		}
	});

	// Close the transaction and the database
	transaction.oncomplete = function() {
		db.close();
	};
};*/


// Add the usernames to the database
request.onsuccess = async function(event) {
	const response = await fetch('../data/verified_handles.txt');
	const data = await response.text();

	const db = event.target.result;
	const transaction = db.transaction('handles', 'readwrite');
	const objectStore = transaction.objectStore('handles');

	//console.log('hello world');
	// fetch(chrome.runtime.getURL('data/verified_handles.txt'))
	//   .then(response => response.text())
	//   .then(data => {
	//     const usernames = data.split('\n');
	//     usernames.forEach(function(username) {
	//       objectStore.add({ username: username.trim() });
	//     });
	//   });

	// Log errors if any
	transaction.onerror = function(event) {
		console.error('IndexedDB error:', event.target.error);
	};

	const usernames = data.split('\n');
	usernames.forEach(function(username) {
	objectStore.add({ username: username.trim() })});
};
