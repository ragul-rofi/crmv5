import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, X, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: string;
  lastActivity: string;
  isCurrentSession: boolean;
  createdAt: string;
}

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/v1/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session terminated successfully');
    } catch (error) {
      toast.error('Failed to terminate session');
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!confirm('Are you sure you want to terminate all other sessions? This will log out all other devices.')) {
      return;
    }

    try {
      await fetch('/api/v1/sessions/others/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSessions(prev => prev.filter(s => s.isCurrentSession));
      toast.success('All other sessions terminated');
    } catch (error) {
      toast.error('Failed to terminate sessions');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getDeviceName = (userAgent: string) => {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    return 'Unknown Device';
  };

  if (loading) {
    return <div className="p-6">Loading sessions...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Active Sessions</h1>
            <p className="text-muted-foreground">Manage your active login sessions</p>
          </div>
        </div>
        
        <Button
          variant="destructive"
          onClick={terminateAllOtherSessions}
          disabled={sessions.filter(s => !s.isCurrentSession).length === 0}
        >
          Terminate All Other Sessions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Active Sessions ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.deviceType)}
                      <div>
                        <p className="font-medium">{getDeviceName(session.userAgent)}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.deviceType.charAt(0).toUpperCase() + session.deviceType.slice(1)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{session.location}</TableCell>
                  <TableCell className="font-mono text-sm">{session.ipAddress}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(session.lastActivity).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((Date.now() - new Date(session.lastActivity).getTime()) / 60000)} min ago
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.isCurrentSession ? (
                      <Badge className="bg-green-100 text-green-800">Current Session</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!session.isCurrentSession && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => terminateSession(session.id)}
                        title="Terminate session"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Regularly review and terminate unused sessions
          </p>
          <p className="text-sm text-muted-foreground">
            • If you see unfamiliar sessions, terminate them immediately and change your password
          </p>
          <p className="text-sm text-muted-foreground">
            • Use strong, unique passwords and enable two-factor authentication
          </p>
        </CardContent>
      </Card>
    </div>
  );
}