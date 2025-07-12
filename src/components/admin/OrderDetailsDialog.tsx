
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { OrderStatus } from "@/types/order";
import DirectPaymentDialog from "./DirectPaymentDialog";
import PaymentDialog from "./PaymentDialog";
import InvoiceDialog from "./InvoiceDialog";

// Import new components
import OrderStatusBadge from "./order-details/OrderStatusBadge";
import ClientInfoSection from "./order-details/ClientInfoSection";
import OrderItemsSection from "./order-details/OrderItemsSection";
import PaymentInfoSection from "./order-details/PaymentInfoSection";
import InvoicesSection from "./order-details/InvoicesSection";
import OrderActionsSection from "./order-details/OrderActionsSection";
import OrderNotesSection from "./order-details/OrderNotesSection";
import { formatDate } from "./order-details/OrderDetailsUtils";

type OrderDetailsDialogProps = {
  order: any;
  open: boolean;
  onClose: () => void;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onOrdersChange?: () => Promise<void>;
};

const OrderDetailsDialog = ({ 
  order, 
  open, 
  onClose, 
  onStatusUpdate, 
  onOrdersChange 
}: OrderDetailsDialogProps) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDirectPaymentDialog, setShowDirectPaymentDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false);
    if (onOrdersChange) {
      onOrdersChange();
    }
  };

  const handleCloseDirectPaymentDialog = () => {
    setShowDirectPaymentDialog(false);
    if (onOrdersChange) {
      onOrdersChange();
    }
  };

  const handleCloseInvoiceDialog = () => {
    setShowInvoiceDialog(false);
    if (onOrdersChange) {
      onOrdersChange();
    }
  };

  const handleInvoiceSubmit = (data: any) => {
    console.log("Invoice created:", data);
    if (onOrdersChange) {
      onOrdersChange();
    }
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{order.id.substring(0, 8)}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Order Status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="text-sm text-muted-foreground">
                Data: {formatDate(order.created_at)}
              </div>
            </div>
            
            <Separator />
            
            {/* Client Info */}
            <ClientInfoSection profiles={order.profiles} />
            
            <Separator />
            
            {/* Order Items */}
            <OrderItemsSection 
              orderItems={order.order_items} 
              totalAmount={order.total_amount} 
            />
            
            <Separator />
            
            {/* Payment Info */}
            <PaymentInfoSection 
              payments={order.payments}
              orderStatus={order.status}
              orderId={order.id}
              onShowPaymentDialog={() => setShowPaymentDialog(true)}
              onShowDirectPaymentDialog={() => setShowDirectPaymentDialog(true)}
              formatDate={formatDate}
            />
            
            <Separator />
            
            {/* Invoices */}
            <InvoicesSection 
              invoices={order.invoices}
              order={order}
              formatDate={formatDate}
              onOrdersChange={onOrdersChange}
            />
            
            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <OrderNotesSection notes={order.notes} />
              </>
            )}

            {/* Order Actions */}
            {onStatusUpdate && (
              <>
                <Separator />
                <OrderActionsSection 
                  orderStatus={order.status}
                  orderId={order.id}
                  onStatusUpdate={onStatusUpdate}
                  onCreateInvoice={() => setShowInvoiceDialog(true)}
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      {showPaymentDialog && (
        <PaymentDialog
          open={showPaymentDialog}
          onClose={handleClosePaymentDialog}
          order={order}
          onOrdersChange={onOrdersChange}
        />
      )}
      
      {/* Direct Payment Dialog */}
      {showDirectPaymentDialog && (
        <DirectPaymentDialog
          open={showDirectPaymentDialog}
          onClose={handleCloseDirectPaymentDialog}
          order={order}
          onOrdersChange={onOrdersChange}
        />
      )}
      
      {/* Invoice Dialog */}
      {showInvoiceDialog && (
        <InvoiceDialog
          open={showInvoiceDialog}
          onClose={handleCloseInvoiceDialog}
          order={order}
          onSubmit={handleInvoiceSubmit}
        />
      )}
    </>
  );
};

export default OrderDetailsDialog;
