// Analytics Module for Medical Counselling Platform

class AnalyticsModule {
    constructor() {
        this.charts = {};
        this.currentData = null;
        this.currentYear = 2024;
        this.comparisonMode = false;
        this.splitScreenData = {
            2024: null,
            2023: null
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSplitScreenComparison();
        this.setupSeatAllocationTransparency();
        this.setupCompetitionAnalysis();
        this.setupRecognitionIntelligence();
    }

    setupEventListeners() {
        // Analytics filters
        document.addEventListener('change', (e) => {
            if (e.target.matches('#analyticsType, #analyticsYear, #analyticsState')) {
                this.updateAnalytics();
            }
        });
    }

    async loadAnalytics() {
        try {
            // Load data from database or fetch from API
            const collegesData = await this.getCollegesData();
            const counsellingData = await this.getCounsellingData();
            
            this.currentData = {
                colleges: collegesData,
                counselling: counsellingData
            };
            
            this.renderAnalytics();
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }

    async getCollegesData() {
        if (window.dbManager) {
            return await window.dbManager.getColleges();
        }
        return [];
    }

    async getCounsellingData() {
        if (window.dbManager) {
            return await window.dbManager.getCounsellingData();
        }
        return [];
    }

    renderAnalytics() {
        this.renderStateChart();
        this.renderCourseChart();
        this.renderTrendChart();
        this.renderComparisonChart();
        this.renderSeatAnalysis();
        this.renderSplitScreenComparison();
        this.renderSeatAllocationTransparency();
        this.renderCompetitionAnalysis();
        this.renderRecognitionIntelligence();
    }

    renderStateChart() {
        const ctx = document.getElementById('stateChart');
        if (!ctx) return;

        const data = this.analyzeStateDistribution();
        
        if (this.charts.stateChart) {
            this.charts.stateChart.destroy();
        }

        this.charts.stateChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.generateColors(data.labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} colleges (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderCourseChart() {
        const ctx = document.getElementById('courseChart');
        if (!ctx) return;

        const data = this.analyzeCourseDistribution();
        
        if (this.charts.courseChart) {
            this.charts.courseChart.destroy();
        }

        this.charts.courseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Total Seats',
                    data: data.values,
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Seats'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Courses'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Seats: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const data = this.analyzeTrends();
        
        if (this.charts.trendChart) {
            this.charts.trendChart.destroy();
        }

        this.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Seats'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    renderComparisonChart() {
        const comparisonContainer = document.getElementById('comparisonChart');
        if (!comparisonContainer) return;

        const data = this.analyzeComparison();
        
        comparisonContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h5>Round 1 vs Round 2 (2024)</h5>
                    <canvas id="roundComparison2024"></canvas>
                </div>
                <div class="col-md-6">
                    <h5>Round 1 vs Round 2 (2023)</h5>
                    <canvas id="roundComparison2023"></canvas>
                </div>
            </div>
        `;

        // Render 2024 comparison
        const ctx2024 = document.getElementById('roundComparison2024');
        if (ctx2024) {
            this.charts.roundComparison2024 = new Chart(ctx2024, {
                type: 'bar',
                data: {
                    labels: data.labels2024,
                    datasets: [
                        {
                            label: 'Round 1',
                            data: data.round1_2024,
                            backgroundColor: 'rgba(39, 174, 96, 0.8)',
                            borderColor: 'rgba(39, 174, 96, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Round 2',
                            data: data.round2_2024,
                            backgroundColor: 'rgba(52, 152, 219, 0.8)',
                            borderColor: 'rgba(52, 152, 219, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Render 2023 comparison
        const ctx2023 = document.getElementById('roundComparison2023');
        if (ctx2023) {
            this.charts.roundComparison2023 = new Chart(ctx2023, {
                type: 'bar',
                data: {
                    labels: data.labels2023,
                    datasets: [
                        {
                            label: 'Round 1',
                            data: data.round1_2023,
                            backgroundColor: 'rgba(39, 174, 96, 0.8)',
                            borderColor: 'rgba(39, 174, 96, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Round 2',
                            data: data.round2_2023,
                            backgroundColor: 'rgba(52, 152, 219, 0.8)',
                            borderColor: 'rgba(52, 152, 219, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    renderSeatAnalysis() {
        const analysisContainer = document.getElementById('seatAnalysis');
        if (!analysisContainer) return;

        const analysis = this.analyzeSeatDistribution();
        
        analysisContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>${analysis.totalSeats.toLocaleString()}</h4>
                            <p>Total Seats</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>${analysis.avgSeatsPerCollege.toFixed(1)}</h4>
                            <p>Avg Seats/College</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>${analysis.topState}</h4>
                            <p>Top State</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body text-center">
                            <h4>${analysis.topCourse}</h4>
                            <p>Top Course</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    analyzeStateDistribution() {
        if (!this.currentData?.colleges) return { labels: [], values: [] };

        const stateCount = {};
        this.currentData.colleges.forEach(college => {
            stateCount[college.state] = (stateCount[college.state] || 0) + 1;
        });

        const sorted = Object.entries(stateCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        return {
            labels: sorted.map(([state]) => state),
            values: sorted.map(([, count]) => count)
        };
    }

    analyzeCourseDistribution() {
        if (!this.currentData?.colleges) return { labels: [], values: [] };

        const courseSeats = {};
        this.currentData.colleges.forEach(college => {
            college.courses.forEach(course => {
                courseSeats[course.name] = (courseSeats[course.name] || 0) + course.seats;
            });
        });

        const sorted = Object.entries(courseSeats)
            .sort(([,a], [,b]) => b - a);

        return {
            labels: sorted.map(([course]) => course),
            values: sorted.map(([, seats]) => seats)
        };
    }

    analyzeTrends() {
        if (!this.currentData?.counselling) return { labels: [], datasets: [] };

        const trends = {};
        this.currentData.counselling.forEach(item => {
            if (!trends[item.year]) {
                trends[item.year] = { UG: 0, PG: 0, BDS: 0, MDS: 0 };
            }
            trends[item.year][item.level] += item.seats;
        });

        const years = Object.keys(trends).sort();
        const levels = ['UG', 'PG', 'BDS', 'MDS'];
        const colors = ['rgba(39, 174, 96, 0.8)', 'rgba(52, 152, 219, 0.8)', 'rgba(155, 89, 182, 0.8)', 'rgba(230, 126, 34, 0.8)'];

        return {
            labels: years,
            datasets: levels.map((level, index) => ({
                label: level,
                data: years.map(year => trends[year][level] || 0),
                borderColor: colors[index],
                backgroundColor: colors[index],
                tension: 0.1
            }))
        };
    }

    analyzeComparison() {
        if (!this.currentData?.counselling) {
            return {
                labels2024: [], labels2023: [],
                round1_2024: [], round2_2024: [],
                round1_2023: [], round2_2023: []
            };
        }

        const comparison = { 2024: { 1: {}, 2: {} }, 2023: { 1: {}, 2: {} } };
        
        this.currentData.counselling.forEach(item => {
            if (comparison[item.year] && comparison[item.year][item.round]) {
                comparison[item.year][item.round][item.course] = 
                    (comparison[item.year][item.round][item.course] || 0) + item.seats;
            }
        });

        const courses = [...new Set(this.currentData.counselling.map(item => item.course))];

        return {
            labels2024: courses,
            labels2023: courses,
            round1_2024: courses.map(course => comparison[2024][1][course] || 0),
            round2_2024: courses.map(course => comparison[2024][2][course] || 0),
            round1_2023: courses.map(course => comparison[2023][1][course] || 0),
            round2_2023: courses.map(course => comparison[2023][2][course] || 0)
        };
    }

    analyzeSeatDistribution() {
        if (!this.currentData?.colleges) {
            return {
                totalSeats: 0,
                avgSeatsPerCollege: 0,
                topState: 'N/A',
                topCourse: 'N/A'
            };
        }

        const totalSeats = this.currentData.colleges.reduce((total, college) => {
            return total + college.courses.reduce((sum, course) => sum + course.seats, 0);
        }, 0);

        const avgSeatsPerCollege = totalSeats / this.currentData.colleges.length;

        // Find top state
        const stateSeats = {};
        this.currentData.colleges.forEach(college => {
            const collegeSeats = college.courses.reduce((sum, course) => sum + course.seats, 0);
            stateSeats[college.state] = (stateSeats[college.state] || 0) + collegeSeats;
        });

        const topState = Object.entries(stateSeats)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

        // Find top course
        const courseSeats = {};
        this.currentData.colleges.forEach(college => {
            college.courses.forEach(course => {
                courseSeats[course.name] = (courseSeats[course.name] || 0) + course.seats;
            });
        });

        const topCourse = Object.entries(courseSeats)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

        return {
            totalSeats,
            avgSeatsPerCollege,
            topState,
            topCourse
        };
    }

    generateColors(count) {
        const colors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    updateAnalytics() {
        this.renderAnalytics();
    }

    showError(message) {
        const analyticsSection = document.getElementById('analytics');
        if (analyticsSection) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.textContent = message;
            analyticsSection.appendChild(errorDiv);
        }
    }

    // Export analytics data
    exportAnalytics() {
        const data = {
            stateDistribution: this.analyzeStateDistribution(),
            courseDistribution: this.analyzeCourseDistribution(),
            trends: this.analyzeTrends(),
            comparison: this.analyzeComparison(),
            seatAnalysis: this.analyzeSeatDistribution(),
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Generate PDF report
    generatePDFReport() {
        // This would integrate with a PDF generation library
        console.log('PDF report generation would be implemented here');
    }

    // Advanced Analytics Functions
    setupSplitScreenComparison() {
        // Initialize split-screen comparison data
        this.loadSplitScreenData();
    }

    async loadSplitScreenData() {
        try {
            // Load 2024 and 2023 data separately for comparison
            this.splitScreenData[2024] = await this.getCounsellingDataByYear(2024);
            this.splitScreenData[2023] = await this.getCounsellingDataByYear(2023);
        } catch (error) {
            console.error('Error loading split-screen data:', error);
        }
    }

    async getCounsellingDataByYear(year) {
        if (window.dbManager) {
            const allData = await window.dbManager.getCounsellingData();
            return allData.filter(item => item.year === year);
        }
        return [];
    }

    renderSplitScreenComparison() {
        this.renderChart2024();
        this.renderChart2023();
    }

    renderChart2024() {
        const ctx = document.getElementById('chart2024');
        if (!ctx) return;

        const data = this.analyzeYearData(2024);
        
        if (this.charts.chart2024) {
            this.charts.chart2024.destroy();
        }

        this.charts.chart2024 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '2024 Data',
                    data: data.values,
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderChart2023() {
        const ctx = document.getElementById('chart2023');
        if (!ctx) return;

        const data = this.analyzeYearData(2023);
        
        if (this.charts.chart2023) {
            this.charts.chart2023.destroy();
        }

        this.charts.chart2023 = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '2023 Data',
                    data: data.values,
                    backgroundColor: 'rgba(39, 174, 96, 0.8)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    analyzeYearData(year) {
        const data = this.splitScreenData[year];
        if (!data) return { labels: [], values: [] };

        const courseData = {};
        data.forEach(item => {
            courseData[item.course] = (courseData[item.course] || 0) + item.seats;
        });

        const sorted = Object.entries(courseData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);

        return {
            labels: sorted.map(([course]) => course),
            values: sorted.map(([, seats]) => seats)
        };
    }

    setupSeatAllocationTransparency() {
        // Initialize seat allocation transparency analysis
    }

    renderSeatAllocationTransparency() {
        this.renderAIQChart();
        this.renderStateQuotaChart();
    }

    renderAIQChart() {
        const ctx = document.getElementById('aiqChart');
        if (!ctx) return;

        const data = this.analyzeAIQDistribution();
        
        if (this.charts.aiqChart) {
            this.charts.aiqChart.destroy();
        }

        this.charts.aiqChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.generateColors(data.labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} seats (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderStateQuotaChart() {
        const ctx = document.getElementById('stateQuotaChart');
        if (!ctx) return;

        const data = this.analyzeStateQuotaDistribution();
        
        if (this.charts.stateQuotaChart) {
            this.charts.stateQuotaChart.destroy();
        }

        this.charts.stateQuotaChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.generateColors(data.labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} seats (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    analyzeAIQDistribution() {
        if (!this.currentData?.counselling) return { labels: [], values: [] };

        const aiqData = this.currentData.counselling.filter(item => item.type === 'AIQ');
        const courseSeats = {};

        aiqData.forEach(item => {
            courseSeats[item.course] = (courseSeats[item.course] || 0) + item.seats;
        });

        const sorted = Object.entries(courseSeats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);

        return {
            labels: sorted.map(([course]) => course),
            values: sorted.map(([, seats]) => seats)
        };
    }

    analyzeStateQuotaDistribution() {
        if (!this.currentData?.counselling) return { labels: [], values: [] };

        const stateData = this.currentData.counselling.filter(item => item.type === 'Karnataka');
        const courseSeats = {};

        stateData.forEach(item => {
            courseSeats[item.course] = (courseSeats[item.course] || 0) + item.seats;
        });

        const sorted = Object.entries(courseSeats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6);

        return {
            labels: sorted.map(([course]) => course),
            values: sorted.map(([, seats]) => seats)
        };
    }

    setupCompetitionAnalysis() {
        // Initialize competition ratio analysis
    }

    renderCompetitionAnalysis() {
        const ctx = document.getElementById('competitionChart');
        if (!ctx) return;

        const data = this.analyzeCompetitionRatios();
        
        if (this.charts.competitionChart) {
            this.charts.competitionChart.destroy();
        }

        this.charts.competitionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Applicant to Seat Ratio',
                    data: data.values,
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Ratio'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Ratio: ${context.parsed.y.toFixed(2)}:1`;
                            }
                        }
                    }
                }
            }
        });
    }

    analyzeCompetitionRatios() {
        if (!this.currentData?.counselling) return { labels: [], values: [] };

        const courseRatios = {};
        const courseSeats = {};
        const courseApplicants = {};

        // Simulate applicant data (in real implementation, this would come from actual data)
        this.currentData.counselling.forEach(item => {
            courseSeats[item.course] = (courseSeats[item.course] || 0) + item.seats;
            courseApplicants[item.course] = (courseApplicants[item.course] || 0) + (item.seats * (2 + Math.random() * 3)); // Simulate 2-5x applicants
        });

        Object.keys(courseSeats).forEach(course => {
            courseRatios[course] = courseApplicants[course] / courseSeats[course];
        });

        const sorted = Object.entries(courseRatios)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);

        return {
            labels: sorted.map(([course]) => course),
            values: sorted.map(([, ratio]) => ratio)
        };
    }

    setupRecognitionIntelligence() {
        // Initialize recognition status intelligence
    }

    renderRecognitionIntelligence() {
        // This would render the recognition status cards
        // The HTML structure is already in place in index.html
        this.updateRecognitionStatus();
    }

    updateRecognitionStatus() {
        if (!this.currentData?.colleges) return;

        const statusCounts = {
            active: 0,
            suspended: 0,
            pending: 0,
            denied: 0
        };

        this.currentData.colleges.forEach(college => {
            const status = college.recognition?.status || 'active';
            statusCounts[status.toLowerCase()] = (statusCounts[status.toLowerCase()] || 0) + 1;
        });

        // Update status cards with real data
        const statusCards = document.querySelectorAll('.status-card');
        statusCards.forEach(card => {
            const status = card.classList.contains('active') ? 'active' :
                         card.classList.contains('suspended') ? 'suspended' :
                         card.classList.contains('pending') ? 'pending' : 'denied';
            
            const count = statusCounts[status] || 0;
            const h4 = card.querySelector('h4');
            if (h4) {
                h4.innerHTML = h4.innerHTML.replace(/\d+/, count);
            }
        });
    }
}

// Initialize analytics module
let analyticsModule;
document.addEventListener('DOMContentLoaded', () => {
    analyticsModule = new AnalyticsModule();
});

// Global function for loading analytics
window.loadAnalytics = function() {
    if (analyticsModule) {
        analyticsModule.loadAnalytics();
    }
};

// Export for use in other modules
window.analyticsModule = analyticsModule;