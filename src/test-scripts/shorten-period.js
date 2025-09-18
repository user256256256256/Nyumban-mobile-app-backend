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
shortenGracePeriod("6bf66971-65ff-4207-9263-b9dfe5ab06b6"); 
