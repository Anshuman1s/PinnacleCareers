import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Building2, MapPin, Calendar, Mail, Phone, ArrowLeft, 
  Clock, Award, Send, CheckCircle2, UserCheck, ChevronRight, Ban, Users
} from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API_URL, user, token } = useContext(AuthContext);
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs/${id}`);
        if (!response.ok) throw new Error('Job not found');
        const data = await response.json();
        setJob(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load job details. Displaying mock job info.');
        
        // Mock data fallback
        setJob({
          _id: id,
          role: 'Frontend Engineer (React)',
          company: 'Razorpay',
          location: 'Bangalore',
          type: 'Full-time',
          description: 'We are looking for a Frontend Engineer with solid React.js and Tailwind CSS knowledge. You will build user-centric payment dashboards, checkout flows, and financial platforms with rich UX and responsive styling.',
          openDays: 15,
          establishedDate: 'Oct 2014',
          howToApply: 'Send your portfolio to the contact details below.',
          hrContact: {
            email: 'careers-hr@razorpay.com',
            phone: '+91 88888 88888'
          },
          status: 'Open',
          openings: 5,
          applicantCount: 142,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, API_URL]);

  useEffect(() => {
    const checkAppliedStatus = async () => {
      if (!user || !token || !id) return;
      try {
        const response = await fetch(`${API_URL}/resumes/applied/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setHasApplied(data.alreadyApplied);
        }
      } catch (err) {
        console.error('Error checking applied status:', err);
      }
    };

    checkAppliedStatus();
  }, [id, user, token, API_URL]);

  const handleApply = async () => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/resumes/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: id })
      });
      
      const data = await response.json();
      if (response.ok) {
        setApplySuccess(true);
        setHasApplied(true);
        // Increment applicant count locally in real-time
        setJob(prev => ({
          ...prev,
          applicantCount: (prev.applicantCount || 0) + 1
        }));
      } else {
        alert(data.message || 'Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysAgo = (dateStr) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 'today' : `${diff} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm animate-pulse space-y-6">
          <div className="h-6 bg-slate-200 rounded w-12"></div>
          <div className="h-10 bg-slate-200 rounded w-1/2"></div>
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isClosed = job.status === 'Closed';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Jobs</span>
        </Link>

        {/* Core Header Card */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-6 sm:p-8 shadow-md shadow-slate-200/30 mb-8 overflow-hidden relative">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-900/5 rounded-bl-full pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-blue-600 bg-blue-100 px-5 py-2 rounded-sm ">
                  {job.company}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Est. {job.establishedDate}
                </span>
                {isClosed && (
                  <span className="text-xs font-bold bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-sm uppercase">
                    Closed
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight ">
                {job.role}
              </h1>
              
              <div className="flex flex-wrap gap-y-2 gap-x-5 text-sm text-slate-500 mt-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{isClosed ? 'Registration Closed' : `Open for ${job.openDays} days`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>Hiring {job.openings || 1} { (job.openings || 1) === 1 ? 'candidate' : 'candidates' }</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Posted {getDaysAgo(job.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50/60 border border-cyan-100/80 px-2.5 py-2 rounded-sm text-cyan-500 text-xs font-semibold shrink-0">
                  <UserCheck className="h-6 w-5 text-cyan-500 shrink-0" />
                  <span>{job.applicantCount >= 50000 ? '50000+' : job.applicantCount || 0} applied</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <span className="inline-flex items-center gap-1 text-sm font-medium px-5 py-2 rounded-sm border border-blue-200 text-blue-700 bg-blue-50/50 mb-3">
                {job.type}
              </span>
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Job Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>Job Description</span>
              </h2>
              <div 
                className="text-slate-600 leading-relaxed space-y-4 whitespace-pre-line text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>

            {/* How to Apply */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <span>How to Apply</span>
              </h2>
              
              {isClosed ? (
                <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 mb-6 flex items-center gap-3">
                  <Ban className="h-6 w-6 text-slate-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Applications Closed</h4>
                    <p className="text-xs text-slate-400">This recruiter is no longer accepting new candidate registrations for this position.</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base mb-6">
                    {job.howToApply}
                  </p>
                  
                  {hasApplied ? (
                    <div className="space-y-4">
                      <button
                        disabled
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-400 font-bold px-6 py-3 rounded-2xl cursor-not-allowed select-none"
                      >
                        <span>Already Applied</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </button>
                      {applySuccess && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 animate-fadeIn">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm">Application Sent!</h4>
                            <p className="text-xs text-emerald-700">Your profile has been forwarded to the HR team for review. <span className='text-red-400'>Keep Applying !!</span></p>
                            
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={submitting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-light px-6 py-3 rounded-sm transition-all shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 cursor-pointer"
                    >
                      {submitting ? 'Applying...' : 'Apply Now'}
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Company Sidebar */}
          <div className="space-y-6">
            
            {/* Company Info Card */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full"></div>
              
              <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-blue-600" />
                <span>Company Details</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">COMPANY NAME</label>
                  <span className="text-sm font-bold text-slate-800">{job.company}</span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">ESTABLISHED IN</label>
                  <span className="text-sm font-medium text-slate-700">{job.establishedDate}</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-xl p-8 text-white shadow-md shadow-indigo-950/20">
              <h4 className="font-semibold text-sm mb-2 text-black">Quick Job Tip</h4>
              <p className="text-xs text-black leading-relaxed font-thin">
                Always ensure your contact credentials are correct. Companies like <b>{job.company}</b> prioritize applications with clean resumes and complete contact details.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
