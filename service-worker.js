const CACHE_NAME = "expense-tracker-v4";

// cache all essential assets (relative to repo path)
const ASSETS = [
  "/personalExpenseTracker/",
  "/personalExpenseTracker/index.html",
  "/personalExpenseTracker/style.css",
  "/personalExpenseTracker/script.js",
  "/personalExpenseTracker/manifest.json",
  "/personalExpenseTracker/logo.png",
  "/personalExpenseTracker/db/indexedDB.js",
  "/personalExpenseTracker/tracker/tracker.js",
  "/personalExpenseTracker/tracker/ui.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (event.request.method === "GET" && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          if (event.request.destination === "document") {
            return caches.match("/personalExpenseTracker/index.html");
          }
        });
    })
  );
});
