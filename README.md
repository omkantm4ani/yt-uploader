# YouTube Video Uploader API with Multiple Accounts

This Node.js application provides an API and dashboard for uploading videos to YouTube using multiple OAuth accounts. It handles the authentication process, account management, and video uploads, automatically cycling through available accounts when quota limits are reached.

## Features

- **Multiple Account Management**: Create and manage several YouTube accounts (a1, a2, a3, etc.)
- **OAuth 2.0 Authentication**: Secure authentication for each YouTube account
- **Easy Dashboard Interface**: Web-based dashboard to manage accounts and upload videos
- **Auto Account Rotation**: Automatically tries the next account if one fails due to quota limitations
- **Account Status Tracking**: Shows which accounts are authorized and ready to use
- **Drag-and-Drop Interface**: Simple interface for uploading client secrets and videos

## Requirements

- Node.js (version >= 14)
- npm or yarn
- Google Cloud project with YouTube Data API v3 enabled
- OAuth 2.0 credentials (client_secret.json) for each YouTube account

## Project Setup

### 1. Install Dependencies

Clone this repository and install the required packages:

```bash
git clone <repository_url>
cd yt-uploader
npm install
```

The application uses the following npm packages:
- express: Web server framework
- googleapis: Google APIs client library
- multer: Middleware for handling file uploads
- fs: File system module

### 2. Google API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the YouTube Data API v3
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Set the application type to "Web Application"
   - Add `http://localhost:5000/oauth2callback` as an authorized redirect URI
   - Download the client_secret.json file

### 3. Project Structure

The project follows this structure:
```
yt-uploader/
├── accounts/         # Where account credentials are stored
│   ├── a1/           # First account
│   │   ├── client_secret.json
│   │   └── token.json
│   ├── a2/           # Second account
│   └── ...
├── public/           # Static files
│   └── dashboard.html
├── uploads/          # Temporary storage for uploaded videos
├── index.js          # Main application file
├── package.json
└── README.md
```

### 4. Running the Application

Start the application with:

```bash
npm start
```

The server will run on `http://localhost:5000`.

## Using the Dashboard

Navigate to `http://localhost:5000/dashboard` in your browser to access the dashboard.

### Adding a New Account

1. Click the "Add New Account" button
2. Upload your `client_secret.json` file (drag and drop or click to select)
3. The system will create a new account folder (a1, a2, etc.)
4. Click "Click to Authorize" to authenticate the account with Google
5. Grant the necessary permissions when prompted by Google
6. The account will now show as "Authorized" in the dashboard

### Uploading Videos

1. Use the API endpoint to upload videos
2. Send a POST request to `/upload` with:
   - video file
   - title
   - description (optional)
   - visibility (optional, defaults to "public")
3. The system will automatically try each authorized account until the upload succeeds
4. If an account reaches its quota limit, the system will try the next account

### Managing Accounts

- View all accounts and their status in the dashboard
- Delete accounts you no longer need by clicking the "Delete" button
- Re-authorize accounts if needed

## API Endpoints

### `GET /accounts`

Retrieves all accounts and their authorization status.

**Response:**
```json
[
  {
    "account": "a1",
    "authorized": true
  },
  {
    "account": "a2",
    "authorized": false
  }
]
```

### `POST /addAccount`

Adds a new account using a client_secret.json file.

**Request:**
- Form data with `client_secret` file (JSON)

**Response:**
- Success: HTML message confirming account creation
- Error: Error message

### `GET /auth`

Initiates OAuth flow for an account.

**Request:**
- Query parameter: `account` (the account name)

**Response:**
- Redirects to Google's authorization page

### `GET /oauth2callback`

Handles the OAuth callback after authorization.

**Request:**
- Query parameters: `code` (OAuth code), `account` (account name)

**Response:**
- Success: HTML message confirming authorization
- Error: Error message

### `POST /upload`

Uploads a video to YouTube using an available account.

**Request:**
- Form data:
  - `video`: Video file
  - `title`: Video title (defaults to "Untitled")
  - `description`: Video description (optional)
  - `visibility`: Privacy status (optional, defaults to "public")

**Response:**
- Success: `{"message": "✅ Uploaded successfully", "video_url": "https://youtu.be/VIDEO_ID", "account": "a1"}`
- Error: `{"error": "All accounts failed or quota exhausted."}`

### `DELETE /deleteAccount/:accountName`

Deletes an account.

**Response:**
- Success: `{"message": "Account a1 deleted successfully."}`
- Error: `{"message": "Account not found."}`

## Troubleshooting

- **OAuth Issues**: If authorization fails, try deleting the account and adding it again
- **Quota Limits**: YouTube has daily upload quotas. If you hit the limit, wait 24 hours or add more accounts
- **File Upload Errors**: Make sure your video files are in a supported format
- **Node.js Deprecation Warnings**: Some fs methods may show deprecation warnings but will continue to work

## License

This project is licensed under the MIT License.

## Security Notes

- Store your `client_secret.json` files securely
- The `accounts` directory contains sensitive OAuth tokens
- This application is intended for development use on a local machine
- For production use, implement proper security measures and host on a secure server 