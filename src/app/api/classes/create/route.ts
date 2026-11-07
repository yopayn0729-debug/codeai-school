import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 교사 권한 확인 — 학생은 학급 생성 불가
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: '교사 계정만 학급을 생성할 수 있습니다.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({ teacher_id: user.id, name: `새 학급 ${new Date().toLocaleDateString('ko-KR')}` })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.redirect(new URL('/teacher', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
