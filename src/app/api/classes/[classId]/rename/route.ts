import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { name } = await req.json()
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return NextResponse.json({ error: '학급명을 입력해주세요.' }, { status: 400 })
  }

  const { error } = await admin
    .from('classes')
    .update({ name: name.trim() })
    .eq('id', classId)
    .eq('teacher_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
