import express from "express";
import { app, errorHandler } from "mu";
import config from "./config/config";
import { convertJsonData } from "./lib/conversion";
import { batchInsertExpressions } from "./lib/queries";

app.use(express.json());

app.get("/health", async function (_req, res) {
  res.send({ status: "ok" });
});

app.post("/push-json", async function (req, res) {
  // TODO: add exception handling
  const jsonData = req.body;
  for (const resourceType in config) {
    const eliObjects = convertJsonData(jsonData, resourceType);
    // TODO: This should depend on `resourceType`, avoid hardcoded expression?
    if (eliObjects?.length > 0) {
      await batchInsertExpressions(eliObjects);
    }
    console.info(
      `\n>> Info: found ${eliObjects.length} instances of ${resourceType}`,
    );
  }

  res.status(200).send();
});

app.get("/fetch-json", async function (req, res) {
  // TODO: implement
  // - get endpoint URL from params
  // - try to fetch data from endpoint
  // - parse received json
  res.status(501).send("Not implemented yet");
});

app.use(errorHandler);
