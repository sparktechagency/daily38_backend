import { JwtPayload } from "jsonwebtoken";
import User from "../../model/user.model";
import { StatusCodes } from "http-status-codes";
import { ACCOUNT_STATUS, USER_ROLES } from "../../enums/user.enums";
import ApiError from "../../errors/ApiError";
import {
  accountLinks,
  accounts,
  checkout,
  transfers,
} from "../router/payment.route";
import Order from "../../model/order.model";
import Offer from "../../model/offer.model";
import { makeAmountWithFee } from "../../helpers/fee";
import { OFFER_STATUS } from "../../enums/offer.enum";
import Payment from "../../model/payment.model";
import mongoose from "mongoose";

const createSession = async (
  payload: JwtPayload,
  server: {
    host: string;
    protocol: string;
  },
  data: {
    offerID: string;
  }
) => {
  const { host, protocol } = server;
  const { userID } = payload;
  const isUser = await User.findById(userID);

  if (!isUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, `No account exists!`);
  }

  if (
    isUser.accountStatus === ACCOUNT_STATUS.DELETE ||
    isUser.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isUser.accountStatus.toLowerCase()}!`
    );
  }

  const offer = await Offer.findById(data.offerID).populate("projectID","adminCommissionPercentage");
  if (!offer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Offer not founded!");
  }

  if (offer.status == OFFER_STATUS.PAID) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This offer was already payed and a project was already started!"
    );
  }

  const paymentAmout = Math.floor(offer.budget * 100);

  const lineItems = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: "Amount",
        },
        unit_amount: paymentAmout,
      },
      quantity: 1,
    },
  ];


  const adminComission = await makeAmountWithFee(Number(offer.budget),(offer.projectID as any)?.adminCommissionPercentage || undefined);

  // Create checkout session
  const session = await checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${protocol}://${host}/api/v1/payment/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${protocol}://${host}/api/v1/payment/cancel`,
    line_items: lineItems,
    metadata: {
      commission: adminComission,
      userId: String(userID),
      offerID: String(offer._id.toString()),
    },
  });

  return { session_url: session.url };
};

const verifyProvider = async (
  payload: JwtPayload,
  server: {
    host: string;
    protocol: string;
  }
) => {
  const { host, protocol } = server;
  const { userID } = payload;
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }

  if (
    user.accountStatus === ACCOUNT_STATUS.DELETE ||
    user.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${user.accountStatus.toLowerCase()}!`
    );
  }

  if (
    user.paymentCartDetails !== "" ||
    user.paymentCartDetails != undefined ||
    user.paymentCartDetails !== null
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You account was already verifyed!"
    );
  }

  const account = await accounts.create({
    type: "express",
    email: user.email,
    country: "US",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  let url;

  const onboardLInk = await accountLinks.create({
    account: account.id,
    refresh_url: `${protocol}://${host}/api/v1/payment/refresh/${account.id}`,
    return_url: `${protocol}://${host}/api/v1/payment/return?accountId=${account.id}&userId=${user._id}`,
    type: "account_onboarding",
  });
  url = onboardLInk.url;

  return {
    url,
  };
};

const payoutToUser = async (payload: JwtPayload, orderID: any) => {
  const { userID } = payload;
  if (!orderID) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "You must provide the order id for the payment when it's complete!"
    );
  }

  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }

  const order = await Order.findById(orderID).populate({
    path: "offerID",
    select: "budget projectID",
    populate: {
      path: "projectID",
      select: "adminCommissionPercentage",
    },
  });
  if (!order) {
    throw new ApiError(
      StatusCodes.BAD_GATEWAY,
      "We didn't find the order to pay you back!"
    );
  }

  if (!order.isProgressDone) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You haven't completed the order process!"
    );
  }

  if (!user.paymentCartDetails) {
    throw new ApiError(
      StatusCodes.EXPECTATION_FAILED,
      "We didn't find your payment method!"
    );
  }

  const adminAmount = await makeAmountWithFee(Number(order.offerID.budget),(order.offerID.projectID as any).adminCommissionPercentage);

  const providerAmount = Number(order.offerID.budget) - adminAmount;

  // Create transfer to user
  const transfer = await transfers.create({
    amount: providerAmount * 100, // Convert to cents
    currency: "usd",
    destination: user.paymentCartDetails,
  });

  if (!transfer) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to transfer funds to the user!"
    );
  }

  return transfer;
};

