/*
 * WHAT IS THIS FILE?
 *
 * The service-worker.ts file is used to have state of the art prefetching.
 * https://qwik.dev/docs/advanced/speculative-module-fetching/
 *
 * Qwik uses a service worker to speed up your site and reduce latency, ie, not used in the traditional way of offline.
 * You can also use this file to add more functionality that runs in the service worker.
 */
import { setupServiceWorker } from '@qwik.dev/router/service-worker'

setupServiceWorker()

addEventListener('install', () => self.skipWaiting())

addEventListener('activate', () => self.clients.claim())

declare const self: ServiceWorkerGlobalScope
