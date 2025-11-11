export interface IEmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export type ISendEmail = {
  to: string;
  subject: string;
  html: string;
  attachments?: IEmailAttachment[];
};
