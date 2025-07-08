# MyConva Frontend

React-based frontend application for MyConva, providing an intuitive, mobile-first chat interface with advanced multimodal capabilities.

## Overview

The frontend delivers a modern, iMessage-inspired chat experience with:
- Real-time messaging with AI
- Image upload and camera integration
- Smooth animations and responsive design
- Message reactions and emoji support
- Persistent chat history

## Tech Stack

### Core Framework
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast development server and build tool
- **JavaScript (ES6+)** - Modern JavaScript features

### UI Framework & Styling
- **Chakra UI** - Modular and accessible component library
- **Emotion** - CSS-in-JS styling solution
- **Framer Motion** - Smooth animations and transitions
- **React Icons** - Comprehensive icon library

### Routing & Navigation
- **React Router DOM** - Client-side routing (prepared for multi-page expansion)

## Project Structure

```
myconva-frontend/
├── src/
│   ├── components/
│   │   └── HomeScreen.jsx      # Main chat interface
│   ├── assets/                 # Static assets
│   ├── App.jsx                 # Root component with routing
│   ├── main.jsx               # Application entry point
│   ├── App.css                # Global styles
│   └── index.css              # Base styles
├── public/                     # Static public assets
├── package.json               # Dependencies and scripts
├── vite.config.js            # Vite configuration
└── eslint.config.js          # ESLint configuration
```

## Core Components

### App.jsx
Root application component with routing setup:
- **React Router** configuration
- **Route definitions** for future expansion
- **Single-page application** structure

### HomeScreen.jsx
Main chat interface component featuring:
- **Message rendering** with bubbles and timestamps
- **Input handling** with auto-resize textarea
- **Image upload** with drag-and-drop support
- **Camera integration** with live preview
- **Emoji picker** for enhanced messaging
- **Message reactions** with popup interface
- **Animation system** for smooth interactions

## Key Features

### Chat Interface
- **Message bubbles** with distinct styling for user/AI messages
- **Timestamps** for message history
- **Auto-scrolling** to latest messages
- **Typing indicators** with dynamic send button
- **Message persistence** using localStorage

### Image Handling
- **File picker** for gallery uploads
- **Camera capture** with live video preview
- **Client-side resizing** to prevent large uploads
- **Preview system** for uploaded images
- **Upload progress** indicators

### Responsive Design
- **Mobile-first** approach
- **Flexible layouts** using Chakra UI Grid/Flex
- **Touch-friendly** interface elements
- **Viewport adaptation** for all screen sizes

### Animations
- **Smooth transitions** powered by Framer Motion
- **Expandable toolbar** with staggered animations
- **Message appearance** animations
- **Reaction popup** animations

## API Integration

### Chat API
```javascript
// Send message to backend
const response = await fetch('http://localhost:8080/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: transformedMessages })
});
```

### Image Upload API
```javascript
// Upload image to Azure Blob Storage
const formData = new FormData();
formData.append('file', file);
const response = await fetch('http://localhost:8080/api/upload', {
  method: 'POST',
  body: formData
});
```

## State Management

### Message State
```javascript
const [messages, setMessages] = useState([]);
```
- **Array of message objects** with text, images, reactions
- **Persistent storage** in localStorage
- **Real-time updates** with React state

### UI State
```javascript
const [message, setMessage] = useState('');
const [expanded, setExpanded] = useState(false);
const [reactionPopupIndex, setReactionPopupIndex] = useState(null);
```

## Development

### Available Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Dependencies

#### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.15.0",
  "@chakra-ui/react": "^2.5.0",
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.0",
  "framer-motion": "^11.15.0",
  "react-icons": "^5.4.0"
}
```

#### Development Dependencies
```json
{
  "@vitejs/plugin-react": "^4.3.4",
  "vite": "^6.0.5",
  "eslint": "^9.17.0",
  "eslint-plugin-react": "^7.37.2",
  "eslint-plugin-react-hooks": "^5.0.0"
}
```

## Features in Detail

### Message System
- **Multimodal messages** support text and images
- **Message reactions** with emoji selection
- **Timestamp formatting** for better UX
- **Message persistence** across sessions

### Image Processing
- **Client-side resizing** using Canvas API
- **Quality optimization** for faster uploads
- **Format conversion** to standardized JPEG
- **Memory-efficient** processing

### Camera Integration
- **WebRTC camera access** using getUserMedia
- **Live video preview** in modal
- **Photo capture** with canvas rendering
- **Automatic cleanup** of media streams

### Emoji System
- **Curated emoji set** for quick access
- **Popup interface** for emoji selection
- **Text insertion** at cursor position
- **Reaction system** for message responses

## Configuration

### Vite Configuration
```javascript
export default defineConfig({
  plugins: [react()],
  // Additional config for production builds
})
```

### ESLint Configuration
```javascript
export default [
  js.configs.recommended,
  ...reactHooks.configs.recommended,
  ...react.configs.recommended,
  // Custom rules
]
```

## Performance Optimizations

### Image Handling
- **Client-side compression** reduces server load
- **Lazy loading** for image rendering
- **Memory management** for large images
- **Efficient uploads** with progress tracking

### React Optimizations
- **useCallback** for event handlers
- **useMemo** for expensive calculations
- **Component memoization** where appropriate
- **Efficient re-renders** with proper state structure

### Bundle Optimization
- **Vite's built-in optimizations** for fast builds
- **Tree shaking** for smaller bundle sizes
- **Code splitting** for better loading performance
- **Asset optimization** for images and fonts

## Browser Compatibility

### Supported Browsers
- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

### Required APIs
- **Canvas API** for image processing
- **MediaDevices API** for camera access
- **Fetch API** for network requests
- **LocalStorage** for data persistence

## Deployment

### Build Process
```bash
# Create optimized production build
npm run build

# Build output in dist/ directory
# Static files ready for deployment
```

### Deployment Options
- **Vercel** - Seamless deployment from Git
- **Netlify** - Static site hosting
- **AWS S3** - With CloudFront CDN
- **GitHub Pages** - For demo deployments

### Environment Configuration
```javascript
// Production API endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

## Testing

### Testing Strategy
- **Component testing** with React Testing Library
- **Integration testing** for API interactions
- **E2E testing** with Cypress (future)
- **Visual regression testing** (future)

### Test Files Structure
```
src/
├── components/
│   ├── HomeScreen.jsx
│   └── __tests__/
│       └── HomeScreen.test.jsx
└── utils/
    └── __tests__/
        └── helpers.test.jsx
```

## Accessibility

### ARIA Support
- **Screen reader** compatibility
- **Keyboard navigation** support
- **Focus management** for modals
- **Semantic HTML** structure

### Chakra UI Benefits
- **Built-in accessibility** features
- **Color contrast** compliance
- **Responsive design** patterns
- **Touch target** sizing

## Future Enhancements

### Planned Features
- **Voice messages** with speech recognition
- **Message search** functionality
- **Chat themes** and customization
- **Offline support** with service workers
- **Push notifications** for real-time updates

### Technical Improvements
- **Progressive Web App** capabilities
- **Real-time messaging** with WebSockets
- **State management** with Context API or Redux
- **Performance monitoring** with analytics