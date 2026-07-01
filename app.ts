import express from "express";
import { app, errorHandler } from "mu";
import config from "./config/config";
import { convertJsonData } from "./lib/conversion";
import { batchInsertExpressions } from "./lib/queries";
import { fetchJsonData } from "./util/fetch";

app.use(express.json());

app.get("/health", async function (_req, res) {
  res.send({ status: "ok" });
});

async function processJsonData(jsonData) {
  for (const resourceType in config) {
    const eliObjects = convertJsonData(jsonData, resourceType);
    // TODO: This should depend on `resourceType`, avoid hardcoded expression?
    await batchInsertExpressions(eliObjects);

    console.info(
      `\n>> INFO: found ${eliObjects.length} instances of ${resourceType}`,
    );
  }
}

app.post("/push-json", async function (req, res) {
  const jsonData = req.body;
  await processJsonData(jsonData).catch((e) => {
    console.log(
      `\n>> ERROR: something went wrong when processing the JSON data`,
    );
    console.error(e);
  });
  res.status(200).send();
});

app.get("/fetch-json/:jsonEndpoint", async function (req, res) {
  const url = req.params.jsonEndpoint;
  const jsonData = await fetchJsonData(url).catch((e) => {
    console.log(
      `\n>> ERROR: something went wrong while fetching the JSON data`,
    );
    console.error(e);
  });
  await processJsonData(jsonData).catch((e) => {
    console.log(
      `\n>> ERROR: something went wrong when processing the JSON data`,
    );
    console.error(e);
  });
  res.status(200).send();
});

app.use(errorHandler);
