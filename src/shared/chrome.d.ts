/// <reference types="chrome"/>

// Extend the chrome namespace with our custom types
declare namespace chrome {
  namespace runtime {
    interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    interface LastError {
      message?: string;
    }

    const lastError: LastError | undefined;

    function sendMessage(
      message: any,
      options?: { includeTlsChannelId?: boolean },
      callback?: (response: any) => void
    ): void;

    function onMessage(
      callback: (
        message: any,
        sender: MessageSender,
        sendResponse: (response?: any) => void
      ) => void
    ): void;
  }

  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
    }

    const sync: StorageArea;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
    }

    function query(queryInfo: { active?: boolean; currentWindow?: boolean }, callback: (tabs: Tab[]) => void): void;
    function sendMessage(tabId: number, message: any, options?: { frameId?: number }, callback?: (response: any) => void): void;
  }
} 