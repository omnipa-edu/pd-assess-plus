# Dashboard Features - O-Score Indicators

## 🎯 Overview

The application now includes specialized dashboard views for supervisors and administrators with visual O-Score indicators for students and departments.

---

## 📊 O-Score System

**O-Score** = Observation Score (1.0 - 5.0 scale)

### Color Coding

| Score Range | Label | Color | Meaning |
|-------------|-------|-------|---------|
| 4.5 - 5.0 | Excellent | 🟢 Green | Outstanding performance |
| 4.0 - 4.4 | Very Good | 🟢 Lime | Strong performance |
| 3.5 - 3.9 | Good | 🟡 Yellow | Satisfactory progress |
| 3.0 - 3.4 | Satisfactory | 🟠 Orange | Meets minimum standards |
| < 3.0 | Needs Improvement | 🔴 Red | Requires attention |

---

## 👨‍⚕️ Supervisor Dashboard

### **URL:** `/supervisor/students`

### Features:
✅ **Student Overview Grid**
- Visual cards for each supervised student
- Avatar with O-Score colored ring
- Student name, email, program, year of training
- Average O-Score badge (color-coded)
- Progress bar showing score percentage
- Trend indicator (↗ up, → stable, ↘ down)
- Assessment count
- Last assessment timestamp

✅ **Search & Filter**
- Search by student name or email
- Filter by program (ENT-HNS, Surgery, Medicine, etc.)
- Real-time filtering

✅ **Summary Statistics**
- Total students supervised
- Average O-Score across all students
- Total assessments conducted

### Visual Design:
```
┌─────────────────────────────────────┐
│  👤 Dr. Sarah Chen         [4.2] 🟢 │
│  sarah.chen@hospital.edu            │
│  [🎓 ENT-HNS] [Year 2]              │
│  ────────────────────────────────   │
│  O-Score Progress        ↗ 84%     │
│  ████████████░░░░░░ 4.2/5.0        │
│  📊 24 Assessments  📅 2 days ago  │
└─────────────────────────────────────┘
```

### Student Card Components:
- **Avatar Ring** - Color matches O-Score
- **Name & Contact** - Quick identification
- **Program Badges** - Program and year
- **O-Score Badge** - Large, prominent score
- **Progress Bar** - Visual score representation
- **Stats Grid** - Assessment count, last assessment

---

## 🛡️ Administrator Dashboard

### **URL:** `/admin/overview`

### Features:
✅ **Department Overview Grid**
- Visual cards for each department/program
- Department icon with colored background
- Average O-Score for all students in department
- Student count per department
- Total assessment count
- Trend indicator

✅ **Search Functionality**
- Search departments by name
- Filter and sort options

✅ **System-Wide Statistics**
- Total students across all departments
- Overall average O-Score
- Total departments
- Combined assessment count

✅ **Analytics Tab**
- Coming soon: Charts and trends
- Comparative analytics
- Performance reports

### Visual Design:
```
┌─────────────────────────────────────┐
│ 🏥 ENT-Head & Neck Surgery [4.1] 🟢│
│ 12 Students                         │
│ ────────────────────────────────    │
│ Average O-Score       ↗ Very Good  │
│ ████████████████░░░ 82%            │
│ 👥 12 Students    📊 89 Assessments│
└─────────────────────────────────────┘
```

### Department Card Components:
- **Building Icon** - Department visual
- **Name & Count** - Clear identification
- **O-Score Badge** - Prominent, color-coded
- **Progress Bar** - Department performance
- **Trend Arrow** - Performance direction
- **Stats Grid** - Students and assessments

---

## 🎨 Visual Indicators

### 1. **Color-Coded Badges**
```tsx
// Automatically colored based on score
<Badge className={getOScoreColor(4.2)}>4.2</Badge>
// → Green badge with white text
```

### 2. **Progress Bars**
```tsx
// Shows percentage of maximum score (5.0)
<Progress value={(4.2 / 5) * 100} /> // 84%
// → Visual bar filled to 84%
```

### 3. **Trend Indicators**
```tsx
trend: 'up'    // ↗ Green
trend: 'stable' // → Gray
trend: 'down'   // ↘ Red
```

### 4. **Avatar Rings** (Students)
```tsx
// Ring color matches O-Score
<Avatar className="ring-2 ring-green-500">
```

---

## 📱 Responsive Design

### Mobile (< 768px)
- Single column grid
- Stacked stats
- Full-width cards
- Touch-optimized

### Tablet (768px - 1024px)
- 2 column grid
- Side-by-side stats
- Medium cards

### Desktop (> 1024px)
- 3 column grid
- Expanded stats
- Optimal card sizing

---

## 🔄 Navigation

### From Supervisor Dashboard:
```
/supervisor → Main supervisor dashboard
          ↓ Click "My Students" or navigate
/supervisor/students → Student overview with O-Scores
```

### From Admin Dashboard:
```
/admin → Role management & system settings
     ↓ Click "Overview" or navigate
/admin/overview → Department overview with O-Scores
```

---

## 📊 Data Integration

### Current: Mock Data
```typescript
const students = [
  {
    name: 'Dr. Sarah Chen',
    averageOScore: 4.2,
    assessmentCount: 24,
    trend: 'up',
    // ...
  },
];
```

