
import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { useOrderEmail } from "@/hooks/useOrderEmail";

// Define BankDetails interface for proper typing
interface BankDetails {
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  iban?: string;
  swift_code?: string;
}

// Add proper typing for CompanySettings
interface CompanySettings {
  bank_transfer_instructions?: string;
  payment_instructions?: string;
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  company_nif?: string;
  company_website?: string;
}

const OrderSuccessPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const success = queryParams.get("success") === "true";
  const paymentMethod = queryParams.get("method") || "";
  const invoiceId = queryParams.get("invoice") || "";

  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  
  const { sendOrderEmail } = useOrderEmail();

  // Fetch order details from Supabase
  const fetchOrderDetails = async () => {
    if (!orderId) {
      console.error("Order ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to fetch order details.");
        return;
      }

      setOrderDetails(data);
      
      // Send automatic order confirmation email (only once)
      if (data && success !== false && !emailSent) {
        try {
          await sendOrderEmail(orderId);
          setEmailSent(true);
          console.log('Order confirmation email sent automatically for order:', orderId);
        } catch (emailError) {
          console.error('Error sending automatic order email:', emailError);
          // Don't block the order success flow if email fails
        }
      }
      
      // Handle invoice number - we need to fetch from invoices if available
      const { data: invoiceData } = await supabase
        .from("invoices")
        .select("invoice_number")
        .eq("order_id", orderId)
        .maybeSingle();
        
      if (invoiceData && invoiceData.invoice_number) {
        setInvoiceNumber(invoiceData.invoice_number);
      }
      
      // Generate a reference based on order ID if needed
      setReferenceNumber(`REF-${orderId.substring(0, 8)}`);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch bank details from company settings
  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching bank details:", error);
        return;
      }
      
      if (data) {
        // Parse bank_transfer_instructions or use bank_details if available
        if (data.bank_transfer_instructions) {
          setBankDetails({
            bank_name: "Bank Transfer",
            account_name: "Company Account",
            account_number: data.bank_transfer_instructions,
            iban: "",
            swift_code: ""
          });
        } else {
          // Fallback
          setBankDetails({
            bank_name: "Bank Transfer",
            account_name: "Company Account",
            account_number: "Contact support for details",
            iban: "",
            swift_code: ""
          });
        }
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchBankDetails();
  }, [orderId]);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    toast.success("Reference number copied to clipboard!");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="container py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {success !== false ? "Order Placed Successfully!" : "Order Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading order details...</p>
          ) : (
            <>
              {success !== false ? (
                <>
                  <p className="text-lg">
                    Thank you for your order! Here are the details:
                  </p>
                  <div className="mt-4 space-y-2">
                    <p>
                      <strong>Order ID:</strong> {orderId}
                    </p>
                    <p>
                      <strong>Invoice Number:</strong> {invoiceNumber || "Processing"}
                    </p>
                    {paymentMethod === "multicaixa" && (
                      <div className="relative">
                        <p>
                          <strong>Reference Number:</strong> {referenceNumber}
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-1/2 right-0 -translate-y-1/2"
                          onClick={handleCopyReference}
                          disabled={copied}
                        >
                          {copied ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    {paymentMethod === "bank_transfer" && bankDetails && (
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          Bank Transfer Details:
                        </h3>
                        <p>
                          <strong>Bank Name:</strong>{" "}
                          {bankDetails?.bank_name || "N/A"}
                        </p>
                        <p>
                          <strong>Account Name:</strong>{" "}
                          {bankDetails?.account_name || "N/A"}
                        </p>
                        <p>
                          <strong>Account Number:</strong>{" "}
                          {bankDetails?.account_number || "N/A"}
                        </p>
                        <p>
                          <strong>IBAN:</strong> {bankDetails?.iban || "N/A"}
                        </p>
                        {bankDetails?.swift_code && (
                          <p>
                            <strong>Swift Code:</strong>{" "}
                            {bankDetails.swift_code}
                          </p>
                        )}
                      </div>
                    )}
                    {orderDetails && (
                      <p>
                        <strong>Total Amount:</strong>{" "}
                        {formatPrice(orderDetails.total_amount)}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-lg text-red-500">
                  Your order could not be processed. Please try again or contact
                  support.
                </p>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild>
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          {success !== false && invoiceId && (
            <Button asChild variant="secondary">
              <Link to={`/customer/invoices/${invoiceId}`} className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderSuccessPage;
