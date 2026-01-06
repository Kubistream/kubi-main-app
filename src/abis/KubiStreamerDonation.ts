export const KubiStreamerDonationAbi = [
  // Regular Donation event
  {
    type: "event",
    name: "Donation",
    inputs: [
      { indexed: true, name: "donor", type: "address" },
      { indexed: true, name: "streamer", type: "address" },
      { indexed: true, name: "tokenIn", type: "address" },
      { indexed: false, name: "amountIn", type: "uint256" },
      { indexed: false, name: "feeAmount", type: "uint256" },
      { indexed: false, name: "tokenOut", type: "address" },
      { indexed: false, name: "amountOutToStreamer", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
  // Cross-chain: Origin chain emits when bridging
  {
    type: "event",
    name: "DonationBridged",
    inputs: [
      { indexed: true, name: "donor", type: "address" },
      { indexed: true, name: "streamer", type: "address" },
      { indexed: true, name: "destinationChain", type: "uint32" },
      { indexed: false, name: "tokenBridged", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "messageId", type: "bytes32" },
    ],
  },
  // Cross-chain: Destination chain emits when receiving
  {
    type: "event",
    name: "BridgedDonationReceived",
    inputs: [
      { indexed: true, name: "originChain", type: "uint32" },
      { indexed: true, name: "donor", type: "address" },
      { indexed: true, name: "streamer", type: "address" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "messageId", type: "bytes32" },
    ],
  },
  // Cross-chain: Bridged donation processed on destination
  {
    type: "event",
    name: "BridgedDonationProcessed",
    inputs: [
      { indexed: true, name: "messageId", type: "bytes32" },
      { indexed: true, name: "streamer", type: "address" },
      { indexed: false, name: "tokenOut", type: "address" },
      { indexed: false, name: "amountOut", type: "uint256" },
      { indexed: false, name: "success", type: "bool" },
    ],
  },
] as const;
