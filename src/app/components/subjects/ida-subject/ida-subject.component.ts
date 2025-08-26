import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseSubject, Grade, GradeType, SubjectType } from '../../../models/bm-domain.models';
import { BMCalculationService } from '../../../services/bm-calculation.service';
import { SupabaseService } from '../../../services/supabase.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-ida-subject',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ida-subject.component.html',
  styleUrls: ['./ida-subject.component.css']
})
export class IDASubjectComponent implements OnInit {
  @Input() subject!: BaseSubject;
  @Input() grades: Grade[] = [];
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
  selectedSubject = 'idaf'; // 'idaf' or 'idpa'

  // Available grade types
  GradeType = GradeType;
  SubjectType = SubjectType;

  constructor(
    private calculationService: BMCalculationService,
    private supabaseService: SupabaseService,
    public i18n: I18nService
  ) {}

  ngOnInit() {
    this.dateTaken = new Date().toISOString().split('T')[0];
  }

  get idafGrades(): Grade[] {
    return this.grades.filter(g => g.subjectId === 'idaf');
  }

  get idpaGrades(): Grade[] {
    return this.grades.filter(g => g.subjectId === 'idpa');
  }

  get idafAverage(): number {
    if (this.idafGrades.length === 0) return 0;
    const total = this.idafGrades.reduce((sum, grade) => sum + grade.value, 0);
    return Math.round((total / this.idafGrades.length) * 2) / 2;
  }

  get idpaGrade(): number {
    // IDPA is typically a single final project grade
    const idpaGrade = this.idpaGrades.find(g => g.type === GradeType.INDIVIDUAL);
    return idpaGrade ? idpaGrade.value : 0;
  }

  get idaGrade(): number {
    return this.calculationService.calculateIDAGrade(this.grades);
  }

  get hasIdafGrades(): boolean {
    return this.idafGrades.length > 0;
  }

  get hasIdpaGrade(): boolean {
    return this.idpaGrades.length > 0;
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
    this.selectedSubject = 'idaf';
  }

  async addGrade() {
    const user = this.supabaseService.getCurrentUser();
    if (!user) {
      alert('Bitte melden Sie sich an, um Noten hinzuzufügen.');
      return;
    }

    // Validate IDPA - only one grade allowed
    if (this.selectedSubject === 'idpa' && this.idpaGrades.length > 0) {
      alert('Für IDPA ist nur eine Note erlaubt. Bitte löschen Sie die bestehende Note zuerst.');
      return;
    }

    const validationErrors = this.calculationService.validateGrade({
      value: this.gradeValue,
      subjectId: this.selectedSubject,
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
        subject_id: this.selectedSubject,
        type: this.gradeType,
        value: this.gradeValue,
        date_taken: this.dateTaken
      };

      if (this.selectedSubject === 'idaf') {
        gradeData.name = this.gradeName || 'IDAF Erfahrungsnote';
        gradeData.weight = this.gradeWeight;
        gradeData.semester = this.semester;
      } else if (this.selectedSubject === 'idpa') {
        gradeData.name = this.gradeName || 'IDPA Projektarbeit';
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

  getIdafSemesterAverages(): Array<{semester: number, average: number, count: number}> {
    const semesterAverages = [];
    for (let semester = 1; semester <= 4; semester++) {
      const semesterGrades = this.idafGrades.filter(g => g.semester === semester);
      if (semesterGrades.length > 0) {
        const totalWeight = semesterGrades.reduce((sum, grade) => sum + (grade.weight || 1), 0);
        const weightedSum = semesterGrades.reduce((sum, grade) => sum + (grade.value * (grade.weight || 1)), 0);
        const average = Math.round((weightedSum / totalWeight) * 2) / 2;
        semesterAverages.push({ semester, average, count: semesterGrades.length });
      }
    }
    return semesterAverages;
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

  getSubjectDisplayName(subjectId: string): string {
    switch (subjectId) {
      case 'idaf': return 'IDAF (Interdisziplinäres Arbeiten in den Fächern)';
      case 'idpa': return 'IDPA (Interdisziplinäre Projektarbeit)';
      default: return subjectId;
    }
  }

  getSubjectDescription(subjectId: string): string {
    switch (subjectId) {
      case 'idaf': return 'Erfahrungsnoten aus verschiedenen Semestern - zählt nicht zur Promotion';
      case 'idpa': return 'Einzelne Projektarbeit - finale Note';
      default: return '';
    }
  }
}
