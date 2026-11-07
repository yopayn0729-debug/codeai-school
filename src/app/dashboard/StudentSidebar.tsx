import Link from 'next/link'

export default function StudentSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:min-h-[calc(100vh-65px)]">
      <nav className="p-4 space-y-1 text-sm">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 font-semibold text-indigo-700">
          <span>🏠</span> 대시보드
        </Link>
        <Link href="/dashboard#courses" className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
          <span>📚</span> 내 코스
        </Link>
        <Link href="/dashboard#progress" className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
          <span>📈</span> 학습 현황
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-50">
          <span>⚙️</span> 설정
        </Link>
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-2xl bg-indigo-50 p-4 text-xs text-indigo-700">
          <p className="font-bold mb-1">오늘도 한 걸음씩!</p>
          <p className="leading-relaxed text-indigo-500">레슨 하나를 완료하면 학습 기록에 바로 반영돼요.</p>
        </div>
      </div>
    </aside>
  )
}
