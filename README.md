### **DictionBot - A Smart Dictionary Chatbot**  

#### **Overview**  
DictionBot is an AI-powered dictionary chatbot that helps users find word meanings, synonyms, examples, and parts of speech efficiently. Unlike traditional dictionary bots, DictionBot intelligently differentiates between **dictionary-related queries** and **general conversation**, responding accordingly.  

It integrates **Wordnik API** for fetching dictionary data and **Gemini AI API** for handling casual chats, follow-up queries, and deeper explanations.  

---

### **Key Features**  

✔ **Intelligent Query Recognition** – Understands whether a user is asking for a word’s meaning or engaging in general conversation.  
✔ **Comprehensive Word Lookup** – Provides **definitions, synonyms, examples, and parts of speech** for any word using the **Wordnik API**.  
✔ **Context-Aware Responses** – Recognizes follow-up questions like *“More synonyms?”* or *“Explain better”* and fetches additional information.  
✔ **Casual Chat Handling** – Engages in natural conversation when the query is not dictionary-related using the **Gemini AI API**.  
✔ **User Authentication (Optional)** – Supports **user registration and login** for a personalized experience.  
✔ **Efficient Backend System** – Designed with a modular architecture for fast and reliable responses.  

---

### **System Architecture**  
DictionBot consists of the following modules:  

1️⃣ **User Interaction Module** – Handles user input, detects intent (dictionary vs. general conversation), and forwards the query.  
2️⃣ **Natural Language Processing (NLP) Module** – Processes user input, extracts key words, and determines the required response.  
3️⃣ **Dictionary API Integration** – Fetches definitions, synonyms, examples, and parts of speech from the **Wordnik API**.  
4️⃣ **AI Chat Module** – Uses **Gemini AI API** to handle casual conversations and detailed explanations.  
5️⃣ **Response Generation Module** – Formats responses and ensures they are clear and easy to understand.  
6️⃣ **User Authentication & Data Storage (Optional)** – Allows users to **sign up, log in, and save preferences** for a better experience.  

---

### **How It Works**  
1️⃣ User sends a message (*e.g., "What does 'serendipity' mean?"*).  
2️⃣ The chatbot **analyzes the input** to determine if it’s a dictionary query or a casual conversation.  
3️⃣ If it’s a **dictionary query**, the **Wordnik API** is called to fetch the word details.  
4️⃣ If it’s a **general chat**, the **Gemini AI API** generates a natural response.  
5️⃣ The chatbot **displays the response** in a user-friendly format.  
6️⃣ If the user asks for more details (e.g., *“More examples?”*), the system fetches additional data dynamically.  

---

### **Technologies Used**  
🛠 **Programming Language** – Python  
🛠 **APIs Used** – Wordnik API, Gemini AI API  
🛠 **Frameworks** – Flask / FastAPI (for backend), React (optional for UI)  
🛠 **Database** – SQLite / Firebase (if storing user data)  
🛠 **NLP** – SpaCy / NLTK for text processing  

---

### **Installation & Setup**  
#### **1. Clone the Repository**  
```sh
git clone https://github.com/yourusername/dictionbot.git
cd dictionbot
```
#### **2. Install Dependencies**  
```sh
npm install
node app.js
```
#### **3. Set Up API Keys**  
- Sign up for **Wordnik API** and **Gemini AI API**  
- Add API keys to a `.env` file  
```sh
WORDNIK_API_KEY=your_wordnik_api_key
GEMINI_API_KEY=your_gemini_api_key
```
---

### **Future Improvements**  
🔹 Add voice-based word lookup  
🔹 Support for multiple languages  
🔹 Improve UI/UX with a web-based interface  

### **Sample Output**
![image](https://github.com/user-attachments/assets/04b599fb-0aba-418d-aff5-e4af7c36a1c6)
![image](https://github.com/user-attachments/assets/83b370d0-a784-4f8f-b2e5-4108c7d1a0c9)
![image](https://github.com/user-attachments/assets/cbc238c2-7c14-4c03-b85a-1b31db36fe21)
![image](https://github.com/user-attachments/assets/f237afdf-2a31-4d09-a8c4-b383ee2fea8e)
![image](https://github.com/user-attachments/assets/675cc24a-8984-4a4f-99c9-5ebdcf9bc3b7)
![image](https://github.com/user-attachments/assets/6d9b1fee-4e13-4ac8-b075-bb5efda518fb)



---
