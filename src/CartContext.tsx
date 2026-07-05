import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';

import { ProductOption } from './services/productService';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  slug: string;
  stock?: number;
  selectedOption?: ProductOption | string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: string, selectedOption?: ProductOption | string) => void;
  updateQuantity: (id: string, quantity: number, selectedOption?: ProductOption | string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
  amountToFreeShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return [];
      
      const parsedItems = JSON.parse(savedCart);
      
      // 強化過濾機制：移除 null, undefined 或缺少核心欄位的無效項目
      const validItems = Array.isArray(parsedItems) 
        ? parsedItems.filter(item => 
            item && 
            typeof item === 'object' && 
            item.id && 
            item.name && 
            typeof item.price === 'number'
          )
        : [];
      
      return validItems;
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
      localStorage.removeItem('cart'); // 自動清空損毀的快取
      return [];
    }
  });

  // 渲染前的第二道防線：確保元件內部狀態也始終過濾無效值
  const validatedItems = items.filter(item => item && typeof item === 'object' && item.id);

  const freeShippingThreshold = 1000;

  // 使用 useRef 儲存最新的購物車項目狀態，保持常設回呼函式（callbacks）的穩定參考（stable identities）
  const itemsRef = useRef<CartItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product: any, quantity: number = 1) => {
    if (!product.id || product.id === 'undefined') {
      console.error('Attempted to add product without valid ID to cart:', product);
      toast.error('商品異常，請重新整理頁面再試一次');
      return;
    }

    const optionKey = typeof product.selectedOption === 'object' ? product.selectedOption.label : product.selectedOption;
    
    // 從 itemsRef.current 讀取最新狀態，擺脫 callback 對 [items] 的依賴
    const existingItem = itemsRef.current.find(item => {
      const itemOptionKey = typeof item.selectedOption === 'object' ? item.selectedOption.label : item.selectedOption;
      return item.id === product.id && itemOptionKey === optionKey;
    });
    const totalRequested = (existingItem?.quantity || 0) + quantity;

    // 檢查總數量是否超過庫存
    if (product.stock !== undefined && totalRequested > product.stock) {
      toast.error(`抱歉，${product.name} 的庫存不足（現貨剩餘 ${product.stock} 件）。`, {
        id: `stock-error-${product.id}`
      });
      return;
    }

    const optLabel = typeof product.selectedOption === 'object' ? product.selectedOption.label : product.selectedOption;
    const message = existingItem 
      ? `已增加 ${product.name}${optLabel ? ` (${optLabel})` : ''} 的數量` 
      : `已將 ${product.name}${optLabel ? ` (${optLabel})` : ''} 加入購物車`;
    
    toast.success(message, {
      id: `add-to-cart-${product.id}-${optLabel || 'none'}`
    });

    setItems(prevItems => {
      const alreadyInCart = prevItems.some(item => {
        const itemOptionKey = typeof item.selectedOption === 'object' ? item.selectedOption.label : item.selectedOption;
        return item.id === product.id && itemOptionKey === optionKey;
      });

      if (alreadyInCart) {
        return prevItems.map(item => {
          const itemOptionKey = typeof item.selectedOption === 'object' ? item.selectedOption.label : item.selectedOption;
          return (item.id === product.id && itemOptionKey === optionKey)
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        });
      }
      return [...prevItems, {
        id: String(product.id),
        name: String(product.name),
        price: Number(product.price),
        image_url: String(product.image_url || product.image || ''),
        slug: String(product.slug || ''),
        quantity,
        stock: product.stock,
        selectedOption: product.selectedOption
      }];
    });
  }, []); // 絕對穩定的參考

  const removeFromCart = useCallback((id: string, selectedOption?: ProductOption | string) => {
    const optionKey = typeof selectedOption === 'object' ? selectedOption.label : selectedOption;
    
    setItems(prevItems => prevItems.filter(item => {
      const itemOptionKey = typeof item.selectedOption === 'object' ? (item.selectedOption as any).label || item.selectedOption : item.selectedOption;
      return !(item.id === id && itemOptionKey === optionKey);
    }));
    toast.success('已從購物車移除商品', { id: `remove-cart-${id}-${optionKey || 'none'}` });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, selectedOption?: ProductOption | string) => {
    if (quantity < 1) return;
    const optionKey = typeof selectedOption === 'object' ? selectedOption.label : selectedOption;
    
    // 從 itemsRef.current 讀取最新狀態
    const item = itemsRef.current.find(i => {
      const iOptionKey = typeof i.selectedOption === 'object' ? (i.selectedOption as any).label || i.selectedOption : i.selectedOption;
      return i.id === id && iOptionKey === optionKey;
    });
    
    if (item && item.stock !== undefined && quantity > item.stock) {
      toast.error(`抱歉，${item.name} 的庫存不足（現貨剩餘 ${item.stock} 件）。`, {
        id: `stock-error-${id}-${optionKey || 'none'}`
      });
      return;
    }

    setItems(prevItems => {
      return prevItems.map(item => {
        const itemOptionKey = typeof item.selectedOption === 'object' ? (item.selectedOption as any).label || item.selectedOption : item.selectedOption;
        return (item.id === id && itemOptionKey === optionKey) ? { ...item, quantity } : item;
      });
    });
  }, []); // 絕對穩定的參考

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  const totalItems = validatedItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
  const subtotal = validatedItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  // Memoize Context Value 確保子組件不會因為 Context 參考地址變更而觸發額外渲染
  const contextValue = useMemo(() => ({
    items: validatedItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    freeShippingThreshold,
    isFreeShipping,
    amountToFreeShipping
  }), [
    validatedItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    freeShippingThreshold,
    isFreeShipping,
    amountToFreeShipping
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
