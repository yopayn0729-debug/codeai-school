import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-indigo-600">CodeAI</span>
          <span className="text-2xl font-black text-gray-800">School</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-gray-600 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg transition">
            로그인
          </Link>
          <Link href="/auth/register" className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            무료 시작
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          ✨ 초중고 전용 AI 코딩 플랫폼
        </div>
        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-6">
          설치 없이 브라우저에서<br />
          <span className="text-indigo-600">파이썬 + AI</span>를 배워요
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          AI 튜터가 실시간으로 도와주고, 코드를 제출하면 자동으로 채점해줘요.<br />
          초등학생부터 고등학생까지 수준에 맞는 커리큘럼을 제공합니다.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/register" className="bg-indigo-600 text-white text-lg font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            지금 무료로 시작하기
          </Link>
          <Link href="/auth/login" className="text-indigo-600 text-lg font-medium px-6 py-4 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition">
            코스 둘러보기
          </Link>
        </div>
      </section>

      {/* 기능 3가지 */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: '⚡',
            title: '브라우저 파이썬 실행',
            desc: '설치 없이 웹에서 바로 파이썬 코드를 실행해요. 결과를 즉시 확인하세요.',
          },
          {
            icon: '🤖',
            title: 'AI 튜터 챗봇',
            desc: 'Claude AI가 학생 수준에 맞게 질문에 답해줍니다. 힌트도 요청할 수 있어요.',
          },
          {
            icon: '✅',
            title: '자동 채점 & 피드백',
            desc: '코드를 제출하면 AI가 점수와 함께 구체적인 피드백을 즉시 제공해요.',
          },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* 코스 목록 */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-8">커리큘럼</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: '파이썬 입문', weeks: 4, level: '초등', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700' },
            { title: 'AI 기초 개념', weeks: 3, level: '중등', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
            { title: '챗봇 만들기', weeks: 4, level: '중/고등', color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
            { title: '데이터 분석', weeks: 4, level: '고등', color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700' },
          ].map((course) => (
            <div key={course.title} className={`rounded-2xl p-5 border ${course.color} flex items-center justify-between`}>
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${course.badge} mb-2 inline-block`}>{course.level}</span>
                <h3 className="font-bold text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-500">{course.weeks}주 과정 · 무료</p>
              </div>
              <Link href="/auth/register" className="text-sm font-medium text-indigo-600 hover:underline">
                무료 수강 →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400">
        © 2026 CodeAI School. 초중고 AI 코딩 교육 플랫폼.
      </footer>
    </main>
  )
}
