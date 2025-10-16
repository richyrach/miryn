import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActivityCard } from "./ActivityCard";
import { Loader2 } from "lucide-react";

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
  profiles: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    fetchFollowing();
  }, []);

  useEffect(() => {
    if (following.length > 0 || following.length === 0) {
      fetchActivities();
      subscribeToActivities();
    }
  }, [following]);

  const fetchFollowing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    setFollowing(data?.map(f => f.following_id) || []);
  };

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from("activities")
        .select(`
          *,
          profiles:user_id (
            display_name,
            handle,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      // If user follows people, show their activities, otherwise show global feed
      if (following.length > 0) {
        query = query.in("user_id", following);
      }

      const { data } = await query;

      if (data) {
        setActivities(data as any);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = supabase
      .channel("activities_feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {following.length > 0
            ? "No recent activity from people you follow"
            : "Follow people to see their activity here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
};
