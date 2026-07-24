// =====================================================
// AI EMOTION RECOGNITION SYSTEM
// MAIN JAVASCRIPT - DARK THEME DASHBOARD
// =====================================================

console.log("MAIN.JS DA CHAY");

// ===============================
// LẤY PHẦN TỬ HTML
// ===============================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const cameraStatus = document.getElementById("camera-status");
const aiStatus = document.getElementById("ai-status");

const emotionResult = document.getElementById("emotion-result");
const concentrationResult = document.getElementById("concentration-result");
const attentionResult = document.getElementById("attention-result");

let stream = null;
let cameraRunning = false;

// ===============================
// THỐNG KÊ CẢM XÚC
// ===============================
let emotionCount = {
    Happy: 0,
    Neutral: 0,
    Sad: 0,
    Angry: 0,
    Fear: 0,
    Surprise: 0,
    Disgust: 0
};

// ===============================
// BẬT CAMERA
// ===============================
startBtn.addEventListener("click", async function() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
        });
        video.srcObject = stream;
        await video.play();
        cameraRunning = true;
        
        cameraStatus.innerHTML = '<i class="fa-solid fa-video"></i> Camera đang hoạt động';
        cameraStatus.style.color = "var(--success)";
        aiStatus.innerHTML = '<i class="fa-solid fa-robot"></i> AI đang chờ phân tích';
        aiStatus.style.color = "var(--warning)";
        
        let connectStatus = document.getElementById("camera-connect-status");
        if(connectStatus) {
            connectStatus.innerHTML = "Online";
            connectStatus.style.color = "var(--success)";
        }
        
        document.getElementById("live-badge").style.display = "block";
        
        analyzeCamera();
    } catch(error) {
        console.error("Camera Error:", error);
        cameraStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Không mở được camera';
        cameraStatus.style.color = "var(--error)";
    }
});

// ===============================
// TẮT CAMERA
// ===============================
stopBtn.addEventListener("click", function() {
    cameraRunning = false;
    if(stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    
    cameraStatus.innerHTML = '<i class="fa-solid fa-video-slash"></i> Camera đã tắt';
    cameraStatus.style.color = "var(--text-muted)";
    aiStatus.innerHTML = '<i class="fa-solid fa-robot"></i> AI đã dừng';
    aiStatus.style.color = "var(--text-muted)";
    
    let connectStatus = document.getElementById("camera-connect-status");
    if(connectStatus) {
        connectStatus.innerHTML = "Chưa kết nối";
        connectStatus.style.color = "var(--text-muted)";
    }
    
    document.getElementById("live-badge").style.display = "none";
});

// ===============================
// GỬI ẢNH SANG FLASK
// ===============================
async function analyzeCamera() {
    if(!cameraRunning) return;
    if(video.videoWidth === 0) {
        setTimeout(analyzeCamera, 1000);
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    let image = canvas.toDataURL("image/jpeg");

    try {
        let response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: image })
        });
        
        let data = await response.json();
        
        if(data.status === "success") {
            // =========================
            // HIỂN THỊ CẢM XÚC
            // =========================
            emotionResult.innerHTML = data.emotion;
            let iconEl = document.getElementById("emotion-icon");
            
            // Đổi icon và màu theo cảm xúc
            let color = "var(--success)";
            if(data.emotion === "Happy") { iconEl.className = "fa-regular fa-face-smile"; color = "#10B981"; }
            else if(data.emotion === "Neutral") { iconEl.className = "fa-regular fa-face-meh"; color = "#3B82F6"; }
            else if(data.emotion === "Sad") { iconEl.className = "fa-regular fa-face-frown"; color = "#8B5CF6"; }
            else if(data.emotion === "Angry") { iconEl.className = "fa-regular fa-face-angry"; color = "#EF4444"; }
            else if(data.emotion === "Surprise") { iconEl.className = "fa-regular fa-face-surprise"; color = "#F59E0B"; }
            else if(data.emotion === "Fear") { iconEl.className = "fa-regular fa-face-flushed"; color = "#06B6D4"; }
            else { iconEl.className = "fa-regular fa-face-grimace"; color = "#6B7280"; }
            
            emotionResult.style.color = color;
            iconEl.style.color = color;

            // =========================
            // HIỂN THỊ TẬP TRUNG & ĐÁNH GIÁ
            // =========================
            concentrationResult.innerHTML = data.focus + "%";
            document.getElementById("progress-text").innerHTML = "Đang phân tích";
            
            let focusColor = "var(--success)";
            let evalText = "Xuất sắc";
            let evalSub = "Học sinh đang duy trì<br>sự tập trung rất tốt!";
            
            if(data.focus >= 80) {
                focusColor = "var(--success)";
                evalText = "Xuất sắc";
                evalSub = "Tập trung rất tốt!";
            } else if(data.focus >= 50) {
                focusColor = "var(--warning)";
                evalText = "Trung bình";
                evalSub = "Cần chú ý hơn một chút.";
            } else {
                focusColor = "var(--error)";
                evalText = "Kém";
                evalSub = "Có dấu hiệu mất tập trung.";
            }
            
            concentrationResult.parentElement.style.borderColor = focusColor;
            concentrationResult.style.color = focusColor;
            attentionResult.innerHTML = evalText;
            attentionResult.style.color = focusColor;
            attentionResult.nextElementSibling.innerHTML = evalSub;
            
            aiStatus.innerHTML = '<i class="fa-solid fa-robot"></i> AI đang phân tích';
            aiStatus.style.color = "var(--success)";

            // Cập nhật thống kê
            let emotion = data.emotion;
            if(emotionCount[emotion] !== undefined) {
                emotionCount[emotion]++;
                updateEmotionStatistics();
            }
        } else if(data.status === "no_face") {
            aiStatus.innerHTML = '<i class="fa-solid fa-user-slash"></i> Không thấy khuôn mặt';
            aiStatus.style.color = "var(--warning)";
        }
    } catch(error) {
        console.error("AI ERROR:", error);
    }

    setTimeout(analyzeCamera, 1500);
}

