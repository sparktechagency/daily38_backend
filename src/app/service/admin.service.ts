import { JwtPayload } from "jsonwebtoken"
import User from "../../model/user.model";
import ApiError from "../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { subDays, startOfDay, addDays } from "date-fns";
import Offer from "../../model/offer.model";
import Post from "../../model/post.model";
import Payment from "../../model/payment.model";
import { ACCOUNT_STATUS, ACCOUNT_VERIFICATION_STATUS, USER_ROLES } from "../../enums/user.enums";
import Catagroy from "../../model/catagory.model";
import Announcement from "../../model/announcement.model";
import { bcryptjs } from "../../helpers/bcryptHelper";
import Support from "../../model/support.model";
import SubCatagroy from "../../model/subCategory.model";
import unlinkFile from "../../shared/unlinkFile";
import Verification from "../../model/verifyRequest.model";
import Notification from "../../model/notification.model";
import { PAYMENT_STATUS } from "../../enums/payment.enum";
import Order from "../../model/order.model";
import { PaginationParams } from "../../types/user";
import mongoose from "mongoose";
import { IUser } from "../../Interfaces/User.interface";

const overview = async (payload: JwtPayload, revenueYear = "2025", userJoinedYear = "2025") => {
  const { userID } = payload;
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found!");
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const numericRevenueYear = parseInt(revenueYear);
  const numericUserJoinedYear = parseInt(userJoinedYear);

  // Total number of users, job requests, and job posts
  const totalUser = await User.countDocuments({
    role: { $nin: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] }
  });
  const totalJobRequest = await Offer.countDocuments();
  const totalJobPost = await Post.countDocuments();

  // Commission sum
  const totalCommission = await Payment.aggregate([
    { $match: { status: PAYMENT_STATUS.SUCCESS } },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: "$commission" },
      },
    },
  ]);
  const commissionSum = totalCommission[0]?.totalCommission || 0;

  // Yearly commission revenue aggregation for `revenueYear`
  const revenuePipeline = [
    {
      $match: {
        createdAt: {
          $gte: new Date(`${numericRevenueYear}-01-01T00:00:00Z`),
          $lt: new Date(`${numericRevenueYear + 1}-01-01T00:00:00Z`),
        },
        status: PAYMENT_STATUS.SUCCESS,
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalCommission: { $sum: "$commission" },
      },
    },
  ];

  const revenueResult = await Payment.aggregate(revenuePipeline);

  const commissionMap = new Map<number, number>();
  revenueResult.forEach((entry) => {
    commissionMap.set(entry._id, entry.totalCommission);
  });

  const yearlyRevenueData = months.map((monthName, index) => ({
    month: monthName,
    commission: commissionMap.get(index + 1) || 0,
  }));

  // Yearly user join breakdown for `userJoinedYear`
  const userJoinPipeline = [
    {
      $match: {
        createdAt: {
          $gte: new Date(`${numericUserJoinedYear}-01-01T00:00:00Z`),
          $lt: new Date(`${numericUserJoinedYear + 1}-01-01T00:00:00Z`),
        },
        role: { $in: [USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER] },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, role: "$role" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        monthNumber: "$_id.month",
        role: "$_id.role",
        count: 1,
      },
    },
  ];

  const userMonthlyData = await User.aggregate(userJoinPipeline);

  const userJoined = months.map((monthName, index) => {
    const userCount =
      userMonthlyData.find(
        (d) => d.monthNumber === index + 1 && d.role === USER_ROLES.USER
      )?.count || 0;

    const serviceProviderCount =
      userMonthlyData.find(
        (d) =>
          d.monthNumber === index + 1 &&
          d.role === USER_ROLES.SERVICE_PROVIDER
      )?.count || 0;

    return {
      month: monthName,
      user: userCount,
      serviceProvider: serviceProviderCount,
    };
  });

  return {
    totalJobPost,
    totalJobRequest,
    totalUser,
    totalRevenue: commissionSum,
    yearlyRevenueData,
    userJoined,
  };
};

