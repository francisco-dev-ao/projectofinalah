-- Cria uma função para verificar e relatar a prontidão para produção
CREATE OR REPLACE FUNCTION check_production_readiness()
RETURNS json -- Retorna um objeto JSON com os resultados
LANGUAGE plpgsql -- Usa a linguagem procedural PL/pgSQL
SECURITY DEFINER -- Executa com as permissões do criador da função, não do chamador
AS $$
DECLARE
  result json; -- Variável para armazenar o resultado final
  dummy_data_count int; -- Contador para dados fictícios
  demo_email_count int; -- Contador para emails de demonstração
  test_product_count int; -- Contador para produtos de teste
  incomplete_users_count int; -- Contador para usuários com perfis incompletos
  system_ready boolean; -- Indicador se o sistema está pronto para produção
  readiness_details json; -- Detalhes da prontidão em formato JSON
BEGIN
  -- Conta usuários com emails de teste/demonstração
  SELECT count(*) INTO demo_email_count
  FROM profiles
  WHERE email ILIKE '%example%' 
     OR email ILIKE '%test%'
     OR email ILIKE '%demo%'
     OR email = 'admin@angohost.co.ao'
     OR email = 'dev@example.com'
     OR email = 'deve@joao.ao';
  
  -- Conta produtos de teste
  SELECT count(*) INTO test_product_count
  FROM products
  WHERE name ILIKE '%test%' 
     OR name ILIKE '%demo%' 
     OR description ILIKE '%test%'
     OR description ILIKE '%demo%';
  
  -- Conta usuários com perfis incompletos
  SELECT count(*) INTO incomplete_users_count
  FROM profiles
  WHERE name IS NULL 
     OR trim(name) = '' 
     OR phone IS NULL 
     OR nif IS NULL;
  
  -- Determina se o sistema está pronto para produção
  -- (pronto apenas se não houver emails de demo nem produtos de teste)
  system_ready := (demo_email_count = 0 AND test_product_count = 0);
  
  -- Constrói o objeto de detalhes
  readiness_details := json_build_object(
    'demo_email_accounts', demo_email_count, -- Número de contas com emails de demonstração
    'test_products', test_product_count, -- Número de produtos de teste
    'incomplete_user_profiles', incomplete_users_count -- Número de perfis incompletos
  );
  
  -- Constrói o resultado final
  result := json_build_object(
    'is_ready', system_ready, -- Booleano indicando se está pronto
    'details', readiness_details -- Objeto com os detalhes das verificações
  );
  
  RETURN result; -- Retorna o objeto JSON final
END;
$$;

-- Concede permissão de execução para usuários autenticados com papel de administrador
GRANT EXECUTE ON FUNCTION check_production_readiness() TO authenticated;
