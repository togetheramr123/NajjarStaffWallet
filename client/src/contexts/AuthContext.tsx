import { createContext, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";

export interface User {
  id: string;
  username: string;
  name: string;
  employeeNumber: string;
  role: "employee" | "branch_manager" | "manager";
  status: "active" | "inactive";
  balance: number;
  profilePicture: string | null;
  branchId: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5000,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json() as Promise<{ user: User }>;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
    },
  });

  const login = async (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refreshUser = () => {
    refetch();
  };

  return (
    <AuthContext.Provider value={{ user: data?.user || null, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
