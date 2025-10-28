# 🎓 CertifyHub - Learning Management System

A modern, full-stack Learning Management System built with React.js and Node.js. CertifyHub provides a comprehensive platform for online education with course management, quizzes, assignments, and automated certificate generation.

## ✨ Features

### 🎯 Core LMS Functionality
- **User Management**: Student, Instructor, and Admin roles
- **Course Creation**: Rich course content with modules and lessons
- **Enrollment System**: Easy course enrollment and progress tracking
- **Quiz System**: Interactive quizzes with automatic grading
- **Assignment System**: File submissions and instructor grading
- **Certificate Generation**: Automated PDF certificates upon completion
- **Progress Tracking**: Real-time learning progress and analytics

### 📊 Dashboard Systems
- **Student Dashboard**: Personal learning analytics, course progress, certificates
- **Instructor Dashboard**: Course analytics, revenue tracking, student management
- **Admin Dashboard**: Platform management, user administration, analytics

### 🔍 Advanced Features
- **Course Search & Filtering**: Multi-criteria search with sorting and pagination
- **Responsive Design**: Mobile-first, modern UI/UX design
- **File Upload System**: Support for various file types (PDF, DOC, images)
- **Role-Based Authorization**: Secure access control
- **Real-time Updates**: Dynamic content and progress updates

## 🛠 Tech Stack

### Frontend
- **React.js 18** - Modern UI framework
- **React Router** - Client-side routing
- **CSS3** - Modern styling with Grid and Flexbox
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication and authorization
- **Multer** - File upload handling
- **PDFKit** - PDF certificate generation

### Additional Tools
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CertifyHub
   ```

2. **Install dependencies for all parts of the application**
   ```bash
   npm run install-deps
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/certifyhub
   JWT_SECRET=your_super_secret_key_here
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   # Option 1: Run both frontend and backend concurrently
   npm run dev
   
   # Option 2: Run separately
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

5. **Create an admin user (optional)**
   ```bash
   cd server
   node createAdmin.js
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
CertifyHub/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       ├── utils/         # Utility functions
│       ├── styles/        # Global styles and themes
│       └── assets/        # Images and static assets
├── server/                # Node.js backend
│   └── src/
│       ├── controllers/   # Route controllers
│       ├── models/        # MongoDB models
│       ├── routes/        # Express routes
│       ├── middleware/    # Custom middleware
│       └── utils/         # Utility functions
└── docs/                  # Documentation
```

## 🎮 Usage Guide

### For Students
1. **Register/Login** to your student account
2. **Browse Courses** using search and filters
3. **Enroll** in courses that interest you
4. **Access Course Content** through your dashboard
5. **Complete Quizzes and Assignments**
6. **Track Progress** and earn certificates

### For Instructors
1. **Create Instructor Account** or get promoted by admin
2. **Create Courses** with modules and lessons
3. **Add Quizzes and Assignments** to courses
4. **Monitor Student Progress** through analytics dashboard
5. **Grade Submissions** and provide feedback
6. **Generate Certificates** for course completions

### For Administrators
1. **Access Admin Dashboard** with admin credentials
2. **Manage Users** - view, edit roles, delete users
3. **Oversee Courses** - monitor platform content
4. **View Analytics** - platform usage and performance metrics
5. **Generate Reports** - user engagement and course statistics

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run client` | Start only the React frontend |
| `npm run server` | Start only the Node.js backend |
| `npm run build` | Build the React app for production |
| `npm run install-deps` | Install dependencies for all parts of the app |

## 📡 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Courses
- `GET /api/courses` - Get all courses with search/filter
- `GET /api/courses/:id` - Get specific course details
- `POST /api/courses` - Create new course (Instructor)
- `POST /api/courses/:id/enroll` - Enroll in course

### Users
- `GET /api/users/dashboard/student` - Student dashboard data
- `GET /api/users/dashboard/instructor` - Instructor dashboard data
- `GET /api/users/dashboard/admin` - Admin dashboard data

### Quizzes
- `POST /api/quizzes` - Create quiz (Instructor)
- `GET /api/quizzes/:courseId` - Get course quizzes
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### Assignments
- `POST /api/assignments` - Create assignment (Instructor)
- `POST /api/assignments/:id/submit` - Submit assignment
- `PUT /api/assignments/:id/grade/:studentId` - Grade submission

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface inspired by leading LMS platforms
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-use menus and navigation structure
- **Interactive Elements**: Smooth animations and hover effects
- **Accessibility**: Keyboard navigation and screen reader support
- **Dark/Light Theme**: Theme support with CSS custom properties

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: Granular permissions for different user types
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured cross-origin resource sharing
- **File Upload Security**: Secure file handling with type validation

## 🧪 Testing

The application includes basic testing setup. To run tests:

```bash
# Frontend tests
cd client && npm test

# Backend tests (if implemented)
cd server && npm test
```

## 🚀 Deployment

### Production Build
```bash
# Build the React app
npm run build

# Start production server
cd server && npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [REPORT.md](REPORT.md) for known issues and fixes
2. Review the project documentation
3. Create an issue in the repository

## 🙏 Acknowledgments

- Built with React.js and Node.js ecosystems
- Inspired by modern LMS platforms like Coursera and Udemy
- UI/UX design influenced by contemporary educational platforms

---

**CertifyHub** - Empowering education through technology 🚀