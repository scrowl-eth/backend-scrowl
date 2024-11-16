import { Hono } from "hono";
import { routes } from "./routes";
import { ethers } from "ethers";

const app = new Hono();

routes(app);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.onError((error, c) => {
  console.log(error);

  //   console.log(error);
  //   return c.json({ error, message: error.message }, { status: 403 });

  console.log(c.error);
  return c.json(
    { error, message: error.message || "Custom Error Message" },
    500
  );
});

export default app;
