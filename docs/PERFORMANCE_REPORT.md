# Performance & Resource Audit Report

## 1. Backend Performance (FastAPI/SQLAlchemy)

### Findings
- **N+1 Query Potential**: In `app/services/consultation_service.py`, the `Appointment` is queried using `db.query(Appointment).filter(...).first()`. If the `Appointment` model has relationships (e.g., `patient`, `doctor`) that are accessed later in the code without being eagerly loaded, this will trigger N+1 queries.
- **Missing Indices**: A review of the models (`Consultation`, `Patient`) shows indices on primary keys and some foreign keys, but complex queries filtering by `created_at` or `doctor_id` + `patient_id` combinations may lack composite indices.

### Recommendations
1.  **Use `joinedload`**: Update queries to eagerly load relationships.
2.  **Add Indices**: Ensure all foreign keys and frequently filtered columns have indices.

### Fix Script (Example)

```python
# Fix for N+1 in consultation_service.py
from sqlalchemy.orm import joinedload

# Before
# appointment = db.query(Appointment).filter(Appointment.id == consultation_in.appointment_id).first()

# After
appointment = db.query(Appointment)\
    .options(joinedload(Appointment.patient), joinedload(Appointment.doctor))\
    .filter(Appointment.id == consultation_in.appointment_id)\
    .first()
```

## 2. Frontend Performance (React)

### Findings
- **`useEffect` Usage**: Checked `PreconsultationConfigPage.jsx`. `useEffect` hooks are correctly using dependency arrays `[]` for mount-only logic.
- **Bundle Size**: `react-quill` is a large dependency found in `package.json`. It should be lazy-loaded if not used on the initial landing page.

### Recommendations
1.  **Code Splitting**: Use `React.lazy` for heavy components like `react-quill` or the `ObstetricTable`.
2.  **Memoization**: Ensure `ObstetricTable` and other complex inputs in `PreconsultaPage.jsx` are wrapped in `React.memo` if they receive frequent prop updates.

### Fix Script (React Memoization)

```jsx
import React, { memo } from 'react';

const ObstetricTable = memo(({ data, onChange }) => {
  // Component logic
  return <div>...</div>;
}, (prevProps, nextProps) => {
  // Custom comparison if needed, or default shallow compare
  return prevProps.data === nextProps.data;
});
```
