import Notification from '../models/Notification.js';
import { sendEmailNotification } from './emailService.js';

export const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  data = {},
  sendEmail = true
}) => {
  try {
    console.log(`Creating notification: ${type} for user ${recipient}`);
    
    // Create notification in database
    const notification = new Notification({
      recipient,
      sender,
      type,
      title,
      message,
      data
    });

    await notification.save();
    await notification.populate('sender', 'firstName lastName role');

    console.log(`✅ Notification created successfully: ${notification._id}`);

    // Send email notification if enabled
    if (sendEmail) {
      console.log('📧 Attempting to send email notification...');
      try {
        await sendEmailNotification(notification);
        notification.isEmailSent = true;
        await notification.save();
        console.log('✅ Email notification sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError);
        // Don't throw error here, notification should still be created
        notification.isEmailSent = false;
        await notification.save();
      }
    } else {
      console.log('📧 Email notification skipped (disabled)');
    }

    return notification;
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
};

export const getNotificationTemplate = (type, data) => {
  const templates = {
    appointment_request: {
      title: 'New Appointment Request',
      message: `${data.patientName} has requested an appointment for ${data.appointmentDate}. Please review and respond to this request.`,
      emailSubject: 'New Appointment Request - TeleMed',
      emailTemplate: 'appointment-request'
    },
    appointment_confirmed: {
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${data.doctorName} has been confirmed for ${data.appointmentDate}. You will receive a reminder before your consultation.`,
      emailSubject: 'Appointment Confirmed - TeleMed',
      emailTemplate: 'appointment-confirmed'
    },
    appointment_cancelled: {
      title: 'Appointment Cancelled',
      message: `Your appointment scheduled for ${data.appointmentDate} has been cancelled. If you need to reschedule, please book a new appointment.`,
      emailSubject: 'Appointment Cancelled - TeleMed',
      emailTemplate: 'appointment-cancelled'
    },
    appointment_completed: {
      title: 'Consultation Completed',
      message: `Your consultation has been completed successfully. Prescription and consultation notes are now available in your dashboard.`,
      emailSubject: 'Consultation Completed - TeleMed',
      emailTemplate: 'appointment-completed'
    },
    new_message: {
      title: 'New Message',
      message: `You have a new message from ${data.senderName}. Please check your messages for details.`,
      emailSubject: 'New Message - TeleMed',
      emailTemplate: 'new-message'
    },
    video_call_request: {
      title: 'Incoming Video Call',
      message: `${data.callerName} is requesting a video consultation. Please join the call when ready.`,
      emailSubject: 'Video Call Request - TeleMed',
      emailTemplate: 'video-call'
    },
    prescription_added: {
      title: 'New Prescription Available',
      message: `Dr. ${data.doctorName} has added a prescription to your consultation. Please review the medication details and instructions.`,
      emailSubject: 'New Prescription - TeleMed',
      emailTemplate: 'prescription-added'
    }
  };

  return templates[type] || {
    title: 'Notification',
    message: 'You have a new notification from TeleMed Healthcare.',
    emailSubject: 'Notification - TeleMed',
    emailTemplate: 'generic'
  };
};