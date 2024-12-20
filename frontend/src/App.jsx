import {Routes, Route, Navigate } from "react-router-dom";
import FloatingShape from "./components/FloatingShape";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerification from "./pages/EmailVerification";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import LoadingSpinner from "./components/LoadingSpinner";

import { Toaster } from 'react-hot-toast';
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";

// protected routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
       return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
       return <Navigate to="/verify-email" replace />;
  }

  return children;
};

// redirect authenticated user to homepage
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
       return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />;
 
  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center reletive overflow-hidden">
      <FloatingShape color='bg-green-500' size='w-30 h-30' top='-5%' left='0%' delay={0} />
      <FloatingShape color='bg-emerald-500' size='w-24 h-24' top='70%' left='0%' delay={5} />
      <FloatingShape color='bg-lime-500' size='w-32 h-32' top='40%' left='0%' delay={2} />
      
      <Routes>
        <Route path='/' element={<ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>} />
        <Route path='/login' element={<RedirectAuthenticatedUser>
          <LoginPage />
        </RedirectAuthenticatedUser>} />
        <Route path='/signup' element={<RedirectAuthenticatedUser>
          <SignUpPage />
        </RedirectAuthenticatedUser>} />
        <Route path='/verify-email' element={< EmailVerification />} />
        <Route path='/forgot-password' element={<RedirectAuthenticatedUser>
          <ForgotPasswordPage />
        </RedirectAuthenticatedUser>} />
        <Route 
        path='/reset-password/:token'
        element={<RedirectAuthenticatedUser>
          <ResetPasswordPage />
        </RedirectAuthenticatedUser>}/>
        {/* catch all routes */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
      <Toaster />
    </div>
  )
};

export default App
