// content.js
console.log("Airflow Task Log Viewer Extension is active.");

let tooltipElement;
let hideTooltipTimer;
let activeTaskIdentifier = null; // NEW: To track the currently hovered task

/**
 * Injects a CSS file into the document's head.
 */
function injectCss(file) {
  const link = document.createElement('link');
  link.href = chrome.runtime.getURL(file);
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

/**
 * Creates the tooltip element and appends it to the body.
 */
function createTooltipElement() {
  if (document.querySelector('.airflow-log-tooltip')) return;
  tooltipElement = document.createElement('div');
  tooltipElement.classList.add('airflow-log-tooltip', 'hidden');
  document.body.appendChild(tooltipElement);

  tooltipElement.addEventListener('mouseover', () => {
    clearTimeout(hideTooltipTimer);
  });
  tooltipElement.addEventListener('mouseout', handleMouseOut);
}

/**
 * Helper to escape HTML characters for safe display.
 */
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * Shows the tooltip with provided HTML content, adjusting its position to stay within the viewport.
 */
function showTooltip(x, y, htmlContent) {
  if (!tooltipElement) createTooltipElement();
  clearTimeout(hideTooltipTimer);
  tooltipElement.innerHTML = htmlContent;

  // Temporarily show the tooltip to measure its dimensions
  tooltipElement.classList.remove('hidden');
  
  const tooltipWidth = tooltipElement.offsetWidth;
  const tooltipHeight = tooltipElement.offsetHeight;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  let newLeft = window.scrollX + x + 15;
  let newTop = window.scrollY + y + 15;

  // If it goes off the bottom, move it above the cursor
  if (y + tooltipHeight + 15 > viewportHeight) {
    newTop = window.scrollY + y - tooltipHeight - 15;
  }

  // If it goes off the right, move it to the left of the cursor
  if (x + tooltipWidth + 15 > viewportWidth) {
    newLeft = window.scrollX + x - tooltipWidth - 15;
  }

  // Ensure it doesn't go off the top or left edges after adjustment
  if (newTop < window.scrollY) {
    newTop = window.scrollY + 5; // Add a small buffer from the edge
  }
  if (newLeft < window.scrollX) {
    newLeft = window.scrollX + 5; // Add a small buffer from the edge
  }

  tooltipElement.style.left = `${newLeft}px`;
  tooltipElement.style.top = `${newTop}px`;
}

/**
 * Hides the tooltip after a short delay.
 */
function handleMouseOut() {
  // NEW: When mouse leaves, clear the active task identifier
  activeTaskIdentifier = null;
  hideTooltipTimer = setTimeout(() => {
    if (tooltipElement) {
      tooltipElement.classList.add('hidden');
    }
  }, 300);
}

/**
 * Finds elements within the main document and any Shadow DOMs.
 */
function findInShadowDom(selector, rootNode = document) {
    let results = [];
    function find(root) {
        try {
            const found = root.querySelectorAll(selector);
            if (found.length > 0) {
                results = results.concat(Array.from(found));
            }
        } catch (e) {}
        const allElements = root.querySelectorAll ? root.querySelectorAll('*') : [];
        allElements.forEach(el => {
            if (el.shadowRoot) {
                find(el.shadowRoot);
            }
        });
    }
    find(rootNode);
    return results;
}


/**
 * Main handler for when the mouse hovers over a task element.
 */
function handleTaskHover(event) {
  clearTimeout(hideTooltipTimer);
  const taskElement = event.currentTarget;

  const dagIdMatch = window.location.pathname.match(/dags\/([^\/]+)\//);
  const dagId = dagIdMatch ? dagIdMatch[1] : null;

  const runElement = taskElement.closest('[class*="js-"]');
  let runId = null;
  if (runElement) {
    const classWithRunId = Array.from(runElement.classList).find(c => c.startsWith('js-'));
    if (classWithRunId) {
      runId = classWithRunId.replace('js-', '');
    }
  }

  const rowElement = taskElement.closest('tr');
  let taskId = null;
  if (rowElement) {
    const taskIdElement = rowElement.querySelector('p > span');
    if (taskIdElement) {
      taskId = taskIdElement.textContent.trim();
    }
  }

  if (dagId && runId && taskId) {
    // NEW: Create and set the identifier for the currently hovered task
    const taskIdentifier = `${dagId}-${runId}-${taskId}`;
    activeTaskIdentifier = taskIdentifier;

    chrome.runtime.sendMessage({
      action: 'getTaskStatusAndLogs',
      payload: { dagId, runId, taskId, taskIdentifier } // Pass identifier to background
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Extension Error:", chrome.runtime.lastError.message);
        return;
      }

      // NEW: Check if the response is still for the currently hovered task
      if (!response || response.taskIdentifier !== activeTaskIdentifier) {
        // This is a stale response for a task we're no longer hovering over. Ignore it.
        return;
      }

      if (response.logContent || response.sourceCode) {
        let htmlContent = '';
        if (response.logContent) {
          htmlContent += `<h4>LOGS</h4><pre>${escapeHtml(response.logContent)}</pre>`;
        }
        if (response.sourceCode) {
          if (htmlContent) htmlContent += '<hr>';
          htmlContent += `<h4>CODE</h4><pre>${escapeHtml(response.sourceCode)}</pre>`;
        }
        showTooltip(event.clientX, event.clientY, htmlContent);
      } else if (response.error) {
        console.error("Failed to get info:", response.error);
        showTooltip(event.clientX, event.clientY, `Error: ${escapeHtml(response.error)}`);
      } else {
        console.log("No relevant info found for task or task not failed.");
      }
    });
  } else {
    console.warn("Could not extract all required IDs.", { dagId, runId, taskId });
  }
}

/**
 * Finds all task elements on the page and attaches the necessary event listeners.
 */
function findAndAttachListeners() {
  const taskElements = findInShadowDom("[data-testid='task-instance']");
  taskElements.forEach(el => {
    if (el.dataset.logViewerAttached) return;
    el.dataset.logViewerAttached = 'true';
    el.addEventListener('mouseover', handleTaskHover);
    el.addEventListener('mouseout', handleMouseOut);
  });
}


// --- Main Execution ---
function initialize() {
  if (!window.location.pathname.includes('/dags/')) return;

  console.log("Airflow grid view detected. Initializing log viewer.");

  injectCss('tooltip.css');
  createTooltipElement();

  findAndAttachListeners();

  const observer = new MutationObserver(findAndAttachListeners);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

initialize();
