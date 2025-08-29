# PollApp - Modern Polling Application

A feature-rich polling application built with Next.js 15, React 19, TypeScript, and Tailwind CSS. Create, share, and analyze polls with real-time results and beautiful analytics.

![PollApp](https://img.shields.io/badge/Next.js-15.5.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38B2AC)

## ✨ Features

### Core Functionality
- **Poll Creation**: Create polls with multiple options, categories, and custom settings
- **Real-time Voting**: Live vote tracking with instant results
- **User Authentication**: Secure login and registration system
- **Dashboard**: Personal dashboard to manage your polls
- **Poll Discovery**: Browse and search through community polls

### Advanced Features
- **Multiple Vote Types**: Single choice or multiple choice polls
- **Poll Settings**: 
  - Authentication requirements
  - Expiration dates
  - Custom categories and tags
  - Vote limitations
- **Rich Analytics**: Visual charts and detailed voting statistics
- **Responsive Design**: Mobile-first responsive interface
- **Real-time Updates**: Live vote counting and results

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/polling-app.git
cd polling-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
polling-app/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Registration page
│   ├── polls/                    # Poll-related pages
│   │   ├── create/page.tsx       # Create poll page
│   │   ├── [id]/page.tsx        # Individual poll view
│   │   └── page.tsx             # Browse polls
│   ├── dashboard/page.tsx        # User dashboard
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/                   # Reusable components
│   ├── ui/                      # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── auth/                    # Authentication components
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   └── polls/                   # Poll-related components
│       ├── poll-card.tsx
│       └── create-poll-form.tsx
├── lib/                         # Utility functions
│   └── utils.ts                 # Common utilities
├── types/                       # TypeScript definitions
│   └── index.ts                 # Type definitions
├── hooks/                       # Custom React hooks
│   └── use-toast.ts            # Toast notifications
├── public/                      # Static assets
└── README.md                    # Project documentation
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3
- **Components**: Shadcn/ui + Radix UI
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Form Handling**: Custom form validation
- **Development**: ESLint, PostCSS

## 📱 Pages & Features

### Landing Page (`/`)
- Hero section with feature highlights
- Popular polls showcase
- Call-to-action sections
- Responsive design

### Authentication (`/login`, `/register`)
- Secure login and registration forms
- Form validation with error handling
- Demo credentials for testing
- Password visibility toggle

### Browse Polls (`/polls`)
- Search and filter functionality
- Grid/list view toggle
- Category filtering
- Sort by popularity, date, etc.
- Real-time voting interface

### Create Poll (`/polls/create`)
- Multi-step poll creation form
- Custom options and settings
- Category and tag support
- Expiration date settings
- Form validation

### Poll Details (`/polls/[id]`)
- Individual poll view
- Real-time voting interface
- Results visualization
- Social sharing options
- Poll analytics

### Dashboard (`/dashboard`)
- Personal poll management
- Statistics overview
- Quick actions panel
- Search and filter your polls

## 🎨 UI Components

Built with Shadcn/ui components for consistency:

- **Button**: Multiple variants and sizes
- **Card**: Flexible card layouts
- **Input**: Form inputs with validation
- **Label**: Accessible form labels
- **Custom Components**: Poll cards, forms, charts

## 📊 Data Structure

### Poll Object
```typescript
interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  creatorId: string;
  isActive: boolean;
  allowMultipleVotes: boolean;
  requireAuth: boolean;
  expiresAt?: Date;
  totalVotes: number;
  category?: string;
  tags?: string[];
}
```

### Vote Object
```typescript
interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId?: string;
  ipAddress?: string;
  createdAt: Date;
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### Tailwind Configuration
The project uses Tailwind CSS with custom design tokens for consistent theming. See `tailwind.config.js` for configuration details.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with one click

### Manual Deployment
```bash
npm run build
npm start
```

## 🧪 Testing

### Demo Features
- **Demo Login**: Use `demo@example.com` / `password123`
- **Mock Data**: The app includes mock polls and data for demonstration
- **Local Storage**: Votes are stored locally for demo purposes

### Development Testing
```bash
npm run lint    # Run ESLint
npm run build   # Test production build
```

## 🔄 Future Enhancements

### Backend Integration
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication (NextAuth.js)
- [ ] Real-time updates (WebSockets)
- [ ] API endpoints

### Advanced Features
- [ ] Poll analytics dashboard
- [ ] Email notifications
- [ ] Social media sharing
- [ ] Poll embedding
- [ ] Advanced voting rules
- [ ] Moderation tools

### Performance
- [ ] Image optimization
- [ ] Caching strategies
- [ ] Performance monitoring
- [ ] SEO optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dennis Muchai**
- GitHub: [@dennis-muchai](https://github.com/dennis-muchai)
- Email: dennis@example.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Lucide React](https://lucide.dev/) for consistent icons
- [Radix UI](https://www.radix-ui.com/) for accessible primitives

---

**Happy Polling! 🗳️**