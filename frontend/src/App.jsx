import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SmoothScroll from './components/SmoothScroll';
import { X } from 'lucide-react';

// Pages
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import WalkInDrives from './pages/WalkInDrives';
import UploadResume from './pages/UploadResume';
import LoginSignup from './pages/LoginSignup';
import AdminDashboard from './pages/AdminDashboard';
import HrDashboard from './pages/HrDashboard';
import HrDirectory from './pages/HrDirectory';

function WarningBanner() {
  const { user } = useContext(AuthContext);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 15000); // 15 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  // Show only for JobSeekers (candidates) or anonymous users
  if (user && user.role !== 'JobSeeker') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[500px] max-w-xl min-h-[80px] bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl py-4 px-6 rounded-2xl flex gap-4 items-center animate-in slide-in-from-bottom-5 duration-300">
      <div className="text-amber-500 shrink-0 text-lg">⚠️</div>
      <div className="flex-1 text-slate-700 text-xs font-semibold leading-relaxed text-left">
        Before applying to any company kindly upload your resume otherwise application will rejected by website AI agent.
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 self-center p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
        aria-label="Close message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50">
          
          {/* Header Navigation */}
          <Navbar />

          {/* Global Warnings Banner */}
          <WarningBanner />

          <SmoothScroll>
            {/* Main Content Area */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/walk-in-drives" element={<WalkInDrives />} />
                <Route path="/upload-resume" element={<UploadResume />} />
                <Route path="/auth" element={<LoginSignup />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/hr-directory" element={<HrDirectory />} />
                <Route path="/hr-dashboard" element={<HrDashboard />} />
              </Routes>
            </main>

            {/* Page Footer */}
            <Footer />
          </SmoothScroll>

        </div>
      </Router>
    </AuthProvider>
  );
}
