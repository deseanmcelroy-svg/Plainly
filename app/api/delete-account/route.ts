import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE() {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Delete profile data
  await supabase.from('profiles').delete().eq('id', user.id);

  // Use admin client to delete the auth user
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (adminUrl && serviceKey) {
    const admin = createAdminClient(adminUrl, serviceKey);
    await admin.auth.admin.deleteUser(user.id);
  }

  // Sign out
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
