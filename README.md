# MailForge AI

MailForge AI is an advanced, AI-powered cold email outreach platform. It enables users to connect their Gmail accounts, import leads via CSV, build multi-step campaigns, and personalize every outbound email using Google's Gemini models.

## Features

- **Google Authentication & Gmail Integration**: Seamlessly connect your Google workspace to send emails directly from your account.
- **AI Personalization Engine**: Generate highly personalized email hooks or deep email rewrites based on specific lead data (industry, job title, company, etc.) using Gemini 3.5 Flash.
- **Campaign Orchestration**: Build automated, multi-step email sequences with delay rules and smart placeholder replacement.
- **Lead Management**: Import leads via CSV, map custom fields, and manage your entire audience inside a streamlined CRM view.
- **Analytics Dashboard**: Track sent emails, open rates, replies, and bounces in real-time.
- **Template Generator**: Draft professional email templates from a single prompt.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Google Cloud Firestore
- **Authentication**: Firebase Auth (Google Provider)
- **AI**: Google GenAI SDK (Gemini)

## Setup & Local Development

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Copy `.env.example` to `.env.local` and populate the necessary Firebase and Google API keys.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Required Environment Variables

Refer to `.env.example` for the full list of required environment variables. Ensure that you have a Firebase project created with Firestore and Authentication (Google Provider) enabled.

## License

MIT
