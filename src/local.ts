import type { StoragePath } from './base'
import fs from 'fs'
import * as nodePath from 'path'
import glob from 'glob'
import { BasePath } from './base'

export class LocalPath extends BasePath implements StoragePath {
  constructor(path: string) {
    super();
    this.base = nodePath.dirname(path);
    this.ext = nodePath.extname(path);
    this.name = nodePath.basename(path, this.ext);
  }


  public join(...paths: string[]): StoragePath {
    return new LocalPath(
      this.fullPath({
        base: nodePath.join(this.base, ...paths),
      })
    )
  }

  public async mkdir(options?: { parents: boolean }): Promise<void> {
    fs.mkdirSync(this.base, { recursive: options?.parents })
  }

  public async touch(): Promise<void> {
    const filePath = this.fullPath();
    const fileNameWithExt = nodePath.basename(filePath);
    const extName = nodePath.extname(filePath);
    this.name = fileNameWithExt.
    const [...nameParts, ext]
    if (!this.name) {
      const endPart = nodePath.basename(this.base)
      if (!this.exit)
      const [...nameParts, ext] = endPart.split('.');
      this.name = nameParts.join('.');
      this.ext = ext;
    }

    fs.mkdirSync(nodePath.dirname(filePath), {recursive: true});
    const fd = fs.openSync(filePath, 'a')
    await fs.closeSync(fd)
  }

  public async * glob(pattern?: string): AsyncIterableIterator<StoragePath> {
    const p = nodePath.join(this.filepath, pattern || '*')
    for (const foundFile of glob.sync(p)) {
      yield new LocalPath(foundFile
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
