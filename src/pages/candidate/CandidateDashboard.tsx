import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, FileText, CheckCircle, XCircle, Clock, Star, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JobCard } from '@/components/jobs/JobCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  totalApplications: number;
  pending: number;
  shortlisted: number;
  hired: number;
  rejected: number;
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  joining_date: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    employment_type: string;
    location_type: string;
    location_details: string | null;
    salary_min: number | null;
    salary_max: number | null;
    required_skills: string[];
    experience_min: number;
    experience_max: number | null;
    is_active: boolean;
    created_at: string;
  };
}

export default function CandidateDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [upcomingJoining, setUpcomingJoining] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          joining_date,
          job:jobs!applications_job_id_fkey (
            id,
            title,
            description,
            employment_type,
            location_type,
            location_details,
            salary_min,
            salary_max,
            required_skills,
            experience_min,
            experience_max,
            is_active,
            created_at
          )
        `)
        .eq('candidate_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const apps = data as any[];
      setRecentApplications(apps.slice(0, 3));

      // Filter upcoming joining dates (hired with a future or today joining date)
      const upcoming = apps.filter(
        (a) => a.status === 'hired' && a.joining_date && new Date(a.joining_date) >= new Date(new Date().toDateString())
      );
      setUpcomingJoining(upcoming);

      setStats({
        totalApplications: apps.length,
        pending: apps.filter(a => a.status === 'applied' || a.status === 'reviewing').length,
        shortlisted: apps.filter(a => a.status === 'shortlisted').length,
        hired: apps.filter(a => a.status === 'hired').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: FileText, label: 'Total Applications', value: stats.totalApplications, color: 'text-info' },
    { icon: Clock, label: 'Pending', value: stats.pending, color: 'text-warning' },
    { icon: Star, label: 'Shortlisted', value: stats.shortlisted, color: 'text-accent' },
    { icon: CheckCircle, label: 'Hired', value: stats.hired, color: 'text-success' },
    { icon: XCircle, label: 'Rejected', value: stats.rejected, color: 'text-destructive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your job applications and find new opportunities
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{loading ? '-' : stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Joining Dates */}
        {!loading && upcomingJoining.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="shadow-card border-l-4 border-l-success">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="w-5 h-5 text-success" />
                  Upcoming Joining Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingJoining.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-foreground">{app.job.title}</p>
                        <p className="text-xs text-muted-foreground">You've been hired!</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">
                          {format(new Date(app.joining_date!), 'PPP')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.ceil((new Date(app.joining_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.a
                href="/candidate/jobs"
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all"
              >
                <Briefcase className="w-6 h-6 text-accent mb-2" />
                <h3 className="font-medium">Browse Jobs</h3>
                <p className="text-sm text-muted-foreground">Find new opportunities</p>
              </motion.a>
              <motion.a
                href="/candidate/applications"
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all"
              >
                <FileText className="w-6 h-6 text-accent mb-2" />
                <h3 className="font-medium">My Applications</h3>
                <p className="text-sm text-muted-foreground">Track your progress</p>
              </motion.a>
              <motion.a
                href="/candidate/profile"
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all"
              >
                <Star className="w-6 h-6 text-accent mb-2" />
                <h3 className="font-medium">Update Profile</h3>
                <p className="text-sm text-muted-foreground">Improve your chances</p>
              </motion.a>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {recentApplications.map((app) => (
                  <JobCard
                    key={app.id}
                    job={app.job}
                    showApply={false}
                    showStatus={true}
                    applicationStatus={app.status}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}