# revision Status Handling Guide

## instructions

### Step 1: Check Full Report History

* From the API response retrieved in SKILL Step 1, get the `prefix` field.
* Call the following API to retrieve all versions of the same group:

  ```bash
  curl -s "${BASE_URL}/api/groups/{prefix}"
  ```

* The `allFiles` array in the response contains all versions in descending order.

### Step 2: Collect Review Comments

* Check the `reviewComment` field of the previous version (current version - 1) in `allFiles`.

### Step 3: Write Report

* Use the `strategic-review` skill to write a report that incorporates the review comments.

### Step 4: Save Report

* Call the following API to save the report content to the current file and change the status to `submit`:

  ```bash
  curl -s -X PATCH "${BASE_URL}/api/reports/{filename}" \
    -H "Content-Type: text/markdown" \
    --data-binary "{report body}"
  ```
