import {
  update,
  uuid,
  sparqlEscapeUri,
  sparqlEscapeString,
  sparqlEscapeDateTime,
  query,
} from "mu";
import { Expression, LanguageString, TaskData } from "../types";
import {
  EXPRESSIONS_PER_BATCH,
  RESOURCE_BASE_URL,
  SLEEP_BETWEEN_BATCHES,
  STATUS,
  TARGET_SHAPE_PREDICATE,
  TASK_OPERATION,
  TASK_STATUS_PREDICATE,
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
      ${triplesToInsert}
    }`;

  await update(insertQuery);
}

function expressionToTriples(expression: Expression) {
  const workUuid = uuid();
  const workUri = sparqlEscapeUri(RESOURCE_BASE_URL.WORK + workUuid);

  const escapedExpressionUri = sparqlEscapeUri(expression.uri);

  const optTitleTriple = expression.title
    ? `${escapedExpressionUri} eli:title ${sparqlEscapeLanguageString(expression.title)} .`
    : "";

  const now = sparqlEscapeDateTime(new Date());

  // TODO: Is the inverse `eli:realizes` needed?  I added it as the PDF
  // extraction service does it to.  Not sure if any service relies on it.
  const triples = `
    ${workUri} a eli:Work ;
               mu:uuid ${sparqlEscapeString(workUuid)} ;
               eli:is_realized_by ${escapedExpressionUri} .
    ${escapedExpressionUri} a eli:Expression ;
                     mu:uuid ${sparqlEscapeString(expression.uuid)} ;
                     eli:realizes ${workUri} ;
                     epvoc:expressionContent ${sparqlEscapeLanguageString(expression.content)} ;
                     eli:language ${sparqlEscapeUri(expression.language)} ;
                     dcterms:created ${now} ;
                     dcterms:modified ${now} .
    ${optTitleTriple}`;

  return triples;
}

export async function findOpenTaskUris() {
  const result = await query(`
    PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
    SELECT DISTINCT ?task
    WHERE {
      VALUES ?operation {
        ${sparqlEscapeUri(TASK_OPERATION)}
      }
      ?task a task:Task ;
            ${sparqlEscapeUri(TASK_STATUS_PREDICATE)} ${sparqlEscapeUri(STATUS.SCHEDULED)} ;
            task:operation ?operation .
    }
  `);

  return result?.results.bindings?.map((b) => b.task.value) || [];
}

function parseResult<T extends string[]>(result) {
  if (!(result.results && result.results.bindings.length)) return [];

  const bindingKeys = result.head.vars as T[number][];
  const bindings = result.results.bindings as unknown as Array<{
    [Key in T[number]]: {
      datatype: string;
      value: any;
    };
  }>;
  return bindings.map((row) => {
    const obj = {} as { [Key in T[number]]: any };
    bindingKeys.forEach((key) => {
      if (
        row[key] &&
        row[key].datatype == "http://www.w3.org/2001/XMLSchema#integer" &&
        row[key].value
      ) {
        obj[key] = parseInt(row[key].value);
      } else if (
        row[key] &&
        row[key].datatype == "http://www.w3.org/2001/XMLSchema#dateTime" &&
        row[key].value
      ) {
        obj[key] = new Date(row[key].value);
      } else {
        obj[key] = row[key] ? row[key].value : undefined;
      }
    });
    return obj;
  });
}

export async function retrieveTaskData(taskUri: string) {
  // NOTE (03/07/2026): We do not check for task operation or status, the
  // `findOpenTaskUris` function should have returned only URIs for relevant
  // tasks.
  const taskSourceUrl = await query(`
    PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>

    SELECT DISTINCT ?parentJob ?sourceUrl
    WHERE {
      VALUES ?taskUri {
        ${sparqlEscapeUri(taskUri)}
      }
      ?taskUri task:inputContainer ?inputContainer ;
               dcterms:isPartOf ?parentJob .

      ?inputContainer task:hasHarvestingCollection ?collection .
      ?collection dcterms:hasPart ?remoteDataObject .
      ?remoteDataObject nie:url ?sourceUrl .
    }`);

  const result = parseResult(taskSourceUrl);
  if (result?.length) {
    // NOTE (02/07/2026): We assume each relevant task has exactly 1 parent job
    // and remote data object URL.
    return {
      uri: taskUri,
      sourceUrl: result[0].sourceUrl,
      parent: result[0].parentJob,
    } as TaskData;
  } else {
    throw Error("Not an appropriate task resource for json-to-eli conversion");
  }
}

export async function insertShapeForParentJob(
  task: TaskData,
  expressions: Expression[],
) {
  const shapeUuid = uuid();
  const shapeUri = RESOURCE_BASE_URL.SHAPE + shapeUuid;

  const safeExpressionUris = expressions
    .map((exp) => sparqlEscapeUri(exp.uri))
    .join("\n");

  const insert = `
    PREFIX sh: <http://www.w3.org/ns/shacl#>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    INSERT {
      ?shape a sh:NodeShape ;
             mu:uuid ${sparqlEscapeString(shapeUuid)} ;
             sh:targetNode ?node .
      ?job a ext:AnnotationJob ;
           ${sparqlEscapeUri(TARGET_SHAPE_PREDICATE)} ?shape .
    } WHERE {
      VALUES ?job {
        ${sparqlEscapeUri(task.parent)}
      }
      VALUES ?shape {
        ${sparqlEscapeUri(shapeUri)}
      }
      VALUES ?node {
        ${safeExpressionUris}
      }
    }`;
  await update(insert);
}

export async function updateTaskStatus(task: TaskData, newStatus: string) {
  const now = sparqlEscapeDateTime(new Date());
  const insert = `
    PREFIX adms: <http://www.w3.org/ns/adms#>
    PREFIX dcterms: <http://purl.org/dc/terms/>
    DELETE {
      ?task adms:status ?status ;
            dcterms:modified ?modified .
    }
    INSERT {
      ?task adms:status ${sparqlEscapeUri(newStatus)} ;
            dcterms:modified ${now} .
    }
    WHERE {
      VALUES ?task {
        ${sparqlEscapeUri(task.uri)}
      }
      ?task adms:status ?status .
      OPTIONAL { ?task dcterms:modified ?modified . }
  }`;
  try {
    await update(insert);
  } catch (e) {
    throw new Error(`${e.message}\n\nQuery that caused error:\n${insert}`);
  }
}

export async function appendError(task: TaskData, errorMessage: string) {
  const errorUuid = uuid();
  const errorUri = RESOURCE_BASE_URL.ERROR + errorUuid;

  await update(`
    PREFIX oslc: <http://open-services.net/ns/core#>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    PREFIX task: <http://redpencil.data.gift/vocabularies/tasks/>

    INSERT {
      ?error a oslc:Error ;
             mu:uuid ${sparqlEscapeString(errorUuid)} ;
             oslc:message ${sparqlEscapeString(errorMessage)} .
      ${sparqlEscapeUri(task.uri)} task:error ?error .
    } WHERE {
      VALUES ?error {
        ${sparqlEscapeUri(errorUri)}
      }
    }
`);
}
