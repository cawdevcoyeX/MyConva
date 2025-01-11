import React from 'react'
import ReactDOM from 'react-dom/client'

// 1. Import the ChakraProvider component
import { ChakraProvider } from '@chakra-ui/react'

import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap your app with ChakraProvider */}
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
