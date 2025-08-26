import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';
import { BMCalculationService } from '../../services/bm-calculation.service';
import { TestCalendarService } from '../../services/test-calendar.service';
import { PageLayoutComponent } from '../shared/layout/page-layout.component';
import { BMType, StudyMode, BMTypeFactory, ScheduledTest, TestStatus } from '../../models/bm-domain.models';

interface User {
  id: string;
  email: string;
  username?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  bmSettings: any = null;
  bmTypeInstance: any = null;
  upcomingTests: ScheduledTest[] = [];
  overallGrade = 0;
  passingStatus: any = { passed: false, issues: [] };

  constructor(
    private supabaseService: SupabaseService,
    private bmCalculationService: BMCalculationService,
    private testCalendarService: TestCalendarService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.supabaseService.user$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadDashboardData();
      }
    });

    this.testCalendarService.scheduledTests$.subscribe(tests => {
      this.upcomingTests = this.testCalendarService.getUpcomingTests(7);
    });
  }

  async loadDashboardData(): Promise<void> {
    try {
      await this.loadBMSettings();
      if (this.bmSettings) {
        await this.initializeBMType();
        await this.loadGradesAndCalculate();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  private async loadBMSettings(): Promise<void> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) return;

    const { data, error } = await this.supabaseService.client
      .from('bm_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      this.bmSettings = {
        bmType: data.bm_type as BMType,
        studyMode: data.study_mode as StudyMode
      };
    }
  }

  private async initializeBMType(): Promise<void> {
    if (!this.bmSettings) return;
    
    this.bmTypeInstance = BMTypeFactory.create(
      this.bmSettings.bmType,
      this.bmSettings.studyMode
    );
    this.bmCalculationService.initializeBMType(this.bmSettings.bmType, this.bmSettings.studyMode);
  }

  private async loadGradesAndCalculate(): Promise<void> {
    // Load grades from database and calculate
    const user = await this.supabaseService.getCurrentUser();
    if (!user) return;

    const { data: grades } = await this.supabaseService.client
      .from('grades')
      .select('*')
      .eq('user_id', user.id);

    if (grades && this.bmTypeInstance) {
      this.overallGrade = this.bmTypeInstance.calculateOverallGrade(grades);
      this.passingStatus = this.calculatePassingRequirements(grades);
    }
  }

  getBMTypeName(): string {
    return this.bmTypeInstance?.name || 'Nicht konfiguriert';
  }

  getStudyModeName(): string {
    if (!this.bmSettings) return '';
    return this.bmSettings.studyMode === StudyMode.FULLTIME ? 'Vollzeit' : 'Teilzeit';
  }

  calculatePassingRequirements(grades: any[]): any {
    // Simple passing requirements calculation
    const finalGrades = this.bmTypeInstance?.subjects.map((subject: any) => {
      const subjectGrades = grades.filter(g => g.subject_id === subject.id);
      return subject.calculateFinalGrade(subjectGrades);
    }).filter((grade: number) => grade > 0) || [];

    const insufficientGrades = finalGrades.filter((grade: number) => grade < 4).length;
    const overallGrade = finalGrades.length > 0 ? finalGrades.reduce((sum: number, grade: number) => sum + grade, 0) / finalGrades.length : 0;
    
    return {
      passed: overallGrade >= 4 && insufficientGrades <= 2,
      issues: insufficientGrades > 2 ? [`${insufficientGrades} ungenügende Noten`] : [],
      overallGrade,
      insufficientGrades
    };
  }

  formatGrade(grade: number): string {
    return grade > 0 ? grade.toFixed(1) : '-';
  }

  getGradeColor(grade: number): string {
    if (grade >= 5.5) return 'text-green-600';
    if (grade >= 4.0) return 'text-blue-600';
    if (grade >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  }

  formatTestType(type: any): string {
    return this.testCalendarService.formatTestType(type);
  }

  getTestTypeColor(type: any): string {
    return this.testCalendarService.getTestTypeColor(type);
  }

  getSubjectName(subjectId: string): string {
    if (!this.bmTypeInstance) return subjectId;
    const subject = this.bmTypeInstance.subjects.find((s: any) => s.id === subjectId);
    return subject ? subject.name : subjectId;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSubjectsWithGradesCount(): number {
    // Count subjects that have at least one grade
    if (!this.bmTypeInstance) return 0;
    // This would need to be implemented based on loaded grades
    return 0;
  }

  getTotalSubjectsCount(): number {
    return this.bmTypeInstance?.subjects?.length || 0;
  }

  getDaysUntilTest(dateStr: string): string {
    const testDate = new Date(dateStr);
    const today = new Date();
    const diffTime = testDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Morgen';
    if (diffDays > 1) return `in ${diffDays} Tagen`;
    return 'Überfällig';
  }
}
