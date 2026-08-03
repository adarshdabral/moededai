import { Schema, model, Document, Model, Types } from 'mongoose';

export interface CourseDocument extends Document {
  title: string;
  description?: string;
  subject: string;
  gradeLevel: string;
  teacherIds: Types.ObjectId[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000 },
    subject: { type: String, required: true, index: true },
    gradeLevel: { type: String, required: true, index: true },
    teacherIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (value: Types.ObjectId[]) => value.length > 0,
        message: 'A course must have at least one teacher.',
      },
      index: true,
    },
    isPublished: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: 'courses' }
);

export const CourseModel: Model<CourseDocument> = model<CourseDocument>('Course', courseSchema);
