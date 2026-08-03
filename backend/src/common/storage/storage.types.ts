export interface StoredFile {
  /** Opaque key identifying the file within the storage provider. */
  key: string;
  /** Publicly resolvable URL (or path) the client uses to retrieve the file. */
  url: string;
}

export interface FileToStore {
  category: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Provider-agnostic contract for persisting uploaded files. Mirrors the
 * EmailClient/AI-client pattern: the rest of the app depends on this
 * interface only, never on `fs` or a specific cloud SDK directly, so local
 * disk storage can be swapped for S3/GCS/Azure Blob later by adding one new
 * implementation and changing the factory in storage/index.ts.
 */
export interface StorageClient {
  save(file: FileToStore): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}
