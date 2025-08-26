import { Injectable } from '@angular/core';
import { 
  BaseBMType, 
  BaseSubject, 
  Grade, 
  BMType, 
  StudyMode, 
  BMTypeFactory,
  SubjectType,
  GradeType
} from '../models/bm-domain.models';

export interface PassingRequirements {
  passed: boolean;
  issues: string[];
  overallGrade: number;
  insufficientGrades: number;
  deviationSum: number;
}

@Injectable({
  providedIn: 'root'
})
export class BMCalculationService {
  private bmTypeInstance: BaseBMType | null = null;

  constructor() {}

  /**
   * Initialisiert den Service mit einem BM-Typ und Studienmodus
   */
  initializeBMType(bmType: BMType, studyMode: StudyMode): void {
    this.bmTypeInstance = BMTypeFactory.create(bmType, studyMode);
  }

  /**
   * Gibt die aktuelle BM-Typ Instanz zurück
   */
  getBMType(): BaseBMType | null {
    return this.bmTypeInstance;
  }

  /**
   * Berechnet die Endnote für ein spezifisches Fach
   */
  calculateSubjectFinalGrade(subjectId: string, grades: Grade[]): number {
    if (!this.bmTypeInstance) return 0;

    const subject = this.bmTypeInstance.subjects.find(s => s.id === subjectId);
    if (!subject) return 0;

    const subjectGrades = grades.filter(g => 
      g.subjectId === subjectId || 
      (subject.type === SubjectType.IDA && (g.subjectId === 'idaf' || g.subjectId === 'idpa'))
    );

    return subject.calculateFinalGrade(subjectGrades);
  }

  /**
   * Berechnet die Erfahrungsnote für ein Fach (Semesterdurchschnitte)
   */
  calculateSubjectExperienceGrade(subjectId: string, grades: Grade[]): number {
    const subjectGrades = grades.filter(g => 
      g.subjectId === subjectId && g.type === GradeType.INDIVIDUAL
    );

    if (subjectGrades.length === 0) return 0;

    // Berechne Semesterdurchschnitte
    const semesterAverages = [];
    for (let semester = 1; semester <= 4; semester++) {
      const semesterGrades = subjectGrades.filter(g => g.semester === semester);
      if (semesterGrades.length > 0) {
        const totalWeight = semesterGrades.reduce((sum, grade) => sum + (grade.weight || 1), 0);
        const weightedSum = semesterGrades.reduce((sum, grade) => sum + (grade.value * (grade.weight || 1)), 0);
        semesterAverages.push(weightedSum / totalWeight);
      }
    }

    if (semesterAverages.length === 0) return 0;
    const average = semesterAverages.reduce((sum, avg) => sum + avg, 0) / semesterAverages.length;
    return Math.round(average * 2) / 2;
  }

  /**
   * Berechnet die Gesamtnote aller Fächer
   */
  calculateOverallGrade(grades: Grade[]): number {
    if (!this.bmTypeInstance) return 0;
    return this.bmTypeInstance.calculateOverallGrade(grades);
  }

  /**
   * Berechnet spezifisch die IDA-Note (IDAF + IDPA) / 2
   */
  calculateIDAGrade(grades: Grade[]): number {
    const idafGrades = grades.filter(g => g.subjectId === 'idaf');
    const idpaGrades = grades.filter(g => g.subjectId === 'idpa');

    const idafGrade = this.calculateSubjectFinalGrade('idaf', idafGrades);
    const idpaGrade = this.calculateSubjectFinalGrade('idpa', idpaGrades);

    if (idafGrade === 0 && idpaGrade === 0) return 0;
    if (idafGrade === 0) return idpaGrade;
    if (idpaGrade === 0) return idafGrade;

    return Math.round(((idafGrade + idpaGrade) / 2) * 2) / 2;
  }

  /**
   * Berechnet Naturwissenschaften für Teilzeit (Chemie/Physik gewichtet)
   */
  calculateNaturalScienceGrade(grades: Grade[]): number {
    if (!this.bmTypeInstance) return 0;

    const nwSubject = this.bmTypeInstance.subjects.find(s => s.id === 'nw');
    if (!nwSubject || nwSubject.type !== SubjectType.NATURAL_SCIENCE) return 0;

    return nwSubject.calculateFinalGrade(grades);
  }

