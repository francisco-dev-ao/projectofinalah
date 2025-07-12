
// Re-export types from order.ts
export type { 
  OrderStatus, 
  PaymentMethod, 
  PaymentStatus,
  OrderItem,
  OrderData,
  PaymentData,
  Order,
  OrdersResult,
  OrderResult
} from "@/types/order";

// Re-export formatter functions
export { 
  formatOrderStatus,
  formatInvoiceStatus,
  formatPaymentStatus
} from "@/utils/formatters";

// Re-export order retrieval functions
export {
  getAllOrders,
  getUserOrders,
  getOrder,
  getOrderDetails,
  getOrderById
} from "@/services/orderRetrievalService";

// Re-export order management functions
export {
  createOrder,
  updateOrderStatus,
  registerPayment
} from "@/services/orderManagementService";

// Define enum for matching the database
export enum OrderStatusEnum {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  CANCELED = "canceled",
  PAID = "paid"
}

// Define enum for payment status matching the database
export enum PaymentStatusEnum {
  AWAITING = "awaiting",
  CONFIRMED = "confirmed",
  FAILED = "failed"
}

// Payment method types - reduced to only available methods
export type PaymentMethodType = "multicaixa" | "bank_transfer";
export type CheckoutPaymentMethodType = PaymentMethodType;
