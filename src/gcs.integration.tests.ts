import {describe, test, expect, beforeAll} from '@jest/globals'
import { v4 as uuidv4 } from 'uuid'
import {inspect} from 'util';
import { Storage, Bucket } from '@google-cloud/storage';

const gcs = new Storage();
let gcsTestsAllowed: boolean|undefined = undefined;

async function testOrSkip(name: string, fn: any) {
  if (gcsTestsAllowed === undefined) {
    try {
      const projectId = await gcs.getProjectId();
      if (!projectId) {
        throw new Error("invalid/missing projectId");
      }
      gcsTestsAllowed = true;
      return test(name, fn);
    } catch (e) {
      gcsTestsAllowed = false;
      return test.skip(name, fn);
    }
  } else {
    return test(name, fn);
  }
}

const TEST_BUCKET_PARTS = ["pathy-js-tests", uuidv4()];
const TEST_BUCKET_DIR = "gs://" + TEST_BUCKET_PARTS.join("/");

describe("GcsPath CRUD works", () => {
  let bucket: Bucket;

  beforeAll(async () => {
    bucket = gcs.bucket(TEST_BUCKET_PARTS[0]);
    bucket.

  })
})
