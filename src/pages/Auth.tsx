 import { useState } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
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
   const [mode, setMode] = useState<AuthMode>('login');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [fullName, setFullName] = useState('');
   const [role, setRole] = useState<UserRole>('candidate');
   const [loading, setLoading] = useState(false);
   
   const { signIn, signUp } = useAuth();
   const { toast } = useToast();
   const navigate = useNavigate();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     try {
       if (mode === 'login') {
         const { error } = await signIn(email, password);
         if (error) throw error;
         toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
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
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
         className="w-full max-w-md"
       >
         {/* Logo */}
         <div className="flex items-center justify-center gap-2 mb-8">
           <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow">
             <Briefcase className="w-5 h-5 text-accent-foreground" />
           </div>
           <span className="font-bold text-2xl text-primary-foreground">TalentFlow</span>
         </div>
 
         <Card className="shadow-card-hover">
           <CardHeader className="text-center">
             <CardTitle className="text-2xl">
               {mode === 'login' ? 'Welcome back' : 'Create account'}
             </CardTitle>
             <CardDescription>
               {mode === 'login' 
                 ? 'Sign in to your account to continue' 
                 : 'Get started with TalentFlow today'}
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               {mode === 'signup' && (
                 <>
                   {/* Role Selection */}
                   <div className="space-y-2">
                     <Label>I am a...</Label>
                     <div className="grid grid-cols-2 gap-3">
                       <button
                         type="button"
                         onClick={() => setRole('candidate')}
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
                       </button>
                       <button
                         type="button"
                         onClick={() => setRole('hr')}
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
                       </button>
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
                 </>
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
 
               <Button 
                 type="submit" 
                 className="w-full gradient-accent text-accent-foreground"
                 disabled={loading}
               >
                 {loading ? 'Please wait...' : (
                   <>
                     {mode === 'login' ? 'Sign In' : 'Create Account'}
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </>
                 )}
               </Button>
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
 
         <p className="text-center text-sm text-primary-foreground/60 mt-6">
           <Link to="/" className="hover:text-primary-foreground">
             ← Back to home
           </Link>
         </p>
       </motion.div>
     </div>
   );
 }