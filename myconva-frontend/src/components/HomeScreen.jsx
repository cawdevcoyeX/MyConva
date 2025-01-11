import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  HStack,
  Image,
  IconButton,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { Global } from '@emotion/react';
import {
  FiPlus,
  FiChevronLeft,
  FiCamera,
  FiImage,
  FiSmile,
  FiDollarSign,
  FiMic,
  FiArrowUp,
  FiTrash2,
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Helper: Transform the local `messages` state into the “vision” format
 * that GPT-4 with vision expects.
 */
async function fetchBotReply(conversation) {
  try {
    // Convert local messages to the GPT-4 vision format
    const transformedMessages = conversation.map((msg) => {
      const role = msg.isMine ? 'user' : 'assistant';
      if (msg.isImage && msg.imageUrl) {
        return {
          role,
          content: [
            { type: 'text', text: msg.text || 'User shared an image:' },
            {
              type: 'image_url',
              image_url: {
                url: msg.imageUrl,
                detail: 'auto', // or 'low' / 'high'
              },
            },
          ],
        };
      } else {
        return {
          role,
          content: [{ type: 'text', text: msg.text }],
        };
      }
    });

    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: transformedMessages }),
    });

    if (!response.ok) {
      console.error('Error with OpenAI request', response);
      return null;
    }

    const data = await response.json();
    return data.assistantMessage; // { role: 'assistant', content: [ ... ] }
  } catch (err) {
    console.error('Network or server error:', err);
    return null;
  }
}

/**
 * Helper: Client-side image resizing to avoid 413 Payload Too Large.
 * - maxWidth / maxHeight: largest dimension allowed.
 * - quality: JPEG quality (0.0 ~ 1.0).
 */
