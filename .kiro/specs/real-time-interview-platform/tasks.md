 Implementation Plan: Real-Time Technical Interview Platform

## Overview

This implementation plan transforms the existing Jobly recruitment platform into a comprehensive Real-Time Technical Interview Platform. The platform unifies three critical pipelines—Communication (WebRTC video/audio + transcription), Coding (collaborative IDE with execution sandbox), and Whiteboard (collaborative canvas)—into a synchronized interview environment with unified timeline, evidence-based evaluation, and AI-powered insights.

**Technology Stack:** Node.js 20 LTS, TypeScript 5.3+, Express.js, MongoDB 7+, Redis 7.2+, LiveKit (WebRTC), Yjs (CRDT), Docker+gVisor (sandboxing), Monaco Editor, Fabric.js

**Architecture:** Modular monolith with independent worker scaling, event sourcing for timeline, multi-tenant data isolation

## Tasks

### Phase 1: Foundation & Infrastructure Setup

- [ ] 1. Set up project infrastructure and core dependencies
  - Install Node.js 20 LTS with TypeScript 5.3+ build configuration
  - Configure Express.js 4.19 with Helmet.js security headers and CORS
  - Set up MongoDB 7+ connection with mongoose ODM and replica set configuration
  - Set up Redis 7.2+ connection with ioredis client for queues, pub/sub, caching
  - Configure MinIO/S3 client for object storage with signed URL generation
  - Install BullMQ 5.x for job queues with retry policies
  - Configure OpenTelemetry SDK with OTLP exporter for distributed tracing
  - Set up Pino structured logging with JSON output
  - Install ESLint, Prettier, and TypeScript strict mode configuration
  - Create Docker Compose file for local development (MongoDB, Redis, MinIO)
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 24.1, 24.2_

- [ ] 2. Implement authentication and authorization infrastructure
  - Create JWT token generation and validation middleware with role claims (SEEKER, RECRUITER, ADMIN)
  - Implement refresh token rotation strategy with Redis storage
  - Create authorization middleware for resource-level access control
  - Implement multi-tenant context extraction from JWT claims
  - Create tenant isolation middleware for database queries
  - Implement rate limiting with express-rate-limit and Redis backend
  - Add password hashing with bcrypt and secure session management
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 21.1, 21.2, 21.3_


- [ ] 3. Create core domain models and MongoDB schemas
  - Define InterviewSession model with status, stage, participants, artifacts, LiveKit config, Yjs config
  - Define TimelineEvent model with polymorphic metadata (communication, coding, whiteboard, session events)
  - Define Evaluation model with competency scores, evidence references, AI insights
  - Define CodeCheckpoint model with filesystem snapshot, Yjs state, S3 references
  - Define WhiteboardSnapshot model with objects, layers, viewport, preview images
  - Define TranscriptDocument model with segments, speaker diarization, word-level timestamps
  - Define User model with roles, tenant association, authentication fields
  - Define JobApplication and JobPosition models (preserve existing ATS functionality)
  - Create MongoDB indexes for tenant isolation, timeline queries, full-text search
  - _Requirements: 1.1, 1.4, 14.1, 14.2, 14.3, 14.4, 17.1, 21.1, 21.2_

- [ ] 4. Checkpoint - Verify foundation setup
  - Run database migrations and verify all collections created
  - Test JWT generation, validation, and role-based authorization
  - Verify multi-tenant isolation with sample queries
  - Test OpenTelemetry trace propagation and Pino logging output
  - Ensure Docker Compose services (MongoDB, Redis, MinIO) start correctly
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Interview Session Management

- [ ] 5. Implement Interview Session Manager domain service
  - [ ] 5.1 Create session creation logic with tenant isolation
    - Generate unique session tokens and access tokens with expiration
    - Link session to JobApplication, Recruiter, Seeker, JobPosition
    - Initialize session state with WAITING_ROOM stage
    - Persist InterviewSession document to MongoDB
    - _Requirements: 1.1, 1.3, 1.6, 21.1_


  - [ ] 5.2 Implement stage transition logic with validation
    - Validate stage transition rules (WAITING_ROOM → INTRODUCTION → CODING → ... → COMPLETED)
    - Record stage entry and exit timestamps in stageHistory array
    - Append STAGE_TRANSITION event to Unified Timeline
    - Broadcast stage change to all connected participants via WebSocket
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ] 5.3 Implement participant management and access control
    - Add participants to session with role (SEEKER, RECRUITER)
    - Generate time-limited access tokens for each participant
    - Track participant join/leave events with timestamps
    - Update participant online status in real-time
    - Validate participant authorization before allowing pipeline access
    - _Requirements: 1.3, 27.1, 27.2, 27.3, 27.4, 27.5_

  - [ ] 5.4 Create REST API endpoints for session management
    - POST /api/interviews - Create new interview session (recruiter only)
    - GET /api/interviews/:id - Get session details with authorization check
    - POST /api/interviews/:id/join - Join session with access token validation
    - POST /api/interviews/:id/stage - Transition to next stage (recruiter only)
    - GET /api/interviews/:id/participants - List participants with presence status
    - POST /api/interviews/:id/complete - Mark session as completed
    - _Requirements: 1.1, 1.5, 22.3, 22.4_

- [ ] 6. Checkpoint - Verify session management
  - Test session creation with tenant isolation
  - Verify stage transitions and validation rules
  - Test participant authorization and access token expiration
  - Verify timeline events for session lifecycle
  - Ensure all tests pass, ask the user if questions arise.


### Phase 3: Communication Pipeline - LiveKit Integration

- [ ] 7. Set up LiveKit SFU infrastructure
  - [ ] 7.1 Install LiveKit SDK and configure server connection
    - Install livekit-server-sdk for Node.js
    - Configure LiveKit server URL, API key, and API secret from environment
    - Create LiveKit RoomServiceClient singleton
    - _Requirements: 2.1, 2.6_

  - [ ] 7.2 Implement LiveKit room management service
    - Create LiveKit room on interview session creation with metadata
    - Configure room settings (emptyTimeout, maxParticipants, egress for recording)
    - Generate access tokens for participants with room join permissions
    - Clean up rooms when session completes or times out
    - _Requirements: 1.2, 2.1, 2.2, 29.1_

  - [ ] 7.3 Implement WebRTC signaling API endpoints
    - POST /api/communication/:sessionId/token - Generate LiveKit access token
    - GET /api/communication/:sessionId/room - Get room details and connection info
    - POST /api/communication/:sessionId/recording/start - Start recording (recruiter only)
    - POST /api/communication/:sessionId/recording/stop - Stop recording (recruiter only)
    - _Requirements: 2.2, 29.1, 29.2, 29.5_

- [ ] 8. Implement real-time transcription worker
  - [ ] 8.1 Create transcription worker with BullMQ
    - Set up transcription job queue with BullMQ
    - Install Deepgram SDK (or AssemblyAI alternative)
    - Create worker process to subscribe to LiveKit audio tracks
    - Configure Deepgram streaming with nova-2 model, diarization, punctuation
    - _Requirements: 3.1, 3.4, 25.6_


  - [ ] 8.2 Implement transcript processing and speaker mapping
    - Stream audio PCM from LiveKit to Deepgram WebSocket
    - Process interim and final transcript segments
    - Map Deepgram speaker labels (SPEAKER_0, SPEAKER_1) to participant IDs using audio track metadata
    - Extract word-level timestamps and confidence scores
    - Handle overlapping speech and background noise
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ] 8.3 Store transcripts and append to timeline
    - Save transcript segments to TranscriptDocument collection
    - Append TRANSCRIPT_SEGMENT events to Unified Timeline with searchable text
    - Broadcast transcript updates to all participants via WebSocket
    - Handle transcription errors gracefully with retry logic
    - _Requirements: 3.3, 3.5, 14.2_

