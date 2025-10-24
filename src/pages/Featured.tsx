import { useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function FeaturedPage() {
  const [billingPeriod, setBillingPeriod] = useState<'yearly' | 'monthly'>('yearly')

  const pricingPlans = [
    {
      name: 'Free',
      description: 'Perfect for trying us out',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        'Submit 1 software listing',
        'Basic listing page',
        'Community visibility',
        'Standard review time (7-10 days)',
      ],
    },
    {
      name: 'Basic',
      description: 'For growing companies',
      monthlyPrice: 1,
      yearlyPrice: 10,
      features: [
        'Up to 5 software listings',
        'Featured badge on listings',
        'Priority review (2-3 days)',
        'Monthly performance analytics',
        'Logo in category pages',
        'Social media mentions',
      ],
    },
    {
      name: 'Premium',
      description: 'For established brands',
      monthlyPrice: 3,
      yearlyPrice: 30,
      features: [
        'Unlimited software listings',
        'Homepage featured spot',
        'Same-day review',
        'Advanced analytics dashboard',
        'Custom company profile page',
        'Newsletter feature (200K+ subscribers)',
        'Dedicated account manager',
        'SEO optimization support',
      ],
      isPopular: true,
    },
  ]

  const faqs = [
    {
      question: 'What is SaaSRow?',
      answer: 'SaaSRow is a growing software marketplace with 856,000+ monthly page views where users discover and compare software solutions.',
    },
    {
      question: 'How does pricing work?',
      answer: 'Choose from our flexible plans based on your needs. Annual plans save you 2 months compared to monthly billing. All paid plans include priority support.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. Your listings will remain active until the end of your billing period.',
    },
    {
      question: 'What happens to my listings if I downgrade?',
      answer: 'Your listings stay active, but premium features like featured badges and priority placement will be removed. You can always upgrade again.',
    },
  ]

  const getDisplayPrice = (plan: typeof pricingPlans[0]) => {
    if (plan.monthlyPrice === 0) return '$0'
    const price = billingPeriod === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice
    return `$${price.toFixed(2).replace(/\.00$/, '')}`
  }

  const getSavings = (plan: typeof pricingPlans[0]) => {
    if (plan.monthlyPrice === 0) return null
    const yearlySavings = (plan.monthlyPrice * 12) - plan.yearlyPrice
    return yearlySavings > 0 ? `Save $${yearlySavings}/year` : null
  }

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
          <h1 className="text-white text-5xl font-bold font-ubuntu mb-4">
            Get Your Software Featured
          </h1>
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
                Yearly <span className="text-sm opacity-70">(Save 17%)</span>
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
                <div className="mb-2">
                  <span className="text-white text-5xl font-bold font-ubuntu">
                    {getDisplayPrice(plan)}
                  </span>
                  <span className="text-white/70 font-ubuntu">/month</span>
                </div>
                {billingPeriod === 'yearly' && getSavings(plan) && (
                  <p className="text-[#4FFFE3] text-sm font-ubuntu mb-4">{getSavings(plan)}</p>
                )}
                {billingPeriod === 'yearly' && plan.yearlyPrice > 0 && (
                  <p className="text-white/50 text-sm font-ubuntu mb-4">
                    Billed ${plan.yearlyPrice} annually
                  </p>
                )}
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
                  {plan.name === 'Free' ? 'Submit Now' : 'Get Started'}
                </button>
                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-white font-ubuntu">
                      <svg
                        className="w-5 h-5 text-[#4FFFE3] flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm">{feature}</span>
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
