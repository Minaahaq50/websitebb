const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');
let matrixInterval;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initMatrix() {
    resizeCanvas();
    
    const matrixChars = "01アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    const drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -100);
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff4c';
        ctx.font = ${fontSize}px monospace;
        
        for (let i = 0; i < drops.length; i++) {
            const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            ctx.fillText(text, x, y);
            
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            drops[i]++;
        }
    }
    
    clearInterval(matrixInterval);
    matrixInterval = setInterval(draw, 100);
}

function showMatrixEffect() {
    const matrixBg = document.getElementById('matrix-bg');
    document.body.classList.add('matrix-visible');
    
    if (!matrixInterval) {
        initMatrix();
    }
}

window.addEventListener('load', function() {
    resizeCanvas();
    initMatrix();
});
window.addEventListener('resize', resizeCanvas);

const TWILIO_CONFIG = {
    accountSid: "AC7880ca59cd69082df28459b683b69c25",
    authToken: "09d9f1da371f28b0d3bf939f6d9051fa",
    fromNumber: "+12345162858"
};

const MAX_DAILY_CALLS = 10;
let callActive = false;
let callPaused = false;
let callStats = {
    success: 0,
    failed: 0,
    total: 0,
    startTime: null,
    callsToday: 0
};
let callTimer = null;
let currentCall = 0;
let isFirstCall = true;
let remainingDelay = 0;
let pauseTime = 0;
let callStartTime = 0;
let currentDelay = 0;

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('lastCallDate');
    const storedCalls = localStorage.getItem('callsToday');
    
    if (storedDate === today && storedCalls) {
        callStats.callsToday = parseInt(storedCalls);
    } else {
        callStats.callsToday = 0;
        localStorage.setItem('lastCallDate', today);
        localStorage.setItem('callsToday', '0');
    }
    
    setupLogoInteractions();
    
    window.addEventListener('beforeunload', function() {
        if (matrixInterval) {
            clearInterval(matrixInterval);
        }
        if (callTimer) {
            clearTimeout(callTimer);
        }
    });
});

