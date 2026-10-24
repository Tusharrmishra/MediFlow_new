import { useMemo, useState } from 'react'

type Section = 'Overview' | 'Smart Queue' | 'Resources' | 'Follow-Up' | 'AI Safety' | 'Body Analysis' | 'Audit'
type QueueStatus = 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled'
type Role = 'Hospital Administrator' | 'Doctor' | 'Patient' | 'Receptionist' | 'Lab Technician' | 'Pharmacist' | 'Billing Staff'
type Assessment = { date: string; age: number; height: number; weight: number; waist?: number; systolic?: number; diastolic?: number; heartRate?: number; bmi: number }

const queueSeed = [
  { token: 'Q-1042', id: 'PT-2084', name: 'Aarav Patel', doctor: 'Dr. Mehta', time: '09:30', checkin: '09:18', priority: 'Urgent', status: 'In Consultation' as QueueStatus, actual: 18 },
  { token: 'Q-1043', id: 'PT-1927', name: 'Nisha Rao', doctor: 'Dr. Mehta', time: '09:45', checkin: '09:31', priority: 'Normal', status: 'Waiting' as QueueStatus, actual: 0 },
  { token: 'Q-1044', id: 'PT-2145', name: 'Kabir Singh', doctor: 'Dr. Mehta', time: '10:00', checkin: '09:42', priority: 'Normal', status: 'Waiting' as QueueStatus, actual: 0 },
  { token: 'Q-1045', id: 'PT-1872', name: 'Sana Ali', doctor: 'Dr. Iyer', time: '09:50', checkin: '09:37', priority: 'High', status: 'Waiting' as QueueStatus, actual: 0 },
]

const recommendations = [
  { id: 1, title: 'Rebalance Cardiology queue', resource: 'Cardiology · Dr. Mehta', reason: 'Queue is 32% above today’s average', action: 'Review Dr. Kapoor’s 10:30 availability', priority: 'High' },
  { id: 2, title: 'Review delayed lab requests', resource: 'Pathology Laboratory', reason: '8 requests exceed expected processing time', action: 'Review pending sample assignments', priority: 'Medium' },
  { id: 3, title: 'Reorder insulin stock', resource: 'Pharmacy · Insulin glargine', reason: '12 units remain; minimum stock is 20', action: 'Review purchase requisition', priority: 'High' },
]

const followUps = [
  { id: 'PT-1810', name: 'Meera Joshi', doctor: 'Dr. Iyer', last: '18 May 2025', due: '01 Jun 2025', status: 'Overdue', reminder: 'Sent' },
  { id: 'PT-2051', name: 'Rohan Das', doctor: 'Dr. Shah', last: '26 May 2025', due: '09 Jun 2025', status: 'Upcoming', reminder: 'Scheduled' },
  { id: 'PT-1734', name: 'Fatima Khan', doctor: 'Dr. Mehta', last: '14 May 2025', due: '28 May 2025', status: 'Missed', reminder: 'Action needed' },
]

const auditSeed = [
  { user: 'USR-104 · Dr. Iyer', role: 'Doctor', module: 'Medical records', action: 'Patient record viewed', record: 'PT-2084', time: 'Today, 10:42', outcome: 'Success' },
  { user: 'USR-032 · R. Kumar', role: 'Lab staff', module: 'Laboratory', action: 'Laboratory result entered', record: 'LAB-4431', time: 'Today, 10:28', outcome: 'Success' },
  { user: 'USR-219 · Unknown', role: 'Patient', module: 'Administration', action: 'Permission settings requested', record: 'RBAC-01', time: 'Today, 09:51', outcome: 'Denied' },
  { user: 'USR-008 · A. Shah', role: 'Administrator', module: 'Pharmacy', action: 'Pharmacy stock updated', record: 'MED-882', time: 'Today, 09:34', outcome: 'Success' },
]

