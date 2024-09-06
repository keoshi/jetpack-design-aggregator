chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({url: cs.matches})) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      chrome.scripting.executeScript({
        files: ["content.js"],
        target: {tabId: tab.id, allFrames: cs.all_frames},
        injectImmediately: cs.run_at === 'document_start',
      });
    }
  }
});

chrome.action.onClicked.addListener((tab) => {
	console.log("Extension icon clicked, tab URL:", tab.url);

	// Send a message to the content script
	chrome.tabs.sendMessage(tab.id, {action: "aggregate"}, function(response) {
		if (chrome.runtime.lastError) {
			console.error("Error sending message:", chrome.runtime.lastError.message);
		} else {
			console.log("Response from content script:", response);
		}
	});
});

// Check Active Tab
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	if (tabs.length > 0) {
		console.log("Active tab URL:", tabs[0].url);
	} else {
		console.error("No active tab found.");
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "aggregateAndCopy") {
		console.log("Background: Received aggregateAndCopy message");
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			console.log("Background: Sending aggregate message to content script");
			chrome.tabs.sendMessage(tabs[0].id, {action: "aggregate"});
		});
	}
});
