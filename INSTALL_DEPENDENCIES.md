# Install Dependencies

The server needs additional packages for the security scanning system. Please run this command:

## Quick Install

```bash
cd server
npm install
```

This will install:
- `@google/generative-ai` - For Gemini AI payload generation
- `axios` - For HTTP requests to ZAP API

## If you get permission errors:

Try one of these:

1. **Use sudo (not recommended but works):**
   ```bash
   cd server
   sudo npm install
   ```

2. **Fix npm permissions:**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   cd server
   npm install
   ```

3. **Use nvm to manage Node.js (recommended):**
   ```bash
   # Install nvm if not already installed
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Use nvm to install/use Node.js
   nvm install node
   nvm use node
   
   # Then install dependencies
   cd server
   npm install
   ```

## Verify Installation

After installing, verify the packages are installed:

```bash
cd server
npm list axios @google/generative-ai
```

You should see both packages listed.

## Restart Server

After installing dependencies, restart your server:

```bash
cd server
npm start
```

The error about missing 'axios' should be resolved.
