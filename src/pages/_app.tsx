
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import '../index.css';

const queryClient = new QueryClient();

interface AppProps {
  children: React.ReactNode;
}

export default function App({ children }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
