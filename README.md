<p align="center">
  <img src="/public/assets/injectly.svg" alt="Injectly Logo" height="150">
</p>
<h1 align="center">Injectly</h1>

**Injectly** is a powerful, self-hosted code injection app designed to help you manage scripts across multiple websites with ease. Dynamically update scripts for specific websites or across your entire portfolio—all from a single, intuitive dashboard.

![2025-01-13](/public/assets/screenshot.png)

---

## **Features**

- **Dynamic Script Injection**: Generate one, unique script to embed on your websites.
- **Granular Control**: Assign scripts to specific websites or manage global scripts.
- **Site Management**: Add, edit, and delete website entries with distinct, color-coded flags for clarity.
- **Centralized Management**: Add, edit, and delete scripts with real-time updates across all linked sites.
- **Self-Hosted**: Total control over your data and functionality with lightweight deployment.

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

## **Run with Docker**

You can run Injectly without building from source using Docker.

### **Option 1: Docker Run**

```bash
mkdir -p data
docker run -d --name injectly \
  -p 3000:3000 \
  -v ./data:/data \
  lklynet/injectly:latest
```

Then open <http://localhost:3000>.

### **Option 2: Docker Compose**

Download `docker-compose.yml` (or clone this repo), then:

```bash
mkdir -p data
docker compose up -d
# If your Docker uses the old plugin:
# docker-compose up -d
```

Data is persisted in `./data` and the app listens on `http://localhost:3000`.

---

## **Usage**

### **1. Add the Unique Script to Your Website:**

Copy the provided script tag from the Injectly dashboard and paste it into the `<head>` section of your websites:

```html
<script src="http://your-server.com/inject.js"></script>
```

### **2. Manage Wesbsites:**

- Add websites to your dashboard with easy-to-identify, color-coded flags.
- Edit or delete websites as needed.

### **3. Manage Your Scripts:**

- Assign scripts to specific websites or all sites globally.
- Changes instantly reflect across all connected websites.
- View which websites are assigned to each script with color-coded flags for easy identification.

### **4. Dynamic Updates:**

Any changes you make to the scripts in Injectly are automatically reflected on all websites using the embedded script.

---

<a href="https://star-history.com/#lklynet/injectly&Timeline">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=lklynet/injectly&type=Timeline&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=lklynet/injectly&type=Timeline" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=lklynet/injectly&type=Timeline" />
 </picture>
</a>

### **Feedback**

If you encounter bugs or have suggestions, please open an issue on GitHub or contact me directly: <hi@lkly.net>