- [ ] 9. Implement recording management with LiveKit Egress
  - [ ] 9.1 Configure LiveKit Egress for recording
    - Set up Egress service with S3/MinIO upload destination
    - Configure room composite recording (grid/speaker layout)
    - Record all participant video tracks separately for replay
    - _Requirements: 29.1, 29.2, 29.3_

  - [ ] 9.2 Handle recording lifecycle and storage
    - Start recording when session transitions out of WAITING_ROOM
    - Monitor recording status and handle failures with recovery
    - Upload completed recordings to S3/MinIO with signed URLs
    - Generate preview thumbnails at regular intervals
    - Store recording metadata in InterviewSession.artifacts
    - _Requirements: 29.1, 29.4, 29.5, 29.6, 23.1, 23.4_


- [ ] 10. Implement presence tracking and screen sharing
  - Track participant presence states (joined, active, disconnected, reconnected) using Redis sorted sets
  - Identify and broadcast active speaker using LiveKit's speaker detection
  - Implement screen sharing capabilities with window/display selection
  - Track screen sharing events (started, stopped) in timeline
  - _Requirements: 2.4, 2.5, 2.3, 14.2_

- [ ] 11. Checkpoint - Verify communication pipeline
  - Test LiveKit room creation and access token generation
  - Verify WebRTC connection and audio/video streaming
  - Test real-time transcription with speaker diarization
  - Verify recording start/stop and S3 upload
  - Test presence tracking and screen sharing
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Coding Pipeline - Collaborative Editor Foundation

- [ ] 12. Set up Yjs CRDT collaboration infrastructure
  - [ ] 12.1 Install and configure Yjs dependencies
    - Install yjs, y-websocket, y-mongodb-provider, y-protocols
    - Create Yjs document manager service
    - Set up Redis pub/sub for cross-instance synchronization
    - _Requirements: 28.3, 28.4, 26.7_

  - [ ] 12.2 Implement Yjs WebSocket provider with Redis pub/sub
    - Create WebSocket endpoint for Yjs sync: ws://api/collab/:sessionId
    - Handle Yjs connection with awareness protocol for cursors and selections
    - Subscribe to Redis channels for cross-instance message routing
    - Broadcast Yjs updates to local clients and publish to Redis
    - Implement debounced persistence to MongoDB using y-mongodb-provider
    - _Requirements: 28.1, 28.2, 28.5, 28.6_


  - [ ] 12.3 Design Yjs document structure for coding workspace
    - Create Y.Map for files (filePath → Y.Text content)
    - Create Y.Map for filesystem nodes (path → FileSystemNode metadata)
    - Create Y.Map for active files per participant
    - Configure awareness protocol for cursor positions, selections, participant presence
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 13. Implement collaborative file system operations
  - [ ] 13.1 Create file operations with Yjs synchronization
    - Implement createFile operation (add to files Y.Map and filesystem Y.Map)
    - Implement deleteFile operation with validation
    - Implement renameFile operation with path updates
    - Implement moveFile operation with parent directory updates
    - Record FILE_CREATED, FILE_DELETED, FILE_RENAMED events in timeline
    - _Requirements: 5.1, 5.6, 14.3_

  - [ ] 13.2 Create directory operations with Yjs synchronization
    - Implement createDirectory operation with nested structure support
    - Implement deleteDirectory operation (recursive with confirmation)
    - Implement renameDirectory and moveDirectory operations
    - Maintain parent-child relationships in filesystem Y.Map
    - _Requirements: 5.2, 5.3_

  - [ ] 13.3 Implement file system API endpoints
    - POST /api/coding/:sessionId/files - Create file
    - DELETE /api/coding/:sessionId/files - Delete file
    - PUT /api/coding/:sessionId/files/rename - Rename/move file
    - POST /api/coding/:sessionId/directories - Create directory
    - DELETE /api/coding/:sessionId/directories - Delete directory
    - GET /api/coding/:sessionId/workspace - Get complete workspace structure
    - _Requirements: 5.1, 5.2, 5.3, 5.5_


- [ ] 14. Implement Monaco editor integration backend
  - Create REST endpoints for editor configuration and language detection
  - Implement autosave with debounced workspace persistence to MongoDB
  - Track CODE_EDITED events with change metadata (lines added/deleted, file path)
  - Support multiple open file tabs with active file tracking per participant
  - _Requirements: 4.1, 4.4, 4.5, 4.6_

- [ ] 15. Checkpoint - Verify collaborative file system
  - Test Yjs document synchronization across multiple clients
  - Verify file and directory operations with real-time sync
  - Test conflict-free editing with simultaneous changes
  - Verify cursor positions and selections display
  - Test workspace persistence and recovery
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Coding Pipeline - Language Server Protocol Integration

- [ ] 16. Set up LSP gateway infrastructure
  - [ ] 16.1 Install LSP servers and dependencies
    - Install pyright-langserver for Python
    - Install typescript-language-server for TypeScript/JavaScript
    - Install jdtls (Eclipse JDT Language Server) for Java
    - Install clangd for C++
    - Install monaco-languageclient and vscode-ws-jsonrpc for LSP-WebSocket bridge
    - _Requirements: 6.1_

  - [ ] 16.2 Implement LSP Gateway service
    - Create LSP server process manager with stdio communication
    - Spawn language server processes on demand with workspace management
    - Route JSON-RPC messages from WebSocket clients to appropriate LSP server
    - Handle LSP server lifecycle (start, restart on crash, shutdown)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_


  - [ ] 16.3 Implement LSP feature endpoints
    - Handle textDocument/completion for autocomplete suggestions
    - Handle textDocument/publishDiagnostics for errors and warnings
    - Handle textDocument/hover for symbol documentation
    - Handle textDocument/definition for go-to-definition navigation
    - Handle textDocument/references for find-all-references
    - Handle textDocument/formatting for auto-format
    - Handle textDocument/signatureHelp for parameter hints
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ] 16.4 Create WebSocket endpoint for LSP communication
    - Create ws://api/lsp/:sessionId/:language endpoint
    - Forward LSP JSON-RPC requests from client to appropriate language server
    - Stream LSP responses back to client
    - Handle LSP initialization with workspace folder configuration
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 17. Checkpoint - Verify LSP integration
  - Test autocomplete suggestions for Python, TypeScript, Java, C++
  - Verify inline diagnostics display for syntax errors
  - Test hover documentation and go-to-definition
  - Verify find-references and signature help
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Coding Pipeline - Terminal with PTY

- [ ] 18. Implement terminal service with node-pty
  - [ ] 18.1 Set up terminal infrastructure
    - Install node-pty for pseudo-terminal support
    - Create TerminalService to manage PTY processes
    - Configure shell environment (bash) with workspace directory
    - Set environment variables (TERM, COLORTERM, INTERVIEW_SESSION_ID, WORKSPACE)
    - _Requirements: 7.1, 7.2, 7.5_


  - [ ] 18.2 Implement terminal output streaming
    - Stream PTY stdout/stderr to all participants in real-time via WebSocket
    - Handle terminal resize events (cols, rows)
    - Maintain command history for session
    - Record TERMINAL_COMMAND and TERMINAL_OUTPUT events in timeline
    - _Requirements: 7.3, 7.4, 7.5, 7.6_

  - [ ] 18.3 Create terminal API endpoints
    - POST /api/coding/:sessionId/terminal - Create new terminal session
    - WebSocket ws://api/terminal/:sessionId/:terminalId - Terminal I/O stream
    - POST /api/coding/:sessionId/terminal/:terminalId/input - Write input to terminal
    - POST /api/coding/:sessionId/terminal/:terminalId/resize - Resize terminal
    - DELETE /api/coding/:sessionId/terminal/:terminalId - Close terminal
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 19. Checkpoint - Verify terminal integration
  - Test terminal creation and real-time output streaming
  - Verify command execution (ls, cat, npm install, python script.py)
  - Test interactive commands with stdin
  - Verify command history and timeline recording
  - Ensure all tests pass, ask the user if questions arise.

