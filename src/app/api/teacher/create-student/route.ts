import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  // 교사 권한 확인
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: '교사 계정만 학생을 생성할 수 있습니다.' }, { status: 403 })
  }

  // Rate limit: 교사당 하루 100명 생성 가능
  const limit = rateLimit(`create-student:${user.id}`, 100, 86400)
  if (!limit.ok) {
    return NextResponse.json({ error: '오늘 학생 생성 한도를 초과했습니다.' }, { status: 429 })
  }

  const { student_code, name, class_id, grade_level } = await req.json()

  if (!student_code || !name || !grade_level) {
    return NextResponse.json({ error: '학번, 이름, 학교급을 모두 입력해주세요.' }, { status: 400 })
  }

  // 학번 형식 검사 (영문+숫자만, 3~20자)
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(student_code)) {
    return NextResponse.json({ error: '학번은 영문·숫자·_·- 조합 3~20자로 입력해주세요.' }, { status: 400 })
  }

  // 임시 비밀번호 생성 — crypto.getRandomValues() 사용 (Math.random 비적합)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const randomBytes = new Uint8Array(8)
  crypto.getRandomValues(randomBytes)
  const tempPassword = Array.from(randomBytes, (b) => chars[b % chars.length]).join('')

  // 학생용 내부 이메일 (Supabase auth는 이메일 기반이므로 내부 주소 사용)
  const fakeEmail = `${student_code.toLowerCase()}@students.internal`

  // Supabase auth에 학생 계정 생성
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: fakeEmail,
    password: tempPassword,
    email_confirm: true, // 이메일 인증 없이 바로 활성화
    user_metadata: { name, role: 'student', grade_level },
  })

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      return NextResponse.json({ error: '이미 존재하는 학번입니다.' }, { status: 400 })
    }
    return NextResponse.json({ error: '계정 생성 오류: ' + authError.message }, { status: 500 })
  }

  // 프로필 저장
  const { error: profileError } = await admin.from('profiles').upsert({
    id: authData.user.id,
    email: fakeEmail,
    name,
    role: 'student',
    grade_level,
    student_code: student_code.toLowerCase(),
    must_change_password: true,
  })

  if (profileError) {
    // 프로필 저장 실패 시 auth 계정도 삭제
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: '프로필 저장 오류' }, { status: 500 })
  }

  // 학급에 추가 (class_id가 있는 경우)
  if (class_id) {
    // 교사가 해당 학급의 소유자인지 확인
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', class_id)
      .eq('teacher_id', user.id)
      .single()

    if (cls) {
      await admin.from('class_students').upsert({
        class_id,
        student_id: authData.user.id,
      })
    }
  }

  return NextResponse.json({
    success: true,
    student_code: student_code.toLowerCase(),
    temp_password: tempPassword,
    name,
  })
}
