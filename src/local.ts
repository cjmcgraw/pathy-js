import type { StoragePath } from './types'
import fs from 'fs'
import * as nodePath from 'path'
import glob from 'glob'
export class LocalPath implements StoragePath {
  private readonly filepath: string

  constructor(path: string) {
    this.filepath = nodePath.resolve(path)
  }

  public join(...paths: string[]): StoragePath {
    return new LocalPath(
      nodePath.join(this.filepath, ...paths)
    )
  }

  public async mkdir(options?: { parents: boolean }): Promise<void> {
    fs.mkdirSync(this.filepath, { recursive: options?.parents })

  }

  public async touch(): Promise<void> {
    const fd = fs.openSync(this.filepath, 'a')
    fs.closeSync(fd)
  }

  public async * glob(pattern?: string): AsyncIterableIterator<StoragePath> {
    const p = nodePath.join(this.filepath, pattern || '*')
    for (const foundFile of glob.sync(p)) {
      yield new LocalPath(foundFile)
    }
  }

  public async exists(): Promise<boolean> {
    return fs.existsSync(this.filepath)
  }

  public async rm(options?: { recursive: boolean }): Promise<void> {
    await fs.rmSync(this.filepath, { ...options, force: true })
  }

  public async read(): Promise<Buffer> {
    return fs.readFileSync(this.filepath)
  }

  public async write(buf: Buffer): Promise<void> {
    const dirname = nodePath.dirname(this.filepath)
    await fs.promises.mkdir(dirname, { recursive: true })
    await fs.writeFileSync(this.filepath, buf)
  }
}
