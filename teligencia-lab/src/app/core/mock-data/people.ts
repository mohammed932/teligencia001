/*
 * Mock staff directory — verbatim names from prompt brief.
 * 8 people, every role covered.
 */

import { Person } from '../models/domain';

export const STAFF: Person[] = [
  { id: 'u1', fullName: 'Prof. Aymen Gatri',  initials: 'AG', role: 'lab_admin',       title: 'Lab Director' },
  { id: 'u2', fullName: 'Lea Hoffmann',       initials: 'LH', role: 'pm',              title: 'Senior PM' },
  { id: 'u3', fullName: 'Karim Bouazizi',     initials: 'KB', role: 'test_engineer',   title: 'Test Engineer' },
  { id: 'u4', fullName: 'Sofia Marchetti',    initials: 'SM', role: 'test_engineer',   title: 'Test Engineer' },
  { id: 'u5', fullName: 'Tomás Ruiz',         initials: 'TR', role: 'reviewer',        title: 'Senior Reviewer' },
  { id: 'u6', fullName: 'Yuki Tanaka',        initials: 'YT', role: 'reviewer',        title: 'Reviewer' },
  { id: 'u7', fullName: 'Dr. Helga Reinhardt', initials: 'HR', role: 'signatory',       title: 'Technical Signatory' },
  { id: 'u8', fullName: 'Marwa Belhaj',       initials: 'MB', role: 'quality_manager', title: 'Quality Manager' }
];

export const STAFF_BY_ID = Object.fromEntries(STAFF.map(p => [p.id, p])) as Record<string, Person>;
