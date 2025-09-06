// /db/indexedDB.js
export const DB_NAME = "expense-tracker-db";
export const DB_VERSION = 1;
let db;

// Open DB and create object stores if needed
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("expenses")) {
        db.createObjectStore("expenses", { keyPath: "monthKey" });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

// --- Settings store helpers (PIN, isLoggedIn, etc.)
export function saveSetting(key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put({ key, value });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

export function getSetting(key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const req = tx.objectStore("settings").get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = (e) => reject(e.target.error);
  });
}

// --- Expenses store helpers (by monthKey: YYYY-MM)
export function saveMonthData(monthKey, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("expenses", "readwrite");
    tx.objectStore("expenses").put({ monthKey, ...data });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

export function getMonthData(monthKey) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("expenses", "readonly");
    const req = tx.objectStore("expenses").get(monthKey);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

export function getAllMonths() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("expenses", "readonly");
    const req = tx.objectStore("expenses").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}
