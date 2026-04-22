# approve Status Handling Guide

## instructions

### Step 1: Check Full Report History

* From the API response retrieved in SKILL Step 1, get the `prefix` field.
* Call the following API to retrieve all versions of the same group:

  ```bash
  curl -s "${BASE_URL}/api/groups/{prefix}"
  ```

* The `allFiles` array in the response contains all versions in descending order.

### Step 2: Collect Approved Items

* Collect approved items from the `content` field of each version.
* If there is no `reviewComment`, the recommendation is considered approved as-is.

### Step 3: Summarize and Organize Content

* Organize the collected approved items and report them to the user.
