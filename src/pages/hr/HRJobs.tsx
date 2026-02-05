 import { useEffect, useState } from 'react';
 import { motion } from 'framer-motion';
 import { Plus, Search, Filter } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { JobCard } from '@/components/jobs/JobCard';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { useToast } from '@/hooks/use-toast';
 
 interface Job {
   id: string;
   title: string;
   description: string;
   requirements: string[];
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
 }
 
 export default function HRJobs() {
   const { profile } = useAuth();
   const { toast } = useToast();
   const [jobs, setJobs] = useState<Job[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   
   // Form state
   const [formData, setFormData] = useState({
     title: '',
     description: '',
     employment_type: 'full_time',
     location_type: 'remote',
     location_details: '',
     salary_min: '',
     salary_max: '',
     required_skills: '',
     experience_min: '0',
     experience_max: '',
   });
 
   useEffect(() => {
     if (profile?.id) {
       fetchJobs();
     }
   }, [profile?.id]);
 
   const fetchJobs = async () => {
     try {
       const { data, error } = await supabase
         .from('jobs')
         .select('*')
         .eq('hr_id', profile!.id)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       setJobs(data as Job[]);
     } catch (error) {
       console.error('Error fetching jobs:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const handleCreateJob = async (e: React.FormEvent) => {
     e.preventDefault();
     
     try {
       const skillsArray = formData.required_skills
         .split(',')
         .map(s => s.trim())
         .filter(s => s.length > 0);
 
      const { error } = await supabase.from('jobs').insert([{
         hr_id: profile!.id,
         title: formData.title,
         description: formData.description,
        employment_type: formData.employment_type as 'full_time' | 'part_time' | 'contract' | 'internship',
        location_type: formData.location_type as 'remote' | 'india' | 'abroad' | 'hybrid',
         location_details: formData.location_details || null,
         salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
         salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
         required_skills: skillsArray,
         experience_min: parseInt(formData.experience_min),
         experience_max: formData.experience_max ? parseInt(formData.experience_max) : null,
      }]);
 
       if (error) throw error;
 
       toast({ title: 'Success', description: 'Job posted successfully!' });
       setIsCreateOpen(false);
       setFormData({
         title: '',
         description: '',
         employment_type: 'full_time',
         location_type: 'remote',
         location_details: '',
         salary_min: '',
         salary_max: '',
         required_skills: '',
         experience_min: '0',
         experience_max: '',
       });
       fetchJobs();
     } catch (error: any) {
       toast({
         title: 'Error',
         description: error.message || 'Failed to create job',
         variant: 'destructive',
       });
     }
   };
 
   const filteredJobs = jobs.filter(job =>
     job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     job.description.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   return (
     <DashboardLayout>
       <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div>
             <h1 className="text-2xl font-bold text-foreground">Job Listings</h1>
             <p className="text-muted-foreground mt-1">Manage your job postings</p>
           </div>
           <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
             <DialogTrigger asChild>
               <Button className="gradient-accent text-accent-foreground">
                 <Plus className="w-4 h-4 mr-2" />
                 Post New Job
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle>Create New Job Posting</DialogTitle>
               </DialogHeader>
               <form onSubmit={handleCreateJob} className="space-y-4 mt-4">
                 <div className="space-y-2">
                   <Label htmlFor="title">Job Title</Label>
                   <Input
                     id="title"
                     value={formData.title}
                     onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                     placeholder="e.g. Senior Software Engineer"
                     required
                   />
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="description">Description</Label>
                   <Textarea
                     id="description"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     placeholder="Describe the role, responsibilities, and requirements..."
                     rows={4}
                     required
                   />
                 </div>
 
                 <div className="grid sm:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Employment Type</Label>
                     <Select
                       value={formData.employment_type}
                       onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                     >
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="full_time">Full Time</SelectItem>
                         <SelectItem value="part_time">Part Time</SelectItem>
                         <SelectItem value="contract">Contract</SelectItem>
                         <SelectItem value="internship">Internship</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
 
                   <div className="space-y-2">
                     <Label>Location Type</Label>
                     <Select
                       value={formData.location_type}
                       onValueChange={(value) => setFormData({ ...formData, location_type: value })}
                     >
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="remote">Remote</SelectItem>
                         <SelectItem value="india">India</SelectItem>
                         <SelectItem value="abroad">Abroad</SelectItem>
                         <SelectItem value="hybrid">Hybrid</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="location_details">Location Details (Optional)</Label>
                   <Input
                     id="location_details"
                     value={formData.location_details}
                     onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                     placeholder="e.g. Bangalore, Mumbai, etc."
                   />
                 </div>
 
                 <div className="grid sm:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="salary_min">Min Salary (₹/year)</Label>
                     <Input
                       id="salary_min"
                       type="number"
                       value={formData.salary_min}
                       onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                       placeholder="e.g. 500000"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="salary_max">Max Salary (₹/year)</Label>
                     <Input
                       id="salary_max"
                       type="number"
                       value={formData.salary_max}
                       onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                       placeholder="e.g. 1200000"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="required_skills">Required Skills (comma-separated)</Label>
                   <Input
                     id="required_skills"
                     value={formData.required_skills}
                     onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                     placeholder="e.g. React, TypeScript, Node.js"
                   />
                 </div>
 
                 <div className="grid sm:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="experience_min">Min Experience (years)</Label>
                     <Input
                       id="experience_min"
                       type="number"
                       value={formData.experience_min}
                       onChange={(e) => setFormData({ ...formData, experience_min: e.target.value })}
                       min="0"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="experience_max">Max Experience (years)</Label>
                     <Input
                       id="experience_max"
                       type="number"
                       value={formData.experience_max}
                       onChange={(e) => setFormData({ ...formData, experience_max: e.target.value })}
                       placeholder="Optional"
                     />
                   </div>
                 </div>
 
                 <div className="flex justify-end gap-3 pt-4">
                   <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                     Cancel
                   </Button>
                   <Button type="submit" className="gradient-accent text-accent-foreground">
                     Post Job
                   </Button>
                 </div>
               </form>
             </DialogContent>
           </Dialog>
         </div>
 
         {/* Search */}
         <div className="relative max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <Input
             placeholder="Search jobs..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10"
           />
         </div>
 
         {/* Jobs Grid */}
         {loading ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3].map((i) => (
               <Card key={i} className="h-64 animate-pulse bg-muted" />
             ))}
           </div>
         ) : filteredJobs.length === 0 ? (
           <Card className="shadow-card">
             <CardContent className="py-12 text-center">
               <p className="text-muted-foreground">
                 {searchQuery ? 'No jobs match your search' : 'No jobs posted yet. Create your first job!'}
               </p>
             </CardContent>
           </Card>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredJobs.map((job) => (
               <JobCard key={job.id} job={job} showApply={false} />
             ))}
           </div>
         )}
       </div>
     </DashboardLayout>
   );
 }