export class Logger {
  constructor(
    private readonly context: string,
    private readonly tag?: string,
  ) {}

  child(tag: string): Logger {
    return new Logger(this.context, tag);
  }

  info(message: string, meta?: Record<string, unknown>) {
    console.info(this.format(message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(this.format(message, meta));
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errorDetail = error instanceof Error ? { error: error.message, stack: error.stack } : { error };
    console.error(this.format(message, { ...errorDetail, ...meta }));
  }

  private format(message: string, meta?: Record<string, unknown>): string {
    const prefix = this.tag ? `[${this.context}:${this.tag}]` : `[${this.context}]`;
    const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${prefix} ${message}${suffix}`;
  }
}
