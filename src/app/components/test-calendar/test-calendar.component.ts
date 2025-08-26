import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestCalendarService } from '../../services/test-calendar.service';
import { I18nService } from '../../services/i18n.service';
import { BMCalculationService } from '../../services/bm-calculation.service';
import { ScheduledTest, TestType, TestStatus, BaseSubject } from '../../models/bm-domain.models';
import { PageLayoutComponent } from '../shared/layout/page-layout.component';

@Component({
  selector: 'app-test-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: './test-calendar.component.html',
  styleUrls: ['./test-calendar.component.css']
})
export class TestCalendarComponent implements OnInit {
  @Input() subjects: BaseSubject[] = [];
  @Output() testConverted = new EventEmitter<void>();

  scheduledTests: ScheduledTest[] = [];
  showAddTestModal = false;
  showConvertModal = false;
  selectedTest: ScheduledTest | null = null;
  convertGradeValue = 4.0;

  // List view filters
  filterStatus: TestStatus | 'all' = 'all';
  filterSubject = '';
  sortBy: 'date' | 'subject' | 'type' = 'date';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // New test form
  newTest = {
    subjectId: '',
    title: '',
    description: '',
    testType: TestType.TEST,
    scheduledDate: '',
    duration: 90,
    weight: 1,
    semester: 1
  };

  TestType = TestType;
  TestStatus = TestStatus;

  constructor(
    private testCalendarService: TestCalendarService,
    private bmCalculationService: BMCalculationService,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.testCalendarService.scheduledTests$.subscribe(tests => {
      this.scheduledTests = tests;
    });
    this.loadSubjects();
  }

  private async loadSubjects(): Promise<void> {
    if (this.subjects.length === 0) {
      // Load subjects from BM calculation service if not provided
      this.bmCalculationService.initializeBMType('tals' as any, 'fulltime' as any);
      const bmType = this.bmCalculationService.getBMType();
      if (bmType) {
        this.subjects = bmType.subjects;
      }
    }
  }

  getFilteredAndSortedTests(): ScheduledTest[] {
    let filtered = this.scheduledTests;

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(test => test.status === this.filterStatus);
    }

    // Filter by subject
    if (this.filterSubject) {
      filtered = filtered.filter(test => test.subjectId === this.filterSubject);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
          break;
        case 'subject':
          comparison = this.getSubjectName(a.subjectId).localeCompare(this.getSubjectName(b.subjectId));
          break;
        case 'type':
          comparison = a.testType.localeCompare(b.testType);
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  toggleSort(field: 'date' | 'subject' | 'type'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(field: 'date' | 'subject' | 'type'): string {
    if (this.sortBy !== field) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  openAddTestModal(): void {
    this.newTest = {
      subjectId: '',
      title: '',
      description: '',
      testType: TestType.TEST,
      scheduledDate: '',
      duration: 90,
      weight: 1,
      semester: 1
    };
    this.showAddTestModal = true;
  }

  closeAddTestModal(): void {
    this.showAddTestModal = false;
  }

  async addTest(): Promise<void> {
    if (!this.newTest.subjectId || !this.newTest.title || !this.newTest.scheduledDate) {
      return;
    }

    const test: Omit<ScheduledTest, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: '', // Will be set by service
      subjectId: this.newTest.subjectId,
      title: this.newTest.title,
      description: this.newTest.description,
      testType: this.newTest.testType,
      scheduledDate: this.newTest.scheduledDate,
      duration: this.newTest.duration,
      weight: this.newTest.weight,
      semester: this.newTest.semester,
      status: TestStatus.SCHEDULED
    };

    const success = await this.testCalendarService.addScheduledTest(test);
    if (success) {
      this.closeAddTestModal();
    }
  }

  openConvertModal(test: ScheduledTest): void {
    this.selectedTest = test;
    this.convertGradeValue = 4.0;
    this.showConvertModal = true;
  }

  closeConvertModal(): void {
    this.showConvertModal = false;
    this.selectedTest = null;
  }

  async convertToGrade(): Promise<void> {
    if (!this.selectedTest || this.convertGradeValue < 1 || this.convertGradeValue > 6) {
      return;
    }

    const success = await this.testCalendarService.convertTestToGrade(
      this.selectedTest.id!,
      this.convertGradeValue
    );

    if (success) {
      this.testConverted.emit();
      this.closeConvertModal();
    }
  }

  async deleteTest(test: ScheduledTest): Promise<void> {
    if (!test.id || !confirm('Test wirklich löschen?')) return;
    
    await this.testCalendarService.deleteScheduledTest(test.id);
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
  }

  formatTestType(type: TestType): string {
    return this.testCalendarService.formatTestType(type);
  }

  getTestTypeColor(type: TestType): string {
    return this.testCalendarService.getTestTypeColor(type);
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

  isOverdue(test: ScheduledTest): boolean {
    const testDate = new Date(test.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return testDate < today && test.status === TestStatus.SCHEDULED;
  }

  isToday(test: ScheduledTest): boolean {
    const testDate = new Date(test.scheduledDate);
    const today = new Date();
    return testDate.toDateString() === today.toDateString();
  }

  getDaysUntilTest(test: ScheduledTest): number {
    const testDate = new Date(test.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    testDate.setHours(0, 0, 0, 0);
    const diffTime = testDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUpcomingTests(): ScheduledTest[] {
    return this.testCalendarService.getUpcomingTests(7);
  }
}
