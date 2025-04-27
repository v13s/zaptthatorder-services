import nodemailer from 'nodemailer';
import { AppError } from '../middleware/error.middleware';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface OrderConfirmationEmail {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  estimatedDelivery: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendOrderConfirmation(email: OrderConfirmationEmail): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@zapthatorder.com',
        to: email.customerEmail,
        subject: `Order Confirmation - #${email.orderNumber}`,
        html: `
          <h1>Thank you for your order!</h1>
          <p>Dear ${email.customerName},</p>
          <p>Your order #${email.orderNumber} has been confirmed.</p>
          
          <h2>Order Details</h2>
          <table>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
            ${email.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          
          <p><strong>Total Amount:</strong> $${email.totalAmount.toFixed(2)}</p>
          
          <h2>Shipping Information</h2>
          <p>
            ${email.shippingAddress.street}<br>
            ${email.shippingAddress.city}, ${email.shippingAddress.state} ${email.shippingAddress.zipCode}<br>
            ${email.shippingAddress.country}
          </p>
          
          <p><strong>Estimated Delivery:</strong> ${email.estimatedDelivery}</p>
          
          <p>Thank you for shopping with us!</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new AppError('Failed to send order confirmation email', 500);
    }
  }
}

export const emailService = new EmailService({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
}); 