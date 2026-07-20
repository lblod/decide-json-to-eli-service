# JSON to ELI service

> [!Warning]
> This service is currently under construction

Service to convert local decisions from JSON format to corresponding linked data following the ELI data model.

## Getting started
### How to add the service to your application
First, add the service to your application's `docker-compose.yml`. Note that the `config` volume is only necessary if you require a different configuration than the [default one](./config/config.ts). See the [configuration section](#configuration) for more information in writing a configuration file.

```yaml
  json-to-eli:
    image: lblod/decide-json-to-eli-service:x.y.z
    environment:
      DEFAULT_MU_AUTH_SCOPE: http://services.semantic.works/decide-json-to-eli-service
    # Optional volume for custom configuration
    volumes:
      - ../config/json-to-eli:/config
```

Second, grant this service the appropriate rights in your mu-authorization configuration. This service uses scopes to limit its access rights, see the corresponding documentation for the [lisp](https://github.com/mu-semtech/sparql-parser#define-access-rights-for-specific-services) or [ODRL](https://github.com/mu-semtech/sparql-parser/tree/feature/odrl-configuration#define-access-rights-for-specific-services-in-odrl) configuration formats. This service needs read and write access to at least:

- a graph for `eli:Expression` and `eli:Work` resources; and
- a graph for `cogs:job`, `task:task`, `nfo:DataContainer`, `hrvst:HarvestingCollection`, `nfo:RemoteDataObject` and `sh:NodeShape`.

> [!Warning]
> Make sure the service is granted write access to exactly 1 graph for each resource type. Otherwise, it will write the same resource to multiple graphs, leading to unpredictable behaviour.

## Configuration
### Configuration file
The configuration file describes how JSON keys should be mapped to properties in an `Expression` object, along with some additional configuration necessary creating appropriate resources. The configuration must contain a `keyMapping` property. This property contains as keys the JSON keys with the name of mapped `Expression` property as value. For example, the following snippet configures that a `title` key in a JSON object corresponds to the `title` property in an `Expression`, and the `data` key to the `content` property:

```js
export default {
  keyMapping: {
    title: "title",
    data: "content",
  }
};
```

> [!Warning]
> This part of the configuration file is likely to change in a future version of the service. Be aware when bumping the service.

Furthermore, a `languages` property must specify at least on language in which expressions are expressed. This is an object with as keys shorthand identifiers for a language and as values the corresponding URI as it is understood by other services in the pipeline. In addition, a `defaultLanguage` property must specify the default language to use. For example, the above snippet can be extended with two language, Dutch and German, where we will default to German:

```js
export default {
  keyMapping: {
    title: "title",
    data: "content",
  },
  languages: {
    de: "http://publications.europa.eu/resource/authority/language/DEU",
    nl: "http://publications.europa.eu/resource/authority/language/NLD",
  } as { [key: string]: string },
  defaultLanguage: "de",
};
```

For a more extensive configuration example, see the [default configuration](./config/config.ts) included in this repository.

### Environment variables
| Name                   | Description                                                                               | Default value                                                      |
|------------------------|-------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| TASK_OPERATION         | The URI of the operation for relevant tasks.                                              | "http://lblod.data.gift/id/jobs/concept/TaskOperation/json-to-eli" |
| TARGET_SHAPE_PREDICATE | The predicate used to link a job resource to its target shape.                            | "http://mu.semte.ch/vocabularies/ext/shapeForTargets"              |
|                        |                                                                                           |                                                                    |
| MISSED_DELTA_CRON      | Frequency with which to check for any missed delta messages, i.e. missed scheduled tasks. | "49 */5 * * *"                                                     |
|                        |                                                                                           |                                                                    |
| BATCH_SIZE             | The maximum number of triples inserted in a single query.                                 | 100                                                                |
| SLEEP_BETWEEN_BATCHES  | The time, in milliseconds, to sleep in between inserting two batches.                     | 1000                                                               |
| MAX_FETCH_RETRIES      | The maximum number of attempts to retry fetching JSON data until the services gives up.   | 3                                                                  |

## API
### GET /health
Returns `{ "status": "ok" }` if the service is running.

### POST /delta
Endpoint on which delta messages from the `delta-notifier` are received for processing. This service expects delta messages in [v0.0.1 ](https://github.com/mu-semtech/delta-notifier/blob/master/README.md#L87) format. When receiving a delta message, the service will query the triplestore to check for any relevant open tasks. The delta message itself is only used as a trigger, its contents are not actually used.

## Caveats
- Each JSON object in the fetched input is converted to an ELI Expression resource.  Conversion to other types of resources is not supported.
- The service will create a new expression for each JSON object, irrelevant of whether the object was already seen before.  It is up to the JSON data provider to avoid providing duplicate data (over time).
- The language of expression (content) is currently hardcoded to be set to German.  Ideally the language can be configured via the `config` file.
