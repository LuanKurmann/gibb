// Domain Models für BM-System
export enum BMType {
  TALS = 'tals',
  WD_D = 'wd-d',
  ARTE = 'arte',
  GESUNDHEIT = 'gesundheit'
}

export enum StudyMode {
  FULLTIME = 'fulltime',
  PARTTIME = 'parttime'
}

export enum GradeType {
  INDIVIDUAL = 'individual',
  EXAM = 'exam',
  EXPERIENCE = 'experience',
  SEMESTER = 'semester',
  PROJECT = 'project'
}

export enum SubjectType {
  STANDARD = 'standard',
  NATURAL_SCIENCE = 'natural_science',
  IDPA = 'idpa',
  IDAF = 'idaf',
  IDA = 'ida'
}

export enum TestType {
  EXAM = 'exam',
  TEST = 'test',
  PRESENTATION = 'presentation',
  PROJECT = 'project',
  HOMEWORK = 'homework'
}

export enum TestStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Base interfaces
export interface Grade {
  id?: string;
  userId: string;
  subjectId: string;
  type: GradeType;
  value: number;
  semester?: number;
  name?: string;
  weight?: number;
  dateTaken?: string;
  description?: string;
  duration?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartTimeComponent {
  id: string;
  name: string;
  shortName: string;
  weight: number; // 0-1
  semesters: number[];
}

// Subject Models
export abstract class BaseSubject {
  constructor(
    public id: string,
    public name: string,
    public shortName: string,
    public hasExam: boolean,
    public isCore: boolean,
    public type: SubjectType = SubjectType.STANDARD
  ) {}

  abstract calculateFinalGrade(grades: Grade[]): number;
}

export class StandardSubject extends BaseSubject {
  constructor(id: string, name: string, shortName: string, hasExam: boolean, isCore: boolean) {
    super(id, name, shortName, hasExam, isCore, SubjectType.STANDARD);
  }

  calculateFinalGrade(grades: Grade[]): number {
    const individualGrades = grades.filter(g => g.type === GradeType.INDIVIDUAL);
    const examGrade = grades.find(g => g.type === GradeType.EXAM);

    if (individualGrades.length === 0) return 0;

    // Calculate experience grade (semester averages)
    const experienceGrade = this.calculateExperienceGrade(individualGrades);
    
    if (this.hasExam && examGrade) {
      return Math.round(((experienceGrade + examGrade.value) / 2) * 2) / 2;
    }

    return experienceGrade;
  }

