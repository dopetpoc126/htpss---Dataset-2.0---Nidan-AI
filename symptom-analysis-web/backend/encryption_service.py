"""
Encryption service for sensitive medical data using Fernet symmetric encryption.
"""
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

class EncryptionService:
    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise ValueError("ENCRYPTION_KEY not found in environment variables")
        self.fernet = Fernet(key.encode())
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string and return base64-encoded ciphertext."""
        if not plaintext:
            return ""
        encrypted = self.fernet.encrypt(plaintext.encode())
        return encrypted.decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64-encoded ciphertext and return plaintext."""
        if not ciphertext:
            return ""
        try:
            decrypted = self.fernet.decrypt(ciphertext.encode())
            return decrypted.decode()
        except Exception as e:
            print(f"Decryption error: {e}")
            return "[Decryption Failed]"

# Generate a new encryption key (run once to get your key)
def generate_key():
    """Generate a new Fernet encryption key."""
    return Fernet.generate_key().decode()

if __name__ == "__main__":
    # Run this script directly to generate a key
    print("New encryption key:", generate_key())
