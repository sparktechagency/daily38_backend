import { JwtPayload } from "jsonwebtoken";
import User from "../../model/user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiError";
import {
  ACCOUNT_STATUS,
  ACCOUNT_VERIFICATION_STATUS,
  USER_ROLES,
} from "../../enums/user.enums";
import Order from "../../model/order.model";
import DeliveryRequest from "../../model/deliveryRequest.model";
import Notification from "../../model/notification.model";
import { DELIVERY_STATUS, REQUEST_TYPE } from "../../enums/delivery.enum";
import mongoose from "mongoose";
import Verification from "../../model/verifyRequest.model";
import Payment from "../../model/payment.model";
import { PAYMENT_STATUS } from "../../enums/payment.enum";
import { PaginationParams } from "../../types/user";
import { OFFER_STATUS } from "../../enums/offer.enum";
import Chat from "../../model/chat.model";
import { transfers } from "../router/payment.route";
import { makeAmountWithFee } from "../../helpers/fee";
import Post from "../../model/post.model";

const singleOrder = async (payload: JwtPayload, orderID: string) => {
  const { userID } = payload;
  const isExist = await User.findOne({ _id: userID });
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }
  if (
    isExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isExist.accountStatus.toLowerCase()}!`
    );
  }

  const order = (await Order.findById(orderID)
    .populate({
      path: "offerID",
      select: "projectID startDate budget",
    })
    .populate("customer", "fullName")
    .populate({
      path: "provider",
    })) as any;
    // updatedByAsif
  console.log("🚀 ~ singleOrder ~ order:", order?.deliveryRequest)
  console.log("🚀 ~ singleOrder ~ order._id:", order?._id)

  // console.log('order ====================',order)
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not exist!");
  }

  if (order.offerID.to === isExist._id && order.offerID.form === isExist._id) {
    throw new ApiError(
      StatusCodes.BAD_GATEWAY,
      "You are not authorize to access this order"
    );
  }

  const projectDetails = await Post.findById(order.offerID.projectID);

  return {
    // deliveryRequest: order.deliveryRequest,
    deliveryRequest: {
      isRequested: order.deliveryRequest.isRequested,
      requestID: order._id,
    },
    status: order.trackStatus,
    offerID: order.offerID._id,
    customerName: order.customer.fullName,
    totalPrice: order.offerID.budget,
    projectName: projectDetails?.projectName || "",
    projectDescription: projectDetails?.jobDescription || "",
    projectImage: projectDetails?.coverImage || "",
    projectID: projectDetails?._id || "",
    startDate: order.offerID.startDate,
    deliveryDate: order.deliveryDate,
    providerName: order.provider.fullName,
    providerID: order.provider._id,
    extendedDate: order.isExtends.date,
    extendedMessage: order.isExtends.message,
  };
};

const AllOrders = async (payload: JwtPayload, params: PaginationParams) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ _id: userID });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
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

  // Get total order count
  const totalOrders = await Order.countDocuments({ _id: { $in: user.orders } });

  // Fetch paginated orders and populate
  const paginatedOrders = await Order.find({
    _id: { $in: user.orders },
    "trackStatus.isComplited.status": false,
  })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "offerID",
      select: "projectID",
      // populate: {
      //     path:"projectID",
      //     select:"projectName jobDescription coverImage"
      // }
    })
    .select("offerID")
    .sort({ createdAt: -1 });

  const formetedData = await Promise.all(
    paginatedOrders.map(async (e: any) => {
      const project = await Post.findById(e.offerID.projectID);
      return {
        project,
        id: e._id,
      };
    })
  );

  return {
    data: formetedData,
    total: totalOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
  };
};

const AllCompletedOrders = async (
  payload: JwtPayload,
  params: PaginationParams
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isExist = await User.findOne({ _id: userID });

  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }

  if (
    isExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isExist.accountStatus.toLowerCase()}!`
    );
  }

  const orders = await Order.find({
    $or: [{ customer: userID }, { provider: userID }],
    "trackStatus.isComplited": true,
  })
    .populate({
      path: "offerID",
      select: "projectID",
      populate: {
        path: "projectID",
        select: "projectName jobDescription coverImage",
      },
    })
    .select("offerID")
    .skip(skip)
    .limit(limit)
    .lean();

  const formetedData = orders.map((e: any) => ({
    project: e.offerID.projectID,
    id: e._id,
  }));

  return { data: formetedData };
};

