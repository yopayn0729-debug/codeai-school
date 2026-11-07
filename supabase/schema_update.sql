-- 1. profiles 테이블에 student_code, must_change_password 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS student_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- 2. student_code 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON profiles(student_code);

-- 3. classes 테이블의 invite_code 길이를 8자로 변경
--    (기존 6자 코드가 있으면 새로 생성하거나 유지 — 길이 제약만 완화)
ALTER TABLE classes
  ALTER COLUMN invite_code TYPE TEXT;

-- 4. invite_code 기본값을 8자 랜덤 문자열로 변경
CREATE OR REPLACE FUNCTION generate_invite_code(len INT DEFAULT 8)
RETURNS TEXT LANGUAGE sql AS $$
  SELECT substring(md5(random()::text), 1, len);
$$;

ALTER TABLE classes
  ALTER COLUMN invite_code SET DEFAULT generate_invite_code(8);

-- 5. RLS: profiles 정책 재정의
--    핵심 보안: 기존 "for all" 정책을 제거하고 SELECT/UPDATE/INSERT를 분리해
--    학생이 자신의 role을 'teacher'로 바꾸는 권한 상승 공격을 차단함

-- 기존 포괄적 정책 제거
DROP POLICY IF EXISTS "본인 프로필 읽기/수정" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;

-- 본인 프로필 읽기 (모든 역할)
CREATE POLICY "본인 프로필 읽기" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 교사가 모든 학생 프로필 읽기 (선생님 대시보드용)
CREATE POLICY "교사 프로필 조회" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- 본인 프로필 수정 — role 변경 금지 (권한 상승 방지)
CREATE POLICY "본인 프로필 수정" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- role은 service_role(admin)만 변경 가능; 일반 사용자는 현재 role 유지만 허용
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