const Icon = ({ name }: { name: string }) => {
  const paths: Record<string, string> = {
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    queue: 'M5 6h14M5 12h14M5 18h9',
    resource: 'M4 19v-7h4v7m4 0V5h4v14m4 0V9h-4',
    follow: 'M8 3v3m8-3v3M4 9h16M5 5h14v15H5z',
    ai: 'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2zM9 12h.01M15 12h.01',
    body: 'M12 5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M8 22l1-7-3-3 2-5h8l2 5-3 3 1 7M9 9h6',
    audit: 'M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6zM9 12l2 2 4-4',
    search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14m5-2 5 5',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    plus: 'M12 5v14M5 12h14',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={paths[name]} strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

function App() {
  const [user, setUser] = useState<{ role: Role; name: string } | null>(null)
  const [section, setSection] = useState<Section>('Overview')
  const [queue, setQueue] = useState(queueSeed)
  const [resolved, setResolved] = useState<number[]>([])
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [department, setDepartment] = useState('All departments')
  const [assessments, setAssessments] = useState<Assessment[]>([
    { date: '12 Mar 2025', age: 47, height: 172, weight: 79.4, waist: 91, systolic: 126, diastolic: 82, heartRate: 72, bmi: 26.8 },
    { date: '18 Nov 2024', age: 46, height: 172, weight: 82.1, waist: 94, systolic: 130, diastolic: 84, heartRate: 75, bmi: 27.8 },
  ])

  const waiting = queue.filter((q) => q.status === 'Waiting')
  const filteredQueue = queue.filter((q) => `${q.name} ${q.id} ${q.doctor}`.toLowerCase().includes(query.toLowerCase()))
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const changeStatus = (token: string, status: QueueStatus) => {
    setQueue((items) => items.map((q) => q.token === token ? { ...q, status } : q))
    notify(`${token} updated to ${status}. Queue positions recalculated.`)
  }
  const activeWaiting = useMemo(() => filteredQueue.filter((q) => q.status === 'Waiting'), [filteredQueue])

  const allNav: { label: Section; icon: string }[] = [
    { label: 'Overview', icon: 'grid' }, { label: 'Smart Queue', icon: 'queue' },
    { label: 'Resources', icon: 'resource' }, { label: 'Follow-Up', icon: 'follow' },
    { label: 'AI Safety', icon: 'ai' }, { label: 'Body Analysis', icon: 'body' }, { label: 'Audit', icon: 'audit' },
  ]
  const permissions: Record<Role, Section[]> = {
    'Hospital Administrator': allNav.map((n) => n.label),
    Doctor: ['Overview', 'Smart Queue', 'Follow-Up', 'AI Safety', 'Body Analysis'],
    Patient: ['Overview', 'Follow-Up', 'Body Analysis'],
    Receptionist: ['Overview', 'Smart Queue', 'Follow-Up'],
    'Lab Technician': ['Overview'],
    Pharmacist: ['Overview', 'Resources'],
    'Billing Staff': ['Overview'],
  }
  if (!user) return <Login onLogin={(role) => { setUser({ role, name: role === 'Patient' ? 'Aarav Patel' : role === 'Doctor' ? 'Dr. Priya Iyer' : 'Anita Desai' }); setSection('Overview') }} />
  const nav = allNav.filter((n) => permissions[user.role].includes(n.label))

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">M</span><span>Medi<span>Flow</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map((item) => <button className={section === item.label ? 'nav-item active' : 'nav-item'} key={item.label} onClick={() => setSection(item.label)}><Icon name={item.icon} /><span>{item.label}</span>{item.label === 'Smart Queue' && <b>{waiting.length}</b>}</button>)}</nav>
      <div className="sidebar-note"><strong>Hospital Intelligence</strong><p>Connected operational insights with staff review.</p><span>Prototype environment</span></div>
      <button className="profile" onClick={() => setUser(null)} title="Log out"><span>{user.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span><div><strong>{user.name}</strong><small>{user.role} · Log out</small></div></button>
    </aside>

    <main>
      <header>
        <div><p className="eyebrow">MEDIFLOW / HOSPITAL INTELLIGENCE</p><h1>{section === 'Overview' ? 'Good morning, Anita' : section}</h1></div>
        <div className="header-actions"><label className="header-search"><Icon name="search" /><input aria-label="Search MediFlow" placeholder="Search MediFlow" /></label><button className="icon-button" aria-label="Notifications"><Icon name="bell" /><i /></button><span className="date">Friday, 6 June 2025</span></div>
      </header>

      {section === 'Overview' && <Overview setSection={setSection} waiting={waiting.length} department={department} setDepartment={setDepartment} />}
      {section === 'Smart Queue' && <QueueView queue={filteredQueue} activeWaiting={activeWaiting} query={query} setQuery={setQuery} changeStatus={changeStatus} setShowAdd={setShowAdd} />}
      {section === 'Resources' && <Resources resolved={resolved} onResolve={(id) => { setResolved([...resolved, id]); notify('Recommendation marked as resolved.') }} />}
      {section === 'Follow-Up' && <FollowUp notify={notify} />}
      {section === 'AI Safety' && <AISafety notify={notify} />}
      {section === 'Body Analysis' && <BodyAnalysis assessments={assessments} onSave={(assessment) => { setAssessments([assessment, ...assessments]); notify('Assessment saved to the patient’s prototype health record.') }} notify={notify} role={user.role} />}
      {section === 'Audit' && <Audit />}
    </main>

    {showAdd && <div className="modal-backdrop" onMouseDown={() => setShowAdd(false)}><form className="modal" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const token = `Q-${1042 + queue.length}`; setQueue([...queue, { token, id: String(fd.get('id')), name: String(fd.get('name')), doctor: String(fd.get('doctor')), time: String(fd.get('time')), checkin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), priority: 'Normal', status: 'Waiting', actual: 0 }]); setShowAdd(false); notify(`${token} generated and patient added to queue.`) }} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">SMART QUEUE</p><h2>Register patient</h2></div><button type="button" onClick={() => setShowAdd(false)}>×</button></div><label>Patient ID<input required name="id" placeholder="PT-0000" /></label><label>Patient name<input required name="name" placeholder="Full name" /></label><label>Doctor<select name="doctor"><option>Dr. Mehta</option><option>Dr. Iyer</option><option>Dr. Shah</option></select></label><label>Appointment time<input required name="time" type="time" /></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary">Generate token</button></div></form></div>}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>
}

