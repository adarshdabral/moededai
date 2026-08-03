import { Schema, model, Document, Model, Types } from 'mongoose';

export interface TopicDocument extends Document {
  courseId: Types.ObjectId;
  title: string;
  order: number;
  learningObjectives: string[];
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<TopicDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    order: { type: Number, required: true, min: 0 },
    learningObjectives: [{ type: String }],
  },
  { timestamps: true, collection: 'topics' }
);

topicSchema.index({ courseId: 1, order: 1 }, { unique: true });

export const TopicModel: Model<TopicDocument> = model<TopicDocument>('Topic', topicSchema);