async function resizeImageFile(file, maxWidth = 1024, maxHeight = 1024, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      const img = new window.Image();
      img.onload = () => {
        // Determine new width/height
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = width / maxWidth;
          const heightRatio = height / maxHeight;
          const maxRatio = Math.max(widthRatio, heightRatio);
          width = Math.floor(width / maxRatio);
          height = Math.floor(height / maxRatio);
        }

        // Create offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to Blob (JPEG)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas is empty'));
            }
            // Convert blob -> File to maintain file-likeness
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const newFile = new File([blob], fileName, { type: 'image/jpeg' });
            resolve(newFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
      img.src = loadEvent.target.result;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function HomeScreen() {
  // Reaction icons
  const reactionOptions = [
    { key: 'love', icon: '❤️' },
    { key: 'like', icon: '👍' },
    { key: 'dislike', icon: '👎' },
    { key: 'haha', icon: '😂' },
    { key: 'exclaim', icon: '‼️' },
    { key: 'question', icon: '❓' },
  ];

  // Load messages from localStorage (optional).
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem('chatMessages');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        text: 'Hi, I can now handle images too!',
        isMine: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: [],
      },
    ];
  });

  // Whenever `messages` changes, update localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  // The text input the user is typing
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [reactionPopupIndex, setReactionPopupIndex] = useState(null);

  // For emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // A small set of emojis
  const emojis = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😊',
    '🥰',
    '😍',
    '🤩',
    '😘',
    '🤗',
    '🤔',
    '😎',
  ];

  // Photo picker
  const {
    isOpen: isPhotoPickerOpen,
    onOpen: openPhotoPicker,
    onClose: closePhotoPicker,
  } = useDisclosure();

  // Camera
  const {
    isOpen: isCameraOpen,
    onOpen: openCamera,
    onClose: closeCamera,
  } = useDisclosure();
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  // For scrolling to bottom
  const chatBoxRef = useRef(null);

  // For auto-resizing the textarea
  const textareaRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto resize logic
  const handleInput = useCallback((e) => {
    const textArea = e.target;
    textArea.style.height = 'auto';
    textArea.style.overflowY = 'hidden';

    const scrollHeight = textArea.scrollHeight;
    const maxHeightPx = 120; // ~5 lines
    if (scrollHeight > maxHeightPx) {
      textArea.style.height = `${maxHeightPx}px`;
      textArea.style.overflowY = 'auto';
    } else {
      textArea.style.height = `${scrollHeight}px`;
    }
  }, []);

  // If user presses Enter => send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendClick();
    }
  };

  const isTyping = message.trim().length > 0;
  const handleMicOrSendClick = () => {
    if (isTyping) {
      handleSendClick();
    } else {
      console.log('Mic clicked (no text typed).');
    }
  };

  /**
   * Send text message, then fetch reply
   */
  const handleSendClick = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const newUserMessage = {
      text: trimmed,
      isMine: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }

    // Close emoji picker if open
    setShowEmojiPicker(false);

    // Fetch reply
    const updatedConversation = [...messages, newUserMessage];
    const botReply = await fetchBotReply(updatedConversation);

    if (botReply) {
      let combinedText = '';
      if (Array.isArray(botReply.content)) {
        for (const block of botReply.content) {
          if (block.type === 'text') {
            combinedText += block.text + ' ';
          }
        }
      }
      const newBotMessage = {
        text: combinedText.trim(),
        isMine: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: [],
      };
      setMessages((prev) => [...prev, newBotMessage]);
    }
  };

  /**
   * Called when a user picks an image from file picker
   */
  const handlePhotoSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file!');
      return;
    }

    try {
      // 1) Resize it client-side to avoid 413 error
      const resizedFile = await resizeImageFile(file, 1024, 1024, 0.9);
      // 2) Upload the smaller file
      const finalUrl = await handleImageUpload(resizedFile);
      if (!finalUrl) {
        alert('Image upload failed');
        return;
      }
      // 3) Send as a message
      sendImageMessage(finalUrl);
    } catch (error) {
      console.error('Error resizing or uploading image:', error);
      alert('Unable to resize/upload image');
    }

    closePhotoPicker();
  };

  /**
   * Upload image to Azure (server endpoint)
   */
  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        console.error('Upload failed', response);
        return null;
      }
      const data = await response.json();
      if (data.url) {
        return data.url;
      } else {
        return null;
      }
    } catch (err) {
      console.error('Error uploading image', err);
      return null;
    }
  };

  /**
   * Add a user "image" message to the chat, then fetch the bot reply
   */
  const sendImageMessage = async (imageUrl) => {
    const newUserMessage = {
      text: 'Here is my image!',
      isMine: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
      isImage: true,
      imageUrl,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Now fetch the reply
    const updatedConversation = [...messages, newUserMessage];
    const botReply = await fetchBotReply(updatedConversation);

    if (botReply) {
      let combinedText = '';
      if (Array.isArray(botReply.content)) {
        for (const block of botReply.content) {
          if (block.type === 'text') {
            combinedText += block.text + ' ';
          }
        }
      }
      const newBotMessage = {
        text: combinedText.trim(),
        isMine: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: [],
      };
      setMessages((prev) => [...prev, newBotMessage]);
    }
  };

  /**
   * Reaction logic
   */
  const handleMessageClick = (e, index) => {
    e.stopPropagation();
    setReactionPopupIndex((prev) => (prev === index ? null : index));
  };

  const handleReactionSelect = (msgIndex, reactionIcon) => {
    setMessages((prev) =>
      prev.map((msg, i) => {
        if (i === msgIndex && !msg.reactions.includes(reactionIcon)) {
          return { ...msg, reactions: [...msg.reactions, reactionIcon] };
        }
        return msg;
      })
    );
  };

  // Close reaction popup if click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reactionPopupIndex !== null) {
        const isPopup = e.target.closest('[data-reaction-popup]');
        const isButton = e.target.closest('[data-reaction-button]');
        const isBubble = e.target.closest('[data-message-bubble]');
        if (!isPopup && !isButton && !isBubble) {
          setReactionPopupIndex(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [reactionPopupIndex]);

  /**
   * Camera logic
   */
  useEffect(() => {
    if (isCameraOpen && !cameraStream) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error('Error accessing camera:', err);
        });
    } else if (!isCameraOpen && cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [isCameraOpen, cameraStream]);

  const handleTakePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const localPreviewUrl = URL.createObjectURL(blob);

      // Create a temp message
      const tempMessageId = `temp-${Date.now()}`;
      const newMessage = {
        id: tempMessageId,
        text: 'Here is my image!',
        isMine: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: [],
        isImage: true,
        imageUrl: localPreviewUrl,
        uploading: true,
      };
      setMessages((prev) => [...prev, newMessage]);

      // Close camera
      closeCamera();

      // We'll do the same client-side resizing if you want (optional)
      // For brevity, skipping that here. But you could pass blob -> resizeImageFile too.

      // Upload
      const file = new File([blob], 'camera-image.png', { type: 'image/png' });
      const finalUrl = await handleImageUpload(file);
      if (!finalUrl) {
        console.error('Image upload failed');
        return;
      }

      // Replace the local preview URL with the final URL
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tempMessageId) {
            return { ...m, imageUrl: finalUrl, uploading: false };
          }
          return m;
        })
      );

      // Fetch bot reply
      const updatedConversation = [
        ...messages,
        {
          ...newMessage,
          imageUrl: finalUrl,
          uploading: false,
        },
      ];
      const botReply = await fetchBotReply(updatedConversation);
      if (botReply) {
        let combinedText = '';
        if (Array.isArray(botReply.content)) {
          for (const block of botReply.content) {
            if (block.type === 'text') {
              combinedText += block.text + ' ';
            }
          }
        }
        const newBotMessage = {
          text: combinedText.trim(),
          isMine: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          reactions: [],
        };
        setMessages((prev) => [...prev, newBotMessage]);
      }
    }, 'image/png');
  };

  /**
   * Clear chat log
   */
  const handleClearChat = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/chat/clear', {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.error('Error clearing chat', response);
        return;
      }
      setMessages([]);
      localStorage.removeItem('chatMessages');
    } catch (err) {
      console.error('Error clearing chat log:', err);
    }
  };

  // Handle clicking on an emoji
  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <>
      <Global
        styles={`
          ::-webkit-scrollbar {
            display: none;
          }
          body {
            -ms-overflow-style: none;
            scrollbar-width: none;
            margin: 0;
            padding: 0;
          }
        `}
      />

      {/* PHOTO PICKER MODAL */}
      <Modal isOpen={isPhotoPickerOpen} onClose={closePhotoPicker}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select a Photo</ModalHeader>
          <ModalBody>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ width: '100%' }}
            />
          </ModalBody>
          <ModalFooter>
            <Button onClick={closePhotoPicker}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* CAMERA MODAL */}
      <Modal isOpen={isCameraOpen} onClose={closeCamera}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Camera</ModalHeader>
          <ModalBody>
            <Box w="100%" display="flex" justifyContent="center" alignItems="center">
              <video
                ref={videoRef}
                style={{ width: '100%', maxHeight: '300px' }}
                autoPlay
                playsInline
              />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={closeCamera}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleTakePhoto}>
              Take Photo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <VStack
        spacing={0}
        align="stretch"
        w="100vw"
        h="100vh"
        bg="white"
        overflow="hidden"
        position="relative"
      >
        {/* Top bar */}
        <Box
          bg="#F2F2F7"
          p={3}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={2}
          position="relative"
        >
          {/* CLEAR CHAT BUTTON (top-right) */}
          <IconButton
            aria-label="Clear chat"
            icon={<FiTrash2 />}
            variant="ghost"
            onClick={handleClearChat}
            _focus={{ boxShadow: 'none', outline: 'none' }}
            _hover={{ bg: 'transparent' }}
            _active={{ bg: 'transparent' }}
            position="absolute"
            right="0.5rem"
          />
        </Box>

        {/* Chat area */}
        <Box
          ref={chatBoxRef}
          flex="1"
          bg="white"
          p={4}
          overflowY="auto"
          position="relative"
          zIndex={1}
          pt={12} // top padding to avoid overlap
        >
          {messages.map((msg, index) => {
            const alignment = msg.isMine ? 'flex-end' : 'flex-start';
            const bubbleColor = msg.isMine ? '#007AFF' : '#E5E5EA';
            const textColor = msg.isMine ? 'white' : 'black';

            return (
              <Box
                key={index}
                display="flex"
                flexDirection="column"
                alignItems={alignment}
                mb={4}
              >
                {/* Message bubble */}
                <Box
                  bg={bubbleColor}
                  color={textColor}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  maxW="70%"
                  boxShadow="md"
                  cursor={!msg.isMine ? 'pointer' : 'default'}
                  position="relative"
                  data-message-bubble
                  onClick={
                    !msg.isMine
                      ? (e) => handleMessageClick(e, index)
                      : undefined
                  }
                >
                  {msg.isImage && msg.imageUrl ? (
                    <Image
                      src={msg.imageUrl}
                      alt="user-upload"
                      maxH="200px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ) : (
                    <Text fontSize="md">{msg.text}</Text>
                  )}

                  {/* Reaction popup (for assistant messages) */}
                  {!msg.isMine && reactionPopupIndex === index && (
                    <Box
                      position="absolute"
                      data-reaction-popup
                      top="-2.5rem"
                      bg="white"
                      p={1}
                      borderRadius="md"
                      boxShadow="lg"
                      display="flex"
                      alignItems="center"
                      zIndex={999}
                    >
                      {reactionOptions.map((option) => (
                        <Box
                          key={option.key}
                          as="button"
                          data-reaction-button
                          fontSize="xl"
                          mx={1}
                          onClick={() => handleReactionSelect(index, option.icon)}
                        >
                          {option.icon}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Timestamp + Reactions */}
                {!msg.isMine ? (
                  <HStack alignSelf={alignment} mt={1} spacing={2}>
                    <Text fontSize="xs" color="gray.500">
                      {msg.timestamp}
                    </Text>
                    {msg.reactions.length > 0 && (
                      <HStack spacing="4px">
                        {msg.reactions.map((icon, idx) => (
                          <Box
                            key={idx}
                            bg="white"
                            borderRadius="full"
                            boxShadow="md"
                            p="2px"
                            fontSize="lg"
                          >
                            {icon}
                          </Box>
                        ))}
                      </HStack>
                    )}
                  </HStack>
                ) : (
                  <Text mt={1} fontSize="xs" color="gray.500" alignSelf={alignment}>
                    {msg.timestamp}
                  </Text>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Bottom toolbar */}
        <Box
          bg="#F2F2F7"
          borderTop="1px solid"
          borderColor="#E5E5EA"
          px={2}
          py={2}
          zIndex={2}
          position="relative"
        >
          <HStack alignItems="flex-end" spacing={2}>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="expandedIcons"
                  initial={{ width: 0, opacity: 0, x: 50 }}
                  animate={{ width: 'auto', opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', overflow: 'hidden' }}
                >
                  <HStack spacing={1} ml={0}>
                    <IconButton
                      aria-label="Camera"
                      icon={<FiCamera />}
                      variant="ghost"
                      onClick={openCamera}
                      _focus={{ boxShadow: 'none', outline: 'none' }}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                    />
                    <IconButton
                      aria-label="Photos"
                      icon={<FiImage />}
                      variant="ghost"
                      onClick={openPhotoPicker}
                      _focus={{ boxShadow: 'none', outline: 'none' }}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                    />
                    {/* EMOJI BUTTON */}
                    <IconButton
                      aria-label="Emoji"
                      icon={<FiSmile />}
                      variant="ghost"
                      _focus={{ boxShadow: 'none', outline: 'none' }}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                    />
                    <IconButton
                      aria-label="Pay"
                      icon={<FiDollarSign />}
                      variant="ghost"
                      _focus={{ boxShadow: 'none', outline: 'none' }}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                    />
                    <IconButton
                      aria-label="Collapse"
                      icon={<FiChevronLeft />}
                      variant="ghost"
                      onClick={() => setExpanded(false)}
                      _focus={{ boxShadow: 'none', outline: 'none' }}
                      _hover={{ bg: 'transparent' }}
                      _active={{ bg: 'transparent' }}
                    />
                  </HStack>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsedPlus"
                  initial={{ width: 0, opacity: 0, x: -50 }}
                  animate={{ width: 'auto', opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', overflow: 'hidden' }}
                >
                  <IconButton
                    aria-label="Expand"
                    icon={<FiPlus />}
                    variant="ghost"
                    onClick={() => setExpanded(true)}
                    _focus={{ boxShadow: 'none', outline: 'none' }}
                    _hover={{ bg: 'transparent' }}
                    _active={{ bg: 'transparent' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <Box flex="1" position="relative">
              {/* If showEmojiPicker is true, display the emoji popup */}
              {showEmojiPicker && (
                <Box
                  position="absolute"
                  bottom="100%"
                  left="0"
                  bg="white"
                  boxShadow="md"
                  borderRadius="md"
                  p={2}
                  zIndex={999}
                  mb={2}
                  width="200px"
                  maxHeight="150px"
                  overflowY="auto"
                >
                  <Text fontWeight="bold" mb={1} fontSize="sm">
                    Select Emojis:
                  </Text>
                  <Box display="flex" flexWrap="wrap" gap="6px">
                    {emojis.map((emo) => (
                      <Box
                        key={emo}
                        as="button"
                        fontSize="xl"
                        onClick={() => handleEmojiClick(emo)}
                        _focus={{ boxShadow: 'none', outline: 'none' }}
                        _hover={{ bg: 'gray.100' }}
                        borderRadius="md"
                        p="2px"
                      >
                        {emo}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Textarea
                ref={textareaRef}
                placeholder="Message"
                rows={1}
                borderRadius="md"
                bg="white"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ height: 'auto', overflowY: 'hidden' }}
                resize="none"
                lineHeight="24px"
                onInput={handleInput}
                p={2}
                pr="3rem"
              />
              {/* Mic / Send Arrow */}
              <Box
                position="absolute"
                right="1rem"
                bottom="50%"
                transform="translateY(50%)"
                cursor="pointer"
                onClick={handleMicOrSendClick}
                zIndex={2}
              >
                {isTyping ? (
                  <FiArrowUp color="#007AFF" size={20} />
                ) : (
                  <FiMic color="gray.400" size={20} />
                )}
              </Box>
            </Box>
          </HStack>
        </Box>
      </VStack>
    </>
  );
}

export default HomeScreen;
