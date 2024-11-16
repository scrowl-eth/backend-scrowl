import {
  Address,
  formatEther,
  getAddress,
  getContract,
  encodePacked,
  keccak256,
} from "viem";
import {
  ENS_REGISTRY_ADDRESS,
  ENS_ADDRESS_RESOLVER,
  SCROWL_ENS_RESOLVER_ABI,
  ENS_ABI,
  ENS_RESOLVER_ABI,
  SCROWL_ENS_CONTRACT_ADDRESS,
  SCROWL_WALLET,
} from "../config/contracts";
import Client from "../config/Client";
import EnsWalletClient from "../config/EnsWalletClient";
import ScrollL1SLoadClient from "../config/L1SLoadScrollClient";
import { ethers } from "ethers";

export const getENS = async (ensName: string): Promise<Address | null> => {
  try {
    // Resolve ENS name to Ethereum address
    const address = await Client.getEnsAddress({
      name: ensName,
    });

    const name = namehash(ensName);
    console.log(`Namehash of ${ensName} is ${name}`);

    if (!address) {
      return null;
    }

    const checksumAddress = getAddress(address);
    console.log(`Resolved ${ensName} to ${checksumAddress}`);
    return checksumAddress;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    throw error;
  }
};

export const getENSScroll = async (
  ensScrollName: string
): Promise<Address | null> => {
  try {
    const scrollDevnetContract = getContract({
      address: SCROWL_ENS_CONTRACT_ADDRESS,
      abi: SCROWL_ENS_RESOLVER_ABI,
      client: ScrollL1SLoadClient,
    });

    const fullName = `${ensScrollName}.scrowl.eth`;

    const fullNameHash = namehash(fullName);

    console.log(`Namehash of ${ensScrollName} is ${fullNameHash}`);

    const resolvedAddress: any = await scrollDevnetContract.read.resolveENS([
      fullNameHash,
    ]);

    if (resolvedAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    const dataReturn = getAddress(resolvedAddress);
    return dataReturn;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    throw error;
  }
};

export const createSubEns = async (
  subdomainName: string,
  givenSubdomainAddress: `0x${string}`,
  parentDomain: string = "scrowl.eth"
) => {
  try {
    const subDomainaddressOwner = await getENSScroll(subdomainName);
    if (subDomainaddressOwner) {
      throw new Error(`Subdomain ${subdomainName} already exists`);
    }
    // Get the ENS registry contract
    const registryContract = getContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: ENS_ABI,
      client: EnsWalletClient,
    });

    const resolverContract = getContract({
      address: ENS_ADDRESS_RESOLVER,
      abi: ENS_RESOLVER_ABI,
      client: EnsWalletClient,
    });

    // Calculate the namehash of the parent domain
    const parentNamehash = namehash(parentDomain);

    const txSubnodeRecordParams = [
      parentNamehash,
      subdomainName,
      SCROWL_WALLET,
      ENS_ADDRESS_RESOLVER,
      BigInt(0),
      0, // Fuses
      BigInt(0), // Expiry
    ];

    const fullNameHash = namehash(`${subdomainName}.scrowl.eth`);

    const txSetAddrParams = [fullNameHash, "2148018000", givenSubdomainAddress];

    const txSubnodeRecord = await createTransactionSubnodeRecord(
      registryContract,
      txSubnodeRecordParams
    );
    const receiptRecord = await waitForTransactionWithRetry(txSubnodeRecord);

    const txSetAddr = await createTransactionSetAddr(
      resolverContract,
      txSetAddrParams
    );

    const receiptSetAddr = await waitForTransactionWithRetry(txSetAddr);

    const formatGasData = (receipt: any) => ({
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: formatEther(receipt.effectiveGasPrice),
      totalGasCost: formatEther(
        BigInt(receipt.gasUsed) * receipt.effectiveGasPrice
      ),
    });

    const recordGasData = formatGasData(receiptRecord);

    const setAddrGasData = formatGasData(receiptSetAddr);

    return {
      ens: `${subdomainName}.${parentDomain}`,
      owner: givenSubdomainAddress,
      transactions: {
        setSubnodeRecord: {
          hash: txSubnodeRecord,
          ...recordGasData,
        },
        setAddr: {
          hash: txSetAddr,
          ...setAddrGasData,
        },
      },
    };
  } catch (error) {
    console.error("Error creating subdomain:", error);
    throw error;
  }
};

const waitForTransactionWithRetry = async (
  hash: `0x${string}`,
  maxAttempts = 5,
  delayMs = 5000
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const receipt = await Client.waitForTransactionReceipt({ hash });
      return receipt;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(
        `Attempt ${attempt} failed. Retrying in ${delayMs / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

async function createTransactionSubnodeRecord(
  registryContract: any,
  txParams: any
) {
  try {
    const tx = await registryContract.write.setSubnodeRecord(txParams);
    return tx;
  } catch (error) {
    console.error("Error creating createTransactionSubnodeRecord:", error);
    throw error;
  }
}

async function createTransactionSetAddr(resolverContract: any, txParams: any) {
  try {
    const tx = await resolverContract.write.setAddr(txParams);
    return tx;
  } catch (error) {
    console.error("Error creating createTransactionSubnodeRecord:", error);
    throw error;
  }
}

// Helper function to calculate namehash
function namehash(name: string): string {
  let node =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (name) {
    const labels = name.split(".");
    for (let i = labels.length - 1; i >= 0; i--) {
      node = keccak256(
        encodePacked(
          ["bytes32", "bytes32"],
          [
            node as `0x${string}`,
            keccak256(encodePacked(["string"], [labels[i]])),
          ]
        )
      );
    }
  }
  return node;
}
