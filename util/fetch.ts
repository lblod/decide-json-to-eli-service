import { MAX_FETCH_RETRIES } from "../constants";

// Adapted from similar function in the oparl-to-eli-service
export async function fetchJsonData(
  sourceUrl: string,
  retriesLeft = MAX_FETCH_RETRIES,
) {
  const response = await fetch(sourceUrl).catch(async (e) => {
    console.warn(`\n>> WARN: failed fetch JSON data: ${e}`);
    return { ok: false, status: 0, json: () => {} };
  });

  console.info(`\n>> INFO: sent request to fetch JSON data from ${sourceUrl}`);

  if (!response.ok) {
    if (retriesLeft > 0) {
      console.warn(
        `\n>> WARN: failed to fetch JSON data, ${retriesLeft} attempts left`,
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 500 * 10 ** (MAX_FETCH_RETRIES - retriesLeft)),
      );

      return fetchJsonData(sourceUrl, retriesLeft - 1);
    } else {
      console.error(
        `\n>> ERROR: failed to fetch JSON data, last response status: ${response.status}`,
      );
      throw new Error(
        `Failed to fetch JSON data, last response status: ${response.status}`,
      );
    }
  }

  return await response.json();
}
