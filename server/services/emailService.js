import nodemailer from 'nodemailer';
import User from '../models/User.js';

// Create transporter with better error handling
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured');
    return null;
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendEmailNotification = async (notification) => {
  try {
    console.log('Attempting to send email notification...');
    
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email transporter not available - skipping email');
      return;
    }

    // Get recipient details
    const recipient = await User.findById(notification.recipient);
    if (!recipient || !recipient.email) {
      console.log('Recipient email not found');
      return;
    }

    console.log(`Sending email to: ${recipient.email}`);

    // Test connection first
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      throw verifyError;
    }
    
    const emailContent = generateEmailContent(notification, recipient);
    
    const mailOptions = {
      from: {
        name: 'TeleMed Healthcare',
        address: process.env.EMAIL_USER
      },
      to: recipient.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    console.log('Sending email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      from: mailOptions.from
    });

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${recipient.email}:`, info.messageId);
    
    return info;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response
    });
    // Don't throw error to prevent notification creation from failing
  }
};

const generateEmailContent = (notification, recipient) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5174';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 10px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #0284c7, #0369a1); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600; 
        }
        .header p { 
          margin: 5px 0 0 0; 
          opacity: 0.9; 
          font-size: 14px; 
        }
        .content { 
          padding: 30px 20px; 
        }
        .notification-type {
          display: inline-block;
          padding: 6px 12px;
          background: #e0f2fe;
          color: #0284c7;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        .button { 
          display: inline-block; 
          padding: 14px 28px; 
          background: linear-gradient(135deg, #0284c7, #0369a1); 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-1px);
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          background: #f8fafc; 
          color: #64748b; 
          font-size: 12px; 
          border-top: 1px solid #e2e8f0;
        }
        .footer p { margin: 5px 0; }
        .divider {
          height: 1px;
          background: #e2e8f0;
          margin: 20px 0;
        }
        .recipient-info {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 TeleMed</h1>
          <p>Healthcare Portal</p>
        </div>
        <div class="content">
          <div class="recipient-info">
            <p><strong>Dear ${recipient.firstName} ${recipient.lastName},</strong></p>
          </div>
          
          <div class="notification-type">${getNotificationTypeLabel(notification.type)}</div>
          <h2 style="color: #1e293b; margin: 0 0 15px 0;">${notification.title}</h2>
          <div class="message">${notification.message}</div>
          <div class="divider"></div>
          <p style="margin-bottom: 20px;">
            <a href="${baseUrl}/notifications" class="button">View in Dashboard</a>
          </p>
          <p style="font-size: 14px; color: #64748b;">
            This notification was sent on ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div class="footer">
          <p><strong>TeleMed Healthcare Portal</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Email: support@telemed.com | Phone: +1 (555) 123-4567</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    TeleMed Healthcare Portal
    
    Dear ${recipient.firstName} ${recipient.lastName},
    
    ${notification.title}
    
    ${notification.message}
    
    View in your dashboard: ${baseUrl}/notifications
    
    This notification was sent on ${new Date().toLocaleDateString()}
    
    ---
    TeleMed Healthcare Portal
    This is an automated message.
    
    For support: support@telemed.com | +1 (555) 123-4567
  `;

  return {
    subject: `${notification.title} - TeleMed Healthcare`,
    html,
    text
  };
};

const getNotificationTypeLabel = (type) => {
  const labels = {
    appointment_request: 'New Appointment',
    appointment_confirmed: 'Appointment Confirmed',
    appointment_cancelled: 'Appointment Cancelled',
    appointment_completed: 'Consultation Complete',
    new_message: 'New Message',
    video_call_request: 'Video Call',
    prescription_added: 'New Prescription'
  };
  return labels[type] || 'Notification';
};