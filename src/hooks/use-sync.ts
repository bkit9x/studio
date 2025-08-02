
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CryptoJS from "crypto-js";
import { useLocalStorage } from "./use-local-storage";
import type { Tag, Transaction, Wallet } from "@/lib/types";

// Note: Storing API keys and passwords on the client-side is not recommended for production environments.
// This is for demonstration purposes in a client-only application.

const SYNC_CONFIG_KEY = "fintrack_sync_config";
const SYNC_METADATA_KEY = "fintrack_sync_metadata";
const DEBOUNCE_TIME = 2000; // 2 seconds

type SyncConfig = {
  apiKey: string;
  binId: string;
  password: string; // This will be stored in state, but not in localStorage directly
};

type SyncMetadata = {
    lastSync: string | null;
    lastUploadHash: string | null;
}

export function useSync() {
  const [wallets, setWallets] = useLocalStorage<Wallet[]>("wallets", []);
  const [tags, setTags] = useLocalStorage<Tag[]>("tags", []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", []);

  const [config, setConfigState] = useState<SyncConfig | null>(null);
  const [metadata, setMetadataState] = useState<SyncMetadata>({ lastSync: null, lastUploadHash: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const lastSyncDate = metadata.lastSync ? new Date(metadata.lastSync) : null;

  // Load config and metadata from local storage on mount
  useEffect(() => {
    try {
      const storedConfig = window.localStorage.getItem(SYNC_CONFIG_KEY);
      if (storedConfig) {
        setConfigState(JSON.parse(storedConfig));
      }
      const storedMetadata = window.localStorage.getItem(SYNC_METADATA_KEY);
      if (storedMetadata) {
        setMetadataState(JSON.parse(storedMetadata));
      }
    } catch (error) {
      console.error("Failed to load sync config/metadata:", error);
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
  
   const setMetadata = (newMetadata: Partial<SyncMetadata>) => {
     try {
        const currentMetadata = JSON.parse(window.localStorage.getItem(SYNC_METADATA_KEY) || '{}');
        const updatedMetadata = { ...currentMetadata, ...newMetadata };
        window.localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(updatedMetadata));
        setMetadataState(updatedMetadata);
    } catch (error) {
        console.error("Failed to save sync metadata:", error);
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
    if (isUploading) return;

    setIsUploading(true);
    try {
      const dataToUpload = { wallets, tags, transactions };
      const dataHash = CryptoJS.SHA256(JSON.stringify(dataToUpload)).toString();
      const encryptedData = encryptData(dataToUpload, currentConfig.password);

      const response = await fetch(`https://api.jsonbin.io/v3/b/${currentConfig.binId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": currentConfig.apiKey,
          "X-Bin-Versioning": "false", 
        },
        body: JSON.stringify({ data: encryptedData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Tải lên thất bại: ${errorData.message || response.statusText}`);
      }
      
      setMetadata({ lastSync: new Date().toISOString(), lastUploadHash: dataHash });

    } catch (error) {
      console.error("Upload error:", error);
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
            await uploadData(syncConfig);
            return;
        }
        const errorData = await response.json();
        throw new Error(`Đồng bộ thất bại: ${errorData.message || response.statusText}`);
      }

      const binData = await response.json();
      const encryptedData = binData.record.data; 

      if (!encryptedData) {
        await uploadData(syncConfig);
        return;
      }
      
      const decryptedData = decryptData(encryptedData, syncConfig.password) as {
        wallets: Wallet[];
        tags: Tag[];
        transactions: Transaction[];
      };

      setWallets(decryptedData.wallets || []);
      setTags(decryptedData.tags || []);
      setTransactions(decryptedData.transactions || []);
      
      const dataHash = CryptoJS.SHA256(JSON.stringify(decryptedData)).toString();
      setMetadata({ lastSync: new Date().toISOString(), lastUploadHash: dataHash });
      
    } catch (error) {
      console.error("Sync error:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Check for unsynced changes
   useEffect(() => {
    const currentData = { wallets, tags, transactions };
    const currentHash = CryptoJS.SHA256(JSON.stringify(currentData)).toString();
    setHasUnsyncedChanges(currentHash !== metadata.lastUploadHash);
  }, [wallets, tags, transactions, metadata.lastUploadHash]);

  // Debounced upload on data change
  useEffect(() => {
    if (!config || isLoading || !hasUnsyncedChanges) {
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
        if(navigator.onLine) {
            uploadData(config);
        }
    }, DEBOUNCE_TIME);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [wallets, tags, transactions, config, isLoading, hasUnsyncedChanges, uploadData]);


  return { config, setConfig, syncData, isLoading, isSyncing, lastSync: lastSyncDate, hasUnsyncedChanges };
}
