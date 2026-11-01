import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FarmerProfile } from "../types";
import { storageService } from "../services/storageService";
import { useAuth } from "./useAuth";

export function useProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    // Re-fetch when the signed-in user changes (login/logout).
    queryKey: ["profile", user?.id ?? "anon"],
    queryFn: () => storageService.getProfile(),
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: (profileData: FarmerProfile) => storageService.saveProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  void user; // keep auth subscription active for query key

  const saveProfile = async (profileData: FarmerProfile) => {
    return saveMutation.mutateAsync(profileData);
  };

  return {
    profile,
    isLoading,
    saveProfile,
    isSaving: saveMutation.isPending,
  };
}
