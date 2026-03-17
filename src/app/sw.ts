/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: WorkerGlobalScope & typeof globalThis

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API calls — network first, fallback to cache
    {
      matcher: /\/api\/.*/i,
      handler: new NetworkFirst({
        cacheName: "cortex-api-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24, // 24h
          }),
        ],
        networkTimeoutSeconds: 10,
      }),
    },
    // Images — cache first
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: new CacheFirst({
        cacheName: "cortex-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // Fonts — cache first, long lived
    {
      matcher: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: new CacheFirst({
        cacheName: "cortex-fonts",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          }),
        ],
      }),
    },
    // JS/CSS — stale while revalidate
    {
      matcher: /\.(?:js|css)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: "cortex-static",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          }),
        ],
      }),
    },
    // Default caching from serwist
    ...defaultCache,
  ],
  // Offline fallback — serves /offline when a navigation request fails
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document"
        },
      },
    ],
  },
})

serwist.addEventListeners()
