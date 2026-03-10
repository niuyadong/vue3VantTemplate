import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrderAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  zipCode?: string;
}

export interface IOrder extends Document {
  orderNo: string;
  userId: mongoose.Types.ObjectId;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  address: IOrderAddress;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema<IOrder> = new Schema({
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'payment', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['alipay', 'wechat', 'card'],
    default: 'alipay'
  },
  address: {
    type: {
      name: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      province: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      district: {
        type: String,
        required: true
      },
      detail: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        default: ''
      }
    },
    required: true
  },
  items: {
    type: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      image: {
        type: String,
        default: ''
      }
    }],
    required: true,
    minlength: 1
  }
}, {
  timestamps: true
});

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;