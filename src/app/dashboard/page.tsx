import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StudentSidebar from './StudentSidebar'

export default async function DashboardPage() {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'teacher') redirect('/teacher')

  const { data: courses } = await supabase
    .from('courses')
    .select('*, lessons(id)')
    .order('order_index')

  const { data: progressList } = await supabase
    .from('progress')
    .select('lesson_id, completed, score')
    .eq('student_id', user.id)

  const completedSet = new Set(progressList?.filter(p => p.completed).map(p => p.lesson_id))

  const levelLabel: Record<string, string> = {
    elementary: '초등',
    middle: '중등',
    high: '고등',
    all: '전체',
  }

  const levelColor: Record<string, string> = {
    elementary: 'bg-green-100 text-green-700',
    middle: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    all: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black text-indigo-600">CodeAI</span>
          <span className="text-xl font-black text-gray-800">School</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">안녕하세요, <strong>{profile?.name || '학생'}</strong>님!</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
          </form>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto w-full">
        <StudentSidebar />
        <main className="flex-1 px-6 py-10 lg:px-10">
        {/* 진도 요약 */}
        <div id="progress" className="bg-indigo-600 rounded-2xl p-6 text-white mb-8">
          <h2 className="text-lg font-bold mb-1">나의 학습 현황</h2>
          <p className="text-indigo-200 text-sm mb-4">꾸준히 하면 어느새 전문가가 되어있을 거예요!</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-black">{completedSet.size}</div>
              <div className="text-indigo-200 text-xs">완료한 레슨</div>
            </div>
            <div>
              <div className="text-3xl font-black">
                {progressList?.length ? Math.round(progressList.reduce((a, b) => a + (b.score || 0), 0) / progressList.length) : 0}
              </div>
              <div className="text-indigo-200 text-xs">평균 점수</div>
            </div>
            <div>
              <div className="text-3xl font-black">{courses?.length || 0}</div>
              <div className="text-indigo-200 text-xs">수강 가능 코스</div>
            </div>
          </div>
        </div>

        {/* 코스 목록 */}
        <h2 id="courses" className="text-2xl font-bold text-gray-900 mb-4">코스 목록</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses?.map((course) => {
            const totalLessons = course.lessons?.length || 0
            const completedLessons = course.lessons?.filter((l: { id: string }) => completedSet.has(l.id)).length || 0
            const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition block"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${levelColor[course.level]}`}>
                    {levelLabel[course.level]}
                  </span>
                  <span className="text-sm text-gray-400">{course.duration_weeks}주</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{completedLessons}/{totalLessons} 레슨</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
        </main>
      </div>
    </div>
  )
}
