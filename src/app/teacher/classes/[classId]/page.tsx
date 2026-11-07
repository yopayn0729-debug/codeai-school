import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  await connection()
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher') redirect('/dashboard')

  const { data: cls } = await admin
    .from('classes')
    .select('*')
    .eq('id', classId)
    .eq('teacher_id', user.id)
    .single()

  if (!cls) redirect('/teacher')

  const { data: classStudents } = await admin
    .from('class_students')
    .select('student_id, profiles(id, name, student_code, grade_level)')
    .eq('class_id', classId)

  const studentIds = classStudents?.map((cs: any) => cs.student_id) || []

  const { data: allProgress } = studentIds.length > 0
    ? await admin.from('progress').select('student_id, lesson_id, score, completed').in('student_id', studentIds)
    : { data: [] }

  const { data: courses } = await admin.from('courses').select('id, title, lessons(id, title, order_index)').order('order_index')

  const progressByStudent = new Map<string, { completed: number; total: number; avgScore: number }>()
  for (const sid of studentIds) {
    const sp = allProgress?.filter(p => p.student_id === sid) || []
    const totalLessons = courses?.reduce((acc: number, c: any) => acc + (c.lessons?.length || 0), 0) || 0
    const completed = sp.filter(p => p.completed).length
    const scores = sp.map(p => p.score).filter((s): s is number => s !== null)
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    progressByStudent.set(sid, { completed, total: totalLessons, avgScore })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/teacher" className="text-indigo-600 hover:underline text-sm">← 교사 대시보드</Link>
        <span className="text-gray-400">/</span>
        <span className="font-bold text-gray-800">{cls.name}</span>
        <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-mono px-2 py-0.5 rounded">{cls.invite_code}</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-900">학생 진도 현황</h1>
          <span className="text-sm text-gray-500">총 {classStudents?.length || 0}명</span>
        </div>

        {(!classStudents || classStudents.length === 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400">아직 학생이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">교사 대시보드에서 학생 계정을 발급하세요.</p>
          </div>
        )}

        <div className="space-y-3">
          {classStudents?.map((cs: any) => {
            const student = cs.profiles
            const prog = progressByStudent.get(cs.student_id) || { completed: 0, total: 0, avgScore: 0 }
            const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0
            return (
              <div key={cs.student_id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-gray-900">{student?.name || '(이름 없음)'}</span>
                    <span className="ml-2 text-sm text-gray-400 font-mono">{student?.student_code}</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{student?.grade_level}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600">{prog.avgScore}점</span>
                    <span className="text-xs text-gray-400 ml-1">평균</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-24 text-right">{prog.completed}/{prog.total} 레슨 ({pct}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
