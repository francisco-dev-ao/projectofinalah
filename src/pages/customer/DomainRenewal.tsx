
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Globe, Calendar, RefreshCw } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { v4 as uuidv4 } from 'uuid';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { useAuth } from '@/contexts/AuthContext';
import { checkPermission } from '@/services/permissions-service';
import { supabase } from '@/integrations/supabase/client';
import { domainPriceMap } from '@/data/domainPricing';

interface Domain {
  id: string;
  domain_name: string;
  tld: string;
  status: string;
  registration_date: string;
  expiration_date: string;
  auto_renew: boolean;
  user_id: string;
}

const DomainRenewal = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    if (domainId) {
      fetchDomainDetails();
    }
  }, [domainId]);

  const fetchDomainDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .single();

      if (error) {
        console.error('Error fetching domain:', error);
        toast.error('Erro ao carregar dados do domínio');
        navigate('/customer/domains');
        return;
      }

      if (!data) {
        toast.error('Domínio não encontrado');
        navigate('/customer/domains');
        return;
      }

      setDomain(data);
    } catch (error) {
      console.error('Error in fetchDomainDetails:', error);
      toast.error('Erro ao carregar domínio');
      navigate('/customer/domains');
    } finally {
      setIsLoading(false);
    }
  };

  const getRenewalPrice = (tld: string): number => {
    const tldKey = tld.startsWith('.') ? tld : `.${tld}`;
    const priceInfo = domainPriceMap[tldKey];
    return priceInfo ? priceInfo.renewalPrice : 20000; // Preço padrão caso não encontre
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRenewDomain = async () => {
    if (!domain) {
      toast.error('Domínio não encontrado.');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado para renovar o domínio.');
      navigate('/login');
      return;
    }

    // Check permissions
    const hasDomainPermission = await checkPermission(user.id, 'domains', 'write');
    if (!hasDomainPermission) {
      toast.error('Você não tem permissão para renovar domínios.');
      return;
    }

    setIsRenewing(true);

    try {
      const renewalPrice = getRenewalPrice(domain.tld);
      
      const renewalItem = {
        id: uuidv4(),
        name: `Renovação de Domínio: ${domain.domain_name}.${domain.tld}`,
        price: renewalPrice,
        type: 'domain_renewal',
        description: 'Renovação de domínio por 1 ano',
        unitPrice: renewalPrice,
        period: '1 ano',
        metadata: {
          domainId: domain.id,
          domainName: `${domain.domain_name}.${domain.tld}`,
          tld: domain.tld
        }
      };

      addToCart(renewalItem);
      toast.success(`Renovação para ${domain.domain_name}.${domain.tld} adicionada ao carrinho!`);
      navigate('/cart');
    } catch (error) {
      console.error('Erro ao renovar domínio:', error);
      toast.error('Erro ao adicionar renovação ao carrinho. Tente novamente.');
    } finally {
      setIsRenewing(false);
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando detalhes do domínio...</span>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!domain) {
    return (
      <CustomerLayout>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="text-center py-12">
            <h2 className="text-xl mb-4">Domínio não encontrado</h2>
            <Button onClick={() => navigate('/customer/domains')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Domínios
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const renewalPrice = getRenewalPrice(domain.tld);

  return (
    <CustomerLayout>
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/customer/domains')}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <h1 className="text-xl sm:text-2xl font-bold">
                Renovar Domínio
              </h1>
            </div>
          </div>
        </div>

        {/* Domain Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Globe className="h-5 w-5" />
              Detalhes do Domínio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Nome do Domínio
                  </label>
                  <p className="text-lg font-semibold break-all">
                    {domain.domain_name}.{domain.tld}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status Atual
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(domain.status)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Data de Registro
                  </label>
                  <p className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {formatDate(domain.registration_date)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Data de Expiração
                  </label>
                  <p className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {formatDate(domain.expiration_date)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Renovação Automática
                  </label>
                  <p className="mt-1">
                    <Badge variant={domain.auto_renew ? "default" : "outline"}>
                      {domain.auto_renew ? "Ativada" : "Desativada"}
                    </Badge>
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Extensão do Domínio
                  </label>
                  <p className="text-sm font-medium">
                    .{domain.tld}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewal Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Detalhes da Renovação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Informações da Renovação</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• O domínio será renovado por mais 1 ano</p>
                <p>• A renovação será adicionada ao seu carrinho para pagamento</p>
                <p>• Após o pagamento, a data de expiração será estendida automaticamente</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Preço de Renovação</h4>
                  <p className="text-sm text-gray-600">Renovação por 1 ano</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(renewalPrice)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={handleRenewDomain} 
                disabled={isRenewing}
                className="w-full sm:w-auto"
                size="lg"
              >
                {isRenewing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Renovar por {formatPrice(renewalPrice)}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
};

export default DomainRenewal;
