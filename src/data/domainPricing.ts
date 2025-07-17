// Interface original
export interface DomainExtension { 
  name: string;
  price: number;
  renewalPrice: number;
  description: string;
}

// Função de formatação (35.000)
export function formatKz(value: number): string {
  return value.toLocaleString('pt-PT'); // ex: 35000 → "35.000"
}

// Dados dos domínios com preços numéricos
export const domainExtensions: DomainExtension[] = [
  {
    name: ".ao",
    price: 25000,
    renewalPrice: 25000,
    description: "O domínio nacional de Angola, ideal para empresas e organizações angolanas."
  },
  {
    name: ".co.ao",
    price: 35000,
    renewalPrice: 35000,
    description: "Para empresas e entidades comerciais em Angola."
  },
  {
    name: ".org.ao",
    price: 35000,
    renewalPrice: 35000,
    description: "Destinado a organizações não governamentais e sem fins lucrativos."
  },
  {
    name: ".edu.ao",
    price: 35000,
    renewalPrice: 35000,
    description: "Exclusivo para instituições educacionais reconhecidas."
  },
  {
    name: ".it.ao",
    price: 5000,
    renewalPrice: 5000,
    description: "Para empresas e serviços de TI e tecnologia em Angola."
  }
];

// Versão formatada para exibição (preço como string formatada)
export const formattedDomainExtensions = domainExtensions.map(domain => ({
  ...domain,
  priceFormatted: formatKz(domain.price),
  renewalPriceFormatted: formatKz(domain.renewalPrice)
}));

// Map para consulta rápida com valores numéricos
export const domainPriceMap: Record<string, { price: number; renewalPrice: number }> =
  domainExtensions.reduce((acc, domain) => {
    acc[domain.name] = {
      price: domain.price,
      renewalPrice: domain.renewalPrice
    };
    return acc;
  }, {} as Record<string, { price: number; renewalPrice: number }>);
