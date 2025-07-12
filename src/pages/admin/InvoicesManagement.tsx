
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import InvoiceManagement from "@/components/admin/InvoiceManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

const InvoicesManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Gerenciamento de Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Gerencie todas as faturas do sistema, crie novas faturas, marque como pagas, cancele ou visualize detalhes.
            </p>
          </CardContent>
        </Card>
        
        <InvoiceManagement />
      </div>
    </AdminLayout>
  );
};

export default InvoicesManagement;
