# Snowy.ai Discord Bot

A Discord bot with authentication system using Neon Database.

## Features

- User registration and login
- Email verification
- Secure password hashing
- Discord bot integration
- RESTful API endpoints

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (Neon Database)
- Discord Bot Token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/snowy.ai.git
cd snowy.ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
BOT_TOKEN=your_discord_bot_token
DATABASE_URL=your_neon_database_url
```

## Usage

1. Start the server:
```bash
node bot.js
```

2. The bot will be available on Discord and the API will be accessible at `http://localhost:3000`

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login with existing credentials
- `GET /api/bot-invite` - Get bot invite URL
- `GET /status` - Check server status

## Testing

1. Open `http://localhost:3000/test.html` in your browser
2. Use the provided forms to test registration and login

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 