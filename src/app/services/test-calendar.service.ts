import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { ScheduledTest, TestType, TestStatus, Grade, GradeType } from '../models/bm-domain.models';

@Injectable({
  providedIn: 'root'
})
export class TestCalendarService {
  private scheduledTestsSubject = new BehaviorSubject<ScheduledTest[]>([]);
  public scheduledTests$ = this.scheduledTestsSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadScheduledTests();
  }

  async loadScheduledTests(): Promise<void> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) return;

      const { data, error } = await this.supabase.client
        .from('scheduled_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error loading scheduled tests:', error);
        // If table doesn't exist, just return empty array
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('scheduled_tests table does not exist yet. Please run the migration.');
          this.scheduledTestsSubject.next([]);
        }
        return;
      }

      const tests: ScheduledTest[] = data.map(test => ({
        id: test.id,
        userId: test.user_id,
        subjectId: test.subject_id,
        title: test.title,
        description: test.description,
        testType: test.test_type as TestType,
        scheduledDate: test.scheduled_date,
        duration: test.duration,
        weight: test.weight,
        semester: test.semester,
        status: test.status as TestStatus,
        gradeId: test.grade_id,
        createdAt: test.created_at,
        updatedAt: test.updated_at
      }));

      this.scheduledTestsSubject.next(tests);
    } catch (error) {
      console.error('Error loading scheduled tests:', error);
    }
  }

  async addScheduledTest(test: Omit<ScheduledTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) return false;

      const { data, error } = await this.supabase.client
        .from('scheduled_tests')
        .insert({
          user_id: user.id, // Use actual user ID instead of test.userId
          subject_id: test.subjectId,
          title: test.title,
          description: test.description,
          test_type: test.testType,
          scheduled_date: test.scheduledDate,
          duration: test.duration,
          weight: test.weight,
          semester: test.semester,
          status: test.status,
          grade_id: test.gradeId
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding scheduled test:', error);
        // If table doesn't exist, show helpful message
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn('scheduled_tests table does not exist yet. Please run the migration first.');
        }
        return false;
      }

      await this.loadScheduledTests();
      return true;
    } catch (error) {
      console.error('Error adding scheduled test:', error);
      return false;
    }
  }

  async updateScheduledTest(testId: string, updates: Partial<ScheduledTest>): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('scheduled_tests')
        .update({
          title: updates.title,
          description: updates.description,
          test_type: updates.testType,
          scheduled_date: updates.scheduledDate,
          duration: updates.duration,
          weight: updates.weight,
          semester: updates.semester,
          status: updates.status,
          grade_id: updates.gradeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) {
        console.error('Error updating scheduled test:', error);
        return false;
      }

      await this.loadScheduledTests();
      return true;
    } catch (error) {
      console.error('Error updating scheduled test:', error);
      return false;
    }
  }

  async deleteScheduledTest(testId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('scheduled_tests')
        .delete()
        .eq('id', testId);

      if (error) {
        console.error('Error deleting scheduled test:', error);
        return false;
      }

      await this.loadScheduledTests();
      return true;
    } catch (error) {
      console.error('Error deleting scheduled test:', error);
      return false;
    }
  }

  async convertTestToGrade(testId: string, gradeValue: number): Promise<boolean> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) return false;

      const tests = this.scheduledTestsSubject.value;
      const test = tests.find(t => t.id === testId);
      if (!test) return false;

      // Create grade
      const grade: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.id,
        subjectId: test.subjectId,
        type: test.testType === TestType.EXAM ? GradeType.EXAM : GradeType.INDIVIDUAL,
        value: gradeValue,
        semester: test.semester,
        name: test.title,
        weight: test.weight,
        dateTaken: test.scheduledDate,
        description: test.description,
        duration: test.duration?.toString()
      };

      const { data: gradeData, error: gradeError } = await this.supabase.client
        .from('grades')
        .insert({
          user_id: grade.userId,
          subject_id: grade.subjectId,
          type: grade.type,
          value: grade.value,
          semester: grade.semester,
          name: grade.name,
          weight: grade.weight,
          date_taken: grade.dateTaken,
          description: grade.description,
          duration: grade.duration
        })
        .select()
        .single();

      if (gradeError) {
        console.error('Error creating grade:', gradeError);
        return false;
      }

      // Update test status and link to grade
      await this.updateScheduledTest(testId, {
        status: TestStatus.COMPLETED,
        gradeId: gradeData.id
      });

      return true;
    } catch (error) {
      console.error('Error converting test to grade:', error);
      return false;
    }
  }

  getUpcomingTests(days: number = 7): ScheduledTest[] {
    const tests = this.scheduledTestsSubject.value;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return tests.filter(test => {
      const testDate = new Date(test.scheduledDate);
      return test.status === TestStatus.SCHEDULED && 
             testDate >= now && 
             testDate <= futureDate;
    }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  getTestsBySubject(subjectId: string): ScheduledTest[] {
    return this.scheduledTestsSubject.value.filter(test => test.subjectId === subjectId);
  }

  getTestsByMonth(year: number, month: number): ScheduledTest[] {
    return this.scheduledTestsSubject.value.filter(test => {
      const testDate = new Date(test.scheduledDate);
      return testDate.getFullYear() === year && testDate.getMonth() === month;
    });
  }

  isDateAvailable(date: string): boolean {
    const tests = this.scheduledTestsSubject.value;
    const targetDate = new Date(date).toDateString();
    
    return !tests.some(test => {
      const testDate = new Date(test.scheduledDate).toDateString();
      return testDate === targetDate && test.status === TestStatus.SCHEDULED;
    });
  }

  formatTestType(type: TestType): string {
    const typeMap = {
      [TestType.EXAM]: 'Prüfung',
      [TestType.TEST]: 'Test',
      [TestType.PRESENTATION]: 'Präsentation',
      [TestType.PROJECT]: 'Projekt',
      [TestType.HOMEWORK]: 'Hausaufgabe'
    };
    return typeMap[type] || type;
  }

  getTestTypeColor(type: TestType): string {
    const colorMap = {
      [TestType.EXAM]: 'bg-red-100 text-red-800',
      [TestType.TEST]: 'bg-blue-100 text-blue-800',
      [TestType.PRESENTATION]: 'bg-purple-100 text-purple-800',
      [TestType.PROJECT]: 'bg-green-100 text-green-800',
      [TestType.HOMEWORK]: 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  }
}
