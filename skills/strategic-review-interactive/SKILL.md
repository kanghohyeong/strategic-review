---
name: strategic-review-interactive
description: This skill supports the strategic review process through a web interface.
disable-model-invocation: true
---

# Strategic Review Interactive Skill

## Prerequisites

Confirm the web server URL. The default is `http://localhost:3000` and can be changed via the `STRATEGIC_WEBUI_URL` environment variable.

```bash
BASE_URL="${STRATEGIC_WEBUI_URL:-http://localhost:3000}"
```

## Instructions

### Step 1: Retrieve Report

* Ask the user to enter the filename of the strategic report.
* Call the following API to retrieve the report:

  ```bash
  curl -s "${BASE_URL}/api/reports/{filename}"
  ```

* If the response is an error (`404`, `400`), return an error message to the user.

### Step 2: Check Status

* Check the `status` field in the API response JSON.

### Step 3: Act Based on Report Status

* **init** : Write the report.
  - Follow the instructions in `interactions/init.md`.

* **submit** : Guide the user to review the report through the web interface.

* **approve** : Summarize and present the approved results to the user, and inform them that work is ready to begin.
  - Follow the instructions in `interactions/approve.md`.

* **reject** : Summarize and present the rejection reasons to the user.

* **revision** : Rewrite the report.
  - Follow the instructions in `interactions/revision.md`.

* **Other** : Inform the user of an unknown status and guide them to check the report status.
