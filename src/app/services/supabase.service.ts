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
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
    
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

    // Check for existing session
    this.getSession();
  }

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentSession.next(session);
    if (session?.user) {
      this.currentUser.next({
        id: session.user.id,
        email: session.user.email!,
        username: session.user.user_metadata?.['username'],
        created_at: session.user.created_at
      });
    }
  }

  async signUp(email: string, password: string, username: string) {
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
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser.value;
  }

  isAuthenticated(): boolean {
    return this.currentUser.value !== null;
  }
}
