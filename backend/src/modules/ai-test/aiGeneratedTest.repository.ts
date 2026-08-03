import { BaseRepository } from '@database/baseRepository';
import { AiGeneratedTestDocument, AiGeneratedTestModel } from './aiGeneratedTest.model';

export class AiGeneratedTestRepository extends BaseRepository<AiGeneratedTestDocument> {
  constructor() {
    super(AiGeneratedTestModel);
  }
}

export const aiGeneratedTestRepository = new AiGeneratedTestRepository();