const ACompletedOrder = async (payload: string) => {
  const order = (await Order.findById(new mongoose.Types.ObjectId(payload))
    .populate({
      path: "offerID",
      populate: "projectID",
    })
    .populate("customer", "fullName")
    .populate({
      path: "provider",
    })
    .lean()) as any;
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not exist!");
  }

  const delivaryRequest = await DeliveryRequest.findOne({
    orderID: order._id,
  });

  const isChatExist = await Chat.find({
    users: { $all: [order.customer._id, order.provider._id] },
  });

  return {
    totalPrice: order.offerID.budget,
    projectName: order.offerID.projectID.projectName,
    projectDescription: order.offerID.projectID.jobDescription,
    projectImage: order.offerID.projectID.coverImage,
    projectID: order.offerID.projectID._id,
    startDate: order.offerID.startDate,
    deliveryDate: order.deliveryDate,
    providerName: order.provider.fullName,
    providerID: order.provider._id,
    customerName: order.customer.fullName,
    projectDoc: delivaryRequest.projectDoc,
    projectLink: delivaryRequest.uploatedProject,
    pdf: delivaryRequest.uploatedProject,
    images: delivaryRequest.images,
    offerID: order.offerID._id,
    chatID: isChatExist[0]?._id || null,
  };
};

const dOrder = async (user: JwtPayload, orderID: string) => {
  const { userID } = user;
  const isExist = await User.findById(userID);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }
  if (
    isExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isExist.accountStatus.toLowerCase()}!`
    );
  }
  const order = await Order.findById(orderID);
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not exist!");
  }
  if (
    order.provider.toString() !== isExist._id.toString() &&
    order.customer.toString() !== isExist._id.toString()
  ) {
    throw new ApiError(
      StatusCodes.METHOD_NOT_ALLOWED,
      "You are not authorize to delete this order!"
    );
  }

  await Order.deleteOne({ _id: order._id });

  isExist.orders = isExist.orders.filter((e: any) => e.toString() !== orderID);
  await isExist.save();
  return true;
};

const deliveryRequest = async (
  payload: JwtPayload,
  data: {
    orderID: string;
    uploatedProject: string;
    projectDoc: string;
  },
  pdf: string,
  image: string[]
) => {
  const { userID } = payload;
  const { orderID, uploatedProject, projectDoc } = data;
  const isOrderExist = await Order.findOne({ _id: orderID }).populate({
    path: "offerID",
    select: "projectID",
  });
  const project = await Post.findById(isOrderExist.offerID.projectID).select(
    "location"
  );
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not exist!");
  }
  const isUserExist = await User.findOne({ _id: userID });
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }
  if (!isOrderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not exist!");
  }
  if (
    isUserExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isUserExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isOrderExist.accountStatus.toLowerCase()}!`
    );
  }
  if (!pdf && !image) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You must give atlast one image of file for send a delivery request"
    );
  }

  const delivaryData = {
    for: isOrderExist.customer,
    from: isOrderExist.provider,
    orderID,
    projectDoc,
    requestType: REQUEST_TYPE.DELIVERY,
    uploatedProject,
    pdf,
    images: image,
    isValid: false,
    location: project.location,
  };

  const delivaryRequest = await DeliveryRequest.create(delivaryData);

  await DeliveryRequest.updateMany(
    {
      orderID: orderID,
      from: delivaryRequest.from,
      for: delivaryRequest.for,
      _id: { $ne: delivaryRequest._id },
      isValid: false,
    },
    {
      isValid: true,
    }
  );

  await Order.updateOne(
    { _id: isOrderExist._id },
    { deliveryRequest: true, requestID: delivaryRequest._id }
  );

  const notification = await Notification.create({
    for: isOrderExist.customer,
    notiticationType: "DELIVERY_REQUEST",
    content: `Got a new delivery request from ${isUserExist.fullName}`,
    data: {
      orderId: isOrderExist._id,
      requestId: delivaryRequest._id,
    },
  });

  //@ts-ignore
  const io = global.io;
  io.emit(`socket:${isOrderExist.customer}`, notification);

  return "delivaryRequest";
};

