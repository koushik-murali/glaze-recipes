# 🎨 Glaze Recipes

A modern, digital glaze recipe management system for ceramic artists and potters. Built with Next.js, TypeScript, and Supabase.

## ✨ Features

- **Natural Language Entry**: Type or speak glaze recipes in plain English
- **Photo Management**: Upload and organize glaze photos
- **Clay Body Tracking**: Manage different clay bodies and their properties
- **Material Library**: Organize raw materials and their types
- **Search & Filter**: Find recipes quickly by name, color, finish, or batch number
- **User Authentication**: Secure, personal recipe storage
- **Responsive Design**: Works perfectly on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/glaze-recipes.git
cd glaze-recipes
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key
3. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Database Migrations

1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`
3. Run migrations: `supabase db push`

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 🗄️ Database Schema

The app uses PostgreSQL with the following main tables:

- `glaze_recipes` - Store glaze recipes with composition and metadata
- `clay_bodies` - Track clay body properties and shrinkage
- `raw_materials` - Manage raw material library
- All tables use Row Level Security (RLS) for user data isolation

## 🎯 Natural Language Entry

Enter glaze recipes in plain English:

```
10 china clay 20 potash feldspar 15 iron oxide
```

or

```
china clay 10 potash feldspar 20 iron oxide 15
```

The parser intelligently handles:
- Numeric values: `10`, `20`, `15`
- Spoken numbers: `ten`, `twenty`, `fifteen`
- Mixed formats and ingredient names

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

- **Netlify**: Works with `npm run build` and `npm run export`
- **Railway**: Direct GitHub integration
- **DigitalOcean App Platform**: Container-based deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel

## 📱 Mobile Support

The app is fully responsive and optimized for mobile devices with:
- Touch-friendly interfaces
- Mobile-optimized photo capture
- Responsive grid layouts
- Mobile-specific UI components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)