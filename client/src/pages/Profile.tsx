import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "../hooks/useProfile";
import { useI18n } from "../hooks/useI18n";
import type { FarmerProfile } from "../types";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  cropType: z.string().min(1, "Crop type is required"),
  soilType: z.string().min(1, "Soil type is required"),
  landSize: z.number().min(0.1, "Land size must be greater than 0"),
  landUnit: z.string().min(1, "Land unit is required"),
  irrigation: z.string().min(1, "Irrigation type is required"),
  websiteLanguage: z.string().min(1, "Website language is required"),
  chatbotLanguage: z.string().min(1, "Chatbot language is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profile, saveProfile } = useProfile();
  const { languages, changeLanguage } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      location: profile?.location || "",
      cropType: profile?.cropType || "",
      soilType: profile?.soilType || "",
      landSize: profile?.landSize || 0,
      landUnit: profile?.landUnit || "acres",
      irrigation: profile?.irrigation || "",
      websiteLanguage: profile?.websiteLanguage || "ml",
      chatbotLanguage: profile?.chatbotLanguage || "ml",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      await saveProfile(data as FarmerProfile);
      
      // Update website language if changed
      if (data.websiteLanguage !== profile?.websiteLanguage) {
        changeLanguage(data.websiteLanguage);
      }

      toast({
        title: "Profile saved successfully!",
        description: "Your farming profile has been updated.",
      });

      // Redirect to chat
      setLocation("/chat");
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cropOptions = [
    { value: "rice", label: t("crops.rice") },
    { value: "wheat", label: t("crops.wheat") },
    { value: "corn", label: t("crops.corn") },
    { value: "cotton", label: t("crops.cotton") },
    { value: "sugarcane", label: t("crops.sugarcane") },
    { value: "vegetables", label: t("crops.vegetables") },
    { value: "fruits", label: t("crops.fruits") },
    { value: "pulses", label: t("crops.pulses") },
    { value: "spices", label: t("crops.spices") },
    { value: "other", label: t("crops.other") },
  ];

  const soilOptions = [
    { value: "clay", label: t("soils.clay") },
    { value: "sandy", label: t("soils.sandy") },
    { value: "loamy", label: t("soils.loamy") },
    { value: "black", label: t("soils.black") },
    { value: "red", label: t("soils.red") },
    { value: "laterite", label: t("soils.laterite") },
  ];

  const irrigationOptions = [
    { value: "drip", label: t("irrigation.drip") },
    { value: "sprinkler", label: t("irrigation.sprinkler") },
    { value: "flood", label: t("irrigation.flood") },
    { value: "furrow", label: t("irrigation.furrow") },
    { value: "rainfed", label: t("irrigation.rainfed") },
    { value: "bore", label: t("irrigation.bore") },
    { value: "canal", label: t("irrigation.canal") },
  ];

  const unitOptions = [
    { value: "acres", label: t("units.acres") },
    { value: "hectares", label: t("units.hectares") },
    { value: "bigha", label: t("units.bigha") },
    { value: "guntha", label: t("units.guntha") },
  ];

  return (
    <div className="bg-secondary/30 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              {t("profile.title")}
            </CardTitle>
            <p className="text-muted-foreground">{t("profile.subtitle")}</p>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      {t("profile.personalInfo")}
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("profile.name")} *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              {...field} 
                              data-testid="input-farmer-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.location")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Village, District, State" 
                              {...field} 
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Farm Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                      {t("profile.farmInfo")}
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="cropType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("profile.cropType")} *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-crop-type">
                                <SelectValue placeholder={t("profile.selectCrop")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cropOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="soilType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("profile.soilType")} *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-soil-type">
                                <SelectValue placeholder={t("profile.selectSoil")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {soilOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Land & Irrigation */}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="landSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("profile.landSize")} *
                        </FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              step="0.1" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-land-size"
                            />
                          </FormControl>
                          <FormField
                            control={form.control}
                            name="landUnit"
                            render={({ field: unitField }) => (
                              <Select onValueChange={unitField.onChange} defaultValue={unitField.value}>
                                <SelectTrigger className="w-32" data-testid="select-land-unit">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {unitOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="irrigation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("profile.irrigation")} *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-irrigation">
                              <SelectValue placeholder={t("profile.selectIrrigation")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {irrigationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Language Settings */}
                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    <i className="fas fa-language mr-2 text-primary"></i>
                    {t("profile.languagePrefs")}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="websiteLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.websiteLanguage")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-website-language">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  {lang.nativeName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chatbotLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.chatbotLanguage")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-chatbot-language">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                  {lang.nativeName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    {t("profile.languageNote")}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-6">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all duration-300 shadow-lg transform hover:scale-105"
                    data-testid="button-save-profile"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        {t("profile.saveProfile")}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
