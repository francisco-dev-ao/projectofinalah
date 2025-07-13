
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { createOrder } from '@/services/orderManagementService';
import { generateInvoice } from '@/services/invoice';
import { createServicesFromOrder } from '@/services/serviceService';
import { PaymentMethodType } from '@/components/checkout/CheckoutPaymentOptions';
import { supabase } from '@/integrations/supabase/client';
import { DomainStatus } from '@/services/domain/types';
import { useInvoiceBucket } from '@/hooks/useInvoiceBucket';

interface OrderResult {
  success: boolean;
  orderId: string | null;
  error?: string;
}

export function useCheckoutOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, total } = useCart();
  const [loading, setLoading] = useState(false);
  const { isInitialized, initializeInvoiceBucket } = useInvoiceBucket();

  const handlePlaceOrder = async (paymentMethod: PaymentMethodType): Promise<OrderResult> => {
    if (!user) {
      return { 
        success: false, 
        orderId: null, 
        error: "Você precisa estar autenticado para concluir a compra" 
      };
    }

    if (cartItems.length === 0) {
      return { 
        success: false, 
        orderId: null, 
        error: "Seu carrinho está vazio" 
      };
    }

    try {
      setLoading(true);
      
      console.log("Starting checkout with items:", cartItems);
      console.log("User placing order:", user.id);
      
      // Ensure invoice bucket is initialized
      if (!isInitialized) {
        try {
          await initializeInvoiceBucket();
        } catch (error) {
          console.error("Error initializing invoice bucket:", error);
        }
      }
      
      // Create order items from cart without problematic product IDs
      const orderItems = cartItems.map((item) => {
        const orderItem: any = {
          name: item.name,
          unit_price: item.unitPrice || item.price / item.quantity,
          quantity: item.quantity,
          duration: item.duration || null,
          duration_unit: (item.durationUnit as "day" | "month" | "year") || null
        };

        // Only add product_id for non-domain items and if it's a valid UUID
        if (item.type !== 'domain' && 
            !item.id.includes('domain') && 
            !item.name.toLowerCase().includes('domínio') &&
            item.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          orderItem.product_id = item.id;
        }
        
        return orderItem;
      });

      console.log("Creating order with items:", orderItems);

      // Create order using createOrderService
      const result = await createOrder({
        userId: user.id,
        items: orderItems,
        totalAmount: total,
        paymentMethod: paymentMethod
      });

      if (!result || !result.success) {
        return { 
          success: false, 
          orderId: null, 
          error: result?.error || "Erro ao criar pedido. Por favor, tente novamente." 
        };
      }

      console.log("Order created successfully:", result);
      
      if (!result.orderId) {
        return {
          success: false,
          orderId: null,
          error: "ID do pedido não gerado. Por favor, tente novamente."
        };
      }

      // Generate invoice and PDF automatically for bank transfer/reference payments
      try {
        const invoiceResult = await generateInvoice(result.orderId);
        if (invoiceResult?.success) {
          console.log("Invoice generated successfully:", invoiceResult.invoice);
          
          // For reference payments, reference will be printed separately
          if (paymentMethod === 'appypay_reference') {
            try {
              // PDF functionality removed - using print reference instead
              console.log('Reference payment completed, no automatic PDF generation');
              // The user can now print the reference separately using the PrintReferenceButton
            } catch (error) {
              console.error("Error in reference payment processing:", error);
            }
          }
        } else {
          console.error("Error generating invoice:", invoiceResult);
        }
      } catch (error) {
        console.error("Error generating invoice:", error);
      }

      // Create services (non-blocking)
      try {
        const servicesResult = await createServicesFromOrder(result.orderId, user.id);
        if (servicesResult?.success) {
          console.log("Services created successfully");
        }
      } catch (error) {
        console.error("Error creating services:", error);
      }
      
      // Handle domain registrations - ensure ALL domain items are processed
      const domainItems = cartItems.filter(item => 
        item.type === 'domain' || 
        item.id.includes('domain') || 
        item.name.toLowerCase().includes('domínio') ||
        item.name.toLowerCase().includes('domain')
      );
      
      console.log('Processing domain items:', domainItems);
      
      for (const domainItem of domainItems) {
        let domainName = domainItem.name;
        
        // Extract clean domain name from various formats
        domainName = domainName
          .replace('Registro de ', '')
          .replace('Domínio: ', '')
          .replace('Domain: ', '')
          .trim();
        
        console.log('Processing domain item:', domainItem, 'extracted name:', domainName);
        
        // Ensure domain has proper format (contains at least one dot)
        if (domainName && domainName.includes('.')) {
          try {
            console.log(`Registering domain: ${domainName} for user: ${user.id}`);
            
            const domainParts = domainName.split('.');
            const name = domainParts[0];
            const tld = domainParts.slice(1).join('.');
            
            const domainData = {
              user_id: user.id,
              domain_name: name,
              tld: tld,
              registration_date: new Date().toISOString(),
              expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending' as DomainStatus,
              order_id: result.orderId,
              auto_renew: true,
              is_locked: false
            };
            
            console.log("Inserting domain with data:", domainData);
            
            const { data: insertedDomain, error } = await supabase
              .from('domains')
              .insert({
                domain_name: name, // Usar apenas o nome sem TLD
                tld: tld,
                user_id: user.id,
                order_id: result.orderId,
                status: 'pending',
                auto_renew: true,
                is_locked: false,
                registration_date: new Date().toISOString(),
                expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              })
              .select()
              .single();
              
            if (error) {
              console.error(`Error registering domain ${domainName}:`, error);
              toast.error(`Erro ao registrar domínio ${domainName}: ${error.message || 'Erro desconhecido'}`);
            } else {
              console.log(`Domain registered successfully:`, insertedDomain);
              toast.success(`Domínio ${domainName} registrado com sucesso!`);
            }
          } catch (err: any) {
            console.error(`Error registering domain ${domainName}:`, err);
            toast.error(`Erro ao registrar domínio ${domainName}: ${err.message || 'Erro inesperado'}`);
          }
        } else {
          console.warn('Invalid domain name format:', domainName);
          // Even for custom domains, try to create entry if possible
          if (domainName) {
            try {
              const domainData = {
                user_id: user.id,
                domain_name: domainName,
                tld: 'custom',
                registration_date: new Date().toISOString(),
                expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending' as DomainStatus,
                order_id: result.orderId,
                auto_renew: true,
                is_locked: false
              };
              
              const { data: insertedDomain, error } = await supabase
                .from('domains')
                .insert(domainData)
                .select()
                .single();
                
              if (!error) {
                console.log(`Custom domain registered:`, insertedDomain);
                toast.success(`Domínio personalizado ${domainName} registrado!`);
              } else {
                console.error(`Error registering custom domain:`, error);
                toast.error(`Erro ao registrar domínio personalizado: ${error.message || 'Erro desconhecido'}`);
              }
            } catch (err) {
              console.error(`Error registering custom domain:`, err);
            }
          }
        }
      }
      
      return {
        success: true,
        orderId: result.orderId
      };
    } catch (error: any) {
      console.error("Error handling checkout order:", error);
      return {
        success: false,
        orderId: null,
        error: error.message || "Ocorreu um erro ao processar seu pedido. Por favor, tente novamente."
      };
    } finally {
      setLoading(false);
    }
  };

  return { loading, handlePlaceOrder };
}
