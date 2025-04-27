import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DatabaseError } from "@/types";

export function useRepositoryQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  return useQuery<T, DatabaseError>({
    queryKey: key,
    queryFn,
    ...options,
  });
}

export function useRepositoryMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: DatabaseError) => void;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation<T, DatabaseError, V>({
    mutationFn,
    onSuccess: (data) => {
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
} 