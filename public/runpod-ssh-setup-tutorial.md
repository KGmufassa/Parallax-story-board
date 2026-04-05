# RunPod SSH Setup Tutorial

This guide captures the full command flow we used, from creating an SSH key to testing a RunPod SSH connection.

## 1. Create an SSH key pair

Create a new Ed25519 key:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

When prompted:

- choose a save path, or press Enter for the default `~/.ssh/id_ed25519`
- optionally enter a passphrase for extra protection

If you create a custom key instead, you may end up with files like:

- private key: `sshk`
- public key: `sshk_pub` or `sshk.pub`

## 2. Find your public key

List your SSH files:

```bash
ls ~/.ssh
```

Print the public key:

```bash
cat ~/.ssh/id_ed25519.pub
```

If you used a custom filename, print that public key instead:

```bash
cat /path/to/your/custom_key.pub
```

Only the public key should be pasted into RunPod.

## 3. Register the public key in RunPod

Paste the contents of your public key into the SSH key section in RunPod.

Important:

- public key goes into RunPod
- private key stays on your machine

## 4. Move keys into the standard SSH location

If your keys were created outside `~/.ssh`, move them into place.

Example used here:

```bash
mkdir -p ~/.ssh
mv ~/Desktop/sshk ~/.ssh/id_ed25519
mv ~/Desktop/sshk_pub ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

Verify:

```bash
ls -la ~/.ssh
```

Expected files:

- `~/.ssh/id_ed25519`
- `~/.ssh/id_ed25519.pub`

## 5. Test the RunPod SSH gateway

RunPod may give you a gateway command like this:

```bash
ssh q91ot3ib257e53-644115fd@ssh.runpod.io -i ~/.ssh/id_ed25519
```

To test with verbose output:

```bash
ssh -v q91ot3ib257e53-644115fd@ssh.runpod.io -i ~/.ssh/id_ed25519
```

What to look for:

- `Offering public key`
- `Server accepts key`

If you see both, the key pairing is correct.

## 6. Test the exposed TCP SSH endpoint

RunPod may also show a direct command like this:

```bash
ssh root@213.173.110.146 -p 14214 -i ~/.ssh/id_ed25519
```

Verbose version:

```bash
ssh -v root@213.173.110.146 -p 14214 -i ~/.ssh/id_ed25519
```

In our test session, this endpoint returned:

```text
Connection refused
```

That means the port was reachable as an address, but SSH was not listening there at the time.

## 7. Test whether the port is open

You can verify the TCP port directly:

```bash
nc -vz 213.173.110.146 14214
```

If it returns `Connection refused`, the direct exposed SSH endpoint is not currently accepting connections.

## 8. Load the key into your SSH agent

If your private key has a passphrase, the non-interactive session may fail even after the server accepts the key.

Start the SSH agent if needed:

```bash
eval "$(ssh-agent -s)"
```

Add your key:

```bash
ssh-add ~/.ssh/id_ed25519
```

Then retry the gateway login:

```bash
ssh q91ot3ib257e53-644115fd@ssh.runpod.io -i ~/.ssh/id_ed25519
```

## 9. How to tell what failed

### Key path problem

```text
Identity file ... not accessible: No such file or directory
```

Meaning: your `-i` path is wrong.

### Desktop/macOS permission problem

```text
Operation not permitted
```

Meaning: Terminal cannot access Desktop/Documents/Downloads. Move the key into `~/.ssh` or grant permissions in macOS.

### RunPod accepted the key, but passphrase could not be entered

```text
Server accepts key
read_passphrase: can't open /dev/tty
Permission denied (publickey)
```

Meaning: the key is correct, but the session cannot prompt for the passphrase. Use `ssh-add` first.

### Direct endpoint network/service problem

```text
connect to address ... port ...: Connection refused
```

Meaning: nothing is listening on that exposed SSH port yet.

## 10. Final recommended connection flow

Use this order:

1. Create key pair with `ssh-keygen`
2. Paste the public key into RunPod
3. Move the private key to `~/.ssh/id_ed25519`
4. Set permissions with `chmod 600 ~/.ssh/id_ed25519`
5. Run `ssh-add ~/.ssh/id_ed25519`
6. Connect through the RunPod gateway:

```bash
ssh q91ot3ib257e53-644115fd@ssh.runpod.io -i ~/.ssh/id_ed25519
```

7. Only use the exposed TCP command if RunPod confirms that endpoint is active:

```bash
ssh root@213.173.110.146 -p 14214 -i ~/.ssh/id_ed25519
```

## 11. Commands used in this session

These are the main commands we used while debugging:

```bash
ssh -v root@213.173.110.146 -p 14214 -i ~/.ssh/id_ed25519
ssh -v root@213.173.110.146 -p 14214 -i /Users/wislemleger/Desktop/sshk
nc -vz 213.173.110.146 14214
ssh -v q91ot3ib257e53-644115fd@ssh.runpod.io -i /Users/wislemleger/Desktop/sshk
mkdir -p ~/.ssh
mv ~/Desktop/sshk ~/.ssh/id_ed25519
mv ~/Desktop/sshk_pub ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
ls -la ~/.ssh
ssh -v q91ot3ib257e53-644115fd@ssh.runpod.io -i ~/.ssh/id_ed25519
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```
