import Link from 'next/link'
import { PencilRuler } from 'lucide-react'

import { DarkModeToggle } from '@/components/DarkModeToogle'

export default function Header() {
  return (
    <header className="bg-white dark:bg-zinc-900 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-yellow-500 lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <span className="sr-only">DoodleDeck</span>
              <PencilRuler className="h-8 w-auto text-yellow-600" />
            </Link>
            <div className="hidden ml-10 space-x-8 lg:block">
              <Link href="#features" className="text-base font-medium dark:text-zinc-300 hover:text-yellow-700 dark:hover:text-yellow-400">
                Features
              </Link>
              <Link href="#how-it-works" className="text-base font-medium dark:text-zinc-300 hover:text-yellow-700 dark:hover:text-yellow-400">
                How It Works
              </Link>
              <Link href="#pricing" className="text-base font-medium dark:text-zinc-300 hover:text-yellow-700 dark:hover:text-yellow-400">
                Pricing
              </Link>
              <Link href="/canvas" className="text-base font-medium dark:text-zinc-300 hover:text-yellow-700 dark:hover:text-yellow-400">
                Canvas
              </Link>
            </div>
          </div>
          <div className="ml-10 space-x-4 flex items-center">
            {/* <DarkModeToggle /> */}
            <Link href="/signin" className="inline-block bg-yellow-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-opacity-75">
              Sign in
            </Link>
            <Link href="/signup" className="inline-block bg-white dark:bg-zinc-800 py-2 px-4 border border-transparent rounded-md text-base font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-zinc-700">
              Sign up
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

