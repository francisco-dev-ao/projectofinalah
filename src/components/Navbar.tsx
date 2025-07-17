import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X, User, ChevronDown, LogOut, Home, Settings, UserCheck, Contact, Server, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useMobileDetect } from "@/hooks/use-mobile";

const Navbar = () => {
  const navigate = useNavigate();
  const isMobile = useMobileDetect();
  const location = useLocation();
  const { isAuthenticated, signOut, user, profile, isAdmin } = useAuth();
  const { cartItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  
  const cartItemsCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const isActiveStartsWith = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Oferta limitada */}
      {/* <div className="w-full bg-[#273d74] text-white text-center py-3 font-semibold text-sm">
        Economize até 75% na Hospedagem Web | Oferta por tempo limitado!
      </div> */}
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/ANGOHOST-01.png" alt="Logo" className="h-12 w-auto" />
          </Link>
        </div>
        {/* Menu centralizado à direita, mais afastado da logo */}
        <nav className="hidden md:flex items-center space-x-2 bg-muted/40 p-1 rounded-lg ml-24">
          <Link
            to="/hospedagem"
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors border-b-2",
              isActive('/hospedagem') ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
            )}
          >
            Hospedagem
          </Link>
          <Link
            to="/dominios"
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors border-b-2",
              isActive('/dominios') ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
            )}
          >
            Registrar Domínios
          </Link>
          <Link
            to="/email"
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors border-b-2",
              isActive('/email') ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
            )}
          >
            Email Corporativo
          </Link>
          <Link
            to="/contacto"
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors border-b-2",
              isActive('/contacto') ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"
            )}
          >
            Contacto
          </Link>
        </nav>
        {/* Botões à direita */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu} 
            className="block md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link to="/cart" className="relative mr-2">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </Link>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size={isMobile ? "icon" : "default"} className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {!isMobile && <span>Minha Conta</span>}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{profile?.name || user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/customer')}>
                  <Home className="mr-2 h-4 w-4" /> Área do Cliente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/customer/orders')}>
                  <List className="mr-2 h-4 w-4" /> Meus Pedidos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/customer/services')}>
                  <Server className="mr-2 h-4 w-4" /> Meus Serviços
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/customer/profile')}>
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <UserCheck className="mr-2 h-4 w-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size={isMobile ? "icon" : "default"} onClick={() => navigate('/login')}>
              <User className="h-5 w-5 mr-2" />
              {!isMobile && "Entrar"}
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t p-4 bg-white space-y-4">
          <Link
            to="/dominios"
            className="block py-2 text-sm font-medium hover:text-primary"
            onClick={toggleMenu}
          >
            Registrar Domínios
          </Link>
          <Link
            to="/hospedagem"
            className="block py-2 text-sm font-medium hover:text-primary"
            onClick={toggleMenu}
          >
            Hospedagem
          </Link>
          <Link
            to="/email"
            className="block py-2 text-sm font-medium hover:text-primary"
            onClick={toggleMenu}
          >
            Email Corporativo
          </Link>
          <Link
            to="/exchange"
            className="block py-2 text-sm font-medium hover:text-primary"
            onClick={toggleMenu}
          >
            Exchange
          </Link>
          <Link
            to="/contacto"
            className="block py-2 text-sm font-medium hover:text-primary"
            onClick={toggleMenu}
          >
            Contacto
          </Link>
          
          {!isAuthenticated ? (
            <div className="pt-2 border-t">
              <Link to="/login">
                <Button className="w-full mb-2" onClick={toggleMenu}>Entrar</Button>
              </Link>
              <Link to="/registro">
                <Button variant="outline" className="w-full" onClick={toggleMenu}>Registrar</Button>
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t">
              <Link to="/customer">
                <Button className="w-full mb-2" onClick={toggleMenu}>Área do Cliente</Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={handleLogout}>Sair</Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
