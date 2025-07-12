import React from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SafeCartProvider } from "@/contexts/SafeCartProvider";
import { queryClient } from "@/utils/queryClient";
import { Toaster as HotToast } from 'react-hot-toast';
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Component that wraps the application with all necessary providers
 */
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Use session timeout hook - automatically logout after 60 minutes of inactivity
  useSessionTimeout({
    timeoutMinutes: 60,
    warningMinutes: 5,
    showWarning: true,
  });

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Only use Sonner for toast notifications to prevent duplicates */}
          <Sonner closeButton={true} />
          <BrowserRouter>
            <AuthProvider>
              <SafeCartProvider>
                {children}
              </SafeCartProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default AppProviders;
