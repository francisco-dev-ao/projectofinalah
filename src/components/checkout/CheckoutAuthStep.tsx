
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import AuthForms from "@/components/auth/AuthForms";
import { ShieldCheck } from "lucide-react";

interface CheckoutAuthStepProps {
  onAuthSuccess: () => void;
}

const CheckoutAuthStep = ({ onAuthSuccess }: CheckoutAuthStepProps) => {
  return (
    <motion.div 
      className="max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-1">Autenticação</h2>
          <p className="text-muted-foreground">
            Faça login ou crie uma conta para continuar
          </p>
        </div>
        
        <CardContent className="p-6">
          <AuthForms onAuthSuccess={onAuthSuccess} />
          
          <div className="mt-6 pt-4 border-t flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck size={16} className="text-green-600" />
            <span>Seus dados estão protegidos</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CheckoutAuthStep;
