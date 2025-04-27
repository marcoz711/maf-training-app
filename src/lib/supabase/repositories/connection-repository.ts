import { createClient } from "@/lib/supabase/client";
import { Connection } from "@/types";
import { DatabaseError, Repository } from "./types";

export class ConnectionRepository implements Repository<Connection> {
  private supabase = createClient();

  async create(data: Omit<Connection, "id" | "created_at">): Promise<Connection> {
    const { data: connection, error } = await this.supabase
      .from("connections")
      .insert(data)
      .select()
      .single();

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    if (!connection) {
      throw new DatabaseError("Failed to create connection");
    }

    return {
      id: connection.id as string,
      user_id_1: connection.user_id_1 as string,
      user_id_2: connection.user_id_2 as string,
      status: connection.status as "pending" | "accepted" | "rejected",
      created_at: connection.created_at as string
    };
  }

  async findById(id: string): Promise<Connection | null> {
    const { data: connection, error } = await this.supabase
      .from("connections")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw DatabaseError.fromPostgrestError(error);
    }

    if (!connection) {
      return null;
    }

    return {
      id: connection.id as string,
      user_id_1: connection.user_id_1 as string,
      user_id_2: connection.user_id_2 as string,
      status: connection.status as "pending" | "accepted" | "rejected",
      created_at: connection.created_at as string
    };
  }

  async findAll(): Promise<Connection[]> {
    const { data: connections, error } = await this.supabase
      .from("connections")
      .select("*");

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    return (connections || []).map(connection => ({
      id: connection.id as string,
      user_id_1: connection.user_id_1 as string,
      user_id_2: connection.user_id_2 as string,
      status: connection.status as "pending" | "accepted" | "rejected",
      created_at: connection.created_at as string
    }));
  }

  async update(id: string, data: Partial<Connection>): Promise<Connection> {
    const { data: connection, error } = await this.supabase
      .from("connections")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    if (!connection) {
      throw new DatabaseError("Failed to update connection");
    }

    return {
      id: connection.id as string,
      user_id_1: connection.user_id_1 as string,
      user_id_2: connection.user_id_2 as string,
      status: connection.status as "pending" | "accepted" | "rejected",
      created_at: connection.created_at as string
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("connections")
      .delete()
      .eq("id", id);

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }
  }

  async findByUserId(userId: string): Promise<Connection[]> {
    const { data: connections, error } = await this.supabase
      .from("connections")
      .select("*")
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) {
      throw DatabaseError.fromPostgrestError(error);
    }

    return (connections || []).map(connection => ({
      id: connection.id as string,
      user_id_1: connection.user_id_1 as string,
      user_id_2: connection.user_id_2 as string,
      status: connection.status as "pending" | "accepted" | "rejected",
      created_at: connection.created_at as string
    }));
  }

  async findConnectionBetweenUsers(
    userId1: string,
    userId2: string
  ): Promise<Connection | null> {
    const { data: connection, error } = await this.supabase
      .from("connections")
      .select("*")
      .or(`and(user_id_1.eq.${userId1},user_id_2.eq.${userId2}),and(user_id_1.eq.${userId2},user_id_2.eq.${userId1})`)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw DatabaseError.fromPostgrestError(error);
    }

    if (!connection) {
      return null;
    }

    return {
      id: connection.id as string,
      user_id_1: connection.user_id_1 as string,
      user_id_2: connection.user_id_2 as string,
      status: connection.status as "pending" | "accepted" | "rejected",
      created_at: connection.created_at as string
    };
  }
} 