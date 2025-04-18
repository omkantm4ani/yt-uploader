const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const app = express();
const port = 5000;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const redirectHost = `http://localhost:${port}`;
const upload = multer({ dest: "uploads/" });

function getOAuthClient(account) {
  const credPath = `accounts/${account}/client_secret.json`;
  if (!fs.existsSync(credPath)) throw new Error(`Missing credentials for ${account}`);
  const credentials = JSON.parse(fs.readFileSync(credPath));
  const { client_id, client_secret } = credentials.installed;
  return new google.auth.OAuth2(
    client_id,
    client_secret,
    `${redirectHost}/oauth2callback?account=${account}`
  );
}

function getNextAccountName() {
  const accountDirs = fs.readdirSync("accounts").filter(a => a.startsWith("a"));
  let accountNumber = 1;
  
  
  while (fs.existsSync(`accounts/a${accountNumber}`)) {
    accountNumber++;
  }
  
  return `a${accountNumber}`;
}

app.get("/accounts", (req, res) => {
  const accountDirs = fs.readdirSync("accounts").filter(a => a.startsWith("a"));
  const accountStatuses = accountDirs.map(account => ({
    account,
    authorized: fs.existsSync(`accounts/${account}/token.json`),
  }));
  res.json(accountStatuses);
});

app.post("/addAccount", upload.single("client_secret"), (req, res) => {
  const file = req.file;
  if (!file || path.extname(file.originalname) !== '.json') {
    return res.status(400).send("Only JSON files are allowed.");
  }

  
  const newAccountFolder = getNextAccountName();

  try {
    // Create the new folder for the account
    fs.mkdirSync(path.join("accounts", newAccountFolder));

    
    const newFilePath = path.join("accounts", newAccountFolder, "client_secret.json");
    fs.renameSync(file.path, newFilePath);

    res.send(`<h2>✅ Account added successfully as ${newAccountFolder}. Please authorize.</h2><a href="/dashboard">Back to Dashboard</a>`);
  } catch (err) {
    res.status(500).send("Error adding account: " + err.message);
  }
});

app.get("/auth", (req, res) => {
  const { account } = req.query;
  if (!account) return res.status(400).send("Missing account parameter");

  try {
    const oAuth2Client = getOAuthClient(account);
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    res.redirect(authUrl);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/oauth2callback", async (req, res) => {
  const { code, account } = req.query;
  if (!code || !account) return res.status(400).send("Missing code or account");

  try {
    const oAuth2Client = getOAuthClient(account);
    const { tokens } = await oAuth2Client.getToken(code);
    fs.mkdirSync(`accounts/${account}`, { recursive: true });
    fs.writeFileSync(`accounts/${account}/token.json`, JSON.stringify(tokens));
    res.send(`<h2>✅ Authorization successful for ${account}</h2><a href="/dashboard">Back to Dashboard</a>`);
  } catch (err) {
    res.status(500).send("Error getting token: " + err.message);
  }
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});


app.delete("/deleteAccount/:accountName", (req, res) => {
  const accountName = req.params.accountName;
  const accountFolder = path.join("accounts", accountName);
  
  if (fs.existsSync(accountFolder)) {
    fs.rmSync(accountFolder, { recursive: true, force: true });
    res.json({ message: `Account ${accountName} deleted successfully.` });
  } else {
    res.status(404).json({ message: 'Account not found.' });
  }
});

async function uploadWithAccount(account, videoPath, title, description, visibility = "public") {
  const tokenPath = `accounts/${account}/token.json`;
  if (!fs.existsSync(tokenPath)) return { success: false, error: "No token.json found" };

  try {
    const auth = getOAuthClient(account);
    auth.setCredentials(JSON.parse(fs.readFileSync(tokenPath)));

    const youtube = google.youtube({ version: "v3", auth });
    const res = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: { title, description },
        status: { privacyStatus: visibility },
      },
      media: { body: fs.createReadStream(videoPath) },
    });

    return { success: true, url: `https://youtu.be/${res.data.id}` };
  } catch (err) {
    const isRateLimit = err.message.includes("quota") || err.message.includes("403");
    return { success: false, rateLimited: isRateLimit, error: err.message };
  }
}


app.post("/upload", upload.single("video"), async (req, res) => {
  const { title = "Untitled", description = "", visibility = "public" } = req.body;
  const videoPath = req.file.path;

  const accounts = fs.readdirSync("accounts").filter(a =>
    fs.existsSync(`accounts/${a}/client_secret.json`) &&
    fs.existsSync(`accounts/${a}/token.json`)
  );

  for (const account of accounts) {
    console.log(`🔁 Trying account: ${account}`);
    const result = await uploadWithAccount(account, videoPath, title, description, visibility);

    if (result.success) {
      fs.unlinkSync(videoPath);  // Delete the video file after upload
      return res.json({ message: "✅ Uploaded successfully", video_url: result.url, account });
    } else {
      console.warn(`⚠️ Failed with ${account}: ${result.error}`);
      if (!result.rateLimited) break;  // Stop if not rate-limited
    }
  }

  fs.unlinkSync(videoPath);  // Delete video if upload failed
  return res.status(429).json({ error: "All accounts failed or quota exhausted." });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
