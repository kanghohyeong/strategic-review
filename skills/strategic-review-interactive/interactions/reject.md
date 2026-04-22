# reject Status Handling Guide

## instructions

### Step 1: Check Full Report History

* From the API response retrieved in SKILL Step 1, get the `prefix` field.
* Call the following API to retrieve all versions of the same group:

  ```bash
  curl -s "${BASE_URL}/api/groups/{prefix}"
  ```

* The `allFiles` array in the response contains all versions in descending order.

### Step 2: Collect Rejection Comments

* Check the `reviewComment` field of the current version for the rejection reason.
* Also include `reviewComment` from previous versions to understand the full history.

### Step 3: Summarize and Organize Content

* Organize the rejection reasons and report them to the user.
