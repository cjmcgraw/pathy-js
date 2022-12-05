
import { Readable, Writable } from 'stream'

// Should be the primary interface through which state is manipulated.
export interface StoragePath {

  // immutable
  anchor: () => string
  parents: () => string[]
  name: () => string
  ext: () => string
  withExt: (ext: string) => StoragePath
  withName: (name: string) => StoragePath
  toString: () => string
  join: (...paths: string[]) => StoragePath

  // kinda mutable
  glob: (pattern?: string) => Generator<StoragePath, void, void>
  ls: () => Generator<StoragePath, void, void>
  touch: () => Promise<void>

  // mutable
  exists: () => Promise<boolean>
  isFile: () => Promise<boolean>
  isDir: () => Promise<boolean>
  mkdir: (options?: { parents: boolean }) => Promise<void>
  rm: (options?: { recursive: boolean }) => Promise<void>

  // super mutable
  read: () => Promise<Buffer>
  readCallback: (callbackFn: () => Buffer) => Promise<void>
  readStream: () => Readable;
  write: (buf: Buffer) => Promise<void>
  writeStream: () => Writable;
}

// struct?
export interface PathState {
  anchor: string
  parents: string[]
  name: string
  sep: string
}

// all regex run O(length)
const rootRegex = /^\//;
const cwdRegex = /^\.\//;
const schemeRegex = /^(?<anchor>.+:\/\/)/;

// build initial state. Hopefully generates struct that data is shared/copied from
function buildPathState(sep: string, url: string): PathState {
  // need to fill
  let anchor: string;
  let parents: string[]
  let name: string;

  let parsedUrl: string;
  let schemeMatch: RegExpMatchArray | null;
  let cwdMatch: RegExpMatchArray | null;
  let rootMatch: RegExpMatchArray | null;
  let validPathParts: string[];

  schemeMatch = url.match(schemeRegex);
  cwdMatch = url.match(cwdRegex);
  rootMatch = url.match(rootRegex);

  const parseUrl = (match: any) => url.split(match).slice(-1);
  if (schemeMatch) {
    anchor = schemeMatch.groups?.anchor ?? '';
    [parsedUrl] = parseUrl(schemeRegex) ?? url;
  } else if (cwdMatch) {
    anchor = '';
    [parsedUrl] = parseUrl(cwdRegex) ?? url;
  } else if (rootMatch) {
    anchor = '/';
    [parsedUrl] = parseUrl(rootRegex) ?? url;
  } else {
    anchor = '';
    parsedUrl = url;
  }

  validPathParts = parsedUrl
    .split(sep)
    .filter(x => x?.length > 0);


  let parentsRev: string[];
  [name, ...parentsRev] = validPathParts.reverse();
  parents = parentsRev.reverse();

  // return struct
  return {
    anchor,
    parents,
    name,
    sep
  }
}

// no traits??
export abstract class BasePath implements StoragePath{
  state: PathState;

  // ctor
  protected constructor(separator: string, data: string|PathState) {
    // this is super weird. We like carry the separator around for windows?
    const sep = separator;

    // I don't really know how to share state downwards in an
    // immutable way. So... I just dynamically typed basically
    if (typeof data === 'string') {
      data = buildPathState(sep, data)
    }

    // data is minorly mutable
    this.state = data;
  }

  // immutable
  public anchor(): string {
    const { anchor } = this.state;
    return anchor;
  }

  // immutable
  public parents(): string[] {
    const { parents } = this.state;
    return parents;
  }

  // immutable
  public name(): string {
    const { name } = this.state;
    return name;
  }

  // immutable
  public ext(): string {
    const { name } = this.state;
    const [foundName, ...exts] = name.split(".");
    return exts.join('.');
  }

  // immutable
  public toString(): string {
    const { anchor, parents, name, sep } = this.state;
    let currentParts = [...parents, name];
    return anchor + "" + currentParts.join(sep);
  }

  // immutable
  public withExt(extension: string): StoragePath {
    let newExt = extension.replace(/^\./, '');
    let [fileName] = this.state.name.split('.', 1);

    // wish I had share
    return this.createNew({
      ...this.state,
      parents: [...this.state.parents],
      name: fileName + "." + newExt,
    });
  }

  // immutable
  public withName(name: string): StoragePath {
    // wish I had share
    return this.createNew({
      ...this.state,
      parents: [...this.state.parents],
      name: name,
    })
  }

  // immutable
  public join(...paths: string[]): StoragePath {
    const [name, ...parts] = paths
      .filter(x => x.length > 0)
      .reverse();

    // wish I had share
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

  // why don't we have new this(...)?
  abstract createNew(data: PathState): StoragePath;


  // abstracts must implement interface?????????
  abstract exists(): Promise<boolean>
  abstract isDir(): Promise<boolean>
  abstract isFile(): Promise<boolean>
  abstract ls(): Generator<StoragePath, void, void>
  abstract glob(pattern: string | undefined): Generator<StoragePath, void, void>
  abstract mkdir(options?: { parents: boolean }): Promise<void>
  abstract touch(): Promise<void>
  abstract rm(options: { recursive: boolean } | undefined): Promise<void>
  abstract read(): Promise<Buffer>
  abstract readCallback(callbackFn: () => Buffer): Promise<void>
  abstract readStream(): Readable
  abstract write(buf: Buffer): Promise<void>
  abstract writeStream(): Writable
}
