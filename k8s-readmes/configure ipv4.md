# Kubernetes Networking for Absolute Beginners

You asked what these commands do:

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
```

Let's understand this from absolute zero.

---

# Step 1: What is happening in Kubernetes?

Suppose you have:

* 1 Control Plane VM
* 3 Worker VMs

Inside each VM, Kubernetes runs Pods.

Example:

```text
Worker-1
 ├─ Pod A = 192.168.1.10
 └─ Pod B = 192.168.1.11

Worker-2
 └─ Pod C = 192.168.2.10
```

Now Pod A should be able to talk to Pod C.

```text
Pod A  ---> Worker-1 ---> Worker-2 ---> Pod C
```

Linux by default is NOT ready for this.

A normal Linux machine behaves like this:

```text
Packet comes in ---> stop here
```

But Kubernetes needs Linux to behave like a router:

```text
Packet comes in ---> send to next interface ---> reach other pod
```

So before Kubernetes starts, we prepare Linux.

---

# Step 2: What is a Kernel Module?

The Linux kernel is the "brain" of Linux.

It does:

* Memory management
* Networking
* File systems
* Drivers

But not everything is loaded all the time.

Linux loads extra features called "kernel modules" only when needed.

Example:

* USB support = one module
* Wi‑Fi support = another module
* Kubernetes networking support = another module

The two modules Kubernetes needs are:

1. overlay
2. br_netfilter

---

# Step 3: What is `overlay`?

Containers do not make a full copy of Ubuntu every time.

Imagine you have 100 containers.

Without overlay:

```text
Container 1 -> full Ubuntu copy = 500 MB
Container 2 -> full Ubuntu copy = 500 MB
Container 3 -> full Ubuntu copy = 500 MB
```

Very wasteful.

Instead Kubernetes/containerd uses layers.

Example:

```text
Layer 1 = Ubuntu base files
Layer 2 = Python installed
Layer 3 = Your app files
```

Then the container sees all layers merged together:

```text
         Your App Layer
              /
         Python Layer
              /
         Ubuntu Layer
```

The Linux feature that merges these layers is called OverlayFS.

The kernel module for OverlayFS is:

```text
overlay
```

That is why we load it.

```bash
sudo modprobe overlay
```

Without it:

* containerd may fail
* pods may fail to start
* image pulling can fail

---

# Step 4: What is `iptables`?

Before understanding `br_netfilter`, you need to know iptables.

Think of iptables as Linux firewall rules.

It decides:

```text
Can this packet go?
Should it be blocked?
Should it be sent somewhere else?
```

Example:

```text
Traffic to port 80 -> allow
Traffic to port 22 -> allow
Traffic to port 3306 -> block
```

Kubernetes uses iptables heavily.

Why?

Because Kubernetes must decide:

* Which pod gets the traffic
* Which Service IP should forward to which pod
* Which pod is allowed to talk to another pod

Example:

```text
Service IP 10.96.0.10
        |
        +--> Pod A
        +--> Pod B
```

Kubernetes creates iptables rules automatically for this.

---

# Step 5: What is a Linux Bridge?

Inside a node, Kubernetes creates a virtual network switch.

This is called a bridge.

You can think of it like a small switch inside the VM.

```text
          [ Linux Bridge ]
            /    |    \
         PodA  PodB  PodC
```

Usually names are:

```text
cni0
cali0
flannel.1
```

Now suppose Pod A sends traffic to Pod B.

```text
Pod A ---> Linux Bridge ---> Pod B
```

Problem:

By default Linux says:

> If traffic goes through a bridge, do NOT send it through iptables.

That means Kubernetes firewall and service rules never see the traffic.

Then:

* Services stop working
* DNS breaks
* Pod-to-pod traffic fails

---

# Step 6: What is `br_netfilter`?

`br_netfilter` changes Linux behavior.

It tells Linux:

> Even if traffic goes through a bridge, still pass it through iptables.

Diagram:

Without br_netfilter:

```text
Pod A ---> Bridge ---> Pod B
             |
             X iptables never sees packet
```

With br_netfilter:

```text
Pod A ---> Bridge ---> iptables ---> Pod B
```

Now Kubernetes can apply all its networking rules.

That is why we load:

```bash
sudo modprobe br_netfilter
```

---

# Step 7: What do these settings mean?

```bash
net.bridge.bridge-nf-call-iptables = 1
```

This means:

> For bridge traffic, use iptables.

`1` means enabled.

Without it:

```text
Pod A ---> Bridge ---> Pod B
iptables ignored
```

With it:

```text
Pod A ---> Bridge ---> iptables ---> Pod B
```

---

```bash
net.bridge.bridge-nf-call-ip6tables = 1
```

Same thing, but for IPv6.

You may not use IPv6 today, but Kubernetes often enables both.

---

# Step 8: What is `ip_forward`?

This is the biggest concept.

A normal Linux machine does NOT forward packets.

Example:

Suppose traffic comes from Pod A and needs to go to Pod C on another node.

```text
Pod A ---> Worker-1 ---> Worker-2 ---> Pod C
```

When packet reaches Worker-1, Linux asks:

> This packet is not for me. Should I pass it to Worker-2?

By default answer is:

```text
No
```

Because normal Linux is not a router.

So packet dies.

```text
Pod A ---> Worker-1 ---> X
```

When we enable:

```bash
net.ipv4.ip_forward = 1
```

Now Linux says:

```text
Yes, I can forward packets like a router.
```

Then:

```text
Pod A ---> Worker-1 ---> Worker-2 ---> Pod C
```

Success.

---

# Step 9: Why create these files?

```bash
/etc/modules-load.d/k8s.conf
```

This file says:

> Every time server reboots, automatically load overlay and br_netfilter.

Otherwise after reboot Kubernetes may break.

And:

```bash
/etc/sysctl.d/k8s.conf
```

This file says:

> Every reboot, keep iptables and ip_forward settings enabled.

---

# Step 10: Why run `sysctl --system`?

After creating the file, Linux still has not applied it.

This command:

```bash
sudo sysctl --system
```

means:

> Read all files in /etc/sysctl.d and apply them now.

Without reboot.

---

# Step 11: Real-Life Example of What Breaks Without These Settings

Suppose you have:

```text
Worker-1
 └─ Pod A = 192.168.1.10

