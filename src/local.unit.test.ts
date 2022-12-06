import { LocalPath } from './local'
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals'
import fs from 'fs'
import * as nodePath from 'path';
import { v4 as uuidv4 } from 'uuid'
import { StoragePath } from './base'

const RUN_DIR_PARTS = ['.testing_assets', uuidv4()]

describe("LocalPath CRUD works", () => {
  const dataDirParts = [...RUN_DIR_PARTS, uuidv4()];
  const dataDir = dataDirParts.join(nodePath.sep);

  beforeAll(async () => {
    await fs.promises.mkdir(dataDir, {recursive: true});
  });

  afterAll(async () => {
    await fs.promises.rm(dataDir, {recursive: true, force: true});
  });

  test("LocalPath.touch()", async () => {
    let path = new LocalPath(dataDir).join(uuidv4());
    await path.touch();
    const stats = await fs.promises.lstat(path.toString());
    expect(stats).toBeTruthy();
    expect(stats.isFile()).toBeTruthy();
  });

  test("LocalPath.mkdir()", async () => {
    let path = new LocalPath(dataDir).join(uuidv4());
    await path.join('file').mkdir();
    const stats = await fs.promises.lstat(path.toString());
    expect(stats).toBeTruthy();
    expect(stats.isDirectory()).toBeTruthy();
  });

  test("LocalPath.mkdir({parents: true})", async () => {
    let path = new LocalPath(dataDir).join(uuidv4(), uuidv4(), uuidv4());
    await path.join('file').mkdir({parents: true});
    const stats = await fs.promises.lstat(path.toString());
    expect(stats).toBeTruthy();
    expect(stats.isDirectory()).toBeTruthy();
  });

  test("LocalPath.rm()", async () => {
    const filePath = `${dataDir}/${uuidv4()}`;
    const fd = await fs.promises.open(filePath, 'a');
    await fd.close();
    let path = new LocalPath(filePath);
    await path.rm()
    expect(fs.existsSync(filePath)).toBeFalsy();
  });

  test("LocalPath.rm({recursive: true})", async () => {
    const topLevelDir = uuidv4()
    let dirPath = `${dataDir}/${topLevelDir}/a/b/c/d/e/f/g`;
    let fileName = uuidv4();
    let filePath = `${dirPath}/${fileName}`;
    await fs.promises.mkdir(dirPath, {recursive: true});
    const fd = await fs.promises.open(filePath, 'a');
    await fd.close();
    expect(fs.existsSync(filePath)).toBeTruthy();

    let path = new LocalPath(dataDir).join(topLevelDir);
    await path.rm({recursive: true});
    expect(fs.existsSync(filePath)).toBeFalsy();
    expect(fs.existsSync(`${dataDir}/${topLevelDir}`)).toBeFalsy();
  });

  test("LocalPath.mv(...)", async () => {
    const src = new LocalPath(dataDir).join("some", "src", "file")
    const expected = uuidv4();
    await src.mkdir({parents: true});
    await src.write(Buffer.from(expected));

    const dst = new LocalPath(dataDir).join("other", "dst", "file");
    await dst.mkdir({parents: true});

    await src.mv(dst);

    const fd = fs.openSync(dst.toString(), 'r');
    const data = fs.readFileSync(fd).toString();
    expect(data).toStrictEqual(expected);
  });

  test("LocalPath.read()", async () => {
    const filePath = dataDir + "/" + uuidv4();
    const fd = fs.openSync(filePath, 'w');
    const expected = uuidv4();
    fs.writeFileSync(fd, expected);
    fs.closeSync(fd);

    const path = new LocalPath(filePath);
    const data = await path.read();
    expect(data.toString()).toStrictEqual(expected);
  });

  test("LocalPath.readCallback(...)", done => {
    const filePath = dataDir + "/" + uuidv4();
    const fd = fs.openSync(filePath, 'w');
    const expected = uuidv4();
    fs.writeFileSync(fd, expected);
    fs.closeSync(fd);

    const path = new LocalPath(filePath);
    path.readCallback((buf) => {
      expect(buf.toString()).toStrictEqual(expected);
      done();
    });
  });

  test("LocalPath.readStream()", done => {
    const filePath = dataDir + "/" + uuidv4();
    const fd = fs.openSync(filePath, 'w');
    const expected = uuidv4();
    fs.writeFileSync(fd, expected);
    fs.closeSync(fd);

    const path = new LocalPath(filePath);
    const readStream = path.readStream();
    readStream.on('data', (buf) => {
      expect(buf.toString()).toStrictEqual(expected);
      done();
    });
  });

  test("LocalPath.write(...)", async () => {
    const filePath = `${dataDir}/${uuidv4()}`;
    const path = new LocalPath(filePath);
    const expected = uuidv4();
    await path.write(Buffer.from(expected));

    const fd = fs.openSync(filePath, 'r');
    const data = fs.readFileSync(fd).toString();
    fs.closeSync(fd);
    expect(data).toStrictEqual(expected);
  });

  test("LocalPath.writeStream()", done => {
    const filePath = `${dataDir}/${uuidv4()}`;
    const path = new LocalPath(filePath);
    const expected = uuidv4();
    const writeStream = path.writeStream()
    writeStream.write(Buffer.from(expected));
    writeStream.uncork();
    writeStream.end(() => {
      const fd = fs.openSync(filePath, 'r');
      const data = fs.readFileSync(fd).toString();
      fs.closeSync(fd);
      expect(data).toStrictEqual(expected);
      done();
    });
  });
});

