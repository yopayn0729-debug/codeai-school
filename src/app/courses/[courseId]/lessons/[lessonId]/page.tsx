import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LessonClient from './LessonClient'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  await connection()
  const { courseId, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, courses(title)')
    .eq('id', lessonId)
    .eq('course_id', courseId)   // 다른 코스의 레슨 접근 차단
    .single()

  if (!lesson) redirect(`/courses/${courseId}`)

  const { data: progress } = await supabase
    .from('progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  return (
    <LessonClient
      lesson={lesson}
      userId={user.id}
      gradeLevel={profile?.grade_level || 'middle'}
      savedCode={progress?.submitted_code || lesson.starter_code || ''}
      previousScore={progress?.score}
      previousFeedback={progress?.feedback}
    />
  )
}
