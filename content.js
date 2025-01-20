// content.js

// Flag to check if the event listeners have been added
let listenersAdded = false;

// Function to open orders in new tabs (called when the user clicks "Open All Orders")
function openOrdersInTabs() {
    const orders = document.querySelectorAll('.order-details a');
    orders.forEach(order => {
        const orderLink = order.getAttribute('href');
        window.open(orderLink, '_blank');
    });
}

// Detect orders page
function isOrdersPage() {
    console.log("Checking if orders page");
    // Regular expression to match orders page on various eBay domains
    const urlPattern = /^https:\/\/www\.ebay\.[a-z\.]+\/sh\/ord/;
    return urlPattern.test(window.location.href);
}

// Open orders (used on orders page)
function createOpenOrdersButton() {
    console.log("Creating Open Orders button");
    const openOrdersButton = document.createElement('button');
    openOrdersButton.textContent = 'Open All Orders';
    openOrdersButton.style.position = 'fixed';
    openOrdersButton.style.top = '10px';
    openOrdersButton.style.right = '10px';
    openOrdersButton.style.zIndex = '100000';
    openOrdersButton.onclick = openOrdersInTabs;

    document.body.appendChild(openOrdersButton);
}

// Toast notification utility
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '10px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '100000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

// Calculate total selling costs (transaction fee + ad fee)
function getTotalSellingCosts() {
    let transactionFee = 0;
    let adFee = 0;

    // Get the transaction fees
    const transactionFeeElement = document.querySelector(
        'div.earnings div.data-items div:nth-child(2) > div:nth-child(2) > dd > div > span'
    );
    if (transactionFeeElement) {
        transactionFee = parseFloat(transactionFeeElement.textContent.replace(/[^0-9.-]+/g, ""));
    }

    // Get the ad fees, if present
    const adFeeElement = document.querySelector(
        'div.earnings div.data-items div:nth-child(2) > div:nth-child(3) > dd > div > span'
    );
    if (adFeeElement) {
        adFee = parseFloat(adFeeElement.textContent.replace(/[^0-9.-]+/g, ""));
    }

    return [transactionFee, adFee];
}

/**
 * Ask the background script to fetch shippingPolicies from chrome.storage
 * Returns a promise that resolves to an array of { name, cost } objects
 */
function fetchShippingPolicies() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'fetchShippingPolicies' }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response.shippingPolicies || []);
            }
        });
    });
}

// Grab order information and copy it to the clipboard
async function getOrderInfo() {
    // Selector strings
    const orderNumberSelector =
        'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.side > div:nth-child(1) > div > dl > div:nth-child(1) > dd';
    const datePaidSelector =
        'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.side > div:nth-child(1) > div > dl > div:nth-child(4) > dd';
    const salePriceSelector =
        'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.side > div:nth-child(2) > div > dl > div.buyer-paid > div.total > dd > div > span';
    const shippingPolicySelector =
        'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.content > div:nth-child(7) > div > div > div.details > div:nth-child(2) > div.ship-itm > div > dd';

    // Grab the data
    const orderNumber = document.querySelector(orderNumberSelector)?.textContent.trim();
    const datePaid = document.querySelector(datePaidSelector)?.textContent.trim();
    const salePriceElement = document.querySelector(salePriceSelector);
    let salePrice = salePriceElement
        ? parseFloat(salePriceElement.textContent.replace(/[^0-9.-]+/g, ""))
        : 0;
    const [transactionFee, adFee] = getTotalSellingCosts();

    // Initialize shipping cost
    let shippingCost = 0;

    // Determine if the item uses a known shipping policy
    const shippingPolicyElement = document.querySelector(shippingPolicySelector);
    if (shippingPolicyElement) {
        const shippingPolicyText = shippingPolicyElement.textContent.trim();
        console.log('Shipping Policy:', shippingPolicyText);

        // Get user-defined shipping policies from the background script
        const userPolicies = await fetchShippingPolicies();

        // Try to find a matching policy
        const matchedPolicy = userPolicies.find(
            (policy) => policy.name === shippingPolicyText
        );
        if (matchedPolicy) {
            // Parse the cost (could be "-1.50", etc.)
            shippingCost = parseFloat(matchedPolicy.cost) || 0;
        }
    } else {
        console.warn('Shipping policy element not found.');
    }

    // Build the tab-separated orderData string
    let orderData = `${orderNumber}\t${datePaid}\t$${salePrice.toFixed(2)}\t$${transactionFee.toFixed(2)}\t$${adFee.toFixed(2)}\t\t`;

    // Append the shipping cost if applicable
    if (shippingCost !== 0) {
        // shippingCost is negative, format accordingly
        orderData += `-$${Math.abs(shippingCost).toFixed(2)}`;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(orderData).then(() => {
        console.log('Order information copied to clipboard.');
        console.log(orderData);
        showToast('Order information copied to clipboard.');
    }).catch(err => {
        console.error('Failed to copy order information:', err);
        showToast('Failed to copy order information.');
    });
}

// Copy the item number
function getItemNumber() {
    const itemNumberSelector = '#itemInfo > div > div > div > div > div.lineItemCardInfo__content > div.details > div.lineItemCardInfo__itemId.spaceTop > span:nth-child(2)';
    const itemNumber = document.querySelector(itemNumberSelector)?.textContent.trim();
    if (itemNumber) {
        navigator.clipboard.writeText(itemNumber).then(() => {
            console.log('Copied item number');
            showToast('Copied item number');
        }).catch(err => {
            console.error('Failed to copy item number', err);
            showToast('Failed to copy item number');
        });
    } else {
        console.warn('Item number not found');
    }
}

// Create the Copy Order Info and Copy Item Number buttons on the order details page
function createCopyButton() {
    console.log("Creating item number copy button");
    const itemNumberButton = document.createElement('button');
    itemNumberButton.textContent = 'Copy Item Number';
    itemNumberButton.style.position = 'fixed';
    itemNumberButton.style.top = '10px';
    itemNumberButton.style.right = '10px';
    itemNumberButton.style.zIndex = '100000';
    itemNumberButton.onclick = getItemNumber;

    console.log("Creating copy button");
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Order Info';
    copyButton.style.position = 'fixed';
    copyButton.style.top = '10px';
    copyButton.style.right = '10px';
    copyButton.style.zIndex = '100000';
    copyButton.style.marginTop = '25px';
    copyButton.onclick = getOrderInfo;

    document.body.appendChild(itemNumberButton);
    document.body.appendChild(copyButton);
}

// Check if on an order details page
function isOrderDetailsPage() {
    console.log("Checking if order details page");
    // Check if the current URL matches the order details pattern
    const urlPattern = /^https:\/\/www\.ebay\.com\.au\/mesh\/ord\/details/;
    return urlPattern.test(window.location.href);
}

// Listen for background messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'openOrders':
            openOrdersInTabs();
            break;
        case 'getOrderInfo':
            getOrderInfo();
            break;
        default:
            break;
    }
});

// If on the orders page, create the Open Orders button
if (isOrdersPage()) {
    createOpenOrdersButton();
}

// If on an order details page, create the copy buttons
if (isOrderDetailsPage()) {
    createCopyButton();
}

// Set the flag to true to avoid adding listeners again if needed
listenersAdded = true;
