import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, Paperclip, Video, ArrowLeft, User, Upload, X, FileText, Image } from 'lucide-react'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const Chat = () => {
  const { appointmentId } = useParams()
  const { socket } = useSocket()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    fetchAppointment()
  }, [appointmentId])

  useEffect(() => {
    if (socket && appointmentId) {
      socket.emit('join-appointment', appointmentId)

      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message])
        scrollToBottom()
      })

      return () => {
        socket.off('new-message')
      }
    }
  }, [socket, appointmentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chat/appointment/${appointmentId}`)
      setMessages(response.data)
      
      // Mark messages as read
      await axios.put(`/api/chat/appointment/${appointmentId}/read`)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const fetchAppointment = async () => {
    try {
      const response = await axios.get('/api/appointments')
      const appointment = response.data.appointments.find(apt => apt._id === appointmentId)
      setAppointment(appointment)
    } catch (error) {
      console.error('Failed to fetch appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    socket.emit('send-message', {
      appointmentId,
      content: newMessage,
      messageType: 'text'
    })

    setNewMessage('')
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Please upload images, PDFs, or documents.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('appointmentId', appointmentId)

      // Upload file to server
      const response = await axios.post('/api/upload/chat-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { fileUrl, fileName } = response.data

      // Send file message via socket
      if (socket) {
        const messageType = file.type.startsWith('image/') ? 'image' : 'file'
        
        socket.emit('send-message', {
          appointmentId,
          content: fileName,
          messageType,
          fileUrl,
          fileName
        })
      }

      toast.success('File uploaded successfully')
      setShowFileUpload(false)
    } catch (error) {
      console.error('Failed to upload file:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMessage = (message) => {
    const isOwn = message.sender._id === user._id

    if (message.messageType === 'image') {
      return (
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
          <div className={`rounded-lg overflow-hidden ${
            isOwn ? 'bg-primary-600' : 'bg-gray-200'
          }`}>
            <img
              src={message.fileUrl}
              alt={message.fileName}
              className="w-full h-auto max-h-64 object-cover cursor-pointer"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            <div className={`p-2 ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
              <p className="text-xs">{message.fileName}</p>
              <p className="text-xs">{formatTime(message.createdAt)}</p>
            </div>
          </div>
        </div>
      )
    }

    if (message.messageType === 'file') {
      return (
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
          <div className={`p-3 rounded-lg ${
            isOwn ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'
          }`}>
            <div className="flex items-center space-x-2">
              <FileText size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName}</p>
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs underline ${
                    isOwn ? 'text-primary-100' : 'text-primary-600'
                  }`}
                >
                  Download
                </a>
              </div>
            </div>
            <p className={`text-xs mt-2 ${
              isOwn ? 'text-primary-100' : 'text-gray-500'
            }`}>
              {formatTime(message.createdAt)}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`px-4 py-2 rounded-lg ${
          isOwn ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'
        }`}>
          <p className="text-sm">{message.content}</p>
          <p className={`text-xs mt-1 ${
            isOwn ? 'text-primary-100' : 'text-gray-500'
          }`}>
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">Appointment not found</h2>
      </div>
    )
  }

  const otherUser = user?.role === 'doctor' ? appointment.patient : appointment.doctor
  const otherUserName = user?.role === 'doctor' 
    ? `${otherUser.firstName} ${otherUser.lastName}`
    : `Dr. ${otherUser.firstName} ${otherUser.lastName}`

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Chat Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/appointments"
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{otherUserName}</h2>
              <p className="text-sm text-gray-600">
                {user?.role === 'doctor' ? 'Patient' : otherUser.specialization}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              to={`/video-call/${appointmentId}`}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Start Video Call"
            >
              <Video size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
              >
                {renderMessage(message)}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Upload Modal */}
        {showFileUpload && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Upload File</h3>
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Images, PDFs, Documents (Max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-3 btn-primary disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFileUpload(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 input-field"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat