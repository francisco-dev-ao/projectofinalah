
import { v4 as uuidv4 } from 'uuid';

// Function to generate a unique invoice number
export const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString(36); // Convert current timestamp to base36
  const randomId = uuidv4().substring(0, 8).replace(/-/g, ''); // Get first 8 characters of UUID and remove hyphens
  return `INV-${timestamp}-${randomId}`.toUpperCase();
};

// Function to generate a public token for invoice sharing
export const generatePublicToken = () => {
  return uuidv4();
};

// Extract items from order - Fixed to prevent excessive type instantiation
export const extractItemsFromOrder = (order: any) => {
  let items: any[] = [];
  
  try {
    // Handle order_items if available
    if (order.order_items && Array.isArray(order.order_items)) {
      items = order.order_items;
    } 
    // Handle cart_items if order_items doesn't exist
    else if (order.cart_items) {
      // Parse cart_items if it's a JSON string
      const cartItems = typeof order.cart_items === 'string' 
        ? JSON.parse(order.cart_items) 
        : order.cart_items;
        
      items = Array.isArray(cartItems) ? cartItems : [];
    }
  } catch (e) {
    console.error("Error extracting items from order:", e);
    items = [];
  }
  
  return items;
};