### Phase 7: Coding Pipeline - Secure Code Execution Sandbox

- [ ] 20. Set up Docker sandbox infrastructure with gVisor
  - [ ] 20.1 Configure Docker and gVisor runtime
    - Install Docker 24+ and configure gVisor runsc runtime
    - Create Dockerfiles for language runtimes (python:3.11-slim, node:20-alpine, openjdk:21-slim, gcc:13-bookworm)
    - Build and cache Docker images with language-specific dependencies
    - Configure Docker daemon with gVisor runtime registration
    - _Requirements: 8.1, 8.7_


  - [ ] 20.2 Implement execution worker with BullMQ
    - Create execution job queue with priority and retry policies
    - Implement ExecutionWorker to process sandbox execution jobs
    - Configure worker pool (3-10 instances) with dedicated machines
    - _Requirements: 8.5, 25.5_

  - [ ] 20.3 Implement sandbox container orchestration
    - Create container with gVisor runtime, resource limits (CPU, memory, disk, network)
    - Configure security options (no-new-privileges, drop all capabilities, read-only rootfs)
    - Mount tmpfs for /tmp and /workspace with size limits
    - Set working directory to /workspace and inject code files
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 20.4 Implement code execution with timeout and resource tracking
    - Start container and execute language-specific command (python, node, tsx, java, g++)
    - Enforce execution timeout (default 30 seconds) with graceful termination
    - Capture stdout, stderr, exit code, execution duration
    - Track resource usage (memory, CPU) via Docker stats
    - Handle timeout, OOM kills, and execution errors gracefully
    - _Requirements: 8.5, 8.6, 8.7_

  - [ ] 20.5 Store execution results and append to timeline
    - Save execution metadata (timestamp, language, code snapshot, input, output, exit code, duration) to database
    - Upload code snapshots to S3 for large executions
    - Append CODE_EXECUTED event to timeline with execution details
    - Broadcast execution results to all participants via WebSocket
    - _Requirements: 9.1, 9.2, 9.4_


  - [ ] 20.6 Create code execution API endpoints
    - POST /api/coding/:sessionId/execute - Enqueue code execution job
    - GET /api/coding/:sessionId/executions - List execution history
    - GET /api/coding/:sessionId/executions/:executionId - Get execution details
    - POST /api/coding/:sessionId/executions/:executionId/rerun - Re-run previous execution
    - _Requirements: 9.1, 9.3, 9.5_

- [ ] 21. Checkpoint - Verify sandbox execution
  - Test code execution for Python, TypeScript, Java, C++ with various test cases
  - Verify resource limits enforcement (CPU, memory, timeout)
  - Test security isolation (network access blocked, filesystem restricted)
  - Verify execution results storage and timeline events
  - Test error handling for timeout, OOM, compilation errors
  - Ensure all tests pass, ask the user if questions arise.

### Phase 8: Coding Pipeline - Code History and Checkpoints

- [ ] 22. Implement checkpoint service
  - [ ] 22.1 Create checkpoint creation logic
    - Capture complete filesystem state from Yjs document (all files and directories)
    - Encode Yjs state vector and snapshot for version control
    - Calculate total size and file count metadata
    - Upload large snapshots (>10MB) to S3 with compression
    - Store checkpoint metadata in CodeCheckpoint collection
    - _Requirements: 10.1, 10.2_

  - [ ] 22.2 Implement checkpoint triggers
    - Create checkpoint after each code execution (EXECUTION trigger)
    - Create checkpoint on stage transitions (STAGE_TRANSITION trigger)
    - Create checkpoint on significant edits with 5-minute debounce (AUTO_SAVE trigger)
    - Allow recruiter to manually create checkpoints (MANUAL trigger)
    - _Requirements: 10.1, 10.2_


  - [ ] 22.3 Implement checkpoint restoration and time-travel
    - Load checkpoint from database or S3 (if large)
    - Decode Yjs snapshot and apply to current document
    - Restore complete workspace state (files, directories, content)
    - Broadcast checkpoint restoration to all participants
    - Append CODE_CHECKPOINT event to timeline
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ] 22.4 Create checkpoint API endpoints
    - POST /api/coding/:sessionId/checkpoints - Create manual checkpoint
    - GET /api/coding/:sessionId/checkpoints - List all checkpoints
    - GET /api/coding/:sessionId/checkpoints/:checkpointId - Get checkpoint details
    - POST /api/coding/:sessionId/checkpoints/:checkpointId/restore - Restore checkpoint
    - _Requirements: 10.1, 10.3_

- [ ] 23. Checkpoint - Verify code history
  - Test checkpoint creation at various triggers
  - Verify checkpoint restoration with time-travel navigation
  - Test large snapshot uploads to S3
  - Verify checkpoint correlation with timeline events
  - Ensure all tests pass, ask the user if questions arise.

### Phase 9: Whiteboard Pipeline - Collaborative Canvas

- [ ] 24. Set up Fabric.js whiteboard infrastructure
  - [ ] 24.1 Configure Yjs document structure for whiteboard
    - Create Y.Map for whiteboard objects (objectId → WhiteboardObject)
    - Create Y.Array for layer ordering (z-index)
    - Create Y.Map for viewport state per participant (zoom, pan)
    - Configure awareness protocol for cursor positions and selection
    - _Requirements: 11.1, 12.5_


  - [ ] 24.2 Implement Whiteboard Collaboration Service
    - Initialize Fabric.js canvas with infinite pan and zoom
    - Load existing objects from Yjs Y.Map on connection
    - Listen to canvas events (object:added, object:modified, object:removed)
    - Sync canvas changes to Yjs document
    - Listen to Yjs updates and apply to local canvas
    - Broadcast cursor positions and selections via awareness protocol
    - _Requirements: 11.1, 12.4, 12.5, 28.1, 28.2_

  - [ ] 24.3 Implement drawing tools and shape primitives
    - Implement freehand drawing with configurable stroke width and color
    - Implement shape tools (rectangle, circle, ellipse, triangle)
    - Implement line and arrow tools with endpoint snapping
    - Implement text objects with configurable font, size, color
    - Implement sticky notes with background color and text
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 25. Implement whiteboard object manipulation
  - [ ] 25.1 Create selection and transformation operations
    - Implement object selection (single and multiple) with visual indicators
    - Implement move, resize, rotate operations with real-time sync
    - Implement delete operation with Yjs removal
    - Implement duplicate and group operations
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 25.2 Implement undo/redo and operation history
    - Track operation history for undo/redo stack
    - Implement undo operation with Yjs state rewind
    - Implement redo operation with state forward
    - Sync undo/redo across participants
    - _Requirements: 12.6_


  - [ ] 25.3 Persist whiteboard state and timeline events
    - Persist complete Yjs whiteboard document to MongoDB with debouncing
    - Record WHITEBOARD_OBJECT_CREATED, WHITEBOARD_OBJECT_MODIFIED, WHITEBOARD_OBJECT_DELETED events
    - Record WHITEBOARD_OBJECT_GROUPED event for grouping operations
    - Append all whiteboard events to Unified Timeline
    - _Requirements: 12.7, 13.1, 13.2_

