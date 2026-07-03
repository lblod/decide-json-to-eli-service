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
    # Optional volume for custom configuration
    volumes:
      - ../config/json-to-eli:/config
```

## Configuration
### Configuration file
TODO

### Environment variables
| Name                   | Description                                                                               | Default value                                                      |
|------------------------|-------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| TARGET_GRAPH           | Graph in which the extracted expressions (and works) will in be inserted.                 | "http://mu.semte.ch/graphs/public/pdf"                             |
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
- The language of expression (content) is currently hardcoded to be set to German.  Ideally the language can be configured via the `config` file.
