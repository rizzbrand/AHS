import {
  Acknowledgement,
  AuditEvent,
  AutomationRule,
  Contractor,
  Customer,
  Employee,
  EstimateRecord,
  IntegrationConnector,
  InvoiceRecord,
  JobDocument,
  Notice,
  Property,
  Responsibility,
  SessionUser,
  Sop,
  WorkOrder
} from './types';

export const company = {
  name: 'Assign Home Solutions',
  region: 'Washington, DC · Maryland · Virginia'
};

export const sessionUsers: SessionUser[] = [
  { id: 'u-jordan', name: 'Kay', title: 'Owner', role: 'owner', initials: 'K', personId: 'p-jordan' },
  { id: 'u-priya', name: 'Priya Shah', title: 'Operations Manager', role: 'operations', initials: 'PS', personId: 'p-priya' },
  { id: 'u-marcus', name: 'Marcus Webb', title: 'Estimator', role: 'estimator', initials: 'MW', personId: 'p-marcus' },
  { id: 'u-elena', name: 'Elena Voss', title: 'Dispatcher', role: 'dispatcher', initials: 'EV', personId: 'p-elena' },
  { id: 'u-andre', name: 'Andre Brooks', title: 'Field Technician', role: 'field', initials: 'AB', personId: 'p-andre' },
  { id: 'u-luis', name: 'Luis Ortega', title: 'Ortega Building Co.', role: 'contractor', initials: 'LO', contractorId: 'c-ortega' }
];

export const customers: Customer[] = [
  {
    id: 'cu-meridian',
    name: 'Meridian Property Group',
    kind: 'property_manager',
    contactName: 'Denise Okonkwo',
    contactRole: 'Director of Operations',
    email: 'denise.okonkwo@meridianpg.example',
    phone: '(202) 555-0148',
    region: 'Northern Virginia',
    since: '2022-05-01',
    terms: 'Net 30 · NTE $2,500 without approval',
    sources: ['dmg', 'reamsview', 'lula', 'guardian'],
    notes: 'Largest commercial account. Wants photo packages inside 24 hours of completion. Approvals go through Denise only.',
    contacts: [
      { name: 'Marco Ruiz', role: 'Regional Maintenance Lead', email: 'marco.ruiz@meridianpg.example', phone: '(703) 555-0151' },
      { name: 'Accounts Payable', role: 'Billing', email: 'ap@meridianpg.example' }
    ]
  },
  {
    id: 'cu-harborline',
    name: 'Harborline Residential',
    kind: 'portfolio',
    contactName: 'Aaron Pell',
    contactRole: 'Asset Manager',
    email: 'aaron.pell@harborline.example',
    phone: '(301) 555-0194',
    region: 'Maryland',
    since: '2023-09-12',
    terms: 'Net 45 · bids over $5,000 need asset manager sign-off',
    sources: ['asset24', 'pruvan', 'aspen'],
    notes: 'Mixed portfolio of rentals and vacant REO homes. Vacant homes need meter photos on every visit.',
    contacts: [{ name: 'Tasha Greene', role: 'Portfolio Coordinator', email: 'tasha.greene@harborline.example', phone: '(301) 555-0102' }]
  },
  {
    id: 'cu-district',
    name: 'District Civic Facilities',
    kind: 'institutional',
    contactName: 'Renee Walsh',
    contactRole: 'Facilities Coordinator',
    email: 'renee.walsh@districtcivic.example',
    phone: '(202) 555-0177',
    region: 'Washington, DC',
    since: '2024-02-20',
    terms: 'Net 60 · purchase order required before work starts',
    sources: ['guardian', 'dmg'],
    notes: 'Public facilities. Every crew member needs a visitor pass. Certificates of insurance must name the district as additional insured.',
    contacts: [{ name: 'Procurement Desk', role: 'Purchase orders', email: 'po@districtcivic.example', phone: '(202) 555-0190' }]
  },
  {
    id: 'cu-kingsway',
    name: 'Kingsway Offices LLC',
    kind: 'direct',
    contactName: 'Helen Cho',
    contactRole: 'Building Manager',
    email: 'helen.cho@kingsway.example',
    phone: '(202) 555-0112',
    region: 'Washington, DC',
    since: '2025-07-08',
    terms: 'Due on receipt',
    sources: ['direct'],
    notes: 'Direct client from a referral. Calls Helen first for anything after hours.',
    contacts: []
  }
];

