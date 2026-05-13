# ArtDeck - Real-time Collaborative Whiteboard 🎨

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node-dot-js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-FF6F00?style=for-the-badge&logo=websocket&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://turbo.build/)

A modern, real-time collaborative whiteboard platform where users can create or join rooms to draw, brainstorm, and collaborate instantly. ArtDeck supports multiple drawing tools, secure authentication, and real-time synchronization across users.  
Built with **pure Canvas  and coordinate-based logic** for rendering shapes and drawings — no external drawing libraries used.  

---

## ✨ Features

### 🎨 Beautiful & Intuitive UI
- **Clean Whiteboard Design**: Minimalistic and user-friendly interface for seamless collaboration  
- **Drawing Tools**: Pencil, rectangle, circle, rhombus,Text (rendered via raw Canvas and coordinates)  
- **Responsive Layout**: Works on desktop and tablet devices  
- **Real-time Updates**: Instant synchronization of drawings across all users in a room  

### ⚡ Real-time Collaboration
- **WebSocket-powered Communication**: Low-latency updates for all participants  
- **Multiple Users per Room**: Collaborate with friends, colleagues, or students simultaneously  
- **Room Management**: Create or join rooms using a unique name or ID  

### 🔒 Authentication & Security
- **JWT-based Authentication**: Secure sign-up and sign-in with token verification  
- **Local Storage Tokens**: Persistent login across sessions  
- **Private Rooms**: Only users with the room ID can access a whiteboard  

### 🛠️ Tech Stack
- **Frontend**: Next.js, Tailwind CSS  
- **Backend**: Node.js, Express.js  
- **Database**: Prisma ORM  
- **Authentication**: JWT tokens  
- **Real-time Communication**: WebSockets  
- **Canvas Rendering**: Pure HTML5 Canvas + coordinate-based shape logic  
- **Project Structure**: Monorepo managed using Turborepo  

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)  
- npm, yarn, or pnpm  

### Installation
1. **Clone the repository**
```bash
git clone https://github.com/Shourya-B07/ArtDeck.git
```
2. **Install dependencies**
```bash
pnpm install
```
3. **PrismaClient**
```bash
cd packages/db
npx prisma db push
npx prisma generate
```
4. **To run**
```bash
pnpm run dev
``` 
