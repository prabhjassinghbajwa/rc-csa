/**
 * Interfaces for CustomerCard component
 */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  role: string;
  accountCreated: string;
  lastModified: string;
  emailVerified: string;
  onboardingStatus: string;
  marketingConsent?: string;
}

export interface OrderInfo {
  id: string;
  orderNumber: string;
  totalPrice: string;
  orderState: string;
  date: string;
  itemCount: number;
  currency?: string;
}

export interface CustomerCardProps {
  customer: CustomerInfo;
  orders: OrderInfo[];
  onViewOrder?: (orderId: string) => void;
}