export const properties: Property[] = [
  {
    id: 'pr-northside', name: 'Northside Plaza', customerId: 'cu-meridian', address: '1400 Wilson Blvd', city: 'Arlington', state: 'VA', zip: '22209', type: 'retail',
    accessNotes: 'Loading dock after 8:00. Ask security for the roof hatch key.',
    size: '86,000 sq ft · 14 storefronts', yearBuilt: 1998, hazards: ['Active retail traffic at the main entrance', 'Roof hatch requires fall protection'],
    siteContact: { name: 'Gerald Fitch', role: 'Security desk', phone: '(703) 555-0170' }
  },
  {
    id: 'pr-oak', name: 'Oak Street Residence', customerId: 'cu-harborline', address: '418 Oak St', city: 'Hyattsville', state: 'MD', zip: '20781', type: 'single_family',
    accessNotes: 'Lockbox on the rear gate. Code is on the work order packet.',
    size: '1,650 sq ft · 3 bed', yearBuilt: 1952, hazards: ['Vacant. Possible squatters reported in August', 'Lead paint likely'],
    siteContact: { name: 'Tasha Greene', role: 'Portfolio Coordinator', phone: '(301) 555-0102' }
  },
  {
    id: 'pr-maple', name: 'Maple Ridge', customerId: 'cu-meridian', address: '901 Duke St', city: 'Alexandria', state: 'VA', zip: '22314', type: 'multifamily',
    accessNotes: 'Check in with the leasing office before entering occupied units.',
    size: '112 units · 4 buildings', yearBuilt: 2006, hazards: ['Steep roof valleys on building C'],
    siteContact: { name: 'Leasing office', role: 'Front desk', phone: '(703) 555-0129' }
  },
  {
    id: 'pr-riverbend', name: 'Riverbend Apartments', customerId: 'cu-harborline', address: '2200 Bel Pre Rd', city: 'Silver Spring', state: 'MD', zip: '20906', type: 'multifamily',
    accessNotes: 'Use the service drive. Do not block resident parking.',
    size: '240 units · 6 buildings', yearBuilt: 1987, hazards: ['Aging flat roofs with soft spots near drains'],
    siteContact: { name: 'Omar Haddad', role: 'Property Manager', phone: '(301) 555-0145' }
  },
  {
    id: 'pr-kingsway', name: 'Kingsway Offices', customerId: 'cu-kingsway', address: '1100 15th St NW', city: 'Washington', state: 'DC', zip: '20005', type: 'office',
    accessNotes: 'Freight elevator only. Building engineer is on site until 4:00.',
    size: '9 floors · 140,000 sq ft', yearBuilt: 1979, hazards: ['Occupied offices. Keep corridors clear'],
    siteContact: { name: 'Sam Odeh', role: 'Building Engineer', phone: '(202) 555-0131' }
  },
  {
    id: 'pr-capitol', name: 'Capitol Heights Preserve', customerId: 'cu-harborline', address: '612 Suffolk Ave', city: 'Capitol Heights', state: 'MD', zip: '20743', type: 'single_family',
    accessNotes: 'Vacant. Water is off. Photograph the meter before any work.',
    size: '1,320 sq ft · 2 bed', yearBuilt: 1961, hazards: ['Water off', 'Basement window broken. Glass on floor'],
    siteContact: { name: 'Tasha Greene', role: 'Portfolio Coordinator', phone: '(301) 555-0102' }
  },
  {
    id: 'pr-falls', name: 'Broad Street Retail', customerId: 'cu-meridian', address: '301 W Broad St', city: 'Falls Church', state: 'VA', zip: '22046', type: 'retail',
    accessNotes: 'Storefront door is the work location. Side alley for materials.',
    size: '6 storefronts', yearBuilt: 1972, hazards: ['Sidewalk work needs cones'],
    siteContact: { name: 'Marco Ruiz', role: 'Regional Maintenance Lead', phone: '(703) 555-0151' }
  },
  {
    id: 'pr-bethesda', name: 'Bethesda Commons', customerId: 'cu-district', address: '4801 Bethesda Ave', city: 'Bethesda', state: 'MD', zip: '20814', type: 'mixed_use',
    accessNotes: 'Garage clearance is 9 feet. Roof access through stair B.',
    size: '5 floors · retail and offices', yearBuilt: 2011, hazards: ['Active leak above suite 310', 'Possible mold behind drywall'],
    siteContact: { name: 'Renee Walsh', role: 'Facilities Coordinator', phone: '(202) 555-0177' }
  },
  {
    id: 'pr-college', name: 'Knox Road Annex', customerId: 'cu-district', address: '4500 Knox Rd', city: 'College Park', state: 'MD', zip: '20740', type: 'institutional',
    accessNotes: 'Campus visitor pass required at the gate.',
    size: '3 floors · 38,000 sq ft', yearBuilt: 1968, hazards: ['Asbestos survey on file. Do not disturb ceiling tiles'],
    siteContact: { name: 'Campus facilities', role: 'Gate office', phone: '(301) 555-0186' }
  },
  {
    id: 'pr-tysons', name: 'Tysons Yard', customerId: 'cu-harborline', address: '1750 Tysons Blvd', city: 'Tysons', state: 'VA', zip: '22102', type: 'office',
    accessNotes: 'After-hours work only. Loading level P1.',
    size: '12 floors · 260,000 sq ft', yearBuilt: 2015, hazards: [],
    siteContact: { name: 'Night security', role: 'Lobby desk', phone: '(703) 555-0158' }
  }
];

export const employees: Employee[] = [
  { id: 'p-jordan', name: 'Kay', title: 'Owner', role: 'owner', status: 'available', base: 'Arlington, VA', phone: '(703) 555-0101', startedAt: '2019-04-01' },
  { id: 'p-priya', name: 'Priya Shah', title: 'Operations Manager', role: 'operations', status: 'available', base: 'Arlington, VA', phone: '(703) 555-0104', startedAt: '2025-11-03' },
  { id: 'p-marcus', name: 'Marcus Webb', title: 'Estimator', role: 'estimator', status: 'available', base: 'Washington, DC', phone: '(202) 555-0166', startedAt: '2026-02-16' },
  { id: 'p-elena', name: 'Elena Voss', title: 'Dispatcher', role: 'dispatcher', status: 'available', base: 'Silver Spring, MD', phone: '(301) 555-0133', startedAt: '2026-06-01' },
  { id: 'p-andre', name: 'Andre Brooks', title: 'Field Technician', role: 'field', status: 'on_job', base: 'Washington, DC', phone: '(202) 555-0188', startedAt: '2026-03-09' },
  { id: 'p-camille', name: 'Camille Nguyen', title: 'Field Technician', role: 'field', status: 'available', base: 'Alexandria, VA', phone: '(703) 555-0190', startedAt: '2026-08-24' }
];

export const contractors: Contractor[] = [
  {
    id: 'c-ortega',
    company: 'Ortega Building Co.',
    contactName: 'Luis Ortega',
    phone: '(571) 555-0142',
    email: 'luis@ortegabuilding.example',
    trades: ['door_repair', 'handyman'],
    serviceArea: 'Arlington, Falls Church, DC',
    status: 'active',
    verification: 'verified',
    jobsCompleted: 46,
    rating: 4.8,
    onTimeRate: 96,
    docCompliance: 98,
    availability: 'Available tomorrow morning',
    notes: 'Strongest door crew in Northern Virginia. Carries his own closer stock. Do not send to occupied residential units without an escort.',
    history: [
      { id: 'ch-ortega-1', at: '2025-03-12T10:00', actor: 'Kay', action: 'Approved contractor', detail: 'Application → Active' },
      { id: 'ch-ortega-2', at: '2026-02-14T09:15', actor: 'Priya Shah', action: 'Recorded document', detail: 'General liability renewed to Feb 14, 2027' }
    ]
  },
  {
    id: 'c-greenline',
    company: 'Greenline Grounds',
    contactName: 'Aisha Grant',
    phone: '(703) 555-0177',
    email: 'aisha@greenlinegrounds.example',
    trades: ['landscaping', 'property_preservation'],
    serviceArea: 'Alexandria, Arlington, DC',
    status: 'active',
    verification: 'verified',
    jobsCompleted: 31,
    rating: 4.6,
    onTimeRate: 91,
    docCompliance: 82,
    availability: 'On a job until 2:00',
    notes: 'Reliable on cuts and cleanups. After photos arrive late about one job in five. Remind the crew lead at assignment.',
    history: [{ id: 'ch-green-1', at: '2025-06-02T11:00', actor: 'Kay', action: 'Approved contractor', detail: 'Application → Active' }]
  },
  {
    id: 'c-peak',
    company: 'Peak Roofing Partners',
    contactName: 'Chris Daley',
    phone: '(301) 555-0119',
    email: 'chris@peakroofing.example',
    trades: ['roofing'],
    serviceArea: 'Silver Spring, Bethesda, College Park',
    status: 'document_verification',
    verification: 'in_review',
    jobsCompleted: 12,
    rating: 4.4,
    onTimeRate: 88,
    docCompliance: 75,
    availability: 'Hold — insurance expiring',
    notes: 'Good valley and flashing work. Held in document verification until the general liability certificate is renewed.',
    history: [
      { id: 'ch-peak-1', at: '2026-04-20T13:00', actor: 'Priya Shah', action: 'Moved stage', detail: 'Review → Document verification' },
      { id: 'ch-peak-2', at: '2026-09-18T10:05', actor: 'Priya Shah', action: 'Flagged document', detail: 'General liability expires October 20' }
    ]
  },
  {
    id: 'c-clearpath',
    company: 'ClearPath Remediation',
    contactName: 'Noah Ibekwe',
    phone: '(202) 555-0163',
    email: 'noah@clearpathremediation.example',
    trades: ['remediation'],
    serviceArea: 'DMV',
    status: 'application',
    verification: 'unverified',
    jobsCompleted: 0,
    rating: 0,
    onTimeRate: 0,
    docCompliance: 0,
    availability: 'Not yet approved',
    notes: 'Applied after the Bethesda Commons leak. Claims IICRC water damage certification. No paperwork received yet.',
    history: [{ id: 'ch-clear-1', at: '2026-09-29T15:40', actor: 'Noah Ibekwe', action: 'Submitted application', detail: 'Remediation, DMV' }]
  }
];

