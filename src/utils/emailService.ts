export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // TODO: Implement actual email sending logic
  console.log('Sending email:', options);
}; 