import { Message, MessageAction, ShippingPolicy } from '../shared/types';

// Flag to check if the event listeners have been added
let listenersAdded = false;

// Function to open orders in new tabs (called when the user clicks "Open All Orders")
function openOrdersInTabs(): void {
  const orders = document.querySelectorAll('.order-details a');
  orders.forEach(order => {
    const orderLink = order.getAttribute('href');
    if (orderLink) {
      window.open(orderLink, '_blank');
    }
  });
}

// Detect orders page
function isOrdersPage(): boolean {
  console.log('Checking if orders page');
  // Regular expression to match orders page on various eBay domains
  const urlPattern = /^https:\/\/www\.ebay\.[a-z\.]+\/sh\/ord/;
  return urlPattern.test(window.location.href);
}

// Add styles for the overlay buttons
function addOverlayStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .ebay-helper-button {
      background-color: #0070ba;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: all 0.3s ease-in-out;
      display: flex;
      align-items: center;
      gap: 8px;
      position: fixed;
      z-index: 100000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .ebay-helper-button.hidden {
      display: none;
    }

    .ebay-helper-button:hover {
      background-color: #005ea6;
      transform: translateY(-1px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .ebay-helper-button.hidden:hover {
      transform: translateX(100%) translateY(-1px);
    }

    .ebay-helper-button .icon {
      opacity: 0.8;
      font-size: 16px;
    }

    .ebay-helper-button.top-right {
      top: 20px;
      right: 20px;
    }

    .ebay-helper-button.top-right-2 {
      top: 70px;
      right: 20px;
    }

    .ebay-helper-button.orders {
      background-color: #00a65a;
    }

    .ebay-helper-button.orders:hover {
      background-color: #008d4c;
    }
  `;
  document.head.appendChild(style);
}

// Function to create a styled button
function createOverlayButton(text: string, icon: string, className: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `ebay-helper-button ${className}`;
  
  const iconSpan = document.createElement('span');
  iconSpan.className = 'icon';
  iconSpan.textContent = icon;
  
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  
  button.appendChild(iconSpan);
  button.appendChild(textSpan);
  
  return button;
}

// Create the Open Orders button
function createOpenOrdersButton(): void {
  console.log('Creating Open Orders button');
  const button = createOverlayButton('Open All Orders', '↗', 'orders top-right');
  button.onclick = openOrdersInTabs;
  document.body.appendChild(button);
}

// Toast notification utility
function showToast(message: string): void {
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
function getTotalSellingCosts(): [number, number] {
  let transactionFee = 0;
  let adFee = 0;

  // Get the transaction fees
  const transactionFeeElement = document.querySelector(
    'div.earnings div.data-items div:nth-child(2) > div:nth-child(2) > dd > div > span'
  );
  if (transactionFeeElement) {
    transactionFee = parseFloat(transactionFeeElement.textContent?.replace(/[^0-9.-]+/g, '') || '0');
  }

  // Get the ad fees, if present
  const adFeeElement = document.querySelector(
    'div.earnings div.data-items div:nth-child(2) > div:nth-child(3) > dd > div > span'
  );
  if (adFeeElement) {
    adFee = parseFloat(adFeeElement.textContent?.replace(/[^0-9.-]+/g, '') || '0');
  }

  return [transactionFee, adFee];
}

/**
 * Ask the background script to fetch shippingPolicies from chrome.storage
 * Returns a promise that resolves to an array of { name, cost } objects
 */
function fetchShippingPolicies(): Promise<ShippingPolicy[]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: MessageAction.FETCH_SHIPPING_POLICIES }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response.shippingPolicies || []);
      }
    });
  });
}

// Grab order information and copy it to the clipboard
async function getOrderInfo(): Promise<void> {
  try {
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
    const orderNumber = document.querySelector(orderNumberSelector)?.textContent?.trim() || '';
    const datePaid = document.querySelector(datePaidSelector)?.textContent?.trim() || '';
    const salePriceElement = document.querySelector(salePriceSelector);
    const salePrice = salePriceElement
      ? parseFloat(salePriceElement.textContent?.replace(/[^0-9.-]+/g, '') || '0')
      : 0;
    const [transactionFee, adFee] = getTotalSellingCosts();

    // Initialize shipping cost
    let shippingCost = 0;

    // Determine if the item uses a known shipping policy
    const shippingPolicyElement = document.querySelector(shippingPolicySelector);
    if (shippingPolicyElement) {
      const shippingPolicyText = shippingPolicyElement.textContent?.trim() || '';
      console.log('Shipping Policy:', shippingPolicyText);

      // Get user-defined shipping policies from the background script
      const userPolicies = await fetchShippingPolicies();
      console.log('Fetched policies for order info:', userPolicies);

      // Try to find a matching policy - using includes() instead of exact match
      const matchedPolicy = userPolicies.find(
        (policy) => shippingPolicyText.includes(policy.name)
      );
      console.log('Matched policy for order info:', matchedPolicy);

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
    await navigator.clipboard.writeText(orderData);
    console.log('Order information copied to clipboard.');
    console.log(orderData);
    showToast('Order information copied to clipboard.');
  } catch (error) {
    console.error('Failed to copy order information:', error);
    showToast('Failed to copy order information.');
  }
}

// Copy the item number
function getItemNumber(): void {
  try {
    const itemNumberSelector = '#itemInfo > div > div > div > div > div.lineItemCardInfo__content > div.details > div.lineItemCardInfo__itemId.spaceTop > span:nth-child(2)';
    const itemNumber = document.querySelector(itemNumberSelector)?.textContent?.trim();
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
  } catch (error) {
    console.error('Error getting item number:', error);
    showToast('Error getting item number');
  }
}

// Create the Copy Order Info and Copy Item Number buttons
function createCopyButtons(): void {
  console.log('Creating copy buttons');
  const itemNumberButton = createOverlayButton('Copy Item Number', '📋', 'top-right');
  itemNumberButton.onclick = getItemNumber;

  const copyButton = createOverlayButton('Copy Order Info', '📋', 'top-right-2');
  copyButton.onclick = getOrderInfo;

  document.body.appendChild(itemNumberButton);
  document.body.appendChild(copyButton);
}

// Check if on an order details page
function isOrderDetailsPage(): boolean {
  console.log('Checking if order details page');
  // Check if the current URL matches the order details pattern
  const urlPattern = /^https:\/\/www\.ebay\.com\.au\/mesh\/ord\/details/;
  return urlPattern.test(window.location.href);
}

// Listen for background messages
chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
  try {
    console.log('Content script received message:', request);
    if (request.action === MessageAction.UPDATE_BUTTON_VISIBILITY) {
      console.log('Received button visibility update:', request.data.visible);
      updateButtonVisibility(request.data.visible);
    } else {
      console.warn('Unknown message action:', request.action);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// When initializing, add the styles
addOverlayStyles();

// If on the orders page, create the Open Orders button
if (isOrdersPage()) {
  createOpenOrdersButton();
}

// If on an order details page, create the copy buttons
if (isOrderDetailsPage()) {
  createCopyButtons();
}

// Set the flag to true to avoid adding listeners again if needed
listenersAdded = true;

// Function to highlight shipping policies
function highlightShippingPolicies(policies: ShippingPolicy[]) {
  console.log('Highlighting shipping policies:', policies);

  if (!isOrderDetailsPage()) {
    console.log('Not on order details page');
    return;
  }

  const shippingPolicySelector = 'body > div.sh-core-layout.vod-details > div.sh-core-layout__body > div > div.wrapper > div.content > div:nth-child(7) > div > div > div.details > div:nth-child(2) > div.ship-itm > div > dd';
  const shippingServiceElement = document.querySelector(shippingPolicySelector);

  if (shippingServiceElement) {
    const shippingText = shippingServiceElement.textContent?.trim();
    console.log('Found shipping text:', shippingText);

    if (shippingText) {
      // Changed from === to includes()
      const matchingPolicy = policies.find(policy => shippingText.includes(policy.name));
      console.log('Matching policy:', matchingPolicy);

      if (matchingPolicy) {
        console.log('Applying style with color:', matchingPolicy.color);
        const element = shippingServiceElement as HTMLElement;
        
        // Create a wrapper span for better styling control
        const wrapper = document.createElement('span');
        wrapper.textContent = shippingText;
        wrapper.style.setProperty('background-color', matchingPolicy.color, 'important');
        wrapper.style.setProperty('padding', '4px 8px', 'important');
        wrapper.style.setProperty('border-radius', '4px', 'important');
        wrapper.style.setProperty('display', 'inline-block', 'important');
        
        // Replace the text node with our styled wrapper
        element.textContent = '';
        element.appendChild(wrapper);
      }
    }
  } else {
    console.log('Shipping service element not found');
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === MessageAction.REFRESH_POLICIES) {
    console.log('Received refresh request');
    fetchShippingPolicies().then(policies => {
      highlightShippingPolicies(policies);
    });
  }
});

// Initial highlighting when script loads
if (isOrderDetailsPage()) {
  console.log('Order details page detected, fetching policies...');
  fetchShippingPolicies().then(policies => {
    console.log('Fetched policies:', policies);
    highlightShippingPolicies(policies);
  }).catch(error => {
    console.error('Error fetching policies:', error);
  });
}

// Function to update button visibility
function updateButtonVisibility(visible: boolean): void {
  console.log('Updating button visibility:', visible);
  const buttons = document.querySelectorAll<HTMLElement>('.ebay-helper-button');
  console.log('Found buttons:', buttons.length);
  buttons.forEach(button => {
    console.log('Updating button:', button);
    if (visible) {
      button.classList.remove('hidden');
      // Remove any inline transform style
      button.style.removeProperty('transform');
    } else {
      button.classList.add('hidden');
      // Remove any inline transform style
      button.style.removeProperty('transform');
    }
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.buttonVisibility) {
    console.log('Storage changed - button visibility:', changes.buttonVisibility.newValue);
    updateButtonVisibility(changes.buttonVisibility.newValue);
  }
});

// Initialize button visibility
chrome.storage.sync.get(['buttonVisibility'], function(result) {
  console.log('Initial button visibility state:', result.buttonVisibility);
  const isVisible = result.buttonVisibility === undefined ? true : result.buttonVisibility;
  updateButtonVisibility(isVisible);
}); 