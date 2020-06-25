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

const PRODUCTS_KEY = '@gomarketplace:products'

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [ products, setProducts ] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsJson = await AsyncStorage.getItem(PRODUCTS_KEY)
      if (productsJson) {
        setProducts([ ...JSON.parse(productsJson) ])
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async newProduct => {
    const productExists = products.find(product => product.id === newProduct.id)

    if (productExists) {
      setProducts(
        products.map(product => product.id === newProduct.id ? {
          ...newProduct,
          quantity: product.quantity + 1
        } : product)
      )
    } else {
      setProducts([...products, { ...newProduct, quantity: 1 }])
    }

    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  }, [ products ]);

  const increment = useCallback(async id => {
    const newProducts = products.map(
      product => product.id === id ? { ...product, quantity: product.quantity + 1 } : product
    );

    setProducts(newProducts)
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts))
  }, [ products ]);

  const decrement = useCallback(async id => {
    const newProducts = products.map(
      product => product.id === id ? { ...product, quantity: product.quantity - 1 } : product
    );

    setProducts(newProducts)
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts))
  }, [ products ]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [ addToCart, increment, decrement, products ],
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
