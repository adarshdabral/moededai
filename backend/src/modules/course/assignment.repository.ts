import { BaseRepository } from '@database/baseRepository';
import { AssignmentDocument, AssignmentModel } from './assignment.model';

export class AssignmentRepository extends BaseRepository<AssignmentDocument> {
  constructor() {
    super(AssignmentModel);
  }

  async findByCourse(courseId: string): Promise<AssignmentDocument[]> {
    return AssignmentModel.find({ courseId })
      .sort({ dueAt: 1 })
      .lean<AssignmentDocument[]>()
      .exec();
  }
}

export const assignmentRepository = new AssignmentRepository();
