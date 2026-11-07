'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  content: string
  starter_code: string
  expected_output: string
  course_id: string
  courses: { title: string }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  lesson: Lesson
  userId: string
  gradeLevel: string
  savedCode: string
  previousScore?: number
  previousFeedback?: string
}

const RUN_TIMEOUT_MS = 10_000

export default function LessonClient({ lesson, userId, gradeLevel, savedCode, previousScore, previousFeedback }: Props) {
  const [code, setCode] = useState(savedCode)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const runIdRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `안녕하세요! 저는 AI 튜터예요. "${lesson.title}" 레슨에서 궁금한 게 있으면 무엇이든 물어보세요! 😊` }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [gradeResult, setGradeResult] = useState<{ score: number; feedback: string; hint: string; passed: boolean } | null>(
    previousScore !== undefined ? { score: previousScore!, feedback: previousFeedback || '', hint: '', passed: previousScore! >= 60 } : null
  )
  const [grading, setGrading] = useState(false)

  // Worker 재생성 헬퍼 — 타임아웃 시에도 호출
  const spawnWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }
    const w = new Worker('/pyodide-worker.js')
    w.onmessage = (e) => {
      const { type, id, stdout, stderr, error } = e.data
      if (type === 'ready') {
        setPyodideReady(true)
        return
      }
      if (type === 'result' && id === runIdRef.current) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        let result = stdout || ''
        if (stderr) result += (result ? '\n' : '') + '⚠️ stderr: ' + stderr
        if (error) result += (result ? '\n' : '') + '오류: ' + error
        setOutput(result || '(출력 없음)')
        setIsRunning(false)
      }
    }
    w.postMessage({ type: 'init' })
    workerRef.current = w
    setPyodideReady(false)
  }, [])

  useEffect(() => {
    spawnWorker()
    return () => {
      workerRef.current?.terminate()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [spawnWorker])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function runCode() {
    if (!workerRef.current || !pyodideReady) return
    setIsRunning(true)
    setOutput('')
    const id = ++runIdRef.current
    workerRef.current.postMessage({ type: 'run', code, id })

    // 10초 초과 시 Worker 종료 후 재생성
    timeoutRef.current = setTimeout(() => {
      setOutput('⏱ 실행 시간이 초과되었습니다 (10초). 무한 루프를 확인해주세요.')
      setIsRunning(false)
      spawnWorker()
    }, RUN_TIMEOUT_MS)
  }

  async function gradeCode() {
    setGrading(true)
    try {
      const res = await fetch('/api/grade-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // lessonId만 전달 — 서버가 직접 DB에서 채점 기준 조회 및 저장
        body: JSON.stringify({ code, lessonId: lesson.id, gradeLevel }),
      })
      const result = await res.json()
      if (!res.ok || typeof result.score !== 'number') {
        setGradeResult({
          score: 0,
          passed: false,
          feedback: result.error || '채점 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.',
          hint: '코드를 저장한 뒤 다시 제출해 보세요.',
        })
      } else {
        setGradeResult(result)
      }
    } catch {
      setGradeResult({
        score: 0,
        passed: false,
        feedback: '네트워크 오류로 채점하지 못했습니다.',
        hint: '인터넷 연결을 확인하고 다시 시도해주세요.',
      })
    } finally {
      setGrading(false)
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    const res = await fetch('/api/ai-tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, lessonTitle: lesson.title, currentCode: code, gradeLevel }),
    })
    const { reply } = await res.json()
    setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    setChatLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 상단 바 */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <Link href={`/courses/${lesson.course_id}`} className="text-gray-400 hover:text-white text-sm">
          ← {lesson.courses.title}
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white font-medium text-sm">{lesson.title}</span>
        {!pyodideReady && (
          <span className="ml-auto text-xs text-yellow-400 animate-pulse">파이썬 로딩 중...</span>
        )}
        {pyodideReady && (
          <span className="ml-auto text-xs text-green-400">✓ 파이썬 준비됨</span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 강의 내용 */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto hidden lg:block">
          <h2 className="font-bold text-sm text-gray-300 mb-3">강의 내용</h2>
          <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
            {lesson.content}
          </div>
        </div>

        {/* 가운데: 코드 에디터 */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-gray-400">파이썬 코드 편집기</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={runCode}
                disabled={!pyodideReady || isRunning}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
              >
                {isRunning ? '실행 중...' : '▶ 실행'}
              </button>
              <button
                onClick={gradeCode}
                disabled={grading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
              >
                {grading ? '채점 중...' : '✓ 제출 & 채점'}
              </button>
            </div>
          </div>

          {/* 코드 에디터 (textarea 기반) */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-gray-950 text-green-400 font-mono text-sm p-4 resize-none focus:outline-none"
            placeholder="# 여기에 파이썬 코드를 작성하세요"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault()
                const start = e.currentTarget.selectionStart
                const end = e.currentTarget.selectionEnd
                const newCode = code.substring(0, start) + '    ' + code.substring(end)
                setCode(newCode)
                setTimeout(() => {
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4
                }, 0)
              }
            }}
          />

          {/* 출력 */}
          <div className="h-40 bg-gray-900 border-t border-gray-800">
            <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">출력 결과</span>
              {output && (
                <button onClick={() => setOutput('')} className="text-xs text-gray-600 hover:text-gray-400">지우기</button>
              )}
            </div>
            <pre className="px-4 py-3 text-sm text-gray-300 font-mono overflow-y-auto h-28">
              {output || <span className="text-gray-600">코드를 실행하면 결과가 여기에 표시됩니다.</span>}
            </pre>
          </div>

          {/* 채점 결과 */}
          {gradeResult && (
            <div className={`border-t px-4 py-3 ${gradeResult.passed ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800'}`}>
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-lg font-black ${gradeResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {gradeResult.passed ? '✓ 통과!' : '✗ 다시 시도'}
                </span>
                <span className="text-white font-bold">{gradeResult.score}점</span>
              </div>
              <p className="text-sm text-gray-300">{gradeResult.feedback}</p>
              {gradeResult.hint && <p className="text-xs text-yellow-400 mt-1">💡 {gradeResult.hint}</p>}
            </div>
          )}
        </div>

        {/* 오른쪽: AI 튜터 챗봇 */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-bold text-indigo-400">🤖 AI 튜터</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-3 py-2 rounded-xl text-sm text-gray-400 animate-pulse">답변 작성 중...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="질문을 입력하세요..."
                className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg transition text-sm"
              >
                전송
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              {['힌트 주세요', '오류 설명', '예시 보여줘'].map((quick) => (
                <button
                  key={quick}
                  onClick={() => { setChatInput(quick); }}
                  className="text-xs bg-gray-800 text-gray-400 hover:text-white px-2 py-1 rounded-lg transition"
                >
                  {quick}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