Worker-2
 └─ Pod B = 192.168.2.10
```

Pod A wants to talk to Pod B.

```text
Pod A ---> Worker-1 ---> Worker-2 ---> Pod B
```

Now let's see what happens if each thing is missing.

---

## Case 1: `ip_forward=0`

Worker-1 receives the packet from Pod A.

But Linux says:

> This packet is not for me, and I am not allowed to forward it.

So the packet stops.

```text
Pod A ---> Worker-1 ---> X
```

From inside Pod A, you may see:

```bash
ping 192.168.2.10
```

And it never responds.

This is why Kubernetes needs `ip_forward=1`.

---

## Case 2: `br_netfilter` not loaded

Suppose Pod A wants to call a Kubernetes Service.

Example:

```text
Service IP = 10.96.0.20
Real Pod = 192.168.2.10
```

Kubernetes creates an iptables rule like:

```text
If traffic goes to 10.96.0.20, secretly send it to 192.168.2.10
```

Diagram:

```text
Pod A ---> 10.96.0.20 ---> iptables rule ---> Pod B
```

But if `br_netfilter` is missing, then traffic passing through the Linux bridge never reaches iptables.

So Linux never applies the rule.

Then packet goes like:

```text
Pod A ---> Bridge ---> 10.96.0.20 ---> X
```

Because there is no real machine with IP 10.96.0.20.

The Service appears broken.

---

# Step 12: What Exactly is a Kubernetes Service?

A Service is like a permanent front door.

Suppose you have 3 nginx pods:

```text
Pod 1 = 192.168.1.10
Pod 2 = 192.168.1.11
Pod 3 = 192.168.1.12
```

These pod IPs can change if pods restart.

So Kubernetes gives them one stable Service IP:

```text
Service = 10.96.0.50
```

Now applications only talk to the Service:

```text
App ---> 10.96.0.50
```

Then Kubernetes secretly forwards it to one pod.

```text
10.96.0.50 ---> Pod 1
10.96.0.50 ---> Pod 2
10.96.0.50 ---> Pod 3
```

This forwarding is done by iptables.

So if iptables cannot see the packet, Services break.

---

# Step 13: Why Does Traffic Go Through a Bridge?

Inside one node, pods are not connected directly to the VM network card.

Instead, each pod gets a virtual cable.

```text
Pod A ---- veth ----
                     \
                      Linux Bridge (cni0) ---- Actual VM network card
                     /
Pod B ---- veth ----
```

The bridge works like a mini switch.

Without Kubernetes, Linux normally does this:

```text
Pod A ---> Bridge ---> Pod B
```

No firewall. No iptables.

But Kubernetes wants:

```text
Pod A ---> Bridge ---> iptables ---> maybe Pod B
```

Because Kubernetes must inspect and possibly change the packet.

Examples:

* Send packet to another pod
* Send packet to a Service
* Block packet due to NetworkPolicy
* Redirect packet to another node

That is why bridge traffic must pass through iptables.

---

# Step 14: What is kube-proxy Doing?

Kubernetes has a component called kube-proxy.

Its job is:

> Create iptables rules for all Services.

Example rule in simple words:

```text
If someone calls Service 10.96.0.50:80,
forward traffic to Pod 192.168.1.10:80
```

Without `br_netfilter` + `bridge-nf-call-iptables=1`, kube-proxy rules exist, but Linux ignores them.

That is why sometimes beginners see:

* Pods are Running
* Nodes are Ready
* But Services don't work

---

# Step 15: Super Simple Analogy

Imagine:

* Pods = Houses
* Linux bridge = Local road
* iptables = Traffic police
* ip_forward = Permission for roads between cities

Without traffic police:

```text
Cars move but nobody checks where they should go.
```

Without road permission (`ip_forward`):

```text
Cars cannot leave the city.
```

So:

```text
Pod A ---> local road ---> stuck
```

With everything enabled:

```text
Pod A ---> local road ---> traffic police ---> highway ---> Pod B
```

Now Kubernetes networking works.

# Final Simple Summary

```text
overlay
```

Needed so containers can use layered filesystems.

```text
br_netfilter
```

Needed so pod traffic going through bridges can be seen by iptables.

```text
bridge-nf-call-iptables=1
```

Needed so Kubernetes Services and networking work.

```text
ip_forward=1
```

Needed so node can act like a router and send traffic between pods and nodes.

If you skip these settings:

* Pods may start
* But pods cannot talk to each other
* Services may fail
* DNS may fail
* Calico/Flannel may not work
