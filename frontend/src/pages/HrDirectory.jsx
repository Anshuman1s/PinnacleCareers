import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Building2, Mail, Phone, Search, Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HrDirectory() {
  const { API_URL, user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  // Reset pagination when search query changes
  useEffect(() => {
    setVisibleCount(5);
  }, [searchQuery]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${API_URL}/hr-contacts`);
        if (!response.ok) throw new Error('Failed to fetch HR contacts');
        const data = await response.json();
        setContacts(data);
      } catch (err) {
        console.error(err);
        setError('Could not connect to database. Displaying simulated corporate HR directory.');
        // Fallback simulated seed data
        setContacts([
          { _id: '1', companyName: 'Razorpay', hrEmail: 'hr@razorpay.com', contactEmail: 'careers@razorpay.com', phone: '+91 88888 88888' },
          { _id: '2', companyName: 'Stripe', hrEmail: 'hr@stripe.com', contactEmail: 'recruiting@stripe.com', phone: '+1 415 555 2671' },
          { _id: '3', companyName: 'Paytm', hrEmail: 'hr@paytm.com', contactEmail: 'talent@paytm.com', phone: '+91 99119 91199' },
          { _id: '4', companyName: 'Zoho Corporation', hrEmail: 'hr@zohocorp.com', contactEmail: 'jobs@zohocorp.com', phone: '+91 44 6744 7070' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, [API_URL]);

  // Filter contacts by search query
  const filteredContacts = contacts.filter((c) =>
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Slice contacts based on pagination
  const slicedContacts = filteredContacts.slice(0, visibleCount);

  // Group contacts alphabetically by company name
  const groupedContacts = slicedContacts.reduce((groups, contact) => {
    const letter = contact.companyName.charAt(0).toUpperCase();
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(contact);
    return groups;
  }, {});

  const sortedLetters = Object.keys(groupedContacts).sort();

  // Color mappings for card stripes (alternating section styles)
  const stripeColors = [
    'bg-blue-50/10 text-blue-700 shadow-blue-500/5',
    'bg-indigo-50/10 text-indigo-700 shadow-indigo-500/5',
    'bg-emerald-50/10 text-emerald-700 shadow-emerald-500/5',
    'bg-amber-50/10 text-amber-700 shadow-amber-500/5',
    'bg-purple-50/10 text-purple-700 shadow-purple-500/5'
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-sm border border-blue-200 inline-block">
            Corporate Registry
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mt-4 mb-4">
            HR Contact <span className="text-blue-600">Directory</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
            Direct recruitment contacts for premium hiring corporations. Connect directly with HR personnel.
          </p>
        </div>

        {/* Directory Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm mb-10">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-semibold"
            />
          </div>
          <div className="text-xs text-slate-400 font-bold shrink-0">
            Showing {filteredContacts.length} Company Records
          </div>
        </div>

        {/* Alerts / Loading states */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-44 bg-slate-200 rounded-2xl"></div>
              <div className="h-44 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Companies Found</h3>
            <p className="text-xs text-slate-400 mt-0.5">Try searching with a different company keyword.</p>
          </div>
        ) : (
          /* Alphabetical Striped layout */
          <div className="space-y-6">
            {sortedLetters.map((letter, idx) => (
              <div key={letter} className="space-y-2.5">
                {/* Alphabet Section Header Strip */}
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black text-sm border border-blue-200 shadow-sm">
                    {letter}
                  </div>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                {/* Company List Stack (Wide Stripe Rows) */}
                <div className="space-y-1.5">
                  {groupedContacts[letter].map((contact, contactIdx) => {
                    const stripeStyle = stripeColors[(idx + contactIdx) % stripeColors.length];
                    return (
                      <motion.div
                        key={contact._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${stripeStyle}`}
                      >
                        {/* Company Identifier */}
                        <div className="flex items-center gap-3 min-w-[200px] shrink-0">
                          <div className="h-8 w-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-450">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{contact.companyName}</span>
                        </div>

                        {/* Info details with pipe dividers */}
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-end gap-2 md:gap-6 relative min-h-[36px]">
                          <div className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs font-semibold text-slate-650 ${!user ? 'filter blur-xs select-none pointer-events-none' : ''}`}>
                            
                            <span className="hidden md:inline text-slate-300 font-normal">|</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider md:hidden">HR Email:</span>
                              <a 
                                href={contact.hrEmail ? `mailto:${contact.hrEmail}` : undefined} 
                                className={`text-slate-700 ${contact.hrEmail ? 'hover:text-blue-600 hover:underline' : 'pointer-events-none'}`}
                              >
                                {contact.hrEmail || 'NA'}
                              </a>
                            </div>

                            <span className="hidden md:inline text-slate-300 font-normal">|</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider md:hidden">Contact Email:</span>
                              <a 
                                href={contact.contactEmail ? `mailto:${contact.contactEmail}` : undefined} 
                                className={`text-slate-700 ${contact.contactEmail ? 'hover:text-blue-600 hover:underline' : 'pointer-events-none'}`}
                              >
                                {contact.contactEmail || 'NA'}
                              </a>
                            </div>

                            <span className="hidden md:inline text-slate-300 font-normal">|</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider md:hidden">HR Phone:</span>
                              <a 
                                href={contact.phone ? `tel:${contact.phone}` : undefined} 
                                className={`text-slate-700 ${contact.phone ? 'hover:text-blue-600' : 'pointer-events-none'}`}
                              >
                                {contact.phone || 'NA'}
                              </a>
                            </div>

                          </div>

                          {/* Inline Lock Overlay */}
                          {!user && (
                            <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-gradient-to-l from-white via-white/95 to-white/0 pl-16 pr-2 rounded-r-xl z-10 gap-3">
                              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                                <Lock className="h-3.5 w-3.5 text-blue-600" />
                                <span>Contacts Locked</span>
                              </div>
                              <Link
                                to="/auth?mode=login"
                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
                              >
                                <span>Unlock</span>
                              </Link>
                            </div>
                          )}
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredContacts.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer hover:shadow-lg active:scale-95 duration-150"
            >
              Load More
            </button>
          </div>
        )}

        {/* Informative Tip */}
        <div className="mt-16 bg-blue-50 border border-blue-200/80 rounded-xl p-5 flex gap-3 items-start">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="font-extrabold text-red-700 mb-0.5">Privacy & Fair Access Notice</h4>
            <p className="text-cyan-700 leading-relaxed font-semibold">
              The corporate contact registry is strictly for genuine job application interactions. Any usage for unsolicited commercial messages, product sales, or automated directory scraping will result in immediate account termination.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
