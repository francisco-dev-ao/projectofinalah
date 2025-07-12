
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const PromoteAdmin = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const promoteToAdmin = async () => {
    if (!email) {
      toast.error('Por favor, insira um email');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('promote-to-super-admin', {
        body: { email }
      });
      
      if (error) throw error;
      
      toast.success(`${email} foi promovido para administrador com sucesso!`);
      setEmail('');
    } catch (error: any) {
      console.error('Error promoting admin:', error);
      toast.error(`Erro ao promover administrador: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Promover Usuário para Administrador</CardTitle>
          <CardDescription>
            Insira o email do usuário que deseja promover para administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="space-y-2">
              <label htmlFor="email">Email do Usuário</label>
              <Input 
                id="email"
                type="email" 
                placeholder="usuario@exemplo.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={promoteToAdmin} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Promovendo...' : 'Promover para Administrador'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PromoteAdmin;
