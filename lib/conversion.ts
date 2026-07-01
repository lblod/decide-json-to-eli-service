import { getPropertyForKey } from "../util/config";
import { isKeyForResourceType } from "../util/config";
import { Expression, toLanguageString } from "../types";
import { LANGUAGES } from "../constants";
import { isEmptyObject } from "../util/utils";

export function convertJsonData(jsonData, targetType: string) {
  if (jsonData?.length > 0) {
    // TODO: Should we also throw an error if resulting array is empty?
    return jsonData
      .filter((obj) => !isEmptyObject(obj))
      .map((obj) => convertJsonObject(obj, targetType))
      .filter((obj) => obj);
  } else {
    throw new Error("The received JSON data was not an array.");
  }
}

/**
 * Convert a given JSON entry to is corresponding ELI object.  The keys and
 * values in the given JSON entry are mapped to their ELI counterparts based on
 * the contents of the configuration file.  If the given entry has no mappable
 * keys, nothing will be returned.
 * @param {any} entry - A JSON object.
 * @param {String} targetType - The type of the target ELI resource.
 * @returns {Expression|undefined} An Expression object whose properties are
 *   initialised based on the mapped key-value pairs.
 */
function convertJsonObject(entry, targetType: string) {
  const convertedObj = Object.keys(entry)
    .filter((key) => isKeyForResourceType(key, targetType))
    .reduce((obj, key) => {
      const prop = getPropertyForKey(key, targetType);
      // TODO: not all properties should be language strings
      obj[prop] = toLanguageString(entry[key]);
      return obj;
    }, {}) as Expression; // TODO: used type should depend on targetType

  if (Object.keys(convertedObj).length > 0) {
    // TODO: Ideally, the language can be configured in the config.
    convertedObj.language = LANGUAGES.DE;
    return convertedObj;
  }
}
