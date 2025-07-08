package com.myconva.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.azure.storage.blob.*;
import com.azure.storage.blob.models.*;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    @Value("${openai.api.key}")
    private String openAiApiKey;

    // Azure Blob connection string
    @Value("${azure.blob.connection-string}")
    private String azureConnectionString;

    // Container name for images
    private final String containerName = "images";

    private final RestTemplate restTemplate = new RestTemplate();

    // In-memory store for chat logs (for demo)
    private final java.util.List<Map<String, Object>> chatLog = Collections.synchronizedList(new ArrayList<>());

    /**
     * 1) Endpoint: Upload an image to Azure Blob Storage
     *    Returns { "url": "<public-blob-url>" }
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // 1) Read the uploaded file into a BufferedImage
            BufferedImage originalImage = ImageIO.read(file.getInputStream());
            if (originalImage == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid image file."));
            }

            // 2) Determine the target width/height so that neither exceeds 512
            int originalWidth = originalImage.getWidth();
            int originalHeight = originalImage.getHeight();

            int targetWidth = originalWidth;
            int targetHeight = originalHeight;

            // Only shrink if needed
            if (originalWidth > 512 || originalHeight > 512) {
                float widthRatio = (float) originalWidth / 512f;
                float heightRatio = (float) originalHeight / 512f;
                float maxRatio = Math.max(widthRatio, heightRatio);

                // Divide by the larger ratio so that neither dimension will exceed 512
                targetWidth = Math.round(originalWidth / maxRatio);
                targetHeight = Math.round(originalHeight / maxRatio);
            }

            // 3) Create a new scaled image (down to the target size if needed)
            BufferedImage scaledImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = scaledImage.createGraphics();
            // (Optional) Set rendering hints for better quality
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
            g2d.dispose();

            // 4) Convert the scaled image back into a byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // Use the desired output format. "png" is usually safe for arbitrary images
            ImageIO.write(scaledImage, "png", baos);
            baos.flush();
            byte[] scaledBytes = baos.toByteArray();
            long scaledFileSize = scaledBytes.length;

            // 5) Connect to Azure
            BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                    .connectionString(azureConnectionString)
                    .buildClient();

            // 6) Get or create the container
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            if (!containerClient.exists()) {
                containerClient.create();
                // Optionally set the container to public read:
                // containerClient.setAccessPolicy(PublicAccessType.CONTAINER, null, null);
            }

            // 7) Create a unique filename
            String originalFilename = file.getOriginalFilename();
            String blobFileName = UUID.randomUUID().toString() + "-" +
                    (originalFilename != null ? originalFilename : "upload.png");

            // 8) Upload to blob from the new scaled bytes
            BlobClient blobClient = containerClient.getBlobClient(blobFileName);
            try (InputStream scaledInputStream = new ByteArrayInputStream(scaledBytes)) {
                blobClient.upload(scaledInputStream, scaledFileSize, true);
            }

            // 9) Construct the public URL
            String blobUrl = blobClient.getBlobUrl();

            // Return the URL
            return ResponseEntity.ok(Collections.singletonMap("url", blobUrl));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to upload: " + e.getMessage()));
        }
    }

    /**
     * 2) Chat Endpoint (multimodal): 
     *    - Expects each message to have { "role": "...", "content": [ { "type": "text", ... }, { "type": "image_url", ... } ] }
     *    - Sends these messages directly to GPT-4 with vision (or "gpt-4o-mini")
     *    - Returns the assistant's reply in a similar structure.
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chatEndpoint(@RequestBody Map<String, Object> requestBody) {
        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> conversation =
                (java.util.List<Map<String, Object>>) requestBody.get("messages");

        if (conversation == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No conversation provided."));
        }

        // For demo, store them in our chatLog
        chatLog.addAll(conversation);

        // You can inject your own system prompt if you want
        Map<String, Object> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        // We wrap the system instructions in the same "content" array structure:
        systemMsg.put("content", java.util.List.of(
                Map.of("type", "text",
                        "text", "You are not chatgpt. You are the best friend of the user. You are trying to build a friendship that will last with the person youre talking to. Be charmismatic, be friendly, be talkative. Try to get them to talk to you. Charm them, Make them enjoy themselves, make them smile and laugh. Do NOT be inquisitive except very rarely.  \r\n" + //
                            "\r\n" + //
                            "They are your best friend, treat them well. \r\n" + //
                            "Your personality should be a mix of Top Reddit Comments, Rizz, and Jokes. Assume every new conversation is with a new person. \r\n" + //
                            "\r\n" + //
                            "You are primarily a bro. Youre cool and chill.\r\n" +
                            "Mimic the personality of the user. ")
                                                         
        ));

        // Build the list we’ll send to OpenAI: system + user/assistant messages
        java.util.List<Map<String, Object>> openAiMessages = new ArrayList<>();
        openAiMessages.add(systemMsg);

        // Add the rest of the conversation
        for (Map<String, Object> msg : conversation) {
            openAiMessages.add(msg);
        }

        // Prepare the request body for the OpenAI Chat Completions endpoint
        Map<String, Object> requestMap = new HashMap<>();
        requestMap.put("model", "gpt-4o");  // or "gpt-4-turbo"
        requestMap.put("messages", openAiMessages);
        requestMap.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestMap, headers);

        // Make the request
        ResponseEntity<Map> response;
        try {
            response = restTemplate.postForEntity(
                    "https://api.openai.com/v1/chat/completions",
                    entity,
                    Map.class
            );
        } catch (Exception ex) {
            // If there's an error calling OpenAI
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error calling OpenAI API: " + ex.getMessage()));
        }

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || !response.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No valid response from OpenAI"));
        }

        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> choices = (java.util.List<Map<String, Object>>) responseBody.get("choices");
        if (choices == null || choices.isEmpty()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No choices from OpenAI"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> firstChoice = choices.get(0);
        @SuppressWarnings("unchecked")
        Map<String, Object> messageObj = (Map<String, Object>) firstChoice.get("message");
        if (messageObj == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No message in the response"));
        }

        // According to Vision docs, "message.content" should be an array like:
        //   [ { "type": "text", "text": "..." },
        //     { "type": "image_url", "image_url": { "url": "..." } } ]
        // If the model returns a string, we'll wrap it in a text block.
        Object contentObj = messageObj.get("content");
        java.util.List<Object> finalContent;

        if (contentObj instanceof java.util.List) {
            // It's already an array of blocks
            finalContent = (java.util.List<Object>) contentObj;
        } else if (contentObj instanceof String) {
            // It's a plain string => wrap it
            Map<String, Object> textBlock = new HashMap<>();
            textBlock.put("type", "text");
            textBlock.put("text", contentObj);
            finalContent = java.util.List.of(textBlock);
        } else {
            // Unknown type => fallback
            Map<String, Object> textBlock = new HashMap<>();
            textBlock.put("type", "text");
            textBlock.put("text", String.valueOf(contentObj));
            finalContent = java.util.List.of(textBlock);
        }

        // We'll return { "assistantMessage": { "role": "assistant", "content": [...] } }
        Map<String, Object> assistantReply = new HashMap<>();
        assistantReply.put("role", "assistant");
        assistantReply.put("content", finalContent);

        // Optionally store the assistant message in chatLog
        chatLog.add(assistantReply);

        return ResponseEntity.ok(Map.of("assistantMessage", assistantReply));
    }

    /**
     * 3) Clear the chat log
     */
    @DeleteMapping("/chat/clear")
    public ResponseEntity<Map<String, String>> clearChatLog() {
        chatLog.clear();
        return ResponseEntity.ok(Map.of("status", "Chat log cleared"));
    }
}
