
import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  User, 
  Package, 
  Database, 
  Settings, 
  Shield, 
  Mail, 
  Server, 
  BellRing,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';

const SuperAdminDashboard = () => {
  const { role } = useAdminAuth();
  const navigate = useNavigate();

  // Ensure the user is a super-admin
  if (role !== 'super_admin') {
    navigate('/admin');
    toast.error('Você não tem permissão para acessar esta página');
    return null;
  }

  const superAdminFeatures = [
    {
      title: 'Gerenciar Administradores',
      description: 'Criar ou remover administradores do sistema',
      icon: <User className="h-8 w-8 text-primary" />,
      path: '/admin/security'
    },
    {
      title: 'Configuração do Sistema',
      description: 'Definir parâmetros do sistema e variáveis globais',
      icon: <Settings className="h-8 w-8 text-primary" />,
      path: '/admin/settings'
    },
    {
      title: 'Gerenciar Produtos',
      description: 'Criar, editar e remover produtos do sistema',
      icon: <Package className="h-8 w-8 text-primary" />,
      path: '/admin/pricing'
    },
    {
      title: 'Segurança',
      description: 'Definir políticas de segurança e gerenciar permissões',
      icon: <Shield className="h-8 w-8 text-primary" />,
      path: '/admin/security'
    },
    {
      title: 'Configurações de Email',
      description: 'Configurar os serviços de email do sistema',
      icon: <Mail className="h-8 w-8 text-primary" />,
      path: '/admin/email-settings'
    },
    {
      title: 'Servidores e Infraestrutura',
      description: 'Visualizar e gerenciar os servidores e recursos',
      icon: <Server className="h-8 w-8 text-primary" />,
      path: '/admin/hosting'
    },
    {
      title: 'Notificações do Sistema',
      description: 'Configurar e gerenciar notificações do sistema',
      icon: <BellRing className="h-8 w-8 text-primary" />,
      path: '/admin/messages'
    },
    {
      title: 'Banco de Dados',
      description: 'Gerenciar dados e realizar backups',
      icon: <Database className="h-8 w-8 text-primary" />,
      path: '/admin/cleanup'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard do Super Administrador</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle do Super Administrador. Aqui você tem controle completo sobre todos os aspectos do sistema.
          </p>
        </div>

        {/* Production Mode Warning Banner */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Sparkles className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Modo de Produção</h3>
                <p className="text-green-700 mt-1">
                  O sistema está pronto para ser usado em produção. Certifique-se de remover todos os dados de demonstração antes de disponibilizar o sistema para os clientes.
                </p>
                
                <div className="flex gap-3 mt-4">
                  <Button variant="default" asChild>
                    <Link to="/admin/data-cleanup">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Dados de Demonstração
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ferramentas de Administração</CardTitle>
            <CardDescription>
              Acesse as ferramentas avançadas disponíveis apenas para super administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {superAdminFeatures.map((feature, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-center text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button asChild className="w-full">
                      <Link to={feature.path}>Acessar</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Operações Críticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-amber-700">
              As operações abaixo são consideradas de alto risco e podem causar impacto em todos os dados do sistema.
              Tenha certeza do que está fazendo antes de prosseguir.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="destructive">
                <Link to="/admin/cleanup">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Dados de Usuário
                </Link>
              </Button>
              
              <Button asChild variant="destructive">
                <Link to="/admin/data-cleanup">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Dados de Demonstração
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SuperAdminDashboard;