function Overview({ setSection, waiting, department, setDepartment }: { setSection: (s: Section) => void; waiting: number; department: string; setDepartment: (s: string) => void }) {
  const metrics = [
    ['Patients waiting', String(waiting), 'queue', '3 require attention', 'blue'],
    ['Average wait', '24 min', 'follow', '↓ 8% from yesterday', 'teal'],
    ['Delayed appointments', '4', 'audit', '2 over 30 minutes', 'amber'],
    ['Pending lab requests', '18', 'ai', '8 nearing SLA', 'violet'],
    ['Low-stock medicines', '6', 'resource', '2 critical', 'rose'],
    ['Beds available', '34', 'grid', '71% occupied', 'green'],
  ]
  return <div className="page">
    <div className="page-intro"><div><h2>Hospital Intelligence</h2><p>A unified view of operational flow, resources, and patient follow-up.</p></div><div className="filters"><select value={department} onChange={(e) => setDepartment(e.target.value)}><option>All departments</option><option>Cardiology</option><option>General Medicine</option><option>Orthopaedics</option></select><select><option>Today</option><option>Last 7 days</option><option>Last 30 days</option></select></div></div>
    <div className="metrics">{metrics.map(([label, value, icon, note, tone]) => <article className="metric" key={label}><div className={`metric-icon ${tone}`}><Icon name={icon} /></div><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></article>)}</div>
    <div className="dashboard-grid">
      <article className="card chart-card"><CardHead title="Waiting-time trend" subtitle="Estimated and actual average · minutes" action="View queue" onClick={() => setSection('Smart Queue')} /><div className="legend"><span><i className="dot blue" />Estimated</span><span><i className="dot teal" />Actual</span></div><div className="line-chart"><div className="y-labels"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><svg viewBox="0 0 600 190" preserveAspectRatio="none"><g className="grid-lines"><path d="M0 10H600M0 52H600M0 94H600M0 136H600M0 178H600" /></g><path className="area" d="M0 115L100 94L200 106L300 72L400 84L500 48L600 64V180H0Z" /><path className="estimate" d="M0 115L100 94L200 106L300 72L400 84L500 48L600 64" /><path className="actual" d="M0 128L100 110L200 90L300 94L400 74L500 67L600 81" /></svg><div className="x-labels"><span>8 AM</span><span>9 AM</span><span>10 AM</span><span>11 AM</span><span>12 PM</span><span>1 PM</span><span>2 PM</span></div></div><p className="prediction-note">Predictions use simulated appointment volume and a 15-minute sample consultation duration; they are not guaranteed wait times.</p></article>
      <article className="card"><CardHead title="Department workload" subtitle="Current utilization" action="View resources" onClick={() => setSection('Resources')} /><div className="workloads">{[['Cardiology', 88, 'High'], ['General Medicine', 76, 'Busy'], ['Orthopaedics', 62, 'Normal'], ['Paediatrics', 48, 'Normal']].map(([name, value, label]) => <div className="workload" key={name as string}><div><strong>{name}</strong><span>{label}</span></div><div className="bar"><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>)}</div></article>
      <article className="card"><CardHead title="Bed occupancy" subtitle="Across 118 total beds" /><div className="bed-panel"><div className="donut"><div><strong>71%</strong><span>occupied</span></div></div><div className="bed-legend"><span><i className="dot blue" />Occupied <b>84</b></span><span><i className="dot teal" />Available <b>34</b></span><span><i className="dot gray" />Maintenance <b>6</b></span></div></div></article>
      <article className="card"><CardHead title="Attention needed" subtitle="Priority operational signals" /><div className="attention-list">{recommendations.slice(0, 3).map((r) => <button key={r.id} onClick={() => setSection('Resources')}><span className={r.priority === 'High' ? 'alert-icon high' : 'alert-icon'}>!</span><div><strong>{r.title}</strong><small>{r.reason}</small></div><Icon name="arrow" /></button>)}</div></article>
    </div>
  </div>
}

