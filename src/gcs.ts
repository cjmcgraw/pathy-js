import type { Bucket } from '@google-cloud/storage'
import type { StoragePath } from './types'
import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import nodePath from 'path'
import { Readable, Writable } from 'stream'

const gcs = new Storage()

class GcsPath implements StoragePath {
  private readonly bucketString: string
  private readonly pathString: string
  private readonly bucket: Bucket

  constructor(bucket: string, path: string, bucketObj?: Bucket) {
    this.bucketString = bucket
    this.pathString = path
    this.bucket = bucketObj ?? gcs.bucket(bucket)
  }

  public join(...paths: string[]): StoragePath {
    return new GcsPath(
      this.bucketString,
      nodePath.join(this.pathString, ...paths),
      this.bucket
    )
  }

  public async glob(pattern?: string): Promise<StoragePath[]> {
    /** unfortunately we cannot actually glob easily. We need to strip off
     * all globbing and use the prefix instead then loop through literally
     * every file... christ
     */
    let prefix = ''
    if (pattern) {
      prefix = pattern.split('*', 1)[0]
    }

    const files = await this.bucket.getFiles({ prefix })
    return files.map(
      foundPath => new GcsPath(
        this.bucketString,
        foundPath,
        this.bucket
      )
    )
  }

  public async rm(options?: { recursive: boolean }): Promise<void> {
  }

  public async exists(): Promise<boolean> {
    const [metadata] = await this.bucket.file(this.pathString).getMetadata()
    return Boolean(metadata?.name)
  }

  public async read(): Promise<Buffer> {
    throw Error('not yet implemented')
  }

  public async write(buf: Buffer): Promise<void> {
    throw Error('not yet implemented')
  }
}
