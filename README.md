# Resume Builder Insert Tool

A Chrome Extension that fills the Resume Builder form from clipboard JSON, sends the job data to a Google Sheet through Google Apps Script, and then clicks **Generate Resume** automatically.

## Features

- Adds a beautiful floating round 📋 button on the Resume Builder page
- Supports `Ctrl + Shift + V` shortcut
- Reads job data from clipboard JSON
- Fills Company Name, Job Role, Job Link, and Job Description
- Sets the Easy Apply checkbox based on the copied JSON
- Selects the resume style and visual type automatically
- Collects selected Tech Stack labels
- Sends data to Google Sheet using Google Apps Script
- Lets you set the Google Apps Script URL dynamically from the extension popup
- Shows logs/messages in the popup textarea
- Includes a Clear logs button

## Supported Page

This extension works on:

```txt
https://resume.softloom.tech/generate
```

## Folder Structure

```txt
resume-builder-extension/
  manifest.json
  background.js
  content.js
  popup.html
  popup.css
  popup.js
  README.md
```

## Installation

1. Download or clone this extension folder.
2. Open Chrome.
3. Go to:

```txt
chrome://extensions
```

4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extension folder.
7. Open or refresh:

```txt
https://resume.softloom.tech/generate
```

## First Setup

Before using the extension, set your Google Apps Script URL.

1. Click the extension icon in the Chrome toolbar.
2. Paste your Google Apps Script Web App URL into the input field.

Example:

```txt
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

3. Click **Save URL**.
4. The popup log area should show:

```txt
Google Apps Script URL saved.
```

## How to Use

1. Copy job data as JSON.
2. Open:

```txt
https://resume.softloom.tech/generate
```

3. Click the floating 📋 button.

Or use the shortcut:

```txt
Ctrl + Shift + V
```

The extension will:

1. Read clipboard JSON
2. Fill the Resume Builder form
3. Set Easy Apply checkbox based on `method`
4. Select resume style `Custom-260226`
5. Select visual type `modern2`
6. Collect selected Tech Stack labels
7. Send the data to Google Sheet
8. Click **Generate Resume**

## Clipboard JSON Format

Your clipboard should contain valid JSON like this:

```json
{
  "platform": "Linkedin",
  "companyName": "Example Company",
  "jobTitle": "Senior Software Engineer",
  "jobLink": "https://www.linkedin.com/jobs/view/example",
  "method": "Easy Apply",
  "JD": "Paste the full job description here..."
}
```

## Field Mapping

| JSON Field | Resume Builder Field |
|---|---|
| `companyName` | Company Name |
| `jobTitle` | Job Role |
| `jobLink` | Job Link |
| `JD` | Job Description |
| `method` | Easy Apply checkbox |

## Easy Apply Logic

If:

```json
"method": "Easy Apply"
```

Then the Easy Apply checkbox will be checked.

For any other value, it will be unchecked.

## Google Apps Script URL

The extension does not require editing `background.js` every time you change the Google Apps Script URL.

The URL is saved in Chrome local storage using:

```js
chrome.storage.local
```

If no URL is saved, the extension will show this error:

```txt
Google Apps Script URL is empty. Please set it in the extension popup.
```

## Popup

Click the extension icon to open the popup.

The popup includes:

- Google Apps Script URL input
- Save URL button
- Logs/messages textarea
- Clear button

## Logs

Logs may include messages like:

```txt
Reading clipboard...
Clipboard JSON parsed successfully.
Form fields filled.
Tech Stack labels: React, Node.js, AWS
Sending data to Google Sheet...
Google Apps Script response: ...
Clicking Generate Resume button.
```

## Troubleshooting

### Floating button does not appear

Refresh the Resume Builder page after loading or reloading the extension.

Also confirm the URL is exactly:

```txt
https://resume.softloom.tech/generate
```

### Clipboard is not valid JSON

Make sure your copied text is valid JSON.

Common mistakes:

- Missing quotes
- Extra comma
- Invalid line breaks
- Using single quotes instead of double quotes

Correct:

```json
{
  "companyName": "Example Company"
}
```

Incorrect:

```js
{
  companyName: 'Example Company',
}
```

### Google Apps Script URL is empty

Open the extension popup and save your Apps Script URL.

### Invalid Google Apps Script URL

The URL must start with:

```txt
https://script.google.com/macros/s/
```

### Failed to connect to Google Apps Script

Check these items:

- Your Google Apps Script is deployed as a Web App
- Access is set correctly
- The Web App URL ends with `/exec`
- The extension popup has the correct saved URL
- Your Apps Script returns valid JSON

### Server returned invalid JSON

Your Apps Script response should return JSON.

Example Apps Script response:

```js
return ContentService
  .createTextOutput(JSON.stringify({
    success: true,
    message: "Saved successfully"
  }))
  .setMimeType(ContentService.MimeType.JSON);
```

### Generate Resume button is not clicked

The extension looks for a button containing this text:

```txt
Generate Resume
```

If the button text changes, update the `clickGenerateResume()` function in `content.js`.

## Required Chrome Permissions

The extension uses:

```json
"permissions": [
  "clipboardRead",
  "storage",
  "tabs"
]
```

And host permissions:

```json
"host_permissions": [
  "https://resume.softloom.tech/*",
  "https://script.google.com/*",
  "https://script.googleusercontent.com/*"
]
```

## Development Notes

After changing extension files:

1. Go to:

```txt
chrome://extensions
```

2. Click **Reload** on the extension.
3. Refresh the Resume Builder page.

## Current Default Settings

| Setting | Value |
|---|---|
| Resume Style | `Custom-260226` |
| Visual Type | `modern2` |
| Floating Button Icon | `📋` |
| Floating Button Tooltip | `Generate && Append` |
| Shortcut | `Ctrl + Shift + V` |

## Important Files

### `manifest.json`

Defines extension permissions, popup, background service worker, and page match rules.

### `background.js`

Handles Google Apps Script URL storage, sending data to Google Sheet, logs, and message handling.

### `content.js`

Handles the floating button, clipboard reading, form filling, Easy Apply checkbox, resume style selection, visual type selection, and Generate Resume button click.

### `popup.html`

Defines the popup layout.

### `popup.css`

Styles the popup UI.

### `popup.js`

Handles loading/saving the Script URL, showing logs, and clearing logs.

## Version

```txt
2026.06.18
```
