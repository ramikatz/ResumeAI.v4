

import React, { useState, useContext, FormEvent } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User } from '../../types';

interface AuthPageProps {
  onSignupSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSignupSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (isLogin) {
      const result = login(email, password);
      if (result.error === 'not_found') {
        setError('Invalid credentials. Please try again.');
      } else if (result.error === 'unverified') {
        setError('This account is not verified.');
        setInfo('Please check your email to verify your account before logging in.');
        // In a real app, you might resend the verification email here.
        // For simulation, we can navigate the user to the verify page again.
        if (result.user) onSignupSuccess(result.user);
      }
    } else {
      const result = signup(email, password);
      if (!result.success) {
        setError('An account with this email already exists.');
      } else if (result.user) {
        onSignupSuccess(result.user); // Trigger the verification flow in App.tsx
      }
    }
  };
  
  const handleToggleMode = () => {
      setIsLogin(!isLogin); 
      setError('');
      setInfo('');
      setEmail('');
      setPassword('');
  }

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              <span className="text-blue-600">Resume</span> Tailor AI
            </h1>
            <p className="text-md text-slate-500 mt-1">
              {isLogin ? 'Sign in to continue' : 'Create an account to get started'}
            </p>
        </div>
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            {error && <p className="text-sm text-center font-semibold text-red-500">{error}</p>}
            {info && !error && <p className="text-sm text-center text-blue-600">{info}</p>}
            
            <p className="text-xs text-center text-gray-500 pt-2">
                Hint: Use `admin@app.com` / `admin` for admin access, or `client@app.com` / `client` for a client account.
            </p>
            <Button type="submit" className="w-full">
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={handleToggleMode} className="text-sm text-blue-600 hover:underline">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;