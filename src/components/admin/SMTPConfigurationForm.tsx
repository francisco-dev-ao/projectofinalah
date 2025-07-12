import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import PrintService from '@/services';

export default function SMTPConfigurationForm() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  const [config, setConfig] = useState({
    smtp_host: '',
    smtp_port: '465',
    smtp_secure: true,
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
    auto_send_invoices: false
  });
  
  // Carregar configurações existentes
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (data && !error) {
          setConfig({
            smtp_host: data.smtp_host || '',
            smtp_port: data.smtp_port || '465',
            smtp_secure: data.smtp_secure !== false,
            smtp_user: data.smtp_user || '',
            smtp_password: data.smtp_password || '',
            smtp_from: data.smtp_from || '',
            auto_send_invoices: data.auto_send_invoices || false
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Manipuladores de eventos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, value: boolean) => {
    setConfig(prev => ({ ...prev, [name]: value }));
  };
  
  // Testar configuração SMTP
  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Por favor, informe um e-mail para teste');
      return;
    }
    
    setTesting(true);
    try {
      // Salvar configurações temporariamente no localStorage para o teste
      localStorage.setItem('NEXT_PUBLIC_SMTP_HOST', config.smtp_host);
      localStorage.setItem('NEXT_PUBLIC_SMTP_PORT', config.smtp_port);
      localStorage.setItem('NEXT_PUBLIC_SMTP_SECURE', String(config.smtp_secure));
      localStorage.setItem('NEXT_PUBLIC_SMTP_USER', config.smtp_user);
      localStorage.setItem('NEXT_PUBLIC_SMTP_PASSWORD', config.smtp_password);
      localStorage.setItem('NEXT_PUBLIC_SMTP_FROM', config.smtp_from);
      
      // Enviar e-mail de teste
      const result = await PrintService.sendTestEmail(testEmail);
      
      toast.success(`E-mail de teste enviado com sucesso para ${testEmail}`);
    } catch (error: any) {
      console.error('Erro no teste de e-mail:', error);
      toast.error(`Falha no envio: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };
  
  // Salvar configurações
  const handleSave = async () => {
    // Validação básica
    if (!config.smtp_host || !config.smtp_port || !config.smtp_user || !config.smtp_from) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_settings')
        .insert([{
          smtp_host: config.smtp_host,
          smtp_port: config.smtp_port,
          smtp_secure: config.smtp_secure,
          smtp_user: config.smtp_user,
          smtp_password: config.smtp_password,
          smtp_from: config.smtp_from,
          auto_send_invoices: config.auto_send_invoices,
          updated_at: new Date().toISOString()
        }]);
        
      if (error) throw error;
      
      // Também atualizar as variáveis de ambiente locais para uso imediato
      localStorage.setItem('NEXT_PUBLIC_SMTP_HOST', config.smtp_host);
      localStorage.setItem('NEXT_PUBLIC_SMTP_PORT', config.smtp_port);
      localStorage.setItem('NEXT_PUBLIC_SMTP_SECURE', String(config.smtp_secure));
      localStorage.setItem('NEXT_PUBLIC_SMTP_USER', config.smtp_user);
      localStorage.setItem('NEXT_PUBLIC_SMTP_PASSWORD', config.smtp_password);
      localStorage.setItem('NEXT_PUBLIC_SMTP_FROM', config.smtp_from);
      
      toast.success('Configurações SMTP salvas com sucesso');
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Renderização com estados de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração SMTP</CardTitle>
        <CardDescription>
          Configure as informações do servidor SMTP para envio de e-mails de faturas e notificações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Configuração Básica</TabsTrigger>
            <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
            <TabsTrigger value="test">Testar Configuração</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Servidor SMTP</Label>
                  <Input 
                    id="smtp_host" 
                    name="smtp_host" 
                    placeholder="mail.angohost.ao" 
                    value={config.smtp_host}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Porta</Label>
                  <Input 
                    id="smtp_port" 
                    name="smtp_port" 
                    placeholder="465" 
                    value={config.smtp_port}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">Usuário</Label>
                  <Input 
                    id="smtp_user" 
                    name="smtp_user" 
                    placeholder="seu-usuario@angohost.ao" 
                    value={config.smtp_user}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Senha</Label>
                  <Input 
                    id="smtp_password" 
                    name="smtp_password" 
                    type="password"
                    placeholder="••••••••••" 
                    value={config.smtp_password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp_from">E-mail de Origem</Label>
                <Input 
                  id="smtp_from" 
                  name="smtp_from" 
                  placeholder="support@angohost.ao" 
                  value={config.smtp_from}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este é o endereço que aparecerá como remetente dos e-mails
                </p>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="smtp_secure" 
                  checked={config.smtp_secure}
                  onCheckedChange={(checked) => handleSwitchChange('smtp_secure', checked)}
                />
                <Label htmlFor="smtp_secure">Usar conexão segura (SSL/TLS)</Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="auto_send_invoices" 
                  checked={config.auto_send_invoices}
                  onCheckedChange={(checked) => handleSwitchChange('auto_send_invoices', checked)}
                />
                <div>
                  <Label htmlFor="auto_send_invoices">Envio automático de faturas</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ativado, as faturas serão enviadas automaticamente por e-mail quando criadas
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Teste de configuração SMTP</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie um e-mail de teste para verificar se a sua configuração SMTP está funcionando corretamente.
                    Certifique-se de salvar suas configurações antes de fazer o teste.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input 
                    placeholder="Digite um e-mail para teste"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleTestEmail}
                  disabled={testing || !testEmail}
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar teste
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Salvar configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
