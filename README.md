# WhatsApp Dashboard

A modern, responsive React dashboard for managing WhatsApp sessions and sending messages. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- 🖥️ **Modern UI**: Clean, responsive design with Tailwind CSS
- 📱 **QR Code Display**: View and refresh QR codes for device pairing
- 📊 **Session Management**: Monitor connection status and session details
- 💬 **Message Sending**: Send text messages and media files
- 🔄 **Real-time Updates**: Live session status monitoring
- 📋 **Session Overview**: Dashboard with statistics and quick actions
- 🎯 **TypeScript**: Full type safety throughout the application

## Pages

### `/` - Dashboard

- Overview of all sessions with statistics
- Quick action cards for common tasks
- Session list with status indicators

### `/setup` - Session Setup

- Create new WhatsApp sessions
- Display QR codes for device pairing
- Real-time status monitoring during setup
- Auto-redirect when connection is established

### `/status` - Session Status

- View all sessions with detailed information
- Individual session management (logout, destroy, reconnect)
- Session details and device information
- Real-time status updates

### `/send` - Send Messages

- Send text messages and media files
- Session selection interface
- Message history and activity log
- File upload with validation

## Components

### `QrCodeViewer`

- Displays WhatsApp QR codes for device pairing
- Auto-generates QR code images
- Refresh functionality
- Setup instructions

### `ConnectionStatus`

- Shows current session status with color-coded indicators
- Displays session information and client details
- Loading states and error handling

### `MessageForm`

- Tabbed interface for text and media messages
- File upload with type and size validation
- Form validation and error handling
- Success feedback with message IDs

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API URL
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API Integration

The dashboard communicates with the WhatsApp API backend through the `/lib/api.ts` integration layer:

- **Session Management**: Create, list, get status, logout, destroy
- **Messaging**: Send text and media messages
- **Health Checks**: Monitor API availability
- **Error Handling**: Centralized error management

## Development

### Project Structure

```
src/
├── app/                 # Next.js 15 App Router
│   ├── layout.tsx      # Root layout with navigation
│   ├── page.tsx        # Dashboard homepage
│   ├── setup/          # Session setup page
│   ├── status/         # Session status page
│   └── send/           # Send messages page
├── components/         # Reusable React components
│   ├── QrCodeViewer.tsx
│   ├── ConnectionStatus.tsx
│   └── MessageForm.tsx
└── lib/               # Utility libraries
    └── api.ts         # API integration layer
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Dependencies

### Core

- **Next.js 15**: React framework with App Router
- **React 18**: Modern React with hooks
- **TypeScript**: Type safety and developer experience

### UI & Styling

- **Tailwind CSS**: Utility-first CSS framework
- **QRCode**: QR code generation for React

### API & Data

- **Axios**: HTTP client for API communication
- **SWR**: Data fetching and caching (if needed)

## Usage Examples

### Creating a Session

1. Navigate to `/setup`
2. Enter optional session ID
3. Click "Create Session"
4. Scan QR code with WhatsApp
5. Wait for connection confirmation

### Sending Messages

1. Navigate to `/send`
2. Select a ready session
3. Choose text or media tab
4. Fill in recipient and message
5. Click send and monitor activity

### Managing Sessions

1. Navigate to `/status`
2. Select a session from the list
3. View detailed information
4. Use action buttons (refresh, logout, destroy)

## API Endpoints Used

- `GET /sessions` - List all sessions
- `POST /sessions` - Create new session
- `GET /sessions/:id` - Get session status
- `POST /sessions/:id/logout` - Logout session
- `DELETE /sessions/:id` - Destroy session
- `POST /sessions/:id/send-text` - Send text message
- `POST /sessions/:id/send-media` - Send media message

## Production Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Start production server:**

   ```bash
   npm start
   ```

3. **Using Vercel (recommended):**
   ```bash
   npx vercel
   ```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
