
import { cn } from "@/lib/utils";

interface CustomerLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const CustomerLayout = ({ children, className }: CustomerLayoutProps) => {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  );
};

export default CustomerLayout;
