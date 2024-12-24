# Foddie Server

# 🛠️ Server Project

A robust backend server built with Express.js, MongoDB, and other essential tools for building scalable APIs and handling server-side operations.

## 📚 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Available Scripts](#-available-scripts)
- [Environment Variables](#-environment-variables)


## 📝 About the Project

This backend server is designed to handle API requests, manage authentication, and interact with MongoDB for data persistence. It follows best practices for security, scalability, and maintainability.

## 🛠️ Tech Stack

### Backend
- **Express.js**: Web framework for Node.js
- **MongoDB**: NoSQL database
- **Dotenv**: Environment variable management
- **JSON Web Token (JWT)**: Authentication and authorization
- **Cors**: Middleware for cross-origin requests
- **Cookie Parser**: Middleware for handling cookies

## 💻 Installation

1. **Clone the repository:**
   ```bash
 https://github.com/programming-hero-web-course2/b10a11-server-side-aminul118.git
   ```
2. **Navigate to the project folder:**
   ```bash
   cd server
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:**
   Create a `.env` file and configure the required environment variables.
5. **Start the development server:**
   ```bash
   npm run dev
   ```
6. **Start the production server:**
   ```bash
   npm start
   ```

## 📜 Available Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with Nodemon
- `npm test`: Run tests (if available)



## 🔑 Environment Variables

Ensure you have the following variables in your `.env` file:
```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```


