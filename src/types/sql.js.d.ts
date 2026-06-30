declare module 'sql.js' {
  /** A single result set from Database.exec(). */
  export interface QueryExecResult {
    columns: string[]
    values: SqlValue[][]
  }

  export type SqlValue = number | string | Uint8Array | null

  export interface Database {
    /** Execute one or more statements with no result handling (DDL, seeds). */
    run(sql: string): Database
    /** Execute SQL and return one QueryExecResult per result-producing statement. */
    exec(sql: string): QueryExecResult[]
    /** Free the database memory. */
    close(): void
  }

  export interface SqlJsStatic {
    Database: {
      new (data?: ArrayLike<number> | Buffer | null): Database
    }
  }

  export interface InitSqlJsConfig {
    wasmBinary?: ArrayLike<number> | Buffer
    locateFile?: (file: string) => string
  }

  export default function initSqlJs(config?: InitSqlJsConfig): Promise<SqlJsStatic>
}
