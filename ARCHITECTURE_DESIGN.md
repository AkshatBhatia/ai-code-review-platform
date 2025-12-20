# AI-Native Code Review Platform - Technical Architecture

## MVP Architecture Decision: Hybrid Approach

For the 8-week MVP, we'll use a **hybrid monolithic-microservice approach**:
- Single application with modular service layers
- Independent AI service for scalability  
- Shared database with clear domain boundaries
- Easy transition to microservices post-MVP

## System Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │────│  Load Balancer   │────│  API Gateway    │
│   (Next.js)     │    │   (Nginx/ALB)    │    │  (Express.js)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       │                                 │                                 │
              ┌────────▼────────┐              ┌────────▼────────┐              ┌────────▼────────┐
              │ Scenario Service │              │ Session Service │              │   AI Service    │
              │  (Embedded)     │              │  (Embedded)     │              │  (Standalone)   │
              └─────────────────┘              └─────────────────┘              └─────────────────┘
                       │                                 │                                 │
                       └─────────────────────────────────┼─────────────────────────────────┘
                                                        │
                                              ┌────────▼────────┐
                                              │   PostgreSQL    │
                                              │   (Primary DB)  │
                                              └─────────────────┘
                                                        │
                                              ┌────────▼────────┐
                                              │     Redis       │
                                              │ (Cache/Session) │
                                              └─────────────────┘
```

## Service Layer Design

### 1. Web Application (Next.js + Express)
**Responsibilities:**
- Server-side rendering of interview interfaces
- Static asset serving (CSS, JS, images)
- Authentication middleware
- API route handling

**Components:**
- `pages/` - Interview flows, scenario management, evaluation
- `components/` - Reusable UI components (diff viewer, comment system)
- `api/` - Backend API routes
- `lib/` - Shared utilities, auth helpers

### 2. Scenario Service (Embedded)
**Responsibilities:**
- Scenario CRUD operations
- Expected findings management
- Code snapshot processing
- Access control validation

**Key Modules:**
- `ScenarioRepository` - Database operations
- `DiffProcessor` - Parse and normalize git diffs
- `FindingValidator` - Validate expected findings structure
- `AccessController` - Role-based permissions

### 3. Session Service (Embedded)  
**Responsibilities:**
- Interview session orchestration
- Real-time state management
- Comment storage and retrieval
- Audit trail generation

**Key Modules:**
- `SessionManager` - Lifecycle management
- `CommentRepository` - Comment CRUD
- `AuditLogger` - Interaction tracking
- `StateSync` - Real-time updates via WebSocket

### 4. AI Service (Standalone)
**Responsibilities:**
- Multi-provider LLM integration
- Prompt template management
- Context optimization and chunking
- Usage tracking and rate limiting

**Key Modules:**
- `ProviderAdapter` - Abstract interface for LLM providers
- `PromptEngine` - Template rendering and optimization
- `ContextManager` - Code analysis and relevance scoring
- `UsageTracker` - Cost monitoring and limits

## Data Architecture

### Primary Database: PostgreSQL
**Core Tables:**
- `scenarios` - Scenario metadata and configuration
- `expected_findings` - Structured issue definitions
- `interview_sessions` - Session state and metadata
- `review_comments` - Candidate comments and annotations
- `ai_interactions` - Complete AI conversation logs
- `score_cards` - Evaluation results and rubric scores
- `users` - Authentication and role management

### Cache Layer: Redis
**Usage Patterns:**
- Session state (active interviews)
- Frequently accessed scenarios
- AI response caching (duplicate queries)
- Rate limiting counters

### File Storage: Local/S3
**Content Types:**
- Code snapshots (git repositories)
- Large diff files
- Uploaded scenarios
- Export/import data

## API Design Patterns

### RESTful API Structure
```
/api/v1/
├── auth/           # Authentication endpoints
├── scenarios/      # Scenario CRUD
├── sessions/       # Interview sessions  
├── comments/       # Review comments
├── ai/            # AI assistant interactions
└── evaluations/   # Scoring and results
```

### GraphQL Alternative (Future)
Single endpoint with typed schema for complex queries combining scenarios, sessions, and comments.

### WebSocket Events
```javascript
// Real-time events
{
  type: 'comment_added' | 'ai_response' | 'session_updated',
  sessionId: string,
  data: object,
  timestamp: string
}
```

## Security Architecture

### Authentication Flow
1. **OAuth 2.0 / OIDC** integration (Google, GitHub, Microsoft)
2. **JWT tokens** for session management
3. **Refresh token** rotation for security
4. **Role-based** permissions (Author, Interviewer, Candidate)

### Authorization Model
```typescript
interface Permission {
  resource: 'scenario' | 'session' | 'evaluation';
  action: 'read' | 'write' | 'delete' | 'score';
  scope: 'own' | 'team' | 'all';
}
```

### Data Protection
- **TLS 1.3** for all API communication
- **AES-256** encryption for sensitive data at rest
- **Input sanitization** for all user content
- **SQL injection** protection via parameterized queries

## AI Integration Architecture

### Provider Abstraction Layer
```typescript
interface AIProvider {
  generateResponse(prompt: string, context: CodeContext): Promise<AIResponse>;
  validateCredentials(): Promise<boolean>;
  getCostEstimate(prompt: string): number;
}