function QueueView({ queue, activeWaiting, query, setQuery, changeStatus, setShowAdd }: any) {
  return <div className="page"><div className="page-intro"><div><h2>Smart Queue Intelligence</h2><p>Live-style patient flow and transparent waiting-time predictions.</p></div><button className="primary" onClick={() => setShowAdd(true)}><Icon name="plus" />Register patient</button></div>
    <div className="metrics compact">{[['Waiting', activeWaiting.length], ['In consultation', queue.filter((q: any) => q.status === 'In Consultation').length], ['Average wait', '24 min'], ['Available doctors', 7], ['Delayed', 4]].map(([l, v]) => <article className="metric" key={l as string}><div><p>{l}</p><strong>{v}</strong></div></article>)}</div>
    <article className="card table-card"><div className="table-tools"><div><h3>Live queue</h3><p>Positions update when patient status changes</p></div><label className="table-search"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient, ID or doctor" /></label></div><div className="table-wrap"><table><thead><tr><th>Token / Patient</th><th>Doctor</th><th>Appointment</th><th>Position</th><th>Predicted wait</th><th>Priority</th><th>Status</th></tr></thead><tbody>{queue.map((q: any) => { const position = activeWaiting.findIndex((x: any) => x.token === q.token) + 1; const estimate = position > 0 ? position * 15 : 0; return <tr key={q.token}><td><strong>{q.token}</strong><span>{q.name} · {q.id}</span></td><td>{q.doctor}</td><td>{q.time}<span>Checked in {q.checkin}</span></td><td>{position || '—'}</td><td><strong className={estimate >= 30 ? 'danger-text' : ''}>{estimate ? `≈ ${estimate} min` : '—'}</strong><span>Prediction</span></td><td><Badge tone={q.priority === 'Urgent' ? 'danger' : q.priority === 'High' ? 'warning' : 'neutral'}>{q.priority}</Badge></td><td><select className="status-select" value={q.status} onChange={(e) => changeStatus(q.token, e.target.value)}><option>Waiting</option><option>In Consultation</option><option>Completed</option><option>Cancelled</option></select></td></tr>})}</tbody></table></div></article>
    <div className="two-col"><article className="card"><CardHead title="Queue timeline" subtitle="Dr. Mehta · Room C-04" /><div className="timeline">{queue.filter((q: any) => q.doctor === 'Dr. Mehta').map((q: any, i: number) => <div className="timeline-item" key={q.token}><i className={q.status === 'In Consultation' ? 'current' : ''} /><span>{q.time}</span><div><strong>{q.name}</strong><small>{q.status}{i > 0 ? ` · predicted ${i * 15} min` : ''}</small></div></div>)}</div></article><article className="card"><CardHead title="Alternative slots" subtitle="When the assigned doctor is delayed" /><div className="slot-list">{[['Dr. Kapoor', 'Cardiology', '10:30'], ['Dr. Banerjee', 'General Medicine', '10:45']].map((s) => <button key={s[0]}><div><strong>{s[0]}</strong><small>{s[1]}</small></div><span>{s[2]}</span></button>)}</div><p className="prediction-note">Staff review is required before rescheduling an appointment.</p></article></div>
  </div>
}

function Resources({ resolved, onResolve }: { resolved: number[]; onResolve: (id: number) => void }) {
  return <div className="page"><div className="page-intro"><div><h2>Hospital Resource Intelligence</h2><p>Operational capacity signals to support—not replace—authorized staff decisions.</p></div><button className="secondary">Export snapshot</button></div>
    <div className="resource-strip">{[['Doctors available', '7 / 24', 29], ['Lab backlog', '18 requests', 68], ['Beds occupied', '84 / 118', 71], ['Pharmacy stock', '6 low items', 82]].map((x) => <article className="card" key={x[0] as string}><p>{x[0]}</p><strong>{x[1]}</strong><div className="bar"><i style={{ width: `${x[2]}%` }} /></div><small>{x[2]}% utilization</small></article>)}</div>
    <article className="card recommendations"><CardHead title="Smart Recommendations" subtitle={`${recommendations.length - resolved.length} items require staff review`} /><div>{recommendations.map((r) => <article className={resolved.includes(r.id) ? 'recommendation resolved' : 'recommendation'} key={r.id}><span className={r.priority === 'High' ? 'alert-icon high' : 'alert-icon'}>!</span><div className="recommendation-copy"><div><h3>{r.title}</h3><Badge tone={r.priority === 'High' ? 'danger' : 'warning'}>{r.priority}</Badge></div><p>{r.reason}</p><dl><dt>Related resource</dt><dd>{r.resource}</dd><dt>Suggested action</dt><dd>{r.action}</dd></dl></div><div className="recommendation-actions">{resolved.includes(r.id) ? <Badge tone="success">Resolved</Badge> : <><button className="secondary">View details</button><button className="primary small" onClick={() => onResolve(r.id)}>Mark resolved</button></>}</div></article>)}</div><p className="prediction-note">Recommendations are generated from demonstration thresholds and never perform clinical or operational actions automatically.</p></article>
  </div>
}

