import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Database,
  FileX,
  Users,
  Receipt,
  ShoppingCart,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CleanupStats {
  orphanedInvoices: number;
  demoInvoices: number;
  demoOrders: number;
  demoUsers: number;
  demoDomains: number;
  demoServices: number;
  totalDeleted: number;
}

const SystemDataCleanup = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const analyzeSystemData = async () => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem executar esta função.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      console.log('🔍 Iniciando análise de dados do sistema...');
      
      // Verificar faturas órfãs (sem order_id)
      const { data: orphanedInvoices, error: orphanError } = await supabase
        .from('invoices')
        .select('id, invoice_number, order_id')
        .is('order_id', null);
      
      if (orphanError) throw orphanError;

      // Verificar faturas de exemplo/demo
      const { data: demoInvoices, error: demoInvoiceError } = await supabase
        .from('invoices')
        .select('id, invoice_number')
        .or('invoice_number.ilike.%exemplo%,invoice_number.ilike.%demo%,invoice_number.ilike.%test%');
      
      if (demoInvoiceError) throw demoInvoiceError;

      // Verificar pedidos de exemplo
      const { data: demoOrders, error: demoOrderError } = await supabase
        .from('orders')
        .select('id')
        .or('notes.ilike.%exemplo%,notes.ilike.%demo%,notes.ilike.%test%');
      
      if (demoOrderError) throw demoOrderError;

      // Verificar usuários de exemplo
      const { data: demoUsers, error: demoUserError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .or('name.ilike.%exemplo%,name.ilike.%demo%,name.ilike.%test%,email.ilike.%exemplo.com%,email.ilike.%test.com%,email.ilike.%demo.com%');
      
      if (demoUserError) throw demoUserError;

      // Verificar domínios de exemplo
      const { data: demoDomains, error: demoDomainError } = await supabase
        .from('domain_orders')
        .select('id, domain_name')
        .or('domain_name.ilike.%exemplo.com%,domain_name.ilike.%test.com%,domain_name.ilike.%demo.com%');
      
      if (demoDomainError) throw demoDomainError;

      // Verificar serviços de exemplo
      const { data: demoServices, error: demoServiceError } = await supabase
        .from('services')
        .select('id, service_name')
        .or('service_name.ilike.%exemplo%,service_name.ilike.%demo%,service_name.ilike.%test%');
      
      if (demoServiceError) throw demoServiceError;

      const newStats: CleanupStats = {
        orphanedInvoices: orphanedInvoices?.length || 0,
        demoInvoices: demoInvoices?.length || 0,
        demoOrders: demoOrders?.length || 0,
        demoUsers: demoUsers?.length || 0,
        demoDomains: demoDomains?.length || 0,
        demoServices: demoServices?.length || 0,
        totalDeleted: 0
      };

      setStats(newStats);
      setLastAnalysis(new Date());
      
      const totalIssues = newStats.orphanedInvoices + newStats.demoInvoices + newStats.demoOrders + 
                         newStats.demoUsers + newStats.demoDomains + newStats.demoServices;
      
      if (totalIssues === 0) {
        toast.success('✅ Sistema limpo! Nenhum dado órfão ou de exemplo encontrado.');
      } else {
        toast.warning(`⚠️ Encontrados ${totalIssues} itens que precisam de limpeza.`);
      }
      
      console.log('📊 Análise concluída:', newStats);
      
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      toast.error('Erro ao analisar dados do sistema.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanupSystemData = async () => {
    if (!isAdmin || !stats) {
      toast.error('Análise necessária antes da limpeza.');
      return;
    }

    const totalItems = stats.orphanedInvoices + stats.demoInvoices + stats.demoOrders + 
                      stats.demoUsers + stats.demoDomains + stats.demoServices;
    
    if (totalItems === 0) {
      toast.info('Nenhum item encontrado para limpeza.');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Esta ação irá deletar permanentemente ${totalItems} itens do sistema.\n\n` +
      `• ${stats.orphanedInvoices} faturas órfãs\n` +
      `• ${stats.demoInvoices} faturas de exemplo\n` +
      `• ${stats.demoOrders} pedidos de exemplo\n` +
      `• ${stats.demoUsers} usuários de exemplo\n` +
      `• ${stats.demoDomains} domínios de exemplo\n` +
      `• ${stats.demoServices} serviços de exemplo\n\n` +
      `Tem certeza que deseja continuar?`
    );

    if (!confirmed) return;

    setIsCleaning(true);
    let totalDeleted = 0;

    try {
      console.log('🧹 Iniciando limpeza do sistema...');

      // 1. Deletar faturas órfãs
      if (stats.orphanedInvoices > 0) {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .is('order_id', null);
        
        if (error) throw error;
        totalDeleted += stats.orphanedInvoices;
        console.log(`✅ ${stats.orphanedInvoices} faturas órfãs deletadas`);
      }

      // 2. Deletar faturas de exemplo
      if (stats.demoInvoices > 0) {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .or('invoice_number.ilike.%exemplo%,invoice_number.ilike.%demo%,invoice_number.ilike.%test%');
        
        if (error) throw error;
        totalDeleted += stats.demoInvoices;
        console.log(`✅ ${stats.demoInvoices} faturas de exemplo deletadas`);
      }

      // 3. Deletar pedidos de exemplo
      if (stats.demoOrders > 0) {
        const { error } = await supabase
          .from('orders')
          .delete()
          .or('notes.ilike.%exemplo%,notes.ilike.%demo%,notes.ilike.%test%');
        
        if (error) throw error;
        totalDeleted += stats.demoOrders;
        console.log(`✅ ${stats.demoOrders} pedidos de exemplo deletados`);
      }

      // 4. Deletar domínios de exemplo
      if (stats.demoDomains > 0) {
        const { error } = await supabase
          .from('domain_orders')
          .delete()
          .or('domain_name.ilike.%exemplo.com%,domain_name.ilike.%test.com%,domain_name.ilike.%demo.com%');
        
        if (error) throw error;
        totalDeleted += stats.demoDomains;
        console.log(`✅ ${stats.demoDomains} domínios de exemplo deletados`);
      }

      // 5. Deletar serviços de exemplo
      if (stats.demoServices > 0) {
        const { error } = await supabase
          .from('services')
          .delete()
          .or('service_name.ilike.%exemplo%,service_name.ilike.%demo%,service_name.ilike.%test%');
        
        if (error) throw error;
        totalDeleted += stats.demoServices;
        console.log(`✅ ${stats.demoServices} serviços de exemplo deletados`);
      }

      // 6. Deletar usuários de exemplo (cuidado especial)
      if (stats.demoUsers > 0) {
        // Primeiro deletar profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .or('name.ilike.%exemplo%,name.ilike.%demo%,name.ilike.%test%,email.ilike.%exemplo.com%,email.ilike.%test.com%,email.ilike.%demo.com%');
        
        if (profileError) throw profileError;
        totalDeleted += stats.demoUsers;
        console.log(`✅ ${stats.demoUsers} usuários de exemplo deletados`);
      }

      // Atualizar estatísticas
      setStats(prev => prev ? { ...prev, totalDeleted } : null);
      
      toast.success(`🎉 Limpeza concluída! ${totalDeleted} itens foram removidos do sistema.`);
      console.log(`🎉 Limpeza concluída: ${totalDeleted} itens deletados`);
      
      // Reanalizar após limpeza
      setTimeout(() => analyzeSystemData(), 1000);
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      toast.error('Erro durante a limpeza do sistema.');
    } finally {
      setIsCleaning(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Acesso Restrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade está disponível apenas para administradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Limpeza de Dados do Sistema
          </CardTitle>
          <CardDescription>
            Identifique e remova faturas órfãs e dados de exemplo/teste do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={analyzeSystemData}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isAnalyzing ? 'Analisando...' : 'Analisar Sistema'}
            </Button>
            
            {stats && (
              <Button 
                onClick={cleanupSystemData}
                disabled={isCleaning || isAnalyzing}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isCleaning ? 'Limpando...' : 'Limpar Dados'}
              </Button>
            )}
          </div>

          {lastAnalysis && (
            <p className="text-sm text-muted-foreground">
              Última análise: {lastAnalysis.toLocaleString('pt-AO')}
            </p>
          )}
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultados da Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <FileX className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Faturas Órfãs</p>
                  <Badge variant={stats.orphanedInvoices > 0 ? "destructive" : "secondary"}>
                    {stats.orphanedInvoices}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Receipt className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Faturas Exemplo</p>
                  <Badge variant={stats.demoInvoices > 0 ? "destructive" : "secondary"}>
                    {stats.demoInvoices}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Pedidos Exemplo</p>
                  <Badge variant={stats.demoOrders > 0 ? "destructive" : "secondary"}>
                    {stats.demoOrders}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Usuários Exemplo</p>
                  <Badge variant={stats.demoUsers > 0 ? "destructive" : "secondary"}>
                    {stats.demoUsers}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Globe className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Domínios Exemplo</p>
                  <Badge variant={stats.demoDomains > 0 ? "destructive" : "secondary"}>
                    {stats.demoDomains}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <Database className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium">Serviços Exemplo</p>
                  <Badge variant={stats.demoServices > 0 ? "destructive" : "secondary"}>
                    {stats.demoServices}
                  </Badge>
                </div>
              </div>
            </div>

            {stats.totalDeleted > 0 && (
              <>
                <Separator className="my-4" />
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Limpeza concluída:</strong> {stats.totalDeleted} itens foram removidos do sistema.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Faturas Órfãs:</strong> São faturas que não possuem um pedido associado (order_id nulo). 
              Isso pode acontecer quando pedidos são deletados mas as faturas permanecem.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dados de Exemplo:</strong> São registros de teste que contêm palavras como "exemplo", "demo", "test" 
              ou emails com domínios de teste (.exemplo.com, .test.com, .demo.com).
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A operação de limpeza é irreversível. Sempre faça backup do banco de dados 
              antes de executar limpezas em ambiente de produção.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemDataCleanup;