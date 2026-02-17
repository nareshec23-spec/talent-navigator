 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { BarChart3, Check, X, Star, Users } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { CandidateCard } from '@/components/candidates/CandidateCard';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { useToast } from '@/hooks/use-toast';
 
 interface Candidate {
   id: string;
   full_name: string;
   email: string;
   phone: string | null;
   location: string | null;
   skills: string[];
   experience_years: number;
   bio: string | null;
   applicationId: string;
   applicationStatus: string;
 }
 
 export default function HRCompare() {
   const { profile } = useAuth();
   const { toast } = useToast();
   const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
   const [selectedJob, setSelectedJob] = useState<string>('');
   const [candidates, setCandidates] = useState<Candidate[]>([]);
   const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (profile?.id) {
       fetchJobs();
     }
   }, [profile?.id]);
 
   useEffect(() => {
     if (selectedJob) {
       fetchCandidates();
     }
   }, [selectedJob]);
 
   const fetchJobs = async () => {
     try {
       const { data, error } = await supabase
         .from('jobs')
         .select('id, title')
         .eq('hr_id', profile!.id);
 
       if (error) throw error;
       setJobs(data || []);
       if (data && data.length > 0) {
         setSelectedJob(data[0].id);
       }
     } catch (error) {
       console.error('Error fetching jobs:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const fetchCandidates = async () => {
     try {
       const { data, error } = await supabase
         .from('applications')
         .select(`
           id,
           status,
           candidate:profiles!applications_candidate_id_fkey (
             id,
             full_name,
             email,
             phone,
             location,
             skills,
             experience_years,
             bio
           )
         `)
         .eq('job_id', selectedJob);
 
       if (error) throw error;
       
       const formattedCandidates = (data || []).map((app: any) => ({
         ...app.candidate,
         applicationId: app.id,
         applicationStatus: app.status,
       }));
       
       setCandidates(formattedCandidates);
       setSelectedCandidates([]);
     } catch (error) {
       console.error('Error fetching candidates:', error);
     }
   };
 
   const toggleCandidateSelection = (candidateId: string) => {
     setSelectedCandidates(prev => {
       if (prev.includes(candidateId)) {
         return prev.filter(id => id !== candidateId);
       }
        return [...prev, candidateId];
     });
   };
 
   const getComparisonCandidates = () => {
     return candidates.filter(c => selectedCandidates.includes(c.id));
   };
 
   const getAllSkills = () => {
     const skills = new Set<string>();
     getComparisonCandidates().forEach(c => {
       c.skills.forEach(s => skills.add(s));
     });
     return Array.from(skills);
   };
 
  type ApplicationStatus = 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  
  const updateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
     try {
       const { error } = await supabase
         .from('applications')
         .update({ status: newStatus })
         .eq('id', applicationId);
 
       if (error) throw error;
 
       setCandidates(prev =>
         prev.map(c =>
           c.applicationId === applicationId ? { ...c, applicationStatus: newStatus } : c
         )
       );
 
       toast({
         title: 'Status Updated',
         description: `Candidate has been ${newStatus}`,
       });
     } catch (error: any) {
       toast({
         title: 'Error',
         description: error.message,
         variant: 'destructive',
       });
     }
   };
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-bold text-foreground">Compare Candidates</h1>
            <p className="text-muted-foreground mt-1">
              Select candidates to compare side-by-side
            </p>
         </div>
 
         {/* Job Selection */}
         <div className="flex items-center gap-4">
           <label className="text-sm font-medium">Select Job:</label>
           <Select value={selectedJob} onValueChange={setSelectedJob}>
             <SelectTrigger className="w-[300px]">
               <SelectValue placeholder="Choose a job" />
             </SelectTrigger>
             <SelectContent>
               {jobs.map(job => (
                 <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {loading ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((i) => (
               <Card key={i} className="h-48 animate-pulse bg-muted" />
             ))}
           </div>
         ) : candidates.length === 0 ? (
           <Card className="shadow-card">
             <CardContent className="py-12 text-center">
               <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">
                 {jobs.length === 0 
                   ? 'Create a job first to compare candidates' 
                   : 'No candidates have applied to this job yet'}
               </p>
             </CardContent>
           </Card>
         ) : (
           <>
             {/* Candidate Selection */}
             <div>
                <h3 className="font-medium mb-3">
                  Select candidates ({selectedCandidates.length} selected)
                </h3>
               <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {candidates.map((candidate) => (
                   <CandidateCard
                     key={candidate.id}
                     candidate={candidate}
                    applicationStatus={candidate.applicationStatus as 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'}
                     selectable
                     selected={selectedCandidates.includes(candidate.id)}
                     onSelect={() => toggleCandidateSelection(candidate.id)}
                   />
                 ))}
               </div>
             </div>
 
             {/* Comparison Table */}
             {selectedCandidates.length >= 2 && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
               >
                 <Card className="shadow-card overflow-hidden">
                   <CardHeader className="gradient-primary text-primary-foreground">
                     <CardTitle className="flex items-center gap-2">
                       <BarChart3 className="w-5 h-5" />
                       Candidate Comparison
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                     <div className="overflow-x-auto">
                       <table className="w-full">
                         <thead>
                           <tr className="border-b border-border">
                             <th className="text-left p-4 font-medium text-muted-foreground">Attribute</th>
                             {getComparisonCandidates().map(c => (
                               <th key={c.id} className="text-left p-4 font-medium min-w-[200px]">
                                 {c.full_name}
                               </th>
                             ))}
                           </tr>
                         </thead>
                         <tbody>
                           <tr className="border-b border-border">
                             <td className="p-4 text-muted-foreground">Experience</td>
                             {getComparisonCandidates().map(c => (
                               <td key={c.id} className="p-4 font-medium">
                                 {c.experience_years} years
                               </td>
                             ))}
                           </tr>
                           <tr className="border-b border-border">
                             <td className="p-4 text-muted-foreground">Location</td>
                             {getComparisonCandidates().map(c => (
                               <td key={c.id} className="p-4">
                                 {c.location || 'Not specified'}
                               </td>
                             ))}
                           </tr>
                           <tr className="border-b border-border">
                             <td className="p-4 text-muted-foreground">Status</td>
                             {getComparisonCandidates().map(c => (
                               <td key={c.id} className="p-4">
                                 <Badge variant={
                                   c.applicationStatus === 'hired' ? 'default' :
                                   c.applicationStatus === 'shortlisted' ? 'secondary' :
                                   c.applicationStatus === 'rejected' ? 'destructive' : 'outline'
                                 }>
                                   {c.applicationStatus}
                                 </Badge>
                               </td>
                             ))}
                           </tr>
                           {getAllSkills().map(skill => (
                             <tr key={skill} className="border-b border-border">
                               <td className="p-4 text-muted-foreground">{skill}</td>
                               {getComparisonCandidates().map(c => (
                                 <td key={c.id} className="p-4">
                                   {c.skills.includes(skill) ? (
                                     <Check className="w-5 h-5 text-success" />
                                   ) : (
                                     <X className="w-5 h-5 text-muted-foreground/30" />
                                   )}
                                 </td>
                               ))}
                             </tr>
                           ))}
                           <tr>
                             <td className="p-4 text-muted-foreground">Actions</td>
                             {getComparisonCandidates().map(c => (
                               <td key={c.id} className="p-4">
                                 <div className="flex gap-2">
                                   {c.applicationStatus !== 'shortlisted' && c.applicationStatus !== 'hired' && (
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => updateStatus(c.applicationId, 'shortlisted')}
                                     >
                                       <Star className="w-4 h-4" />
                                     </Button>
                                   )}
                                   {c.applicationStatus !== 'hired' && c.applicationStatus !== 'rejected' && (
                                     <Button
                                       size="sm"
                                       className="gradient-accent text-accent-foreground"
                                       onClick={() => updateStatus(c.applicationId, 'hired')}
                                     >
                                       Hire
                                     </Button>
                                   )}
                                 </div>
                               </td>
                             ))}
                           </tr>
                         </tbody>
                       </table>
                     </div>
                   </CardContent>
                 </Card>
               </motion.div>
             )}
           </>
         )}
       </div>
     </DashboardLayout>
   );
 }