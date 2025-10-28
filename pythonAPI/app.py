from flask import Flask,request,jsonify
import base64
import chromadb
import os
from dotenv import load_dotenv
import google.generativeai as genai
import prompt
from pydantic import BaseModel
import json
import re

app = Flask(__name__)


class Response(BaseModel):
    summary: str
    tags: list[str]


def chat_with_gemini(user_question, temperature=0.7):
    model_name = "gemini-2.0-flash"
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(
        user_question, 
        generation_config={"temperature": temperature, "response_mime_type": "application/json",
        "response_schema": Response})
    
    return json.loads(response.text)


@app.route("/extract",methods = ['POST'])
def extract_text():
    data=request.json
    encoded_file = data['b64']
    decoded_file = base64.b64decode(encoded_file)
    text_content = decoded_file.decode('utf-8')
    cleaned_text_content =re.sub(r'[\r\n\t\v\f]+', ' ',re.sub(r'[\b\0]', '', text_content))
    responseData={"text":cleaned_text_content}
    return jsonify(responseData)


@app.route("/uploadToChromaDB",methods = ['POST'])
def upload_to_chromadb():
    data=request.json
    username=data['username']
    text_content=data['text_content']
    text_id=data['text_id']
    client = chromadb.PersistentClient(path="./data")
    collection = client.get_or_create_collection(name=username)
    collection.add(
    ids=[text_id],
    documents=[text_content])
    message={"message":"Success"}
    return jsonify(message)

@app.route("/deleteFromChromaDB",methods=['POST'])
def delete_from_chromadb():
    data=request.json
    username=data['username']
    text_id=data['text_id']
    client = chromadb.PersistentClient(path="./data")
    collection = client.get_collection(name=username)
    collection.delete(ids=[text_id])
    message={"message":"Success"}
    return jsonify(message)


@app.route("/getFromChromaDB",methods=['POST'])
def get_from_chromadb():
    data=request.json
    username=data['username']
    text_content=data['text_content']
    client = chromadb.PersistentClient(path="./data")
    collection = client.get_collection(name=username)
    result=collection.query(
    query_texts=[text_content],
    n_results=1)
    result_id_array=result['ids']
    result_id=result_id_array[0][0]
    finalResult={"id":result_id}
    return jsonify(finalResult)


@app.route("/summaryAndTags",methods=['POST'])
def get_summary_and_tags():
    data=request.json
    load_dotenv()
    text_content=data['text_content']
    api_key=os.environ['GEMINI_API_KEY']
    genai.configure(api_key=api_key)
    user_question =prompt.get_prompt(text_content)
    response = chat_with_gemini(user_question, temperature=0.7)
    return jsonify(response)
    
    
if __name__ == "__main__":
    app.run(port=8081)


