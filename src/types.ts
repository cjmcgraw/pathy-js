import type { FileHandle } from 'fs/promises'
import type { Readable, Writable } from 'stream'

export interface StoragePath {
  join: (...paths: string[]) => StoragePath
  touch: () => Promise<void>
  mkdir: (options: {parents: boolean}) => Promise<void>;
  glob(pattern?: string): AsyncIterableIterator<StoragePath>;
  exists: () => Promise<boolean>
  rm: (options?: {recursive: boolean}) => Promise<void>
  read: () => Promise<Buffer>
  write: (buf: Buffer) => Promise<void>
}
