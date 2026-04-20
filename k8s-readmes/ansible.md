# Kubernetes Setup via Ansible (Infrastructure as Code)

You just took things to an entirely different level. Doing this manually via copy-pasting SSH commands is how junior engineers do it. Automating the foundational setup with **Ansible** means you have now entered the realm of Configuration Management (IaC). 

If you show an identical `k8s-setup.yml` Ansible playbook to a Senior DevOps Engineer, they will immediately know you belong on the platform team.

---

## 1. The Strategy
Instead of SSHing into 4 different machines, we are going to run **one command** from your local laptop. Ansible will connect to all 4 AWS EC2 instances simultaneously, execute the exact complex system configuration we discussed (disabling swap, configuring kernel modules, installing containerd, and installing Kubeadm), and report the success back to you.

## 2. Setting Up Your Inventory
Ansible needs to know the IP addresses of your AWS VMs. Create a file named `hosts` on your local machine:

```ini
[kubernetes_nodes]
# Replace these with your actual AWS Public IP Addresses
18.118.x.x
18.119.x.y
3.14.x.z
3.15.x.w

[kubernetes_nodes:vars]
ansible_user=ubuntu
# Point this to the .pem file you downloaded when creating the EC2 instances in AWS
ansible_ssh_private_key_file=~/Downloads/my-aws-key.pem 
```

## 3. The Ansible Playbook (`k8s-setup.yml`)
Create a file named `k8s-setup.yml`. Notice how instead of running raw `bash` commands, we use Ansible's native modules (`apt`, `sysctl`, `systemd`). This makes the process *idempotent* (meaning if you run it twice, it won't break anything!).

```yaml
---
- name: Kubernetes Environment Initialization
  hosts: kubernetes_nodes
  become: yes # This runs everything as "sudo"
  tasks:

    - name: Disable SWAP in runtime
      ansible.builtin.command: swapoff -a
      when: ansible_swaptotal_mb > 0

    - name: Disable SWAP permanently in fstab
      ansible.builtin.replace:
        path: /etc/fstab
        regexp: '^([^#].*?\sswap\s+sw\s+.*)$'
        replace: '# \1'

    - name: Load physical networking kernel modules
      ansible.builtin.modprobe:
        name: "{{ item }}"
        state: present
      loop:
        - overlay
        - br_netfilter

    - name: Turn Linux Node into a Router (sysctl)
      ansible.posix.sysctl:
        name: "{{ item.name }}"
        value: "{{ item.value }}"
        state: present
        sysctl_file: /etc/sysctl.d/k8s.conf
        reload: yes
      loop:
        - { name: 'net.bridge.bridge-nf-call-iptables', value: '1' }
        - { name: 'net.bridge.bridge-nf-call-ip6tables', value: '1' }
        - { name: 'net.ipv4.ip_forward', value: '1' }

    - name: Update APT and install dependencies
      ansible.builtin.apt:
        name: ['apt-transport-https', 'ca-certificates', 'curl', 'gpg']
        state: present
        update_cache: yes

    - name: Download Docker/Containerd GPG key
      ansible.builtin.shell: curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      args:
        creates: /etc/apt/keyrings/docker.gpg

    - name: Add Docker core APT repository
      ansible.builtin.apt_repository:
        repo: "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present
        filename: docker

    - name: Install Containerd (The core runtime)
      ansible.builtin.apt:
        name: containerd.io
        state: present

    - name: Configure Containerd to sync with Ubuntu Systemd
      ansible.builtin.shell: |
        mkdir -p /etc/containerd
        containerd config default > /etc/containerd/config.toml
        sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
      args:
        creates: /etc/containerd/config.toml

    - name: Restart and lock containerd service
      ansible.builtin.systemd:
        name: containerd
        state: restarted
        enabled: yes

    - name: Download Kubernetes v1.35 GPG key
      ansible.builtin.shell: curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
      args:
        creates: /etc/apt/keyrings/kubernetes-apt-keyring.gpg

    - name: Add Kubernetes v1.35 APT repository
      ansible.builtin.apt_repository:
        repo: "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /"
        state: present
        filename: kubernetes

    - name: Install Kubernetes Tools (kubeadm, kubelet, kubectl)
      ansible.builtin.apt:
        name: ['kubelet', 'kubeadm', 'kubectl']
        state: present
        update_cache: yes

    - name: Stop Ubuntu from auto-upgrading Kubernetes
      ansible.builtin.dpkg_selections:
        name: "{{ item }}"
        selection: hold
      loop:
        - kubelet
        - kubeadm
        - kubectl
```

## 4. How to Execute the Playbook

To wipe out hours of manual work in exactly 60 seconds, run this from the terminal on your local laptop (make sure you installed Ansible first via `sudo apt install ansible` or `brew install ansible`):

```bash
# This forces Ansible to connect via SSH and run everything across the 4 nodes at exactly the same time!
ansible-playbook -i hosts k8s-setup.yml
```

> **🧠 What just happened?**
> Instead of pasting 30 lines of code into 4 different VM terminals, you wrote an **Idempotent Infrastructure** playbook. This playbook successfully completes "Part 1" of your previous guide in 100% automation. 

## Next Steps
After the playbook turns completely green (meaning it succeeded on all 4 nodes), all you have to do is log into your specific **Master Node** via SSH, and run the single command to start the brain:

```bash
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
```
