# Database Setup Guide

This guide will help you set up the Supabase database schema for the Polling App.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase project URL and API keys

## Environment Variables

Make sure you have the following environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Schema Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project dashboard**
2. **Navigate to the SQL Editor**
3. **Copy and paste the entire contents of `supabase-schema.sql`**
4. **Click "Run" to execute the schema**

### Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your_project_ref
   ```

4. **Apply the schema**:
   ```bash
   supabase db push
   ```

## Schema Overview

The database includes the following tables:

### 1. `profiles` Table
- Extends Supabase's built-in `auth.users` table
- Stores user profile information (username, first_name, last_name, avatar, role)
- Automatically created when a user registers

### 2. `polls` Table
- Stores poll information (title, description, creator, settings)
- Supports categories, tags, expiration dates
- Tracks total votes and views
- Includes settings for multiple votes and authentication requirements

### 3. `poll_options` Table
- Stores individual poll options
- Each option belongs to a poll
- Tracks vote count per option

### 4. `votes` Table
- Records individual votes
- Supports both authenticated and anonymous voting
- Prevents duplicate votes through unique constraints
- Tracks IP address and user agent for anonymous votes

### 5. `poll_views` Table
- Tracks poll view analytics
- Records who viewed each poll and when
- Used for analytics and engagement metrics

## Key Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies ensure users can only access appropriate data
- Public polls are viewable by everyone
- Users can only modify their own polls

### Automatic Triggers
- Vote counts are automatically updated when votes are added/removed
- Poll total votes are automatically calculated
- View counts are automatically incremented

### Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate votes
- Cascade deletes ensure data consistency

## Verification

After setting up the schema, you can verify it's working by:

1. **Checking tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'polls', 'poll_options', 'votes', 'poll_views');
   ```

2. **Checking RLS policies**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Testing user registration**:
   - Register a new user through your app
   - Check that a profile is automatically created in the `profiles` table

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**:
   - Ensure you're using the correct API keys
   - Check that RLS policies are properly configured

2. **"Table doesn't exist" errors**:
   - Verify the schema was applied successfully
   - Check for any SQL errors during execution

3. **"Foreign key constraint" errors**:
   - Ensure all tables were created in the correct order
   - Check that referenced tables exist

### Getting Help

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify your environment variables are correct
3. Ensure you have the necessary permissions in your Supabase project

## Next Steps

After setting up the database:

1. Update your application code to use the new database types
2. Test the authentication flow
3. Create some test polls to verify the schema works correctly
4. Implement the voting functionality

## TypeScript Integration

The database types are automatically generated and available in `types/database.ts`. You can use these types throughout your application for type safety:

```typescript
import type { Poll, PollOption, Vote } from '@/types/database'

// Use the types in your components and functions
const poll: Poll = {
  // ... poll data
}
```
