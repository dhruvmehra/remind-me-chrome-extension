// Function to check reminders and trigger notifications
function checkReminders() {
  // Get the stored reminders
  chrome.storage.local.get("reminders", function (result) {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving reminders:", chrome.runtime.lastError);
      return;
    }
    let reminders = result.reminders || [];

    // Get the current time
    let currentTime = new Date().getTime();

    // Iterate through reminders to check if any need notifications
    reminders.forEach(function (reminder) {
      // Parse the reminder time from string to Date object
      let reminderTime = parseReminderTime(reminder.reminderTime);
      if (!reminderTime) {
        console.error("Invalid reminder time:", reminder.reminderTime);
        return; // Skip processing this reminder
      }
      console.log("reminderTime", reminderTime);

      // Compare reminder time with current time
      if (reminderTime.getTime() <= currentTime) {
        // If the reminder time has passed, trigger a notification
        chrome.notifications.create(reminder.url, {
          type: "basic",
          iconUrl: "res/icons/icon32.png",
          title: "Reminder",
          message: `Visit - ${reminder.url}`, // Include the URL in the message
          requireInteraction: true,
          buttons: [{ title: "Snooze", iconUrl: "res/icons/icon48.png" }],
        });
      } else {
        console.log("Reminder is still in the future:", reminderTime);
      }
    });
  });
}

// Set up alarm to trigger every minute (adjust as needed)
chrome.alarms.create("reminderCheck", { periodInMinutes: 10 });

// Add event listener for alarm triggers
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "reminderCheck") {
    // When the alarm triggers, check reminders
    checkReminders();
  }
});

// Function to parse reminder time from Unix timestamp to Date object
function parseReminderTime(reminderTimeUnix) {
  try {
    // Create a new Date object using the Unix timestamp (milliseconds)
    return new Date(reminderTimeUnix);
  } catch (error) {
    // Handle parsing errors
    console.error("Error parsing reminder time:", error);
    return null;
  }
}

// Add event listener for notification click
chrome.notifications.onClicked.addListener(function (message) {
  // Close the notification
  chrome.notifications.clear(message);

  // Extract the URL from the notification message
  let url = message;

  // Clean the reminder from storage
  chrome.storage.local.get("reminders", function (data) {
    let reminders = data.reminders || [];
    // Find the index of the reminder with the matching URL
    let index = reminders.findIndex((r) => r.url === url);
    if (index !== -1) {
      // Remove the reminder from the array
      reminders.splice(index, 1);
      // Update the reminders in storage
      chrome.storage.local.set({ reminders: reminders });
    }
  });

  // Open the URL in a new tab
  chrome.tabs.create({ url: url });
});
