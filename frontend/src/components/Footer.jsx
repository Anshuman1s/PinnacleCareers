import React from 'react';
import { Briefcase, Mail, Phone, MapPin } from 'lucide-react';
import img from '/logo.png';

// Self-contained SVGs to prevent Lucide import naming conflicts across versions
const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img 
                src={img} 
                alt="Pinnacle Careers Logo" 
                className="h-10 w-auto object-contain bg-white rounded px-2 py-1"
              />
            </div>
            <p className="text-sm text-slate-400">
              India's premium job portal for connecting top talent with high-growth technology companies.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-500 transition-colors"><TwitterIcon className="h-5 w-5" /></a>
              <a href="#" className="hover:text-blue-500 transition-colors"><LinkedinIcon className="h-5 w-5" /></a>
              <a href="#" className="hover:text-blue-500 transition-colors"><GithubIcon className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Portal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Find Jobs</a></li>
              <li><a href="/walk-in-drives" className="hover:text-white transition-colors">Walk-in Drives</a></li>
              <li><a href="/upload-resume" className="hover:text-white transition-colors">Upload CV</a></li>
              <li><a href="/auth?mode=login" className="hover:text-white transition-colors">Client Login</a></li>
            </ul>
          </div>

          {/* Job Categories */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Engineering (React, Node)</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Product Design</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Marketing / Sales</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Internships</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Contact Us</h3>
            <div className="flex items-center gap-2.5 text-sm text-slate-400">
              <MapPin className="h-4.5 w-4.5 text-blue-500" />
              <span>Noida, Uttar Pradesh, India</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-400">
              <Mail className="h-4.5 w-4.5 text-blue-500" />
              <span>contact.pinnaclecareers@gmail.com</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-400">
              <Phone className="h-4.5 w-4.5 text-blue-500" />
              <span>+91 987654321</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Pinnacle Careers Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