- [ ] 26. Implement whiteboard snapshots
  - [ ] 26.1 Create snapshot service for whiteboard
    - Capture all objects, layers, viewport state from Yjs document
    - Generate PNG preview image using canvas.toDataURL
    - Upload preview image to S3 with compression
    - Store snapshot in WhiteboardSnapshot collection
    - _Requirements: 13.3, 13.4_

  - [ ] 26.2 Implement snapshot restoration and replay
    - Load snapshot from database
    - Apply Yjs snapshot to restore whiteboard state
    - Restore all objects and layer ordering to canvas
    - Support incremental replay showing diagram evolution over time
    - _Requirements: 13.4, 13.5_

  - [ ] 26.3 Create whiteboard API endpoints
    - WebSocket ws://api/whiteboard/:sessionId - Real-time collaboration sync
    - POST /api/whiteboard/:sessionId/snapshots - Create manual snapshot
    - GET /api/whiteboard/:sessionId/snapshots - List snapshots
    - POST /api/whiteboard/:sessionId/snapshots/:snapshotId/restore - Restore snapshot
    - _Requirements: 13.1, 13.3_


- [ ] 27. Checkpoint - Verify whiteboard pipeline
  - Test collaborative drawing with multiple participants
  - Verify object manipulation (move, resize, rotate, delete, group)
  - Test undo/redo operations with synchronization
  - Verify snapshot creation and restoration
  - Test timeline event recording for whiteboard activities
  - Ensure all tests pass, ask the user if questions arise.

### Phase 10: Unified Timeline - Event Sourcing & Aggregation

- [ ] 28. Implement Unified Timeline service
  - [ ] 28.1 Create event sourcing infrastructure
    - Design TimelineEvent schema with polymorphic metadata (communication, coding, whiteboard, session)
    - Implement appendEvent method with sequence number generation using Redis INCR
    - Write events to MongoDB for durable storage
    - Publish events to Redis Streams for real-time propagation
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 28.2 Implement timeline event aggregation
    - Aggregate events from Communication Pipeline (transcript segments, presence, screen share)
    - Aggregate events from Coding Pipeline (file changes, executions, terminal commands, checkpoints)
    - Aggregate events from Whiteboard Pipeline (object operations, snapshots)
    - Aggregate session events (stage transitions, participant joins/leaves)
    - Maintain chronological ordering by sequence number
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 28.3 Implement timeline querying and filtering
    - Query events by interviewSessionId with pagination
    - Filter by event type (communication, coding, whiteboard, session)
    - Filter by participant ID
    - Filter by time range (startTime, endTime)
    - Support full-text search on searchable text (transcript, commands, file names)
    - _Requirements: 14.7, 14.8_


  - [ ] 28.4 Implement event navigation and context retrieval
    - Navigate to relevant artifacts from timeline events (transcript location, video timestamp, code checkpoint, whiteboard snapshot)
    - Retrieve event context (N events before and after) for debugging
    - Correlate related events using correlationId and causationId
    - _Requirements: 14.6_

  - [ ] 28.5 Create timeline API endpoints
    - GET /api/timeline/:sessionId/events - Get timeline events with filtering
    - GET /api/timeline/:sessionId/events/:eventId - Get event details
    - GET /api/timeline/:sessionId/events/:eventId/context - Get surrounding events
    - GET /api/timeline/:sessionId/search - Search timeline by text
    - WebSocket ws://api/timeline/:sessionId - Real-time timeline updates
    - _Requirements: 14.6, 14.7, 14.8_

  - [ ] 28.6 Implement timeline optimizations
    - Create MongoDB compound indexes (interviewSessionId + sequenceNumber)
    - Create full-text search index on searchableText field
    - Create indexes for event type and participant filtering
    - Implement Redis caching for recent timeline queries
    - _Requirements: 14.1_

- [ ] 29. Checkpoint - Verify unified timeline
  - Test event aggregation from all three pipelines
  - Verify chronological ordering and sequence numbers
  - Test filtering by event type, participant, time range
  - Verify full-text search functionality
  - Test event navigation to artifacts
  - Ensure all tests pass, ask the user if questions arise.


### Phase 11: Evidence Engine & Evaluation System

- [ ] 30. Implement Evidence Engine
  - [ ] 30.1 Create evidence reference linking
    - Implement EvidenceReference model with polymorphic types (TRANSCRIPT, CODE, EXECUTION, WHITEBOARD, TIMELINE_EVENT)
    - Link transcript excerpts with timestamps and speaker identification
    - Link code checkpoint snapshots with file paths and line numbers
    - Link execution results with input, output, error messages
    - Link whiteboard snapshots with object highlights and preview images
    - _Requirements: 17.2, 17.3, 17.4, 17.5_

  - [ ] 30.2 Implement evaluation creation with evidence validation
    - Create Evaluation model with overall rating, decision, competency scores
    - Require evidence references for each competency assessment
    - Validate that all evidence references point to existing timeline artifacts
    - Support linking to interviewer notes with timestamps
    - _Requirements: 17.1, 17.6, 17.7_

  - [ ] 30.3 Create evaluation API endpoints
    - POST /api/evaluations/:sessionId - Create evaluation (recruiter only)
    - GET /api/evaluations/:sessionId - Get evaluation details
    - PUT /api/evaluations/:sessionId - Update evaluation
    - POST /api/evaluations/:sessionId/competencies - Add competency score with evidence
    - GET /api/evaluations/:sessionId/evidence/:evidenceId - Get evidence details
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_


- [ ] 31. Checkpoint - Verify evidence engine
  - Test evidence linking to all artifact types
  - Verify evidence validation for broken references
  - Test evaluation creation with competency scores
  - Verify evidence retrieval and display
  - Ensure all tests pass, ask the user if questions arise.

### Phase 12: AI Interviewer - Context-Aware Assistance

- [ ] 32. Set up AI integration infrastructure
  - [ ] 32.1 Configure Gemini API or GPT-4 integration
    - Install Google Generative AI SDK or OpenAI SDK
    - Configure API keys and rate limits from environment
    - Install LangChain for prompt management
    - Install tiktoken for token counting
    - _Requirements: 16.1, 16.2, 16.7_

  - [ ] 32.2 Implement AI worker with BullMQ
    - Create AI analysis job queue with rate limiting
    - Implement AIWorker to process interview analysis requests
    - Configure worker pool (2-5 instances) with concurrency limits
    - _Requirements: 25.4_

  - [ ] 32.3 Implement context aggregation for AI analysis
    - Aggregate resume data from job application
    - Aggregate job description and requirements from job position
    - Aggregate problem statement from interview session
    - Aggregate transcript segments with speaker labels
    - Aggregate code snapshots with execution results
    - Aggregate whiteboard snapshots with descriptions
    - Aggregate timeline events for temporal context
    - _Requirements: 16.1_


