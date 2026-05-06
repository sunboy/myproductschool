# API Conventions

Error responses use `apiError(status, code, message, details?)` from `src/lib/api/error.ts`.

Shape:

```json
{
  "ok": false,
  "error": "Human-readable message or legacy error code",
  "code": "stable_machine_code",
  "details": {}
}
```

For compatibility, object `details` are also mirrored onto the top-level response. That keeps existing consumers of fields such as `retryAfter`, `used`, `limit`, and `issues` working while new code can rely on `code` and `details`.

Production responses hide details for 5xx errors and replace the message with a generic failure string. Client-safe 4xx details such as validation issues may still be returned.
