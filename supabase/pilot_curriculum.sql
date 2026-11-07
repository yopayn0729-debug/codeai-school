-- CodeAI School 파일럿 커리큘럼
-- Supabase SQL Editor에서 schema.sql 실행 후 이 파일을 실행하세요.
-- 기존 코스 제목을 기준으로 레슨을 연결하므로 UUID를 직접 수정할 필요가 없습니다.

DO $$
DECLARE
  basic_id uuid;
  intermediate_id uuid;
  ai_id uuid;
BEGIN
  SELECT id INTO basic_id FROM public.courses WHERE title = '파이썬 입문' LIMIT 1;
  SELECT id INTO intermediate_id FROM public.courses WHERE title = '파이썬 중급' LIMIT 1;
  SELECT id INTO ai_id FROM public.courses WHERE title = 'AI 기초와 윤리' LIMIT 1;

  IF intermediate_id IS NULL THEN
    INSERT INTO public.courses (title, description, level, duration_weeks, order_index, is_free)
    VALUES ('파이썬 중급', '함수와 자료구조를 활용해 작은 프로그램을 완성해요.', 'middle', 4, 2, true)
    RETURNING id INTO intermediate_id;
  END IF;

  IF basic_id IS NULL THEN
    INSERT INTO public.courses (title, description, level, duration_weeks, order_index, is_free)
    VALUES ('파이썬 입문', '처음 만나는 파이썬! 4주 동안 문법과 문제 해결을 익혀요.', 'all', 4, 1, true)
    RETURNING id INTO basic_id;
  END IF;

  IF ai_id IS NULL THEN
    INSERT INTO public.courses (title, description, level, duration_weeks, order_index, is_free)
    VALUES ('AI 기초와 윤리', 'AI와 LLM의 원리를 이해하고 안전하게 활용하는 법을 배워요.', 'all', 4, 3, true)
    RETURNING id INTO ai_id;
  END IF;

  -- 중복 실행해도 레슨이 계속 복제되지 않도록 파일럿 코스의 기존 레슨을 비웁니다.
  DELETE FROM public.lessons WHERE course_id IN (basic_id, intermediate_id, ai_id);

  INSERT INTO public.lessons (course_id, title, content, starter_code, expected_output, order_index) VALUES
  (basic_id, '1. 파이썬과 첫 출력',
   '이번 레슨에서는 print()로 컴퓨터에게 말을 시켜봅니다.\n\n핵심 개념: print(), 문자열, 주석\n\n미션: 자신의 이름과 좋아하는 것을 두 줄로 출력하세요.',
   '# 이름과 좋아하는 것을 출력해 보세요\n', '홍길동\n축구', 1),
  (basic_id, '2. 변수와 자료형',
   '변수는 값을 담아두는 상자입니다. 문자열은 따옴표로, 숫자는 따옴표 없이 표현합니다.\n\n핵심 개념: 변수, int, float, str\n\n미션: name과 age 변수를 만들고 문장으로 출력하세요.',
   'name = ""\nage = 0\nprint(name, "님은", age, "살입니다.")', '민지 님은 13 살입니다.', 2),
  (basic_id, '3. 계산과 입력',
   '파이썬은 계산기처럼 사용할 수 있습니다. input()으로 사용자의 답을 받을 수도 있어요.\n\n핵심 개념: +, -, *, /, input()\n\n미션: 가로와 세로를 곱해 직사각형 넓이를 계산하세요.',
   'width = 8\nheight = 5\narea = width * height\nprint(area)', '40', 3),
  (basic_id, '4. 조건문으로 판단하기',
   '조건문은 상황에 따라 다른 일을 하게 합니다. if와 else를 사용합니다.\n\n핵심 개념: if, else, 비교 연산자\n\n미션: 점수가 60점 이상이면 합격, 아니면 다시 도전이라고 출력하세요.',
   'score = 75\nif score >= 60:\n    print("합격")\nelse:\n    print("다시 도전")', '합격', 4),
  (basic_id, '5. 반복문으로 여러 번 실행하기',
   '같은 일을 반복할 때 for를 사용하면 코드를 짧게 쓸 수 있습니다.\n\n핵심 개념: for, range()\n\n미션: 1부터 5까지 숫자를 한 줄씩 출력하세요.',
   'for i in range(1, 6):\n    print(i)', '1\n2\n3\n4\n5', 5),
  (basic_id, '6. 리스트에 여러 값 담기',
   '리스트는 여러 값을 순서대로 담는 자료구조입니다. 인덱스는 0부터 시작합니다.\n\n미션: 과일 리스트의 모든 항목을 반복문으로 출력하세요.',
   'fruits = ["사과", "바나나", "딸기"]\nfor fruit in fruits:\n    print(fruit)', '사과\n바나나\n딸기', 6),
  (basic_id, '7. 함수로 코드 묶기',
   '함수는 자주 사용하는 코드를 이름 붙여 묶어두는 방법입니다.\n\n핵심 개념: def, 매개변수, return\n\n미션: 두 수를 더해 반환하는 add 함수를 완성하세요.',
   'def add(a, b):\n    return a + b\n\nprint(add(3, 4))', '7', 7),
  (basic_id, '8. 기초 프로젝트: 숫자 맞히기',
   '지금까지 배운 변수, 조건문, 반복문을 합쳐 작은 게임을 만듭니다.\n\n미션: answer와 guess를 비교해 정답인지, 더 큰 수인지, 더 작은 수인지 알려주세요.',
   'answer = 7\nguess = 5\n\nif guess == answer:\n    print("정답")\nelif guess < answer:\n    print("더 큰 수")\nelse:\n    print("더 작은 수")', '더 큰 수', 8),

  (intermediate_id, '1. 문자열을 다루는 방법',
   '문자열은 글자를 다루는 자료형입니다. 길이, 대문자 변환, 일부 추출을 연습합니다.\n\n미션: 문장의 글자 수와 첫 글자를 출력하세요.',
   'message = "Python is fun"\nprint(len(message))\nprint(message[0])', '13\nP', 1),
  (intermediate_id, '2. 딕셔너리로 정보 표현하기',
   '딕셔너리는 이름표가 붙은 데이터를 저장합니다. 학생 정보, 상품 정보처럼 구조화된 데이터를 표현할 때 유용합니다.\n\n미션: name과 score를 가진 딕셔너리에서 값을 출력하세요.',
   'student = {"name": "지우", "score": 92}\nprint(student["name"])\nprint(student["score"])', '지우\n92', 2),
  (intermediate_id, '3. 리스트를 정리하고 가공하기',
   '리스트에는 append(), sort(), len() 같은 유용한 기능이 있습니다.\n\n미션: 점수 리스트에 점수를 추가하고 오름차순으로 정렬하세요.',
   'scores = [70, 90, 80]\nscores.append(100)\nscores.sort()\nprint(scores)', '[70, 80, 90, 100]', 3),
  (intermediate_id, '4. 함수에 조건과 반복 넣기',
   '함수 안에 조건문과 반복문을 넣으면 재사용 가능한 문제 해결 도구가 됩니다.\n\n미션: 리스트에서 짝수만 출력하는 함수를 작성하세요.',
   'def print_even(numbers):\n    for number in numbers:\n        if number % 2 == 0:\n            print(number)\n\nprint_even([1, 2, 3, 4, 5, 6])', '2\n4\n6', 4),
  (intermediate_id, '5. 파일과 데이터 읽기',
   '프로그램은 외부 데이터도 읽을 수 있습니다. 파일을 직접 다루기 전, 여러 줄 문자열을 splitlines()로 나누어 처리합니다.\n\n미션: 학생 이름을 한 줄씩 출력하세요.',
   'data = "민수\\n지영\\n현우"\nfor name in data.splitlines():\n    print(name)', '민수\n지영\n현우', 5),
  (intermediate_id, '6. 오류를 예상하고 처리하기',
   '사용자가 예상과 다른 값을 입력해도 프로그램이 멈추지 않도록 try와 except를 사용할 수 있습니다.\n\n미션: 숫자로 바꿀 수 없는 값이 들어오면 안내 문장을 출력하세요.',
   'value = "열세 살"\ntry:\n    age = int(value)\n    print(age)\nexcept ValueError:\n    print("숫자를 입력해 주세요")', '숫자를 입력해 주세요', 6),
  (intermediate_id, '7. 모듈과 표준 라이브러리',
   '다른 사람이 만든 기능을 import로 가져와 사용할 수 있습니다. random은 게임과 추첨 프로그램에 활용됩니다.\n\n미션: random 모듈의 choice를 사용해 메뉴 하나를 고르세요.',
   'import random\nmenus = ["김밥", "라면", "비빔밥"]\nprint(random.choice(menus))', '', 7),
  (intermediate_id, '8. 중급 프로젝트: 성적 분석기',
   '학생 점수 리스트를 받아 평균, 최고점, 합격자 수를 계산하는 프로그램을 완성합니다.\n\n미션: 함수 세 개를 만들거나 하나의 함수 안에서 결과를 출력하세요.',
   'scores = [80, 95, 60, 45, 72]\naverage = sum(scores) / len(scores)\npassed = [score for score in scores if score >= 60]\nprint("평균:", round(average, 1))\nprint("최고점:", max(scores))\nprint("합격자 수:", len(passed))', '평균: 70.4\n최고점: 95\n합격자 수: 4', 8),

  (ai_id, '1. AI란 무엇인가',
   'AI는 데이터를 바탕으로 문제를 해결하거나 예측하는 컴퓨터 시스템입니다.\n\n배울 내용: 규칙 기반 프로그램과 AI의 차이, 학습 데이터, 예측과 생성\n\n활동: 아래 코드의 입력과 출력을 바꾸며 “AI에게 무엇을 시켰는가?”를 관찰하세요.',
   'question = "오늘 날씨 어때?"\nprint("입력:", question)\nprint("컴퓨터가 입력을 분석하고 답을 만듭니다.")', '입력: 오늘 날씨 어때?\n컴퓨터가 입력을 분석하고 답을 만듭니다.', 1),
  (ai_id, '2. 머신러닝의 기본 원리',
   '머신러닝은 사람이 모든 규칙을 직접 작성하는 대신, 예시 데이터에서 패턴을 찾습니다.\n\n핵심 흐름: 데이터 → 학습 → 예측 → 평가\n\n활동: 학습 데이터가 편향되면 결과도 편향될 수 있는 이유를 주석으로 설명하세요.',
   '# 학습 데이터의 예\ntraining_data = ["고양이 사진", "고양이 사진", "강아지 사진"]\nprint("데이터 개수:", len(training_data))\n# 데이터가 한쪽에 치우치면 어떤 문제가 생길까요?', '데이터 개수: 3', 2),
  (ai_id, '3. LLM은 어떻게 문장을 만들까',
   'LLM은 많은 텍스트를 학습하고, 문맥에서 다음에 올 가능성이 높은 토큰을 반복해서 선택합니다.\n\n핵심 개념: 토큰, 확률, 문맥, 학습과 생성의 차이\n\n주의: LLM은 이해하는 사람처럼 보이지만 사실과 다른 내용을 만들 수 있습니다.',
   'words = ["나는", "파이썬을", "배운다"]\nfor word in words:\n    print(word, end=" ")', '나는 파이썬을 배운다 ', 3),
  (ai_id, '4. 프롬프트를 설계하는 법',
   '좋은 프롬프트에는 역할, 목표, 맥락, 출력 형식이 들어갑니다.\n\n활동: AI에게 “초등학생에게 설명하는 파이썬 선생님” 역할과 답변 형식을 지정해 보세요. 작성한 프롬프트를 코드 문자열에 넣어 제출하세요.',
   'prompt = """역할: 파이썬 선생님\n목표: 변수 개념 설명\n대상: 초등학생\n형식: 예시를 포함한 3문장"""\nprint(prompt)', '역할: 파이썬 선생님\n목표: 변수 개념 설명\n대상: 초등학생\n형식: 예시를 포함한 3문장', 4),
  (ai_id, '5. 생성형 AI의 오류와 환각',
   'AI가 그럴듯하지만 틀린 답을 만드는 현상을 환각이라고 합니다.\n\n검증 습관: 출처 확인, 여러 자료 비교, 계산 직접 확인, 모르는 것은 모른다고 답하게 하기\n\n활동: 아래 검증 체크리스트를 모두 출력하세요.',
   'checks = ["출처 확인", "날짜 확인", "다른 자료와 비교", "직접 계산"]\nfor check in checks:\n    print("✓", check)', '✓ 출처 확인\n✓ 날짜 확인\n✓ 다른 자료와 비교\n✓ 직접 계산', 5),
  (ai_id, '6. AI 윤리: 공정성과 편향',
   'AI는 데이터와 설계 방식의 영향을 받습니다. 특정 집단의 데이터가 부족하면 불공정한 결과가 나올 수 있습니다.\n\n토론 질문: 자동 선발 시스템이 특정 지역 학생을 계속 낮게 평가한다면 무엇을 점검해야 할까요?\n\n활동: 점검 항목을 리스트로 작성하세요.',
   'audit_items = ["학습 데이터의 대표성", "평가 기준", "오류율의 집단별 차이"]\nfor item in audit_items:\n    print(item)', '학습 데이터의 대표성\n평가 기준\n오류율의 집단별 차이', 6),
  (ai_id, '7. 개인정보와 안전한 AI 사용',
   '이름, 연락처, 주소, 얼굴 사진, 계정 정보는 소중한 개인정보입니다. 공개 AI 서비스에 입력하기 전에 꼭 필요한 정보인지 확인해야 합니다.\n\n활동: 안전한 사용 원칙을 3개 출력하세요.',
   'rules = ["개인정보를 입력하지 않기", "출력 내용을 검증하기", "출처를 밝히기"]\nfor rule in rules:\n    print(rule)', '개인정보를 입력하지 않기\n출력 내용을 검증하기\n출처를 밝히기', 7),
  (ai_id, '8. 최종 프로젝트: 책임 있는 AI 사용 가이드',
   'AI를 학교 과제에 사용할 때의 가이드를 직접 만듭니다.\n\n필수 내용: AI를 사용한 부분 밝히기, 답변 검증하기, 개인정보 보호하기, 자신의 생각 덧붙이기\n\n프로젝트 결과를 파이썬 리스트로 작성하고 각 항목을 출력하세요.',
   'guide = [\n    "AI를 사용한 부분 밝히기",\n    "답변 검증하기",\n    "개인정보 보호하기",\n    "자신의 생각 덧붙이기",\n]\nfor item in guide:\n    print(item)', 'AI를 사용한 부분 밝히기\n답변 검증하기\n개인정보 보호하기\n자신의 생각 덧붙이기', 8);
END $$;
