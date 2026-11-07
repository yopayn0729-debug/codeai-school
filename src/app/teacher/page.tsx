import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CreateStudentForm from './CreateStudentForm'

export default async function TeacherPage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect('/dashboard')

  const { data: classes } = await admin
    .from('classes')
    .select('*, class_students(student_id)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black text-indigo-600">CodeAI</span>
          <span className="text-xl font-black text-gray-800">School</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">선생님 대시보드 · <strong>{profile?.name}</strong></span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 왼쪽: 학급 목록 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900">내 학급</h1>
            <form action="/api/classes/create" method="POST">
              <button
                type="submit"
                className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-sm"
              >
                + 새 학급 만들기
              </button>
            </form>
          </div>

          {(!classes || classes.length === 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-gray-400 mb-2">아직 학급이 없어요.</p>
              <p className="text-sm text-gray-400">학급을 만들고 초대 코드를 학생들에게 공유하세요.</p>
            </div>
          )}

          {classes?.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                {/* 보안 #6: 초대 코드 8자로 늘림 (schema에서 적용) */}
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">학급 초대 코드</p>
                  <span className="bg-indigo-100 text-indigo-700 text-sm font-mono font-bold px-3 py-1 rounded-lg">
                    {cls.invite_code}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>👥 학생 {cls.class_students?.length || 0}명</span>
              </div>
              <Link
                href={`/teacher/classes/${cls.id}`}
                className="block text-center text-sm text-indigo-600 border border-indigo-200 rounded-xl py-2 hover:bg-indigo-50 transition"
              >
                학생 진도 보기 →
              </Link>
            </div>
          ))}
        </div>

        {/* 오른쪽: 학생 계정 생성 */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">학생 계정 발급</h2>
          <CreateStudentForm classes={classes || []} />
        </div>
      </div>
    </div>
  )
}
