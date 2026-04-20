# The Ultimate Kubeadm Installation Guide: 4-Node Cluster
**Target Version: Kubernetes v1.35 (Latest Stable 2026)**

This guide has been carefully formatted with architectural explanations for *every* command. When your Senior DevOps engineer asks you "Why did you run this command?", you will be able to answer exactly like a Linux and Kubernetes expert!

---

Before running ANY commands, log into AWS and ensure your instances can talk to each other.

Go to your AWS Security Group assigned to these 4 instances.
Add an Inbound Rule: Allow All traffic from the source Custom: <Your Security Group ID>. This allows the 4 VMs to freely communicate securely within AWS.
Add an Inbound Rule: Allow SSH (Port 22) from Anywhere so you can log in.
Add an Inbound Rule: Allow Custom TCP (Port 6443) from Anywhere. This lets you control the cluster from your own laptop later.

## Part 1: Run these commands on ALL 4 Nodes (Master + 3 Workers)

These commands physically prepare the Ubuntu operating systems to handle the complex internal networking and process isolation required by Kubernetes.

### 1. Disable SWAP Memory
```bash
sudo swapoff -a

# Disable it permanently after a reboot:
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
```
> **🧠 Why are we doing this?**
> Kubernetes (specifically the `kubelet`) is strictly designed to manage container memory usage using Linux cgroups. If your AWS EC2 instance runs out of RAM, Kubernetes needs to aggressively terminate or throttle pods right then and there. If `swap` (virtual hard-drive RAM) is enabled, the Linux OS will secretly start moving pod memory to the disk. This destroys performance, causes unpredictable latency, and breaks Kubernetes' entire resource management system.

### 2. Configure IPv4 Forwarding and Kernel Modules
```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter
```
> **🧠 Why are we doing this?**
> A Linux server isn't a router by default. We have to load two incredibly important Linux Kernel modules. 
> * `overlay`: This is a filesystem module! Containers are built in "layers". The overlay filesystem is what physically allows `containerd` to stack a Docker Image layer on top of a running container floor.
> * `br_netfilter`: This makes "bridge" networks visible to the Linux firewall (`iptables`). This is mandatory so Kubernetes can perform Network Address Translation (NAT) and route traffic correctly from the internet, to the node, and down into your pod.

```bash
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
```
> **🧠 Why are we doing this?**
> `ip_forward = 1` turns the EC2 instance into a true network router, allowing it to pass packets from its physical network interface directly into the virtual Container Networks inside Kubernetes.

### 3. Install `containerd` (The Container Runtime)
```bash
# Update and install dependencies
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg

# Download Docker's GPG key (containerd is part of the Docker project)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add the official repository map
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install containerd
sudo apt-get update
sudo apt-get install -y containerd.io
```
> **🧠 Why aren't we using Docker?**
> Since Kubernetes 1.24, the "Docker Shim" was completely removed. Kubernetes no longer natively supports standard "Docker Desktop", instead it relies directly on `containerd`—the ultra-fast core engine beneath Docker that actually runs the containers, stripping away the heavy GUI and CLI requirements to save CPU on your nodes.

```bash
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml > /dev/null
grep SystemdCgroup /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

sudo systemctl restart containerd
sudo systemctl enable containerd
```
> **🧠 Why `SystemdCgroup = true`?**
> This is a crucial interview question! Ubuntu already uses `systemd` as its default system manager (which manages OS resources through Linux cgroups). By default, containerd uses `cgroupfs`. If Kubernetes/containerd tries to use a different resource manager than Ubuntu, they will fight over CPU and Memory, eventually crashing your node completely. This command forces containerd to sync with Ubuntu systemd.

### 4. Install Kubeadm, Kubelet, and Kubectl (Latest Kubernetes v1.35)
```bash
# Download Kubernetes public key for the newest v1.35 repository
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# Add the v1.35 repository
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

# Install packages
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```
> **🧠 Why do we "hold" the packages?**
> `apt-mark hold` locks the version. If you ever run `sudo apt upgrade` dynamically, Linux would automatically upgrade your Kubernetes nodes which could result in a cluster death if the control plane and workers mismatch versions. You *always* handle Kubernetes upgrades manually (one node at a time).

---

## Part 2: Bootstrapping the "Brain"
Run these commands **ONLY ON THE MASTER NODE (2 vCPU / 4GB)**.

### 5. Initialize Kubeadm
```bash
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
```
> **🧠 Why do we need the pod-network-cidr flag?**
> When you launch a Java application inside Kubernetes, it gets an internal IP address. But where does that IP come from? Kubernetes doesn't know what IP ranges you want to use inside the cluster. We use `192.168.0.0/16` because this is the exact default subnet that our Calico Networking plugin relies upon to build the network. 

> [!IMPORTANT]
> **SAVE THE OUTPUT!** At the very end of the output, `kubeadm` will print a `kubeadm join ...` command with a long token and hash. Copy this and paste it into a notepad.

### 6. Configure Permissions 
```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```
> **🧠 Why are we doing this?**
> Kubernetes uses a highly secure API file called a `kubeconfig` to verify your identity. By copying `admin.conf` to your local user directory, you are giving yourself the ultimate "Super Admin" permissions to run `kubectl` commands against the API server.

### 7. Install the Networking Layer (Calico)
```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/tigera-operator.yaml
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/custom-resources.yaml
```
> **🧠 Why do we need Calico?**
> By design, Kubernetes does not have a networking brain on installation. It leaves that up to you to install a CNI (Container Network Interface). Calico takes the packets, secures them through BGP (Border Gateway Protocol), and ensures that if a frontend pod wants to talk to a backend pod, the network physically bridges them across EC2 instances.

*(Wait 1-2 minutes, then run `kubectl get nodes` again. The master node should now say `Ready`!)*

---

## Part 3: Joining the Muscle
Run this command **ONLY ON THE 3 WORKER NODES**.

### 8. The Join Command
```bash
# Run the precise command you saved from Step 5!
sudo kubeadm join 10.0.x.x:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:abcd1234efgh5678...
```
> **🧠 What is actually happening here?**
> Your worker nodes are using that security `ca-cert-hash` to guarantee they are talking to the real master node and not an attacker intercepting the AWS network. Once verified via the token, they securely subscribe as "workers", allowing the Master's Kubernetes API Server to start scheduling Postgres and Java pods directly onto their hardware.

---

## Part 4: The Final Verification
Go back to your **Master Node**, and run:
```bash
kubectl get nodes -o wide
```
If you see all 4 nodes listed with the status `Ready`, you are officially running a customized, production-grade K8s cluster! 🚀