const doorPhotos = (done: number) =>
  ['Front elevation', 'Damage close-up', 'Work in progress', 'Completed repair', 'Site condition'].map((category, index) => ({
    category,
    done: index < done
  }));

export const workOrders: WorkOrder[] = [
  {
    id: 'wo-24110',
    number: 'WO-24110',
    source: 'dmg',
    externalId: 'DMG-88211',
    service: 'door_repair',
    priority: 'urgent',
    status: 'NEW',
    createdAt: '2026-10-02',
    dueAt: '2026-10-03',
    propertyId: 'pr-northside',
    customerId: 'cu-meridian',
    scope: 'Storefront aluminum door will not latch. DMG notes a closer failure and a cracked threshold. Secure the opening the same day if the door cannot be repaired in place.',
    internalNotes: 'Imported this morning. No one has reviewed scope. Do not send pricing back to DMG until Marcus confirms the closer model.',
    inspectionRequired: true,
    photos: doorPhotos(0)
  },
  {
    id: 'wo-24111',
    number: 'WO-24111',
    source: 'asset24',
    externalId: '24A-55142',
    service: 'property_preservation',
    priority: 'normal',
    status: 'REVIEW',
    createdAt: '2026-10-01',
    dueAt: '2026-10-06',
    propertyId: 'pr-oak',
    customerId: 'cu-harborline',
    assigneeId: 'p-marcus',
    scope: 'Initial secure, grass cut, and debris haul on a vacant single family. Confirm winterization is not already complete before adding it to the estimate.',
    internalNotes: '24 Asset packet includes last month’s grass cut. Check for duplicate before dispatch.',
    inspectionRequired: true,
    photos: [
      { category: 'Front elevation', done: true },
      { category: 'Yard condition', done: true },
      { category: 'Lock change', done: false },
      { category: 'Debris pile', done: false }
    ]
  },
  {
    id: 'wo-24112',
    number: 'WO-24112',
    source: 'reamsview',
    externalId: 'RV-19044',
    service: 'landscaping',
    priority: 'normal',
    status: 'INSPECTION_REQUIRED',
    createdAt: '2026-09-30',
    dueAt: '2026-10-04',
    propertyId: 'pr-maple',
    customerId: 'cu-meridian',
    assigneeId: 'p-camille',
    scheduledStart: '2026-10-03T09:00',
    scheduledEnd: '2026-10-03T12:00',
    scope: 'Common-area cleanup after a storm. Remove downed limbs along Duke Street and reset two leaning shrubs at the leasing entrance.',
    internalNotes: 'Inspection is required because REAMSView photos do not show the rear courtyard.',
    inspectionRequired: true,
    photos: [
      { category: 'Approach', done: false },
      { category: 'Storm debris', done: false },
      { category: 'Completed beds', done: false }
    ]
  },
  {
    id: 'wo-24113',
    number: 'WO-24113',
    source: 'pruvan',
    externalId: 'PRV-77210',
    service: 'roofing',
    priority: 'high',
    status: 'ESTIMATE_PREPARING',
    createdAt: '2026-09-28',
    dueAt: '2026-10-05',
    propertyId: 'pr-riverbend',
    customerId: 'cu-harborline',
    assigneeId: 'p-marcus',
    scope: 'Active leak above the third-floor corridor. Pruvan inspection already captured wet drywall. Price a temporary dry-in and a shingle repair, separately.',
    internalNotes: 'Marcus is waiting on Peak Roofing’s unit price before the estimate goes to JobTread.',
    inspectionRequired: true,
    photos: [
      { category: 'Roof overview', done: true },
      { category: 'Leak entry', done: true },
      { category: 'Interior stain', done: true },
      { category: 'Temporary cover', done: false }
    ],
    estimate: 6400
  },
  {
    id: 'wo-24114',
    number: 'WO-24114',
    source: 'guardian',
    externalId: 'GRD-39018',
    service: 'handyman',
    priority: 'normal',
    status: 'AWAITING_APPROVAL',
    createdAt: '2026-09-26',
    dueAt: '2026-10-08',
    propertyId: 'pr-kingsway',
    customerId: 'cu-kingsway',
    assigneeId: 'p-marcus',
    scope: 'Replace two failed door closers on the 4th floor and patch the drywall where the old arm pulled out of the jamb.',
    internalNotes: 'Estimate is in JobTread. Waiting on Helen Cho. Do not schedule until approval lands.',
    inspectionRequired: false,
    photos: doorPhotos(2),
    estimate: 1860,
    approvedAmount: undefined,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24115',
    number: 'WO-24115',
    source: 'aspen',
    externalId: 'AG-22190',
    service: 'remediation',
    priority: 'high',
    status: 'APPROVED',
    createdAt: '2026-09-24',
    dueAt: '2026-10-07',
    propertyId: 'pr-bethesda',
    customerId: 'cu-district',
    scope: 'Contain and dry a mechanical-room leak. Moisture readings are already in the Aspen Grove packet. Approved not to exceed the submitted dry-out.',
    internalNotes: 'Approved amount is recorded. ClearPath is not eligible until onboarding finishes, so this stays with Andre.',
    inspectionRequired: true,
    photos: [
      { category: 'Moisture map', done: true },
      { category: 'Containment', done: false },
      { category: 'Drying equipment', done: false },
      { category: 'Clearance readings', done: false }
    ],
    estimate: 9200,
    approvedAmount: 8800,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24116',
    number: 'WO-24116',
    source: 'lula',
    externalId: 'LULA-44102',
    service: 'door_repair',
    priority: 'high',
    status: 'READY_FOR_DISPATCH',
    createdAt: '2026-09-29',
    dueAt: '2026-10-03',
    propertyId: 'pr-falls',
    customerId: 'cu-meridian',
    scope: 'Retail entrance door drags on the concrete. Adjust the pivot and replace the sweep. Lula marked this tenant-facing.',
    internalNotes: 'Approved. Ortega can take this if Andre is still at College Park.',
    inspectionRequired: false,
    photos: doorPhotos(0),
    estimate: 740,
    approvedAmount: 740,
    contractorCost: 420,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24117',
    number: 'WO-24117',
    source: 'direct',
    externalId: 'DIR-0074',
    service: 'facility',
    priority: 'normal',
    status: 'SCHEDULED',
    createdAt: '2026-09-22',
    dueAt: '2026-10-02',
    scheduledStart: '2026-10-02T13:30',
    scheduledEnd: '2026-10-02T16:30',
    propertyId: 'pr-kingsway',
    customerId: 'cu-kingsway',
    assigneeId: 'p-andre',
    scope: 'Quarterly common-area punch: lobby threshold, two stained ceiling tiles, and a loose handrail on the mezzanine.',
    internalNotes: 'Direct client. Andre is the only person who should be on site. No contractor substitution without Helen’s approval.',
    inspectionRequired: false,
    photos: [
      { category: 'Lobby condition', done: false },
      { category: 'Ceiling tiles', done: false },
      { category: 'Handrail', done: false },
      { category: 'Completed lobby', done: false }
    ],
    estimate: 2100,
    approvedAmount: 2100,
    contractorCost: 0,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24118',
    number: 'WO-24118',
    source: 'dmg',
    externalId: 'DMG-88402',
    service: 'facility',
    priority: 'high',
    status: 'IN_PROGRESS',
    createdAt: '2026-10-01',
    dueAt: '2026-10-02',
    scheduledStart: '2026-10-02T08:00',
    scheduledEnd: '2026-10-02T12:00',
    propertyId: 'pr-college',
    customerId: 'cu-district',
    assigneeId: 'p-andre',
    scope: 'Replace a failed corridor door closer and secure a loose access panel before the afternoon class change.',
    internalNotes: 'Andre checked in at 8:11. Campus escort is with him.',
    inspectionRequired: false,
    photos: [
      { category: 'Front elevation', done: true },
      { category: 'Damage close-up', done: true },
      { category: 'Work in progress', done: true },
      { category: 'Completed repair', done: false },
      { category: 'Site condition', done: false }
    ],
    estimate: 980,
    approvedAmount: 980,
    contractorCost: 0,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24119',
    number: 'WO-24119',
    source: 'asset24',
    externalId: '24A-55208',
    service: 'landscaping',
    priority: 'normal',
    status: 'AWAITING_DOCUMENTATION',
    createdAt: '2026-09-27',
    dueAt: '2026-10-01',
    scheduledStart: '2026-10-01T10:00',
    scheduledEnd: '2026-10-01T14:00',
    propertyId: 'pr-capitol',
    customerId: 'cu-harborline',
    contractorId: 'c-greenline',
    scope: 'Initial grass cut and shrub trim on a preservation property. Leave the beds photographed before and after.',
    internalNotes: 'Work is done on site. Greenline has not uploaded the after photos, so the job cannot move to review.',
    inspectionRequired: false,
    photos: [
      { category: 'Before yard', done: true },
      { category: 'Debris', done: true },
      { category: 'Mow lines', done: true },
      { category: 'After front', done: false },
      { category: 'After rear', done: false }
    ],
    estimate: 450,
    approvedAmount: 450,
    contractorCost: 280,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24120',
    number: 'WO-24120',
    source: 'guardian',
    externalId: 'GRD-39112',
    service: 'roofing',
    priority: 'high',
    status: 'SUBMITTED_FOR_REVIEW',
    createdAt: '2026-09-20',
    dueAt: '2026-10-02',
    scheduledStart: '2026-10-01T07:30',
    scheduledEnd: '2026-10-01T15:30',
    propertyId: 'pr-maple',
    customerId: 'cu-meridian',
    contractorId: 'c-peak',
    scope: 'Replace a valley section over the leasing office and document the dry-in before the afternoon rain.',
    internalNotes: 'Peak submitted the package last night. Priya still needs to confirm the valley photo matches the scope.',
    inspectionRequired: true,
    photos: [
      { category: 'Roof overview', done: true },
      { category: 'Damage', done: true },
      { category: 'Dry-in', done: true },
      { category: 'Completed valley', done: true },
      { category: 'Ground condition', done: true }
    ],
    estimate: 5400,
    approvedAmount: 5200,
    contractorCost: 3600,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24121',
    number: 'WO-24121',
    source: 'direct',
    externalId: 'DIR-0068',
    service: 'handyman',
    priority: 'low',
    status: 'COMPLETED',
    createdAt: '2026-09-18',
    dueAt: '2026-09-25',
    propertyId: 'pr-kingsway',
    customerId: 'cu-kingsway',
    assigneeId: 'p-camille',
    scope: 'Rehang a conference-room door and replace the strike plate.',
    internalNotes: 'Documentation accepted. Ready for JobTread invoicing.',
    inspectionRequired: false,
    photos: doorPhotos(5),
    estimate: 620,
    approvedAmount: 620,
    contractorCost: 0,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24122',
    number: 'WO-24122',
    source: 'lula',
    externalId: 'LULA-43880',
    service: 'remediation',
    priority: 'normal',
    status: 'INVOICED',
    createdAt: '2026-09-12',
    dueAt: '2026-09-20',
    propertyId: 'pr-riverbend',
    customerId: 'cu-harborline',
    assigneeId: 'p-andre',
    scope: 'Dry a bathroom leak in unit 3B and replace the affected baseboard.',
    internalNotes: 'Invoice handed to JobTread. Lula has not released payment.',
    inspectionRequired: true,
    photos: [
      { category: 'Moisture map', done: true },
      { category: 'Containment', done: true },
      { category: 'Drying equipment', done: true },
      { category: 'Clearance readings', done: true }
    ],
    estimate: 3100,
    approvedAmount: 3100,
    contractorCost: 0,
    paymentStatus: 'overdue'
  },
  {
    id: 'wo-24123',
    number: 'WO-24123',
    source: 'pruvan',
    externalId: 'PRV-76991',
    service: 'facility',
    priority: 'normal',
    status: 'CLOSED',
    createdAt: '2026-09-02',
    dueAt: '2026-09-10',
    propertyId: 'pr-tysons',
    customerId: 'cu-harborline',
    assigneeId: 'p-camille',
    scope: 'After-hours lobby lighting troubleshooting and ballast replacement.',
    internalNotes: 'Paid. Closed by Kay on September 28.',
    inspectionRequired: false,
    photos: [
      { category: 'Fixture before', done: true },
      { category: 'Fixture after', done: true }
    ],
    estimate: 1480,
    approvedAmount: 1480,
    contractorCost: 0,
    paymentStatus: 'paid'
  },
  {
    id: 'wo-24124',
    number: 'WO-24124',
    source: 'reamsview',
    externalId: 'RV-19088',
    service: 'door_repair',
    priority: 'high',
    status: 'ASSIGNED',
    createdAt: '2026-10-01',
    dueAt: '2026-10-04',
    propertyId: 'pr-northside',
    customerId: 'cu-meridian',
    contractorId: 'c-ortega',
    scope: 'Service corridor door closer failed. Ortega is assigned and has not accepted yet.',
    internalNotes: 'Contractor view must hide Meridian’s phone number and the approved amount.',
    inspectionRequired: false,
    photos: doorPhotos(0),
    estimate: 510,
    approvedAmount: 510,
    contractorCost: 290,
    paymentStatus: 'unbilled'
  },
  {
    id: 'wo-24125',
    number: 'WO-24125',
    source: 'aspen',
    externalId: 'AG-22240',
    service: 'property_preservation',
    priority: 'normal',
    status: 'INSPECTION_COMPLETE',
    createdAt: '2026-09-29',
    dueAt: '2026-10-09',
    propertyId: 'pr-capitol',
    customerId: 'cu-harborline',
    assigneeId: 'p-camille',
    scope: 'Re-inspection after a lock change. Camille found an unsecured basement window that was not on the original Aspen Grove order.',
    internalNotes: 'Add the basement window to the estimate before this returns to the client.',
    inspectionRequired: true,
    photos: [
      { category: 'Front elevation', done: true },
      { category: 'Lock change', done: true },
      { category: 'Basement window', done: true },
      { category: 'Yard condition', done: true }
    ]
  }
];

