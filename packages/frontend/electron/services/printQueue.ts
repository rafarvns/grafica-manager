const queues = new Map<string, Promise<unknown>>();

export function enqueueForPrinter<T>(
  printerName: string,
  task: () => Promise<T>
): Promise<T> {
  const previous = queues.get(printerName) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => task());
  queues.set(printerName, next);
  next.finally(() => {
    if (queues.get(printerName) === next) {
      queues.delete(printerName);
    }
  });
  return next;
}
