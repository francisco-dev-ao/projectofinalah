
import { useState, useEffect, useRef } from "react";
import { Domain } from "@/services/domain/types";
import { useDomainOrders } from "./useDomainOrders";
import { getUserDomains } from "@/services/domain/domainService";
import { supabase } from "@/integrations/supabase/client";

export interface DisplayDomain {
  id: string;
  domain_name: string;
  tld: string;
  source: "database" | "order";
  status: string;
  registration_date?: string;
  expiration_date?: string;
  order_status?: string;
  order_id?: string;
}

interface UseAllCustomerDomains {
  domains: DisplayDomain[];
  loading: boolean;
  reload: () => Promise<void>;
}

export function useAllCustomerDomains(userId?: string): UseAllCustomerDomains {
  const [domains, setDomains] = useState<DisplayDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const ordersRef = useRef<any[]>([]);

  // Buscar domínios já registrados
  const fetchRegisteredDomains = async () => {
    if (!userId) return [];
    
    // Buscar da tabela domains (domínios já processados)
    const { domains: registeredDomains } = await getUserDomains(userId);
    console.log("Domínios registrados (domains table):", registeredDomains);
    
    // Buscar da tabela domain_orders (domínios dos pedidos)
    const { data: domainOrders, error } = await supabase
      .from('domain_orders')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Erro ao buscar domain_orders:", error);
    } else {
      console.log("Domínios de pedidos (domain_orders table):", domainOrders);
    }
    
    // Combinar ambas as fontes
    const allDomains = [
      ...registeredDomains,
      ...(domainOrders || []).map(order => ({
        id: order.id,
        domain_name: order.domain_name,
        tld: order.tld_type || 'ao',
        status: order.status || 'pending',
        registration_date: order.created_at,
        expiration_date: null,
        user_id: order.user_id
      }))
    ];
    
    return allDomains as Domain[];
  };

  // Buscar domínios presentes nos pedidos do usuário
  const { orders, loading: ordersLoading, loadDomainOrders } = useDomainOrders(userId);

  useEffect(() => {
    ordersRef.current = orders;
    // log dos pedidos de domínio
    console.log("Pedidos de domínio carregados:", orders);
  }, [orders]);

  const process = async () => {
    setLoading(true);
    try {
      const registeredDomains = userId ? await fetchRegisteredDomains() : [];
      const registeredKeys = new Set(
        registeredDomains.map((d) => `${d.domain_name.trim().toLowerCase()}.${d.tld.trim().toLowerCase()}`)
      );

      // Domínios extraídos dos itens dos pedidos
      const orderDomainsArr: DisplayDomain[] = [];
      for (const order of ordersRef.current) {
        if (!order.order_items) continue;
        for (const item of order.order_items) {
          // Use name field only
          const rawName = (item.name || "").trim().toLowerCase();

          console.log('Processing order item:', item, 'rawName:', rawName);

          // Enhanced regex to catch more .ao domain patterns
          const domainPatterns = [
            // Standard domain format: minhaempresa.ao, minhaempresa.co.ao, etc.
            /([a-z0-9][-a-z0-9]*\.(?:ao|co\.ao|org\.ao|edu\.ao|it\.ao|gov\.ao))/gi,
            // Flexible patterns for various formats
            /([a-z0-9][-a-z0-9]*)\s*[:\-\s]+\s*(ao|co\.ao|org\.ao|edu\.ao|it\.ao|gov\.ao)/gi,
            // Domain with spaces: "minhaempresa ao" or "minhaempresa co ao"
            /([a-z0-9][-a-z0-9]*)\s+(co\s+)?ao\b/gi
          ];

          let domainFound = false;
          
          for (const pattern of domainPatterns) {
            const matches = [...rawName.matchAll(pattern)];
            
            for (const match of matches) {
              let domain_name = '';
              let tld = '';
              
              if (pattern === domainPatterns[0]) {
                // Standard format: full domain found
                const fullDomain = match[0];
                const firstDot = fullDomain.indexOf(".");
                domain_name = fullDomain.substring(0, firstDot);
                tld = fullDomain.substring(firstDot + 1);
              } else if (pattern === domainPatterns[1]) {
                // Format with separators: "minhaempresa: ao"
                domain_name = match[1];
                tld = match[2];
              } else if (pattern === domainPatterns[2]) {
                // Space separated: "minhaempresa ao" or "minhaempresa co ao"
                domain_name = match[1];
                tld = match[2] ? 'co.ao' : 'ao';
              }
              
              if (domain_name && tld) {
                const key = `${domain_name}.${tld}`.toLowerCase();
                // Só incluir se não estiver no banco (registeredKeys)
                if (!registeredKeys.has(key)) {
                  orderDomainsArr.push({
                    id: `${order.id}:${domain_name}.${tld}`,
                    domain_name,
                    tld,
                    source: "order",
                    status: order.status === "paid" ? "Processando" : "Pendente",
                    order_status: order.status,
                    order_id: order.id,
                  });
                  domainFound = true;
                  break; // Stop searching once we find a valid domain
                }
              }
            }
            
            if (domainFound) break; // Stop checking other patterns if domain found
          }

          // Final fallback: look for any .ao mention in items containing "dominio" or "domain"
          if (!domainFound && (rawName.includes("dominio") || rawName.includes("domain"))) {
            // Try to extract any word that might be a domain name
            const words = rawName.split(/[\s:,-]+/);
            for (const word of words) {
              if (word && word.length > 2 && /^[a-z0-9][-a-z0-9]*$/i.test(word)) {
                // Assume it's for .ao if no specific TLD found
                const domain_name = word;
                const tld = 'ao';
                const key = `${domain_name}.${tld}`.toLowerCase();
                
                if (!registeredKeys.has(key)) {
                  orderDomainsArr.push({
                    id: `${order.id}:${domain_name}.${tld}`,
                    domain_name,
                    tld,
                    source: "order",
                    status: order.status === "paid" ? "Processando" : "Pendente",
                    order_status: order.status,
                    order_id: order.id,
                  });
                  break;
                }
              }
            }
          }
        }
      }

      // Permite debugar na UI sobre quais domínios estão para exibir dos pedidos
      console.log("Domínios extraídos de pedidos (mesmo pendentes):", orderDomainsArr);

      // Combinar registrados + pedidos NÃO REGISTRADOS
      const allDisplayDomains: DisplayDomain[] = [
        ...registeredDomains.map((d) => ({
          id: d.id,
          domain_name: d.domain_name,
          tld: d.tld,
          source: "database" as const,
          status: d.status,
          registration_date: d.registration_date,
          expiration_date: d.expiration_date,
        })),
        ...orderDomainsArr,
      ];

      // Permite debugar resultado final
      console.log("Todos os domínios a exibir no painel:", allDisplayDomains);

      setDomains(allDisplayDomains);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, orders.length]);

  // Subscription realtime com Supabase
  useEffect(() => {
    if (!userId) return;
    // Escuta a tabela domains apenas para o usuário logado
    const channel = supabase
      .channel('realtime-domains-customer')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domains',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          process();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const reload = async () => {
    await loadDomainOrders();
    await process();
  };

  return { domains, loading: loading || ordersLoading, reload };
}
