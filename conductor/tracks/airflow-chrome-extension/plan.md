# Airflow Chrome Extension - Implementation Plan

## Progress & Decisions (as of 2026-05-23)

A functional prototype of the core feature has been completed. Key implementation decisions and discoveries include:

-   **API Strategy:** Confirmed that using the standard Airflow REST API is the most robust approach. The extension hits the `/api/v1/dags/{dag_id}/dagRuns/{dag_run_id}/taskInstances/{task_id}` endpoint on hover to get the task's status. If the status is "failed", it then calls the `/logs/{log_id}` endpoint.
-   **DOM Interaction:** Discovered that the Airflow UI renders the DAG grid within a **Shadow DOM**, making direct element queries from a content script ineffective. The solution was to implement a recursive `findInShadowDom` function to correctly locate task elements.
-   **ID Extraction:** Developed a robust strategy to extract the necessary IDs on hover:
    -   `dag_id`: Parsed from the `window.location.pathname`.
    -   `dag_run_id`: Extracted from a `js-*` class on a parent element of the task instance.
    -   `task_id`: Extracted from the text content of a sibling element within the same table row (`<tr>`).
-   **UI/UX (Sizing & Positioning):** Based on user feedback, the tooltip size was increased (`max-width: 800px`, `max-height: 800px`) for better readability. Additionally, implemented viewport-aware positioning. The tooltip now detects if it will be rendered off-screen and automatically flips its position (e.g., from below to above the cursor) to stay within the browser's viewport. This resolves issues with tasks located at the bottom or right edges of the page.
-   **Log Path Extraction:** Fixed a bug where the wrong GCS path (`sparkApplications/` instead of `logs/`) was being extracted. The logic now specifically searches for the `gs://.../logs/...` pattern to ensure the correct application log path is displayed.

## Overview
This plan outlines the development of a Chrome extension for Apache Airflow. The extension will display error logs in a tooltip when hovering over a failed task in the Airflow UI.

## Technologies
- HTML, CSS, JavaScript
- Chrome Extension APIs (Manifest V3)
- Content Scripts
- Background Script

## Phases

### Phase 1: Research and Setup
1.  **[Completo] Analyze Airflow UI:** Identified key selectors (`[data-testid='task-instance']`) and DOM structure, including the presence of a Shadow DOM.
2.  **[Completo] Identify Airflow API Endpoints:** Confirmed the necessary endpoints for getting task status and logs.
3.  **[Decidido] Authentication Strategy:** The current implementation relies on the user's existing browser session cookie with Airflow, which is handled automatically by `fetch`.
4.  **[Completo] Chrome Extension Manifest:** Created and refined `manifest.json` with appropriate host permissions.
5.  **[Completo] Project Structure:** Utilized the existing project structure.

### Phase 2: Content Script Development
1.  **[Completo] DOM Observation:** Implemented a `MutationObserver` combined with a recursive Shadow DOM search function.
2.  **[Completo] Failed Task Identification:** Logic was moved to the background script. The content script now handles all tasks and lets the background script check the state.
3.  **[Completo] Event Listeners:** Attached `mouseover` and `mouseout` event listeners.
4.  **[Completo] Task Data Extraction:** Implemented a robust strategy for extracting all necessary IDs.

### Phase 3: Background Script and API Integration
1.  **[Completo] Message Handling:** Implemented `chrome.runtime.onMessage` to handle requests from the content script.
2.  **[Completo] API Call Implementation:** Background script now fetches task status, and if failed, fetches the logs.
3.  **[Completo] Authentication Implementation:** Relies on the browser's session cookies.
4.  **[Completo] Error Handling (API):** Basic error handling for `fetch` calls is in place.

### Phase 4: UI for Log Display
1.  **[Completo] Log Tooltip/Popup:** A functional tooltip has been implemented with `tooltip.css` and its size adjusted for readability.
2.  **[Completo] Dynamic Positioning:** Tooltip is positioned near the mouse cursor and intelligently adjusts its position to stay within the viewport.
3.  **[Completo] Content Formatting:** Log content is wrapped in a `<pre>` tag for readability.
4.  **[Completo] User Experience:** Implemented logic to allow scrolling within the tooltip.

### Phase 5: Testing and Refinement
1.  **[Iniciado] Unit Tests:** Not yet implemented.
2.  **[Iniciado] Integration Tests:** The user has performed initial manual testing.
3.  **Cross-Browser Compatibility:** (Out of scope for now)
4.  **Performance Optimization:** Needs review, but initial implementation is lightweight.
5.  **Security Review:** Basic security (scoped host permissions) is in place.

## Open Questions/Decisions
- **[Resolvido]** Specific Airflow version targeted for initial development. (Targeting the user's current version).
- **[Resolvido]** Detailed authentication flow for Airflow API. (Relying on session cookie).
- **[Resolvido]** Exact styling for the log display tooltip. (A basic dark theme was implemented).
