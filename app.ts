import { app, query, errorHandler } from "mu";

app.get("/health", async function (_req, res) {
  res.send({ status: "ok" });
});

app.use(errorHandler);