export const documents: JobDocument[] = [
  { id: 'doc-peak-gl', name: 'Peak Roofing general liability', category: 'insurance', related: 'Peak Roofing Partners', relatedId: 'c-peak', expiresAt: '2026-10-20', version: '2025', updatedAt: '2025-10-20', restricted: true },
  { id: 'doc-ortega-gl', name: 'Ortega Building general liability', category: 'insurance', related: 'Ortega Building Co.', relatedId: 'c-ortega', expiresAt: '2027-02-14', version: '2026', updatedAt: '2026-02-14', restricted: true },
  { id: 'doc-ortega-lic', name: 'Virginia contractor license', category: 'license', related: 'Ortega Building Co.', relatedId: 'c-ortega', expiresAt: '2027-06-30', version: '2026', updatedAt: '2026-01-08', restricted: true },
  { id: 'doc-green-coi', name: 'Greenline certificate of insurance', category: 'insurance', related: 'Greenline Grounds', relatedId: 'c-greenline', expiresAt: '2027-04-01', version: '2026', updatedAt: '2026-04-01', restricted: true },
  { id: 'doc-green-lic', name: 'Virginia landscape contractor license', category: 'license', related: 'Greenline Grounds', relatedId: 'c-greenline', expiresAt: '2027-03-31', version: '2026', updatedAt: '2026-03-31', restricted: true },
  { id: 'doc-peak-lic', name: 'Maryland home improvement license', category: 'license', related: 'Peak Roofing Partners', relatedId: 'c-peak', expiresAt: '2027-05-01', version: '2026', updatedAt: '2026-05-01', restricted: true },
  { id: 'doc-camille-osha', name: 'Camille Nguyen OSHA-10', category: 'certification', related: 'Camille Nguyen', relatedId: 'p-camille', expiresAt: '2026-10-25', version: '2021', updatedAt: '2021-10-25', restricted: false },
  { id: 'doc-24120', name: 'Maple Ridge valley completion report', category: 'completion', related: 'WO-24120', relatedId: 'wo-24120', version: '1', updatedAt: '2026-10-01', restricted: false, uploadedBy: 'Luis Ortega' },
  {
    id: 'doc-24125', name: 'Capitol Heights inspection notes', category: 'inspection', related: 'WO-24125', relatedId: 'wo-24125', version: '2', updatedAt: '2026-09-30', restricted: false, uploadedBy: 'Camille Nguyen',
    history: [{ version: '1', updatedAt: '2026-09-29', by: 'Camille Nguyen', note: 'First walk. Basement not yet accessed' }]
  },
  {
    id: 'doc-kingsway', name: 'Kingsway vendor packet', category: 'customer', related: 'Kingsway Offices LLC', relatedId: 'cu-kingsway', version: '3', updatedAt: '2026-08-12', restricted: true, uploadedBy: 'Priya Shah',
    history: [
      { version: '2', updatedAt: '2026-01-15', by: 'Priya Shah', note: 'New W-9 and rate sheet' },
      { version: '1', updatedAt: '2025-07-08', by: 'Kay', note: 'Onboarding packet' }
    ]
  },
  {
    id: 'doc-meridian-msa', name: 'Meridian master service agreement', category: 'customer', related: 'Meridian Property Group', relatedId: 'cu-meridian', expiresAt: '2027-04-30', version: '3', updatedAt: '2026-05-01', restricted: true, uploadedBy: 'Kay',
    history: [
      { version: '2', updatedAt: '2025-05-01', by: 'Kay', note: 'NTE raised to $2,500' },
      { version: '1', updatedAt: '2022-05-01', by: 'Kay', note: 'Original agreement' }
    ]
  },
  { id: 'doc-harbor-vendor', name: 'Harborline vendor requirements', category: 'customer', related: 'Harborline Residential', relatedId: 'cu-harborline', version: '2', updatedAt: '2026-03-02', restricted: true, uploadedBy: 'Priya Shah' },
  { id: 'doc-district-ai', name: 'District additional-insured requirement', category: 'customer', related: 'District Civic Facilities', relatedId: 'cu-district', version: '1', updatedAt: '2024-02-20', restricted: true, uploadedBy: 'Priya Shah' },
  { id: 'doc-northside-roof', name: 'Northside Plaza roof access plan', category: 'property', related: 'Northside Plaza', relatedId: 'pr-northside', version: '1', updatedAt: '2025-11-04', restricted: false, uploadedBy: 'Priya Shah' },
  { id: 'doc-knox-asbestos', name: 'Knox Road Annex asbestos survey', category: 'property', related: 'Knox Road Annex', relatedId: 'pr-college', expiresAt: '2027-01-15', version: '2024', updatedAt: '2024-01-15', restricted: false, uploadedBy: 'Renee Walsh' },
  { id: 'doc-bethesda-moisture', name: 'Bethesda Commons moisture map', category: 'property', related: 'Bethesda Commons', relatedId: 'pr-bethesda', version: '1', updatedAt: '2026-09-30', restricted: false, uploadedBy: 'Marcus Webb' },
  { id: 'doc-24121', name: 'Kingsway closer replacement photo package', category: 'completion', related: 'WO-24121', relatedId: 'wo-24121', version: '1', updatedAt: '2026-09-25', restricted: false, uploadedBy: 'Camille Nguyen' },
  { id: 'doc-24123', name: 'Tysons Yard lobby repair sign-off', category: 'completion', related: 'WO-24123', relatedId: 'wo-24123', version: '1', updatedAt: '2026-09-10', restricted: false, uploadedBy: 'Camille Nguyen' },
  { id: 'doc-andre-osha', name: 'Andre Brooks OSHA-10', category: 'certification', related: 'Andre Brooks', relatedId: 'p-andre', expiresAt: '2028-03-01', version: '2023', updatedAt: '2023-03-01', restricted: false }
];

