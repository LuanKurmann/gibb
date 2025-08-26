import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService, AuthUser } from '../../services/supabase.service';
import { I18nService, SupportedLanguage } from '../../services/i18n.service';
import { TestCalendarService } from '../../services/test-calendar.service';

export interface BMType {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  hasExam: boolean;
  isCore: boolean;
  partTimeSubjects?: PartTimeSubject[];
}

export interface PartTimeSubject {
  id: string;
  name: string;
  shortName: string;
  weight: number;
  semesters: number[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: AuthUser | null = null;
  currentLanguage: SupportedLanguage = 'en';
  showLogoutConfirm = false;
  
  // BM Settings
  selectedBMType: string = '';
  studyMode: 'fulltime' | 'parttime' = 'fulltime';
  previousBMType: string = '';
  
  // Save state
  isSaving = false;
  saveMessage = '';
  saveMessageType: 'success' | 'error' | '' = '';
  
  // BM Type Change Confirmation
  showBMTypeChangeConfirm = false;
  pendingBMType = '';
  pendingStudyMode: 'fulltime' | 'parttime' = 'fulltime';
  
  bmTypes: BMType[] = [
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
        { id: 'wr', name: 'Wirtschaft & Recht', shortName: 'WR', hasExam: true, isCore: true }
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
        { id: 'gp', name: 'Geschichte & Politik', shortName: 'GP', hasExam: true, isCore: true }
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
        { id: 'tu', name: 'Technik & Umwelt', shortName: 'TU', hasExam: true, isCore: true }
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
        { id: 'wr', name: 'Wirtschaft & Recht', shortName: 'WR', hasExam: true, isCore: true }
      ]
    }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    public i18n: I18nService,
    private testCalendarService: TestCalendarService
  ) {}

  ngOnInit() {
    this.supabaseService.user$.subscribe(user => {
      this.user = user;
    });
    
    this.i18n.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
    
    this.loadBMSettings();
  }

  changeLanguage(lang: SupportedLanguage) {
    this.i18n.setLanguage(lang);
  }

  confirmLogout() {
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
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
        this.selectedBMType = data.bm_type || '';
        this.studyMode = data.study_mode || 'fulltime';
        this.previousBMType = this.selectedBMType;
      }
    } catch (error) {
      console.error('Error loading BM settings:', error);
    }
  }

  onBMTypeChange() {
    // Check if BM type has actually changed and there was a previous type
    if (this.selectedBMType !== this.previousBMType && this.previousBMType) {
      this.pendingBMType = this.selectedBMType;
      this.pendingStudyMode = this.studyMode;
      this.showBMTypeChangeConfirm = true;
      // Reset to previous value until confirmed
      this.selectedBMType = this.previousBMType;
    }
  }

  onStudyModeChange() {
    // Study mode changes don't require confirmation, but we track them
    // The actual save will happen when the user clicks the save button
  }

  checkForChangesAndSave() {
    // Check if BM type has changed and show confirmation if needed
    if (this.selectedBMType !== this.previousBMType && this.previousBMType) {
      this.pendingBMType = this.selectedBMType;
      this.pendingStudyMode = this.studyMode;
      this.showBMTypeChangeConfirm = true;
      // Reset to previous value until confirmed
      this.selectedBMType = this.previousBMType;
    } else {
      // No BM type change, save directly
      this.saveBMSettings();
    }
  }

  confirmBMTypeChange() {
    this.selectedBMType = this.pendingBMType;
    this.studyMode = this.pendingStudyMode;
    this.showBMTypeChangeConfirm = false;
    this.saveBMSettings();
  }

  cancelBMTypeChange() {
    this.showBMTypeChangeConfirm = false;
    this.pendingBMType = '';
    this.pendingStudyMode = 'fulltime';
  }

  async saveBMSettings() {
    const user = this.supabaseService.getCurrentUser();
    if (!user || !this.selectedBMType) {
      this.showSaveMessage('Bitte wählen Sie einen BM-Typ aus.', 'error');
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';

    try {
      // If BM type changed, delete all tests first
      if (this.selectedBMType !== this.previousBMType && this.previousBMType) {
        console.log('BM type changed from', this.previousBMType, 'to', this.selectedBMType, '- deleting all tests');
        await this.deleteAllTests();
      }

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
        this.previousBMType = this.selectedBMType;
        this.showSaveMessage('Einstellungen erfolgreich gespeichert!', 'success');
      } else {
        console.error('Supabase error:', error);
        this.showSaveMessage('Fehler beim Speichern der Einstellungen.', 'error');
      }
    } catch (error) {
      console.error('Error saving BM settings:', error);
      this.showSaveMessage('Fehler beim Speichern der Einstellungen.', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  private async deleteAllTests() {
    const user = this.supabaseService.getCurrentUser();
    if (!user) return;

    try {
      console.log('Deleting all tests for user:', user.id);
      const { data, error } = await this.supabaseService.client
        .from('scheduled_tests')
        .delete()
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Error deleting tests:', error);
      } else {
        console.log('Successfully deleted tests:', data);
      }
    } catch (error) {
      console.error('Error deleting tests:', error);
    }
  }

  private showSaveMessage(message: string, type: 'success' | 'error') {
    this.saveMessage = message;
    this.saveMessageType = type;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.saveMessage = '';
      this.saveMessageType = '';
    }, 3000);
  }
}
