import { Schema, model, Document, Model, Types } from 'mongoose';

export type ResourceType = 'document' | 'video' | 'link' | 'upload';

export interface ResourceDocument extends Document {
  topicId: Types.ObjectId;
  type: ResourceType;
  title: string;
  url: string;
  storageKey?: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<ResourceDocument>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    type: { type: String, enum: ['document', 'video', 'link', 'upload'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    url: { type: String, required: true },
    storageKey: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'resources' }
);

export const ResourceModel: Model<ResourceDocument> = model<ResourceDocument>(
  'Resource',
  resourceSchema
);
