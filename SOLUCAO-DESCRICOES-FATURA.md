# Solução para o problema das descrições genéricas nas faturas

Para resolver o problema das faturas que mostram apenas "Serviço de hospedagem" como descrição em vez dos serviços específicos, siga estas instruções:

## Problema identificado

O problema está ocorrendo porque:

1. Os dados dos produtos/serviços não estão sendo carregados corretamente.
2. As descrições específicas não estão sendo extraídas das propriedades corretas.
3. Os metadados dos itens do pedido não estão sendo utilizados.

## Instruções para correção

### 1. Melhore a extração de dados no `invoicePdfGenerator.ts`

```typescript
// Adicione esta consulta para obter informações sobre produtos
const { data: products, error: productsError } = await supabase
  .from('products')
  .select('*');
  
if (productsError) {
  console.error('Erro ao buscar dados de produtos:', productsError);
} else if (products) {
  console.log(`Recuperados ${products.length} produtos para enriquecer os dados da fatura`);
}

// E inclua os produtos no objeto da fatura
const completeInvoice = {
  ...invoice,
  items: invoiceItems || [],
  company_settings: companySettings,
  products_data: products || []
};
```

### 2. No arquivo `pdfGenerator.ts`, ajuste o processamento de itens

```typescript
// No loop de processamento de itens do pedido
items = invoice.orders.order_items.map(item => {
  // Garantir que todos os detalhes do produto estejam disponíveis corretamente
  const product = item.products || {};
  
  // Verificar se temos detalhes do produto
  let productDetails = {};
  if (item.product_id && !item.products) {
    // Tentar encontrar o produto no objeto principal da fatura
    if (invoice.products_data && Array.isArray(invoice.products_data)) {
      const matchingProduct = invoice.products_data.find((p) => p.id === item.product_id);
      if (matchingProduct) {
        productDetails = matchingProduct;
      }
    }
  }
  
  // Extrair descrição do serviço de forma mais inteligente
  let serviceDesc = item.description;
  
  // Se a descrição estiver vazia ou for genérica, tentar encontrar nos metadados
  if (!serviceDesc || serviceDesc === 'Serviço de hospedagem') {
    if (item.metadata && typeof item.metadata === 'object') {
      const metaDesc = item.metadata.description || item.metadata.desc;
      if (metaDesc) serviceDesc = metaDesc;
    }
  }
  
  return {
    ...item,
    name: item.name || product.name || productDetails.name || 'Serviço',
    description: serviceDesc || product.description || productDetails.description || 'Serviço personalizado',
    service_name: item.name || product.name || productDetails.name || 'Serviço',
    service_description: serviceDesc || product.description || productDetails.description || 'Serviço personalizado',
    unit_price: item.price || item.unit_price || product.price || 0,
    quantity: item.quantity || 1,
    subtotal: (item.quantity || 1) * (item.price || item.unit_price || product.price || 0)
  };
});
```

### 3. Adicione processamento de metadados

No código que mapeia itens para o formato da tabela, adicione essa lógica:

```typescript
// Se a descrição ainda estiver vazia ou for genérica
if (!serviceDescription || serviceDescription === 'Serviço de hospedagem') {
  // Verificar metadados
  if (item.metadata) {
    try {
      let metadata = item.metadata;
      // Se for string, tentar parsear como JSON
      if (typeof metadata === 'string' && metadata.startsWith('{')) {
        metadata = JSON.parse(metadata);
      }
      
      if (typeof metadata === 'object') {
        // Verificar campos comuns de metadados
        const metaDesc = metadata.description || metadata.desc || metadata.details || metadata.info;
        if (metaDesc) {
          serviceDescription = metaDesc;
        }
        
        // Verificar por detalhes de domínio/hospedagem
        if (metadata.domain) {
          serviceDescription = `Domínio: ${metadata.domain}`;
          if (metadata.period) {
            serviceDescription += ` (${metadata.period})`;
          }
        } else if (metadata.plan) {
          serviceDescription = `Plano: ${metadata.plan}`;
        } else if (metadata.service_details) {
          serviceDescription = metadata.service_details;
        }
      }
    } catch (e) {
      console.error('Erro ao parsear metadados:', e);
    }
  }
}
```

## Observações importantes

1. Existe um erro "Key is not present in table products" que aparece quando tenta-se criar um item de pedido. Isso é um problema separado e ocorre quando o sistema tenta referenciar um produto que não existe na tabela de produtos.

2. Os metadados são frequentemente armazenados em diferentes formatos (JSON string ou objeto), então é importante tratar ambos os casos.

3. As descrições dos itens podem estar em diferentes propriedades dependendo de como foram criados, por isso é importante verificar múltiplos caminhos.
