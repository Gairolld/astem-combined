from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import zipfile
import io
import json

app = FastAPI()

origins = [
    "http://localhost:80",  # Frontend
    "http://127.0.0.1:80",
    "http://localhost",  # Frontend dev
    "http://127.0.0.1",
]

# Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_or_create_glaze_type_id(cursor, glaze_type_name):
    """Get existing or create new glaze type and return its ID"""
    if not glaze_type_name:
        return None
    
    # Check if glaze type exists
    cursor.execute("SELECT ID FROM glazetype WHERE Name = %s", (glaze_type_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    
    # Create new glaze type
    cursor.execute("INSERT INTO glazetype (Name) VALUES (%s)", (glaze_type_name,))
    return cursor.lastrowid

def get_or_create_surface_condition_id(cursor, surface_condition_name):
    """Get existing or create new surface condition and return its ID"""
    if not surface_condition_name:
        return None
    
    # Check if surface condition exists
    cursor.execute("SELECT ID FROM surfacecondition WHERE Name = %s", (surface_condition_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    
    # Create new surface condition
    cursor.execute("INSERT INTO surfacecondition (Name) VALUES (%s)", (surface_condition_name,))
    return cursor.lastrowid

def insert_data(data, image_data_dict):
    conn = mysql.connector.connect(
        host="host.docker.internal",
        user="ceramadmin",
        password="J9J9NasakeMuyouAsuteroidoBerutoNo",
        database="tilearchive",
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    for item in data:
        ann = item.get('annotation', {})
        image_path = item.get('imageUrl', '')
        image_blob = image_data_dict.get(image_path)
        
        # Handle GlazeType - convert name to ID
        glaze_type_name = ann.get('GlazeType', '').strip()
        glaze_type_id = get_or_create_glaze_type_id(cursor, glaze_type_name) if glaze_type_name else None
        
        # Handle SurfaceCondition - convert name to ID  
        surface_condition_name = ann.get('SurfaceCondition', '').strip()
        surface_condition_id = get_or_create_surface_condition_id(cursor, surface_condition_name) if surface_condition_name else None
        
        # Get firing temperature, handle 0 as None
        firing_temp = ann.get('FiringTemperature')
        if firing_temp == 0:
            firing_temp = None
            
        cursor.execute("""
            INSERT INTO testpiece (BoardID, Image, Color_L, Color_A, Color_B, GlazeTypeID, FiringTemperature, ChemicalComposition, FiringType, SoilType, SurfaceConditionID)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            1,  # Default BoardID
            image_blob,
            ann.get('ColorL'),
            ann.get('ColorA'),
            ann.get('ColorB'),
            glaze_type_id,
            firing_temp,
            ann.get('ChemicalComposition'),
            ann.get('FiringType'),
            ann.get('SoilType'),
            surface_condition_id
        ))
        
    conn.commit()
    cursor.close()
    conn.close()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image_data_dict = {}
        with zipfile.ZipFile(io.BytesIO(contents)) as z:
            for name in z.namelist():
                if name.endswith('annotations.json'):
                    annotations_json = z.read(name)
                    annotations = json.loads(annotations_json)
                    folder = '/'.join(name.split('/')[:-1])
                    for item in annotations:
                        img_path = item.get('imageUrl')
                        if img_path:
                            full_img_path = f"{folder}/{img_path}" if folder else img_path
                            try:
                                image_data_dict[img_path] = z.read(full_img_path)
                            except KeyError:
                                print(f"Warning: Image file {full_img_path} not found in zip")
                                image_data_dict[img_path] = None
                    insert_data(annotations, image_data_dict)
        return {"status": "success", "message": "Data uploaded successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Upload failed: {str(e)}"}
