/**
 * Portley Pricing Page
 * Simple, transparent pricing
 */

import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '2 clients',
        '3 projects',
        '500MB storage',
        'Basic project tracking',
        'File sharing',
        'Real-time messaging',
      ],
      cta: 'Get Started',
      featured: false,
      borderColor: '#27272a',
      bgColor: '#18181b',
    },
    {
      name: 'Solo',
      price: '$19',
      period: '/month',
      description: 'For freelancers and consultants',
      features: [
        'Unlimited clients',
        'Unlimited projects',
        '5GB storage',
        'White-label branding',
        'Invoicing',
        'Payment links',
        'Approval workflow',
        'AI invoice nudge',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      featured: true,
      borderColor: '#6366f1',
      bgColor: '#1e1b4b',
    },
    {
      name: 'Agency',
      price: '$49',
      period: '/month',
      description: 'For growing agencies',
      features: [
        'Everything in Solo',
        '20GB storage',
        '5 team members',
        'Custom domain',
        'Team collaboration',
        'Advanced analytics',
        'API access',
        'Dedicated support',
      ],
      cta: 'Start Free Trial',
      featured: false,
      borderColor: '#27272a',
      bgColor: '#18181b',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <section className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-text-2 max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-8 relative"
                style={{
                  border: `2px solid ${plan.borderColor}`,
                  backgroundColor: plan.bgColor,
                }}
              >
                {plan.featured && (
                  <div
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: '#6366f1',
                      color: 'white',
                    }}
                  >
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-text-2 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-text-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-accent hover:bg-accent-hover text-white'
                      : 'bg-surface hover:bg-surface2 border border-border'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="inline-block ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                question: 'Can I change plans later?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept credit cards (Visa, Mastercard, American Express) and UPI for Indian customers.',
              },
              {
                question: 'Is there a free trial?',
                answer: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.',
              },
              {
                question: 'Can I cancel anytime?',
                answer: 'Absolutely. You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
              },
              {
                question: 'What happens to my data if I cancel?',
                answer: 'Your data is safely stored for 30 days after cancellation. You can export your data at any time during this period.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-surface2 rounded-lg p-6">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-text-2">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-text-2 mb-8">
            Join thousands of freelancers and agencies who trust Portley
          </p>
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
