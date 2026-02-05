 import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { Briefcase, Mail, Lock, User, ArrowRight, Building2, UserCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { useAuth } from '@/hooks/useAuth';
 import { useToast } from '@/hooks/use-toast';
 
 type AuthMode = 'login' | 'signup';
 type UserRole = 'hr' | 'candidate';
 
 export default function Auth() {
  const { user, profile, loading: authLoading, signIn, signUp } = useAuth();
   const [mode, setMode] = useState<AuthMode>('login');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [fullName, setFullName] = useState('');
   const [role, setRole] = useState<UserRole>('candidate');
   const [loading, setLoading] = useState(false);
   
   const { toast } = useToast();
   const navigate = useNavigate();
 
  // Auto-redirect if already authenticated
  if (!authLoading && user && profile) {
    return <Navigate to={profile.role === 'hr' ? '/hr' : '/candidate'} replace />;
  }

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     try {
       if (mode === 'login') {
         const { error } = await signIn(email, password);
         if (error) throw error;
         toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
        // Navigation will happen automatically via auth state change
       } else {
         if (!fullName.trim()) {
           throw new Error('Please enter your full name');
         }
         const { error } = await signUp(email, password, fullName, role);
         if (error) throw error;
         toast({ 
           title: 'Account created!', 
           description: 'Please check your email to verify your account.' 
         });
       }
     } catch (error: any) {
       toast({
         title: 'Error',
         description: error.message || 'An error occurred',
         variant: 'destructive',
       });
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
       <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
         className="w-full max-w-md"
       >
         {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow"
          >
             <Briefcase className="w-5 h-5 text-accent-foreground" />
          </motion.div>
           <span className="font-bold text-2xl text-primary-foreground">TalentFlow</span>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
        <Card className="shadow-card-hover overflow-hidden">
           <CardHeader className="text-center">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardTitle className="text-2xl">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </CardTitle>
            </motion.div>
             <CardDescription>
               {mode === 'login' 
                 ? 'Sign in to your account to continue' 
                 : 'Get started with TalentFlow today'}
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                   {/* Role Selection */}
                   <div className="space-y-2">
                     <Label>I am a...</Label>
                     <div className="grid grid-cols-2 gap-3">
                      <motion.button
                         type="button"
                         onClick={() => setRole('candidate')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                         className={`p-4 rounded-lg border-2 transition-all ${
                           role === 'candidate'
                             ? 'border-accent bg-accent/10'
                             : 'border-border hover:border-accent/50'
                         }`}
                       >
                         <UserCircle className={`w-6 h-6 mx-auto mb-2 ${
                           role === 'candidate' ? 'text-accent' : 'text-muted-foreground'
                         }`} />
                         <span className={`text-sm font-medium ${
                           role === 'candidate' ? 'text-accent' : 'text-muted-foreground'
                         }`}>
                           Job Seeker
                         </span>
                      </motion.button>
                      <motion.button
                         type="button"
                         onClick={() => setRole('hr')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                         className={`p-4 rounded-lg border-2 transition-all ${
                           role === 'hr'
                             ? 'border-accent bg-accent/10'
                             : 'border-border hover:border-accent/50'
                         }`}
                       >
                         <Building2 className={`w-6 h-6 mx-auto mb-2 ${
                           role === 'hr' ? 'text-accent' : 'text-muted-foreground'
                         }`} />
                         <span className={`text-sm font-medium ${
                           role === 'hr' ? 'text-accent' : 'text-muted-foreground'
                         }`}>
                           HR / Recruiter
                         </span>
                      </motion.button>
                     </div>
                   </div>
 
                   <div className="space-y-2">
                     <Label htmlFor="fullName">Full Name</Label>
                     <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="fullName"
                         type="text"
                         placeholder="Enter your full name"
                         value={fullName}
                         onChange={(e) => setFullName(e.target.value)}
                         className="pl-10"
                         required
                       />
                     </div>
                   </div>
                </motion.div>
               )}
 
               <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     id="email"
                     type="email"
                     placeholder="Enter your email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="pl-10"
                     required
                   />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="password">Password</Label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     id="password"
                     type="password"
                     placeholder="Enter your password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="pl-10"
                     required
                     minLength={6}
                   />
                 </div>
               </div>
 
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button 
                  type="submit" 
                  className="w-full gradient-accent text-accent-foreground"
                  disabled={loading}
                >
                  {loading ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full"
                      />
                      Please wait...
                    </motion.span>
                  ) : (
                   <>
                     {mode === 'login' ? 'Sign In' : 'Create Account'}
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </>
                 )}
                </Button>
              </motion.div>
             </form>
 
             <div className="mt-6 text-center text-sm">
               {mode === 'login' ? (
                 <p className="text-muted-foreground">
                   Don't have an account?{' '}
                   <button
                     type="button"
                     onClick={() => setMode('signup')}
                     className="text-accent font-medium hover:underline"
                   >
                     Sign up
                   </button>
                 </p>
               ) : (
                 <p className="text-muted-foreground">
                   Already have an account?{' '}
                   <button
                     type="button"
                     onClick={() => setMode('login')}
                     className="text-accent font-medium hover:underline"
                   >
                     Sign in
                   </button>
                 </p>
               )}
             </div>
           </CardContent>
         </Card>
        </motion.div>
 
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-primary-foreground/60 mt-6"
        >
           <Link to="/" className="hover:text-primary-foreground">
             ← Back to home
           </Link>
        </motion.p>
       </motion.div>
     </div>
   );
 }