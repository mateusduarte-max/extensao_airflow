// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTaskStatusAndLogs') {
    // Destructure the new taskIdentifier from the payload
    const { dagId, runId, taskId, taskIdentifier } = request.payload;

    const airflowBaseUrl = sender.tab.url.substring(0, sender.tab.url.indexOf('/dags/'));

    if (!airflowBaseUrl) {
      sendResponse({ error: 'Could not determine Airflow base URL.', taskIdentifier });
      return true;
    }

    (async () => {
      let responsePayload = {
        logContent: null,
        sourceCode: null,
        taskIdentifier: taskIdentifier // Always include the identifier in the response
      };

      try {
        const detailsUrl = `${airflowBaseUrl}/api/v1/dags/${dagId}/dagRuns/${runId}/taskInstances/${taskId}`;
        const dagDetailsUrl = `${airflowBaseUrl}/api/v1/dags/${dagId}`;

        const detailsPromise = fetch(detailsUrl);
        const dagDetailsPromise = fetch(dagDetailsUrl);

        const detailsResponse = await detailsPromise;
        if (!detailsResponse.ok) {
          throw new Error(`Failed to fetch task details: ${detailsResponse.status}`);
        }
        const details = await detailsResponse.json();

        if (details.state === 'failed') {
          const logUrl = `${airflowBaseUrl}/api/v1/dags/${dagId}/dagRuns/${runId}/taskInstances/${taskId}/logs/${details.try_number}`;
          const logResponse = await fetch(logUrl);
          if (logResponse.ok) {
            const logContent = await logResponse.text();
            
            const gcsPathMatch = logContent.match(/(gs:\/\/[^\s']+\/logs\/[^\s']+)/);
            if (gcsPathMatch && gcsPathMatch[0]) {
              responsePayload.logContent = `Spark Log Found!

Run in your terminal:
gsutil cat ${gcsPathMatch[0]}`;
            } else {
              responsePayload.logContent = logContent;
            }
          } else {
            responsePayload.logContent = "Error fetching task logs.";
          }
        }
        
        const dagDetailsResponse = await dagDetailsPromise;
        if (dagDetailsResponse.ok) {
          const dagDetails = await dagDetailsResponse.json();
          const fileToken = dagDetails.file_token;

          if (fileToken) {
            const sourceUrl = `${airflowBaseUrl}/api/v1/dagSources/${fileToken}`;
            const sourceResponse = await fetch(sourceUrl);
            if (sourceResponse.ok) {
              responsePayload.sourceCode = await sourceResponse.text();
            } else {
              console.warn(`Could not fetch source code with token: ${sourceResponse.status}`);
            }
          }
        } else {
          console.warn(`Could not fetch DAG details to get file_token: ${dagDetailsResponse.status}`);
        }
        
        sendResponse(responsePayload);

      } catch (e) {
        console.error("Airflow Extension Error:", e);
        responsePayload.error = e.message;
        sendResponse(responsePayload);
      }
    })();

    return true;
  }
});