function updateEmotionStatistics() {
    let total = Object.values(emotionCount).reduce((a, b) => a + b, 0);
    if(total === 0) return;

    let happy = Math.round(emotionCount.Happy / total * 100);
    let neutral = Math.round(emotionCount.Neutral / total * 100);
    let sad = Math.round(emotionCount.Sad / total * 100);
    let angry = Math.round(emotionCount.Angry / total * 100);
    let fear = Math.round(emotionCount.Fear / total * 100);
    let surprise = Math.round(emotionCount.Surprise / total * 100);
    let disgust = Math.round(emotionCount.Disgust / total * 100);

    document.getElementById("happy-percent").innerHTML = happy + "%";
    document.getElementById("neutral-percent").innerHTML = neutral + "%";
    document.getElementById("sad-percent").innerHTML = sad + "%";
    document.getElementById("angry-percent").innerHTML = angry + "%";
    document.getElementById("fear-percent").innerHTML = fear + "%";
    document.getElementById("surprise-percent").innerHTML = surprise + "%";
    document.getElementById("disgust-percent").innerHTML = disgust + "%";
    
    document.getElementById("donut-total").innerHTML = total;

    // Cập nhật biểu đồ Donut
    if(donutChart) {
        donutChart.data.datasets[0].data = [happy, neutral, sad, surprise, angry, fear, disgust];
        donutChart.update();
    }
}

// =====================================
// ĐỒNG HỒ THỜI GIAN THỰC & ĐẾM GIỜ PHIÊN HỌC
// =====================================
let sessionSeconds = 0;
let sessionTimer = null;

function updateClock() {
    let now = new Date();
    let time = now.toLocaleTimeString("vi-VN");
    let date = now.toLocaleDateString("vi-VN");

    let topTime = document.getElementById("top-time");
    let topDate = document.getElementById("top-date");
    
    if(topTime) topTime.innerHTML = time;
    if(topDate) topDate.innerHTML = date;
}
setInterval(updateClock, 1000);
updateClock();

function updateSessionTimer() {
    sessionSeconds++;
    let h = Math.floor(sessionSeconds / 3600);
    let m = Math.floor((sessionSeconds % 3600) / 60);
    let s = sessionSeconds % 60;
    
    let formattedTime = 
        String(h).padStart(2, '0') + ":" + 
        String(m).padStart(2, '0') + ":" + 
        String(s).padStart(2, '0');
        
    let sessionTimeEl = document.getElementById("session-time");
    if(sessionTimeEl) sessionTimeEl.innerHTML = formattedTime;
}
// Bắt đầu đếm thời gian khi mở trang
sessionTimer = setInterval(updateSessionTimer, 1000);

// =====================================
// CHART.JS CẤU HÌNH DARK THEME
// =====================================
Chart.defaults.color = '#9CA3AF';
Chart.defaults.font.family = 'Inter';

let emotionChart; // Line chart
let donutChart; // Donut chart

