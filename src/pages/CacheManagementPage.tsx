import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, RefreshCw, Database, Search } from 'lucide-react';
import { toast } from 'sonner';

interface CacheStats {
  connected: boolean;
  memory?: string;
  keyspace?: string;
  totalKeys: number;
  error?: string;
}

interface CacheKey {
  key: string;
  ttl: number;
  type: string;
}

export default function CacheManagementPage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [keys, setKeys] = useState<CacheKey[]>([]);
  const [searchPattern, setSearchPattern] = useState('*');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCacheStats();
    fetchCacheKeys();
  }, []);

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/cache/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
      setStats({ connected: false, totalKeys: 0, error: 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCacheKeys = async (pattern: string = '*') => {
    try {
      const response = await fetch(`/api/admin/cache/keys?pattern=${encodeURIComponent(pattern)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache keys:', error);
    }
  };

  const handleSearch = () => {
    fetchCacheKeys(searchPattern);
  };

  const invalidateKey = async (key: string) => {
    try {
      const response = await fetch(`/api/admin/cache/invalidate/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        toast.success(`Cache key "${key}" invalidated`);
        fetchCacheKeys(searchPattern);
        fetchCacheStats();
      }
    } catch (error) {
      toast.error('Failed to invalidate cache key');
    }
  };

  const flushAllCache = async () => {
    if (!confirm('Are you sure you want to flush all cache? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/cache/flush', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        toast.success('All cache flushed successfully');
        fetchCacheKeys(searchPattern);
        fetchCacheStats();
      }
    } catch (error) {
      toast.error('Failed to flush cache');
    }
  };

  const formatTTL = (ttl: number) => {
    if (ttl === -1) return 'No expiry';
    if (ttl === -2) return 'Expired';
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m`;
    return `${Math.floor(ttl / 3600)}h`;
  };

  if (loading) {
    return <div className="p-6">Loading cache management...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Cache Management</h1>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchCacheStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={flushAllCache} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Flush All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats?.connected ? (
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              ) : (
                <Badge variant="destructive">Disconnected</Badge>
              )}
            </div>
            {stats?.error && (
              <p className="text-xs text-red-500 mt-2">{stats.error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKeys || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats?.connected ? 'Available' : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Keys</CardTitle>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Search pattern (e.g., users:*, companies:*)"
              value={searchPattern}
              onChange={(e) => setSearchPattern(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((cacheKey) => (
                <TableRow key={cacheKey.key}>
                  <TableCell className="font-mono text-sm">{cacheKey.key}</TableCell>
                  <TableCell>{formatTTL(cacheKey.ttl)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cacheKey.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => invalidateKey(cacheKey.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {keys.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No cache keys found matching pattern "{searchPattern}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}