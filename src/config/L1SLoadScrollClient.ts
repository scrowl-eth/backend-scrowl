import { createPublicClient, http } from "viem";
import { defineChain } from "viem";

// Define the custom chain
const scrollDevnet = defineChain({
  id: 2227728,
  name: "Scroll L1SLOAD Devnet",
  network: "scrollDevnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://l1sload-rpc.scroll.io"],
    },
    public: {
      http: ["https://l1sload-rpc.scroll.io"],
    },
  },
});

// Create the public client
const ScrollL1SLoadClient = createPublicClient({
  chain: scrollDevnet,
  transport: http(),
});

export default ScrollL1SLoadClient;
