# init 상태 처리 가이드

## instructions

### Step 1: 목표와 제약조건 확인

* SKILL의 Step 1에서 조회한 API 응답에서 `objective`와 `constraints` 필드를 확인합니다.
* 목표와 제약조건이 존재하지 않는다면 사용자에게 오류 메시지를 반환합니다.

### Step 2: 보고서 작성

* `strategic-review` skill 을 사용하여 보고서를 작성합니다.

### Step 3: 보고서 저장

* 아래 API를 호출하여 보고서 본문을 저장하고 상태를 `submit`으로 변경합니다:

  ```bash
  curl -s -X PATCH "${BASE_URL}/api/reports/{파일명}" \
    -H "Content-Type: application/json" \
    -d '{"content": "{보고서 본문 (JSON 이스케이프 처리)}", "status": "submit"}'
  ```

* API 응답으로 업데이트된 보고서 JSON이 반환됩니다.
