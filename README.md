## 🚀 **Craft-Fusion Monorepo Installation Guide**

Welcome to the **Craft-Fusion** monorepo! This project contains three applications designed to work together seamlessly:

1. **craft-web** – Angular frontend (Material Design Table for displaying data).  
2. **craft-nest** – NestJS backend (mocking and delivering up to 1 million users, running on port `3000`).  
3. **craft-go** – Go backend (ready to deliver mock data for performance testing, running on port `4000`).  

This guide will walk you through setting up your development environment, installing dependencies, and troubleshooting common issues.

---

## 📚 **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Cloning the Repository](#cloning-the-repository)
3. [Installing Dependencies](#installing-dependencies)
4. [Starting Applications](#starting-applications)
5. [Switching Between NestJS and Go APIs](#switching-between-nestjs-and-go-apis)
6. [Testing and Troubleshooting](#testing-and-troubleshooting)
7. [Performance Testing](#performance-testing)
8. [Additional Resources](#additional-resources)

---

## 🛠️ **1. Prerequisites**

Ensure the following software is installed on your system:

| **Software**     | **Version**     | **Installation Link** |
|-------------------|-----------------|------------------------|
| **Node.js**      | `v20.16.0`      | [Node.js Download](https://nodejs.org/en/) |
| **npm**          | `v10.8.1`       | Included with Node.js |
| **Go**           | `v1.23.4`       | [Go Download](https://golang.org/dl/) |
| **NX CLI**       | Latest          | `npm install -g nx` |
| **Angular CLI**  | Latest          | `npm install -g @angular/cli` |
| **NestJS CLI**   | Latest          | `npm install -g @nestjs/cli` |

---

## 📥 **2. Cloning the Repository**

Open your terminal and run:

```bash
git clone https://github.com/JeffreySanford/craft-fusion.git
cd craft-fusion
```

Verify the repository is cloned successfully:

```bash
ls -la
```

---

## 📦 **3. Installing Dependencies**

Ensure you are in the root directory of the `craft-fusion` monorepo, then run:

```bash
# Remove any existing dependencies (if necessary)
rm -rf node_modules package-lock.json
npm cache clear --force

# Install fresh dependencies
npm install
```

### **Install Go Dependencies**
Navigate to the Go application directory and ensure dependencies are installed:

```bash
cd apps/craft-go
go mod tidy
```

---

## 🚀 **4. Starting Applications**

Return to the root of the monorepo:

```bash
cd ../../
```

### Start the Angular Frontend (craft-web)
```bash
nx serve craft-web
```

**Access:** `http://localhost:4200`

### Start the NestJS Backend (craft-nest)
```bash
nx serve craft-nest
```

**Access:** `http://localhost:3000/api`

### Start the Go Backend (craft-go)
```bash
nx serve craft-go
```

**Access:** `http://localhost:4000/records`

---

## 🔄 **5. Switching Between NestJS and Go APIs**

The Angular frontend (`craft-web`) fetches data from the backend APIs. You can toggle between NestJS and Go backends for testing.

## 🛡️ **6. Testing and Troubleshooting**

### **Common Commands**
- **Clear NX Cache:**
  ```bash
  npx nx reset
  ```
- **Check Node/NPM/Go Versions:**
  ```bash
  node -v
  npm -v
  go version
  ```
- **Run Backend Manually (Without NX):**
  ```bash
  cd apps/craft-nest
  npm run start
  cd ../craft-go
  go run main.go
  ```

---

## 📊 **7. Performance Testing**

### **Manual Testing Endpoints:**
- **NestJS Users Endpoint:** `http://localhost:3000/api/users?limit=1000000`
- **Go Records Endpoint:** `http://localhost:4000/records?limit=1000000`

### **Test via Angular Table Toggle:**
In your Angular frontend, toggle between:
- **NestJS Data Source:** `/api/users`
- **Go Data Source:** `/api/go/records`

### **Load Testing Tools:**
- **Apache Benchmark:**  
  ```bash
  ab -n 10000 -c 100 http://localhost:4000/records
  ```
- **wrk:**  
  ```bash
  wrk -t4 -c200 -d30s http://localhost:4000/records
  ```

---

## 📚 **8. Additional Resources**

- **Node.js Documentation:** [Node.js Docs](https://nodejs.org/en/docs/)
- **Go Documentation:** [Go Docs](https://golang.org/doc/)
- **Angular Documentation:** [Angular Docs](https://angular.io/)
- **NestJS Documentation:** [NestJS Docs](https://docs.nestjs.com/)
- **NX Documentation:** [NX Docs](https://nx.dev/)

---

## 🎯 **9. Final Checklist**

- ✅ Node.js and Go installed.
- ✅ Dependencies installed (`npm install`, `go mod tidy`).
- ✅ All three apps running (`nx serve craft-web`, `craft-nest`, `craft-go`).
- ✅ Proxy configured correctly (`proxy.conf.json`).
- ✅ Angular toggles successfully between `/api` and `/api/go`.

**You're all set to run and test the Craft-Fusion monorepo!** 🚀  
If you encounter any issues, feel free to reach out! 😊

