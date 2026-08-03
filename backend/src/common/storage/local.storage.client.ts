import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { env } from '@config/env';
import { FileToStore, StorageClient, StoredFile } from './storage.types';

/**
 * Local-disk implementation of StorageClient, suitable for development and
 * single-instance deployments. Files are written under UPLOAD_DIR, namespaced
 * by category (avatars, resources, assignments), and served statically by
 * Express (see app.ts). Swap STORAGE_PROVIDER for a cloud implementation of
 * this same interface for multi-instance/production deployments.
 */
export class LocalStorageClient implements StorageClient {
  private readonly baseDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

  async save(file: FileToStore): Promise<StoredFile> {
    const categoryDir = path.join(this.baseDir, file.category);
    await fs.mkdir(categoryDir, { recursive: true });

    const extension = path.extname(file.originalName);
    const filename = `${randomUUID()}${extension}`;
    const key = `${file.category}/${filename}`;
    await fs.writeFile(path.join(categoryDir, filename), file.buffer);

    return { key, url: `/${env.UPLOAD_DIR}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await fs.rm(path.join(this.baseDir, key), { force: true });
  }
}
