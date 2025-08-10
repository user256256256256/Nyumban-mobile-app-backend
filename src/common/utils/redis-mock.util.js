// redis-mock.js
// -----------------------------------------
// A fake Redis connection for local development.
// It simulates minimal behavior needed by BullMQ
// without connecting to a real Redis instance.
// -----------------------------------------

export class RedisMock {
    constructor() {
        console.log('[REDIS MOCK] Initialized faje Redis Connection');
    }

    // Simulate "quit" gracefully
    quit() {
        console.log('[REDIS MOCK] Connection closed');
    return Promise.resolve();
}

  // Any method BullMQ might call should exist as a no-op. 
  on(event, cb) {
    console.log(`[REDIS MOCK] Event listener attached: ${event}`)
    return this;
  }
}

/*
    Redis is an in-memory key–value database used for fast data storage and retrieval.

    Use: Often used for caching, session storage, real-time analytics, 
    pub/sub messaging, and as a backend for queues (like BullMQ).

    How it works: Data is stored in memory (RAM) instead of disk, so reads/writes 
    are extremely fast. It supports data structures (strings, lists, sets, hashes) 
    and lets clients connect over TCP to perform commands. 
    In queue systems, it stores job data and coordinates workers processing those jobs.

    Redis runs as a server process on your machine or remote server, and it stores all 
    data directly in the server’s RAM (not on disk, except for optional persistence).

    It communicates with RAM through normal OS memory management — when you set a key, 
    Redis allocates memory from the system, keeps it in process, and serves it back on read without disk access.
*/