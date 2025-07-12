
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";

const UserCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { role } = useAdminAuth();
  const navigate = useNavigate();

  // Check if user has admin rights
  if (role !== 'admin' && role !== 'super_admin') {
    navigate("/admin");
    toast.error("Você não tem permissão para acessar esta página");
    return null;
  }

  const handleDeleteSpecificUser = async () => {
    if (!confirm("ATENÇÃO: Isso irá deletar permanentemente o usuário deve@joao.ao e todos seus dados relacionados. Continuar?")) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-specific-user', {
        body: {}
      });
      
      if (error) throw error;
      
      setResult(data);
      toast.success("Usuário e todos seus dados foram excluídos com sucesso");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário: " + error.message);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Limpeza de Usuário Específico</h1>
          <p className="text-muted-foreground">
            Ferramenta de administração para excluir usuários específicos e todos seus dados relacionados
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Excluir Usuário deve@joao.ao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Aviso de Exclusão Permanente</AlertTitle>
              <AlertDescription>
                Esta ação excluirá permanentemente o usuário deve@joao.ao junto com todos os pedidos, 
                serviços, faturas e dados relacionados. Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                onClick={handleDeleteSpecificUser} 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Excluindo..." : "Excluir Usuário e Todos os Dados"}
              </Button>
            </div>
            
            {result && (
              <div className="mt-4">
                {result.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                      {result.error}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>
                      {result.message || "Usuário excluído com sucesso"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UserCleanup;
