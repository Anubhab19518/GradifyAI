import React, { useState } from 'react';
import { Camera, Mail, Lock, User, UserCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormData {
  name: string;
  username: string;
  email: string;
  password: string;
  profilePicture: File | null;
}

const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    email: '',
    password: '',
    profilePicture: null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLogin) {
        const signupFormData = new FormData();
        signupFormData.append('name', formData.name);
        signupFormData.append('username', formData.username);
        signupFormData.append('email', formData.email);
        signupFormData.append('password', formData.password);
        if (formData.profilePicture) {
          signupFormData.append('profilePicture', formData.profilePicture);
        }

        const response = await fetch('http://localhost:5000/api/teacher/register', {
          method: 'POST',
          body: signupFormData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        // Store user data in localStorage
        localStorage.setItem('usermail', data.teacher.email);
        localStorage.setItem('name', data.teacher.name);
        localStorage.setItem('username', data.teacher.username);
        localStorage.setItem('dp', data.teacher.profilePicture);

        // Redirect to profile details page
        navigate('/profile-details');
      } else {
        const response = await fetch('http://localhost:5000/api/teacher/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        localStorage.setItem('usermail', data.teacher.email);
        localStorage.setItem('name', data.teacher.name);
        localStorage.setItem('username', data.teacher.username);
        localStorage.setItem('dp', data.teacher.profilePicture || '');
        localStorage.setItem('token', data.token);

        navigate('/profile-details');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      {/* Simple Logo / Header outside the card */}
      <div className="mb-8 text-center mt-12">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight cursor-pointer" onClick={() => navigate('/')}>Gradify.ai</h1>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8 relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isLogin ? 'Enter your details to sign in.' : 'Sign up to start evaluating exams.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  placeholder="Full Name"
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  placeholder="Username"
                />
              </div>

              <div className="flex flex-col items-center justify-center w-full mt-2">
                {previewUrl ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden group border border-gray-200">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                ) : (
                  <label className="w-24 h-24 flex flex-col items-center justify-center rounded-full border border-dashed border-gray-300 cursor-pointer hover:border-slate-900 hover:bg-gray-50 transition-colors">
                    <Camera className="w-6 h-6 text-gray-400" />
                    <span className="mt-1 text-xs text-gray-500">Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              placeholder="Email Address"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-900 font-medium hover:underline focus:outline-none"
              disabled={isLoading}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;