- [ ] 33. Implement AI analysis features
  - [ ] 33.1 Generate interview planning suggestions
    - Analyze resume and job description to suggest relevant questions
    - Identify competencies to assess based on role requirements
    - Suggest problem difficulty based on candidate experience
    - _Requirements: 16.2_

  - [ ] 33.2 Provide real-time technical observations
    - Analyze code quality (naming, structure, patterns)
    - Identify algorithm efficiency and complexity
    - Detect design pattern usage and best practices
    - Flag potential bugs or logical errors
    - _Requirements: 16.4, 16.5_

  - [ ] 33.3 Identify competency coverage gaps
    - Track which competencies have been assessed during interview
    - Suggest questions to cover missing competencies
    - Alert recruiter when interview is nearing time limit
    - _Requirements: 16.3_

  - [ ] 33.4 Generate post-interview insights
    - Summarize candidate performance across all stages
    - List technical strengths and weaknesses with evidence
    - Provide recommendations (hire, no-hire, follow-up questions)
    - Reference specific timeline events as evidence
    - Explicitly state that AI does NOT make final hiring decisions
    - _Requirements: 16.4, 16.5, 16.6_

  - [ ] 33.5 Create AI assistant API endpoints
    - POST /api/ai/:sessionId/plan - Generate interview planning suggestions
    - POST /api/ai/:sessionId/analyze - Request real-time code analysis
    - GET /api/ai/:sessionId/gaps - Get competency coverage gaps
    - POST /api/ai/:sessionId/insights - Generate post-interview insights
    - POST /api/ai/:sessionId/query - Ask AI assistant a question about the interview
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.7_


- [ ] 34. Checkpoint - Verify AI integration
  - Test interview planning suggestions with resume and job description
  - Verify real-time code analysis with technical observations
  - Test competency gap identification
  - Verify post-interview insights generation with evidence references
  - Test AI query responses with context awareness
  - Ensure all tests pass, ask the user if questions arise.

### Phase 13: Post-Interview Replay System

- [ ] 35. Implement replay system infrastructure
  - [ ] 35.1 Create replay service for synchronized playback
    - Load video recording from S3 with signed URL
    - Load complete transcript with word-level timestamps
    - Load code checkpoint history with file states
    - Load whiteboard snapshot history with object states
    - Load unified timeline with all events
    - _Requirements: 18.1, 18.2_

  - [ ] 35.2 Implement playback synchronization engine
    - Synchronize video playback time with transcript highlighting
    - Synchronize code state display to current checkpoint at playback time
    - Synchronize whiteboard state to snapshot at playback time
    - Display timeline events with current playback position indicator
    - _Requirements: 18.1, 18.3, 18.4_

  - [ ] 35.3 Implement playback controls
    - Play, pause, seek controls for video
    - Speed adjustment (0.5x, 1x, 1.5x, 2x)
    - Jump to specific timeline event by clicking
    - Display synchronized interviewer notes at playback time
    - _Requirements: 18.2, 18.5, 18.6_


  - [ ] 35.4 Implement pipeline visibility controls
    - Toggle video visibility (show/hide)
    - Toggle transcript visibility (show/hide)
    - Toggle code editor visibility (show/hide)
    - Toggle whiteboard visibility (show/hide)
    - Support picture-in-picture mode for video
    - _Requirements: 18.7_

  - [ ] 35.5 Create replay API endpoints
    - GET /api/replay/:sessionId - Get replay metadata (video URL, duration, timeline)
    - GET /api/replay/:sessionId/state/:timestamp - Get synchronized state at specific time
    - POST /api/replay/:sessionId/notes - Add timestamped interviewer notes
    - GET /api/replay/:sessionId/notes - Get all notes with timestamps
    - _Requirements: 18.1, 18.2, 18.6_

- [ ] 36. Checkpoint - Verify replay system
  - Test synchronized playback of video, transcript, code, whiteboard
  - Verify playback controls and speed adjustment
  - Test timeline event navigation
  - Verify pipeline visibility toggles
  - Ensure all tests pass, ask the user if questions arise.

### Phase 14: Recruiter Dashboard & Candidate Journey

- [ ] 37. Implement recruiter dashboard backend
  - [ ] 37.1 Create candidate journey aggregation
    - Aggregate candidate progression (Resume → ATS_Score → Application → Interview → Evaluation → Decision)
    - Calculate ATS match scores with dimension breakdown
    - Compute interview summary metrics (duration, stages completed, code executions count)
    - Link AI observations to candidate profiles
    - _Requirements: 19.1, 19.2, 19.3_


  - [ ] 37.2 Implement dashboard filtering and search
    - Filter candidates by interview session status (scheduled, in-progress, completed, evaluated)
    - Filter by evaluation decision (STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE, PENDING)
    - Filter by competency scores and ATS match threshold
    - Search candidates by name, email, skills
    - _Requirements: 19.5_

  - [ ] 37.3 Create dashboard API endpoints
    - GET /api/dashboard/candidates - List candidates with journey stages
    - GET /api/dashboard/candidates/:id - Get detailed candidate profile
    - GET /api/dashboard/candidates/:id/interview-summary - Get interview metrics
    - GET /api/dashboard/candidates/:id/evaluation - Get evaluation scorecard
    - GET /api/dashboard/analytics - Get hiring pipeline analytics
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.6_

- [ ] 38. Checkpoint - Verify dashboard functionality
  - Test candidate journey aggregation with all stages
  - Verify ATS score calculation and display
  - Test interview summary metrics computation
  - Verify filtering and search functionality
  - Ensure all tests pass, ask the user if questions arise.

### Phase 15: Preserve ATS Resume Parsing

- [ ] 39. Verify and preserve existing ATS functionality
  - [ ] 39.1 Verify resume upload and parsing
    - Test PDF upload to MinIO/S3 object storage
    - Verify resume parsing with pdf-parse library
    - Test Gemini API structured extraction with fallback to regex
    - Verify extracted profile data storage in MongoDB
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_


  - [ ] 39.2 Verify ATS scoring algorithm
    - Test ATS match score computation against job requirements
    - Verify dimension-based scoring (skills, experience, education)
    - Test scoring algorithm with various resume-job combinations
    - _Requirements: 20.7_

  - [ ] 39.3 Integrate ATS with interview workflow
    - Link resume data to interview session for AI context
    - Display ATS scores in recruiter dashboard
    - Allow interview creation directly from job application
    - _Requirements: 19.2, 19.3_

- [ ] 40. Checkpoint - Verify ATS integration
  - Test resume upload and parsing end-to-end
  - Verify ATS score calculation accuracy
  - Test integration with interview session creation
  - Ensure all tests pass, ask the user if questions arise.

### Phase 16: Configuration Parser & Pretty Printer

- [ ] 41. Implement interview configuration parser
  - [ ] 41.1 Design configuration file schema
    - Define required fields (session_type, duration, allowed_languages, problem_statement)
    - Define optional fields (difficulty, tags, hints, test_cases)
    - Create JSON schema for validation
    - _Requirements: 30.5_

  - [ ] 41.2 Implement configuration parser
    - Parse configuration JSON into Configuration object
    - Validate required fields with descriptive error messages
    - Return line and column information for parse errors
    - Support nested structures (test cases, hints, resources)
    - _Requirements: 30.1, 30.2_


  - [ ] 41.3 Implement pretty printer
    - Format Configuration object back to valid JSON
    - Use consistent indentation (2 spaces) and key ordering
    - Preserve comments if present in original
    - Verify round-trip property (parse → print → parse produces equivalent object)
    - _Requirements: 30.3, 30.4_

  - [ ] 41.4 Create configuration API endpoints
    - POST /api/configurations - Create interview configuration
    - GET /api/configurations/:id - Get configuration
    - PUT /api/configurations/:id - Update configuration
    - POST /api/configurations/validate - Validate configuration without saving
    - _Requirements: 30.1, 30.2_

- [ ] 42. Checkpoint - Verify configuration system
  - Test configuration parsing with valid and invalid inputs
  - Verify error messages with line and column information
  - Test pretty printer formatting
  - Verify round-trip property
  - Ensure all tests pass, ask the user if questions arise.

### Phase 17: Observability with OpenTelemetry

