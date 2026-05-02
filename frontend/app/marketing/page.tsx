/**
 * Portley Landing Page
 * Your portal. Your brand. Your clients.
 */

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-20">
        {/* Indigo radial gradient glow */}
        <div 
          className="absolute inset-0 opacity-100"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)'
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
          <div className="text-center">
            <h1 className="mb-6">
              <div 
                className="font-extrabold"
                style={{
                  fontSize: 'clamp(52px, 8vw, 88px)',
                  color: '#fafafa',
                  lineHeight: '1.1'
                }}
              >
                Your Portal.
              </div>
              <div 
                className="font-extrabold"
                style={{
                  fontSize: 'clamp(52px, 8vw, 88px)',
                  color: '#6366f1',
                  lineHeight: '1.1'
                }}
              >
                Your Brand.
              </div>
              <div 
                className="font-extrabold"
                style={{
                  fontSize: 'clamp(52px, 8vw, 88px)',
                  color: '#fafafa',
                  lineHeight: '1.1'
                }}
              >
                Your Clients.
              </div>
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
      <section className="pt-20 pb-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-12"
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#6366f1'
            }}
          >
            THE PROBLEM
          </div>
          
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
      <section className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-12"
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#6366f1'
            }}
          >
            FEATURES
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to look professional
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: White-label branding */}
            <div
              className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors"
              style={{ borderLeft: '3px solid #6366f1' }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mb-4"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">White-label branding</h3>
              <p className="text-text-2 text-sm">
                Your logo. Your colors. Clients never see Portley.
              </p>
            </div>

            {/* Feature 2: Project tracking */}
            <div
              className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors"
              style={{ borderLeft: '3px solid #10b981' }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mb-4"
              >
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Project tracking</h3>
              <p className="text-text-2 text-sm">
                Tasks, deadlines, and progress. Clients see it live.
              </p>
            </div>

            {/* Feature 3: Real-time messages */}
            <div
              className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors"
              style={{ borderLeft: '3px solid #f59e0b' }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mb-4"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Real-time messages</h3>
              <p className="text-text-2 text-sm">
                WebSocket-powered. No refresh. No polling.
              </p>
            </div>

            {/* Feature 4: File sharing */}
            <div
              className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors"
              style={{ borderLeft: '3px solid #8b5cf6' }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mb-4"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">File sharing</h3>
              <p className="text-text-2 text-sm">
                Upload, preview, download. 50MB per file.
              </p>
            </div>

            {/* Feature 5: Approval workflow */}
            <div
              className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors"
              style={{ borderLeft: '3px solid #ef4444' }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mb-4"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Approval workflow</h3>
              <p className="text-text-2 text-sm">
                Request sign-off. Clients approve or request changes.
              </p>
            </div>

            {/* Feature 6: AI invoice nudge */}
            <div
              className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors"
              style={{ borderLeft: '3px solid #06b6d4' }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mb-4"
              >
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                <path d="M12 12L2.1 12.05"/>
                <path d="M12 12l9.9-0.05"/>
                <path d="M12 12l-5.5 9.5"/>
                <path d="M12 12l5.5-9.5"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">AI invoice nudge</h3>
              <p className="text-text-2 text-sm">
                Gemini writes your payment reminder. You send it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pt-20 pb-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="text-center mb-12"
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#6366f1'
            }}
          >
            PRICING
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-text-2 text-center mb-12">
            Start free, upgrade when you're ready
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div
              className="rounded-lg p-6"
              style={{
                background: '#18181b',
                border: '1px solid #27272a'
              }}
            >
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="space-y-2 mb-6">
                {['2 clients', '3 projects', '500MB storage'].map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2 text-sm">
                    <span className="text-success">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="block text-center py-2 px-4 rounded-lg font-semibold transition-colors bg-surface hover:bg-surface2 border border-border"
              >
                Get Started
              </Link>
            </div>

            {/* Solo Plan - Featured */}
            <div
              className="rounded-lg p-6 relative"
              style={{
                background: '#1e1b4b',
                border: '2px solid #6366f1'
              }}
            >
              <div 
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: '#6366f1',
                  color: 'white'
                }}
              >
                Most Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Solo</h3>
              <p className="text-3xl font-bold mb-4">$19/mo</p>
              <ul className="space-y-2 mb-6">
                {['Unlimited clients', 'Unlimited projects', '5GB storage', 'White-label', 'Invoicing', 'Approvals', 'AI features'].map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2 text-sm">
                    <span className="text-success">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="block text-center py-2 px-4 rounded-lg font-semibold transition-colors bg-accent hover:bg-accent-hover text-white"
              >
                Get Started
              </Link>
            </div>

            {/* Agency Plan */}
            <div
              className="rounded-lg p-6"
              style={{
                background: '#18181b',
                border: '1px solid #27272a'
              }}
            >
              <h3 className="text-xl font-bold mb-2">Agency</h3>
              <p className="text-3xl font-bold mb-4">$49/mo</p>
              <ul className="space-y-2 mb-6">
                {['Everything in Solo', '20GB storage', '5 team members', 'Custom domain', 'Priority support'].map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2 text-sm">
                    <span className="text-success">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="block text-center py-2 px-4 rounded-lg font-semibold transition-colors bg-surface hover:bg-surface2 border border-border"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-20 pb-20">
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