function FollowUp({ notify }: { notify: (s: string) => void }) {
  const [filter, setFilter] = useState('All')
  const rows = followUps.filter((f) => filter === 'All' || f.status === filter)
  return <div className="page"><div className="page-intro"><div><h2>Patient Follow-Up Center</h2><p>Connected follow-up, missed appointments, and in-app reminders.</p></div><button className="primary" onClick={() => notify('Follow-up form opened in prototype workflow.')}><Icon name="plus" />Schedule follow-up</button></div>
    <div className="metrics compact">{[['Upcoming', 12], ['Overdue', 5], ['Missed appointments', 3], ['Booking required', 7]].map(([l, v]) => <article className="metric" key={l as string}><div><p>{l}</p><strong>{v}</strong></div></article>)}</div>
    <article className="card table-card"><div className="table-tools"><div><h3>Follow-up worklist</h3><p>Patient-linked appointment activity</p></div><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option><option>Upcoming</option><option>Overdue</option><option>Missed</option></select></div><div className="table-wrap"><table><thead><tr><th>Patient</th><th>Doctor</th><th>Last visit</th><th>Follow-up due</th><th>Status</th><th>Reminder</th><th>Actions</th></tr></thead><tbody>{rows.map((f) => <tr key={f.id}><td><strong>{f.name}</strong><span>{f.id}</span></td><td>{f.doctor}</td><td>{f.last}</td><td>{f.due}</td><td><Badge tone={f.status === 'Overdue' || f.status === 'Missed' ? 'danger' : 'success'}>{f.status}</Badge></td><td>{f.reminder}</td><td><button className="link-button" onClick={() => notify(`Reminder created for ${f.name}.`)}>Send reminder</button></td></tr>)}</tbody></table></div></article><p className="prediction-note standalone">Any missed-appointment risk indicator is an experimental estimate based on sample historical data and is not a reliable prediction.</p>
  </div>
}

