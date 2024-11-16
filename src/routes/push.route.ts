import { sendNotif } from "../services/push.services";
import { Hono } from "hono";

const push = new Hono();

push.get("/sendNotif", async (c) => {
  //   const body: any = await c.req.json();
  try {
    let notifData = await sendNotif(
      "0xA6a49d09321f701AB4295e5eB115E65EcF9b83B5"
    );
    return c.json({ success: notifData });
  } catch (error) {
    console.error("Error in sendNotif:", error);
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

export default push;
