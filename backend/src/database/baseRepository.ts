import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { IRepository } from '@common/interfaces/IRepository';

/**
 * Generic Mongoose-backed repository. Feature repositories extend this for
 * standard CRUD and add domain-specific query methods of their own - see
 * CLAUDE.md §3 (repositories are the only layer allowed to build queries).
 */
export class BaseRepository<T> implements IRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject() as T;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean<T>().exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).lean<T>().exec();
  }

  async find(
    filter: FilterQuery<T>,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> } = {}
  ): Promise<T[]> {
    let query = this.model.find(filter);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);
    return query.lean<T[]>().exec();
  }

  async count(filter: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).lean<T>().exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
