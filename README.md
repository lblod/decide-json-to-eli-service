# JSON to ELI service

> [!Warning]
> This service is currently under construction

Service to convert local decisions from JSON format to corresponding linked data following the ELI data model.

## Getting started
TODO

## Configuration
### Configuration file
TODO

### Environment variables
| Name         | Description                                                               | Default value                          |
|--------------|---------------------------------------------------------------------------|----------------------------------------|
| TARGET_GRAPH | Graph in which the extracted expressions (and works) will in be inserted. | "http://mu.semte.ch/graphs/public/pdf" |

## API
### GET /health
Returns `{ "status": "ok" }` if the service is running.

### POST /push-json
Endpoint to which JSON data can be pushed directly. The request body must contain JSON data that can be converted into ELI data based on the mapping in the configuration file.

### GET /fetch-json
TODO
