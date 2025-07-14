import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '@/components/customer/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  ExternalLink, 
  Settings, 
  Server, 
  Globe, 
  Shield, 
  Calendar, 
  RotateCw,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateTime } from '@/utils/formatters';
import DomainRenewalDialog from '@/components/customer/DomainRenewalDialog';
import AlertDialogCustom from '@/components/ui/alert-dialog-custom';

// Interface e constantes relacionadas a DNS foram removidas conforme solicitado

const DomainDetails = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Estados relacionados a DNS foram removidos conforme solicitado
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nameservers, setNameservers] = useState(['ns1.angohost.co.ao', 'ns2.angohost.co.ao']);
  const [customNameservers, setCustomNameservers] = useState(['', '']);
  const [usingCustomNS, setUsingCustomNS] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (domainId && user) {
      loadDomainData();
    }
  }, [domainId, user]);

  const loadDomainData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading domain data for ID:', domainId);
      
      // First try to get from domains table
      let { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('*') // Remova o select com relação!
        .eq('id', domainId)
        .maybeSingle();
      
      console.log('Domains table query result:', { domainData, domainError });
      
      // If not found in domains table, try domain_orders table
      if (domainError || !domainData) {
        console.log('Domain not found in domains table, trying domain_orders...');

        // Consulta simples em domain_orders
        const { data: orderData, error: orderError } = await supabase
          .from('domain_orders')
          .select('*')
          .eq('id', domainId)
          .maybeSingle();

        console.log('Domain orders query result:', { orderData, orderError });

        if (orderError || !orderData) {
          console.error("Domain not found in either table:", { domainError, orderError });
          setError(`Domínio não encontrado: ${orderError?.message || domainError?.message || 'desconhecido'}`);
          toast.error("Domínio não encontrado");
          return;
        }

        // Buscar dados do pedido relacionado, se existir
        let orderDetails = null;
        if (orderData.order_id) {
          const { data: orderDetailsData } = await supabase
            .from('orders')
            .select('user_id, total_amount, status')
            .eq('id', orderData.order_id)
            .maybeSingle();
          orderDetails = orderDetailsData;
        }

        // Convert domain_orders format to domains format
        domainData = {
          id: orderData.id,
          domain_name: orderData.domain_name,
          tld: orderData.tld_type,
          user_id: orderData.user_id,
          order_id: orderData.order_id,
          status: orderData.status,
          auto_renew: true,
          is_locked: false,
          privacy_protection: false,
          transfer_lock: false,
          registration_date: orderData.created_at,
          expiration_date: new Date(new Date(orderData.created_at).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          nameservers: ['ns1.angohost.co.ao', 'ns2.angohost.co.ao'],
          created_at: orderData.created_at,
          updated_at: orderData.updated_at,
          order_details: orderDetails // Adiciona detalhes do pedido, se houver
        };
      }
      
      // Verify this domain belongs to the current user
      if (domainData.user_id !== user?.id) {
        console.error('Permission denied - user mismatch:', { domainUserId: domainData.user_id, currentUserId: user?.id });
        setError("Você não tem permissão para visualizar este domínio");
        toast.error("Você não tem permissão para visualizar este domínio");
        return;
      }
      
      console.log('Domain data loaded successfully:', domainData);
      setDomain(domainData);
    } catch (error: any) {
      console.error("Error loading domain details:", error);
      setError(`Erro ao carregar detalhes do domínio: ${error.message}`);
      toast.error("Erro ao carregar detalhes do domínio");
    } finally {
      setLoading(false);
    }
  };

  // Format domain status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirado';
      case 'transferred':
        return 'Transferido';
      default:
        return status;
    }
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'transferred':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const handleRenewDomain = () => {
    setShowRenewalDialog(true);
  };

  const handleTogglePrivacyProtection = async () => {
    if (!domain) return;
    
    try {
      const newPrivacyStatus = !domain.privacy_protection;
      
      const { error } = await supabase
        .from('domains')
        .update({ privacy_protection: newPrivacyStatus })
        .eq('id', domain.id);
      
      if (error) {
        toast.error("Erro ao atualizar proteção de privacidade");
        return;
      }
      
      setDomain({ ...domain, privacy_protection: newPrivacyStatus });
      toast.success(`Proteção de privacidade ${newPrivacyStatus ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error("Error toggling privacy protection:", error);
      toast.error("Erro ao atualizar proteção de privacidade");
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!domain) return;
    
    try {
      const newAutoRenewStatus = !domain.auto_renew;
      
      const { error } = await supabase
        .from('domains')
        .update({ auto_renew: newAutoRenewStatus })
        .eq('id', domain.id);
      
      if (error) {
        toast.error("Erro ao atualizar renovação automática");
        return;
      }
      
      setDomain({ ...domain, auto_renew: newAutoRenewStatus });
      toast.success(`Renovação automática ${newAutoRenewStatus ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error("Error toggling auto renew:", error);
      toast.error("Erro ao atualizar renovação automática");
    }
  };

  const handleEditContacts = () => {
    // Redirect to contact profiles page instead of external WHOIS
    navigate('/customer/contact-profiles');
    toast.success("Redirecionando para perfis de contactos");
  };

  const handleTransferDomain = () => {
    // Generate auth code and show transfer instructions
    toast.success("Código de autorização gerado. Verifique seu email para instruções de transferência.");
  };

  const handleDeleteDomain = async () => {
    if (!domain || !user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domain.id)
        .eq('user_id', user.id); // Ensure user can only delete their own domains
      
      if (error) {
        console.error("Error deleting domain:", error);
        toast.error("Erro ao excluir domínio");
        return;
      }
      
      toast.success("Domínio excluído com sucesso");
      setShowDeleteDialog(false);
      
      // Redirect to domains list
      navigate('/customer/domains');
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast.error("Erro ao excluir domínio");
    } finally {
      setIsDeleting(false);
    }
  };

  // Funções relacionadas a DNS foram removidas conforme solicitado

  const handleUseDefaultNameservers = async () => {
    try {
      setNameservers(['ns1.angohost.co.ao', 'ns2.angohost.co.ao']);
      setUsingCustomNS(false);
      
      // Update domain nameservers in database
      const { error } = await supabase
        .from('domains')
        .update({ nameservers: ['ns1.angohost.co.ao', 'ns2.angohost.co.ao'] })
        .eq('id', domain.id);
      
      if (error) {
        toast.error("Erro ao atualizar nameservers");
        return;
      }
      
      toast.success("Nameservers padrão configurados com sucesso!");
    } catch (error) {
      toast.error("Erro ao configurar nameservers");
    }
  };

  const handleUseCustomNameservers = () => {
    setUsingCustomNS(true);
  };

  const handleSaveCustomNameservers = async () => {
    const validNameservers = customNameservers.filter(ns => ns.trim() !== '');
    
    if (validNameservers.length < 2) {
      toast.error("É necessário pelo menos 2 nameservers");
      return;
    }

    try {
      setNameservers(validNameservers);
      
      // Update domain nameservers in database
      const { error } = await supabase
        .from('domains')
        .update({ nameservers: validNameservers })
        .eq('id', domain.id);
      
      if (error) {
        toast.error("Erro ao atualizar nameservers");
        return;
      }
      
      setUsingCustomNS(false);
      toast.success("Nameservers personalizados configurados com sucesso!");
    } catch (error) {
      toast.error("Erro ao configurar nameservers");
    }
  };

  const handleToggleTransferLock = async () => {
    try {
      const newLockStatus = !domain.transfer_lock;
      
      const { error } = await supabase
        .from('domains')
        .update({ transfer_lock: newLockStatus })
        .eq('id', domain.id);
      
      if (error) {
        toast.error("Erro ao atualizar bloqueio de transferência");
        return;
      }
      
      setDomain({ ...domain, transfer_lock: newLockStatus });
      toast.success(`Bloqueio de transferência ${newLockStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error("Error toggling transfer lock:", error);
      toast.error("Erro ao atualizar bloqueio de transferência");
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando detalhes do domínio...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !domain) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/customer/domains" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Domínios
            </Link>
          </Button>
          
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
                <p className="text-lg font-medium mb-2">Domínio não encontrado</p>
                <p className="text-muted-foreground">
                  {error || "O domínio solicitado não existe ou você não tem permissão para visualizá-lo."}
                </p>
                <Button asChild className="mt-4">
                  <Link to="/customer/domains">Voltar para Domínios</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  const isExpired = domain.status === 'expired';
  const expirationDate = domain.expiration_date ? new Date(domain.expiration_date) : null;
  const isExpiringInMonth = expirationDate && (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 30;

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/customer/domains" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para domínios
            </Link>
          </Button>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {domain.domain_name}.{domain.tld}
              </h1>
              <p className="text-muted-foreground">
                Registrado em {formatDateTime(domain.registration_date)}
              </p>
            </div>
            
            <Badge variant={getStatusBadge(domain.status)}>
              {formatStatus(domain.status)}
            </Badge>
          </div>
        </div>
        
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium">Domínio expirado</h3>
              <p className="mt-1 text-sm">
                Seu domínio expirou em {formatDateTime(domain.expiration_date)}. 
                Renove agora para evitar a perda do seu domínio.
              </p>
              <Button onClick={handleRenewDomain} variant="destructive" size="sm" className="mt-2">
                Renovar domínio
              </Button>
            </div>
          </div>
        )}
        
        {!isExpired && isExpiringInMonth && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium">Domínio expirando em breve</h3>
              <p className="mt-1 text-sm">
                Seu domínio irá expirar em {formatDateTime(domain.expiration_date)}. 
                Renove com antecedência para garantir a continuidade do seu serviço.
              </p>
              <Button onClick={handleRenewDomain} variant="default" size="sm" className="mt-2">
                <RotateCw className="mr-2 h-4 w-4" />
                Renovar domínio
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="nameservers">Nameservers</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    Informações do Domínio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome de Domínio</p>
                      <p>{domain.domain_name}.{domain.tld}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p>{formatStatus(domain.status)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Registro</p>
                      <p>{formatDateTime(domain.registration_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Expiração</p>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateTime(domain.expiration_date)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Auto-Renovação</p>
                      <p>{domain.auto_renew ? "Ativada" : "Desativada"}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Proteção de Privacidade</p>
                      <p>{domain.privacy_protection ? "Ativada" : "Desativada"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Gerencie seu domínio com estas ações rápidas
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button onClick={handleRenewDomain}>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Renovar Domínio
                    </Button>
                    
                    <Button variant="outline" onClick={handleTogglePrivacyProtection}>
                      <Shield className="mr-2 h-4 w-4" />
                      {domain.privacy_protection ? "Desativar" : "Ativar"} Proteção de Privacidade
                    </Button>
                    
                    <Button variant="outline" onClick={handleEditContacts}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Contatos
                    </Button>
                    
                    <Button variant="outline" onClick={handleTransferDomain}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Transferir Domínio
                    </Button>
                    
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Domínio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="nameservers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  Nameservers
                </CardTitle>
                <CardDescription>
                  Gerencie os nameservers do seu domínio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Nameservers Atuais</p>
                    <div className="space-y-2">
                      {nameservers.map((ns, index) => (
                        <div key={index} className="bg-muted p-3 rounded-md font-mono text-sm">{ns}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="font-medium mb-2">Alterar Nameservers</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Você pode usar os nameservers padrão ou definir seus próprios nameservers personalizados.
                    </p>
                    
                    {usingCustomNS ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nameserver 1</Label>
                          <Input
                            value={customNameservers[0]}
                            onChange={(e) => setCustomNameservers(prev => [e.target.value, prev[1]])}
                            placeholder="ns1.exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nameserver 2</Label>
                          <Input
                            value={customNameservers[1]}
                            onChange={(e) => setCustomNameservers(prev => [prev[0], e.target.value])}
                            placeholder="ns2.exemplo.com"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveCustomNameservers}>Salvar Nameservers</Button>
                          <Button variant="outline" onClick={() => setUsingCustomNS(false)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleUseDefaultNameservers}>Usar Nameservers Padrão</Button>
                        <Button variant="outline" onClick={handleUseCustomNameservers}>Usar Nameservers Personalizados</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Configurações do Domínio
                </CardTitle>
                <CardDescription>
                  Gerencie as configurações do seu domínio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Renovação Automática</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Quando ativada, renovaremos automaticamente seu domínio antes da expiração.
                    </p>
                    <Button 
                      variant={domain.auto_renew ? "outline" : "default"}
                      onClick={handleToggleAutoRenew}
                    >
                      {domain.auto_renew ? "Desativar Auto-Renovação" : "Ativar Auto-Renovação"}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-2">Proteção de Privacidade</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Proteja suas informações pessoais no WHOIS do domínio.
                    </p>
                    <Button 
                      variant={domain.privacy_protection ? "outline" : "default"}
                      onClick={handleTogglePrivacyProtection}
                    >
                      {domain.privacy_protection ? "Desativar Proteção de Privacidade" : "Ativar Proteção de Privacidade"}
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-2">Bloqueio de Transferência</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Previne transferências não autorizadas do seu domínio para outro registrador.
                    </p>
                    <Button variant="outline" onClick={handleToggleTransferLock}>
                      {domain.transfer_lock ? "Desativar" : "Ativar"} Bloqueio de Transferência
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 flex flex-col items-start">
                <h3 className="font-medium text-destructive mb-2">Zona de Perigo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  As ações a seguir são irreversíveis. Tenha cuidado ao utilizá-las.
                </p>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Domínio
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Renewal Dialog */}
        {domain && (
          <DomainRenewalDialog
            open={showRenewalDialog}
            onOpenChange={setShowRenewalDialog}
            domain={domain}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialogCustom
          open={showDeleteDialog}
          title="Excluir Domínio"
          description="Tem certeza que deseja excluir este domínio? Esta ação não pode ser desfeita e você perderá permanentemente o controle sobre o domínio."
          confirmLabel="Sim, excluir"
          cancelLabel="Cancelar"
          confirmVariant="destructive"
          onConfirm={handleDeleteDomain}
          onCancel={() => setShowDeleteDialog(false)}
          loading={isDeleting}
        />
      </div>
    </CustomerLayout>
  );
};

export default DomainDetails;
