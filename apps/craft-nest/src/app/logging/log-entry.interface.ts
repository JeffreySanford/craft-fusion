// Local copy of shared LogEntry type used by Nest backend
// We keep a duplicate here to avoid TypeScript rootDir conflicts when
// importing from the shared library source code.  This file mirrors the
// definition in libs/craft-library/src/index.ts and should be kept in sync
// if the shared type changes.

export interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  // optional with explicit undefined for exactOptionalPropertyTypes
  metadata?: Record<string, unknown> | undefined;
}
