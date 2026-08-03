import { ValidationError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { courseService, CourseService } from './course.service';
import { topicRepository, TopicRepository } from './topic.repository';
import { learningPathRepository, LearningPathRepository } from './learningPath.repository';
import { LearningPathDocument } from './learningPath.model';
import { LearningPathDTO } from './course.types';
import { CreateLearningPathInput } from './course.validation';

export class LearningPathService {
  constructor(
    private readonly repository: LearningPathRepository = learningPathRepository,
    private readonly topics: TopicRepository = topicRepository,
    private readonly courses: CourseService = courseService
  ) {}

  toDTO(path: LearningPathDocument): LearningPathDTO {
    return {
      id: String(path._id),
      courseId: String(path.courseId),
      title: path.title,
      topicSequence: path.topicSequence.map(String),
    };
  }

  async create(
    courseId: string,
    requester: AuthenticatedUser,
    input: CreateLearningPathInput
  ): Promise<LearningPathDocument> {
    await this.courses.ensureCanManageCourse(courseId, requester);

    const topicsInCourse = await this.topics.findByCourse(courseId);
    const validTopicIds = new Set(topicsInCourse.map((topic) => String(topic._id)));
    const invalid = input.topicSequence.filter((topicId) => !validTopicIds.has(topicId));
    if (invalid.length > 0) {
      throw new ValidationError('All topics in a learning path must belong to the same course.', [
        { field: 'topicSequence', issue: `Not part of course: ${invalid.join(', ')}` },
      ]);
    }

    return this.repository.create({
      courseId: courseId as unknown as LearningPathDocument['courseId'],
      title: input.title,
      topicSequence: input.topicSequence as unknown as LearningPathDocument['topicSequence'],
    });
  }

  async listByCourse(courseId: string): Promise<LearningPathDocument[]> {
    await this.courses.getById(courseId);
    return this.repository.findByCourse(courseId);
  }
}

export const learningPathService = new LearningPathService();
