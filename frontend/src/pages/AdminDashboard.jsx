import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Users, Briefcase, Activity, AlertCircle, 
  Trash2, Plus, LogOut, CheckCircle2, ShieldCheck, 
  Download, FileText, FileSpreadsheet, Calendar, MapPin, Pin,
  Lock, Unlock, Send
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const formatDateToLongString = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${day} ${months[monthIdx]} ${year}`;
};

export default function AdminDashboard() {
  const { user, token, logout, API_URL, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if not Admin
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'Admin') {
        navigate('/auth?mode=login');
      }
    }
  }, [user, authLoading, navigate]);

  // Tab state: 'jobs' or 'drives'
  const [activeTab, setActiveTab] = useState('jobs');

  // Dashboard states
  const [stats, setStats] = useState({
    summary: { totalUsers: 0, totalHR: 0, totalSeekers: 0, totalJobs: 0, totalApplications: 0, onlineToday: 0 },
    growth: [],
    genderStats: []
  });
  const [analyticsTab, setAnalyticsTab] = useState('growth');
  const [jobs, setJobs] = useState([]);
  const [drives, setDrives] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [adminBroadcastContent, setAdminBroadcastContent] = useState('');
  const [adminBroadcastLoading, setAdminBroadcastLoading] = useState(false);

  // Modals state
  const [pinModal, setPinModal] = useState({ isOpen: false, jobId: null, role: '', company: '' });
  const [pinDate, setPinDate] = useState('');
  const [pinDaysCount, setPinDaysCount] = useState(0);

  // HR Contact form states
  const [contactCompany, setContactCompany] = useState('');
  const [contactHrEmail, setContactHrEmail] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [hrContacts, setHrContacts] = useState([]);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false,
    onConfirm: () => {}
  });

  // Calculate days difference dynamically based on selected date
  useEffect(() => {
    if (!pinDate) {
      setPinDaysCount(0);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(pinDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    if (diffTime <= 0) {
      setPinDaysCount(0);
    } else {
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setPinDaysCount(diffDays);
    }
  }, [pinDate]);

  const tomorrowStr = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  })();

  // Post job form states
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Full-time');
  const [description, setDescription] = useState('');
  const [openDays, setOpenDays] = useState('');
  const [openings, setOpenings] = useState('');
  const [establishedDate, setEstablishedDate] = useState('');
  const [howToApply, setHowToApply] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');

  // Post walk-in drive form states (Defaults removed, placeholders removed)
  const [driveRole, setDriveRole] = useState('');
  const [driveCompany, setDriveCompany] = useState('');
  const [driveLocation, setDriveLocation] = useState('');
  const [driveDate, setDriveDate] = useState('');
  const [driveTime, setDriveTime] = useState('');
  const [driveMapsUrl, setDriveMapsUrl] = useState('');
  const [driveRequirements, setDriveRequirements] = useState('');
  const [driveType, setDriveType] = useState('Immediate Joining');
  const [driveContact, setDriveContact] = useState('');

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_URL}/admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsData.message);
      setStats(statsData);

      // 2. Fetch Jobs
      const jobsRes = await fetch(`${API_URL}/jobs`);
      const jobsData = await jobsRes.json();
      if (!jobsRes.ok) throw new Error(jobsData.message);
      setJobs(jobsData);

      // 3. Fetch Walk-in Drives
      const drivesRes = await fetch(`${API_URL}/drives`);
      const drivesData = await drivesRes.json();
      if (!drivesRes.ok) throw new Error(drivesData.message);
      setDrives(drivesData);

      // 4. Fetch Resumes
      const resumesRes = await fetch(`${API_URL}/resumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resumesData = await resumesRes.json();
      if (!resumesRes.ok) throw new Error(resumesData.message);
      setResumes(resumesData);
      
      // 5. Fetch HR Contacts
      const contactsRes = await fetch(`${API_URL}/hr-contacts`);
      const contactsData = await contactsRes.json();
      if (!contactsRes.ok) throw new Error(contactsData.message);
      setHrContacts(contactsData);
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to database. Showing simulated admin metrics.');
      
      setStats({
        summary: { totalUsers: 34, totalHR: 12, totalSeekers: 22, totalJobs: 4, totalApplications: 3, onlineToday: 15 },
        growth: [
          { date: 'Mon', users: 12 },
          { date: 'Tue', users: 15 },
          { date: 'Wed', users: 18 },
          { date: 'Thu', users: 22 },
          { date: 'Fri', users: 27 },
          { date: 'Sat', users: 31 },
          { date: 'Sun', users: 34 }
        ],
        genderStats: [
          { name: 'Male', value: 12 },
          { name: 'Female', value: 8 },
          { name: 'Prefer not to say', value: 4 }
        ]
      });

      setJobs([
        { _id: '1', role: 'Frontend Engineer (React)', company: 'Razorpay', location: 'Bangalore', type: 'Full-time', openDays: 15, openings: 5 },
        { _id: '2', role: 'React Developer Internship', company: 'Stripe', location: 'Remote', type: 'Internship', openDays: 30, openings: 3 },
        { _id: '3', role: 'Backend Node.js Developer', company: 'Paytm', location: 'Noida', type: 'Full-time', openDays: 45, openings: 2 }
      ]);

      setDrives([
        { _id: '1', company: 'Razorpay', role: 'Frontend & Full Stack Engineers', date: 'June 18, 2026', time: '09:00 AM - 04:00 PM', location: 'Razorpay HQ, SJR Cyber, Koramangala, Bangalore', googleMapsUrl: 'https://maps.google.com', requirements: 'React developers', type: 'Immediate Joining' }
      ]);

      setResumes([
        { _id: '1', fullName: 'Jane Doe', email: 'jane@example.com', phoneNumber: '9876543210', skills: ['React', 'CSS'], experience: '1 Year', education: 'B.Tech', fileName: 'jane_resume.pdf', jobId: { role: 'Frontend Engineer (React)', company: 'Razorpay' } },
        { _id: '2', fullName: 'John Smith', email: 'john@example.com', phoneNumber: '8888888888', skills: ['Node.js', 'MongoDB'], experience: '2 Years', education: 'MCA', fileName: 'john_cv.docx', jobId: { role: 'Backend Node.js Developer', company: 'Paytm' } }
      ]);

      setHrContacts([
        { _id: '1', companyName: 'Razorpay', hrEmail: 'hr@razorpay.com', contactEmail: 'careers@razorpay.com', phone: '+91 88888 88888' },
        { _id: '2', companyName: 'Stripe', hrEmail: 'hr@stripe.com', contactEmail: 'recruiting@stripe.com', phone: '+1 415 555 2671' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchDashboardData();
    }
  }, [user, API_URL]);

  const handleInsertFormat = (tag, textareaId) => {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = `<${tag}>${selectedText || 'text'}</${tag}>`;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setDescription(newValue);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + (selectedText || 'text').length);
    }, 0);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);

    if (
      !role || !role.trim() ||
      !company || !company.trim() ||
      !location || !location.trim() ||
      !openDays || !openDays.toString().trim() ||
      !openings || !openings.toString().trim() ||
      !establishedDate || !establishedDate.trim() ||
      !hrPhone || !hrPhone.trim() ||
      !hrEmail || !hrEmail.trim() ||
      !description || !description.trim() ||
      !howToApply || !howToApply.trim()
    ) {
      setError('Error: All required fields (*) must be filled out.');
      return;
    }

    if (openings !== '' && (isNaN(Number(openings)) || Number(openings) < 0)) {
      setError('Vacancies must be 0 or a positive number.');
      return;
    }

    const jobData = {
      role,
      company,
      location,
      type,
      description,
      openDays: Number(openDays) || 30,
      openings: (openings !== '' && !isNaN(Number(openings))) ? Number(openings) : 1,
      establishedDate,
      howToApply,
      hrContact: {
        email: hrEmail,
        phone: hrPhone
      }
    };

    try {
      const response = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setSuccessMsg('Job posted successfully!');
      
      setRole('');
      setCompany('');
      setLocation('');
      setDescription('');
      setEstablishedDate('');
      setHowToApply('');
      setHrEmail('');
      setHrPhone('');
      setOpenDays('');
      setOpenings('');
      
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to post job.');
    }
  };

  const handlePostDrive = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);

    const driveData = {
      company: driveCompany,
      role: driveRole,
      date: formatDateToLongString(driveDate),
      time: driveTime,
      location: driveLocation,
      googleMapsUrl: driveMapsUrl,
      requirements: driveRequirements,
      type: driveType,
      contact: driveContact || undefined
    };

    try {
      const response = await fetch(`${API_URL}/drives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(driveData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setSuccessMsg('Walk-in drive posted successfully!');
      
      setDriveRole('');
      setDriveCompany('');
      setDriveLocation('');
      setDriveDate('');
      setDriveTime('');
      setDriveMapsUrl('');
      setDriveRequirements('');
      setDriveContact('');
      
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to post walk-in drive.');
    }
  };

  const handleDeleteJob = (jobId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Job Posting',
      message: 'Are you sure you want to delete this job posting? This action cannot be undone and will permanently remove it from the portal.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setError(null);
        setSuccessMsg(null);
        try {
          const response = await fetch(`${API_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          setSuccessMsg('Job deleted successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
          setError(err.message || 'Failed to delete job.');
        }
      }
    });
  };

  const handlePinJob = (jobId) => {
    const job = jobs.find(j => j._id === jobId);
    setPinModal({
      isOpen: true,
      jobId,
      role: job ? job.role : '',
      company: job ? job.company : ''
    });
    // set default date to 7 days from today
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setPinDate(nextWeek.toISOString().split('T')[0]);
  };

  const submitPinJob = async () => {
    if (pinDaysCount <= 0) return;
    const jobId = pinModal.jobId;
    const days = pinDaysCount;
    setPinModal({ isOpen: false, jobId: null, role: '', company: '' });
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ durationDays: days })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setSuccessMsg(`Job pinned successfully for ${days} days!`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to pin job.');
    }
  };

  const handleUnpinJob = (jobId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Unpin Job Listing',
      message: 'Are you sure you want to unpin this job from the top of the homepage feed? It will return to its standard chronological feed position.',
      confirmText: 'Unpin',
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setError(null);
        setSuccessMsg(null);
        try {
          const response = await fetch(`${API_URL}/jobs/${jobId}/unpin`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          setSuccessMsg('Job unpinned successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
          setError(err.message || 'Failed to unpin job.');
        }
      }
    });
  };
  const handleToggleStatus = async (jobId) => {
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setSuccessMsg(`Job status updated successfully to ${result.status}!`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to toggle job status.');
    }
  };

  const handleDeleteDrive = (driveId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Walk-in Drive',
      message: 'Are you sure you want to delete this walk-in drive? This action cannot be undone and will permanently remove it from the portal.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setError(null);
        setSuccessMsg(null);
        try {
          const response = await fetch(`${API_URL}/drives/${driveId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          setSuccessMsg('Walk-in drive deleted successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
          setError(err.message || 'Failed to delete walk-in drive.');
        }
      }
    });
  };

  const handlePostContact = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);

    const contactData = {
      companyName: contactCompany,
      hrEmail: contactHrEmail,
      contactEmail: contactEmail,
      phone: contactPhone
    };

    try {
      const response = await fetch(`${API_URL}/hr-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setSuccessMsg('HR contact added successfully!');
      setContactCompany('');
      setContactHrEmail('');
      setContactEmail('');
      setContactPhone('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add HR contact.');
    }
  };

  const handleDeleteContact = (contactId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete HR Contact',
      message: 'Are you sure you want to delete this HR contact? This action cannot be undone and will permanently remove it from the directory.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setError(null);
        setSuccessMsg(null);
        try {
          const response = await fetch(`${API_URL}/hr-contacts/${contactId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          setSuccessMsg('HR contact deleted successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
          setError(err.message || 'Failed to delete HR contact.');
        }
      }
    });
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch(`${API_URL}/resumes/download-csv`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to generate CSV export.');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'resumes_database_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccessMsg('Resumes CSV report downloaded successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminBroadcast = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);

    if (!adminBroadcastContent || !adminBroadcastContent.trim()) {
      setError('Broadcast message content cannot be empty.');
      return;
    }

    setAdminBroadcastLoading(true);
    try {
      const response = await fetch(`${API_URL}/messages/broadcast-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: adminBroadcastContent })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send broadcast.');
      }

      setSuccessMsg(`Global broadcast sent successfully to ${data.count} candidates!`);
      setAdminBroadcastContent('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send global broadcast.');
    } finally {
      setAdminBroadcastLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <span className="text-sm font-semibold text-slate-500">Loading Dashboard...</span>
      </div>
    );
  }

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Dashboard Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Admin Control Panel</h1>
              <p className="text-xs text-slate-400 font-medium">Manage job portal listings, verify users, view analytics</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm mb-8">
            <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm mb-8">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Chart Section */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm mb-8 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {analyticsTab === 'growth' ? 'User Growth Analytics' : 'Candidate Gender Distribution'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {analyticsTab === 'growth' 
                  ? 'Daily registered candidate curve index' 
                  : 'Gender demographics for registered Job Seekers'}
              </p>
            </div>

            {/* Sliding Pill Toggle Button */}
            <div className="flex p-0.5 bg-slate-100 rounded-xl w-full sm:w-auto shrink-0 border border-slate-200/40">
              <button
                type="button"
                onClick={() => setAnalyticsTab('growth')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  analyticsTab === 'growth'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                User Growth
              </button>
              <button
                type="button"
                onClick={() => setAnalyticsTab('gender')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  analyticsTab === 'gender'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Gender Breakdown
              </button>
            </div>
          </div>
          
          {analyticsTab === 'growth' ? (
            /* Recharts Area Chart */
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Recharts Pie Chart */
            <div className="h-[480px] w-full animate-fadeIn">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.genderStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={160}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.genderStats.map((entry, index) => {
                      let color = '#94a3b8'; // Slate (Prefer not to say / fallback)
                      if (entry.name === 'Male') color = '#3b82f6'; // Blue
                      else if (entry.name === 'Female') color = '#ec4899'; // Pink
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Total Registered Users</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats.summary.totalUsers}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">HRs: {stats.summary.totalHR} | Seekers: {stats.summary.totalSeekers}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Active Job Posts</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats.summary.totalJobs}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Total Resumes: {resumes.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Users Online Today</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats.summary.onlineToday}</span>
              <span className="text-[10px] text-emerald-500 font-medium block mt-0.5">● Live visits tracked</span>
            </div>
          </div>

        </div>

        {/* Console Tab Toggles */}
        <div className="flex gap-2 mb-8 bg-slate-200/60 p-1.5 rounded-2xl max-w-md">
          <button
            onClick={() => {
              setActiveTab('jobs');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'jobs' 
                ? 'bg-white text-blue-600 shadow-sm font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Job Posts</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('drives');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'drives' 
                ? 'bg-white text-blue-600 shadow-sm font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Walk-in Drives</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('contacts');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'contacts' 
                ? 'bg-white text-blue-600 shadow-sm font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>HR Directory</span>
          </button>
        </div>

        {/* Growth Curve Chart and Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* Form container (Jobs vs Drives) */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            
            {activeTab === 'jobs' ? (
              // 1. Post job form
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Plus className="h-5 w-5 text-blue-500" />
                  <span>Post New Job</span>
                </h2>
                <p className="text-xs text-slate-400 mb-6 font-medium">Add roles to the public job boards</p>

                <form onSubmit={handlePostJob} className="space-y-4" noValidate>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">JOB ROLE *</label>
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">COMPANY *</label>
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">LOCATION *</label>
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">JOB TYPE</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">OPEN TILL (DAYS) *</label>
                      <input
                        type="number"
                        required
                        value={openDays}
                        onChange={(e) => setOpenDays(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">VACANCIES *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={openings}
                        onChange={(e) => setOpenings(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">ESTABLISHED *</label>
                      <input
                        type="text"
                        required
                        value={establishedDate}
                        onChange={(e) => setEstablishedDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">HR PHONE *</label>
                      <input
                        type="tel"
                        required
                        value={hrPhone}
                        onChange={(e) => setHrPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">HR EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-400 block">DESCRIPTION *</label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('b', 'admin-job-desc')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-bold cursor-pointer"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('i', 'admin-job-desc')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] italic cursor-pointer"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('u', 'admin-job-desc')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] underline cursor-pointer"
                          title="Underline"
                        >
                          U
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="admin-job-desc"
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none font-mono"
                      placeholder="You can use B, I, U buttons to format text"
                    ></textarea>
                    {description && (
                      <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 max-h-24 overflow-y-auto">
                        <span className="font-bold block uppercase tracking-wider mb-1 text-[8px] text-slate-400">Preview:</span>
                        <div className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: description }} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">HOW TO APPLY *</label>
                    <textarea
                      required
                      rows={2}
                      value={howToApply}
                      onChange={(e) => setHowToApply(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-md"
                  >
                    Post Job
                  </button>
                </form>
              </>
            ) : activeTab === 'drives' ? (
              // 2. Post drive form
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Plus className="h-5 w-5 text-blue-500" />
                  <span>Post Walk-in Drive</span>
                </h2>
                <p className="text-xs text-slate-400 mb-6 font-medium">Add direct walk-in recruitments to the portal</p>

                <form onSubmit={handlePostDrive} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">TARGET ROLE / PROFILE *</label>
                    <input
                      type="text"
                      required
                      value={driveRole}
                      onChange={(e) => setDriveRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">COMPANY NAME *</label>
                      <input
                        type="text"
                        required
                        value={driveCompany}
                        onChange={(e) => setDriveCompany(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">DRIVE TYPE</label>
                      <select
                        value={driveType}
                        onChange={(e) => setDriveType(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                      >
                        <option value="Immediate Joining">Immediate Joining</option>
                        <option value="Freshers Walk-in">Freshers Walk-in</option>
                        <option value="Internship / Full-time">Internship / Full-time</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">DRIVE DATE *</label>
                      <input
                        type="date"
                        required
                        value={driveDate}
                        onChange={(e) => setDriveDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">TIME WINDOW *</label>
                      <input
                        type="text"
                        required
                        value={driveTime}
                        onChange={(e) => setDriveTime(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">VENUE ADDRESS *</label>
                    <input
                      type="text"
                      required
                      value={driveLocation}
                      onChange={(e) => setDriveLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">GOOGLE MAPS LINK *</label>
                    <input
                      type="url"
                      required
                      value={driveMapsUrl}
                      onChange={(e) => setDriveMapsUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">CONTACT (OPTIONAL)</label>
                    <input
                      type="text"
                      value={driveContact}
                      onChange={(e) => setDriveContact(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">DRIVE REQUIREMENTS *</label>
                    <textarea
                      required
                      rows={3.5}
                      value={driveRequirements}
                      onChange={(e) => setDriveRequirements(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    Post Walk-in Drive
                  </button>
                </form>
              </>
            ) : (
              // 3. Post HR Contact form
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Plus className="h-5 w-5 text-blue-500" />
                  <span>Add HR Contact</span>
                </h2>
                <p className="text-xs text-slate-400 mb-6 font-medium">Add company HR contact details to the directory</p>

                <form onSubmit={handlePostContact} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">COMPANY NAME *</label>
                    <input
                      type="text"
                      required
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">HR EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={contactHrEmail}
                      onChange={(e) => setContactHrEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">CONTACT EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">CONTACT PHONE *</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-md"
                  >
                    Add Contact
                  </button>
                </form>
              </>
            )}

          </div>

          {/* Resumes & Applications Database Manager */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Applicant Resumes database</h2>
                <p className="text-xs text-slate-400 font-medium">Review and download uploaded candidates</p>
              </div>
              
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Download Resumes CSV</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[500px] flex-1">
              {resumes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No resumes uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((r) => (
                    <div key={r._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200/60 transition-all flex flex-col sm:flex-row justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{r.fullName}</h4>
                          {r.jobId && (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold px-2 py-0.5 rounded text-[10px]">
                              {typeof r.jobId === 'object' ? `${r.jobId.role} @ ${r.jobId.company}` : 'Applied Job'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{r.email}</span>
                          {r.phoneNumber && <span>| {r.phoneNumber}</span>}
                          {r.education && <span>| Edu: {r.education}</span>}
                        </div>
                        {r.skills && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {r.skills.map((s, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[9px]">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end shrink-0">
                        {r.fileName ? (
                          <a 
                            href={`${API_URL.replace('/api', '')}/uploads/${r.fileName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download CV</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl select-none">
                            <FileText className="h-3.5 w-3.5" />
                            <span>No CV Uploaded</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Global Broadcast Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <Send className="h-5 w-5 text-blue-500" />
                <span>Global Broadcast</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-medium">Send real-time alerts to all registered candidates</p>

              <form onSubmit={handleAdminBroadcast} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">BROADCAST MESSAGE *</label>
                  <textarea
                    required
                    rows={4}
                    value={adminBroadcastContent}
                    onChange={(e) => setAdminBroadcastContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-none resize-none"
                    placeholder="Type message to broadcast to everyone..."
                  />
                </div>

                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Attention:</strong> This message will be sent instantly as a real-time notification to all <strong>{stats.summary.totalSeekers || 0}</strong> registered candidates.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={adminBroadcastLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{adminBroadcastLoading ? 'Broadcasting...' : 'Broadcast Message'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Existing Listings Managers Table (Jobs or Drives) */}
        {activeTab === 'jobs' ? (
          // A. JOB LISTINGS TABLE
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Manage Jobs</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Pin active jobs to the top of home listings or delete posts</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Job Role</th>
                    <th className="pb-3 font-semibold">Company</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Intake Status</th>
                    <th className="pb-3 font-semibold text-center">Intake Action</th>
                    <th className="pb-3 font-semibold">Pin Status</th>
                    <th className="pb-3 font-semibold text-center">Pin Action</th>
                    <th className="pb-3 font-semibold text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs sm:text-sm text-slate-600">
                  {jobs.map((j) => (
                    <tr key={j._id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800">{j.role}</td>
                      <td className="py-3">{j.company}</td>
                      <td className="py-3">{j.location}</td>
                      <td className="py-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          {j.type}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          j.status === 'Open' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {j.status || 'Open'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(j._id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            j.status === 'Open'
                              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {j.status === 'Open' ? (
                            <>
                              <Lock className="h-3 w-3" />
                              <span>Stop Intake</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3" />
                              <span>Open Intake</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3">
                        {j.isPinned ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                            <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>Pinned until {new Date(j.pinnedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Standard Feed</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {j.isPinned ? (
                          <button
                            onClick={() => handleUnpinJob(j._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-amber-250 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer shadow-sm"
                          >
                            <Pin className="h-3.5 w-3.5 rotate-45 text-amber-600" />
                            <span>Unpin</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePinJob(j._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Pin className="h-3.5 w-3.5 text-slate-400" />
                            <span>Pin Job</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => handleDeleteJob(j._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'drives' ? (
          // B. WALK-IN DRIVES TABLE
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Manage Walk-in Drives</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Review and delete active direct recruitments</p>

            <div className="overflow-x-auto">
              {drives.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  No walk-in drives posted yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Drive Role / Company</th>
                      <th className="pb-3 font-semibold">Date & Time</th>
                      <th className="pb-3 font-semibold">Venue Address</th>
                      <th className="pb-3 font-semibold">Drive Type</th>
                      <th className="pb-3 font-semibold text-center">Google Maps Link</th>
                      <th className="pb-3 font-semibold text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs sm:text-sm text-slate-600">
                    {drives.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <span className="font-semibold block text-slate-800">{d.role}</span>
                          <span className="text-slate-400 text-xs">{d.company}</span>
                        </td>
                        <td className="py-3">
                          <span className="font-medium block text-slate-700">{d.date}</span>
                          <span className="text-slate-400 text-[10px]">{d.time}</span>
                        </td>
                        <td className="py-3 max-w-[200px] truncate" title={d.location}>
                          {d.location}
                        </td>
                        <td className="py-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                            {d.type}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <a 
                            href={d.googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            <span>View Location</span>
                          </a>
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => handleDeleteDrive(d._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          // C. HR CONTACTS TABLE
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Manage HR Directory</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Verify, edit, or delete HR directory listings</p>

            <div className="overflow-x-auto">
              {hrContacts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  No HR contacts posted yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Company Name</th>
                      <th className="pb-3 font-semibold">HR Email</th>
                      <th className="pb-3 font-semibold">Contact Email</th>
                      <th className="pb-3 font-semibold">Contact Phone</th>
                      <th className="pb-3 font-semibold text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs sm:text-sm text-slate-600">
                    {hrContacts.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">{c.companyName}</td>
                        <td className="py-3 font-medium text-slate-700">{c.hrEmail}</td>
                        <td className="py-3 text-slate-600">{c.contactEmail}</td>
                        <td className="py-3 text-slate-600">{c.phone}</td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => handleDeleteContact(c._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>      {/* Simple Pop-up: Pin Job Duration Calendar Picker */}
      {pinModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-sm w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Pin className="h-4.5 w-4.5 text-amber-500 fill-amber-500/20" />
              <span>Pin Job Listing</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Set dynamic homepage pin duration</p>
            
            <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs space-y-1">
              <div><span className="font-semibold text-slate-500">Role:</span> <span className="font-bold text-slate-800">{pinModal.role}</span></div>
              <div><span className="font-semibold text-slate-500">Company:</span> <span className="font-bold text-slate-800">{pinModal.company}</span></div>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">CHOOSE CALENDAR END DATE *</label>
                <input
                  type="date"
                  min={tomorrowStr}
                  value={pinDate}
                  onChange={(e) => setPinDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {pinDaysCount > 0 ? (
                <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Pinning for <strong className="text-xs font-black">{pinDaysCount}</strong> {pinDaysCount === 1 ? 'day' : 'days'}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                  Select a future date on the calendar.
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPinModal({ isOpen: false, jobId: null, role: '', company: '' })}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPinJob}
                disabled={pinDaysCount <= 0}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-405 cursor-pointer disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Pin Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Pop-up: Generic Confirmation Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-xs w-full p-5 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">{confirmModal.message}</p>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors ${
                  confirmModal.isDanger 
                    ? 'bg-red-650 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
