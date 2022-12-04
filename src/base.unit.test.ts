import { describe, it, expect } from '@jest/globals'
import { v4 as uuidv4 } from 'uuid'
import {inspect} from 'util';

/**
 * so.. we are really just reimplementing ideas for other areas.
 * Speciailly I really like pathy, and pathlib in python
 *
 * I want to merge them together a little bit
 */

import { BasePath, StoragePath, PathState } from './base'
import * as nodePath from 'path';
import { Readable, Writable } from 'stream'

// struct testCase args - aligned bits in memory...
interface testCaseArgs {
  anchor: string
  maxLevels: number,
  expected?: expectedChecks
}


/**
 * why not default args inline. what is this 1989
 */
function generateTests(args: testCaseArgs): Record<any, any>[] {
  const testCase = uuidv4().toString();
  console.dir({ testCase, args })
  const {anchor, maxLevels} = args;
  const expected = {
    anchor: args.anchor,
    ...args.expected,
  }
  const tests = [];
  const parents: string[] = [];
  for (let i=0; i < maxLevels; i++) {
    const name = uuidv4().slice(0, 4);
    const nameWithExtension = name + (expected?.ext ? "." + expected?.ext : "");
    const url = anchor + [...parents, name].join("/");
    tests.push({
      name: `case: ${uuidv4().toString()}`,
      url,
      expected: {
        name: nameWithExtension,
        parents: [...parents],
        fullPath: url.replace(/^\.\//, ''),
        ...expected,
      }
    })
    parents.push(uuidv4().slice(0, 4).toString());
  }

  return tests;
}

const data = [
  {
    name: "carls-simple-case",
    url: "a/b/c",
    expected: {
      anchor: "",
      name: "c",
      ext: "",
      parents: ["a", "b"],
      fullPath: "a/b/c",
    }
  },
  //...generateTests({anchor: "", maxLevels: 4}),
  //...generateTests({anchor: "", maxLevels: 4, expected: {ext: "ext"}}),
  //...generateTests({anchor: "./", maxLevels: 4, expected: {anchor: ""}}),
  //...generateTests({anchor: "/", maxLevels: 4}),
  //...generateTests({anchor: "/", maxLevels: 4, expected: {ext: "some-other-extensions"}}),
  //...generateTests({anchor: 'file://', maxLevels: 4}),
  //...generateTests({anchor: 'file://', maxLevels: 10, expected: {ext: uuidv4().toString()}}),

]

interface expectedChecks {
  anchor?: string
  parents?: string[]
  name?: string
  ext?: string
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
    expect(path.fullPath()).toBe(fullPath);
  } catch (e) {
    console.log(
      inspect(
        { testData: { path, expected } }, {
          depth: 4,
          showHidden: true,
          colors: true,
        }
      )
    );
    throw e;
  }
}

describe.each(data)("basic functionality", ({name, url, expected}) => {
  it(`change name: ${name}`, () => {
    console.log(name, url);
    const originalPath = new TestPathImpl(url);
    const originalExpected = {...expected};
    assertPath(originalPath, originalExpected);

    const firstName = uuidv4().toString();
    const firstReName = originalPath.withName(firstName);
    const firstExpected = {
      ...expected,
      fullPath: expected.fullPath.replace(expected.name, firstName),
      name: firstName
    };
    assertPath(originalPath, originalExpected);
    assertPath(firstReName, firstExpected);

    const secondName = uuidv4().toString();
    const secondReName = firstReName.withName(secondName);
    const secondExpected = {
      ...expected,
      fullPath: expected.fullPath.replace(expected.name, secondName),
      name: secondName
    };
    assertPath(originalPath, originalExpected);
    assertPath(firstReName, firstExpected);
    assertPath(secondReName, secondExpected);
  });

  it(`change ext: ${name}`, () => {
    const originalPath = new TestPathImpl(url);
    const originalExpected = {...expected};
    assertPath(originalPath, originalExpected);

    const r = RegExp(`.${expected.ext}$`);
    const trimmedPath = expected.fullPath.replace(r, '');
    const trimmedName = expected.name.replace(r, '');

    const firstExt = uuidv4().toString();
    const firstReExt = originalPath.withExt(firstExt);
    const firstExpected = {
      ...expected,
      fullPath: trimmedPath + '.' + firstExt,
      name: trimmedName + '.' + firstExt,
    };
    assertPath(originalPath, originalExpected);
    assertPath(firstReExt, firstExpected);

    const secondExt = uuidv4().toString();
    const secondReExt = firstReExt.withExt(secondExt);
    const secondExpected = {
      ...expected,
      fullPath: trimmedPath + '.' + secondExt,
      name: trimmedName + '.'  + secondExt,
    };
    assertPath(originalPath, originalExpected);
    assertPath(firstReExt, firstExpected);
    assertPath(secondReExt, secondExpected);
  });

  it.skip(`join works: ${name}`, () => {

  });
});

class TestPathImpl extends BasePath {
  constructor(fullPath: string|PathState) { super(nodePath.sep, fullPath); }
  createNew(data: PathState): StoragePath { return new TestPathImpl(data) }
  glob(pattern?: string): AsyncIterableIterator<StoragePath> { throw Error("not implemented")}
  rm(options?: { recursive: boolean }): Promise<void> { throw Error("not implemented")}
  exists(): Promise<boolean> { throw Error("not implemented")}
  isDir(): Promise<boolean> { throw Error("not implemented")}
  isFile(): Promise<boolean> { throw Error("not implemented")}
  ls(): AsyncIterableIterator<StoragePath> { throw Error("not implemented")}
  mkdir(options?: { parents: boolean }): Promise<void> { throw Error("not implemented")}
  touch(): Promise<void> { throw Error("not implemented")}
  write(buf: Buffer): Promise<void> { throw Error("not implemented")}
  writeCallback(callbackFn: (buf: Buffer) => void): void {throw Error("not implemented")}
  writeStream(): Writable { throw Error("not implemented")}
  read(): Promise<Buffer> { throw Error("not implemented")}
  readCallback(callbackFn: () => Buffer): void { throw Error("not implemented")}
  readStream(): Readable { throw Error("not implemented")}
}
