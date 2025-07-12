
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const CustomerSettings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setPasswordUpdateLoading(true);

    try {
      // Utilize o método correto do Auth Context para alteração de senha
      // Este era o erro: AuthContext não tem updatePassword, precisa usar o metodo certo
      await user?.updatePassword(newPassword);
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar a senha.");
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
      toast.success("Logout efetuado com sucesso!");
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout.");
    } finally {
      setSignOutLoading(false);
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Configurações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Update Password Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Atualizar Senha</h3>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleUpdatePassword}
              disabled={passwordUpdateLoading}
            >
              {passwordUpdateLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Senha"
              )}
            </Button>
          </div>

          {/* Sign Out Section */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-semibold">Sair da Conta</h3>
            <p className="text-sm text-muted-foreground">
              Uma vez que você saia, será necessário fazer login novamente.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
              disabled={signOutLoading}
            >
              {signOutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saindo...
                </>
              ) : (
                "Sair da Conta"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerSettings;
