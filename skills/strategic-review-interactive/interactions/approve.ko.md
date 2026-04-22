# approve 상태 처리 가이드

## instructions

### Step 1: 보고서 전체 이력 확인

* SKILL의 Step 1에서 조회한 API 응답에서 `prefix` 필드를 확인합니다.
* 아래 API를 호출하여 동일 그룹의 모든 버전을 조회합니다:

  ```bash
  curl -s "${BASE_URL}/api/groups/{prefix}"
  ```

* 응답의 `allFiles` 배열에 버전 내림차순으로 모든 버전이 포함됩니다.

### Step 2: 승인 항목 수집

* 각 버전의 `content` 필드에서 승인된 항목들을 수집합니다.
* `reviewComment`가 없으면 권고안으로 승인한 것으로 간주합니다.

### Step 3: 내용 요약 및 정리

* 수집된 승인 항목들을 정리하여 사용자에게 보고합니다.
