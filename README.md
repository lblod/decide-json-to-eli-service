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
| Name                  | Description                                                               | Default value                          |
|-----------------------|---------------------------------------------------------------------------|----------------------------------------|
| TARGET_GRAPH          | Graph in which the extracted expressions (and works) will in be inserted. | "http://mu.semte.ch/graphs/public/pdf" |
| BATCH_SIZE            | The maximum number of triples inserted in a single query.                 | 100                                    |
| SLEEP_BETWEEN_BATCHES | The time, in milliseconds, to sleep in between inserting two batches      | 1000                                   |

## API
### GET /health
Returns `{ "status": "ok" }` if the service is running.

### POST /push-json
Endpoint to which JSON data can be pushed directly. The request body must contain JSON data that can be converted into ELI data based on the mapping in the configuration file.

### GET /fetch-json
TODO
