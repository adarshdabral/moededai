import { LocalStorageClient } from './local.storage.client';
import { StorageClient } from './storage.types';

function createStorageClient(): StorageClient {
  // Only a local provider exists today (no cloud provider chosen yet - see
  // docs/ARCHITECTURE.md §9). Adding a provider means implementing
  // StorageClient and branching on an env var here, not touching call sites.
  return new LocalStorageClient();
}

export const storageClient: StorageClient = createStorageClient();
export type { StorageClient, FileToStore, StoredFile } from './storage.types';
