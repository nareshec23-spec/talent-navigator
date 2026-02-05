 import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
 import { User, Session } from '@supabase/supabase-js';
 import { supabase } from '@/integrations/supabase/client';
 
 type UserRole = 'hr' | 'candidate';
 
 interface Profile {
   id: string;
   user_id: string;
   email: string;
   full_name: string;
   role: UserRole;
   avatar_url: string | null;
   phone: string | null;
   location: string | null;
   bio: string | null;
   resume_url: string | null;
   skills: string[];
   experience_years: number;
   company_name: string | null;
   company_position: string | null;
 }
 
 interface AuthContextType {
   user: User | null;
   session: Session | null;
   profile: Profile | null;
   loading: boolean;
   signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>;
   signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
   signOut: () => Promise<void>;
   updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [profile, setProfile] = useState<Profile | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setSession(session);
         setUser(session?.user ?? null);
         
         if (session?.user) {
           setTimeout(() => {
             fetchProfile(session.user.id);
           }, 0);
         } else {
           setProfile(null);
           setLoading(false);
         }
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setSession(session);
       setUser(session?.user ?? null);
       if (session?.user) {
         fetchProfile(session.user.id);
       } else {
         setLoading(false);
       }
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const fetchProfile = async (userId: string) => {
     try {
       const { data, error } = await supabase
         .from('profiles')
         .select('*')
         .eq('user_id', userId)
         .single();
 
       if (error) throw error;
       setProfile(data as Profile);
     } catch (error) {
       console.error('Error fetching profile:', error);
     } finally {
       setLoading(false);
     }
   };
 
   const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
     try {
       const redirectUrl = `${window.location.origin}/`;
       
       const { error } = await supabase.auth.signUp({
         email,
         password,
         options: {
           emailRedirectTo: redirectUrl,
           data: {
             full_name: fullName,
             role: role,
           },
         },
       });
 
       if (error) throw error;
       return { error: null };
     } catch (error) {
       return { error: error as Error };
     }
   };
 
   const signIn = async (email: string, password: string) => {
     try {
       const { error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
 
       if (error) throw error;
       return { error: null };
     } catch (error) {
       return { error: error as Error };
     }
   };
 
   const signOut = async () => {
     await supabase.auth.signOut();
     setUser(null);
     setSession(null);
     setProfile(null);
   };
 
   const updateProfile = async (updates: Partial<Profile>) => {
     try {
       if (!user) throw new Error('No user logged in');
 
       const { error } = await supabase
         .from('profiles')
         .update(updates)
         .eq('user_id', user.id);
 
       if (error) throw error;
       
       setProfile(prev => prev ? { ...prev, ...updates } : null);
       return { error: null };
     } catch (error) {
       return { error: error as Error };
     }
   };
 
   return (
     <AuthContext.Provider value={{
       user,
       session,
       profile,
       loading,
       signUp,
       signIn,
       signOut,
       updateProfile,
     }}>
       {children}
     </AuthContext.Provider>
   );
 }
 
 export function useAuth() {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
 }