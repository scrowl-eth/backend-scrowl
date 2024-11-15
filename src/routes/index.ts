import { Hono } from "hono";
import { logger } from "hono/logger";

import ens from "./ens.route";

export const routes = (app: Hono) => {
  app.use("*", logger());

  app.route("/ens", ens);
};
