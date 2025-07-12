
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import PaymentCallbackConfig from "@/components/admin/PaymentCallbackConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, ChevronsUpDown } from "lucide-react";

// Mock payment methods data
const PAYMENT_METHODS = [
  {
    id: "multicaixa",
    name: "Multicaixa Express",
    status: "active",
    description: "Pagamento instantâneo via Multicaixa Express",
  },
  {
    id: "bank_transfer",
    name: "Transferência Bancária",
    status: "active",
    description: "Transferência para conta bancária da empresa",
  }
];

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("methods");
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  // Load payments (mock data for now)
  useEffect(() => {
    const loadData = async () => {
      setLoadingPayments(true);
      // In a real implementation, this would fetch data from the backend
      setTimeout(() => {
        setPayments([
          {
            id: "pay_1",
            method: "multicaixa",
            amount: 25000,
            created_at: new Date().toISOString(),
            status: "completed",
            customer: "Cliente Exemplo",
            reference: "MCX123456789"
          },
          {
            id: "pay_2", 
            method: "bank_transfer",
            amount: 45000,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            customer: "Empresa ABC",
            reference: "TRF987654321"
          }
        ]);
        setLoadingPayments(false);
      }, 1000);
    };
    
    loadData();
  }, []);

  const toggleMethodStatus = (methodId: string, currentStatus: string) => {
    // In a real implementation, this would update the payment method status in the database
    toast.success(`Status do método de pagamento atualizado`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Pagamentos</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={activeTab === "methods" ? "default" : "outline"}
            onClick={() => setActiveTab("methods")}
          >
            Métodos de Pagamento
          </Button>
          <Button
            variant={activeTab === "transactions" ? "default" : "outline"}
            onClick={() => setActiveTab("transactions")}
          >
            Transações
          </Button>
          <Button
            variant={activeTab === "callbacks" ? "default" : "outline"}
            onClick={() => setActiveTab("callbacks")}
          >
            Callbacks
          </Button>
        </div>
        
        <Separator />
        
        {activeTab === "methods" ? (
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.id} className="border rounded-lg p-6">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg">{method.name}</h3>
                        <p className="text-gray-500">{method.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={method.status === "active" ? "default" : "secondary"}
                        >
                          {method.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => toggleMethodStatus(
                            method.id, 
                            method.status
                          )}
                        >
                          {method.status === "active" ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : activeTab === "transactions" ? (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{payment.customer}</TableCell>
                        <TableCell>
                          {payment.method === "multicaixa" 
                            ? "Multicaixa Express" 
                            : "Transferência Bancária"}
                        </TableCell>
                        <TableCell>{payment.reference}</TableCell>
                        <TableCell>
                          KZ {new Intl.NumberFormat('pt-PT', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            useGrouping: true
                          }).format(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === "completed" ? "default" : "secondary"}
                          >
                            {payment.status === "completed" ? "Concluído" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <PaymentCallbackConfig />
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentsPage;