const engagementData = async (
  year : string
) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const numericYear = parseInt(year);

    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(`${numericYear}-01-01T00:00:00Z`),
            $lt: new Date(`${numericYear + 1}-01-01T00:00:00Z`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ];

    const [userCounts, orderCounts] = await Promise.all([
      User.aggregate(pipeline),
      Order.aggregate(pipeline)
    ]);

    const userMap = new Map(userCounts.map(item => [item._id, item.count]));
    const orderMap = new Map(orderCounts.map(item => [item._id, item.count]));

    const result = months.map((monthName, index) => {
      const monthIndex = index + 1;
      return {
        month: monthName,
        userCount: userMap.get(monthIndex) || 0,
        orderCount: orderMap.get(monthIndex) || 0
      };
    });

    return result
}

const allCustomers = async (
  payload: JwtPayload,
  params: {
    page: number,
    limit: number
  } 
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isAdmin = await User.findById(userID);
  if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
  }

  const total = await User.countDocuments({ role: "USER" });

  const allUsers = await User.aggregate([
    { $match: { role: "USER" } },
    {
      $project: {
        _id: 1,
        fullName: 1,
        email: 1,
        accountStatus: 1,
        deviceID: 1,
        createdAt: 1,
        updatedAt: 1
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  return {
    data: allUsers,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
};

const aCustomer = async (
    payload: JwtPayload,
    customerID: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    if (!customerID) {
        throw new ApiError(StatusCodes.BAD_GATEWAY,"You must give the customer id to get the customer")
    };

    return await User.findById( new mongoose.Types.ObjectId( customerID )).select("fullName email phone address accountStatus accountActivityStatus address category subCategory description profileImage city").lean();
}

const updateUserAccountStatus = async (
    payload: JwtPayload,
    customerID: string,
    acction: ACCOUNT_STATUS.ACTIVE | ACCOUNT_STATUS.BLOCK | ACCOUNT_STATUS.DELETE | ACCOUNT_STATUS.REPORT
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    const customer = await User.findById(customerID);
    if (!customer) {
        throw new ApiError(StatusCodes.BAD_REQUEST,"Customer not exist")
    };

    customer.accountStatus = acction;
    await customer.save();

    return true;

}

const allProvider = async (
  payload: JwtPayload,
  params: {
    page: number,
    limit: number
  }
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isAdmin = await User.findById(userID);
  if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
  }

  const total = await User.countDocuments({ role: "SERVICE_PROVIDER" });

  const allServiceProviders = await User.aggregate([
    { $match: { role: "SERVICE_PROVIDER" } },
    {
      $project: {
        _id: 1,
        fullName: 1,
        email: 1,
        accountStatus: 1,
        deviceID: 1,
        createdAt: 1,
        updatedAt: 1,
        category: 1
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);

  return {
    data: allServiceProviders,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
};

const allPayments = async (
  payload: JwtPayload,
  params: {
    page: number,
    limit: number,
    status: PAYMENT_STATUS
  }
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isAdmin = await User.findById(userID);
  if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
  }

  const total = await Payment.countDocuments({ status: params.status ? params.status : {$in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED]} });

  const allPayments = await Payment.find({ status: params.status ? params.status : {$in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED]} })
    .populate("userId","fullName email phone profileImage")
    .populate({
      path: "orderId", 
      select: "offerID customer",
      populate: [{
        path: "offerID",
        select: "projectID",
        populate:{
          path: "projectID",
          select: "projectName"
        }
      },{
        path: "customer",
        select: "fullName email"
      }]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const organizedData = allPayments.map(payment => ({
    jobName: payment.orderId?.offerID?.projectID?.projectName || "",
    budget: payment.amount || "",
    customerName: payment.userId?.fullName || "",
    profit: payment.commission || "",
    paymentStatus: payment.status || "",
    _id: payment._id,
  }))

  return {
    data: organizedData,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
};

const APayments = async (
    payload: JwtPayload,
    paymentID: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    
    const payment = await Payment
      .findById(paymentID)
      .populate("userId","fullName email")
      .populate({
        path:"orderId"
        ,select:"offerID customer"
        ,populate:[{
          path:"offerID"
          ,select:"projectID"
          ,populate:{
            path:"projectID"
            ,select:"projectName location category coverImage"
          }
        }
      ]
      })
      .lean()
      .exec();

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND,"Payment not founded")
    };

    //@ts-ignore
    const totalOffers = await Offer.countDocuments({customer: payment.orderId?.customer});

    return {//@ts-ignore
      customerName: payment?.userId?.fullName || "",
      //@ts-ignore
      companyName: payment.orderId.offerID.projectID.projectName || "Boolbi",
      //@ts-ignore
      location: payment.orderId.offerID.projectID.location || "",
      //@ts-ignore
      category: payment.orderId.offerID.projectID.category || "",
      //@ts-ignore
      coverImage: payment.orderId.offerID.projectID.coverImage || "",
      totalOffers
    };
}

const allCatagorys = async (
    pagination: {
      page: number,
      limit: number,
      query?: string
    }
) => {


    const { limit= 200, page=1, query } = pagination;

    const skip = (page - 1) * limit;

    const pipeline: any[] = [];

    if (query && query.trim() !== "") {
      pipeline.push({
        $match: {
          name: { $regex: query, $options: "i" }
        }
      });
    }

    pipeline.push({
      $lookup: {
        from: "subcatagories",
        localField: "subCatagroys",
        foreignField: "_id",
        as: "subCategories"
      }
    });

    pipeline.push({
      $project: {
        subCatagroys: 0
      }
    });

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const categories = await Catagroy.aggregate(pipeline);

    return categories;
}

const addNewCatagory = async (
  payload: JwtPayload,
  image: string,
  catagoryName: string
) => {
    try {
      const { userID } = payload;
      const isAdmin = await User.findById(userID);
      if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
      };
      if (!image || !catagoryName) {
          throw new ApiError(StatusCodes.BAD_REQUEST,"You should give all the required details to create a new catagory!")
      };
      const catagoryModel = await Catagroy.findOne({name: catagoryName});
      if (catagoryModel) {
          throw new ApiError(StatusCodes.BAD_REQUEST,`${catagoryName} is already exist your can't add this`)
      };
  
      const newCatagory = Catagroy.create({
        name: catagoryName,
        image
      })
  
      return newCatagory;
    } catch (error) {
      unlinkFile(image);
    }
}

const addSubCatagorys = async (
  payload: JwtPayload,
  subCatagoryName: string,
  catagoryID: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    if (!catagoryID || !subCatagoryName) {
        throw new ApiError(StatusCodes.BAD_REQUEST,"You should give all the required details to create a new catagory!")
    };
    const catagoryModel = await Catagroy.findOne({_id: catagoryID});
    if (!catagoryModel) {
        throw new ApiError(StatusCodes.NOT_FOUND,`Catagory not founded!`)
    };

    const newCatagory = await SubCatagroy.create({
      categoryId: catagoryID,
      name: subCatagoryName
    });

    catagoryModel.subCatagroys.push((newCatagory as any)._id);
    await catagoryModel.save()

    return newCatagory;
}

const deleteSubCatagory = async (
    payload: JwtPayload,
    catagoryId: string,
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    if ( !catagoryId ) {
      throw new ApiError(StatusCodes.BAD_REQUEST,"You should give the catagory id for delete!")
    };
    const subCatagoryModel = await SubCatagroy.findOneAndDelete({_id: catagoryId});
    if (!subCatagoryModel) {
      throw new ApiError(StatusCodes.NOT_FOUND,"Your giver catagory not exist!")
    };

    return subCatagoryModel;
}

const deleteCatagory = async (
    payload: JwtPayload,
    catagoryId: string,
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    if ( !catagoryId ) {
      throw new ApiError(StatusCodes.BAD_REQUEST,"You should give the catagory id for delete!")
    };
    const catagoryModel = await Catagroy.findOneAndDelete({_id: catagoryId});
    if (!catagoryModel) {
      throw new ApiError(StatusCodes.NOT_FOUND,"Your giver catagory not exist!")
    };
    unlinkFile((catagoryModel as any).image)

    return catagoryModel;
}

const updateCatagory = async (
  payload: JwtPayload,
  data: {
    name?: string;
    id: string;
  },
  image?: string
) => {
  try {
    const { userID } = payload;
  
    const isAdmin = await User.findById(userID);
    if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
    }
  
    const catagoryModel = await Catagroy.findById(data.id);
    if (!catagoryModel) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Category does not exist!");
    }
  
    if (data.name && data.name !== catagoryModel.name) {
      catagoryModel.name = data.name;
    }
  
    if (image && image !== catagoryModel.image) {
      unlinkFile(catagoryModel.image)
      catagoryModel.image = image;
    }
  
    await catagoryModel.save();
  
    return catagoryModel;
  } catch (error) {
    if (image) unlinkFile(image)
  }
};

const updateSubCatagory = async (
  payload: JwtPayload,
  data: {
    name?: string;
    id: string;
  }
) => {
  const { userID } = payload;

  const isAdmin = await User.findById(userID);
  if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
  }

  const catagoryModel = await SubCatagroy.findById(data.id);
  if (!catagoryModel) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category does not exist!");
  }

  if (data.name && data.name !== catagoryModel.name) {
    catagoryModel.name = data.name;
  }
  await catagoryModel.save();

  return catagoryModel;
};

