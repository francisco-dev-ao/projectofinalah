import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CustomerLayout from "@/components/customer/CustomerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Server, AlertTriangle, Settings } from "lucide-react";
import { Service } from "@/types/service";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const ServiceDetails = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      loadServiceData(serviceId);
    }
  }, [serviceId]);

  const loadServiceData = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Cast the data to Service type to ensure compatibility
      setService(data as unknown as Service);
    } catch (error) {
      console.error("Error loading service details:", error);
      toast.error("Não foi possível carregar os detalhes do serviço");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'default';
      case 'suspended':
        return 'warning';
      case 'expired':
      case 'canceled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatServiceStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'suspended':
        return 'Suspenso';
      case 'expired':
        return 'Expirado';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Back button */}
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/customer/services" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para serviços
            </Link>
          </Button>
          
          <h1 className="text-2xl font-bold tracking-tight">
            {loading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              service?.name || "Detalhes do Serviço"
            )}
          </h1>
        </div>
        
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        ) : service ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    Informações do Serviço
                  </CardTitle>
                  <Badge variant={getStatusBadge(service.status)}>
                    {formatServiceStatus(service.status)}
                  </Badge>
                </div>
                <CardDescription>
                  Detalhes e configurações do seu serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p>{service.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p>{formatServiceStatus(service.status)}</p>
                  </div>
                  
                  {service.config && service.config.plan && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Plano</p>
                      <p>{service.config.plan}</p>
                    </div>
                  )}
                  
                  {service.activation_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Ativação</p>
                      <p>{formatDateTime(service.activation_date)}</p>
                    </div>
                  )}
                  
                  {service.end_date && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Data de Expiração</p>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateTime(service.end_date)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center pt-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Renovação Automática</p>
                    <p className="text-sm text-muted-foreground">
                      {service.auto_renew ? "Ativada" : "Desativada"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Gerenciar Renovação
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Gerenciamento
                </CardTitle>
                <CardDescription>
                  Ações e configurações do serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Próximos passos e ações disponíveis para gerenciar seu serviço.
                </p>
                
                <div className="space-y-3 pt-2">
                  <Button className="w-full">Acessar Painel de Controle</Button>
                  <Button variant="outline" className="w-full">Solicitar Suporte</Button>
                  <Button variant="outline" className="w-full">Configurações Avançadas</Button>
                </div>
                
                {service.status === 'active' && service.end_date && (
                  <div className="pt-4">
                    <p className="text-sm font-medium">Renovação</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Renove seu serviço antes do vencimento para garantir continuidade.
                    </p>
                    <Button variant="outline" className="w-full">Renovar Serviço</Button>
                  </div>
                )}

                {service.status === 'active' && (
                  <div className="pt-4">
                    <p className="text-sm font-medium">Upgrade</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Melhore seu plano atual para obter mais recursos.
                    </p>
                    <Button variant="outline" className="w-full">Fazer Upgrade</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Serviço não encontrado</h3>
              <p className="text-muted-foreground">
                Não conseguimos encontrar o serviço solicitado.
              </p>
              <Button asChild className="mt-4">
                <Link to="/customer/services">Ver todos os serviços</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default ServiceDetails;
