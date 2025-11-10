import { z } from "zod";

const userUpdateSchema = z.object({
  query: z.object({
    acction: z.enum(["ACTIVE", "BLOCK", "DELETE", "REPORT"]),
    user: z.string({
      required_error:
        "You must give the user id for change user account status",
    }),
  }),
});

const catagorySchema = z.object({
  body: z.object({
    catagory: z.string({ required_error: "You must give the catagory name" }),
  }),
});

const announcementSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: "You must give the title of your announcements",
    }),
    descriptions: z.string({
      required_error: "You must give your announcement description",
    }),
  }),
});

const announceUpdate = z.object({
  body: z.object({
    id: z.string({
      required_error: "You must give the id to update the announcement",
    }),
    title: z.string().optional(),
    descriptions: z.string().optional(),
  }),
});

const changeStatusAndUpdate = z.object({
  query: z.object({
    id: z.string({
      required_error: "You must give the id to update the announcement",
    }),
    status: z.enum(["ACTIVE", "DEACTIVE"]),
  }),
});

const deleteAnnouncement = z.object({
  query: z.object({
    id: z.string({
      required_error: "You must give the id to delete the announcement",
    }),
  }),
});

const updatedPolicy = z.object({
  body: z.object({
    policy: z.string({ required_error: "You must give the policy to update" }),
  }),
});

const updatedtermsConditions = z.object({
  body: z.object({
    data: z.string({
      required_error: "You must give the data to update the Terms & Conditions",
    }),
  }),
});

const addNewAdminSchema = z.object({
  body: z.object({
    fullName: z.string({
      required_error: "You must give the name for create the users",
    }),
    email: z.string({
      required_error: "You must give the email for the admin account",
    }),
    password: z.string({
      required_error: "You must give the passwor for the admin",
    }),
  }),
});

const deleteAdminSchema = z.object({
  query: z.object({
    adminID: z.string({ required_error: "You must give the admin id" }),
  }),
});

const supportRequestAdminSchema = z.object({
  body: z.object({
    message: z.string({
      required_error: "You must give a message to send the support",
    }),
    supportID: z.string({
      required_error: "You must give the supportID to give the support",
    }),
  }),
});

const validationRequest = z.object({
  body: z.object({
    requestId: z.string({ required_error: "You must give a request Id" }),
    acction: z.enum(["APPROVE", "DECLINE"]),
  }),
});

const updatedAdminCommission = z.object({
  body: z
    .object({
      adminCommissionPercentage: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.adminCommissionPercentage) {
        if (data.adminCommissionPercentage < 0 || data.adminCommissionPercentage > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Admin commission must be between 0 and 100",
          });
        }
      }
    }),
});

export const AdminValidation = {
  userUpdateSchema,
  validationRequest,
  catagorySchema,
  announcementSchema,
  announceUpdate,
  changeStatusAndUpdate,
  deleteAnnouncement,
  updatedPolicy,
  updatedtermsConditions,
  addNewAdminSchema,
  deleteAdminSchema,
  supportRequestAdminSchema,
  updatedAdminCommission,
};
