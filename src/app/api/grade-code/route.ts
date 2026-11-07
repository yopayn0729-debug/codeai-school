import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const limit = rateLimit(`grade:${user.id}`, 30, 3600)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `제출 횟수를 초과했습니다. ${limit.retryAfterSec}초 후 다시 시도해주세요.` },
      { status: 429 }
    )
  }

  let body: { code?: unknown; lessonId?: unknown; gradeLevel?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { code, lessonId, gradeLevel } = body

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ score: 0, passed: false, feedback: '코드를 입력해주세요.', hint: '' })
  }
  if (code.length > 5000) {
    return NextResponse.json({ score: 0, passed: false, feedback: '코드가 너무 깁니다. (5000자 이하)', hint: '' })
  }
  if (!lessonId || typeof lessonId !== 'string') {
    return NextResponse.json({ error: '레슨 정보가 없습니다.' }, { status: 400 })
  }

  // 서버에서 직접 레슨 데이터 조회 — 클라이언트 제공값 사용 안 함
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, content, expected_output, course_id, courses(title)')
    .eq('id', lessonId)
    .single()

  if (!lesson) {
    return NextResponse.json({ error: '레슨을 찾을 수 없습니다.' }, { status: 404 })
  }

  const safeGradeLevel = ['elementary', 'middle', 'high'].includes(String(gradeLevel))
    ? String(gradeLevel)
    : 'middle'

  const levelGuide: Record<string, string> = {
    elementary: '초등학생이 이해할 수 있는 쉬운 말로 피드백해주세요.',
    middle: '중학생 수준으로 피드백해주세요.',
    high: '고등학생 수준으로 구체적인 개선점을 제시해주세요.',
  }

  const prompt = `다음은 "${lesson.title}" 실습 문제에 대한 학생의 파이썬 코드 또는 학습 활동 답안입니다.

과정: ${JSON.stringify(lesson.courses)}
수업 설명:
${String(lesson.content || '').slice(0, 1800)}

학생 코드:
\`\`\`python
${code.slice(0, 5000)}
\`\`\`

${lesson.expected_output ? `기대 출력:\n${String(lesson.expected_output).slice(0, 500)}` : ''}

채점 기준:
- 실행 가능한 코드인지 확인합니다.
- 기대 출력과 핵심 개념을 모두 고려합니다.
- 코드가 실행 오류를 일으킬 것 같으면 60점 미만으로 평가하고 오류 원인과 수정 방향을 알려줍니다.
- AI 윤리·LLM 개념 레슨은 코드 문법뿐 아니라 설명과 활동 요구사항을 충족했는지도 평가합니다.
- 정답 코드를 그대로 제공하지 말고 힌트만 제공합니다.

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "score": 0~100 사이 정수,
  "passed": true 또는 false (score 60 이상이면 true),
  "feedback": "${levelGuide[safeGradeLevel]} 잘한 점과 개선할 점을 2~3문장으로",
  "hint": "다음 단계를 위한 짧은 힌트 1문장"
}`

  let result: { score: number; passed: boolean; feedback: string; hint: string }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (!parsed || typeof parsed.score !== 'number') {
      throw new Error('invalid response')
    }

    result = {
      score: Math.min(100, Math.max(0, Math.round(parsed.score))),
      passed: parsed.score >= 60,
      feedback: String(parsed.feedback || '').slice(0, 500),
      hint: String(parsed.hint || '').slice(0, 200),
    }
  } catch {
    result = { score: 0, passed: false, feedback: '채점 중 오류가 발생했습니다. 다시 시도해주세요.', hint: '' }
  }

  // 서버에서 직접 저장 — 클라이언트가 점수를 조작할 수 없음
  await supabase.from('progress').upsert({
    student_id: user.id,
    lesson_id: lesson.id,
    submitted_code: code,
    score: result.score,
    feedback: result.feedback,
    completed: result.passed,
    submitted_at: new Date().toISOString(),
  }, { onConflict: 'student_id,lesson_id' })

  return NextResponse.json(result)
}
