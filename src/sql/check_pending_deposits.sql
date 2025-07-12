
-- Function to check pending wallet deposits
CREATE OR REPLACE FUNCTION check_pending_wallet_deposits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_processed INT := 0;
    v_invoice RECORD;
BEGIN
    -- For each pending wallet deposit invoice
    FOR v_invoice IN 
        SELECT i.id, i.amount
        FROM invoices i
        WHERE i.user_id = p_user_id
        AND i.status = 'issued'
        AND i.notes ILIKE '%carteira%'
        AND EXISTS (
            SELECT 1 FROM payments p 
            WHERE p.invoice_id = i.id 
            AND p.status = 'confirmed'
        )
    LOOP
        -- Credit the wallet
        PERFORM credit_wallet_from_invoice(v_invoice.id, v_invoice.amount);
        
        -- Update invoice status to paid
        UPDATE invoices SET status = 'paid' WHERE id = v_invoice.id;
        
        v_processed := v_processed + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'processed', v_processed,
        'user_id', p_user_id
    );
END;
$$;
