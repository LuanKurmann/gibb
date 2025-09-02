import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<AuthUser | null>(null);
  private currentSession = new BehaviorSubject<Session | null>(null);

  user$ = this.currentUser.asObservable();
  session$ = this.currentSession.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey , {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession.next(session);
      if (session?.user) {
        this.currentUser.next({
          id: session.user.id,
          email: session.user.email!,
          username: session.user.user_metadata?.['username'],
          created_at: session.user.created_at
        });
      } else {
        this.currentUser.next(null);
      }
    });

    // Check for existing session with retry logic
    this.initializeSession();
  }

  private async initializeSession(retryCount = 0) {
    const maxRetries = 3;
    
    try {
      await this.getSession();
    } catch (error: any) {
      // Handle NavigatorLockAcquireTimeoutError and other auth errors
      if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
          error.message?.includes('lock')) {
        if (retryCount < maxRetries) {
          console.warn(`Auth lock timeout, retrying session initialization... (${retryCount + 1}/${maxRetries})`);
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000;
          setTimeout(() => this.initializeSession(retryCount + 1), delay);
        } else {
          console.error('Max retries reached for session initialization');
          // Continue without session - user will need to login manually
        }
      } else {
        console.error('Session initialization error:', error);
      }
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      
      this.currentSession.next(session);
      if (session?.user) {
        this.currentUser.next({
          id: session.user.id,
          email: session.user.email!,
          username: session.user.user_metadata?.['username'],
          created_at: session.user.created_at
        });
      }
    } catch (error: any) {
      if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
          error.message?.includes('lock')) {
        console.warn('Auth lock timeout during getSession, will retry...');
        throw error; // Let caller handle retry
      } else {
        console.error('Error getting session:', error);
        throw error;
      }
    }
  }

  async signUp(email: string, password: string, username: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error.message?.includes('NavigatorLockAcquireTimeoutError')) {
        console.warn('Auth lock timeout during signUp, please try again');
        throw new Error('Authentication is temporarily busy. Please try again in a moment.');
      }
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error.message?.includes('NavigatorLockAcquireTimeoutError')) {
        console.warn('Auth lock timeout during signIn, please try again');
        throw new Error('Authentication is temporarily busy. Please try again in a moment.');
      }
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      if (error.message?.includes('NavigatorLockAcquireTimeoutError')) {
        console.warn('Auth lock timeout during signOut, forcing local logout');
        // Force local logout even if server signout fails
        this.currentUser.next(null);
        this.currentSession.next(null);
        return;
      }
      throw error;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser.value;
  }

  isAuthenticated(): boolean {
    return this.currentUser.value !== null;
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
