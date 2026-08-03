import { Schema, model, Document, Model, Types } from 'mongoose';

export interface StudentProfileDocument extends Document {
  userId: Types.ObjectId;
  gradeLevel: string;
  enrolledCourseIds: Types.ObjectId[];
  learningStreakDays: number;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<StudentProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    gradeLevel: { type: String, required: true },
    enrolledCourseIds: [{ type: Schema.Types.ObjectId, ref: 'Course', default: [] }],
    learningStreakDays: { type: Number, required: true, default: 0, min: 0 },
    lastActivityAt: { type: Date },
  },
  { timestamps: true, collection: 'student_profiles' }
);

export const StudentProfileModel: Model<StudentProfileDocument> = model<StudentProfileDocument>(
  'StudentProfile',
  studentProfileSchema
);
