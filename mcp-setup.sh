sudo apt update
sudo apt upgrade -y
export PATH="$HOME/.local/bin:$PATH"

curl -LsSf https://astral.sh/uv/install.sh | sh
sudo apt install pipx -y
pipx install awslabs.aws-api-mcp-server
sudo apt install unzip -y

curl --proto '=https' --tlsv1.2 -sSf "https://desktop-release.q.us-east-1.amazonaws.com/latest/q-x86_64-linux.zip" -o "q.zip"
unzip q.zip
./q/install.sh

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
sudo apt install -y nodejs npm
sudo npm install -g pm2

mkdir -p /home/ubuntu/.aws/amazonq
cat <<'EOF' > /home/ubuntu/.aws/amazonq/mcp.json
{
  "mcpServers": {
    "pricing": {
      "command": "uvx",
      "args": ["awslabs.aws-pricing-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR",
        "AWS_REGION": "us-east-2"
      },
      "disabled": false,
      "autoApprove": ["*"]
    },
    "ce": {
      "command": "uvx",
      "args": ["awslabs.cost-explorer-mcp-server@latest"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR",
        "AWS_REGION": "us-east-2"
      },
      "disabled": false,
      "autoApprove": ["*"]
    }
  }
}
EOF

# Set ownership for ubuntu user
chown -R ubuntu:ubuntu /home/ubuntu/.aws

cd /home/ubuntu
git clone https://github.com/AhmadMudassir/aws-mcp-poc.git
cd aws-mcp-poc
npm install
pm2 start server.js 
pm2 save