import {
  update,
  uuid,
  sparqlEscapeUri,
  sparqlEscapeString,
  sparqlEscapeDateTime,
} from "mu";
import { Expression, LanguageString } from "../types";
import { RESOURCE_BASE_URL, TARGET_GRAPH } from "../constants";

// TODO: Something like this should be in the template helpers
function sparqlEscapeLanguageString(value: LanguageString) {
  const escapedString = sparqlEscapeString(value.string);
  // TODO: Should probably do some checks on `language`
  return value.language ? `${escapedString}@${value.language}` : escapedString;
}

// TODO: insert in batches
export async function insertExpression(expression: Expression) {
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
  const insertQuery = `
    PREFIX eli: <http://data.europa.eu/eli/ontology#>
    PREFIX epvoc: <https://data.europarl.europa.eu/def/epvoc#>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX dcterms: <http://purl.org/dc/terms/>

    INSERT DATA {
      GRAPH ${sparqlEscapeUri(TARGET_GRAPH)} {
        ${workUri} a eli:Work ;
                   mu:uuid ${sparqlEscapeString(workUuid)} ;
                   eli:is_realized_by ${expressionUri} .

        ${expressionUri} a eli:Expression ;
                         mu:uuid ${sparqlEscapeString(expressionUuid)} ;
                         eli:realizes ${workUri} ;
                         epvoc:expressionContent ${sparqlEscapeLanguageString(expression.content)} ;
                         dcterms:created ${now} ;
                         dcterms:modified ${now} .
        ${optTitleTriple}
      }
    }`;

  await update(insertQuery);
}
