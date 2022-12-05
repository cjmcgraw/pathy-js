import { LocalPath } from './local'
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { StoragePath } from './base'
//import random from 'random'

const TEST_ASSET_DIR = '.testing_assets'
const RUN_ASSET_DIR = `${TEST_ASSET_DIR}/${uuidv4().toString()}`

describe("LocalPath search functions work", () => {
  const dataDirectory = RUN_ASSET_DIR + "/" + uuidv4().toString() + "/read_tests";
  let dirs = [...Array(10).keys()].map(_ => uuidv4().toString());
  let files: string[] = [];
  let filesAtLevels: string[][] = [];

  beforeAll(async () => {
    let path = dataDirectory;
    files = []
    filesAtLevels = [];

    await fs.mkdir(dirs.join('/'), {recursive: true});

    for (let depth = 0; depth < 10; depth++) {

      filesAtLevels.push([]);
      for (let n = 0; n < 10; n++) {
        let file = uuidv4().toString();
        if (Math.random() > 0.5) {
          file += "." + uuidv4().toString();
        }

        filesAtLevels[depth].push(file);

        const fullPath = path + "/" + file;
        files.push(fullPath);
        await fs.mkdir(path, {recursive: true});
        const fd = await fs.open(path + "/" + file, 'a');
        await fd.close();
      }

      const newDir = uuidv4().toString();
      filesAtLevels[depth].push(newDir);
      dirs.push(newDir);
      path += "/" +  newDir
    }
  });

  afterAll(async () => {
    //await fs.rm(dataDirectory, {recursive: true, force: true});
  });

  test("LocalPath.ls()", async () => {
    let localPath: StoragePath = new LocalPath(dataDirectory);
    for (let i = 0; i < dirs.length; i++) {
      console.log(i);
      const expected = new Set(filesAtLevels[i]);
      const found = new Set(Array.from(localPath.ls()).map(x => x.name()));
      expect(found).toStrictEqual(expected);

      const dir = dirs[i];
      localPath = localPath.join(dir)
    }
  });

  test("LocalPath.glob(...) with **/*", async () => {
  });

  test("LocalPath.glob(...) with /*", async () => {
    let path = new LocalPath(dataDirectory);
    for (const expected of filesAtLevels) {

    }
    const found = new Set([...path.glob("*")].map(x => x.name()));
    const expected = new Set(filesAtLevels[0]);
    expect(found).toStrictEqual(expected);
  });

  test("LocalPath.isDir(...)", async () => {
    expect(true).toBeTruthy();
  });

  test("LocalPath.isFile(...)", async () => {
    expect(true).toBeTruthy();
  })
})
