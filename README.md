# 📚 StudySync - Smart Study Schedule Web App

A clean, modern, pure front-end web application built with **HTML5, CSS3, and Vanilla JavaScript**. It runs entirely in your web browser with zero backend setup, no server required, and no dependencies to install.

---

## 🌟 Key Features

### 1. 📅 Live Today Dashboard
- **Real-Time Clock & Date Tracking**: Automatically syncs with your local time and day.
- **"Currently Happening" & "Up Next"**: Detects active study blocks in real time and highlights what to focus on right now.
- **Daily Target Progress Ring & Bar**: Set your target daily study hours (e.g. 4.5 hrs) and monitor your percentage completion.
- **One-Click Session Completion**: Mark study blocks done for today with visual dots and celebratory sound cues.

### 2. 🗓️ Weekly Timetable (Monday – Sunday)
- Complete 7-day schedule grid with color-coded course badges.
- Filter schedule by specific days (e.g. Mon, Wed, Weekend) or by subject.
- Easy modal to add, edit, or delete any recurring study session (start/end times, topics, notes).

### 3. ⏱️ Focus Timer (Pomodoro & Deep Work)
- **Presets**: Standard Pomodoro (25 min), Deep Work (50 min), Short Break (5 min), and Long Break (15 min).
- **Interactive SVG Circular Ring**: Smooth real-time countdown progress.
- **Course Linking**: Completed sessions automatically log their minutes directly to the chosen course or subject.
- **Synthesized Audio Bell**: Web Audio API generates clean completion chimes without needing external audio files.

### 4. 📝 Tasks & Exam Deadlines
- Track upcoming exams, quizzes, homework, and reading assignments.
- Real-time countdown badges: *"Today!"*, *"Tomorrow"*, *"X days left"*, or *"Overdue"*.
- Filter by status (*All*, *Pending*, *Completed*) or by subject.

### 5. 📊 Subjects & Study Analytics
- Visual time distribution bars for the last 7 days.
- Weekly goal progress per course.
- Add/Edit custom courses with bespoke colors.

### 6. 💾 100% Client-Side Local Storage & Export/Import
- Automatic persistent storage in `localStorage`.
- **JSON Backup Export**: Download your study schedule as a `.json` file at any time.
- **JSON Import**: Restore your schedule across devices or browsers easily.
- **Reset to Demo**: Easily restore sample timetable data with one click.
- **Dark & Light Mode**: Seamless toggle with eye-friendly contrast.

---

## 🚀 How to Run

Because this app uses **only front-end tools**, running it is as simple as:

### Option A: Open directly in your browser
Double-click `index.html` in your file explorer, or right-click `index.html` and choose **Open with > Chrome / Edge / Firefox / Safari**.

### Option B: Using VS Code or any Live Server
If you use VS Code, you can right-click `index.html` and select **"Open with Live Server"**.

---

## 📂 File Structure

```
study-schedule-app/
├── index.html     # Semantic, accessible HTML5 layout and modal dialogs
├── styles.css     # Modern CSS with dark/light themes, glassmorphism, responsive grid
├── app.js         # State management, Pomodoro timer, audio engine & localStorage
└── README.md      # Documentation & quick start guide
```