const deliveryTimeExtendsRequest = async (
  payload: JwtPayload,
  data: {
    reason: string;
    nextDate: string;
    orderID: string;
  }
) => {
  const { userID } = payload;
  const { orderID, reason, nextDate } = data;
  const isOrderExist = await Order.findById(orderID).populate("offerID");
  const isUserExist = await User.findById(userID);
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }
  if (!isOrderExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Order not exist!");
  }
  if (
    isUserExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isUserExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isOrderExist.accountStatus.toLowerCase()}!`
    );
  }

  const delivaryData = {
    for: isOrderExist.customer,
    orderID,
    projectDoc: reason,
    requestType: REQUEST_TYPE.TIME_EXTEND,
    nextExtendeDate: nextDate,
  };

  await DeliveryRequest.create(delivaryData);

  const notification = await Notification.create({
    for: isOrderExist.customer,
    content: `Got a new delivery time extends request from ${isUserExist.fullName}`,
  });

  //@ts-ignore
  const io = global.io;
  io.emit(`socket:${isOrderExist.customer}`, notification);

  return true;
};

const getDeliveryTimeExtendsRequest = async (
  payload: JwtPayload,
  params: PaginationParams
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isUserExist = await User.findById(userID);
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }

  if (
    isUserExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isUserExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isUserExist.accountStatus.toLowerCase()}!`
    );
  }

  const total = await DeliveryRequest.countDocuments({
    for: new mongoose.Types.ObjectId(isUserExist._id),
    requestType: "TIME_EXTEND",
  });

  const requests = await DeliveryRequest.find({
    for: new mongoose.Types.ObjectId(isUserExist._id),
    requestType: "TIME_EXTEND",
  })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  return {
    data: requests,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
};

const getADeliveryTimeExtendsRequest = async (
  payload: JwtPayload,
  requestId: string
) => {
  const { userID } = payload;
  const isUserExist = await User.findById(userID);
  if (!isUserExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }
  if (
    isUserExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isUserExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isUserExist.accountStatus.toLowerCase()}!`
    );
  }

  const requests = await DeliveryRequest.findById(requestId);

  return requests;
};

const getDeliveryReqests = async (
  payload: JwtPayload,
  params: PaginationParams & { orderID: string }
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isExist = await User.findOne({ _id: userID });
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }

  if (
    isExist.accountStatus === ACCOUNT_STATUS.DELETE ||
    isExist.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isExist.accountStatus.toLowerCase()}!`
    );
  }

  const totalRequests = await DeliveryRequest.countDocuments({
    for: isExist._id,
    orderID: params.orderID,
  });

  const deliveryRequests = await DeliveryRequest.find({
    for: isExist._id,
    orderID: params.orderID,
    requestStatus: { $ne: DELIVERY_STATUS.DECLINE },
  })
    .populate({
      path: "orderID",
      select: "orderID",
      populate: {
        path: "provider",
        select: "fullName profileImage address",
      },
    })
    .select("orderID location isValid createdAt")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const dataDetails = deliveryRequests.map((e: any) => ({
    _id: e._id,
    providerName: e.orderID.provider.fullName,
    providerAddress: e.location || "",
    providerImage: e.orderID.provider.profileImage,
    isValid: e.isValid,
    createdAt: e.createdAt,
  }));
  console.log("dataDetails", dataDetails);

  return {
    data: dataDetails,
    total: totalRequests,
    currentPage: page,
    totalPages: Math.ceil(totalRequests / limit),
  };
};

