import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ChevronRight, Ban, Users, Pin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function JobCard({ job }) {
  const typeStyles = {
    'Internship': 'bg-purple-50 text-purple-700 border-purple-100',
    'Full-time': 'bg-blue-50 text-blue-700 border-blue-100',
    'Part-time': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Contract': 'bg-orange-50 text-orange-700 border-orange-100'
  };

  const getDaysAgo = (dateStr) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 'Posted today' : `${diff} days ago`;
  };

  const isClosed = job.status === 'Closed';
  const vacancyCount = job.openings || 1;

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
      className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between h-full group ${
        isClosed 
          ? 'border-slate-200 bg-slate-50/30' 
          : job.isPinned
            ? 'border-amber-200 shadow-md shadow-amber-500/3 bg-gradient-to-br from-white via-white to-amber-55/10 hover:border-amber-300'
            : 'border-slate-250/60 hover:border-blue-200'
      }`}
    >
      <div>
        {/* Top Info Area: Company Name and High-priority Badges */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-base text-blue-500 font-bold uppercase tracking-wider truncate">{job.company}</span>
            {/* Status/Pin Badges */}
            <div className="flex gap-1.5 items-center shrink-0">
              {job.isPinned && !isClosed && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
                  <Pin className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                  PINNED
                </span>
              )}
              {isClosed && (
                <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded">
                  CLOSED
                </span>
              )}
            </div>
          </div>
          
          <h3 className={`text-sm font-medium  mt-1.5 line-clamp-1 ${
            isClosed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'
          }`}>
            {job.role}
          </h3>
        </div>
 
        {/* Job Tags Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-[10px] px-5 py-2 rounded-sm font-semibold border ${typeStyles[job.type] || 'bg-slate-50 text-slate-700 border-slate-150'}`}>
            {job.type}
          </span>
          <span className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200/60 px-5 py-2 rounded-sm font-semibold inline-flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-400" />
            {vacancyCount} {vacancyCount === 1 ? 'Vacancy' : 'Vacancies'}
          </span>
          {!isClosed && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-5 py-2 rounded-sm font-semibold inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-sm bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          )}
        </div>
 
        {/* Location & Calendar meta info */}
        <div className="flex items-center gap-x-4 text-[11px] text-slate-400 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">{getDaysAgo(job.createdAt)}</span>
          </div>
        </div>
 
        {/* Description */}
        <p className={`text-xs mb-5 line-clamp-3 leading-relaxed font-normal ${
          isClosed ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {stripHtml(job.description)}
        </p>
      </div>

      {/* Action Area */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between mt-auto">
        <span className="text-[11px] font-semibold text-slate-400">
          {isClosed ? 'Job Closed' : `Open for ${job.openDays} days`}
        </span>
        
        {isClosed ? (
          <div className="flex items-center gap-1 bg-slate-100 text-slate-400 text-xs font-semibold px-4 py-2 rounded-xl cursor-not-allowed select-none border border-slate-200/60">
            <Ban className="h-3.5 w-3.5" />
            <span>Closed</span>
          </div>
        ) : (
          <Link 
            to={`/jobs/${job._id}`}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 duration-150 cursor-pointer"
          >
            <span>Apply Now</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
