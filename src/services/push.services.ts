import { ethers } from "ethers";
import { PushAPI, CONSTANTS } from "@pushprotocol/restapi";

const sepoliaProvider = new ethers.JsonRpcProvider(
  "wss://ethereum-sepolia-rpc.publicnode.com"
);
const signer = new ethers.Wallet(process.env.PUSH_PRIVATE_KEY, sepoliaProvider);
const userAlice = await PushAPI.initialize(signer, {
  env: CONSTANTS.ENV.STAGING,
});

export const sendNotif = async (user: string): Promise<number | null> => {
  try {
    const notifData = await userAlice.channel.send([user], {
      notification: {
        title: "You awesome notification",
        body: "from your amazing protocol",
      },
    });
    return notifData.status;
  } catch (error) {
    console.error("Error notifying user:", error);
    throw error;
  }
};
