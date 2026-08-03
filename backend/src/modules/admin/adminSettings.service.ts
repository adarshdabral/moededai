import { PlatformSettingsDocument, PlatformSettingsModel } from './platformSettings.model';

const SETTINGS_DOC_ID = 'platform';

export interface PlatformSettingsDTO {
  maintenanceMode: boolean;
  announcement?: string;
}

export class AdminSettingsService {
  toDTO(doc: PlatformSettingsDocument): PlatformSettingsDTO {
    return { maintenanceMode: doc.maintenanceMode, announcement: doc.announcement };
  }

  async get(): Promise<PlatformSettingsDocument> {
    const existing = await PlatformSettingsModel.findById(SETTINGS_DOC_ID).exec();
    if (existing) return existing;
    return PlatformSettingsModel.create({ _id: SETTINGS_DOC_ID, maintenanceMode: false });
  }

  async update(updates: Partial<PlatformSettingsDTO>): Promise<PlatformSettingsDocument> {
    const updated = await PlatformSettingsModel.findByIdAndUpdate(
      SETTINGS_DOC_ID,
      { $set: updates },
      { new: true, upsert: true }
    ).exec();
    return updated as PlatformSettingsDocument;
  }
}

export const adminSettingsService = new AdminSettingsService();
