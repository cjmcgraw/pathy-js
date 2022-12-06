import type { Bucket } from '@google-cloud/storage'
import type { PathState, StoragePath } from './base'
import { Storage } from '@google-cloud/storage'
import { Readable, Writable } from 'stream'
import { BasePath } from './base'
import {LocalPath} from "./local";

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

  getGcsBucketPath(): string {
    const [bucket, ...parts] = [...this.parents(), this.name()];
    return parts.join(this.state.sep);
  }

  async exists(): Promise<boolean> {
    const path = this.getGcsBucketPath()
    const [acls, meta] = await this.bucket.file(path).acl.get();
    return Boolean(meta);
  }

  touch(): Promise<void> {
    return this.write(Buffer.from(''));
  }

  async rm(options?: { recursive: boolean }): Promise<void> {
    const path = this.getGcsBucketPath();
    await this.bucket.file(path).delete({ignoreNotFound: true});
  }

  async mv(path: string | StoragePath): Promise<StoragePath> {
    const src = this.getGcsBucketPath();
    await this.bucket.file(src).move(path.toString());
    return null as unknown as StoragePath;
  }

  async read(): Promise<Buffer> {
    const path = this.getGcsBucketPath();
    const [contents] = await this.bucket.file(path).download()
    return contents;
  }
  async readCallback(callbackFn: (buf: Buffer) => void): Promise<void> {
    this.readStream().on('data', callbackFn);
  }

  readStream(): Readable {
    const path = this.getGcsBucketPath();
    return this.bucket.file(path).createReadStream();
  }

  async write(buf: Buffer): Promise<void> {
    const ws = this.writeStream();
    ws.write(buf);
    ws.uncork();
    ws.destroy();
  }

  writeStream(): Writable {
    const path = this.getGcsBucketPath();
    return this.bucket.file(path)
      .createWriteStream();
  }

  /////////////////////////////////////////////////////
  // under construction
  ////////////////////////////////////////////////////

  mkdir(options?: { parents: boolean }): Promise<void> {
    throw new Error("GCS has no true notion of a directory");
  }

  isDir(): Promise<boolean> {
    throw new Error("GCS has no true notion of a directory");
  }

  isFile(): Promise<boolean> {
    throw new Error("GCS has no true notion of a file at the end of a directory");
  }

  * glob(pattern: string | undefined): Generator<StoragePath, void, void> {
    return undefined
  }

  * ls(): Generator<StoragePath, void, void> {
    return undefined
  }
}
