import { LocalPath } from "./local";

const local = new LocalPath("a/b/c");

// function path(pathString: string): StoragePath {
//  if (pathString.startsWith("gs://")) {
//    const [bucket, path] = pathString.replace('gs://', '').split('/', 1)
//    return new GcsPath(bucket, path);
//  }
//  return new LocalPath(pathString);
// }
