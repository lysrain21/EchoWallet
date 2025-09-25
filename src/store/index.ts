/**
 * Echo Wallet - Global state management
 * Manage application state with Zustand
 */

import { create } from "zustand";
import { AppState, WalletAccount, Transaction, VoiceState } from "@/types";

interface WalletStore extends AppState {
  // Wallet actions
  setWallet: (wallet: WalletAccount | null) => void;
  updateBalance: (balance: any) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;

  // Voice state
  setVoiceState: (voice: Partial<VoiceState>) => void;

  // App state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNetwork: (network: "mainnet" | "sepolia" | "polygon") => void;

  // Reset state
  reset: () => void;
}

const initialState: AppState = {
  wallet: null,
  balance: {
    eth: "0",
    tokens: [],
  },
  transactions: [],
  voice: {
    isListening: false,
    isProcessing: false,
  },
  isLoading: false,
  error: null,
  network: "sepolia",
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  ...initialState,

  // Wallet actions
  setWallet: (wallet) => set({ wallet }),

  updateBalance: (balance) => set({ balance }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  updateTransaction: (hash, updates) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.hash === hash ? { ...tx, ...updates } : tx
      ),
    })),

  // Voice state
  setVoiceState: (voiceUpdates) =>
    set((state) => ({
      voice: { ...state.voice, ...voiceUpdates },
    })),

  // App state
  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setNetwork: (network) => set({ network }),

  // Reset state
  reset: () => set(initialState),
}));

// Selector hooks
export const useWallet = () => useWalletStore((state) => state.wallet);
export const useBalance = () => useWalletStore((state) => state.balance);
export const useTransactions = () =>
  useWalletStore((state) => state.transactions);
export const useVoiceState = () => useWalletStore((state) => state.voice);
export const useAppState = () =>
  useWalletStore((state) => ({
    isLoading: state.isLoading,
    error: state.error,
    network: state.network,
  }));
