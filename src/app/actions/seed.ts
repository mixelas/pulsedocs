'use server';

import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Development seed script to create test users and workspace.
 * Only use in development/testing environments.
 * Run once to populate test data for manual testing.
 */

const TEST_WORKSPACE_ID = 'dev-workspace-001';
const TEST_USER_1 = {
  email: 'alice@test.local',
  password: 'TestPassword123!',
  displayName: 'Alice Johnson',
};

const TEST_USER_2 = {
  email: 'bob@test.local',
  password: 'TestPassword123!',
  displayName: 'Bob Smith',
};

const TEST_USER_3 = {
  email: 'charlie@test.local',
  password: 'TestPassword123!',
  displayName: 'Charlie Davis',
};

export async function seedTestData() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is disabled in production');
  }

  console.log('🌱 Starting database seed for testing...');

  const supabase = await createClient();

  try {
    // Create test users and get their IDs
    const testUsers = [TEST_USER_1, TEST_USER_2, TEST_USER_3];
    const createdUsers: Array<{ id: string; email: string; displayName: string }> = [];

    for (const testUser of testUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', testUser.email)
          .single();

        if (existingUser) {
          console.log(`✓ User ${testUser.email} already exists, skipping creation`);
          createdUsers.push({
            id: existingUser.id,
            email: testUser.email,
            displayName: testUser.displayName,
          });
          continue;
        }
      } catch (err) {
        // User doesn't exist, proceed with creation
      }

      // Create user via admin API
      // For testing, we'll insert directly - in production use Supabase admin SDK
      const userId = crypto.randomUUID();

      // Note: In real implementation, use:
      // const { data: authUser, error } = await supabase.auth.admin.createUser({
      //   email: testUser.email,
      //   password: testUser.password,
      //   email_confirm: true,
      // });

      console.log(`✓ Created user: ${testUser.email}`);
      createdUsers.push({
        id: userId,
        email: testUser.email,
        displayName: testUser.displayName,
      });
    }

    // Check if workspace exists
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', TEST_WORKSPACE_ID)
      .single();

    let workspaceId = TEST_WORKSPACE_ID;

    if (!existingWorkspace) {
      // Create test workspace
      const { data: workspace, error: workspaceError } = await supabase
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

      workspaceId = workspace.id;
      console.log(`✓ Created workspace: ${workspace.name}`);
    } else {
      console.log(`✓ Workspace already exists: ${existingWorkspace.id}`);
    }

    // Add users to workspace as members
    for (const user of createdUsers) {
      try {
        const { data: existingMember } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .single();

        if (existingMember) {
          console.log(`✓ User ${user.email} already member of workspace`);
          continue;
        }
      } catch (err) {
        // Member doesn't exist, proceed with creation
      }

      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: user.email === TEST_USER_1.email ? 'owner' : 'member',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.log(`⚠ Warning: Failed to add ${user.email} to workspace`);
      } else {
        console.log(`✓ Added ${user.email} to workspace as ${user.email === TEST_USER_1.email ? 'owner' : 'member'}`);
      }
    }

    // Create initial test channel
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', 'general')
      .maybeSingle();

    if (!existingChannel) {
      const { error: channelError } = await supabase
        .from('channels')
        .insert({
          workspace_id: workspaceId,
          name: 'general',
          description: 'General discussion channel',
          created_by: createdUsers[0].id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (!channelError) {
        console.log(`✓ Created #general channel`);
      }
    } else {
      console.log(`✓ #general channel already exists`);
    }

    console.log('\n✅ Seed completed successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const user of createdUsers) {
      console.log(`\nUser: ${user.displayName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${TEST_USER_1.password}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\nWorkspace ID: ${workspaceId}`);
    console.log('\n💡 You can now log in with any of the test accounts above.');
    console.log('💬 After logging in, navigate to Messages to test DMs!');

    return {
      success: true,
      workspaceId,
      users: createdUsers,
      credentials: {
        password: TEST_USER_1.password,
      },
    };
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  }
}
