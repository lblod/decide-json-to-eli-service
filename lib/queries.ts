import {
  update,
  uuid,
  sparqlEscapeUri,
  sparqlEscapeString,
  sparqlEscapeDateTime,
} from "mu";
import { Expression, LanguageString } from "../types";
import {
  EXPRESSIONS_PER_BATCH,
  RESOURCE_BASE_URL,
  SLEEP_BETWEEN_BATCHES,
  TARGET_GRAPH,
} from "../constants";

// TODO: Something like this should be in the template helpers
function sparqlEscapeLanguageString(value: LanguageString) {
  const escapedString = sparqlEscapeString(value.string);
  // TODO: Should probably do some checks on `language`
  return value.language ? `${escapedString}@${value.language}` : escapedString;
}

export async function batchInsertExpressions(expressions: Expression[]) {
  for (let i = 0; i < expressions.length; i += EXPRESSIONS_PER_BATCH) {
    const batchedExpressions = expressions.slice(i, i + EXPRESSIONS_PER_BATCH);
    console.info(
      `\n>> INFO: Inserting expressions ${i} to ${i + batchedExpressions.length - 1} out of ${expressions.length}`,
    );
    await insertExpressions(batchedExpressions);

    if (i + EXPRESSIONS_PER_BATCH < expressions.length) await sleep();
  }
}

async function sleep() {
  if (SLEEP_BETWEEN_BATCHES > 0) {
    console.info(`>> INFO: Sleeping for ${SLEEP_BETWEEN_BATCHES} ms.`);
    return new Promise((resolve) => setTimeout(resolve, SLEEP_BETWEEN_BATCHES));
  }
}

async function insertExpressions(expressions: Expression[]) {
  const triplesToInsert = expressions
    .flatMap((expression) => expressionToTriples(expression))
    .join("\n\n");

  const insertQuery = `
    PREFIX eli: <http://data.europa.eu/eli/ontology#>
    PREFIX epvoc: <https://data.europarl.europa.eu/def/epvoc#>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX dcterms: <http://purl.org/dc/terms/>

    INSERT DATA {
      GRAPH ${sparqlEscapeUri(TARGET_GRAPH)} {
        ${triplesToInsert}
      }
    }`;

  await update(insertQuery);
}

function expressionToTriples(expression: Expression) {
  const workUuid = uuid();
  const workUri = sparqlEscapeUri(RESOURCE_BASE_URL.WORK + workUuid);

  const expressionUuid = uuid();
  const expressionUri = sparqlEscapeUri(
    RESOURCE_BASE_URL.EXPRESSION + expressionUuid,
  );

  const optTitleTriple = expression.title
    ? `${expressionUri} eli:title ${sparqlEscapeLanguageString(expression.title)} .`
    : "";

  const now = sparqlEscapeDateTime(new Date());

  // TODO: Is the inverse `eli:realizes` needed?  I added it as the PDF
  // extraction service does it to.  Not sure if any service relies on it.
  const triples = `
    ${workUri} a eli:Work ;
               mu:uuid ${sparqlEscapeString(workUuid)} ;
               eli:is_realized_by ${expressionUri} .
    ${expressionUri} a eli:Expression ;
                     mu:uuid ${sparqlEscapeString(expressionUuid)} ;
                     eli:realizes ${workUri} ;
                     epvoc:expressionContent ${sparqlEscapeLanguageString(expression.content)} ;
                     eli:language ${sparqlEscapeUri(expression.language)} ;
                     dcterms:created ${now} ;
                     dcterms:modified ${now} .
        ${optTitleTriple}`;

  return triples;
}
