import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { UserServices } from "../service/user.service";
import {
  getMultipleFilesPath,
  getSingleFilePath,
} from "../../shared/getFilePath";

const signupUser = catchAsync(async (req: Request, res: Response) => {
  const { ...data } = req.body;
  const result = await UserServices.signUp(data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User registered successfull",
    data: result,
  });
});

const profile = catchAsync(async (req, res) => {
  const user = (req as any)?.user;
  const result = await UserServices.profle(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User profile data get successfully",
    data: result,
  });
});

const update = catchAsync(async (req, res) => {
  const user = (req as any)?.user;
  const images = getMultipleFilesPath(req.files, "image");
  const { ...Data } = req.body;

  const lat = parseFloat(req.body.lat);
  const lng = parseFloat(req.body.lng);

  if (!isNaN(lat) || !isNaN(lng))
    Data.latLng = {
      type: "Point",
      coordinates: [lng, lat],
    };

  Data.samplePictures = images;

  const result = await UserServices.UP(user, Data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile update successfully",
    data: result,
  });
});

const uploadImages = catchAsync(async (req, res) => {
  const user = (req as any)?.user;
  const { ...Data } = req.body;

  const image = getMultipleFilesPath((req as any).files, "image");
  const result = await UserServices.Images(user, Data, image!);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully got the images",
    data: result,
  });
});

const profileDelete = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any).user;
  const result = await UserServices.profileDelete(payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Account deleted successfully",
    data: result,
  });
});

const language = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { language } = req.body;
  const result = await UserServices.language({ payload, language });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile update successfully",
    data: result,
  });
});

const status = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const result = await UserServices.accountStatus(payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Status changed successfully",
    data: result,
  });
});

const privacy = catchAsync(async (req: Request, res: Response) => {
  // const payload = (req as any)?.user;
  const result = await UserServices.privacy();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Seccessfully got the privacy & Policy",
    data: result,
  });
});

const condition = catchAsync(async (req: Request, res: Response) => {
  // const payload = (req as any)?.user;
  const result = await UserServices.conditions();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully got the terms & conditions",
    data: result,
  });
});

const allPost = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...pagication } = req.body;
  const result = await UserServices.allPost(payload, pagication);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully got the terms & conditions",
    data: result,
  });
});

const createPost = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const images = getMultipleFilesPath((req as any).files, "image");
  const coverImage = getSingleFilePath(
    (req as any).files,
    "coverImage"
  ) as string;
  const result = await UserServices.createPost(
    payload,
    data,
    images as string[],
    coverImage
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully posted your job Post",
    data: result,
  });
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const showcaseImages = getMultipleFilesPath((req as any).files, "image");
  const coverImage = getSingleFilePath((req as any).files, "coverImage");
  const result = await UserServices.UPost(payload, {
    ...data,
    showcaseImages,
    coverImage,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully updated your job Post",
    data: result,
  });
});

const post = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const postID = req.query.id as string;

  const { limit, page } = req.body;
  let result;
  if (postID) {
    result = await UserServices.singlePost(payload, { postID: postID });
  } else if (!postID) {
    result = await UserServices.post(payload, page, limit);
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully got Post data",
    data: result,
  });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...Data } = req.body;
  const result = await UserServices.deleteJob(payload, Data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully delete the Post",
    data: result,
  });
});

const favorite = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...Data } = await req.body;
  const result = await UserServices.favorite(payload, Data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully added to the favorite list",
    data: result,
  });
});

const getFavorite = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { page, limit } = req.body;
  const result = await UserServices.getFavorite(payload, page, limit);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All favorite item list",
    data: result,
  });
});

const removeFavorite = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...Data } = await req.body;
  const result = await UserServices.removeFavorite(payload, Data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Removed from favorite",
    data: result,
  });
});

const offers = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { page, limit, sort } = req.body;
  const params = req.query.postID as string;

  let result;

  if (params) {
    result = await UserServices.totalOffersOnPost(payload, params);
  } else {
    result = await UserServices.offers(payload, page, limit, sort);
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "successfully get all offers",
    data: result,
  });
});

const iOfferd = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { page, limit, sort } = req.body;
  const result = await UserServices.iOfferd(payload, page, limit, sort);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "successfully get all offers",
    data: result,
  });
});

