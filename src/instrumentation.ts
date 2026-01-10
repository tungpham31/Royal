export async function register() {
  // Only run scheduler on Node.js runtime (not edge, not during build)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { schedulePlaidSync } = await import("@/lib/plaid/scheduler");
    schedulePlaidSync();
  }
}
