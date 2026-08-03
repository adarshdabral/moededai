import { NotFoundError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { storageClient } from '@common/storage';
import { courseService, CourseService } from './course.service';
import { topicService, TopicService } from './topic.service';
import { resourceRepository, ResourceRepository } from './resource.repository';
import { ResourceDocument } from './resource.model';
import { ResourceDTO } from './course.types';
import { CreateLinkResourceInput } from './course.validation';

export class ResourceService {
  constructor(
    private readonly repository: ResourceRepository = resourceRepository,
    private readonly topics: TopicService = topicService,
    private readonly courses: CourseService = courseService
  ) {}

  toDTO(resource: ResourceDocument): ResourceDTO {
    return {
      id: String(resource._id),
      topicId: String(resource.topicId),
      type: resource.type,
      title: resource.title,
      url: resource.url,
      uploadedBy: String(resource.uploadedBy),
    };
  }

  private async ensureCanManage(topicId: string, requester: AuthenticatedUser): Promise<void> {
    const topic = await this.topics.getById(topicId);
    await this.courses.ensureCanManageCourse(String(topic.courseId), requester);
  }

  async createLink(
    topicId: string,
    requester: AuthenticatedUser,
    input: CreateLinkResourceInput
  ): Promise<ResourceDocument> {
    await this.ensureCanManage(topicId, requester);
    return this.repository.create({
      topicId: topicId as unknown as ResourceDocument['topicId'],
      type: input.type,
      title: input.title,
      url: input.url,
      uploadedBy: requester.id as unknown as ResourceDocument['uploadedBy'],
    });
  }

  async createUpload(
    topicId: string,
    requester: AuthenticatedUser,
    title: string,
    file: Express.Multer.File
  ): Promise<ResourceDocument> {
    await this.ensureCanManage(topicId, requester);
    const stored = await storageClient.save({
      category: 'resources',
      originalName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
    return this.repository.create({
      topicId: topicId as unknown as ResourceDocument['topicId'],
      type: 'upload',
      title,
      url: stored.url,
      storageKey: stored.key,
      uploadedBy: requester.id as unknown as ResourceDocument['uploadedBy'],
    });
  }

  async listByTopic(topicId: string): Promise<ResourceDocument[]> {
    await this.topics.getById(topicId);
    return this.repository.findByTopic(topicId);
  }

  async delete(resourceId: string, requester: AuthenticatedUser): Promise<void> {
    const resource = await this.repository.findById(resourceId);
    if (!resource) throw new NotFoundError('Resource');
    await this.ensureCanManage(String(resource.topicId), requester);

    if (resource.storageKey) {
      await storageClient.delete(resource.storageKey);
    }
    await this.repository.deleteById(resourceId);
  }
}

export const resourceService = new ResourceService();
