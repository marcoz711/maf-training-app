import { createClient } from "@/lib/supabase/client";
import { Activity } from "@/types";
import { DatabaseError, Repository, PaginatedResult } from "./types";

export class ActivityRepository implements Repository<Activity> {
  private supabase = createClient();

  async create(data: Omit<Activity, "id" | "created_at">): Promise<Activity> {
    const { data: activity, error } = await this.supabase
      .from("activities")
      .insert(data)
      .select()
      .single();

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    if (!activity) {
      throw new DatabaseError("Failed to create activity");
    }

    return {
      id: activity.id as string,
      user_id: activity.user_id as string,
      date: activity.date as string,
      type: activity.type as string,
      duration: activity.duration as number,
      distance: activity.distance as number | undefined,
      avg_heart_rate: activity.avg_heart_rate as number | undefined,
      max_heart_rate: activity.max_heart_rate as number | undefined,
      notes: activity.notes as string | undefined,
      created_at: activity.created_at as string
    };
  }

  async findById(id: string): Promise<Activity | null> {
    const { data: activity, error } = await this.supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    if (!activity) {
      return null;
    }

    return {
      id: activity.id as string,
      user_id: activity.user_id as string,
      date: activity.date as string,
      type: activity.type as string,
      duration: activity.duration as number,
      distance: activity.distance as number | undefined,
      avg_heart_rate: activity.avg_heart_rate as number | undefined,
      max_heart_rate: activity.max_heart_rate as number | undefined,
      notes: activity.notes as string | undefined,
      created_at: activity.created_at as string
    };
  }

  async findAll(): Promise<Activity[]> {
    const { data: activities, error } = await this.supabase
      .from("activities")
      .select("*");

    if (error) {
      throw new DatabaseError(error.message);
    }

    return (activities || []).map(activity => ({
      id: activity.id as string,
      user_id: activity.user_id as string,
      date: activity.date as string,
      type: activity.type as string,
      duration: activity.duration as number,
      distance: activity.distance as number | undefined,
      avg_heart_rate: activity.avg_heart_rate as number | undefined,
      max_heart_rate: activity.max_heart_rate as number | undefined,
      notes: activity.notes as string | undefined,
      created_at: activity.created_at as string
    }));
  }

  async update(id: string, data: Partial<Activity>): Promise<Activity> {
    const { data: activity, error } = await this.supabase
      .from("activities")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    if (!activity) {
      throw new DatabaseError("Failed to update activity");
    }

    return {
      id: activity.id as string,
      user_id: activity.user_id as string,
      date: activity.date as string,
      type: activity.type as string,
      duration: activity.duration as number,
      distance: activity.distance as number | undefined,
      avg_heart_rate: activity.avg_heart_rate as number | undefined,
      max_heart_rate: activity.max_heart_rate as number | undefined,
      notes: activity.notes as string | undefined,
      created_at: activity.created_at as string
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("activities")
      .delete()
      .eq("id", id);

    if (error) {
      throw new DatabaseError(error.message);
    }
  }

  async findByUserId(
    userId: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResult<Activity>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: activities, error, count } = await this.supabase
      .from("activities")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: (activities || []).map(activity => ({
        id: activity.id as string,
        user_id: activity.user_id as string,
        date: activity.date as string,
        type: activity.type as string,
        duration: activity.duration as number,
        distance: activity.distance as number | undefined,
        avg_heart_rate: activity.avg_heart_rate as number | undefined,
        max_heart_rate: activity.max_heart_rate as number | undefined,
        notes: activity.notes as string | undefined,
        created_at: activity.created_at as string
      })),
      count: totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Activity[]> {
    const { data: activities, error } = await this.supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString());

    if (error) {
      throw new DatabaseError(error.message);
    }

    return (activities || []).map(activity => ({
      id: activity.id as string,
      user_id: activity.user_id as string,
      date: activity.date as string,
      type: activity.type as string,
      duration: activity.duration as number,
      distance: activity.distance as number | undefined,
      avg_heart_rate: activity.avg_heart_rate as number | undefined,
      max_heart_rate: activity.max_heart_rate as number | undefined,
      notes: activity.notes as string | undefined,
      created_at: activity.created_at as string
    }));
  }
} 