# MyConva Backend

Spring Boot backend service for the MyConva AI chat application, providing REST APIs for chat functionality and image management.

## Overview

This backend service handles:
- AI chat integration with OpenAI's GPT-4 Vision API
- Image upload and processing with Azure Blob Storage
- Message history management
- Cross-origin resource sharing for frontend communication

## Architecture

### Core Components

#### ChatController (`src/main/java/com/myconva/backend/ChatController.java`)
Main REST controller handling all API endpoints:
- **Chat endpoint** (`/api/chat`) - Processes multimodal conversations
- **Image upload** (`/api/upload`) - Handles image uploads with resizing
- **Chat clearing** (`/api/chat/clear`) - Clears conversation history

#### Dependencies
- **Spring Boot Web** - REST API framework
- **Azure Blob Storage** - Cloud image storage
- **OpenAI API** - AI conversation capabilities
- **Image processing** - Built-in Java image manipulation

## API Endpoints

### POST /api/chat
Processes multimodal chat messages with AI.

**Request Format:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Hello, can you see this image?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image.jpg",
            "detail": "auto"
          }
        }
      ]
    }
  ]
}
```

**Response Format:**
```json
{
  "assistantMessage": {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Yes, I can see the image! It shows..."
      }
    ]
  }
}
```

### POST /api/upload
Uploads and processes images for chat use.

**Request:** Multipart form data with `file` field
**Response:**
```json
{
  "url": "https://koladechatbot.blob.core.windows.net/images/uuid-filename.png"
}
```

### DELETE /api/chat/clear
Clears the in-memory chat history.

**Response:**
```json
{
  "status": "Chat log cleared"
}
```

## Features

### AI Integration
- **OpenAI GPT-4 Vision API** for multimodal understanding
- **Custom system prompt** configures AI personality
- **Conversation context** maintained across messages
- **Error handling** for API failures

### Image Processing
- **Automatic resizing** to maximum 512x512 pixels
- **Quality optimization** maintains visual fidelity
- **Format standardization** converts to PNG
- **Memory efficient** processing with streams

### Azure Blob Storage
- **Secure uploads** with connection string authentication
- **Unique filenames** prevent collisions
- **Container management** auto-creates storage containers
- **Public URL generation** for frontend access

### Security & Configuration
- **CORS enabled** for localhost:5173 (development)
- **API key management** through application properties
- **Error handling** with appropriate HTTP status codes
- **Input validation** for file types and sizes

## Configuration

### Application Properties
```properties
spring.application.name=backend
openai.api.key=sk-proj-...
azure.blob.connection-string=DefaultEndpointsProtocol=https;AccountName=...
```

### Environment Variables
For production deployment, use environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `AZURE_BLOB_CONNECTION_STRING` - Azure storage connection string

## Dependencies

### Core Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-storage-blob</artifactId>
    <version>12.22.0</version>
</dependency>
```

### Build Configuration
- **Java 17** target version
- **Spring Boot 3.4.1** framework
- **Maven** build system
- **Spring Boot Maven Plugin** for packaging

## Development

### Running the Application
```bash
# Development mode
mvn spring-boot:run

# Build JAR
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Testing
```bash
# Run tests
mvn test

# Run with coverage
mvn test jacoco:report
```

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Test chat endpoint
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": [{"type": "text", "text": "Hello"}]}]}'

# Test image upload
curl -X POST http://localhost:8080/api/upload \
  -F "file=@image.jpg"
```

## Error Handling

The application handles various error scenarios:
- **Invalid image files** - Returns 400 Bad Request
- **Upload failures** - Returns 500 Internal Server Error
- **OpenAI API errors** - Returns 500 with error details
- **Missing request data** - Returns 400 Bad Request

## Performance Considerations

### Image Processing
- **Client-side pre-processing** reduces server load
- **Streaming uploads** handle large files efficiently
- **Memory management** prevents OutOfMemoryError
- **Concurrent processing** with proper thread safety

### API Optimization
- **Connection pooling** for external API calls
- **Timeout configuration** prevents hanging requests
- **Rate limiting** considerations for OpenAI API
- **Caching strategies** for frequently accessed data

## Deployment

### Production Checklist
- [ ] Configure environment variables
- [ ] Set up Azure Blob Storage
- [ ] Configure OpenAI API access
- [ ] Set up SSL/TLS termination
- [ ] Configure logging levels
- [ ] Set up monitoring and health checks
- [ ] Configure CORS for production domain

### Docker Deployment
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## Monitoring

### Health Checks
Spring Boot Actuator can be added for:
- `/actuator/health` - Application health
- `/actuator/metrics` - Performance metrics
- `/actuator/env` - Environment information

### Logging
Configure logging in `application.properties`:
```properties
logging.level.com.myconva=DEBUG
logging.level.org.springframework.web=INFO
```