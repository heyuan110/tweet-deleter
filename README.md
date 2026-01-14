# Tweet Deleter

<p align="center">
  <img src="icons/icon128.png" alt="Tweet Deleter Logo" width="128">
</p>

<p align="center">
  <strong>A browser extension for batch deleting tweets, replies and reposts on X (Twitter)</strong>
</p>

<p align="center">
  <a href="./README_CN.md">简体中文</a> | English
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#supported-languages">Languages</a> •
  <a href="#privacy">Privacy</a> •
  <a href="#license">License</a>
</p>

---

## Features

- **Batch Delete** - Delete multiple tweets, replies, and reposts at once
- **Content Type Filter** - Choose to delete only tweets, replies, or reposts
- **Time Range Filter** - Delete content within a specific date range
- **Keyword Filter** - Delete only content containing (or excluding) specific keywords
- **Adjustable Speed** - Choose between slow (safe), normal, or fast deletion speeds
- **Progress Tracking** - Real-time progress display during deletion
- **Multi-language Support** - Available in 6 languages

## Supported Languages

| Language | Code |
|----------|------|
| English | en |
| 简体中文 (Simplified Chinese) | zh_CN |
| 繁體中文 (Traditional Chinese) | zh_TW |
| Español (Spanish) | es |
| Français (French) | fr |
| Deutsch (German) | de |

## Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/heyuan110/tweet-deleter.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** in the top right corner

4. Click **Load unpacked** and select the `tweet-deleter` folder

5. The extension icon should appear in your browser toolbar

### From Chrome Web Store

*Coming soon*

## Usage

1. **Open X (Twitter)** - Navigate to your profile page on [x.com](https://x.com) or [twitter.com](https://twitter.com)

2. **Click the Extension Icon** - Click the Tweet Deleter icon in your browser toolbar

3. **Configure Filters**:
   - **Content Type**: Select which types of content to delete (Tweets, Replies, Reposts)
   - **Time Range**: Set a date range or use quick select buttons
   - **Keywords**: Optionally filter by keywords

4. **Scan Content** - Click "Scan Content" to find matching tweets

5. **Start Deletion** - Click "Start Delete" to begin the deletion process

6. **Monitor Progress** - Watch the progress bar and stop at any time if needed

## Advanced Options

| Option | Description |
|--------|-------------|
| **Delete Speed** | Slow (safe, 2s delay), Normal (1s delay), Fast (0.5s delay, may trigger rate limits) |
| **Batch Size** | Number of tweets to process before pausing (10, 25, 50, or 100) |
| **Confirm Each Batch** | Ask for confirmation before starting deletion |

## Privacy

This extension:

- ✅ Runs entirely in your browser
- ✅ Does not collect any personal data
- ✅ Does not send data to external servers
- ✅ Only accesses twitter.com and x.com
- ✅ Open source - you can audit the code yourself

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, storage, scripting
- **Host Permissions**: twitter.com, x.com

## Project Structure

```
tweet-deleter/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── content.js             # Content script (runs on Twitter)
├── content.css            # Content script styles
├── background.js          # Service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/              # Internationalization
    ├── en/
    ├── zh_CN/
    ├── zh_TW/
    ├── es/
    ├── fr/
    └── de/
```

## Disclaimer

⚠️ **Use at your own risk**

- This extension permanently deletes your tweets and they cannot be recovered
- Twitter/X may rate limit or temporarily restrict your account if you delete too many tweets too quickly
- Always use the "slow" speed option for safety
- Consider downloading your Twitter archive before mass deletion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Icon design based on Twitter's brand colors

---

<p align="center">
  Made with ❤️ for a cleaner Twitter experience
</p>
