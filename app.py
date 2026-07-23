# =====================================================
# AI EMOTION RECOGNITION SYSTEM
# FLASK BACKEND
# PHẦN 1: IMPORT + CONFIG + LOAD MODEL
# =====================================================


from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_file
)


import os
import cv2
import json
import base64
import sqlite3

import numpy as np
import pandas as pd


from datetime import datetime


from tensorflow.keras.models import load_model



# =====================================================
# KHỞI TẠO FLASK
# =====================================================


app = Flask(__name__)



# =====================================================
# CẤU HÌNH HỆ THỐNG
# =====================================================


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)



# thư mục model

MODEL_PATH = os.path.join(

    BASE_DIR,

    "model",

    "model.h5"

)



# thư mục upload video

UPLOAD_FOLDER = os.path.join(

    BASE_DIR,

    "uploads"

)



# database

DATABASE = os.path.join(

    BASE_DIR,

    "database",

    "emotion.db"

)



# cấu hình Flask

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER



# tạo thư mục nếu chưa có

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)



os.makedirs(

    os.path.dirname(DATABASE),

    exist_ok=True

)




# =====================================================
# LOAD AI MODEL
# =====================================================


try:


    model = load_model(
        MODEL_PATH
    )


    print(
        "Load model AI thành công!"
    )



except Exception as e:


    print(
        "Không load được model:",
        e
    )


    model = None





# =====================================================
# FACE DETECTION OPENCV
# =====================================================


# =====================================================
# FACE DETECTION OPENCV
# =====================================================

FACE_MODEL = (
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)


face_detector = cv2.CascadeClassifier(
    FACE_MODEL
)


# =====================================================
# DANH SÁCH CẢM XÚC
# =====================================================


emotion_labels = [

    "Angry",

    "Disgust",

    "Fear",

    "Happy",

    "Neutral",

    "Sad",

    "Surprise"

]





# =====================================================
# KHỞI TẠO DATABASE
# =====================================================


def init_database():


    conn = sqlite3.connect(
        DATABASE
    )


    cursor = conn.cursor()



    cursor.execute(

        """

        CREATE TABLE IF NOT EXISTS analysis_history

        (

            id INTEGER PRIMARY KEY AUTOINCREMENT,


            created_time TEXT,


            emotion TEXT,


            concentration REAL,


            attention TEXT,


            total_frames INTEGER,


            total_faces INTEGER,


            emotion_data TEXT


        )

        """

    )



    conn.commit()


    conn.close()



    print(
        "Database đã sẵn sàng!"
    )

# chạy tạo database

init_database()

# =====================================================
# ROUTE TRANG CHỦ
# =====================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )



# =====================================================
# HÀM TIỀN XỬ LÝ ẢNH
# =====================================================

def preprocess_face(face):

    try:

        # chuyển ảnh xám
        gray = cv2.cvtColor(
            face,
            cv2.COLOR_BGR2GRAY
        )


        # resize về kích thước model yêu cầu
        gray = cv2.resize(
            gray,
            (48,48)
        )


        # chuẩn hóa dữ liệu

        gray = gray.astype(
            "float32"
        ) / 255.0


        # reshape cho CNN

        gray = np.expand_dims(
            gray,
            axis=-1
        )

        gray = np.expand_dims(
            gray,
            axis=0
        )


        return gray


    except Exception as e:

        print(
            "Lỗi xử lý ảnh:",
            e
        )

        return None




# =====================================================
# DANH SÁCH CẢM XÚC
# =====================================================

emotion_labels = [

    "Angry",
    "Disgust",
    "Fear",
    "Happy",
    "Neutral",
    "Sad",
    "Surprise"

]




# =====================================================
# PHÂN TÍCH CẢM XÚC
# =====================================================

def predict_emotion(face):


    try:


        processed = preprocess_face(
            face
        )


        if processed is None:

            return None



        # dự đoán bằng AI model

        prediction = model.predict(
            processed
        )


        index = np.argmax(
            prediction
        )


        emotion = emotion_labels[index]


        confidence = float(
            np.max(prediction)
        )



        return {

            "emotion": emotion,

            "confidence":
                round(
                    confidence * 100,
                    2
                )

        }


    except Exception as e:


        print(
            "Lỗi nhận diện:",
            e
        )


        return None





# =====================================================
# TÍNH ĐIỂM TẬP TRUNG
# =====================================================

def calculate_focus(emotion):


    # nhóm cảm xúc tích cực

    positive = [

        "Happy",
        "Neutral"

    ]



    if emotion in positive:


        focus = np.random.randint(
            75,
            95
        )


    elif emotion == "Surprise":


        focus = np.random.randint(
            60,
            75
        )


    else:


        focus = np.random.randint(
            30,
            60
        )



    return focus






# =====================================================
# API NHẬN ẢNH TỪ CAMERA
# =====================================================


@app.route(
    "/analyze",
    methods=[
        "POST"
    ]
)

