import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parentId?: mongoose.Types.ObjectId;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  sort: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;