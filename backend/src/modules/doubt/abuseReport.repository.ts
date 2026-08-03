import { BaseRepository } from '@database/baseRepository';
import { AbuseReportDocument, AbuseReportModel } from './abuseReport.model';

export class AbuseReportRepository extends BaseRepository<AbuseReportDocument> {
  constructor() {
    super(AbuseReportModel);
  }

  async findPendingFirst(options: { skip?: number; limit?: number }): Promise<AbuseReportDocument[]> {
    return AbuseReportModel.find({})
      .sort({ status: 1, createdAt: 1 })
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 20)
      .lean<AbuseReportDocument[]>()
      .exec();
  }

  async count(): Promise<number> {
    return AbuseReportModel.countDocuments({}).exec();
  }
}

export const abuseReportRepository = new AbuseReportRepository();
