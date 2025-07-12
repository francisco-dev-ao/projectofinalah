
export interface DomainExtension {
  name: string;
  price: number;
  renewalPrice: number;
  description: string;
}

// Updated domain pricing data with registration and renewal prices
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

// Map for quick lookups by extension name
export const domainPriceMap: Record<string, {price: number, renewalPrice: number}> = domainExtensions.reduce((acc, domain) => {
  acc[domain.name] = {
    price: domain.price,
    renewalPrice: domain.renewalPrice
  };
  return acc;
}, {} as Record<string, {price: number, renewalPrice: number}>);