const announcements = async (
  payload: JwtPayload,
  page = 1,
  limit = 10
) => {
  const { userID } = payload;
  const isAdmin = await User.findById(userID);

  if (!isAdmin) {
    throw new ApiError(StatusCodes.EXPECTATION_FAILED, "User not found");
  }

  if (
    isAdmin.accountStatus === ACCOUNT_STATUS.DELETE ||
    isAdmin.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isAdmin.accountStatus.toLowerCase()}!`
    );
  }

  const skip = (page - 1) * limit;

  const [announcements, total] = await Promise.all([
    Announcement.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Announcement.countDocuments()
  ]);

  return {
    data: announcements,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

const singleAnnouncement = async (
    payload: JwtPayload,
    announcementID: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin) {
        throw new ApiError(StatusCodes.EXPECTATION_FAILED,"User not founded")
    }
    if (
      isAdmin.accountStatus === ACCOUNT_STATUS.DELETE ||
      isAdmin.accountStatus === ACCOUNT_STATUS.BLOCK
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Your account was ${isAdmin.accountStatus.toLowerCase()}!`
      );
    }

    const announcement = await Announcement.findById(announcementID);
    if (!announcement) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Announcement does not exist!");
    };

    return announcement
}

const createAnnouncement = async (
    payload: JwtPayload,
    data: {
      title: string,
      descriptions: string
    }
) => {
    const { userID } = payload
    const isAdmin = await User.findById(userID);
    if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
    };

    const announcement = await Announcement.findOne({title: data.title});
    if (announcement) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Already announcement exist!");
    };

    const message = {notificationType:"Announcement", title: data.title, descriptions: data.descriptions}
    
    //@ts-ignore
    const io = global.io
    io.emit("socket:announcement",message)

    const newAnounce = await Announcement.create({title: data.title, descriptions: data.descriptions,})

    return newAnounce
}

