export interface Message {
  action: MessageAction;
  data?: unknown;
}

export enum MessageAction {
  OPEN_ORDERS = 'openOrders',
  GET_ORDER_INFO = 'getOrderInfo',
  FETCH_SHIPPING_POLICIES = 'FETCH_SHIPPING_POLICIES',
  SAVE_SHIPPING_POLICIES = 'saveShippingPolicies',
  REFRESH_POLICIES = 'REFRESH_POLICIES'
}

export interface ShippingPolicy {
  id: string;
  name: string;
  cost: string;
  description?: string;
  color: string;
}

export interface OrderInfo {
  orderId: string;
  buyer: string;
  items: OrderItem[];
  shippingAddress: Address;
  // Add more fields as needed
}

export interface OrderItem {
  itemId: string;
  title: string;
  quantity: number;
  price: number;
}

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface StorageResult {
  shippingPolicies?: ShippingPolicy[];
} 