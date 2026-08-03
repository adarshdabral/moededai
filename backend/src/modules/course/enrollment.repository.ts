import { BaseRepository } from '@database/baseRepository';
import { EnrollmentDocument, EnrollmentModel } from './enrollment.model';

export class EnrollmentRepository extends BaseRepository<EnrollmentDocument> {
  constructor() {
    super(EnrollmentModel);
  }

  async findByCourse(courseId: string): Promise<EnrollmentDocument[]> {
    return EnrollmentModel.find({ courseId }).lean<EnrollmentDocument[]>().exec();
  }

  async findByStudent(studentId: string): Promise<EnrollmentDocument[]> {
    return EnrollmentModel.find({ studentId }).lean<EnrollmentDocument[]>().exec();
  }

  async findOneByStudentAndCourse(
    studentId: string,
    courseId: string
  ): Promise<EnrollmentDocument | null> {
    return EnrollmentModel.findOne({ studentId, courseId }).exec();
  }
}

export const enrollmentRepository = new EnrollmentRepository();
