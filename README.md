# ArtDeck - Real-time Collaborative Whiteboard 🎨

A modern, real-time collaborative whiteboard platform where users can create or join rooms to draw, brainstorm, and collaborate instantly. ArtDeck supports multiple drawing tools, secure authentication, and real-time synchronization across users.

---

## ✨ Features

### 🎨 Beautiful & Intuitive UI
- **Clean Whiteboard Design**: Minimalistic and user-friendly interface for seamless collaboration  
- **Drawing Tools**: Pencil, rectangle, circle, and rhombus  
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
- **Frontend**: Next.js ,Tailwindcss 
- **Backend**: Node.js, Express.js  
- **Database**: Prisma ORM  
- **Authentication**: JWT tokens  
- **Real-time Communication**: WebSockets  
- **Project Structure**: Monorepo managed using Turborepo  

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)  
- npm or yarn or pnpm

### Installation
1. **Clone the repository**
```bash
git clone https://github.com/yourusername/artdeck.git
cd artdeck
