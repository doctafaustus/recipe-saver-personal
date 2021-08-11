// This script runs in the visited page that's open in Chrome
if (window.location.hostname === 'recipe-saver-3.herokuapp.com' || 
		window.location.hostname === 'www.recipesaver.net' ||
		window.location.hostname === 'www.recipesaver.me' ||
    window.location.hostname === 'recipe-saver-personal.herokuapp.com' ||
		window.location.hostname === 'localhost') {
	
		// Get rs_id from hidden input on List component
		(function pollForId() {
			const hiddenInput = document.querySelector('#rs-id');
			if (hiddenInput) {
				saveId(hiddenInput.value);
			} else {
				setTimeout(pollForId, 250);
			}
		})();

		// Listen for custom event when user signs out and in to another account
		// This is necessary since a full page refesh would not occur
		document.addEventListener('signin', e => {
			saveId(e.detail);
		});

		function saveId(rs_id) {
			chrome.storage.sync.set({ 'rs_id': rs_id }, () => {
				// console.log('rs_id saved', rs_id);
			});
		}
}


// Receive message from extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	// Extract recipe
	if (request.rsAction === 'extract') {
		(async () => {
			const src = chrome.extension.getURL('./scraper/integrations.js');
			const scrape = await import(src);
			// This returns a module - the default property is the actual function
			const recipe = scrape.default();
			recipe.scraped = true;
			sendResponse(recipe);
		})();
	}

	// We need to return true to get around this error: "The message port closed before a response was received."
	return true; 
});
