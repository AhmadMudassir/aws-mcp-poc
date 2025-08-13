# AWS MCP POC

This project is a Node.js application demonstrating AWS MCP setup with Amazon Q integration. It includes an automated setup script that installs all dependencies, configures Amazon Q, and starts the app using **PM2**.

## 📂 Project Structure
```bash
.
├── amazonq-login.mp4    # Video tutorial for Amazon Q authentication
├── mcp-setup.sh         # Automated setup script
├── package.json
├── package-lock.json
├── public/              # Static frontend files
│   ├── index.html
│   └── style.css
└── server.js            # Node.js backend server
```

## 🛡 IAM Role & Security Group Requirements

**IAM Role**  
Before launching the EC2 instance, create an **IAM role** with:
- **Trust policy**: Allow `ec2.amazonaws.com` to assume the role
- **AWS Managed Policies**:
  - `AmazonEC2ReadOnlyAccess`
  - `AmazonForecastFullAccess`
  - `AmazonSSMManagedInstanceCore`
  - `AWSBillingReadOnlyAccess`
  - `AWSPriceListServiceFullAccess`
  - `Billing`
  - `CostOptimizationHubReadOnlyAccess`
- Create an **instance profile** and attach this role to your EC2 instance.

**Security Group**  
- Allow inbound traffic on:
  - **Port 22** (SSH) – from your IP
  - **Port 3001** (App access) – from `0.0.0.0/0` or restricted CIDR

## 🚀 Quick Setup

1️⃣ **Clone the repository and enter the directory**
```bash
git clone https://github.com/AhmadMudassir/aws-mcp-poc.git && cd aws-mcp-poc
```

2️⃣ **Run the setup script** (two options):

**Option A – Direct execution**
```bash
chmod +x mcp-setup.sh && ./mcp-setup.sh
```

**Option B – Copy & paste into terminal**  
Open `mcp-setup.sh` in a text editor and paste the commands directly into your terminal.

## 🔐 Amazon Q Authentication
During the installation, when Amazon Q is being set up, the script will **pause** and print an authentication URL (if you choose to login by pressing enter).

1. Copy the link shown in your terminal.  
2. Open it in a browser **logged in to your AWS account**.  
3. Grant Amazon Q the requested permissions.  

📹 For a step-by-step guide, watch `amazonq-login.mp4`.

## 📡 App Access
Once the script finishes:
- The server runs via **PM2** (persistent process manager)  
- Accessible at:  
  ```
  http://<YOUR_INSTANCE_PUBLIC_IP>:3001
  ```
- Static frontend served from `/public`  
- Backend API in `server.js`

## 🛠 Notes
- The script installs:
  - Node.js, npm  
  - PM2  
  - AWS CLI v2  
  - Amazon Q MCP pricing & cost-explorer integrations  
- App restarts automatically on reboot (via PM2 startup)  

⚠️ **Important:** If you restart your EC2 instance, you may need to:
```bash
cd aws-mcp-poc
pm2 start server.js
```
to bring the app back online.
