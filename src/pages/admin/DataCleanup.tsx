
import React, { useState, useEffect } from 'react';
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from 'lucide-react';
import { toast } from 'sonner';
import { getPublicTableNames } from '@/utils/supabaseRpc';

const DataCleanup = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      
      // Use our utility function to get public table names
      const tableNames = await getPublicTableNames();
      
      if (tableNames) {
        // Filter out system tables
        const filteredTables = tableNames.filter(name => 
          !['knex_migrations', 'knex_migrations_lock', 'pg_migrations'].includes(name)
        );
        setTables(filteredTables);
      } else {
        toast.error("Failed to fetch database tables");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This tool allows administrators to manage database tables and perform maintenance operations.
            </p>
            
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading database tables...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Available Tables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tables.map(table => (
                      <div key={table} className="border rounded-md p-3 bg-muted/30">
                        {table}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={fetchTables}
                  disabled={loading}
                >
                  Refresh Tables
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DataCleanup;