const deleteAnnouncement = async (
    payload: JwtPayload,
    announceID: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    const catagoryModel = await Announcement.findOneAndDelete({_id: announceID});
    if (!catagoryModel) {
        throw new ApiError(StatusCodes.NOT_FOUND,"Your giver announcement is not exist!")
    };

    return catagoryModel;
}

const updateAnnounsments = async (
  payload: JwtPayload,
  data: {
    title?: string;
    id: string;
    descriptions?: string;
  }
) => {
  const { userID } = payload;

  const isAdmin = await User.findById(userID);
  if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
  }

  const catagoryModel = await Announcement.findById(data.id);
  if (!catagoryModel) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Announcement does not exist!");
  }

  if (data.title && data.title !== catagoryModel.title) {
    catagoryModel.title = data.title;
  }

  if (data.descriptions && data.descriptions !== catagoryModel.descriptions) {
    catagoryModel.descriptions = data.descriptions;
  }

  await catagoryModel.save();

  return catagoryModel;
};

const statusAnnounsments = async (
  payload: JwtPayload,
  id: string,
  acction: "ACTIVE" | "DEACTIVE"
) => {
  const { userID } = payload;

  const isAdmin = await User.findById(userID);
  if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
  }

  const ANNOUNSMENT = await Announcement.findByIdAndUpdate(id,{status: acction});
  if (!ANNOUNSMENT) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Announcement does not exist!");
  }

  return ANNOUNSMENT;
};