function AISafety({ notify }: { notify: (s: string) => void }) {
  const [reviewed, setReviewed] = useState<number[]>([])
  const warnings = [
    { category: 'Allergy information', severity: 'Review', info: 'Recorded allergy: “Antibiotic – exact agent not documented”', why: 'The allergy record is incomplete, so safe matching cannot be performed.', action: 'Clarify the allergy and reaction with the patient before finalizing.' },
    { category: 'Potential duplicate', severity: 'Medium', info: 'Current medicine list and draft both contain a pain-relief medicine.', why: 'The simulated rule found two entries from a similar medicine category. This is not a verified interaction.', action: 'Compare active medicines with the draft prescription.' },
    { category: 'Missing information', severity: 'High', info: 'Most recent renal function result is not available in this demo record.', why: 'The sample safety rule requires recent laboratory context for staff review.', action: 'Review available lab history or request appropriate information.' },
  ]
  return <div className="page"><div className="page-intro"><div><h2>AI Safety Review</h2><p>Explainable, rule-based demonstration alerts within the prescription workflow.</p></div><Badge tone="warning">Demonstration data</Badge></div>
    <div className="patient-banner"><div className="avatar">AP</div><div><strong>Aarav Patel</strong><span>PT-2084 · 47 years · Consultation with Dr. Mehta</span></div><div><small>Allergies</small><b>Incomplete record</b></div><div><small>Current medicines</small><b>3 active</b></div><div><small>Lab results</small><b>2 available</b></div></div>
    <div className="ai-grid"><section><div className="section-title"><div><h3>Safety review findings</h3><p>{warnings.length - reviewed.length} items awaiting review</p></div></div>{warnings.map((w, i) => <article className="warning-card" key={w.category}><div className="warning-head"><span className={w.severity === 'High' ? 'alert-icon high' : 'alert-icon'}>!</span><div><p>{w.category}</p><Badge tone={w.severity === 'High' ? 'danger' : 'warning'}>{w.severity}</Badge></div>{reviewed.includes(i) && <Badge tone="success">Reviewed</Badge>}</div><div className="warning-body"><h4>Relevant patient information</h4><p>{w.info}</p><h4>Why this was raised</h4><p>{w.why}</p><div className="review-action"><div><small>RECOMMENDED REVIEW ACTION</small><strong>{w.action}</strong></div>{!reviewed.includes(i) && <button className="secondary" onClick={() => { setReviewed([...reviewed, i]); notify('Warning marked as reviewed. Audit event recorded.') }}>Mark reviewed</button>}</div></div></article>)}</section>
      <aside className="consult-panel"><article className="card"><CardHead title="AI Recommendation Explanation" subtitle="Transparent sample reasoning" /><ol><li><span>1</span><p><strong>Patient context checked</strong>Allergies, active medicines, history, and available labs.</p></li><li><span>2</span><p><strong>Rules compared</strong>Draft items are compared against demonstration safety rules.</p></li><li><span>3</span><p><strong>Doctor review required</strong>No alert changes or finalizes the prescription.</p></li></ol></article><article className="card clinical-note"><h3>Clinical notes</h3><textarea placeholder="Add your clinical assessment and rationale…" /><button className="secondary" onClick={() => notify('Clinical note saved locally.')}>Save note</button></article><button className="primary final" onClick={() => notify('Final confirmation requires doctor attestation in this prototype.')}>Confirm final prescription</button><p className="responsibility">The doctor retains responsibility for every final clinical decision. These are simulated rule-based alerts, not validated medical facts.</p></aside></div>
  </div>
}

function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const [role, setRole] = useState<Role>('Hospital Administrator')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [email, setEmail] = useState('admin@mediflow.demo')
  const [password, setPassword] = useState('mediflow')
  const [error, setError] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || password.length < 4) return setError('Enter a valid username and a password of at least 4 characters.')
    onLogin(role)
  }
  return <div className="login-page">
    <section className="login-story">
      <div className="login-brand"><span className="brand-mark">M</span><span>Medi<strong>Flow</strong></span></div>
      <div className="story-copy"><Badge tone="success">Intelligent hospital operations</Badge><h1>Care moves better when information flows.</h1><p>One connected workspace for patient journeys, clinical reviews, resources, follow-ups, and accountable hospital operations.</p><div className="story-stats"><div><strong>7</strong><span>Role-based workspaces</span></div><div><strong>1</strong><span>Connected care journey</span></div><div><strong>24/7</strong><span>Operational visibility</span></div></div></div>
      <p className="demo-disclaimer">Demonstration environment · Fictional patient data only</p>
    </section>
    <section className="login-panel"><form className="login-card" onSubmit={submit}><div><p className="eyebrow">WELCOME TO MEDIFLOW</p><h2>Sign in to your workspace</h2><p>Use simulated access to explore role-specific workflows.</p></div>
      <label>Workspace role<select value={role} onChange={(e) => setRole(e.target.value as Role)}><option>Hospital Administrator</option><option>Doctor</option><option>Patient</option><option>Receptionist</option><option>Lab Technician</option><option>Pharmacist</option><option>Billing Staff</option></select></label>
      <label>Email or username<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@hospital.org" /></label>
      <label>Password<div className="password-field"><input type={passwordVisible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? 'Hide' : 'Show'}</button></div></label>
      <div className="login-options"><label><input type="checkbox" defaultChecked /> Remember me</label><button type="button" onClick={() => setError('Password recovery is simulated in this frontend prototype.')}>Forgot password?</button></div>
      {error && <div className="form-error">{error}</div>}
      <button className="primary login-submit">Sign in securely <Icon name="arrow" /></button>
      <button type="button" className="demo-login" onClick={() => onLogin(role)}>Continue with demo access</button>
      <p className="auth-note">Authentication is simulated. Production access must use backend-validated JWT and role permissions.</p>
    </form></section>
  </div>
}

