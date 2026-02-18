import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Check, X, Star, Users, FileDown, Linkedin, Github, Code2, ExternalLink, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateCard, ResumeDownloadButton } from '@/components/candidates/CandidateCard';
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
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  leetcode_url: string | null;
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
    if (profile?.id) fetchJobs();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedJob) fetchCandidates();
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('hr_id', profile!.id);
      if (error) throw error;
      setJobs(data || []);
      if (data && data.length > 0) setSelectedJob(data[0].id);
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
          id, status,
          candidate:profiles!applications_candidate_id_fkey (
            id, full_name, email, phone, location, skills, experience_years, bio, resume_url, linkedin_url, github_url, leetcode_url
          )
        `)
        .eq('job_id', selectedJob);
      if (error) throw error;
      const formatted = (data || []).map((app: any) => ({
        ...app.candidate,
        applicationId: app.id,
        applicationStatus: app.status,
      }));
      setCandidates(formatted);
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const getComparisonCandidates = () => candidates.filter(c => selectedCandidates.includes(c.id));

  const getAllSkills = () => {
    const skills = new Set<string>();
    getComparisonCandidates().forEach(c => c.skills.forEach(s => skills.add(s)));
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
        prev.map(c => c.applicationId === applicationId ? { ...c, applicationStatus: newStatus } : c)
      );
      toast({ title: 'Status Updated', description: `Candidate has been ${newStatus}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const compCandidates = getComparisonCandidates();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <Layers className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compare Candidates</h1>
            <p className="text-muted-foreground text-sm">Side-by-side comparison with resumes & profiles</p>
          </div>
        </div>

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
            {[1, 2, 3, 4].map(i => <Card key={i} className="h-48 animate-pulse bg-muted" />)}
          </div>
        ) : candidates.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {jobs.length === 0 ? 'Create a job first to compare candidates' : 'No candidates have applied to this job yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <h3 className="font-medium mb-3">Select candidates ({selectedCandidates.length} selected)</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {candidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    applicationStatus={candidate.applicationStatus as any}
                    selectable
                    selected={selectedCandidates.includes(candidate.id)}
                    onSelect={() => toggleCandidateSelection(candidate.id)}
                  />
                ))}
              </div>
            </div>

            {selectedCandidates.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="shadow-card overflow-hidden border-2 border-accent/20">
                  <CardHeader className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-accent">
                      <BarChart3 className="w-5 h-5" />
                      Candidate Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-4 font-medium text-muted-foreground sticky left-0 bg-muted/30">Attribute</th>
                            {compCandidates.map(c => (
                              <th key={c.id} className="text-left p-4 font-semibold min-w-[220px] text-foreground">{c.full_name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Experience</td>
                            {compCandidates.map(c => (
                              <td key={c.id} className="p-4 font-semibold text-foreground">{c.experience_years} years</td>
                            ))}
                          </tr>
                          <tr className="border-b border-border bg-muted/10">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-muted/10">Location</td>
                            {compCandidates.map(c => (
                              <td key={c.id} className="p-4">{c.location || 'Not specified'}</td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Status</td>
                            {compCandidates.map(c => (
                              <td key={c.id} className="p-4">
                                <Badge variant={
                                  c.applicationStatus === 'hired' ? 'default' :
                                  c.applicationStatus === 'shortlisted' ? 'secondary' :
                                  c.applicationStatus === 'rejected' ? 'destructive' : 'outline'
                                }>{c.applicationStatus}</Badge>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border bg-muted/10">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-muted/10">Resume</td>
                            {compCandidates.map(c => (
                              <td key={c.id} className="p-4">
                                {c.resume_url ? <ResumeDownloadButton resumeUrl={c.resume_url} /> : <span className="text-xs text-muted-foreground">No resume</span>}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Profile Links</td>
                            {compCandidates.map(c => (
                              <td key={c.id} className="p-4">
                                <div className="flex flex-col gap-1">
                                  {c.linkedin_url && (
                                    <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                                      <Linkedin className="w-3 h-3" /> LinkedIn
                                    </a>
                                  )}
                                  {c.github_url && (
                                    <a href={c.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                                      <Github className="w-3 h-3" /> GitHub
                                    </a>
                                  )}
                                  {c.leetcode_url && (
                                    <a href={c.leetcode_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                                      <Code2 className="w-3 h-3" /> LeetCode
                                    </a>
                                  )}
                                  {!c.linkedin_url && !c.github_url && !c.leetcode_url && <span className="text-xs text-muted-foreground">None</span>}
                                </div>
                              </td>
                            ))}
                          </tr>
                          {getAllSkills().map((skill, idx) => (
                            <tr key={skill} className={`border-b border-border ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                              <td className={`p-4 text-muted-foreground sticky left-0 ${idx % 2 === 0 ? 'bg-muted/10' : 'bg-background'}`}>{skill}</td>
                              {compCandidates.map(c => (
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
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Actions</td>
                            {compCandidates.map(c => (
                              <td key={c.id} className="p-4">
                                <div className="flex gap-2">
                                  {c.applicationStatus !== 'shortlisted' && c.applicationStatus !== 'hired' && (
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(c.applicationId, 'shortlisted')}>
                                      <Star className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {c.applicationStatus !== 'hired' && c.applicationStatus !== 'rejected' && (
                                    <Button size="sm" className="gradient-accent text-accent-foreground" onClick={() => updateStatus(c.applicationId, 'hired')}>
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
