export const RESOURCE_BASE_URL = {
  WORK: "http://data.lblod.info/id/works/",
  EXPRESSION: "http://data.lblod.info/id/expressions/",
  SHAPE: "http://redpencil.data.gift/id/shapes/",
  ERROR: "http://redpencil.data.gift/id/jobs/error/",
};

export const MAX_FETCH_RETRIES = parseInt(process.env.MAX_FETCH_RETRIES || "3");

//
// Task processing
//
export const TASK_OPERATION =
  process.env.TASK_OPERATION ||
  "http://lblod.data.gift/id/jobs/concept/TaskOperation/json-to-eli";

export const JOB_GRAPH =
  process.env.JOB_GRAPH || "http://mu.semte.ch/graphs/harvesting";

export const TASK_STATUS_PREDICATE = "http://www.w3.org/ns/adms#status";

export const STATUS = {
  PREPARING: "http://redpencil.data.gift/id/concept/JobStatus/preparing",
  BUSY: "http://redpencil.data.gift/id/concept/JobStatus/busy",
  SCHEDULED: "http://redpencil.data.gift/id/concept/JobStatus/scheduled",
  SUCCESS: "http://redpencil.data.gift/id/concept/JobStatus/success",
  FAILED: "http://redpencil.data.gift/id/concept/JobStatus/failed",
};

export const TARGET_SHAPE_PREDICATE =
  process.env.TARGET_SHAPE_PREDICATE ||
  "http://mu.semte.ch/vocabularies/ext/shapeForTargets";

export const MISSED_DELTA_CRON =
  process.env.MISSED_DELTA_CRON || "49 */5 * * *";

//
// Batch processing
//
export const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "100");
export const SLEEP_BETWEEN_BATCHES = parseInt(
  process.env.SLEEP_BETWEEN_BATCHES || "1000",
);
// NOTE (30/06/2026): For consistency with other services we opted to use
// `BATCH_SIZE` as environment variable to specify the maximum number of triples
// to insert at once. Per expression 10 triples (7 for expression resource and 4
// for work resource) will be inserted. The following uses this to split the
// expressions into smaller batches thereby ensuring each expression, and
// corresponding work, is fully contained within a single batch so we do not
// insert incomplete resources.
export const EXPRESSIONS_PER_BATCH = Math.ceil(BATCH_SIZE / 10);
