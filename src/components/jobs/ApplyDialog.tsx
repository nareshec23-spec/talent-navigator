import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Upload, X, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  require_linkedin?: boolean;
  require_github?: boolean;
  require_leetcode?: boolean;
}

interface ApplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSuccess: (jobId: string) => void;
}

interface ValidationIssue {
  field: string;
  message: string;
}

export function ApplyDialog({ open, onOpenChange, job, onSuccess }: ApplyDialogProps) {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [coverLetter, setCoverLetter] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applying, setApplying] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');

  useEffect(() => {
    if (open && profile) {
      setSkills(profile.skills?.join(', ') || '');
      setExperienceYears(String(profile.experience_years || 0));
      setExperienceLevel(profile.experience_years && profile.experience_years > 0 ? 'experienced' : 'fresher');
      setLinkedinUrl((profile as any)?.linkedin_url || '');
      setGithubUrl((profile as any)?.github_url || '');
      setLeetcodeUrl((profile as any)?.leetcode_url || '');
    }
  }, [open, profile]);

  useEffect(() => {
    if (open && job) {
      validateRequirements();
    }
  }, [open, job, skills, experienceYears, experienceLevel, linkedinUrl, githubUrl, leetcodeUrl]);

  const validateRequirements = () => {
    if (!job) return;
    const issues: ValidationIssue[] = [];

    const years = parseInt(experienceYears) || 0;
    if (job.experience_min && years < job.experience_min) {
      issues.push({
        field: 'experience',
        message: `This job requires at least ${job.experience_min} years of experience. You have ${years}.`,
      });
    }
    if (job.experience_max && years > job.experience_max) {
      issues.push({
        field: 'experience',
        message: `This job requires at most ${job.experience_max} years of experience. You have ${years}.`,
      });
    }

    const candidateSkills = skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (job.required_skills && job.required_skills.length > 0) {
      const missingSkills = job.required_skills.filter(
        rs => !candidateSkills.some(cs => cs.includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs))
      );
      if (missingSkills.length > 0) {
        issues.push({
          field: 'skills',
          message: `Missing required skills: ${missingSkills.join(', ')}`,
        });
      }
    }

    // Validate required profile URLs
    if (job.require_linkedin && !linkedinUrl.trim()) {
      issues.push({ field: 'linkedin', message: 'LinkedIn profile URL is required for this job.' });
    }
    if (job.require_github && !githubUrl.trim()) {
      issues.push({ field: 'github', message: 'GitHub profile URL is required for this job.' });
    }
    if (job.require_leetcode && !leetcodeUrl.trim()) {
      issues.push({ field: 'leetcode', message: 'LeetCode profile URL is required for this job.' });
    }

    setValidationIssues(issues);
  };

  const handleClose = () => {
    onOpenChange(false);
    setCoverLetter('');
    setSkills('');
    setExperienceLevel('');
    setExperienceYears('');
    setResumeFile(null);
    setValidationIssues([]);
    setLinkedinUrl('');
    setGithubUrl('');
    setLeetcodeUrl('');
  };

  const handleApply = async () => {
    if (!job || !profile?.id || !user) return;

    if (!resumeFile) {
      toast({ title: 'Resume Required', description: 'Please upload your resume to apply.', variant: 'destructive' });
      return;
    }

    if (validationIssues.length > 0) {
      toast({ title: 'Requirements Not Met', description: 'Please review the requirement issues below.', variant: 'destructive' });
      return;
    }

    setApplying(true);
    try {
      // Upload resume
      const fileExt = resumeFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(filePath);

      // Update profile with skills, experience, and profile URLs
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const yearsNum = parseInt(experienceYears) || 0;
      await supabase.from('profiles').update({
        skills: skillsArray,
        experience_years: yearsNum,
        resume_url: urlData.publicUrl,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        leetcode_url: leetcodeUrl || null,
      } as any).eq('user_id', user.id);

      // Submit application
      const { error } = await supabase.from('applications').insert([{
        job_id: job.id,
        candidate_id: profile.id,
        cover_letter: coverLetter || null,
        status: 'applied' as const,
      }]);

      if (error) throw error;

      onSuccess(job.id);
      handleClose();
      toast({ title: 'Success', description: 'Application submitted successfully!' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const canApply = validationIssues.length === 0 && resumeFile !== null;
  const hasRequiredUrls = job?.require_linkedin || job?.require_github || job?.require_leetcode;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job?.title}</DialogTitle>
          <DialogDescription>
            Complete your application details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Requirement Validation Feedback */}
          {validationIssues.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">You don't meet some requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationIssues.map((issue, i) => (
                    <li key={i}>{issue.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validationIssues.length === 0 && skills && experienceYears && (
            <Alert className="border-success/30 bg-success/5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                You meet all the requirements for this position!
              </AlertDescription>
            </Alert>
          )}

          {/* Required Skills from Job */}
          {job?.required_skills && job.required_skills.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Required Skills for this Job</Label>
              <div className="flex flex-wrap gap-1.5">
                {job.required_skills.map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Technical Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Your Technical Skills *</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">Separate skills with commas</p>
          </div>

          {/* Experience Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Experience Level *</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresher">Fresher</SelectItem>
                  <SelectItem value="experienced">Experienced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Years of Experience *</Label>
              <Input
                id="experienceYears"
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Required Profile URLs */}
          {hasRequiredUrls && (
            <div className="space-y-3 border-t border-border pt-3">
              <Label className="text-sm font-semibold">Required Profile Links</Label>
              {job?.require_linkedin && (
                <div className="space-y-1">
                  <Label htmlFor="apply_linkedin" className="text-xs">LinkedIn URL *</Label>
                  <Input
                    id="apply_linkedin"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              )}
              {job?.require_github && (
                <div className="space-y-1">
                  <Label htmlFor="apply_github" className="text-xs">GitHub URL *</Label>
                  <Input
                    id="apply_github"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              )}
              {job?.require_leetcode && (
                <div className="space-y-1">
                  <Label htmlFor="apply_leetcode" className="text-xs">LeetCode URL *</Label>
                  <Input
                    id="apply_leetcode"
                    value={leetcodeUrl}
                    onChange={(e) => setLeetcodeUrl(e.target.value)}
                    placeholder="https://leetcode.com/yourusername"
                  />
                </div>
              )}
            </div>
          )}

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>Resume (PDF/DOC) *</Label>
            {resumeFile ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/50">
                <FileText className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm truncate flex-1">{resumeFile.name}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setResumeFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload resume</span>
                <span className="text-xs text-muted-foreground">PDF, DOC, DOCX (max 10MB)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' });
                        return;
                      }
                      setResumeFile(file);
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
            <Textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this role..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              className="gradient-accent text-accent-foreground"
              onClick={handleApply}
              disabled={applying || !canApply}
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