const ADeliveryReqest = async (payload: JwtPayload, requestId: string) => {
  const { userID } = payload;
  const isExistUser = await User.findOne({ _id: userID });
  if (!requestId) {
    throw new ApiError(
      StatusCodes.NOT_ACCEPTABLE,
      "You must give the request id!"
    );
  }
  if (!isExistUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }
  if (
    isExistUser.accountStatus === ACCOUNT_STATUS.DELETE ||
    isExistUser.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isExistUser.accountStatus.toLowerCase()}!`
    );
  }

  const deliveryRequest = await DeliveryRequest.findById(requestId).populate({
    path: "orderID",
    populate: {
      path: "offerID",
      select: "projectID",
    },
  });
  if (!deliveryRequest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Delivery request not exist!");
  }

  const projectDetails = await Post.findById(
    deliveryRequest.orderID.offerID.projectID
  );

  const formatedData = {
    projectName: projectDetails?.projectName,
    projectID: projectDetails?._id,
    projectDecription: projectDetails?.jobDescription,
    projectImage: projectDetails?.coverImage,
    _id: deliveryRequest._id,
    additionalInfo: deliveryRequest.projectDoc,
    projectLink: deliveryRequest.uploatedProject,
    pdf: deliveryRequest.pdf,
    images: deliveryRequest.images,
  };

  return formatedData;
};

const reqestAction = async (
  user: JwtPayload,
  requestData: {
    acction: "DECLINE" | "APPROVE";
    requestID: string;
  }
) => {
  const { userID } = user;
  const { acction, requestID } = requestData;

  const isUser = await User.findOne({ _id: userID });
  if (!isUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
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

  if (acction === "DECLINE") {
    const request = await DeliveryRequest.findByIdAndUpdate(requestID, {
      requestStatus: DELIVERY_STATUS.DECLINE,
    });
    const order = await Order.findById(request.orderID).populate(
      "customer",
      "fullName"
    );
    const notification = await Notification.create({
      for: order.provider,
      content: `Your delivery request was cancelled by ${order.customer.fullName}`,
    });

    order.status = OFFER_STATUS.DECLINE;
    await order.save();

    //@ts-ignore
    const io = global.io;
    io.emit(`socket:${order.provider}`, notification);

    return;
  }

  const delivaryRequest = await DeliveryRequest.findById(requestID);

  const order = await Order.findByIdAndUpdate(delivaryRequest.orderID)
    .populate("provider")
    .populate("offerID");

  const budget = order.offerID.budget;

  const amountAfterFee = (makeAmountWithFee(budget) - budget) * 100;

  if (!order.provider.paymentCartDetails) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "You provider was not added the payment methord!"
    );
  }

  delivaryRequest.requestStatus = acction;
  delivaryRequest.isValid = true;
  await delivaryRequest.save();

  await Order.findByIdAndUpdate(
    order._id,
    {
      trackStatus: {
        isComplited: {
          date: new Date(),
          status: true,
        },
      },
    },
    { new: true }
  );

  await transfers.create({
    amount: amountAfterFee,
    currency: "usd",
    destination: order.provider.paymentCartDetails,
    transfer_group: `order_${order._id}`,
  });

  if (!delivaryRequest) {
    throw new ApiError(
      StatusCodes.FAILED_DEPENDENCY,
      "Something was problem on delivery request oparation!"
    );
  }
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "We don't found the order!");
  }

  const notification = await Notification.create({
    for: order.provider._id,
    content: `Your order was delivared successfully`,
  });

  await Order.findByIdAndUpdate(order._id, {
    $set: {
      "trackStatus.isComplited.status": true,
      "trackStatus.isComplited.date": new Date(Date.now()),
    },
  });

  //@ts-ignore
  const io = global.io;
  io.emit(`socket:${order.provider._id}`, notification);

  await Payment.create({
    userId: order.customer,
    orderId: order._id,
    amount: budget,
    commission: amountAfterFee,
    status: PAYMENT_STATUS.SUCCESS,
  });

  return true;
};

const DelivaryRequestForTimeExtends = async (
  user: JwtPayload,
  requestData: {
    acction: "DECLINE" | "APPROVE";
    requestID: string;
  }
) => {
  const { userID } = user;
  const { acction, requestID } = requestData;
  const isUser = await User.findOne({ _id: userID });
  if (!isUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
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

  if (acction === "DECLINE") {
    const request = await DeliveryRequest.findByIdAndUpdate(requestID, {
      requestStatus: DELIVERY_STATUS.DECLINE,
    });
    const order = await Order.findById(request.orderID).populate(
      "customer",
      "fullName"
    );

    const notification = await Notification.create({
      for: order.provider,
      content: `Your delivery time extends request was cancelled by ${order.customer.fullName}`,
    });

    //@ts-ignore
    const io = global.io;
    io.emit(`socket:${order.provider}`, notification);
  }

  const delivaryRequest = await DeliveryRequest.findByIdAndUpdate(
    requestID,
    {
      requestStatus: acction,
    },
    {
      new: true,
    }
  );

  const order = await Order.findByIdAndUpdate(delivaryRequest.orderID, {
    deliveryDate: delivaryRequest.nextExtendeDate,
  }).populate("customer", "fullName");
  if (!delivaryRequest) {
    throw new ApiError(
      StatusCodes.FAILED_DEPENDENCY,
      "Something was problem on delivery request oparation!"
    );
  }
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, "We don't found the order!");
  }

  const notification = await Notification.create({
    for: order.provider,
    content: `You delivery time extends request approved by ${order.customer.fullName}`,
  });

  //@ts-ignore
  const io = global.io;
  io.emit(`socket:${order.provider}`, notification);

  return true;
};

const providerAccountVerification = async (
  user: JwtPayload,
  images: string[],
  doc?: string
) => {
  const { userID } = user;

  const isUser = await User.findById(userID);
  if (!isUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not exist!");
  }

  if (isUser.isVerified.status == ACCOUNT_VERIFICATION_STATUS.WAITING) {
    throw new ApiError(
      StatusCodes.NOT_ACCEPTABLE,
      "You have already sended a verification request please wait for the response!"
    );
  }

  if (isUser.isVerified.status == ACCOUNT_VERIFICATION_STATUS.REJECTED) {
    isUser.isVerified.images = [];
    isUser.isVerified.doc = "";
  }

  if (isUser.isVerified.status == ACCOUNT_VERIFICATION_STATUS.UNVERIFIED) {
    isUser.isVerified.images = [];
    isUser.isVerified.doc = "";
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

  if (!images || images.length < 1) {
    throw new ApiError(
      StatusCodes.BAD_GATEWAY,
      "You should provide all documents!"
    );
  }

  if (!isUser.isVerified) {
    isUser.isVerified.images = [];
    isUser.isVerified.doc = "";
  }

  isUser.isVerified.doc = doc;
  isUser.isVerified.images.push(...images);

  if (isUser.isVerified.trdLicense && isUser.isVerified.images.length > 0) {
    isUser.isVerified.status = ACCOUNT_VERIFICATION_STATUS.WAITING;
  }

  await Verification.create({
    user: isUser._id,
    doc: doc,
    image: images,
  });

  const admins = await User.find({
    role: {
      $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    },
  });

  //@ts-ignore
  const io = global.io;
  admins.forEach(async (e: any) => {
    const notification = await Notification.create({
      for: e._id,
      content: `${isUser.fullName}`,
    });

    io.emit(`socket:${e._id}`, notification);
  });

  await isUser.save();

  return true;
};

const verificationData = async (payload: JwtPayload) => {
  const { userID } = payload;
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not founded!");
  }

  return user.isVerified;
};

export const ProviderService = {
  deliveryRequest,
  singleOrder,
  AllOrders,
  dOrder,
  verificationData,
  getDeliveryReqests,
  reqestAction,
  DelivaryRequestForTimeExtends,
  providerAccountVerification,
  AllCompletedOrders,
  ADeliveryReqest,
  deliveryTimeExtendsRequest,
  getDeliveryTimeExtendsRequest,
  getADeliveryTimeExtendsRequest,
  ACompletedOrder,
};
