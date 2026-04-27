import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Development-only seeding endpoint: POST /api/dev/seed
 * Creates test users and workspace for manual testing.
 * Only works in development, disabled in production.
 */

const TEST_WORKSPACE_ID = 'dev-workspace-001';
const TEST_USERS = [
  {
    email: 'alice@test.local',
    password: 'TestPassword123!',
    displayName: 'Alice Johnson',
  },
  {
    email: 'bob@test.local',
    password: 'TestPassword123!',
    displayName: 'Bob Smith',
  },
  {
    email: 'charlie@test.local',
    password: 'TestPassword123!',
    displayName: 'Charlie Davis',
  },
];

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seeding disabled in production' }, { status: 403 });
  }

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: 'Missing environment variables',
        missing: {
          url: !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : undefined,
          key: !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : undefined,
        },
        hint: 'Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file',
      },
      { status: 500 }
    );
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🌱 Starting database seed for testing...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key present:', !!serviceRoleKey);

    const createdUsers: Array<{
      id: string;
      email: string;
      displayName: string;
    }> = [];

    // Create test auth users
    for (const testUser of TEST_USERS) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUsers?.users.some((u) => u.email === testUser.email);

        if (userExists) {
          console.log(`✓ User ${testUser.email} already exists, skipping`);
          // Get the user ID for workspace assignment
          const { data } = await supabaseAdmin.auth.admin.getUserById(
            existingUsers!.users.find((u) => u.email === testUser.email)!.id
          );
          if (data.user) {
            createdUsers.push({
              id: data.user.id,
              email: testUser.email,
              displayName: testUser.displayName,
            });
          }
          continue;
        }

        // Create new user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true, // Skip email verification
        });

        if (error) {
          console.error(`Failed to create ${testUser.email}:`, error.message);
          continue;
        }

        if (data.user) {
          console.log(`✓ Created user: ${testUser.email}`);
          createdUsers.push({
            id: data.user.id,
            email: testUser.email,
            displayName: testUser.displayName,
          });
        }
      } catch (err: any) {
        console.error(`Error creating user ${testUser.email}:`, err.message);
      }
    }

    if (createdUsers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any users' },
        { status: 500 }
      );
    }

    // Create workspace if it doesn't exist
    const { data: existingWorkspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('id', TEST_WORKSPACE_ID)
      .single();

    let workspaceId = TEST_WORKSPACE_ID;

    if (!existingWorkspace) {
      const { data: workspace, error: workspaceError } = await supabaseAdmin
        .from('workspaces')
        .insert({
          id: TEST_WORKSPACE_ID,
          name: 'Test Workspace',
          slug: 'test-workspace',
          description: 'Workspace for testing DMs and other features',
          created_by: createdUsers[0].id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (workspaceError) {
        throw new Error(`Failed to create workspace: ${workspaceError.message}`);
      }

      if (workspace) {
        workspaceId = workspace.id;
        console.log(`✓ Created workspace: ${workspace.name}`);
      }
    } else {
      console.log(`✓ Workspace already exists: ${existingWorkspace.id}`);
    }

    // Add users to workspace
    for (const user of createdUsers) {
      try {
        const { data: existingMember } = await supabaseAdmin
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();

        if (existingMember) {
          console.log(`✓ User ${user.email} already member`);
          continue;
        }
      } catch (err) {
        // Member doesn't exist
      }

      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: user.email === TEST_USERS[0].email ? 'owner' : 'member',
          joined_at: new Date().toISOString(),
        });

      if (!memberError) {
        console.log(
          `✓ Added ${user.email} to workspace as ${
            user.email === TEST_USERS[0].email ? 'owner' : 'member'
          }`
        );
      }
    }

    // Create general channel if it doesn't exist
    const { data: existingChannel } = await supabaseAdmin
      .from('channels')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', 'general')
      .maybeSingle();

    if (!existingChannel) {
      await supabaseAdmin.from('channels').insert({
        workspace_id: workspaceId,
        name: 'general',
        description: 'General discussion channel',
        created_by: createdUsers[0].id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`✓ Created #general channel`);
    }

    const response = {
      success: true,
      workspaceId,
      users: createdUsers.map((u) => ({
        email: u.email,
        displayName: u.displayName,
        id: u.id,
      })),
      credentials: {
        password: TEST_USERS[0].password,
        note: 'Use the email and password above to log in',
      },
    };

    console.log('✅ Seed completed!', response);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Seed failed',
        details: error.cause || error.toString(),
      },
      { status: 500 }
    );
  }
}
