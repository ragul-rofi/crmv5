import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CustomFieldsManager from "./settings/CustomFieldsManager";

const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

const passwordFormSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const SettingsPage = () => {
  const { userProfile, refreshUserProfile } = useUser();
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      profileForm.reset({ full_name: userProfile.full_name || "" });
    }
  }, [userProfile, profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!userProfile) return;
    setIsProfileSaving(true);

    try {
      await api.updateUser(userProfile.id, { full_name: values.full_name });
      toast.success("Profile updated successfully!");
      await refreshUserProfile();
    } catch (error: any) {
      toast.error("Failed to update profile: " + error.message);
    }
    setIsProfileSaving(false);
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!userProfile) return;
    setIsPasswordSaving(true);
    
    try {
      await api.updateUser(userProfile.id, { password: values.password });
      toast.success("Password updated successfully!");
      passwordForm.reset();
    } catch (error: any) {
      toast.error("Failed to update password: " + error.message);
    }
    setIsPasswordSaving(false);
  };

  return (
    <Layout onSearchClick={() => setSearchOpen(true)}>
      <div className="p-8 pt-6 space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center space-x-4">
                    <Label>Email</Label>
                    <Input value={userProfile?.email || ""} disabled />
                  </div>
                  <Button type="submit" disabled={isProfileSaving}>
                    {isProfileSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password here. Please use a strong password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="New password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPasswordSaving}>
                    {isPasswordSaving ? "Saving..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <CustomFieldsManager />
      </div>
    </Layout>
  );
};

export default SettingsPage;
