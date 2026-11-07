'use client'

import { useState } from 'react'

interface ClassItem {
  id: string
  name: string
}

interface Props {
  classes: ClassItem[]
}

interface CreatedStudent {
  student_code: string
  temp_password: string
  name: string
}

export default function CreateStudentForm({ classes }: Props) {
  const [name, setName] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [gradeLevel, setGradeLevel] = useState('middle')
  const [classId, setClassId] = useState(classes[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedStudent | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCreated(null)

    const res = await fetch('/api/teacher/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        student_code: studentCode,
        grade_level: gradeLevel,
        class_id: classId || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || '오류가 발생했습니다.')
      return
    }

    setCreated(data)
    setName('')
    setStudentCode('')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">학번 (로그인 ID)</label>
          <input
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            placeholder="예: 2024001"
            required
            pattern="[a-zA-Z0-9_-]{3,20}"
            title="영문·숫자·_·- 조합 3~20자"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="text-xs text-gray-400 mt-1">영문·숫자·_·- 3~20자, 중복 불가</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">학교급</label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="elementary">초등학교</option>
            <option value="middle">중학교</option>
            <option value="high">고등학교</option>
          </select>
        </div>

        {classes.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">학급 배정 (선택)</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">배정 안함</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50"
        >
          {loading ? '생성 중...' : '학생 계정 발급'}
        </button>
      </form>

      {/* 발급 결과 — 선생님이 학생에게 전달 */}
      {created && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 font-bold text-sm mb-2">✓ 계정 발급 완료!</p>
          <p className="text-xs text-gray-600 mb-3">아래 정보를 학생에게 직접 전달하세요.</p>
          <div className="space-y-1 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">이름</span>
              <span className="font-bold">{created.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">학번</span>
              <span className="font-bold text-indigo-600">{created.student_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">임시 비밀번호</span>
              <span className="font-bold text-orange-600">{created.temp_password}</span>
            </div>
          </div>
          <p className="text-xs text-orange-500 mt-3">
            ⚠️ 임시 비밀번호는 학생이 로그인 후 직접 변경해야 합니다.
          </p>
          <button
            onClick={() => setCreated(null)}
            className="mt-3 w-full text-xs text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