export const sops: Sop[] = [
  {
    id: 'sop-door-photos',
    title: 'Door repair photo standard',
    category: 'Documentation',
    purpose: 'Make a door repair defensible to the source platform and to JobTread without a second site visit.',
    role: 'Field employee, contractor',
    audience: ['field', 'contractor', 'estimator'],
    ownerId: 'p-priya',
    steps: [
      'Photograph the full elevation before tools come out.',
      'Photograph the damage close enough to identify the failed part.',
      'Photograph the repair while it is open, before the cover goes back on.',
      'Photograph the completed door operating.',
      'Photograph the surrounding site so the client can see it was left clean.'
    ],
    tools: ['Phone camera', 'Door closer kit', 'Work order packet'],
    safety: ['Prop heavy storefront doors with a wedge, never by hand, while the closer is off'],
    quality: 'Five required categories. A job cannot be submitted with any category empty.',
    issues: ['Glare on aluminum storefronts', 'Security refusing exterior photos', 'Before photo taken after disassembly'],
    escalation: 'If security refuses photos, stop and call dispatch. Do not submit a package with a category missing.',
    version: '1.3',
    updatedAt: '2026-09-12',
    changelog: [
      { version: '1.3', at: '2026-09-12', by: 'Priya Shah', note: 'Added the site condition photo after a DMG chargeback' },
      { version: '1.2', at: '2026-05-04', by: 'Priya Shah', note: 'Work-in-progress photo must show the open closer' },
      { version: '1.0', at: '2025-11-20', by: 'Kay', note: 'First written version' }
    ]
  },
  {
    id: 'sop-checkin',
    title: 'Site arrival and check-in',
    category: 'Field execution',
    purpose: 'Record that the assigned person arrived, and keep client contact with the office.',
    role: 'Field employee, contractor',
    audience: ['field', 'contractor', 'dispatcher'],
    ownerId: 'p-elena',
    steps: [
      'Open the assigned job and confirm the address before driving.',
      'Check in on arrival. The timestamp is the arrival record.',
      'Follow the property access note. Do not call the client from a personal phone.',
      'If the site cannot be accessed, note the reason and stop. Dispatch will contact the source.'
    ],
    tools: ['Field board', 'Property access note'],
    safety: ['Read the site hazards on the job before entering', 'Never enter an occupied unit without an escort'],
    quality: 'No check-in, no completion. A job left without checkout stays in progress.',
    issues: ['Wrong suite', 'Lockbox code rotated', 'Occupied unit with no escort'],
    escalation: 'Cannot get in within 20 minutes: add a note and message dispatch from the job.',
    version: '1.1',
    updatedAt: '2026-08-02',
    changelog: [
      { version: '1.1', at: '2026-08-02', by: 'Elena Voss', note: 'No personal-phone calls to clients' },
      { version: '1.0', at: '2026-03-01', by: 'Kay', note: 'First written version' }
    ]
  },
  {
    id: 'sop-intake',
    title: 'Work order intake from source platforms',
    category: 'Intake',
    purpose: 'Turn an external request into one internal work order without retyping it into a second system by hand.',
    role: 'Operations manager',
    audience: ['operations'],
    ownerId: 'p-priya',
    safety: [],
    escalation: 'Scope unclear or customer unknown: hold in Review and ask the source for the packet.',
    changelog: [{ version: '1.0', at: '2026-09-01', by: 'Priya Shah', note: 'Written from Kay’s intake notes' }],
    steps: [
      'Confirm the source and the external reference.',
      'Match the property. Create the property only if it does not already exist.',
      'Set service type, priority, and due date from the packet.',
      'Leave pricing blank until the estimator opens the job.',
      'Place the job in Review. Do not assign a field worker from the import screen.'
    ],
    tools: ['Work order queue', 'Property directory'],
    quality: 'Source plus external ID must be unique. A second import of the same reference is a duplicate, not a new job.',
    issues: ['Same building under two names', 'Scope buried in an attachment', 'Due date in the source platform’s timezone'],
    version: '1.0',
    updatedAt: '2026-09-01'
  },
  {
    id: 'sop-contractor-docs',
    title: 'Contractor document verification',
    category: 'Workforce',
    purpose: 'Keep uninsured or unlicensed crews off assigned work.',
    role: 'Operations manager',
    audience: ['operations', 'dispatcher'],
    ownerId: 'p-priya',
    safety: [],
    escalation: 'A required document expires on an active job: tell the owner the same day.',
    changelog: [
      { version: '1.2', at: '2026-07-18', by: 'Priya Shah', note: 'Hold inside 30 days of expiry, not just after' },
      { version: '1.0', at: '2025-12-02', by: 'Kay', note: 'First written version' }
    ],
    steps: [
      'Collect the license, general liability, and any trade certification before approval.',
      'Enter the expiration date on the document, not in a side spreadsheet.',
      'Hold the contractor in Document verification while anything is missing or inside 30 days of expiry.',
      'Move to Active only after the file is complete.',
      'Pull the contractor off new assignments when a required document expires.'
    ],
    tools: ['Contractor profile', 'Document library'],
    quality: 'An active contractor always has a current license and a current certificate of insurance.',
    issues: ['Certificate names a different company', 'Expiration left blank', 'Personal auto policy uploaded as liability'],
    version: '1.2',
    updatedAt: '2026-07-18'
  },
  {
    id: 'sop-dispatch',
    title: 'Same-day dispatch and scheduling',
    category: 'Dispatch',
    purpose: 'Put the right person on the job with a time window the source platform will accept.',
    role: 'Dispatcher',
    audience: ['dispatcher', 'operations'],
    ownerId: 'p-elena',
    steps: [
      'Work the unassigned column first, oldest due date at the top.',
      'Only assign contractors marked eligible. An expiring certificate is a warning, an expired one is a stop.',
      'Set a start time and duration before the end of the day the job is assigned.',
      'A contractor assignment is not booked until the contractor accepts it.',
      'If a contractor declines, reassign within two hours or tell operations.'
    ],
    tools: ['Dispatch board', 'Calendar', 'Contractor directory'],
    safety: [],
    quality: 'No job sits in Assigned without a time for more than one business day.',
    issues: ['Double-booking a technician across two counties', 'Assigning before the estimate is approved'],
    escalation: 'Nobody eligible is free before the due date: tell operations so they can ask the source for an extension.',
    version: '1.0',
    updatedAt: '2026-09-22',
    changelog: [{ version: '1.0', at: '2026-09-22', by: 'Elena Voss', note: 'First written version, handed off from Kay' }]
  },
  {
    id: 'sop-closeout',
    title: 'Review, closeout, and JobTread handoff',
    category: 'Closeout',
    purpose: 'Check a submitted package once, then hand money documents to JobTread without retyping the job.',
    role: 'Operations manager, owner',
    audience: ['operations', 'owner'],
    ownerId: 'p-jordan',
    steps: [
      'Open the submitted job and compare photos against the service rule.',
      'Return the job to the field with a note if anything is missing. Do not fix it from the office.',
      'Mark complete only when the package would survive a source-platform audit.',
      'Send the invoice handoff to JobTread. Record the JobTread number on the job.',
      'Close the job when payment is recorded.'
    ],
    tools: ['Work order workspace', 'Invoice register'],
    safety: [],
    quality: 'Every closed job has a complete photo package, a JobTread invoice number, and a payment date.',
    issues: ['Completing a job to hit a month-end number', 'Invoice sent before the source accepted the photos'],
    escalation: 'Source rejects a package after completion: reopen through operations, never by editing photos.',
    version: '0.9',
    updatedAt: '2026-09-28',
    changelog: [{ version: '0.9', at: '2026-09-28', by: 'Kay', note: 'Draft written so Priya can take over closeout' }]
  }
];

