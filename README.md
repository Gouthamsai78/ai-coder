# 🚀 AI Coder

> **AI-Powered Code Generation Platform** - Transform your ideas into beautiful, functional HTML web applications through natural conversation.

![AI Coder](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📖 Overview

**AI Coder** is an intelligent web application that allows you to create stunning, production-ready HTML websites simply by describing what you want to build. Powered by AI, it generates complete, self-contained HTML files with modern design, responsive layouts, and interactive features.

### ✨ Key Features

- 🤖 **AI-Powered Generation** - Describe your vision in plain English, get beautiful code
- ⚡ **Real-time Streaming** - Watch your code being generated in real-time
- 👀 **Live Preview** - Instant visual feedback with sandboxed iframe preview
- 💾 **Download Code** - Export your generated HTML with one click
- 🎨 **Modern Editor** - VS Code-powered Monaco editor with syntax highlighting
- 💬 **Contextual Chat** - AI remembers your conversation for iterative improvements
- 🎯 **Single-File Output** - Complete HTML with inline CSS and JavaScript
- 📱 **Responsive Design** - Generated code works on mobile, tablet, and desktop
- 🌙 **Flexible Styling** - Supports glassmorphism, minimalist, neumorphic, and more
- 🔒 **Secure** - API keys stored locally, sandboxed preview execution

---

## 🎬 Demo

### 🎮 Minecraft Clone - Built with ONE Prompt!

Watch AI Coder generate a fully functional Minecraft clone with a single prompt:

https://github.com/user-attachments/assets/a1b2c3d4-minecraft-clone.mp4

<video src="./demos/minecraft clone .mp4" width="100%" controls></video>

### 💬 See AI Coder in Action

Watch the AI generate code in real-time:

https://github.com/user-attachments/assets/e5f6g7h8-ai-coder-preview.mp4

<video src="./demos/ai coder prompt preview.mp4" width="100%" controls></video>

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - Latest React with modern hooks and features
- **TypeScript 5.9.3** - Type-safe development
- **Vite (Rolldown)** - Lightning-fast build tool and dev server
- **TailwindCSS 4.1.17** - Utility-first CSS framework

### Code Editor
- **Monaco Editor 0.55.1** - VS Code's editor engine
- **@monaco-editor/react** - React wrapper for Monaco

### AI Integration
- **OpenAI SDK 6.9.1** - Configured for OpenRouter API
- **OpenRouter** - Multi-model AI gateway
- **Streaming Support** - Real-time code generation feedback

### UI Components
- **Lucide React** - Beautiful, consistent icons
- **clsx + tailwind-merge** - Dynamic className utilities

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OpenRouter API Key** (Get one at [openrouter.ai](https://openrouter.ai/keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gouthamsai78/vibe-coder-.git
   cd vibe-coder-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Configuration

1. Click the **Settings** icon (⚙️) in the header
2. Enter your **OpenRouter API Key** (starts with `sk-or-...`)
3. The key is stored locally in your browser

---

## 📖 How to Use

### 1. Set Your API Key
- Click the settings icon in the top-right corner
- Paste your OpenRouter API key
- The key is saved automatically in localStorage

### 2. Start Building
Type what you want to create in the chat, for example:
- "Create a landing page for a SaaS product"
- "Build a portfolio website with a dark theme"
- "Make a pricing page with 3 tiers"

### 3. Watch It Generate
- See the code being written in real-time (streaming)
- Preview updates live in the right panel
- Chat interface shows AI responses

### 4. Iterate and Refine
Continue chatting to make changes:
- "Make the buttons bigger"
- "Add a contact form"
- "Change colors to blue and purple"
- "Add animations to the cards"

### 5. Download Your Code
- Click the **Download** button in the header
- Get a complete, ready-to-deploy HTML file
- Open it in any browser - no dependencies needed!

---

## 🎨 Generated Code Features

The AI generates HTML files with:

### Design Qualities
✅ Modern, professional aesthetics  
✅ Responsive layouts (mobile, tablet, desktop)  
✅ Smooth animations and transitions  
✅ Accessible markup (ARIA labels, semantic HTML)  
✅ Google Fonts integration  
✅ Font Awesome icons via CDN  

### Technical Features
✅ Single-file architecture (HTML + CSS + JS)  
✅ TailwindCSS via CDN  
✅ Pure JavaScript (no build step required)  
✅ Clean, commented code  
✅ SEO-friendly meta tags  

### Supported Styles
- 🌈 Glassmorphism
- 🎨 Minimalist
- 💎 Neumorphism
- 🔥 Bold & Vibrant
- And custom styles based on your request!

---

## 📁 Project Structure

```
ai-coder/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx    # Chat UI with message history
│   │   ├── CodeEditor.tsx       # Monaco-based code editor
│   │   └── Preview.tsx          # Live HTML preview iframe
│   ├── services/
│   │   └── ai.ts                # OpenRouter API integration & streaming
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles + glassmorphism utilities
├── public/                      # Static assets
├── package.json                 # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
└── tsconfig.json               # TypeScript configuration
```

---

## 🎯 Use Cases

### For Developers
- 🚀 Rapid prototyping
- 💡 Quick mockups for client presentations
- 📚 Learning HTML/CSS/JavaScript patterns
- 🎨 Design inspiration

### For Designers
- 🖼️ Convert ideas to working prototypes
- 🎭 Test design concepts quickly
- 📱 Create interactive mockups
- 🌐 Build portfolio pieces

### For Entrepreneurs
- 📄 Create landing pages
- 💼 Build marketing sites
- 🎯 Test product ideas
- 📊 Generate pricing pages

---

## ⚙️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

---

## 🔒 Security & Privacy

- **API Keys**: Stored locally in browser's localStorage, never sent to our servers
- **Sandboxed Preview**: Generated code runs in isolated iframe with restricted permissions
- **No Data Collection**: Your code and conversations stay in your browser
- **OpenRouter**: API calls go directly to OpenRouter's secure endpoints

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Use TypeScript for type safety
- Follow existing code style
- Add comments for complex logic
- Test your changes locally
- Update documentation as needed

---

## 🐛 Known Issues & Limitations

- **Single File Only**: Currently generates one HTML file (no multi-file projects)
- **No Persistence**: Code is lost on refresh (use download to save)
- **API Costs**: OpenRouter API usage may incur costs depending on your plan
- **Browser-based**: Runs entirely in browser, large files may impact performance

---

## 🗺️ Roadmap

### Upcoming Features
- [ ] Multi-file project support (separate HTML, CSS, JS)
- [ ] Project save/load functionality
- [ ] Multiple AI model selection
- [ ] Code version history
- [ ] Deploy to Netlify/Vercel integration
- [ ] Template library
- [ ] Collaboration features
- [ ] Dark/Light mode toggle for editor
- [ ] Code formatting (Prettier integration)
- [ ] Export to CodePen/JSFiddle

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenRouter** - For multi-model AI access
- **Monaco Editor** - VS Code's amazing editor
- **React Team** - For the incredible framework
- **Vite Team** - For the blazing-fast build tool
- **TailwindCSS** - For the utility-first CSS framework

---

## 📬 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Gouthamsai78/vibe-coder-/issues)
- **Email**: gouthamsai78@gmail.com

---

## 🌟 Show Your Support

If you find Vibe Coder useful, please consider:
- ⭐ Starring the repository
- 🐦 Sharing on social media
- 🤝 Contributing to the project
- ☕ Buying me a coffee

---

<div align="center">

**Made with ❤️ by Goutham Sai**



</div>
