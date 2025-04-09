import { Message, MessageAction, ShippingPolicy } from '../shared/types';

// Message sender type
interface MessageSender {
  tab?: chrome.tabs.Tab;
  frameId?: number;
  id?: string;
  url?: string;
  tlsChannelId?: string;
}

// Message response type
type SendResponse = (response?: unknown) => void;

// Handle open orders
async function handleOpenOrders(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { action: MessageAction.OPEN_ORDERS });
  }
}

// Handle get order info
async function handleGetOrderInfo(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { action: MessageAction.GET_ORDER_INFO });
  }
}

// Handle fetch shipping policies
async function handleFetchShippingPolicies(sendResponse: SendResponse): Promise<void> {
  try {
    console.log('Fetching shipping policies from storage');
    const result = await chrome.storage.sync.get(['shippingPolicies']);
    console.log('Fetched policies:', result.shippingPolicies);
    sendResponse({ shippingPolicies: result.shippingPolicies || [] });
  } catch (error) {
    console.error('Error fetching shipping policies:', error);
    sendResponse({ error: 'Failed to fetch shipping policies' });
  }
}

// Handle save shipping policies
async function handleSaveShippingPolicies(policies: ShippingPolicy[], sendResponse: SendResponse): Promise<void> {
  try {
    console.log('Saving shipping policies:', policies);
    await chrome.storage.sync.set({ shippingPolicies: policies });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving shipping policies:', error);
    sendResponse({ error: 'Failed to save shipping policies' });
  }
}

// Main message listener
chrome.runtime.onMessage.addListener((request: Message, sender: MessageSender, sendResponse: SendResponse) => {
  console.log('Background received message:', request);

  try {
    switch (request.action) {
      case MessageAction.OPEN_ORDERS:
        handleOpenOrders();
        break;

      case MessageAction.GET_ORDER_INFO:
        handleGetOrderInfo();
        break;

      case MessageAction.FETCH_SHIPPING_POLICIES:
        handleFetchShippingPolicies(sendResponse);
        return true; // Keep the channel open for async response

      case MessageAction.SAVE_SHIPPING_POLICIES:
        if (request.data) {
          handleSaveShippingPolicies(request.data as ShippingPolicy[], sendResponse);
          return true; // Keep the channel open for async response
        }
        break;

      default:
        console.warn('Unknown message action:', request.action);
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error in background script:', error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
}); 