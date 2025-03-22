import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, error, loading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear validation errors when user types
    if (validationErrors[e.target.name as keyof typeof validationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...validationErrors };

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Full name validation (only for signup)
    if (mode === 'signup' && !formData.fullName) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (mode === 'signin') {
        const success = await signIn(formData.email, formData.password);
        if (success) {
          navigate('/dashboard');
        }
      } else {
        const success = await signUp(formData.email, formData.password, formData.fullName);
        if (success) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      // Error is already handled by the auth store
      console.error("Authentication error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  // Helper function to display user-friendly error messages
  const getErrorMessage = (errorMsg: string | null) => {
    if (!errorMsg) return null;
    
    if (errorMsg.includes("user_already_exists") || errorMsg.includes("User already registered")) {
      return "This email is already registered. Please sign in instead.";
    }
    
    if (errorMsg.includes("weak_password") || errorMsg.includes("Password should be at least 6 characters")) {
      return "Password should be at least 6 characters long.";
    }
    
    return errorMsg;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {mode === 'signin' 
            ? "Enter your credentials to access your account" 
            : "Fill in your details to create a new account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <Input
            label="Full Name"
            name="fullName"
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
            required
            fullWidth
            leftIcon={<User size={18} className="text-gray-400" />}
            error={validationErrors.fullName}
          />
        )}
        
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          fullWidth
          leftIcon={<Mail size={18} className="text-gray-400" />}
          error={validationErrors.email}
        />
        
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          fullWidth
          leftIcon={<Lock size={18} className="text-gray-400" />}
          error={validationErrors.password}
          helperText={mode === 'signup' ? "Password must be at least 6 characters long" : ""}
        />
        
        {error && (
          <div className="text-sm text-red-600 mt-1">
            {getErrorMessage(error)}
          </div>
        )}
        
        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          isLoading={loading}
          leftIcon={<LogIn size={18} />}
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            type="button" 
            variant="outline" 
            fullWidth 
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm">
        {mode === 'signin' ? (
          <>
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-gray-600">
              Forgot your password?{' '}
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-500 font-medium">
                Reset it here
              </Link>
            </p>
          </>
        ) : (
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </Card>
  );
};

export default AuthForm;