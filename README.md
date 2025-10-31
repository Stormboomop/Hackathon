# 🎯 Smart Focus Assistant - Browser Extension

> **A Distraction-Free Study and Productivity Tool for Students & Professionals**

A Chrome/Edge extension that helps users maintain focus, block distractions, and track productivity with clean analytics and beautiful design.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Development](#-development)
- [Testing Checklist](#-testing-checklist)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- ✅ **Smart Website Blocking** – Blocks distracting websites during focus sessions  
- 📊 **Analytics Dashboard** – Tracks focus time, blocked attempts, and success rate  
- 🔥 **Streak Tracking** – Encourages daily consistency  
- 💡 **Focus Insights** – Displays focus vs. distraction metrics  
- 🎨 **Modern UI** – Gradient glassmorphic design with smooth animations  
- 🔔 **Notifications** – Inform users when sites are blocked  
- 📈 **Progress Tracking** – Total sessions, blocked sites, and attempts  

### Bonus Features
- 🚫 **Quick Add Distractions** – One-click add for popular sites (Netflix, Discord, etc.)  
- 📥 **Import/Export Blocklist** – Save and reuse your block lists  
- 🌗 **Responsive Design** – Works across desktop browsers  

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** – Page structure  
- **CSS3** – UI styling and layout  
- **JavaScript (ES6)** – Core logic  

### Chrome Extension APIs
- **Manifest V3** – Latest Chrome architecture  
- **chrome.storage.local** – Save user data  
- **chrome.webNavigation** – Detect and block sites  
- **Chart.js** – Data visualization  

---

## 📦 Installation

### 🧩 Option 1 — From GitHub (Recommended for Judges)

1. Visit the official release page:  
   👉 [Smart Focus Assistant v1.0](https://github.com/Stormboomop/Hackathon/releases/tag/v1.0)

2. Download either:
   - `SmartFocusAssistant.crx` — packaged extension (for Chromium browsers), **or**
   - “Source code (ZIP)” — unpacked folder for Chrome.

3. Open Chrome and go to:
chrome://extensions/


4. Enable **Developer Mode** (top-right corner).

5. Either:
- Drag and drop the `.crx` file *(if Chrome allows)*, or  
- Click **Load unpacked** → select the extracted folder.

6. Done ✅  
The extension icon (🚫) will appear in your toolbar.

---

## 📁 Project Structure

Hackathon/
├── manifest.json
├── sites.html # Manage blocked sites
├── sites.js # Logic for adding/removing sites
├── blocked.html # Shown when blocked site is accessed
├── blocked.js
├── analytics.html # Focus analytics dashboard
├── analytics.js
├── icons/ # Extension icons
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png
└── SmartFocusAssistant.crx # Prebuilt extension file


---

## 📖 Usage Guide

### 1. Manage Sites
- Add sites (e.g., `youtube.com`) to your blocklist.  
- Use “Quick Add” to block popular distractions instantly.  
- Remove, search, or clear sites anytime.

### 2. View Analytics
- Open the Analytics tab to see focus metrics.  
- Charts show weekly, hourly, and daily patterns.  
- Track your total blocked attempts and success rate.

### 3. Experience Blocking in Action
- Visit a blocked site (e.g., YouTube).  
- You’ll see a motivational blocked page (“Stay Focused!”).  

---

## 🔧 Development

For developers or contributors:


git clone https://github.com/Stormboomop/Hackathon.git
cd Hackathon 

Then in Chrome:

Go to chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select the cloned folder

✅ Testing Checklist
Functional

 Add / remove sites works

 Quick add buttons function

 Import/export JSON works

 Analytics charts display correctly

 Notifications appear

Compatibility

 Works in Chrome (latest)

 Works in Edge and Brave

Performance

 Loads instantly

 Charts render smoothly

 No noticeable lag

🚀 Future Enhancements

⏱️ Pomodoro Timer Integration

🧠 AI-Based Focus Recommendations

☁️ Cloud Sync (Firebase)

🏆 Gamification System (Achievements & XP)

🌙 Dark Mode

📝 License

MIT License — you’re free to use, modify, and distribute this project with attribution.

🤝 Contributing

Fork the repository

Create a feature branch: git checkout -b feature/new-feature

Commit your changes

Push and open a Pull Request

🌟 Acknowledgments

Chart.js – for analytics visualizations

Chrome Extensions API Docs – for manifest and storage

Hackathon 2025 – for the motivation to build this project
