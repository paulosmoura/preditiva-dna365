import "server-only";

import { rename } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const transientCodes = new Set(["EPERM", "EACCES", "EBUSY"]);
const retryDelays = [25, 50, 100, 200, 400, 400];

export async function replaceFileAtomically(source: string, destination: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(source, destination);
      return;
    } catch (error) {
      const retryable = typeof error === "object"
        && error !== null
        && "code" in error
        && typeof error.code === "string"
        && transientCodes.has(error.code);
      if (!retryable || attempt >= retryDelays.length) throw error;
      await delay(retryDelays[attempt]);
    }
  }
}
