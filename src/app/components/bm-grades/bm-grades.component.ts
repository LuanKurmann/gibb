import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';
import { PageLayoutComponent } from '../shared/layout/page-layout.component';
import { StandardSubjectComponent } from '../subjects/standard-subject/standard-subject.component';
import { NaturalScienceSubjectComponent } from '../subjects/natural-science-subject/natural-science-subject.component';
import { IDASubjectComponent } from '../subjects/ida-subject/ida-subject.component';
import { BMCalculationService, PassingRequirements } from '../../services/bm-calculation.service';
import { 
  BaseBMType, 
  BaseSubject, 
  Grade, 
  BMType, 
  StudyMode, 
  BMTypeFactory,
  SubjectType 
} from '../../models/bm-domain.models';

export interface BMSettings {
  userId: string;
  bmType: string;
  studyMode: 'fulltime' | 'parttime';
}

@Component({
  selector: 'app-bm-grades',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    PageLayoutComponent,
    StandardSubjectComponent,
    NaturalScienceSubjectComponent,
    IDASubjectComponent
  ],
  templateUrl: './bm-grades.component.html',
  styleUrls: ['./bm-grades.component.css']
})
export class BMGradesComponent implements OnInit {
  // Domain model properties
  bmTypeInstance: BaseBMType | null = null;
  selectedBMType: BMType | null = null;
  studyMode: StudyMode = StudyMode.FULLTIME;
  grades: Grade[] = [];
  
  // UI state
  currentView: 'overview' | 'subject-detail' = 'overview';
  selectedSubjectForDetail: BaseSubject | null = null;
  
  // Available BM types for selection
  availableBMTypes = [
    { id: BMType.TALS, name: 'BM 2 Technik, Architektur, Life Sciences (TALS)' },
    { id: BMType.WD_D, name: 'BM 2 Dienstleistungen (WD-D)' },
    { id: BMType.ARTE, name: 'BM 2 Gestaltung & Kunst (ARTE)' },
    { id: BMType.GESUNDHEIT, name: 'BM 2 Gesundheit & Soziales' }
  ];
  
  // Enums for template access
  BMType = BMType;
  StudyMode = StudyMode;
  SubjectType = SubjectType;

  constructor(
    private supabaseService: SupabaseService,
    public i18n: I18nService,
    private router: Router,
    private calculationService: BMCalculationService
  ) {}

  async ngOnInit() {
    await this.loadBMSettings();
    await this.loadGrades();
  }

  async loadBMSettings() {
    const user = this.supabaseService.getCurrentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabaseService.client
        .from('bm_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        this.selectedBMType = data.bm_type as BMType;
        this.studyMode = data.study_mode as StudyMode || StudyMode.FULLTIME;
        
        // Initialize the domain model
        if (this.selectedBMType) {
          this.initializeBMType(this.selectedBMType, this.studyMode);
        }
      }
    } catch (error) {
      console.error('Error loading BM settings:', error);
    }
  }

  // Initialize BM Type with domain model
  initializeBMType(bmType: BMType, studyMode: StudyMode) {
    this.calculationService.initializeBMType(bmType, studyMode);
    this.bmTypeInstance = this.calculationService.getBMType();
  }

  navigateToSubject(subjectId: string) {
    this.router.navigate(['/bm-grades/subject', subjectId]);
  }

  getSubjectsForCurrentBMType(): BaseSubject[] {
    return this.bmTypeInstance?.subjects || [];
  }

  calculateSubjectFinalGrade(subjectId: string): number {
    return this.calculationService.calculateSubjectFinalGrade(subjectId, this.grades);
  }

  calculateSubjectExperienceGrade(subjectId: string): number {
    return this.calculationService.calculateSubjectExperienceGrade(subjectId, this.grades);
  }

  openSubjectDetail(subject: BaseSubject) {
    this.selectedSubjectForDetail = subject;
    this.currentView = 'subject-detail';
  }

  backToOverview() {
    this.currentView = 'overview';
    this.selectedSubjectForDetail = null;
  }

  getSubjectGradeCount(subjectId: string): number {
    return this.calculationService.getGradesForSubject(subjectId, this.grades).length;
  }

  async loadGrades() {
    const user = this.supabaseService.getCurrentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabaseService.client
        .from('grades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        this.grades = data.map(grade => ({
          ...grade,
          userId: grade.user_id,
          subjectId: grade.subject_id
        }));
        console.log('Loaded grades:', this.grades);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  }

  async saveBMSettings() {
    const user = this.supabaseService.getCurrentUser();
    if (!user || !this.selectedBMType) return;

    try {
      const { error } = await this.supabaseService.client
        .from('bm_settings')
        .upsert({
          user_id: user.id,
          bm_type: this.selectedBMType,
          study_mode: this.studyMode
        }, {
          onConflict: 'user_id'
        });

      if (!error) {
        console.log('BM settings saved successfully');
        // Initialize domain model after saving
        this.initializeBMType(this.selectedBMType, this.studyMode);
      } else {
        console.error('Supabase error:', error);
      }
    } catch (error) {
      console.error('Error saving BM settings:', error);
    }
  }

  // Grade management is now handled by individual subject components
  onGradeAdded() {
    this.loadGrades();
  }

  onGradeDeleted(gradeId: string) {
    this.grades = this.grades.filter(g => g.id !== gradeId);
  }

  getSubjectGrades(subjectId: string): Grade[] {
    return this.calculationService.getGradesForSubject(subjectId, this.grades);
  }

  calculateOverallGrade(): number {
    return this.calculationService.calculateOverallGrade(this.grades);
  }

  checkPassingRequirements(): PassingRequirements {
    return this.calculationService.checkPassingRequirements(this.grades);
  }

  getSubjectsWithGradesCount(): number {
    if (!this.bmTypeInstance) return 0;
    return this.bmTypeInstance.subjects.filter(subject => 
      this.grades.some(grade => grade.subjectId === subject.id)
    ).length;
  }

  // Helper method to determine which component to use for a subject
  getSubjectComponentType(subject: BaseSubject): 'standard' | 'natural-science' | 'ida' {
    if (subject.type === SubjectType.IDA) {
      return 'ida';
    }
    if (subject.type === SubjectType.NATURAL_SCIENCE) {
      return 'natural-science';
    }
    return 'standard';
  }

  getGradeColorClass(grade: number): string {
    return this.calculationService.getGradeColorClass(grade);
  }

  getGradeBadgeClass(grade: number): string {
    return this.calculationService.getGradeBadgeClass(grade);
  }

  formatGrade(grade: number): string {
    return this.calculationService.formatGrade(grade);
  }
}
