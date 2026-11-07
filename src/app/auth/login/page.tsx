'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<'student' | 'teacher'>('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 학생은 학번 → 내부 이메일로 변환, 교사는 이메일 그대로 사용
    const email = loginType === 'student'
      ? `${identifier.toLowerCase().trim()}@students.internal`
      : identifier.trim()

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(
        loginType === 'student'
          ? '학번 또는 비밀번호가 올바르지 않아요. 선생님께 확인해주세요.'
          : '이메일 또는 비밀번호가 올바르지 않아요.'
      )
      setLoading(false)
      return
    }

    // 교사는 교사 대시보드로, 학생은 학생 대시보드로
    if (loginType === 'teacher') {
      router.push('/teacher')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <span className="text-xl font-black text-indigo-600">CodeAI</span>
          <span className="text-xl font-black text-gray-800">School</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">로그인</h1>

        {/* 로그인 유형 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['student', 'teacher'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { setLoginType(type); setIdentifier(''); setError('') }}
              className={`py-3 rounded-xl border-2 text-sm font-medium transition ${
                loginType === type
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {type === 'student' ? '👩‍🎓 학생 로그인' : '👨‍🏫 교사 로그인'}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {loginType === 'student' ? '학번' : '이메일'}
            </label>
            <input
              type={loginType === 'student' ? 'text' : 'email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={loginType === 'student' ? '예: 2024001' : 'teacher@school.kr'}
              required
              autoComplete={loginType === 'student' ? 'username' : 'email'}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
            {loginType === 'student' && (
              <p className="text-xs text-gray-400 mt-1">선생님께 받은 학번을 입력하세요.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={loginType === 'student' ? '선생님께 받은 임시 비밀번호' : '비밀번호 입력'}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {loginType === 'teacher' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            교사 계정이 없으신가요?{' '}
            <Link href="/auth/register" className="text-indigo-600 font-medium hover:underline">
              교사 가입하기
            </Link>
          </p>
        )}
        {loginType === 'student' && (
          <p className="text-center text-xs text-gray-400 mt-6">
            학생 계정은 선생님이 만들어드립니다.
          </p>
        )}
      </div>
    </div>
  )
}