export const acknowledgements: Acknowledgement[] = [
  { personId: 'p-andre', sopId: 'sop-door-photos', version: '1.2', at: '2026-05-06T07:30' },
  { personId: 'p-andre', sopId: 'sop-checkin', version: '1.1', at: '2026-08-03T07:45' },
  { personId: 'p-camille', sopId: 'sop-checkin', version: '1.1', at: '2026-08-25T08:00' },
  { personId: 'c-ortega', sopId: 'sop-door-photos', version: '1.3', at: '2026-09-14T06:50' },
  { personId: 'c-ortega', sopId: 'sop-checkin', version: '1.0', at: '2025-03-15T09:00' },
  { personId: 'c-greenline', sopId: 'sop-checkin', version: '1.1', at: '2026-08-10T10:00' },
  { personId: 'p-marcus', sopId: 'sop-door-photos', version: '1.3', at: '2026-09-15T09:10' },
  { personId: 'p-priya', sopId: 'sop-intake', version: '1.0', at: '2026-09-01T12:00' },
  { personId: 'p-priya', sopId: 'sop-contractor-docs', version: '1.2', at: '2026-07-18T16:00' },
  { personId: 'p-priya', sopId: 'sop-dispatch', version: '1.0', at: '2026-09-23T09:00' },
  { personId: 'p-elena', sopId: 'sop-dispatch', version: '1.0', at: '2026-09-22T15:00' },
  { personId: 'p-jordan', sopId: 'sop-closeout', version: '0.9', at: '2026-09-28T18:00' }
];

