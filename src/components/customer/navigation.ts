
import {
  Home,
  ListOrdered,
  FileText,
  Box,
  Globe,
  Wallet,
  User,
  Banknote,
  LifeBuoy,
  Settings,
  Users
} from "lucide-react";

export const navigationItems = [
  {
    title: "Dashboard",
    href: "/customer",
    icon: Home
  },
  {
    title: "Meus Pedidos",
    href: "/customer/orders",
    icon: ListOrdered
  },
  {
    title: "Minhas Faturas",
    href: "/customer/invoices",
    icon: FileText
  },
  {
    title: "Meus Serviços",
    href: "/customer/services",
    icon: Box
  },
  {
    title: "Meus Domínios",
    href: "/customer/domains",
    icon: Globe
  },
  {
    title: "Perfil de contactos",
    href: "/customer/contact-profiles",
    icon: Users
  },
  {
    title: "Minha Carteira",
    href: "/customer/wallet",
    icon: Wallet
  },
  {
    title: "Meu Perfil",
    href: "/customer/profile",
    icon: User
  },
  {
    title: "Dados Fiscais",
    href: "/customer/fiscal",
    icon: Banknote
  },
  // {
  //   title: "Suporte",
  //   href: "/customer/support",
  //   icon: LifeBuoy
  // },
  {
    title: "Configurações",
    href: "/customer/settings",
    icon: Settings
  }
];
