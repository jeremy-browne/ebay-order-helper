// content.js

// Flag to check if the event listeners have been added
let listenersAdded = false;

// // Function to open orders in new tabs
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



// Function to select all orders and initiate the download
// function selectAllAndDownload() {
//     const selectAllCheckbox = document.querySelector('input[data-testid="all-orders-checkbox"]');
//     if (selectAllCheckbox && !selectAllCheckbox.checked) {
//         selectAllCheckbox.click();
//     }

//     setTimeout(() => {
//         const downloadButton = document.querySelector('.bulk-action-download-area .downloadReport button.fake-link');
//         if (downloadButton) {
//             downloadButton.click();
//         }
//     }, 500);
// }

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


function getTotalSellingCosts() {
    let transactionFee = 0;
    let adFee = 0;

    // Get the transaction fees
    const transactionFeeElement = document.querySelector('div.earnings div.data-items div:nth-child(2) > div:nth-child(2) > dd > div > span');
    if (transactionFeeElement) {
        transactionFee = parseFloat(transactionFeeElement.textContent.replace(/[^0-9.-]+/g, ""));
    }

    // Get the ad fees, if present
    const adFeeElement = document.querySelector('div.earnings div.data-items div:nth-child(2) > div:nth-child(3) > dd > div > span');
    if (adFeeElement) {
        adFee = parseFloat(adFeeElement.textContent.replace(/[^0-9.-]+/g, ""));
    }

    return [transactionFee, adFee];
}

// Function to grab order information
function getOrderInfo() {
    // Selector strings
    const orderNumberSelector = 'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.side > div:nth-child(1) > div > dl > div:nth-child(1) > dd';
    const datePaidSelector = 'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.side > div:nth-child(1) > div > dl > div:nth-child(4) > dd';
    const salePriceSelector = 'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.side > div:nth-child(2) > div > dl > div.buyer-paid > div.total > dd > div > span';
    const shippingPolicySelector = 'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.content > div:nth-child(7) > div > div > div.details > div:nth-child(2) > div.ship-itm > div > dd';

    // Grabbing the data
    const orderNumber = document.querySelector(orderNumberSelector)?.textContent.trim();
    const datePaid = document.querySelector(datePaidSelector)?.textContent.trim();
    const salePriceElement = document.querySelector(salePriceSelector);
    let salePrice = salePriceElement ? parseFloat(salePriceElement.textContent.replace(/[^0-9.-]+/g, "")) : 0;
    const [transactionFee, adFee] = getTotalSellingCosts();

    // Initialize shipping cost
    let shippingCost = 0;

    // Determine if the item uses the letter shipping policy
    const shippingPolicyElement = document.querySelector(shippingPolicySelector);
    if (shippingPolicyElement) {
        const shippingPolicyText = shippingPolicyElement.textContent.trim();
        console.log('Shipping Policy:', shippingPolicyText);

        // Check if the shipping policy matches "Australia Post Domestic Regular Letter Untracked"
        if (shippingPolicyText === 'Australia Post Domestic Regular Letter Untracked') {
            // Set the shipping cost (as a negative value)
            shippingCost = -3.00; // Adjust the value as needed
        }
    } else {
        console.warn('Shipping policy element not found.');
    }

    // Combine all the data
    // Use tab separators and format numbers to two decimal places
    let orderData = `${orderNumber}\t${datePaid}\t$${salePrice.toFixed(2)}\t$${transactionFee.toFixed(2)}\t$${adFee.toFixed(2)}\t\t`;

    // Append the shipping cost if applicable
    if (shippingCost !== 0) {
        orderData += `-$${Math.abs(shippingCost).toFixed(2)}`;
    }

    // Use the Clipboard API to copy text
    navigator.clipboard.writeText(orderData).then(() => {
        console.log('Order information copied to clipboard.');
        console.log(orderData);
        showToast('Order information copied to clipboard.');
    }).catch(err => {
        console.error('Failed to copy order information:', err);
        showToast('Failed to copy order information.');
    });
}


function getItemNumber() {
    const itemNumberSelector = '#itemInfo > div > div > div > div > div.lineItemCardInfo__content > div.details > div.lineItemCardInfo__itemId.spaceTop > span:nth-child(2)'
    const itemNumber = document.querySelector(itemNumberSelector)?.textContent.trim();
    navigator.clipboard.writeText(itemNumber).then(() => {
        console.log('Copied item number');
    }).catch(err => {
        console.error('Failed to copy item number', err);
    })
}

// Function to create a copy button on the page
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

function isOrderDetailsPage() {
    console.log("Order page");
    // Check if the current URL matches the order details pattern
    const urlPattern = /^https:\/\/www\.ebay\.com\.au\/mesh\/ord\/details/;
    return urlPattern.test(window.location.href);
}

// function isDraftListingPage() {
//     console.log("Checking if draft listing page");
//     // Regular expression to match the draft listing page on various eBay domains
//     const urlPattern = /^https:\/\/www\.ebay\.[a-z\.]+\/lstng/;
//     return urlPattern.test(window.location.href);
// }

// Add message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'openOrders':
            openOrdersInTabs();
            break;
        //   case 'selectAllAndDownload':
        //     selectAllAndDownload();
        //     break;
        case 'getOrderInfo':
            getOrderInfo();
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