const privacyPolicy = async () => {

  const privacyPolicy = await User.findOne({role: USER_ROLES.SUPER_ADMIN});
  if (!privacyPolicy) {
    throw new ApiError(StatusCodes.NOT_FOUND, "PrivacyPolicy does not exist!");
  }

  return privacyPolicy.privacyPolicy;
};

const editePrivacyPolicy = async (
  payload: JwtPayload,
  data: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin) {
        throw new ApiError(StatusCodes.EXPECTATION_FAILED,"User not founded")
    }
    if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
    }
    if (
      isAdmin.accountStatus === ACCOUNT_STATUS.DELETE ||
      isAdmin.accountStatus === ACCOUNT_STATUS.BLOCK
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Your account was ${isAdmin.accountStatus.toLowerCase()}!`
      );
    }

    const privacyPolicy = await User.findOne({role: USER_ROLES.SUPER_ADMIN});
    if (!privacyPolicy) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Privacy Policy does not exist!");
    }

    privacyPolicy.privacyPolicy = data;
    await privacyPolicy.save();

    return data;
};

const conditions = async () => {
  
    const termsConditions = await User.findOne({role: USER_ROLES.SUPER_ADMIN});
    if (!termsConditions) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Terms & Conditions dose not exist!");
    }

    return termsConditions.termsConditions;
};

const editeConditions = async (
  payload: JwtPayload,
  data: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin) {
        throw new ApiError(StatusCodes.EXPECTATION_FAILED,"User not founded")
    }
    if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
    }
    if (
      isAdmin.accountStatus === ACCOUNT_STATUS.DELETE ||
      isAdmin.accountStatus === ACCOUNT_STATUS.BLOCK
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Your account was ${isAdmin.accountStatus.toLowerCase()}!`
      );
    }

    const termsConditions = await User.findOne({role: USER_ROLES.SUPER_ADMIN});
    if (!termsConditions) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Terms & Conditions does not exist!");
    }

    termsConditions.termsConditions = data;
    await termsConditions.save();

    return data;
};

const adminCommission = async () => {
  
    const superAdminUser = await User.findOne({role: USER_ROLES.SUPER_ADMIN});
    if (!superAdminUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Terms & Conditions dose not exist!");
    }

    return superAdminUser.adminCommissionPercentage;
};

