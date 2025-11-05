import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="max-w-md w-full space-y-8 p-8 neuro-container mx-4 text-center">
        <div>
          <div className="neuro-raised inline-block px-6 py-3 mb-4">
            <h1 className="text-3xl font-bold text-red-400">
              Authentication Error
            </h1>
          </div>
          <p className="text-gray-400 mb-6">
            There was an error signing you in. This could be due to:
          </p>
          <ul className="text-left text-sm text-gray-500 space-y-3 mb-8">
            <li className="neuro-inset p-3 rounded-lg">• Cancelled the sign-in process</li>
            <li className="neuro-inset p-3 rounded-lg">• Invalid authentication code</li>
            <li className="neuro-inset p-3 rounded-lg">• Session expired</li>
            <li className="neuro-inset p-3 rounded-lg">• Google OAuth not properly configured</li>
          </ul>
        </div>
        <Link
          href="/login"
          className="inline-block neuro-btn-primary px-8 py-3 rounded-lg font-medium"
        >
          Try Again
        </Link>
      </div>
    </div>
  )
}
