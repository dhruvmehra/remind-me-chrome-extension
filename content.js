// content.js

// Function to send the current URL to popup.js
function sendUrlToPopup() {
  chrome.runtime.sendMessage({ url: window.location.href });
}

// Send the URL when the page is loaded
sendUrlToPopup();
