import type { PathState, StoragePath } from './base'
import fs from 'fs'
import * as nodePath from 'path'
import glob from 'glob'
import { BasePath } from './base'
import { Readable, Writable } from 'stream'

export class LocalPath extends BasePath implements StoragePath {

  constructor(path?: string|PathState) {
    super(nodePath.sep, path ?? "./");
  }

  createNew(data: PathState): StoragePath {
    return new LocalPath(data);
  }

  * ls(): Generator<StoragePath, void, void> {
    const p = this.toString();
    for (const file of fs.readdirSync(p)) {
      yield new LocalPath(file);
    }
  }

  * glob(pattern?: string): Generator<StoragePath, void, void> {
    const p = this.toString() + nodePath.sep + (pattern ?? "*");
    for (const filepath of glob.sync(p)) {
      if (filepath.length > 0) {
        yield new LocalPath(filepath);
      }
    }
  }

  async touch(): Promise<void> {
    const p = this.toString();
    let fd = fs.openSync(p, 'a');
    fs.closeSync(fd);
  }

  async mkdir(options?: { parents: boolean }): Promise<void> {
    const p = this.toString();
    fs.mkdirSync(p, {recursive: options?.parents});
  }

  async rm(options?: { recursive: boolean }): Promise<void> {
    const p = this.toString();
    await fs.rmSync(p, {...options, force: true});
  }

  async exists(): Promise<boolean> {
    const p = this.toString();
    return fs.existsSync(p);
  }

  async isDir(): Promise<boolean> {
    const p = this.toString();
    return fs.lstatSync(p).isDirectory();
  }

  async isFile(): Promise<boolean> {
    const p = this.toString();
    return fs.lstatSync(p).isFile();
  }

  async read(): Promise<Buffer> {
    const p = this.toString();
    const fd = fs.openSync(p, 'r');
    return fs.readFileSync(fd);
  }

  async readCallback(callbackFn: (buffer: Buffer) => void): Promise<void> {
    this.readStream().on('data', callbackFn);
  }

  readStream(): Readable {
    const p = this.toString();
    return fs.createReadStream(p);
  }

  async write(buf: Buffer): Promise<void> {
    const p = this.toString();
    const fd = fs.openSync(p, 'w');
    fs.writeFileSync(fd, buf);
    fs.closeSync(fd);
  }

  writeStream(): Writable {
    const p = this.toString();
    return fs.createWriteStream(p);
  }
}
