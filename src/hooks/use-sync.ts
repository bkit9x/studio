
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CryptoJS from "crypto-js";
import { useLocalStorage } from "./use-local-storage";
import type { Tag, Transaction, Wallet } from "@/lib/types";

// Note: Storing API keys and passwords on the client-side is not recommended for production environments.
// This is for demonstration purposes in a client-only application.

const SYNC_CONFIG_KEY = "fintrack_sync_config";
const DEBOUNCE_TIME = 2000; // 2 seconds

type SyncConfig = {
  apiKey: string;
  binId: string;
  password: string; // This will be stored in state, but not in localStorage directly
};

export function useSync() {
  const [wallets, setWallets] = useLocalStorage<Wallet[]>("wallets", []);
  const [tags, setTags] = useLocalStorage<Tag[]>("tags", []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", []);

  const [config, setConfigState] = useState<SyncConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load config from local storage on mount
  useEffect(() => {
    try {
      const storedConfig = window.localStorage.getItem(SYNC_CONFIG_KEY);
      if (storedConfig) {
        setConfigState(JSON.parse(storedConfig));
      }
    } catch (error) {
      console.error("Failed to load sync config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setConfig = (newConfig: SyncConfig) => {
     try {
        window.localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(newConfig));
        setConfigState(newConfig);
    } catch (error) {
        console.error("Failed to save sync config:", error);
    }
  };

  const encryptData = (data: object, password: string): string => {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, password).toString();
  };

  const decryptData = (encryptedData: string, password: string): object => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
        throw new Error("Mật khẩu không đúng hoặc dữ liệu bị hỏng.");
    }
    return JSON.parse(decryptedString);
  };
  
  const uploadData = useCallback(async (currentConfig: SyncConfig) => {
    if (isUploading) return; // Prevent concurrent uploads

    setIsUploading(true);
    try {
      const dataToUpload = { wallets, tags, transactions };
      const encryptedData = encryptData(dataToUpload, currentConfig.password);

      const response = await fetch(`https://api.jsonbin.io/v3/b/${currentConfig.binId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": currentConfig.apiKey,
          "X-Bin-Versioning": "false", // To overwrite the bin content
        },
        body: JSON.stringify({ data: encryptedData }), // Wrap in a "data" object or as needed
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tải lên thất bại: ${errorData.message || response.statusText}`);
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      // Optionally show a toast notification for upload errors
    } finally {
      setIsUploading(false);
    }
  }, [wallets, tags, transactions, isUploading]);

  const syncData = async (syncConfig: SyncConfig) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${syncConfig.binId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': syncConfig.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
            // Bin not found, could be first time sync. Let's upload current data.
            await uploadData(syncConfig);
            return;
        }
        const errorData = await response.json();
        throw new Error(`Đồng bộ thất bại: ${errorData.message || response.statusText}`);
      }

      const binData = await response.json();
      const encryptedData = binData.record.data; // Assuming data is stored in a 'data' property

      if (!encryptedData) {
        // Bin is empty, upload current data
        await uploadData(syncConfig);
        return;
      }
      
      const decryptedData = decryptData(encryptedData, syncConfig.password) as {
        wallets: Wallet[];
        tags: Tag[];
        transactions: Transaction[];
      };

      // Replace local data with synced data
      setWallets(decryptedData.wallets || []);
      setTags(decryptedData.tags || []);
      setTransactions(decryptedData.transactions || []);
      
    } catch (error) {
      console.error("Sync error:", error);
      throw error; // Re-throw to be caught by the UI
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Debounced upload on data change
  useEffect(() => {
    if (!config || isLoading) {
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
        // Check for online status before uploading
        if(navigator.onLine) {
            uploadData(config);
        }
    }, DEBOUNCE_TIME);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [wallets, tags, transactions, config, isLoading, uploadData]);


  return { config, setConfig, syncData, isLoading, isSyncing, isUploading };
}
