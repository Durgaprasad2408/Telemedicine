import express from 'express';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

// Get messages for an appointment
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Verify user has access to this appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      $or: [
        { patient: req.user._id },
        { doctor: req.user._id }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const messages = await Message.find({ appointment: appointmentId })
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/appointment/:appointmentId/read', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    await Message.updateMany(
      {
        appointment: appointmentId,
        recipient: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;