import { osmosis } from "osmojs";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { getSigningOsmosisClient } from "osmojs";
import { coins } from "@cosmjs/amino";
import { ibc } from "osmojs"; // Import the IBC module
import Long from "long"; // Add this import statement

const { transfer } = ibc.applications.transfer.v1.MessageComposer.withTypeUrl;

async function ibcTransfer(
  client,
  senderAddress,
  recipientAddress,
  amount,
  denom,
  sourceChannel
) {
  const tenMinutes = 10 * 60 * 1_000_000_000; // 10 minutes in nanoseconds
  const currentTimestampInNanoseconds = Date.now() * 1_000_000; // Convert current time in milliseconds to nanoseconds
  const timeoutTimestamp = Long.fromNumber(
    currentTimestampInNanoseconds + tenMinutes
  ); // Set timeout 10 minutes into the future

  // Using the destructured transfer function for the IBC transfer message
  const msg = transfer({
    sender: senderAddress,
    receiver: recipientAddress,
    token: {
      denom: denom, // The denomination of the token to send
      amount: amount, // Amount of the token in the smallest unit
    },
    sourcePort: "transfer", // The IBC transfer port, usually "transfer"
    sourceChannel: sourceChannel, // The IBC channel ID for the transfer, e.g., "channel-0"
    timeoutTimestamp: timeoutTimestamp, // Use the correctly set timeout timestamp
    //timeoutTimestamp: Long.fromNumber(Date.now() + 600000), // Set a timeout for the transfer, e.g., 10 minutes from now
  });

  // Estimate the fee for the IBC transfer
  const fee = {
    amount: coins(5000, "uosmo"), // Adjust the fee as necessary
    gas: "200000", // Adjust based on the transaction's complexity
  };

  // Wait a few seconds before making the call to help avoid rate limiting
  await delay(5000); // Wait for 5 seconds

  // Sign and broadcast the IBC transfer transaction
  const response = await client.signAndBroadcast(
    senderAddress,
    [msg],
    fee,
    "Send tokens via IBC transfer"
  );

  console.log("IBC Transfer response:", response);

  // Check if the IBC transfer was successful
  if (response.code !== undefined && response.code !== 0) {
    console.error("IBC Transfer failed:", response);
  } else {
    console.log("IBC Transfer success:", response);
  }
}

// Replace the placeholder values with your actual data
const mnemonic =
  "carry adjust animal vibrant load toddler lift retreat emotion cabin there canal dose dirt direct left phone glow ranch cheap spot jewel wide pact";
const rpcEndpoint = "https://osmosis-testnet-rpc.polkachu.com"; // Ensure you're using the correct RPC endpoint
const senderAddress = "osmo1e0d8cwsw4gzdg7k55t4zk3x240tlvxaq8sj4ws"; // Your Osmosis address

// Simple delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Initialize the wallet with the mnemonic
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "osmo",
  });

  // Get a signing client with Osmosis proto/amino messages loaded
  const client = await getSigningOsmosisClient({
    rpcEndpoint: rpcEndpoint,
    signer: wallet,
  });

  // Construct the swap message
  const msg =
    osmosis.gamm.v1beta1.MessageComposer.withTypeUrl.swapExactAmountIn({
      sender: senderAddress,
      routes: [
        {
          poolId: "367", // Example Pool ID, ensure correctness based on your swap needs
          tokenOutDenom:
            "ibc/DE6792CF9E521F6AD6E9A4BDF6225C9571A3B74ACC0A529F92BC5122A39D2E58", // Example output token denom; replace with your target output denom
        },
      ],
      tokenIn: {
        denom: "uosmo", // Example input token denom; replace with your actual input token denom
        amount: "1000", // Amount of the input token you're willing to swap, in the smallest unit
      },
      tokenOutMinAmount: "1", // For demonstration; in practice, calculate this based on your slippage tolerance
    });

  // Estimate the fee
  const fee = {
    amount: coins(50000, "uosmo"),
    gas: "1000000", // Adjust based on your transaction's complexity
  };

  // Wait for a few seconds before making the call to help avoid rate limiting
  await delay(5000); // Wait for 5 seconds

  // Sign and broadcast the transaction
  const response = await client.signAndBroadcast(
    senderAddress,
    [msg],
    fee,
    "Swap tokens using osmojs"
  );

  // console.log("Transaction response:", response);

  // Check if the transaction was successful
  if (response.code !== undefined && response.code !== 0) {
    console.error("Transaction failed:", response);
  } else {
    console.log("Transaction success:", response);

    // Assuming the swap was successful and you now want to transfer tokens
    const recipientAddress = "tnam1qp8mgvgszu83wvn00rkysl0vw0jadfwqqghkyghn"; // Target address on the Cosmos blockchain
    const amount = "1000"; // Amount of the token to send (example: 0.5 uusdc, assuming 6 decimals)
    const denom =
      "ibc/DE6792CF9E521F6AD6E9A4BDF6225C9571A3B74ACC0A529F92BC5122A39D2E58"; // The IBC denom of the swapped token
    const sourceChannel = "channel-6750"; // Example channel, replace with the correct one

    // Call the ibcTransfer function
    await delay(5000);
    await ibcTransfer(
      client,
      senderAddress,
      recipientAddress,
      amount,
      denom,
      sourceChannel
    );
  }
}

main().catch(console.error);
