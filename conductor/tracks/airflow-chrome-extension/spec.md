# Airflow Chrome Extension - Specification

## Feature
A Chrome browser extension that enhances the Apache Airflow UI by providing quick access to task error logs. When a user hovers their mouse over a failed task instance in the DAGs view, a tooltip or small popup will appear displaying the error log for that specific task.

## User Story
As an Airflow user, I want to quickly see the error log of a failed task by simply hovering over it in the DAGs view, so that I can diagnose issues faster without navigating to a separate log page.

## Acceptance Criteria

### Functional Requirements
-   The extension must detect failed tasks in the Airflow DAGs view.
-   Upon hovering over a failed task, an overlay (tooltip/popup) must appear.
-   The overlay must display the complete error log for the hovered task.
-   The overlay must disappear when the mouse leaves the task area.
-   The extension must work without requiring manual page refreshes when new DAG runs or task states appear.

### Non-Functional Requirements
-   **Performance:** The extension should not significantly degrade the performance or responsiveness of the Airflow UI.
-   **Usability:** The log display should be easy to read and navigate within the tooltip. The tooltip must remain fully visible within the browser's viewport, even for tasks at the edges of the screen.
-   **Compatibility:** Compatible with recent versions of Google Chrome and Apache Airflow (specific version to be determined in research).
-   **Security:** Authentication to the Airflow API must be handled securely, without exposing credentials.
-   **Maintainability:** Code should be modular and easy to update if Airflow UI or API changes.

## Out of Scope
-   Editing task properties.
-   Triggering DAG runs.
-   Detailed log filtering or search within the tooltip.
-   Support for other browsers (e.g., Firefox, Edge).

## Dependencies
-   Access to Apache Airflow instance.
-   Airflow REST API for log retrieval.
-   Chrome browser environment.
