
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSupport?: boolean;
};

const ProtectedRoute = ({ children, requireAdmin = false, requireSupport = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, isAdmin, isSupport, profile } = useAuth();

  // Exibir um loader enquanto verificamos a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-2 text-gray-600">Carregando...</p>
      </div>
    );
  }

  // Não autenticado - redirecionar para o login
  if (!isAuthenticated || !user) {
    console.log("Usuário não autenticado, redirecionando para /login");
    return <Navigate to="/login" replace />;
  }

  // Verificação de permissão de administrador
  if (requireAdmin) {
    const hasAccess = isAdmin();
    if (!hasAccess) {
      console.log("Usuário não é admin, redirecionando para /");
      return <Navigate to="/" replace />;
    }
  }

  // Verificação de permissão de suporte
  if (requireSupport) {
    const hasAccess = isSupport();
    if (!hasAccess) {
      console.log("Usuário não é suporte, redirecionando para /");
      return <Navigate to="/" replace />;
    }
  }

  // Usuário está autenticado e tem o papel apropriado
  console.log("Usuário autenticado com acesso", { profile });
  return <>{children}</>;
};

export default ProtectedRoute;