- [ ] 43. Implement distributed tracing
  - [ ] 43.1 Configure OpenTelemetry instrumentation
    - Install @opentelemetry/sdk-node and @opentelemetry/auto-instrumentations-node
    - Configure OTLP exporter to Jaeger, Grafana Tempo, or Honeycomb
    - Enable automatic instrumentation for HTTP, Express, MongoDB, Redis, fetch
    - Configure trace sampling (100% for development, 10% for production)
    - _Requirements: 24.1, 24.5_


  - [ ] 43.2 Add custom spans for critical operations
    - Create spans for database queries with query text and duration
    - Create spans for Redis operations (get, set, publish, subscribe)
    - Create spans for Gemini API calls with token count and latency
    - Create spans for sandbox code execution with language and duration
    - Create spans for LiveKit operations (room creation, token generation)
    - Attach error information and stack traces to failed spans
    - _Requirements: 24.3, 24.4_

  - [ ] 43.3 Implement trace context propagation
    - Propagate trace context across API → Worker boundaries
    - Propagate context to external services (LiveKit, Deepgram, Gemini)
    - Include trace ID in structured logs for correlation
    - Include trace ID in error responses for debugging
    - _Requirements: 24.2_

- [ ] 44. Implement metrics collection
  - [ ] 44.1 Configure Prometheus metrics
    - Install prom-client for Prometheus metrics
    - Expose /metrics endpoint for Prometheus scraping
    - Configure default metrics (Node.js process, event loop, memory)
    - _Requirements: 24.6_

  - [ ] 44.2 Add custom metrics
    - Counter: interview_sessions_total (by status, stage)
    - Gauge: interview_sessions_active
    - Gauge: active_participants_total
    - Histogram: code_execution_duration_seconds (by language)
    - Histogram: ai_inference_duration_seconds
    - Gauge: execution_queue_depth
    - Gauge: transcription_queue_depth
    - _Requirements: 24.6_


- [ ] 45. Set up Grafana dashboards
  - Create dashboard for interview session metrics (active sessions, stages distribution)
  - Create dashboard for system health (API latency, error rate, queue depth)
  - Create dashboard for worker performance (execution time, throughput, failures)
  - Create dashboard for external service latency (LiveKit, Deepgram, Gemini)
  - _Requirements: 24.5, 24.6_

- [ ] 46. Checkpoint - Verify observability
  - Test distributed trace propagation across services
  - Verify custom spans for critical operations
  - Test metrics collection and Prometheus scraping
  - Verify Grafana dashboard visualization
  - Ensure all tests pass, ask the user if questions arise.

### Phase 18: Security Hardening

- [ ] 47. Implement security best practices
  - [ ] 47.1 Add HTTP security headers
    - Configure Helmet.js with CSP, HSTS, X-Frame-Options, X-Content-Type-Options
    - Disable X-Powered-By header
    - Configure CORS with strict origin validation
    - _Requirements: 22.1, 27.1_

  - [ ] 47.2 Implement rate limiting
    - Add rate limiting for authentication endpoints (10 requests/minute)
    - Add rate limiting for API endpoints (100 requests/minute per user)
    - Add rate limiting for WebSocket connections (5 connections per user)
    - Store rate limit state in Redis
    - _Requirements: 22.1_


  - [ ] 47.3 Implement audit logging
    - Log all authentication attempts (success and failure) with IP address
    - Log all authorization failures with user context
    - Log all session access attempts with participant details
    - Log all sensitive operations (session creation, evaluation creation, recording access)
    - Store audit logs with tenant context for compliance
    - _Requirements: 21.6, 27.4_

  - [ ] 47.4 Add input validation and sanitization
    - Validate all API request payloads with Joi or Zod
    - Sanitize user inputs to prevent XSS and injection attacks
    - Validate file uploads (type, size, content)
    - Escape SQL/NoSQL queries to prevent injection
    - _Requirements: 22.1_

- [ ] 48. Checkpoint - Verify security measures
  - Test security headers in HTTP responses
  - Verify rate limiting enforcement
  - Test audit logging for sensitive operations
  - Verify input validation with malicious payloads
  - Ensure all tests pass, ask the user if questions arise.

### Phase 19: Testing Infrastructure

- [ ] 49. Set up testing infrastructure
  - [ ] 49.1 Configure Jest with TypeScript
    - Install Jest 29+ with ts-jest
    - Configure Jest for unit tests with coverage reporting
    - Set coverage thresholds (80% line coverage target)
    - Configure test environment for Node.js
    - _Requirements: 26.1_


  - [ ] 49.2 Configure integration test environment
    - Install Testcontainers for MongoDB and Redis
    - Create test fixtures and factories for domain models
    - Configure test database with sample data
    - Set up test isolation with beforeEach/afterEach cleanup
    - _Requirements: 26.1_

  - [ ] 49.3 Configure E2E test infrastructure
    - Install Playwright for browser automation
    - Configure test browser (Chromium) with video recording
    - Create test helpers for authentication and session setup
    - _Requirements: 26.1_

- [ ]* 50. Write unit tests for core services
  - Write tests for UnifiedTimelineService (event creation, querying, filtering)
  - Write tests for CheckpointService (checkpoint creation, restoration, S3 upload)
  - Write tests for EvidenceEngine (evidence linking, validation)
  - Write tests for YjsCollaborationService (sync, persistence, conflict resolution)
  - Write tests for ExecutionWorker (sandbox execution, timeout, resource limits)
  - Target 80% line coverage for core business logic
  - _Requirements: 26.1_

- [ ]* 51. Write integration tests for API endpoints
  - Test interview session creation and management flow
  - Test authentication and authorization with JWT tokens
  - Test multi-tenant isolation with parallel requests
  - Test WebSocket connections and message broadcasting
  - Test file upload to S3 with signed URLs
  - _Requirements: 26.1_


- [ ]* 52. Write end-to-end tests
  - Test complete interview flow (create session → join → collaborate → code execution → complete)
  - Test collaborative editing with multiple participants
  - Test whiteboard drawing and synchronization
  - Test replay system with video, transcript, code, whiteboard sync
  - Test evaluation creation with evidence linking
  - _Requirements: 26.1_

- [ ] 53. Checkpoint - Verify testing infrastructure
  - Run all unit tests and verify 80% coverage
  - Run integration tests and verify API functionality
  - Run E2E tests and verify complete workflows
  - Ensure all tests pass, ask the user if questions arise.

### Phase 20: Frontend Implementation - React Application

- [ ] 54. Set up React frontend project
  - [ ] 54.1 Initialize React project with TypeScript
    - Create React 18+ project with TypeScript 5.x and Vite bundler
    - Install TanStack Query v5 for server state management
    - Install Zustand for client state management
    - Install Tailwind CSS 3.4+ with custom design system configuration
    - Configure React Router for navigation
    - _Requirements: 26.1_

  - [ ] 54.2 Set up real-time communication libraries
    - Install LiveKit React SDK for WebRTC audio/video
    - Install Monaco React wrapper for code editor
    - Install Fabric.js with React integration
    - Install xterm-for-react for terminal emulator
    - Install Socket.IO client or native WebSocket for collaboration
    - _Requirements: 4.1, 2.1, 11.1, 7.1_


  - [ ] 54.3 Implement authentication flow
    - Create login page with email/password form
    - Implement JWT token storage in localStorage with secure flags
    - Create ProtectedRoute component with authorization checks
    - Implement refresh token rotation on expiration
    - Create role-based navigation (Seeker, Recruiter, Admin)
    - _Requirements: 22.1, 22.2, 22.3_

