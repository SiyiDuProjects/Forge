# Observability

The local server writes one JSON log line per request.

## Log Format

Example:

```json
{
  "ts": "2026-06-03T00:00:00.000Z",
  "level": "info",
  "service": "forge-hardware-workbench",
  "event": "http_request",
  "method": "GET",
  "path": "/api/health",
  "status": 200,
  "duration_ms": 4
}
```

Errors also emit `request_failed` with the method, path, status, and message.

## Signals To Watch

- `status >= 500`: server bug or unexpected exception
- `status == 400`: malformed JSON request body
- `status == 404`: missing route or asset
- High `duration_ms`: slow local file or pipeline handling

## Boundary

This is local observability for the prototype. It does not send telemetry, metrics, or alerts to external services.
