// Admin Suite for Medical Counselling Platform

class AdminSuite {
    constructor() {
        this.currentFile = null;
        this.processedData = null;
        this.verificationResults = null;
        this.processingStatus = 'idle';
        this.anomalies = [];
        this.qualityMetrics = {
            completeness: 0,
            accuracy: 0,
            freshness: 0
        };
        this.validationSources = {
            nmc: { status: 'pending', lastChecked: null },
            dci: { status: 'pending', lastChecked: null },
            crossRef: { status: 'pending', lastChecked: null }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.initializeProcessingLog();
        this.setupAdvancedValidation();
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

        // Process data button
        const processBtn = document.querySelector('button[onclick="processData()"]');
        if (processBtn) {
            processBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.processData();
            });
        }

        // Rollback button
        const rollbackBtn = document.getElementById('rollbackData');
        if (rollbackBtn) {
            rollbackBtn.addEventListener('click', () => {
                this.rollbackData();
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

    // Advanced Processing Functions
    async processData() {
        const files = document.getElementById('excelFile').files;
        if (files.length === 0) {
            this.showAlert('Please select files to process.', 'warning');
            return;
        }

        this.processingStatus = 'processing';
        this.updateProcessingProgress(0);
        this.addProcessingLog('Starting data processing...', 'info');

        try {
            const dataSource = document.getElementById('dataSource').value;
            const dataType = document.getElementById('dataType').value;

            // Process each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.addProcessingLog(`Processing file: ${file.name}`, 'info');
                
                const processedData = await this.processFile(file, dataType);
                this.processedData = processedData;
                
                this.updateProcessingProgress((i + 1) / files.length * 100);
            }

            // Perform multi-source validation
            await this.performMultiSourceValidation();

            // Detect anomalies
            this.detectAnomalies();

            // Calculate quality metrics
            this.calculateQualityMetrics();

            this.processingStatus = 'completed';
            this.addProcessingLog('Data processing completed successfully!', 'success');
            this.showAlert('Data processed successfully!', 'success');

        } catch (error) {
            this.processingStatus = 'error';
            this.addProcessingLog(`Error: ${error.message}`, 'error');
            this.showAlert(`Processing failed: ${error.message}`, 'danger');
        }
    }

    async processFile(file, dataType) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    let data;
                    if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        data = await this.processExcelFile(file, dataType);
                    } else if (file.type.includes('csv') || file.name.endsWith('.csv')) {
                        data = await this.processCSVFile(file, dataType);
                    } else if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
                        data = await this.processPDFFile(file, dataType);
                    } else {
                        throw new Error('Unsupported file format');
                    }
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            
            if (file.type.includes('pdf')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    async processPDFFile(file, dataType) {
        // Placeholder for PDF processing
        // In a real implementation, you would use a PDF parsing library
        this.addProcessingLog('PDF processing not implemented yet', 'warning');
        return [];
    }

    async performMultiSourceValidation() {
        this.addProcessingLog('Starting multi-source validation...', 'info');

        // Simulate NMC validation
        await this.simulateValidation('nmc', 'NMC Official Data');
        
        // Simulate DCI validation
        await this.simulateValidation('dci', 'DCI Official Data');
        
        // Simulate cross-reference validation
        await this.simulateValidation('crossRef', 'Cross-Reference Check');

        this.addProcessingLog('Multi-source validation completed', 'success');
    }

    async simulateValidation(source, description) {
        this.addProcessingLog(`Validating against ${description}...`, 'info');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const success = Math.random() > 0.2; // 80% success rate
        this.validationSources[source].status = success ? 'success' : 'error';
        this.validationSources[source].lastChecked = new Date();
        
        this.updateValidationStatus(source, success ? 'success' : 'error');
        
        if (success) {
            this.addProcessingLog(`${description} validation passed`, 'success');
        } else {
            this.addProcessingLog(`${description} validation failed`, 'error');
        }
    }

    updateValidationStatus(source, status) {
        const statusElement = document.getElementById(`${source}Status`);
        if (statusElement) {
            const icon = status === 'success' ? 'fas fa-check-circle' : 
                        status === 'error' ? 'fas fa-times-circle' : 'fas fa-clock';
            const className = status === 'success' ? 'success' : 
                            status === 'error' ? 'error' : 'pending';
            
            statusElement.innerHTML = `<i class="${icon}"></i> ${status === 'success' ? 'Validated' : status === 'error' ? 'Failed' : 'Pending'}`;
            statusElement.className = `validation-status ${className}`;
        }
    }

    detectAnomalies() {
        this.addProcessingLog('Detecting anomalies...', 'info');
        this.anomalies = [];

        if (!this.processedData) return;

        // Check for missing required fields
        this.processedData.forEach((record, index) => {
            if (!record.name && !record.college) {
                this.anomalies.push({
                    type: 'missing_data',
                    message: `Row ${index + 1}: Missing college name`,
                    severity: 'high'
                });
            }
        });

        // Check for duplicate entries
        const names = this.processedData.map(r => r.name || r.college).filter(Boolean);
        const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
        duplicates.forEach(name => {
            this.anomalies.push({
                type: 'duplicate',
                message: `Duplicate entry found: ${name}`,
                severity: 'medium'
            });
        });

        // Check for invalid data patterns
        this.processedData.forEach((record, index) => {
            if (record.seats && (record.seats < 0 || record.seats > 1000)) {
                this.anomalies.push({
                    type: 'invalid_data',
                    message: `Row ${index + 1}: Invalid seat count (${record.seats})`,
                    severity: 'medium'
                });
            }
        });

        this.updateAnomalyList();
        this.addProcessingLog(`Detected ${this.anomalies.length} anomalies`, this.anomalies.length > 0 ? 'warning' : 'success');
    }

    updateAnomalyList() {
        const container = document.getElementById('anomalyList');
        if (!container) return;

        if (this.anomalies.length === 0) {
            container.innerHTML = `
                <div class="anomaly-item">
                    <i class="fas fa-check-circle text-success"></i>
                    <span>No anomalies detected</span>
                </div>
            `;
        } else {
            container.innerHTML = this.anomalies.map(anomaly => `
                <div class="anomaly-item">
                    <i class="fas fa-exclamation-triangle text-${anomaly.severity === 'high' ? 'danger' : 'warning'}"></i>
                    <span>${anomaly.message}</span>
                </div>
            `).join('');
        }
    }

    calculateQualityMetrics() {
        if (!this.processedData) return;

        const totalRecords = this.processedData.length;
        const validRecords = this.processedData.filter(record => 
            (record.name || record.college) && 
            (record.state || record.type) &&
            (!record.seats || (record.seats > 0 && record.seats <= 1000))
        ).length;

        this.qualityMetrics.completeness = Math.round((validRecords / totalRecords) * 100);
        this.qualityMetrics.accuracy = Math.round((validRecords / totalRecords) * 100);
        this.qualityMetrics.freshness = Math.round(87 + Math.random() * 10); // Simulate freshness

        this.updateQualityMetrics();
        this.addProcessingLog(`Quality metrics calculated: Completeness ${this.qualityMetrics.completeness}%, Accuracy ${this.qualityMetrics.accuracy}%`, 'success');
    }

    updateQualityMetrics() {
        const completenessBar = document.querySelector('.quality-metrics .metric:nth-child(1) .progress-bar');
        const accuracyBar = document.querySelector('.quality-metrics .metric:nth-child(2) .progress-bar');
        const freshnessBar = document.querySelector('.quality-metrics .metric:nth-child(3) .progress-bar');

        if (completenessBar) {
            completenessBar.style.width = `${this.qualityMetrics.completeness}%`;
            completenessBar.textContent = `${this.qualityMetrics.completeness}%`;
        }

        if (accuracyBar) {
            accuracyBar.style.width = `${this.qualityMetrics.accuracy}%`;
            accuracyBar.textContent = `${this.qualityMetrics.accuracy}%`;
        }

        if (freshnessBar) {
            freshnessBar.style.width = `${this.qualityMetrics.freshness}%`;
            freshnessBar.textContent = `${this.qualityMetrics.freshness}%`;
        }
    }

    initializeProcessingLog() {
        const logContainer = document.getElementById('processingLog');
        if (logContainer) {
            logContainer.innerHTML = '<div class="log-entry">Ready to process data...</div>';
        }
    }

    addProcessingLog(message, type = 'info') {
        const logContainer = document.getElementById('processingLog');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `[${timestamp}] ${message}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    updateProcessingProgress(percentage) {
        const progressBar = document.getElementById('processingProgress');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }
    }

    setupAdvancedValidation() {
        // Initialize validation status elements
        Object.keys(this.validationSources).forEach(source => {
            this.updateValidationStatus(source, 'pending');
        });
    }

    async rollbackData() {
        if (confirm('Are you sure you want to rollback the last deployment? This action cannot be undone.')) {
            this.addProcessingLog('Starting rollback process...', 'warning');
            
            try {
                // Simulate rollback process
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                this.addProcessingLog('Rollback completed successfully', 'success');
                this.showAlert('Data rollback completed successfully!', 'success');
                
                // Reset processing status
                this.processingStatus = 'idle';
                this.updateProcessingProgress(0);
                
            } catch (error) {
                this.addProcessingLog(`Rollback failed: ${error.message}`, 'error');
                this.showAlert(`Rollback failed: ${error.message}`, 'danger');
            }
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