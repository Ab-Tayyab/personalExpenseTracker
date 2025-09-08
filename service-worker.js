const CACHE_NAME = "expense-tracker-v6"; // bump version on each update

const ASSETS = [
  "/personalExpenseTracker/",
  "/personalExpenseTracker/index.html",
  "/personalExpenseTracker/style.css",
  "/personalExpenseTracker/app.js",
  "/personalExpenseTracker/manifest.json",
  "/personalExpenseTracker/logo.png",
  "/personalExpenseTracker/db/indexedDB.js",
  "/personalExpenseTracker/tracker/tracker.js",
  "/personalExpenseTracker/tracker/ui.js",
  "/personalExpenseTracker/offline.html" // optional fallback page
];

// Install: cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // activate new SW immediately
});

// Activate: clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control right away
});

// Fetch: stale-while-revalidate + fallback
self.addEventListener("fetch", (event) => {
  let req = event.request;

  // Fix old wrong root path requests
  if (req.url.endsWith("/index.html") && !req.url.includes("/personalExpenseTracker/")) {
    req = new Request("/personalExpenseTracker/index.html");
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (req.method === "GET" && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, return cached or offline page
          return cachedResponse || caches.match("/personalExpenseTracker/offline.html");
        });

      return cachedResponse || fetchPromise;
    })
  );
});
