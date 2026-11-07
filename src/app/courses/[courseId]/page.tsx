import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  await connection()
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: course } = await supabase
    .from('courses')
    .select('*, lessons(*)')
    .eq('id', courseId)
    .single()

  if (!course) redirect('/dashboard')

  const { data: progressList } = await supabase
    .from('progress')
    .select('lesson_id, completed, score')
    .eq('student_id', user.id)

  const progressMap = new Map(progressList?.map(p => [p.lesson_id, p]))

  const sortedLessons = [...(course.lessons || [])].sort((a: any, b: any) => a.order_index - b.order_index)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-indigo-600 hover:underline text-sm">← 대시보드</Link>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-800">{course.title}</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{course.title}</h1>
        <p className="text-gray-500 mb-8">{course.description} · {course.duration_weeks}주 과정</p>

        <h2 className="text-lg font-bold text-gray-800 mb-4">레슨 목록</h2>
        <div className="space-y-3">
          {sortedLessons.length === 0 && (
            <p className="text-gray-400 text-sm">레슨이 아직 준비 중이에요.</p>
          )}
          {sortedLessons.map((lesson: any, idx: number) => {
            const prog = progressMap.get(lesson.id)
            return (
              <Link
                key={lesson.id}
                href={`/courses/${courseId}/lessons/${lesson.id}`}
                className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  prog?.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {prog?.completed ? '✓' : idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                  {prog?.score !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">{prog.score}점 획득</p>
                  )}
                </div>
                <span className="text-indigo-400 text-sm">시작 →</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
