import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FarmerProfile } from "../types";
import { storageService } from "../services/storageService";

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => storageService.getProfile(),
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: (profileData: FarmerProfile) => storageService.saveProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

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
