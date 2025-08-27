
    let testResults = [];
    let currentIframe = null;

    // Render exactly-as-provided HTML, then append CSS and JS from their own boxes
    function updatePreview() {
      const htmlCode = document.getElementById('htmlCode').value;
      const cssCode  = document.getElementById('cssCode').value;
      const jsCode   = document.getElementById('jsCode').value;

      const preview = document.getElementById('preview');
      preview.srcdoc = htmlCode;   // HTML is used verbatim (no wrapping)
      currentIframe = preview;

      preview.onload = function () {
        const doc = preview.contentDocument || preview.contentWindow.document;

        // Append CSS (as-is)
        if (cssCode && cssCode.trim().length) {
          const style = doc.createElement('style');
          style.type = 'text/css';
          style.appendChild(doc.createTextNode(cssCode));
          (doc.head || doc.documentElement).appendChild(style);
        }

        // Append JS (as-is)
        if (jsCode && jsCode.trim().length) {
          const script = doc.createElement('script');
          script.type = 'text/javascript';
          script.text = jsCode;
          (doc.body || doc.documentElement).appendChild(script);
        }

        console.log('Preview updated (HTML/CSS/JS as-is).');
      };
    }

    function runTests() {
      if (!currentIframe) {
        updatePreview();
        setTimeout(() => runTests(), 600);
        return;
      }

      const testCasesText = document.getElementById('testCases').value;
      let testCases;
      try { testCases = JSON.parse(testCasesText); }
      catch (error) { return showError('Invalid JSON in test cases: ' + error.message); }

      testResults = [];
      document.getElementById('testCaseResults').innerHTML = '';

      let passedCount = 0, failedCount = 0;

      setTimeout(() => {
        testCases.forEach((testCase, index) => {
          const result = executeTestCase(testCase);
          testResults.push({
            id: testCase.id,
            description: testCase.display_text,
            passed: result.passed,
            error: result.error,
            order: testCase.order || index + 1
          });
          result.passed ? passedCount++ : failedCount++;
        });

        updateTestSummary(testCases.length, passedCount, failedCount);
        displayTestResults();
        if (passedCount === testCases.length) {
          showSuccess(`🎉 All ${testCases.length} tests passed! Your solution is correct.`);
        }
      }, 300);
    }

   function executeTestCase(testCase) {
  try {
    const iframeWindow = currentIframe.contentWindow;
    const iframeDoc = iframeWindow.document;

    if (!iframeWindow.jQuery && !iframeWindow.$) {
      return { passed:false, error:'jQuery not loaded in iframe' };
    }
    const $ = iframeWindow.jQuery || iframeWindow.$;

    if ($('#htmlPreview').length === 0) {
      $('body').wrapInner('<div id="htmlPreview"></div>');
    }

    iframeWindow.assert = function (cond) { if (!cond) throw new Error('Test assertion failed'); };

    // Remove blank lines (lines with only whitespace)
    const criteriaLines = testCase.criteria.split('\n');
    const cleanedCriteria = criteriaLines.filter(line => line.trim() !== '').join('\n');

    const testFunction = new Function('$','jQuery','assert','document','window', cleanedCriteria);
    testFunction.call(iframeWindow, $, $, iframeWindow.assert, iframeDoc, iframeWindow);

    return { passed:true, error:null };
  } catch (error) {
    return { passed:false, error:error.message };
  }
}


    function updateTestSummary(total, passed, failed) {
      document.getElementById('totalTests').textContent = total;
      document.getElementById('passedTests').textContent = passed;
      document.getElementById('failedTests').textContent = failed;
    }

    function displayTestResults() {
      const resultsDiv = document.getElementById('testCaseResults');
      resultsDiv.innerHTML = '';
      testResults.sort((a,b) => a.order - b.order);
      testResults.forEach(result => {
        const testDiv = document.createElement('div');
        testDiv.className = `test-case ${result.passed ? 'passed' : 'failed'}`;
        testDiv.innerHTML = `
          <h4>Test Case ${result.order}: ${result.id}</h4>
          <p style="margin-bottom:10px; font-size:13px; line-height:1.4;">${result.description || ''}</p>
          <div class="test-status ${result.passed ? 'passed' : 'failed'}">
            ${result.passed ? '✅ PASSED' : '❌ FAILED'}
          </div>
          ${result.error ? `<div class="error-message">${result.error}</div>` : ''}`;
        resultsDiv.appendChild(testDiv);
      });
    }

    function showError(message) {
      const resultsDiv = document.getElementById('testCaseResults');
      resultsDiv.innerHTML = `<div class="error-message">${message}</div>`;
    }

    function showSuccess(message) {
      const resultsDiv = document.getElementById('testCaseResults');
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = message;
      resultsDiv.insertBefore(successDiv, resultsDiv.firstChild);
    }

    function clearResults() {
      testResults = [];
      document.getElementById('testCaseResults').innerHTML = '';
      updateTestSummary(0,0,0);
    }

    // Auto-load once
    window.addEventListener('load', updatePreview);
  