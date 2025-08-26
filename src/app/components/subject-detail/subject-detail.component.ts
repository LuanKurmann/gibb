import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';
import { PageLayoutComponent } from '../shared/layout/page-layout.component';

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  hasExam: boolean;
  isCore: boolean;
  isSpecial?: boolean; // For IDPA/IDAF special subjects
  partTimeSubjects?: PartTimeSubject[]; // For subjects with different part-time components
}

export interface PartTimeSubject {
  id: string;
  name: string;
  shortName: string;
  weight: number; // Percentage weight (0-1)
  semesters: number[]; // Which semesters this subject is taught
}

export interface Grade {
  id?: string;
  userId: string;
  subjectId: string;
  type: 'individual' | 'exam' | 'semester_average' | 'experience' | 'final';
  value: number;
  semester?: number;
  name?: string;
  weight?: number;
  date_taken?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.css']
})
export class SubjectDetailComponent implements OnInit {
  @Input() subject?: Subject;
  @Input() grades: Grade[] = [];
  @Output() back = new EventEmitter<void>();
  @Output() gradeAdded = new EventEmitter<void>();

  // Route-based properties
  subjectId: string = '';
  bmTypes: any[] = [];
  selectedBMType: any = null;
  isRouteMode: boolean = false;
  studyMode: 'fulltime' | 'parttime' = 'fulltime';

  currentView: 'overview' | 'add-grade' = 'overview';
  
  // Form data
  gradeType: 'individual' | 'exam' | 'project' = 'individual';
  gradeValue: number = 4.0;
  gradeName: string = '';
  gradeWeight: number = 1.0;
  semester: number = 1;
  dateTaken: string = '';
  projectDescription: string = '';
  projectDuration: string = '';
  selectedPartTimeComponent: string = ''; // For Chemistry/Physics selection

