/**
 * Portley Landing Page
 * Your portal. Your brand. Your clients.
 */

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Your portal. Your brand.{' '}
              <span className="text-accent">Your clients.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-text-2 max-w-3xl mx-auto mb-10">
              White-label client portal for freelancers and agencies. Projects, files, invoicing, and real-time messaging — all under your brand.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors text-lg"
              >
                Start Free →
              </Link>
              
              <Link
                href="#how-it-works"
                className="px-8 py-4 border border-border hover:border-text-3 text-text font-semibold rounded-lg transition-colors text-lg"
              >
                See how it works
              </Link>
            </div>
            
            <p className="mt-6 text-text-3 text-sm">
              No credit card required · 2 clients free forever
            </p>
          </div>
        </div>
      </section>

      {/* Problem Strip */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Stop managing clients through email chaos
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                before: "Emailing files back and forth",
                after: "One shared portal",
              },
              {
                before: "Clients asking 'what's the status?'",
                after: "Real-time project view",
              },
              {
                before: "Chasing payments over WhatsApp",
                after: "Automated invoice + pay link",
              },
            ].map((item, index) => (
              <div key={index} className="bg-surface2 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-danger text-xl">❌</span>
                  <p className="text-text-2">{item.before}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-success text-xl">✅</span>
                  <p className="text-text font-semibold">{item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to look professional
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "White-label branding",
              "Project tracking",
              "Real-time messages",
              "File sharing",
              "Approval workflow",
              "AI invoice nudge",
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors"
              >
                <div className="w-10 h-10 bg-accent-glow rounded-lg flex items-center justify-center mb-4">
                  <span className="text-accent text-xl font-bold">{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature}</h3>
                <p className="text-text-2 text-sm">
                  Professional feature to impress your clients and streamline your workflow.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-text-2 text-center mb-12">
            Start free, upgrade when you're ready
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                features: ['2 clients', '3 projects', '500MB storage'],
              },
              {
                name: 'Solo',
                price: '$19/mo',
                featured: true,
                features: ['Unlimited clients', 'Unlimited projects', '5GB storage', 'White-label', 'Invoicing', 'Approvals', 'AI features'],
              },
              {
                name: 'Agency',
                price: '$49/mo',
                features: ['Everything in Solo', '20GB storage', '5 team members', 'Custom domain', 'Priority support'],
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-surface2 rounded-lg p-6 border-2 ${
                  plan.featured ? 'border-accent' : 'border-border'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm">
                      <span className="text-success">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center py-2 px-4 rounded-lg font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-accent hover:bg-accent-hover text-white'
                      : 'bg-surface hover:bg-surface2 border border-border'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to look professional?
          </h2>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Start Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-text-3 text-sm">
          <p>© 2026 Portley. Your portal. Your brand. Your clients.</p>
        </div>
      </footer>
    </div>
  )
}
