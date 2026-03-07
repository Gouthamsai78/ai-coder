# 🚀 AI Coder

> **AI-Powered Code Generation Platform** - Transform your ideas into beautiful, functional web applications through natural conversation.

![AI Coder](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📖 Overview

**AI Coder** is an intelligent web application that allows you to create stunning, production-ready HTML websites by simply describing what you want to build. Powered by **Google Gemini** and **OpenRouter**, it generates complete, self-contained HTML files with modern design, responsive layouts, and interactive features.

---

## ✨ Key Features

### 🤖 AI-Powered Generation
- **Multi-Provider Support** - Use Google AI Studio (Gemini) or OpenRouter
- **Real-time Streaming** - Watch your code being generated live
- **Production-Ready Output** - 800-1500+ lines of comprehensive code
- **Smart Context** - AI remembers your conversation for iterative improvements

### 📎 File Attachments (NEW!)
- **Upload Context Files** - Images, PDFs, and text files
- **Multimodal AI** - Gemini can "see" your images and PDFs
- **Design Recreation** - Upload mockups and get code back
- **Resume/Portfolio** - Upload PDF to auto-generate portfolio sites

### 🚀 One-Click Deploy (NEW!)
- **CodePen** - Instant share, no account needed
- **GitHub Gist** - Permanent link with live preview
- **New Tab Preview** - Quick local testing

### 🔄 Smart Diff System (NEW!)
- **Visual Diff Viewer** - See what changed before applying
- **Apply/Reject Changes** - Full control over AI modifications
- **New builds stream directly** - Instant feedback for fresh projects

### 💻 Developer Experience
- **Monaco Editor** - VS Code-powered with syntax highlighting
- **Live Preview** - Sandboxed iframe preview updates in real-time
- **Undo/Redo** - Revert AI changes with one click
- **Download/Copy** - Export your code instantly

---

## 🎬 Demo

### 🎮 Minecraft Clone - Built with ONE Prompt!

[![Watch Minecraft Clone Demo](https://img.shields.io/badge/▶️_Watch-Minecraft_Clone_Demo-blue?style=for-the-badge&logo=youtube)](./demos/minecraft%20clone%20.mp4)

[**🎥 Download Video** (minecraft clone .mp4)](./demos/minecraft%20clone%20.mp4)

### 💬 See AI Coder in Action

[![Watch AI Coder in Action](https://img.shields.io/badge/▶️_Watch-AI_Coder_in_Action-purple?style=for-the-badge&logo=youtube)](./demos/ai%20coder%20prompt%20preview.mp4)

[**🎥 Download Video** (ai coder prompt preview.mp4)](./demos/ai%20coder%20prompt%20preview.mp4)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19.2.0, TypeScript 5.9.3, Vite |
| **Styling** | TailwindCSS 4.x, Custom CSS |
| **Editor** | Monaco Editor 0.55.1 |
| **AI** | Google Generative AI SDK, OpenAI SDK (OpenRouter) |
| **Utilities** | diff-match-patch, Lucide Icons |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **API Key** - Either:
  - [Google AI Studio](https://aistudio.google.com/app/apikey) (Free, recommended)
  - [OpenRouter](https://openrouter.ai/keys) (Multi-model access)

### Installation

```bash
# Clone the repository
git clone https://github.com/Gouthamsai78/ai-coder.git
cd ai-coder

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Configuration

1. Click the **⚙️ Settings** icon in the header
2. Choose your **API Provider** (Google AI or OpenRouter)
3. Enter your **API Key**
4. (Optional) Add **GitHub Token** for Deploy feature

---

## 📖 How to Use

### 1. Set Your API Key
- Click Settings → Choose Provider → Paste API Key
- Keys are stored locally in your browser

### 2. Start Building
Type what you want to create:
- "Create a landing page for a SaaS product"
- "Build a portfolio website with dark theme"
- "Make an e-commerce dashboard with charts"

### 3. Upload Context (Optional)
- Click 📎 to attach files
- Supported: Images (PNG, JPG), PDFs, Text files
- AI uses them to understand your vision

### 4. Watch It Generate
- Real-time code streaming
- Live preview updates
- Smart diff for modifications

### 5. Deploy & Share
- Click **🚀 Deploy** button
- Choose CodePen, GitHub Gist, or New Tab
- Share your creation with the world!
 
---

## 📁 Project Structure

```
ai-coder/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx    # Chat UI with file attachments
│   │   ├── CodeEditor.tsx       # Monaco-based editor
│   │   ├── Preview.tsx          # Live HTML preview
│   │   ├── DiffViewer.tsx       # Visual diff comparison
│   │   ├── DeployModal.tsx      # Deploy options UI
│   │   ├── SettingsModal.tsx    # API & GitHub settings
│   │   └── Toast.tsx            # Notification system
│   ├── services/
│   │   ├── ai.ts                # AI integration (Gemini + OpenRouter)
│   │   ├── deploy.ts            # Deployment services
│   │   └── fileProcessor.ts     # File upload utilities
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── App.tsx                  # Main application
│   └── index.css                # Global styles
├── public/
│   └── logo.jpg                 # App logo
└── package.json
```

---

## 🎯 What AI Coder Can Build

### Application Types
| Type | Examples |
|------|----------|
| **Dashboards** | Analytics, Admin panels, KPI trackers |
| **E-Commerce** | Product pages, Carts, Checkout flows |
| **Landing Pages** | SaaS, Portfolios, Coming soon |
| **Productivity** | Todo apps, Kanban boards, Note-taking |
| **Games** | Simple browser games, Interactive puzzles |
| **Social** | Profile pages, Feeds, Chat interfaces |

### Technical Features
- ✅ Responsive layouts (mobile, tablet, desktop)
- ✅ Modern CSS (Glassmorphism, Gradients, Animations)
- ✅ Interactive JavaScript (State management, Event handling)
- ✅ Firebase/Supabase integration patterns
- ✅ Chart.js, Three.js, GSAP integrations
- ✅ Accessibility (ARIA, Semantic HTML)

---

## 🔐 Security & Privacy

- **Local Storage** - API keys and code stay in your browser
- **Sandboxed Preview** - Generated code runs in isolated iframe
- **No Data Collection** - Nothing is sent to our servers
- **Direct API Calls** - Requests go straight to AI providers

---

## ⚙️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Multi-provider AI support (Google AI + OpenRouter)
- [x] File attachments for AI context
- [x] Deploy to CodePen/GitHub Gist
- [x] Visual diff system
- [x] Enhanced AI prompting for complex apps
- [x] Added new search option to search the internet
- [x] Added new llms out of the box  

### 🔜 Coming Soon
- [ ] GitHub Pages deployment (OAuth)
- [ ] Multi-file project support
- [ ] Project save/load
- [ ] Version history
- [ ] Template library
- [ ] Collaboration features

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 📬 Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/Gouthamsai78/ai-coder/issues)
- **Email**: gouthamsai480@gmail.com

---

<div align="center">

**Made with ❤️ by Goutham Sai**

⭐ Star this repo if you find it useful!

</div>
