
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import CartLoginForm from "@/components/auth/CartLoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

interface CartAuthOptionsProps {
  onAuthSuccess: () => void;
}

const CartAuthOptions = ({ onAuthSuccess }: CartAuthOptionsProps) => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-bold text-lg">🔑</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-blue-900">Identifique-se</h2>
          <p className="text-blue-700 text-sm">Acesso necessário para continuar</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm font-medium">
          ✨ Para continuar com sua compra e garantir a segurança da transação, faça login na sua conta ou crie uma nova.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
            Já tenho conta
          </TabsTrigger>
          <TabsTrigger value="register" className="py-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Criar nova conta
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <CartLoginForm onAuthSuccess={onAuthSuccess} />
        </TabsContent>
        
        <TabsContent value="register">
          <RegisterForm onAuthSuccess={onAuthSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CartAuthOptions;
