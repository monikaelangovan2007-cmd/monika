import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Student = { id: string; studentName: string; age: string; rollNo: string; dob: string; bloodGroup: string; email: string; address: string; phone: string; department: string; course: string; gender: string; year: string; section: string; backlogs: string; companies: string[] }
const companies = ['TCS', 'Wipro', 'Infosys', 'Accenture', 'Cognizant', 'HCLTech', 'Capgemini', 'IBM', 'Deloitte', 'Microsoft']
const API_URL = 'https://student-registration-dmaj.onrender.com/api'
const emptyStudent: Omit<Student, 'id' | 'companies'> = { studentName: '', age: '', rollNo: '', dob: '', bloodGroup: '', email: '', address: '', phone: '', department: '', course: '', gender: '', year: '', section: '', backlogs: '' }

function App() {
  const [page, setPage] = useState<'register' | 'companies' | 'admin'>('register')
  const [student, setStudent] = useState(emptyStudent)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [registrations, setRegistrations] = useState<Student[]>(() => { const saved = localStorage.getItem('campus-connect-registrations'); return saved ? JSON.parse(saved) : [] })
  const [notice, setNotice] = useState('')
  useEffect(() => {
    fetch(`${API_URL}/registrations`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load registrations.')))
      .then((savedRegistrations: Student[]) => setRegistrations(savedRegistrations))
      .catch(() => { /* Keep local data visible when the API is unavailable. */ })
  }, [])
  const groupedRegistrations = useMemo(() => companies.map((company) => ({ company, students: registrations.filter((registration) => registration.companies.includes(company)) })), [registrations])
  const updateStudent = (field: keyof typeof emptyStudent, value: string) => setStudent((current) => ({ ...current, [field]: value }))
  const submitDetails = (event: FormEvent) => { event.preventDefault(); if (Number(student.backlogs) > 0) { setNotice('Students with active backlogs are not eligible for company selection.'); return }; setNotice(''); setPage('companies') }
  const toggleCompany = (company: string) => setSelectedCompanies((current) => current.includes(company) ? current.filter((item) => item !== company) : current.length < 4 ? [...current, company] : current)
  const completeRegistration = async () => {
    if (selectedCompanies.length !== 4) return
    const registration = { ...student, companies: selectedCompanies }
    try {
      const response = await fetch(`${API_URL}/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registration) })
      if (!response.ok) throw new Error('Could not save registration.')
      const savedRegistration = await response.json() as Student
      const nextRegistrations = [...registrations, savedRegistration]
      setRegistrations(nextRegistrations)
      localStorage.setItem('campus-connect-registrations', JSON.stringify(nextRegistrations))
      setStudent(emptyStudent); setSelectedCompanies([]); setNotice('Registration submitted successfully.'); setPage('register')
    } catch {
      setNotice('Could not save registration. Start the server and check MongoDB, then try again.')
    }
  }
  const startRegistration = () => { setNotice(''); setPage('register') }

  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark"><span>CC</span></div><div><p className="eyebrow">Campus Connect</p><strong>Placement registration</strong></div><nav><button className={page === 'register' || page === 'companies' ? 'nav-active' : ''} onClick={startRegistration}>Student portal</button><button className={page === 'admin' ? 'nav-active' : ''} onClick={() => setPage('admin')}>Admin view</button></nav></header>
    {page === 'admin' ? <AdminView groupedRegistrations={groupedRegistrations} registrations={registrations} /> : <main className="main-content"><div className="page-intro"><p className="eyebrow">2025 - 26 academic year</p><h1>{page === 'companies' ? 'Choose your companies' : 'Student registration'}</h1><p>{page === 'companies' ? 'Select four companies to complete your placement preferences.' : 'Create your profile for the upcoming placement season.'}</p></div><div className="stepper"><div className={page === 'register' ? 'step current' : 'step done'}><span>01</span><div><b>Student details</b><small>About you</small></div></div><div className="step-line" /><div className={page === 'companies' ? 'step current' : 'step'}><span>02</span><div><b>Company choices</b><small>Pick four</small></div></div></div>{notice && <div className="notice">{notice}</div>}{page === 'register' ? <RegistrationForm student={student} updateStudent={updateStudent} submitDetails={submitDetails} /> : <CompanyPicker selectedCompanies={selectedCompanies} toggleCompany={toggleCompany} completeRegistration={completeRegistration} />}</main>}
  </div>
}

function RegistrationForm({ student, updateStudent, submitDetails }: { student: typeof emptyStudent; updateStudent: (field: keyof typeof emptyStudent, value: string) => void; submitDetails: (event: FormEvent) => void }) {
  const field = (name: keyof typeof emptyStudent, label: string, type = 'text', placeholder = '') => <label><span>{label}</span><input required type={type} value={student[name]} placeholder={placeholder} onChange={(event) => updateStudent(name, event.target.value)} /></label>
  return <form className="form-card" onSubmit={submitDetails}><div className="form-section"><div className="section-heading"><span className="section-number">01</span><div><h2>Personal information</h2><p>Tell us a little about yourself.</p></div></div><div className="form-grid">{field('studentName', 'Student name', 'text', 'e.g. Aditi Sharma')}{field('rollNo', 'Roll number', 'text', 'e.g. 22CSE104')}{field('age', 'Age', 'number', '21')}{field('dob', 'Date of birth', 'date')}<label><span>Blood group</span><select required value={student.bloodGroup} onChange={(event) => updateStudent('bloodGroup', event.target.value)}><option value="">Select group</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}</select></label>{field('gender', 'Gender', 'text', 'e.g. Female')}</div></div><div className="form-section"><div className="section-heading"><span className="section-number">02</span><div><h2>Contact & academics</h2><p>Where can we reach you and what are you studying?</p></div></div><div className="form-grid">{field('email', 'Email ID', 'email', 'you@university.edu')}{field('phone', 'Phone number', 'tel', '+91 98765 43210')}<label className="wide"><span>Address</span><textarea required value={student.address} placeholder="Your current address" onChange={(event) => updateStudent('address', event.target.value)} /></label>{field('department', 'Department of engineering', 'text', 'Computer Science')}{field('course', 'Course', 'text', 'B.Tech')}{field('year', 'Year', 'text', '3rd year')}{field('section', 'Section', 'text', 'A')}{field('backlogs', 'Number of backlogs', 'number', '0')}</div></div><div className="form-footer"><p><span className="lock">*</span> All fields are required</p><button className="primary-button" type="submit">Continue to companies <span>-&gt;</span></button></div></form>
}

function CompanyPicker({ selectedCompanies, toggleCompany, completeRegistration }: { selectedCompanies: string[]; toggleCompany: (company: string) => void; completeRegistration: () => void }) {
  return <section className="company-card"><div className="selection-header"><div><p className="eyebrow">Placement preferences</p><h2>Where would you like to go?</h2><p>Choose exactly four companies. Your order of selection is saved.</p></div><div className="selection-count"><strong>{selectedCompanies.length}<small>/4</small></strong><span>selected</span></div></div><div className="company-grid">{companies.map((company, index) => { const selected = selectedCompanies.includes(company); return <button type="button" className={`company-option ${selected ? 'selected' : ''}`} key={company} onClick={() => toggleCompany(company)}><span className="company-index">{String(index + 1).padStart(2, '0')}</span><strong>{company}</strong><span className="check">{selected ? '✓' : '+'}</span></button> })}</div><div className="company-footer"><button className="back-button" type="button" onClick={() => window.history.back()}>Back to details</button><button className="primary-button" disabled={selectedCompanies.length !== 4} onClick={completeRegistration}>Submit registration <span>-&gt;</span></button></div></section>
}

function AdminView({ groupedRegistrations, registrations }: { groupedRegistrations: { company: string; students: Student[] }[]; registrations: Student[] }) {
  return <main className="main-content admin-content"><div className="page-intro admin-intro"><p className="eyebrow">Coordinator dashboard</p><h1>Registration overview</h1><p>View student preferences grouped by company.</p><div className="total-pill"><strong>{registrations.length}</strong><span>registered students</span></div></div><div className="company-roster">{groupedRegistrations.map(({ company, students }) => <section className="roster-section" key={company}><div className="roster-heading"><div><span className="company-dot" /><h2>{company}</h2></div><strong>{students.length} {students.length === 1 ? 'student' : 'students'}</strong></div>{students.length ? <div className="student-list">{students.map((student) => <div className="student-row" key={student.id}><div className="avatar">{student.studentName.charAt(0).toUpperCase()}</div><div><strong>{student.studentName}</strong><span>{student.rollNo} · {student.department}</span></div><span className="student-email">{student.email}</span></div>)}</div> : <p className="empty-list">No preferences yet</p>}</section>)}</div></main>
}

export default App
