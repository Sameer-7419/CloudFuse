# ☁️ CloudFuse

**CloudFuse** is a centralized file management platform built using the **MERN stack**.  
It allows users to authenticate and link their cloud storage providers (currently **Google Drive** and **Dropbox**), upload files to multiple platforms, and manage shared file links — all from one place.  

Enhanced with **AI-powered semantic search** and **automated content summarization & tagging**, CloudFuse helps users organize and retrieve their files smarter and faster.

---

## ✨ Features

- 🔐 **OAuth 2.0 Integration** with Google Drive & Dropbox  
- 📁 **Upload to Multiple Platforms** from a single dashboard  
- 📜 **File Metadata and Upload History** tracking  
- 🔗 **Public Shareable Links** generation  
- 🧾 **Clean Dashboard** to view, download, and delete files  
- 🧩 **JWT-Based User Authentication**  
- 🎨 **Tailwind-Powered React UI**  
- 🧠 **Cross-Platform Semantic Search** using **Vector Database** — search files by meaning, not just keywords  
- 🤖 **AI Summarization & Tagging** using **Gemini** — automatically generate summaries and smart tags for uploaded documents  

---

## 📦 Tech Stack

| Tech | Description |
|------|--------------|
| **MongoDB** | NoSQL database (Mongoose) |
| **Express.js** | Node.js server framework |
| **React.js** | Frontend UI |
| **Node.js** | JavaScript runtime |
| **Tailwind CSS** | Modern styling |
| **Google Drive API** | Cloud file storage |
| **Dropbox API** | Cloud file storage |
| **Vector Database** (ChromaDB) | Semantic file search |
| **Gemini API** | AI summarization and tagging engine |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Sameer-7419/CloudFuse.git
cd cloudfuse
npm i
```
### 2. Configure the .env file according to .env.example

### 3. Start the node.js backend server

```bash
cd backend
node index.js
```

### 4. Start the python backend server

```bash
cd pythonAPI
python app.py
```

### 5. Start the frontend server

```bash
cd frontend
npm run dev
