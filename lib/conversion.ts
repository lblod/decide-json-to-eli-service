import { getPropertyForKey } from "../util/config";
import { isMappedKey } from "../util/config";
import { Expression, toLanguageString } from "../types";
import { RESOURCE_BASE_URL } from "../constants";
import { isEmptyObject } from "../util/utils";
import { uuid } from "mu";
import config from "../config/config";

export function convertJsonData(jsonData: any) {
  if (jsonData?.length > 0) {
    return jsonData
      .filter((obj: any) => !isEmptyObject(obj))
      .map((obj: any) => convertJsonObject(obj))
      .filter((obj: any) => obj);
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
  const convertedObj = (Object.keys(entry) as { [key: string]: any })
    .filter((key: string) => isMappedKey(key))
    .reduce((obj: any, key: string) => {
      const prop = getPropertyForKey(key);
      if (prop) {
        // TODO: not all properties should be language strings
        obj[prop] = toLanguageString(entry[key]);
        return obj;
      } else {
        return null;
      }
    }, {}) as Expression;

  if (!isEmptyObject(convertedObj)) {
    convertedObj.uuid = uuid();
    convertedObj.uri = RESOURCE_BASE_URL.EXPRESSION + convertedObj.uuid;
    convertedObj.language = config.languages[config.defaultLanguage];
    return convertedObj;
  } else {
    return undefined;
  }
}
