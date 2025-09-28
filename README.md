# Glaze Recipes - Digital Ceramic Glaze Management

A modern, mobile-optimized web application for capturing, organizing, and managing ceramic glaze recipes digitally. Perfect for potters and ceramic artists who want to digitize their glaze recipe collection.

## Features

### ✨ Core Functionality
- **Create Glaze Recipes**: Add new glaze recipes with comprehensive details
- **Browse Gallery**: View all your glaze recipes in an organized gallery
- **Search & Filter**: Find specific recipes by name, color, batch number, or finish type
- **Mobile Optimized**: Fully responsive design optimized for mobile devices

### 🎨 Glaze Recipe Details
Each glaze recipe includes:
- **Name**: Descriptive name for the glaze
- **Color**: Color description
- **Finish**: Type of finish (glossy, matte, semi-matte, crystalline, raku, wood-fired, soda)
- **Composition**: Dynamic list of components with percentages
- **Date**: Creation date
- **Batch Number**: Auto-generated unique identifier (format: GYYMMDD-XXXX)

### 🔧 Technical Features
- **Data Persistence**: All data stored locally in browser storage
- **Form Validation**: Comprehensive validation with real-time feedback
- **Percentage Validation**: Ensures composition percentages total 100%
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **TypeScript**: Fully typed for better development experience

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd glaze-recipes
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Creating a Glaze Recipe

1. Click the "Create New Glaze" button
2. Fill in the basic information:
   - Glaze name
   - Color description
   - Finish type
   - Date
   - Optional batch number (auto-generated if empty)

3. Add composition components:
   - Click "Add Component" to add new ingredients
   - Enter component name (e.g., "China clay", "Feldspar")
   - Enter percentage (must total 100%)
   - Remove components with the trash icon

4. Click "Create Glaze" to save

### Browsing Recipes

- **Search**: Use the search bar to find recipes by name, color, or batch number
- **Filter**: Filter by finish type using the dropdown
- **Sort**: Sort by date, name, or batch number
- **View Details**: Each card shows composition breakdown and total percentage

### Mobile Usage

The app is fully optimized for mobile devices:
- Touch-friendly interface
- Responsive grid layout
- Mobile-optimized forms
- Safe area support for modern devices

## Data Storage

All glaze recipes are stored locally in your browser's localStorage. This means:
- ✅ No account required
- ✅ Data stays on your device
- ✅ Works offline
- ⚠️ Data is tied to the specific browser/device

## Development

### Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles with mobile optimizations
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── CreateGlazeDialog.tsx
│   └── GlazeGallery.tsx
├── lib/               # Utility functions
│   ├── glaze-utils.ts # Data management functions
│   └── utils.ts       # shadcn/ui utilities
└── types/             # TypeScript type definitions
    └── glaze.ts       # Glaze-related types
```

### Key Components

- **CreateGlazeDialog**: Modal form for creating new glaze recipes
- **GlazeGallery**: Displays all recipes with search/filter functionality
- **glaze-utils.ts**: Handles data persistence and batch number generation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

Built with ❤️ for the ceramic arts community