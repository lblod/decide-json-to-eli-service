import config from "../config/config";

export function isKeyForResourceType(key: string, resourceType: string) {
  const resourceConfig = config[resourceType];
  if (resourceConfig) {
    return Object.keys(resourceConfig).includes(key);
  }
}

export function getPropertyForKey(key: string, resourceType: string) {
  if (isKeyForResourceType(key, resourceType)) {
    const resourceConfig = config[resourceType];
    return resourceConfig[key];
  }
}