/**
 * Make me simpler please
 */
describe("LocalPath search functions work", () => {


  test("LocalPath( **/*.ext )", async () => {
    let p = new LocalPath(dataDir);
    for (const expected of filesWithExt) {
      const [ext] = expected.split(".").slice(-1);
      const found = [...p.glob(`**/*.${ext}`)].map(x => x.name());
      expect(found).toHaveLength(1);
      expect(found).toStrictEqual([expected])
    }
  });

  test("LocalPath.isDir(...)", async () => {
    let path = dataDir;
    for (const dir of dirs) {
      let p = new LocalPath(path);
      await expect(p.exists()).resolves.toBeTruthy();
      await expect(p.isDir()).resolves.toBeTruthy();
      path += "/" + dir;
    }

    for (const file of filesWithoutDirs) {
      let p = new LocalPath(file);
      await expect(p.exists()).resolves.toBeTruthy();
      await expect(p.isDir()).resolves.toBeFalsy();
    }
  });

  test("LocalPath.isFile(...)", async () => {
    for (const file of filesWithoutDirs) {
      let p = new LocalPath(file);
      await expect(p.exists()).resolves.toBeTruthy();
      await expect(p.isFile()).resolves.toBeTruthy();
    }

    let path = dataDir;
    for (const dir of dirs) {
      let p = new LocalPath(path);
      await expect(p.exists()).resolves.toBeTruthy();
      await expect(p.isFile()).resolves.toBeFalsy();
      path += "/" + dir;
    }
  })

  ////////////////////////////////////////////////////////
  // work in progress
  ///////////////////////////////////////////////////////


  const dataDirectoryParts = [...RUN_DIR_PARTS, "read_tests"];
  const dataDir = dataDirectoryParts.join(nodePath.sep)
  let dirs = [...Array(10).keys()].map(_ => uuidv4());
  let filesWithoutDirs: string[] = [];
  let filesWithDirs: string[] = [];
  let filesWithExt: string[] = [];
  let dirsToExpectedFiles: Map<string, string[]> = new Map();

  beforeAll(async () => {
    /**
     * So in order to support local search functionality
     * we need to enforce some directory order. I am going
     * to manually build that in the system
     */

    // make all the directories as nested
    await fs.promises.mkdir(
      [...dataDirectoryParts, ...dirs].join(nodePath.sep),
      {recursive: true}
    );

    let parentDir = dataDirectoryParts[dataDirectoryParts.length - 1];

    // for each nested directory fill out some files in it too
    for (let i = 0; i <= dirs.length; i++) {
      const dirParts = [...dataDirectoryParts, ...dirs.slice(0, i)]
        .filter(x => x.length > 0);

      if (i > 0) {
        filesWithDirs.push(dirParts.join(nodePath.sep));
      }

      const filesInDir = [...Array(10).keys()].map(_ => {
        let name = uuidv4()
        if (Math.random() > 0.5) {
          name += "." + uuidv4();
          filesWithExt.push(name);
        }
        return name;
      });

      // for each file we found, lets create them and add their fully
      // qualified path to the files
      for (const file of filesInDir) {
        const filePath = [...dirParts, file].join(nodePath.sep);
        filesWithDirs.push(filePath);
        filesWithoutDirs.push(filePath);
        const fd = await fs.promises.open(filePath, 'a');
        await fd.close();
      }

      const nextDir = dirs[i];
      filesInDir.push(nextDir);

      dirsToExpectedFiles.set(
        parentDir,
        filesInDir
      );
      parentDir = dirs[i];
    }
  });

  afterAll(async () => {
    await fs.promises.rm(RUN_DIR_PARTS[0], {recursive: true, force: true});
  });

  test("LocalPath.ls()", async () => {
    let p: StoragePath = new LocalPath(dataDir);

    for (const dir of dirs) {
      const name = p.name();
      const expected = new Set([
        ...dirsToExpectedFiles.get(name) ?? [],
      ]);

      const found = new Set(
        [...p.ls()].map(x => x.name())
      );

      expect(found).toStrictEqual(expected);
      p = p.join(dir);
    }
  });

  test("LocalPath.exists(...)", async () => {
    for (const file of filesWithDirs) {
      let p = new LocalPath(file);
      await expect(p.exists()).resolves.toBeTruthy();
    }

    let p = new LocalPath(uuidv4());
    await expect(p.exists()).resolves.toBeFalsy();
  });

  test("LocalPath.glob( **/* )", async () => {
    let p = new LocalPath(dataDir);
    const expected = new Set(filesWithDirs);
    const found = new Set([...p.glob("**/*")].map(x => x.toString()));
    expect(found).toStrictEqual(expected);
  });

  test("LocalPath.glob( * )", async () => {
    let p: StoragePath = new LocalPath(dataDir);
    for (const dir of dirs) {
      const name = p.name();
      const expected = new Set(dirsToExpectedFiles.get(name));
      const found = new Set([...p.glob("*")].map(x => x.name()));
      expect(found).toStrictEqual(expected);
      p = p.join(dir);
    }
  });

})
