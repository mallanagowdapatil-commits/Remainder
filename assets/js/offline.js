/**
 * MediTrack - Offline Engine & IndexedDB Synchronization Manager
 * PWA Service Worker registration, client-side caching, and conflict-safe event synchronization.
 */

const OfflineEngine = {
  db: null,
  dbName: 'MediTrackOfflineDB',
  dbVersion: 2,
  isOnline: navigator.onLine,

  async init() {
    this.registerServiceWorker();
    await this.initIndexedDB();
    this.initConnectivityListeners();
    this.updateConnectionBadge(navigator.onLine);

    if (navigator.onLine) {
      await this.syncOfflineQueue();
    }
    console.log('[OfflineEngine] IndexedDB & Offline Manager Initialized.');
  },

  /**
   * 1. Register Service Worker with robust relative path
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./pwa/service-worker.js')
          .then((reg) => {
            console.log('[OfflineEngine] ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[OfflineEngine] ServiceWorker registration note:', err.message);
          });
      });
    }
  },

  /**
   * 2. Initialize IndexedDB Stores
   */
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('medications')) {
          db.createObjectStore('medications', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('offline_event_queue')) {
          const queueStore = db.createObjectStore('offline_event_queue', { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('queued_at', 'queued_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_audit_log')) {
          db.createObjectStore('sync_audit_log', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('[OfflineEngine] IndexedDB open error:', e.target.error);
        reject(e.target.error);
      };
    });
  },

  /**
   * 3. Network Connectivity Listeners (Online / Offline)
   */
  initConnectivityListeners() {
    window.addEventListener('online', async () => {
      this.isOnline = true;
      this.updateConnectionBadge(true);
      Toast.show('Network reconnected! Synchronizing offline events with cloud...', 'success', 'Back Online');
      await this.syncOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateConnectionBadge(false);
      Toast.show('Internet disconnected. You can continue viewing schedules and logging doses offline.', 'warning', 'Offline Mode');
    });
  },

  updateConnectionBadge(online) {
    const pill = document.getElementById('connection-status-pill');
    if (!pill) return;

    if (online) {
      pill.className = 'status-pill status-connected';
      pill.innerHTML = '<span class="status-dot"></span> Online';
      pill.title = 'Internet connection active.';
    } else {
      pill.className = 'status-pill status-disconnected';
      pill.innerHTML = '<span class="status-dot"></span> Offline';
      pill.title = 'Offline mode active. Recorded doses are safely queued in IndexedDB.';
    }
  },

  /**
   * 4. Queue an Event in IndexedDB when Offline
   */
  async queueOfflineEvent(eventRecord) {
    if (!this.db) {
      await this.initIndexedDB();
    }

    const payload = {
      ...eventRecord,
      id: eventRecord.id || ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'evt_' + Date.now()),
      queued_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['offline_event_queue'], 'readwrite');
      const store = tx.objectStore('offline_event_queue');
      const req = store.put(payload);

      req.onsuccess = () => {
        console.log('[OfflineEngine] Queued event in IndexedDB:', payload.id);
        Toast.show('Event saved locally in offline queue. Will sync automatically when back online.', 'info', 'Saved Offline');
        resolve(payload);
      };

      req.onerror = (e) => {
        console.error('[OfflineEngine] Failed to queue event:', e.target.error);
        reject(e.target.error);
      };
    });
  },

  /**
   * 5. Sync Offline Event Queue to Supabase
   */
  async syncOfflineQueue() {
    if (!navigator.onLine || !this.db) return;

    const user = StorageHelper.get('med_app_user', {});
    if (!user || !user.id || typeof SupabaseService === 'undefined' || !SupabaseService.hasActiveConfig()) {
      return;
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['offline_event_queue'], 'readonly');
      const store = tx.objectStore('offline_event_queue');
      const req = store.getAll();

      req.onsuccess = async () => {
        const queue = req.result || [];
        if (queue.length === 0) {
          resolve(0);
          return;
        }

        console.log(`[OfflineEngine] Synchronizing ${queue.length} offline event(s) to cloud database...`);
        let syncedCount = 0;

        for (const item of queue) {
          try {
            const res = await SupabaseService.recordMedicationEvent(user.id, item);
            if (res && res.success) {
              await this.removeFromQueue(item.id);
              await this.recordSyncAudit(item);
              syncedCount++;
            }
          } catch (err) {
            console.warn('[OfflineEngine] Failed syncing event item:', item.id, err);
          }
        }

        if (syncedCount > 0) {
          Toast.show(`Successfully synced ${syncedCount} offline dose(s) to cloud storage.`, 'success', 'Synced');
        }

        resolve(syncedCount);
      };

      req.onerror = () => {
        resolve(0);
      };
    });
  },

  removeFromQueue(eventId) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(['offline_event_queue'], 'readwrite');
      const store = tx.objectStore('offline_event_queue');
      const req = store.delete(eventId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  },

  recordSyncAudit(item) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(['sync_audit_log'], 'readwrite');
      const store = tx.objectStore('sync_audit_log');
      store.put({
        id: item.id,
        synced_at: new Date().toISOString(),
        status: item.status,
        event_hash: item.event_hash
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OfflineEngine.init();
});
