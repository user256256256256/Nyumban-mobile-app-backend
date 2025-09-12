import prisma from '../prisma-client.js';

async function shortenGracePeriod(evictionId) {
  const newGrace = new Date();
  newGrace.setMinutes(newGrace.getMinutes() + 1); // 1 min from now

  const updated = await prisma.eviction_logs.update({
    where: { id: evictionId },
    data: { grace_period_end: newGrace },
  });

  console.log(`[DEBUG] Grace period updated for eviction ${evictionId}:`, updated.grace_period_end);
}

// Example usage
shortenGracePeriod("eedd515a-3030-4250-8045-ef942447f412"); // replace with your evictionId
