export function createLogger({ service, stream = console } = {}) {
  const serviceName = service || "forge-hardware-workbench";

  function write(level, event, fields = {}) {
    const payload = {
      ts: new Date().toISOString(),
      level,
      service: serviceName,
      event,
      ...fields
    };
    const line = JSON.stringify(payload);
    if (level === "error") {
      stream.error(line);
    } else {
      stream.log(line);
    }
  }

  return {
    info: (event, fields) => write("info", event, fields),
    warn: (event, fields) => write("warn", event, fields),
    error: (event, fields) => write("error", event, fields)
  };
}

export function durationMs(startedAt) {
  return Math.max(0, Date.now() - startedAt);
}
