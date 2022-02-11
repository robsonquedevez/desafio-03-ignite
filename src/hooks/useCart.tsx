import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
      const newCart = [...cart];
      const stockResponse = await api.get<Stock>(`stock/${productId}`);
      const productStock = stockResponse.data;
      const productExistsInCart = newCart.find(item => item.id === productId); 
      
      if(!!productExistsInCart) {

        if(productStock.amount < (productExistsInCart.amount + 1)){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const updatedProductInCart = newCart.map(item => {
          if(item.id === productId) {
            item.amount += 1;
          }
          return item;
        });
        
        setCart(updatedProductInCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProductInCart));
        
      } else {
        const productResponse = await api.get<Product>(`products/${productId}`);
        const product = productResponse.data;

        if(!!!product) {
          throw Error();
        }

        if(productStock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const addProductInCart = {
          id: productId,
          title: product.title,
          price: product.price,
          image: product.image,
          amount: 1
        }

        newCart.push(addProductInCart)

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeCart = [...cart];
      const productExistsCart = removeCart.find(product => product.id === productId);

      if(!!!productExistsCart) {
        throw new Error();
      }

      const removeItemCart = removeCart.filter(item => item.id !== productId)

      setCart(removeItemCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeItemCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        throw new Error();
      }
      const updatedCart = [...cart];

      const stockResponse = await api.get<Stock>(`stock/${productId}`);

      const productStock = stockResponse.data;    
      
      if(productStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      const existsProduct = cart.find(item => item.id === productId);

      if(!existsProduct){
        throw new Error();
      }
      
      const newCartUpdated = updatedCart.map(item => {
        if(item.id === productId) {
          item.amount = amount;
        }
        return item;
      })
      
      setCart(newCartUpdated);  
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartUpdated));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
