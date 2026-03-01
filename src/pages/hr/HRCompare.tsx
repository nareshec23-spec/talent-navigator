import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Check, X, Star, Users, Linkedin, Github, Code2, Layers, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateCard, ResumeDownloadButton } from '@/components/candidates/CandidateCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
  joining_date: string | null;
}

type ApplicationStatus = 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';

const CHART_COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(142 76% 36%)'];

export default function HRCompare() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningDialogCandidate, setJoiningDialogCandidate] = useState<Candidate | null>(null);
  const [joiningDate, setJoiningDate] = useState<Date | undefined>();

  useEffect(() => { if (profile?.id) fetchJobs(); }, [profile?.id]);
  useEffect(() => { if (selectedJob) fetchCandidates(); }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase.from('jobs').select('id, title').eq('hr_id', profile!.id);
      if (error) throw error;
      setJobs(data || []);
      if (data && data.length > 0) setSelectedJob(data[0].id);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`id, status, joining_date, candidate:profiles!applications_candidate_id_fkey (id, full_name, email, phone, location, skills, experience_years, bio, resume_url, linkedin_url, github_url, leetcode_url)`)
        .eq('job_id', selectedJob);
      if (error) throw error;
      setCandidates((data || []).map((app: any) => ({ ...app.candidate, applicationId: app.id, applicationStatus: app.status, joining_date: app.joining_date })));
      setSelectedCandidates([]);
    } catch (error) { console.error(error); }
  };

  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidates(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const updateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', applicationId);
      if (error) throw error;
      setCandidates(prev => prev.map(c => c.applicationId === applicationId ? { ...c, applicationStatus: newStatus } : c));
      toast({ title: 'Status Updated', description: `Candidate has been ${newStatus}` });
    } catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const saveJoiningDate = async () => {
    if (!joiningDialogCandidate || !joiningDate) return;
    try {
      const { error } = await supabase.from('applications').update({ joining_date: format(joiningDate, 'yyyy-MM-dd') } as any).eq('id', joiningDialogCandidate.applicationId);
      if (error) throw error;
      setCandidates(prev => prev.map(c => c.applicationId === joiningDialogCandidate.applicationId ? { ...c, joining_date: format(joiningDate, 'yyyy-MM-dd') } : c));
      toast({ title: 'Success', description: 'Joining date assigned!' });
      setJoiningDialogCandidate(null);
      setJoiningDate(undefined);
    } catch (error: any) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
  };

  const compCandidates = candidates.filter(c => selectedCandidates.includes(c.id));
  const allSkills = (() => { const s = new Set<string>(); compCandidates.forEach(c => c.skills.forEach(sk => s.add(sk))); return Array.from(s); })();

  // Radar chart data
  const radarData = allSkills.map(skill => {
    const row: any = { skill };
    compCandidates.forEach(c => { row[c.full_name] = c.skills.includes(skill) ? 1 : 0; });
    return row;
  });

  // Bar chart data for experience
  const barData = compCandidates.map(c => ({ name: c.full_name.split(' ')[0], experience: c.experience_years, skills: c.skills.length }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <Layers className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compare Candidates</h1>
            <p className="text-muted-foreground text-sm">Side-by-side comparison with analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Select Job:</label>
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-[300px]"><SelectValue placeholder="Choose a job" /></SelectTrigger>
            <SelectContent>{jobs.map(job => <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Card key={i} className="h-48 animate-pulse bg-muted" />)}</div>
        ) : candidates.length === 0 ? (
          <Card className="shadow-card"><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">{jobs.length === 0 ? 'Create a job first' : 'No candidates yet'}</p></CardContent></Card>
        ) : (
          <>
            <div>
              <h3 className="font-medium mb-3">Select candidates ({selectedCandidates.length} selected)</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {candidates.map(c => (
                  <CandidateCard key={c.id} candidate={c} applicationStatus={c.applicationStatus as any} selectable selected={selectedCandidates.includes(c.id)} onSelect={() => toggleCandidateSelection(c.id)} />
                ))}
              </div>
            </div>

            {selectedCandidates.length >= 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Skill Analytics Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="shadow-card border-2 border-accent/10">
                    <CardHeader><CardTitle className="text-sm">Skills Radar</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                          {compCandidates.map((c, i) => (
                            <Radar key={c.id} name={c.full_name} dataKey={c.full_name} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} />
                          ))}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card border-2 border-accent/10">
                    <CardHeader><CardTitle className="text-sm">Experience & Skills Count</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                          <Bar dataKey="experience" name="Experience (yrs)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="skills" name="Skills Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Legend />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison Table */}
                <Card className="shadow-card overflow-hidden border-2 border-accent/20">
                  <CardHeader className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-accent"><BarChart3 className="w-5 h-5" />Detailed Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-4 font-medium text-muted-foreground sticky left-0 bg-muted/30">Attribute</th>
                            {compCandidates.map(c => <th key={c.id} className="text-left p-4 font-semibold min-w-[220px] text-foreground">{c.full_name}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Experience</td>
                            {compCandidates.map(c => <td key={c.id} className="p-4 font-semibold text-foreground">{c.experience_years} years</td>)}
                          </tr>
                          <tr className="border-b border-border bg-muted/10">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-muted/10">Location</td>
                            {compCandidates.map(c => <td key={c.id} className="p-4">{c.location || 'Not specified'}</td>)}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Status</td>
                            {compCandidates.map(c => <td key={c.id} className="p-4">
                              <Badge variant={c.applicationStatus === 'hired' ? 'default' : c.applicationStatus === 'shortlisted' ? 'secondary' : c.applicationStatus === 'rejected' ? 'destructive' : 'outline'}>{c.applicationStatus}</Badge>
                            </td>)}
                          </tr>
                          <tr className="border-b border-border bg-muted/10">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-muted/10">Joining Date</td>
                            {compCandidates.map(c => <td key={c.id} className="p-4">
                              {c.joining_date ? <span className="text-sm">{format(new Date(c.joining_date), 'MMM d, yyyy')}</span> :
                                c.applicationStatus === 'hired' ? <Button size="sm" variant="outline" onClick={() => { setJoiningDialogCandidate(c); setJoiningDate(undefined); }}><CalendarIcon className="w-3 h-3 mr-1" />Set Date</Button> :
                                <span className="text-xs text-muted-foreground">—</span>}
                            </td>)}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Resume</td>
                            {compCandidates.map(c => <td key={c.id} className="p-4">{c.resume_url ? <ResumeDownloadButton resumeUrl={c.resume_url} /> : <span className="text-xs text-muted-foreground">No resume</span>}</td>)}
                          </tr>
                          <tr className="border-b border-border bg-muted/10">
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-muted/10">Profile Links</td>
                            {compCandidates.map(c => <td key={c.id} className="p-4">
                              <div className="flex flex-col gap-1">
                                {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline"><Linkedin className="w-3 h-3" /> LinkedIn</a>}
                                {c.github_url && <a href={c.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline"><Github className="w-3 h-3" /> GitHub</a>}
                                {c.leetcode_url && <a href={c.leetcode_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline"><Code2 className="w-3 h-3" /> LeetCode</a>}
                                {!c.linkedin_url && !c.github_url && !c.leetcode_url && <span className="text-xs text-muted-foreground">None</span>}
                              </div>
                            </td>)}
                          </tr>
                          {allSkills.map((skill, idx) => (
                            <tr key={skill} className={`border-b border-border ${idx % 2 === 0 ? 'bg-muted/10' : ''}`}>
                              <td className={`p-4 text-muted-foreground sticky left-0 ${idx % 2 === 0 ? 'bg-muted/10' : 'bg-background'}`}>{skill}</td>
                              {compCandidates.map(c => <td key={c.id} className="p-4">{c.skills.includes(skill) ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground/30" />}</td>)}
                            </tr>
                          ))}
                          <tr>
                            <td className="p-4 text-muted-foreground font-medium sticky left-0 bg-background">Actions</td>
                            {compCandidates.map(c => <td key={c.id} className="p-4">
                              <div className="flex gap-2">
                                {c.applicationStatus !== 'shortlisted' && c.applicationStatus !== 'hired' && <Button size="sm" variant="outline" onClick={() => updateStatus(c.applicationId, 'shortlisted')}><Star className="w-4 h-4" /></Button>}
                                {c.applicationStatus !== 'hired' && c.applicationStatus !== 'rejected' && <Button size="sm" className="gradient-accent text-accent-foreground" onClick={() => updateStatus(c.applicationId, 'hired')}>Hire</Button>}
                              </div>
                            </td>)}
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

        {/* Joining Date Dialog */}
        <Dialog open={!!joiningDialogCandidate} onOpenChange={(open) => { if (!open) { setJoiningDialogCandidate(null); setJoiningDate(undefined); } }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set Joining Date for {joiningDialogCandidate?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !joiningDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {joiningDate ? format(joiningDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={joiningDate} onSelect={setJoiningDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setJoiningDialogCandidate(null); setJoiningDate(undefined); }}>Cancel</Button>
                <Button className="gradient-accent text-accent-foreground" onClick={saveJoiningDate} disabled={!joiningDate}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
