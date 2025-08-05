// Admin Suite for Medical Counselling Platform

class AdminSuite {
    constructor() {
        this.currentFile = null;
        this.processedData = null;
        this.verificationResults = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // File upload form
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFileUpload();
            });
        }

        // Data verification
        const verifyBtn = document.getElementById('verifyData');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                this.verifyData();
            });
        }

        // Push to production
        const pushBtn = document.getElementById('pushData');
        if (pushBtn) {
            pushBtn.addEventListener('click', () => {
                this.pushToProduction();
            });
        }

        // Data type change
        const dataTypeSelect = document.getElementById('dataType');
        if (dataTypeSelect) {
            dataTypeSelect.addEventListener('change', () => {
                this.updateUploadInterface();
            });
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.querySelector('.upload-area') || document.body;
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }

    updateUploadInterface() {
        const dataType = document.getElementById('dataType')?.value;
        const fileInput = document.getElementById('excelFile');
        
        if (dataType === 'colleges') {
            fileInput.accept = '.xlsx,.xls,.csv';
            this.showUploadInstructions('colleges');
        } else if (dataType === 'counselling') {
            fileInput.accept = '.xlsx,.xls,.csv';
            this.showUploadInstructions('counselling');
        }
    }

    showUploadInstructions(type) {
        const instructions = {
            colleges: `
                <div class="alert alert-info">
                    <h6>Colleges Data Format:</h6>
                    <ul>
                        <li>Columns: Name, State, City, Type, Contact, Website, Courses (JSON format)</li>
                        <li>Courses should be in format: [{"name": "MBBS", "seats": 100}]</li>
                        <li>Supported formats: Excel (.xlsx, .xls), CSV</li>
                    </ul>
                </div>
            `,
            counselling: `
                <div class="alert alert-info">
                    <h6>Counselling Data Format:</h6>
                    <ul>
                        <li>Columns: Type, Year, Level, Round, College, Course, Opening_Rank, Closing_Rank, Seats, Category</li>
                        <li>Type: AIQ, Karnataka</li>
                        <li>Level: UG, PG, BDS, MDS</li>
                        <li>Supported formats: Excel (.xlsx, .xls), CSV</li>
                    </ul>
                </div>
            `
        };

        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            const existingInstructions = uploadForm.querySelector('.alert-info');
            if (existingInstructions) {
                existingInstructions.remove();
            }
            
            const instructionsDiv = document.createElement('div');
            instructionsDiv.innerHTML = instructions[type];
            uploadForm.insertBefore(instructionsDiv.firstElementChild, uploadForm.firstChild);
        }
    }

    async handleFileUpload() {
        const fileInput = document.getElementById('excelFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showAlert('Please select a file to upload.', 'warning');
            return;
        }

        await this.handleFile(file);
    }

    async handleFile(file) {
        this.currentFile = file;
        this.showLoadingState(true);

        try {
            const dataType = document.getElementById('dataType')?.value;
            
            if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                this.processedData = await this.processExcelFile(file, dataType);
            } else if (file.type.includes('csv') || file.name.endsWith('.csv')) {
                this.processedData = await this.processCSVFile(file, dataType);
            } else {
                throw new Error('Unsupported file format. Please upload Excel or CSV file.');
            }

            this.showVerificationStatus();
            this.showAlert(`File processed successfully. ${this.processedData.length} records found.`, 'success');
            
        } catch (error) {
            console.error('File processing error:', error);
            this.showAlert(`Error processing file: ${error.message}`, 'danger');
        } finally {
            this.showLoadingState(false);
        }
    }

    async processExcelFile(file, dataType) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    const processedData = this.convertToStructuredData(jsonData, dataType);
                    resolve(processedData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    async processCSVFile(file, dataType) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    const data = lines.slice(1).filter(line => line.trim()).map(line => {
                        const values = line.split(',').map(v => v.trim());
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index] || '';
                        });
                        return row;
                    });
                    
                    const processedData = this.convertToStructuredData(data, dataType);
                    resolve(processedData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    convertToStructuredData(data, dataType) {
        if (dataType === 'colleges') {
            return this.convertToCollegesData(data);
        } else if (dataType === 'counselling') {
            return this.convertToCounsellingData(data);
        }
        return data;
    }

    convertToCollegesData(data) {
        return data.map((row, index) => ({
            id: index + 1,
            name: row.Name || row.name || '',
            state: row.State || row.state || '',
            city: row.City || row.city || '',
            type: row.Type || row.type || 'Private',
            contact: row.Contact || row.contact || '',
            website: row.Website || row.website || '',
            courses: this.parseCourses(row.Courses || row.courses || '[]')
        })).filter(college => college.name && college.state);
    }

    convertToCounsellingData(data) {
        return data.map((row, index) => ({
            id: index + 1,
            type: row.Type || row.type || 'AIQ',
            year: parseInt(row.Year || row.year) || 2024,
            level: row.Level || row.level || 'UG',
            round: parseInt(row.Round || row.round) || 1,
            college: row.College || row.college || '',
            course: row.Course || row.course || '',
            opening_rank: parseInt(row.Opening_Rank || row.opening_rank) || 0,
            closing_rank: parseInt(row.Closing_Rank || row.closing_rank) || 0,
            seats: parseInt(row.Seats || row.seats) || 0,
            category: row.Category || row.category || 'General'
        })).filter(item => item.college && item.course);
    }

    parseCourses(coursesString) {
        try {
            if (typeof coursesString === 'string') {
                return JSON.parse(coursesString);
            }
            return coursesString || [];
        } catch (error) {
            console.error('Error parsing courses:', error);
            return [];
        }
    }

    showVerificationStatus() {
        const statusDiv = document.getElementById('verificationStatus');
        const verifyBtn = document.getElementById('verifyData');
        const pushBtn = document.getElementById('pushData');
        
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="alert alert-info">
                    <h6>Data Ready for Verification</h6>
                    <p>File: ${this.currentFile.name}</p>
                    <p>Records: ${this.processedData.length}</p>
                    <p>Type: ${document.getElementById('dataType')?.value}</p>
                </div>
            `;
        }
        
        if (verifyBtn) verifyBtn.disabled = false;
        if (pushBtn) pushBtn.disabled = true;
    }

    async verifyData() {
        if (!this.processedData) {
            this.showAlert('No data to verify. Please upload a file first.', 'warning');
            return;
        }

        this.showLoadingState(true);
        
        try {
            const dataType = document.getElementById('dataType')?.value;
            this.verificationResults = await this.performDataVerification(this.processedData, dataType);
            
            this.showVerificationResults();
            this.showAlert('Data verification completed successfully.', 'success');
            
        } catch (error) {
            console.error('Verification error:', error);
            this.showAlert(`Verification failed: ${error.message}`, 'danger');
        } finally {
            this.showLoadingState(false);
        }
    }

    async performDataVerification(data, dataType) {
        const results = {
            totalRecords: data.length,
            validRecords: 0,
            invalidRecords: 0,
            errors: [],
            warnings: []
        };

        for (let i = 0; i < data.length; i++) {
            const record = data[i];
            const validation = this.validateRecord(record, dataType, i + 1);
            
            if (validation.isValid) {
                results.validRecords++;
            } else {
                results.invalidRecords++;
                results.errors.push(...validation.errors);
            }
            
            if (validation.warnings.length > 0) {
                results.warnings.push(...validation.warnings);
            }
        }

        return results;
    }

    validateRecord(record, dataType, rowNumber) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (dataType === 'colleges') {
            // Validate college data
            if (!record.name || record.name.trim() === '') {
                result.errors.push(`Row ${rowNumber}: College name is required`);
                result.isValid = false;
            }
            
            if (!record.state || record.state.trim() === '') {
                result.errors.push(`Row ${rowNumber}: State is required`);
                result.isValid = false;
            }
            
            if (!record.city || record.city.trim() === '') {
                result.errors.push(`Row ${rowNumber}: City is required`);
                result.isValid = false;
            }
            
            if (!Array.isArray(record.courses) || record.courses.length === 0) {
                result.warnings.push(`Row ${rowNumber}: No courses specified`);
            }
            
            // Validate courses
            if (Array.isArray(record.courses)) {
                record.courses.forEach((course, index) => {
                    if (!course.name) {
                        result.errors.push(`Row ${rowNumber}, Course ${index + 1}: Course name is required`);
                        result.isValid = false;
                    }
                    if (!course.seats || course.seats <= 0) {
                        result.warnings.push(`Row ${rowNumber}, Course ${index + 1}: Invalid seat count`);
                    }
                });
            }

        } else if (dataType === 'counselling') {
            // Validate counselling data
            if (!record.college || record.college.trim() === '') {
                result.errors.push(`Row ${rowNumber}: College name is required`);
                result.isValid = false;
            }
            
            if (!record.course || record.course.trim() === '') {
                result.errors.push(`Row ${rowNumber}: Course is required`);
                result.isValid = false;
            }
            
            if (!record.type || !['AIQ', 'Karnataka'].includes(record.type)) {
                result.errors.push(`Row ${rowNumber}: Invalid counselling type`);
                result.isValid = false;
            }
            
            if (!record.level || !['UG', 'PG', 'BDS', 'MDS'].includes(record.level)) {
                result.errors.push(`Row ${rowNumber}: Invalid level`);
                result.isValid = false;
            }
            
            if (record.opening_rank < 0 || record.closing_rank < 0) {
                result.errors.push(`Row ${rowNumber}: Invalid rank values`);
                result.isValid = false;
            }
            
            if (record.opening_rank > record.closing_rank) {
                result.warnings.push(`Row ${rowNumber}: Opening rank is greater than closing rank`);
            }
            
            if (record.seats <= 0) {
                result.warnings.push(`Row ${rowNumber}: Invalid seat count`);
            }
        }

        return result;
    }

    showVerificationResults() {
        const statusDiv = document.getElementById('verificationStatus');
        const pushBtn = document.getElementById('pushData');
        
        if (statusDiv && this.verificationResults) {
            const results = this.verificationResults;
            const isValid = results.invalidRecords === 0;
            
            statusDiv.innerHTML = `
                <div class="alert alert-${isValid ? 'success' : 'warning'}">
                    <h6>Verification Results</h6>
                    <p><strong>Total Records:</strong> ${results.totalRecords}</p>
                    <p><strong>Valid Records:</strong> ${results.validRecords}</p>
                    <p><strong>Invalid Records:</strong> ${results.invalidRecords}</p>
                    ${results.errors.length > 0 ? `
                        <div class="mt-3">
                            <h6>Errors:</h6>
                            <ul class="text-danger">
                                ${results.errors.slice(0, 5).map(error => `<li>${error}</li>`).join('')}
                                ${results.errors.length > 5 ? `<li>... and ${results.errors.length - 5} more errors</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                    ${results.warnings.length > 0 ? `
                        <div class="mt-3">
                            <h6>Warnings:</h6>
                            <ul class="text-warning">
                                ${results.warnings.slice(0, 3).map(warning => `<li>${warning}</li>`).join('')}
                                ${results.warnings.length > 3 ? `<li>... and ${results.warnings.length - 3} more warnings</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        if (pushBtn) {
            pushBtn.disabled = !isValid;
        }
    }

    async pushToProduction() {
        if (!this.processedData || !this.verificationResults || this.verificationResults.invalidRecords > 0) {
            this.showAlert('Cannot push data with validation errors.', 'danger');
            return;
        }

        this.showLoadingState(true);
        
        try {
            const dataType = document.getElementById('dataType')?.value;
            
            // Save to database
            if (window.dbManager) {
                if (dataType === 'colleges') {
                    for (const college of this.processedData) {
                        await window.dbManager.addCollege(college);
                    }
                } else if (dataType === 'counselling') {
                    for (const item of this.processedData) {
                        await window.dbManager.addCounsellingData(item);
                    }
                }
            }
            
            // Generate JSON file for download
            this.generateJSONFile(dataType);
            
            this.showAlert('Data successfully pushed to production!', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Push to production error:', error);
            this.showAlert(`Failed to push data: ${error.message}`, 'danger');
        } finally {
            this.showLoadingState(false);
        }
    }

    generateJSONFile(dataType) {
        const data = this.processedData;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetForm() {
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.reset();
        }
        
        this.currentFile = null;
        this.processedData = null;
        this.verificationResults = null;
        
        const statusDiv = document.getElementById('verificationStatus');
        const verifyBtn = document.getElementById('verifyData');
        const pushBtn = document.getElementById('pushData');
        
        if (statusDiv) {
            statusDiv.innerHTML = '<p>No data uploaded for verification</p>';
        }
        
        if (verifyBtn) verifyBtn.disabled = true;
        if (pushBtn) pushBtn.disabled = true;
    }

    showLoadingState(show) {
        const buttons = document.querySelectorAll('#uploadForm button, #verifyData, #pushData');
        buttons.forEach(button => {
            if (show) {
                button.disabled = true;
                button.innerHTML = '<span class="loading-spinner"></span> Processing...';
            } else {
                button.disabled = false;
                if (button.id === 'verifyData') {
                    button.innerHTML = 'Verify Data';
                } else if (button.id === 'pushData') {
                    button.innerHTML = 'Push to Production';
                } else {
                    button.innerHTML = 'Process & Upload';
                }
            }
        });
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const adminSection = document.querySelector('#admin .row');
        if (adminSection) {
            adminSection.insertBefore(alertDiv, adminSection.firstChild);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// Initialize admin suite
let adminSuite;
document.addEventListener('DOMContentLoaded', () => {
    adminSuite = new AdminSuite();
});

// Export for use in other modules
window.adminSuite = adminSuite;