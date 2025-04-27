import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { DatabaseError, Repository } from "./types";

export class ProfileRepository implements Repository<Profile> {
  private supabase = createClient();

  async create(data: Omit<Profile, "id" | "created_at">): Promise<Profile> {
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .insert(data)
      .select()
      .single();

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    if (!profile) {
      throw new DatabaseError("Failed to create profile");
    }

    return profile;
  }

  async findById(id: string): Promise<Profile | null> {
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw DatabaseError.fromPostgrestError(error);
    }

    return profile;
  }

  async findAll(): Promise<Profile[]> {
    const { data: profiles, error } = await this.supabase
      .from("profiles")
      .select("*");

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    return profiles || [];
  }

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    if (!profile) {
      throw new DatabaseError("Failed to update profile");
    }

    return profile;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw DatabaseError.fromPostgrestError(error);
    }

    return profile;
  }
} 