function initCharts() {
    // 1. Biểu đồ đường (Tập trung tổng thể)
    const lineCtx = document.getElementById("emotionChart");
    if(lineCtx) {
        emotionChart = new Chart(lineCtx, {
            type: "line",
            data: {
                labels: ["21:18", "21:20", "21:22", "21:24", "21:26", "21:28", "21:30"],
                datasets: [{
                    label: "Mức độ tập trung (%)",
                    data: [80, 85, 90, 75, 88, 92, 89],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#1F2937' }
                    },
                    x: {
                        grid: { color: '#1F2937' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // 2. Biểu đồ tròn (Phân bố cảm xúc)
    const donutCtx = document.getElementById("donutChart");
    if(donutCtx) {
        donutChart = new Chart(donutCtx, {
            type: "doughnut",
            data: {
                labels: ["Happy", "Neutral", "Sad", "Surprise", "Angry", "Fear", "Disgust"],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#10B981', // Happy (Green)
                        '#3B82F6', // Neutral (Blue)
                        '#8B5CF6', // Sad (Purple)
                        '#F59E0B', // Surprise (Yellow)
                        '#EF4444', // Angry (Red)
                        '#06B6D4', // Fear (Cyan)
                        '#6B7280'  // Disgust (Gray)
                    ],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false } // Đã có bảng thay thế
                }
            }
        });
    }
}

// Khởi tạo biểu đồ khi trang load
document.addEventListener('DOMContentLoaded', function() {
    initCharts();

    // ===============================
    // TABS LOGIC
    // ===============================
    const menuItems = document.querySelectorAll('.menu-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Bỏ active tất cả menu
            menuItems.forEach(btn => btn.classList.remove('active'));
            // Thêm active cho menu hiện tại
            this.classList.add('active');

            // Ẩn tất cả tab
            tabPanes.forEach(pane => {
                pane.style.display = 'none';
                pane.classList.remove('active');
            });

            // Hiện tab mục tiêu
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    if (targetId === 'tab-dashboard') {
                        targetPane.style.display = 'flex'; // Grid layout đặc biệt cho dashboard
                    } else {
                        targetPane.style.display = 'block';
                    }
                    targetPane.classList.add('active');
                }
            }
        });
    });

    // ===============================
    // UPLOAD VIDEO OFFLINE
    // ===============================
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async function() {
            const fileInput = document.getElementById('video-upload');
            const subjectInput = document.getElementById('video-subject');
            const statusDiv = document.getElementById('upload-status');
            const totalDetect = document.getElementById('total-detect');

            if (!fileInput.files || fileInput.files.length === 0) {
                statusDiv.innerHTML = '<span style="color: var(--error);">Vui lòng chọn file video.</span>';
                return;
            }

            const formData = new FormData();
            formData.append('video', fileInput.files[0]);
            
            let subject = "Khác";
            if (subjectInput && subjectInput.value.trim() !== "") {
                subject = subjectInput.value.trim();
            }
            formData.append('subject', subject);

            statusDiv.innerHTML = '<span style="color: var(--warning);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải lên và phân tích...</span>';
            uploadBtn.disabled = true;

            try {
                const response = await fetch('/upload_video', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    statusDiv.innerHTML = `<span style="color: var(--success);"><i class="fa-solid fa-check"></i> Phân tích xong video ${data.filename}!</span>`;
                    
                    if (totalDetect) {
                        let current = parseInt(totalDetect.innerText) || 0;
                        totalDetect.innerText = current + data.report.total_faces;
                    }
                    
                    // Hiện alert nhỏ thông báo kết quả
                    alert(`Phân tích thành công!\nMôn học: ${subject}\nTổng số khung hình: ${data.report.total_frames}\nĐiểm tập trung trung bình: ${data.report.focus_score}%`);
                } else {
                    statusDiv.innerHTML = `<span style="color: var(--error);"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi: ${data.message}</span>`;
                }
            } catch (error) {
                statusDiv.innerHTML = `<span style="color: var(--error);"><i class="fa-solid fa-triangle-exclamation"></i> Đã xảy ra lỗi khi phân tích.</span>`;
            }
            
            uploadBtn.disabled = false;
        });
    }

    // ===============================
    // XEM BÁO CÁO THÁNG
    // ===============================
    const btnLoadReport = document.getElementById('btn-load-report');
    if (btnLoadReport) {
        btnLoadReport.addEventListener('click', async function() {
            const monthInput = document.getElementById('report-month');
            const tbody = document.getElementById('report-table-body');
            
            if (!monthInput.value) {
                alert("Vui lòng chọn tháng để xem báo cáo!");
                return;
            }
            
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';
            
            try {
                const response = await fetch(`/api/report/monthly?month=${monthInput.value}`);
                const data = await response.json();
                
                if (data.status === 'success') {
                    if (data.data.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">Không có dữ liệu trong tháng này.</td></tr>';
                        return;
                    }
                    
                    let html = '';
                    data.data.forEach(item => {
                        let focusColor = 'var(--success)';
                        if (item.avg_focus < 50) focusColor = 'var(--error)';
                        else if (item.avg_focus < 80) focusColor = 'var(--warning)';
                        
                        html += `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 12px; color: var(--text-light);"><strong>${item.subject}</strong></td>
                                <td style="padding: 12px; color: var(--text-light);">${item.session_count}</td>
                                <td style="padding: 12px; color: var(--text-light);">${item.total_faces}</td>
                                <td style="padding: 12px; color: ${focusColor}; font-weight: bold;">${item.avg_focus}%</td>
                                <td style="padding: 12px; color: var(--text-light);">${item.dominant_emotion}</td>
                            </tr>
                        `;
                    });
                    tbody.innerHTML = html;
                } else {
                    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--error);">Lỗi: ${data.message}</td></tr>`;
                }
            } catch (error) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--error);">Đã xảy ra lỗi khi kết nối với máy chủ.</td></tr>';
            }
        });
    }

});
