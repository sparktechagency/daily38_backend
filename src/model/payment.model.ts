import { model, models, Schema } from "mongoose";
import { PAYMENT_STATUS } from "../enums/payment.enum";

const paymentSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user"
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "order"
    },
    amount: Number,
    commission: Number,
    status: { 
      type: String, 
      enum: PAYMENT_STATUS, 
      default: PAYMENT_STATUS.PENDING 
    },
    invoicePDF: String,
  },{
    timestamps: true
  });
  
const Payment = models.Payment || model('payment', paymentSchema);
export default Payment;