const editeAdminCommission = async (
  payload: JwtPayload,
  data: number
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin) {
        throw new ApiError(StatusCodes.EXPECTATION_FAILED,"User not founded")
    }
    if (!isAdmin || (isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Access denied. Admin only.");
    }
    if (
      isAdmin.accountStatus === ACCOUNT_STATUS.DELETE ||
      isAdmin.accountStatus === ACCOUNT_STATUS.BLOCK
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Your account was ${isAdmin.accountStatus.toLowerCase()}!`
      );
    }

    const superAdminUser = await User.findOne({role: USER_ROLES.SUPER_ADMIN});
    if (!superAdminUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Terms & Conditions does not exist!");
    }

    superAdminUser.adminCommissionPercentage = Math.ceil(Number(data));
    await superAdminUser.save();

    return data;
};

const allAdmins = async (
  payload: JwtPayload,
  params: PaginationParams
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isAdmin = await User.findById(userID);
  if (!isAdmin) {
    throw new ApiError(StatusCodes.EXPECTATION_FAILED, "User not found");
  }

  if (
    isAdmin.accountStatus === ACCOUNT_STATUS.DELETE ||
    isAdmin.accountStatus === ACCOUNT_STATUS.BLOCK
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account was ${isAdmin.accountStatus.toLowerCase()}!`
    );
  }

  const total = await User.countDocuments({
    role: { $in: [USER_ROLES.ADMIN] }
  });

  const admins = await User.find({
    role: { $in: [USER_ROLES.ADMIN] }
  })
    .select("-password -isSocialAccount -isVerified -otpVerification -termsConditions -privacyPolicy -__v -accountBalance -samplePictures -orders -myOffer -iOffered -favouriteServices -job")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    data: admins,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
};

