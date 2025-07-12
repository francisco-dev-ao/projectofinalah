
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
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Identifique-se</h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Para continuar com sua compra, faça login na sua conta ou crie uma nova.
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
