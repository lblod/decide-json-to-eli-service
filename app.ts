import { CronJob } from "cron";
import express from "express";
import { app, errorHandler } from "mu";
import config from "./config/config";
import { MISSED_DELTA_CRON, STATUS } from "./constants";
import { convertJsonData } from "./lib/conversion";
import {
  appendError,
  batchInsertExpressions,
  findOpenTaskUris,
  insertShapeForParentJob,
  retrieveTaskData,
  updateTaskStatus,
} from "./lib/queries";
import { TaskData } from "./types";
import { fetchJsonData } from "./util/fetch";

app.use(express.json());

app.get("/health", async function (_req, res) {
  res.send({ status: "ok" });
});

async function processJsonData(jsonData) {
  const allExpressions = [];
  for (const resourceType in config) {
    const expressions = convertJsonData(jsonData, resourceType);
    allExpressions.push(...expressions);
    // TODO: This should depend on `resourceType`, avoid hardcoded expression?
    await batchInsertExpressions(expressions);

    console.info(
      `\n>> INFO: found ${expressions.length} instances of ${resourceType}`,
    );
  }
  return allExpressions;
}

app.post("/delta", async function (_req, res) {
  // NOTE (02/07/2026): Do not check the received delta message, simply look for
  // open tasks left to be processed.  We are not doing too much here as the
  // delta messages will be filtered by the delta notifier config already.
  await handleOpenTasks().catch((e: any) => {
    console.error(
      `\n>> ERROR: Something went wrong while processing delta message: ${e}`,
    );
  });

  return res.status(200).send().end();
});

async function failTask(taskData: TaskData, message: string) {
  try {
    await updateTaskStatus(taskData, STATUS.FAILED);
    await appendError(taskData, message);
  } catch (e) {
    console.log(
      `\n>> ERROR: An error occurred while failing task ${taskData.uri}`,
    );
    console.error(e);
  }
}

let running: Date | null = null;
async function handleOpenTasks() {
  if (running) {
    console.log(
      `\n>> INFO: Already processing tasks, letting runner know to rerun when done`,
    );
    running = new Date();
    return [];
  }
  const myRunning = new Date();
  running = myRunning;

  const taskUris = await findOpenTaskUris();

  for (const taskUri of taskUris) {
    // - get source URL from input container (error if non found)
    const taskData = await retrieveTaskData(taskUri);
    if (taskData) {
      try {
        const jsonData = await fetchJsonData(taskData.sourceUrl);
        const expressions = await processJsonData(jsonData);
        await insertShapeForParentJob(taskData, expressions);
        await updateTaskStatus(taskData, STATUS.SUCCESS);
      } catch (e) {
        console.log(
          `\n>> WARN: An error occurred while while processing ${taskUri}, failing it`,
        );
        console.error(e);
        await failTask(taskData, e.message);
      }
    } else {
      console.log(
        `\n>> WARN: task ${taskUri} did not contain appropriate data, failing it`,
      );
      await failTask(
        { uri: taskUri } as TaskData,
        "Could not find the necessary data in the task. Should be task -> input container -> harvesting collection -> remote data object with URL.",
      );
    }
  }

  if (running != myRunning) {
    running = null;
    return handleOpenTasks();
  } else {
    running = null;
    return taskUris;
  }
}

CronJob.from({
  cronTime: MISSED_DELTA_CRON,
  onTick: function () {
    handleOpenTasks().catch((e) => {
      console.log(
        "\n>> ERROR: Something went wrong checking for missed deltas, ",
      );
      console.error(e);
    });
  },
  start: true,
});

handleOpenTasks().catch((e) => {
  console.log(
    "\n>> ERROR: Something went wrong checking for missed deltas on startup, ",
  );
  console.error(e);
  process.exit(1);
});

// TODO: Remove the following (+ README)
// Additional API calls, primarily for debugging/development.  In production
// systems this service should only react to delta messages and process tasks.
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

app.get("/test", async function (req, res) {
  const sourceUrl = await retrieveTaskData(
    "http://redpencil.data.gift/id/task/6A466265D581B7FAAC1FE42D",
  );
  res.send(sourceUrl);
});

app.use(errorHandler);
