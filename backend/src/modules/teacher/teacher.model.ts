import { Schema, model, Document, Model, Types } from 'mongoose';

export interface TeacherProfileDocument extends Document {
  userId: Types.ObjectId;
  subjectSpecialization: string[];
  assignedCourseIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const teacherProfileSchema = new Schema<TeacherProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    subjectSpecialization: [{ type: String }],
    assignedCourseIds: [{ type: Schema.Types.ObjectId, ref: 'Course', default: [] }],
  },
  { timestamps: true, collection: 'teacher_profiles' }
);

export const TeacherProfileModel: Model<TeacherProfileDocument> = model<TeacherProfileDocument>(
  'TeacherProfile',
  teacherProfileSchema
);
