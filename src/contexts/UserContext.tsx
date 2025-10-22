import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";
import { User as AppUser } from "@/types";

interface UserContextType {
  userProfile: AppUser | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userProfile: null,
  loading: true,
  refreshUserProfile: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    if (authUser) {
      try {
        const data = await api.getUser(authUser.id);
        setUserProfile(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  }, [authUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const value = {
    userProfile,
    loading,
    refreshUserProfile: fetchUserProfile,
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};