import { Schema, model, Document, Model } from 'mongoose';

/**
 * Singleton document (fixed _id) holding platform-wide configuration for the
 * Admin Portal. Not part of the original docs/DATABASE.md design - added in
 * Phase 8 to satisfy the Admin Portal's "Platform Settings" requirement; see
 * docs/ROADMAP.md Phase 8 scope notes.
 */
export interface PlatformSettingsDocument extends Omit<Document, '_id'> {
  _id: string;
  maintenanceMode: boolean;
  announcement?: string;
  updatedAt: Date;
  createdAt: Date;
}

const platformSettingsSchema = new Schema<PlatformSettingsDocument>(
  {
    _id: { type: String, required: true },
    maintenanceMode: { type: Boolean, required: true, default: false },
    announcement: { type: String, maxlength: 500 },
  },
  { timestamps: true, collection: 'platform_settings' }
);

export const PlatformSettingsModel: Model<PlatformSettingsDocument> =
  model<PlatformSettingsDocument>('PlatformSettings', platformSettingsSchema);
