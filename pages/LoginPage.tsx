import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Lock, ArrowRight, AlertCircle, ChefHat, UserCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { language, login, register, isAuthenticated, currentUserId, users } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // If already authenticated, redirect to the app securely
  if (isAuthenticated && currentUserId) {
    return <Navigate to={`/HORECA/COSTCONTROL/${currentUserId}/dashboard`} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (newPassword !== confirmPassword) {
        setError(t(language, 'passwordMismatch'));
        return;
      }
      if (newPassword.length < 4) {
        setError(language === 'ka' ? 'პაროლი უნდა შეიცავდეს მინიმუმ 4 სიმბოლოს.' : 'Password must be at least 4 characters long.');
        return;
      }
      const success = register(id, newPassword);
      if (success) {
        navigate(`/HORECA/COSTCONTROL/${id}/dashboard`, { replace: true });
      } else {
        setError('Registration failed');
      }
      return;
    }

    const success = login(id, password);
    if (success) {
      const user = users.find(u => u.id === id);
      if (!user && password === '111979') {
        setIsRegistering(true);
      } else {
        navigate(`/HORECA/COSTCONTROL/${id}/dashboard`, { replace: true });
      }
    } else {
      setError(t(language, 'invalidPassword'));
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-4">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {isRegistering ? (language === 'ka' ? 'რეგისტრაცია' : 'Register Company') : t(language, 'appTitle')}
          </h1>
          <p className="text-slate-500 font-medium">
            {isRegistering ? (language === 'ka' ? 'დააყენეთ თქვენი პირადი პაროლი' : 'Set your personal password') : t(language, 'loginSubtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {!isRegistering ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {language === 'ka' ? 'კომპანიის ID' : 'Company ID'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserCircle className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={id}
                      onChange={(e) => {
                        setId(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                      placeholder="0000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t(language, 'enterPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white ${
                        error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
                      }`}
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t(language, 'newPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {t(language, 'confirmPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center mt-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center px-4 py-3.5 bg-brand-600 text-white rounded-xl text-base font-bold hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] group"
            >
              {isRegistering ? (language === 'ka' ? 'რეგისტრაციის დასრულება' : 'Complete Registration') : t(language, 'loginButton')}
              <ArrowRight className="w-5 h-5 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
            
            {isRegistering && (
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                {language === 'ka' ? 'უკან დაბრუნება' : 'Go Back'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
