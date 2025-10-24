import { useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function FeaturedPage() {
  const [billingPeriod, setBillingPeriod] = useState<'yearly' | 'monthly'>('yearly')

  const pricingPlans = [
    {
      name: 'Free',
      description: 'Best for personal use',
      price: '$0',
      period: '/month',
      features: [
        'Task Management',
        'Project Planning',
        'Team Collaboration',
        'Notifications and Reminders',
      ],
    },
    {
      name: 'Basic',
      description: 'Best for personal use',
      price: '$8',
      period: '/month',
      features: [
        'Kanban Boards',
        'Gantt Charts',
        'Resource Allocation',
        'Calendar Integration',
        'Progress Tracking',
      ],
    },
    {
      name: 'Premium',
      description: 'Best for personal use',
      price: '$16',
      period: '/month',
      features: [
        'Customizable Workflows',
        'Reporting and Analytics',
        'Document Management',
        'Agile Methodology Support',
        'Issue Tracking',
      ],
      isPopular: true,
    },
  ]

  const faqs = [
    {
      question: 'What is SaaSRow?',
      answer: 'SaaSRow is a growing software marketplace with 856,000+ monthly page views.',
    },
    {
      question: 'How does pricing work?',
      answer: 'Choose from our flexible plans based on your needs.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time.',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/2 left-[3.22%] bg-[#e0ff044c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 bottom-0 left-[-3.60%] bg-[#e0ff044c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <section className="w-full max-w-[1200px] mx-auto px-4 py-12 text-center">
          <p className="text-white text-xl max-w-3xl mx-auto mb-12 font-ubuntu">
            SaaSRow is a growing software marketplace with 856,000+ monthly page views.
            <br />
            People visit our platform when looking for alternatives or when comparing products.
          </p>

          <div className="mb-8">
            <div className="inline-flex bg-[#4a4a4a] rounded-full p-1 gap-1">
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full font-ubuntu font-bold transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800'
                    : 'text-white'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full font-ubuntu font-bold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800'
                    : 'text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-[#3a3a3a] rounded-3xl p-8 ${
                  plan.isPopular ? 'ring-2 ring-[#4FFFE3]' : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#E0FF04] to-[#4FFFE3] text-neutral-800 px-6 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-white text-3xl font-bold font-ubuntu mb-2">{plan.name}</h3>
                <p className="text-white/70 mb-6 font-ubuntu">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-white text-5xl font-bold font-ubuntu">{plan.price}</span>
                  <span className="text-white/70 font-ubuntu">{plan.period}</span>
                </div>
                <button
                  onClick={() => {
                    if (plan.name === 'Free') {
                      window.location.href = '/submit'
                    } else {
                      alert(`Checkout for ${plan.name} plan - Payment processing will be integrated here`)
                    }
                  }}
                  className="w-full py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity mb-6"
                >
                  {plan.name === 'Free' ? 'Submit Now' : 'Checkout'}
                </button>
                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-white font-ubuntu">
                      <svg
                        className="w-5 h-5 text-[#4FFFE3]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mb-12">
            <h2 className="text-white text-4xl font-bold font-ubuntu mb-8">
              Frequently Asked Questions
            </h2>
            <p className="text-white text-xl max-w-3xl mx-auto mb-8 font-ubuntu">
              Quick answers to questions you may have. If you don't see what's on your mind, reach
              out to us anytime on social media
            </p>
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-[#3a3a3a] rounded-2xl p-6 text-left">
                  <h3 className="text-white text-xl font-bold font-ubuntu mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-white/70 font-ubuntu">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
