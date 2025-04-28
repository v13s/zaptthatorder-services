interface BaseEmailOptions {
  to: string;
  subject: string;
}

interface HtmlEmailOptions extends BaseEmailOptions {
  html: string;
  template?: never;
  data?: never;
}

interface TemplateEmailOptions extends BaseEmailOptions {
  template: string;
  data: Record<string, any>;
  html?: never;
}

export type EmailOptions = HtmlEmailOptions | TemplateEmailOptions;

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // TODO: Implement actual email sending logic
  console.log('Sending email:', options);
}; 