"use client";

import { useRepositoryQuery } from "@/hooks/use-query";
import { ProfileRepository } from "@/lib/supabase/repositories";
import { Profile } from "@/types";

const profileRepository = new ProfileRepository();

export function ProfileList() {
  const { data: profiles, isLoading, error } = useRepositoryQuery<Profile[]>(
    ["profiles"],
    () => profileRepository.findAll(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return <div>Loading profiles...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      {profiles?.map((profile) => (
        <div
          key={profile.id}
          className="p-4 bg-white rounded-lg shadow"
        >
          <h3 className="font-medium">User ID: {profile.user_id}</h3>
          {profile.age && <p>Age: {profile.age}</p>}
          {profile.maf_hr && <p>MAF HR: {profile.maf_hr}</p>}
        </div>
      ))}
    </div>
  );
} 