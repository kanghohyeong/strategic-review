# revision 상태 처리 가이드

## instructions

### Step 1: 보고서 전체 이력 확인

* SKILL의 Step 1에서 조회한 API 응답에서 `prefix` 필드를 확인합니다.
* 아래 API를 호출하여 동일 그룹의 모든 버전을 조회합니다:

  ```bash
  curl -s "${BASE_URL}/api/groups/{prefix}"
  ```

* 응답의 `allFiles` 배열에 버전 내림차순으로 모든 버전이 포함됩니다.

### Step 2: 검토 의견 확인

* `allFiles` 중 직전 버전(현재 버전 - 1)의 `reviewComment` 필드를 확인합니다.

### Step 3: 보고서 작성

* `strategic-review` skill 을 사용하여 검토 의견이 반영된 보고서를 작성합니다.

### Step 4: 보고서 저장

* 아래 API를 호출하여 현재 파일에 보고서 본문을 저장하고 상태를 `submit`으로 변경합니다:

  ```bash
  curl -s -X PATCH "${BASE_URL}/api/reports/{파일명}" \
    -H "Content-Type: text/markdown" \
    --data-binary "{보고서 본문}"
  ```
