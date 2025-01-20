// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'openOrders') {
    // Forward to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'openOrders' });
      }
    });
  }

  else if (request.action === 'getOrderInfo') {
    // Forward request to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getOrderInfo' });
      }
    });
  }

  // The key part: handle fetch requests for shipping policies
  else if (request.action === 'fetchShippingPolicies') {
    chrome.storage.sync.get(['shippingPolicies'], (result) => {
      sendResponse({ shippingPolicies: result.shippingPolicies || [] });
    });
    // Return true to keep the channel open for async sendResponse
    return true;
  }

  // Could add more if needed (like saving policies from content, etc.)

  else {
    console.log('Unknown request.action:', request.action);
  }
});
