# ALX Polly - Next.js Polling Application

ALX Polly is a modern, real-time polling application built with Next.js and Supabase. Create polls, gather votes, and analyze results in real-time with a beautiful, responsive interface.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Database & Backend**: Supabase (PostgreSQL)
  - Authentication
  - Real-time subscriptions
  - Row Level Security
- **Language**: TypeScript
- **Styling**: 
  - Tailwind CSS
  - shadcn/ui components
- **Form Management**: 
  - React Hook Form
  - Zod validation

## Features

- User authentication (signup, login, logout)
- Create and manage polls
- Real-time vote tracking
- Responsive design
- Form validation
- User dashboard
- Poll expiration
- Vote result visualization

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account

## Setup Instructions

1. **Clone the Repository**

```bash
git clone <repository-url>
cd alx-polly
```

2. **Install Dependencies**

```bash
npm install
# or
yarn install
```

3. **Supabase Setup**

a. Create a new Supabase project at https://supabase.com

b. Enable Realtime Database Features:
   - Go to Database → Replication
   - Enable the "Realtime" option
   - Add the following tables to the Publication list:
     - polls
     - votes
     - profiles
   - Click "Save" to apply changes

c. Set up the database schema by running the following SQL in the Supabase SQL editor:

```sql
-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Polls are viewable by everyone" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote once per poll" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM votes
      WHERE poll_id = NEW.poll_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);
```

4. **Environment Variables**

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your Supabase project's URL and anon key from the project settings.

## Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Usage Examples

### Creating a Poll

1. Log in to your account
2. Navigate to the dashboard
3. Click "Create New Poll"
4. Fill in:
   - Poll question
   - Multiple choice options
   - Optional expiration date
5. Submit the form

### Voting on a Poll

1. Access the poll via its unique URL
2. Select your preferred option
3. Submit your vote
4. View real-time results

### Viewing Results

1. Navigate to the poll page
2. Results are displayed in real-time
3. See vote distribution and total votes
4. Results update automatically as new votes come in

## Testing

Run the test suite:

```bash
npm test
# or
yarn test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

/app
├── auth/                  # Authentication related components & logic
├── api/                   # Next.js API routes (App Router)
│   ├── auth/[...nextauth]/route.ts
│   ├── polls/route.ts     # POST (create), GET (list)
│   └── polls/[id]/route.ts # GET (single), DELETE
├── polls/                 # Polling-specific components & pages
│   ├── components/        # Reusable poll components (e.g., PollCard, VoteForm)
│   ├── [id]/page.tsx     # Dynamic route for single poll view & voting
│   └── new/page.tsx      # Page for creating a new poll
/components
├── ui/                    # Shadcn/ui components (using `npx shadcn-ui@latest add`)
├── forms/                 # Custom form components built with react-hook-form
└── providers/             # React context providers (e.g., ThemeProvider)
/lib                       # Utility functions, database config, validations
/types                     # TypeScript type definitions