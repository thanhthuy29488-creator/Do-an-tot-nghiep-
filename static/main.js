// =====================================================
// AI EMOTION RECOGNITION SYSTEM
// MAIN JAVASCRIPT
// CAMERA + AI ANALYSIS
// =====================================================


console.log("MAIN.JS DA CHAY");


// ===============================
// LẤY PHẦN TỬ HTML
// ===============================


const video = document.getElementById("video");

const canvas = document.getElementById("canvas");


const startBtn = document.getElementById("startBtn");

const stopBtn = document.getElementById("stopBtn");


const cameraStatus =
    document.getElementById("camera-status");


const aiStatus =
    document.getElementById("ai-status");



const emotionResult =
    document.getElementById("emotion-result");


const concentrationResult =
    document.getElementById("concentration-result");


const attentionResult =
    document.getElementById("attention-result");


const progressBar =
    document.getElementById("progress-bar");


const progressText =
    document.getElementById("progress-text");



let stream = null;

let cameraRunning = false;

// ===============================
// THỐNG KÊ CẢM XÚC
// ===============================

let emotionCount = {

    Happy:0,

    Neutral:0,

    Sad:0,

    Angry:0,

    Fear:0,

    Surprise:0,

    Disgust:0

};


// ===============================
// KIỂM TRA ELEMENT
// ===============================


console.log({

    video,
    startBtn,
    stopBtn

});




// ===============================
// BẬT CAMERA
// ===============================


startBtn.addEventListener(
    "click",
    async function(){


        try{


            stream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    width:640,

                    height:480

                },

                audio:false

            });



            video.srcObject = stream;


            await video.play();



            cameraRunning = true;



            cameraStatus.innerHTML =
            "🟢 Camera đang hoạt động";

document.getElementById(
    "camera-connect-status"
).innerHTML =
"Đã kết nối";

            aiStatus.innerHTML =
            "🤖 AI đang chờ phân tích";



            analyzeCamera();



        }


        catch(error){


            console.error(
                "Camera Error:",
                error
            );


            cameraStatus.innerHTML =
            "❌ Không mở được camera";


        }


    }

);




// ===============================
// TẮT CAMERA
// ===============================


stopBtn.addEventListener(
    "click",
    function(){


        cameraRunning=false;



        if(stream){


            stream
            .getTracks()
            .forEach(
                track=>track.stop()
            );


        }



        video.srcObject=null;



        cameraStatus.innerHTML =
        "⚪ Camera đã tắt";

document.getElementById(
    "camera-connect-status"
).innerHTML =
"Chưa kết nối";
        aiStatus.innerHTML =
        "AI đã dừng";


    }

);




// ===============================
// GỬI ẢNH SANG FLASK
// ===============================


async function analyzeCamera(){


    if(!cameraRunning)
        return;



    if(video.videoWidth===0){


        setTimeout(
            analyzeCamera,
            1000
        );


        return;

    }




    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;



    const ctx =
        canvas.getContext("2d");



    ctx.drawImage(

        video,

        0,

        0,

        canvas.width,

        canvas.height

    );



    let image =
        canvas.toDataURL(
            "image/jpeg"
        );



    try{


        let response =
        await fetch(
            "/analyze",
            {

                method:"POST",


                headers:{


                    "Content-Type":
                    "application/json"


                },


                body:JSON.stringify({

                    image:image

                })


            }

        );



        let data =
        await response.json();



        console.log(
            data
        );


if(data.status==="success"){


    // =========================
    // HIỂN THỊ KẾT QUẢ AI
    // =========================

    emotionResult.innerHTML =
        data.emotion;


    concentrationResult.innerHTML =
        data.focus + "%";


    progressBar.style.width =
        data.focus + "%";


    progressText.innerHTML =
        data.focus + "%";


    attentionResult.innerHTML =
        "Đang tập trung";


    aiStatus.innerHTML =
        "🤖 AI đang phân tích";



    // =========================
    // CẬP NHẬT THỐNG KÊ CẢM XÚC
    // =========================

    let emotion = data.emotion;


    if(emotionCount[emotion] !== undefined){


        emotionCount[emotion]++;


        updateEmotionStatistics();


    }


}



    }


    catch(error){


        console.error(

            "AI ERROR:",

            error

        );


    }



    setTimeout(

        analyzeCamera,

        1500

    );


}
function updateEmotionStatistics(){

    let total = 0;


    for(let key in emotionCount){

        total += emotionCount[key];

    }


    if(total === 0)
        return;



    document.getElementById("happy-percent").innerHTML =
        Math.round(emotionCount.Happy / total * 100) + "%";


    document.getElementById("neutral-percent").innerHTML =
        Math.round(emotionCount.Neutral / total * 100) + "%";


    document.getElementById("sad-percent").innerHTML =
        Math.round(emotionCount.Sad / total * 100) + "%";


    document.getElementById("angry-percent").innerHTML =
        Math.round(emotionCount.Angry / total * 100) + "%";


    document.getElementById("fear-percent").innerHTML =
        Math.round(emotionCount.Fear / total * 100) + "%";


    document.getElementById("surprise-percent").innerHTML =
        Math.round(emotionCount.Surprise / total * 100) + "%";


    document.getElementById("disgust-percent").innerHTML =
Math.round(emotionCount.Disgust / total * 100) + "%";


// cập nhật biểu đồ
updateEmotionChart();


}
// =====================================
// ĐỒNG HỒ THỜI GIAN THỰC
// =====================================


function updateClock(){


    let now = new Date();



    let time =
        now.toLocaleTimeString(
            "vi-VN"
        );



    let date =
        now.toLocaleDateString(
            "vi-VN"
        );



    document.getElementById("clock")
        .innerHTML =
        "🕒 " + time;



    document.getElementById("date")
        .innerHTML =
        "📅 " + date;


}



setInterval(

    updateClock,

    1000

);



updateClock();
// =====================================
// BIỂU ĐỒ CẢM XÚC REALTIME
// =====================================


let emotionChart;



function createEmotionChart(){


    const ctx =
    document.getElementById(
        "emotionChart"
    );


    emotionChart =
    new Chart(ctx, {


        type:"bar",


        data:{


            labels:[

                "Happy",

                "Neutral",

                "Sad",

                "Angry",

                "Fear",

                "Surprise",

                "Disgust"

            ],



            datasets:[{

                label:
                "Tỷ lệ cảm xúc (%)",


                data:[

                    0,0,0,0,0,0,0

                ]


            }]


        },


        options:{


            responsive:true,


            scales:{


                y:{


                    beginAtZero:true,


                    max:100


                }


            }


        }


    });


}



createEmotionChart();

// ===============================
// TABS LOGIC
// ===============================

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        // Add active class to clicked button
        btn.classList.add('active');

        // Show corresponding pane
        const targetId = btn.getAttribute('data-target');
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
            targetPane.classList.add('active');
        }
    });
});
