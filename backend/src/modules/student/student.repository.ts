import { BaseRepository } from '@database/baseRepository';
import { StudentProfileDocument, StudentProfileModel } from './student.model';

export class StudentRepository extends BaseRepository<StudentProfileDocument> {
  constructor() {
    super(StudentProfileModel);
  }

  async findByUserId(userId: string): Promise<StudentProfileDocument | null> {
    return StudentProfileModel.findOne({ userId }).exec();
  }
}

export const studentRepository = new StudentRepository();
