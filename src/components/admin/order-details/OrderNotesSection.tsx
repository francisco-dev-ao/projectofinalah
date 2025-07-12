
import React from "react";

type OrderNotesSectionProps = {
  notes: string;
};

const OrderNotesSection = ({ notes }: OrderNotesSectionProps) => {
  if (!notes) return null;
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Observações do Pedido</h3>
      <p className="text-sm whitespace-pre-wrap">{notes}</p>
    </div>
  );
};

export default OrderNotesSection;
