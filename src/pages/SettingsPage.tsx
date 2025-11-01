import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, User, Bell, Shield, Database, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    autoSave: true
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    region: user?.region || ''
  });

  // Fetch user's profile change requests
  const { data: myRequests } = useQuery({
    queryKey: ['my-profile-requests'],
    queryFn: () => api.getMyProfileChangeRequests(),
  });

  const pendingRequest = myRequests?.requests?.find((req: any) => req.status === 'pending');

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        region: user.region || ''
      });
    }
  }, [user]);

  // Request profile change mutation
  const requestChangeMutation = useMutation({
    mutationFn: (changes: any) => api.requestProfileChange(changes),
    onSuccess: () => {
      toast.success('Profile change request submitted successfully. Awaiting admin approval.');
      queryClient.invalidateQueries({ queryKey: ['my-profile-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit profile change request');
    }
  });

  // Cancel request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => api.cancelProfileChangeRequest(requestId),
    onSuccess: () => {
      toast.success('Profile change request cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-profile-requests'] });
    },
    onError: () => {
      toast.error('Failed to cancel request');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check what changed
    const changes: any = {};
    if (profileForm.full_name !== user?.full_name) changes.full_name = profileForm.full_name;
    if (profileForm.email !== user?.email) changes.email = profileForm.email;
    if (profileForm.region !== user?.region) changes.region = profileForm.region;

    if (Object.keys(changes).length === 0) {
      toast.info('No changes detected');
      return;
    }

    requestChangeMutation.mutate(changes);
  };

  const handleCancelRequest = () => {
    if (pendingRequest) {
      cancelRequestMutation.mutate(pendingRequest.id);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated successfully');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 md:h-8 md:w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pending Request Alert */}
              {pendingRequest && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Profile change request pending approval</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested on {new Date(pendingRequest.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelRequest}
                      disabled={cancelRequestMutation.isPending}
                    >
                      Cancel Request
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recent Requests History */}
              {myRequests?.requests?.length > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-sm">Recent Requests</h3>
                  <div className="space-y-2">
                    {myRequests.requests.slice(0, 3).map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {req.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                          {req.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {req.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                          <span className="text-muted-foreground">
                            {new Date(req.requested_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant={
                          req.status === 'pending' ? 'secondary' :
                          req.status === 'approved' ? 'default' : 'destructive'
                        }>
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    disabled={!!pendingRequest}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!!pendingRequest}
                  />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input 
                    value={profileForm.region}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, region: e.target.value }))}
                    disabled={!!pendingRequest}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={user?.role} disabled />
                </div>
                <Button 
                  type="submit"
                  disabled={!!pendingRequest || requestChangeMutation.isPending}
                >
                  {pendingRequest ? 'Changes Pending Approval' : 'Request Profile Changes'}
                </Button>
                {!pendingRequest && (
                  <p className="text-sm text-muted-foreground">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Profile changes require admin approval
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">Change Password</Button>
              <Button variant="outline">Enable Two-Factor Authentication</Button>
              <Button variant="outline">View Active Sessions</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}