// Database Management for Medical Counselling Platform

class DatabaseManager {
    constructor() {
        this.dbName = 'MedicalCounsellingDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('colleges')) {
                    const collegesStore = db.createObjectStore('colleges', { keyPath: 'id' });
                    collegesStore.createIndex('state', 'state', { unique: false });
                    collegesStore.createIndex('type', 'type', { unique: false });
                }

                if (!db.objectStoreNames.contains('counselling')) {
                    const counsellingStore = db.createObjectStore('counselling', { keyPath: 'id' });
                    counsellingStore.createIndex('type', 'type', { unique: false });
                    counsellingStore.createIndex('year', 'year', { unique: false });
                    counsellingStore.createIndex('level', 'level', { unique: false });
                    counsellingStore.createIndex('round', 'round', { unique: false });
                }

                if (!db.objectStoreNames.contains('analytics')) {
                    const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
                    analyticsStore.createIndex('type', 'type', { unique: false });
                    analyticsStore.createIndex('date', 'date', { unique: false });
                }

                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'url' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // Colleges Management
    async addCollege(college) {
        return this.addToStore('colleges', college);
    }

    async getColleges(filters = {}) {
        const colleges = await this.getAllFromStore('colleges');
        
        if (Object.keys(filters).length === 0) {
            return colleges;
        }

        return colleges.filter(college => {
            if (filters.state && college.state !== filters.state) return false;
            if (filters.type && college.type !== filters.type) return false;
            if (filters.city && !college.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
            if (filters.course && !college.courses.some(c => c.name === filters.course)) return false;
            return true;
        });
    }

    async updateCollege(college) {
        return this.updateInStore('colleges', college);
    }

    async deleteCollege(id) {
        return this.deleteFromStore('colleges', id);
    }

    // Counselling Data Management
    async addCounsellingData(data) {
        return this.addToStore('counselling', data);
    }

    async getCounsellingData(filters = {}) {
        const data = await this.getAllFromStore('counselling');
        
        if (Object.keys(filters).length === 0) {
            return data;
        }

        return data.filter(item => {
            if (filters.type && item.type !== filters.type) return false;
            if (filters.year && item.year !== filters.year) return false;
            if (filters.level && item.level !== filters.level) return false;
            if (filters.round && item.round !== filters.round) return false;
            return true;
        });
    }

    async updateCounsellingData(data) {
        return this.updateInStore('counselling', data);
    }

    async deleteCounsellingData(id) {
        return this.deleteFromStore('counselling', id);
    }

    // Analytics Data Management
    async addAnalyticsData(data) {
        return this.addToStore('analytics', data);
    }

    async getAnalyticsData(filters = {}) {
        const data = await this.getAllFromStore('analytics');
        
        if (Object.keys(filters).length === 0) {
            return data;
        }

        return data.filter(item => {
            if (filters.type && item.type !== filters.type) return false;
            if (filters.date && item.date !== filters.date) return false;
            return true;
        });
    }

    // Cache Management
    async cacheData(url, data) {
        const cacheItem = {
            url: url,
            data: data,
            timestamp: Date.now()
        };
        return this.addToStore('cache', cacheItem);
    }

    async getCachedData(url) {
        try {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(url);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result;
                    if (result && (Date.now() - result.timestamp) < 24 * 60 * 60 * 1000) { // 24 hours
                        resolve(result.data);
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    async clearOldCache() {
        try {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const index = store.index('timestamp');
            const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
            
            const request = index.openCursor();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (cursor.value.timestamp < cutoff) {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error clearing old cache:', error);
        }
    }

    // Generic Store Operations
    async addToStore(storeName, data) {
        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error adding to ${storeName}:`, error);
            throw error;
        }
    }

    async getAllFromStore(storeName) {
        try {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error getting all from ${storeName}:`, error);
            return [];
        }
    }

    async getFromStore(storeName, key) {
        try {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error getting from ${storeName}:`, error);
            return null;
        }
    }

    async updateInStore(storeName, data) {
        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error updating in ${storeName}:`, error);
            throw error;
        }
    }

    async deleteFromStore(storeName, key) {
        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error deleting from ${storeName}:`, error);
            throw error;
        }
    }

    // Data Import/Export
    async exportData(storeName) {
        const data = await this.getAllFromStore(storeName);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${storeName}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importData(storeName, jsonData) {
        try {
            const data = JSON.parse(jsonData);
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Clear existing data
            await this.clearStore(storeName);
            
            // Add new data
            for (const item of data) {
                await this.addToStore(storeName, item);
            }
            
            console.log(`Successfully imported ${data.length} items to ${storeName}`);
            return true;
        } catch (error) {
            console.error(`Error importing data to ${storeName}:`, error);
            return false;
        }
    }

    async clearStore(storeName) {
        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error clearing ${storeName}:`, error);
            throw error;
        }
    }

    // Database Maintenance
    async compactDatabase() {
        try {
            // Clear old cache
            await this.clearOldCache();
            
            // Rebuild indexes
            const stores = ['colleges', 'counselling', 'analytics'];
            for (const storeName of stores) {
                const data = await this.getAllFromStore(storeName);
                await this.clearStore(storeName);
                for (const item of data) {
                    await this.addToStore(storeName, item);
                }
            }
            
            console.log('Database compaction completed');
        } catch (error) {
            console.error('Database compaction failed:', error);
        }
    }

    async getDatabaseStats() {
        try {
            const stats = {};
            const stores = ['colleges', 'counselling', 'analytics', 'cache'];
            
            for (const storeName of stores) {
                const data = await this.getAllFromStore(storeName);
                stats[storeName] = data.length;
            }
            
            return stats;
        } catch (error) {
            console.error('Error getting database stats:', error);
            return {};
        }
    }

    // Sync with remote data
    async syncWithRemote() {
        try {
            // Sync colleges data
            const collegesResponse = await fetch('data/colleges.json');
            const collegesData = await collegesResponse.json();
            
            for (const college of collegesData) {
                await this.updateInStore('colleges', college);
            }
            
            // Sync counselling data
            const counsellingResponse = await fetch('data/counselling.json');
            const counsellingData = await counsellingResponse.json();
            
            for (const item of counsellingData) {
                await this.updateInStore('counselling', item);
            }
            
            console.log('Remote data sync completed');
            return true;
        } catch (error) {
            console.error('Remote data sync failed:', error);
            return false;
        }
    }
}

// Initialize database manager
let dbManager;
document.addEventListener('DOMContentLoaded', () => {
    dbManager = new DatabaseManager();
});

// Export for use in other modules
window.dbManager = dbManager;