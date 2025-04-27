import { PostgrestError } from "@supabase/supabase-js";

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: string,
    public readonly hint?: string
  ) {
    super(message);
    this.name = "DatabaseError";
  }

  static fromPostgrestError(error: PostgrestError): DatabaseError {
    return new DatabaseError(
      error.message,
      error.code,
      error.details,
      error.hint
    );
  }
}

export interface Repository<T> {
  create(data: Omit<T, "id" | "created_at">): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 