<p align="center">
  <img src="assets/logo.png" width="120" alt="Portley logo" />
</p>

<h1 align="center">Portley</h1>

<p align="center">
  <strong>Your portal. Your brand. Your clients.</strong>
</p>

<p align="center">
  White-label client portal for solo consultants and small agencies. Projects, files, messages, approvals, and invoicing — all under your brand.
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/ravikumarve/portley?style=social" />
  <img src="https://img.shields.io/github/license/ravikumarve/portley" />
  <img src="https://img.shields.io/badge/python-3.11+-blue" />
  <img src="https://img.shields.io/badge/Next.js-14-black" />
  <img src="https://img.shields.io/badge/status-active-brightgreen" />
</p>

<p align="center">
  <img src="assets/demo.gif" width="700" alt="Portley demo" />
</p>

---

## ✨ Features

- **🎨 White-Label Branding:** Your logo, your colors, your domain. No Portley branding visible to clients.
- **📊 Project Tracking:** Tasks, progress bars, status updates — clients see exactly where things stand.
- **💬 Real-Time Messaging:** Instant communication via Supabase WebSockets. No more 30-second polling.
- **📁 File Sharing:** Upload, organize, and share files. Clients can download without asking.
- **✅ Approval Workflow:** Request formal sign-offs on deliverables. Clients approve or request changes.
- **🤖 AI-Powered:** Paste client emails → structured project briefs. Generate payment reminders in one click.
- **💳 Invoicing & Payments:** Create invoices, generate payment links (Razorpay + Stripe), get paid faster.
- **🔒 Multi-Tenant Security:** PostgreSQL Row-Level Security keeps your data isolated and secure.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ravikumarve/portley.git
cd portley

# Set up backend
cd backend
cp .env.example .env
# Edit .env with your Supabase, Razorpay, Stripe, and Gemini API keys
pip install -r requirements.txt
uvicorn main:app --reload

# Set up frontend (new terminal)
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your Supabase and API keys
npm install
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 📖 Documentation

- **[PRD](docs/PRD.md)** — Complete Product Requirements Document
- **[Architecture](docs/ARCHITECTURE.md)** — System design and technical decisions
- **[Implementation Plan](docs/IMPLEMENTATION.md)** — Phased development roadmap
- **[Infrastructure Costs](docs/INFRASTRUCTURE_COSTS.md)** — Service costs and break-even analysis
- **[Testing Strategy](docs/TESTING_STRATEGY.md)** — Testing pyramid and quality gates
- **[Launch Plan](docs/LAUNCH_PLAN.md)** — Go-to-market strategy and launch phases
- **[API Documentation](https://api.portley.app/docs)** — Interactive OpenAPI docs
- **[Database Schema](docs/DATABASE_SCHEMA.md)** — PostgreSQL schema and RLS policies

---

## 🏗️ Implementation Phases

Portley is built in 6 phases over 12 weeks:

### **Phase 1: Foundation (Weeks 1-2)**
- Set up development environment
- Initialize database schema with RLS
- Implement authentication flow
- **Deliverable:** Working auth system with protected routes

### **Phase 2: Core Features (Weeks 3-4)**
- Build project and task management
- Implement client invite system
- Add file upload and download
- **Deliverable:** Users can create projects and manage files

### **Phase 3: Collaboration (Weeks 5-6)**
- Implement real-time messaging
- Build approval workflow
- Create activity feed
- **Deliverable:** Real-time collaboration between agencies and clients

### **Phase 4: Billing & AI (Weeks 7-8)**
- Integrate Razorpay and Stripe
- Build invoicing system
- Add AI features (brief summarization, payment reminders)
- **Deliverable:** Complete billing and AI functionality

### **Phase 5: White-Label & Polish (Weeks 9-10)**
- Implement white-label branding
- Build client portal
- Add UI polish and animations
- **Deliverable:** Professional, branded client experience

### **Phase 6: Testing & Launch (Weeks 11-12)**
- Comprehensive testing (unit, integration, E2E)
- Quality assurance and bug fixes
- Launch preparation and deployment
- **Deliverable:** Production-ready SaaS

For detailed timelines and task breakdowns, see [Implementation Plan](docs/IMPLEMENTATION.md).

---

## 💰 Pricing

| Plan | Price | Clients | Projects | Storage | White-Label | Invoicing | AI Features |
|------|-------|---------|----------|---------|-------------|-----------|-------------|
| **Free** | $0 | 2 | 3 | 500MB | ❌ | ❌ | ❌ |
| **Solo** | $19/mo | Unlimited | Unlimited | 5GB | ✅ | ✅ | ✅ |
| **Agency** | $49/mo | Unlimited | Unlimited | 20GB | ✅ | ✅ | ✅ |

**Annual Discount:** 2 months free on annual plans.

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- shadcn/ui
- Supabase Auth & Realtime

**Backend:**
- FastAPI (Python 3.11+)
- Supabase PostgreSQL
- Supabase Storage
- Razorpay (India) + Stripe (Global)
- Google Gemini Flash (AI)
- Resend (Email)

**Infrastructure:**
- Vercel (Frontend hosting)
- Render (Backend hosting)
- Supabase (Database, Auth, Storage, Realtime)
- Sentry (Error tracking)
- PostHog (Analytics)

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
pytest --cov=. --cov-report=html

# Run frontend tests
cd frontend
npm test -- --coverage

# Run E2E tests
cd frontend
npx playwright test

# Run load tests
k6 run load-test.js
```

**Coverage Targets:**
- Unit tests: 80%+ coverage
- Integration tests: All critical paths
- E2E tests: 3 critical user journeys

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**What We Welcome:**
- Bug fixes with reproduction steps
- Performance improvements with benchmarks
- Documentation improvements
- New features discussed in an issue first

**Development Setup:**
```bash
# Fork the repo
git clone https://github.com/YOUR_USERNAME/portley.git
cd portley

# Set up development environment
# (see Quick Start above)

# Create a branch
git checkout -b feat/your-feature

# Make changes + add tests
git commit -m "feat: add your feature"

# Push and open PR
git push origin feat/your-feature
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🌟 Roadmap

- [ ] Mobile apps (iOS + Android)
- [ ] Advanced project management (Gantt charts, time tracking)
- [ ] Team collaboration features (@mentions, assignments)
- [ ] Custom reporting and dashboards
- [ ] API access for third-party integrations
- [ ] Multi-currency support beyond INR/USD/GBP/EUR
- [ ] Advanced automation (workflows, triggers, webhooks)

---

## 📞 Support

- **Documentation:** [docs.portley.app](https://docs.portley.app)
- **Issues:** [GitHub Issues](https://github.com/ravikumarve/portley/issues)
- **Email:** support@portley.app
- **Twitter:** [@portleyapp](https://twitter.com/portleyapp)

---

## 🙏 Acknowledgments

Built with ❤️ for solo consultants and small agencies everywhere.

Special thanks to:
- [Supabase](https://supabase.com) for the amazing backend platform
- [Vercel](https://vercel.com) for the excellent hosting experience
- [shadcn/ui](https://ui.shadcn.com) for the beautiful component library
- The open-source community for the incredible tools and libraries

---

<p align="center">
  <strong>Made with ❤️ by Ravi Kumar</strong>
</p>

<p align="center">
  <a href="https://twitter.com/ravikumarve">Twitter</a> ·
  <a href="https://github.com/ravikumarve">GitHub</a> ·
  <a href="https://linkedin.com/in/ravikumarve">LinkedIn</a>
</p>
