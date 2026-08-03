import { NotFoundError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { courseService, CourseService } from './course.service';
import { topicRepository, TopicRepository } from './topic.repository';
import { TopicDocument } from './topic.model';
import { TopicDTO } from './course.types';
import { CreateTopicInput, UpdateTopicInput } from './course.validation';

export class TopicService {
  constructor(
    private readonly repository: TopicRepository = topicRepository,
    private readonly courses: CourseService = courseService
  ) {}

  toDTO(topic: TopicDocument): TopicDTO {
    return {
      id: String(topic._id),
      courseId: String(topic.courseId),
      title: topic.title,
      order: topic.order,
      learningObjectives: topic.learningObjectives,
    };
  }

  async create(
    courseId: string,
    requester: AuthenticatedUser,
    input: CreateTopicInput
  ): Promise<TopicDocument> {
    await this.courses.ensureCanManageCourse(courseId, requester);
    return this.repository.create({
      courseId: courseId as unknown as TopicDocument['courseId'],
      title: input.title,
      order: input.order,
      learningObjectives: input.learningObjectives ?? [],
    });
  }

  async listByCourse(courseId: string): Promise<TopicDocument[]> {
    await this.courses.getById(courseId);
    return this.repository.findByCourse(courseId);
  }

  async getById(topicId: string): Promise<TopicDocument> {
    const topic = await this.repository.findById(topicId);
    if (!topic) throw new NotFoundError('Topic');
    return topic;
  }

  async update(
    topicId: string,
    requester: AuthenticatedUser,
    updates: UpdateTopicInput
  ): Promise<TopicDocument> {
    const topic = await this.getById(topicId);
    await this.courses.ensureCanManageCourse(String(topic.courseId), requester);

    const updated = await this.repository.updateById(topicId, { $set: updates });
    if (!updated) throw new NotFoundError('Topic');
    return updated;
  }

  async delete(topicId: string, requester: AuthenticatedUser): Promise<void> {
    const topic = await this.getById(topicId);
    await this.courses.ensureCanManageCourse(String(topic.courseId), requester);
    await this.repository.deleteById(topicId);
  }
}

export const topicService = new TopicService();
