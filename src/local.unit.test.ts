import { LocalPath } from './local'
import { beforeAll, afterAll, test, } from '@jest/globals'
import { expect } from 'jest-expect-message';
import fs from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import random from 'random'

const TEST_ASSET_DIR = '.testing_assets/'
const RUN_ASSET_DIR = `${TEST_ASSET_DIR}/${uuidv4().toString()}`

function randomPath(n: number): string {
  let path = RUN_ASSET_DIR
  for (let i = 0; i < n; i++) {
    path += uuidv4().toString() + '/'
  }
  return path.replace(/\/$/, '')
}

beforeAll(async () => {
  await fs.mkdir(TEST_ASSET_DIR, { recursive: true })
})

afterAll(async () => {
  await fs.rm(TEST_ASSET_DIR, { recursive: true, force: true })
})

test('simple CRUD works', async () => {
  const data = uuidv4().toString()
  const location = randomPath(2)
  const path = new LocalPath(location)

  await expect(path.exists()).resolves.toBeFalsy()
  await path.write(Buffer.from(data))

  await expect(path.exists()).resolves.toBeTruthy()
  const buf = await path.read()

  expect(buf.toString()).toStrictEqual(data)
  await path.rm()
  await expect(path.exists()).resolves.toBeFalsy()
})

test('glob works as expected with nothing', async () => {
  const expectedFiles = new Set()

  const testDir = randomPath(1)
  const path = new LocalPath(testDir)

  for (let i = 0; i < 10; i++) {
    const fileName = randomPath(1)
    await path.join(fileName).touch()
    expectedFiles.add(fileName)
  }

  for await (const found of path.glob()) {
    expect(
      expectedFiles.has(fileFound),
      `expected found=${found} to be in ${expectedFiles}`
    ).toBeTruthy();
  }
  const foundFiles = new Set(Array.from(found))
})

test('glob works as expected with multiple files unnested', async () => {

})

test('glob works as expected with multiplie files nested', async () => {

})

test('glob works as expected with many files much nesting', async () => {

})
