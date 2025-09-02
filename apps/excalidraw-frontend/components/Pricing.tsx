import { Check, Shield } from 'lucide-react'

const tiers = [
  {
    name: 'Hobby',
    href: '#',
    priceMonthly: 0,
    description: 'Perfect for individuals and small teams just getting started.',
    includedFeatures: ['5 whiteboards', 'Up to 3 team members', 'Basic shapes and tools', '1GB storage'],
  },
  {
    name: 'Freelancer',
    href: '#',
    priceMonthly: 24,
    description: 'Great for freelancers and growing teams with more needs.',
    includedFeatures: [
      'Unlimited whiteboards',
      'Up to 10 team members',
      'Advanced shapes and tools',
      '10GB storage',
      'Priority support',
    ],
  },
  {
    name: 'Startup',
    href: '#',
    priceMonthly: 32,
    description: 'For larger teams and organizations with advanced requirements.',
    includedFeatures: [
      'Unlimited whiteboards',
      'Unlimited team members',
      'Advanced shapes and tools',
      '100GB storage',
      'Priority support',
      'Custom templates',
      'Admin controls',
    ],
  },
]

export default function Pricing() {
  return (
    <div className="bg-white dark:bg-zinc-900" id="pricing">
      <div className="pt-12 sm:pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">Plans for teams of all sizes</h2>
            <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
              Choose an affordable plan that's packed with the best features for your needs.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8 pb-16 sm:mt-12 sm:pb-20 lg:pb-28">
        <div className="relative">
          <div className="absolute inset-0 h-1/2 bg-white dark:bg-zinc-900" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {tiers.map((tier) => (
                <div key={tier.name} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-400/30">
                  <div className="px-6 py-8 sm:p-10 sm:pb-6 flex-grow">
                    <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-3xl">{tier.name}</h3>
                    <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400">{tier.description}</p>
                    <p className="mt-8">
                      <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">${tier.priceMonthly}</span>{' '}
                      <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">/mo</span>
                    </p>
                    <ul role="list" className="mt-6 space-y-4">
                      {tier.includedFeatures.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                          </div>
                          <p className="ml-3 text-sm text-zinc-700 dark:text-zinc-300">{feature}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-6 pt-6 pb-8 sm:px-10 sm:pt-6 sm:pb-8 bg-white dark:bg-zinc-950">
                    <a
                      href={tier.href}
                      className="block w-full bg-yellow-600 dark:border-zinc-900 rounded-md py-2 text-md font-semibold text-white text-center hover:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                      Buy {tier.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

