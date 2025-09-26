/**
 * Echo Wallet - Global state management
 * Manage application state with Zustand
 */

import { create } from "zustand";
import { AppState, WalletAccount, Transaction, VoiceState, WalletBalance, TransferState } from "@/types";

interface WalletStore extends AppState {
  // Wallet actions
  setWallet: (wallet: WalletAccount | null) => void;
  updateBalance: (balance: WalletBalance) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;

  // Voice state
  setVoiceState: (voice: Partial<VoiceState>) => void;

  // Transfer state
  setTransferState: (transfer: Partial<TransferState>) => void;

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
  transfer: {
    isActive: false,
    step: 'idle',
    recipient: null,
    amount: '',
    token: 'ETH',
  },
  isLoading: false,
  error: null,
  network: "sepolia",
};

export const useWalletStore = create<WalletStore>((set) => ({
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

  // Transfer state
  setTransferState: (transferUpdates) =>
    set((state) => ({
      transfer: { ...state.transfer, ...transferUpdates },
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
export const useTransferState = () => useWalletStore((state) => state.transfer);
export const useAppState = () =>
  useWalletStore((state) => ({
    isLoading: state.isLoading,
    error: state.error,
    network: state.network,
  }));
