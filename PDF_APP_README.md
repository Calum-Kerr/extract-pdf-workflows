# PDF Pro - Advanced PDF Manipulation Platform

A comprehensive PDF manipulation web application built with Next.js, Supabase, and Stripe that rivals Adobe Acrobat in functionality.

## 🚀 Features

### Core PDF Operations
- **PDF Viewing**: High-performance PDF renderer with zoom, pan, and navigation
- **PDF Editing**: Text editing, image insertion, page manipulation
- **Merge & Split**: Combine multiple PDFs or extract specific pages
- **Annotations**: Highlighting, notes, drawings, stamps, and signatures
- **Form Management**: Interactive form filling and creation
- **OCR**: Text extraction from scanned documents
- **Digital Signatures**: Certificate-based signing with verification

### Collaboration
- **Real-time Editing**: Live cursor tracking and shared annotations
- **Comments**: Threaded discussions on specific document sections
- **Sharing**: Secure document sharing with permission controls
- **Version Control**: Track document changes and revisions

### Enterprise Features
- **Security**: End-to-end encryption and audit trails
- **API Access**: RESTful API for integrations
- **Custom Branding**: White-label solutions for enterprise
- **Analytics**: Detailed usage and performance metrics

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **PDF Engine**: PDF-lib, PDF.js, React-PDF
- **Payments**: Stripe (subscriptions and billing)
- **Deployment**: Heroku with CI/CD
- **Testing**: Jest, Playwright, Testing Library

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account
- Heroku account (for deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pdf-manipulation-app.git
cd pdf-manipulation-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment variables:

```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PROJECT_ID=your_supabase_project_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Database Setup

Run the Supabase schema:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

Or manually run the SQL from `database/supabase-schema.sql` in your Supabase dashboard.

### 5. Stripe Setup

1. Create products and prices in your Stripe dashboard
2. Update the price IDs in `lib/stripe.ts`
3. Set up webhooks pointing to `/api/webhooks/stripe`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
├── app/                    # Next.js 13+ app directory
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard and main app
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── pdf/              # PDF-specific components
│   └── forms/            # Form components
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client and helpers
│   ├── stripe.ts         # Stripe configuration
│   ├── pdf-engine.ts     # PDF manipulation engine
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
├── database/             # Database schema and migrations
└── public/               # Static assets
```

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku App**:
```bash
heroku create your-app-name
```

2. **Set Environment Variables**:
```bash
heroku config:set NEXT_PUBLIC_SUPABASE_URL=your_url
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
# ... add all other environment variables
```

3. **Deploy**:
```bash
git push heroku main
```

### Automatic Deployment

The project includes GitHub Actions for automatic deployment:

1. Set up the following secrets in your GitHub repository:
   - `HEROKU_API_KEY`
   - `HEROKU_APP_NAME`
   - `HEROKU_EMAIL`

2. Push to the `main` branch to trigger automatic deployment.

## 📊 Subscription Plans

The application includes three subscription tiers:

- **Free**: Basic PDF operations (100MB storage)
- **Pro**: Advanced features with collaboration ($9.99/month)
- **Enterprise**: Unlimited usage with custom features ($49.99/month)

## 🔒 Security

- End-to-end encryption for sensitive documents
- Row Level Security (RLS) in Supabase
- Secure file upload and storage
- GDPR compliance features
- Audit logging for enterprise accounts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.yourapp.com)
- 💬 [Discord Community](https://discord.gg/yourapp)
- 📧 [Email Support](mailto:support@yourapp.com)
- 🐛 [Bug Reports](https://github.com/your-username/pdf-manipulation-app/issues)

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Advanced AI features
- [ ] More file format support
- [ ] Enhanced collaboration tools
- [ ] API v2 with GraphQL

---

Built with ❤️ by the PDF Pro team
