 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { Briefcase, Users, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 
 interface Stats {
   activeJobs: number;
   totalApplications: number;
   shortlisted: number;
   hired: number;
   rejected: number;
   pending: number;
 }
 
 export default function HRDashboard() {
   const { profile } = useAuth();
   const [stats, setStats] = useState<Stats>({
     activeJobs: 0,
     totalApplications: 0,
     shortlisted: 0,
     hired: 0,
     rejected: 0,
     pending: 0,
   });
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (profile?.id) {
       fetchStats();
     }
   }, [profile?.id]);
 
   const fetchStats = async () => {
     try {
       // Fetch jobs count
       const { data: jobs } = await supabase
         .from('jobs')
         .select('id, is_active')
         .eq('hr_id', profile!.id);
 
       const activeJobs = jobs?.filter(j => j.is_active).length || 0;
       const jobIds = jobs?.map(j => j.id) || [];
 
       if (jobIds.length > 0) {
         // Fetch applications for these jobs
         const { data: applications } = await supabase
           .from('applications')
           .select('status')
           .in('job_id', jobIds);
 
         const totalApplications = applications?.length || 0;
         const shortlisted = applications?.filter(a => a.status === 'shortlisted').length || 0;
         const hired = applications?.filter(a => a.status === 'hired').length || 0;
         const rejected = applications?.filter(a => a.status === 'rejected').length || 0;
         const pending = applications?.filter(a => a.status === 'applied' || a.status === 'reviewing').length || 0;
 
         setStats({
           activeJobs,
           totalApplications,
           shortlisted,
           hired,
           rejected,
           pending,
         });
       } else {
         setStats({
           activeJobs: 0,
           totalApplications: 0,
           shortlisted: 0,
           hired: 0,
           rejected: 0,
           pending: 0,
         });
       }
     } catch (error) {
       console.error('Error fetching stats:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const statCards = [
     { icon: Briefcase, label: 'Active Jobs', value: stats.activeJobs, color: 'text-accent' },
     { icon: Users, label: 'Total Applications', value: stats.totalApplications, color: 'text-info' },
     { icon: Clock, label: 'Pending Review', value: stats.pending, color: 'text-warning' },
     { icon: TrendingUp, label: 'Shortlisted', value: stats.shortlisted, color: 'text-accent' },
     { icon: CheckCircle, label: 'Hired', value: stats.hired, color: 'text-success' },
     { icon: XCircle, label: 'Rejected', value: stats.rejected, color: 'text-destructive' },
   ];
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold text-foreground">
             Welcome back, {profile?.full_name?.split(' ')[0]}!
           </h1>
           <p className="text-muted-foreground mt-1">
             Here's an overview of your recruitment activity
           </p>
         </div>
 
         {/* Stats Grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
 
         {/* Quick Actions */}
         <Card className="shadow-card">
           <CardHeader>
             <CardTitle>Quick Actions</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <motion.a
                 href="/hr/jobs"
                 whileHover={{ scale: 1.02 }}
                 className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all"
               >
                 <Briefcase className="w-6 h-6 text-accent mb-2" />
                 <h3 className="font-medium">Post New Job</h3>
                 <p className="text-sm text-muted-foreground">Create a new job listing</p>
               </motion.a>
               <motion.a
                 href="/hr/candidates"
                 whileHover={{ scale: 1.02 }}
                 className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all"
               >
                 <Users className="w-6 h-6 text-accent mb-2" />
                 <h3 className="font-medium">Review Candidates</h3>
                 <p className="text-sm text-muted-foreground">View pending applications</p>
               </motion.a>
               <motion.a
                 href="/hr/compare"
                 whileHover={{ scale: 1.02 }}
                 className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all"
               >
                 <TrendingUp className="w-6 h-6 text-accent mb-2" />
                 <h3 className="font-medium">Compare Candidates</h3>
                 <p className="text-sm text-muted-foreground">Side-by-side analysis</p>
               </motion.a>
               <motion.a
                 href="/hr/settings"
                 whileHover={{ scale: 1.02 }}
                 className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all"
               >
                 <CheckCircle className="w-6 h-6 text-accent mb-2" />
                 <h3 className="font-medium">Settings</h3>
                 <p className="text-sm text-muted-foreground">Manage your profile</p>
               </motion.a>
             </div>
           </CardContent>
         </Card>
       </div>
     </DashboardLayout>
   );
 }