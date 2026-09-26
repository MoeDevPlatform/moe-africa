# MOE — African Artisan Marketplace

MOE is a peer-to-peer marketplace connecting buyers with skilled African artisans and service providers. Built for the African market, MOE enables discovery, communication, and commerce between customers and craftspeople across the continent.

🌍 **Live Demo:** [moe-africa-mvp.vercel.app](https://moe-africa-mvp.vercel.app/)

---

## Features

- *Marketplace* — Browse and discover artisans by category, location, and rating
- *Artisan Profiles* — Detailed provider pages with portfolio, reviews, and ratings
- *Product Listings* — Product and service listings with customization options
- *Messaging* — Direct buyer-to-artisan communication with conversation history
- *Cart & Checkout* — Full e-commerce flow with shipping and payment
- **Saved Payment Methods* — Securely store and reuse payment cards at checkout
- *Notifications* — Real-time alerts for messages and order updates
- *Authentication* — Secure buyer and artisan account flows

---

## Tech Stack

### Frontend
- *React* + *TypeScript*
- *Tailwind CSS*
- *React Router* — client-side routing
- *React Hook Form* + *Zod* — form validation
- *Vercel* — deployment and hosting

### Backend
- **NestJS** — REST API
- **Prisma ORM** — database access layer
- **PostgreSQL** — primary database
- **PM2** — process management on the server

---

## Project Structure

```
moe-frontend/
├── src/
│   ├── pages/
│   │   └── marketplace/       # Marketplace, Cart, Checkout, Messages
│   ├── components/
│   │   └── marketplace/       # ProviderCard, MessagingModal, NotificationCenter, etc.
│   ├── contexts/              # Cart, Auth, Notification context providers
│   ├── lib/
│   │   └── apiServices.ts     # All API service calls
│   └── App.tsx                # Route definitions
├── backend-spec/
│   └── backendRequirements.md # Backend contract documentation for the NestJS team
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/AsukuOnukaba/moe-frontend.git
cd moe-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your API base URL and other config

# Start the development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL for the NestJS backend API |
| `VITE_APP_ENV` | `development` or `production` |

---

## Backend

The NestJS backend lives in a separate repository. API contracts and required endpoint specifications are documented in `backend-spec/backendRequirements.md` within this repo, maintained in sync with frontend development.

**Backend repo:** [github.com/AsukuOnukaba/moe-backend](https://github.com/AsukuOnukaba/moe-backend)

---

## Deployment

The frontend is deployed on **Vercel** via GitHub integration. Every push to `main` triggers an automatic deployment.

The backend is deployed on a **Hetzner Ubuntu server** managed with PM2.

```bash
# Backend deploy
bash deploy.sh
```

---

## Contributing

This project is currently in active MVP development. If you'd like to contribute, please open an issue first to discuss the change.

---

## License

Private — All rights reserved © MOE Africa
