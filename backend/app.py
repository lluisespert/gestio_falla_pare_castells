# filepath: backend/app.py
from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Ya tengo el backend funcionando"

if __name__ == "__main__":
    app.run(debug=True)