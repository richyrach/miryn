import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { targetUserId } = await req.json();

    // Validate input
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!targetUserId || !uuidRegex.test(targetUserId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid targetUserId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-messaging
    if (targetUserId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot message yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Confirm target exists
    const { data: targetProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', targetUserId)
      .single();

    if (profileError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find existing 1:1 conversation
    const { data: existingParticipants } = await supabaseClient
      .from('conversation_participants')
      .select('conversation_id')
      .in('user_id', [user.id, targetUserId]);

    if (existingParticipants && existingParticipants.length > 0) {
      // Group by conversation_id and count distinct users
      const conversationCounts = existingParticipants.reduce((acc, p) => {
        acc[p.conversation_id] = (acc[p.conversation_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Find conversation with exactly 2 participants
      const existingConvId = Object.entries(conversationCounts).find(
        ([_, count]) => count === 2
      )?.[0];

      if (existingConvId) {
        // Verify it's a 1:1 conversation (not group chat)
        const { data: allParticipants } = await supabaseClient
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', existingConvId);

        if (allParticipants && allParticipants.length === 2) {
          console.log('Reusing existing conversation:', existingConvId);
          return new Response(
            JSON.stringify({ conversationId: existingConvId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Create new conversation
    const { data: newConversation, error: convError } = await supabaseClient
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      throw convError;
    }

    // Add both participants
    const { error: participantsError } = await supabaseClient
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: targetUserId }
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      throw participantsError;
    }

    console.log('Created new conversation:', newConversation.id);
    return new Response(
      JSON.stringify({ conversationId: newConversation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in start-conversation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
