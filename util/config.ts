import config from "../config/config";

export function isMappedKey(key: string) {
  return Object.keys(config).includes(key);
}

export function getPropertyForKey(key: string): string | undefined {
  if (isMappedKey(key)) {
    return config[key];
  }
}
