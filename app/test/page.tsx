export default function TestPage() {
  return (
    <div style={{
      background: '#0a0a0a',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h1 style={{ color: '#e0e0e0', fontSize: '3rem' }}>
        Test Page
      </h1>
      <p style={{ color: '#a0a0a0' }}>
        If you can see this, the deployment is working!
      </p>
      <a href="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
        Go to Login
      </a>
    </div>
  )
}
