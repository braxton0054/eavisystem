# 🔄 Course Auto-Sync Between Campuses

## ✅ What's Been Implemented

Your course management system now **automatically syncs changes between West and Twon campuses**!

---

## 🎯 How It Works

### Syncing Method
Courses are synced based on their **`course_code`** (e.g., "IT101", "BM202"). When you update or delete a course on one campus, the system automatically finds and updates/deletes the same course on the other campus using the course code.

---

## 📝 What Gets Synced Automatically

### 1. ✅ Course Updates (EDIT)
When you edit a course on **West Campus**, it automatically updates on **Twon Campus**:
- Course name
- Course code
- Department
- Fee per term
- Fee per year
- Duration (years)
- Active status
- Minimum KCSE grade
- Fee structure PDF name

**Example:**
- Edit "Diploma in IT" on West Campus
- ✅ Automatically updates "Diploma in IT" on Twon Campus

### 2. ✅ Course Deletions (DELETE)
When you delete a course on **West Campus**, it automatically deletes from **Twon Campus**:
- Finds course by course_code
- Deletes from both campuses
- Shows confirmation message

**Example:**
- Delete "Business Management" from West Campus
- ✅ Automatically deleted from Twon Campus

### 3. ✅ Course Creation (ADD)
When adding new courses, use the existing **"Add to Both Campuses"** feature:
- Endpoint: `/api/courses/add-to-both`
- Creates course on both West and Twon simultaneously
- Assigns unique IDs for each campus

---

## 🔍 How to Use

### Editing a Course
1. Go to Admin Dashboard (West or Twon)
2. Click "Edit" on any course
3. Make your changes
4. Click "Save"
5. ✅ **Both campuses updated automatically!**

### Deleting a Course
1. Go to Admin Dashboard (West or Twon)
2. Click "Delete" on any course
3. Confirm deletion
4. ✅ **Deleted from both campuses automatically!**

### Adding a New Course
1. Use the "Add Course" form
2. Make sure it uses the `/api/courses/add-to-both` endpoint
3. ✅ **Added to both campuses automatically!**

---

## 📊 Console Logs

You'll see helpful messages in the server console:

### On Update:
```
✅ Course synced to twon campus: IT101
```

### On Delete:
```
✅ Course deleted from twon campus: IT101
```

### On Error:
```
⚠️  Failed to sync course to twon: [error message]
```

---

## 🔑 Important Notes

### Course Code is Key
- **Course code must be unique** across both campuses
- Syncing uses `course_code` to match courses
- Make sure each course has a proper course code

### What Happens If Sync Fails?
- The main operation (on the current campus) still succeeds
- Error is logged to console
- Other campus won't be updated (manual fix needed)
- System continues working normally

### Course IDs Are Different
- Each campus has its own `course_id`
- West Campus: course_id might be 1, 2, 3...
- Twon Campus: course_id might be 1, 2, 3... (different courses)
- **Syncing uses `course_code`, not `course_id`**

---

## 🎯 Example Scenario

**Before:**
- West Campus has "Diploma in IT" (course_code: IT101)
- Twon Campus has "Diploma in IT" (course_code: IT101)

**You edit on West Campus:**
- Change fee from $500 to $600
- Change duration from 2 years to 3 years

**After (Automatic):**
- ✅ West Campus: Fee = $600, Duration = 3 years
- ✅ Twon Campus: Fee = $600, Duration = 3 years
- **No manual work needed!**

---

## 🚀 Benefits

1. ✅ **No duplicate work** - Edit once, updates everywhere
2. ✅ **Consistency** - Both campuses always have same course info
3. ✅ **Time-saving** - No need to log into both admin panels
4. ✅ **Error-free** - No risk of forgetting to update one campus
5. ✅ **Automatic** - Works in the background

---

## 🔧 Technical Details

### Modified Endpoints

#### 1. Update Course
**Endpoint:** `PUT /api/:campus/courses/:courseId`

**What it does:**
1. Updates course on current campus
2. Gets the course_code
3. Finds same course on other campus (by course_code)
4. Updates it with same data
5. Returns success message

#### 2. Delete Course
**Endpoint:** `DELETE /api/:campus/courses/:courseId`

**What it does:**
1. Gets course_code before deleting
2. Deletes course from current campus
3. Finds same course on other campus (by course_code)
4. Deletes it too
5. Returns success message

#### 3. Add Course (Already Existed)
**Endpoint:** `POST /api/courses/add-to-both`

**What it does:**
1. Creates course on West Campus
2. Creates course on Twon Campus
3. Returns both course IDs

---

## ✨ Summary

**You can now manage courses from either campus admin panel, and changes will automatically sync to the other campus!**

### What You Need to Do:
- ✅ **Nothing!** It works automatically
- Just edit/delete courses as normal
- System handles the syncing

### What Gets Synced:
- ✅ Course edits/updates
- ✅ Course deletions
- ✅ Course additions (via add-to-both endpoint)

### What Doesn't Get Synced:
- ❌ Students (they belong to specific campus)
- ❌ Admins (they belong to specific campus)
- ❌ Settings (each campus has own settings)

---

## 🎉 You're All Set!

Your course management is now fully synchronized between campuses. Make changes on one campus, and they automatically appear on the other! 🚀
