# Entry-point alias — you can run the server with either:
#   python main.py
# or:
#   python app.py

from app import app

if __name__ == "__main__":
    app.run(debug=True, port=8000)
