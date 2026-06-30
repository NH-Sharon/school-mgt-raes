import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student } from '../services/student.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="students-page">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1>শিক্ষার্থী ব্যবস্থাপনা</h1>
        <button class="btn btn-primary" (click)="showAddForm = !showAddForm">
          নতুন শিক্ষার্থী যোগ করুন
        </button>
      </div>
      
      <!-- Add Student Form -->
      <div *ngIf="showAddForm" class="card mb-3">
        <h3>নতুন শিক্ষার্থী</h3>
        <form (ngSubmit)="addStudent()" #studentForm="ngForm">
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>শিক্ষার্থী আইডি</label>
                <input type="text" class="form-control" [(ngModel)]="newStudent.student_id" name="student_id" required>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>নাম (বাংলা)</label>
                <input type="text" class="form-control" [(ngModel)]="newStudent.name_bn" name="name_bn" required>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>নাম (ইংরেজি)</label>
                <input type="text" class="form-control" [(ngModel)]="newStudent.name_en" name="name_en" required>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>পিতার নাম</label>
                <input type="text" class="form-control" [(ngModel)]="newStudent.father_name" name="father_name" required>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>মাতার নাম</label>
                <input type="text" class="form-control" [(ngModel)]="newStudent.mother_name" name="mother_name" required>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>জন্ম তারিখ</label>
                <input type="date" class="form-control" [(ngModel)]="newStudent.date_of_birth" name="date_of_birth" required>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label>লিঙ্গ</label>
                <select class="form-control" [(ngModel)]="newStudent.gender" name="gender" required>
                  <option value="">নির্বাচন করুন</option>
                  <option value="male">পুরুষ</option>
                  <option value="female">মহিলা</option>
                </select>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>রক্তের গ্রুপ</label>
                <select class="form-control" [(ngModel)]="newStudent.blood_group" name="blood_group">
                  <option value="">নির্বাচন করুন</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label>ফোন</label>
                <input type="tel" class="form-control" [(ngModel)]="newStudent.phone" name="phone">
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>ঠিকানা</label>
            <textarea class="form-control" [(ngModel)]="newStudent.address" name="address" rows="3"></textarea>
          </div>
          
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-success" [disabled]="!studentForm.form.valid">
              সংরক্ষণ করুন
            </button>
            <button type="button" class="btn btn-secondary" (click)="cancelAdd()">
              বাতিল
            </button>
          </div>
        </form>
      </div>
      
      <!-- Students List -->
      <div class="card">
        <h3>শিক্ষার্থীদের তালিকা</h3>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>আইডি</th>
                <th>নাম</th>
                <th>পিতার নাম</th>
                <th>ক্লাস</th>
                <th>ফোন</th>
                <th>কার্যক্রম</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of students">
                <td>{{ student.student_id }}</td>
                <td>{{ student.name_bn }}</td>
                <td>{{ student.father_name }}</td>
                <td>{{ student.class_name || 'N/A' }}</td>
                <td>{{ student.phone || 'N/A' }}</td>
                <td>
                  <button class="btn btn-sm btn-primary me-2">সম্পাদনা</button>
                  <button class="btn btn-sm btn-danger" (click)="deleteStudent(student.id!)">মুছুন</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .col {
      flex: 1;
    }
    
    .table-responsive {
      overflow-x: auto;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
    
    .me-2 {
      margin-right: 0.5rem;
    }
  `]
})
export class StudentsComponent implements OnInit {
  studentService = inject(StudentService);
  
  students: Student[] = [];
  showAddForm = false;
  newStudent: Student = this.getEmptyStudent();

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.studentService.getStudents().subscribe({
      next: (students) => {
        this.students = students;
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  addStudent() {
    this.studentService.addStudent(this.newStudent).subscribe({
      next: () => {
        this.loadStudents();
        this.cancelAdd();
      },
      error: (error) => {
        console.error('Error adding student:', error);
      }
    });
  }

  deleteStudent(id: number) {
    if (confirm('আপনি কি নিশ্চিত যে এই শিক্ষার্থীকে মুছে দিতে চান?')) {
      this.studentService.deleteStudent(id).subscribe({
        next: () => {
          this.loadStudents();
        },
        error: (error) => {
          console.error('Error deleting student:', error);
        }
      });
    }
  }

  cancelAdd() {
    this.showAddForm = false;
    this.newStudent = this.getEmptyStudent();
  }

  private getEmptyStudent(): Student {
    return {
      student_id: '',
      name_bn: '',
      name_en: '',
      father_name: '',
      mother_name: '',
      date_of_birth: '',
      gender: '',
      blood_group: '',
      phone: '',
      address: ''
    };
  }
}