- [ ] 55. Implement interview session UI
  - [ ] 55.1 Create interview room layout
    - Design responsive grid layout for video, code editor, whiteboard
    - Implement stage indicator with progress visualization
    - Create participant list with online presence indicators
    - Add toolbar with stage transition controls (recruiter only)
    - _Requirements: 1.1, 15.1, 15.4, 15.5_

  - [ ] 55.2 Integrate LiveKit video component
    - Implement video tile grid with participant names
    - Add local video preview with mirror effect
    - Implement audio/video mute controls
    - Add screen sharing controls with source selection
    - Display active speaker indicator with border highlight
    - _Requirements: 2.2, 2.3, 2.5, 2.8_

  - [ ] 55.3 Integrate real-time transcript display
    - Create scrollable transcript panel with auto-scroll
    - Display speaker labels with color coding
    - Highlight current transcript segment during live interview
    - Support search within transcript
    - _Requirements: 3.1, 3.2, 3.3_


- [ ] 56. Implement coding workspace UI
  - [ ] 56.1 Integrate Monaco Editor component
    - Configure Monaco with syntax highlighting for C++, Java, Python, JavaScript, TypeScript
    - Connect editor to Yjs document for real-time collaboration
    - Display participant cursors and selections with unique colors
    - Implement file tabs with active file switching
    - Add language selection dropdown
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 56.2 Create file explorer component
    - Display hierarchical file tree with expand/collapse
    - Implement file operations (create, delete, rename) with context menu
    - Implement directory operations (create, delete, rename)
    - Support drag-and-drop for file organization
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 56.3 Integrate terminal component
    - Embed xterm.js terminal with PTY connection
    - Implement terminal input/output streaming
    - Support terminal resize based on container dimensions
    - Display command history with up/down arrow navigation
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ] 56.4 Create code execution panel
    - Add "Run Code" button with loading state
    - Display execution output with stdout/stderr separation
    - Show execution metadata (language, duration, exit code, resource usage)
    - Display execution history list with timestamps
    - Support re-running previous executions
    - _Requirements: 9.1, 9.2, 9.3, 9.5_


- [ ] 57. Implement whiteboard UI
  - [ ] 57.1 Create Fabric.js canvas component
    - Initialize Fabric.js canvas with infinite pan and zoom
    - Connect canvas to Yjs document for collaboration
    - Display participant cursors with unique colors
    - _Requirements: 11.1, 12.4, 12.5_

  - [ ] 57.2 Create drawing toolbar
    - Add tool selection buttons (pencil, line, arrow, rectangle, circle, ellipse, text, sticky-note)
    - Add color picker for stroke and fill
    - Add stroke width slider
    - Add undo/redo buttons
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 12.6_

  - [ ] 57.3 Implement object manipulation
    - Enable object selection with bounding box
    - Implement move, resize, rotate handles
    - Add delete button for selected objects
    - Support multi-select with Shift+Click
    - Implement grouping/ungrouping controls
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 58. Implement unified timeline UI
  - [ ] 58.1 Create timeline panel
    - Display chronological event list with icons and descriptions
    - Color-code events by pipeline (blue=communication, green=coding, purple=whiteboard)
    - Show timestamps with relative time (2 minutes ago)
    - Implement auto-scroll to latest event during live interview
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_


  - [ ] 58.2 Implement timeline navigation
    - Click event to navigate to artifact (transcript, code checkpoint, whiteboard snapshot)
    - Filter events by type (communication, coding, whiteboard, session)
    - Filter events by participant
    - Search events by text (transcript content, file names, commands)
    - _Requirements: 14.6, 14.7, 14.8_

- [ ] 59. Implement AI assistant UI
  - [ ] 59.1 Create AI insights panel
    - Display interview planning suggestions before session
    - Show real-time technical observations during coding
    - Display competency gap alerts
    - Show post-interview insights summary
    - _Requirements: 16.2, 16.3, 16.4_

  - [ ] 59.2 Create AI chat interface
    - Add chat input for recruiter to query AI about interview
    - Display AI responses with evidence references
    - Link evidence to timeline events (clickable)
    - Show loading state with typing indicator
    - _Requirements: 16.5, 16.7_

- [ ] 60. Implement replay UI
  - [ ] 60.1 Create replay viewer page
    - Display video player with synchronized controls
    - Show transcript with highlighting at current playback time
    - Display code editor with state from checkpoint at playback time
    - Display whiteboard with state from snapshot at playback time
    - Show timeline with playback position indicator
    - _Requirements: 18.1, 18.2, 18.3, 18.4_


  - [ ] 60.2 Implement playback controls
    - Add play/pause button with keyboard shortcut (spacebar)
    - Add seek bar with thumbnail preview on hover
    - Add speed controls (0.5x, 1x, 1.5x, 2x)
    - Add jump to event buttons in timeline
    - Add pipeline visibility toggles (video, transcript, code, whiteboard)
    - _Requirements: 18.2, 18.5, 18.6, 18.7_

- [ ] 61. Implement evaluation UI
  - [ ] 61.1 Create evaluation form
    - Add overall rating slider (1-5 stars)
    - Add decision dropdown (STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE, PENDING)
    - Add competency assessment grid with rating and notes
    - Add evidence attachment interface (drag timeline events to link)
    - Add strengths and weaknesses text areas
    - Display AI-generated insights as suggestions
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 16.4_

  - [ ] 61.2 Create evidence viewer
    - Display transcript excerpts with timestamps
    - Display code snapshots with syntax highlighting
    - Display execution results with input/output
    - Display whiteboard snapshots with preview images
    - Support navigation to replay at evidence timestamp
    - _Requirements: 17.2, 17.3, 17.4, 17.5_

- [ ] 62. Implement recruiter dashboard UI
  - [ ] 62.1 Create candidate list view
    - Display candidate cards with photo, name, ATS score
    - Show candidate journey stages with progress indicator
    - Display interview status badges (scheduled, in-progress, completed, evaluated)
    - Implement filtering by status, decision, ATS score threshold
    - Add search bar for candidate name, email, skills
    - _Requirements: 19.1, 19.2, 19.5_


  - [ ] 62.2 Create candidate detail view
    - Display resume data with structured sections (skills, experience, education)
    - Show interview summary metrics (duration, stages, executions)
    - Display evaluation scorecard with competency scores
    - Show AI observations and recommendations
    - Add button to access replay viewer
    - _Requirements: 19.3, 19.4, 19.6_

- [ ] 63. Checkpoint - Verify frontend implementation
  - Test all UI components with real backend integration
  - Verify real-time collaboration across multiple browser tabs
  - Test responsive design on mobile, tablet, desktop
  - Verify accessibility with keyboard navigation and screen readers
  - Ensure all tests pass, ask the user if questions arise.

### Phase 21: Deployment & DevOps

- [ ] 64. Set up containerization
  - [ ] 64.1 Create Docker images
    - Create Dockerfile for API server with multi-stage build
    - Create Dockerfile for worker processes (execution, transcription, AI)
    - Create Dockerfile for frontend with Nginx serving static assets
    - Optimize images for size (alpine base images, layer caching)
    - _Requirements: 26.1_

  - [ ] 64.2 Create Docker Compose for local development
    - Define services (API, workers, MongoDB, Redis, MinIO)
    - Configure networking and volume mounts
    - Set environment variables with .env file
    - Add health checks for all services
    - _Requirements: 26.1_


