import { Schema, model, Document, Model, Types } from 'mongoose';

export type ConversationRole = 'student' | 'assistant';

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  sentAt: Date;
}

export interface AiTutorConversationDocument extends Document {
  studentId: Types.ObjectId;
  topicId?: Types.ObjectId;
  title: string;
  messages: ConversationMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<ConversationMessage>(
  {
    role: { type: String, enum: ['student', 'assistant'], required: true },
    content: { type: String, required: true },
    sentAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false }
);

const aiTutorConversationSchema = new Schema<AiTutorConversationDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    title: { type: String, required: true, default: 'New conversation', maxlength: 150 },
    messages: { type: [messageSchema], required: true, default: [] },
    lastMessageAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true, collection: 'ai_tutor_conversations' }
);

aiTutorConversationSchema.index({ studentId: 1, lastMessageAt: -1 });

export const AiTutorConversationModel: Model<AiTutorConversationDocument> =
  model<AiTutorConversationDocument>('AiTutorConversation', aiTutorConversationSchema);
