export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  from_name?: string;
}

export interface IMailProvider {
  send(options: MailOptions): Promise<void>;
}
