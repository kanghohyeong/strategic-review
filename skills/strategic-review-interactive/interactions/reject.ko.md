# reject 상태 처리 가이드

## instructions

### Step 1: 보고서 전체 이력 확인

* SKILL의 Step 1에서 조회한 API 응답에서 `prefix` 필드를 확인합니다.
* 아래 API를 호출하여 동일 그룹의 모든 버전을 조회합니다:

  ```bash
  curl -s "${BASE_URL}/api/groups/{prefix}"
  ```

* 응답의 `allFiles` 배열에 버전 내림차순으로 모든 버전이 포함됩니다.

### Step 2: 반려 의견 수집

* 현재 버전의 `reviewComment` 필드에서 반려 이유를 확인합니다.
* 각 이전 버전의 `reviewComment`도 포함하여 전체 이력을 파악합니다.

### Step 3: 내용 요약 및 정리

* 반려 이유를 정리하여 사용자에게 보고합니다.
