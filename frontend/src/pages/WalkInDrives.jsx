import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, MapPin, Building2, Clock, ChevronRight, AlertCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WalkInDrives() {
  const { API_URL } = useContext(AuthContext);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleMaps, setVisibleMaps] = useState({});

  const toggleMap = (id) => {
    setVisibleMaps((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/drives`);
      if (!response.ok) {
        throw new Error('Failed to load walk-in drives');
      }
      const data = await response.json();
      setDrives(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Running in offline demo mode.');
      
      // Fallback local drives
      setDrives([
        {
          _id: '1',
          company: 'Razorpay',
          role: 'Frontend & Full Stack Engineers',
          date: 'June 18, 2026',
          time: '09:00 AM - 04:00 PM',
          location: 'Razorpay HQ, SJR Cyber, Koramangala, Bangalore',
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Razorpay+HQ+SJR+Cyber+Koramangala+Bangalore',
          requirements: '1-4 years of experience with React, Node.js, and TypeScript. Carry 2 copies of your printed CV.',
          type: 'Immediate Joining'
        },
        {
          _id: '2',
          company: 'Paytm',
          role: 'Backend Node.js Developers (Junior/Mid)',
          date: 'June 22, 2026',
          time: '10:00 AM - 03:00 PM',
          location: 'Paytm Office, Sector 62, Noida, UP',
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Paytm+Office+Sector+62+Noida',
          requirements: 'Experience building REST APIs with Express & MongoDB. Freshers with good knowledge are welcome.',
          type: 'Internship / Full-time'
        },
        {
          _id: '3',
          company: 'Zoho Corporation',
          role: 'Software Developers & Quality Analysts',
          date: 'July 05, 2026',
          time: '08:30 AM - 01:00 PM',
          location: 'Zoho Estancia IT Park, Guduvanchery, Chennai',
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Zoho+Estancia+IT+Park+Guduvanchery+Chennai',
          requirements: 'Strong problem solving, data structures, and Java/JavaScript logic. Graduates of 2025/2026.',
          type: 'Freshers Walk-in'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Upcoming <span className="text-blue-600">Walk-in Drives</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
            Skip the online queue. Walk in directly, complete your interviews, and get hired on the same day.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm">
            <AlertCircle className="h-4.5 w-4.5 text-blue-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Timeline List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm h-48 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : drives.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200/80 p-8 shadow-sm">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No Walk-in drives scheduled</h3>
            <p className="text-sm text-slate-500 mt-1">Please check back later for upcoming direct walk-in recruitments.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {drives.map((drive, idx) => (
              <motion.div 
                key={drive._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group animate-fadeIn"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  {/* Time / Date Column */}
                  <div className="flex items-start gap-4 shrink-0">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 font-bold">
                      <Calendar className="h-5 w-5 mb-0.5" />
                      <span className="text-[10px] uppercase font-semibold">Drives</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400">DATE & TIME</h3>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{drive.date}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{drive.time}</span>
                      </p>
                    </div>
                  </div>

                  {/* Job details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                        {drive.company}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                        {drive.type}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {drive.role}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 flex items-start gap-1">
                      <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{drive.location}</span>
                    </p>
                    {drive.contact && (
                      <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 mt-1 font-semibold text-blue-600/80">
                        <Phone className="h-3.5 w-3.5" />
                        <span>Contact: {drive.contact}</span>
                      </p>
                    )}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 mt-3">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5 uppercase">REQUIREMENTS & INSTRUCTIONS</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {drive.requirements}
                      </p>
                    </div>
                    {/* Collapsible Inline Google Map */}
                    {visibleMaps[drive._id] && (
                      <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 mt-4 shadow-sm animate-fadeIn relative bg-slate-100">
                        <iframe
                          title={`Map of ${drive.company}`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(drive.location + ' ' + drive.company)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          allowFullScreen
                          loading="lazy"
                        ></iframe>
                      </div>
                    )}
                  </div>

                  {/* View Map Button (Toggles Inline / Opens in new tab) */}
                  <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
                    <button 
                      onClick={() => toggleMap(drive._id)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-3 rounded-2xl transition-all shadow-md cursor-pointer border border-blue-500 hover:shadow-blue-500/10 active:scale-95"
                    >
                      <span>{visibleMaps[drive._id] ? 'Hide Map Location' : 'See Map Location'}</span>
                      <ChevronRight className={`h-4 w-4 transform transition-transform duration-200 ${visibleMaps[drive._id] ? 'rotate-90' : ''}`} />
                    </button>
                    <a 
                      href={drive.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-auto inline-flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] px-4 py-2 rounded-xl transition-all border border-slate-800 cursor-pointer text-center"
                    >
                      <span>Open Google Maps</span>
                    </a>
                  </div>

                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