- [ ] 65. Set up Kubernetes deployment
  - [ ] 65.1 Create Kubernetes manifests
    - Create Deployment for API server with replicas (3+) and resource limits
    - Create Deployment for worker pools (execution, transcription, AI, recording)
    - Create Deployment for frontend with Nginx ingress
    - Create StatefulSets for MongoDB and Redis (or use managed services)
    - Create Services for internal communication and load balancing
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_

  - [ ] 65.2 Configure Kubernetes resources
    - Create ConfigMaps for environment configuration
    - Create Secrets for API keys and credentials
    - Configure HorizontalPodAutoscalers for API and workers
    - Set resource requests and limits (CPU, memory)
    - Configure persistent volumes for MongoDB and Redis data
    - _Requirements: 25.1_

  - [ ] 65.3 Configure Ingress and networking
    - Create Ingress resource with HTTPS termination (cert-manager)
    - Configure sticky sessions for WebSocket connections
    - Set up Network Policies for security
    - Configure external LoadBalancer or NodePort
    - _Requirements: 26.1_

- [ ] 66. Set up CI/CD pipeline
  - [ ] 66.1 Create GitHub Actions workflow
    - Run linting and TypeScript type checking on PR
    - Run unit tests with coverage reporting
    - Run integration tests with Testcontainers
    - Build Docker images and push to registry
    - _Requirements: 26.1_


  - [ ] 66.2 Create deployment workflow
    - Deploy to staging environment on merge to develop branch
    - Deploy to production on merge to main branch with manual approval
    - Run smoke tests after deployment
    - Send deployment notifications to Slack/Discord
    - _Requirements: 26.1_

- [ ] 67. Set up monitoring and alerting
  - [ ] 67.1 Configure Prometheus and Grafana
    - Deploy Prometheus server to scrape metrics
    - Deploy Grafana with pre-built dashboards
    - Set up data source connections (Prometheus, Jaeger)
    - _Requirements: 24.5, 24.6_

  - [ ] 67.2 Configure alerting rules
    - Alert on high error rate (> 5%)
    - Alert on high API latency (p95 > 1s)
    - Alert on queue depth buildup (> 100 jobs)
    - Alert on execution worker failures (> 10% failure rate)
    - Alert on low disk space, high memory usage
    - Send alerts to PagerDuty, Slack, or email
    - _Requirements: 24.1, 24.6_

- [ ] 68. Final checkpoint - Production readiness
  - Verify all services deploy successfully to Kubernetes
  - Test end-to-end interview flow in staging environment
  - Load test with k6 to validate 1000+ concurrent sessions
  - Verify monitoring dashboards and alerts
  - Review security checklist (HTTPS, rate limiting, input validation, audit logs)
  - Conduct performance profiling and optimization
  - Ensure all tests pass, ask the user if questions arise.


## Notes

### Implementation Strategy

- **Language**: TypeScript with Node.js 20 LTS for backend, React 18+ with TypeScript for frontend
- **Architecture**: Modular monolith with independent worker scaling via BullMQ job queues
- **Real-time Collaboration**: Yjs CRDT for conflict-free editing (code + whiteboard)
- **Communication**: LiveKit SFU for WebRTC (audio/video), Deepgram for transcription
- **Execution Sandbox**: Docker with gVisor runtime for syscall-level isolation
- **Data Storage**: MongoDB (primary), Redis (queues/cache/pubsub), S3/MinIO (artifacts)
- **Observability**: OpenTelemetry distributed tracing, Prometheus metrics, Grafana dashboards

### Task Marking Convention

- Tasks marked with `*` are **optional** and can be skipped for faster MVP delivery
- Optional tasks include: unit tests (50), integration tests (51), E2E tests (52)
- All core implementation tasks (1-49, 53-68) are **required** for production readiness

### Phased Rollout

1. **Phase 1-2 (P0)**: Foundation + Session Management → Basic interview sessions
2. **Phase 3-9 (P0)**: Three Pipelines (Communication, Coding, Whiteboard) → Core interview functionality
3. **Phase 10-11 (P1)**: Timeline + Evidence Engine → Evaluation support
4. **Phase 12 (P2)**: AI Integration → Enhanced insights
5. **Phase 13-14 (P1)**: Replay + Dashboard → Post-interview review
6. **Phase 15-16 (P1)**: ATS Preservation + Config Parser → Complete feature set
7. **Phase 17-18 (P1)**: Observability + Security → Production hardening
8. **Phase 19-20 (P1)**: Testing + Frontend → End-to-end validation
9. **Phase 21 (P0)**: Deployment → Production launch


### Multi-Tenant Security

- All database queries MUST include tenant filtering
- Access tokens MUST include tenant ID in JWT claims
- S3 object keys MUST be prefixed with tenant ID
- Worker jobs MUST validate tenant context before processing

### Performance Targets

- Real-time collaboration latency: < 100ms (code + whiteboard)
- Code execution: < 30s with timeout enforcement
- API response time: p95 < 500ms, p99 < 1s
- WebSocket message propagation: < 50ms
- Transcription lag: < 2s behind audio stream

### Scalability Targets

- Support 1000+ concurrent interview sessions
- Handle 5000+ active WebSocket connections
- Process 100+ code executions per minute
- Store 10TB+ of interview artifacts (recordings, transcripts, snapshots)

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1", "2", "3"]
    },
    {
      "id": 1,
      "tasks": ["5.1", "5.2", "5.3", "5.4"]
    },
    {
      "id": 2,
      "tasks": ["7.1", "7.2", "7.3", "12.1", "12.2", "12.3"]
    },
    {
      "id": 3,
      "tasks": ["8.1", "8.2", "8.3", "9.1", "9.2", "10", "13.1", "13.2", "13.3", "14", "24.1", "24.2", "24.3"]
    },
    {
      "id": 4,
      "tasks": ["16.1", "16.2", "16.3", "16.4", "18.1", "18.2", "18.3", "20.1", "20.2", "20.3", "25.1", "25.2", "25.3"]
    },
    {
      "id": 5,
      "tasks": ["20.4", "20.5", "20.6", "22.1", "22.2", "22.3", "22.4", "26.1", "26.2", "26.3"]
    },
    {
      "id": 6,
      "tasks": ["28.1", "28.2", "28.3", "28.4", "28.5", "28.6"]
    },
    {
      "id": 7,
      "tasks": ["30.1", "30.2", "30.3", "32.1", "32.2", "32.3"]
    },
    {
      "id": 8,
      "tasks": ["33.1", "33.2", "33.3", "33.4", "33.5", "35.1", "35.2", "35.3", "35.4", "35.5"]
    },
    {
      "id": 9,
      "tasks": ["37.1", "37.2", "37.3", "39.1", "39.2", "39.3", "41.1", "41.2", "41.3", "41.4"]
    },
    {
      "id": 10,
      "tasks": ["43.1", "43.2", "43.3", "44.1", "44.2", "45", "47.1", "47.2", "47.3", "47.4"]
    },
    {
      "id": 11,
      "tasks": ["49.1", "49.2", "49.3", "50", "51", "52"]
    },
    {
      "id": 12,
      "tasks": ["54.1", "54.2", "54.3", "55.1", "55.2", "55.3"]
    },
    {
      "id": 13,
      "tasks": ["56.1", "56.2", "56.3", "56.4", "57.1", "57.2", "57.3", "58.1", "58.2"]
    },
    {
      "id": 14,
      "tasks": ["59.1", "59.2", "60.1", "60.2", "61.1", "61.2", "62.1", "62.2"]
    },
    {
      "id": 15,
      "tasks": ["64.1", "64.2"]
    },
    {
      "id": 16,
      "tasks": ["65.1", "65.2", "65.3", "66.1", "66.2"]
    },
    {
      "id": 17,
      "tasks": ["67.1", "67.2"]
    }
  ]
}
```
