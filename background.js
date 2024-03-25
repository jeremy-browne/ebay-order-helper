// Keep track of whether the content script has been injected
const injectedTabs = new Set();

// This function injects content.js into the active tab
function injectContentScript(tab) {
    // Check if we've already injected into this tab
    if (!injectedTabs.has(tab.id)) {
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                files: ["content.js"],
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                } else {
                    // Mark this tab as injected
                    injectedTabs.add(tab.id);
                }
            }
        );
    }
}

// Listen for messages from the popup and relay them to the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        injectContentScript(tabs[0]);
        // Send the message to the content script after a short delay to ensure it has been injected
        setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, request);
        }, 100);
    });
});

// When a tab is closed, remove it from the set of injected tabs
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    injectedTabs.delete(tabId);
});

// When a tab is updated, if it's navigated to a new page, remove it from the set of injected tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        injectedTabs.delete(tabId);
    }
});
