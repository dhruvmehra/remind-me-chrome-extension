document.addEventListener("DOMContentLoaded", function () {
  // Get the current tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let currentUrl = tabs[0].url;
    // Populate the URL input field with the current URL
    document.getElementById("url-input").value = currentUrl;
  });

  // Display stored URLs
  displayStoredURLs();

  // Handle form submission
  document
    .getElementById("reminder-form")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent default form submission
      // Get the form values
      let url = document.getElementById("url-input").value;
      // Save the reminder
      saveReminder(url);
    });

  // Handle click event on delete button
  document
    .getElementById("delete-storage")
    .addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default form submission
      event.stopPropagation(); // Stop event propagation to prevent triggering other event listeners
      // Clear local storage
      chrome.storage.local.remove("reminders", function () {
        // Refresh displayed URLs
        displayStoredURLs();
      });
    });
});

// Function to snooze the notification
function snoozeNotification() {
  // Close the current notification
  chrome.notifications.clear(null);

  // Create a new notification after 30 minutes
  setTimeout(function () {
    showNotification("Reminder to visit", "Snoozed notification.");
  }, 30 * 60 * 1000); // 30 minutes in milliseconds
}

// Function to display stored URLs
function displayStoredURLs() {
  chrome.storage.local.get("reminders", function (data) {
    let storedURLs = data.reminders || [];
    // Sort reminders by reminderTime
    storedURLs.sort((a, b) => a.reminderTime - b.reminderTime);
    let urlList = document.getElementById("url-list");
    urlList.innerHTML = ""; // Clear the existing list
    storedURLs.forEach(function (reminder, index) {
      // Pass index
      let reminderItem = createReminderItem(reminder, index); // Pass index
      urlList.appendChild(reminderItem);
    });
    // Toggle the visibility of the reminder-list-container based on whether there are any reminders
    let reminderListContainer = document.getElementById(
      "reminder-list-container"
    );
    reminderListContainer.style.display =
      storedURLs.length > 0 ? "block" : "none";
  });
}

function createReminderItem(reminder, index) {
  // Create elements
  let li = document.createElement("li");
  let serialNumberSpan = document.createElement("span"); // Add span for serial number
  let websiteSpan = document.createElement("span");
  let dateTimeSpan = document.createElement("span");
  let deleteButton = document.createElement("button");
  let deleteIcon = document.createElement("i");

  // Set content and attributes
  serialNumberSpan.textContent = index + 1 + ". "; // Set serial number

  // Extract the domain name from the URL
  let domain = extractDomain(reminder.url);

  websiteSpan.textContent = domain;
  dateTimeSpan.textContent = new Date(reminder.reminderTime).toLocaleString();
  deleteIcon.classList.add("fas", "fa-times"); // Font Awesome icon class
  deleteButton.appendChild(deleteIcon);
  deleteButton.classList.add("delete-button");
  deleteButton.addEventListener("click", function (event) {
    event.stopPropagation(); // Stop event propagation to prevent triggering other event listeners
    deleteReminder(reminder);
  });

  // Append elements
  li.appendChild(serialNumberSpan); // Append serial number
  li.appendChild(websiteSpan);
  li.appendChild(dateTimeSpan);
  li.appendChild(deleteButton);

  // Add classes for styling
  li.classList.add("reminder-item");
  serialNumberSpan.classList.add("serial-number"); // Add class for serial number
  websiteSpan.classList.add("website");
  dateTimeSpan.classList.add("reminder-time");
  // Add click event listener to the reminder item
  li.addEventListener("click", function () {
    event.stopPropagation();
    openUrlInNewTab(reminder.url);
  });

  return li;
}

// Function to open URL in a new tab
function openUrlInNewTab(url) {
  chrome.tabs.create({ url: url });
}

// Delete reminder
function deleteReminder(reminder) {
  // Get the stored reminders
  chrome.storage.local.get("reminders", function (data) {
    let reminders = data.reminders || [];
    // Find the index of the reminder to delete
    let index = reminders.findIndex(
      (r) => r.url === reminder.url && r.reminderTime === reminder.reminderTime
    );
    if (index !== -1) {
      // Remove the reminder from the array
      reminders.splice(index, 1);
      // Update the reminders in storage
      chrome.storage.local.set({ reminders: reminders }, function () {
        // Refresh displayed URLs
        displayStoredURLs();
      });
    }
  });
}

// Function to save a reminder
function saveReminder(url) {
  // Get the selected date and time from the datetime picker
  let reminderTime = new Date(document.getElementById("reminder-time").value);

  // Check if a valid date and time are selected
  if (!isNaN(reminderTime)) {
    // Convert reminder time to Unix timestamp (milliseconds)
    let reminderTimeUnix = reminderTime.getTime();

    // Save the reminder data in chrome.storage.local
    chrome.storage.local.get("reminders", function (data) {
      let reminders = data.reminders || [];
      reminders.push({
        url: url,
        reminderTime: reminderTimeUnix, // Save as Unix timestamp (milliseconds)
      });
      chrome.storage.local.set({ reminders: reminders }, function () {
        // Display the updated list of stored URLs
        displayStoredURLs();
      });
    });
  } else {
    // Display an error message if no date and time are selected
    alert("Please select a valid date and time for the reminder.");
  }
}

// Function to extract domain from URL
function extractDomain(url) {
  let domain;
  // Find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split("/")[2];
  } else {
    domain = url.split("/")[0];
  }
  // Find & remove port number
  domain = domain.split(":")[0];
  // Find & remove "?"
  domain = domain.split("?")[0];

  // Remove "www." prefix if present
  if (domain.startsWith("www.")) {
    domain = domain.substring(4);
  }

  return domain;
}
