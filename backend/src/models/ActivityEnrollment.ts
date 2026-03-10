import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityEnrollment extends Document {
  activityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityEnrollmentSchema: Schema<IActivityEnrollment> = new Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['joined', 'cancelled'],
    default: 'joined'
  }
}, {
  timestamps: true,
  unique: true,
  index: {
    unique: true,
    fields: ['activityId', 'userId']
  }
});

const ActivityEnrollment = mongoose.model<IActivityEnrollment>('ActivityEnrollment', ActivityEnrollmentSchema);
export default ActivityEnrollment;