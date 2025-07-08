# MyConva

A modern AI-powered chat application with multimodal capabilities, featuring image upload, camera integration, and real-time messaging with OpenAI's GPT-4 Vision API.

## Overview

MyConva is a full-stack web application that provides an iMessage-like chat interface with advanced AI capabilities. Users can send text messages, upload images, take photos, and receive intelligent responses from an AI assistant with personality.

## Features

### Core Chat Features
- **Real-time messaging** with an AI assistant
- **Image upload** from device gallery
- **Camera integration** for taking photos directly in the app
- **Message reactions** with emoji support
- **Emoji picker** for enhanced messaging
- **Chat history** with persistent local storage
- **Clear chat functionality**

### AI Capabilities
- **Multimodal AI** powered by OpenAI's GPT-4 Vision API
- **Image analysis** - AI can see and respond to uploaded images
- **Personality-driven responses** - AI acts as a friendly, charismatic companion
- **Context-aware conversations** - Maintains conversation history

### Technical Features
- **Responsive design** optimized for mobile and desktop
- **Image optimization** with automatic resizing
- **Azure Blob Storage** for image hosting
- **Cross-origin resource sharing** configured for development

## Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **Chakra UI** for modern, accessible components
- **Framer Motion** for smooth animations
- **React Router** for navigation
- **React Icons** for iconography

### Backend
- **Spring Boot 3.4.1** with Java 17
- **Spring Web** for REST API endpoints
- **Azure Blob Storage** for image storage
- **OpenAI API** integration for AI responses
- **Maven** for dependency management

## Project Structure

```
MyConva/
├── backend/                    # Spring Boot backend
│   ├── src/main/java/com/myconva/backend/
│   │   ├── BackendApplication.java
│   │   ├── ChatController.java
│   │   └── HelloController.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
├── myconva-frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── HomeScreen.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API Endpoints

### Chat API
- `POST /api/chat` - Send message to AI and get response
- `DELETE /api/chat/clear` - Clear chat history

### Image API
- `POST /api/upload` - Upload image to Azure Blob Storage

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Java 17+
- Maven 3.6+
- OpenAI API key
- Azure Blob Storage account

### Environment Setup
1. Configure `backend/src/main/resources/application.properties`:
   ```properties
   openai.api.key=your_openai_api_key
   azure.blob.connection-string=your_azure_connection_string
   ```

### Running the Application

#### Backend
```bash
cd backend
mvn spring-boot:run
```
Server runs on `http://localhost:8080`

#### Frontend
```bash
cd myconva-frontend
npm install
npm run dev
```
Client runs on `http://localhost:5173`

## Features in Detail

### AI Personality
The AI assistant is configured with a friendly, charismatic personality that:
- Acts as your best friend
- Uses humor and charm in conversations
- Adapts to your communication style
- Provides engaging, entertaining responses

### Image Processing
- **Client-side resizing** prevents large file uploads
- **Automatic scaling** to max 1024x1024 pixels
- **Server-side optimization** further reduces images to 512x512
- **Azure Blob Storage** provides reliable, scalable image hosting

### Mobile-First Design
- **Responsive layout** works on all screen sizes
- **Touch-friendly** interface elements
- **Smooth animations** enhance user experience
- **iOS-inspired** design language

## Development

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

#### Backend
- `mvn spring-boot:run` - Start Spring Boot server
- `mvn test` - Run tests
- `mvn clean install` - Build JAR file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and demonstration purposes.