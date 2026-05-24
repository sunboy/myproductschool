const REDACT_PATTERNS = [
  /[\w.+-]+@[\w-]+\.[\w.]+/g,                                           // email addresses
  /cus_[a-zA-Z0-9]+/g,                                                  // Stripe customer IDs
  /sub_[a-zA-Z0-9]+/g,                                                  // Stripe subscription IDs
  /sk_(live|test)_[a-zA-Z0-9]+/g,                                       // Stripe secret keys
  /sk-ant-[a-zA-Z0-9\-]+/g,                                             // Anthropic keys
  /eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g,           // JWTs
]

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    let result = value
    for (const pattern of REDACT_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]')
    }
    return result
  }
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, redact(v)])
    )
  }
  return value
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data ? { data: redact(data) as Record<string, unknown> } : {}),
  }

  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
  info:  (msg: string, data?: Record<string, unknown>) => log('info',  msg, data),
  warn:  (msg: string, data?: Record<string, unknown>) => log('warn',  msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
}
