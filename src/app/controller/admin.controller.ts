import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AdminService } from "../service/admin.service";
import { ACCOUNT_STATUS } from "../../enums/user.enums";
import { getSingleFilePath } from "../../shared/getFilePath";
import ApiError from "../../errors/ApiError";
import SubCatagroy from "../../model/subCategory.model";
import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../../enums/payment.enum";

const overView = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const { userJoinedYear, revenueYear }: { userJoinedYear? : string, revenueYear?: string } = req.query;
        const result = await AdminService.overview(Payload, revenueYear, userJoinedYear );

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Admin overview data get successfully",
            data: result
        })
    }
)

const engagement = catchAsync(
    async( req: Request, res: Response ) => {
        const year = req.query.year as string;
        const result = await AdminService.engagementData(year);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully geted the Engagements",
            data: result
        })
    }
)

const customers = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const specificUser = req.query.id;
        const { page, limit }: { page?: any, limit?: any} = req.query;

        let result;
        if (!specificUser) {
            result = await AdminService.allCustomers(Payload,{page: Number(page || 1),limit: Number(limit || 10)});
        } else if ( specificUser ) {
            result = await AdminService.aCustomer(Payload,specificUser as string)
        }

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all the customers",
            data: result
        });
    }
);

const updateAccountStatus = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const userAcction = req.query.acction;
        const userID = req.query.user;
        const result = await AdminService.updateUserAccountStatus(Payload,userID as string,userAcction as ACCOUNT_STATUS)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully updated the user account status",
            data: result
        });
    }
);

const providers = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const specificUser = req.query.id;
        const { page, limit }: { page?: any, limit?: any} = req.query;

        let result;
        if (!specificUser) {
            result = await AdminService.allProvider(Payload,{page: Number(page || 1),limit: Number(limit || 10)});
        } else if ( specificUser ) {
            result = await AdminService.aCustomer(Payload,specificUser as string)
        }

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all the providers",
            data: result
        });
    }
);

const payments = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const specificUser = req.query.id;
        const { page, limit, status }: { page?: any, limit?: any, status?: PAYMENT_STATUS} = req.query;

        let result;
        if (!specificUser) {
            result = await AdminService.allPayments(Payload,{page: Number(page || 1),limit: Number(limit || 10), status: status as PAYMENT_STATUS});
        } else if ( specificUser ) {
            result = await AdminService.APayments(Payload,specificUser as string)
        }

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all the payments",
            data: result
        });
    }
);

const catagroys = catchAsync(
    async( req: Request, res: Response ) => {
        // const Payload = (req as any).user;
        const {...data} = req.body;
        const result = await AdminService.allCatagorys(data);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all the catagorys",
            data: result
        });
    }
);

const subCatagroy = catchAsync(
    async( req: Request, res: Response ) => {
        const id = req.params.id as string;
        if (!id) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Id not given of subCategory!"
            )
        }

        const result = await SubCatagroy.findById( new mongoose.Types.ObjectId(id));
        if (!result) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                "Sub Category not found!"
            )
        }

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get the sub-catagory",
            data: result
        });
    }
);

const allSubCatagroy = catchAsync(
    async( req: Request, res: Response ) => {
        const result = await SubCatagroy.find().populate("categoryId","image name");

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all sub-catagory",
            data: result
        });
    }
);

const newCatagroys = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const image = getSingleFilePath(req.files,"image");
        const { catagory } = req.body;
        const result = await AdminService.addNewCatagory(Payload,image as string,catagory);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all the catagorys",
            data: result
        });
    }
);

const newSubCatagroys = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const { catagoryID, subCatagoryName } = req.body;
        const result = await AdminService.addSubCatagorys(Payload,subCatagoryName,catagoryID);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all the catagorys",
            data: result
        });
    }
);

const deleteSubCatagroys = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const catagoryID = req.query.id;
        const result = await AdminService.deleteSubCatagory(Payload,catagoryID as string);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully deleted the sub catagorys",
            data: result
        });
    }
);

const deleteCatagroys = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const catagoryID = req.query.id;
        const result = await AdminService.deleteCatagory(Payload,catagoryID as string);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully deleted the catagorys",
            data: result
        });
    }
);

const updateCatagroys = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const {...data} = req.body;
        const image = getSingleFilePath(req.files,"image")
        const result = await AdminService.updateCatagory(Payload,data,image as string);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully updated the catagory",
            data: result
        });
    }
);

const updateSubCatagroys = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const {...data} = req.body;
        const result = await AdminService.updateSubCatagory(Payload,data);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully updated the sub catagory",
            data: result
        });
    }
);

const getAnnounsments = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const announcementID = req.query.id;
        const { page, limit } = req.body;
        let result;
        if (!announcementID) {
            result = await AdminService.announcements(Payload,page,limit);
        } else if ( announcementID ) {
            result = await AdminService.singleAnnouncement(Payload,announcementID as string)
        }
        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get announcements",
            data: result
        });
    }
);