// Implementations: OpenAIProvider, AnthropicProvider, LocalProvider
```

### Prompt Management System
- **Version-controlled** prompt templates
- **A/B testing** capabilities for prompt optimization  
- **Context injection** with code snippets and metadata
- **Response parsing** and validation

### Context Optimization Strategy
1. **Relevance Scoring** - Identify most important code sections
2. **Chunking Strategy** - Break large files into analyzable pieces
3. **Dependency Analysis** - Include related files/functions
4. **Token Management** - Stay within model context limits

## Performance & Scalability

### Caching Strategy
- **Browser Caching** for static assets (1 day)
- **CDN Caching** for code syntax highlighting assets
- **API Response Caching** for scenario metadata (5 minutes)
- **Database Query Caching** for expensive operations

### Database Optimization
- **Indexing Strategy** on foreign keys, timestamps, search fields
- **Connection Pooling** to handle concurrent sessions
- **Read Replicas** for reporting and analytics
- **Partitioning** for large audit tables

### Horizontal Scaling Plan
1. **Load Balancing** across multiple app instances
2. **Database Sharding** by organization or scenario
3. **AI Service Scaling** with queue-based processing
4. **CDN Distribution** for global performance

## Monitoring & Observability

### Application Metrics
- **Response Times** - API endpoint performance
- **Error Rates** - 4xx/5xx response tracking
- **User Activity** - Session duration, completion rates
- **AI Usage** - Query volume, cost tracking

### Infrastructure Monitoring  
- **Resource Utilization** - CPU, memory, disk usage
- **Database Performance** - Query times, connection counts
- **Cache Hit Rates** - Redis performance metrics
- **Network Latency** - Inter-service communication

### Alerting Strategy
- **Critical Alerts** - Service downtime, database failures
- **Warning Alerts** - High error rates, resource exhaustion
- **Usage Alerts** - Cost thresholds, unusual activity patterns

## Development & Testing Strategy

### Code Organization
```
src/
├── components/     # Reusable UI components
├── pages/         # Next.js page components  
├── api/           # API route handlers
├── services/      # Business logic services
├── models/        # Database models and types
├── utils/         # Shared utility functions
└── tests/         # Test files organized by type
```

### Testing Pyramid
- **Unit Tests** (70%) - Services, utilities, pure functions
- **Integration Tests** (20%) - API endpoints, database operations
- **E2E Tests** (10%) - Critical user flows, complete scenarios

### CI/CD Pipeline
1. **Code Quality** - ESLint, Prettier, TypeScript compilation
2. **Testing** - Unit tests, integration tests, security scans
3. **Build** - Next.js optimization, Docker image creation
4. **Deploy** - Staging environment, production deployment
5. **Monitor** - Health checks, performance regression testing

This architecture provides a solid foundation for the 8-week MVP while maintaining clear upgrade paths for future scalability needs.