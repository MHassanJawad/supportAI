// HTTP server entrypoint for the SupportAI API.
import { createApp } from "./app";
import { env } from "./config/env";

createApp().listen(env.PORT, () => {
  console.log(JSON.stringify({ level: "info", message: "SupportAI API listening", port: env.PORT }));
});
