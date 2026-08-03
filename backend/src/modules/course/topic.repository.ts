import { BaseRepository } from '@database/baseRepository';
import { TopicDocument, TopicModel } from './topic.model';

export class TopicRepository extends BaseRepository<TopicDocument> {
  constructor() {
    super(TopicModel);
  }

  async findByCourse(courseId: string): Promise<TopicDocument[]> {
    return TopicModel.find({ courseId }).sort({ order: 1 }).lean<TopicDocument[]>().exec();
  }

  async countByCourse(courseId: string): Promise<number> {
    return TopicModel.countDocuments({ courseId }).exec();
  }
}

export const topicRepository = new TopicRepository();
