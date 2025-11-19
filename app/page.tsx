import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering to access runtime environment variables
export const dynamic = 'force-dynamic'

export default async function Home() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      isLoggedIn = true
    }
  } catch (error) {
    console.error('Error in root page:', error)
  }

  if (isLoggedIn) {
    redirect('/subjects')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <main className="flex flex-col items-center text-center max-w-2xl space-y-8">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Welcome to Axium
        </h1>
        <p className="text-xl text-gray-400">
          A personalized AI learning platform powered by adaptive learning and Bloom's Taxonomy.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  )
}
