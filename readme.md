# Pinnacle Careers

## Overview

Pinnacle Careers is a full-stack recruitment platform designed to bridge the gap between recruiters and job seekers. The platform enables HR professionals to post job openings and walk-in drives, while candidates can explore opportunities, upload resumes, and connect with recruiters. An Admin panel provides centralized control over users, jobs, and platform activities.

## Features

### Candidate Features

* Register and manage profile
* Browse job openings and walk-in drives
* Upload and manage resumes
* Apply for jobs directly through the platform
* Access HR contact directory for networking opportunities
* Track submitted applications

### HR Features

* Create and manage job postings
* Schedule and publish walk-in drives
* View candidate applications and resumes
* Manage recruitment opportunities
* Highlight important openings using job pinning

### Admin Features

* Manage candidates and HR accounts
* Monitor platform activities
* Create and manage jobs and walk-in drives
* Pin featured jobs for a specified duration
* Oversee recruitment data and user engagement

## Tech Stack

### Frontend

* React.js
* JavaScript / TypeScript
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* REST APIs
* JWT Authentication

### Database

* MongoDB
* Mongoose

### Cloud Services

* Cloudinary (Resume Storage)

## System Architecture

Frontend (React.js)
↓
REST APIs (Express.js & Node.js)
↓
MongoDB Database
↓
Cloudinary (Resume Storage)

## Key Functionalities

* Role-Based Access Control (Admin, HR, Candidate)
* Authentication and Authorization using JWT
* Resume Upload and Storage
* Job Posting and Management
* Walk-in Drive Management
* Featured Job Pinning System
* HR Contact Directory
* Responsive User Interface
* Secure Backend APIs

## Installation

### Clone Repository

```bash
git clone https://github.com/anshuman1s/pinnacleCareers
cd pinnacle-careers
```

### Install Dependencies

Frontend

```bash
cd client
npm install
```

Backend

```bash
cd server
npm install
```

### Environment Variables

Create a `.env` file inside the server directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run Application

Backend

```bash
npm run dev
```

Frontend

```bash
npm run dev
```

## Future Enhancements

* AI-based Resume Screening
* Job Recommendation System
* Email Notifications
* Interview Scheduling
* Analytics Dashboard
* Company Profiles
* Application Status Tracking
* Real-time Chat Between HR and Candidates

## Project Highlights

* Developed a scalable MERN stack recruitment platform.
* Implemented role-based authentication and authorization.
* Built secure resume upload and management functionality.
* Designed an admin dashboard for recruitment operations.
* Created a featured job pinning system to improve job visibility.
* Enabled direct recruiter-candidate interaction through an HR directory.

## Author

**Anshuman Shukla**
Full Stack Developer | MERN Stack Developer
