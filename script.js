// andy/script.js
// Database & Authentication State
        let users = [];
        let currentUser = null;

        let db = {
            classes: [
                { id: 'c1', name: 'Class 10-A', code: '10A', description: 'Science Stream - Morning' },
                { id: 'c2', name: 'BTech CSE Year 3', code: 'CSE3', description: 'Advanced Computing Lab' },
                { id: 'c3', name: 'Class 12-B', code: '12B', description: 'Commerce Batch' }
            ],
            students: [
                { id: 's1', classId: 'c1', name: 'Alex Johnson', rollNo: '10A01', contact: 'alex@school.org' },
                { id: 's2', classId: 'c1', name: 'Maria Garcia', rollNo: '10A02', contact: 'maria@school.org' },
                { id: 's3', classId: 'c1', name: 'Liam Smith', rollNo: '10A03', contact: 'liam@school.org' },
                { id: 's4', classId: 'c2', name: 'Sophia Davis', rollNo: 'CSE301', contact: 'sophia@uni.edu' },
                { id: 's5', classId: 'c2', name: 'Ethan Brown', rollNo: 'CSE302', contact: 'ethan@uni.edu' },
                { id: 's6', classId: 'c3', name: 'Olivia Wilson', rollNo: '12B01', contact: 'olivia@school.org' }
            ],
            attendance: {}
        };

        // Initialize Authentication Data
        function initAuth() {
            const storedUsers = localStorage.getItem('edutrack_users');
            if (storedUsers) {
                try { users = JSON.parse(storedUsers); } catch(e) { users = []; }
            }
            
            // Populate default demo admin if non-existent
            if (!users || users.length === 0) {
                users = [
                    {
                        id: 'u_admin',
                        name: 'Administrator',
                        email: 'admin@edutrack.pro',
                        password: 'admin123',
                        role: 'Administrator'
                    }
                ];
                localStorage.setItem('edutrack_users', JSON.stringify(users));
            }

            // Check persistent session
            const activeSession = localStorage.getItem('edutrack_session');
            if (activeSession) {
                try {
                    const sessionData = JSON.parse(activeSession);
                    const userFound = users.find(u => u.email.toLowerCase() === sessionData.email.toLowerCase());
                    if (userFound) {
                        currentUser = userFound;
                    }
                } catch(e) { currentUser = null; }
            }
        }

        function showAuthView(viewName) {
            document.getElementById('auth-login-view').classList.add('hidden');
            document.getElementById('auth-register-view').classList.add('hidden');
            document.getElementById('auth-forgot-view').classList.add('hidden');

            if (viewName === 'login') document.getElementById('auth-login-view').classList.remove('hidden');
            if (viewName === 'register') document.getElementById('auth-register-view').classList.remove('hidden');
            if (viewName === 'forgot') document.getElementById('auth-forgot-view').classList.remove('hidden');
        }

        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value;
            const remember = document.getElementById('login-remember').checked;

            const found = users.find(u => u.email.toLowerCase() === email && u.password === password);
            if (found) {
                currentUser = found;
                if (remember) {
                    localStorage.setItem('edutrack_session', JSON.stringify({ email: found.email }));
                } else {
                    localStorage.removeItem('edutrack_session');
                }
                showToast(`Welcome back, ${found.name}!`);
                renderAppAuthState();
            } else {
                showToast('Invalid email address or password', 'error');
            }
        }

        function handleRegister(e) {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim().toLowerCase();
            const role = document.getElementById('reg-role').value;
            const password = document.getElementById('reg-password').value;
            const confirmPass = document.getElementById('reg-confirm-password').value;

            if (password !== confirmPass) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            if (users.some(u => u.email.toLowerCase() === email)) {
                showToast('An account with this email already exists', 'error');
                return;
            }

            const newUser = { id: 'u_' + Date.now(), name, email, role, password };
            users.push(newUser);
            localStorage.setItem('edutrack_users', JSON.stringify(users));

            currentUser = newUser;
            localStorage.setItem('edutrack_session', JSON.stringify({ email: newUser.email }));
            showToast('Account registered successfully!');
            renderAppAuthState();
        }

        function handleForgotPassword(e) {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim().toLowerCase();
            const found = users.find(u => u.email.toLowerCase() === email);
            if (found) {
                showToast(`Reset link generated! Demo Password: "${found.password}"`);
                showAuthView('login');
            } else {
                showToast('No account found with this email', 'error');
            }
        }

        function handleLogout() {
            currentUser = null;
            localStorage.removeItem('edutrack_session');
            showToast('Logged out successfully');
            renderAppAuthState();
        }

        function renderAppAuthState() {
            const authScreen = document.getElementById('auth-screen');
            if (!currentUser) {
                authScreen.classList.remove('hidden');
                return;
            }

            // Hide auth screen and display user info
            authScreen.classList.add('hidden');

            const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2);
            document.getElementById('user-avatar').innerText = initials || 'US';
            document.getElementById('user-display-name').innerText = currentUser.name;
            document.getElementById('user-display-role').innerText = currentUser.role;

            // Apply Role-Based Controls
            const isStudent = currentUser.role === 'Student';
            const roleBanner = document.getElementById('role-notice-banner');
            
            if (isStudent) {
                roleBanner.classList.remove('hidden');
                document.getElementById('btn-add-class')?.classList.add('hidden');
                document.getElementById('btn-add-student')?.classList.add('hidden');
                document.getElementById('btn-mark-all')?.classList.add('hidden');
            } else {
                roleBanner.classList.add('hidden');
                document.getElementById('btn-add-class')?.classList.remove('hidden');
                document.getElementById('btn-add-student')?.classList.remove('hidden');
                document.getElementById('btn-mark-all')?.classList.remove('hidden');
            }

            // Render current dashboard tab
            switchTab('dashboard');
        }

        // Storage Management for App Data
        function loadStorage() {
            const saved = localStorage.getItem('edutrack_db_v3');
            if (saved) {
                try {
                    db = JSON.parse(saved);
                } catch(e) {
                    console.error('Failed to parse storage', e);
                }
            } else {
                generateSampleAttendance();
                saveStorage();
            }
        }

        function saveStorage() {
            localStorage.setItem('edutrack_db_v3', JSON.stringify(db));
        }

        function generateSampleAttendance() {
            const today = new Date();
            for (let i = 2; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                
                db.classes.forEach(cls => {
                    const classStudents = db.students.filter(s => s.classId === cls.id);
                    if (classStudents.length > 0) {
                        const key = `${cls.id}_${dateStr}`;
                        db.attendance[key] = {};
                        classStudents.forEach((st, idx) => {
                            db.attendance[key][st.id] = idx === 0 ? 'Late' : (idx % 3 === 0 ? 'Absent' : 'Present');
                        });
                    }
                });
            }
        }

        function resetData() {
            if (confirm('Are you sure you want to reset all data and restore demo records?')) {
                localStorage.removeItem('edutrack_db_v3');
                location.reload();
            }
        }

        // Toast Notification System
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const bgClass = type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white';
            toast.className = `${bgClass} px-4 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-3 transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0`;
            
            const icon = type === 'success' ? 'check-circle' : 'alert-circle';
            toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 text-indigo-400"></i> <span>${message}</span>`;
            container.appendChild(toast);
            lucide.createIcons();

            setTimeout(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            }, 10);

            setTimeout(() => {
                toast.classList.add('translate-y-2', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Navigation Controller
        function switchTab(tabId) {
            const tabs = ['dashboard', 'classes', 'students', 'attendance', 'reports'];
            tabs.forEach(t => {
                const view = document.getElementById(`view-${t}`);
                const nav = document.getElementById(`nav-${t}`);
                if (t === tabId) {
                    view.classList.remove('hidden');
                    if (nav) {
                        nav.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-indigo-600 text-white shadow-lg shadow-indigo-600/20";
                    }
                } else {
                    view.classList.add('hidden');
                    if (nav) {
                        nav.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:text-white hover:bg-slate-800";
                    }
                }
            });

            // Update Header title
            const titles = {
                dashboard: 'Dashboard Overview',
                classes: 'Class Management',
                students: 'Student Directory',
                attendance: 'Take Attendance',
                reports: 'Reports & Analytics'
            };
            document.getElementById('page-title').innerText = titles[tabId] || 'Dashboard';

            // View renders
            if (tabId === 'dashboard') renderDashboard();
            if (tabId === 'classes') renderClasses();
            if (tabId === 'students') renderStudentsView();
            if (tabId === 'attendance') initAttendanceView();
            if (tabId === 'reports') initReportsView();
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        }

        // Initialize Application
        window.onload = function() {
            initAuth();
            loadStorage();
            
            const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            document.getElementById('current-date-display').innerText = new Date().toLocaleDateString('en-US', options);

            renderAppAuthState();
            lucide.createIcons();
        };

        // 1. DASHBOARD RENDER
        function renderDashboard() {
            const totalStudents = db.students.length;
            const totalClasses = db.classes.length;

            document.getElementById('stat-total-students').innerText = totalStudents;
            document.getElementById('stat-total-classes').innerText = totalClasses;

            let totalRecordsCount = 0;
            let totalPresentCount = 0;
            let todayPresentCount = 0;
            
            const todayStr = new Date().toISOString().split('T')[0];

            Object.keys(db.attendance).forEach(key => {
                const dayObj = db.attendance[key];
                const isToday = key.endsWith(`_${todayStr}`);
                
                Object.keys(dayObj).forEach(stId => {
                    const status = dayObj[stId];
                    totalRecordsCount++;
                    if (status === 'Present' || status === 'Late') {
                        totalPresentCount++;
                        if (isToday) todayPresentCount++;
                    }
                });
            });

            const overallPct = totalRecordsCount > 0 ? Math.round((totalPresentCount / totalRecordsCount) * 100) : 0;
            document.getElementById('stat-overall-pct').innerText = overallPct + '%';
            document.getElementById('stat-today-present').innerText = todayPresentCount;
            document.getElementById('stat-today-sub').innerText = `Date: ${todayStr}`;

            const container = document.getElementById('dashboard-classes-summary');
            if (db.classes.length === 0) {
                container.innerHTML = `<p class="text-sm text-slate-400 text-center py-6">No classes created yet. Click 'Add New Class' to get started.</p>`;
                return;
            }

            let html = '';
            db.classes.forEach(cls => {
                const clsStudents = db.students.filter(s => s.classId === cls.id);
                let clsTotal = 0;
                let clsPresent = 0;
                Object.keys(db.attendance).forEach(key => {
                    if (key.startsWith(cls.id + '_')) {
                        const dayObj = db.attendance[key];
                        Object.values(dayObj).forEach(st => {
                            clsTotal++;
                            if (st === 'Present' || st === 'Late') clsPresent++;
                        });
                    }
                });
                const pct = clsTotal > 0 ? Math.round((clsPresent / clsTotal) * 100) : 0;

                html += `
                    <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                ${cls.code}
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-800 text-sm">${cls.name}</h4>
                                <p class="text-xs text-slate-500">${clsStudents.length} Students enrolled</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <span class="text-sm font-bold text-slate-900">${pct}%</span>
                                <p class="text-xs text-slate-400">Attendance</p>
                            </div>
                            <button onclick="quickTakeAttendance('${cls.id}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-colors shadow-sm">
                                View
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
            lucide.createIcons();
        }

        function quickTakeAttendance(classId) {
            switchTab('attendance');
            document.getElementById('attendance-class-select').value = classId;
            document.getElementById('attendance-date-input').value = new Date().toISOString().split('T')[0];
            loadAttendanceSheet();
        }

        // 2. CLASSES VIEW RENDER
        function renderClasses() {
            const grid = document.getElementById('classes-grid');
            if (db.classes.length === 0) {
                grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400"><p>No classes found. Add your first class!</p></div>`;
                return;
            }

            const isStudent = currentUser && currentUser.role === 'Student';

            let html = '';
            db.classes.forEach(cls => {
                const count = db.students.filter(s => s.classId === cls.id).length;
                html += `
                    <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div class="flex items-start justify-between mb-4">
                                <div class="bg-indigo-50 text-indigo-600 font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wide">
                                    ${cls.code}
                                </div>
                                ${!isStudent ? `<button onclick="deleteClass('${cls.id}')" class="text-slate-400 hover:text-red-600 transition-colors p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                            </div>
                            <h4 class="font-bold text-slate-900 text-lg mb-1">${cls.name}</h4>
                            <p class="text-xs text-slate-500 mb-4">${cls.description || 'No description provided'}</p>
                        </div>
                        <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span class="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">${count} Students</span>
                            <div class="flex items-center gap-2">
                                <button onclick="quickTakeAttendance('${cls.id}')" class="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Attendance</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            grid.innerHTML = html;
            lucide.createIcons();
        }

        function openClassModal() {
            if (currentUser && currentUser.role === 'Student') {
                showToast('Students do not have permission to add classes', 'error');
                return;
            }
            document.getElementById('class-modal').classList.remove('hidden');
        }
        function closeClassModal() {
            document.getElementById('class-modal').classList.add('hidden');
            document.getElementById('modal-class-name').value = '';
            document.getElementById('modal-class-code').value = '';
            document.getElementById('modal-class-desc').value = '';
        }

        function handleClassSubmit(e) {
            e.preventDefault();
            const name = document.getElementById('modal-class-name').value.trim();
            const code = document.getElementById('modal-class-code').value.trim();
            const description = document.getElementById('modal-class-desc').value.trim();

            const newClass = { id: 'c_' + Date.now(), name, code, description };
            db.classes.push(newClass);
            saveStorage();
            closeClassModal();
            showToast('Class created successfully!');
            renderClasses();
        }

        function deleteClass(classId) {
            if (currentUser && currentUser.role === 'Student') return;
            if (confirm('Are you sure you want to delete this class and all associated students?')) {
                db.classes = db.classes.filter(c => c.id !== classId);
                db.students = db.students.filter(s => s.classId !== classId);
                saveStorage();
                showToast('Class deleted successfully!', 'error');
                renderClasses();
            }
        }

        // 3. STUDENTS VIEW RENDER
        function initStudentsView() {
            const selectFilter = document.getElementById('student-filter-class');
            selectFilter.innerHTML = '<option value="all">All Classes</option>';
            db.classes.forEach(c => {
                selectFilter.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
            renderStudentsTable();
        }

        function renderStudentsView() {
            initStudentsView();
        }

        function renderStudentsTable() {
            const filterClass = document.getElementById('student-filter-class').value;
            const searchTerm = document.getElementById('student-search-input').value.toLowerCase();
            const tbody = document.getElementById('students-table-body');
            const isStudentRole = currentUser && currentUser.role === 'Student';

            let filtered = db.students;
            if (filterClass !== 'all') {
                filtered = filtered.filter(s => s.classId === filterClass);
            }
            if (searchTerm) {
                filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm) || s.rollNo.toLowerCase().includes(searchTerm));
            }

            document.getElementById('student-count-badge').innerText = `${filtered.length} Students`;

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400">No students found.</td></tr>`;
                return;
            }

            let html = '';
            filtered.forEach(st => {
                const cls = db.classes.find(c => c.id === st.classId);
                const className = cls ? cls.name : 'Unassigned';
                html += `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3.5 px-6 font-medium text-slate-900">${st.rollNo}</td>
                        <td class="py-3.5 px-6 font-semibold">${st.name}</td>
                        <td class="py-3.5 px-6"><span class="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold">${className}</span></td>
                        <td class="py-3.5 px-6 text-slate-500">${st.contact || 'N/A'}</td>
                        <td class="py-3.5 px-6 text-right">
                            ${!isStudentRole ? `<button onclick="deleteStudent('${st.id}')" class="text-slate-400 hover:text-red-600 transition-colors p-1.5"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : `<span class="text-xs text-slate-400">View Only</span>`}
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
            lucide.createIcons();
        }

        function openStudentModal() {
            if (currentUser && currentUser.role === 'Student') {
                showToast('Students do not have permission to enroll new students', 'error');
                return;
            }
            const select = document.getElementById('modal-student-class');
            select.innerHTML = '<option value="">-- Select Class --</option>';
            db.classes.forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
            document.getElementById('student-modal').classList.remove('hidden');
        }

        function closeStudentModal() {
            document.getElementById('student-modal').classList.add('hidden');
            document.getElementById('modal-student-name').value = '';
            document.getElementById('modal-student-roll').value = '';
            document.getElementById('modal-student-contact').value = '';
        }

        function handleStudentSubmit(e) {
            e.preventDefault();
            const classId = document.getElementById('modal-student-class').value;
            const name = document.getElementById('modal-student-name').value.trim();
            const rollNo = document.getElementById('modal-student-roll').value.trim();
            const contact = document.getElementById('modal-student-contact').value.trim();

            const newStudent = { id: 's_' + Date.now(), classId, name, rollNo, contact };
            db.students.push(newStudent);
            saveStorage();
            closeStudentModal();
            showToast('Student enrolled successfully!');
            renderStudentsTable();
        }

        function deleteStudent(studentId) {
            if (currentUser && currentUser.role === 'Student') return;
            if (confirm('Are you sure you want to remove this student?')) {
                db.students = db.students.filter(s => s.id !== studentId);
                saveStorage();
                showToast('Student removed successfully!', 'error');
                renderStudentsTable();
            }
        }

        // 4. ATTENDANCE VIEW LOGIC
        function initAttendanceView() {
            const select = document.getElementById('attendance-class-select');
            const currentVal = select.value;
            select.innerHTML = '<option value="">-- Choose Class --</option>';
            db.classes.forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
            if (currentVal) select.value = currentVal;

            const dateInput = document.getElementById('attendance-date-input');
            if (!dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            if (select.value) {
                loadAttendanceSheet();
            }
        }

        function loadAttendanceSheet() {
            const classId = document.getElementById('attendance-class-select').value;
            const dateStr = document.getElementById('attendance-date-input').value;
            const container = document.getElementById('attendance-sheet-container');

            if (!classId || !dateStr) {
                container.innerHTML = `<div class="text-center py-12 text-slate-400"><p class="font-medium">Please select both class and date.</p></div>`;
                return;
            }

            const classStudents = db.students.filter(s => s.classId === classId);
            if (classStudents.length === 0) {
                container.innerHTML = `<div class="text-center py-12 text-slate-400"><p class="font-medium">No students enrolled in this class.</p></div>`;
                return;
            }

            const key = `${classId}_${dateStr}`;
            if (!db.attendance[key]) {
                db.attendance[key] = {};
                classStudents.forEach(st => {
                    db.attendance[key][st.id] = 'Present';
                });
                saveStorage();
            }

            const isStudent = currentUser && currentUser.role === 'Student';

            let html = `
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled: ${classStudents.length} Students</span>
                    <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Auto-saving to Storage</span>
                </div>
                <div class="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th class="py-3 px-6 font-semibold">Roll No</th>
                                <th class="py-3 px-6 font-semibold">Student Name</th>
                                <th class="py-3 px-6 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-sm text-slate-700">
            `;

            classStudents.forEach(st => {
                const status = db.attendance[key][st.id] || 'Present';
                html += `
                    <tr class="hover:bg-slate-50/50">
                        <td class="py-3.5 px-6 font-medium text-slate-900">${st.rollNo}</td>
                        <td class="py-3.5 px-6 font-semibold">${st.name}</td>
                        <td class="py-3.5 px-6 text-center">
                            ${isStudent ? `
                                <span class="px-3 py-1 rounded-lg text-xs font-bold ${status === 'Present' ? 'bg-emerald-100 text-emerald-800' : (status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')}">${status}</span>
                            ` : `
                                <div class="inline-flex rounded-xl p-1 bg-slate-100 gap-1">
                                    <button onclick="setAttendanceStatus('${classId}', '${dateStr}', '${st.id}', 'Present')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${status === 'Present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">Present</button>
                                    <button onclick="setAttendanceStatus('${classId}', '${dateStr}', '${st.id}', 'Absent')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${status === 'Absent' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">Absent</button>
                                    <button onclick="setAttendanceStatus('${classId}', '${dateStr}', '${st.id}', 'Late')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${status === 'Late' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">Late</button>
                                </div>
                            `}
                        </td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
            container.innerHTML = html;
        }

        function setAttendanceStatus(classId, dateStr, studentId, status) {
            if (currentUser && currentUser.role === 'Student') return;
            const key = `${classId}_${dateStr}`;
            if (!db.attendance[key]) db.attendance[key] = {};
            db.attendance[key][studentId] = status;
            saveStorage();
            loadAttendanceSheet();
        }

        function markAllStatus(status) {
            if (currentUser && currentUser.role === 'Student') return;
            const classId = document.getElementById('attendance-class-select').value;
            const dateStr = document.getElementById('attendance-date-input').value;
            if (!classId || !dateStr) return;

            const key = `${classId}_${dateStr}`;
            if (!db.attendance[key]) db.attendance[key] = {};

            const classStudents = db.students.filter(s => s.classId === classId);
            classStudents.forEach(st => {
                db.attendance[key][st.id] = status;
            });
            saveStorage();
            loadAttendanceSheet();
            showToast(`All marked as ${status}!`);
        }

        // 5. REPORTS VIEW LOGIC
        function initReportsView() {
            const select = document.getElementById('report-class-select');
            select.innerHTML = '<option value="all">All Classes</option>';
            db.classes.forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });

            const today = new Date();
            const past = new Date();
            past.setDate(today.getDate() - 30);

            document.getElementById('report-from-date').value = past.toISOString().split('T')[0];
            document.getElementById('report-to-date').value = today.toISOString().split('T')[0];

            renderReportsTable();
        }

        function renderReportsTable() {
            const filterClass = document.getElementById('report-class-select').value;
            const fromDate = document.getElementById('report-from-date').value;
            const toDate = document.getElementById('report-to-date').value;
            const tbody = document.getElementById('reports-table-body');

            let studentsList = db.students;
            if (filterClass !== 'all') {
                studentsList = studentsList.filter(s => s.classId === filterClass);
            }

            document.getElementById('report-records-count').innerText = `${studentsList.length} Students Summarized`;

            if (studentsList.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400">No students available for reports.</td></tr>`;
                return;
            }

            let html = '';
            studentsList.forEach(st => {
                const cls = db.classes.find(c => c.id === st.classId);
                const className = cls ? cls.name : 'Unassigned';

                let totalDays = 0;
                let presentCount = 0;
                let absentCount = 0;
                let lateCount = 0;

                Object.keys(db.attendance).forEach(key => {
                    const parts = key.split('_');
                    if (parts.length >= 2) {
                        const cId = parts[0];
                        const dateVal = parts.slice(1).join('_');

                        if (cId === st.classId) {
                            if ((!fromDate || dateVal >= fromDate) && (!toDate || dateVal <= toDate)) {
                                const dayObj = db.attendance[key];
                                if (dayObj && dayObj[st.id]) {
                                    totalDays++;
                                    const stStatus = dayObj[st.id];
                                    if (stStatus === 'Present') presentCount++;
                                    else if (stStatus === 'Absent') absentCount++;
                                    else if (stStatus === 'Late') lateCount++;
                                }
                            }
                        }
                    }
                });

                const effectivePresent = presentCount + lateCount;
                const pct = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 0;
                const badgeColor = pct >= 75 ? 'bg-emerald-50 text-emerald-700' : (pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700');

                html += `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3.5 px-6 font-medium text-slate-900">${st.rollNo}</td>
                        <td class="py-3.5 px-6 font-semibold">${st.name}</td>
                        <td class="py-3.5 px-6"><span class="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold">${className}</span></td>
                        <td class="py-3.5 px-6 text-slate-600">${totalDays}</td>
                        <td class="py-3.5 px-6 text-emerald-600 font-medium">${presentCount}</td>
                        <td class="py-3.5 px-6 text-red-600 font-medium">${absentCount}</td>
                        <td class="py-3.5 px-6 text-amber-600 font-medium">${lateCount}</td>
                        <td class="py-3.5 px-6"><span class="${badgeColor} px-2.5 py-1 rounded-lg text-xs font-bold">${pct}%</span></td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
        }

        function exportCSVReport() {
            let csv = 'Roll No,Student Name,Class,Total Days,Present,Absent,Late,Attendance Percentage\n';
            
            db.students.forEach(st => {
                const cls = db.classes.find(c => c.id === st.classId);
                const className = cls ? cls.name : 'Unassigned';

                let totalDays = 0, presentCount = 0, absentCount = 0, lateCount = 0;

                Object.keys(db.attendance).forEach(key => {
                    if (key.startsWith(st.classId + '_')) {
                        const dayObj = db.attendance[key];
                        if (dayObj && dayObj[st.id]) {
                            totalDays++;
                            const stStatus = dayObj[st.id];
                            if (stStatus === 'Present') presentCount++;
                            else if (stStatus === 'Absent') absentCount++;
                            else if (stStatus === 'Late') lateCount++;
                        }
                    }
                });

                const effectivePresent = presentCount + lateCount;
                const pct = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 0;

                csv += `"${st.rollNo}","${st.name}","${className}",${totalDays},${presentCount},${absentCount},${lateCount},${pct}%\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `edutrack_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('CSV report exported successfully!');
        }

        function printReport() {
            window.print();
        }
