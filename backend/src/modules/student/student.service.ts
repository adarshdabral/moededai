import { NotFoundError } from '@common/errors/AppError';
import { studentRepository, StudentRepository } from './student.repository';
import { StudentProfileDocument } from './student.model';
import { CreateStudentProfileInput } from './student.types';

export class StudentService {
  constructor(private readonly repository: StudentRepository = studentRepository) {}

  async createProfile(input: CreateStudentProfileInput): Promise<StudentProfileDocument> {
    return this.repository.create({
      userId: input.userId as unknown as StudentProfileDocument['userId'],
      gradeLevel: input.gradeLevel,
    });
  }

  async getByUserId(userId: string): Promise<StudentProfileDocument> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundError('Student profile');
    return profile;
  }
}

export const studentService = new StudentService();
