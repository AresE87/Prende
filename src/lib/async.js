export class TimeoutError extends Error {
  constructor(message = "La operacion supero el tiempo de espera.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function withTimeout(promise, timeoutMs = 4000, message) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new TimeoutError(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    globalThis.clearTimeout(timeoutId);
  });
}

export function isTimeoutError(error) {
  return error instanceof TimeoutError || error?.name === "TimeoutError";
}
