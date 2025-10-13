# 🌩️ CloudFuse

CloudFuse is a centralized file management platform built using the **MERN stack**. It allows users to authenticate and link their cloud storage providers (currently **Google Drive** and **Dropbox**), upload files to multiple platforms, and manage shared file links — all from one place.

---

## ✨ Features

- 🔐 OAuth 2.0 Integration with Google Drive & Dropbox
- 📁 Upload to multiple platforms from a single platform
- 📜 File metadata and upload history
- 🔗 Public shareable links
- 🧾 Clean dashboard to view, download, and delete files
- 🧩 JWT-based user authentication
- 🎨 Tailwind-powered React UI

---

## 📦 Tech Stack

| Tech         | Description                  |
|--------------|------------------------------|
| MongoDB      | NoSQL database (Mongoose)    |
| Express.js   | Node.js server framework     |
| React.js     | Frontend UI                  |
| Node.js      | JavaScript runtime           |
| Tailwind CSS | Modern styling               |
| Google Drive API | Cloud file storage      |
| Dropbox API  | Cloud file storage           |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Sameer-7419/CloudFuse.git
cd cloudfuse
npm i
```
### 2. Configure the .env file according to .env.example

### 3. Start the backend server

```bash
cd backend
node index.js
```

### 4. Start the frontend server

```bash
cd frontend
npm run dev
