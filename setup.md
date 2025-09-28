# 🚀 Quick Setup Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Set Up Environment Variables
Create `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Set Up Supabase Database
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor

## 4. Start Development Server
```bash
npm run dev
```

## 5. Deploy to Vercel
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## 📁 Project Structure
```
src/
├── app/                 # Next.js app directory
├── components/          # React components
├── contexts/           # React contexts (Auth)
├── lib/               # Utilities and configurations
├── types/             # TypeScript type definitions
└── hooks/             # Custom React hooks

supabase/
└── migrations/        # Database migration files
```

## 🎯 Key Features
- Natural Language Recipe Entry
- Photo Management
- User Authentication
- Mobile Responsive
- Supabase Integration
