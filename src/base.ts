import type { FileHandle } from 'fs/promises'
import type { Readable, Writable } from 'stream'
import * as nodePath from 'path';

export interface StoragePath {

  anchor: () => string
  parents: () => string[]
  name: () => string
  ext: () => string
  withExt: (ext: string) => StoragePath
  withName: (name: string) => StoragePath
  fullPath: () => string
  join: (...paths: string[]) => StoragePath

  ls: () => AsyncIterableIterator<StoragePath>
  glob: (pattern?: string) => AsyncIterableIterator<StoragePath>

  exists: () => Promise<boolean>
  isFile: () => Promise<boolean>
  isDir: () => Promise<boolean>

  touch: () => Promise<void>
  mkdir: (options?: { parents: boolean }) => Promise<void>

  rm: (options?: { recursive: boolean }) => Promise<void>
  read: () => Promise<Buffer>
  write: (buf: Buffer) => Promise<void>
}

export interface PathState {
  anchor: string
  parents: string[]
  name: string
  sep: string
}

function buildPathState(sep: string, url: string): PathState {
    let anchor = '';

    const matches = url.match(/^(?<anchor>.+:\/\/)/);
    if (matches?.groups?.anchor) {
      anchor = matches.groups.anchor;
    } else if (url.startsWith('/')) {
      anchor = '/';
    }

    const parts = url.replace(RegExp(`^${anchor}`), '')
      .split(sep)
      .filter(x => x.length > 0);

    const parents: string[] = []
    for (const part of parts) {
      if (part?.length !== 0) {
        parents.push(part);
      }
    }

    /**
     * we are going to assume that the first parent
     * is actually the stem. This will change as joins
     * happen, and the stem will shift down further
     */
    const name = parents.pop() ?? '';
    return {
      anchor,
      parents,
      name,
      sep
    }
}

export abstract class BasePath implements StoragePath{
  state: PathState;

  protected constructor(sep: string, data: string|PathState) {
    if (typeof data === 'string') {
      data = buildPathState(sep, data)
    }
    this.state = data;
  }

  public anchor(): string {
    return this.state.anchor;
  }

  public parents(): string[] {
    return this.state.parents;
  }

  public name(): string {
    return this.state.name;
  }

  public ext(): string {
    const parts = this.state.name.split(".");
    if (parts.length <= 1) {
      return "";
    }
    const [ext] = parts.slice(-1)
    return ext ?? "";
  }

  public fullPath(): string {
    const { anchor, parents, name } = this.state;

    const currentParts = [...parents]
    if (name?.length > 0) {
      currentParts.push(name);
    }

    return anchor + "" + currentParts.join(this.state.sep);
  }

  public withExt(extension: string): StoragePath {
    const newExt = extension.replace(/^\./, '');
    const name = this.state.name.replace(this.ext(), newExt);
    return this.createNew({
      ...this.state,
      parents: [...this.state.parents],
      name
    });
  }

  public withName(name: string): StoragePath {
    return this.createNew({
      ...this.state,
      parents: [...this.state.parents],
      name: name,
    })
  }

  public join(paths: string): StoragePath {
    const [name, ...parts] = paths.split(this.state.sep)
      .filter(x => x.length > 0)
      .reverse();

    return this.createNew({
      ...this.state,
      parents: [
        ...this.state.parents,
        this.state.name,
        ...parts.reverse()
      ],
      name,
    });
  }

  abstract createNew(data: PathState): StoragePath;

  abstract exists(): Promise<boolean>

  abstract isDir(): Promise<boolean>
  abstract isFile(): Promise<boolean>

  abstract ls(): AsyncIterableIterator<StoragePath>
  abstract glob(pattern: string | undefined): AsyncIterableIterator<StoragePath>

  abstract mkdir(options?: { parents: boolean }): Promise<void>
  abstract touch(): Promise<void>

  abstract rm(options: { recursive: boolean } | undefined): Promise<void>
  abstract read(): Promise<Buffer>
  abstract write(buf: Buffer): Promise<void>
}
