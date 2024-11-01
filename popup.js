// popup.js
document.getElementById("openOrders").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "openOrders" });
});

document.getElementById("downloadCSV").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "selectAllAndDownload" });
});