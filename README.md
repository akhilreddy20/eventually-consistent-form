🚀 Eventually Consistent Form

A production-ready full-stack JavaScript application demonstrating resilient form submission with automatic retries, idempotency, and clear state management.

📋 Table of Contents
       Overview
       Features
       Demo
       Tech Stack
       Architecture
       Getting Started
       API Documentation
       How It Works
       Project Structure
       Testing
       Deployment
       Contributing
       License
       Author

    🎯 Overview
        This project demonstrates best practices for building resilient distributed systems that gracefully handle network failures. It implements patterns commonly used in production environments at companies like Netflix, Amazon, and Google.
       The Problem
           In real-world applications:
              🔴 Network requests fail randomly
              🔴 Services become temporarily unavailable
              🔴 Retries can create duplicate data
              🔴 Users need clear feedback on request status

       The Solution
           This application solves these challenges with:

             ✅ Automatic Retry Logic - Exponential backoff (1s → 2s → 4s)
             ✅ Idempotency Keys - Prevent duplicate submissions
             ✅ State Machine - Predictable UI behavior
             ✅ Visual Feedback - Clear status indicators
             ✅ Graceful Error Handling - User-friendly messages

   ✨ Features
      🔄 Automatic Retry with Exponential Backoff
          Retries failed requests up to 3 times
          Delays increase exponentially: 1s → 2s → 4s
          Only retries on temporary failures (503 errors)
          Stops immediately on permanent errors (4xx)

          Why Exponential Backoff?
           Reduces server load during outages
           Gives systems time to recover

   🔐 Idempotency (Zero Duplicates)
        Each submission gets a unique key: timestamp-random
        Backend checks for duplicate keys before processing
        Same request always returns same response
        Safe to retry without creating duplicate records

   State Machine Flow:

   IDLE → PENDING → SUCCESS ✅
         ↓
      RETRYING → SUCCESS ✅ / ERROR ❌

      isual indicators for each state:

     🟢 Idle - Green "Submit" button
     🟡 Pending - Yellow spinner "Submitting..."
     🟠 Retrying - Orange spinner "Attempt N of 3"
     ✅ Success - Green checkmark "Success!"
     ❌ Error - Red X with error message

   🧪 Mock API Behavior (For Testing)
        The backend randomly responds with:
        40% → Immediate success (200 OK)
        30% → Temporary failure (503) - triggers retry
        30% → Delayed success (5-10 second wait, then 200 OK)
        This simulates real-world unpredictability!


    🛠️ Tech Stack
         Frontend
         Technology          Version        Purpose 
         React               18.2.0          UI library
         Vite                5.2.0           Build tool & dev server  

         Backend
         Technology          Version        Purpose
         Express.js          4.18.2         Web framework
         Node.js             18+            Runtime environment
         UUID                9.0.0          Unique ID generation 
         Swagger             5.0.0          API documentation

      Development Tools
      Nodemon - Auto-restart on changes
      CORS - Cross-origin resource sharing
      Swagger UI - Interactive API docs

      🏗️ Architecture
            System Overview
        
        ┌─────────────────────────────────────────────────────────────┐
        │                        Browser                              │
        ├─────────────────────────────────────────────────────────────┤
        │                                                             │
        │  ┌────────────────────────────────────────────────────┐    │
        │  │      React Frontend (localhost:5173)               │    │
        │  │                                                    │    │
        │  │  Components:                                       │    │
        │  │  ├── SubmissionForm (Input & Validation)           │    │
        │  │  ├── StatusIndicator (Visual Feedback)             │    │
        │  │  └── SubmissionsList (Display Results)             │    │
        │  │                                                    │    │
        │  │  Custom Hooks:                                     │    │
        │  │  ├── useSubmission (State Machine)                 │    │
        │  │  └── useSubmissionsList (Data Fetching)            │    │
        │  │                                                    │    │
        │  │  Services:                                         │    │
        │  │  └── api.js (Retry Logic + HTTP Client)            │    │
        │  └────────────────────────────────────────────────────┘    │
        │                           ▲                                │
        │                           │                                │
        │                    HTTP REST API (JSON)                    │
        │                           │                                │
        │                           ▼                                │
        │  ┌────────────────────────────────────────────────────┐    │
        │  │      Express Backend (localhost:3001)              │    │
        │  │                                                    │    │
        │  │  server.js (Entry Point)                           │    │
        │  │  ├── CORS Middleware                               │    │
        │  │  ├── JSON Parser                                   │    │
        │  │  └── Swagger UI                                    │    │
        │  │                                                    │    │
        │  │  submissions.controller.js (Routes)                │    │
        │  │  ├── POST /api/submissions                         │    │
        │  │  ├── GET /api/submissions                          │    │
        │  │  └── POST /api/submissions/clear                   │    │
        │  │                                                    │    │
        │  │  submissions.service.js (Business Logic)           │    │
        │  │  ├── Idempotency Check (Map)                       │    │
        │  │  ├── Random API Behavior                           │    │
        │  │  └── In-Memory Storage                             │    │
        │  └────────────────────────────────────────────────────┘    │
        │                                                            │
        └─────────────────────────────────────────────────────────────┘

        Data Flow

        1. User fills form (email + amount)
        2. Click Submit
        3. Generate idempotency key: "1709123456789-x7k9m2p4q"
        4. POST /api/submissions
        5. Backend checks if key exists in cache
            ├─ YES → Return cached response (no duplicate!)
            └─ NO  → Process submission
        6. Random behavior:
            ├─ 40% → Return 200 immediately
            ├─ 30% → Return 503 (triggers retry)
            └─ 30% → Wait 5-10s, then return 200
        7. If 503: Client retries with exponential backoff
        8. Store submission in Map by idempotency key
        9. Update UI with result
        10. Display in submissions list

     Installation
     Clone the repository

     git clone https://github.com/akhilreddy20/eventually-consistent-form.git
     cd eventually-consistent-form

     📡 API Documentation
     Base URL :http://localhost:3001
     Interactive Documentation:Swagger UI :http://localhost:3001/api-docs

     🔍 How It Works
         State Machine Flow
            ┌────────┐
            │  IDLE  │  ← Form is ready
            └───┬────┘
                │ User clicks Submit
                ▼
           ┌─────────┐
           │ PENDING │  ← Initial request sent
           └───┬─────┘
               │
               ├─────────────┬──────────────┬─────────────┐
               │             │              │             │
               │ 200 OK      │ 503 Error    │ Delayed     │
               ▼             ▼              ▼             │
            ┌─────────┐  ┌──────────┐  ┌─────────┐       │
            │ SUCCESS │  │ RETRYING │  │ PENDING │       │
            └─────────┘  └────┬─────┘  └───┬─────┘       │
                              │            │             │
                       Retry 1│            │ Wait 5-10s  │
                              ▼            ▼             │
                           ┌─────────┐  ┌─────────┐      │
                           │ SUCCESS │  │ SUCCESS │      │
                           └─────────┘  └─────────┘      │
                              │                          │
                       Retry 2│                          │
                              ▼                          │
                           ┌──────────┐                  │
                           │ RETRYING │                  │
                           └────┬─────┘                  │
                                │                        │
                         Retry 3│                        │
                                ▼                        │
                             ┌───────┐                   │
                             │ ERROR │ ←─────────────────┘
                             └───────┘


        Retry Logic (Exponential Backoff)
        Timeline:
        ─────────────────────────────────────────────────────────►
         Attempt 1    Wait 1s     Attempt 2    Wait 2s    Attempt 3
           (0ms)       (1000ms)     (1000ms)    (2000ms)    (3000ms)

         Total Maximum Wait Time: 7 seconds (1s + 2s + 4s)

         Why This Prevents Duplicates:

         Scenario: Network timeout causes retry

            Request 1: POST { key: "abc-123" }
                → Server creates submission
                → Server stores: Map.set("abc-123", submission)
                → Response lost in network ❌

            Request 2: POST { key: "abc-123" } (retry with same key)
                → Server checks: Map.has("abc-123") → TRUE
                → Server returns cached submission ✅
                → No duplicate created!
        📁 Project Structure

             eventually-consistent-form/
               │
               ├── backend/                          # Express.js Backend
               │   ├── src/
               │   │   ├── config/
               │   │   │   └── swagger.js           # Swagger/OpenAPI configuration
               │   │   ├── controllers/
               │   │   │   └── submissions.controller.js  # Route handlers + API docs
               │   │   ├── services/
               │   │   │   └── submissions.service.js     # Business logic + mock behavior
               │   │   └── server.js                # Entry point + middleware setup
               │   ├── package.json                 # Backend dependencies
               │   ├── nodemon.json                 # Dev server configuration
               │
               ├── frontend/                         # React Frontend
               │   ├── src/
               │   │   ├── components/
               │   │   │   ├── SubmissionForm.jsx   # Form component
               │   │   │   ├── StatusIndicator.jsx  # Status display
               │   │   │   ├── SubmissionsList.jsx  # Results list
               │   │   ├── hooks/
               │   │   │   ├── useSubmission.js     # Submission state hook
               │   │   │   └── useSubmissionsList.js # List state hook
               │   │   ├── services/
               │   │   │   └── api.js               # HTTP client + retry logic
               │   │   ├── utils/
               │   │   │   └── idempotency.js       # Key generation + validation
               │   │   ├── App.jsx                  # Main app component
               │   │   ├── App.css
               │   │   ├── main.jsx                 # React entry point
               │   │   └── index.css
               │   ├── package.json                 # Frontend dependencies
               │   └── vite.config.js               # Vite configuration 
               │
               └── index.html                       # HTML template
               ├── .gitignore                       # Git ignore rules
               └── README.md                        # This file


    🧪 Testing
        Manual Testing Scenarios
        1. Happy Path - Immediate Success
            Steps:
                1. Enter email: test@example.com
                2. Enter amount: 100
                3. Click Submit
            Expected:
            ✅ Button: "Submit" → "Submitting..." → "Submit"
            ✅ Status: Pending → Success (green checkmark)
            ✅ Submission appears in list below
            ✅ Form auto-resets after 3 seconds
        2. Retry Scenario - Service Unavailable
           Steps:
             1. Submit multiple forms (5-10)
               Expected:
                ✅ Some show: Pending → Retrying (Attempt 1/3) → Success
                ✅ Backend console logs "503 - Temporary Failure"
                ✅ Client waits 1s, 2s, 4s between retries
                ✅ Eventually succeeds or fails after 3 attempts

        3. Delayed Success - Slow Response
           Steps:
              1. Submit a form
                Expected:
                ✅ Status: Pending (yellow spinner)
                ✅ Waits 5-10 seconds
                ✅ Status: Success (no retries needed)
                ✅ Backend console logs "Simulating delayed success"
        4. Duplicate Prevention - Idempotency
            Steps:
                1. Submit form: test@example.com, amount 100
                2. Wait for success
                3. Submit again with same data 5 times quickly
                   Expected:
                      ✅ Each submission has unique ID
                      ✅ No duplicate records created
                      ✅ Each has different idempotency key
    Expected Success Rate
          After submitting 10 forms, you should see approximately:
             4 instant successes (40%) - immediate 200 OK
             3 delayed successes (30%) - 5-10 second wait
             3 with retries (30%) - 503 errors that retry and succeed
               This proves the random mock behavior is working correctly!

    🤝 Contributing
            Contributions are welcome! Please follow these steps:
            Fork the repository
                 git clone https://github.com/akhilreddy20/eventually-consistent-form.git

    👨‍💻 Author
         Akhil Reddy
           🌐 GitHub: @akhilreddy20
           💼 LinkedIn: akhilreddy20

    🌟 Star This Repository
         If you found this project helpful, please consider giving it a ⭐ on GitHub! It helps others discover it too.