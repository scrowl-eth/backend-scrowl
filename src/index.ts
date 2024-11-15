import { Hono } from "hono";
import { routes } from "./routes";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

routes(app);

export default app;
