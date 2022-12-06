import { describe, test, expect } from '@jest/globals'
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
  const {anchor, maxLevels} = args;
  const expected = {
    anchor: args.anchor,
    ...args.expected,
  }
  const tests = [];
  const parents: string[] = (expected?.parents) ? [...expected.parents] : [];
  for (let i=0; i < maxLevels; i++) {
    const name = uuidv4().slice(0, 4);
    const nameWithExtension = name + (expected?.ext ? "." + expected?.ext : "");
    const url = anchor + [...parents, nameWithExtension].join("/");
    tests.push({
      name: `url=${url}`,
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
    url: "a/b/c",
    expected: {
      anchor: "",
      name: "c",
      ext: "",
      parents: ["a", "b"],
      fullPath: "a/b/c",
    }
  },
  {
    url: "a.b.c/d.e.f/g.h.j",
    expected: {
      anchor: "",
      name: "g.h.j",
      ext: "h.j",
      parents: ["a.b.c", "d.e.f"],
      fullPath: "a.b.c/d.e.f/g.h.j"
    }
  },
  ...generateTests({anchor: "", maxLevels: 4}),
  ...generateTests({anchor: "", maxLevels: 4, expected: {ext: "ext"}}),
  ...generateTests({anchor: "", maxLevels: 4, expected: {ext: "a.b.c.d.e.f.g"}}),
  ...generateTests({anchor: "./", maxLevels: 4, expected: {anchor: ""}}),
  ...generateTests({anchor: "/", maxLevels: 4}),
  ...generateTests({anchor: "/", maxLevels: 4, expected: {ext: "some-other-extensions"}}),
  ...generateTests({anchor: 'file://', maxLevels: 4}),
  ...generateTests({anchor: 'file://', maxLevels: 10, expected: {ext: uuidv4().toString()}}),
  ...generateTests({anchor: 'gs://', maxLevels: 4}),
  ...generateTests({anchor: "a.b.c.d://", maxLevels: 4})
]

interface expectedChecks {
  anchor?: string
  parents?: string[]
  name?: string
  ext?: string
  fullPath?: string
}

function assertPath(testCase: string, path: StoragePath, expected?: expectedChecks): void {
  const {anchor, parents, name, ext, fullPath} = {
    anchor: '',
    parents: [],
    name: '',
    ext: '',
    ...expected
  };

  try {
    expect(path.anchor()).toBe(anchor);
    expect(path.parents()).toStrictEqual(parents);
    expect(path.name()).toBe(name);
    expect(path.ext()).toBe(ext);
    expect(path.toString()).toBe(fullPath);
  } catch (e) {
    console.log(
      inspect(
        {
          testData: { testCase, url: path.toString(), path, expected }
        }, {
          depth: 4,
          showHidden: true,
          colors: true,
        }
      )
    );
    throw e;
  }
}

describe.each(data)("BasePath.withName(...)", ({url, expected}) => {
  test(url, () => {
    const testName = `BasePath.WithName(...) url=${url}`
    const originalPath = new TestPathImpl(url);
    const originalExpected = { ...expected };
    assertPath(testName, originalPath, originalExpected);

    const firstName = uuidv4().toString();
    const firstReName = originalPath.withName(firstName);
    const firstExpected = {
      ...expected,
      fullPath: expected.fullPath.replace(expected.name, firstName),
      name: firstName,
      ext: "",
    };
    assertPath(testName, originalPath, originalExpected);
    assertPath(testName, firstReName, firstExpected);

    const secondName = uuidv4().toString();
    const secondReName = firstReName.withName(secondName);
    const secondExpected = {
      ...expected,
      fullPath: expected.fullPath.replace(expected.name, secondName),
      name: secondName,
      ext: ""
    };
    assertPath(testName, originalPath, originalExpected);
    assertPath(testName, firstReName, firstExpected);
    assertPath(testName, secondReName, secondExpected);
  });
});

describe.each(data)("BasePath.withExt(...)", ({url, expected}) => {
  test(url, () => {
    const testName = `BasePath.WithExt(...) url=${url}`
    const originalPath = new TestPathImpl(url);
    const originalExpected = { ...expected };
    assertPath(testName, originalPath, originalExpected);

    const r = RegExp(`\\.${expected.ext}$`);
    const trimmedPath = expected.fullPath.replace(r, '');
    const trimmedName = expected.name.replace(r, '');

    const firstExt = uuidv4().toString();
    const firstReExt = originalPath.withExt(firstExt);
    const firstExpected = {
      ...expected,
      fullPath: trimmedPath + '.' + firstExt,
      name: trimmedName + '.' + firstExt,
      ext: firstExt,
    };
    assertPath(testName, originalPath, originalExpected);
    assertPath(testName, firstReExt, firstExpected);

    const secondExt = uuidv4().toString();
    const secondReExt = firstReExt.withExt(secondExt);
    const secondExpected = {
      ...expected,
      fullPath: trimmedPath + '.' + secondExt,
      name: trimmedName + '.' + secondExt,
      ext: secondExt,
    };
    assertPath(testName, originalPath, originalExpected);
    assertPath(testName, firstReExt, firstExpected);
    assertPath(testName, secondReExt, secondExpected);
  });
});

describe.each(data)("BasePath.join(...)", ({url, expected}) => {
  test(url, () => {
    const testName = `BasePath.join(...) url=${url}`
    const path = new TestPathImpl(url);

    const asserts = [
      () => assertPath(testName, path, expected)
    ]

    for (let i = 1; i <= 10; i++) {

      const newParts: string[] = []
      let p: StoragePath = path;
      for (let j = 0; j < i; j++) {
        const newPart = uuidv4().toString();
        newParts.push(newPart);
        p = p.join(newPart);
      }

      asserts.push(
        () => assertPath(
          testName,
          p,
          {
            ...expected,
            parents: [...expected.parents, expected.name, ...newParts.slice(0, newParts.length - 1)],
            name: newParts.slice(-1)[0],
            fullPath: expected.fullPath + "/" + newParts.join("/"),
            ext: ""
        })
      )

      const [newName, ...reversedPaths] = [...Array(i).keys()]
        .map(_ => uuidv4().toString())
        .reverse();
      const paths = reversedPaths.reverse();
      const newPath = path.join(...paths, newName);
      asserts.push(
        () => assertPath(
          testName,
          newPath,
          {
            ...expected,
            parents: [...expected.parents, expected.name, ...paths],
            name: newName,
            fullPath: expected.fullPath + "/" + [...paths, newName].join('/'),
            ext: "",
          }
        )
      );

      // all previous asserts should still work
      for (const assert of asserts) {
        assert();
      }
    }
  });
});

class TestPathImpl extends BasePath {
  constructor(fullPath: string|PathState) { super(nodePath.sep, fullPath); }
  createNew(data: PathState): StoragePath { return new TestPathImpl(data) }
  glob(pattern?: string): Generator<StoragePath, void, void> { throw Error("not implemented")}
  rm(options?: { recursive: boolean }): Promise<void> { throw Error("not implemented")}
  mv(path: string|StoragePath): Promise<StoragePath> { throw Error("not implemeneted")}
  exists(): Promise<boolean> { throw Error("not implemented")}
  isDir(): Promise<boolean> { throw Error("not implemented")}
  isFile(): Promise<boolean> { throw Error("not implemented")}
  ls(): Generator<StoragePath, void, void> { throw Error("not implemented")}
  mkdir(options?: { parents: boolean }): Promise<void> { throw Error("not implemented")}
  touch(): Promise<void> { throw Error("not implemented")}
  write(buf: Buffer): Promise<void> { throw Error("not implemented")}
  writeStream(): Writable { throw Error("not implemented")}
  read(): Promise<Buffer> { throw Error("not implemented")}
  readCallback(callbackFn: () => Buffer): Promise<void> { throw Error("not implemented")}
  readStream(): Readable { throw Error("not implemented")}
}
