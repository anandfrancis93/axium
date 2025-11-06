import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxtcgyvxgyffaaeugjwc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dGNneXZ4Z3lmZmFhZXVnandjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzk5OSwiZXhwIjoyMDc3ODc5OTk5fQ.mmNbBksqgSCpfjFknzqNYMKHaLdgoWW9AOx8IpbMRYc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAuthStatus() {
  // Get all users to see if any are logged in
  const { data: users, error } = await supabase.auth.admin.listUsers()

  console.log('=== USERS IN SYSTEM ===')
  console.log(`Total users: ${users?.users?.length || 0}`)

  if (users && users.users.length > 0) {
    users.users.forEach((u, i) => {
      console.log(`\nUser ${i + 1}:`)
      console.log(`  ID: ${u.id}`)
      console.log(`  Email: ${u.email}`)
      console.log(`  Created: ${u.created_at}`)
      console.log(`  Last sign in: ${u.last_sign_in_at || 'Never'}`)
    })
  } else {
    console.log('\n❌ No users found!')
    console.log('\nYou need to log in via Google SSO at http://localhost:3000/login')
  }
}

checkAuthStatus().catch(console.error)