const createAnnounsments = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const {...data} = req.body;
        const result = await AdminService.createAnnouncement(Payload,data);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully deleted the catagorys",
            data: result
        });
    }
);

const updateAnnounsments = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const {...data} = req.body;
        const result = await AdminService.createAnnouncement(Payload,data);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully deleted the catagorys",
            data: result
        });
    }
);

const activityControleOfAnnounsments = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const status = req.query.status;
        const id = req.query.id
        const result = await AdminService.statusAnnounsments(Payload,status as string, id as "ACTIVE" | "DEACTIVE");

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully edite the status of the announsement",
            data: result
        });
    }
);

const deleteAnnounsments = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const id = req.query.id
        const result = await AdminService.deleteAnnouncement(Payload,id as string);

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully deleted the announsment",
            data: result
        });
    }
);

const getPrivacyPolicy = catchAsync(
    async( req: Request, res: Response ) => {
        
        const result = await AdminService.privacyPolicy()

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get Policy's",
            data: result
        });
    }
);

const editeyPolicy = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const data = req.body.policy;
        const result = await AdminService.editePrivacyPolicy(Payload,data as string)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully update Policy's",
            data: result
        });
    }
);

const termsAndConditions = catchAsync(
    async( req: Request, res: Response ) => {
        
        const result = await AdminService.conditions()

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get condition's",
            data: result
        });
    }
);

const editeConditions = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const data = req.body.data;
        const result = await AdminService.editeConditions(Payload,data)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully Update terms & Conditions",
            data: result
        });
    }
);

const adminCommission = catchAsync(
    async( req: Request, res: Response ) => {
        
        const result = await AdminService.adminCommission()

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get admin commission",
            data: result
        });
    }
);

const editeAdminCommission = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const data = req.body.adminCommissionPercentage;
        const result = await AdminService.editeAdminCommission(Payload,data)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully Update admin commission",
            data: result
        });
    }
);

const allAdmins = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const {...data} = req.body;
        const result = await AdminService.allAdmins(Payload,data)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all admins",
            data: result
        });
    }
);

const newAdmins = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const {...data} = req.body;
        const result = await AdminService.addNewAdmin(Payload,data)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully create new admin",
            data: result
        });
    }
);

const deleteAdmin = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const adminId = req.query.adminID;
        const result = await AdminService.deleteAdmin(Payload,adminId as string)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully deleted the admin",
            data: result
        });
    }
);

const supportReques = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const { page, limit, status }: { status?: "solved" | "pending", page?: any, limit?: any} = req.query;

        const result = await AdminService.allSupportRequests(Payload,{page: Number(page || 1),limit: Number(limit || 10), status})

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get all the supprt requests",
            data: result
        });
    }
);

const giveSupport = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const {...data} = req.body;
        const image = getSingleFilePath(req.files, "image")
        data.image = image;
        const result = await AdminService.giveSupport(Payload,data)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully send the support message",
            data: result
        });
    }
);

const allVerifications = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const id = req.query.id as string;
        const {...data}= req.body;
        let result ;

        if ( !id ) {
            result = await AdminService.allVericifationRequestes(Payload,data)
        } else if ( result ) {
            result = await AdminService.aVerification(Payload,id)   
        }

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully get verification requests!",
            data: result
        });
    }
);

const intrackWithRequest = catchAsync(
    async( req: Request, res: Response ) => {
        const Payload = (req as any).user;
        const { acction, requestId } = req.body;
        const result = await AdminService.intractVerificationRequest(Payload,requestId, acction)

        sendResponse(res, {
            success: true,
            statusCode: StatusCodes .OK,
            message: "Successfully send the support message",
            data: result
        });
    }
);


const getPlatformPerformance = catchAsync(
  async (req: Request, res: Response) => {
    const timeRange = req.query.timeRange as 'day' | 'week' | 'month' | 'year' || 'month';
    const result = await AdminService.getPlatformPerformance(
      (req as any).user,
      timeRange
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Platform performance data retrieved successfully",
      data: result
    });
  }
);

const getInsights = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.generateInsights((req as any).user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Insights generated successfully",
      data: result
    });
  }
);

export const AdminController = {
    overView,
    customers,
    updateAccountStatus,
    intrackWithRequest,
    providers,
    allSubCatagroy,
    payments,
    catagroys,
    newCatagroys,
    deleteCatagroys,
    updateCatagroys,
    getAnnounsments,
    createAnnounsments,
    updateAnnounsments,
    activityControleOfAnnounsments,
    deleteAnnounsments,
    getPrivacyPolicy,
    editeyPolicy,
    termsAndConditions,
    adminCommission,
    editeAdminCommission,
    allAdmins,
    subCatagroy,
    allVerifications,
    editeConditions,
    newAdmins,
    deleteAdmin,
    supportReques,
    giveSupport,
    newSubCatagroys,
    deleteSubCatagroys,
    updateSubCatagroys,
    engagement,
    getPlatformPerformance,
    getInsights
};