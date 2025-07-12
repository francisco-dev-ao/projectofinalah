import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, FileText, AlertTriangle, Plus, Edit, Trash2, Save } from "lucide-react";

interface SiteContent {
  id?: string;
  page: string;
  section: string;
  content: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TldConfig {
  id?: string;
  tld: string;
  price: number;
  is_active: boolean;
  required_documents: string[];
  description: string;
  created_at?: string;
}

interface BannerConfig {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  show_until?: string;
  created_at?: string;
}

const ContentManagement = () => {
  const { user, profile, isLoading } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para conteúdo do site
  const [siteContents, setSiteContents] = useState<SiteContent[]>([]);
  const [newContent, setNewContent] = useState<SiteContent>({
    page: "home",
    section: "",
    content: "",
    is_active: true
  });

  // Estados para TLDs
  const [tlds, setTlds] = useState<TldConfig[]>([]);
  const [newTld, setNewTld] = useState<TldConfig>({
    tld: "",
    price: 0,
    is_active: true,
    required_documents: [],
    description: ""
  });

  // Estados para banners
  const [banners, setBanners] = useState<BannerConfig[]>([]);
  const [newBanner, setNewBanner] = useState<BannerConfig>({
    title: "",
    message: "",
    type: "info",
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSiteContent(),
        loadTlds(),
        loadBanners()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadSiteContent = async () => {
    // Mock data - implementar consulta real
    const mockContent: SiteContent[] = [
      {
        id: "1",
        page: "home",
        section: "hero_title",
        content: "Seu Domínio .AO Agora!",
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        page: "home",
        section: "hero_subtitle",
        content: "Registre seu domínio .ao e .co.ao com facilidade e segurança",
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: "3",
        page: "footer",
        section: "company_info",
        content: "AngoHost - Soluções em domínios e hospedagem para Angola",
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
    setSiteContents(mockContent);
  };

  const loadTlds = async () => {
    // Mock data - implementar consulta real
    const mockTlds: TldConfig[] = [
      {
        id: "1",
        tld: ".ao",
        price: 15000,
        is_active: true,
        required_documents: ["Certificado de Marca", "NIF da Empresa"],
        description: "Domínio nacional de Angola",
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        tld: ".co.ao",
        price: 12000,
        is_active: true,
        required_documents: ["Certificado Comercial", "NIF"],
        description: "Domínio comercial de Angola",
        created_at: new Date().toISOString()
      },
      {
        id: "3",
        tld: ".gov.ao",
        price: 0,
        is_active: false,
        required_documents: ["Documento Governamental"],
        description: "Domínio exclusivo para instituições governamentais",
        created_at: new Date().toISOString()
      }
    ];
    setTlds(mockTlds);
  };

  const loadBanners = async () => {
    // Mock data - implementar consulta real
    const mockBanners: BannerConfig[] = [
      {
        id: "1",
        title: "Promoção Especial",
        message: "Registre seu domínio .ao com 20% de desconto até o final do mês!",
        type: "success",
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
    setBanners(mockBanners);
  };

  const saveSiteContent = async (content: SiteContent) => {
    try {
      setSaving(true);
      
      // Implementar salvamento real no Supabase
      if (content.id) {
        // Atualizar existente
        setSiteContents(prev => 
          prev.map(c => c.id === content.id ? { ...content, updated_at: new Date().toISOString() } : c)
        );
      } else {
        // Criar novo
        const newId = Date.now().toString();
        setSiteContents(prev => [...prev, { 
          ...content, 
          id: newId, 
          created_at: new Date().toISOString() 
        }]);
        setNewContent({
          page: "home",
          section: "",
          content: "",
          is_active: true
        });
      }
      
      toast.success("Conteúdo salvo com sucesso!");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  };

  const saveTld = async (tld: TldConfig) => {
    try {
      setSaving(true);
      
      if (tld.id) {
        // Atualizar existente
        setTlds(prev => 
          prev.map(t => t.id === tld.id ? tld : t)
        );
      } else {
        // Criar novo
        const newId = Date.now().toString();
        setTlds(prev => [...prev, { 
          ...tld, 
          id: newId, 
          created_at: new Date().toISOString() 
        }]);
        setNewTld({
          tld: "",
          price: 0,
          is_active: true,
          required_documents: [],
          description: ""
        });
      }
      
      toast.success("TLD salvo com sucesso!");
    } catch (error) {
      console.error("Error saving TLD:", error);
      toast.error("Erro ao salvar TLD");
    } finally {
      setSaving(false);
    }
  };

  const saveBanner = async (banner: BannerConfig) => {
    try {
      setSaving(true);
      
      if (banner.id) {
        // Atualizar existente
        setBanners(prev => 
          prev.map(b => b.id === banner.id ? banner : b)
        );
      } else {
        // Criar novo
        const newId = Date.now().toString();
        setBanners(prev => [...prev, { 
          ...banner, 
          id: newId, 
          created_at: new Date().toISOString() 
        }]);
        setNewBanner({
          title: "",
          message: "",
          type: "info",
          is_active: true
        });
      }
      
      toast.success("Banner salvo com sucesso!");
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("Erro ao salvar banner");
    } finally {
      setSaving(false);
    }
  };

  const deleteSiteContent = async (id: string) => {
    try {
      setSiteContents(prev => prev.filter(c => c.id !== id));
      toast.success("Conteúdo removido com sucesso!");
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Erro ao remover conteúdo");
    }
  };

  const deleteTld = async (id: string) => {
    try {
      setTlds(prev => prev.filter(t => t.id !== id));
      toast.success("TLD removido com sucesso!");
    } catch (error) {
      console.error("Error deleting TLD:", error);
      toast.error("Erro ao remover TLD");
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success("Banner removido com sucesso!");
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Erro ao remover banner");
    }
  };

  const formatCurrency = (amount: number) => {
    return `KZ ${new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(amount)}`;
  };

  const getBannerTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">Acesso Negado</h3>
          <p className="text-muted-foreground mt-1">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Conteúdo</h1>
            <p className="text-muted-foreground">
              Gerencie todo o conteúdo do site, TLDs e banners
            </p>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Conteúdo do Site</TabsTrigger>
            <TabsTrigger value="tlds">TLDs e Preços</TabsTrigger>
            <TabsTrigger value="banners">Banners e Avisos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            {/* Adicionar novo conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Adicionar Novo Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Página</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newContent.page}
                      onChange={(e) => setNewContent({ ...newContent, page: e.target.value })}
                    >
                      <option value="home">Home</option>
                      <option value="about">Sobre</option>
                      <option value="services">Serviços</option>
                      <option value="contact">Contacto</option>
                      <option value="terms">Termos</option>
                      <option value="privacy">Política de Privacidade</option>
                      <option value="footer">Rodapé</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Seção</Label>
                    <Input
                      value={newContent.section}
                      onChange={(e) => setNewContent({ ...newContent, section: e.target.value })}
                      placeholder="ex: hero_title, about_text"
                    />
                  </div>
                  
                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newContent.is_active}
                        onCheckedChange={(checked) => setNewContent({ ...newContent, is_active: checked })}
                      />
                      <Label>Ativo</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={newContent.content}
                    onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                    placeholder="Conteúdo do texto..."
                    rows={4}
                  />
                </div>
                
                <Button onClick={() => saveSiteContent(newContent)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Conteúdo"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de conteúdos */}
            <Card>
              <CardHeader>
                <CardTitle>Conteúdos Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Página</TableHead>
                      <TableHead>Seção</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteContents.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="capitalize">{content.page}</TableCell>
                        <TableCell>{content.section}</TableCell>
                        <TableCell className="max-w-md truncate">{content.content}</TableCell>
                        <TableCell>
                          <Badge variant={content.is_active ? "default" : "secondary"}>
                            {content.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => content.id && deleteSiteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tlds" className="space-y-4">
            {/* Adicionar novo TLD */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Adicionar Novo TLD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>TLD</Label>
                    <Input
                      value={newTld.tld}
                      onChange={(e) => setNewTld({ ...newTld, tld: e.target.value })}
                      placeholder=".ao"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Preço (AOA)</Label>
                    <Input
                      type="number"
                      value={newTld.price}
                      onChange={(e) => setNewTld({ ...newTld, price: parseFloat(e.target.value) || 0 })}
                      placeholder="15000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={newTld.is_active}
                        onCheckedChange={(checked) => setNewTld({ ...newTld, is_active: checked })}
                      />
                      <Label>Ativo</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={newTld.description}
                    onChange={(e) => setNewTld({ ...newTld, description: e.target.value })}
                    placeholder="Descrição do TLD"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Documentos Necessários</Label>
                  <Textarea
                    value={newTld.required_documents.join(', ')}
                    onChange={(e) => setNewTld({ 
                      ...newTld, 
                      required_documents: e.target.value.split(',').map(doc => doc.trim()).filter(doc => doc)
                    })}
                    placeholder="Certificado de Marca, NIF da Empresa (separados por vírgula)"
                    rows={2}
                  />
                </div>
                
                <Button onClick={() => saveTld(newTld)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar TLD"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de TLDs */}
            <Card>
              <CardHeader>
                <CardTitle>TLDs Configurados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TLD</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tlds.map((tld) => (
                      <TableRow key={tld.id}>
                        <TableCell className="font-mono">{tld.tld}</TableCell>
                        <TableCell>{formatCurrency(tld.price)}</TableCell>
                        <TableCell>{tld.description}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {tld.required_documents.slice(0, 2).map(doc => (
                              <span key={doc} className="block">{doc}</span>
                            ))}
                            {tld.required_documents.length > 2 && (
                              <span className="text-muted-foreground">
                                +{tld.required_documents.length - 2} mais
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tld.is_active ? "default" : "secondary"}>
                            {tld.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => tld.id && deleteTld(tld.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            {/* Adicionar novo banner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Adicionar Novo Banner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={newBanner.title}
                      onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                      placeholder="Título do banner"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newBanner.type}
                      onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value as any })}
                    >
                      <option value="info">Informação</option>
                      <option value="success">Sucesso</option>
                      <option value="warning">Aviso</option>
                      <option value="error">Erro</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    value={newBanner.message}
                    onChange={(e) => setNewBanner({ ...newBanner, message: e.target.value })}
                    placeholder="Mensagem do banner..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newBanner.is_active}
                    onCheckedChange={(checked) => setNewBanner({ ...newBanner, is_active: checked })}
                  />
                  <Label>Ativo</Label>
                </div>
                
                <Button onClick={() => saveBanner(newBanner)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Banner"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de banners */}
            <Card>
              <CardHeader>
                <CardTitle>Banners Configurados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell className="font-medium">{banner.title}</TableCell>
                        <TableCell className="max-w-md truncate">{banner.message}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${getBannerTypeColor(banner.type)}`}>
                            {banner.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={banner.is_active ? "default" : "secondary"}>
                            {banner.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => banner.id && deleteBanner(banner.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ContentManagement;