const addNewAdmin = async (
  payload: JwtPayload,
  {
    fullName,
    email,
    password
  }:{
    fullName: string,
    email: string,
    password: string
  }
) => {
    const { userID, role } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin) {
        throw new ApiError(StatusCodes.EXPECTATION_FAILED,"User not founded")
    }
    if ( role === USER_ROLES.ADMIN || isAdmin.role === USER_ROLES.ADMIN) {
      throw new ApiError(StatusCodes.METHOD_NOT_ALLOWED,"You are not authorize to do that acction")
    }
    if (
      isAdmin.accountStatus === ACCOUNT_STATUS.DELETE ||
      isAdmin.accountStatus === ACCOUNT_STATUS.BLOCK
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Your account was ${isAdmin.accountStatus.toLowerCase()}!`
      );
    }
    const isAdminExist = await User.findOne({email: email});
    if (isAdminExist) {
      throw new ApiError(StatusCodes.UNAUTHORIZED,"Already a user exist using this email: "+email)
    };

    const hasedPassword = await bcryptjs.Hash(password);
    const admin = await User.create({
      fullName,
      email,
      password:hasedPassword,
      role: USER_ROLES.ADMIN,
      userVerification: true
    }) as IUser;

    return {
      role: admin.role,
      name: admin.fullName,
      email: admin.email,
      language: admin.language,
      userVerification: true,
    }
};

const deleteAdmin = async (
    payload: JwtPayload,
    adminID: string
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (!isAdmin || ( isAdmin.role !== USER_ROLES.ADMIN && isAdmin.role !== USER_ROLES.SUPER_ADMIN)) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
    };
    
    const admin = await User.findOneAndDelete({_id: adminID})
    if (!admin) {
      throw new ApiError(StatusCodes.NOT_FOUND,"Admin not founded");
    }
    return admin;
}

const allSupportRequests = async (
  payload: JwtPayload,
  params: {
    page: number,
    limit: number,
    status: "solved" | "pending" | undefined
  }
) => {
  const { userID } = payload;
  const { page = 1, limit = 10, status } = params;
  const skip = (page - 1) * limit;

  const isAdmin = await User.findById(userID);
  if (
    !isAdmin || 
    (
      isAdmin.role !== USER_ROLES.ADMIN && 
      isAdmin.role !== USER_ROLES.SUPER_ADMIN
    )
  ) {
    throw new ApiError(
      StatusCodes.NOT_FOUND, 
      "Admin not found"
    );
  }

  const total = await Support.countDocuments({
    isAdmin: { $ne: true },
    status: status == 'solved'? "SOLVED" : status == 'pending'? "PENDING" : { $ne: null }
  });

  const supports = await Support.find({
    isAdmin: { $ne: true },
    status: status == 'solved'? "SOLVED" : status == 'pending'? "PENDING" : { $ne: null }
  })
    .populate({ path: 'for', select: 'fullName email' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    data: supports,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
};

const giveSupport = async (
    payload: JwtPayload,
    {
      supportId,
      message,
      image
    }:{
      supportId: string,
      message: string
      image: string
    }
) => {
    const { userID } = payload;
    const isAdmin = await User.findById(userID);
    if (
      !isAdmin || 
      ( 
        isAdmin.role !== USER_ROLES.ADMIN && 
        isAdmin.role !== USER_ROLES.SUPER_ADMIN
      )
    ) {
      throw new ApiError(
        StatusCodes.NOT_FOUND, 
        "Admin not found"
      );
    };

    const supportUpdated = await Support.findByIdAndUpdate(
      supportId,
      {
        adminReply: message, 
        status: "SOLVED"
      },
      { new: true }
    );

    const support = await Support.create({
      category: supportUpdated?.category,
      for: supportUpdated?.for,
      message,
      isAdmin: true,
      isImage: image? true : false,
      image: image? image : "",
      status: "SOLVED"
    });

    //@ts-ignore
    const io = global.io;
    const notification = await Notification.create({
      for: support.for,
      content: `You got a replay from the support request!`
    });
        
    io.emit(`socket:support:${ support.for }`, {
      image: support.image,
      isAdmin: support.isAdmin,
      message: support.message,
      isImage: support.isAdmin,
      category: support.category,
    });

    if (!support) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Not founded the support, something was wrong"
      )
    };
    
    return 
}

const allVericifationRequestes = async (
  payload: JwtPayload,
  params: PaginationParams
) => {
  const { userID } = payload;
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;

  const isAdmin = await User.findById(userID);
  if (
    !isAdmin ||
    (isAdmin.role !== USER_ROLES.ADMIN &&
     isAdmin.role !== USER_ROLES.SUPER_ADMIN)
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to perform this action."
    );
  }

  const total = await Verification.countDocuments();

  const verificationRequests = await Verification.find()
    .skip(skip)
    .limit(limit)
    .populate({ path: 'user', select: 'fullName profileImage email' })
    .sort({ createdAt: -1 });

  return {
    data: verificationRequests,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
};

const aVerification = async (
  payload: JwtPayload,
  id: string
) => {
  const { userID } = payload;
  const isAdmin = await User.findById( userID );
  if (
    !isAdmin ||
    isAdmin.role !== USER_ROLES.ADMIN && 
    isAdmin.role !== USER_ROLES.SUPER_ADMIN   
  ) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "You are not available to do that!"
    )
  }
  if (!id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You must give the id of the request"
    )
  }

  return await Verification.findById(id)
}

const intractVerificationRequest = async (
  payload: JwtPayload,
  requestId: string,
  acction: "APPROVE" | "DECLINE"
) => {
  // 🏃‍♀️‍➡️
  const { userID } = payload;
  const isAdmin = await User.findById( userID );
  if (
    !isAdmin ||
    isAdmin.role !== USER_ROLES.ADMIN && 
    isAdmin.role !== USER_ROLES.SUPER_ADMIN   
  ) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "You are not availe to do that!"
    )
  }

  const request = await Verification.findById(requestId).populate("user","fullName");
  if (!request) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Request not founded!"
    )
  }
  
  //@ts-ignore
  const io = global.io;

  if ( acction === "APPROVE" ) {
    await User.findByIdAndUpdate( request.user , {
      $set: {
        "isVerified.status": ACCOUNT_VERIFICATION_STATUS.VERIFIED
      }
    }) 
    request.status = "verified";

    const notification = await Notification.create({
        for: request.user._id,
        content: `${request.user.fullName} your verificaiton request was approved`
    });
        
    io.emit(`socket:${ request.user._id }`, notification);

  } else if ( acction === "DECLINE" ) {
    await User.findByIdAndUpdate( request.user , {
      $set: {
        "isVerified.status": ACCOUNT_VERIFICATION_STATUS.REJECTED,
        // "isUser.isVerified.images": [],
        // "isUser.isVerified.doc": ""
      }
    }) 
    request.status = "rejected";
    
    const notification = await Notification.create({
        for: request.user._id,
        content: `${request.user.fullName} your verificaiton request was rejected!`
    });
        
    io.emit(`socket:${ request.user._id }`, notification);
  }

  await request.save(); 

  return ;
}


// Platform performance and user activity
const getPlatformPerformance = async (payload: JwtPayload, timeRange: 'day' | 'week' | 'month' | 'year' = 'month') => {
  const { userID } = payload;
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found!");
  }

  // Calculate date ranges
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case 'day':
      startDate = subDays(now, 1);
      break;
    case 'week':
      startDate = subDays(now, 7);
      break;
    case 'month':
      startDate = subDays(now, 30);
      break;
    case 'year':
      startDate = subDays(now, 365);
      break;
    default:
      startDate = subDays(now, 30);
  }

  // Get most ordered services
  const mostOrderedServices = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: "$serviceId",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$amount" }
      }
    },
    {
      $lookup: {
        from: "services",
        localField: "_id",
        foreignField: "_id",
        as: "service"
      }
    },
    { $unwind: "$service" },
    {
      $project: {
        serviceName: "$service.title",
        orderCount: "$count",
        totalRevenue: 1,
        averageOrderValue: { $divide: ["$totalRevenue", "$count"] }
      }
    },
    { $sort: { orderCount: -1 } },
    { $limit: 10 }
  ]);

  // Get user activity metrics
  const userActivity = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        role: { $in: [USER_ROLES.USER, USER_ROLES.SERVICE_PROVIDER] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        newUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $eq: ["$isActive", true] }, 1, 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    timeRange,
    startDate,
    endDate: now,
    mostOrderedServices,
    userActivity
  };
};

// Generate insights for popular categories and high-performing providers
const generateInsights = async (payload: JwtPayload) => {
  const { userID } = payload;
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found!");
  }

  // Get popular categories
  const popularCategories = await Order.aggregate([
    {
      $lookup: {
        from: "services",
        localField: "serviceId",
        foreignField: "_id",
        as: "service"
      }
    },
    { $unwind: "$service" },
    {
      $lookup: {
        from: "categories",
        localField: "service.categoryId",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },
    {
      $group: {
        _id: "$category._id",
        categoryName: { $first: "$category.name" },
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: "$amount" }
      }
    },
    { $sort: { orderCount: -1 } },
    { $limit: 5 }
  ]);

  // Get high-performing providers
  const highPerformingProviders = await Order.aggregate([
    {
      $lookup: {
        from: "services",
        localField: "serviceId",
        foreignField: "_id",
        as: "service"
      }
    },
    { $unwind: "$service" },
    {
      $lookup: {
        from: "users",
        localField: "service.providerId",
        foreignField: "_id",
        as: "provider"
      }
    },
    { $unwind: "$provider" },
    {
      $group: {
        _id: "$provider._id",
        providerName: { $first: "$provider.fullName" },
        serviceCount: { $sum: 1 },
        totalEarnings: { $sum: "$amount" },
        averageRating: { $avg: "$rating" }
      }
    },
    { $sort: { totalEarnings: -1 } },
    { $limit: 10 }
  ]);

  return {
    popularCategories,
    highPerformingProviders,
    generatedAt: new Date()
  };
};

export const AdminService = {
  overview,
  engagementData,
  allCustomers,
  intractVerificationRequest,
  aCustomer,
  updateUserAccountStatus,
  allProvider,
  allPayments,
  APayments,
  allCatagorys,
  addNewCatagory,
  deleteCatagory,
  updateCatagory,
  announcements,
  singleAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnounsments,
  statusAnnounsments,
  privacyPolicy,
  aVerification,
  editePrivacyPolicy,
  conditions,
  editeConditions,
  adminCommission,
  editeAdminCommission,
  allAdmins,
  addNewAdmin,
  deleteAdmin,
  allSupportRequests,
  giveSupport,
  addSubCatagorys,
  deleteSubCatagory,
  updateSubCatagory,
  allVericifationRequestes,
  getPlatformPerformance,
  generateInsights
}