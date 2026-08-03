import { Schema, model, Document, Model, Types } from 'mongoose';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface EnrollmentDocument extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: { type: String, enum: ['active', 'completed', 'dropped'], required: true, default: 'active' },
    enrolledAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true, collection: 'course_enrollments' }
);

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const EnrollmentModel: Model<EnrollmentDocument> = model<EnrollmentDocument>(
  'Enrollment',
  enrollmentSchema
);
