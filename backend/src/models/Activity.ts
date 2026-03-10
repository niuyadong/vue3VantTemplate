import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  image: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema<IActivity> = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'ended'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;