export const estimates: EstimateRecord[] = [
  { id: 'est-104', number: 'EST-104', workOrderId: 'wo-24113', amount: 6400, status: 'internal_review', preparedBy: 'Marcus Webb' },
  { id: 'est-101', number: 'EST-101', workOrderId: 'wo-24114', amount: 1860, status: 'sent_to_jobtread', preparedBy: 'Marcus Webb' },
  { id: 'est-098', number: 'EST-098', workOrderId: 'wo-24115', amount: 8800, status: 'approved', preparedBy: 'Marcus Webb' },
  { id: 'est-096', number: 'EST-096', workOrderId: 'wo-24116', amount: 740, status: 'approved', preparedBy: 'Marcus Webb' }
];

export const invoices: InvoiceRecord[] = [
  { id: 'inv-220', number: 'JT-2208', workOrderId: 'wo-24122', amount: 3100, status: 'overdue', issuedAt: '2026-09-18' },
  { id: 'inv-214', number: 'JT-2144', workOrderId: 'wo-24123', amount: 1480, status: 'paid', issuedAt: '2026-09-11' },
  { id: 'inv-209', number: 'JT-2091', workOrderId: 'wo-24121', amount: 620, status: 'ready_for_jobtread', issuedAt: '2026-09-26' }
];

export const auditEvents: AuditEvent[] = [
  { id: 'a1', at: '2026-10-02T08:11', actor: 'Andre Brooks', action: 'Checked in', entity: 'Work order', entityId: 'wo-24118', detail: 'Knox Road Annex' },
  { id: 'a2', at: '2026-10-02T07:40', actor: 'System', action: 'Imported work order', entity: 'Work order', entityId: 'wo-24110', detail: 'DMG-88211 placed in New' },
  { id: 'a3', at: '2026-10-01T18:12', actor: 'Luis Ortega', action: 'Uploaded photos', entity: 'Work order', entityId: 'wo-24120', detail: 'Maple Ridge valley package' },
  { id: 'a4', at: '2026-10-01T16:04', actor: 'Elena Voss', action: 'Assigned contractor', entity: 'Work order', entityId: 'wo-24124', detail: 'Ortega Building Co.' },
  { id: 'a5', at: '2026-10-01T11:20', actor: 'Camille Nguyen', action: 'Completed inspection', entity: 'Work order', entityId: 'wo-24125', detail: 'Basement window added to findings' },
  { id: 'a6', at: '2026-09-30T15:10', actor: 'Priya Shah', action: 'Moved status', entity: 'Work order', entityId: 'wo-24115', detail: 'Awaiting approval to Approved' },
  { id: 'a7', at: '2026-09-28T09:00', actor: 'Kay', action: 'Closed job', entity: 'Work order', entityId: 'wo-24123', detail: 'Payment recorded' },
  { id: 'a8', at: '2026-09-26T13:40', actor: 'Marcus Webb', action: 'Updated estimate', entity: 'Estimate', entityId: 'est-101', detail: 'EST-101 sent toward JobTread' },
  { id: 'a9', at: '2026-09-18T10:05', actor: 'Priya Shah', action: 'Flagged document', entity: 'Document', entityId: 'doc-peak-gl', detail: 'General liability expires October 20' }
];

