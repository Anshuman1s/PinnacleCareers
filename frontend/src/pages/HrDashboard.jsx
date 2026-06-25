import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Users, Briefcase, Activity, AlertCircle, 
  Trash2, Plus, LogOut, CheckCircle2, ShieldCheck, 
  Download, FileText, FileSpreadsheet, Lock, Unlock,
  Calendar, MapPin, Search, MessageSquare, Send, X
} from 'lucide-react';

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

export default function HrDashboard() {
  const { user, token, logout, API_URL, loading: authLoading, socket } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if not HR
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'HR') {
        navigate('/auth?mode=login');
      }
    }
  }, [user, authLoading, navigate]);

  // Dashboard state tabs: 'jobs' or 'drives'
  const [activeTab, setActiveTab] = useState('jobs');

  const [jobs, setJobs] = useState([]);
  const [drives, setDrives] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Post job form states
  const [role, setRole] = useState('');
  const [company, setCompany] = useState(user?.companyName || '');
  const [location, setLocation] = useState(user?.currentLocation || '');
  const [type, setType] = useState('Full-time');
  const [description, setDescription] = useState('');
  const [openDays, setOpenDays] = useState('');
  const [openings, setOpenings] = useState('');
  const [establishedDate, setEstablishedDate] = useState('');
  const [howToApply, setHowToApply] = useState('');
  const [hrEmail, setHrEmail] = useState(user?.email || '');
  const [hrPhone, setHrPhone] = useState(user?.phoneNumber || '');

  // Post walk-in drive form states (Defaults removed, placeholders removed)
  const [driveRole, setDriveRole] = useState('');
  const [driveCompany, setDriveCompany] = useState(user?.companyName || '');
  const [driveLocation, setDriveLocation] = useState(user?.currentLocation || '');
  const [driveDate, setDriveDate] = useState('');
  const [driveTime, setDriveTime] = useState('');
  const [driveMapsUrl, setDriveMapsUrl] = useState('');
  const [driveRequirements, setDriveRequirements] = useState('');
  const [driveType, setDriveType] = useState('Immediate Joining');
  const [driveContact, setDriveContact] = useState('');
  const [resumeSearchQuery, setResumeSearchQuery] = useState('');
  const [selectedJobForCsv, setSelectedJobForCsv] = useState('');
  
  // Recruiter Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null); // { userId, fullName }
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef(null);

  // Recruiter Broadcast states
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Auto-scroll chat window
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Recruiter Socket Listener
  useEffect(() => {
    if (!socket || !chatOpen || !chatUser) return;

    const handleIncomingMessage = (msg) => {
      const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
      const receiverIdStr = typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId;

      if (
        senderIdStr === chatUser.userId || 
        receiverIdStr === chatUser.userId
      ) {
        setChatMessages((prev) => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Mark read immediately
        if (senderIdStr === chatUser.userId) {
          fetch(`${API_URL}/messages/read/${chatUser.userId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(console.error);
        }
      }
    };

    socket.on('receive_private_message', handleIncomingMessage);

    return () => {
      socket.off('receive_private_message', handleIncomingMessage);
    };
  }, [socket, chatOpen, chatUser, token, API_URL]);

  const openChatModal = async (candidate) => {
    setChatUser({
      userId: candidate.userId,
      fullName: candidate.fullName
    });
    setChatOpen(true);
    setChatMessages([]);
    setNewMessageText('');

    try {
      const res = await fetch(`${API_URL}/messages/history/${candidate.userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(data);
      }

      await fetch(`${API_URL}/messages/read/${candidate.userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Error fetching conversation:', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !chatUser || !socket) return;

    const messageData = {
      senderId: user._id,
      receiverId: chatUser.userId,
      content: newMessageText.trim()
    };

    socket.emit('send_private_message', messageData);
    setNewMessageText('');
  };



  const fetchHrDashboardData = async () => {
    try {
      // 1. Fetch Jobs
      const jobsRes = await fetch(`${API_URL}/jobs`);
      const jobsData = await jobsRes.json();
      if (!jobsRes.ok) throw new Error(jobsData.message);
      const myJobs = jobsData.filter(j => j.postedBy === user?._id || j.company === user?.companyName);
      setJobs(myJobs);

      // 2. Fetch Walk-in Drives
      const drivesRes = await fetch(`${API_URL}/drives`);
      const drivesData = await drivesRes.json();
      if (!drivesRes.ok) throw new Error(drivesData.message);
      const myDrives = drivesData.filter(d => d.postedBy === user?._id || d.company === user?.companyName);
      setDrives(myDrives);

      // 3. Fetch Resumes
      const resumesRes = await fetch(`${API_URL}/resumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resumesData = await resumesRes.json();
      if (!resumesRes.ok) throw new Error(resumesData.message);
      setResumes(resumesData);
      
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Running in offline demonstration mode.');
      
      // Fallbacks
      setJobs([
        { _id: '1', role: 'Frontend Engineer (React)', company: user?.companyName || 'Razorpay', location: 'Bangalore', type: 'Full-time', openDays: 15, openings: 5, status: 'Open' },
        { _id: '2', role: 'React Developer Internship', company: user?.companyName || 'Razorpay', location: 'Remote', type: 'Internship', openDays: 30, openings: 2, status: 'Closed' }
      ]);

      setDrives([
        { _id: '1', company: user?.companyName || 'Razorpay', role: 'Frontend & Full Stack Engineers', date: 'June 18, 2026', time: '09:00 AM - 04:00 PM', location: 'Razorpay HQ, SJR Cyber, Koramangala, Bangalore', googleMapsUrl: 'https://maps.google.com', requirements: 'React developers', type: 'Immediate Joining' }
      ]);

      setResumes([
        { _id: '1', fullName: 'Jane Doe', email: 'jane@example.com', phoneNumber: '9876543210', skills: ['React', 'CSS'], experience: '1 Year', education: 'B.Tech', fileName: 'jane_resume.pdf', jobId: { role: 'Frontend Engineer (React)', company: user?.companyName || 'Razorpay' } },
        { _id: '2', fullName: 'John Smith', email: 'john@example.com', phoneNumber: '8888888888', skills: ['Node.js', 'MongoDB'], experience: '2 Years', education: 'MCA', fileName: 'john_cv.docx', jobId: { role: 'React Developer Internship', company: user?.companyName || 'Razorpay' } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'HR') {
      fetchHrDashboardData();
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
      setDescription('');
      setHowToApply('');
      setOpenDays('');
      setOpenings('');
      setEstablishedDate('');
      
      fetchHrDashboardData();
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
      setDriveDate('');
      setDriveTime('');
      setDriveMapsUrl('');
      setDriveRequirements('');
      setDriveContact('');
      
      fetchHrDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to post walk-in drive.');
    }
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
      fetchHrDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
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
      fetchHrDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDrive = async (driveId) => {
    if (!window.confirm('Are you sure you want to delete this walk-in drive?')) return;
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
      fetchHrDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete walk-in drive.');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      let url = `${API_URL}/resumes/download-csv`;
      if (selectedJobForCsv) {
        url += `?jobId=${selectedJobForCsv}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to generate CSV export.');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      let filename = 'registered_candidates.csv';
      if (selectedJobForCsv) {
        const selectedJob = jobs.find(j => j._id === selectedJobForCsv);
        if (selectedJob) {
          filename = `candidates_${selectedJob.role.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccessMsg('Registered candidates CSV report downloaded!');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredResumes = resumes.filter((r) => {
    // 1. Filter by selected job dropdown first
    if (selectedJobForCsv) {
      const targetJobId = (r.jobId && typeof r.jobId === 'object') ? r.jobId._id : r.jobId;
      if (targetJobId !== selectedJobForCsv) {
        return false;
      }
    }

    // 2. Filter by search query
    const query = resumeSearchQuery.toLowerCase();
    const fullName = r.fullName ? r.fullName.toLowerCase() : '';
    const email = r.email ? r.email.toLowerCase() : '';
    const phone = r.phoneNumber ? r.phoneNumber.toLowerCase() : '';
    const skills = r.skills ? r.skills.map(s => s.toLowerCase()).join(' ') : '';
    const edu = r.education ? r.education.toLowerCase() : '';
    const jobRole = (r.jobId && typeof r.jobId === 'object' && r.jobId.role) ? r.jobId.role.toLowerCase() : '';

    return (
      fullName.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      skills.includes(query) ||
      edu.includes(query) ||
      jobRole.includes(query)
    );
  });

  const handleToggleSelectCandidate = (userId) => {
    if (!userId) return;
    setSelectedCandidateIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const eligibleFilteredResumes = filteredResumes.filter(r => r.userId);
  const allFilteredSelected = eligibleFilteredResumes.length > 0 && eligibleFilteredResumes.every(r => selectedCandidateIds.includes(r.userId));
  const someFilteredSelected = eligibleFilteredResumes.length > 0 && eligibleFilteredResumes.some(r => selectedCandidateIds.includes(r.userId)) && !allFilteredSelected;

  const handleSelectAllFiltered = () => {
    const eligibleIds = eligibleFilteredResumes.map(r => r.userId);
    if (eligibleIds.length === 0) return;

    if (allFilteredSelected) {
      setSelectedCandidateIds(prev => prev.filter(id => !eligibleIds.includes(id)));
    } else {
      setSelectedCandidateIds(prev => {
        const next = [...prev];
        eligibleIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastContent.trim() || selectedCandidateIds.length === 0) return;

    setBroadcastLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/messages/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientIds: selectedCandidateIds,
          content: broadcastContent.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccessMsg(`Circulated message successfully to ${selectedCandidateIds.length} candidate(s)!`);
      setSelectedCandidateIds([]);
      setBroadcastContent('');
      setBroadcastModalOpen(false);
    } catch (err) {
      console.error('Broadcast failed:', err);
      setError(err.message || 'Failed to circulate message.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const getSubTitleText = () => {
    if (selectedJobForCsv) {
      const selectedJob = jobs.find(j => j._id === selectedJobForCsv);
      const roleName = selectedJob ? selectedJob.role : 'this position';
      return `Showing ${filteredResumes.length} ${filteredResumes.length === 1 ? 'candidate' : 'candidates'} applied for ${roleName}`;
    }
    return `Showing all company registrations (Total: ${filteredResumes.length} candidates)`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <span className="text-sm font-semibold text-slate-500">Loading Recruiter Dashboard...</span>
      </div>
    );
  }

  if (!user || user.role !== 'HR') return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Dashboard Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">HR Recruiter Console</h1>
              <p className="text-xs text-slate-400 font-medium">Post jobs, control registrations, list walk-in drives, and download candidate sheets</p>
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

        {/* Console Tab Toggles */}
        <div className="flex gap-2 mb-8 bg-slate-200/60 p-1.5 rounded-2xl max-w-sm">
          <button
            onClick={() => {
              setActiveTab('jobs');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'jobs' 
                ? 'bg-white text-indigo-700 shadow-sm font-extrabold' 
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
                ? 'bg-white text-indigo-700 shadow-sm font-extrabold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Walk-in Drives</span>
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

        {/* Form and Database Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Post Form (Jobs OR Drives Tab) */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            
            {activeTab === 'jobs' ? (
              // 1. Post job form
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  <span>Post New Job</span>
                </h2>
                <p className="text-xs text-slate-400 mb-6 font-medium">Add roles representing <b>{user.companyName}</b></p>

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
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">COMPANY</label>
                      <input
                        type="text"
                        disabled
                        value={company}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs focus:outline-none"
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
                          onClick={() => handleInsertFormat('b', 'hr-job-desc')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-bold cursor-pointer"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('i', 'hr-job-desc')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] italic cursor-pointer"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('u', 'hr-job-desc')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] underline cursor-pointer"
                          title="Underline"
                        >
                          U
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="hr-job-desc"
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
                    Post Job Opening
                  </button>
                </form>
              </>
            ) : (
              // 2. Post walk-in drive form - Placeholders and Defaults Removed
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  <span>Post Walk-in Drive</span>
                </h2>
                <p className="text-xs text-slate-400 mb-6 font-medium">Add direct walk-in recruitments for <b>{user.companyName}</b></p>

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
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">COMPANY</label>
                      <input
                        type="text"
                        disabled
                        value={driveCompany}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs focus:outline-none"
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    Post Walk-in Drive
                  </button>
                </form>
              </>
            )}

          </div>

          {/* Manage Resumes List Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registered Students Database</h2>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">{getSubTitleText()}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate, email, skills..."
                    value={resumeSearchQuery}
                    onChange={(e) => setResumeSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-semibold text-slate-700 w-full sm:w-56"
                  />
                </div>

                <select
                  value={selectedJobForCsv}
                  onChange={(e) => setSelectedJobForCsv(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="">All Jobs</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.role}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer shrink-0"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Selection Controls & Circulate Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <button
                onClick={handleSelectAllFiltered}
                disabled={eligibleFilteredResumes.length === 0}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-650 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someFilteredSelected;
                  }}
                  onChange={() => {}} // Handled by button click
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 pointer-events-none"
                />
                <span>Select All Filtered</span>
              </button>

              {selectedCandidateIds.length > 0 ? (
                <button
                  onClick={() => setBroadcastModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer animate-pulse"
                >
                  <Send className="h-4 w-4" />
                  <span>Circulate Message ({selectedCandidateIds.length})</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Check candidates to select manually
                </span>
              )}
            </div>
            {/* Applicant Count Box Card */}
            <div className="mb-6 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Applicants Counter</span>
              <span className="text-4xl font-extrabold text-indigo-700 block mt-1">
                {filteredResumes.length}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                {selectedJobForCsv 
                  ? `candidates applied for the selected position`
                  : `total candidate registrations for your company`}
              </span>
            </div>

            <div className="overflow-y-auto max-h-[500px] flex-1">
              {filteredResumes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {resumes.length === 0 ? 'No students registered yet.' : 'No matching candidates found.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResumes.map((r) => (
                    <div key={r._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200/60 transition-all flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                      <div className="flex items-start gap-3 flex-grow min-w-0">
                        {r.userId && (
                          <input
                            type="checkbox"
                            checked={selectedCandidateIds.includes(r.userId)}
                            onChange={() => handleToggleSelectCandidate(r.userId)}
                            className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                        )}
                        <div className="space-y-1 flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{r.fullName}</h4>
                          {r.jobId && (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold px-2 py-0.5 rounded text-[10px]">
                              {typeof r.jobId === 'object' ? r.jobId.role : 'Applied Job'}
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
                    </div>
                    <div className="flex items-center justify-end shrink-0 gap-2">
                        {r.userId && (
                          <button
                            onClick={() => openChatModal(r)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Message</span>
                          </button>
                        )}
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

        </div>

        {/* Existing Listings Managers Table (Toggle display by Active Tab) */}
        {activeTab === 'jobs' ? (
          // A. JOB LISTINGS TABLE
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Your Posted Openings</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Control student applications intake and status</p>

            <div className="overflow-x-auto">
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  You haven't posted any jobs yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Job Role</th>
                      <th className="pb-3 font-semibold">Location</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Candidates to Hire / Days</th>
                      <th className="pb-3 font-semibold">Registration Status</th>
                      <th className="pb-3 font-semibold text-center">Toggle Registration</th>
                      <th className="pb-3 font-semibold text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs sm:text-sm text-slate-600">
                    {jobs.map((j) => (
                      <tr key={j._id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">{j.role}</td>
                        <td className="py-3">{j.location}</td>
                        <td className="py-3">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                            {j.type}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 font-medium">{j.openings || 1} candidates / {j.openDays} days</td>
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
              )}
            </div>
          </div>
        ) : (
          // B. WALK-IN DRIVES TABLE
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Your Posted Walk-in Drives</h2>
            <p className="text-xs text-slate-400 mb-6 font-medium">Review and delete direct direct recruitments</p>

            <div className="overflow-x-auto">
              {drives.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  You haven't posted any walk-in drives yet.
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
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
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
        )}

      </div>

      {/* Floating Recruiter Chat Modal */}
      {chatOpen && chatUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg h-[550px] flex flex-col overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold truncate">Chat with {chatUser.fullName}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Real-time candidate messaging channel</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                  No message history. Send a message to initiate contact!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const msgSenderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                  const isMe = msgSenderId === user._id;

                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm font-medium ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <span
                          className={`text-[8px] sm:text-[9px] block mt-1 text-right ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-semibold text-slate-700 font-medium"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer shrink-0 flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Message Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold">Circulate Message</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Send a message to multiple recipients</p>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendBroadcast} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-2xl p-4 text-xs font-semibold text-indigo-700">
                You are circulating this message to <span className="font-extrabold text-indigo-750">{selectedCandidateIds.length}</span> selected candidate(s).
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">MESSAGE CONTENT</label>
                <textarea
                  required
                  rows={6}
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Enter message content to circulate..."
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading || !broadcastContent.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  {broadcastLoading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Circulate Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
