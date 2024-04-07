import { osmosis } from "osmojs";

async function findPoolIdForPair(rpcEndpoint, tokenADenom, tokenBDenom) {
  const client = await osmosis.ClientFactory.createRPCQueryClient({
    rpcEndpoint,
  });

  try {
    // Fetch all pools
    const response = await client.osmosis.gamm.v1beta1.pools();
    console.log("Fetched pools successfully");

    // Ensure that 'pools' is an array and iterate through it
    if (Array.isArray(response.pools)) {
      for (const pool of response.pools) {
        // Safely access 'poolAssets' with a check
        const poolAssets = pool.poolAssets
          ? pool.poolAssets.map(asset => asset.token.denom)
          : [];
        console.log(
          `Checking pool ID ${pool.id.toString()} with assets:`,
          poolAssets
        );

        if (
          poolAssets.includes(tokenADenom) &&
          poolAssets.includes(tokenBDenom)
        ) {
          console.log(
            `Found pool for ${tokenADenom} and ${tokenBDenom}:`,
            pool.id.toString()
          );
          return pool.id.toString(); // Return the pool ID as a string
        }
      }
    } else {
      console.error("Unexpected structure: 'pools' is not an array.");
    }
  } catch (error) {
    console.error("Error fetching or processing pools:", error);
  }

  console.log(`No pool found for ${tokenADenom} and ${tokenBDenom}`);
  return null;
}

// Example usage
const RPC_ENDPOINT = "https://rpc.testnet.osmosis.zone";
const usdcDenom = "uusdc"; // Replace with actual USDC denom
const osmoDenom = "uosmo"; // Replace with actual OSMO denom, if different
findPoolIdForPair(
  "https://rpc.testnet.osmosis.zone",
  usdcDenom,
  osmoDenom
).catch(console.error);
