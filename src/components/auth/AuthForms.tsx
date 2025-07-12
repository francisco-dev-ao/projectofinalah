
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthFormsProps {
  onAuthSuccess: () => void;
}

const AuthForms = ({ onAuthSuccess }: AuthFormsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Verificar se existe um parâmetro de redirecionamento na URL
  useEffect(() => {
    // Verificar parâmetro 'next' na URL
    const searchParams = new URLSearchParams(location.search);
    const nextPath = searchParams.get('next');
    
    if (nextPath) {
      setRedirectPath(nextPath);
      // Store in session
      sessionStorage.setItem('authRedirectPath', nextPath);
    } else {
      // Se não houver, podemos verificar o sessionStorage
      const storedPath = sessionStorage.getItem('authRedirectPath');
      if (storedPath) {
        setRedirectPath(storedPath);
      }
    }
  }, [location]);

  // Handle successful authentication
  const handleAuthSuccess = () => {
    // Clear the stored path
    sessionStorage.removeItem('authRedirectPath');
    
    // Call the parent callback to handle redirection or other logic
    onAuthSuccess();
  };

  return (
    <div className="p-4 bg-white rounded-lg border shadow-sm">
      <div className="mb-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-yellow-400">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                ⚠️ Crie sua conta para continuar com o pedido.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="register" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white">Criar uma conta</TabsTrigger>
          <TabsTrigger value="login" className="py-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white">Já tenho conta</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <LoginForm onAuthSuccess={handleAuthSuccess} />
        </TabsContent>
        
        <TabsContent value="register">
          <RegisterForm onAuthSuccess={handleAuthSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForms;