function verifyAccess() {
    const code = document.getElementById('accessCode').value;
    const errorElement = document.getElementById('accessError');
    
    if (code === "1998") {
        document.getElementById('accessScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.body.classList.add('main-active');
        setTimeout(() => {
            document.getElementById('mainContent').style.opacity = '1';
            showMatrixEffect();
        }, 50);
    } else {
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
        
        document.getElementById('accessCode').style.animation = 'shake 0.5s';
        setTimeout(() => {
            document.getElementById('accessCode').style.animation = '';
        }, 500);
    }
}

function startCalls() {
    if (!validateCallConfig()) return;
    
    if (callStats.callsToday >= MAX_DAILY_CALLS) {
        alert(You have reached the daily call limit (${MAX_DAILY_CALLS} calls));
        return;
    }
    
    callActive = true;
    callPaused = false;
    currentCall = 0;
    isFirstCall = true;
    const callCount = parseInt(document.getElementById('callCount').value);
    
    const remainingCalls = MAX_DAILY_CALLS - callStats.callsToday;
    if (callCount > remainingCalls) {
        alert(You can only send ${remainingCalls} more calls today);
        return;
    }
    
    callStats.success = 0;
    callStats.failed = 0;
    callStats.total = callCount;
    callStats.startTime = Date.now();
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'flex';
    document.getElementById('progressSection').style.display = 'block';
    updateStats();
    updateProgress();
    
    executeCalls();
}

function pauseCalls() {
    if (callPaused) {
        callPaused = false;
        document.getElementById('pauseBtn').className = 'btn btn-blue';
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        
        const elapsedPauseTime = Date.now() - pauseTime;
        remainingDelay = Math.max(0, remainingDelay - elapsedPauseTime);
        
        executeCalls();
    } else {
        callPaused = true;
        document.getElementById('pauseBtn').className = 'btn btn-green';
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i> Resume';
        pauseTime = Date.now();
        
        if (callTimer) {
            clearTimeout(callTimer);
            callTimer = null;
            const elapsed = Date.now() - callStartTime;
            remainingDelay = Math.max(0, currentDelay - elapsed);
        }
    }
}

function executeCalls() {
    if (!callActive || callPaused || currentCall >= callStats.total) {
        if (currentCall >= callStats.total) {
            stopCalls();
            setTimeout(showCallComplete, 5000);
        }
        return;
    }
    
    let delay;
    if (isFirstCall) {
        delay = 5000;
        isFirstCall = false;
    } else {
        delay = 30000 + Math.random() * 30000;
    }
    
    if (remainingDelay > 0) {
        delay = remainingDelay;
        remainingDelay = 0;
    }
    
    callStartTime = Date.now();
    currentDelay = delay;
    
    callTimer = setTimeout(() => {
        makeCall();
        currentCall++;
        updateProgress();
        executeCalls();
    }, delay);
}

async function makeCall() {
    const countryCode = document.getElementById('countryCode').value;
    const phoneNumber = document.getElementById('targetNumber').value;
    const toNumber = countryCode + phoneNumber;
    
    try {
        const response = await makeTwilioCall(toNumber, TWILIO_CONFIG.fromNumber);
        
        if (response.success) {
            callStats.success++;
            callStats.callsToday++;
            
            localStorage.setItem('callsToday', callStats.callsToday.toString());
        } else {
            callStats.failed++;
        }
    } catch (error) {
        callStats.failed++;
    }
    
    updateStats();
}

async function makeTwilioCall(toNumber, fromNumber) {
    try {
        const formData = new URLSearchParams();
        formData.append('To', toNumber);
        formData.append('From', fromNumber);
        formData.append('Url', 'https://handler.twilio.com/twiml/EH3cc6fe5e47bd99f2f4b62cee9f2ac85c');
        
        const response = await fetch(https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Calls.json, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(TWILIO_CONFIG.accountSid + ':' + TWILIO_CONFIG.authToken),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return {
                success: true,
                callSid: data.sid
            };
        } else {
            return {
                success: false,
                error: data.message || 'Call failed'
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

function stopCalls() {
    callActive = false;
    callPaused = false;
    remainingDelay = 0;
    if (callTimer) {
        clearTimeout(callTimer);
        callTimer = null;
    }
    
    document.getElementById('startBtn').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
}

function validateCallConfig() {
    const phoneNumber = document.getElementById('targetNumber').value;
    const callCount = parseInt(document.getElementById('callCount').value);
    
    if (!phoneNumber || phoneNumber.length < 7) {
        alert('Please enter a valid phone number (at least 7 digits)');
        return false;
    }
    
    if (!/^\d+$/.test(phoneNumber)) {
        alert('Phone number must contain only digits');
        return false;
    }
    
    if (!callCount || callCount < 1 || callCount > 10) {
        alert('Call count must be between 1 and 10');
        return false;
    }
    
    return true;
}

function updateProgress() {
    const progress = (currentCall / callStats.total) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').textContent = Math.round(progress) + '%';
}

function updateStats() {
    document.getElementById('successCount').textContent = callStats.success;
    document.getElementById('failedCount').textContent = callStats.failed;
    
    const totalCalls = callStats.success + callStats.failed;
    const successRate = totalCalls > 0 ? 
        ((callStats.success / totalCalls) * 100).toFixed(1) : 0;
    
    document.getElementById('currentRate').textContent = successRate + '%';
}

function resetAll() {
    if (callActive) {
        if (!confirm('Sending is in progress. Are you sure you want to reset?')) {
            return;
        }
        stopCalls();
    }
    
    callStats.success = 0;
    callStats.failed = 0;
    callStats.total = 0;
    currentCall = 0;
    remainingDelay = 0;
    
    document.getElementById('targetNumber').value = '';
    document.getElementById('callCount').value = '3';
    document.getElementById('countryCode').value = '20';
    
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    document.getElementById('successCount').textContent = '0';
    document.getElementById('failedCount').textContent = '0';
    document.getElementById('currentRate').textContent = '0%';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('startBtn').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
    
    updateStats();
}

function showCallComplete() {
    const remaining = MAX_DAILY_CALLS - callStats.callsToday;
    alert(Process complete!\nRemaining calls for today: ${remaining});
}

document.getElementById('accessCode').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        verifyAccess();
    }
});

function setupLogoInteractions() {
    const accessDashContainer = document.getElementById('accessDashContainer');
    const accessDash = document.getElementById('accessDash');
    const accessPhoneCircle = document.getElementById('accessPhoneCircle');
    
    accessDash.addEventListener('click', function() {
        accessDashContainer.classList.toggle('active');
        accessDash.classList.toggle('active');
        setTimeout(() => {
            accessDashContainer.classList.remove('active');
            accessDash.classList.remove('active');
        }, 2000);
    });
    
    accessPhoneCircle.addEventListener('click', function() {
        this.classList.add('active');
        setTimeout(() => {
            this.classList.remove('active');
        }, 1000);
    });
    
    const headerDashContainer = document.getElementById('headerDashContainer');
    const headerDash = document.getElementById('headerDash');
    const headerPhoneCircle = document.getElementById('headerPhoneCircle');
    
    headerDash.addEventListener('click', function() {
        headerDashContainer.classList.toggle('active');
        headerDash.classList.toggle('active');
        setTimeout(() => {
            headerDashContainer.classList.remove('active');
            headerDash.classList.remove('active');
        }, 2000);
    });
    
    headerPhoneCircle.addEventListener('click', function() {
        this.classList.add('active');
        setTimeout(() => {
            this.classList.remove('active');
        }, 1000);
    });
}