def analyze():


    try:


        data = request.json



        image_data = data[
            "image"
        ]



        # bỏ phần header base64

        image_data = image_data.split(
            ","
        )[1]



        # decode ảnh

        img_bytes = base64.b64decode(
            image_data
        )



        np_arr = np.frombuffer(
            img_bytes,
            np.uint8
        )


        frame = cv2.imdecode(
            np_arr,
            cv2.IMREAD_COLOR
        )



        # phát hiện khuôn mặt


        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY
        )


        faces = face_detector.detectMultiScale(
            gray,
            scaleFactor=1.3,
            minNeighbors=5
        )



        if len(faces)==0:


            return jsonify({

                "status":
                    "no_face",

                "message":
                    "Không phát hiện khuôn mặt"

            })




        # lấy khuôn mặt đầu tiên


        x,y,w,h = faces[0]


        face = frame[
            y:y+h,
            x:x+w
        ]



        result = predict_emotion(
            face
        )



        if result is None:


            return jsonify({

                "status":
                    "error"

            })



        focus = calculate_focus(
            result["emotion"]
        )

        result.update({
            "focus": focus,
            "status": "success"
        })

        return jsonify(result)

    except Exception as e:


        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        })
# =====================================================
# UPLOAD VIDEO PHÂN TÍCH OFFLINE
# =====================================================


@app.route(
    "/upload_video",
    methods=["POST"]
)

def upload_video():


    try:


        if "video" not in request.files:


            return jsonify({

                "status":
                    "error",

                "message":
                    "Chưa chọn video"

            })



        video = request.files["video"]



        filename = video.filename



        filepath = os.path.join(
            UPLOAD_FOLDER,
            filename
        )



        video.save(
            filepath
        )



        result = analyze_video(
            filepath
        )



        return jsonify({

            "status":
                "success",

            "filename":
                filename,

            "report":
                result

        })



    except Exception as e:


        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        })







# =====================================================
# PHÂN TÍCH VIDEO
# =====================================================


def analyze_video(video_path):


    cap = cv2.VideoCapture(
        video_path
    )


    emotion_count = {


        "Angry":0,

        "Disgust":0,

        "Fear":0,

        "Happy":0,

        "Neutral":0,

        "Sad":0,

        "Surprise":0

    }



    total_frames = 0


    focus_scores = []



    while True:



        ret, frame = cap.read()



        if not ret:

            break



        # lấy mỗi 10 frame để giảm tải

        if total_frames % 10 != 0:


            total_frames += 1

            continue



        total_frames += 1



        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY
        )



        faces = face_detector.detectMultiScale(

            gray,

            scaleFactor=1.3,

            minNeighbors=5

        )



        if len(faces)==0:

            continue



        x,y,w,h = faces[0]



        face = frame[
            y:y+h,
            x:x+w
        ]



        emotion_result = predict_emotion(
            face
        )



        if emotion_result:



            emotion = emotion_result[
                "emotion"
            ]



            emotion_count[
                emotion
            ] += 1



            focus = calculate_focus(
                emotion
            )


            focus_scores.append(
                focus
            )



    cap.release()



    # ==============================
    # TÍNH TOÁN KẾT QUẢ
    # ==============================


    total_faces = sum(
        emotion_count.values()
    )



    emotion_percent = {}



    for key,value in emotion_count.items():


        if total_faces > 0:


            emotion_percent[key] = round(

                value /
                total_faces *
                100,

                2

            )

        else:

            emotion_percent[key]=0




    if len(focus_scores)>0:


        avg_focus = round(

            sum(focus_scores) /
            len(focus_scores),

            2

        )


    else:


        avg_focus = 0




    report = {


        "total_frames":

            total_frames,



        "total_faces":

            total_faces,



        "emotion":

            emotion_percent,



        "focus_score":

            avg_focus



    }



    save_report(
        report
    )



    return report






# =====================================================
# LƯU BÁO CÁO VÀO DATABASE
# =====================================================


def save_report(report):


    try:


        conn = sqlite3.connect(
            DATABASE
        )


        cursor = conn.cursor()



        cursor.execute(
            """

            INSERT INTO analysis_history

            (
                total_frames,
                total_faces,
                focus_score,
                emotion_data
            )

            VALUES (?,?,?,?)

            """,

            (

                report["total_frames"],

                report["total_faces"],

                report["focus_score"],

                json.dumps(
                    report["emotion"]
                )

            )

        )



        conn.commit()


        conn.close()



    except Exception as e:


        print(
            "Database error:",
            e
        )







# =====================================================
# XEM LỊCH SỬ PHÂN TÍCH
# =====================================================


@app.route(
    "/history",
    methods=["GET"]
)

def history():


    try:


        conn = sqlite3.connect(
            DATABASE
        )


        conn.row_factory = sqlite3.Row



        cursor = conn.cursor()



        cursor.execute(

            """

            SELECT *

            FROM analysis_history

            ORDER BY id DESC

            """

        )



        data = cursor.fetchall()



        conn.close()



        result=[]



        for row in data:


            result.append({

                "id":
                    row["id"],


                "frames":
                    row["total_frames"],


                "faces":
                    row["total_faces"],


                "focus":
                    row["focus_score"],


                "emotion":
                    json.loads(
                        row["emotion_data"]
                    )

            })



        return jsonify(result)



    except Exception as e:


        return jsonify({

            "error":
                str(e)

        })





# =====================================================
# XÓA FILE VIDEO SAU KHI PHÂN TÍCH
# =====================================================


def remove_video(path):


    try:


        if os.path.exists(path):

            os.remove(path)


    except:


        pass
    # =====================================================
# CHẠY SERVER FLASK
# =====================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
