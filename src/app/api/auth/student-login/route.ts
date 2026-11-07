import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const STUDENT_SALT = process.env.STUDENT_AUTH_SECRET || 'codeai2026'

export async function POST(req: NextRequest) {
  const { student_code } = await req.json()

  if (!student_code || typeof student_code !== 'string') {
    return NextResponse.json({ error: '학번을 입력해주세요.' }, { status: 400 })
  }

  const code = student_code.toLowerCase().trim()
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, student_code, email')
    .eq('student_code', code)
    .eq('role', 'student')
    .single()

  if (!profile) {
    return NextResponse.json({ error: '학번을 찾을 수 없어요. 선생님께 확인해주세요.' }, { status: 404 })
  }

  // 결정론적 비밀번호로 업데이트 (학번 기반 자동 로그인용)
  const derivedPassword = `SK-${code}-${STUDENT_SALT}`
  await admin.auth.admin.updateUserById(profile.id, { password: derivedPassword })

  // 로그인 처리 (SSR 클라이언트가 자동으로 쿠키 설정)
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email || `${code}@students.internal`,
    password: derivedPassword,
  })

  if (error) {
    return NextResponse.json({ error: '로그인 실패. 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
