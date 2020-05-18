import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const prods = products.map(product => {
        if (product.id === id) {
          product.quantity += 1;
        }

        return product;
      });

      setProducts(prods);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(prods),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const prods = products.filter(product => {
        if (product.id === id) {
          product.quantity -= 1;
        }

        return product.quantity > 0 ? product : false;
      });

      setProducts(prods);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(prods),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      let newProduct = true;

      products.map(prod => {
        if (prod.id === product.id) {
          increment(prod.id);
          newProduct = false;
        }
      });

      if (newProduct) {
        product.quantity = 1;

        const newProductsList = [...products, product];

        setProducts(newProductsList);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProductsList),
        );
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