const aOffer = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const id = req.query.id as string;
  const result = await UserServices.getAOffer(payload, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "successfully get a offer",
    data: result,
  });
});

const cOffer = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...Data } = await req.body;
  const images = getMultipleFilesPath((req as any).files, "image");
  const result = await UserServices.cOffer(payload, Data, images as string[]);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully created the offer",
    data: result,
  });
});

const IOffer = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...Data } = await req.body;
  const result = await UserServices.intracatOffer(payload, Data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    //@ts-ignore
    message: result?.isDecline
      ? (result as any)?.message
      : "Successfully offer intraction",
    data: result,
  });
});

const DOffer = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const offerID = req.query.offerID;
  const result = await UserServices.deleteOffer(payload, offerID as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully delete the offer",
    data: result,
  });
});

const supportRequest = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const image = getSingleFilePath(req.files, "image");
  data.image = image;
  const result = await UserServices.supportRequest(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully send the support request!",
    data: result,
  });
});

const searchPosts = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const result = await UserServices.searchPosts(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully get data",
    data: result,
  });
});

const recommendedPosts = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { limit, page, query } = req.body;
  const result = await UserServices.getRecommendedPosts({
    payload,
    limit,
    page,
    query,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully get recommended",
    data: result,
  });
});

const filterPosts = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;

  const data = {
    payload,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    query: req.query.searchQuery as string,
    category: req.query.category as string,
    subCategory: req.query.subCategory as string,
    lat: Number(req.query.lat),
    lng: Number(req.query.lng),
    distance: Number(req.query.distance),
  };
  const result = await UserServices.getPostsOrProviders(data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully get filterd data",
    data: result,
  });
});

const notifications = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const result = await UserServices.allNotifications(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully get all notifications",
    data: result,
  });
});

const updateNotifications = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const result = await UserServices.updateNotifications(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully update all notifications",
    data: result,
  });
});

const giveReting = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const result = await UserServices.addRating(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully add the rating!",
    data: result,
  });
});

const getRequests = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const { ...data } = req.body;
  const result = await UserServices.getRequests(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully get all the requests!",
    data: result,
  });
});

const aProvider = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = (req as any)?.user;
  const result = await UserServices.aProvider(user, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully get all the requests!",
    data: result,
  });
});

const deleteNotifications = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;
  const ids = req.body.notifications;
  const result = await UserServices.deleteNotification(ids);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully deleted notificaitons!",
    data: result,
  });
});

const offerOnPost = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;

  const photos = getMultipleFilesPath((req as any).files, "image") as string[];
  const { ...data } = req.body;
  data.companyImages = photos;
  const result = await UserServices.offerOnPost(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully Offer Sended!",
    data: result,
  });
});

const counterOffer = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;

  const { ...data } = req.body;

  const result = await UserServices.doCounter(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Counter offer created!",
    data: result,
  });
});

const getCounterOffer = catchAsync(async (req: Request, res: Response) => {
  const payload = (req as any)?.user;

  const photos = getMultipleFilesPath((req as any).files, "image");
  const { ...data } = req.body;
  data.companyImages = photos;

  const result = await UserServices.offerOnPost(payload, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully deleted notificaitons!",
    data: result,
  });
});

const toggleFlaggedOrBlocked = catchAsync(
  async (req: Request, res: Response) => {
    const payload = (req as any)?.user;
    const { ...data } = req.body;
    const result = await UserServices.toggleFlaggedOrBlocked(
      payload,
      data
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Successfully modified the post!`,
      data: result,
    });
  }
);


export const UserController = {
  searchPosts,
  counterOffer,
  getCounterOffer,
  offerOnPost,
  aProvider,
  getRequests,
  deleteNotifications,
  notifications,
  giveReting,
  updateNotifications,
  iOfferd,
  filterPosts,
  signupUser,
  profile,
  update,
  language,
  uploadImages,
  createPost,
  profileDelete,
  status,
  privacy,
  recommendedPosts,
  condition,
  allPost,
  post,
  favorite,
  getFavorite,
  removeFavorite,
  deletePost,
  updateJob,
  offers,
  cOffer,
  IOffer,
  DOffer,
  supportRequest,
  aOffer,
  toggleFlaggedOrBlocked,
};