  /**
   * Prüft die Bestehensanforderungen
   */
  checkPassingRequirements(grades: Grade[]): PassingRequirements {
    if (!this.bmTypeInstance) {
      return {
        passed: false,
        issues: ['Kein BM-Typ initialisiert'],
        overallGrade: 0,
        insufficientGrades: 0,
        deviationSum: 0
      };
    }

    const finalGrades = this.bmTypeInstance.subjects
      .filter(subject => subject.type !== SubjectType.IDAF && subject.type !== SubjectType.IDPA)
      .map(subject => {
        const subjectGrades = grades.filter(g => 
          g.subjectId === subject.id || 
          (subject.type === SubjectType.IDA && (g.subjectId === 'idaf' || g.subjectId === 'idpa'))
        );
        return subject.calculateFinalGrade(subjectGrades);
      })
      .filter(grade => grade > 0);

    const issues: string[] = [];
    
    // 1. Gesamtnote ≥ 4.0
    const overallGrade = this.calculateOverallGrade(grades);
    if (overallGrade < 4.0) {
      issues.push(`Gesamtnote zu tief: ${overallGrade.toFixed(1)} (min. 4.0)`);
    }

    // 2. Maximal 2 Fachnoten ungenügend
    const insufficientGrades = finalGrades.filter(grade => grade < 4.0);
    if (insufficientGrades.length > 2) {
      issues.push(`Zu viele ungenügende Noten: ${insufficientGrades.length} (max. 2)`);
    }

    // 3. Summe der Abweichungen ≤ 2.0
    const deviationSum = insufficientGrades.reduce((sum, grade) => sum + (4.0 - grade), 0);
    if (deviationSum > 2.0) {
      issues.push(`Abweichungssumme zu hoch: ${deviationSum.toFixed(1)} (max. 2.0)`);
    }

    return {
      passed: issues.length === 0,
      issues,
      overallGrade,
      insufficientGrades: insufficientGrades.length,
      deviationSum
    };
  }

  /**
   * Gibt alle Fächer des aktuellen BM-Typs zurück
   */
  getSubjects(): BaseSubject[] {
    return this.bmTypeInstance?.subjects || [];
  }

  /**
   * Findet ein Fach anhand der ID
   */
  getSubjectById(subjectId: string): BaseSubject | null {
    return this.bmTypeInstance?.subjects.find(s => s.id === subjectId) || null;
  }

  /**
   * Gibt alle Noten für ein spezifisches Fach zurück
   */
  getGradesForSubject(subjectId: string, grades: Grade[]): Grade[] {
    return grades.filter(g => g.subjectId === subjectId);
  }

  /**
   * Berechnet Semesterdurchschnitte für ein Fach
   */
  getSemesterAverages(subjectId: string, grades: Grade[]): Array<{semester: number, average: number}> {
    const subjectGrades = grades.filter(g => 
      g.subjectId === subjectId && g.type === GradeType.INDIVIDUAL
    );

    const semesterAverages = [];
    for (let semester = 1; semester <= 4; semester++) {
      const semesterGrades = subjectGrades.filter(g => g.semester === semester);
      if (semesterGrades.length > 0) {
        const totalWeight = semesterGrades.reduce((sum, grade) => sum + (grade.weight || 1), 0);
        const weightedSum = semesterGrades.reduce((sum, grade) => sum + (grade.value * (grade.weight || 1)), 0);
        const average = Math.round((weightedSum / totalWeight) * 2) / 2;
        semesterAverages.push({ semester, average });
      }
    }

    return semesterAverages;
  }

  /**
   * Validiert eine Note
   */
  validateGrade(grade: Partial<Grade>): string[] {
    const errors: string[] = [];

    if (!grade.value || grade.value < 1.0 || grade.value > 6.0) {
      errors.push('Note muss zwischen 1.0 und 6.0 liegen');
    }

    if (!grade.subjectId) {
      errors.push('Fach muss ausgewählt werden');
    }

    if (!grade.type) {
      errors.push('Notentyp muss angegeben werden');
    }

    if (grade.type === GradeType.INDIVIDUAL && !grade.semester) {
      errors.push('Semester muss für individuelle Noten angegeben werden');
    }

    if (grade.weight && (grade.weight <= 0 || grade.weight > 10)) {
      errors.push('Gewichtung muss zwischen 0.1 und 10.0 liegen');
    }

    return errors;
  }

  /**
   * Hilfsmethode für Farbklassen basierend auf Noten
   */
  getGradeColorClass(grade: number): string {
    if (grade === 0) return 'text-gray-400';
    return grade >= 4.0 ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Hilfsmethode für Badge-Klassen basierend auf Noten
   */
  getGradeBadgeClass(grade: number): string {
    if (grade === 0) return 'bg-gray-100 text-gray-600';
    return grade >= 4.0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  /**
   * Formatiert eine Note für die Anzeige
   */
  formatGrade(grade: number): string {
    return grade > 0 ? grade.toFixed(1) : '-';
  }
}
