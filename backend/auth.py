import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

# Fichiers de données
USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "users.json")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "users")

# Clé secrète pour JWT (à mettre dans .env)
SECRET_KEY = os.getenv("SECRET_KEY", "votre_cle_secrete_ici")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_users() -> Dict[str, Any]:
    """Charge la liste des utilisateurs depuis users.json"""
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump({"users": []}, f)
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users: Dict[str, Any]) -> None:
    """Sauvegarde la liste des utilisateurs dans users.json"""
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe contre un hash"""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Récupère l'utilisateur courant depuis le token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    users = get_users()
    user = next((u for u in users["users"] if u["username"] == username), None)
    if user is None:
        raise credentials_exception
    return user

async def get_user_data_dir(user_id: str) -> str:
    """Retourne le répertoire de données pour un utilisateur"""
    user_data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "users", user_id)
    os.makedirs(user_data_dir, exist_ok=True)
    return user_data_dir

async def get_user_data_file(user_id: str, filename: str) -> str:
    """Retourne le chemin vers un fichier de données utilisateur"""
    user_data_dir = await get_user_data_dir(user_id)
    return os.path.join(user_data_dir, filename)
