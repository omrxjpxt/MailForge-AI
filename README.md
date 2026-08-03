<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Gmail_API-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail API" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

# MailForge AI

MailForge AI is an advanced, AI-powered cold email outreach platform designed to streamline and elevate your email marketing efforts. It empowers users to generate highly personalized emails, efficiently manage leads, create and execute multi-step campaigns, send emails directly through Gmail, automate follow-ups, and track comprehensive campaign analytics to optimize engagement and conversion rates.

---

## ✨ Features

### 🤖 AI
- AI email generation
- AI subject line generation
- AI-powered rewrites
- Personalized email variations
- Brand voice support
- Placeholder-aware generation

### 📧 Outreach
- Multi-step campaigns
- Automated follow-ups
- Email scheduling
- Gmail integration
- Daily sending limits
- Delay between emails

### 👥 Lead Management
- CSV import
- Lead management
- Custom placeholders
- Audience segmentation
- Campaign enrollment

### 📊 Analytics
- Open tracking
- Reply tracking
- Campaign analytics
- Delivery metrics
- Real-time dashboard

### ⚙️ Platform
- Firebase Authentication
- Firestore database
- Google OAuth
- Responsive dashboard
- Dark UI
- Real-time updates

---

## 🛠 Tech Stack

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

**Backend**
- Next.js API Routes
- Firebase
- Firestore
- Gmail API
- Gemini API

**Other**
- Vercel
- PostHog
- Sentry

---

## 📸 Screenshots

![Dashboard Placeholder](https://via.placeholder.com/800x450.png?text=Dashboard)

![Campaign Builder Placeholder](https://via.placeholder.com/800x450.png?text=Campaign+Builder)

![AI Email Generator Placeholder](https://via.placeholder.com/800x450.png?text=AI+Email+Generator)

![Analytics Placeholder](https://via.placeholder.com/800x450.png?text=Analytics)

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

Make sure you have Node.js and npm installed on your machine. You will also need a Firebase project and a Google Cloud Console project configured for OAuth and Gmail API access.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/mailforge-ai.git
   cd mailforge-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add the following variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 📂 Project Structure

- `src/app`: Contains the Next.js App Router pages and layouts.
- `src/components`: Reusable React components, including UI elements and feature-specific components.
- `src/hooks`: Custom React hooks for managing state, data fetching, and business logic.
- `src/lib`: Utility functions, configuration files, and external API clients.
- `src/types`: TypeScript type definitions and interfaces.

---

## 🔐 Security

- **Google OAuth**: Secure authentication and authorization for user accounts and Gmail access.
- **Secure Gmail Integration**: Uses OAuth 2.0 to access user email accounts securely without storing passwords.
- **Firebase Authentication**: Robust user identity management.
- **Firestore Security Rules**: Strict access control rules to ensure data integrity and privacy.
- **User-Scoped Data Isolation**: All data is securely scoped to individual users, preventing unauthorized access across accounts.

---

## 🗺 Roadmap

**Completed:**
- [x] AI email generation
- [x] Campaign engine
- [x] Gmail integration
- [x] Lead management
- [x] Open tracking
- [x] Analytics
- [x] Follow-ups

**Upcoming:**
- [ ] Reply detection
- [ ] Team workspaces
- [ ] A/B testing
- [ ] Custom domains
- [ ] Webhooks
- [ ] CRM integrations
- [ ] Advanced analytics

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
## 👨‍💻 Author

**Om Gangwar**

Full-Stack Developer passionate about building AI-powered SaaS products, modern web applications, and developer tools.

- 🌐 Portfolio: https://your-portfolio.com
- 💼 LinkedIn: https://linkedin.com/in/om-gangwar-58315a271
- 📧 Email: your@email.com
## 📄 License

Distributed under the MIT License.
