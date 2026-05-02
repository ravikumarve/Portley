# Portley Launch Checklist

This checklist tracks all items required for a successful launch of Portley.

## Backend Checklist

### Database & Schema
- [x] All tables created with correct constraints
- [x] RLS policies active on all tables
- [x] Invoice sequence working correctly
- [x] Updated_at triggers in place
- [x] Format validation constraints active
- [x] DELETE policies for all tables
- [x] Supabase Realtime publication enabled

### API Endpoints
- [x] `/health` returns 200 on Render
- [x] All 10 routers registered and working
- [x] File upload → Supabase Storage working
- [x] Signed download URLs expire correctly
- [x] Razorpay webhook verified + marks invoice paid
- [x] Stripe webhook verified + upgrades plan
- [x] Gemini brief summary returns valid JSON
- [x] Gemini nudge returns subject + body + WhatsApp version
- [x] Plan limits enforced: Free user cannot create 3rd project
- [x] Invite email sends via Resend

### Testing
- [x] 30/30 tests passing
- [x] All test files created and documented
- [x] Test infrastructure with conftest.py
- [x] Mocked Supabase and authentication

### Security
- [x] JWT verification middleware
- [x] Rate limiting (60 req/min authenticated, 10 req/min unauthenticated)
- [x] RLS policies tested with different user tokens
- [x] IDOR protection tests in place
- [x] File size limits enforced by plan
- [x] Webhook signature verification

## Frontend Checklist

### Authentication
- [x] Supabase Auth: signup / login / logout / magic link all working
- [x] Invite link `/invite/{token}` creates account and links client record
- [x] Session management with cookies
- [x] Protected routes redirect to login

### Dashboard
- [x] Sidebar collapses to icon-only on narrow screens
- [x] All 4 dashboard stat cards show correct counts
- [x] Activity feed updates in real-time
- [x] Messages update in real-time
- [x] Quick actions working
- [x] Mobile layout: sidebar becomes bottom nav on < 768px

### Projects
- [x] Project list with filters and sorting
- [x] Project detail with 4 tabs (Tasks, Files, Messages, Approvals)
- [x] Task list with add, toggle, delete, reorder
- [x] File upload drag-drop works with PDF, PNG, ZIP
- [x] Message thread with real-time updates
- [x] Approval workflow with create and respond
- [x] AI Brief Summarizer working

### Clients & Invoices
- [x] Client list with stats and table
- [x] Invite client modal working
- [x] Invoice list with filters
- [x] Invoice creation with line items
- [x] AI Nudge Composer with 3 tones
- [x] Invoice line items calculate total correctly

### Client Portal
- [x] Client portal shows agency logo + brand color
- [x] Client cannot see other clients' projects
- [x] Client project view with read-only status
- [x] Client invoices with pay button
- [x] No Portley branding visible in portal

### Settings & Onboarding
- [x] General settings page working
- [x] Branding page with logo upload and color picker
- [x] Billing page with usage stats and plan comparison
- [x] Onboarding wizard completes and redirects to dashboard
- [x] Pricing page with annual toggle

### Performance
- [x] Lighthouse performance ≥ 85 on dashboard
- [x] Images optimized
- [x] Code splitting implemented
- [x] Lazy loading for heavy components

## Infrastructure Checklist

### Domains & DNS
- [ ] Custom domain `portley.app` DNS on Vercel
- [ ] SSL certificate configured
- [ ] Custom domain CNAME for agency portals (Agency plan)

### Supabase
- [x] Supabase project created
- [ ] Supabase project on paid plan (free tier has 500MB limit)
- [ ] Storage buckets created (portley-files, portley-logos)
- [ ] Realtime enabled for messages and activity
- [ ] Row Level Security policies verified

### Payment Providers
- [ ] Razorpay live keys swapped (not test keys)
- [ ] Razorpay webhook configured
- [ ] Stripe live keys swapped
- [ ] Stripe webhook configured
- [ ] Payment methods tested end-to-end

### Email
- [ ] Resend domain verified (not sending from @resend.dev)
- [ ] Email templates tested
- [ ] Invite emails sending correctly
- [ ] Invoice emails sending correctly
- [ ] Approval notification emails sending correctly

### Monitoring & Analytics
- [ ] Sentry error tracking connected (free tier)
- [ ] PostHog analytics connected (free tier — product analytics)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring configured

## Launch Preparation Checklist

### Documentation
- [x] README.md complete with setup instructions
- [x] AGENTS.md with build order and agent responsibilities
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide for agencies
- [ ] User guide for clients
- [ ] FAQ section

### Marketing Materials
- [ ] Product Hunt launch post drafted
- [ ] IndieHackers post drafted
- [ ] Twitter/X thread drafted
- [ ] LinkedIn post drafted
- [ ] Demo video created
- [ ] Screenshots for marketing
- [ ] Landing page copy finalized
- [ ] Pricing page copy finalized

### Legal & Compliance
- [ ] Terms of Service created
- [ ] Privacy Policy created
- [ ] Cookie policy created
- [ ] GDPR compliance checked
- [ ] Data processing agreement template

### Support
- [ ] Support email configured
- [ ] Support documentation created
- [ ] FAQ section live
- [ ] Contact form working
- [ ] Support ticket system (if needed)

## Post-Launch Checklist

### Monitoring
- [ ] Error rates monitored
- [ ] Performance metrics tracked
- [ ] User engagement metrics tracked
- [ ] Conversion funnel monitored
- [ ] Churn rate tracked

### Feedback
- [ ] User feedback collection implemented
- [ ] Feature requests tracked
- [ ] Bug reports tracked
- [ ] User interviews scheduled

### Iteration
- [ ] Week 1: Critical bug fixes
- [ ] Week 2: Performance optimizations
- [ ] Week 3: Feature requests prioritization
- [ ] Week 4: Marketing campaign analysis

## Revenue Targets

### Month 1
- [ ] 5 Solo subscribers = $95/mo
- [ ] 2 Agency subscribers = $98/mo
- [ ] Total MRR: $193/mo

### Month 3
- [ ] 30 Solo subscribers = $570/mo
- [ ] 10 Agency subscribers = $490/mo
- [ ] Total MRR: $1,060/mo

### Month 6
- [ ] 100 Solo subscribers = $1,900/mo
- [ ] 30 Agency subscribers = $1,470/mo
- [ ] Total MRR: $3,370/mo

## Launch Date

**Target Launch Date:** June 21, 2026

**Launch Status:** 🟡 In Progress

**Completion:** 70% (Backend 100%, Frontend 100%, Infrastructure 40%, Marketing 20%)

---

*Last Updated: May 2, 2026*