function BodyAnalysis({ assessments, onSave, notify, role }: { assessments: Assessment[]; onSave: (a: Assessment) => void; notify: (s: string) => void; role: Role }) {
  const [age, setAge] = useState(47)
  const [height, setHeight] = useState(172)
  const [weight, setWeight] = useState(78.6)
  const [waist, setWaist] = useState(90)
  const [systolic, setSystolic] = useState(128)
  const [diastolic, setDiastolic] = useState(82)
  const [heartRate, setHeartRate] = useState(72)
  const [activity, setActivity] = useState('Moderately active')
  const bmi = height > 0 ? weight / Math.pow(height / 100, 2) : 0
  const adult = age >= 18
  const bmiLabel = !adult ? 'Specialist assessment needed' : bmi < 18.5 ? 'Below adult reference range' : bmi < 25 ? 'Within adult reference range' : bmi < 30 ? 'Worth monitoring' : 'Consider medical review'
  const previous = assessments[0]
  const change = previous ? weight - previous.weight : 0
  const save = () => {
    if (age < 1 || height < 50 || height > 250 || weight < 2 || weight > 400) return notify('Please review age, height, and weight values.')
    onSave({ date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), age, height, weight, waist, systolic, diastolic, heartRate, bmi: Number(bmi.toFixed(1)) })
  }
  return <div className="page"><div className="page-intro"><div><h2>Body Analysis & Health Insights</h2><p>Measurement-based context for Aarav Patel · PT-2084</p></div><div className="body-actions"><button className="secondary" onClick={() => window.print()}>Print summary</button><button className="primary" onClick={save}>Save assessment</button></div></div>
    <div className="clinical-disclaimer"><Icon name="audit" /><p><strong>General health information—not a diagnosis.</strong> Body Analysis provides general health information and measurement-based indicators. It does not diagnose medical conditions or replace a professional medical assessment. Consult a qualified healthcare professional for personalized interpretation.</p></div>
    <div className="body-layout"><section className="card assessment-form"><div className="card-head"><div><h3>New assessment</h3><p>Assessment date · Today</p></div><Badge tone="success">Calculated locally</Badge></div><div className="form-grid">
      <label>Age <span>years</span><input type="number" min="1" max="120" value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
      <label>Height <span>cm</span><input type="number" min="50" max="250" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></label>
      <label>Weight <span>kg</span><input type="number" min="2" max="400" step=".1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></label>
      <label>Waist <span>cm · optional</span><input type="number" value={waist} onChange={(e) => setWaist(Number(e.target.value))} /></label>
      <label>Systolic BP <span>mmHg</span><input type="number" value={systolic} onChange={(e) => setSystolic(Number(e.target.value))} /></label>
      <label>Diastolic BP <span>mmHg</span><input type="number" value={diastolic} onChange={(e) => setDiastolic(Number(e.target.value))} /></label>
      <label>Resting heart rate <span>bpm</span><input type="number" value={heartRate} onChange={(e) => setHeartRate(Number(e.target.value))} /></label>
      <label>Physical activity <span>self-reported</span><select value={activity} onChange={(e) => setActivity(e.target.value)}><option>Low activity</option><option>Moderately active</option><option>Highly active</option></select></label>
    </div><div className="calculation-note"><strong>BMI calculation</strong><span>Weight (kg) ÷ height² (m) = {weight} ÷ {(height / 100).toFixed(2)}² = {bmi.toFixed(1)}</span><p>BMI is a screening measure and does not directly measure body composition or overall health.</p></div></section>
      <aside className="body-summary"><article className="bmi-card"><div><p>Current calculated BMI</p><strong>{bmi.toFixed(1)}</strong><Badge tone={bmiLabel.includes('Within') ? 'success' : 'warning'}>{bmiLabel}</Badge></div><div className="bmi-scale"><i style={{ left: `${Math.min(92, Math.max(5, ((bmi - 15) / 25) * 100))}%` }} /><span>18.5</span><span>25</span><span>30</span></div><small>Adult reference thresholds shown only for ages 18+. Age and other factors affect interpretation.</small></article>
        <article className="card comparison"><CardHead title="Since last assessment" subtitle={previous?.date} /><div><div><span>Weight</span><strong>{change > 0 ? '+' : ''}{change.toFixed(1)} kg</strong></div><div><span>BMI</span><strong>{(bmi - (previous?.bmi || bmi)).toFixed(1)}</strong></div><div><span>Waist</span><strong>{waist - (previous?.waist || waist)} cm</strong></div></div><button className="secondary" onClick={() => notify('Previous assessment selected for comparison.')}>Compare previous assessment</button></article>
      </aside></div>
    <div className="insight-grid"><article className="card"><CardHead title="Potential Risk Factors to Review" subtitle="Based only on entered measurements" /><div className="indicator-list">
      <Indicator title="Adult BMI screening value" value={`${bmi.toFixed(1)} kg/m²`} state={bmiLabel} text={adult ? 'Compared with standard adult screening thresholds; one metric cannot determine health.' : 'Adult categories are not applied to children or adolescents.'} />
      <Indicator title="Recorded blood pressure" value={`${systolic}/${diastolic} mmHg`} state={systolic >= 130 || diastolic >= 80 ? 'Worth monitoring' : 'Within selected reference range'} text="A single reading may be affected by technique and context. Repeat correctly and discuss patterns with a clinician." />
      <Indicator title="Weight change" value={`${Math.abs(change).toFixed(1)} kg since ${previous?.date}`} state={Math.abs(change) >= 5 ? 'Consider medical review' : 'Worth monitoring'} text="Context, timeframe, and whether the change was intended are important." />
    </div></article>
      <article className="card age-insights"><CardHead title="Age Group Health Insights" subtitle={`${age >= 65 ? 'Older adult' : age >= 40 ? 'Adult' : age >= 18 ? 'Young adult' : 'Child or adolescent'} · configurable grouping`} /><div className="age-number">{age}<span>years</span></div><h4>General topics to discuss</h4><ul><li>Review blood pressure trends and cardiovascular risk factors.</li><li>Discuss locally appropriate preventive screening based on personal and family history.</li><li>Maintain regular movement, strength, sleep, and balanced nutrition.</li><li>Ask which measurements are most relevant to your individual care plan.</li></ul><p>Age groups organize general information; they are not diagnostic boundaries, and age alone cannot identify a health problem.</p></article>
    </div>
    <article className="card history-card"><div className="table-tools"><div><h3>Assessment history</h3><p>Saved measurements and non-diagnostic trends</p></div><div className="history-actions"><button className="secondary" onClick={() => notify(role === 'Patient' ? 'Assessment shared privately with the authorized care team.' : 'Assessment is available in the consultation record.')}>Share with doctor</button><button className="secondary">View all history</button></div></div><div className="history-content"><div className="mini-chart"><svg viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M10 20L200 58L390 67" /><circle cx="10" cy="20" r="4" /><circle cx="200" cy="58" r="4" /><circle cx="390" cy="67" r="4" /></svg><div><span>Nov 2024 · 82.1 kg</span><span>Mar 2025 · 79.4 kg</span><span>Today · {weight} kg</span></div></div><div className="history-table">{[...assessments].slice(0, 3).map((a) => <div key={a.date}><span>{a.date}</span><strong>{a.weight} kg</strong><span>BMI {a.bmi}</span><span>{a.systolic ? `${a.systolic}/${a.diastolic} mmHg` : 'BP not recorded'}</span></div>)}</div></div></article>
  </div>
}

