import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import { createNotification, getNotificationTemplate } from '../services/notificationService.js';

export const setupSocketHandlers = (io) => {
  // Store active users and their socket IDs
  const activeUsers = new Map();
  const activeCalls = new Map();

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.firstName} connected`);
    
    // Store active user
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      status: 'online'
    });

    // Broadcast user online status
    socket.broadcast.emit('user-online', {
      userId: socket.userId,
      user: socket.user
    });

    // Join appointment rooms
    socket.on('join-appointment', async (appointmentId) => {
      try {
        // Verify user has access to this appointment
        const appointment = await Appointment.findOne({
          _id: appointmentId,
          $or: [
            { patient: socket.userId },
            { doctor: socket.userId }
          ]
        });

        if (appointment) {
          socket.join(`appointment-${appointmentId}`);
          console.log(`User ${socket.user.firstName} joined appointment ${appointmentId}`);
        }
      } catch (error) {
        console.error('Error joining appointment:', error);
      }
    });

    // Handle sending messages
    socket.on('send-message', async (data) => {
      try {
        const { appointmentId, content, messageType = 'text', fileUrl = '', fileName = '' } = data;

        // Verify user has access to this appointment
        const appointment = await Appointment.findOne({
          _id: appointmentId,
          $or: [
            { patient: socket.userId },
            { doctor: socket.userId }
          ]
        });

        if (!appointment) {
          return socket.emit('error', { message: 'Appointment not found' });
        }

        // Determine recipient
        const recipientId = appointment.patient.toString() === socket.userId 
          ? appointment.doctor 
          : appointment.patient;

        // Create message
        const message = new Message({
          sender: socket.userId,
          recipient: recipientId,
          appointment: appointmentId,
          content,
          messageType,
          fileUrl,
          fileName
        });

        await message.save();
        await message.populate('sender', 'firstName lastName role');

        // Send message to appointment room
        io.to(`appointment-${appointmentId}`).emit('new-message', message);

        // Create notification for recipient
        const template = getNotificationTemplate('new_message', {
          senderName: `${socket.user.firstName} ${socket.user.lastName}`
        });

        const notification = await createNotification({
          recipient: recipientId,
          sender: socket.userId,
          type: 'new_message',
          title: template.title,
          message: template.message,
          data: { 
            appointmentId: appointmentId,
            messageId: message._id 
          },
          sendEmailNotification: false // Don't send email for chat messages
        });

        // Send real-time notification to recipient if they're online
        const recipientSocket = activeUsers.get(recipientId.toString());
        if (recipientSocket) {
          io.to(recipientSocket.socketId).emit('new-notification', {
            type: 'new_message',
            title: template.title,
            message: template.message,
            appointmentId,
            sender: socket.user.firstName + ' ' + socket.user.lastName,
            content: messageType === 'text' ? content : `Sent a ${messageType}`
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Video call initiation
    socket.on('initiate-video-call', async (data) => {
      try {
        const { appointmentId, to, callerName, callerRole } = data;

        console.log(`Video call initiated from ${socket.userId} to ${to} for appointment ${appointmentId}`);

        // Check if recipient is online
        const recipientSocket = activeUsers.get(to);
        if (!recipientSocket) {
          return socket.emit('user-offline', { message: 'User is not online' });
        }

        // Check if either user is already in a call
        if (activeCalls.has(socket.userId) || activeCalls.has(to)) {
          return socket.emit('user-busy', { message: 'User is busy' });
        }

        // Store call information
        const callData = {
          appointmentId,
          caller: socket.userId,
          recipient: to,
          status: 'calling',
          callerSocket: socket.id,
          recipientSocket: recipientSocket.socketId
        };

        activeCalls.set(socket.userId, callData);
        activeCalls.set(to, callData);

        // Send call notification to recipient
        io.to(recipientSocket.socketId).emit('incoming-video-call', {
          appointmentId,
          from: socket.userId,
          callerName,
          callerRole
        });

        // Create notification for video call
        const template = getNotificationTemplate('video_call_request', {
          callerName
        });

        await createNotification({
          recipient: to,
          sender: socket.userId,
          type: 'video_call_request',
          title: template.title,
          message: template.message,
          data: { appointmentId },
          sendEmailNotification: false // Don't send email for video calls
        });

        console.log(`Call notification sent to ${to}`);

      } catch (error) {
        console.error('Error initiating video call:', error);
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    // Accept call - This should automatically start the WebRTC connection
    socket.on('accept-call', async (data) => {
      try {
        const { appointmentId, callerId } = data;
        
        console.log(`Call accepted by ${socket.userId} from ${callerId} for appointment ${appointmentId}`);
        
        // Update call status
        const callData = activeCalls.get(callerId);
        if (callData) {
          callData.status = 'accepted';
          activeCalls.set(callerId, callData);
          activeCalls.set(socket.userId, callData);
        }

        // Notify caller that call was accepted
        const callerSocket = activeUsers.get(callerId);
        if (callerSocket) {
          io.to(callerSocket.socketId).emit('call-accepted', { 
            appointmentId,
            recipientId: socket.userId 
          });
        }

        // Automatically start WebRTC offer from the caller
        if (callerSocket) {
          io.to(callerSocket.socketId).emit('start-webrtc-call', { appointmentId });
        }

      } catch (error) {
        console.error('Error accepting call:', error);
        socket.emit('error', { message: 'Failed to accept call' });
      }
    });

    // Decline call
    socket.on('decline-call', (data) => {
      const { appointmentId, callerId } = data;
      
      console.log(`Call declined by ${socket.userId} from ${callerId}`);
      
      // Remove call information
      activeCalls.delete(callerId);
      activeCalls.delete(socket.userId);

      // Notify caller that call was declined
      const callerSocket = activeUsers.get(callerId);
      if (callerSocket) {
        io.to(callerSocket.socketId).emit('call-declined', { appointmentId });
      }
    });

    // End call
    socket.on('end-call', (data) => {
      const { appointmentId } = data;
      
      console.log(`Call ended by ${socket.userId} for appointment ${appointmentId}`);
      
      // Find and remove call information
      const userCall = activeCalls.get(socket.userId);
      if (userCall) {
        const otherUserId = userCall.caller === socket.userId ? userCall.recipient : userCall.caller;
        
        // Remove call for both users
        activeCalls.delete(socket.userId);
        activeCalls.delete(otherUserId);

        // Notify other user that call ended
        const otherUserSocket = activeUsers.get(otherUserId);
        if (otherUserSocket) {
          io.to(otherUserSocket.socketId).emit('call-ended', { appointmentId });
        }

        // Notify appointment room
        socket.to(`appointment-${appointmentId}`).emit('call-ended', { appointmentId });
      }
    });

    // Handle video call signaling with better logging
    socket.on('video-call-offer', (data) => {
      const { appointmentId, offer } = data;
      console.log(`WebRTC offer sent by ${socket.userId} for appointment ${appointmentId}`);
      
      socket.to(`appointment-${appointmentId}`).emit('video-call-offer', {
        offer,
        from: socket.userId
      });
    });

    socket.on('video-call-answer', (data) => {
      const { appointmentId, answer } = data;
      console.log(`WebRTC answer sent by ${socket.userId} for appointment ${appointmentId}`);
      
      socket.to(`appointment-${appointmentId}`).emit('video-call-answer', {
        answer,
        from: socket.userId
      });
    });

    socket.on('ice-candidate', (data) => {
      const { appointmentId, candidate } = data;
      console.log(`ICE candidate sent by ${socket.userId} for appointment ${appointmentId}`);
      
      socket.to(`appointment-${appointmentId}`).emit('ice-candidate', {
        candidate,
        from: socket.userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.firstName} disconnected`);
      
      // Remove from active users
      activeUsers.delete(socket.userId);
      
      // Handle any active calls
      const userCall = activeCalls.get(socket.userId);
      if (userCall) {
        const otherUserId = userCall.caller === socket.userId ? userCall.recipient : userCall.caller;
        
        // Remove call for both users
        activeCalls.delete(socket.userId);
        activeCalls.delete(otherUserId);

        // Notify other user that call ended
        const otherUserSocket = activeUsers.get(otherUserId);
        if (otherUserSocket) {
          io.to(otherUserSocket.socketId).emit('call-ended', { 
            appointmentId: userCall.appointmentId,
            reason: 'User disconnected'
          });
        }
      }

      // Broadcast user offline status
      socket.broadcast.emit('user-offline', {
        userId: socket.userId,
        user: socket.user
      });
    });
  });
};