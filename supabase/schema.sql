-- 사용자 프로필 (Supabase auth와 연결)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'student' check (role in ('student', 'teacher')),
  grade_level text check (grade_level in ('elementary', 'middle', 'high')),
  created_at timestamptz default now()
);

-- 코스
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level text not null check (level in ('elementary', 'middle', 'high', 'all')),
  duration_weeks int not null,
  order_index int not null default 0,
  is_free boolean not null default true,
  created_at timestamptz default now()
);

-- 레슨
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses on delete cascade not null,
  title text not null,
  content text,
  starter_code text default '',
  expected_output text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 학급
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles on delete cascade not null,
  name text not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 6)),
  created_at timestamptz default now()
);

-- 학급-학생 연결
create table public.class_students (
  class_id uuid references public.classes on delete cascade,
  student_id uuid references public.profiles on delete cascade,
  joined_at timestamptz default now(),
  primary key (class_id, student_id)
);

-- 학생 진도
create table public.progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles on delete cascade not null,
  lesson_id uuid references public.lessons on delete cascade not null,
  submitted_code text,
  score int check (score >= 0 and score <= 100),
  feedback text,
  completed boolean default false,
  submitted_at timestamptz default now(),
  unique (student_id, lesson_id)
);

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.progress enable row level security;

-- RLS 정책
create policy "본인 프로필 읽기/수정" on public.profiles
  for all using (auth.uid() = id);

create policy "코스 모두 읽기" on public.courses
  for select using (true);

create policy "레슨 모두 읽기" on public.lessons
  for select using (true);

create policy "교사 학급 관리" on public.classes
  for all using (auth.uid() = teacher_id);

create policy "학생 학급 조회" on public.classes
  for select using (
    auth.uid() in (
      select student_id from public.class_students where class_id = id
    )
  );

create policy "진도 본인 관리" on public.progress
  for all using (auth.uid() = student_id);

create policy "교사 진도 조회" on public.progress
  for select using (
    auth.uid() in (
      select cs.teacher_id from public.classes cs
      join public.class_students cst on cs.id = cst.class_id
      where cst.student_id = progress.student_id
    )
  );

-- 기본 코스 데이터
insert into public.courses (title, description, level, duration_weeks, order_index, is_free) values
  ('파이썬 입문', '처음 만나는 파이썬! 변수, 조건문, 반복문을 배워요.', 'elementary', 4, 1, true),
  ('AI 기초 개념', 'AI가 무엇인지, 어떻게 작동하는지 배워요.', 'middle', 3, 2, true),
  ('챗봇 만들기', 'Claude AI를 활용해 나만의 챗봇을 만들어요.', 'middle', 4, 3, true),
  ('데이터 분석', '파이썬으로 데이터를 분석하고 시각화해요.', 'high', 4, 4, true);