export const notices: Notice[] = [
  { id: 'n1', title: 'DMG-88211 needs review', body: 'Northside Plaza door repair imported this morning and is still unassigned.', at: '2026-10-02T07:40', tone: 'risk' },
  { id: 'n2', title: 'Andre checked in', body: 'Knox Road Annex, 8:11 AM. Campus escort is on site.', at: '2026-10-02T08:11', tone: 'info' },
  { id: 'n3', title: 'Greenline package is short', body: 'Capitol Heights cut is still missing the after photos.', at: '2026-10-01T17:05', tone: 'risk' },
  { id: 'n4', title: 'Peak insurance expires October 20', body: 'Hold new roofing assignments until the certificate is renewed.', at: '2026-10-01T09:00', tone: 'risk' },
  { id: 'n5', title: 'Lula invoice is overdue', body: 'JT-2208 for Riverbend unit 3B has not been paid.', at: '2026-09-30T08:30', tone: 'risk' }
];

export const integrations: IntegrationConnector[] = [
  { id: 'jobtread', name: 'JobTread', purpose: 'Estimates, invoices, proposals, job documentation', direction: 'Two-way when credentials exist', status: 'not_connected', note: 'System of record for money documents. No API credentials stored.' }
];

export const automations: AutomationRule[] = [
  {
    id: 'rule-import',
    name: 'Normalize an imported request',
    when: 'A work order arrives from a source platform',
    then: ['Create one internal work order', 'Keep the source and external ID', 'Notify the operations manager', 'Place the job in Review'],
    state: 'designed'
  },
  {
    id: 'rule-photos',
    name: 'Hold completion until documentation is complete',
    when: 'A field user uploads photos against a service rule',
    then: ['Count the required categories', 'Keep completion locked while any category is empty', 'Unlock submission when the rule is satisfied'],
    state: 'active_in_demo'
  },
  {
    id: 'rule-expiry',
    name: 'Warn before a contractor document lapses',
    when: 'A license or insurance file is 30 days from expiration',
    then: ['Notify the operations manager', 'Show the file on the attention list', 'Block new assignments when the date passes'],
    state: 'designed'
  }
];

export const responsibilities: Responsibility[] = [
  {
    id: 'r-intake', functionName: 'Intake', description: 'Pull requests from source platforms and email into one work order queue.',
    ownerId: 'p-priya', backupId: 'p-elena', approverId: 'p-jordan', sopId: 'sop-intake', cadence: 'Every morning by 9:00', delegable: true,
    readiness: 'Handed off in September 2025'
  },
  {
    id: 'r-estimating', functionName: 'Estimating', description: 'Price verified scope and prepare the JobTread estimate handoff.',
    ownerId: 'p-marcus', backupId: 'p-jordan', approverId: 'p-jordan', cadence: 'Within one business day of inspection', delegable: true,
    readiness: 'Estimates over $5,000 still go to the owner for approval'
  },
  {
    id: 'r-inspection', functionName: 'Inspection', description: 'Walk the site, verify the scope, and photograph existing conditions.',
    ownerId: 'p-camille', backupId: 'p-andre', approverId: 'p-priya', sopId: 'sop-checkin', cadence: 'Before any estimate', delegable: true,
    readiness: 'Delegated'
  },
  {
    id: 'r-dispatch', functionName: 'Dispatch', description: 'Assign people, set time windows, and keep the board current.',
    ownerId: 'p-elena', backupId: 'p-priya', approverId: 'p-priya', sopId: 'sop-dispatch', cadence: 'All day', delegable: true,
    readiness: 'Delegated'
  },
  {
    id: 'r-field', functionName: 'Field execution', description: 'Do the work to the SOP and the property access notes.',
    ownerId: 'p-andre', backupId: 'p-camille', approverId: 'p-elena', sopId: 'sop-checkin', cadence: 'Per job', delegable: true,
    readiness: 'Delegated'
  },
  {
    id: 'r-docs', functionName: 'Documentation review', description: 'Check photo packages against the service rule before completion.',
    ownerId: 'p-priya', backupId: 'p-jordan', approverId: 'p-jordan', sopId: 'sop-door-photos', cadence: 'Same day as submission', delegable: true,
    readiness: 'Delegated'
  },
  {
    id: 'r-contractors', functionName: 'Contractor compliance', description: 'Onboard contractors and keep licenses and insurance current.',
    ownerId: 'p-priya', approverId: 'p-jordan', sopId: 'sop-contractor-docs', cadence: 'Weekly expiry check', delegable: true,
    readiness: 'No backup named'
  },
  {
    id: 'r-closeout', functionName: 'Closeout and invoicing', description: 'Complete jobs, send invoices to JobTread, and record payment.',
    ownerId: 'p-jordan', backupId: 'p-priya', sopId: 'sop-closeout', cadence: 'Daily', delegable: true,
    readiness: 'Ready to hand to Priya once the closeout SOP leaves draft'
  },
  {
    id: 'r-collections', functionName: 'Collections', description: 'Chase overdue invoices with source platforms and direct clients.',
    ownerId: 'p-jordan', cadence: 'Weekly', delegable: true,
    readiness: 'Needs a written SOP before it can be handed off'
  },
  {
    id: 'r-pricing', functionName: 'Pricing authority', description: 'Set NTE limits, rate sheets, and margin targets.',
    ownerId: 'p-jordan', cadence: 'Quarterly', delegable: false,
    readiness: 'Stays with the owner'
  }
];
