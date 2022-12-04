import { beforeAll, afterAll, describe, it, expect } from '@jest/globals'
import { v4 as uuidv4 } from 'uuid'
import random from 'random'

import { BasePath, StoragePath, PathState } from './base'
import * as nodePath from 'path';

class TestPathImpl extends BasePath {
  constructor(fullPath: string|PathState) { super(nodePath.sep, fullPath); }
  createNew(data: PathState): StoragePath { return new TestPathImpl(data) }
  glob(pattern?: string): AsyncIterableIterator<StoragePath> { throw new Error("not implemented"); }
  rm(options?: { recursive: boolean }): Promise<void> { throw new Error("not implemented"); }
  exists(): Promise<boolean> { throw new Error("not implemented"); }
  isDir(): Promise<boolean> { throw new Error("not implemented"); }
  isFile(): Promise<boolean> { throw new Error("not implemented"); }
  ls(): AsyncIterableIterator<StoragePath> { throw new Error("not implemented"); }
  mkdir(options?: { parents: boolean }): Promise<void> { throw new Error("not implemented"); }
  read(): Promise<Buffer> { throw new Error("not implemented"); }
  touch(): Promise<void> { throw new Error("not implemented"); }
  write(buf: Buffer): Promise<void> { throw new Error("not implemented"); }
}

const data = [
  {
    name: "non root, no nesting",
    url: "abc-123",
    expected: { name: "abc-123"}

  }, {
    name: "non root, with 1 layer of nesting",
    url: `first-layer/123`,
    expected: {
      parents: ["first-layer"],
      name: "123",
    }
  }, {
    name: "non-root, with 2 layers of nesting",
    url: 'first/second/third',
    expected: {
      parents: ['first', 'second'],
      name: 'third',
    }
  }, {
    name: "non-root, with 3 layers of nesting",
    url: 'first/second/third/fourth',
    expected: {
      parents: ['first', 'second', 'third'],
      name: 'fourth',
    }
   }, {
    name: "non-root, with 4 layers of nesting",
    url: 'first/second/third/fourth/fifth',
    expected: {
      parents: ['first', 'second', 'third', 'fourth'],
      name: 'fifth',
    }
  }, {
    name: "non-root, with 5 layers of nesting",
    url: 'first/second/third/fourth/fifth/sixth',
    expected: {
      parents: ['first', 'second', 'third', 'fourth', 'fifth'],
      name: 'sixth',
    }
  }
]

interface expectedChecks {
  anchor?: string
  parents?: string[]
  name?: string
  fullPath?: string
}

function assertPath(path: StoragePath, expected?: expectedChecks): void {
  const {anchor, parents, name, fullPath} = {
    anchor: '',
    parents: [],
    name: '',
    ...expected
  };

  try {
    expect(path.anchor()).toBe(anchor);
    expect(path.parents()).toStrictEqual(parents);
    expect(path.name()).toBe(name);
    if (fullPath) {
      expect(path.fullPath()).toBe(fullPath);
    }
  } catch (e) {
    console.log(`path: ${fullPath}`);
    console.dir(path);
    throw e;
  }
}

describe.each(data)("basic functionality", ({name, url, expected}) => {
  it(`construct: ${name}`, () => {
    const path = new TestPathImpl(url);
    assertPath(path, {...expected, fullPath: url})
  });

  it(`change name: ${name}`, () => {
    const originalPath = new TestPathImpl(url);
    const originalExpected = {...expected, fullPath: url};
    assertPath(originalPath, originalExpected);

    const firstName = uuidv4().toString();
    const firstReName = originalPath.withName(firstName);
    const firstExpected = {...expected, name: firstName};
    assertPath(originalPath, originalExpected);
    assertPath(firstReName, firstExpected);

    const secondName = uuidv4().toString();
    const secondReName = firstReName.withName(secondName);
    const secondExpected = {...expected, name: secondName};
    assertPath(originalPath, originalExpected);
    assertPath(firstReName, firstExpected);
    assertPath(secondReName, secondExpected);
  });
});
