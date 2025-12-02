-- Create leaves table
create table leaves (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  teacher_note text,
  created_at timestamp default now()
);

-- Enable RLS
alter table leaves enable row level security;

-- Policies
-- Students can view their own leaves
create policy "Students can view own leaves" on leaves
  for select using (auth.uid() = student_id);

-- Students can insert their own leaves
create policy "Students can insert own leaves" on leaves
  for insert with check (auth.uid() = student_id);

-- Teachers can view leaves of students they teach (Complex policy, simplified for now to: Teachers can view all leaves or leaves where they teach the student)
-- For simplicity in this demo, let's allow authenticated teachers to view/update leaves.
-- Ideally: check if exists enrollment where student_id = leaves.student_id and subject.teacher_id = auth.uid()
-- But RLS for complex joins can be slow. Let's start with broader access for teachers/admins.

create policy "Teachers and Admins can view all leaves" on leaves
  for select using (
    exists (select 1 from teachers where id = auth.uid()) or
    exists (select 1 from admins where id = auth.uid())
  );

create policy "Teachers and Admins can update leaves" on leaves
  for update using (
    exists (select 1 from teachers where id = auth.uid()) or
    exists (select 1 from admins where id = auth.uid())
  );
