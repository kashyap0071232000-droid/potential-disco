// Medical Counselling Intelligence Platform - Main Application

class MedicalCounsellingApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentSpeciality = 'medical';
        this.collegesData = [];
        this.counsellingData = [];
        this.isOnline = navigator.onLine;
        this.deferredPrompt = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupPWA();
        this.setupOfflineDetection();
        await this.loadData();
        this.updateDashboard();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Speciality selector
        document.querySelectorAll('.speciality-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectSpeciality(e.currentTarget.dataset.speciality);
            });
        });

        // Quick action buttons
        document.getElementById('collegeSearch')?.addEventListener('input', (e) => {
            this.filterColleges(e.target.value);
        });

        document.getElementById('stateFilter')?.addEventListener('change', (e) => {
            this.filterColleges();
        });

        document.getElementById('courseFilter')?.addEventListener('change', (e) => {
            this.filterColleges();
        });

        // Counselling filters
        ['counsellingType', 'counsellingLevel', 'counsellingYear', 'counsellingRound'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                this.loadCounsellingData();
            });
        });

        // Install button
        document.getElementById('installBtn')?.addEventListener('click', () => {
            this.installPWA();
        });
    }

    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }

        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.style.display = 'block';
            }
        });

        // App installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.style.display = 'none';
            }
        });
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineIndicator();
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator();
        });
    }

    showOfflineIndicator() {
        let indicator = document.querySelector('.offline-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'offline-indicator';
            indicator.innerHTML = '<i class="fas fa-wifi-slash"></i> You are currently offline. Some features may be limited.';
            document.body.appendChild(indicator);
        }
        indicator.classList.add('show');
    }

    hideOfflineIndicator() {
        const indicator = document.querySelector('.offline-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    async loadData() {
        try {
            // Load colleges data
            const collegesResponse = await fetch('data/colleges.json');
            this.collegesData = await collegesResponse.json();

            // Load counselling data
            const counsellingResponse = await fetch('data/counselling.json');
            this.counsellingData = await counsellingResponse.json();

            this.populateFilters();
            this.updateDashboard();
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Sample colleges data
        this.collegesData = [
            {
                id: 1,
                name: "All India Institute of Medical Sciences, New Delhi",
                state: "Delhi",
                city: "New Delhi",
                type: "Government",
                courses: [
                    { name: "MBBS", seats: 100 },
                    { name: "MD", seats: 50 },
                    { name: "MS", seats: 30 }
                ],
                contact: "+91-11-26588500",
                website: "https://www.aiims.edu"
            },
            {
                id: 2,
                name: "JSS Medical College, Mysore",
                state: "Karnataka",
                city: "Mysore",
                type: "Private",
                courses: [
                    { name: "MBBS", seats: 150 },
                    { name: "BDS", seats: 100 },
                    { name: "MD", seats: 40 }
                ],
                contact: "+91-821-2548356",
                website: "https://jssmc.jssuni.edu.in"
            }
        ];

        // Sample counselling data
        this.counsellingData = {
            "AIQ": {
                "2024": {
                    "UG": {
                        "1": [
                            {
                                college: "AIIMS Delhi",
                                course: "MBBS",
                                opening_rank: 1,
                                closing_rank: 50,
                                seats: 100,
                                category: "General"
                            }
                        ],
                        "2": [
                            {
                                college: "AIIMS Delhi",
                                course: "MBBS",
                                opening_rank: 51,
                                closing_rank: 100,
                                seats: 100,
                                category: "General"
                            }
                        ]
                    }
                },
                "2023": {
                    "UG": {
                        "1": [
                            {
                                college: "AIIMS Delhi",
                                course: "MBBS",
                                opening_rank: 1,
                                closing_rank: 45,
                                seats: 100,
                                category: "General"
                            }
                        ],
                        "2": [
                            {
                                college: "AIIMS Delhi",
                                course: "MBBS",
                                opening_rank: 46,
                                closing_rank: 95,
                                seats: 100,
                                category: "General"
                            }
                        ]
                    }
                }
            }
        };
    }

    populateFilters() {
        // Populate state filter
        const states = [...new Set(this.collegesData.map(college => college.state))];
        const stateFilter = document.getElementById('stateFilter');
        if (stateFilter) {
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                stateFilter.appendChild(option);
            });
        }
    }

    updateDashboard() {
        // Update stats
        document.getElementById('totalColleges').textContent = this.collegesData.length;
        
        const totalSeats = this.collegesData.reduce((total, college) => {
            return total + college.courses.reduce((sum, course) => sum + course.seats, 0);
        }, 0);
        document.getElementById('totalSeats').textContent = totalSeats.toLocaleString();

        const totalRounds = Object.keys(this.counsellingData).length * 2; // Assuming 2 rounds per type
        document.getElementById('totalRounds').textContent = totalRounds;

        const totalDataPoints = this.counsellingData.AIQ?.['2024']?.UG?.['1']?.length || 0;
        document.getElementById('totalDataPoints').textContent = totalDataPoints.toLocaleString();
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionName;
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`)?.classList.add('active');

        // Load section-specific data
        switch (sectionName) {
            case 'colleges':
                this.loadColleges();
                break;
            case 'counselling':
                this.loadCounsellingData();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    loadColleges() {
        const collegesList = document.getElementById('collegesList');
        if (!collegesList) return;

        collegesList.innerHTML = '';
        
        this.collegesData.forEach(college => {
            const collegeCard = this.createCollegeCard(college);
            collegesList.appendChild(collegeCard);
        });
    }

    createCollegeCard(college) {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        
        const totalSeats = college.courses.reduce((sum, course) => sum + course.seats, 0);
        
        card.innerHTML = `
            <div class="college-card">
                <div class="college-name">${college.name}</div>
                <div class="college-location">
                    <i class="fas fa-map-marker-alt"></i> ${college.city}, ${college.state}
                </div>
                <div class="college-type">
                    <span class="badge bg-${college.type === 'Government' ? 'success' : 'warning'}">${college.type}</span>
                </div>
                <div class="college-stats">
                    <div class="stat-item">
                        <div class="stat-number">${college.courses.length}</div>
                        <div class="stat-label">Courses</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${totalSeats}</div>
                        <div class="stat-label">Total Seats</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${college.contact ? '✓' : '✗'}</div>
                        <div class="stat-label">Contact</div>
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-primary" onclick="app.showCollegeDetails(${college.id})">
                        View Details
                    </button>
                    ${college.website ? `<a href="${college.website}" target="_blank" class="btn btn-sm btn-outline-primary">Website</a>` : ''}
                </div>
            </div>
        `;
        
        return card;
    }

    filterColleges(searchTerm = '') {
        const stateFilter = document.getElementById('stateFilter')?.value || '';
        const courseFilter = document.getElementById('courseFilter')?.value || '';
        
        const filteredColleges = this.collegesData.filter(college => {
            const matchesSearch = !searchTerm || 
                college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                college.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                college.state.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesState = !stateFilter || college.state === stateFilter;
            const matchesCourse = !courseFilter || 
                college.courses.some(course => course.name === courseFilter);
            
            return matchesSearch && matchesState && matchesCourse;
        });

        const collegesList = document.getElementById('collegesList');
        if (collegesList) {
            collegesList.innerHTML = '';
            filteredColleges.forEach(college => {
                const collegeCard = this.createCollegeCard(college);
                collegesList.appendChild(collegeCard);
            });
        }
    }

    loadCounsellingData() {
        const type = document.getElementById('counsellingType')?.value || 'AIQ';
        const level = document.getElementById('counsellingLevel')?.value || 'UG';
        const year = document.getElementById('counsellingYear')?.value || '2024';
        const round = document.getElementById('counsellingRound')?.value || '1';

        const counsellingDataDiv = document.getElementById('counsellingData');
        if (!counsellingDataDiv) return;

        const data = this.counsellingData[type]?.[year]?.[level]?.[round] || [];
        
        if (data.length === 0) {
            counsellingDataDiv.innerHTML = '<div class="alert alert-info">No data available for the selected criteria.</div>';
            return;
        }

        const table = this.createCounsellingTable(data);
        counsellingDataDiv.innerHTML = '';
        counsellingDataDiv.appendChild(table);
    }

    createCounsellingTable(data) {
        const table = document.createElement('div');
        table.className = 'counselling-table';
        
        table.innerHTML = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>College</th>
                        <th>Course</th>
                        <th>Opening Rank</th>
                        <th>Closing Rank</th>
                        <th>Seats</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>${item.college}</td>
                            <td>${item.course}</td>
                            <td>${item.opening_rank}</td>
                            <td>${item.closing_rank}</td>
                            <td>${item.seats}</td>
                            <td><span class="badge bg-primary">${item.category}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        return table;
    }

    loadAnalytics() {
        // This will be implemented in analytics.js
        if (window.loadAnalytics) {
            window.loadAnalytics();
        }
    }

    showCollegeDetails(collegeId) {
        const college = this.collegesData.find(c => c.id === collegeId);
        if (!college) return;

        // Create modal for college details
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'collegeModal';
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${college.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>College Information</h6>
                                <p><strong>Location:</strong> ${college.city}, ${college.state}</p>
                                <p><strong>Type:</strong> ${college.type}</p>
                                <p><strong>Contact:</strong> ${college.contact || 'Not available'}</p>
                                ${college.website ? `<p><strong>Website:</strong> <a href="${college.website}" target="_blank">${college.website}</a></p>` : ''}
                            </div>
                            <div class="col-md-6">
                                <h6>Courses & Seats</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Course</th>
                                                <th>Seats</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${college.courses.map(course => `
                                                <tr>
                                                    <td>${course.name}</td>
                                                    <td>${course.seats}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                this.deferredPrompt = null;
            });
        }
    }

    async syncData() {
        if (this.isOnline) {
            try {
                await this.loadData();
                console.log('Data synced successfully');
            } catch (error) {
                console.error('Error syncing data:', error);
            }
        }
    }

    selectSpeciality(speciality) {
        this.currentSpeciality = speciality;
        
        // Update active card
        document.querySelectorAll('.speciality-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-speciality="${speciality}"]`).classList.add('active');
        
        // Update course filter based on speciality
        this.updateCourseFilter(speciality);
        
        // Reload data based on speciality
        this.loadSpecialityData(speciality);
        
        // Show success message
        this.showSpecialityMessage(speciality);
    }

    updateCourseFilter(speciality) {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;
        
        courseFilter.innerHTML = '<option value="">All Courses</option>';
        
        const courses = {
            medical: ['MBBS', 'MD', 'MS'],
            dental: ['BDS', 'MDS'],
            super: ['DM', 'MCh']
        };
        
        courses[speciality].forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = course;
            courseFilter.appendChild(option);
        });
    }

    loadSpecialityData(speciality) {
        // Filter colleges based on speciality
        this.filterCollegesBySpeciality(speciality);
        
        // Update counselling data filters
        this.updateCounsellingFilters(speciality);
    }

    filterCollegesBySpeciality(speciality) {
        const specialityCourses = {
            medical: ['MBBS', 'MD', 'MS'],
            dental: ['BDS', 'MDS'],
            super: ['DM', 'MCh']
        };
        
        const courses = specialityCourses[speciality];
        const filteredColleges = this.collegesData.filter(college => 
            college.courses.some(course => courses.includes(course.name))
        );
        
        this.displayColleges(filteredColleges);
    }

    updateCounsellingFilters(speciality) {
        const levelFilter = document.getElementById('counsellingLevel');
        if (!levelFilter) return;
        
        levelFilter.innerHTML = '<option value="">All Levels</option>';
        
        const levels = {
            medical: ['UG', 'PG'],
            dental: ['BDS', 'MDS'],
            super: ['DM', 'MCh']
        };
        
        levels[speciality].forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            levelFilter.appendChild(option);
        });
    }

    showSpecialityMessage(speciality) {
        const messages = {
            medical: 'Medical speciality selected. Showing MBBS, MD, and MS programs.',
            dental: 'Dental speciality selected. Showing BDS and MDS programs.',
            super: 'Super Speciality selected. Showing DM and MCh programs.'
        };
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${messages[speciality]}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    setupNavigation() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.showSection(e.state.section);
            }
        });

        // Update URL when section changes
        const originalShowSection = this.showSection.bind(this);
        this.showSection = (sectionName) => {
            originalShowSection(sectionName);
            history.pushState({ section: sectionName }, '', `#${sectionName}`);
        };
    }
}

// Global functions for quick actions
function showCollegeSearch() {
    app.showSection('colleges');
}

function showCounsellingData() {
    app.showSection('counselling');
}

function showComparison() {
    app.showSection('counselling');
    // Add comparison logic here
}

function showAnalytics() {
    app.showSection('analytics');
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MedicalCounsellingApp();
});

// Export for use in other modules
window.app = app;