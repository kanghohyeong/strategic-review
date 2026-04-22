---
name: strategic-review-interactive
description: 이 스킬은 웹 인터페이스에서 전략 리뷰 프로세스를 지원하기 위한 도구입니다.
disable-model-invocation: true
---

# Strategic Review Interactive Skill

## 사전 준비

웹 서버 URL을 확인합니다. 기본값은 `http://localhost:3000`이며, 환경변수 `STRATEGIC_WEBUI_URL`로 변경할 수 있습니다.

```bash
BASE_URL="${STRATEGIC_WEBUI_URL:-http://localhost:3000}"
```

## Instructions

### Step 1: 보고서 조회

* 사용자에게 전략 보고서 파일명을 입력하도록 요청합니다.
* 아래 API를 호출하여 보고서를 조회합니다:

  ```bash
  curl -s "${BASE_URL}/api/reports/{파일명}"
  ```

* 응답이 오류(`404`, `400`)이면 사용자에게 오류 메시지를 반환합니다.

### Step 2: 상태 확인

* API 응답 JSON의 `status` 필드를 확인합니다.

### Step 3: 보고서 상태에 따른 행동

* **init** : 보고서를 작성합니다.
  - `interactions/init.md` 의 지침을 따릅니다.

* **submit** : 사용자에게 웹 인터페이스에서 보고서를 검토하도록 안내합니다.

* **approve** : 사용자에게 승인된 결과를 요약해서 보여주고, 작업을 시작할 준비가 되었음을 알립니다.
  - `interactions/approve.md` 의 지침을 따릅니다.

* **reject** : 사용자에게 반려된 이유를 요약해서 보여줍니다.

* **revision** : 보고서를 재작성합니다.
  - `interactions/revision.md` 의 지침을 따릅니다.

* **그 외** : 사용자에게 알 수 없는 상태임을 알리고, 보고서 상태를 확인하도록 안내합니다.
