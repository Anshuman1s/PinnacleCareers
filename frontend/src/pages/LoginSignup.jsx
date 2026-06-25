import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Mail, Lock, User, Phone, Globe, MapPin, 
  Building2, AlertCircle, CheckCircle, ChevronRight, Loader2
} from 'lucide-react';

export default function LoginSignup() {
  const { login, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Tab states: 'login' or 'signup'
  const [isLogin, setIsLogin] = useState(true);
  // Role states: 'JobSeeker' or 'HR'
  const [role, setRole] = useState('JobSeeker');

  // Sync route query parameters (?mode=login or ?mode=signup)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Form Field states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isLengthValid = password.length >= 8;
  const isUppercaseValid = /[A-Z]/.test(password);
  const isSymbolValid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gender, setGender] = useState('Male');

  // Signin specific states
  const [loginKey, setLoginKey] = useState(''); // email or mobile

  // OTP states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Feedback states
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSendingOtp(true);

    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send verification code.');

      setSuccess(data.message || 'Verification OTP sent successfully to your email!');
      setOtpSent(true);
      setOtpTimer(180); // 3 minutes countdown
    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection failed.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Validation
        if (!loginKey || !password) {
          throw new Error('Please fill in all fields.');
        }

        const response = await fetch(`${API_URL}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginKey, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed.');

        login(data, data.token);
        setSuccess('Logged in successfully!');
        
        // Redirect based on role
        setTimeout(() => {
          if (data.role === 'Admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/');
          }
        }, 800);

      } else {
        // Signup Validation
        if (!fullName || !email || !password || !phoneNumber || !country || !currentLocation) {
          throw new Error('All fields are required.');
        }

        if (!otpSent) {
          throw new Error('Please request and enter your email verification OTP code.');
        }

        if (!otp || otp.length !== 6) {
          throw new Error('Please enter the 6-digit verification code sent to your email.');
        }

        // Password strength validation
        const hasUppercase = /[A-Z]/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
        if (password.length < 8 || !hasUppercase || !hasSymbol) {
          throw new Error('Password must be at least 8 characters long, contain at least one uppercase letter, and at least one symbol/special character.');
        }

        if (role === 'HR' && !companyName) {
          throw new Error('Company Name is required for HR Professional signup.');
        }

        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email,
            password,
            phoneNumber,
            country,
            currentLocation,
            role,
            companyName: role === 'HR' ? companyName : undefined,
            gender: role === 'JobSeeker' ? gender : undefined,
            otp
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Signup failed.');

        setSuccess('Account created successfully! Logging you in...');
        login(data, data.token);

        setTimeout(() => {
          if (data.role === 'Admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/');
          }
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-5 relative overflow-hidden">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            {isLogin ? 'Sign in to Pinnacle Careers' : 'Create your account'}
          </h2>
          <p className="text-xs text-slate-500">
            {isLogin 
              ? "Welcome back! Please enter your details below." 
              : "Register to get started on your professional journey."}
          </p>
        </div>

        {/* Auth Toggle */}
        <div className="grid grid-cols-2 p-0.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
              setPassword('');
            }}
            className={`py-2 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
              isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setPassword('');
            }}
            className={`py-2 text-xs font-semibold rounded-sm transition-all cursor-pointer ${
              !isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Selection (Only for Signup) */}
        {!isLogin && (
          <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setRole('JobSeeker')}
              className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all cursor-pointer ${
                role === 'JobSeeker' 
                  ? 'border-blue-500/30 bg-blue-50 text-blue-700 font-extrabold shadow-sm' 
                  : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
            >
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setRole('HR')}
              className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all cursor-pointer ${
                role === 'HR' 
                  ? 'border-blue-500/30 bg-blue-50 text-blue-700 font-extrabold shadow-sm' 
                  : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
            >
              HR Recruiter
            </button>
          </div>
        )}

        {/* Notification Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-sm bg-red-50 border border-red-100 text-red-800 text-xs animate-fadeIn">
            <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs animate-fadeIn">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {isLogin ? (
            // SIGN IN FIELDS
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Email or Mobile Number</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. yourname@gmail.com"
                    required
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            // SIGN UP FIELDS - Compact Alignment
            <div className="space-y-3">
              {/* Full Name - Full Width */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    placeholder="e.g. Anshuman Shukla"
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>

              {/* Gmail Address - Full Width with inline verification */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Gmail Address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={sendingOtp || otpTimer > 0}
                    onClick={handleSendOtp}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 text-blue-600 disabled:text-slate-400 border border-blue-200 disabled:border-slate-200 font-bold rounded-sm text-xs transition-all shrink-0 cursor-pointer"
                  >
                    {sendingOtp ? 'Sending...' : otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Send OTP'}
                  </button>
                </div>
              </div>

              {/* OTP Sent block */}
              {otpSent && (
                <div className="animate-slideDown p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 space-y-2">
                  <label className="text-[10px] font-bold text-blue-800 block tracking-wide uppercase">Enter 6-Digit Verification Code</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter code"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-blue-200/80 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold tracking-widest text-slate-800"
                    />
                  </div>
                  <p className="text-[9px] font-medium text-blue-600">A verification code has been sent to your email. Please enter it above.</p>
                </div>
              )}

              {/* Password - Full Width */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                  />
                </div>
                {/* Horizontal Dynamic Password Strength Indicator */}
                <div className="mt-1.5 p-2 rounded-sm bg-slate-50/50 border border-slate-100/80 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
                    <div className="flex items-center gap-1 transition-colors duration-200">
                      <span className={`w-1 h-1 rounded-sm shrink-0 transition-all ${isLengthValid ? 'bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`} />
                      <span className={isLengthValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>Min 8 chars</span>
                    </div>
                    <div className="flex items-center gap-1 transition-colors duration-200">
                      <span className={`w-1 h-1 rounded-full shrink-0 transition-all ${isUppercaseValid ? 'bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`} />
                      <span className={isUppercaseValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>1 Uppercase</span>
                    </div>
                    <div className="flex items-center gap-1 transition-colors duration-200">
                      <span className={`w-1 h-1 rounded-sm shrink-0 transition-all ${isSymbolValid ? 'bg-emerald-500 scale-110 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`} />
                      <span className={isSymbolValid ? 'text-emerald-700 font-medium' : 'text-slate-500'}>1 Special char</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Number - Full Width */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    placeholder="e.g. 9876543210"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                  />
                </div>
              </div>

              {/* Gender selection (For JobSeekers only) */}
              {role === 'JobSeeker' && (
                <div className="space-y-1 animate-slideDown">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all font-bold text-slate-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              )}

              {/* Country & Current Location - Side-by-Side (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={country}
                      placeholder="e.g. India"
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Current Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={currentLocation}
                      placeholder="e.g. Delhi"
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Company Name (For HR Recruiter only) - Full Width */}
              {role === 'HR' && (
                <div className="space-y-1 animate-slideDown">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-slate-200/85 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer text-xs font-semibold tracking-wide"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Account' : 'Create Free Account'}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Helper link */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setPassword('');
            }}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-all"
          >
            {isLogin ? "Don't have an account? Sign up today" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
