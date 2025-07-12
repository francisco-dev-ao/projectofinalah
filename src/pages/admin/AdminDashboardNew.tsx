
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button'; // Import Button component
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyStats {
  month: number;
  count: number;
}

const AdminDashboardNew = () => {
  const [statsData, setStatsData] = useState<MonthlyStats[] | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use profiles table and group by month instead of missing monthly_registrations table
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('created_at');

        if (error) {
          console.error('Error fetching profiles:', error);
          return;
        }

        // Process the data to group by month
        const monthlyData: { [key: number]: number } = {};
        
        // Initialize all months with 0
        for (let i = 1; i <= 12; i++) {
          monthlyData[i] = 0;
        }
        
        // Count registrations by month
        profiles.forEach(profile => {
          const date = new Date(profile.created_at);
          const month = date.getMonth() + 1; // JavaScript months are 0-indexed
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        });
        
        // Convert to array format expected by chart
        const formattedData: MonthlyStats[] = Object.entries(monthlyData).map(
          ([month, count]) => ({
            month: parseInt(month),
            count: count
          })
        );

        setStatsData(formattedData);
      } catch (error) {
        console.error('Error fetching monthly stats:', error);
      }
    };

    fetchStats();
  }, []);

  const data = {
    datasets: [
      {
        label: 'Novos Registros',
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(75,192,192,0.6)',
        hoverBorderColor: 'rgba(75,192,192,1)',
        data: statsData?.map((item) => ({
          x: String(item.month),
          y: item.count,
        })),
      },
    ],
  };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const { data: registrations, error: regError } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
          .lt('created_at', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

        if (regError) {
          console.error('Error fetching registrations:', regError);
          return;
        }

        const formattedData: { [key: string]: number } = {};
        for (let i = 1; i <= new Date(currentYear, currentMonth, 0).getDate(); i++) {
          formattedData[String(i)] = 0;
        }

        registrations?.forEach(reg => {
          const day = new Date(reg.created_at).getDate();
          formattedData[String(day)] = (formattedData[String(day)] || 0) + 1;
        });

        setMonthlyData(formattedData);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      }
    };

    fetchMonthlyData();
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = Object.keys(monthlyData).map(day => parseInt(day, 10));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel de Administração</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema e estatísticas importantes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Novos Registros Mensais</CardTitle>
              <CardDescription>
                Número de novos usuários registrados por mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>Carregando...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registros Diários - {format(new Date(currentYear, currentMonth - 1), 'MMMM', { locale: ptBR })}</CardTitle>
              <CardDescription>
                Número de registros diários no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Button onClick={handlePrevMonth}>Mês Anterior</Button>
                <span>{format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy', { locale: ptBR })}</span>
                <Button onClick={handleNextMonth}>Próximo Mês</Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={daysInMonth.map(day => ({ day: day, count: monthlyData[day] || 0 }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatística 3</CardTitle>
              <CardDescription>
                Descrição da estatística 3
              </CardDescription>
            </CardHeader>
            <CardContent>
              Conteúdo da estatística 3
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardNew;