  private calculateExperienceGrade(grades: Grade[]): number {
    const semesterAverages = [];
    for (let semester = 1; semester <= 4; semester++) {
      const semesterGrades = grades.filter(g => g.semester === semester);
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
}

export class NaturalScienceSubject extends BaseSubject {
  constructor(
    id: string,
    name: string,
    shortName: string,
    hasExam: boolean,
    isCore: boolean,
    public components: PartTimeComponent[]
  ) {
    super(id, name, shortName, hasExam, isCore, SubjectType.NATURAL_SCIENCE);
  }

  calculateFinalGrade(grades: Grade[]): number {
    let totalWeightedGrade = 0;
    let totalWeight = 0;
    
    for (const component of this.components) {
      const componentGrades = grades.filter(g => g.subjectId === component.id);
      if (componentGrades.length > 0) {
        const componentAverage = componentGrades.reduce((sum, grade) => sum + grade.value, 0) / componentGrades.length;
        totalWeightedGrade += componentAverage * component.weight;
        totalWeight += component.weight;
      }
    }
    
    return totalWeight > 0 ? Math.round((totalWeightedGrade / totalWeight) * 2) / 2 : 0;
  }
}

export class IDAFSubject extends BaseSubject {
  constructor() {
    super('idaf', 'Interdisziplinäre Arbeit in den Fächern', 'IDAF', false, false, SubjectType.IDAF);
  }

  calculateFinalGrade(grades: Grade[]): number {
    // IDAF = Erfahrungsnote (Durchschnitt aller IDAF-Arbeiten)
    const idafGrades = grades.filter(g => g.type === GradeType.INDIVIDUAL);
    if (idafGrades.length === 0) return 0;
    
    const total = idafGrades.reduce((sum, grade) => sum + grade.value, 0);
    return Math.round((total / idafGrades.length) * 2) / 2;
  }
}

export class IDPASubject extends BaseSubject {
  constructor() {
    super('idpa', 'Interdisziplinäre Projektarbeit', 'IDPA', false, false, SubjectType.IDPA);
  }

  calculateFinalGrade(grades: Grade[]): number {
    // IDPA = Einzelnote (schriftlich + Präsentation)
    const idpaGrades = grades.filter(g => g.type === GradeType.INDIVIDUAL);
    if (idpaGrades.length === 0) return 0;
    
    const total = idpaGrades.reduce((sum, grade) => sum + grade.value, 0);
    return Math.round((total / idpaGrades.length) * 2) / 2;
  }
}

export class IDASubject extends BaseSubject {
  constructor(private idafSubject: IDAFSubject, private idpaSubject: IDPASubject) {
    super('ida', 'IDA-Note (IDAF + IDPA)', 'IDA', false, true, SubjectType.IDA);
  }

  calculateFinalGrade(grades: Grade[]): number {
    // IDA-Note = (Erfahrungsnote IDAF + Note IDPA) / 2
    const idafGrades = grades.filter(g => g.subjectId === 'idaf');
    const idpaGrades = grades.filter(g => g.subjectId === 'idpa');
    
    const idafGrade = this.idafSubject.calculateFinalGrade(idafGrades);
    const idpaGrade = this.idpaSubject.calculateFinalGrade(idpaGrades);
    
    if (idafGrade === 0 && idpaGrade === 0) return 0;
    if (idafGrade === 0) return idpaGrade;
    if (idpaGrade === 0) return idafGrade;
    
    return Math.round(((idafGrade + idpaGrade) / 2) * 2) / 2;
  }
}

// BM Type Models
export abstract class BaseBMType {
  constructor(
    public id: BMType,
    public name: string,
    public subjects: BaseSubject[]
  ) {}

  abstract createSubjects(studyMode: StudyMode): BaseSubject[];
  
  calculateOverallGrade(grades: Grade[]): number {
    const finalGrades = this.subjects.map(subject => {
      const subjectGrades = grades.filter(g => 
        g.subjectId === subject.id || 
        (subject.type === SubjectType.IDA && (g.subjectId === 'idaf' || g.subjectId === 'idpa'))
      );
      return subject.calculateFinalGrade(subjectGrades);
    }).filter(grade => grade > 0);

    if (finalGrades.length === 0) return 0;
    const sum = finalGrades.reduce((acc, grade) => acc + grade, 0);
    return Math.round((sum / finalGrades.length) * 10) / 10;
  }
}

export class TALSBMType extends BaseBMType {
  constructor(studyMode: StudyMode = StudyMode.FULLTIME) {
    super(BMType.TALS, 'BM 2 Technik, Architektur, Life Sciences (TALS)', []);
    this.subjects = this.createSubjects(studyMode);
  }

  createSubjects(studyMode: StudyMode): BaseSubject[] {
    const subjects: BaseSubject[] = [
      new StandardSubject('d', 'Deutsch', 'D', true, true),
      new StandardSubject('f', 'Französisch', 'F', true, true),
      new StandardSubject('e', 'Englisch', 'E', true, true),
      new StandardSubject('m-g', 'Mathematik Grundlagen', 'M-G', true, true),
      new StandardSubject('m-s', 'Mathematik Schwerpunkt', 'M-S', true, true),
      new StandardSubject('gp', 'Geschichte & Politik', 'GP', true, true),
      new StandardSubject('wr', 'Wirtschaft & Recht', 'WR', true, true),
    ];

    // Naturwissenschaften - unterschiedlich je nach Studienform
    if (studyMode === StudyMode.PARTTIME) {
      subjects.push(new NaturalScienceSubject('nw', 'Naturwissenschaften', 'NW', true, true, [
        { id: 'nw-chemie', name: 'Chemie', shortName: 'CH', weight: 0.33, semesters: [1] },
        { id: 'nw-physik', name: 'Physik', shortName: 'PH', weight: 0.67, semesters: [1, 2] }
      ]));
    } else {
      subjects.push(new StandardSubject('nw', 'Naturwissenschaften', 'NW', true, true));
    }

    // IDPA/IDAF System
    const idafSubject = new IDAFSubject();
    const idpaSubject = new IDPASubject();
    subjects.push(new IDASubject(idafSubject, idpaSubject));

    return subjects;
  }
}

export class WDDBMType extends BaseBMType {
  constructor(studyMode: StudyMode = StudyMode.FULLTIME) {
    super(BMType.WD_D, 'BM 2 Dienstleistungen (WD-D)', []);
    this.subjects = this.createSubjects(studyMode);
  }

  createSubjects(studyMode: StudyMode): BaseSubject[] {
    const subjects: BaseSubject[] = [
      new StandardSubject('d', 'Deutsch', 'D', true, true),
      new StandardSubject('f', 'Französisch', 'F', true, true),
      new StandardSubject('e', 'Englisch', 'E', true, true),
      new StandardSubject('m', 'Mathematik', 'M', true, true),
      new StandardSubject('fr', 'Finanz- & Rechnungswesen', 'FR', true, true),
      new StandardSubject('wr', 'Wirtschaft & Recht Schwerpunkt', 'WR', true, true),
      new StandardSubject('wr-e', 'Wirtschaft & Recht Ergänzung', 'WR-E', false, false),
      new StandardSubject('gp', 'Geschichte & Politik', 'GP', true, true),
    ];

    // IDPA/IDAF System
    const idafSubject = new IDAFSubject();
    const idpaSubject = new IDPASubject();
    subjects.push(new IDASubject(idafSubject, idpaSubject));

    return subjects;
  }
}

export class ARTEBMType extends BaseBMType {
  constructor(studyMode: StudyMode = StudyMode.FULLTIME) {
    super(BMType.ARTE, 'BM 2 Gestaltung & Kunst (ARTE)', []);
    this.subjects = this.createSubjects(studyMode);
  }

  createSubjects(studyMode: StudyMode): BaseSubject[] {
    const subjects: BaseSubject[] = [
      new StandardSubject('d', 'Deutsch', 'D', true, true),
      new StandardSubject('f', 'Französisch', 'F', true, true),
      new StandardSubject('e', 'Englisch', 'E', true, true),
      new StandardSubject('m', 'Mathematik', 'M', true, true),
      new StandardSubject('gkk', 'Gestaltung / Kunst / Kultur', 'GKK', true, true),
      new StandardSubject('ik', 'Information & Kommunikation', 'IK', true, true),
      new StandardSubject('gp', 'Geschichte & Politik', 'GP', true, true),
      new StandardSubject('tu', 'Technik & Umwelt', 'TU', true, true),
    ];

    // IDPA/IDAF System
    const idafSubject = new IDAFSubject();
    const idpaSubject = new IDPASubject();
    subjects.push(new IDASubject(idafSubject, idpaSubject));

    return subjects;
  }
}

export class GesundheitBMType extends BaseBMType {
  constructor(studyMode: StudyMode = StudyMode.FULLTIME) {
    super(BMType.GESUNDHEIT, 'BM 2 Gesundheit & Soziales', []);
    this.subjects = this.createSubjects(studyMode);
  }

  createSubjects(studyMode: StudyMode): BaseSubject[] {
    const subjects: BaseSubject[] = [
      new StandardSubject('d', 'Deutsch', 'D', true, true),
      new StandardSubject('f', 'Französisch', 'F', true, true),
      new StandardSubject('e', 'Englisch', 'E', true, true),
      new StandardSubject('m', 'Mathematik', 'M', true, true),
      new StandardSubject('sw', 'Sozialwissenschaften', 'SW', true, true),
      new StandardSubject('gp', 'Geschichte & Politik', 'GP', true, true),
      new StandardSubject('wr', 'Wirtschaft & Recht', 'WR', true, true),
    ];

    // Naturwissenschaften - unterschiedlich je nach Studienform
    if (studyMode === StudyMode.PARTTIME) {
      subjects.push(new NaturalScienceSubject('nw', 'Naturwissenschaften', 'NW', true, true, [
        { id: 'nw-chemie', name: 'Chemie', shortName: 'CH', weight: 0.33, semesters: [1] },
        { id: 'nw-physik', name: 'Physik', shortName: 'PH', weight: 0.67, semesters: [1, 2] }
      ]));
    } else {
      subjects.push(new StandardSubject('nw', 'Naturwissenschaften', 'NW', true, true));
    }

    // IDPA/IDAF System
    const idafSubject = new IDAFSubject();
    const idpaSubject = new IDPASubject();
    subjects.push(new IDASubject(idafSubject, idpaSubject));

    return subjects;
  }
}

// Factory für BM-Typen
export class BMTypeFactory {
  static create(bmType: BMType, studyMode: StudyMode): BaseBMType {
    switch (bmType) {
      case BMType.TALS:
        return new TALSBMType(studyMode);
      case BMType.WD_D:
        return new WDDBMType(studyMode);
      case BMType.ARTE:
        return new ARTEBMType(studyMode);
      case BMType.GESUNDHEIT:
        return new GesundheitBMType(studyMode);
      default:
        throw new Error(`Unknown BM Type: ${bmType}`);
    }
  }
}

// Test/Exam Model
export interface ScheduledTest {
  id?: string;
  userId: string;
  subjectId: string;
  title: string;
  description?: string;
  testType: TestType;
  scheduledDate: string;
  duration?: number; // in minutes
  weight?: number;
  semester?: number;
  status: TestStatus;
  gradeId?: string; // Link to grade when completed
  createdAt?: string;
  updatedAt?: string;
}

// Settings Model
export interface BMSettings {
  userId: string;
  bmType: BMType;
  studyMode: StudyMode;
  createdAt?: string;
  updatedAt?: string;
}
