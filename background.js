// background.js

// Relay messages from the popup to the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Send the message to the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      }
    });
  });
  