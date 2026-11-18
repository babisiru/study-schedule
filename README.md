# 📚 StudySync - Smart Study Schedule & Planner

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=github)](https://babisiru.github.io/study-schedule/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> A modern, responsive study schedule & timetable web application designed for students of all majors. Built with pure front-end web technologies and connected to a secure cloud database with user authentication.

🔗 **Live Website**: [https://babisiru.github.io/study-schedule/](https://babisiru.github.io/study-schedule/)

---

## 🌟 Key Features

### 1. 🔒 Student Portal & Cloud Authentication
- **User Accounts**: Sign in or create a free account with email and password powered by **Supabase Auth**.
- **Interactive Showcase**: Live interactive preview of the dashboard directly on the welcome screen.
- **Private Data Isolation**: Each student's courses, timetable, tasks, and timer records are strictly private to their account.
- **Cross-Device Sync**: Accessible from your laptop, tablet, or phone with real-time cloud persistence.

### 2. 📅 Today's Live Study Dashboard
- **Real-Time Clock & Session Engine**: Detects the current time and shows what study session is **Currently Happening** or **Up Next**.
- **Daily Target Progress**: Visual progress bar tracking completed study hours vs. daily targets.
- **1-Click Completion & Celebration**: Check off completed sessions with celebratory sound cues and confetti bursts.

### 3. 🗓️ Weekly Timetable (Monday – Sunday)
- Full 7-day grid showing all your scheduled classes and study blocks.
- Filter by specific days of the week or by course/subject.
- Easily add, edit, or delete any recurring study session with custom times, subjects, and notes.

### 4. ⏱️ Focus Timer & Ambience Generator
- **Flexible Modes**: Pomodoro (25m), Deep Work Sprint (50m), Short Break (5m), and Long Break (15m).
- **Interactive SVG Circular Ring**: Smooth countdown progress with live digital clock.
- **🎧 Focus Ambience Synthesizer**: Built-in background sounds generated live via the Web Audio API (zero external files):
  - 🌧️ Gentle Rain
  - 📻 Crisp Static / White Noise
  - 🌊 Ocean Waves
  - 🧘 Zen Harmonic Drone
- **Subject Linking**: Log completed study minutes directly to the chosen course.

### 5. 📝 Tasks & Exam Deadlines Tracker
- Track homework, assignments, readings, and upcoming exam dates.
- Real-time countdown badges: `Today!`, `Tomorrow`, `X days left`, or `Overdue`.
- Filter by `All`, `Pending`, or `Completed`.

### 6. 📊 Subjects & Study Analytics
- Visual distribution bar chart showing how much time you spent on each subject over the last 7 days.
- Add and customize courses for any major/department with bespoke color tags and weekly hour goals.

### 7. 📱 Offline-First & Keyboard Friendly
- **100% Offline Capability**: Runs smoothly even on Airplane Mode or without Wi-Fi using browser `localStorage` caching.
- **Keyboard Shortcuts**:
  - `Space`: Start / Pause Focus Timer
  - `R`: Reset Focus Timer
  - `Esc`: Close any active modal dialog

---

## 🛠️ Built With

- **HTML5 & CSS3**: Semantic layout, modern slate & obsidian design system, responsive grid.
- **Vanilla JavaScript**: State engine, Web Audio API synthesis, Canvas particle confetti.
- **Supabase**: PostgreSQL cloud database & user authentication.
- **GitHub Pages**: Automated CI/CD deployment.

---

## 🚀 Getting Started Locally

Because this application is 100% client-side, running it locally requires zero installation:

1. Clone the repository:
   ```bash
   git clone https://github.com/babisiru/study-schedule.git
   cd study-schedule
   ```
2. Open `index.html` directly in your browser:
   - Double-click `index.html`, or
   - Right-click and choose **Open with > Chrome / Edge / Firefox**.

---

## 📂 Project Structure

```
study-schedule/
├── index.html     # Semantic layout, login portal & modal dialogs
├── styles.css     # Clean slate palette, interactive prototype styles, responsive rules
├── app.js         # State management, Supabase integration, timer & audio engines
└── README.md      # Project documentation & live links
```
