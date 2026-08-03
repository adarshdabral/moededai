import { BaseRepository } from '@database/baseRepository';
import { TeacherProfileDocument, TeacherProfileModel } from './teacher.model';

export class TeacherRepository extends BaseRepository<TeacherProfileDocument> {
  constructor() {
    super(TeacherProfileModel);
  }

  async findByUserId(userId: string): Promise<TeacherProfileDocument | null> {
    return TeacherProfileModel.findOne({ userId }).exec();
  }
}

export const teacherRepository = new TeacherRepository();
