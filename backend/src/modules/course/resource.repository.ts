import { BaseRepository } from '@database/baseRepository';
import { ResourceDocument, ResourceModel } from './resource.model';

export class ResourceRepository extends BaseRepository<ResourceDocument> {
  constructor() {
    super(ResourceModel);
  }

  async findByTopic(topicId: string): Promise<ResourceDocument[]> {
    return ResourceModel.find({ topicId }).sort({ createdAt: 1 }).lean<ResourceDocument[]>().exec();
  }
}

export const resourceRepository = new ResourceRepository();
