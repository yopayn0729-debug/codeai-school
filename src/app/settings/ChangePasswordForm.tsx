'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  mustChange: boolean
  role: string
}

export default function ChangePasswordForm({ mustChange, role }: Props) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError('비밀번호 변경 오류: ' + updateError.message)
      setLoading(false)
      return
    }

    // must_change_password 플래그 해제
    await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', (await supabase.auth.getUser()).data.user!.id)

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push(role === 'teacher' ? '/teacher' : '/dashboard')
    }, 1500)
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-bold text-lg mb-2">✓ 비밀번호가 변경되었습니다!</p>
        <p className="text-gray-500 text-sm">잠시 후 이동합니다...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="8자 이상 입력"
          minLength={8}
          required
          autoComplete="new-password"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="비밀번호 재입력"
          required
          autoComplete="new-password"
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
        {loading ? '변경 중...' : '비밀번호 변경'}
      </button>

      {!mustChange && (
        <Link
          href={role === 'teacher' ? '/teacher' : '/dashboard'}
          className="block text-center text-sm text-gray-400 hover:text-gray-600"
        >
          취소
        </Link>
      )}
    </form>
  )
}
