import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ChangePasswordForm from './ChangePasswordForm'

export default async function SettingsPage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('name, role, must_change_password')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">계정 설정</h1>
        <p className="text-gray-500 text-sm mb-6">{profile?.name}님의 비밀번호를 변경합니다.</p>

        {profile?.must_change_password && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-3 rounded-xl mb-6">
            ⚠️ 임시 비밀번호를 사용 중입니다. 지금 바로 변경해주세요!
          </div>
        )}

        <ChangePasswordForm mustChange={profile?.must_change_password ?? false} role={profile?.role ?? 'student'} />
      </div>
    </div>
  )
}
