import { FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Minimal contract every repository implements. Kept intentionally small -
 * modules add their own query methods on top of this base in their own
 * <feature>.repository.ts rather than growing this interface indefinitely.
 */
export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  find(filter: FilterQuery<T>, options?: { skip?: number; limit?: number }): Promise<T[]>;
  count(filter: FilterQuery<T>): Promise<number>;
  updateById(id: string, update: UpdateQuery<T>): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
}
