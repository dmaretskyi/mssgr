# MSSGER - Decentralized Messenger

A decentralized messenger application built with TypeScript, React, and Automerge for peer-to-peer synchronization.

## Tech Stack

- **Frontend**: React + TypeScript
- **State Management**: Automerge
- **Package Manager**: pnpm
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Testing**: Vitest + React Testing Library

## Data Structure

The application uses Automerge documents (AM docs) to manage different aspects of the data:

```mermaid
graph TD
    subgraph "User Profile"
        P[Profile Doc]
        P --> |stores| PN[Profile Name]
        P --> |stores| PA[Avatar URL]
        P --> |stores| PC[Channel List]
    end

    subgraph "Channel"
        C[Channel Doc]
        C --> |stores| CN[Channel Name]
        C --> |stores| CR[Root Page URL]
    end

    subgraph "Page Structure"
        R[Root Page]
        R --> |contains| SP1[Subpage 1]
        R --> |contains| SP2[Subpage 2]
        SP1 --> |contains| M1[Message 1]
        SP1 --> |contains| M2[Message 2]
        SP2 --> |contains| M3[Message 3]
    end

    subgraph "Message"
        M[Message Doc]
        M --> |stores| MS[Sender ID]
        M --> |stores| MN[Sender Name]
        M --> |stores| MC[Content]
        M --> |stores| MT[Timestamp]
        M --> |stores| MID[Channel ID]
    end
```

## Project Architecture

### Core Components

1. **Data Layer**

   - Automerge document management
   - CRDT synchronization
   - Local storage integration
   - Peer-to-peer networking

2. **Domain Layer**

   - Data models and types
   - Business logic
   - State management
   - Event handling

3. **UI Layer**
   - React components
   - User interactions
   - Routing
   - Styling

## File Structure

```
src/
├── data/                 # Data layer
│   ├── automerge/       # Automerge document management
│   ├── storage/         # Local storage handling
│   └── sync/           # Synchronization logic
│
├── domain/              # Domain layer
│   ├── models/         # Data models and types
│   ├── services/       # Business logic
│   └── events/         # Event handling
│
├── ui/                  # UI layer
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   └── styles/        # Styling
│
├── utils/              # Utility functions
├── config/             # Configuration files
└── types/              # TypeScript type definitions
```

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development server:

   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Run linter
- `pnpm type-check` - Run type checking

## License

MIT
