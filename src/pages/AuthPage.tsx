
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

const AuthPage = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const closeDialog = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-4">Escolha uma opção</h2>
          <div className="grid gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center"
              onClick={() => navigate('/login')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
            <Button
              className="flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600"
              onClick={() => navigate('/register')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Criar uma conta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPage;
