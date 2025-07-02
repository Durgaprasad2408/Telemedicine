# Telemedicine Portal - Secure Online Health Consultations

A comprehensive full-stack telemedicine application that enables secure online consultations between patients and doctors with real-time chat, video calling, and medical records management.

## 🚀 Features

### Core Functionality
- **User Authentication & Roles**: JWT-based authentication with separate dashboards for patients and doctors
- **Appointment Booking**: Patients can browse doctors and book appointments with real-time availability
- **Secure Chat**: Real-time messaging using Socket.io with file sharing capabilities
- **Video Consultation**: WebRTC-powered video calls for face-to-face consultations
- **Medical Records**: Digital prescriptions and consultation history management
- **Notifications**: In-app alerts and email reminders for appointments

### Security Features
- HTTPS for secure connections
- JWT token-based API protection
- Role-based access control (Patient/Doctor)
- Input validation and sanitization
- Rate limiting and security headers
- Encrypted real-time communications

## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware

### Additional Tools
- **WebRTC** - Peer-to-peer video calling
- **Multer** - File upload handling
- **Nodemailer** - Email notifications
- **Express Validator** - Input validation

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telemedicine-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Frontend Environment Variables
   VITE_API_URL=https://telemedicine-backend-v1.vercel.app
   
   # Backend Environment Variables (for backend deployment)
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telemedicine
   JWT_SECRET=your-super-secret-jwt-key-here
   CLIENT_URL=https://telemedicine-v1.vercel.app
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or update the connection string for a cloud database.

5. **Run the application**
   ```bash
   npm run dev
   ```

   This will start both the frontend (port 5174) and backend (port 5000) concurrently.

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   Set the following environment variable in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```

### Backend Deployment (Separate Repository)

The backend needs to be deployed separately. Create a new repository with just the `server/` folder and deploy it to Vercel or another platform.

1. **Create a new repository for backend**
2. **Copy the `server/` folder contents to the root**
3. **Create a `package.json` for the backend**
4. **Deploy to Vercel with these settings:**
   - Build Command: `npm install`
   - Output Directory: `.`
   - Install Command: `npm install`

### Environment Variables for Backend Deployment

Set these in your backend deployment platform:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telemedicine
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=https://telemedicine-v1.vercel.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🏗️ Project Structure

```
telemedicine-portal/
├── server/                 # Backend code
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── socket/            # Socket.io handlers
│   └── index.js           # Server entry point
├── src/                   # Frontend code
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   └── main.jsx           # Frontend entry point
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## 🔐 Authentication Flow

1. **Registration**: Users register as either patients or doctors with role-specific information
2. **Login**: JWT tokens are issued upon successful authentication
3. **Protected Routes**: All API endpoints and frontend routes are protected based on user roles
4. **Token Refresh**: Automatic token validation and refresh handling

## 💬 Real-time Features

### Chat System
- Appointment-based chat rooms
- Real-time message delivery
- File sharing capabilities
- Message read receipts
- Typing indicators

### Video Calling
- WebRTC peer-to-peer connections
- Audio/video controls
- Screen sharing support
- Call quality optimization
- Cross-platform compatibility

## 🏥 User Roles & Permissions

### Patients
- Browse and search doctors
- Book appointments
- Chat with assigned doctors
- Join video consultations
- View medical records and prescriptions
- Manage profile and preferences

### Doctors
- Manage appointment requests
- Accept/decline bookings
- Chat with patients
- Conduct video consultations
- Write digital prescriptions
- View patient history

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/doctors` - List all doctors

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get user appointments
- `PUT /api/appointments/:id/status` - Update appointment status
- `PUT /api/appointments/:id/prescription` - Add prescription

### Chat
- `GET /api/chat/appointment/:id` - Get appointment messages
- `PUT /api/chat/appointment/:id/read` - Mark messages as read

## 🔒 Security Measures

- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Input Validation**: Comprehensive validation on all user inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Security Headers**: Helmet.js for security headers
- **Password Security**: bcrypt for password hashing
- **JWT Security**: Secure token generation and validation

## 🧪 Testing

Run the test suite:
```bash
npm test
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for user workflows

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🔮 Future Enhancements

- AI-powered symptom checker
- Integration with wearable devices
- Multi-language support
- Advanced analytics dashboard
- Mobile app development
- Integration with hospital systems
- Prescription delivery service
- Insurance claim processing

---

**Note**: This is a demonstration project. For production use, ensure proper security audits, compliance with healthcare regulations (HIPAA, GDPR), and thorough testing.

## 🚨 Important Deployment Notes

### Separate Backend Deployment Required

This project requires the backend to be deployed separately from the frontend. The current setup assumes:

1. **Frontend**: Deployed on Vercel at `https://telemedicine-v1.vercel.app`
2. **Backend**: Needs to be deployed separately at `https://telemedicine-backend-v1.vercel.app`

### Steps to Deploy Backend Separately:

1. Create a new repository for the backend
2. Copy the `server/` folder contents to the root of the new repository
3. Create a `package.json` file in the root with backend dependencies
4. Deploy to Vercel or another platform
5. Update the `VITE_API_URL` environment variable in your frontend deployment

### Environment Variables Setup:

**Frontend (.env):**
```env
VITE_API_URL=https://your-backend-deployment-url.vercel.app
```

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
CLIENT_URL=https://telemedicine-v1.vercel.app
```

Without the backend deployment, the frontend will not be able to connect to any API endpoints, resulting in the connection errors you're experiencing.