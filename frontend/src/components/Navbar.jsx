import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Briefcase, UploadCloud, Calendar, User, LogOut, Menu, X, LayoutDashboard, ChevronDown, Bell, MessageSquare, Send } from 'lucide-react';
import img from '/logo.png'

export default function Navbar() {
  const { user, logout, token, API_URL, socket } = useContext(AuthContext);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { userId, fullName, role }
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [consentGranted, setConsentGranted] = useState(
    localStorage.getItem('notificationConsent') === 'granted'
  );
  const [showConsentPrompt, setShowConsentPrompt] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Fetch unread notifications on mount/login
  useEffect(() => {
    if (user && user.role === 'JobSeeker') {
      fetchUnreadNotifications();
      
      if (localStorage.getItem('notificationConsent') !== 'granted') {
        setShowConsentPrompt(true);
      }
    }
  }, [user]);

  // Real-time socket message handler
  useEffect(() => {
    if (!socket || !user) return;

    const handleMsg = (msg) => {
      const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
      const receiverIdStr = typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId;

      // If active chat is open with this sender
      if (activeChat && (
        senderIdStr === activeChat.userId || 
        receiverIdStr === activeChat.userId
      )) {
        setChatMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Mark as read immediately on backend
        if (senderIdStr === activeChat.userId) {
          fetch(`${API_URL}/messages/read/${activeChat.userId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(console.error);
        }
        return;
      }

      // If we are a JobSeeker and the message is received by us, notify
      if (user.role === 'JobSeeker' && receiverIdStr === user._id) {
        setNotifications(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [msg, ...prev];
        });

        setToastMessage(msg);
        setShowToast(true);
        
        // Show native notification if allowed
        if (Notification.permission === 'granted') {
          const senderName = msg.senderId?.fullName || 'HR Recruiter';
          new Notification(`New Message from ${senderName}`, {
            body: msg.content
          });
        }
      }
    };

    socket.on('receive_private_message', handleMsg);

    return () => {
      socket.off('receive_private_message', handleMsg);
    };
  }, [socket, user, activeChat, token, API_URL]);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Error fetching unread notifications:', err);
    }
  };

  const handleGrantConsent = async () => {
    localStorage.setItem('notificationConsent', 'granted');
    setConsentGranted(true);
    setShowConsentPrompt(false);
    
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission status:', permission);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const senders = [...new Set(notifications.map(n => n.senderId?._id).filter(Boolean))];
      await Promise.all(
        senders.map(senderId => 
          fetch(`${API_URL}/messages/read/${senderId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.warn('Error marking all notifications read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    setNotificationsDropdownOpen(false);
    
    const sender = n.senderId || {};
    const senderId = sender._id;
    const senderName = sender.fullName || 'HR Recruiter';
    
    try {
      await fetch(`${API_URL}/messages/read/${senderId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(item => {
          const itemSenderId = typeof item.senderId === 'object' ? item.senderId._id : item.senderId;
          return itemSenderId === senderId ? { ...item, read: true } : item;
        })
      );
    } catch (err) {
      console.warn('Error marking read:', err);
    }

    setActiveChat({
      userId: senderId,
      fullName: senderName,
      role: sender.role || 'HR'
    });

    try {
      const res = await fetch(`${API_URL}/messages/history/${senderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(data);
      }
    } catch (err) {
      console.warn('Error fetching chat history:', err);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !socket) return;

    const msgData = {
      senderId: user._id,
      receiverId: activeChat.userId,
      content: newMessage.trim()
    };

    socket.emit('send_private_message', msgData);
    setNewMessage('');
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    setNotificationsDropdownOpen(false);
  };

  const toggleNotificationsDropdown = () => {
    setNotificationsDropdownOpen(!notificationsDropdownOpen);
    setUserDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => 
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive(path) 
        ? 'text-blue-600 bg-blue-50/80 font-semibold' 
        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
    }`;

  // Helper check: Hide Upload Resume if user is HR
  const showUploadResume = !user || user.role !== 'HR';

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[98%] max-w-[1400px] bg-white/85 border border-slate-200/50 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/15 transition-all duration-300">
      <div className="mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              
              {/* <h2 className="font-questrial text-xl sm:text-2xl font-light tracking-wide select-none">
                <span className="text-[#1E73FF]">Pinnacle</span>
                <span className="text-[#001F5C] ml-1.5">Careers</span>
              </h2> */}
<img
  src={img}
  alt="Pinnacle Careers Logo"
  className="h-10 w-auto object-contain mix-blend-multiply"
/>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-3 lg:gap-5">
            <Link to="/" className={linkClass('/')}>
              Home
            </Link>
            <Link to="/hr-directory" className={linkClass('/hr-directory')}>
              HR Directory
            </Link>
            <Link to="/walk-in-drives" className={linkClass('/walk-in-drives')}>
              <Calendar className="h-4 w-4 text-slate-400" />
              Walk-in Drive
            </Link>
            {showUploadResume && (
              <Link to="/upload-resume" className={linkClass('/upload-resume')}>
                <UploadCloud className="h-4 w-4 text-slate-400" />
                Upload Resume
              </Link>
            )}
          </div>

          {/* Desktop Auth buttons */}
          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            {user && user.role === 'JobSeeker' && (
              <div className="relative">
                <button
                  onClick={toggleNotificationsDropdown}
                  className="relative p-2 text-slate-650 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 z-50 animate-slideDown">
                    <div className="px-3 py-2 flex justify-between items-center border-b border-slate-100 gap-2">
                      <span className="text-xs font-bold text-slate-900">Messages & Notifications</span>
                      <div className="flex items-center gap-2">
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setNotificationsDropdownOpen(false)}
                          className="text-slate-450 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                          aria-label="Close notifications"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto mt-1.5 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const sender = n.senderId || {};
                          const senderName = sender.fullName || 'Recruiter';
                          const senderRole = sender.role || 'HR';
                          const isUnread = !n.read;
                          
                          return (
                            <button
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex gap-2.5 items-start ${
                                isUnread 
                                  ? 'bg-blue-50/50 hover:bg-blue-50' 
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="mt-0.5 bg-blue-100 text-blue-600 p-1.5 rounded-lg shrink-0">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <p className="font-bold text-slate-800 truncate">{senderName}</p>
                                  <span className="text-[8px] text-slate-400">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{senderRole}</p>
                                <p className="text-slate-600 truncate mt-1 font-medium">{n.content}</p>
                              </div>
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-sm bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-750 text-sm font-semibold transition-all cursor-pointer"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>{user.fullName.split(' ')[0]}</span>
                  <span className="text-[10px] bg-blue-500 text-white px-3 py-1 rounded font-light uppercase">
                    {user.role}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-52 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 z-50 animate-slideDown">
                    <div className="px-3 py-2 text-left flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-[10px] text-slate-450 truncate mt-0.5">{user.email}</p>
                      </div>
                      <button
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100 cursor-pointer shrink-0"
                        aria-label="Close menu"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="h-px bg-slate-100 my-1.5" />
                    
                    {user.role === 'Admin' && (
                      <Link 
                        to="/admin-dashboard" 
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    
                    {user.role === 'HR' && (
                      <Link 
                        to="/hr-dashboard" 
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        HR Dashboard
                      </Link>
                    )}

                    <div className="h-px bg-slate-100 my-1.5" />
                    
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }} 
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-55/60 hover:text-red-700 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/auth?mode=login" 
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/auth?mode=signup" 
                  className="rounded-sm bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center gap-2.5">
            {user && user.role === 'JobSeeker' && (
              <button
                onClick={() => {
                  setNotificationsDropdownOpen(!notificationsDropdownOpen);
                  setMobileMenuOpen(false);
                }}
                className="relative p-2 text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setNotificationsDropdownOpen(false);
              }}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Mobile Notifications Popover inside layout */}
            {notificationsDropdownOpen && (
              <div className="absolute top-20 right-4 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-slideDown">
                <div className="px-3 py-2 flex justify-between items-center border-b border-slate-100 gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <div className="flex items-center gap-2">
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[9px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setNotificationsDropdownOpen(false)}
                      className="text-slate-450 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-52 overflow-y-auto mt-1.5 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const sender = n.senderId || {};
                      const senderName = sender.fullName || 'Recruiter';
                      const isUnread = !n.read;
                      
                      return (
                        <button
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left p-2 rounded-lg text-[11px] transition-colors flex gap-2 items-start ${
                            isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="mt-0.5 bg-blue-100 text-blue-600 p-1.5 rounded-lg shrink-0">
                            <MessageSquare className="h-3 w-3" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className="font-bold text-slate-800 truncate">{senderName}</p>
                              <span className="text-[8px] text-slate-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 truncate mt-0.5">{n.content}</p>
                          </div>
                          {isUnread && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2 rounded-b-2xl">
          <Link 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            Home
          </Link>
          <Link 
            to="/hr-directory" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            HR Directory
          </Link>
          <Link 
            to="/walk-in-drives" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            Walk-in Drive
          </Link>
          {showUploadResume && (
            <Link 
              to="/upload-resume" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              <UploadCloud className="h-4 w-4 text-slate-400" />
              Upload Resume
            </Link>
          )}
          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <div className="space-y-2">
                {user.role === 'Admin' && (
                  <Link 
                    to="/admin-dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-blue-700 hover:bg-blue-50"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                {user.role === 'HR' && (
                  <Link 
                    to="/hr-dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-indigo-750 hover:bg-indigo-50"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    HR Dashboard
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>{user.fullName} ({user.role})</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-3">
                <Link 
                  to="/auth?mode=login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-sm border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link 
                  to="/auth?mode=signup" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-sm bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      </nav>

      {/* Notification Consent Prompt Banner */}
      {showConsentPrompt && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 animate-slideUp">
          <div className="flex items-start gap-3">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="text-xs font-bold text-slate-900">Enable Notifications?</h3>
              <p className="text-[11px] text-slate-505 mt-1 leading-relaxed">
                Allow Pinnacle Careers to notify you instantly when recruiters send you messages regarding your job applications.
              </p>
              <div className="flex gap-2.5 mt-3">
                <button
                  onClick={handleGrantConsent}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Enable
                </button>
                <button
                  onClick={() => setShowConsentPrompt(false)}
                  className="bg-slate-55 hover:bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Message Notification Toast */}
      {showToast && toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-905 text-white border border-slate-800 rounded-2xl shadow-2xl p-4 flex gap-3.5 items-start animate-slideUp" style={{ backgroundColor: '#0f172a' }}>
          <div className="bg-indigo-500 text-white p-2 rounded-xl shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="text-xs font-bold">New Message</h4>
            <p className="text-[10px] text-slate-300 font-bold uppercase mt-0.5">
              {toastMessage.senderId?.fullName || 'HR Recruiter'} ({toastMessage.senderId?.role || 'HR'})
            </p>
            <p className="text-xs text-slate-200 mt-1 truncate font-medium">{toastMessage.content}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setShowToast(false);
                  handleNotificationClick(toastMessage);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Open Chat
              </button>
              <button
                onClick={() => setShowToast(false)}
                className="text-slate-400 hover:text-white font-semibold text-[10px] px-2 py-1.5 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Window */}
      {activeChat && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[450px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          {/* Chat Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex justify-between items-center shrink-0">
            <div>
              <h4 className="text-xs font-bold truncate">{activeChat.fullName}</h4>
              <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5 font-bold">
                {activeChat.role} • Recruiter
              </p>
            </div>
            <button
              onClick={() => setActiveChat(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 bg-slate-50 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No messages yet. Start the conversation!
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
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm font-medium ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span
                        className={`text-[8px] block mt-1 text-right ${
                          isMe ? 'text-blue-200' : 'text-slate-400'
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

          {/* Chat Input */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Type your reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow flex items-center justify-center shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
