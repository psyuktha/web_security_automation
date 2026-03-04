# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f59d4c70-f8da-410a-b175-4c6b0aba0917

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f59d4c70-f8da-410a-b175-4c6b0aba0917) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables (REQUIRED)
# Create a .env file in the root directory with your Supabase credentials
# See SUPABASE_SETUP.md for detailed instructions, or run:
./setup-env.sh

# Then edit .env and add your Supabase URL and API key

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## ⚠️ Important: Supabase Setup Required

This project requires Supabase for authentication. **You must configure Supabase before running the app.**

1. **Quick Setup**: Run `./setup-env.sh` to create the `.env` file template
2. **Get Supabase Credentials**: 
   - Go to https://supabase.com and create a project (or use existing)
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key
3. **Configure**: Edit `.env` and replace the placeholder values
4. **Detailed Guide**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete instructions

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f59d4c70-f8da-410a-b175-4c6b0aba0917) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
