
import { LucideIcon, LayoutDashboard, Package, Users, Globe, Server, Mail, Receipt, FileText, Settings, DollarSign, Shield, Database, Trash2, CreditCard, PenTool } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const sidebarNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Visão geral do sistema"
  },
  {
    title: "Pedidos",
    href: "/admin/orders",
    icon: Package,
    description: "Gerir pedidos dos clientes"
  },
  {
    title: "Faturas",
    href: "/admin/invoices",
    icon: Receipt,
    description: "Gerir faturas"
  },
  {
    title: "Pagamentos",
    href: "/admin/payments",
    icon: DollarSign,
    description: "Gerir pagamentos"
  },
  {
    title: "Multicaixa Referências",
    href: "/admin/multicaixa-references",
    icon: CreditCard,
    description: "Gerir pagamentos por referência"
  },
  {
    title: "Gestão de Conteúdo",
    href: "/admin/content-management", 
    icon: PenTool,
    description: "Gerir conteúdo do site"
  },
  {
    title: "Gestão em Massa",
    href: "/admin/bulk-management",
    icon: Trash2,
    description: "Excluir múltiplos itens"
  },
  {
    title: "Usuários",
    href: "/admin/users",
    icon: Users,
    description: "Gerir usuários"
  },
  {
    title: "Domínios",
    href: "/admin/domains",
    icon: Globe,
    description: "Gerir domínios"
  },
  {
    title: "Hospedagem",
    href: "/admin/hosting",
    icon: Server,
    description: "Gerir serviços de hospedagem"
  },
  {
    title: "Email",
    href: "/admin/email-orders",
    icon: Mail,
    description: "Gerir serviços de email"
  },
  {
    title: "Configurações",
    href: "/admin/settings",
    icon: Settings,
    description: "Configurações do sistema"
  },
  {
    title: "Segurança",
    href: "/admin/security",
    icon: Shield,
    description: "Gerir segurança"
  },
  {
    title: "Limpeza de Dados",
    href: "/admin/data-cleanup",
    icon: Database,
    description: "Limpar dados antigos"
  }
];
