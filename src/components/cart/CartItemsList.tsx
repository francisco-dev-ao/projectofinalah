
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import DomainCartItem from "./DomainCartItem";
import EmailCartItem from "./EmailCartItem";
import CartItemCard from "./CartItemCard";
import CartCategorySection from "./CartCategorySection";
import EmptyCart from "./EmptyCart";
import AdditionalServicesPrompt from "./AdditionalServicesPrompt";

const CartItemsList = () => {
  const { cartItems, updateDomainPeriod, updateItemQuantity, removeItem } = useCart();

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    toast.success("Item removido do carrinho");
  };

  // Group items by type for display
  const domainItems = cartItems.filter(item => item.type === 'domain');
  const hostingItems = cartItems.filter(item => item.type === 'hosting');
  const emailItems = cartItems.filter(item => item.type === 'email');
  const otherItems = cartItems.filter(item => !item.type || (item.type !== 'domain' && item.type !== 'hosting' && item.type !== 'email'));
  
  // Check if there's only domain in cart
  const hasDomainOnly = cartItems.length === 1 && cartItems[0].type === 'domain';

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Produtos no Carrinho</h2>
        
        <div className="space-y-6">
          {/* Display domain items first */}
          {domainItems.length > 0 && (
            <CartCategorySection title="Domínios">
              {domainItems.map((item) => (
                <DomainCartItem 
                  key={item.id} 
                  item={item} 
                  updateDomainPeriod={updateDomainPeriod}
                  handleRemoveItem={handleRemoveItem}
                />
              ))}
            </CartCategorySection>
          )}

          {/* Display hosting plans */}
          {hostingItems.length > 0 && (
            <CartCategorySection title="Hospedagem Web">
              {hostingItems.map((item) => (
                <CartItemCard 
                  key={item.id} 
                  item={item} 
                  updateQuantity={updateItemQuantity} 
                  removeItem={removeItem}
                />
              ))}
            </CartCategorySection>
          )}

          {/* Display email plans */}
          {emailItems.length > 0 && (
            <CartCategorySection title="Email Profissional">
              {emailItems.map((item) => (
                <EmailCartItem
                  key={item.id}
                  item={item}
                  updateItemQuantity={updateItemQuantity}
                  handleRemoveItem={handleRemoveItem}
                />
              ))}
            </CartCategorySection>
          )}

          {/* Display other items */}
          {otherItems.length > 0 && (
            <CartCategorySection title="Outros Produtos">
              {otherItems.map((item) => (
                <CartItemCard 
                  key={item.id} 
                  item={item} 
                  updateQuantity={updateItemQuantity} 
                  removeItem={removeItem}
                />
              ))}
            </CartCategorySection>
          )}
        </div>
      </div>
      
      {/* Show additional services prompt only when there's just a domain in the cart */}
      {hasDomainOnly && (
        <AdditionalServicesPrompt onlyDomainInCart={hasDomainOnly} />
      )}
    </>
  );
};

export default CartItemsList;
