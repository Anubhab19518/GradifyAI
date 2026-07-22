import requests
import time

url = "http://127.0.0.1:8000/extract-text"
print(f"Testing {url} ...")

try:
    with open("test_image.png", "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0bIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\x00\x00\x00\x00IEND\xaeB`\x82")
    
    with open("test_image.png", "rb") as f:
        files = {"image": f}
        start = time.time()
        response = requests.post(url, files=files, data={"questions": "1: What is life?"})
        print(f"Response ({time.time() - start:.1f}s): {response.status_code}")
        print(response.json() if response.headers.get("content-type") == "application/json" else response.text)
except Exception as e:
    print("Error:", e)
