from passlib.context import CryptContext

pwd_cxt = CryptContext(schemes=["argon2"], deprecated="auto")

class Hash:
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_cxt.hash(password)

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        return pwd_cxt.verify(plain_password, hashed_password)
