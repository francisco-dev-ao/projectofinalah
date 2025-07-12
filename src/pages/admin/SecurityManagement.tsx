
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cliente" | "suporte";
}

const SecurityManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cliente' as "admin" | "cliente" | "suporte",
  });

  useEffect(() => {
    // Mock data for demonstration
    const mockUsers: User[] = [
      { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'cliente' },
      { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'admin' },
    ];
    setUsers(mockUsers);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: String(Date.now()),
      ...formData,
    };
    setUsers([...users, newUser]);
    setFormData({ name: '', email: '', role: 'cliente' });
    toast.success("User created successfully.");
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role: role as "admin" | "cliente" | "suporte" }));
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add and manage user roles and permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={handleRoleChange} defaultValue={formData.role}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Add User</Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Current Users</h2>
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No users added yet.</p>
        )}
      </div>
    </div>
  );
};

export default SecurityManagement;
