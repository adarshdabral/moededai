import { BaseRepository } from '@database/baseRepository';
import { MonthlyAssessmentDocument, MonthlyAssessmentModel } from './monthlyAssessment.model';

export class MonthlyAssessmentRepository extends BaseRepository<MonthlyAssessmentDocument> {
  constructor() {
    super(MonthlyAssessmentModel);
  }

  async findByCourse(courseId: string): Promise<MonthlyAssessmentDocument[]> {
    return MonthlyAssessmentModel.find({ courseId })
      .sort({ scheduledFor: -1 })
      .lean<MonthlyAssessmentDocument[]>()
      .exec();
  }

  async findDueToOpen(now: Date): Promise<MonthlyAssessmentDocument[]> {
    return MonthlyAssessmentModel.find({ status: 'scheduled', scheduledFor: { $lte: now } }).exec();
  }

  async findDueToClose(now: Date): Promise<MonthlyAssessmentDocument[]> {
    return MonthlyAssessmentModel.find({ status: 'open', windowClosesAt: { $lte: now } }).exec();
  }
}

export const monthlyAssessmentRepository = new MonthlyAssessmentRepository();
