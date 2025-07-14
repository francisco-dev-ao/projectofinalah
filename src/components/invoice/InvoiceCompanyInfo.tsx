
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User } from 'lucide-react';

interface InvoiceCompanyInfoProps {
  companyInfo: any;
  order: any;
}

const InvoiceCompanyInfo: React.FC<InvoiceCompanyInfoProps> = ({ companyInfo, order }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informações da Fatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-sm uppercase text-gray-500 mb-3">De</h3>
              <div className="space-y-2">
                <p className="font-bold text-lg">{companyInfo?.company_name || 'AngoHost'}</p>
                <p className="text-sm text-gray-600">
                  {companyInfo?.company_details || 'Endereço da Empresa'}
                </p>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <p className="text-sm"><span className="font-medium">Email:</span> support@angohost.ao</p>
              <p className="text-sm"><span className="font-medium">Telefone:</span> +244 942 090108</p>
              <p className="text-sm"><span className="font-medium">NIF:</span> 5000088927</p>
            </div>
          </div>
          
          {/* Client Information */}
          <div>
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-3">Para</h3>
            <div className="space-y-2">
              <p className="font-bold text-lg">{order?.profiles?.name || order?.profiles?.company_name || 'Cliente'}</p>
              {order?.profiles?.company_name && (
                <p className="text-sm text-gray-600">{order.profiles.company_name}</p>
              )}
              <p className="text-sm text-gray-600">
                {order?.profiles?.address || 'Endereço não especificado'}
              </p>
            </div>
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <p className="text-sm"><span className="font-medium">Email:</span> {order?.profiles?.email || 'N/A'}</p>
              <p className="text-sm"><span className="font-medium">Telefone:</span> {order?.profiles?.phone || 'N/A'}</p>
              <p className="text-sm"><span className="font-medium">NIF:</span> {order?.profiles?.nif || 'N/A'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceCompanyInfo;
