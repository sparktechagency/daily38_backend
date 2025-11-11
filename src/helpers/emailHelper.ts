import nodemailer from "nodemailer";
import { errorLogger, logger } from "../shared/logger";
import { ISendEmail } from "../types/email";
import config from "../config";

const transporter = nodemailer.createTransport({
  host: config.email_host,
  port: Number(config.email_port),
  secure: false,
  auth: {
    user: config.email_user,
    pass: config.email_pass,
  },
});

const sendEmail = async (values: ISendEmail) => {
  try {
    const mailOptions: any = {
      from: `"Daily38" ${config.email_from}`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    };

    // Add attachments if provided
    if (values.attachments && values.attachments.length > 0) {
      mailOptions.attachments = values.attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType || "application/octet-stream",
        encoding: "base64",
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info("Mail sent successfully", info.accepted);
  } catch (error) {
    errorLogger.error("Email sending failed", error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const emailHelper = {
  sendEmail,
};
