import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseSubject, Grade, GradeType, StudyMode } from '../../../models/bm-domain.models';
import { BMCalculationService } from '../../../services/bm-calculation.service';
import { SupabaseService } from '../../../services/supabase.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-natural-science-subject',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './natural-science-subject.component.html',
  styleUrls: ['./natural-science-subject.component.css']
})
export class NaturalScienceSubjectComponent implements OnInit {
  @Input() subject!: BaseSubject;
  @Input() grades: Grade[] = [];
  @Input() studyMode: StudyMode = StudyMode.FULLTIME;
  @Output() gradeAdded = new EventEmitter<void>();
  @Output() gradeDeleted = new EventEmitter<string>();

  // Form data
  showAddForm = false;
  gradeValue = 4.0;
  gradeName = '';
  gradeWeight = 1.0;
  semester = 1;
  dateTaken = '';
  gradeType: GradeType = GradeType.INDIVIDUAL;
  selectedSubSubject = 'chemie'; // For part-time mode

  // Available grade types and sub-subjects
  GradeType = GradeType;
  StudyMode = StudyMode;

  constructor(
    private calculationService: BMCalculationService,
    private supabaseService: SupabaseService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.dateTaken = new Date().toISOString().split('T')[0];
  }

  get isPartTime(): boolean {
    return this.studyMode === StudyMode.PARTTIME;
  }

  get subjectGrades(): Grade[] {
    return this.calculationService.getGradesForSubject(this.subject.id, this.grades);
  }

  get chemieGrades(): Grade[] {
    return this.grades.filter(g => g.subjectId === 'chemie');
  }

  get physikGrades(): Grade[] {
    return this.grades.filter(g => g.subjectId === 'physik');
  }

  get individualGrades(): Grade[] {
    return this.subjectGrades.filter(g => g.type === GradeType.INDIVIDUAL);
  }

  get examGrade(): Grade | null {
    return this.subjectGrades.find(g => g.type === GradeType.EXAM) || null;
  }

  get experienceGrade(): number {
    if (this.isPartTime) {
      return this.calculationService.calculateNaturalScienceGrade(this.grades);
    }
    return this.calculationService.calculateSubjectExperienceGrade(this.subject.id, this.grades);
  }

  get finalGrade(): number {
    return this.calculationService.calculateSubjectFinalGrade(this.subject.id, this.grades);
  }

  get chemieAverage(): number {
    if (this.chemieGrades.length === 0) return 0;
    const total = this.chemieGrades.reduce((sum, grade) => sum + grade.value, 0);
    return Math.round((total / this.chemieGrades.length) * 2) / 2;
  }

  get physikAverage(): number {
    if (this.physikGrades.length === 0) return 0;
    const total = this.physikGrades.reduce((sum, grade) => sum + grade.value, 0);
    return Math.round((total / this.physikGrades.length) * 2) / 2;
  }

  get semesterAverages() {
    return this.calculationService.getSemesterAverages(this.subject.id, this.grades);
  }

  openAddForm() {
    this.showAddForm = true;
    this.resetForm();
  }

  closeAddForm() {
    this.showAddForm = false;
    this.resetForm();
  }

  resetForm() {
    this.gradeValue = 4.0;
    this.gradeName = '';
    this.gradeWeight = 1.0;
    this.semester = 1;
    this.dateTaken = new Date().toISOString().split('T')[0];
    this.gradeType = GradeType.INDIVIDUAL;
    this.selectedSubSubject = 'chemie';
  }

  async addGrade() {
    const user = this.supabaseService.getCurrentUser();
    if (!user) {
      alert('Bitte melden Sie sich an, um Noten hinzuzufügen.');
      return;
    }

    // For part-time mode, use the selected sub-subject
    const subjectId = this.isPartTime ? this.selectedSubSubject : this.subject.id;

    const validationErrors = this.calculationService.validateGrade({
      value: this.gradeValue,
      subjectId: subjectId,
      type: this.gradeType,
      semester: this.gradeType === GradeType.INDIVIDUAL ? this.semester : undefined,
      weight: this.gradeWeight
    });

    if (validationErrors.length > 0) {
      alert('Fehler: ' + validationErrors.join(', '));
      return;
    }

    try {
      const gradeData: any = {
        user_id: user.id,
        subject_id: subjectId,
        type: this.gradeType,
        value: this.gradeValue,
        date_taken: this.dateTaken
      };

      if (this.gradeType === GradeType.INDIVIDUAL) {
        gradeData.name = this.gradeName || 'Einzelnote';
        gradeData.weight = this.gradeWeight;
        gradeData.semester = this.semester;
      } else if (this.gradeType === GradeType.EXAM) {
        gradeData.name = 'Prüfungsnote';
      }

      const { error } = await this.supabaseService.client
        .from('grades')
        .insert(gradeData);

      if (error) {
        console.error('Supabase error:', error);
        alert(`Fehler beim Hinzufügen der Note: ${error.message}`);
        return;
      }

      this.gradeAdded.emit();
      this.closeAddForm();
    } catch (error: any) {
      console.error('Error adding grade:', error);
      alert(`Unerwarteter Fehler: ${error.message || 'Unbekannter Fehler'}`);
    }
  }

  async deleteGrade(gradeId: string) {
    if (!confirm('Sind Sie sicher, dass Sie diese Note löschen möchten?')) return;

    try {
      const { error } = await this.supabaseService.client
        .from('grades')
        .delete()
        .eq('id', gradeId);

      if (error) {
        console.error('Error deleting grade:', error);
        alert(`Fehler beim Löschen: ${error.message}`);
        return;
      }

      this.gradeDeleted.emit(gradeId);
    } catch (error: any) {
      console.error('Error deleting grade:', error);
      alert(`Unerwarteter Fehler: ${error.message || 'Unbekannter Fehler'}`);
    }
  }

  getGradesBySubject(subjectId: string): Grade[] {
    return this.grades.filter(g => g.subjectId === subjectId);
  }

  getGradesByType(type: GradeType): Grade[] {
    return this.subjectGrades.filter(g => g.type === type);
  }

  getGradesBySemester(semester: number): Grade[] {
    return this.individualGrades.filter(g => g.semester === semester);
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

  getSubSubjectName(subjectId: string): string {
    switch (subjectId) {
      case 'chemie': return 'Chemie';
      case 'physik': return 'Physik';
      default: return subjectId;
    }
  }
}
