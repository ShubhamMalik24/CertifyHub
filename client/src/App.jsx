import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/theme.css';

// Lazy load components for better performance
const Layout = lazy(() => import('./components/Layout'));
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const Instructor = lazy(() => import('./pages/Instructor'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Course = lazy(() => import('./pages/Course'));
const CourseContent = lazy(() => import('./pages/CourseContent'));
const CreateCourse = lazy(() => import('./pages/CreateCourse'));
const EditCourse = lazy(() => import('./pages/EditCourse'));
const About = lazy(() => import('./pages/About'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Certificates = lazy(() => import('./pages/Certificates'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/instructor" element={<Instructor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/courses/:id" element={<Course />} />
            <Route path="/courses/:id/content" element={<CourseContent />} />
            <Route path="/create-course" element={<CreateCourse />} />
            <Route path="/courses/:id/edit" element={<EditCourse />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/instructor" element={<InstructorDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Routes>
        </Layout>
      </Suspense>
    </Router>
  );
}

export default App;
