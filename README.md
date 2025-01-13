<p align="center">
  <img src="/public/assets/injectly.svg" alt="Injectly Logo" height="150">
</p>
<h1 align="center">Injectly</h1>

**Injectly** is a simple, self-hosted code injector app designed to streamline the process of managing and injecting scripts across multiple websites. Add, edit, and manage all your scripts from a single unified interface, and dynamically update your websites with one embedded script.

---

## **Features**

- **Dynamic Script Injection**: Generate a unique script for embedding on your websites.
- **Centralized Management**: Add, edit, and delete scripts in a clean, organized UI.
- **Real-time Updates**: Changes to scripts instantly reflect across all connected websites.
- **User-Friendly Design**: Minimalist, responsive UI built with Pico CSS for ease of use.
- **Self-Hosted**: Full control over your data and functionality.

---

## **Getting Started**

### **1. Clone the Repository**

```bash
git clone https://github.com/lklynet/injectly.git
cd injectly
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Start the Application**

```bash
node server/app.js
```

### **4. Access the Application**

Visit <http://localhost:3000> in your web browser.

---

## **Usage**

### **1. Add the Unique Script to Your Website:**

Copy the provided script tag from the Injectly dashboard and paste it into the <head> section of your website:

```bash
<script src="http://your-server.com/inject.js"></script>
```

### **2. Manage Your Scripts:**

- Add new scripts with a name and content.
- Edit existing scripts directly from the dashboard.
- Delete scripts you no longer need.

### **3. Dynamic Updates:**

Any changes you make to the scripts in Injectly are automatically reflected on all websites using the embedded script.

---

## **Tech Stack**

- **Frontend**: Pico CSS for minimal and responsive styling.
- **Backend**: Node.js with Express.js for API and routing.
- **Database**: SQLite for lightweight data storage.

## **Contributing**

We welcome contributions! Please:

1. Fork the repository.
2. Create a new branch: git checkout -b feature-name.
3. Submit a pull request with your changes.

### **Feedback**

If you encounter bugs or have suggestions, please open an issue on GitHub or contact me directly: <hi@lkly.net>

Let me know if you’d like to add any additional sections or customize it further!