  constructor(
    private supabaseService: SupabaseService,
    public i18n: I18nService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    // Set default date to today
    this.dateTaken = new Date().toISOString().split('T')[0];
    
    // Check if we're in route mode (accessed via router)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isRouteMode = true;
        this.subjectId = params['id'];
        this.loadSubjectData();
      }
    });
  }

  goBack() {
    if (this.isRouteMode) {
      this.router.navigate(['/bm-grades']);
    } else {
      this.back.emit();
    }
  }

  openAddGrade() {
    this.currentView = 'add-grade';
    this.resetForm();
  }

  closeAddGrade() {
    this.currentView = 'overview';
    this.resetForm();
  }

  resetForm() {
    this.gradeType = this.subject?.isSpecial ? 'project' : 'individual';
    this.gradeValue = 4.0;
    this.gradeName = '';
    this.gradeWeight = 1.0;
    this.semester = 1;
    this.dateTaken = new Date().toISOString().split('T')[0];
    this.projectDescription = '';
    this.projectDuration = '';
    this.selectedPartTimeComponent = this.getDefaultPartTimeComponent();
  }

  getDefaultPartTimeComponent(): string {
    if (this.isPartTimeSubject()) {
      return this.subject?.partTimeSubjects?.[0]?.id || '';
    }
    return '';
  }

  isPartTimeSubject(): boolean {
    return this.subject?.partTimeSubjects && this.subject.partTimeSubjects.length > 0 || false;
  }

  isSpecialSubject(): boolean {
    return this.subject?.isSpecial || false;
  }

  async loadSubjectData() {
    const user = this.supabaseService.getCurrentUser();
    if (!user) {
      console.error('No user found in loadSubjectData');
      return;
    }

    try {
      // Load BM settings to get subject definitions
      const { data: bmSettings, error: settingsError } = await this.supabaseService.client
        .from('bm_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError) {
        console.error('Error loading BM settings:', settingsError);
        return;
      }

      if (bmSettings) {
        // Define BM types (same as in BMGradesComponent)
        this.bmTypes = [
          {
            id: 'tals',
            name: 'BM 2 Technik, Architektur, Life Sciences (TALS)',
            subjects: [
              { id: 'd', name: 'Deutsch', shortName: 'D', hasExam: true, isCore: true },
              { id: 'f', name: 'Französisch', shortName: 'F', hasExam: true, isCore: true },
              { id: 'e', name: 'Englisch', shortName: 'E', hasExam: true, isCore: true },
              { id: 'm-g', name: 'Mathematik Grundlagen', shortName: 'M-G', hasExam: true, isCore: true },
              { id: 'm-s', name: 'Mathematik Schwerpunkt', shortName: 'M-S', hasExam: true, isCore: true },
              { 
                id: 'nw', 
                name: 'Naturwissenschaften', 
                shortName: 'NW', 
                hasExam: true, 
                isCore: true,
                partTimeSubjects: [
                  { id: 'nw-chemie', name: 'Chemie', shortName: 'CH', weight: 0.33, semesters: [1] },
                  { id: 'nw-physik', name: 'Physik', shortName: 'PH', weight: 0.67, semesters: [1, 2] }
                ]
              },
              { id: 'gp', name: 'Geschichte & Politik', shortName: 'GP', hasExam: true, isCore: true },
              { id: 'wr', name: 'Wirtschaft & Recht', shortName: 'WR', hasExam: true, isCore: true },
              { id: 'idpa', name: 'Interdisziplinäre Projektarbeit', shortName: 'IDPA', hasExam: false, isCore: false, isSpecial: true },
              { id: 'idaf', name: 'Interdisziplinäre Arbeit in den Fächern', shortName: 'IDAF', hasExam: false, isCore: false, isSpecial: true }
            ]
          },
          {
            id: 'wd-d',
            name: 'BM 2 Dienstleistungen (WD-D)',
            subjects: [
              { id: 'd', name: 'Deutsch', shortName: 'D', hasExam: true, isCore: true },
              { id: 'f', name: 'Französisch', shortName: 'F', hasExam: true, isCore: true },
              { id: 'e', name: 'Englisch', shortName: 'E', hasExam: true, isCore: true },
              { id: 'm', name: 'Mathematik', shortName: 'M', hasExam: true, isCore: true },
              { id: 'fr', name: 'Finanz- & Rechnungswesen', shortName: 'FR', hasExam: true, isCore: true },
              { id: 'wr', name: 'Wirtschaft & Recht Schwerpunkt', shortName: 'WR', hasExam: true, isCore: true },
              { id: 'wr-e', name: 'Wirtschaft & Recht Ergänzung', shortName: 'WR-E', hasExam: false, isCore: false },
              { id: 'gp', name: 'Geschichte & Politik', shortName: 'GP', hasExam: true, isCore: true },
              { id: 'idpa', name: 'Interdisziplinäre Projektarbeit', shortName: 'IDPA', hasExam: false, isCore: false, isSpecial: true },
              { id: 'idaf', name: 'Interdisziplinäre Arbeit in den Fächern', shortName: 'IDAF', hasExam: false, isCore: false, isSpecial: true }
            ]
          },
          {
            id: 'arte',
            name: 'BM 2 Gestaltung & Kunst (ARTE)',
            subjects: [
              { id: 'd', name: 'Deutsch', shortName: 'D', hasExam: true, isCore: true },
              { id: 'f', name: 'Französisch', shortName: 'F', hasExam: true, isCore: true },
              { id: 'e', name: 'Englisch', shortName: 'E', hasExam: true, isCore: true },
              { id: 'm', name: 'Mathematik', shortName: 'M', hasExam: true, isCore: true },
              { id: 'gkk', name: 'Gestaltung / Kunst / Kultur', shortName: 'GKK', hasExam: true, isCore: true },
              { id: 'ik', name: 'Information & Kommunikation', shortName: 'IK', hasExam: true, isCore: true },
              { id: 'gp', name: 'Geschichte & Politik', shortName: 'GP', hasExam: true, isCore: true },
              { id: 'tu', name: 'Technik & Umwelt', shortName: 'TU', hasExam: true, isCore: true },
              { id: 'idpa', name: 'Interdisziplinäre Projektarbeit', shortName: 'IDPA', hasExam: false, isCore: false, isSpecial: true },
              { id: 'idaf', name: 'Interdisziplinäre Arbeit in den Fächern', shortName: 'IDAF', hasExam: false, isCore: false, isSpecial: true }
            ]
          },
          {
            id: 'gesundheit',
            name: 'BM 2 Gesundheit & Soziales',
            subjects: [
              { id: 'd', name: 'Deutsch', shortName: 'D', hasExam: true, isCore: true },
              { id: 'f', name: 'Französisch', shortName: 'F', hasExam: true, isCore: true },
              { id: 'e', name: 'Englisch', shortName: 'E', hasExam: true, isCore: true },
              { id: 'm', name: 'Mathematik', shortName: 'M', hasExam: true, isCore: true },
              { id: 'sw', name: 'Sozialwissenschaften', shortName: 'SW', hasExam: true, isCore: true },
              { id: 'nw', name: 'Naturwissenschaften', shortName: 'NW', hasExam: true, isCore: true },
              { id: 'gp', name: 'Geschichte & Politik', shortName: 'GP', hasExam: true, isCore: true },
              { id: 'wr', name: 'Wirtschaft & Recht', shortName: 'WR', hasExam: true, isCore: true },
              { id: 'idpa', name: 'Interdisziplinäre Projektarbeit', shortName: 'IDPA', hasExam: false, isCore: false, isSpecial: true },
              { id: 'idaf', name: 'Interdisziplinäre Arbeit in den Fächern', shortName: 'IDAF', hasExam: false, isCore: false, isSpecial: true }
            ]
          }
        ];

        this.selectedBMType = this.bmTypes.find(type => type.id === bmSettings.bm_type);
        this.studyMode = bmSettings.study_mode || 'fulltime';
        if (this.selectedBMType) {
          this.subject = this.selectedBMType.subjects.find((s: any) => s.id === this.subjectId);
        }
      }

      // Load grades for this subject
      await this.loadGrades();
    } catch (error) {
      console.error('Error loading subject data:', error);
    }
  }

  async loadGrades() {
    const user = this.supabaseService.getCurrentUser();
    if (!user || !this.subject) return;

    try {
      const { data, error } = await this.supabaseService.client
        .from('grades')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject_id', this.subject.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        this.grades = data.map(grade => ({
          id: grade.id,
          userId: grade.user_id,
          subjectId: grade.subject_id,
          type: grade.type,
          value: grade.value,
          semester: grade.semester,
          name: grade.name,
          weight: grade.weight,
          date_taken: grade.date_taken,
          createdAt: grade.created_at
        }));
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  }

  async addGrade() {
    const user = this.supabaseService.getCurrentUser();
    if (!user) {
      console.error('No authenticated user found');
      alert('Bitte melden Sie sich an, um Noten hinzuzufügen.');
      return;
    }

    try {
      if (!this.subject) {
        console.error('No subject selected. subjectId:', this.subjectId, 'selectedBMType:', this.selectedBMType);
        alert('Kein Fach ausgewählt. Bitte laden Sie die Seite neu.');
        return;
      }

      // Validate grade value
      if (this.gradeValue < 1.0 || this.gradeValue > 6.0) {
        console.error('Invalid grade value:', this.gradeValue);
        alert('Grade value must be between 1.0 and 6.0');
        return;
      }

      const gradeData: any = {
        user_id: user.id,
        subject_id: this.isPartTimeSubject() && this.selectedPartTimeComponent ? this.selectedPartTimeComponent : this.subject.id,
        type: this.gradeType,
        value: this.gradeValue,
        date_taken: this.dateTaken
      };

      if (this.gradeType === 'individual') {
        gradeData.name = this.gradeName || 'Unnamed Grade';
        gradeData.weight = this.gradeWeight;
        gradeData.semester = this.semester;
      } else if (this.gradeType === 'project') {
        gradeData.name = this.gradeName || 'Projektarbeit';
        gradeData.description = this.projectDescription;
        gradeData.duration = this.projectDuration;
        gradeData.type = 'individual'; // Store as individual but with project metadata
      }

      console.log('Attempting to insert grade data:', gradeData);

      const { data, error } = await this.supabaseService.client
        .from('grades')
        .insert(gradeData)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        alert(`Error adding grade: ${error.message}`);
        return;
      }

      console.log('Grade added successfully:', data);

      if (this.isRouteMode) {
        await this.loadGrades();
      } else {
        this.gradeAdded.emit();
      }
      this.closeAddGrade();
    } catch (error: any) {
      console.error('Error adding grade:', error);
      alert(`Unexpected error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async deleteGrade(gradeId: string) {
    if (!confirm(this.i18n.t('bmGrades.confirmDelete'))) return;

    try {
      const { error } = await this.supabaseService.client
        .from('grades')
        .delete()
        .eq('id', gradeId);

      if (!error) {
        // Remove grade from local array immediately
        this.grades = this.grades.filter(grade => grade.id !== gradeId);
        
        if (this.isRouteMode) {
          // In route mode, we manage our own grades array
          console.log('Grade deleted successfully');
        } else {
          // In component mode, notify parent to reload
          this.gradeAdded.emit();
        }
      } else {
        console.error('Error deleting grade:', error);
        alert(`Error deleting grade: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error deleting grade:', error);
      alert(`Unexpected error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  getIndividualGrades(): Grade[] {
    return this.grades.filter(g => g.type === 'individual');
  }

  getExamGrade(): Grade | null {
    return this.grades.find(g => g.type === 'exam') || null;
  }

  getGradesByType(type: string): Grade[] {
    return this.grades.filter(g => g.type === type);
  }

  getGradesBySemester(semester: number): Grade[] {
    return this.grades.filter(g => g.semester === semester && g.type === 'individual');
  }

  calculateSemesterAverage(semester: number): number {
    const semesterGrades = this.getGradesBySemester(semester);
    if (semesterGrades.length === 0) return 0;

    const totalWeight = semesterGrades.reduce((sum, grade) => sum + (grade.weight || 1), 0);
    const weightedSum = semesterGrades.reduce((sum, grade) => sum + (grade.value * (grade.weight || 1)), 0);
    
    return Math.round((weightedSum / totalWeight) * 2) / 2; // Round to half grades
  }

  calculateExperienceGrade(): number {
    const semesterAverages = [];
    for (let i = 1; i <= 4; i++) {
      const avg = this.calculateSemesterAverage(i);
      if (avg > 0) semesterAverages.push(avg);
    }
    
    if (semesterAverages.length === 0) return 0;
    
    const sum = semesterAverages.reduce((acc, avg) => acc + avg, 0);
    return Math.round((sum / semesterAverages.length) * 2) / 2;
  }

  calculateFinalGrade(): number {
    const experienceGrade = this.calculateExperienceGrade();
    
    if (!this.subject?.hasExam || !this.subject?.isCore) {
      return experienceGrade;
    }

    const examGrade = this.getExamGrade();
    if (!examGrade) return experienceGrade;

    return Math.round(((experienceGrade + examGrade.value) / 2) * 2) / 2;
  }

  getGradeColorClass(grade: number): string {
    return grade >= 4.0 ? 'text-green-600' : 'text-red-600';
  }

  getGradeBadgeClass(grade: number): string {
    return grade >= 4.0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }
}
