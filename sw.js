const CACHE = "ahorita-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./core.mjs",
  "./game-core.mjs",
  "./achievement-core.mjs",
  "./title-catalog.mjs",
  "./economy-store.mjs",
  "./economy-core.mjs",
  "./reward-ui.mjs",
  "./game-ui.mjs",
  "./skills-core.mjs",
  "./journey-core.mjs",
  "./journey-ui.mjs",
  "./weight-shortcuts.mjs",
  "./exercise-identity.mjs",
  "./training-core.mjs",
  "./training-ui.mjs",
  "./reps-icon-180-v9.png",
  "./reps-icon-192-v9.png",
  "./reps-icon-512-v9.png",
  "./exercise-library.mjs",
  "./skills-ui.mjs",
  "./app.mjs",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon.svg",
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" }))),
      )
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("ahorita-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  if (
    e.request.method !== "GET" ||
    new URL(e.request.url).origin !== self.location.origin
  )
    return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request)),
  );
});
