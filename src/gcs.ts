import type { Bucket } from '@google-cloud/storage'
import type { PathState, StoragePath } from './base'
import { Storage } from '@google-cloud/storage'
import { Readable, Writable } from 'stream'
import { BasePath } from './base'

const gcs = new Storage()

class GcsPath extends BasePath implements StoragePath {
  private readonly bucket: Bucket

  constructor(path: string | PathState, bucketObj?: Bucket) {
    super("/", path);
    const [bucketName, ..._rest] = this.state.parents;
    this.bucket = bucketObj ?? gcs.bucket(bucketName)
  }

  createNew(data: PathState): StoragePath {
    return new GcsPath(data, this.bucket);
  }

  exists(): Promise<boolean> {
    return this.bucket.exists()
  }

  glob(pattern: string | undefined): Generator<StoragePath, void, void> {
    return undefined
  }

  isDir(): Promise<boolean> {
    return Promise.resolve(false)
  }

  isFile(): Promise<boolean> {
    return Promise.resolve(false)
  }

  ls(): Generator<StoragePath, void, void> {
    return undefined
  }

  touch(): Promise<void> {
    return Promise.resolve(undefined)
  }

  mkdir(options?: { parents: boolean }): Promise<void> {
    return Promise.resolve(undefined)
  }

  rm(options?: { recursive: boolean }): Promise<void> {
    return Promise.resolve(undefined)
  }

  mv(path: string | StoragePath): Promise<StoragePath> {
    return Promise.resolve(undefined)
  }

  read(): Promise<Buffer> {
    return Promise.resolve(undefined)
  }

  readCallback(callbackFn: () => Buffer): Promise<void> {
    return Promise.resolve(undefined)
  }

  readStream(): Readable {
    return undefined
  }


  write(buf: Buffer): Promise<void> {
    return Promise.resolve(undefined)
  }

  writeStream(): Writable {
    return undefined
  }
}
