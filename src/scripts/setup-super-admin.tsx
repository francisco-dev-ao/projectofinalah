
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SetupSuperAdmin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const adminEmail = 'lania@angohost.co.ao';

  useEffect(() => {
    setupSuperAdmin();
  }, []);

  const setupSuperAdmin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('setup-super-admin', {
        body: { email: adminEmail }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setResult(data);
      
      if (data.message?.includes('already exists')) {
        toast.info(`Usuário ${adminEmail} já é Super Administrador`);
      } else if (data.message?.includes('promoted')) {
        toast.success(`Usuário ${adminEmail} promovido a Super Administrador`);
      } else if (data.message?.includes('created')) {
        toast.success(`Usuário Super Administrador criado: ${adminEmail}`);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao configurar Super Administrador');
      toast.error(`Erro ao configurar Super Admin: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirect = () => {
    navigate('/admin');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuração de Super Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p>Configurando conta de Super Admin...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <h3 className="text-red-800 font-medium">Erro</h3>
              <p className="text-red-700">{error}</p>
            </div>
          ) : result ? (
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="text-green-800 font-medium">Sucesso</h3>
              <p className="text-green-700">
                {result.message || `Conta de Super Admin configurada para ${adminEmail}`}
              </p>
              {result.user && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.user, null, 2)}
                </pre>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleRedirect}>
            Ir para o Painel Admin
          </Button>
          <Button 
            onClick={setupSuperAdmin} 
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Reconfigurar"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SetupSuperAdmin;
