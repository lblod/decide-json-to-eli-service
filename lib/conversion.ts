import { getPropertyForKey } from "../util/config";
import { isMappedKey } from "../util/config";
import { Expression, toLanguageString } from "../types";
import { LANGUAGES, RESOURCE_BASE_URL } from "../constants";
import { isEmptyObject } from "../util/utils";
import { uuid } from "mu";

export function convertJsonData(jsonData) {
  if (jsonData?.length > 0) {
    return jsonData
      .filter((obj) => !isEmptyObject(obj))
      .map((obj) => convertJsonObject(obj))
      .filter((obj) => obj);
  } else {
    throw new Error("The received JSON data was not an array.");
  }
}

/**
 * Convert a given JSON entry to its corresponding ELI Expression.  The keys and
 * values in the given JSON entry are mapped to their ELI counterparts based on
 * the contents of the configuration file.  If the given entry has no mappable
 * keys, nothing will be returned.
 * @param {any} entry - A parsed JSON object.
 * @returns {Expression|undefined} An Expression object whose properties are
 *   initialised based on the mapped key-value pairs.
 */
function convertJsonObject(entry: any): Expression | undefined {
  const convertedObj = Object.keys(entry)
    .filter((key) => isMappedKey(key))
    .reduce((obj, key) => {
      const prop = getPropertyForKey(key);
      // TODO: not all properties should be language strings
      obj[prop] = toLanguageString(entry[key]);
      return obj;
    }, {}) as Expression;

  if (!isEmptyObject(convertedObj)) {
    convertedObj.uuid = uuid();
    convertedObj.uri = RESOURCE_BASE_URL.EXPRESSION + convertedObj.uuid;
    // TODO: Ideally, the language can be configured in the config.
    convertedObj.language = LANGUAGES.DE;
    return convertedObj;
  }
}
