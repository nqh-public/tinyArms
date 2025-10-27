# 02 - Troubleshooting

**Common issues and solutions**

---

## Ollama Not Running

**Symptom**: `Error: connect ECONNREFUSED localhost:11434`

**Solution**:
\`\`\`bash
# Start Ollama
ollama serve &

# Check status
tinyarms status
\`\`\`

---

## Model Not Found

**Symptom**: `Error: model not found: qwen2.5-coder:3b`

**Solution**:
\`\`\`bash
# List available models
ollama list

# Download missing model
ollama pull qwen2.5-coder:3b
\`\`\`

---

## Low Memory

**Symptom**: System slows down, swap memory used

**Solution**:
\`\`\`bash
# Check memory usage
tinyarms status

# Unload heavy models
tinyarms models unload qwen2.5-coder:7b

# Or limit memory in config
# max_memory_mb: 8000
\`\`\`

---

## LaunchAgent Not Running

**Symptom**: Scheduled tasks don't execute

**Solution**:
\`\`\`bash
# Check agent status
launchctl print gui/$UID/com.tinyarms.file-naming

# Look for errors in logs
cat ~/.config/tinyarms/logs/file-naming.error.log

# Reload agent
launchctl unload ~/Library/LaunchAgents/com.tinyarms.file-naming.plist
launchctl load ~/Library/LaunchAgents/com.tinyarms.file-naming.plist
\`\`\`

---

## File Not Detected

**Symptom**: Exported file doesn't trigger tinyArms

**Solution**:
\`\`\`bash
# Verify watcher is running
tinyarms status --json | jq '.watchers["audio-actions"]'

# Restart watcher
tinyarms skills disable audio-actions
tinyarms skills enable audio-actions
\`\`\`

---

## Slow Performance

**Symptom**: Tasks take longer than expected

**Solution**:
\`\`\`bash
# Check model speed
tinyarms benchmark

# Use faster quantization
ollama pull mannix/jan-nano:iq4_xs  # Instead of q8_0

# Reduce batch size
# tinyarms run file-naming ~/Downloads --batch-size 5
\`\`\`

---

## Config Validation Errors

**Symptom**: `Error: invalid config at skills.code-linting-fast.model`

**Solution**:
\`\`\`bash
# Validate config
tinyarms config validate

# Check specific section
tinyarms config get skills.code-linting-fast

# Fix and re-validate
nano ~/.config/tinyarms/config.yaml
tinyarms config validate
\`\`\`

---

## Permission Denied

**Symptom**: `Error: EACCES permission denied`

**Solution**:
\`\`\`bash
# Fix config directory permissions
chmod 755 ~/.config/tinyarms
chmod 644 ~/.config/tinyarms/config.yaml

# Fix CLI permissions
sudo chmod +x /usr/local/bin/tinyarms
\`\`\`

---

## Next Steps

1. **Check logs**: `tinyarms logs --tail 50`
2. **System status**: `tinyarms status --json`
3. **Report issue**: Include logs + config in bug report

---

**Note**: This is a reference implementation. Commands shown are for design illustration.
