import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Save,
  Globe,
  Calendar,
  User,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/utils/formatters';

// Define tipos para o formulário e o domínio
interface DomainFormData {
  domain_name: string;
  tld: string;
  status: 'active' | 'pending' | 'expired' | 'transferred';
  auto_renew: boolean;
  privacy_protection: boolean;
  registration_date: string;
  expiration_date: string;
  nameservers: string[];
  auth_code?: string;
  notes?: string;
  user_id: string;
}

const DomainEdit = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any[]>([]);
  const [currentNameserver, setCurrentNameserver] = useState('');

  // Estado inicial do formulário
  const [formData, setFormData] = useState<DomainFormData>({
    domain_name: '',
    tld: '',
    status: 'pending',
    auto_renew: false,
    privacy_protection: false,
    registration_date: new Date().toISOString(),
    expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    nameservers: [],
    user_id: ''
  });

  // Carregar dados do domínio
  useEffect(() => {
    const loadDomain = async () => {
      if (!domainId) return;
      
      try {
        setLoading(true);
        
        // Buscar dados do domínio
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .select('*, profiles:user_id(id, name, email, company_name)')
          .eq('id', domainId)
          .single();
        
        if (domainError) {
          throw domainError;
        }
        
        // Formatar os dados para o formulário
        setFormData({
          domain_name: domainData.domain_name || '',
          tld: domainData.tld || '',
          status: domainData.status || 'pending',
          auto_renew: !!domainData.auto_renew,
          privacy_protection: !!domainData.privacy_protection,
          registration_date: domainData.registration_date || new Date().toISOString(),
          expiration_date: domainData.expiration_date || new Date().toISOString(),
          nameservers: domainData.nameservers || [],
          auth_code: domainData.auth_code || '',
          notes: domainData.notes || '',
          user_id: domainData.user_id || ''
        });
        
        // Carregar lista de usuários
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, email, company_name')
          .order('name', { ascending: true });
        
        if (usersError) {
          throw usersError;
        }
        
        setUserData(users || []);
      } catch (err: any) {
        console.error('Erro ao carregar domínio:', err);
        setError(err.message || 'Não foi possível carregar os dados do domínio');
        toast.error('Erro ao carregar domínio');
      } finally {
        setLoading(false);
      }
    };
    
    loadDomain();
  }, [domainId]);
  
  // Atualizar campo do formulário
  const handleChange = (field: keyof DomainFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Adicionar nameserver à lista
  const addNameserver = () => {
    if (currentNameserver && !formData.nameservers.includes(currentNameserver)) {
      setFormData(prev => ({
        ...prev,
        nameservers: [...prev.nameservers, currentNameserver]
      }));
      setCurrentNameserver('');
    }
  };
  
  // Remover nameserver da lista
  const removeNameserver = (ns: string) => {
    setFormData(prev => ({
      ...prev,
      nameservers: prev.nameservers.filter(item => item !== ns)
    }));
  };
  
  // Salvar alterações do domínio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Atualizar o domínio no Supabase
      const { error } = await supabase
        .from('domains')
        .update({
          domain_name: formData.domain_name,
          tld: formData.tld,
          status: formData.status,
          auto_renew: formData.auto_renew,
          privacy_protection: formData.privacy_protection,
          registration_date: formData.registration_date,
          expiration_date: formData.expiration_date,
          nameservers: formData.nameservers,
          auth_code: formData.auth_code,
          notes: formData.notes,
          user_id: formData.user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);
      
      if (error) {
        throw error;
      }
      
      toast.success('Domínio atualizado com sucesso!');
      navigate('/admin/domains');
    } catch (err: any) {
      console.error('Erro ao atualizar domínio:', err);
      toast.error('Não foi possível atualizar o domínio');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando dados do domínio...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/admin/domains" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Gestão de Domínios
            </Link>
          </Button>
          
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
                <p className="text-lg font-medium mb-2">Não foi possível carregar o domínio</p>
                <p className="text-muted-foreground">{error}</p>
                <Button asChild className="mt-4">
                  <Link to="/admin/domains">Voltar para Gestão de Domínios</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/admin/domains" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Gestão de Domínios
            </Link>
          </Button>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              <Globe className="mr-2 h-6 w-6" />
              Editar Domínio: {formData.domain_name}.{formData.tld}
            </h1>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Detalhes principais do domínio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain_name">Nome do Domínio</Label>
                    <Input 
                      id="domain_name"
                      value={formData.domain_name}
                      onChange={(e) => handleChange('domain_name', e.target.value)}
                      placeholder="exemplo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tld">TLD</Label>
                    <Select 
                      value={formData.tld} 
                      onValueChange={(value) => handleChange('tld', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o TLD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="co.ao">co.ao</SelectItem>
                        <SelectItem value="ao">ao</SelectItem>
                        <SelectItem value="org.ao">org.ao</SelectItem>
                        <SelectItem value="ed.ao">ed.ao</SelectItem>
                        <SelectItem value="gv.ao">gv.ao</SelectItem>
                        <SelectItem value="com">com</SelectItem>
                        <SelectItem value="net">net</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: any) => handleChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                        <SelectItem value="transferred">Transferido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user_id">Proprietário</Label>
                    <Select 
                      value={formData.user_id} 
                      onValueChange={(value) => handleChange('user_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o proprietário" />
                      </SelectTrigger>
                      <SelectContent>
                        {userData.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registration_date">Data de Registro</Label>
                    <Input
                      id="registration_date"
                      type="datetime-local"
                      value={formData.registration_date ? new Date(formData.registration_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleChange('registration_date', new Date(e.target.value).toISOString())}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiration_date">Data de Expiração</Label>
                    <Input
                      id="expiration_date"
                      type="datetime-local"
                      value={formData.expiration_date ? new Date(formData.expiration_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleChange('expiration_date', new Date(e.target.value).toISOString())}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Configurações adicionais do domínio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="auto_renew" className="mb-1 block">Auto Renovação</Label>
                    <p className="text-sm text-muted-foreground">Renovar automaticamente o domínio antes da expiração</p>
                  </div>
                  <Switch 
                    id="auto_renew"
                    checked={formData.auto_renew}
                    onCheckedChange={(checked) => handleChange('auto_renew', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="privacy_protection" className="mb-1 block">Proteção de Privacidade</Label>
                    <p className="text-sm text-muted-foreground">Protege as informações pessoais do proprietário</p>
                  </div>
                  <Switch 
                    id="privacy_protection"
                    checked={formData.privacy_protection}
                    onCheckedChange={(checked) => handleChange('privacy_protection', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auth_code">Código de Autorização</Label>
                  <Input 
                    id="auth_code"
                    value={formData.auth_code || ''}
                    onChange={(e) => handleChange('auth_code', e.target.value)}
                    placeholder="Código de autorização para transferência"
                  />
                  <p className="text-xs text-muted-foreground">
                    Código necessário para transferir o domínio para outro registrador
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea 
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Notas adicionais sobre este domínio"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nameservers</CardTitle>
                <CardDescription>Configure os nameservers para este domínio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nameserver">Adicionar Nameserver</Label>
                    <div className="flex mt-1 space-x-2">
                      <Input
                        id="nameserver"
                        value={currentNameserver}
                        onChange={(e) => setCurrentNameserver(e.target.value)}
                        placeholder="ns1.exemplo.com"
                      />
                      <Button type="button" onClick={addNameserver}>Adicionar</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.nameservers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum nameserver configurado. Adicione pelo menos dois nameservers.
                      </p>
                    ) : (
                      formData.nameservers.map((ns, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="font-mono">{ns}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeNameserver(ns)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/domains')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default DomainEdit; 