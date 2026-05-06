"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueForPrinter = enqueueForPrinter;
const queues = new Map();
function enqueueForPrinter(printerName, task) {
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
//# sourceMappingURL=printQueue.js.map