import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface CustomerHeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const CustomerHeader = ({ sidebarOpen, toggleSidebar }: CustomerHeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-primary/95 to-indigo-700/95 text-white py-4 px-4 lg:px-8 shadow-lg sticky top-0 z-30 backdrop-blur-sm border-b border-primary/10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar}
            className="mr-2 text-white hover:text-white hover:bg-white/10 lg:hidden transition-all duration-200"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          
          <Link to="/" className="flex items-center mr-8 group">
            <img 
              src="/ANGOHOST-02.png" 
              alt="AngoHost Logo" 
              className="h-9 w-auto mr-2 transition-all duration-300 group-hover:scale-105" 
            />
          </Link>
        </div>
        
        {/* User actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 text-white bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
            >
              Ir para o site
            </Button>
          </Link>
          <Link to="/login">
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-primary bg-white hover:bg-gray-100 transition-all duration-200 hover:scale-105 font-medium"
            >
              Sair
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;