### Future: Supabase Integration
```typescript
// Fetch students with calculated O-Scores
const { data: students } = await supabase
  .rpc('get_students_with_scores', {
    supervisor_id: currentUser.id
  });

// Calculate department averages
const { data: departments } = await supabase
  .rpc('get_department_averages');
```

---

## 🎯 O-Score Calculation

### Formula (Example):
```typescript
// Average of all assessment ratings
const calculateOScore = (assessments) => {
  const total = assessments.reduce((sum, a) => sum + a.rating, 0);
  return total / assessments.length;
};

// With weighting (optional)
const calculateWeightedOScore = (assessments) => {
  // Recent assessments weighted more heavily
  // EPA assessments weighted differently than observations
};
```

---

## ✨ Interactions

### Student Cards (Supervisor View)
- **Click card** → Navigate to student detail page
- **Hover** → Slight scale animation (1.02x)
- **Focus** → Visible ring (keyboard accessible)

### Department Cards (Admin View)
- **Click card** → Navigate to department detail page
- **Hover** → Border color change + shadow
- **Shows:** Student count, avg score, trends

---

## 🧪 Testing the Feature

### Manual Test:

**1. As Supervisor:**
```bash
# Sign in as supervisor
http://localhost:8081/auth

# Navigate to students view
http://localhost:8081/supervisor/students

# You should see:
✓ 5 student cards with O-Scores
✓ Color-coded badges
✓ Progress bars
✓ Search functionality
✓ Filter by program
```

**2. As Admin:**
```bash
# Sign in as admin
http://localhost:8081/auth

# Navigate to overview
http://localhost:8081/admin/overview

# You should see:
✓ 6 department cards
✓ O-Score indicators
✓ Student counts
✓ Assessment counts
✓ Search functionality
```

---

## 🎨 Components Created

### 1. **DepartmentCard** (`src/components/dashboard/DepartmentCard.tsx`)
- Props: name, studentCount, averageOScore, assessmentCount, trend
- Visual: Building icon, badge, progress bar, stats grid
- Interactive: Hover effects, click handling

### 2. **StudentCard** (`src/components/dashboard/StudentCard.tsx`)
- Props: name, email, program, yearOfTraining, averageOScore, etc.
- Visual: Avatar with colored ring, badges, progress bar
- Interactive: Hover animation, click navigation

### 3. **OScoreChart** (`src/components/dashboard/OScoreChart.tsx`)
- Circular progress chart
- Animated entrance
- Configurable sizes (sm/md/lg)
- Color-coded by score

---

## 🚀 Next Steps

### Immediate:
1. **Apply SQL migration** (see previous message)
2. **Test the new views** at:
   - `/supervisor/students`
   - `/admin/overview`

### Short-term:
1. **Connect to real data** from Supabase
2. **Add sorting options** (by score, name, date)
3. **Add detail pages** for students/departments
4. **Implement filtering** by date range
5. **Add export functionality** for reports

### Long-term:
1. **Historical O-Score tracking** (trends over time)
2. **Comparative analytics** (student vs cohort)
3. **Predictive insights** (AI-powered suggestions)
4. **Custom reports** (PDF/Excel generation)

---

## 📝 Mock Data

### Current Mock Data Includes:

**Students:**
- Dr. Sarah Chen (ENT-HNS Y2) - O-Score: 4.2
- Dr. Michael Rodriguez (ENT-HNS Y3) - O-Score: 3.8
- Dr. Emily Watson (ENT-HNS Y1) - O-Score: 3.2
- Dr. James Park (ENT-HNS Y4) - O-Score: 4.6
- Dr. Maria Garcia (Surgery Y2) - O-Score: 3.9

**Departments:**
- ENT-Head & Neck Surgery - 12 students - O-Score: 4.1
- General Surgery - 18 students - O-Score: 3.8
- Internal Medicine - 24 students - O-Score: 3.9
- Emergency Medicine - 15 students - O-Score: 4.3
- Pediatrics - 20 students - O-Score: 4.0
- Orthopedic Surgery - 10 students - O-Score: 3.7

---

## 🎓 User Experience

### **Supervisor View:**
"As a supervisor, I want to quickly see which of my students needs extra support based on their O-Scores."

**Solution:**
- Visual cards sorted by score
- Color-coded indicators
- Trend arrows showing progress
- One-click access to student details

### **Admin View:**
"As a program administrator, I need to monitor performance across all departments and identify areas for improvement."

**Solution:**
- Department comparison grid
- System-wide statistics
- Visual O-Score indicators
- Trend analysis
- Search and filter capabilities

---

## ♿ Accessibility

✅ **Keyboard Navigation** - Tab through all cards  
✅ **Screen Readers** - Proper ARIA labels on scores  
✅ **Color + Text** - Not relying on color alone  
✅ **Focus Indicators** - Visible focus rings  
✅ **Semantic HTML** - Proper heading hierarchy  

---

## 🌗 Dark Mode Support

All components fully support dark mode:
- Adjusted badge colors for dark backgrounds
- Enhanced shadows for visibility
- Proper contrast ratios maintained
- Smooth theme transitions

---

**Created:** October 14, 2025  
**Status:** ✅ Ready for Testing  
**Mock Data:** Yes (replace with Supabase queries)