const PaymentRecords = async (user: JwtPayload, queryStatus: 'PENDING' | 'COMPLETED') => {
    if (user.role === USER_ROLES.SERVICE_PROVIDER && !queryStatus) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You must provide the query status! 'PENDING' | 'COMPLETED'");
    }
    if (user.role === USER_ROLES.USER && queryStatus) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You can't provide the query status! 'PENDING' | 'COMPLETED'");
    }

  const payments = await Payment.find().populate({
    path: "orderId",
    select: "trackStatus offerID customer provider",
    populate: [
      {
        path: "offerID",
        select: "projectID budget",
        populate: {
          path: "projectID",
          select: "projectName isOfferApproved isPaid isOnProject",
        },
      },
      {
        path: "customer",
        select: "fullName",
      },
      {
        path: "provider",
        select: "fullName",
      },
    ],
  });
  // .limit(1); // 🏃‍♀️‍➡️ need to remove this limitation
  if (!payments) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, "We didn't find the payments!");
  }

  const records = payments.filter((payment) => {
    const userObjectId = new mongoose.Types.ObjectId(user.userID);
    if (user.role === USER_ROLES.USER) {
      return payment.orderId.customer.equals(userObjectId); // Use equals() for ObjectId comparison
    } else if (user.role === USER_ROLES.SERVICE_PROVIDER) {
      return payment.orderId.provider.equals(userObjectId); // Use equals() for ObjectId comparison
    }
  });

  const structuredReocrds = records.map((payment) => {
    return {
      paymentId: payment._id,
      postName: payment?.orderId?.offerID?.projectID?.projectName || "",
      customerName: payment?.orderId?.customer?.fullName || "",
      providerName: payment?.orderId?.provider?.fullName || "",
      fullPaidAmount: payment.amount,
      commission: payment.commission,
      providerRecievedAmount: payment.amount - payment.commission,
      paymentStatus: payment.status,
      orderStatus: payment.orderId.trackStatus,
      createdAt: payment.createdAt,
    };
  });

  const totalLifeTimeSpentByCustomer = structuredReocrds.reduce(
    (total, payment) => total + payment.fullPaidAmount,
    0
  );

  const totalLifeTimeCompletedEarningByProvider = structuredReocrds?.reduce(
    (total, payment) => {
      if (payment?.orderStatus?.isComplited?.status) {
        return total + payment.providerRecievedAmount;
      }
      return total; // If the condition is false, return the current total
    },
    0
  );

  const totalLifeTimeEarningPendingByProvider = structuredReocrds?.reduce(
    (total, payment) => {
      if (!payment?.orderStatus?.isComplited?.status) {
        return total + payment.providerRecievedAmount;
      }
      return total;
    },
    0
  );

  const orderStatusIsCompletedRecords = structuredReocrds?.filter(
    (payment) => payment?.orderStatus?.isComplited?.status
  );

  const orderStatusIsPendingRecords = structuredReocrds?.filter(
    (payment) => !payment?.orderStatus?.isComplited?.status
  );

  return {
    totalLifeTimeSpentByCustomer:
      user.role === USER_ROLES.USER ? totalLifeTimeSpentByCustomer : undefined,
    totalLifeTimeCompletedEarningByProvider:
      user.role === USER_ROLES.SERVICE_PROVIDER
        ? totalLifeTimeCompletedEarningByProvider
        : undefined,
    totalLifeTimeEarningPendingByProvider:
      user.role === USER_ROLES.SERVICE_PROVIDER
        ? totalLifeTimeEarningPendingByProvider
        : undefined,
    records:
      user.role === USER_ROLES.USER
        ? structuredReocrds
        : user.role === USER_ROLES.SERVICE_PROVIDER
          ? queryStatus == 'PENDING'
            ? orderStatusIsPendingRecords
            : orderStatusIsCompletedRecords
          : structuredReocrds,
  };
};

export const PaymentService = {
  createSession,
  // chargeCustomer,
  verifyProvider,
  payoutToUser,
  PaymentRecords,
};
