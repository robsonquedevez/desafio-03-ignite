import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      const productResponse = await api.get(`products/${productId}`);

      const stockResponse = await api.get(`stock/${productId}`);

      const [ checkedProductCartExists ] = cart.filter(item => item.id === productId);

      if(checkedProductCartExists) {
        
        if(stockResponse.data.amount < (checkedProductCartExists.amount + 1)) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        
        const addCart = cart.map(item => {
          if(item.id === productId) {
            item.amount += 1;
          }
          return item;
        })

        return setCart(addCart);         
      }

      if(stockResponse.data.amount < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const addItem = {
        id: productId,
        title: productResponse.data.title,
        price: productResponse.data.price,
        image: productResponse.data.image,
        amount: 1
      }
      
      setCart([...cart, addItem]);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeItemCart = cart.filter(item => item.id !== productId)

      setCart(removeItemCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