function Indicator({ title, value, state, text }: { title: string; value: string; state: string; text: string }) {
  return <div className="indicator"><span className={state.includes('Within') ? 'indicator-icon good' : 'indicator-icon'}>!</span><div><div><strong>{title}</strong><Badge tone={state.includes('Within') ? 'success' : state.includes('medical') ? 'danger' : 'warning'}>{state}</Badge></div><b>{value}</b><p>{text}</p><small>Suggested next step: review the trend and discuss questions with a qualified healthcare professional.</small></div></div>
}

function Audit() {
  const [search, setSearch] = useState('')
  const rows = auditSeed.filter((a) => Object.values(a).join(' ').toLowerCase().includes(search.toLowerCase()))
  return <div className="page"><div className="page-intro"><div><h2>Audit and Access Monitoring</h2><p>Read-only activity history and role-based access signals.</p></div><button className="secondary">Configure permissions</button></div>
    <div className="security-banner"><Icon name="audit" /><div><strong>Frontend demonstration</strong><p>Production audit logging and permissions must be enforced and validated by the backend; interface restrictions alone are not sufficient.</p></div></div>
    <article className="card table-card"><div className="table-tools"><div><h3>System activity</h3><p>Recorded actions cannot be edited</p></div><label className="table-search"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, role, module" /></label></div><div className="table-wrap"><table><thead><tr><th>User / Role</th><th>Module accessed</th><th>Action performed</th><th>Record</th><th>Date and time</th><th>Outcome</th></tr></thead><tbody>{rows.map((a) => <tr key={a.time}><td><strong>{a.user}</strong><span>{a.role}</span></td><td>{a.module}</td><td>{a.action}</td><td>{a.record}</td><td>{a.time}</td><td><Badge tone={a.outcome === 'Denied' ? 'danger' : 'success'}>{a.outcome}</Badge></td></tr>)}</tbody></table></div></article>
  </div>
}

function CardHead({ title, subtitle, action, onClick }: { title: string; subtitle?: string; action?: string; onClick?: () => void }) {
  return <div className="card-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action && <button onClick={onClick}>{action}<Icon name="arrow" /></button>}</div>
}

export default App
