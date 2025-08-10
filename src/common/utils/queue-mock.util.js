// queue-mock.js
// -----------------------------------------
// In development, this mock queue will
// immediately run jobs in-process instead
// of pushing them to Redis.
// -----------------------------------------

export class QueueMock {
    constructor(name) {
      this.name = name;
      console.log(`[QUEUE MOCK] Queue "${name}" created`);
    }
  
    async add(jobName, data, opts) {
      console.log(`[QUEUE MOCK] Adding job "${jobName}" to "${this.name}"`);
      console.log('[QUEUE MOCK] Data:', data);
      console.log('[QUEUE MOCK] Options:', opts);
  
      // Simulate async delay to mimic real queue behavior
      await new Promise((res) => setTimeout(res, 500));
  
      // Import the mock worker handler directly
      const { notificationWorker } = await import('../../workers/notification.worker.js');
      await notificationWorker.addJob(jobName, data);

      return { id: `mock-job-${Date.now()}` };
    }
}

/*
BullMQ is a **Node.js library** for managing background jobs and queues, 
built on top of Redis.

* **Use:** Schedules tasks, runs them asynchronously, retries on failure, 
and distributes work across multiple workers.
* **How it works:**

  1. You **add a job** to a queue (stored in Redis).
  2. A **worker process** listens to the queue.
  3. Redis passes job data to the worker.
  4. Worker runs the task, marks it complete, or retries on failure.

*/