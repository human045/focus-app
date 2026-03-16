import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [todosRes, settingsRes, statsRes] = await Promise.all([
    supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('daily_focus_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('day', { ascending: false })
      .limit(30),
  ])

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: displayName,
        avatar: user.user_metadata?.avatar_url,
        email: user.email,
      }}
      initialTodos={todosRes.data || []}
      initialSettings={settingsRes.data}
      initialStats={statsRes.data || []}
    />
  )
}
