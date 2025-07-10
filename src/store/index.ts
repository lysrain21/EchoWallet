/**
 * Echo Wallet - 全局状态管理
 * 使用 Zustand 管理应用状态
 */

import { create } from "zustand";
import { AppState, WalletAccount, Transaction, VoiceState } from "@/types";

interface WalletStore extends AppState {
  // 钱包操作
  setWallet: (wallet: WalletAccount | null) => void;
  updateBalance: (balance: any) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;

  // 语音状态
  setVoiceState: (voice: Partial<VoiceState>) => void;

  // 应用状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNetwork: (network: "mainnet" | "sepolia" | "polygon") => void;

  // 重置状态
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

  // 钱包操作
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

  // 语音状态
  setVoiceState: (voiceUpdates) =>
    set((state) => ({
      voice: { ...state.voice, ...voiceUpdates },
    })),

  // 应用状态
  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setNetwork: (network) => set({ network }),

  // 重置状态
  reset: () => set(initialState),
}));

// 选择器钩子
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
