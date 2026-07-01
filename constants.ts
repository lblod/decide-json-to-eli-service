export const TARGET_GRAPH =
  process.env.TARGET_GRAPH || "http://mu.semte.ch/graphs/public/pdf";

export const RESOURCE_BASE_URL = {
  WORK: "http://data.lblod.info/id/works/",
  EXPRESSION: "http://data.lblod.info/id/expressions/",
};

export enum LANGUAGES {
  DE = "http://publications.europa.eu/resource/authority/language/DEU",
}

export const MAX_FETCH_RETRIES = parseInt(process.env.MAX_FETCH_RETRIES || "3");

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
