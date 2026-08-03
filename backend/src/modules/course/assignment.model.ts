import { Schema, model, Document, Model, Types } from 'mongoose';

export interface AssignmentDocument extends Document {
  courseId: Types.ObjectId;
  title: string;
  description: string;
  dueAt: Date;
  attachmentUrl?: string;
  attachmentStorageKey?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    dueAt: { type: Date, required: true },
    attachmentUrl: { type: String },
    attachmentStorageKey: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'assignments' }
);

assignmentSchema.index({ courseId: 1, dueAt: 1 });

export const AssignmentModel: Model<AssignmentDocument> = model<AssignmentDocument>(
  'Assignment',
  assignmentSchema
);
