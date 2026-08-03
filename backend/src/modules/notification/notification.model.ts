import { Schema, model, Document, Model, Types } from 'mongoose';

export type NotificationType = 'test_reminder' | 'score_update' | 'announcement' | 'doubt_reply';

export interface NotificationDocument extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  deliveredViaEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['test_reminder', 'score_update', 'announcement', 'doubt_reply'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 150 },
    body: { type: String, required: true, maxlength: 1000 },
    isRead: { type: Boolean, required: true, default: false },
    deliveredViaEmail: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: 'notifications' }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<NotificationDocument> = model<NotificationDocument>(
  'Notification',
  notificationSchema
);
