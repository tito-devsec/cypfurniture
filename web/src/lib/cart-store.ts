'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  key: string;
  productId: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  options: Record<string, string>;
  stock: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  lastAdded: string | null;
  add: (item: Omit<CartItem, 'key' | 'quantity'>, quantity?: number) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export function cartKey(productId: number, options: Record<string, string>) {
  const opts = Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join('|');
  return `${productId}${opts ? `::${opts}` : ''}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      lastAdded: null,
      add: (item, quantity = 1) =>
        set((state) => {
          const key = cartKey(item.productId, item.options);
          const existing = state.items.find((i) => i.key === key);
          const items = existing
            ? state.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i))
            : [...state.items, { ...item, key, quantity: Math.min(99, quantity) }];
          return { items, isOpen: true, lastAdded: key };
        }),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(99, quantity) } : i)),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'cyp-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCount = (state: CartState) => state.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectSubtotal = (state: CartState) => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
