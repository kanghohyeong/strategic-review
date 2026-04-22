# init Status Handling Guide

## instructions

### Step 1: Confirm Goals and Constraints

* From the API response retrieved in SKILL Step 1, check the `objective` and `constraints` fields.
* If goals and constraints do not exist, return an error message to the user.

### Step 2: Write Report

* Use the `strategic-review` skill to write the report.

### Step 3: Save Report

* Call the following API to save the report content and change the status to `submit`:

  ```bash
  curl -s -X PATCH "${BASE_URL}/api/reports/{filename}" \
    -H "Content-Type: application/json" \
    -d '{"content": "{report body (JSON escaped)}", "status": "submit"}'
  ```

* The API response returns the updated report JSON.
