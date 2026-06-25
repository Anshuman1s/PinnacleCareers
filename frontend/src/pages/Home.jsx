import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import { Search, MapPin, Briefcase, Zap, Building2, ShieldCheck } from 'lucide-react';
import { FaHeart } from "react-icons/fa";

export default function Home() {
  const { API_URL } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchRole, setSearchRole] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [stats, setStats] = useState({
    activeRoles: 0,
    topStartups: 0,
    applicants: 0,
    hrRegistry: 0
  });

  // Reset pagination when the jobs array updates
  useEffect(() => {
    setVisibleCount(6);
  }, [jobs]);

  // Fetch jobs from server
  const fetchJobs = async (roleVal = '', locVal = '') => {
    setLoading(true);
    try {
      let queryStr = '';
      if (roleVal || locVal) {
        queryStr = locVal ? `${roleVal} | ${locVal}` : roleVal;
      }
      const response = await fetch(`${API_URL}/jobs?search=${encodeURIComponent(queryStr)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job postings');
      }
      const data = await response.json();
      setJobs(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the database server. Displaying offline demo jobs.');
      
      // Fallback/Mock Data if server is disconnected or loading
      const mockJobs = [
        {
          _id: '1',
          role: 'Frontend Engineer (React)',
          company: 'Razorpay',
          location: 'Bangalore',
          type: 'Full-time',
          description: 'We are looking for a Frontend Engineer with solid React.js and Tailwind CSS knowledge. You will build user-centric payment dashboards, checkout flows, and financial platforms.',
          openDays: 15,
          establishedDate: '2014',
          howToApply: 'Apply via Pinnacle Careers portal or email careers@razorpay.com',
          hrContact: { email: 'hr@razorpay.com', phone: '8888888888' },
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          role: 'React Developer Internship',
          company: 'Stripe',
          location: 'Remote',
          type: 'Internship',
          description: 'Join our merchant tools team as an intern. Strong knowledge of React, modern CSS, and JavaScript is required. You will work closely with senior mentors.',
          openDays: 30,
          establishedDate: '2010',
          howToApply: 'Apply through the portal.',
          hrContact: { email: 'internships@stripe.com', phone: '7777777777' },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          role: 'Backend Node.js Developer',
          company: 'Paytm',
          location: 'Noida',
          type: 'Full-time',
          description: 'Looking for a Node.js Backend Developer with experience in Express, Mongoose, and JWT authentication. Focus on developing high-throughput APIs.',
          openDays: 45,
          establishedDate: '2010',
          howToApply: 'Send your GitHub profiles to the contact number or email address below.',
          hrContact: { email: 'careers@paytm.com', phone: '9911991199' },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs/stats/public`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching public stats:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(searchRole, searchLocation);
  };

  const clearSearch = () => {
    setSearchRole('');
    setSearchLocation('');
    fetchJobs('', '');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/60 via-indigo-50/30 to-slate-50 py-16 sm:py-24 border-b border-slate-100">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-sm bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200/50 mb-6 shadow-sm">
            {/* <Zap className="h-3.5 w-3.5 text-blue-500 fill-blue-500" /> */}
            <span>Made With Love <FaHeart className='inline-block text-red-600'/> Just for You</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl max-w-3xl mx-auto leading-none mb-6">
            Land your next career with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Pinnacle Careers</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Search internships, walk-in drives, and full-time opportunities. Fast applications,direct HR details, and zero middle-men.
          </p>

          {/* Premium Razorpay-like Split Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-xl border border-slate-200/80 shadow-lg shadow-slate-200/20">
              
              {/* Role/Keyword Input */}
              <div className="flex items-center flex-1 w-full px-3">
                <Search className="h-5 w-5 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Job role, keywords, or 'Internship'"
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                  className="w-full py-2.5 text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 text-sm sm:text-base"
                />
              </div>

              {/* Vertical Divider */}
              <div className="hidden sm:block h-7 w-px bg-slate-200 shrink-0 mx-1"></div>

              {/* Location Input */}
              <div className="flex items-center flex-1 w-full px-3">
                <MapPin className="h-5 w-5 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Location (e.g. Remote, Bangalore)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full py-2.5 text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 text-sm sm:text-base"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                {(searchRole || searchLocation) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1 cursor-pointer font-semibold"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  Search Jobs
                </button>
              </div>

            </div>
          </form>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200/60 p-6 sm:p-8">
            <div className="p-2">
              <p className="text-3xl font-extrabold text-blue-600">{stats.activeRoles}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Active Roles</p>
            </div>
            <div className="p-2 pt-6 md:pt-2 border-t-0">
              <p className="text-3xl font-extrabold text-indigo-600">{stats.topStartups}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Top Startups</p>
            </div>
            <div className="p-2 pt-6 md:pt-2">
              <p className="text-3xl font-extrabold text-violet-600">{stats.applicants}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Applicants</p>
            </div>
            <div className="p-2 pt-6 md:pt-2">
              <p className="text-3xl font-extrabold text-emerald-600">{stats.hrRegistry}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">HR Registry</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Listing Section */}
      <section className="py-12 bg-slate-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                {(searchRole || searchLocation) ? 'Search Results' : 'Recommended Openings'}
              </h2>
              <p className="text-sm text-slate-500">
                Found {jobs.length} relevant positions matching your preferences
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified HR Contacts</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-64 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
                  <div className="h-10 bg-slate-200 rounded-xl mt-auto"></div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No jobs found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Try refining your keyword query to 'Internship' or select a different location.
              </p>
              <button
                onClick={clearSearch}
                className="mt-6 px-4.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.slice(0, visibleCount).map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
              
              {/* Load More Button */}
              {visibleCount < jobs.length && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-sm transition-all shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-95 duration-150 cursor-pointer"
                  >
                    Load More Jobs
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
